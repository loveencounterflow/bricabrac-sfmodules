'use strict'

### NOTE

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

###

############################################################################################################
#
#===========================================================================================================
### NOTE Future Single-File Module ###
require_coarse_sqlite_statement_segmenter = ->

  #=========================================================================================================
  { Grammar,                    } = require 'interlex'
  SFMODULES                       = require './main'
  { type_of,                    } = SFMODULES.unstable.require_type_of()
  { rpr_string,                 } = SFMODULES.require_rpr_string()
  { debug,
    warn                        } = console
  # { hide,
  #   set_getter,                 } = SFMODULES.require_managed_property_tools()
  # # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
  # { lets,
  #   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
  # SQLITE                          = require 'node:sqlite'
  # misfit                          = Symbol 'misfit'
  # { get_prototype_chain,
  #   get_all_in_prototype_chain, } = SFMODULES.unstable.require_get_prototype_chain()
  #.........................................................................................................
  ### TAINT move to bric ###
  bind                            = ( ctx, fn ) -> fn.bind ctx
  internals = {}

  #=========================================================================================================
  class Segmenter

    #-------------------------------------------------------------------------------------------------------
    constructor: ->
      @_create_lexer()
      @statement = ''
      ;undefined

    #-------------------------------------------------------------------------------------------------------
    _create_lexer: ->
      @g          = new Grammar()
      top         = @g.new_level { name: 'top', }
      string      = @g.new_level { name: 'string', }
      dqname      = @g.new_level { name: 'dqname', }
      brktname    = @g.new_level { name: 'brktname', }
      lcomment    = @g.new_level { name: 'lcomment', }
      bcomment    = @g.new_level { name: 'bcomment', }
      #.....................................................................................................
      top.new_token       'double_dash',    {  fit: '--', jump: 'lcomment!', }
      top.new_token       'slash_star',     {  fit: '/*', jump: 'bcomment!', }
      # top.new_token       'left_paren',     {  fit: '(', }
      # top.new_token       'right_paren',    {  fit: ')', }
      top.new_token       'semicolon',      {  fit: ';', }
      top.new_token       'single_quote',   {  fit: "'", jump: 'string!', }
      top.new_token       'left_bracket',   {  fit: "[", jump: 'brktname!', }
      top.new_token       'double_quote',   {  fit: '"', jump: 'dqname!', }
      top.new_token       'ws',             {  fit: /\s+/, }
      # ### NOTE all SQL keywords are `/\b[a-z]+/i`, so much more restricted; also, may get a complete list
      # of keywords and the few special characters (`.`, `*`, ...) out of *.pkchr files (see
      # https://www.sqlite.org/docsrc/file?ci=trunk&name=art%2Fsyntax%2Fcreate-trigger-stmt.pikchr&proof=802024230) ###
      # #...................................................................................................
      # top.new_token       'CREATE',         {  fit: /\bCREATE\b/i,        }
      # top.new_token       'TABLE',          {  fit: /\bTABLE\b/i,         }
      # top.new_token       'VIEW',           {  fit: /\bVIEW\b/i,          }
      # top.new_token       'TRIGGER',        {  fit: /\bTRIGGER\b/i,       }
      # top.new_token       'BEGIN',          {  fit: /\bBEGIN\b/i,         }
      # top.new_token       'CASE',           {  fit: /\bCASE\b/i,          }
      # top.new_token       'END',            {  fit: /\bEND\b/i,           }
      # top.new_token       'EXCLUSIVE',      {  fit: /\bEXCLUSIVE\b/i,     }
      # top.new_token       'DEFERRED',       {  fit: /\bDEFERRED\b/i,      }
      # top.new_token       'IMMEDIATE',      {  fit: /\bIMMEDIATE\b/i,     }
      # top.new_token       'TRANSACTION',    {  fit: /\bTRANSACTION\b/i,   }
      # #...................................................................................................
      # # top.new_token         'RETURNING',   {  fit: /\breturning\b/i, jump: 'WITH_ID!' }
      top.new_token         'word',           {  fit: /[^\s"'\[;]+/, }
      #.....................................................................................................
      string.new_token      'text',           {  fit: /[^']+/, }
      string.new_token      'single_quote',   {  fit: "'", jump: '..', }
      #.....................................................................................................
      brktname.new_token    'name',           {  fit: /[^\]]+/, }
      brktname.new_token    'right_bracket',  {  fit: ']', jump: '..', }
      #.....................................................................................................
      dqname.new_token      'name',           {  fit: /[^"]+/, }
      dqname.new_token      'double_quote',   {  fit: '"', jump: '..', }
      #.....................................................................................................
      lcomment.new_token    'comment',        {  fit: /.*/, jump: '..' }
      # lcomment.new_token    'eol',            {  fit: /\n|/, jump: '..', }
      # #...................................................................................................
      # ### TAINT this is incorrect, identifiers can start with quote, bracket, contain ws, semicolon ###
      # kw_with_id.new_token    'identifier',   {  fit: /[^;]+/, jump: '..', }
      #.....................................................................................................
      bcomment.new_token    'star_slash',     {  fit: '*/', jump: '..', }
      bcomment.new_token    'comment',        {  fit: /\*(?!\/)|[^*]+/, }
      ;null

    #-------------------------------------------------------------------------------------------------------
    scan: ( line ) ->
      throw new Error "Ωcsql___2 expected a text, got a #{type}" unless ( type = type_of line ) is 'text'
      return do bind @, ->
        line += '\n' unless line.endsWith '\n'
        for token from @g.scan line
          @statement += token.hit
          if token.fqname is 'top.semicolon'
            yield @statement
            @statement = ''
        ;null
        # #...............................................................................................
        # continue if token.is_signal
        # continue if token.fqname is 'top.ws'
        # continue if token.level.name is 'lcomment'
        # continue if token.level.name is 'bcomment'
        # tabulate_lexeme token

    #-------------------------------------------------------------------------------------------------------
    scan_tokens: ( line ) ->
      throw new Error "Ωcsql___3 expected a text, got a #{type}" unless ( type = type_of line ) is 'text'
      return do bind @, -> yield from @g.scan line


  #=========================================================================================================
  class Undumper

    #-------------------------------------------------------------------------------------------------------
    constructor: ({ db, }) ->
      @db               = db
      @_execute         = ( @db.exec ? @db.execute ).bind @db
      @statement_count  = 0
      @statement        = ''
      @statement_walker = new Segmenter { Grammar, }
      return undefined

    #-------------------------------------------------------------------------------------------------------
    scan: ( line ) ->
      @statement_count  = 0
      for statement_candidate from @statement_walker.scan line
        @statement += statement_candidate
        cause       = null
        try
          @_execute @statement
        catch cause
          continue if cause.message is 'incomplete input'
          throw new Error "Ωcsql___4 when trying to execute SQL statement #{rpr_string @statement}," \
            + " an error was thrown: #{rpr_string cause.message}", { cause, }
        unless cause?
          yield @statement
          @statement = ''
          @statement_count++
      ;null




  #=========================================================================================================
  internals = Object.freeze { internals..., }
  return exports = { Segmenter, Undumper, internals, }

module.exports = { require_coarse_sqlite_statement_segmenter, }


