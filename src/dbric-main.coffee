'use strict'

############################################################################################################
#
#===========================================================================================================
SFMODULES                       = require './main'
{ hide,
  set_getter,                 } = SFMODULES.require_managed_property_tools()
{ type_of,                    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ rpr,                        } = ( require './loupe-brics' ).require_loupe()
{ lets,
  freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
{ nfa,                        } = require 'normalize-function-arguments'
SQLITE                          = require 'node:sqlite'
{ debug,
  warn                        } = console
misfit                          = Symbol 'misfit'
{ get_prototype_chain,
  get_all_in_prototype_chain, } = SFMODULES.unstable.require_get_prototype_chain()
{ Undumper,                   } = SFMODULES.require_coarse_sqlite_statement_segmenter()
{ E,                          } = require './dbric-errors'
#-----------------------------------------------------------------------------------------------------------
{ True,
  False,
  from_bool,
  as_bool,
  unquote_name,
  IDN,
  LIT,
  VEC,
  SQL,                        } = require './dbric-utilities'


#-----------------------------------------------------------------------------------------------------------
### TAINT put into separate module ###
### TAINT rewrite with `get_all_in_prototype_chain()` ###
### TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` ###
get_property_descriptor = ( x, name, fallback = misfit ) ->
  while x?
    return R if ( R = Object.getOwnPropertyDescriptor x, name )?
    x = Object.getPrototypeOf x
  return fallback unless fallback is misfit
  throw new Error "unable to find descriptor for property #{String(name)} not found on object or its prototypes"

#-----------------------------------------------------------------------------------------------------------
build_statement_re = ///
  ^ \s*
  insert | (
    ( create | alter ) \s+
    (?<type> table | view | index | trigger ) \s+
    (?<name> \S+ ) \s+
    )
  ///is

#-----------------------------------------------------------------------------------------------------------
templates =
  create_function_cfg:
    deterministic:  true
    varargs:        false
    directOnly:     false
    overwrite:      false
  #.........................................................................................................
  create_aggregate_function_cfg:
    deterministic:  true
    varargs:        false
    directOnly:     false
    start:          null
    overwrite:      false
  #.........................................................................................................
  create_window_function_cfg:
    deterministic:  true
    varargs:        false
    directOnly:     false
    start:          null
    overwrite:      false
  #.........................................................................................................
  create_table_function_cfg:
    deterministic:  true
    varargs:        false
    directOnly:     false
    overwrite:      false
  #.........................................................................................................
  create_virtual_table_cfg: {}



#===========================================================================================================
class Dbric_classprop_absorber

  #---------------------------------------------------------------------------------------------------------
  @_get_build_statements_in_prototype_chain: -> ( get_all_in_prototype_chain @, 'build' ).reverse()

  #---------------------------------------------------------------------------------------------------------
  _get_objects_in_build_statements: ->
    ### TAINT does not yet deal with quoted names ###
    clasz                 = @constructor
    db_objects            = {}
    statement_count       = 0
    error_count           = 0
    build_statements_list = clasz._get_build_statements_in_prototype_chain()
    for build_statements in build_statements_list
      continue unless build_statements?
      for statement in build_statements
        switch type = type_of statement
          when 'function'
            statement = statement.call @
            unless ( type = type_of statement ) is 'text'
              throw new E.Dbric_expected_string_or_string_val_fn 'Ωdbricm___1', type
          when 'text' then null
          else throw new E.Dbric_expected_string_or_string_val_fn 'Ωdbricm___2', type
        statement_count++
        if ( match = statement.match build_statement_re )?
          { name,
            type, }           = match.groups
          continue unless name? ### NOTE ignore statements like `insert` ###
          name                = unquote_name name
          db_objects[ name ]  = { name, type, }
        else
          error_count++
          name                = "error_#{statement_count}"
          type                = 'error'
          message             = "non-conformant statement: #{rpr statement}"
          db_objects[ name ]  = { name, type, message, }
    return { error_count, statement_count, db_objects, }

  #---------------------------------------------------------------------------------------------------------
  _prepare_statements: ->
    clasz = @constructor
    statements_list = ( get_all_in_prototype_chain clasz, 'statements' ).reverse()
    for statements in statements_list
      for statement_name, statement of statements
        if @statements[ statement_name ]?
          throw new Error "Ωdbricm___3 statement #{rpr statement_name} is already declared"
        @statements[ statement_name ] = @prepare statement
    return null

  #---------------------------------------------------------------------------------------------------------
  _create_udfs: ->
    clasz               = @constructor
    ### TAINT should be put somewhere else? ###
    names_of_callables  =
      function:             [ 'value', ]
      aggregate_function:   [ 'start', 'step', 'result', ]
      window_function:      [ 'start', 'step', 'inverse', 'result', ]
      table_function:       [ 'rows', ]
      virtual_table:        [ 'rows', ]
    #.......................................................................................................
    for category in [ 'function', \
      'aggregate_function', 'window_function', 'table_function', 'virtual_table', ]
      property_name     = "#{category}s"
      method_name       = "create_#{category}"
      declarations_list = ( get_all_in_prototype_chain clasz, property_name ).reverse()
      for declarations in declarations_list
        continue unless declarations?
        #...................................................................................................
        for udf_name, fn_cfg of declarations
          #.................................................................................................
          fn_cfg = lets fn_cfg, ( d ) =>
            d.name ?= udf_name
            #...............................................................................................
            ### bind UDFs to `this` ###
            for name_of_callable in names_of_callables[ category ]
              continue unless ( callable = d[ name_of_callable ] )?
              d[ name_of_callable ] = callable.bind @
            return null
          @[ method_name ] fn_cfg
    #.......................................................................................................
    return null


#===========================================================================================================
class Dbric extends Dbric_classprop_absorber

  #---------------------------------------------------------------------------------------------------------
  @cfg: freeze
    prefix: '(NOPREFIX)'
  @functions:   {}
  @statements:  {}
  @build:       null
  @db_class:    SQLITE.DatabaseSync

  #---------------------------------------------------------------------------------------------------------
  ### TAINT use normalize-function-arguments ###
  constructor: ( db_path, cfg ) ->
    super()
    @_validate_is_property 'is_ready'
    @_validate_is_property 'prefix'
    @_validate_is_property 'prefix_re'
    #.......................................................................................................
    db_path                  ?= ':memory:'
    #.......................................................................................................
    clasz                     = @constructor
    db_class                  = ( cfg?.db_class ) ? clasz.db_class
    hide @, 'db',               new db_class db_path
    # @db                       = new SQLITE.DatabaseSync db_path
    @cfg                      = freeze { clasz.cfg..., db_path, cfg..., }
    hide @, 'statements',       {}
    hide @, '_w',               null
    hide @, '_statement_class', ( @db.prepare SQL"select 1;" ).constructor
    hide @, 'state',            ( cfg?.state ) ? { columns: null, }
    #.......................................................................................................
    @run_standard_pragmas()
    @initialize()
    #.......................................................................................................
    fn_cfg_template = { deterministic: true, varargs: false, }
    @_create_udfs()
    #.......................................................................................................
    ### NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
    contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
    the instance. ###
    @is_fresh = not @is_ready
    @build()
    @_prepare_statements()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa_statement: ( x ) -> x instanceof @_statement_class

  #---------------------------------------------------------------------------------------------------------
  run_standard_pragmas: ->
    ### not using `@db.pragma` as it is only provided by `better-sqlite3`'s DB class ###
    ( @db.prepare SQL"pragma journal_mode = wal;"   ).run()
    ( @db.prepare SQL"pragma foreign_keys = on;"    ).run()
    ( @db.prepare SQL"pragma busy_timeout = 60000;" ).run() ### time in ms ###
    ( @db.prepare SQL"pragma strict       = on;"    ).run()
    # @db.pragma SQL"journal_mode = wal"
    # @db.pragma SQL"foreign_keys = on"
    return null

  #---------------------------------------------------------------------------------------------------------
  initialize: ->
    ### This method will be called *before* any build statements are executed and before any statements
    in `@constructor.statements` are prepared and is a good place to create user-defined functions
    (UDFs). You probably want to override it with a method that starts with `super()`. ###
    return null

  #---------------------------------------------------------------------------------------------------------
  _validate_is_property: ( name ) ->
    descriptor = get_property_descriptor @, name
    return null if ( type_of descriptor.get ) is 'function'
    throw new Error "Ωdbricm___4 not allowed to override property #{rpr name}; use '_get_#{name} instead"

  #---------------------------------------------------------------------------------------------------------
  _get_db_objects: ->
    R = {}
    for dbo from ( @db.prepare SQL"select name, type from sqlite_schema" ).iterate()
      R[ dbo.name ] = { name: dbo.name, type: dbo.type, }
    return R

  #---------------------------------------------------------------------------------------------------------
  teardown: ({ test = null, }={}) ->
    count       = 0
    #.......................................................................................................
    switch true
      when test is '*'
        test = ( name ) -> true
      when ( type_of test ) is 'function'
        null
      when not test?
        prefix_re = @prefix_re
        test = ( name ) -> prefix_re.test name
      else
        type = type_of test
        throw new Error "Ωdbricm___5 expected `'*'`, a RegExp, a function, null or undefined, got a #{type}"
    #.......................................................................................................
    ( @prepare SQL"pragma foreign_keys = off;" ).run()
    for _, { name, type, } of @_get_db_objects()
      continue unless test name
      count++
      try
        ( @prepare SQL"drop #{type} #{IDN name};" ).run()
      catch error
        warn "Ωdbricm___6 ignored error: #{error.message}" unless /// no \s+ such \s+ #{type}: ///.test error.message
    ( @prepare SQL"pragma foreign_keys = on;" ).run()
    return count

  #---------------------------------------------------------------------------------------------------------
  build: -> if @is_ready then 0 else @rebuild()

  #---------------------------------------------------------------------------------------------------------
  rebuild: ->
    clasz                 = @constructor
    count                 = 0
    build_statements_list = clasz._get_build_statements_in_prototype_chain()
    has_torn_down         = false
    #.......................................................................................................
    for build_statements in build_statements_list
      ### TAINT use proper validation ###
      unless ( type = type_of build_statements ) in [ 'undefined', 'null', 'list', ]
        throw new Error "Ωdbricm___7 expected an optional list for #{clasz.name}.build, got a #{type}"
      #.....................................................................................................
      continue if ( not build_statements? ) or ( build_statements.length is 0 )
      #.....................................................................................................
      @teardown() unless has_torn_down
      has_torn_down = true
      #.....................................................................................................
      for build_statement in build_statements
        count++
        ( @prepare build_statement ).run()
    #.......................................................................................................
    return count

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'super',            -> Object.getPrototypeOf @constructor
  set_getter @::, 'is_ready',         -> @_get_is_ready()
  set_getter @::, 'prefix',           -> @_get_prefix()
  set_getter @::, 'prefix_re',        -> @_get_prefix_re()
  set_getter @::, '_function_names',  -> @_get_function_names()
  set_getter @::, 'w',                -> @_get_w()

  #---------------------------------------------------------------------------------------------------------
  _get_is_ready: ->
    { error_count,
      statement_count,
      db_objects: expected_db_objects, } = @_get_objects_in_build_statements()
    #.......................................................................................................
    if error_count isnt 0
      messages = []
      for name, { type, message, } of expected_db_objects
        continue unless type is 'error'
        messages.push message
      throw new Error "Ωdbricm___8 #{error_count} out of #{statement_count} build statement(s) could not be parsed: #{rpr messages}"
    #.......................................................................................................
    present_db_objects = @_get_db_objects()
    for name, { type: expected_type, } of expected_db_objects
      return false unless present_db_objects[ name ]?.type is expected_type
    return true

  #---------------------------------------------------------------------------------------------------------
  _get_prefix: ->
    return '' if ( not @cfg.prefix? ) or ( @cfg.prefix is '(NOPREFIX)' )
    return @cfg.prefix

  #---------------------------------------------------------------------------------------------------------
  _get_prefix_re: ->
    return /|/ if @prefix is ''
    return /// ^ _? #{RegExp.escape @prefix} _ .* $ ///

  #---------------------------------------------------------------------------------------------------------
  _get_w: ->
    return @_w if @_w?
    @_w = new @constructor @cfg.db_path, { db_class: @db.constructor, state: @state, }
    return @_w

  #---------------------------------------------------------------------------------------------------------
  _get_function_names: -> new Set ( name for { name, } from \
    @walk SQL"select name from pragma_function_list() order by name;" )

  #---------------------------------------------------------------------------------------------------------
  execute: ( sql ) -> @db.exec sql

  #---------------------------------------------------------------------------------------------------------
  walk:       ( sql, P... ) -> ( @prepare sql ).iterate P...
  get_all:    ( sql, P... ) -> [ ( @walk sql, P... )..., ]
  get_first:  ( sql, P... ) -> ( @get_all sql, P... )[ 0 ] ? null

  #---------------------------------------------------------------------------------------------------------
  prepare: ( sql ) ->
    return sql if @isa_statement sql
    unless ( type = type_of sql ) is 'text'
      throw new Error "Ωdbricm___9 expected a statement or a text, got a #{type}"
    try
      R = @db.prepare sql
    catch cause
      throw new Error "Ωdbricm__10 when trying to prepare the following statement, an error with message: #{rpr cause.message} was thrown: #{rpr sql}", { cause, }
    @state.columns = ( try R?.columns?() catch error then null ) ? []
    return R

  #=========================================================================================================
  # FUNCTIONS
  #---------------------------------------------------------------------------------------------------------
  create_function: ( cfg ) ->
    if ( type_of @db.function ) isnt 'function'
      throw new Error "Ωdbricm__11 DB adapter class #{rpr @db.constructor.name} does not provide user-defined functions"
    { name,
      overwrite,
      value,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__12 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.function name, { deterministic, varargs, directOnly, }, value

  #---------------------------------------------------------------------------------------------------------
  create_aggregate_function: ( cfg ) ->
    if ( type_of @db.aggregate ) isnt 'function'
      throw new Error "Ωdbricm__13 DB adapter class #{rpr @db.constructor.name} does not provide user-defined aggregate functions"
    { name,
      overwrite,
      start,
      step,
      result,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_aggregate_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__14 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_window_function: ( cfg ) ->
    if ( type_of @db.aggregate ) isnt 'function'
      throw new Error "Ωdbricm__15 DB adapter class #{rpr @db.constructor.name} does not provide user-defined window functions"
    { name,
      overwrite,
      start,
      step,
      inverse,
      result,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_window_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__16 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, inverse, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_table_function: ( cfg ) ->
    if ( type_of @db.table ) isnt 'function'
      throw new Error "Ωdbricm__17 DB adapter class #{rpr @db.constructor.name} does not provide table-valued user-defined functions"
    { name,
      overwrite,
      parameters,
      columns,
      rows,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_table_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__18 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.table name, { parameters, columns, rows, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_virtual_table: ( cfg ) ->
    if ( type_of @db.table ) isnt 'function'
      throw new Error "Ωdbricm__19 DB adapter class #{rpr @db.constructor.name} does not provide user-defined virtual tables"
    { name,
      overwrite,
      create,   } = { templates.create_virtual_table_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__20 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.table name, create




#===========================================================================================================
module.exports = {
  Dbric,
  SQL,
  IDN,
  LIT,
  SQL,
  VEC,
  True,
  False,
  as_bool,
  from_bool,
  unquote_name,
  internals: freeze {
    E,
    type_of,
    build_statement_re,
    templates, }
  }



