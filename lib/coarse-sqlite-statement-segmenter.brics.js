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

    };
    //=========================================================================================================
    internals = Object.freeze({...internals});
    return exports = {Segmenter, Undumper, internals};
  };

  module.exports = {require_coarse_sqlite_statement_segmenter};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEseUNBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXlFQSx5Q0FBQSxHQUE0QyxRQUFBLENBQUEsQ0FBQTtBQUU1QyxRQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBOztJQUNFLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLFVBQVIsQ0FBbEM7SUFDQSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSO0lBQ2xDLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQWxDO0lBQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDLEVBTEY7Ozs7Ozs7Ozs7OztJQWtCRSxJQUFBLEdBQWtDLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBO2FBQWUsRUFBRSxDQUFDLElBQUgsQ0FBUSxHQUFSO0lBQWY7SUFDbEMsU0FBQSxHQUFZLENBQUEsRUFuQmQ7O0lBc0JRLFlBQU4sTUFBQSxVQUFBLENBQUE7O01BR0UsV0FBYSxDQUFDLENBQUUsSUFBQSxHQUFPLE1BQVQsSUFBbUIsQ0FBQSxDQUFwQixDQUFBO1FBQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxhQUFELENBQUE7UUFDQSxJ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QVpSLEVBdklGOztJQXlLRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUEsU0FBRixDQUFkO0FBQ1osV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsUUFBYixFQUF1QixTQUF2QjtFQTVLeUI7O0VBOEs1QyxNQUFNLENBQUMsT0FBUCxHQUFpQixDQUFFLHlDQUFGO0FBdlBqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMgTk9URVxuXG5UaGUga2V5d29yZCBgQkVHSU5gIChgL1xcYmJlZ2luXFxiL2lgKSBjYW4gYXBwZWFyIGluIGEgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQgd2hlcmUgaXRcbnVuZm9ydHVuYXRlbHkgbWF5IGJlIHByZWNlZGVkIGJ5IGFuIGV4cHJlc3Npb24gYW5kIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIHN0YXRlbWVudHMgZWFjaCBvZiB3aGljaFxubXVzdCBiZSB0ZXJtaW5hdGVkIGJ5IGEgc2VtaWNvbG9uOyB0aGUgZW5kIG9mIHRoZSBzdXJyb3VuZGluZyBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCBpcyB0aGVuXG5zaWduYWxsZWQgYnkgYW4gYEVORGAga2V5d29yZCBmb2xsb3dlZCBieSBhIHNlbWljb2xvbi4gVGhpcyBzZWVtcyB0byBiZSB0aGUgb25seSBwbGFjZSB3aGVyZSBTUUxpdGVcbmFsbG93cyBhICdmcmVlJyBzZW1pY29sb24gdGhhdCBkb2VzIG5vdCBlbmQgYSB0b3AtbGV2ZWwgc3RhdGVtZW50LlxuXG5UaGUgb25seSBvdGhlciBwbGFjZSB3aGVyZSBCRUdJTiBtYXkgYXBwZWFyIGlzIGluIGEgYEJFR0lOIFRSQU5TQUNUSU9OYCBzdGF0ZW1lbnQgd2hpY2ggaGFzIGEgbXVjaFxuc2ltcGxlciBzdHJ1Y3R1cmU6XG5cbmBgYFxuICAgICAgQkVHSU4g4oCU4oCUK+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCvigJTigJQgVFJBTlNBQ1RJT05cbiAgICAgICAgICAgICAgfOKAlCBFWENMVVNJVkUgIOKAlHxcbiAgICAgICAgICAgICAgfOKAlCBERUZFUlJFRCAgIOKAlHxcbiAgICAgICAgICAgICAgfOKAlCBJTU1FRElBVEUgIOKAlHxcbmBgYFxuXG5CdXQgaXQgZ2V0cyB3b3JzZSBiZWNhdXNlIFNRTGl0ZSBhY2NlcHRzIGBiZWdpbmAgZS5nLiBhcyB0YWJsZSBuYW1lOyB3aGVuIGR1bXBpbmcgYSBEQiwgaXQgd2lsbFxucXVvdGUgdGhhdCBuYW1lICpzb21ldGltZXMqIGJ1dCBub3QgYWx3YXlzOlxuXG5gYGBcbkNSRUFURSBUQUJMRSBiZWdpbiAoIGcgYm9vbCApO1xuSU5TRVJUIElOVE8gXCJiZWdpblwiIFZBTFVFUygxKTtcbmBgYFxuXG5Gcm9tIHRoZSBsb29rcyBvZiBpdCwgdGhpcyAqc2hvdWxkKiB3b3JrIGlmIHdlIHNldCBhIGZsYWcgd2hlbiBzZWVpbmcgYSBgQkVHSU5gOyB3ZSB0aGVuIGV4cGVjdFxud2hpdGVzcGFjZSwgcG9zc2libHkgYSBuZXdsaW5lLCBjb21tZW50cyBhbmQgbW9yZSB3aGl0ZXNwYWNlLCB0aGVuIHBvc3NpYmx5IG9uZSBvciBtb3JlIG9mXG5gRVhDTFVTSVZFYCwgYERFRkVSUkVEYCwgYElNTUVESUFURWAsIGBUUkFOU0FDVElPTmDigJRpbiB3aGljaCBjYXNlIGBCRUdJTmAgbXVzdCBoYXZlIGJlZW4gYXRcbnRvcC1sZXZlbCBhbmQgdGhlIGZvbGxvd2luZyBiYXJlIHNlbWljb2xvbiBkb2VzIGluZGVlZCBzaWduYWwgZW5kLW9mLXN0YXRlbWVudC5cblxuICBNYXliZSBpbXBvcnRhbnQ6IENoZWNrIGZvciBmdW5jdGlvbiBjYWxscyBiL2MgVURGcyBhcmUgYW5vdGhlciBwbGFjZSB3aGVyZSBhcmJpdHJhcnkgbmV3IG5hbWVzIG1heVxuICBnZXQgaW50cm9kdWNlZC5cblxuICBNYXliZSBpbXBvcnRhbnQ6IGluIHRoZSBjYXNlIG9mIGEgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQsIHRoZSBgQkVHSU5gIC4uLiBgRU5EYCBwYXJ0IGlzXG4gIG1hbmRhdG9yeSwgKmFuZCogdGhlIGNvbmNsdWRpbmcgdG9wLWxldmVsIHNlbWljb2xvbiAqbXVzdCogYmUgcHJlY2VkZWQgYnkgYEVORGAsIG9ubHkgc2VwYXJhdGVkIGJ5XG4gIG9wdGlvbmFsIGNvbW1lbnRzIGFuZCB3aGl0ZXNwYWNlLiBPdGhlciB0aGFuIHRoYXQsIGl0ICppcyogcG9zc2libGUgdG8gaGF2ZSBhbiBgZW5kYCBhcyBhblxuICBpZGVudGlmaWVyIHRvIGFwcGVhciBpbiBmcm9udCBvZiBhIHNlbWljb2xvbiwgYXMgYGRlbGV0ZSBmcm9tIGVuZCB3aGVyZSBlbmQgPSAneCcgcmV0dXJuaW5nIGVuZDtgXG4gIGlzIGEgdmFsaWQgc3RhdGVtZW50LiBIb3dldmVyLCB0aGUgYFJFVFVSTklOR2AgY2xhdXNlIGlzIG5vdCB2YWxpZCBpbiB0aGUgY29uY2x1ZGluZyBwYXJ0IG9mIGFcbiAgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQuXG5cbiAgQXMgc3VjaCwgaXQgKnNob3VsZCogYmUgcG9zc2libGUgdG8gZmxhZyB0aGUgYmVnaW5uaW5nIG9mIGEgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQgYW5kIHRoZW5cbiAgc3BlY2lmaWNhbGx5IHdhaXQgZm9yIHRoZSBgRU5EYCwgYDtgIHNlcXVlbmNlLlxuXG5FcnJvci1SZXNpbGllbnQgU3RyYXRlZ2llcyAoRVJTKTpcbiAgKiBvbiB0aGUgbGV4ZXIgbGV2ZWw6XG4gICAgKiBsb29wXG4gICAgICAqIGJyZWFrIGlmIGVuZCBvZiBzb3VyY2UgaGFzIGJlZW4gcmVhY2hlZFxuICAgICAgKiBsb29wXG4gICAgICAgICogbGV4IHVudGlsIGEgYHRvcC5zZW1pY29sb25gIGlzIGVuY291bnRlcmVkO1xuICAgICAgICAqIHRyeSB0byBleGVjdXRlIHRoZSBTUUwgdG8gdGhpcyBwb2ludDtcbiAgICAgICAgKiBpZiBleGVjdXRpb24gdGVybWluYXRlcyB3aXRob3V0IGVycm9yLCBicmVha1xuICAgICAgICAqIHRocm93IGVycm9yIHVubGVzcyBlcnJvciBpcyBhbiBgaW5jb21wbGV0ZSBpbnB1dGAgZXJyb3JcbiAgICAgICAgKiBjb250aW51ZSB0byBsb29wLCBwb3NzaWJseSB3aXRoIGEgZ3VhcmQgdG8gb25seSBkbyB0aGlzIDEgb3IgMiB0aW1lc1xuICAqIG9uIHRoZSBsZXhlcidzIGNvbnN1bWVyIGxldmVsOlxuICAgICogbG9vcFxuICAgICAgKiBicmVhayBpZiBlbmQgb2Ygc291cmNlIGhhcyBiZWVuIHJlYWNoZWRcbiAgICAgICogbGV0IGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzIGJlIGFuIGVtcHR5IGxpc3RcbiAgICAgICogbG9vcFxuICAgICAgICAqIGFwcGVuZCBuZXh0IGNhbmRpZGF0ZSBzdGF0ZW1lbnQgdG8gY3VycmVudCBzdGF0ZW1lbnQgcGFydHNcbiAgICAgICAgKiB0cnkgdG8gZXhlY3V0ZSB0aGUgY29uY2F0ZW5hdGVkIGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzXG4gICAgICAgICogaWYgZXhlY3V0aW9uIHRlcm1pbmF0ZXMgd2l0aG91dCBlcnJvciwgYnJlYWtcbiAgICAgICAgKiB0aHJvdyBlcnJvciB1bmxlc3MgZXJyb3IgaXMgYW4gYGluY29tcGxldGUgaW5wdXRgIGVycm9yXG4gICAgICAgICogY29udGludWUgdG8gbG9vcCwgcG9zc2libHkgd2l0aCBhIGd1YXJkIHRvIG9ubHkgZG8gdGhpcyAxIG9yIDIgdGltZXNcblxuIyMjXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIgPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBHcmFtbWFyLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgcnByX3N0cmluZywgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgIyB7IGhpZGUsXG4gICMgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAjICMgeyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxuICAjIHsgbGV0cyxcbiAgIyAgIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbiAgIyBTUUxJVEUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICMgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICAjIHsgZ2V0X3Byb3RvdHlwZV9jaGFpbixcbiAgIyAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgIyMjIFRBSU5UIG1vdmUgdG8gYnJpYyAjIyNcbiAgYmluZCAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICggY3R4LCBmbiApIC0+IGZuLmJpbmQgY3R4XG4gIGludGVybmFscyA9IHt9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTZWdtZW50ZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IG1vZGUgPSAnZmFzdCcsIH09e30pIC0+XG4gICAgICBAbW9kZSA9IG1vZGVcbiAgICAgIEBfY3JlYXRlX2xleGVyKClcbiAgICAgIEBzdGF0ZW1lbnQgPSAnJ1xuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY3JlYXRlX2xleGVyOiAtPlxuICAgICAgc3dpdGNoIEBtb2RlXG4gICAgICAgIHdoZW4gJ2Zhc3QnIHRoZW4gcmV0dXJuIEBfY3JlYXRlX2Zhc3RfbGV4ZXIoKVxuICAgICAgICB3aGVuICdzbG93JyB0aGVuIHJldHVybiBAX2NyZWF0ZV9zbG93X2xleGVyKClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pY3NxbF9fXzEgZXhwZWN0ZWQgbW9kZSB0byBiZSBvbmUgb2YgJ2Zhc3QnLCAnc2xvdycsIGdvdCAje3Jwcl9zdHJpbmcgbW9kZX1cIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY3JlYXRlX2Zhc3RfbGV4ZXI6IC0+XG4gICAgICBzZWdtZW50ID0gJydcbiAgICAgIEBnID1cbiAgICAgICAgc2NhbjogKCBsaW5lICkgLT5cbiAgICAgICAgICBsaW5lICAgICArPSAnXFxuJyB1bmxlc3MgbGluZS5lbmRzV2l0aCAnXFxuJ1xuICAgICAgICAgIHNlZ21lbnQgICs9IGxpbmVcbiAgICAgICAgICBpZiBsaW5lLmVuZHNXaXRoICc7XFxuJ1xuICAgICAgICAgICAgaGl0ID0gc2VnbWVudC5yZXBsYWNlIC9eXFxuKiguKj8pXFxuKiQvcywgJyQxJ1xuICAgICAgICAgICAgIyBoaXQgPSBzZWdtZW50LnRyaW0oKVxuICAgICAgICAgICAgeWllbGQgeyBoaXQsIGZxbmFtZTogJ3RvcC5zZW1pY29sb24nLCBsZXZlbDogeyBuYW1lOiAndG9wJywgfSwgfVxuICAgICAgICAgICAgc2VnbWVudCA9ICcnXG4gICAgICAgICAgO251bGxcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfc2xvd19sZXhlcjogLT5cbiAgICAgIEBnICAgICAgICAgID0gbmV3IEdyYW1tYXIoKVxuICAgICAgdG9wICAgICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAndG9wJywgfVxuICAgICAgc3RyaW5nICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnc3RyaW5nJywgfVxuICAgICAgZHFuYW1lICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnZHFuYW1lJywgfVxuICAgICAgYnJrdG5hbWUgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYnJrdG5hbWUnLCB9XG4gICAgICBsY29tbWVudCAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdsY29tbWVudCcsIH1cbiAgICAgIGJjb21tZW50ICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2Jjb21tZW50JywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfZGFzaCcsICAgIHsgIGZpdDogJy0tJywganVtcDogJ2xjb21tZW50IScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NsYXNoX3N0YXInLCAgICAgeyAgZml0OiAnLyonLCBqdW1wOiAnYmNvbW1lbnQhJywgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdsZWZ0X3BhcmVuJywgICAgIHsgIGZpdDogJygnLCB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ3JpZ2h0X3BhcmVuJywgICAgeyAgZml0OiAnKScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NlbWljb2xvbicsICAgICAgeyAgZml0OiAnOycsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NpbmdsZV9xdW90ZScsICAgeyAgZml0OiBcIidcIiwganVtcDogJ3N0cmluZyEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdsZWZ0X2JyYWNrZXQnLCAgIHsgIGZpdDogXCJbXCIsIGp1bXA6ICdicmt0bmFtZSEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfcXVvdGUnLCAgIHsgIGZpdDogJ1wiJywganVtcDogJ2RxbmFtZSEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICd3cycsICAgICAgICAgICAgIHsgIGZpdDogL1xccysvLCB9XG4gICAgICAjICMjIyBOT1RFIGFsbCBTUUwga2V5d29yZHMgYXJlIGAvXFxiW2Etel0rL2lgLCBzbyBtdWNoIG1vcmUgcmVzdHJpY3RlZDsgYWxzbywgbWF5IGdldCBhIGNvbXBsZXRlIGxpc3RcbiAgICAgICMgb2Yga2V5d29yZHMgYW5kIHRoZSBmZXcgc3BlY2lhbCBjaGFyYWN0ZXJzIChgLmAsIGAqYCwgLi4uKSBvdXQgb2YgKi5wa2NociBmaWxlcyAoc2VlXG4gICAgICAjIGh0dHBzOi8vd3d3LnNxbGl0ZS5vcmcvZG9jc3JjL2ZpbGU/Y2k9dHJ1bmsmbmFtZT1hcnQlMkZzeW50YXglMkZjcmVhdGUtdHJpZ2dlci1zdG10LnBpa2NociZwcm9vZj04MDIwMjQyMzApICMjI1xuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NSRUFURScsICAgICAgICAgeyAgZml0OiAvXFxiQ1JFQVRFXFxiL2ksICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RBQkxFJywgICAgICAgICAgeyAgZml0OiAvXFxiVEFCTEVcXGIvaSwgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1ZJRVcnLCAgICAgICAgICAgeyAgZml0OiAvXFxiVklFV1xcYi9pLCAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RSSUdHRVInLCAgICAgICAgeyAgZml0OiAvXFxiVFJJR0dFUlxcYi9pLCAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0JFR0lOJywgICAgICAgICAgeyAgZml0OiAvXFxiQkVHSU5cXGIvaSwgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NBU0UnLCAgICAgICAgICAgeyAgZml0OiAvXFxiQ0FTRVxcYi9pLCAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0VORCcsICAgICAgICAgICAgeyAgZml0OiAvXFxiRU5EXFxiL2ksICAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0VYQ0xVU0lWRScsICAgICAgeyAgZml0OiAvXFxiRVhDTFVTSVZFXFxiL2ksICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0RFRkVSUkVEJywgICAgICAgeyAgZml0OiAvXFxiREVGRVJSRURcXGIvaSwgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0lNTUVESUFURScsICAgICAgeyAgZml0OiAvXFxiSU1NRURJQVRFXFxiL2ksICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RSQU5TQUNUSU9OJywgICAgeyAgZml0OiAvXFxiVFJBTlNBQ1RJT05cXGIvaSwgICB9XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgIyB0b3AubmV3X3Rva2VuICAgICAgICAgJ1JFVFVSTklORycsICAgeyAgZml0OiAvXFxicmV0dXJuaW5nXFxiL2ksIGp1bXA6ICdXSVRIX0lEIScgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAgICd3b3JkJywgICAgICAgICAgIHsgIGZpdDogL1teXFxzXCInXFxbO10rLywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3RleHQnLCAgICAgICAgICAgeyAgZml0OiAvW14nXSsvLCB9XG4gICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3NpbmdsZV9xdW90ZScsICAgeyAgZml0OiBcIidcIiwganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBicmt0bmFtZS5uZXdfdG9rZW4gICAgJ25hbWUnLCAgICAgICAgICAgeyAgZml0OiAvW15cXF1dKy8sIH1cbiAgICAgIGJya3RuYW1lLm5ld190b2tlbiAgICAncmlnaHRfYnJhY2tldCcsICB7ICBmaXQ6ICddJywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBkcW5hbWUubmV3X3Rva2VuICAgICAgJ25hbWUnLCAgICAgICAgICAgeyAgZml0OiAvW15cIl0rLywgfVxuICAgICAgZHFuYW1lLm5ld190b2tlbiAgICAgICdkb3VibGVfcXVvdGUnLCAgIHsgIGZpdDogJ1wiJywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBsY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvLiovLCBqdW1wOiAnLi4nIH1cbiAgICAgICMgbGNvbW1lbnQubmV3X3Rva2VuICAgICdlb2wnLCAgICAgICAgICAgIHsgIGZpdDogL1xcbnwvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgIyMjIFRBSU5UIHRoaXMgaXMgaW5jb3JyZWN0LCBpZGVudGlmaWVycyBjYW4gc3RhcnQgd2l0aCBxdW90ZSwgYnJhY2tldCwgY29udGFpbiB3cywgc2VtaWNvbG9uICMjI1xuICAgICAgIyBrd193aXRoX2lkLm5ld190b2tlbiAgICAnaWRlbnRpZmllcicsICAgeyAgZml0OiAvW147XSsvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGJjb21tZW50Lm5ld190b2tlbiAgICAnc3Rhcl9zbGFzaCcsICAgICB7ICBmaXQ6ICcqLycsIGp1bXA6ICcuLicsIH1cbiAgICAgIGJjb21tZW50Lm5ld190b2tlbiAgICAnY29tbWVudCcsICAgICAgICB7ICBmaXQ6IC9cXCooPyFcXC8pfFteKl0rLywgfVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2NhbjogKCBsaW5lICkgLT5cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pY3NxbF9fXzIgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCIgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbGluZSApIGlzICd0ZXh0J1xuICAgICAgcmV0dXJuIGRvIGJpbmQgQCwgLT5cbiAgICAgICAgbGluZSArPSAnXFxuJyB1bmxlc3MgbGluZS5lbmRzV2l0aCAnXFxuJ1xuICAgICAgICBmb3IgdG9rZW4gZnJvbSBAZy5zY2FuIGxpbmVcbiAgICAgICAgICBAc3RhdGVtZW50ICs9IHRva2VuLmhpdFxuICAgICAgICAgIGlmIHRva2VuLmZxbmFtZSBpcyAndG9wLnNlbWljb2xvbidcbiAgICAgICAgICAgIHlpZWxkIEBzdGF0ZW1lbnRcbiAgICAgICAgICAgIEBzdGF0ZW1lbnQgPSAnJ1xuICAgICAgICA7bnVsbFxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmlzX3NpZ25hbFxuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmZxbmFtZSBpcyAndG9wLndzJ1xuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmxldmVsLm5hbWUgaXMgJ2xjb21tZW50J1xuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmxldmVsLm5hbWUgaXMgJ2Jjb21tZW50J1xuICAgICAgICAjIHRhYnVsYXRlX2xleGVtZSB0b2tlblxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzY2FuX3Rva2VuczogKCBsaW5lICkgLT5cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pY3NxbF9fXzMgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCIgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbGluZSApIGlzICd0ZXh0J1xuICAgICAgcmV0dXJuIGRvIGJpbmQgQCwgLT4geWllbGQgZnJvbSBAZy5zY2FuIGxpbmVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgVW5kdW1wZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IGRiLCBtb2RlID0gJ2Zhc3QnLCB9PXt9KSAtPlxuICAgICAgQGRiICAgICAgICAgICAgICAgPSBkYlxuICAgICAgQF9leGVjdXRlICAgICAgICAgPSAoIEBkYi5leGVjID8gQGRiLmV4ZWN1dGUgKS5iaW5kIEBkYlxuICAgICAgQHN0YXRlbWVudF9jb3VudCAgPSAwXG4gICAgICBAc3RhdGVtZW50ICAgICAgICA9ICcnXG4gICAgICBAc3RhdGVtZW50X3dhbGtlciA9IG5ldyBTZWdtZW50ZXIgeyBHcmFtbWFyLCBtb2RlLCB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICBAc3RhdGVtZW50X2NvdW50ICA9IDBcbiAgICAgIGZvciBzdGF0ZW1lbnRfY2FuZGlkYXRlIGZyb20gQHN0YXRlbWVudF93YWxrZXIuc2NhbiBsaW5lXG4gICAgICAgIEBzdGF0ZW1lbnQgKz0gJ1xcbicgaWYgKCBAc3RhdGVtZW50IGlzbnQgJycgKSBhbmQgKCBub3QgQHN0YXRlbWVudC5lbmRzV2l0aCAnXFxuJyApXG4gICAgICAgIEBzdGF0ZW1lbnQgKz0gc3RhdGVtZW50X2NhbmRpZGF0ZVxuICAgICAgICBjYXVzZSAgICAgICA9IG51bGxcbiAgICAgICAgdHJ5XG4gICAgICAgICAgQF9leGVjdXRlIEBzdGF0ZW1lbnRcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICBjb250aW51ZSBpZiBjYXVzZS5tZXNzYWdlIGlzICdpbmNvbXBsZXRlIGlucHV0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pY3NxbF9fXzQgd2hlbiB0cnlpbmcgdG8gZXhlY3V0ZSBTUUwgc3RhdGVtZW50ICN7cnByX3N0cmluZyBAc3RhdGVtZW50fSxcIiBcXFxuICAgICAgICAgICAgKyBcIiBhbiBlcnJvciB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgY2F1c2UubWVzc2FnZX1cIiwgeyBjYXVzZSwgfVxuICAgICAgICB1bmxlc3MgY2F1c2U/XG4gICAgICAgICAgeWllbGQgQHN0YXRlbWVudFxuICAgICAgICAgIEBzdGF0ZW1lbnQgPSAnJ1xuICAgICAgICAgIEBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgO251bGxcblxuXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBpbnRlcm5hbHMuLi4sIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IFNlZ21lbnRlciwgVW5kdW1wZXIsIGludGVybmFscywgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIsIH1cblxuXG4iXX0=
