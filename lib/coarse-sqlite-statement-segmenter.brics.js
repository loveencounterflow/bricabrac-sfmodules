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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEseUNBQUEsRUFBQSx1QkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBeUVBLHlDQUFBLEdBQTRDLFFBQUEsQ0FBQSxDQUFBO0FBRTVDLFFBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQTs7SUFDRSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxVQUFSLENBQWxDO0lBQ0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjtJQUNsQyxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBbEM7SUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQyxFQUxGOzs7Ozs7Ozs7O0lBZ0JFLElBQUEsR0FBa0MsUUFBQSxDQUFFLEdBQUYsRUFBTyxFQUFQLENBQUE7YUFBZSxFQUFFLENBQUMsSUFBSCxDQUFRLEdBQVI7SUFBZjtJQUNsQyxTQUFBLEdBQVksQ0FBRSxJQUFGLEVBakJkOztJQW9CUSxZQUFOLE1BQUEsVUFBQSxDQUFBOztNQUdFLFdBQWEsQ0FBQyxDQUFFLElBQUEsR0FBTyxNQUFULElBQW1CLENBQUEsQ0FBcEIsQ0FBQTtRQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsYUFBRCxDQUFBO1FB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Ozs7RUE2UkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSx5Q0FBRixFQUE2Qyx1QkFBN0M7QUE3UmpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyBOT1RFXG5cblRoZSBrZXl3b3JkIGBCRUdJTmAgKGAvXFxiYmVnaW5cXGIvaWApIGNhbiBhcHBlYXIgaW4gYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCB3aGVyZSBpdFxudW5mb3J0dW5hdGVseSBtYXkgYmUgcHJlY2VkZWQgYnkgYW4gZXhwcmVzc2lvbiBhbmQgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgc3RhdGVtZW50cyBlYWNoIG9mIHdoaWNoXG5tdXN0IGJlIHRlcm1pbmF0ZWQgYnkgYSBzZW1pY29sb247IHRoZSBlbmQgb2YgdGhlIHN1cnJvdW5kaW5nIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IGlzIHRoZW5cbnNpZ25hbGxlZCBieSBhbiBgRU5EYCBrZXl3b3JkIGZvbGxvd2VkIGJ5IGEgc2VtaWNvbG9uLiBUaGlzIHNlZW1zIHRvIGJlIHRoZSBvbmx5IHBsYWNlIHdoZXJlIFNRTGl0ZVxuYWxsb3dzIGEgJ2ZyZWUnIHNlbWljb2xvbiB0aGF0IGRvZXMgbm90IGVuZCBhIHRvcC1sZXZlbCBzdGF0ZW1lbnQuXG5cblRoZSBvbmx5IG90aGVyIHBsYWNlIHdoZXJlIEJFR0lOIG1heSBhcHBlYXIgaXMgaW4gYSBgQkVHSU4gVFJBTlNBQ1RJT05gIHN0YXRlbWVudCB3aGljaCBoYXMgYSBtdWNoXG5zaW1wbGVyIHN0cnVjdHVyZTpcblxuYGBgXG4gICAgICBCRUdJTiDigJTigJQr4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUK+KAlOKAlCBUUkFOU0FDVElPTlxuICAgICAgICAgICAgICB84oCUIEVYQ0xVU0lWRSAg4oCUfFxuICAgICAgICAgICAgICB84oCUIERFRkVSUkVEICAg4oCUfFxuICAgICAgICAgICAgICB84oCUIElNTUVESUFURSAg4oCUfFxuYGBgXG5cbkJ1dCBpdCBnZXRzIHdvcnNlIGJlY2F1c2UgU1FMaXRlIGFjY2VwdHMgYGJlZ2luYCBlLmcuIGFzIHRhYmxlIG5hbWU7IHdoZW4gZHVtcGluZyBhIERCLCBpdCB3aWxsXG5xdW90ZSB0aGF0IG5hbWUgKnNvbWV0aW1lcyogYnV0IG5vdCBhbHdheXM6XG5cbmBgYFxuQ1JFQVRFIFRBQkxFIGJlZ2luICggZyBib29sICk7XG5JTlNFUlQgSU5UTyBcImJlZ2luXCIgVkFMVUVTKDEpO1xuYGBgXG5cbkZyb20gdGhlIGxvb2tzIG9mIGl0LCB0aGlzICpzaG91bGQqIHdvcmsgaWYgd2Ugc2V0IGEgZmxhZyB3aGVuIHNlZWluZyBhIGBCRUdJTmA7IHdlIHRoZW4gZXhwZWN0XG53aGl0ZXNwYWNlLCBwb3NzaWJseSBhIG5ld2xpbmUsIGNvbW1lbnRzIGFuZCBtb3JlIHdoaXRlc3BhY2UsIHRoZW4gcG9zc2libHkgb25lIG9yIG1vcmUgb2ZcbmBFWENMVVNJVkVgLCBgREVGRVJSRURgLCBgSU1NRURJQVRFYCwgYFRSQU5TQUNUSU9OYOKAlGluIHdoaWNoIGNhc2UgYEJFR0lOYCBtdXN0IGhhdmUgYmVlbiBhdFxudG9wLWxldmVsIGFuZCB0aGUgZm9sbG93aW5nIGJhcmUgc2VtaWNvbG9uIGRvZXMgaW5kZWVkIHNpZ25hbCBlbmQtb2Ytc3RhdGVtZW50LlxuXG4gIE1heWJlIGltcG9ydGFudDogQ2hlY2sgZm9yIGZ1bmN0aW9uIGNhbGxzIGIvYyBVREZzIGFyZSBhbm90aGVyIHBsYWNlIHdoZXJlIGFyYml0cmFyeSBuZXcgbmFtZXMgbWF5XG4gIGdldCBpbnRyb2R1Y2VkLlxuXG4gIE1heWJlIGltcG9ydGFudDogaW4gdGhlIGNhc2Ugb2YgYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCwgdGhlIGBCRUdJTmAgLi4uIGBFTkRgIHBhcnQgaXNcbiAgbWFuZGF0b3J5LCAqYW5kKiB0aGUgY29uY2x1ZGluZyB0b3AtbGV2ZWwgc2VtaWNvbG9uICptdXN0KiBiZSBwcmVjZWRlZCBieSBgRU5EYCwgb25seSBzZXBhcmF0ZWQgYnlcbiAgb3B0aW9uYWwgY29tbWVudHMgYW5kIHdoaXRlc3BhY2UuIE90aGVyIHRoYW4gdGhhdCwgaXQgKmlzKiBwb3NzaWJsZSB0byBoYXZlIGFuIGBlbmRgIGFzIGFuXG4gIGlkZW50aWZpZXIgdG8gYXBwZWFyIGluIGZyb250IG9mIGEgc2VtaWNvbG9uLCBhcyBgZGVsZXRlIGZyb20gZW5kIHdoZXJlIGVuZCA9ICd4JyByZXR1cm5pbmcgZW5kO2BcbiAgaXMgYSB2YWxpZCBzdGF0ZW1lbnQuIEhvd2V2ZXIsIHRoZSBgUkVUVVJOSU5HYCBjbGF1c2UgaXMgbm90IHZhbGlkIGluIHRoZSBjb25jbHVkaW5nIHBhcnQgb2YgYVxuICBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudC5cblxuICBBcyBzdWNoLCBpdCAqc2hvdWxkKiBiZSBwb3NzaWJsZSB0byBmbGFnIHRoZSBiZWdpbm5pbmcgb2YgYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCBhbmQgdGhlblxuICBzcGVjaWZpY2FsbHkgd2FpdCBmb3IgdGhlIGBFTkRgLCBgO2Agc2VxdWVuY2UuXG5cbkVycm9yLVJlc2lsaWVudCBTdHJhdGVnaWVzIChFUlMpOlxuICAqIG9uIHRoZSBsZXhlciBsZXZlbDpcbiAgICAqIGxvb3BcbiAgICAgICogYnJlYWsgaWYgZW5kIG9mIHNvdXJjZSBoYXMgYmVlbiByZWFjaGVkXG4gICAgICAqIGxvb3BcbiAgICAgICAgKiBsZXggdW50aWwgYSBgdG9wLnNlbWljb2xvbmAgaXMgZW5jb3VudGVyZWQ7XG4gICAgICAgICogdHJ5IHRvIGV4ZWN1dGUgdGhlIFNRTCB0byB0aGlzIHBvaW50O1xuICAgICAgICAqIGlmIGV4ZWN1dGlvbiB0ZXJtaW5hdGVzIHdpdGhvdXQgZXJyb3IsIGJyZWFrXG4gICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAqIGNvbnRpbnVlIHRvIGxvb3AsIHBvc3NpYmx5IHdpdGggYSBndWFyZCB0byBvbmx5IGRvIHRoaXMgMSBvciAyIHRpbWVzXG4gICogb24gdGhlIGxleGVyJ3MgY29uc3VtZXIgbGV2ZWw6XG4gICAgKiBsb29wXG4gICAgICAqIGJyZWFrIGlmIGVuZCBvZiBzb3VyY2UgaGFzIGJlZW4gcmVhY2hlZFxuICAgICAgKiBsZXQgY3VycmVudCBzdGF0ZW1lbnQgcGFydHMgYmUgYW4gZW1wdHkgbGlzdFxuICAgICAgKiBsb29wXG4gICAgICAgICogYXBwZW5kIG5leHQgY2FuZGlkYXRlIHN0YXRlbWVudCB0byBjdXJyZW50IHN0YXRlbWVudCBwYXJ0c1xuICAgICAgICAqIHRyeSB0byBleGVjdXRlIHRoZSBjb25jYXRlbmF0ZWQgY3VycmVudCBzdGF0ZW1lbnQgcGFydHNcbiAgICAgICAgKiBpZiBleGVjdXRpb24gdGVybWluYXRlcyB3aXRob3V0IGVycm9yLCBicmVha1xuICAgICAgICAqIHRocm93IGVycm9yIHVubGVzcyBlcnJvciBpcyBhbiBgaW5jb21wbGV0ZSBpbnB1dGAgZXJyb3JcbiAgICAgICAgKiBjb250aW51ZSB0byBsb29wLCBwb3NzaWJseSB3aXRoIGEgZ3VhcmQgdG8gb25seSBkbyB0aGlzIDEgb3IgMiB0aW1lc1xuXG4jIyNcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlciA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7IEdyYW1tYXIsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICB7IGRlYnVnLFxuICAgIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICAjIHsgaGlkZSxcbiAgIyAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICMgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4gICMgeyBsZXRzLFxuICAjICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAjIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgIyBtaXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgIyMjIFRBSU5UIG1vdmUgdG8gYnJpYyAjIyNcbiAgYmluZCAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICggY3R4LCBmbiApIC0+IGZuLmJpbmQgY3R4XG4gIGludGVybmFscyA9IHsgYmluZCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VnbWVudGVyXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBtb2RlID0gJ2Zhc3QnLCB9PXt9KSAtPlxuICAgICAgQG1vZGUgPSBtb2RlXG4gICAgICBAX2NyZWF0ZV9sZXhlcigpXG4gICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9sZXhlcjogLT5cbiAgICAgIHN3aXRjaCBAbW9kZVxuICAgICAgICB3aGVuICdmYXN0JyB0aGVuIHJldHVybiBAX2NyZWF0ZV9mYXN0X2xleGVyKClcbiAgICAgICAgd2hlbiAnc2xvdycgdGhlbiByZXR1cm4gQF9jcmVhdGVfc2xvd19sZXhlcigpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX18xIGV4cGVjdGVkIG1vZGUgdG8gYmUgb25lIG9mICdmYXN0JywgJ3Nsb3cnLCBnb3QgI3tycHJfc3RyaW5nIG1vZGV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9mYXN0X2xleGVyOiAtPlxuICAgICAgc2VnbWVudCA9ICcnXG4gICAgICBAZyA9XG4gICAgICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICAgICAgbGluZSAgICAgKz0gJ1xcbicgdW5sZXNzIGxpbmUuZW5kc1dpdGggJ1xcbidcbiAgICAgICAgICBzZWdtZW50ICArPSBsaW5lXG4gICAgICAgICAgaWYgbGluZS5lbmRzV2l0aCAnO1xcbidcbiAgICAgICAgICAgIGhpdCA9IHNlZ21lbnQucmVwbGFjZSAvXlxcbiooLio/KVxcbiokL3MsICckMSdcbiAgICAgICAgICAgICMgaGl0ID0gc2VnbWVudC50cmltKClcbiAgICAgICAgICAgIHlpZWxkIHsgaGl0LCBmcW5hbWU6ICd0b3Auc2VtaWNvbG9uJywgbGV2ZWw6IHsgbmFtZTogJ3RvcCcsIH0sIH1cbiAgICAgICAgICAgIHNlZ21lbnQgPSAnJ1xuICAgICAgICAgIDtudWxsXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY3JlYXRlX3Nsb3dfbGV4ZXI6IC0+XG4gICAgICBAZyAgICAgICAgICA9IG5ldyBHcmFtbWFyKClcbiAgICAgIHRvcCAgICAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ3RvcCcsIH1cbiAgICAgIHN0cmluZyAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ3N0cmluZycsIH1cbiAgICAgIGRxbmFtZSAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2RxbmFtZScsIH1cbiAgICAgIGJya3RuYW1lICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2Jya3RuYW1lJywgfVxuICAgICAgbGNvbW1lbnQgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnbGNvbW1lbnQnLCB9XG4gICAgICBiY29tbWVudCAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdiY29tbWVudCcsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnZG91YmxlX2Rhc2gnLCAgICB7ICBmaXQ6ICctLScsIGp1bXA6ICdsY29tbWVudCEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzbGFzaF9zdGFyJywgICAgIHsgIGZpdDogJy8qJywganVtcDogJ2Jjb21tZW50IScsIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9wYXJlbicsICAgICB7ICBmaXQ6ICcoJywgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdyaWdodF9wYXJlbicsICAgIHsgIGZpdDogJyknLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzZW1pY29sb24nLCAgICAgIHsgIGZpdDogJzsnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzaW5nbGVfcXVvdGUnLCAgIHsgIGZpdDogXCInXCIsIGp1bXA6ICdzdHJpbmchJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9icmFja2V0JywgICB7ICBmaXQ6IFwiW1wiLCBqdW1wOiAnYnJrdG5hbWUhJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnZG91YmxlX3F1b3RlJywgICB7ICBmaXQ6ICdcIicsIGp1bXA6ICdkcW5hbWUhJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnd3MnLCAgICAgICAgICAgICB7ICBmaXQ6IC9cXHMrLywgfVxuICAgICAgIyAjIyMgTk9URSBhbGwgU1FMIGtleXdvcmRzIGFyZSBgL1xcYlthLXpdKy9pYCwgc28gbXVjaCBtb3JlIHJlc3RyaWN0ZWQ7IGFsc28sIG1heSBnZXQgYSBjb21wbGV0ZSBsaXN0XG4gICAgICAjIG9mIGtleXdvcmRzIGFuZCB0aGUgZmV3IHNwZWNpYWwgY2hhcmFjdGVycyAoYC5gLCBgKmAsIC4uLikgb3V0IG9mICoucGtjaHIgZmlsZXMgKHNlZVxuICAgICAgIyBodHRwczovL3d3dy5zcWxpdGUub3JnL2RvY3NyYy9maWxlP2NpPXRydW5rJm5hbWU9YXJ0JTJGc3ludGF4JTJGY3JlYXRlLXRyaWdnZXItc3RtdC5waWtjaHImcHJvb2Y9ODAyMDI0MjMwKSAjIyNcbiAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdDUkVBVEUnLCAgICAgICAgIHsgIGZpdDogL1xcYkNSRUFURVxcYi9pLCAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUQUJMRScsICAgICAgICAgIHsgIGZpdDogL1xcYlRBQkxFXFxiL2ksICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdWSUVXJywgICAgICAgICAgIHsgIGZpdDogL1xcYlZJRVdcXGIvaSwgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUUklHR0VSJywgICAgICAgIHsgIGZpdDogL1xcYlRSSUdHRVJcXGIvaSwgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdCRUdJTicsICAgICAgICAgIHsgIGZpdDogL1xcYkJFR0lOXFxiL2ksICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdDQVNFJywgICAgICAgICAgIHsgIGZpdDogL1xcYkNBU0VcXGIvaSwgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdFTkQnLCAgICAgICAgICAgIHsgIGZpdDogL1xcYkVORFxcYi9pLCAgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdFWENMVVNJVkUnLCAgICAgIHsgIGZpdDogL1xcYkVYQ0xVU0lWRVxcYi9pLCAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdERUZFUlJFRCcsICAgICAgIHsgIGZpdDogL1xcYkRFRkVSUkVEXFxiL2ksICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdJTU1FRElBVEUnLCAgICAgIHsgIGZpdDogL1xcYklNTUVESUFURVxcYi9pLCAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUUkFOU0FDVElPTicsICAgIHsgIGZpdDogL1xcYlRSQU5TQUNUSU9OXFxiL2ksICAgfVxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjICMgdG9wLm5ld190b2tlbiAgICAgICAgICdSRVRVUk5JTkcnLCAgIHsgIGZpdDogL1xcYnJldHVybmluZ1xcYi9pLCBqdW1wOiAnV0lUSF9JRCEnIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgICAnd29yZCcsICAgICAgICAgICB7ICBmaXQ6IC9bXlxcc1wiJ1xcWztdKy8sIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3RyaW5nLm5ld190b2tlbiAgICAgICd0ZXh0JywgICAgICAgICAgIHsgIGZpdDogL1teJ10rLywgfVxuICAgICAgc3RyaW5nLm5ld190b2tlbiAgICAgICdzaW5nbGVfcXVvdGUnLCAgIHsgIGZpdDogXCInXCIsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgYnJrdG5hbWUubmV3X3Rva2VuICAgICduYW1lJywgICAgICAgICAgIHsgIGZpdDogL1teXFxdXSsvLCB9XG4gICAgICBicmt0bmFtZS5uZXdfdG9rZW4gICAgJ3JpZ2h0X2JyYWNrZXQnLCAgeyAgZml0OiAnXScsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZHFuYW1lLm5ld190b2tlbiAgICAgICduYW1lJywgICAgICAgICAgIHsgIGZpdDogL1teXCJdKy8sIH1cbiAgICAgIGRxbmFtZS5uZXdfdG9rZW4gICAgICAnZG91YmxlX3F1b3RlJywgICB7ICBmaXQ6ICdcIicsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbGNvbW1lbnQubmV3X3Rva2VuICAgICdjb21tZW50JywgICAgICAgIHsgIGZpdDogLy4qLywganVtcDogJy4uJyB9XG4gICAgICAjIGxjb21tZW50Lm5ld190b2tlbiAgICAnZW9sJywgICAgICAgICAgICB7ICBmaXQ6IC9cXG58LywganVtcDogJy4uJywgfVxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjICMjIyBUQUlOVCB0aGlzIGlzIGluY29ycmVjdCwgaWRlbnRpZmllcnMgY2FuIHN0YXJ0IHdpdGggcXVvdGUsIGJyYWNrZXQsIGNvbnRhaW4gd3MsIHNlbWljb2xvbiAjIyNcbiAgICAgICMga3dfd2l0aF9pZC5uZXdfdG9rZW4gICAgJ2lkZW50aWZpZXInLCAgIHsgIGZpdDogL1teO10rLywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ3N0YXJfc2xhc2gnLCAgICAgeyAgZml0OiAnKi8nLCBqdW1wOiAnLi4nLCB9XG4gICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvXFwqKD8hXFwvKXxbXipdKy8sIH1cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX18yIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGxpbmUgKSBpcyAndGV4dCdcbiAgICAgIHJldHVybiBkbyBiaW5kIEAsIC0+XG4gICAgICAgIGxpbmUgKz0gJ1xcbicgdW5sZXNzIGxpbmUuZW5kc1dpdGggJ1xcbidcbiAgICAgICAgZm9yIHRva2VuIGZyb20gQGcuc2NhbiBsaW5lXG4gICAgICAgICAgQHN0YXRlbWVudCArPSB0b2tlbi5oaXRcbiAgICAgICAgICBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC5zZW1pY29sb24nXG4gICAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgICAgO251bGxcbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5pc19zaWduYWxcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC53cydcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdsY29tbWVudCdcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdiY29tbWVudCdcbiAgICAgICAgIyB0YWJ1bGF0ZV9sZXhlbWUgdG9rZW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2Nhbl90b2tlbnM6ICggbGluZSApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGxpbmUgKSBpcyAndGV4dCdcbiAgICAgIHJldHVybiBkbyBiaW5kIEAsIC0+IHlpZWxkIGZyb20gQGcuc2NhbiBsaW5lXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBTZWdtZW50ZXIsIGludGVybmFscywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfc3FsaXRlX3VuZHVtcGVyID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgeyBHcmFtbWFyLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICB7IFNlZ21lbnRlciwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgcnByX3N0cmluZywgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgeyB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2Zhc3RfbGluZXJlYWRlcigpXG4gIHsgd2MsICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV93YygpXG4gIHsgQmVuY2htYXJrZXIsICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9iZW5jaG1hcmtpbmcoKVxuICBiZW5jaG1hcmtlciAgICAgICAgICAgICAgICAgICAgID0gbmV3IEJlbmNobWFya2VyKClcbiAgdGltZWl0ICAgICAgICAgICAgICAgICAgICAgICAgICA9ICggUC4uLiApIC0+IGJlbmNobWFya2VyLnRpbWVpdCBQLi4uXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgaW50ZXJuYWxzICAgICAgICAgICAgICAgICAgICAgICA9IHsgYmVuY2htYXJrZXIsIHRpbWVpdCwgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBVbmR1bXBlclxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKHsgZGIsIG1vZGUgPSAnZmFzdCcsIH09e30pIC0+XG4gICAgICBAZGIgICAgICAgICAgICAgICA9IGRiXG4gICAgICBAX2V4ZWN1dGUgICAgICAgICA9ICggQGRiLmV4ZWMgPyBAZGIuZXhlY3V0ZSApLmJpbmQgQGRiXG4gICAgICBAc3RhdGVtZW50X2NvdW50ICA9IDBcbiAgICAgIEBzdGF0ZW1lbnQgICAgICAgID0gJydcbiAgICAgIEBzZWdtZW50ZXIgICAgICAgID0gbmV3IFNlZ21lbnRlciB7IG1vZGUsIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2NhbjogKCBsaW5lICkgLT5cbiAgICAgIEBzdGF0ZW1lbnRfY291bnQgID0gMFxuICAgICAgZm9yIHN0YXRlbWVudF9jYW5kaWRhdGUgZnJvbSBAc2VnbWVudGVyLnNjYW4gbGluZVxuICAgICAgICBAc3RhdGVtZW50ICs9ICdcXG4nIGlmICggQHN0YXRlbWVudCBpc250ICcnICkgYW5kICggbm90IEBzdGF0ZW1lbnQuZW5kc1dpdGggJ1xcbicgKVxuICAgICAgICBAc3RhdGVtZW50ICs9IHN0YXRlbWVudF9jYW5kaWRhdGVcbiAgICAgICAgY2F1c2UgICAgICAgPSBudWxsXG4gICAgICAgIHRyeVxuICAgICAgICAgIEBfZXhlY3V0ZSBAc3RhdGVtZW50XG4gICAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgICAgY29udGludWUgaWYgY2F1c2UubWVzc2FnZSBpcyAnaW5jb21wbGV0ZSBpbnB1dCdcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX180IHdoZW4gdHJ5aW5nIHRvIGV4ZWN1dGUgU1FMIHN0YXRlbWVudCAje3Jwcl9zdHJpbmcgQHN0YXRlbWVudH0sXCIgXFxcbiAgICAgICAgICAgICsgXCIgYW4gZXJyb3Igd2FzIHRocm93bjogI3tycHJfc3RyaW5nIGNhdXNlLm1lc3NhZ2V9XCIsIHsgY2F1c2UsIH1cbiAgICAgICAgdW5sZXNzIGNhdXNlP1xuICAgICAgICAgIHlpZWxkIEBzdGF0ZW1lbnRcbiAgICAgICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgICAgICBAc3RhdGVtZW50X2NvdW50KytcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEB1bmR1bXA6ICh7IGRiLCBwYXRoLCBtb2RlID0gJ2Zhc3QnLCB9PXt9KSAtPlxuICAgICAgIyBkYi50ZWFyZG93biB7IHRlc3Q6ICcqJywgfVxuICAgICAgbGluZV9jb3VudCAgICAgID0gKCB3YyBwYXRoICkubGluZXNcbiAgICAgIHVuZHVtcGVyICAgICAgICA9IG5ldyBVbmR1bXBlciB7IGRiLCBtb2RlLCB9XG4gICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICB0aW1laXQgeyB0b3RhbDogbGluZV9jb3VudCwgYnJhbmQ6ICd1bmR1bXAnLCB9LCByZWFkX2FuZF9hcHBseV9kdW1wID0gKHsgcHJvZ3Jlc3MsIH0pIC0+XG4gICAgICAgIGZvciB7IGxpbmUsIH0gZnJvbSB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zIHBhdGhcbiAgICAgICAgICBwcm9ncmVzcyB7IGRlbHRhOiAxLCB9XG4gICAgICAgICAgZm9yIHN0YXRlbWVudCBmcm9tIHVuZHVtcGVyLnNjYW4gbGluZVxuICAgICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICMgZGVidWcgJ86pY3NxbF9fXzUnLCBiZW5jaG1hcmtlclxuICAgICAgZHRfbXMgICAgICAgICAgICAgPSBiZW5jaG1hcmtlci5icmFuZHMudW5kdW1wLnJlYWRfYW5kX2FwcGx5X2R1bXBbIDAgXVxuICAgICAgc3RhdGVtZW50c19wZXJfcyAgPSBNYXRoLnJvdW5kIHN0YXRlbWVudF9jb3VudCAvIGR0X21zICogMV8wMDBcbiAgICAgIHJldHVybiB7IGxpbmVfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZHRfbXMsIHN0YXRlbWVudHNfcGVyX3MsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBpbnRlcm5hbHMuLi4sIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IFVuZHVtcGVyLCBpbnRlcm5hbHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0geyByZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlciwgcmVxdWlyZV9zcWxpdGVfdW5kdW1wZXIsIH1cblxuXG4iXX0=
