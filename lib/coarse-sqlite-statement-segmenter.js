(async function() {
  'use strict';
  var GTNG, GUY, SQL, Test, UNSTABLE_DBRIC_BRICS, abbrlxm, alert, condense_lexemes, debug, echo, f, help, info, inspect, log, plain, praise, reverse, rpr, tabulate_lexeme, tabulate_lexemes, urge, warn, whisper;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_coarse_sqlite_statement_segmenter: function() {
      var SFMODULES, Statement_applicator, Statement_walker, exports, internals;
      //=======================================================================================================
      SFMODULES = require('./main');
      // { hide,
      //   set_getter,                 } = SFMODULES.require_managed_property_tools()
      // { type_of,                    } = SFMODULES.unstable.require_type_of()
      // # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
      // { rpr_string,                 } = SFMODULES.require_rpr_string()
      // { lets,
      //   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
      // SQLITE                          = require 'node:sqlite'
      // { debug,
      //   warn                        } = console
      // misfit                          = Symbol 'misfit'
      // { get_prototype_chain,
      //   get_all_in_prototype_chain, } = SFMODULES.unstable.require_get_prototype_chain()

        //=======================================================================================================
      Statement_walker = class Statement_walker {
        //-----------------------------------------------------------------------------------------------------
        constructor({Grammar}) {
          this._create_lexer(Grammar);
          this.statement = '';
          void 0;
        }

        //-----------------------------------------------------------------------------------------------------
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
          //...................................................................................................
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
          //...................................................................................................
          string.new_token('text', {
            fit: /[^']+/
          });
          string.new_token('single_quote', {
            fit: "'",
            jump: '..'
          });
          //...................................................................................................
          brktname.new_token('name', {
            fit: /[^\]]+/
          });
          brktname.new_token('right_bracket', {
            fit: ']',
            jump: '..'
          });
          //...................................................................................................
          dqname.new_token('name', {
            fit: /[^"]+/
          });
          dqname.new_token('double_quote', {
            fit: '"',
            jump: '..'
          });
          //...................................................................................................
          lcomment.new_token('comment', {
            fit: /.*/,
            jump: '..'
          });
          // lcomment.new_token    'eol',            {  fit: /\n|/, jump: '..', }
          // #...................................................................................................
          // ### TAINT this is incorrect, identifiers can start with quote, bracket, contain ws, semicolon ###
          // kw_with_id.new_token    'identifier',   {  fit: /[^;]+/, jump: '..', }
          //...................................................................................................
          bcomment.new_token('star_slash', {
            fit: '*/',
            jump: '..'
          });
          bcomment.new_token('comment', {
            fit: /\*(?!\/)|[^*]+/
          });
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * scan(line) {
          var token;
          for (token of this.g.scan(line)) {
            // debug 'Ω___9', token
            this.statement += token.hit;
            if (token.fqname === 'top.semicolon') {
              yield this.statement;
              this.statement = '';
            }
          }
          // #...............................................................................................
          // continue if token.is_signal
          // continue if token.fqname is 'top.ws'
          // continue if token.level.name is 'lcomment'
          // continue if token.level.name is 'bcomment'
          // tabulate_lexeme token
          return null;
        }

      };
      //=======================================================================================================
      Statement_applicator = class Statement_applicator {
        //-----------------------------------------------------------------------------------------------------
        constructor({db, Grammar}) {
          this.db = db;
          this.statement_count = 0;
          this.statement = '';
          this.statement_walker = new Statement_walker({Grammar});
          return void 0;
        }

        //-----------------------------------------------------------------------------------------------------
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
      //=======================================================================================================
      internals = Object.freeze({...internals});
      return exports = {internals};
    }
  };

  'use strict';

  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('interlex/test-basics'));

  ({rpr, inspect, echo, reverse, log} = GUY.trm);

  // WGUY                      = require '../../../apps/webguy'
  GTNG = require('../../../apps/guy-test-NG');

  ({Test} = GTNG);

  ({f} = require('../../../apps/effstring'));

  SQL = String.raw;

  ({condense_lexemes, abbrlxm, tabulate_lexemes, tabulate_lexeme} = require('./helpers'));

  // { internals: ct_internals
  //   isa
  //   std
  //   type_of               } = require '../../../apps/cleartype'

  //###########################################################################################################

  //===========================================================================================================
  this.interlex_tasks = {
    //=========================================================================================================
    levels: {
      //-------------------------------------------------------------------------------------------------------
      demo: function() {
        var Grammar;
        ({Grammar} = require('../../../apps/interlex'));
        (() => {          //.....................................................................................................
          var bcomment, brktname, dqname, g, i, j, lcomment, len, len1, line, ref, source, statement, statements_list, string, token, top;
          g = new Grammar();
          top = g.new_level({
            name: 'top'
          });
          string = g.new_level({
            name: 'string'
          });
          dqname = g.new_level({
            name: 'dqname'
          });
          brktname = g.new_level({
            name: 'brktname'
          });
          lcomment = g.new_level({
            name: 'lcomment'
          });
          bcomment = g.new_level({
            name: 'bcomment'
          });
          // kw_with_id  = g.new_level { name: 'WITH_ID', }
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
          //...................................................................................................
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
          //...................................................................................................
          string.new_token('text', {
            fit: /[^']+/
          });
          string.new_token('single_quote', {
            fit: "'",
            jump: '..'
          });
          //...................................................................................................
          brktname.new_token('name', {
            fit: /[^\]]+/
          });
          brktname.new_token('right_bracket', {
            fit: ']',
            jump: '..'
          });
          //...................................................................................................
          dqname.new_token('name', {
            fit: /[^"]+/
          });
          dqname.new_token('double_quote', {
            fit: '"',
            jump: '..'
          });
          //...................................................................................................
          lcomment.new_token('comment', {
            fit: /.*/,
            jump: '..'
          });
          // lcomment.new_token    'eol',            {  fit: /\n|/, jump: '..', }
          // #...................................................................................................
          // ### TAINT this is incorrect, identifiers can start with quote, bracket, contain ws, semicolon ###
          // kw_with_id.new_token    'identifier',   {  fit: /[^;]+/, jump: '..', }
          //...................................................................................................
          bcomment.new_token('star_slash', {
            fit: '*/',
            jump: '..'
          });
          bcomment.new_token('comment', {
            fit: /\*(?!\/)|[^*]+/
          });
          //...................................................................................................
          source = SQL`create table "names" (
name text unique not null,
"no-comment[" /* bcomment! */ text not null default 'no;comment', -- lcomment brother
[uuugh....] integer );`;
          //...................................................................................................
          /* Alas, a valid statement (although probably not one that can appear in regular dump file) */
          source = SQL`delete from end where end = 'x' returning end;`;
          //...................................................................................................
          source = SQL`begin immediate transaction;`;
          //...................................................................................................
          source = SQL`begin immediate transaction;
CREATE TRIGGER jzr_mirror_triples_register
before insert on jzr_mirror_triples_base
for each row begin
  select trigger_on_before_insert( 'jzr_mirror_triples_base', new.rowid, new.ref, new.s, new.v, new.o );
  end /*comment */ -- newline!
  ;`;
          //...................................................................................................
          statements_list = [];
          statement = '';
          ref = source.split('/n');
          for (i = 0, len = ref.length; i < len; i++) {
            line = ref[i];
            for (token of g.scan(line)) {
              // debug 'Ω___9', token
              statement += token.hit;
              if (token.fqname === 'top.semicolon') {
                statements_list.push(statement);
                statement = '';
              }
              if (token.is_signal) {
                //...............................................................................................
                continue;
              }
              if (token.fqname === 'top.ws') {
                continue;
              }
              if (token.level.name === 'lcomment') {
                continue;
              }
              if (token.level.name === 'bcomment') {
                continue;
              }
              tabulate_lexeme(token);
            }
          }
          for (j = 0, len1 = statements_list.length; j < len1; j++) {
            statement = statements_list[j];
            echo('—————————————————————————————————');
            echo('\n' + GUY.trm.reverse(GUY.trm.white(` ${statement} `)));
          }
          return null;
        })();
        //.....................................................................................................
        return null;
      }
    }
  };

  //   #...................................................................................................
  //   top     = g.new_level { name: 'top', }
  //   top.new_token     { name: 'other',      fit: /[^"]+/,                             }
  //   top.new_token     { name: 'dq',         fit: /"/,             jump: 'dqstring!',  }
  //   #...................................................................................................
  //   dqstring  = g.new_level { name: 'dqstring', }
  //   dqstring.new_token  { name: 'other',      fit: /[^"]+/,                             }
  //   dqstring.new_token  { name: 'dq',         fit: /"/,             jump: '..'          }
  // text.new_token    { name: 'text',         fit: /// \\ \p{Decimal_Number} | \p{Letter} ///v,                 }
  // text.new_token    { name: 'ws',           fit: /// \p{White_Space}                    ///v,                 }
  // text.new_token    { name: 'number_start', fit: /// (?= (?!< \\ ) \p{Decimal_Number} ) ///v, jump: 'number', }
  // number.new_token  { name: 'digit',        fit: /// \p{Decimal_Number} | \. | e        ///v,                 }
  // number.new_token  { name: 'number_stop',  fit: /// (?= \P{Decimal_Number} )           ///v, jump: '..',     }
  // #.....................................................................................................
  // text.new_token { name: 'name', fit: /// (?<initial> \p{Uppercase_Letter} ) \p{Lowercase_Letter}+ ///v, merge: true,    }
  // #.....................................................................................................

  // #.....................................................................................................
  // gnd.new_token       { name: 'name',           fit: rx"(?<initial>[A-Z])[a-z]*", }
  // gnd.new_token       { name: 'number',         fit: rx"[0-9]+",                  }
  // gnd.new_token       { name: 'paren_start',    fit: rx"\(",                      }
  // gnd.new_token       { name: 'paren_stop',     fit: rx"\)",                      }
  // gnd.new_token       { name: 'other',          fit: rx"[A-Za-z0-9]+",            }
  // gnd.new_token       { name: 'ws',             fit: rx"\s+",                     }

  //===========================================================================================================
  if (module === require.main) {
    await (() => {
      var guytest_cfg;
      guytest_cfg = {
        throw_on_error: false,
        show_passes: false,
        report_checks: false
      };
      guytest_cfg = {
        throw_on_error: true,
        show_passes: false,
        report_checks: false
      };
      // guytest_cfg = { throw_on_error: false, show_passes: true, report_checks: true, }
      return (new Test(guytest_cfg)).test(this.interlex_tasks);
    })();
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLG9CQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxnQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBOzs7OztFQUtBLG9CQUFBLEdBS0UsQ0FBQTs7O0lBQUEseUNBQUEsRUFBMkMsUUFBQSxDQUFBLENBQUE7QUFFN0MsVUFBQSxTQUFBLEVBQUEsb0JBQUEsRUFBQSxnQkFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBOztNQUNJLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVIsRUFEdEM7Ozs7Ozs7Ozs7Ozs7Ozs7TUFrQlUsbUJBQU4sTUFBQSxpQkFBQSxDQUFBOztRQUdFLFdBQWEsQ0FBQyxDQUFFLE9BQUYsQ0FBRCxDQUFBO1VBQ1gsSUFBQyxDQUFBLGFBQUQsQ0FBZSxPQUFmO1VBQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYTtVQUNaO1FBSFUsQ0FEbkI7OztRQU9NLGFBQWUsQ0FBRSxPQUFGLENBQUE7QUFDckIsY0FBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBO1VBQVEsSUFBQyxDQUFBLENBQUQsR0FBYyxJQUFJLE9BQUosQ0FBQTtVQUNkLEdBQUEsR0FBYyxJQUFDLENBQUEsQ0FBQyxDQUFDLFNBQUgsQ0FBYTtZQUFFLElBQUEsRUFBTTtVQUFSLENBQWI7VUFDZCxNQUFBLEdBQWMs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S0FBVSxPQUFPLENBQUMsSUFBckI7SUFBK0IsTUFBUyxDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3hDLFVBQUE7TUFBRSxXQUFBLEdBQWM7UUFBRSxjQUFBLEVBQWdCLEtBQWxCO1FBQXlCLFdBQUEsRUFBYSxLQUF0QztRQUE2QyxhQUFBLEVBQWU7TUFBNUQ7TUFDZCxXQUFBLEdBQWM7UUFBRSxjQUFBLEVBQWdCLElBQWxCO1FBQXdCLFdBQUEsRUFBYSxLQUFyQztRQUE0QyxhQUFBLEVBQWU7TUFBM0QsRUFEaEI7O2FBR0UsQ0FBRSxJQUFJLElBQUosQ0FBUyxXQUFULENBQUYsQ0FBd0IsQ0FBQyxJQUF6QixDQUE4QixJQUFDLENBQUEsY0FBL0I7SUFKc0MsQ0FBQSxJQUF4Qzs7QUFuWkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblVOU1RBQkxFX0RCUklDX0JSSUNTID1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXI6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gICAgIyB7IGhpZGUsXG4gICAgIyAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgIyB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICAjIHsgcnByX3N0cmluZywgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICAjIHsgbGV0cyxcbiAgICAjICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAgICMgU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuICAgICMgeyBkZWJ1ZyxcbiAgICAjICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICAgIyBtaXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gICAgIyB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgIyAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU3RhdGVtZW50X3dhbGtlclxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoeyBHcmFtbWFyLCB9KSAtPlxuICAgICAgICBAX2NyZWF0ZV9sZXhlciBHcmFtbWFyXG4gICAgICAgIEBzdGF0ZW1lbnQgPSAnJ1xuICAgICAgICA7dW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2NyZWF0ZV9sZXhlcjogKCBHcmFtbWFyICkgLT5cbiAgICAgICAgQGcgICAgICAgICAgPSBuZXcgR3JhbW1hcigpXG4gICAgICAgIHRvcCAgICAgICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ3RvcCcsIH1cbiAgICAgICAgc3RyaW5nICAgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnc3RyaW5nJywgfVxuICAgICAgICBkcW5hbWUgICAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdkcW5hbWUnLCB9XG4gICAgICAgIGJya3RuYW1lICAgID0gQGcubmV3X2xldmVsIHsgbmFtZTogJ2Jya3RuYW1lJywgfVxuICAgICAgICBsY29tbWVudCAgICA9IEBnLm5ld19sZXZlbCB7IG5hbWU6ICdsY29tbWVudCcsIH1cbiAgICAgICAgYmNvbW1lbnQgICAgPSBAZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYmNvbW1lbnQnLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnZG91YmxlX2Rhc2gnLCAgICB7ICBmaXQ6ICctLScsIGp1bXA6ICdsY29tbWVudCEnLCB9XG4gICAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NsYXNoX3N0YXInLCAgICAgeyAgZml0OiAnLyonLCBqdW1wOiAnYmNvbW1lbnQhJywgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ2xlZnRfcGFyZW4nLCAgICAgeyAgZml0OiAnKCcsIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdyaWdodF9wYXJlbicsICAgIHsgIGZpdDogJyknLCB9XG4gICAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3NlbWljb2xvbicsICAgICAgeyAgZml0OiAnOycsIH1cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2luZ2xlX3F1b3RlJywgICB7ICBmaXQ6IFwiJ1wiLCBqdW1wOiAnc3RyaW5nIScsIH1cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9icmFja2V0JywgICB7ICBmaXQ6IFwiW1wiLCBqdW1wOiAnYnJrdG5hbWUhJywgfVxuICAgICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfcXVvdGUnLCAgIHsgIGZpdDogJ1wiJywganVtcDogJ2RxbmFtZSEnLCB9XG4gICAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ3dzJywgICAgICAgICAgICAgeyAgZml0OiAvXFxzKy8sIH1cbiAgICAgICAgIyAjIyMgTk9URSBhbGwgU1FMIGtleXdvcmRzIGFyZSBgL1xcYlthLXpdKy9pYCwgc28gbXVjaCBtb3JlIHJlc3RyaWN0ZWQ7IGFsc28sIG1heSBnZXQgYSBjb21wbGV0ZSBsaXN0XG4gICAgICAgICMgb2Yga2V5d29yZHMgYW5kIHRoZSBmZXcgc3BlY2lhbCBjaGFyYWN0ZXJzIChgLmAsIGAqYCwgLi4uKSBvdXQgb2YgKi5wa2NociBmaWxlcyAoc2VlXG4gICAgICAgICMgaHR0cHM6Ly93d3cuc3FsaXRlLm9yZy9kb2NzcmMvZmlsZT9jaT10cnVuayZuYW1lPWFydCUyRnN5bnRheCUyRmNyZWF0ZS10cmlnZ2VyLXN0bXQucGlrY2hyJnByb29mPTgwMjAyNDIzMCkgIyMjXG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NSRUFURScsICAgICAgICAgeyAgZml0OiAvXFxiQ1JFQVRFXFxiL2ksICAgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVEFCTEUnLCAgICAgICAgICB7ICBmaXQ6IC9cXGJUQUJMRVxcYi9pLCAgICAgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdWSUVXJywgICAgICAgICAgIHsgIGZpdDogL1xcYlZJRVdcXGIvaSwgICAgICAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1RSSUdHRVInLCAgICAgICAgeyAgZml0OiAvXFxiVFJJR0dFUlxcYi9pLCAgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnQkVHSU4nLCAgICAgICAgICB7ICBmaXQ6IC9cXGJCRUdJTlxcYi9pLCAgICAgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdDQVNFJywgICAgICAgICAgIHsgIGZpdDogL1xcYkNBU0VcXGIvaSwgICAgICAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0VORCcsICAgICAgICAgICAgeyAgZml0OiAvXFxiRU5EXFxiL2ksICAgICAgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnRVhDTFVTSVZFJywgICAgICB7ICBmaXQ6IC9cXGJFWENMVVNJVkVcXGIvaSwgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdERUZFUlJFRCcsICAgICAgIHsgIGZpdDogL1xcYkRFRkVSUkVEXFxiL2ksICAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0lNTUVESUFURScsICAgICAgeyAgZml0OiAvXFxiSU1NRURJQVRFXFxiL2ksICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVFJBTlNBQ1RJT04nLCAgICB7ICBmaXQ6IC9cXGJUUkFOU0FDVElPTlxcYi9pLCAgIH1cbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgIyB0b3AubmV3X3Rva2VuICAgICAgICAgJ1JFVFVSTklORycsICAgeyAgZml0OiAvXFxicmV0dXJuaW5nXFxiL2ksIGp1bXA6ICdXSVRIX0lEIScgfVxuICAgICAgICB0b3AubmV3X3Rva2VuICAgICAgICAgJ3dvcmQnLCAgICAgICAgICAgeyAgZml0OiAvW15cXHNcIidcXFs7XSsvLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3RyaW5nLm5ld190b2tlbiAgICAgICd0ZXh0JywgICAgICAgICAgIHsgIGZpdDogL1teJ10rLywgfVxuICAgICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3NpbmdsZV9xdW90ZScsICAgeyAgZml0OiBcIidcIiwganVtcDogJy4uJywgfVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGJya3RuYW1lLm5ld190b2tlbiAgICAnbmFtZScsICAgICAgICAgICB7ICBmaXQ6IC9bXlxcXV0rLywgfVxuICAgICAgICBicmt0bmFtZS5uZXdfdG9rZW4gICAgJ3JpZ2h0X2JyYWNrZXQnLCAgeyAgZml0OiAnXScsIGp1bXA6ICcuLicsIH1cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBkcW5hbWUubmV3X3Rva2VuICAgICAgJ25hbWUnLCAgICAgICAgICAgeyAgZml0OiAvW15cIl0rLywgfVxuICAgICAgICBkcW5hbWUubmV3X3Rva2VuICAgICAgJ2RvdWJsZV9xdW90ZScsICAgeyAgZml0OiAnXCInLCBqdW1wOiAnLi4nLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgbGNvbW1lbnQubmV3X3Rva2VuICAgICdjb21tZW50JywgICAgICAgIHsgIGZpdDogLy4qLywganVtcDogJy4uJyB9XG4gICAgICAgICMgbGNvbW1lbnQubmV3X3Rva2VuICAgICdlb2wnLCAgICAgICAgICAgIHsgIGZpdDogL1xcbnwvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjICMjIyBUQUlOVCB0aGlzIGlzIGluY29ycmVjdCwgaWRlbnRpZmllcnMgY2FuIHN0YXJ0IHdpdGggcXVvdGUsIGJyYWNrZXQsIGNvbnRhaW4gd3MsIHNlbWljb2xvbiAjIyNcbiAgICAgICAgIyBrd193aXRoX2lkLm5ld190b2tlbiAgICAnaWRlbnRpZmllcicsICAgeyAgZml0OiAvW147XSsvLCBqdW1wOiAnLi4nLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgYmNvbW1lbnQubmV3X3Rva2VuICAgICdzdGFyX3NsYXNoJywgICAgIHsgIGZpdDogJyovJywganVtcDogJy4uJywgfVxuICAgICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvXFwqKD8hXFwvKXxbXipdKy8sIH1cbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzY2FuOiAoIGxpbmUgKSAtPlxuICAgICAgICBmb3IgdG9rZW4gZnJvbSBAZy5zY2FuIGxpbmVcbiAgICAgICAgICAjIGRlYnVnICfOqV9fXzknLCB0b2tlblxuICAgICAgICAgIEBzdGF0ZW1lbnQgKz0gdG9rZW4uaGl0XG4gICAgICAgICAgaWYgdG9rZW4uZnFuYW1lIGlzICd0b3Auc2VtaWNvbG9uJ1xuICAgICAgICAgICAgeWllbGQgQHN0YXRlbWVudFxuICAgICAgICAgICAgQHN0YXRlbWVudCA9ICcnXG4gICAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmlzX3NpZ25hbFxuICAgICAgICAgICMgY29udGludWUgaWYgdG9rZW4uZnFuYW1lIGlzICd0b3Aud3MnXG4gICAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi5sZXZlbC5uYW1lIGlzICdsY29tbWVudCdcbiAgICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLmxldmVsLm5hbWUgaXMgJ2Jjb21tZW50J1xuICAgICAgICAgICMgdGFidWxhdGVfbGV4ZW1lIHRva2VuXG4gICAgICAgIDtudWxsXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU3RhdGVtZW50X2FwcGxpY2F0b3JcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKHsgZGIsIEdyYW1tYXIsIH0pIC0+XG4gICAgICAgIEBkYiAgICAgICAgICAgICAgID0gZGJcbiAgICAgICAgQHN0YXRlbWVudF9jb3VudCAgPSAwXG4gICAgICAgIEBzdGF0ZW1lbnQgICAgICAgID0gJydcbiAgICAgICAgQHN0YXRlbWVudF93YWxrZXIgPSBuZXcgU3RhdGVtZW50X3dhbGtlciB7IEdyYW1tYXIsIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNjYW46ICggbGluZSApIC0+XG4gICAgICAgIEBzdGF0ZW1lbnRfY291bnQgID0gMFxuICAgICAgICBmb3Igc3RhdGVtZW50X2NhbmRpZGF0ZSBmcm9tIEBzdGF0ZW1lbnRfd2Fsa2VyLnNjYW4gbGluZVxuICAgICAgICAgIEBzdGF0ZW1lbnQgKz0gc3RhdGVtZW50X2NhbmRpZGF0ZVxuICAgICAgICAgIGVycm9yICAgICAgID0gbnVsbFxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgQGRiLmV4ZWMgQHN0YXRlbWVudFxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICB0aHJvdyBlcnJvciB1bmxlc3MgZXJyb3IubWVzc2FnZSBpcyAnaW5jb21wbGV0ZSBpbnB1dCdcbiAgICAgICAgICB1bmxlc3MgZXJyb3I/XG4gICAgICAgICAgICB5aWVsZCBAc3RhdGVtZW50XG4gICAgICAgICAgICBAc3RhdGVtZW50ID0gJydcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICA7bnVsbFxuXG5cblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCB9XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IGludGVybmFscywgfVxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuJ3VzZSBzdHJpY3QnXG5cblxuXG5HVVkgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnZ3V5J1xueyBhbGVydFxuICBkZWJ1Z1xuICBoZWxwXG4gIGluZm9cbiAgcGxhaW5cbiAgcHJhaXNlXG4gIHVyZ2VcbiAgd2FyblxuICB3aGlzcGVyIH0gICAgICAgICAgICAgICA9IEdVWS50cm0uZ2V0X2xvZ2dlcnMgJ2ludGVybGV4L3Rlc3QtYmFzaWNzJ1xueyBycHJcbiAgaW5zcGVjdFxuICBlY2hvXG4gIHJldmVyc2VcbiAgbG9nICAgICB9ICAgICAgICAgICAgICAgPSBHVVkudHJtXG4jIFdHVVkgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi8uLi9hcHBzL3dlYmd1eSdcbkdUTkcgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi8uLi9hcHBzL2d1eS10ZXN0LU5HJ1xueyBUZXN0ICAgICAgICAgICAgICAgICAgfSA9IEdUTkdcbnsgZiB9ICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi8uLi9hcHBzL2VmZnN0cmluZydcblNRTCAgICAgICAgICAgICAgICAgICAgICAgPSBTdHJpbmcucmF3XG57IGNvbmRlbnNlX2xleGVtZXNcbiAgYWJicmx4bVxuICB0YWJ1bGF0ZV9sZXhlbWVzXG4gIHRhYnVsYXRlX2xleGVtZSAgICAgICB9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuIyB7IGludGVybmFsczogY3RfaW50ZXJuYWxzXG4jICAgaXNhXG4jICAgc3RkXG4jICAgdHlwZV9vZiAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuLi8uLi8uLi9hcHBzL2NsZWFydHlwZSdcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQGludGVybGV4X3Rhc2tzID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGxldmVsczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZGVtbzogLT5cbiAgICAgIHsgR3JhbW1hciB9ID0gcmVxdWlyZSAnLi4vLi4vLi4vYXBwcy9pbnRlcmxleCdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZG8gPT5cbiAgICAgICAgZyAgICAgICAgICAgPSBuZXcgR3JhbW1hcigpXG4gICAgICAgIHRvcCAgICAgICAgID0gZy5uZXdfbGV2ZWwgeyBuYW1lOiAndG9wJywgfVxuICAgICAgICBzdHJpbmcgICAgICA9IGcubmV3X2xldmVsIHsgbmFtZTogJ3N0cmluZycsIH1cbiAgICAgICAgZHFuYW1lICAgICAgPSBnLm5ld19sZXZlbCB7IG5hbWU6ICdkcW5hbWUnLCB9XG4gICAgICAgIGJya3RuYW1lICAgID0gZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYnJrdG5hbWUnLCB9XG4gICAgICAgIGxjb21tZW50ICAgID0gZy5uZXdfbGV2ZWwgeyBuYW1lOiAnbGNvbW1lbnQnLCB9XG4gICAgICAgIGJjb21tZW50ICAgID0gZy5uZXdfbGV2ZWwgeyBuYW1lOiAnYmNvbW1lbnQnLCB9XG4gICAgICAgICMga3dfd2l0aF9pZCAgPSBnLm5ld19sZXZlbCB7IG5hbWU6ICdXSVRIX0lEJywgfVxuXG4gICAgICAgICMjIyBOT1RFXG5cbiAgICAgICAgVGhlIGtleXdvcmQgYEJFR0lOYCAoYC9cXGJiZWdpblxcYi9pYCkgY2FuIGFwcGVhciBpbiBhIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IHdoZXJlIGl0XG4gICAgICAgIHVuZm9ydHVuYXRlbHkgbWF5IGJlIHByZWNlZGVkIGJ5IGFuIGV4cHJlc3Npb24gYW5kIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIHN0YXRlbWVudHMgZWFjaCBvZiB3aGljaFxuICAgICAgICBtdXN0IGJlIHRlcm1pbmF0ZWQgYnkgYSBzZW1pY29sb247IHRoZSBlbmQgb2YgdGhlIHN1cnJvdW5kaW5nIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50IGlzIHRoZW5cbiAgICAgICAgc2lnbmFsbGVkIGJ5IGFuIGBFTkRgIGtleXdvcmQgZm9sbG93ZWQgYnkgYSBzZW1pY29sb24uIFRoaXMgc2VlbXMgdG8gYmUgdGhlIG9ubHkgcGxhY2Ugd2hlcmUgU1FMaXRlXG4gICAgICAgIGFsbG93cyBhICdmcmVlJyBzZW1pY29sb24gdGhhdCBkb2VzIG5vdCBlbmQgYSB0b3AtbGV2ZWwgc3RhdGVtZW50LlxuXG4gICAgICAgIFRoZSBvbmx5IG90aGVyIHBsYWNlIHdoZXJlIEJFR0lOIG1heSBhcHBlYXIgaXMgaW4gYSBgQkVHSU4gVFJBTlNBQ1RJT05gIHN0YXRlbWVudCB3aGljaCBoYXMgYSBtdWNoXG4gICAgICAgIHNpbXBsZXIgc3RydWN0dXJlOlxuXG4gICAgICAgIGBgYFxuICAgICAgICAgICAgICBCRUdJTiDigJTigJQr4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUK+KAlOKAlCBUUkFOU0FDVElPTlxuICAgICAgICAgICAgICAgICAgICAgIHzigJQgRVhDTFVTSVZFICDigJR8XG4gICAgICAgICAgICAgICAgICAgICAgfOKAlCBERUZFUlJFRCAgIOKAlHxcbiAgICAgICAgICAgICAgICAgICAgICB84oCUIElNTUVESUFURSAg4oCUfFxuICAgICAgICBgYGBcblxuICAgICAgICBCdXQgaXQgZ2V0cyB3b3JzZSBiZWNhdXNlIFNRTGl0ZSBhY2NlcHRzIGBiZWdpbmAgZS5nLiBhcyB0YWJsZSBuYW1lOyB3aGVuIGR1bXBpbmcgYSBEQiwgaXQgd2lsbFxuICAgICAgICBxdW90ZSB0aGF0IG5hbWUgKnNvbWV0aW1lcyogYnV0IG5vdCBhbHdheXM6XG5cbiAgICAgICAgYGBgXG4gICAgICAgIENSRUFURSBUQUJMRSBiZWdpbiAoIGcgYm9vbCApO1xuICAgICAgICBJTlNFUlQgSU5UTyBcImJlZ2luXCIgVkFMVUVTKDEpO1xuICAgICAgICBgYGBcblxuICAgICAgICBGcm9tIHRoZSBsb29rcyBvZiBpdCwgdGhpcyAqc2hvdWxkKiB3b3JrIGlmIHdlIHNldCBhIGZsYWcgd2hlbiBzZWVpbmcgYSBgQkVHSU5gOyB3ZSB0aGVuIGV4cGVjdFxuICAgICAgICB3aGl0ZXNwYWNlLCBwb3NzaWJseSBhIG5ld2xpbmUsIGNvbW1lbnRzIGFuZCBtb3JlIHdoaXRlc3BhY2UsIHRoZW4gcG9zc2libHkgb25lIG9yIG1vcmUgb2ZcbiAgICAgICAgYEVYQ0xVU0lWRWAsIGBERUZFUlJFRGAsIGBJTU1FRElBVEVgLCBgVFJBTlNBQ1RJT05g4oCUaW4gd2hpY2ggY2FzZSBgQkVHSU5gIG11c3QgaGF2ZSBiZWVuIGF0XG4gICAgICAgIHRvcC1sZXZlbCBhbmQgdGhlIGZvbGxvd2luZyBiYXJlIHNlbWljb2xvbiBkb2VzIGluZGVlZCBzaWduYWwgZW5kLW9mLXN0YXRlbWVudC5cblxuICAgICAgICAgIE1heWJlIGltcG9ydGFudDogQ2hlY2sgZm9yIGZ1bmN0aW9uIGNhbGxzIGIvYyBVREZzIGFyZSBhbm90aGVyIHBsYWNlIHdoZXJlIGFyYml0cmFyeSBuZXcgbmFtZXMgbWF5XG4gICAgICAgICAgZ2V0IGludHJvZHVjZWQuXG5cbiAgICAgICAgICBNYXliZSBpbXBvcnRhbnQ6IGluIHRoZSBjYXNlIG9mIGEgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQsIHRoZSBgQkVHSU5gIC4uLiBgRU5EYCBwYXJ0IGlzXG4gICAgICAgICAgbWFuZGF0b3J5LCAqYW5kKiB0aGUgY29uY2x1ZGluZyB0b3AtbGV2ZWwgc2VtaWNvbG9uICptdXN0KiBiZSBwcmVjZWRlZCBieSBgRU5EYCwgb25seSBzZXBhcmF0ZWQgYnlcbiAgICAgICAgICBvcHRpb25hbCBjb21tZW50cyBhbmQgd2hpdGVzcGFjZS4gT3RoZXIgdGhhbiB0aGF0LCBpdCAqaXMqIHBvc3NpYmxlIHRvIGhhdmUgYW4gYGVuZGAgYXMgYW5cbiAgICAgICAgICBpZGVudGlmaWVyIHRvIGFwcGVhciBpbiBmcm9udCBvZiBhIHNlbWljb2xvbiwgYXMgYGRlbGV0ZSBmcm9tIGVuZCB3aGVyZSBlbmQgPSAneCcgcmV0dXJuaW5nIGVuZDtgXG4gICAgICAgICAgaXMgYSB2YWxpZCBzdGF0ZW1lbnQuIEhvd2V2ZXIsIHRoZSBgUkVUVVJOSU5HYCBjbGF1c2UgaXMgbm90IHZhbGlkIGluIHRoZSBjb25jbHVkaW5nIHBhcnQgb2YgYVxuICAgICAgICAgIGBDUkVBVEUgVFJJR0dFUmAgc3RhdGVtZW50LlxuXG4gICAgICAgICAgQXMgc3VjaCwgaXQgKnNob3VsZCogYmUgcG9zc2libGUgdG8gZmxhZyB0aGUgYmVnaW5uaW5nIG9mIGEgYENSRUFURSBUUklHR0VSYCBzdGF0ZW1lbnQgYW5kIHRoZW5cbiAgICAgICAgICBzcGVjaWZpY2FsbHkgd2FpdCBmb3IgdGhlIGBFTkRgLCBgO2Agc2VxdWVuY2UuXG5cbiAgICAgICAgRXJyb3ItUmVzaWxpZW50IFN0cmF0ZWdpZXMgKEVSUyk6XG4gICAgICAgICAgKiBvbiB0aGUgbGV4ZXIgbGV2ZWw6XG4gICAgICAgICAgICAqIGxvb3BcbiAgICAgICAgICAgICAgKiBicmVhayBpZiBlbmQgb2Ygc291cmNlIGhhcyBiZWVuIHJlYWNoZWRcbiAgICAgICAgICAgICAgKiBsb29wXG4gICAgICAgICAgICAgICAgKiBsZXggdW50aWwgYSBgdG9wLnNlbWljb2xvbmAgaXMgZW5jb3VudGVyZWQ7XG4gICAgICAgICAgICAgICAgKiB0cnkgdG8gZXhlY3V0ZSB0aGUgU1FMIHRvIHRoaXMgcG9pbnQ7XG4gICAgICAgICAgICAgICAgKiBpZiBleGVjdXRpb24gdGVybWluYXRlcyB3aXRob3V0IGVycm9yLCBicmVha1xuICAgICAgICAgICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAgICAgICAgICogY29udGludWUgdG8gbG9vcCwgcG9zc2libHkgd2l0aCBhIGd1YXJkIHRvIG9ubHkgZG8gdGhpcyAxIG9yIDIgdGltZXNcbiAgICAgICAgICAqIG9uIHRoZSBsZXhlcidzIGNvbnN1bWVyIGxldmVsOlxuICAgICAgICAgICAgKiBsb29wXG4gICAgICAgICAgICAgICogYnJlYWsgaWYgZW5kIG9mIHNvdXJjZSBoYXMgYmVlbiByZWFjaGVkXG4gICAgICAgICAgICAgICogbGV0IGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzIGJlIGFuIGVtcHR5IGxpc3RcbiAgICAgICAgICAgICAgKiBsb29wXG4gICAgICAgICAgICAgICAgKiBhcHBlbmQgbmV4dCBjYW5kaWRhdGUgc3RhdGVtZW50IHRvIGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzXG4gICAgICAgICAgICAgICAgKiB0cnkgdG8gZXhlY3V0ZSB0aGUgY29uY2F0ZW5hdGVkIGN1cnJlbnQgc3RhdGVtZW50IHBhcnRzXG4gICAgICAgICAgICAgICAgKiBpZiBleGVjdXRpb24gdGVybWluYXRlcyB3aXRob3V0IGVycm9yLCBicmVha1xuICAgICAgICAgICAgICAgICogdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yIGlzIGFuIGBpbmNvbXBsZXRlIGlucHV0YCBlcnJvclxuICAgICAgICAgICAgICAgICogY29udGludWUgdG8gbG9vcCwgcG9zc2libHkgd2l0aCBhIGd1YXJkIHRvIG9ubHkgZG8gdGhpcyAxIG9yIDIgdGltZXNcblxuICAgICAgICAjIyNcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB0b3AubmV3X3Rva2VuICAgICAgICdkb3VibGVfZGFzaCcsICAgIHsgIGZpdDogJy0tJywganVtcDogJ2xjb21tZW50IScsIH1cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2xhc2hfc3RhcicsICAgICB7ICBmaXQ6ICcvKicsIGp1bXA6ICdiY29tbWVudCEnLCB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnbGVmdF9wYXJlbicsICAgICB7ICBmaXQ6ICcoJywgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ3JpZ2h0X3BhcmVuJywgICAgeyAgZml0OiAnKScsIH1cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnc2VtaWNvbG9uJywgICAgICB7ICBmaXQ6ICc7JywgfVxuICAgICAgICB0b3AubmV3X3Rva2VuICAgICAgICdzaW5nbGVfcXVvdGUnLCAgIHsgIGZpdDogXCInXCIsIGp1bXA6ICdzdHJpbmchJywgfVxuICAgICAgICB0b3AubmV3X3Rva2VuICAgICAgICdsZWZ0X2JyYWNrZXQnLCAgIHsgIGZpdDogXCJbXCIsIGp1bXA6ICdicmt0bmFtZSEnLCB9XG4gICAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgJ2RvdWJsZV9xdW90ZScsICAgeyAgZml0OiAnXCInLCBqdW1wOiAnZHFuYW1lIScsIH1cbiAgICAgICAgdG9wLm5ld190b2tlbiAgICAgICAnd3MnLCAgICAgICAgICAgICB7ICBmaXQ6IC9cXHMrLywgfVxuICAgICAgICAjICMjIyBOT1RFIGFsbCBTUUwga2V5d29yZHMgYXJlIGAvXFxiW2Etel0rL2lgLCBzbyBtdWNoIG1vcmUgcmVzdHJpY3RlZDsgYWxzbywgbWF5IGdldCBhIGNvbXBsZXRlIGxpc3RcbiAgICAgICAgIyBvZiBrZXl3b3JkcyBhbmQgdGhlIGZldyBzcGVjaWFsIGNoYXJhY3RlcnMgKGAuYCwgYCpgLCAuLi4pIG91dCBvZiAqLnBrY2hyIGZpbGVzIChzZWVcbiAgICAgICAgIyBodHRwczovL3d3dy5zcWxpdGUub3JnL2RvY3NyYy9maWxlP2NpPXRydW5rJm5hbWU9YXJ0JTJGc3ludGF4JTJGY3JlYXRlLXRyaWdnZXItc3RtdC5waWtjaHImcHJvb2Y9ODAyMDI0MjMwKSAjIyNcbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnQ1JFQVRFJywgICAgICAgICB7ICBmaXQ6IC9cXGJDUkVBVEVcXGIvaSwgICAgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUQUJMRScsICAgICAgICAgIHsgIGZpdDogL1xcYlRBQkxFXFxiL2ksICAgICAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ1ZJRVcnLCAgICAgICAgICAgeyAgZml0OiAvXFxiVklFV1xcYi9pLCAgICAgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnVFJJR0dFUicsICAgICAgICB7ICBmaXQ6IC9cXGJUUklHR0VSXFxiL2ksICAgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdCRUdJTicsICAgICAgICAgIHsgIGZpdDogL1xcYkJFR0lOXFxiL2ksICAgICAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0NBU0UnLCAgICAgICAgICAgeyAgZml0OiAvXFxiQ0FTRVxcYi9pLCAgICAgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnRU5EJywgICAgICAgICAgICB7ICBmaXQ6IC9cXGJFTkRcXGIvaSwgICAgICAgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdFWENMVVNJVkUnLCAgICAgIHsgIGZpdDogL1xcYkVYQ0xVU0lWRVxcYi9pLCAgICAgfVxuICAgICAgICAjIHRvcC5uZXdfdG9rZW4gICAgICAgJ0RFRkVSUkVEJywgICAgICAgeyAgZml0OiAvXFxiREVGRVJSRURcXGIvaSwgICAgICB9XG4gICAgICAgICMgdG9wLm5ld190b2tlbiAgICAgICAnSU1NRURJQVRFJywgICAgICB7ICBmaXQ6IC9cXGJJTU1FRElBVEVcXGIvaSwgICAgIH1cbiAgICAgICAgIyB0b3AubmV3X3Rva2VuICAgICAgICdUUkFOU0FDVElPTicsICAgIHsgIGZpdDogL1xcYlRSQU5TQUNUSU9OXFxiL2ksICAgfVxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyAjIHRvcC5uZXdfdG9rZW4gICAgICAgICAnUkVUVVJOSU5HJywgICB7ICBmaXQ6IC9cXGJyZXR1cm5pbmdcXGIvaSwganVtcDogJ1dJVEhfSUQhJyB9XG4gICAgICAgIHRvcC5uZXdfdG9rZW4gICAgICAgICAnd29yZCcsICAgICAgICAgICB7ICBmaXQ6IC9bXlxcc1wiJ1xcWztdKy8sIH1cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzdHJpbmcubmV3X3Rva2VuICAgICAgJ3RleHQnLCAgICAgICAgICAgeyAgZml0OiAvW14nXSsvLCB9XG4gICAgICAgIHN0cmluZy5uZXdfdG9rZW4gICAgICAnc2luZ2xlX3F1b3RlJywgICB7ICBmaXQ6IFwiJ1wiLCBqdW1wOiAnLi4nLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgYnJrdG5hbWUubmV3X3Rva2VuICAgICduYW1lJywgICAgICAgICAgIHsgIGZpdDogL1teXFxdXSsvLCB9XG4gICAgICAgIGJya3RuYW1lLm5ld190b2tlbiAgICAncmlnaHRfYnJhY2tldCcsICB7ICBmaXQ6ICddJywganVtcDogJy4uJywgfVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGRxbmFtZS5uZXdfdG9rZW4gICAgICAnbmFtZScsICAgICAgICAgICB7ICBmaXQ6IC9bXlwiXSsvLCB9XG4gICAgICAgIGRxbmFtZS5uZXdfdG9rZW4gICAgICAnZG91YmxlX3F1b3RlJywgICB7ICBmaXQ6ICdcIicsIGp1bXA6ICcuLicsIH1cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBsY29tbWVudC5uZXdfdG9rZW4gICAgJ2NvbW1lbnQnLCAgICAgICAgeyAgZml0OiAvLiovLCBqdW1wOiAnLi4nIH1cbiAgICAgICAgIyBsY29tbWVudC5uZXdfdG9rZW4gICAgJ2VvbCcsICAgICAgICAgICAgeyAgZml0OiAvXFxufC8sIGp1bXA6ICcuLicsIH1cbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgIyMjIFRBSU5UIHRoaXMgaXMgaW5jb3JyZWN0LCBpZGVudGlmaWVycyBjYW4gc3RhcnQgd2l0aCBxdW90ZSwgYnJhY2tldCwgY29udGFpbiB3cywgc2VtaWNvbG9uICMjI1xuICAgICAgICAjIGt3X3dpdGhfaWQubmV3X3Rva2VuICAgICdpZGVudGlmaWVyJywgICB7ICBmaXQ6IC9bXjtdKy8sIGp1bXA6ICcuLicsIH1cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBiY29tbWVudC5uZXdfdG9rZW4gICAgJ3N0YXJfc2xhc2gnLCAgICAgeyAgZml0OiAnKi8nLCBqdW1wOiAnLi4nLCB9XG4gICAgICAgIGJjb21tZW50Lm5ld190b2tlbiAgICAnY29tbWVudCcsICAgICAgICB7ICBmaXQ6IC9cXCooPyFcXC8pfFteKl0rLywgfVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHNvdXJjZSA9IFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBcIm5hbWVzXCIgKFxuICAgICAgICAgICAgbmFtZSB0ZXh0IHVuaXF1ZSBub3QgbnVsbCxcbiAgICAgICAgICAgIFwibm8tY29tbWVudFtcIiAvKiBiY29tbWVudCEgKi8gdGV4dCBub3QgbnVsbCBkZWZhdWx0ICdubztjb21tZW50JywgLS0gbGNvbW1lbnQgYnJvdGhlclxuICAgICAgICAgICAgW3V1dWdoLi4uLl0gaW50ZWdlciApO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMjIyBBbGFzLCBhIHZhbGlkIHN0YXRlbWVudCAoYWx0aG91Z2ggcHJvYmFibHkgbm90IG9uZSB0aGF0IGNhbiBhcHBlYXIgaW4gcmVndWxhciBkdW1wIGZpbGUpICMjI1xuICAgICAgICBzb3VyY2UgPSBTUUxcIlwiXCJkZWxldGUgZnJvbSBlbmQgd2hlcmUgZW5kID0gJ3gnIHJldHVybmluZyBlbmQ7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc291cmNlID0gU1FMXCJcIlwiYmVnaW4gaW1tZWRpYXRlIHRyYW5zYWN0aW9uO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHNvdXJjZSA9IFNRTFwiXCJcIlxuICAgICAgICAgIGJlZ2luIGltbWVkaWF0ZSB0cmFuc2FjdGlvbjtcbiAgICAgICAgICBDUkVBVEUgVFJJR0dFUiBqenJfbWlycm9yX3RyaXBsZXNfcmVnaXN0ZXJcbiAgICAgICAgICBiZWZvcmUgaW5zZXJ0IG9uIGp6cl9taXJyb3JfdHJpcGxlc19iYXNlXG4gICAgICAgICAgZm9yIGVhY2ggcm93IGJlZ2luXG4gICAgICAgICAgICBzZWxlY3QgdHJpZ2dlcl9vbl9iZWZvcmVfaW5zZXJ0KCAnanpyX21pcnJvcl90cmlwbGVzX2Jhc2UnLCBuZXcucm93aWQsIG5ldy5yZWYsIG5ldy5zLCBuZXcudiwgbmV3Lm8gKTtcbiAgICAgICAgICAgIGVuZCAvKmNvbW1lbnQgKi8gLS0gbmV3bGluZSFcbiAgICAgICAgICAgIDtcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzdGF0ZW1lbnRzX2xpc3QgPSBbXVxuICAgICAgICBzdGF0ZW1lbnQgICAgICAgPSAnJ1xuICAgICAgICBmb3IgbGluZSBpbiBzb3VyY2Uuc3BsaXQgJy9uJ1xuICAgICAgICAgIGZvciB0b2tlbiBmcm9tIGcuc2NhbiBsaW5lXG4gICAgICAgICAgICAjIGRlYnVnICfOqV9fXzknLCB0b2tlblxuICAgICAgICAgICAgc3RhdGVtZW50ICs9IHRva2VuLmhpdFxuICAgICAgICAgICAgaWYgdG9rZW4uZnFuYW1lIGlzICd0b3Auc2VtaWNvbG9uJ1xuICAgICAgICAgICAgICBzdGF0ZW1lbnRzX2xpc3QucHVzaCBzdGF0ZW1lbnRcbiAgICAgICAgICAgICAgc3RhdGVtZW50ID0gJydcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgY29udGludWUgaWYgdG9rZW4uaXNfc2lnbmFsXG4gICAgICAgICAgICBjb250aW51ZSBpZiB0b2tlbi5mcW5hbWUgaXMgJ3RvcC53cydcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHRva2VuLmxldmVsLm5hbWUgaXMgJ2xjb21tZW50J1xuICAgICAgICAgICAgY29udGludWUgaWYgdG9rZW4ubGV2ZWwubmFtZSBpcyAnYmNvbW1lbnQnXG4gICAgICAgICAgICB0YWJ1bGF0ZV9sZXhlbWUgdG9rZW5cbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBzdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgICBlY2hvICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gICAgICAgICAgZWNobyAoICdcXG4nICsgR1VZLnRybS5yZXZlcnNlIEdVWS50cm0ud2hpdGUgXCIgI3tzdGF0ZW1lbnR9IFwiIClcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIyAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgICB0b3AgICAgID0gZy5uZXdfbGV2ZWwgeyBuYW1lOiAndG9wJywgfVxuICAgICAgIyAgIHRvcC5uZXdfdG9rZW4gICAgIHsgbmFtZTogJ290aGVyJywgICAgICBmaXQ6IC9bXlwiXSsvLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgIyAgIHRvcC5uZXdfdG9rZW4gICAgIHsgbmFtZTogJ2RxJywgICAgICAgICBmaXQ6IC9cIi8sICAgICAgICAgICAgIGp1bXA6ICdkcXN0cmluZyEnLCAgfVxuICAgICAgIyAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgICBkcXN0cmluZyAgPSBnLm5ld19sZXZlbCB7IG5hbWU6ICdkcXN0cmluZycsIH1cbiAgICAgICMgICBkcXN0cmluZy5uZXdfdG9rZW4gIHsgbmFtZTogJ290aGVyJywgICAgICBmaXQ6IC9bXlwiXSsvLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgIyAgIGRxc3RyaW5nLm5ld190b2tlbiAgeyBuYW1lOiAnZHEnLCAgICAgICAgIGZpdDogL1wiLywgICAgICAgICAgICAganVtcDogJy4uJyAgICAgICAgICB9XG4gICAgICAjIHRleHQubmV3X3Rva2VuICAgIHsgbmFtZTogJ3RleHQnLCAgICAgICAgIGZpdDogLy8vIFxcXFwgXFxwe0RlY2ltYWxfTnVtYmVyfSB8IFxccHtMZXR0ZXJ9IC8vL3YsICAgICAgICAgICAgICAgICB9XG4gICAgICAjIHRleHQubmV3X3Rva2VuICAgIHsgbmFtZTogJ3dzJywgICAgICAgICAgIGZpdDogLy8vIFxccHtXaGl0ZV9TcGFjZX0gICAgICAgICAgICAgICAgICAgIC8vL3YsICAgICAgICAgICAgICAgICB9XG4gICAgICAjIHRleHQubmV3X3Rva2VuICAgIHsgbmFtZTogJ251bWJlcl9zdGFydCcsIGZpdDogLy8vICg/PSAoPyE8IFxcXFwgKSBcXHB7RGVjaW1hbF9OdW1iZXJ9ICkgLy8vdiwganVtcDogJ251bWJlcicsIH1cbiAgICAgICMgbnVtYmVyLm5ld190b2tlbiAgeyBuYW1lOiAnZGlnaXQnLCAgICAgICAgZml0OiAvLy8gXFxwe0RlY2ltYWxfTnVtYmVyfSB8IFxcLiB8IGUgICAgICAgIC8vL3YsICAgICAgICAgICAgICAgICB9XG4gICAgICAjIG51bWJlci5uZXdfdG9rZW4gIHsgbmFtZTogJ251bWJlcl9zdG9wJywgIGZpdDogLy8vICg/PSBcXFB7RGVjaW1hbF9OdW1iZXJ9ICkgICAgICAgICAgIC8vL3YsIGp1bXA6ICcuLicsICAgICB9XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyB0ZXh0Lm5ld190b2tlbiB7IG5hbWU6ICduYW1lJywgZml0OiAvLy8gKD88aW5pdGlhbD4gXFxwe1VwcGVyY2FzZV9MZXR0ZXJ9ICkgXFxwe0xvd2VyY2FzZV9MZXR0ZXJ9KyAvLy92LCBtZXJnZTogdHJ1ZSwgICAgfVxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cblxuXG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyBnbmQubmV3X3Rva2VuICAgICAgIHsgbmFtZTogJ25hbWUnLCAgICAgICAgICAgZml0OiByeFwiKD88aW5pdGlhbD5bQS1aXSlbYS16XSpcIiwgfVxuICAgICAgIyBnbmQubmV3X3Rva2VuICAgICAgIHsgbmFtZTogJ251bWJlcicsICAgICAgICAgZml0OiByeFwiWzAtOV0rXCIsICAgICAgICAgICAgICAgICAgfVxuICAgICAgIyBnbmQubmV3X3Rva2VuICAgICAgIHsgbmFtZTogJ3BhcmVuX3N0YXJ0JywgICAgZml0OiByeFwiXFwoXCIsICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICMgZ25kLm5ld190b2tlbiAgICAgICB7IG5hbWU6ICdwYXJlbl9zdG9wJywgICAgIGZpdDogcnhcIlxcKVwiLCAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAjIGduZC5uZXdfdG9rZW4gICAgICAgeyBuYW1lOiAnb3RoZXInLCAgICAgICAgICBmaXQ6IHJ4XCJbQS1aYS16MC05XStcIiwgICAgICAgICAgICB9XG4gICAgICAjIGduZC5uZXdfdG9rZW4gICAgICAgeyBuYW1lOiAnd3MnLCAgICAgICAgICAgICBmaXQ6IHJ4XCJcXHMrXCIsICAgICAgICAgICAgICAgICAgICAgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pZiBtb2R1bGUgaXMgcmVxdWlyZS5tYWluIHRoZW4gYXdhaXQgZG8gPT5cbiAgZ3V5dGVzdF9jZmcgPSB7IHRocm93X29uX2Vycm9yOiBmYWxzZSwgc2hvd19wYXNzZXM6IGZhbHNlLCByZXBvcnRfY2hlY2tzOiBmYWxzZSwgfVxuICBndXl0ZXN0X2NmZyA9IHsgdGhyb3dfb25fZXJyb3I6IHRydWUsIHNob3dfcGFzc2VzOiBmYWxzZSwgcmVwb3J0X2NoZWNrczogZmFsc2UsIH1cbiAgIyBndXl0ZXN0X2NmZyA9IHsgdGhyb3dfb25fZXJyb3I6IGZhbHNlLCBzaG93X3Bhc3NlczogdHJ1ZSwgcmVwb3J0X2NoZWNrczogdHJ1ZSwgfVxuICAoIG5ldyBUZXN0IGd1eXRlc3RfY2ZnICkudGVzdCBAaW50ZXJsZXhfdGFza3NcbiJdfQ==
