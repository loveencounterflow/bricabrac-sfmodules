(function() {
  'use strict';
  var require_coarse_sqlite_statement_segmenter;

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
    var Grammar, SFMODULES, Segmenter, Undumper, bind, debug, exports, internals, rpr_string, type_of, warn;
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
    internals = {};
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
          throw new Error(`Ωcsql___4 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          var token;
          if (!line.endsWith('\n')) {
            line += '\n';
          }
          for (token of this.g.scan(line)) {
            // debug 'Ωcsql___5', { fqname: token.fqname, hit: token.hit, }
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
          throw new Error(`Ωcsql___6 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          return (yield* this.g.scan(line));
        })();
      }

    };
    //=========================================================================================================
    Undumper = class Undumper {
      //-------------------------------------------------------------------------------------------------------
      constructor({db, mode = 'fast'} = {}) {
        var ref;
        this.db = db;
        this._execute = ((ref = this.db.exec) != null ? ref : this.db.execute).bind(this.db);
        this.statement_count = 0;
        this.statement = '';
        this.statement_walker = new Segmenter({Grammar, mode});
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      * scan(line) {
        var cause, statement_candidate;
        this.statement_count = 0;
        for (statement_candidate of this.statement_walker.scan(line)) {
          if ((this.statement !== '') && (!this.statement.endsWith('\n'))) {
            this.statement += '\n';
          }
          this.statement += statement_candidate;
          cause = null;
          try {
            // debug "Ωcsql___7 executing (#{@statement.length}) #{rpr_string @statement}"[ .. 100 ]
            this._execute(this.statement);
          } catch (error) {
            cause = error;
            if (cause.message === 'incomplete input') {
              continue;
            }
            throw new Error(`Ωcsql___8 when trying to execute SQL statement ${rpr_string(this.statement)},` + ` an error was thrown: ${rpr_string(cause.message)}`, {cause});
          }
          if (cause == null) {
            yield this.statement;
            this.statement = '';
            this.statement_count++;
          }
        }
        return null;
      }

    };
    //=========================================================================================================
    internals = Object.freeze({...internals});
    return exports = {Segmenter, Undumper, internals};
  };

  module.exports = {require_coarse_sqlite_statement_segmenter};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEseUNBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXlFQSx5Q0FBQSxHQUE0QyxRQUFBLENBQUEsQ0FBQTtBQUU1QyxRQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBOztJQUNFLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLFVBQVIsQ0FBbEM7SUFDQSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSO0lBQ2xDLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQWxDO0lBQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDLEVBTEY7Ozs7Ozs7Ozs7OztJQWtCRSxJQUFBLEdBQWtDLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBO2FBQWUsRUFBRSxDQUFDLElBQUgsQ0FBUSxHQUFSO0lBQWY7SUFDbEMsU0FBQSxHQUFZLENBQUEsRUFuQmQ7O0lBc0JRLFlBQU4sTUFBQSxVQUFBLENBQUE7O01BR0UsV0FBYSxDQUFDLENBQUUsSUFBQSxHQUFPLE1BQVQsSUFBbUIsQ0FBQSxDQUFwQixDQUFBO1FBQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxhQUFELENBQUE7UUFDQSxJ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QWpCRzs7SUFaUixFQXhJRjs7SUEyS0UsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFBLFNBQUYsQ0FBZDtBQUNaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLFFBQWIsRUFBdUIsU0FBdkI7RUE5S3lCOztFQWdMNUMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSx5Q0FBRjtBQXpQakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIE5PVEVcblxuVGhlIGtleXdvcmQgYEJFR0lOYCAoYC9cXGJiZWdpblxcYi9pYCkgY2FuIGFwcGVhciBpbiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IHdoZXJlIGl0XG51bmZvcnR1bmF0ZWx5IG1heSBiZSBwcmVjZWRlZCBieSBhbiBleHByZXNzaW9uIGFuZCBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBzdGF0ZW1lbnRzIGVhY2ggb2Ygd2hpY2hcbm11c3QgYmUgdGVybWluYXRlZCBieSBhIHNlbWljb2xvbjsgdGhlIGVuZCBvZiB0aGUgc3Vycm91bmRpbmcgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQgaXMgdGhlblxuc2lnbmFsbGVkIGJ5IGFuIGBFTkRgIGtleXdvcmQgZm9sbG93ZWQgYnkgYSBzZW1pY29sb24uIFRoaXMgc2VlbXMgdG8gYmUgdGhlIG9ubHkgcGxhY2Ugd2hlcmUgU1FMaXRlXG5hbGxvd3MgYSAnZnJlZScgc2VtaWNvbG9uIHRoYXQgZG9lcyBub3QgZW5kIGEgdG9wLWxldmVsIHN0YXRlbWVudC5cblxuVGhlIG9ubHkgb3RoZXIgcGxhY2Ugd2hlcmUgQkVHSU4gbWF5IGFwcGVhciBpcyBpbiBhIGBCRUdJTiBUUkFOU0FDVElPTmAgc3RhdGVtZW50IHdoaWNoIGhhcyBhIG11Y2hcbnNpbXBsZXIgc3RydWN0dXJlOlxuXG5gYGBcbiAgICAgIEJFR0lOIOKAlOKAlCvigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQr4oCU4oCUIFRSQU5TQUNUSU9OXG4gICAgICAgICAgICAgIHzigJQgRVhDTFVTSVZFICDigJR8XG4gICAgICAgICAgICAgIHzigJQgREVGRVJSRUQgICDigJR8XG4gICAgICAgICAgICAgIHzigJQgSU1NRURJQVRFICDigJR8XG5gYGBcblxuQnV0IGl0IGdldHMgd29yc2UgYmVjYXVzZSBTUUxpdGUgYWNjZXB0cyBgYmVnaW5gIGUuZy4gYXMgdGFibGUgbmFtZTsgd2hlbiBkdW1waW5nIGEgREIsIGl0IHdpbGxcbnF1b3RlIHRoYXQgbmFtZSAqc29tZXRpbWVzKiBidXQgbm90IGFsd2F5czpcblxuYGBgXG5DUkVBVEUgVEFCTEUgYmVnaW4gKCBnIGJvb2wgKTtcbklOU0VSVCBJTlRPIFwiYmVnaW5cIiBWQUxVRVMoMSk7XG5gYGBcblxuRnJvbSB0aGUgbG9va3Mgb2YgaXQsIHRoaXMgKnNob3VsZCogd29yayBpZiB3ZSBzZXQgYSBmbGFnIHdoZW4gc2VlaW5nIGEgYEJFR0lOYDsgd2UgdGhlbiBleHBlY3RcbndoaXRlc3BhY2UsIHBvc3NpYmx5IGEgbmV3bGluZSwgY29tbWVudHMgYW5kIG1vcmUgd2hpdGVzcGFjZSwgdGhlbiBwb3NzaWJseSBvbmUgb3IgbW9yZSBvZlxuYEVYQ0xVU0lWRWAsIGBERUZFUlJFRGAsIGBJTU1FRElBVEVgLCBgVFJBTlNBQ1RJT05g4oCUaW4gd2hpY2ggY2FzZSBgQkVHSU5gIG11c3QgaGF2ZSBiZWVuIGF0XG50b3AtbGV2ZWwgYW5kIHRoZSBmb2xsb3dpbmcgYmFyZSBzZW1pY29sb24gZG9lcyBpbmRlZWQgc2lnbmFsIGVuZC1vZi1zdGF0ZW1lbnQuXG5cbiAgTWF5YmUgaW1wb3J0YW50OiBDaGVjayBmb3IgZnVuY3Rpb24gY2FsbHMgYi9jIFVERnMgYXJlIGFub3RoZXIgcGxhY2Ugd2hlcmUgYXJiaXRyYXJ5IG5ldyBuYW1lcyBtYXlcbiAgZ2V0IGludHJvZHVjZWQuXG5cbiAgTWF5YmUgaW1wb3J0YW50OiBpbiB0aGUgY2FzZSBvZiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50LCB0aGUgYEJFR0lOYCAuLi4gYEVORGAgcGFydCBpc1xuICBtYW5kYXRvcnksICphbmQqIHRoZSBjb25jbHVkaW5nIHRvcC1sZXZlbCBzZW1pY29sb24gKm11c3QqIGJlIHByZWNlZGVkIGJ5IGBFTkRgLCBvbmx5IHNlcGFyYXRlZCBieVxuICBvcHRpb25hbCBjb21tZW50cyBhbmQgd2hpdGVzcGFjZS4gT3RoZXIgdGhhbiB0aGF0LCBpdCAqaXMqIHBvc3NpYmxlIHRvIGhhdmUgYW4gYGVuZGAgYXMgYW5cbiAgaWRlbnRpZmllciB0byBhcHBlYXIgaW4gZnJvbnQgb2YgYSBzZW1pY29sb24sIGFzIGBkZWxldGUgZnJvbSBlbmQgd2hlcmUgZW5kID0gJ3gnIHJldHVybmluZyBlbmQ7YFxuICBpcyBhIHZhbGlkIHN0YXRlbWVudC4gSG93ZXZlciwgdGhlIGBSRVRVUk5JTkdgIGNsYXVzZSBpcyBub3QgdmFsaWQgaW4gdGhlIGNvbmNsdWRpbmcgcGFydCBvZiBhXG4gIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50LlxuXG4gIEFzIHN1Y2gsIGl0ICpzaG91bGQqIGJlIHBvc3NpYmxlIHRvIGZsYWcgdGhlIGJlZ2lubmluZyBvZiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IGFuZCB0aGVuXG4gIHNwZWNpZmljYWxseSB3YWl0IGZvciB0aGUgYEVORGAsIGA7YCBzZXF1ZW5jZS5cblxuRXJyb3ItUmVzaWxpZW50IFN0cmF0ZWdpZXMgKEVSUyk6XG4gICogb24gdGhlIGxleGVyIGxldmVsOlxuICAgICogbG9vcFxuICAgICAgKiBicmVhayBpZiBlbmQgb2Ygc291cmNlIGhhcyBiZWVuIHJlYWNoZWRcbiAgICAgICogbG9vcFxuICAgICAgICAqIGxleCB1bnRpbCBhIGB0b3Auc2VtaWNvbG9uYCBpcyBlbmNvdW50ZXJlZDtcbiAgICAgICAgKiB0cnkgdG8gZXhlY3V0ZSB0aGUgU1FMIHRvIHRoaXMgcG9pbnQ7XG4gICAgICAgICogaWYgZXhlY3V0aW9uIHRlcm1pbmF0ZXMgd2l0aG91dCBlcnJvciwgYnJlYWtcbiAgICAgICAgKiB0aHJvdyBlcnJvciB1bmxlc3MgZXJyb3IgaXMgYW4gYGluY29tcGxldGUgaW5wdXRgIGVycm9yXG4gICAgICAgICogY29udGludWUgdG8gbG9vcCwgcG9zc2libHkgd2l0aCBhIGd1YXJkIHRvIG9ubHkgZG8gdGhpcyAxIG9yIDIgdGltZXNcbiAgKiBvbiB0aGUgbGV4ZXIncyBjb25zdW1lciBsZXZlbDpcbiAgICAqIGxvb3BcbiAgICAgICogYnJlYWsgaWYgZW5kIG9mIHNvdXJjZSBoYXMgYmVlbiByZWFjaGVkXG4gICAgICAqIGxldCBjdXJyZW50IHN0YXRlbWVudCBwYXJ0cyBiZSBhbiBlbXB0eSBsaXN0XG4gICAgICAqIGxvb3BcbiAgICAgICAgKiBhcHBlbmQgbmV4dCBjYW5kaWRhdGUgc3RhdGVtZW50IHRvIGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzXG4gICAgICAgICogdHJ5IHRvIGV4ZWN1dGUgdGhlIGNvbmNhdGVuYXRlZCBjdXJyZW50IHN0YXRlbWVudCBwYXJ0c1xuICAgICAgICAqIGlmIGV4ZWN1dGlvbiB0ZXJtaW5hdGVzIHdpdGhvdXQgZXJyb3IsIGJyZWFrXG4gICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAqIGNvbnRpbnVlIHRvIGxvb3AsIHBvc3NpYmx5IHdpdGggYSBndWFyZCB0byBvbmx5IGRvIHRoaXMgMSBvciAyIHRpbWVzXG5cbiMjI1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgR3JhbW1hciwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICMgeyBoaWRlLFxuICAjICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgIyAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IGxldHMsXG4gICMgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gICMgU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuICAjIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgIyB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICMgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICMjIyBUQUlOVCBtb3ZlIHRvIGJyaWMgIyMjXG4gIGJpbmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAoIGN0eCwgZm4gKSAtPiBmbi5iaW5kIGN0eFxuICBpbnRlcm5hbHMgPSB7fVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VnbWVudGVyXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBtb2RlID0gJ2Zhc3QnLCB9PXt9KSAtPlxuICAgICAgQG1vZGUgPSBtb2RlXG4gICAgICBAX2NyZWF0ZV9sZXhlcigpXG4gICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9sZXhlcjogLT5cbiAgICAgIHN3aXRjaCBAbW9kZVxuICAgICAgICB3aGVuICdmYXN0JyB0aGVuIHJldHVybiBAX2NyZWF0ZV9mYXN0X2xleGVyKClcbiAgICAgICAgd2hlbiAnc2xvdycgdGhlbiByZXR1cm4gQF9jcmVhdGVfc2xvd19sZXhlcigpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX18xIGV4cGVjdGVkIG1vZGUgdG8gYmUgb25lIG9mICdmYXN0JywgJ3Nsb3cnLCBnb3QgI3tycHJfc3RyaW5nIG1vZGV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9mYXN0X2xleGVyOiAtPlxuICAgICAgc2VnbWVudCA9ICcnXG4gICAgICBAZyA9XG4gICAgICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICAgICAgbGluZSAgICAgKz0gJ1xcbicgdW5sZXNzIGxpbmUuZW5kc1dpdGggJ1xcbidcbiAgICAgICAgICBzZWdtZW50ICArPSBsaW5lXG4gICAgICAgICAgaWYgbGluZS5lbmRzV2l0aCAnO1xcbidcbiAgICAgICAgICAgIGhpdCA9IHNlZ21lbnQucmVwbGFjZSAvXlxcbiooLio/KVxcbiokL3MsICckMSdcbiAgICAgICAgICAgICMgaGl0ID0gc2VnbWVudC50cmltKClcbiAgICAgICAgICAgIHlpZWxkIHsgaGl0LCBmcW5hbWU6ICd0b3Auc2VtaWNvbG9uJywgbGV2ZWw6IHsgbmFtZTogJ3RvcCcsIH0sIH1cbiAgICAgICAgICAgIHNlZ21lbnQgPSAnJ1xuICAgICAgICAgIDtudWxsXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY3JlYXRlX3Nsb3dfbGV4ZXI6IC0+XG4gICAgICBAZyAgICAgICAgICA9IG5ldyBHcmFtbWFyKClcbiAgICAgIHRvcCAgICAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ3RvcCcsIH1cbiAgICAgIHN0cmluZyAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ3N0cmluZycsIH1cbiAgICAgIGRxbmFtZSAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2RxbmFtZScsIH1cbiAgICAgIGJya3RuYW1lICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2Jya3RuYW1lJywgfVxuICAgICAgbGNvbW1lbnQgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnbGNvbW1lbnQnLCB9XG4gICAgICBiY29tbWVudCAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdiY29tbWVudCcsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnZG91YmxlX2Rhc2gnLCAgICB7ICBmaXQ6ICctLScsIGp1bXA6ICdsY29tbWVudCEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzbGFzaF9zdGFyJywgICAgIHsgIGZpdDogJy8qJywganVtcDogJ2Jjb21tZW50IScsIH1cbiAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9wYXJlbicsICAgICB7ICBmaXQ6ICcoJywgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdyaWdodF9wYXJlbicsICAgIHsgIGZpdDogJyknLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzZW1pY29sb24nLCAgICAgIHsgIGZpdDogJzsnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzaW5nbGVfcXVvdGUnLCAgIHsgIGZpdDogXCInXCIsIGp1bXA6ICdzdHJpbmchJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9icmFja2V0JywgICB7ICBmaXQ6IFwiW1wiLCBqdW1wOiAnYnJrdG5hbWUhJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnZG91YmxlX3F1b3RlJywgICB7ICBmaXQ6ICdcIicsIGp1bXA6ICdkcW5hbWUhJywgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnd3MnLCAgICAgICAgICAgICB7ICBmaXQ6IC9cXHMrLywgfVxuICAgICAgIyAjIyMgTk9URSBhbGwgU1FMIGtleXdvcmRzIGFyZSBgL1xcYlthLXpdKy9pYCwgc28gbXVjaCBtb3JlIHJlc3RyaWN0ZWQ7IGFsc28sIG1heSBnZXQgYSBjb21wbGV0ZSBsaXN0XG4gICAgICAjIG9mIGtleXdvcmRzIGFuZCB0aGUgZmV3IHNwZWNpYWwgY2hhcmFjdGVycyAoYC5gLCBgKmAsIC4uLikgb3V0IG9mICoucGtjaHIgZmlsZXMgKHNlZVxuICAgICAgIyBodHRwczovL3d3dy5zcWxpdGUub3JnL2RvY3NyYy9maWxlP2NpPXRydW5rJm5hbWU9YXJ0JTJGc3ludGF4JTJGY3JlYXRlLXRyaWdnZXItc3RtdC5waWtjaHImcHJvb2Y9ODAyMDI0MjMwKSAjIyNcbiAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdDUkVBVEUnLCAgICAgICAgIHsgIGZpdDogL1xcYkNSRUFURVxcYi9pLCAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUQUJMRScsICAgICAgICAgIHsgIGZpdDogL1xcYlRBQkxFXFxiL2ksICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdWSUVXJywgICAgICAgICAgIHsgIGZpdDogL1xcYlZJRVdcXGIvaSwgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUUklHR0VSJywgICAgICAgIHsgIGZpdDogL1xcYlRSSUdHRVJcXGIvaSwgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdCRUdJTicsICAgICAgICAgIHsgIGZpdDogL1xcYkJFR0lOXFxiL2ksICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdDQVNFJywgICAgICAgICAgIHsgIGZpdDogL1xcYkNBU0VcXGIvaSwgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdFTkQnLCAgICAgICAgICAgIHsgIGZpdDogL1xcYkVORFxcYi9pLCAgICAgICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdFWENMVVNJVkUnLCAgICAgIHsgIGZpdDogL1xcYkVYQ0xVU0lWRVxcYi9pLCAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdERUZFUlJFRCcsICAgICAgIHsgIGZpdDogL1xcYkRFRkVSUkVEXFxiL2ksICAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdJTU1FRElBVEUnLCAgICAgIHsgIGZpdDogL1xcYklNTUVESUFURVxcYi9pLCAgICAgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUUkFOU0FDVElPTicsICAgIHsgIGZpdDogL1xcYlRSQU5TQUNUSU9OXFxiL2ksICAgfVxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjICMgdG9wLm5ld190b2tlbiAgICAgICAgICdSRVRVUk5JTkcnLCAgIHsgIGZpdDogL1xcYnJldHVybmluZ1xcYi9pLCBqdW1wOiAnV0lUSF9JRCEnIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgICAnd29yZCcsICAgICAgICAgICB7ICBmaXQ6IC9bXlxcc1wiJ1xcWztdKy8sIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3RyaW5nLm5ld190b2tlbiAgICAgICd0ZXh0JywgICAgICAgICAgIHsgIGZpdDogL1teJ10rLywgfVxuICAgICAgc3RyaW5nLm5ld190b2tlbiAgICAgICdzaW5nbGVfcXVvdGUnLCAgIHsgIGZpdDogXCInXCIsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgYnJrdG5hbWUubmV3X3Rva2VuICAgICduYW1lJywgICAgICAgICAgIHsgIGZpdDogL1teXFxdXSsvLCB9XG4gICAgICBicmt0bmFtZS5uZXdfdG9rZW4gICAgJ3JpZ2h0X2JyYWNrZXQnLCAgeyAgZml0OiAnXScsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZHFuYW1lLm5ld190b2tlbiAgICAgICduYW1lJywgICAgICAgICAgIHsgIGZpdDogL1teXCJdKy8sIH1cbiAgICAgIGRxbmFtZS5uZXdfdG9rZW4gICAgICAnZG91YmxlX3F1b3RlJywgICB7ICBmaXQ6ICdcIicsIGp1bXA6ICcuLicsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbGNvbW1lbnQubmV3X3Rva2VuICAgICdjb21tZW50JywgICAgICAgIHsgIGZpdDogLy4qLywganVtcDogJy4uJyB9XG4gICAgICAjIGxjb21tZW50Lm5ld190b2tlbiAgICAnZW9sJywgICAgICAgICAgICB7ICBmaXQ6IC9cXG58LywganVtcDogJy4uJywgfVxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjICMjIyBUQUlOVCB0aGlzIGlzIGluY29ycmVjdCwgaWRlbnRpZmllcnMgY2FuIHN0YXJ0IHdpdGggcXVvdGUsIGJyYWNrZXQsIGNvbnRhaW4gd3MsIHNlbWljb2xvbiAjIyNcbiAgICAgICMga3dfd2l0aF9pZC5uZXdfdG9rZW4gICAgJ2lkZW50aWZpZXInLCAgIHsgIGZpdDogL1teO10rLywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ3N0YXJfc2xhc2gnLCAgICAgeyAgZml0OiAnKi8nLCBqdW1wOiAnLi4nLCB9XG4gICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvXFwqKD8hXFwvKXxbXipdKy8sIH1cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX180IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGxpbmUgKSBpcyAndGV4dCdcbiAgICAgIHJldHVybiBkbyBiaW5kIEAsIC0+XG4gICAgICAgIGxpbmUgKz0gJ1xcbicgdW5sZXNzIGxpbmUuZW5kc1dpdGggJ1xcbidcbiAgICAgICAgZm9yIHRva2VuIGZyb20gQGcuc2NhbiBsaW5lXG4gICAgICAgICAgIyBkZWJ1ZyAnzqljc3FsX19fNScsIHsgZnFuYW1lOiB0b2tlbi5mcW5hbWUsIGhpdDogdG9rZW4uaGl0LCB9XG4gICAgICAgICAgQHN0YXRlbWVudCArPSB0b2tlbi5oaXRcbiAgICAgICAgICBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC5zZW1pY29sb24nXG4gICAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgICAgO251bGxcbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5pc19zaWduYWxcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC53cydcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdsY29tbWVudCdcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdiY29tbWVudCdcbiAgICAgICAgIyB0YWJ1bGF0ZV9sZXhlbWUgdG9rZW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2Nhbl90b2tlbnM6ICggbGluZSApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX182IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGxpbmUgKSBpcyAndGV4dCdcbiAgICAgIHJldHVybiBkbyBiaW5kIEAsIC0+IHlpZWxkIGZyb20gQGcuc2NhbiBsaW5lXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFVuZHVtcGVyXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBkYiwgbW9kZSA9ICdmYXN0JywgfT17fSkgLT5cbiAgICAgIEBkYiAgICAgICAgICAgICAgID0gZGJcbiAgICAgIEBfZXhlY3V0ZSAgICAgICAgID0gKCBAZGIuZXhlYyA/IEBkYi5leGVjdXRlICkuYmluZCBAZGJcbiAgICAgIEBzdGF0ZW1lbnRfY291bnQgID0gMFxuICAgICAgQHN0YXRlbWVudCAgICAgICAgPSAnJ1xuICAgICAgQHN0YXRlbWVudF93YWxrZXIgPSBuZXcgU2VnbWVudGVyIHsgR3JhbW1hciwgbW9kZSwgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzY2FuOiAoIGxpbmUgKSAtPlxuICAgICAgQHN0YXRlbWVudF9jb3VudCAgPSAwXG4gICAgICBmb3Igc3RhdGVtZW50X2NhbmRpZGF0ZSBmcm9tIEBzdGF0ZW1lbnRfd2Fsa2VyLnNjYW4gbGluZVxuICAgICAgICBAc3RhdGVtZW50ICs9ICdcXG4nIGlmICggQHN0YXRlbWVudCBpc250ICcnICkgYW5kICggbm90IEBzdGF0ZW1lbnQuZW5kc1dpdGggJ1xcbicgKVxuICAgICAgICBAc3RhdGVtZW50ICs9IHN0YXRlbWVudF9jYW5kaWRhdGVcbiAgICAgICAgY2F1c2UgICAgICAgPSBudWxsXG4gICAgICAgICMgZGVidWcgXCLOqWNzcWxfX183IGV4ZWN1dGluZyAoI3tAc3RhdGVtZW50Lmxlbmd0aH0pICN7cnByX3N0cmluZyBAc3RhdGVtZW50fVwiWyAuLiAxMDAgXVxuICAgICAgICB0cnlcbiAgICAgICAgICBAX2V4ZWN1dGUgQHN0YXRlbWVudFxuICAgICAgICBjYXRjaCBjYXVzZVxuICAgICAgICAgIGNvbnRpbnVlIGlmIGNhdXNlLm1lc3NhZ2UgaXMgJ2luY29tcGxldGUgaW5wdXQnXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqljc3FsX19fOCB3aGVuIHRyeWluZyB0byBleGVjdXRlIFNRTCBzdGF0ZW1lbnQgI3tycHJfc3RyaW5nIEBzdGF0ZW1lbnR9LFwiIFxcXG4gICAgICAgICAgICArIFwiIGFuIGVycm9yIHdhcyB0aHJvd246ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHVubGVzcyBjYXVzZT9cbiAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICAgICAgQHN0YXRlbWVudF9jb3VudCsrXG4gICAgICA7bnVsbFxuXG5cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgU2VnbWVudGVyLCBVbmR1bXBlciwgaW50ZXJuYWxzLCB9XG5cbm1vZHVsZS5leHBvcnRzID0geyByZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlciwgfVxuXG5cbiJdfQ==
