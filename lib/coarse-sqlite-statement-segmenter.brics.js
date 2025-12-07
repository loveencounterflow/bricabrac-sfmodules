(function() {
  'use strict';
  var require_coarse_sqlite_statement_segmenter, require_sqlite_undumper;

  /* NOTE

  The keyword `BEGIN` (`/\bbegin\b/i`) can appear in a `CREATE TRIGGER` statement where it
  unfortunately may be preceded by an expression and followed by one or more statements each of which
  must be terminated by a semicolon; the end of the surrounding `CREATE TRIGGER` statement is then
  signalled by an `END` keyword followed by a semicolon. This seems to be the only place where SQLite
  allows a 'free' semicolon that does not end a top-level statement.

  The only other place where BEGIN may appear is in a `BEGIN TRANSACTION` statement which has a much
  simpler structure:

  ```
        BEGIN ——+——————————————+—— TRANSACTION
                |— EXCLUSIVE  —|
                |— DEFERRED   —|
                |— IMMEDIATE  —|
  ```

  But it gets worse because SQLite accepts `begin` e.g. as table name; when dumping a DB, it will
  quote that name *sometimes* but not always:

  ```
  CREATE TABLE begin ( g bool );
  INSERT INTO "begin" VALUES(1);
  ```

  From the looks of it, this *should* work if we set a flag when seeing a `BEGIN`; we then expect
  whitespace, possibly a newline, comments and more whitespace, then possibly one or more of
  `EXCLUSIVE`, `DEFERRED`, `IMMEDIATE`, `TRANSACTION`—in which case `BEGIN` must have been at
  top-level and the following bare semicolon does indeed signal end-of-statement.

    Maybe important: Check for function calls b/c UDFs are another place where arbitrary new names may
    get introduced.

    Maybe important: in the case of a `CREATE TRIGGER` statement, the `BEGIN` ... `END` part is
    mandatory, *and* the concluding top-level semicolon *must* be preceded by `END`, only separated by
    optional comments and whitespace. Other than that, it *is* possible to have an `end` as an
    identifier to appear in front of a semicolon, as `delete from end where end = 'x' returning end;`
    is a valid statement. However, the `RETURNING` clause is not valid in the concluding part of a
    `CREATE TRIGGER` statement.

    As such, it *should* be possible to flag the beginning of a `CREATE TRIGGER` statement and then
    specifically wait for the `END`, `;` sequence.

  Error-Resilient Strategies (ERS):
    * on the lexer level:
      * loop
        * break if end of source has been reached
        * loop
          * lex until a `top.semicolon` is encountered;
          * try to execute the SQL to this point;
          * if execution terminates without error, break
          * throw error unless error is an `incomplete input` error
          * continue to loop, possibly with a guard to only do this 1 or 2 times
    * on the lexer's consumer level:
      * loop
        * break if end of source has been reached
        * let current statement parts be an empty list
        * loop
          * append next candidate statement to current statement parts
          * try to execute the concatenated current statement parts
          * if execution terminates without error, break
          * throw error unless error is an `incomplete input` error
          * continue to loop, possibly with a guard to only do this 1 or 2 times

   */
  //###########################################################################################################

  //===========================================================================================================
  /* NOTE Future Single-File Module */
  require_coarse_sqlite_statement_segmenter = function() {
    var Grammar, SFMODULES, Segmenter, bind, debug, exports, internals, rpr_string, type_of, warn;
    //=========================================================================================================
    ({Grammar} = require('interlex'));
    SFMODULES = require('./main');
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({rpr_string} = SFMODULES.require_rpr_string());
    ({debug, warn} = console);
    // { hide,
    //   set_getter,                 } = SFMODULES.require_managed_property_tools()
    // # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
    // { lets,
    //   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
    // SQLITE                          = require 'node:sqlite'
    // misfit                          = Symbol 'misfit'
    // { get_prototype_chain,
    //   get_all_in_prototype_chain, } = SFMODULES.unstable.require_get_prototype_chain()
    //.........................................................................................................
    /* TAINT move to bric */
    bind = function(ctx, fn) {
      return fn.bind(ctx);
    };
    internals = {bind};
    //=========================================================================================================
    Segmenter = class Segmenter {
      //-------------------------------------------------------------------------------------------------------
      constructor({mode = 'fast'} = {}) {
        this.mode = mode;
        this._create_lexer();
        this.statement = '';
        void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      _create_lexer() {
        switch (this.mode) {
          case 'fast':
            return this._create_fast_lexer();
          case 'slow':
            return this._create_slow_lexer();
        }
        throw new Error(`Ωcsql___1 expected mode to be one of 'fast', 'slow', got ${rpr_string(mode)}`);
      }

      //-------------------------------------------------------------------------------------------------------
      _create_fast_lexer() {
        var segment;
        segment = '';
        this.g = {
          scan: function*(line) {
            var hit;
            if (!line.endsWith('\n')) {
              line += '\n';
            }
            segment += line;
            if (line.endsWith(';\n')) {
              hit = segment.replace(/^\n*(.*?)\n*$/s, '$1');
              yield ({
                // hit = segment.trim()
                hit,
                fqname: 'top.semicolon',
                level: {
                  name: 'top'
                }
              });
              segment = '';
            }
            return null;
          }
        };
        return null;
      }

      //-------------------------------------------------------------------------------------------------------
      _create_slow_lexer() {
        var bcomment, brktname, dqname, lcomment, string, top;
        this.g = new Grammar();
        top = this.g.new_level({
          name: 'top'
        });
        string = this.g.new_level({
          name: 'string'
        });
        dqname = this.g.new_level({
          name: 'dqname'
        });
        brktname = this.g.new_level({
          name: 'brktname'
        });
        lcomment = this.g.new_level({
          name: 'lcomment'
        });
        bcomment = this.g.new_level({
          name: 'bcomment'
        });
        //.....................................................................................................
        top.new_token('double_dash', {
          fit: '--',
          jump: 'lcomment!'
        });
        top.new_token('slash_star', {
          fit: '/*',
          jump: 'bcomment!'
        });
        // top.new_token       'left_paren',     {  fit: '(', }
        // top.new_token       'right_paren',    {  fit: ')', }
        top.new_token('semicolon', {
          fit: ';'
        });
        top.new_token('single_quote', {
          fit: "'",
          jump: 'string!'
        });
        top.new_token('left_bracket', {
          fit: "[",
          jump: 'brktname!'
        });
        top.new_token('double_quote', {
          fit: '"',
          jump: 'dqname!'
        });
        top.new_token('ws', {
          fit: /\s+/
        });
        // ### NOTE all SQL keywords are `/\b[a-z]+/i`, so much more restricted; also, may get a complete list
        // of keywords and the few special characters (`.`, `*`, ...) out of *.pkchr files (see
        // https://www.sqlite.org/docsrc/file?ci=trunk&name=art%2Fsyntax%2Fcreate-trigger-stmt.pikchr&proof=802024230) ###
        // #...................................................................................................
        // top.new_token       'CREATE',         {  fit: /\bCREATE\b/i,        }
        // top.new_token       'TABLE',          {  fit: /\bTABLE\b/i,         }
        // top.new_token       'VIEW',           {  fit: /\bVIEW\b/i,          }
        // top.new_token       'TRIGGER',        {  fit: /\bTRIGGER\b/i,       }
        // top.new_token       'BEGIN',          {  fit: /\bBEGIN\b/i,         }
        // top.new_token       'CASE',           {  fit: /\bCASE\b/i,          }
        // top.new_token       'END',            {  fit: /\bEND\b/i,           }
        // top.new_token       'EXCLUSIVE',      {  fit: /\bEXCLUSIVE\b/i,     }
        // top.new_token       'DEFERRED',       {  fit: /\bDEFERRED\b/i,      }
        // top.new_token       'IMMEDIATE',      {  fit: /\bIMMEDIATE\b/i,     }
        // top.new_token       'TRANSACTION',    {  fit: /\bTRANSACTION\b/i,   }
        // #...................................................................................................
        // # top.new_token         'RETURNING',   {  fit: /\breturning\b/i, jump: 'WITH_ID!' }
        top.new_token('word', {
          fit: /[^\s"'\[;]+/
        });
        //.....................................................................................................
        string.new_token('text', {
          fit: /[^']+/
        });
        string.new_token('single_quote', {
          fit: "'",
          jump: '..'
        });
        //.....................................................................................................
        brktname.new_token('name', {
          fit: /[^\]]+/
        });
        brktname.new_token('right_bracket', {
          fit: ']',
          jump: '..'
        });
        //.....................................................................................................
        dqname.new_token('name', {
          fit: /[^"]+/
        });
        dqname.new_token('double_quote', {
          fit: '"',
          jump: '..'
        });
        //.....................................................................................................
        lcomment.new_token('comment', {
          fit: /.*/,
          jump: '..'
        });
        // lcomment.new_token    'eol',            {  fit: /\n|/, jump: '..', }
        // #...................................................................................................
        // ### TAINT this is incorrect, identifiers can start with quote, bracket, contain ws, semicolon ###
        // kw_with_id.new_token    'identifier',   {  fit: /[^;]+/, jump: '..', }
        //.....................................................................................................
        bcomment.new_token('star_slash', {
          fit: '*/',
          jump: '..'
        });
        bcomment.new_token('comment', {
          fit: /\*(?!\/)|[^*]+/
        });
        return null;
      }

      //-------------------------------------------------------------------------------------------------------
      scan(line) {
        var type;
        if ((type = type_of(line)) !== 'text') {
          throw new Error(`Ωcsql___2 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          var token;
          if (!line.endsWith('\n')) {
            line += '\n';
          }
          for (token of this.g.scan(line)) {
            this.statement += token.hit;
            if (token.fqname === 'top.semicolon') {
              yield this.statement;
              this.statement = '';
            }
          }
          return null;
        })();
      }

      // #...............................................................................................
      // continue if token.is_signal
      // continue if token.fqname is 'top.ws'
      // continue if token.level.name is 'lcomment'
      // continue if token.level.name is 'bcomment'
      // tabulate_lexeme token

        //-------------------------------------------------------------------------------------------------------
      scan_tokens(line) {
        var type;
        if ((type = type_of(line)) !== 'text') {
          throw new Error(`Ωcsql___3 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          return (yield* this.g.scan(line));
        })();
      }

    };
    //=========================================================================================================
    internals = Object.freeze({...internals});
    return exports = {Segmenter, internals};
  };

  //===========================================================================================================
  /* NOTE Future Single-File Module */
  require_sqlite_undumper = function() {
    var Benchmarker, SFMODULES, Segmenter, Undumper, benchmarker, debug, exports, internals, rpr_string, timeit, type_of, walk_lines_with_positions, warn, wc;
    //=========================================================================================================
    // { Grammar,                    } = require 'interlex'
    SFMODULES = require('./main');
    ({Segmenter} = require_coarse_sqlite_statement_segmenter());
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({rpr_string} = SFMODULES.require_rpr_string());
    ({debug, warn} = console);
    ({walk_lines_with_positions} = SFMODULES.unstable.require_fast_linereader());
    ({wc} = SFMODULES.require_wc());
    ({Benchmarker} = SFMODULES.unstable.require_benchmarking());
    benchmarker = new Benchmarker();
    timeit = function(...P) {
      return benchmarker.timeit(...P);
    };
    //.........................................................................................................
    internals = {benchmarker, timeit};
    //=========================================================================================================
    Undumper = class Undumper {
      //-------------------------------------------------------------------------------------------------------
      constructor({db, mode = 'fast'} = {}) {
        var ref;
        this.db = db;
        this._execute = ((ref = this.db.exec) != null ? ref : this.db.execute).bind(this.db);
        this.statement_count = 0;
        this.statement = '';
        this.segmenter = new Segmenter({mode});
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      * scan(line) {
        var cause, statement_candidate;
        this.statement_count = 0;
        for (statement_candidate of this.segmenter.scan(line)) {
          if ((this.statement !== '') && (!this.statement.endsWith('\n'))) {
            this.statement += '\n';
          }
          this.statement += statement_candidate;
          cause = null;
          try {
            this._execute(this.statement);
          } catch (error) {
            cause = error;
            if (cause.message === 'incomplete input') {
              continue;
            }
            throw new Error(`Ωcsql___4 when trying to execute SQL statement ${rpr_string(this.statement)},` + ` an error was thrown: ${rpr_string(cause.message)}`, {cause});
          }
          if (cause == null) {
            yield this.statement;
            this.statement = '';
            this.statement_count++;
          }
        }
        return null;
      }

      //-------------------------------------------------------------------------------------------------------
      static undump({db, path, mode = 'fast'} = {}) {
        var dt_ms, line_count, read_and_apply_dump, statement_count, statements_per_s, undumper;
        // db.teardown { test: '*', }
        line_count = (wc(path)).lines;
        undumper = new Undumper({db, mode});
        statement_count = 0;
        timeit({
          total: line_count,
          brand: 'undump'
        }, read_and_apply_dump = function({progress}) {
          var line, results, statement, x;
          results = [];
          for (x of walk_lines_with_positions(path)) {
            ({line} = x);
            progress({
              delta: 1
            });
            results.push((function() {
              var results1;
              results1 = [];
              for (statement of undumper.scan(line)) {
                results1.push(statement_count++);
              }
              return results1;
            })());
          }
          return results;
        });
        // debug 'Ωcsql___5', benchmarker
        dt_ms = benchmarker.brands.undump.read_and_apply_dump[0];
        statements_per_s = Math.round(statement_count / dt_ms * 1_000);
        return {line_count, statement_count, dt_ms, statements_per_s};
      }

    };
    //=========================================================================================================
    internals = Object.freeze({...internals});
    return exports = {Undumper, internals};
  };

  //===========================================================================================================
  module.exports = {require_coarse_sqlite_statement_segmenter, require_sqlite_undumper};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEseUNBQUEsRUFBQSx1QkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBeUVBLHlDQUFBLEdBQTRDLFFBQUEsQ0FBQSxDQUFBO0FBRTVDLFFBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQTs7SUFDRSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxVQUFSLENBQWxDO0lBQ0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjtJQUNsQyxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBbEM7SUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQyxFQUxGOzs7Ozs7Ozs7Ozs7SUFrQkUsSUFBQSxHQUFrQyxRQUFBLENBQUUsR0FBRixFQUFPLEVBQVAsQ0FBQTthQUFlLEVBQUUsQ0FBQyxJQUFILENBQVEsR0FBUjtJQUFmO0lBQ2xDLFNBQUEsR0FBWSxDQUFFLElBQUYsRUFuQmQ7O0lBc0JRLFlBQU4sTUFBQSxVQUFBLENBQUE7O01BR0UsV0FBYSxDQUFDLENBQUUsSUFBQSxHQUFPLE1BQVQsSUFBbUIsQ0FBQSxDQUFwQixDQUFBO1FBQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxhQUFELENBQUE7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MUI7OztFQStSQSxNQUFNLENBQUMsT0FBUCxHQUFpQixDQUFFLHlDQUFGLEVBQTZDLHVCQUE3QztBQS9SakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIE5PVEVcblxuVGhlIGtleXdvcmQgYEJFR0lOYCAoYC9cXGJiZWdpblxcYi9pYCkgY2FuIGFwcGVhciBpbiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IHdoZXJlIGl0XG51bmZvcnR1bmF0ZWx5IG1heSBiZSBwcmVjZWRlZCBieSBhbiBleHByZXNzaW9uIGFuZCBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBzdGF0ZW1lbnRzIGVhY2ggb2Ygd2hpY2hcbm11c3QgYmUgdGVybWluYXRlZCBieSBhIHNlbWljb2xvbjsgdGhlIGVuZCBvZiB0aGUgc3Vycm91bmRpbmcgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQgaXMgdGhlblxuc2lnbmFsbGVkIGJ5IGFuIGBFTkRgIGtleXdvcmQgZm9sbG93ZWQgYnkgYSBzZW1pY29sb24uIFRoaXMgc2VlbXMgdG8gYmUgdGhlIG9ubHkgcGxhY2Ugd2hlcmUgU1FMaXRlXG5hbGxvd3MgYSAnZnJlZScgc2VtaWNvbG9uIHRoYXQgZG9lcyBub3QgZW5kIGEgdG9wLWxldmVsIHN0YXRlbWVudC5cblxuVGhlIG9ubHkgb3RoZXIgcGxhY2Ugd2hlcmUgQkVHSU4gbWF5IGFwcGVhciBpcyBpbiBhIGBCRUdJTiBUUkFOU0FDVElPTmAgc3RhdGVtZW50IHdoaWNoIGhhcyBhIG11Y2hcbnNpbXBsZXIgc3RydWN0dXJlOlxuXG5gYGBcbiAgICAgIEJFR0lOIOKAlOKAlCvigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQr4oCU4oCUIFRSQU5TQUNUSU9OXG4gICAgICAgICAgICAgIHzigJQgRVhDTFVTSVZFICDigJR8XG4gICAgICAgICAgICAgIHzigJQgREVGRVJSRUQgICDigJR8XG4gICAgICAgICAgICAgIHzigJQgSU1NRURJQVRFICDigJR8XG5gYGBcblxuQnV0IGl0IGdldHMgd29yc2UgYmVjYXVzZSBTUUxpdGUgYWNjZXB0cyBgYmVnaW5gIGUuZy4gYXMgdGFibGUgbmFtZTsgd2hlbiBkdW1waW5nIGEgREIsIGl0IHdpbGxcbnF1b3RlIHRoYXQgbmFtZSAqc29tZXRpbWVzKiBidXQgbm90IGFsd2F5czpcblxuYGBgXG5DUkVBVEUgVEFCTEUgYmVnaW4gKCBnIGJvb2wgKTtcbklOU0VSVCBJTlRPIFwiYmVnaW5cIiBWQUxVRVMoMSk7XG5gYGBcblxuRnJvbSB0aGUgbG9va3Mgb2YgaXQsIHRoaXMgKnNob3VsZCogd29yayBpZiB3ZSBzZXQgYSBmbGFnIHdoZW4gc2VlaW5nIGEgYEJFR0lOYDsgd2UgdGhlbiBleHBlY3RcbndoaXRlc3BhY2UsIHBvc3NpYmx5IGEgbmV3bGluZSwgY29tbWVudHMgYW5kIG1vcmUgd2hpdGVzcGFjZSwgdGhlbiBwb3NzaWJseSBvbmUgb3IgbW9yZSBvZlxuYEVYQ0xVU0lWRWAsIGBERUZFUlJFRGAsIGBJTU1FRElBVEVgLCBgVFJBTlNBQ1RJT05g4oCUaW4gd2hpY2ggY2FzZSBgQkVHSU5gIG11c3QgaGF2ZSBiZWVuIGF0XG50b3AtbGV2ZWwgYW5kIHRoZSBmb2xsb3dpbmcgYmFyZSBzZW1pY29sb24gZG9lcyBpbmRlZWQgc2lnbmFsIGVuZC1vZi1zdGF0ZW1lbnQuXG5cbiAgTWF5YmUgaW1wb3J0YW50OiBDaGVjayBmb3IgZnVuY3Rpb24gY2FsbHMgYi9jIFVERnMgYXJlIGFub3RoZXIgcGxhY2Ugd2hlcmUgYXJiaXRyYXJ5IG5ldyBuYW1lcyBtYXlcbiAgZ2V0IGludHJvZHVjZWQuXG5cbiAgTWF5YmUgaW1wb3J0YW50OiBpbiB0aGUgY2FzZSBvZiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50LCB0aGUgYEJFR0lOYCAuLi4gYEVORGAgcGFydCBpc1xuICBtYW5kYXRvcnksICphbmQqIHRoZSBjb25jbHVkaW5nIHRvcC1sZXZlbCBzZW1pY29sb24gKm11c3QqIGJlIHByZWNlZGVkIGJ5IGBFTkRgLCBvbmx5IHNlcGFyYXRlZCBieVxuICBvcHRpb25hbCBjb21tZW50cyBhbmQgd2hpdGVzcGFjZS4gT3RoZXIgdGhhbiB0aGF0LCBpdCAqaXMqIHBvc3NpYmxlIHRvIGhhdmUgYW4gYGVuZGAgYXMgYW5cbiAgaWRlbnRpZmllciB0byBhcHBlYXIgaW4gZnJvbnQgb2YgYSBzZW1pY29sb24sIGFzIGBkZWxldGUgZnJvbSBlbmQgd2hlcmUgZW5kID0gJ3gnIHJldHVybmluZyBlbmQ7YFxuICBpcyBhIHZhbGlkIHN0YXRlbWVudC4gSG93ZXZlciwgdGhlIGBSRVRVUk5JTkdgIGNsYXVzZSBpcyBub3QgdmFsaWQgaW4gdGhlIGNvbmNsdWRpbmcgcGFydCBvZiBhXG4gIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50LlxuXG4gIEFzIHN1Y2gsIGl0ICpzaG91bGQqIGJlIHBvc3NpYmxlIHRvIGZsYWcgdGhlIGJlZ2lubmluZyBvZiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IGFuZCB0aGVuXG4gIHNwZWNpZmljYWxseSB3YWl0IGZvciB0aGUgYEVORGAsIGA7YCBzZXF1ZW5jZS5cblxuRXJyb3ItUmVzaWxpZW50IFN0cmF0ZWdpZXMgKEVSUyk6XG4gICogb24gdGhlIGxleGVyIGxldmVsOlxuICAgICogbG9vcFxuICAgICAgKiBicmVhayBpZiBlbmQgb2Ygc291cmNlIGhhcyBiZWVuIHJlYWNoZWRcbiAgICAgICogbG9vcFxuICAgICAgICAqIGxleCB1bnRpbCBhIGB0b3Auc2VtaWNvbG9uYCBpcyBlbmNvdW50ZXJlZDtcbiAgICAgICAgKiB0cnkgdG8gZXhlY3V0ZSB0aGUgU1FMIHRvIHRoaXMgcG9pbnQ7XG4gICAgICAgICogaWYgZXhlY3V0aW9uIHRlcm1pbmF0ZXMgd2l0aG91dCBlcnJvciwgYnJlYWtcbiAgICAgICAgKiB0aHJvdyBlcnJvciB1bmxlc3MgZXJyb3IgaXMgYW4gYGluY29tcGxldGUgaW5wdXRgIGVycm9yXG4gICAgICAgICogY29udGludWUgdG8gbG9vcCwgcG9zc2libHkgd2l0aCBhIGd1YXJkIHRvIG9ubHkgZG8gdGhpcyAxIG9yIDIgdGltZXNcbiAgKiBvbiB0aGUgbGV4ZXIncyBjb25zdW1lciBsZXZlbDpcbiAgICAqIGxvb3BcbiAgICAgICogYnJlYWsgaWYgZW5kIG9mIHNvdXJjZSBoYXMgYmVlbiByZWFjaGVkXG4gICAgICAqIGxldCBjdXJyZW50IHN0YXRlbWVudCBwYXJ0cyBiZSBhbiBlbXB0eSBsaXN0XG4gICAgICAqIGxvb3BcbiAgICAgICAgKiBhcHBlbmQgbmV4dCBjYW5kaWRhdGUgc3RhdGVtZW50IHRvIGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzXG4gICAgICAgICogdHJ5IHRvIGV4ZWN1dGUgdGhlIGNvbmNhdGVuYXRlZCBjdXJyZW50IHN0YXRlbWVudCBwYXJ0c1xuICAgICAgICAqIGlmIGV4ZWN1dGlvbiB0ZXJtaW5hdGVzIHdpdGhvdXQgZXJyb3IsIGJyZWFrXG4gICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAqIGNvbnRpbnVlIHRvIGxvb3AsIHBvc3NpYmx5IHdpdGggYSBndWFyZCB0byBvbmx5IGRvIHRoaXMgMSBvciAyIHRpbWVzXG5cbiMjI1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgR3JhbW1hciwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICMgeyBoaWRlLFxuICAjICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgIyAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IGxldHMsXG4gICMgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gICMgU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuICAjIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgIyB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICMgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICMjIyBUQUlOVCBtb3ZlIHRvIGJyaWMgIyMjXG4gIGJpbmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAoIGN0eCwgZm4gKSAtPiBmbi5iaW5kIGN0eFxuICBpbnRlcm5hbHMgPSB7IGJpbmQsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlZ21lbnRlclxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKHsgbW9kZSA9ICdmYXN0JywgfT17fSkgLT5cbiAgICAgIEBtb2RlID0gbW9kZVxuICAgICAgQF9jcmVhdGVfbGV4ZXIoKVxuICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfbGV4ZXI6IC0+XG4gICAgICBzd2l0Y2ggQG1vZGVcbiAgICAgICAgd2hlbiAnZmFzdCcgdGhlbiByZXR1cm4gQF9jcmVhdGVfZmFzdF9sZXhlcigpXG4gICAgICAgIHdoZW4gJ3Nsb3cnIHRoZW4gcmV0dXJuIEBfY3JlYXRlX3Nsb3dfbGV4ZXIoKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqljc3FsX19fMSBleHBlY3RlZCBtb2RlIHRvIGJlIG9uZSBvZiAnZmFzdCcsICdzbG93JywgZ290ICN7cnByX3N0cmluZyBtb2RlfVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfZmFzdF9sZXhlcjogLT5cbiAgICAgIHNlZ21lbnQgPSAnJ1xuICAgICAgQGcgPVxuICAgICAgICBzY2FuOiAoIGxpbmUgKSAtPlxuICAgICAgICAgIGxpbmUgICAgICs9ICdcXG4nIHVubGVzcyBsaW5lLmVuZHNXaXRoICdcXG4nXG4gICAgICAgICAgc2VnbWVudCAgKz0gbGluZVxuICAgICAgICAgIGlmIGxpbmUuZW5kc1dpdGggJztcXG4nXG4gICAgICAgICAgICBoaXQgPSBzZWdtZW50LnJlcGxhY2UgL15cXG4qKC4qPylcXG4qJC9zLCAnJDEnXG4gICAgICAgICAgICAjIGhpdCA9IHNlZ21lbnQudHJpbSgpXG4gICAgICAgICAgICB5aWVsZCB7IGhpdCwgZnFuYW1lOiAndG9wLnNlbWljb2xvbicsIGxldmVsOiB7IG5hbWU6ICd0b3AnLCB9LCB9XG4gICAgICAgICAgICBzZWdtZW50ID0gJydcbiAgICAgICAgICA7bnVsbFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9zbG93X2xleGVyOiAtPlxuICAgICAgQGcgICAgICAgICAgPSBuZXcgR3JhbW1hcigpXG4gICAgICB0b3AgICAgICAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICd0b3AnLCB9XG4gICAgICBzdHJpbmcgICAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdzdHJpbmcnLCB9XG4gICAgICBkcW5hbWUgICAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdkcW5hbWUnLCB9XG4gICAgICBicmt0bmFtZSAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdicmt0bmFtZScsIH1cbiAgICAgIGxjb21tZW50ICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2xjb21tZW50JywgfVxuICAgICAgYmNvbW1lbnQgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYmNvbW1lbnQnLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ2RvdWJsZV9kYXNoJywgICAgeyAgZml0OiAnLS0nLCBqdW1wOiAnbGNvbW1lbnQhJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2xhc2hfc3RhcicsICAgICB7ICBmaXQ6ICcvKicsIGp1bXA6ICdiY29tbWVudCEnLCB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ2xlZnRfcGFyZW4nLCAgICAgeyAgZml0OiAnKCcsIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAncmlnaHRfcGFyZW4nLCAgICB7ICBmaXQ6ICcpJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2VtaWNvbG9uJywgICAgICB7ICBmaXQ6ICc7JywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2luZ2xlX3F1b3RlJywgICB7ICBmaXQ6IFwiJ1wiLCBqdW1wOiAnc3RyaW5nIScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ2xlZnRfYnJhY2tldCcsICAgeyAgZml0OiBcIltcIiwganVtcDogJ2Jya3RuYW1lIScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ2RvdWJsZV9xdW90ZScsICAgeyAgZml0OiAnXCInLCBqdW1wOiAnZHFuYW1lIScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3dzJywgICAgICAgICAgICAgeyAgZml0OiAvXFxzKy8sIH1cbiAgICAgICMgIyMjIE5PVEUgYWxsIFNRTCBrZXl3b3JkcyBhcmUgYC9cXGJbYS16XSsvaWAsIHNvIG11Y2ggbW9yZSByZXN0cmljdGVkOyBhbHNvLCBtYXkgZ2V0IGEgY29tcGxldGUgbGlzdFxuICAgICAgIyBvZiBrZXl3b3JkcyBhbmQgdGhlIGZldyBzcGVjaWFsIGNoYXJhY3RlcnMgKGAuYCwgYCpgLCAuLi4pIG91dCBvZiAqLnBrY2hyIGZpbGVzIChzZWVcbiAgICAgICMgaHR0cHM6Ly93d3cuc3FsaXRlLm9yZy9kb2NzcmMvZmlsZT9jaT10cnVuayZuYW1lPWFydCUyRnN5bnRheCUyRmNyZWF0ZS10cmlnZ2VyLXN0bXQucGlrY2hyJnByb29mPTgwMjAyNDIzMCkgIyMjXG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnQ1JFQVRFJywgICAgICAgICB7ICBmaXQ6IC9cXGJDUkVBVEVcXGIvaSwgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVEFCTEUnLCAgICAgICAgICB7ICBmaXQ6IC9cXGJUQUJMRVxcYi9pLCAgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVklFVycsICAgICAgICAgICB7ICBmaXQ6IC9cXGJWSUVXXFxiL2ksICAgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVFJJR0dFUicsICAgICAgICB7ICBmaXQ6IC9cXGJUUklHR0VSXFxiL2ksICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnQkVHSU4nLCAgICAgICAgICB7ICBmaXQ6IC9cXGJCRUdJTlxcYi9pLCAgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnQ0FTRScsICAgICAgICAgICB7ICBmaXQ6IC9cXGJDQVNFXFxiL2ksICAgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnRU5EJywgICAgICAgICAgICB7ICBmaXQ6IC9cXGJFTkRcXGIvaSwgICAgICAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnRVhDTFVTSVZFJywgICAgICB7ICBmaXQ6IC9cXGJFWENMVVNJVkVcXGIvaSwgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnREVGRVJSRUQnLCAgICAgICB7ICBmaXQ6IC9cXGJERUZFUlJFRFxcYi9pLCAgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnSU1NRURJQVRFJywgICAgICB7ICBmaXQ6IC9cXGJJTU1FRElBVEVcXGIvaSwgICAgIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVFJBTlNBQ1RJT04nLCAgICB7ICBmaXQ6IC9cXGJUUkFOU0FDVElPTlxcYi9pLCAgIH1cbiAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyAjIHRvcC5uZXdfdG9rZW4gICAgICAgICAnUkVUVVJOSU5HJywgICB7ICBmaXQ6IC9cXGJyZXR1cm5pbmdcXGIvaSwganVtcDogJ1dJVEhfSUQhJyB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICAgJ3dvcmQnLCAgICAgICAgICAgeyAgZml0OiAvW15cXHNcIidcXFs7XSsvLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN0cmluZy5uZXdfdG9rZW4gICAgICAndGV4dCcsICAgICAgICAgICB7ICBmaXQ6IC9bXiddKy8sIH1cbiAgICAgIHN0cmluZy5uZXdfdG9rZW4gICAgICAnc2luZ2xlX3F1b3RlJywgICB7ICBmaXQ6IFwiJ1wiLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGJya3RuYW1lLm5ld190b2tlbiAgICAnbmFtZScsICAgICAgICAgICB7ICBmaXQ6IC9bXlxcXV0rLywgfVxuICAgICAgYnJrdG5hbWUubmV3X3Rva2VuICAgICdyaWdodF9icmFja2V0JywgIHsgIGZpdDogJ10nLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGRxbmFtZS5uZXdfdG9rZW4gICAgICAnbmFtZScsICAgICAgICAgICB7ICBmaXQ6IC9bXlwiXSsvLCB9XG4gICAgICBkcW5hbWUubmV3X3Rva2VuICAgICAgJ2RvdWJsZV9xdW90ZScsICAgeyAgZml0OiAnXCInLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGxjb21tZW50Lm5ld190b2tlbiAgICAnY29tbWVudCcsICAgICAgICB7ICBmaXQ6IC8uKi8sIGp1bXA6ICcuLicgfVxuICAgICAgIyBsY29tbWVudC5uZXdfdG9rZW4gICAgJ2VvbCcsICAgICAgICAgICAgeyAgZml0OiAvXFxufC8sIGp1bXA6ICcuLicsIH1cbiAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyAjIyMgVEFJTlQgdGhpcyBpcyBpbmNvcnJlY3QsIGlkZW50aWZpZXJzIGNhbiBzdGFydCB3aXRoIHF1b3RlLCBicmFja2V0LCBjb250YWluIHdzLCBzZW1pY29sb24gIyMjXG4gICAgICAjIGt3X3dpdGhfaWQubmV3X3Rva2VuICAgICdpZGVudGlmaWVyJywgICB7ICBmaXQ6IC9bXjtdKy8sIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgYmNvbW1lbnQubmV3X3Rva2VuICAgICdzdGFyX3NsYXNoJywgICAgIHsgIGZpdDogJyovJywganVtcDogJy4uJywgfVxuICAgICAgYmNvbW1lbnQubmV3X3Rva2VuICAgICdjb21tZW50JywgICAgICAgIHsgIGZpdDogL1xcKig/IVxcLyl8W14qXSsvLCB9XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzY2FuOiAoIGxpbmUgKSAtPlxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqljc3FsX19fMiBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIiB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBsaW5lICkgaXMgJ3RleHQnXG4gICAgICByZXR1cm4gZG8gYmluZCBALCAtPlxuICAgICAgICBsaW5lICs9ICdcXG4nIHVubGVzcyBsaW5lLmVuZHNXaXRoICdcXG4nXG4gICAgICAgIGZvciB0b2tlbiBmcm9tIEBnLnNjYW4gbGluZVxuICAgICAgICAgIEBzdGF0ZW1lbnQgKz0gdG9rZW4uaGl0XG4gICAgICAgICAgaWYgdG9rZW4uZnFuYW1lIGlzICd0b3Auc2VtaWNvbG9uJ1xuICAgICAgICAgICAgeWllbGQgQHN0YXRlbWVudFxuICAgICAgICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICAgIDtudWxsXG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4uaXNfc2lnbmFsXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4uZnFuYW1lIGlzICd0b3Aud3MnXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4ubGV2ZWwubmFtZSBpcyAnbGNvbW1lbnQnXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4ubGV2ZWwubmFtZSBpcyAnYmNvbW1lbnQnXG4gICAgICAgICMgdGFidWxhdGVfbGV4ZW1lIHRva2VuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNjYW5fdG9rZW5zOiAoIGxpbmUgKSAtPlxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqljc3FsX19fMyBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIiB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBsaW5lICkgaXMgJ3RleHQnXG4gICAgICByZXR1cm4gZG8gYmluZCBALCAtPiB5aWVsZCBmcm9tIEBnLnNjYW4gbGluZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgU2VnbWVudGVyLCBpbnRlcm5hbHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX3NxbGl0ZV91bmR1bXBlciA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIHsgR3JhbW1hciwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyBTZWdtZW50ZXIsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyKClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIHsgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucywgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9mYXN0X2xpbmVyZWFkZXIoKVxuICB7IHdjLCAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfd2MoKVxuICB7IEJlbmNobWFya2VyLCAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYmVuY2htYXJraW5nKClcbiAgYmVuY2htYXJrZXIgICAgICAgICAgICAgICAgICAgICA9IG5ldyBCZW5jaG1hcmtlcigpXG4gIHRpbWVpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSAoIFAuLi4gKSAtPiBiZW5jaG1hcmtlci50aW1laXQgUC4uLlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGludGVybmFscyAgICAgICAgICAgICAgICAgICAgICAgPSB7IGJlbmNobWFya2VyLCB0aW1laXQsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgVW5kdW1wZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IGRiLCBtb2RlID0gJ2Zhc3QnLCB9PXt9KSAtPlxuICAgICAgQGRiICAgICAgICAgICAgICAgPSBkYlxuICAgICAgQF9leGVjdXRlICAgICAgICAgPSAoIEBkYi5leGVjID8gQGRiLmV4ZWN1dGUgKS5iaW5kIEBkYlxuICAgICAgQHN0YXRlbWVudF9jb3VudCAgPSAwXG4gICAgICBAc3RhdGVtZW50ICAgICAgICA9ICcnXG4gICAgICBAc2VnbWVudGVyICAgICAgICA9IG5ldyBTZWdtZW50ZXIgeyBtb2RlLCB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICBAc3RhdGVtZW50X2NvdW50ICA9IDBcbiAgICAgIGZvciBzdGF0ZW1lbnRfY2FuZGlkYXRlIGZyb20gQHNlZ21lbnRlci5zY2FuIGxpbmVcbiAgICAgICAgQHN0YXRlbWVudCArPSAnXFxuJyBpZiAoIEBzdGF0ZW1lbnQgaXNudCAnJyApIGFuZCAoIG5vdCBAc3RhdGVtZW50LmVuZHNXaXRoICdcXG4nIClcbiAgICAgICAgQHN0YXRlbWVudCArPSBzdGF0ZW1lbnRfY2FuZGlkYXRlXG4gICAgICAgIGNhdXNlICAgICAgID0gbnVsbFxuICAgICAgICB0cnlcbiAgICAgICAgICBAX2V4ZWN1dGUgQHN0YXRlbWVudFxuICAgICAgICBjYXRjaCBjYXVzZVxuICAgICAgICAgIGNvbnRpbnVlIGlmIGNhdXNlLm1lc3NhZ2UgaXMgJ2luY29tcGxldGUgaW5wdXQnXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqljc3FsX19fNCB3aGVuIHRyeWluZyB0byBleGVjdXRlIFNRTCBzdGF0ZW1lbnQgI3tycHJfc3RyaW5nIEBzdGF0ZW1lbnR9LFwiIFxcXG4gICAgICAgICAgICArIFwiIGFuIGVycm9yIHdhcyB0aHJvd246ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHVubGVzcyBjYXVzZT9cbiAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICAgICAgQHN0YXRlbWVudF9jb3VudCsrXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAdW5kdW1wOiAoeyBkYiwgcGF0aCwgbW9kZSA9ICdmYXN0JywgfT17fSkgLT5cbiAgICAgICMgZGIudGVhcmRvd24geyB0ZXN0OiAnKicsIH1cbiAgICAgIGxpbmVfY291bnQgICAgICA9ICggd2MgcGF0aCApLmxpbmVzXG4gICAgICB1bmR1bXBlciAgICAgICAgPSBuZXcgVW5kdW1wZXIgeyBkYiwgbW9kZSwgfVxuICAgICAgc3RhdGVtZW50X2NvdW50ID0gMFxuICAgICAgdGltZWl0IHsgdG90YWw6IGxpbmVfY291bnQsIGJyYW5kOiAndW5kdW1wJywgfSwgcmVhZF9hbmRfYXBwbHlfZHVtcCA9ICh7IHByb2dyZXNzLCB9KSAtPlxuICAgICAgICBmb3IgeyBsaW5lLCB9IGZyb20gd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyBwYXRoXG4gICAgICAgICAgcHJvZ3Jlc3MgeyBkZWx0YTogMSwgfVxuICAgICAgICAgIGZvciBzdGF0ZW1lbnQgZnJvbSB1bmR1bXBlci5zY2FuIGxpbmVcbiAgICAgICAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICAjIGRlYnVnICfOqWNzcWxfX181JywgYmVuY2htYXJrZXJcbiAgICAgIGR0X21zICAgICAgICAgICAgID0gYmVuY2htYXJrZXIuYnJhbmRzLnVuZHVtcC5yZWFkX2FuZF9hcHBseV9kdW1wWyAwIF1cbiAgICAgIHN0YXRlbWVudHNfcGVyX3MgID0gTWF0aC5yb3VuZCBzdGF0ZW1lbnRfY291bnQgLyBkdF9tcyAqIDFfMDAwXG4gICAgICByZXR1cm4geyBsaW5lX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGR0X21zLCBzdGF0ZW1lbnRzX3Blcl9zLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBVbmR1bXBlciwgaW50ZXJuYWxzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIsIHJlcXVpcmVfc3FsaXRlX3VuZHVtcGVyLCB9XG5cblxuIl19
