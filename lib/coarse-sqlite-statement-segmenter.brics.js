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
    var SFMODULES, Statement_applicator, Statement_walker, bind, debug, exports, internals, type_of, warn;
    //=========================================================================================================
    SFMODULES = require('./main');
    // { hide,
    //   set_getter,                 } = SFMODULES.require_managed_property_tools()
    ({type_of} = SFMODULES.unstable.require_type_of());
    // # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
    // { rpr_string,                 } = SFMODULES.require_rpr_string()
    // { lets,
    //   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
    // SQLITE                          = require 'node:sqlite'
    ({debug, warn} = console);
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
    Statement_walker = class Statement_walker {
      //-------------------------------------------------------------------------------------------------------
      constructor({Grammar}) {
        this._create_lexer(Grammar);
        this.statement = '';
        void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      _create_lexer(Grammar) {
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
          throw new Error(`Ωcsql___1 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          var token;
          for (token of this.g.scan(line)) {
            // debug 'Ωcsql___2', { fqname: token.fqname, hit: token.hit, }
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
          throw new Error(`Ωcsql___1 expected a text, got a ${type}`);
        }
        return bind(this, function*() {
          return (yield* this.g.scan(line));
        })();
      }

    };
    //=========================================================================================================
    Statement_applicator = class Statement_applicator {
      //-------------------------------------------------------------------------------------------------------
      constructor({db, Grammar}) {
        this.db = db;
        this.statement_count = 0;
        this.statement = '';
        this.statement_walker = new Statement_walker({Grammar});
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      * scan(line) {
        var error, statement_candidate;
        this.statement_count = 0;
        for (statement_candidate of this.statement_walker.scan(line)) {
          this.statement += statement_candidate;
          error = null;
          try {
            this.db.exec(this.statement);
          } catch (error1) {
            error = error1;
            if (error.message !== 'incomplete input') {
              throw error;
            }
          }
          if (error == null) {
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
    return exports = {Statement_walker, Statement_applicator, internals};
  };

  module.exports = {require_coarse_sqlite_statement_segmenter};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEseUNBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXlFQSx5Q0FBQSxHQUE0QyxRQUFBLENBQUEsQ0FBQTtBQUU1QyxRQUFBLFNBQUEsRUFBQSxvQkFBQSxFQUFBLGdCQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBOztJQUNFLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVIsRUFEcEM7OztJQUlFLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQWxDLEVBSkY7Ozs7OztJQVVFLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDLEVBVkY7Ozs7OztJQWlCRSxJQUFBLEdBQWtDLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBO2FBQWUsRUFBRSxDQUFDLElBQUgsQ0FBUSxHQUFSO0lBQWY7SUFDbEMsU0FBQSxHQUFZLENBQUEsRUFsQmQ7O0lBcUJRLG1CQUFOLE1BQUEsaUJBQUEsQ0FBQTs7TUFHRSxXQUFhLENBQUMsQ0FBRSxPQUFGLENBQUQsQ0FBQTtRQUNYLElBQUMsQ0FBQSxhQUFELENBQWUsT0FBZjtRQUNBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDWjtNQUhVLENBRGpCOzs7TUFPSSxhQUFlLENBQUUsT0FBRixDQUFBO0FBQ25CLFlBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQTtRQUFNLElBQUMsQ0FBQSxDQUFELEdBQWMsSUFBSSxPQUFK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Q0FBQSxnQkFBRCxHQUFvQixJQUFJLGdCQUFKLENBQXFCLENBQUUsT0FBRixDQUFyQjtBQUNwQixlQUFPO01BTEksQ0FEakI7OztNQVNVLEVBQU4sSUFBTSxDQUFFLElBQUYsQ0FBQTtBQUNWLFlBQUEsS0FBQSxFQUFBO1FBQU0sSUFBQyxDQUFBLGVBQUQsR0FBb0I7UUFDcEIsS0FBQSx1REFBQTtVQUNFLElBQUMsQ0FBQSxTQUFELElBQWM7VUFDZCxLQUFBLEdBQWM7QUFDZDtZQUNFLElBQUMsQ0FBQSxFQUFFLENBQUMsSUFBSixDQUFTLElBQUMsQ0FBQSxTQUFWLEVBREY7V0FFQSxjQUFBO1lBQU07WUFDSixJQUFtQixLQUFLLENBQUMsT0FBTixLQUFpQixrQkFBcEM7Y0FBQSxNQUFNLE1BQU47YUFERjs7VUFFQSxJQUFPLGFBQVA7WUFDRSxNQUFNLElBQUMsQ0FBQTtZQUNQLElBQUMsQ0FBQSxTQUFELEdBQWE7WUFDYixJQUFDLENBQUEsZUFBRCxHQUhGOztRQVBGO2VBV0M7TUFiRzs7SUFYUixFQS9HRjs7SUE2SUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFBLFNBQUYsQ0FBZDtBQUNaLFdBQU8sT0FBQSxHQUFVLENBQUUsZ0JBQUYsRUFBb0Isb0JBQXBCLEVBQTBDLFNBQTFDO0VBaEp5Qjs7RUFrSjVDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLENBQUUseUNBQUY7QUEzTmpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyBOT1RFXG5cblRoZSBrZXl3b3JkIGBCRUdJTmAgKGAvXFxiYmVnaW5cXGIvaWApIGNhbiBhcHBlYXIgaW4gYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCB3aGVyZSBpdFxudW5mb3J0dW5hdGVseSBtYXkgYmUgcHJlY2VkZWQgYnkgYW4gZXhwcmVzc2lvbiBhbmQgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgc3RhdGVtZW50cyBlYWNoIG9mIHdoaWNoXG5tdXN0IGJlIHRlcm1pbmF0ZWQgYnkgYSBzZW1pY29sb247IHRoZSBlbmQgb2YgdGhlIHN1cnJvdW5kaW5nIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IGlzIHRoZW5cbnNpZ25hbGxlZCBieSBhbiBgRU5EYCBrZXl3b3JkIGZvbGxvd2VkIGJ5IGEgc2VtaWNvbG9uLiBUaGlzIHNlZW1zIHRvIGJlIHRoZSBvbmx5IHBsYWNlIHdoZXJlIFNRTGl0ZVxuYWxsb3dzIGEgJ2ZyZWUnIHNlbWljb2xvbiB0aGF0IGRvZXMgbm90IGVuZCBhIHRvcC1sZXZlbCBzdGF0ZW1lbnQuXG5cblRoZSBvbmx5IG90aGVyIHBsYWNlIHdoZXJlIEJFR0lOIG1heSBhcHBlYXIgaXMgaW4gYSBgQkVHSU4gVFJBTlNBQ1RJT05gIHN0YXRlbWVudCB3aGljaCBoYXMgYSBtdWNoXG5zaW1wbGVyIHN0cnVjdHVyZTpcblxuYGBgXG4gICAgICBCRUdJTiDigJTigJQr4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUK+KAlOKAlCBUUkFOU0FDVElPTlxuICAgICAgICAgICAgICB84oCUIEVYQ0xVU0lWRSAg4oCUfFxuICAgICAgICAgICAgICB84oCUIERFRkVSUkVEICAg4oCUfFxuICAgICAgICAgICAgICB84oCUIElNTUVESUFURSAg4oCUfFxuYGBgXG5cbkJ1dCBpdCBnZXRzIHdvcnNlIGJlY2F1c2UgU1FMaXRlIGFjY2VwdHMgYGJlZ2luYCBlLmcuIGFzIHRhYmxlIG5hbWU7IHdoZW4gZHVtcGluZyBhIERCLCBpdCB3aWxsXG5xdW90ZSB0aGF0IG5hbWUgKnNvbWV0aW1lcyogYnV0IG5vdCBhbHdheXM6XG5cbmBgYFxuQ1JFQVRFIFRBQkxFIGJlZ2luICggZyBib29sICk7XG5JTlNFUlQgSU5UTyBcImJlZ2luXCIgVkFMVUVTKDEpO1xuYGBgXG5cbkZyb20gdGhlIGxvb2tzIG9mIGl0LCB0aGlzICpzaG91bGQqIHdvcmsgaWYgd2Ugc2V0IGEgZmxhZyB3aGVuIHNlZWluZyBhIGBCRUdJTmA7IHdlIHRoZW4gZXhwZWN0XG53aGl0ZXNwYWNlLCBwb3NzaWJseSBhIG5ld2xpbmUsIGNvbW1lbnRzIGFuZCBtb3JlIHdoaXRlc3BhY2UsIHRoZW4gcG9zc2libHkgb25lIG9yIG1vcmUgb2ZcbmBFWENMVVNJVkVgLCBgREVGRVJSRURgLCBgSU1NRURJQVRFYCwgYFRSQU5TQUNUSU9OYOKAlGluIHdoaWNoIGNhc2UgYEJFR0lOYCBtdXN0IGhhdmUgYmVlbiBhdFxudG9wLWxldmVsIGFuZCB0aGUgZm9sbG93aW5nIGJhcmUgc2VtaWNvbG9uIGRvZXMgaW5kZWVkIHNpZ25hbCBlbmQtb2Ytc3RhdGVtZW50LlxuXG4gIE1heWJlIGltcG9ydGFudDogQ2hlY2sgZm9yIGZ1bmN0aW9uIGNhbGxzIGIvYyBVREZzIGFyZSBhbm90aGVyIHBsYWNlIHdoZXJlIGFyYml0cmFyeSBuZXcgbmFtZXMgbWF5XG4gIGdldCBpbnRyb2R1Y2VkLlxuXG4gIE1heWJlIGltcG9ydGFudDogaW4gdGhlIGNhc2Ugb2YgYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCwgdGhlIGBCRUdJTmAgLi4uIGBFTkRgIHBhcnQgaXNcbiAgbWFuZGF0b3J5LCAqYW5kKiB0aGUgY29uY2x1ZGluZyB0b3AtbGV2ZWwgc2VtaWNvbG9uICptdXN0KiBiZSBwcmVjZWRlZCBieSBgRU5EYCwgb25seSBzZXBhcmF0ZWQgYnlcbiAgb3B0aW9uYWwgY29tbWVudHMgYW5kIHdoaXRlc3BhY2UuIE90aGVyIHRoYW4gdGhhdCwgaXQgKmlzKiBwb3NzaWJsZSB0byBoYXZlIGFuIGBlbmRgIGFzIGFuXG4gIGlkZW50aWZpZXIgdG8gYXBwZWFyIGluIGZyb250IG9mIGEgc2VtaWNvbG9uLCBhcyBgZGVsZXRlIGZyb20gZW5kIHdoZXJlIGVuZCA9ICd4JyByZXR1cm5pbmcgZW5kO2BcbiAgaXMgYSB2YWxpZCBzdGF0ZW1lbnQuIEhvd2V2ZXIsIHRoZSBgUkVUVVJOSU5HYCBjbGF1c2UgaXMgbm90IHZhbGlkIGluIHRoZSBjb25jbHVkaW5nIHBhcnQgb2YgYVxuICBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudC5cblxuICBBcyBzdWNoLCBpdCAqc2hvdWxkKiBiZSBwb3NzaWJsZSB0byBmbGFnIHRoZSBiZWdpbm5pbmcgb2YgYSBgQ1JFQVRFIFRSSUdHRVJgIHN0YXRlbWVudCBhbmQgdGhlblxuICBzcGVjaWZpY2FsbHkgd2FpdCBmb3IgdGhlIGBFTkRgLCBgO2Agc2VxdWVuY2UuXG5cbkVycm9yLVJlc2lsaWVudCBTdHJhdGVnaWVzIChFUlMpOlxuICAqIG9uIHRoZSBsZXhlciBsZXZlbDpcbiAgICAqIGxvb3BcbiAgICAgICogYnJlYWsgaWYgZW5kIG9mIHNvdXJjZSBoYXMgYmVlbiByZWFjaGVkXG4gICAgICAqIGxvb3BcbiAgICAgICAgKiBsZXggdW50aWwgYSBgdG9wLnNlbWljb2xvbmAgaXMgZW5jb3VudGVyZWQ7XG4gICAgICAgICogdHJ5IHRvIGV4ZWN1dGUgdGhlIFNRTCB0byB0aGlzIHBvaW50O1xuICAgICAgICAqIGlmIGV4ZWN1dGlvbiB0ZXJtaW5hdGVzIHdpdGhvdXQgZXJyb3IsIGJyZWFrXG4gICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAqIGNvbnRpbnVlIHRvIGxvb3AsIHBvc3NpYmx5IHdpdGggYSBndWFyZCB0byBvbmx5IGRvIHRoaXMgMSBvciAyIHRpbWVzXG4gICogb24gdGhlIGxleGVyJ3MgY29uc3VtZXIgbGV2ZWw6XG4gICAgKiBsb29wXG4gICAgICAqIGJyZWFrIGlmIGVuZCBvZiBzb3VyY2UgaGFzIGJlZW4gcmVhY2hlZFxuICAgICAgKiBsZXQgY3VycmVudCBzdGF0ZW1lbnQgcGFydHMgYmUgYW4gZW1wdHkgbGlzdFxuICAgICAgKiBsb29wXG4gICAgICAgICogYXBwZW5kIG5leHQgY2FuZGlkYXRlIHN0YXRlbWVudCB0byBjdXJyZW50IHN0YXRlbWVudCBwYXJ0c1xuICAgICAgICAqIHRyeSB0byBleGVjdXRlIHRoZSBjb25jYXRlbmF0ZWQgY3VycmVudCBzdGF0ZW1lbnQgcGFydHNcbiAgICAgICAgKiBpZiBleGVjdXRpb24gdGVybWluYXRlcyB3aXRob3V0IGVycm9yLCBicmVha1xuICAgICAgICAqIHRocm93IGVycm9yIHVubGVzcyBlcnJvciBpcyBhbiBgaW5jb21wbGV0ZSBpbnB1dGAgZXJyb3JcbiAgICAgICAgKiBjb250aW51ZSB0byBsb29wLCBwb3NzaWJseSB3aXRoIGEgZ3VhcmQgdG8gb25seSBkbyB0aGlzIDEgb3IgMiB0aW1lc1xuXG4jIyNcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlciA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICAjIHsgaGlkZSxcbiAgIyAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgIyAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICMgeyBsZXRzLFxuICAjICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAjIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgIyBtaXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gICMgeyBnZXRfcHJvdG90eXBlX2NoYWluLFxuICAjICAgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAjIyMgVEFJTlQgbW92ZSB0byBicmljICMjI1xuICBiaW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gKCBjdHgsIGZuICkgLT4gZm4uYmluZCBjdHhcbiAgaW50ZXJuYWxzID0ge31cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFN0YXRlbWVudF93YWxrZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IEdyYW1tYXIsIH0pIC0+XG4gICAgICBAX2NyZWF0ZV9sZXhlciBHcmFtbWFyXG4gICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV9sZXhlcjogKCBHcmFtbWFyICkgLT5cbiAgICAgIEBnICAgICAgICAgID0gbmV3IEdyYW1tYXIoKVxuICAgICAgdG9wICAgICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAndG9wJywgfVxuICAgICAgc3RyaW5nICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnc3RyaW5nJywgfVxuICAgICAgZHFuYW1lICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnZHFuYW1lJywgfVxuICAgICAgYnJrdG5hbWUgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYnJrdG5hbWUnLCB9XG4gICAgICBsY29tbWVudCAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdsY29tbWVudCcsIH1cbiAgICAgIGJjb21tZW50ICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2Jjb21tZW50JywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfZGFzaCcsICAgIHsgIGZpdDogJy0tJywganVtcDogJ2xjb21tZW50IScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NsYXNoX3N0YXInLCAgICAgeyAgZml0OiAnLyonLCBqdW1wOiAnYmNvbW1lbnQhJywgfVxuICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdsZWZ0X3BhcmVuJywgICAgIHsgIGZpdDogJygnLCB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ3JpZ2h0X3BhcmVuJywgICAgeyAgZml0OiAnKScsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NlbWljb2xvbicsICAgICAgeyAgZml0OiAnOycsIH1cbiAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NpbmdsZV9xdW90ZScsICAgeyAgZml0OiBcIidcIiwganVtcDogJ3N0cmluZyEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdsZWZ0X2JyYWNrZXQnLCAgIHsgIGZpdDogXCJbXCIsIGp1bXA6ICdicmt0bmFtZSEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfcXVvdGUnLCAgIHsgIGZpdDogJ1wiJywganVtcDogJ2RxbmFtZSEnLCB9XG4gICAgICB0b3AubmV3X3Rva2VuICAgICAgICd3cycsICAgICAgICAgICAgIHsgIGZpdDogL1xccysvLCB9XG4gICAgICAjICMjIyBOT1RFIGFsbCBTUUwga2V5d29yZHMgYXJlIGAvXFxiW2Etel0rL2lgLCBzbyBtdWNoIG1vcmUgcmVzdHJpY3RlZDsgYWxzbywgbWF5IGdldCBhIGNvbXBsZXRlIGxpc3RcbiAgICAgICMgb2Yga2V5d29yZHMgYW5kIHRoZSBmZXcgc3BlY2lhbCBjaGFyYWN0ZXJzIChgLmAsIGAqYCwgLi4uKSBvdXQgb2YgKi5wa2NociBmaWxlcyAoc2VlXG4gICAgICAjIGh0dHBzOi8vd3d3LnNxbGl0ZS5vcmcvZG9jc3JjL2ZpbGU/Y2k9dHJ1bmsmbmFtZT1hcnQlMkZzeW50YXglMkZjcmVhdGUtdHJpZ2dlci1zdG10LnBpa2NociZwcm9vZj04MDIwMjQyMzApICMjI1xuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NSRUFURScsICAgICAgICAgeyAgZml0OiAvXFxiQ1JFQVRFXFxiL2ksICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RBQkxFJywgICAgICAgICAgeyAgZml0OiAvXFxiVEFCTEVcXGIvaSwgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1ZJRVcnLCAgICAgICAgICAgeyAgZml0OiAvXFxiVklFV1xcYi9pLCAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RSSUdHRVInLCAgICAgICAgeyAgZml0OiAvXFxiVFJJR0dFUlxcYi9pLCAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0JFR0lOJywgICAgICAgICAgeyAgZml0OiAvXFxiQkVHSU5cXGIvaSwgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NBU0UnLCAgICAgICAgICAgeyAgZml0OiAvXFxiQ0FTRVxcYi9pLCAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0VORCcsICAgICAgICAgICAgeyAgZml0OiAvXFxiRU5EXFxiL2ksICAgICAgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0VYQ0xVU0lWRScsICAgICAgeyAgZml0OiAvXFxiRVhDTFVTSVZFXFxiL2ksICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0RFRkVSUkVEJywgICAgICAgeyAgZml0OiAvXFxiREVGRVJSRURcXGIvaSwgICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0lNTUVESUFURScsICAgICAgeyAgZml0OiAvXFxiSU1NRURJQVRFXFxiL2ksICAgICB9XG4gICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RSQU5TQUNUSU9OJywgICAgeyAgZml0OiAvXFxiVFJBTlNBQ1RJT05cXGIvaSwgICB9XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgIyB0b3AubmV3X3Rva2VuICAgICAgICAgJ1JFVFVSTklORycsICAgeyAgZml0OiAvXFxicmV0dXJuaW5nXFxiL2ksIGp1bXA6ICdXSVRIX0lEIScgfVxuICAgICAgdG9wLm5ld190b2tlbiAgICAgICAgICd3b3JkJywgICAgICAgICAgIHsgIGZpdDogL1teXFxzXCInXFxbO10rLywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3RleHQnLCAgICAgICAgICAgeyAgZml0OiAvW14nXSsvLCB9XG4gICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3NpbmdsZV9xdW90ZScsICAgeyAgZml0OiBcIidcIiwganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBicmt0bmFtZS5uZXdfdG9rZW4gICAgJ25hbWUnLCAgICAgICAgICAgeyAgZml0OiAvW15cXF1dKy8sIH1cbiAgICAgIGJya3RuYW1lLm5ld190b2tlbiAgICAncmlnaHRfYnJhY2tldCcsICB7ICBmaXQ6ICddJywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBkcW5hbWUubmV3X3Rva2VuICAgICAgJ25hbWUnLCAgICAgICAgICAgeyAgZml0OiAvW15cIl0rLywgfVxuICAgICAgZHFuYW1lLm5ld190b2tlbiAgICAgICdkb3VibGVfcXVvdGUnLCAgIHsgIGZpdDogJ1wiJywganVtcDogJy4uJywgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBsY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvLiovLCBqdW1wOiAnLi4nIH1cbiAgICAgICMgbGNvbW1lbnQubmV3X3Rva2VuICAgICdlb2wnLCAgICAgICAgICAgIHsgIGZpdDogL1xcbnwvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgIyMjIFRBSU5UIHRoaXMgaXMgaW5jb3JyZWN0LCBpZGVudGlmaWVycyBjYW4gc3RhcnQgd2l0aCBxdW90ZSwgYnJhY2tldCwgY29udGFpbiB3cywgc2VtaWNvbG9uICMjI1xuICAgICAgIyBrd193aXRoX2lkLm5ld190b2tlbiAgICAnaWRlbnRpZmllcicsICAgeyAgZml0OiAvW147XSsvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGJjb21tZW50Lm5ld190b2tlbiAgICAnc3Rhcl9zbGFzaCcsICAgICB7ICBmaXQ6ICcqLycsIGp1bXA6ICcuLicsIH1cbiAgICAgIGJjb21tZW50Lm5ld190b2tlbiAgICAnY29tbWVudCcsICAgICAgICB7ICBmaXQ6IC9cXCooPyFcXC8pfFteKl0rLywgfVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2NhbjogKCBsaW5lICkgLT5cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pY3NxbF9fXzEgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCIgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbGluZSApIGlzICd0ZXh0J1xuICAgICAgcmV0dXJuIGRvIGJpbmQgQCwgLT5cbiAgICAgICAgZm9yIHRva2VuIGZyb20gQGcuc2NhbiBsaW5lXG4gICAgICAgICAgIyBkZWJ1ZyAnzqljc3FsX19fMicsIHsgZnFuYW1lOiB0b2tlbi5mcW5hbWUsIGhpdDogdG9rZW4uaGl0LCB9XG4gICAgICAgICAgQHN0YXRlbWVudCArPSB0b2tlbi5oaXRcbiAgICAgICAgICBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC5zZW1pY29sb24nXG4gICAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgICAgO251bGxcbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5pc19zaWduYWxcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC53cydcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdsY29tbWVudCdcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdiY29tbWVudCdcbiAgICAgICAgIyB0YWJ1bGF0ZV9sZXhlbWUgdG9rZW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2Nhbl90b2tlbnM6ICggbGluZSApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWNzcWxfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGxpbmUgKSBpcyAndGV4dCdcbiAgICAgIHJldHVybiBkbyBiaW5kIEAsIC0+IHlpZWxkIGZyb20gQGcuc2NhbiBsaW5lXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFN0YXRlbWVudF9hcHBsaWNhdG9yXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBkYiwgR3JhbW1hciwgfSkgLT5cbiAgICAgIEBkYiAgICAgICAgICAgICAgID0gZGJcbiAgICAgIEBzdGF0ZW1lbnRfY291bnQgID0gMFxuICAgICAgQHN0YXRlbWVudCAgICAgICAgPSAnJ1xuICAgICAgQHN0YXRlbWVudF93YWxrZXIgPSBuZXcgU3RhdGVtZW50X3dhbGtlciB7IEdyYW1tYXIsIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2NhbjogKCBsaW5lICkgLT5cbiAgICAgIEBzdGF0ZW1lbnRfY291bnQgID0gMFxuICAgICAgZm9yIHN0YXRlbWVudF9jYW5kaWRhdGUgZnJvbSBAc3RhdGVtZW50X3dhbGtlci5zY2FuIGxpbmVcbiAgICAgICAgQHN0YXRlbWVudCArPSBzdGF0ZW1lbnRfY2FuZGlkYXRlXG4gICAgICAgIGVycm9yICAgICAgID0gbnVsbFxuICAgICAgICB0cnlcbiAgICAgICAgICBAZGIuZXhlYyBAc3RhdGVtZW50XG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yLm1lc3NhZ2UgaXMgJ2luY29tcGxldGUgaW5wdXQnXG4gICAgICAgIHVubGVzcyBlcnJvcj9cbiAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICAgICAgQHN0YXRlbWVudF9jb3VudCsrXG4gICAgICA7bnVsbFxuXG5cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgU3RhdGVtZW50X3dhbGtlciwgU3RhdGVtZW50X2FwcGxpY2F0b3IsIGludGVybmFscywgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIsIH1cblxuXG4iXX0=
