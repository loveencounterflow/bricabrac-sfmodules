'use strict'

############################################################################################################
#
#===========================================================================================================
{ debug,
  warn                        } = console
#...........................................................................................................
# Db_adapter                      = ( require 'node:sqlite' ).DatabaseSync
Db_adapter                      = require 'better-sqlite3'
#...........................................................................................................
{ nfa,                        } = require 'normalize-function-arguments'
#...........................................................................................................
{ hide,
  set_getter,                 } = ( require './various-brics' ).require_managed_property_tools()
{ type_of,                    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ rpr,                        } = ( require './loupe-brics' ).require_loupe()
{ lets,
  freeze,                     } = ( require './letsfreezethat-infra.brics' ).require_letsfreezethat_infra().simple
{ get_all_in_prototype_chain, } = ( require './unstable-object-tools-brics' ).require_get_prototype_chain()
# { Undumper,                   } = ( require './coarse-sqlite-statement-segmenter.brics' ).require_coarse_sqlite_statement_segmenter()
#...........................................................................................................
{ E,                          } = require './dbric-errors'
#...........................................................................................................
misfit                          = Symbol 'misfit'
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
  dbay_cfg:
    prefix:         null
    default_prefix: null
  #.........................................................................................................
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
  _get_statements_in_prototype_chain: ( property_name, property_type ) ->
    clasz           = @constructor
    candidates_list = ( get_all_in_prototype_chain clasz, property_name ).reverse()
    #.......................................................................................................
    statement_from_candidate = ( candidate ) =>
      if ( type_of candidate ) is 'function' then R = candidate.call @
      else                                        R = candidate
      unless ( type = type_of R ) is 'text'
        throw new E.Dbric_expected_string_or_string_val_fn 'Ωdbricm___1', type
      return R
    #.......................................................................................................
    R               = switch property_type
      when 'list' then []
      when 'pod'  then {}
      else throw new E.Dbric_internal_error 'Ωdbricm___2', "unknown property_type #{rpr property_type}"
    #.......................................................................................................
    for candidates in candidates_list
      ### TAINT use proper validation ###
      unless ( type = type_of candidates ) is property_type
        throw new Error "Ωdbricm___3 expected an optional #{property_type} for #{clasz.name}.#{property_name}, got a #{type}"
      #.....................................................................................................
      if property_type is 'list'
        for candidate in candidates
          R.push statement_from_candidate candidate
      else
        for statement_name, candidate of candidates
          if Reflect.has R, statement_name
            throw new E.Dbric_named_statement_exists 'Ωdbricm___4', statement_name
          R[ statement_name ] = statement_from_candidate candidate
    return R

  #---------------------------------------------------------------------------------------------------------
  _get_objects_in_build_statements: ->
    ### TAINT does not yet deal with quoted names ###
    clasz                 = @constructor
    db_objects            = {}
    statement_count       = 0
    error_count           = 0
    build_statements      = @_get_statements_in_prototype_chain 'build', 'list'
    for build_statement in build_statements
      statement_count++
      if ( match = build_statement.match build_statement_re )?
        { name,
          type, }           = match.groups
        continue unless name? ### NOTE ignore statements like `insert` ###
        name                = unquote_name name
        db_objects[ name ]  = { name, type, }
      else
        error_count++
        name                = "error_#{statement_count}"
        type                = 'error'
        message             = "non-conformant statement: #{rpr build_statement}"
        db_objects[ name ]  = { name, type, message, }
    return { error_count, statement_count, db_objects, }

  #---------------------------------------------------------------------------------------------------------
  _prepare_statements: ->
    clasz       = @constructor
    statements  = @_get_statements_in_prototype_chain 'statements', 'pod'
    for statement_name, statement of statements
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
  @prefix:          null
  @default_prefix:  null
  @functions:       {}
  @statements:      {}
  @build:           null

  #---------------------------------------------------------------------------------------------------------
  ### TAINT use normalize-function-arguments ###
  constructor: ( db_path, cfg ) ->
    super()
    @_validate_is_property 'is_ready'
    @_validate_is_property 'prefix'
    #.......................................................................................................
    db_path                  ?= ':memory:'
    #.......................................................................................................
    clasz                     = @constructor
    hide @, 'db',               new Db_adapter db_path
    @cfg                      = freeze { templates.dbay_cfg..., db_path, cfg..., }
    hide @, 'statements',       {}
    hide @, '_w',               null
    hide @, '_statement_class', ( @db.prepare SQL"select 1;" ).constructor
    hide @, 'state',            ( cfg?.state ) ? { columns: null, }
    hide @, '_cache',           {}
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
    throw new Error "Ωdbricm___5 not allowed to override property #{rpr name}; use '_get_#{name} instead"

  #---------------------------------------------------------------------------------------------------------
  _get_db_objects: ->
    R = {}
    for dbo from ( @db.prepare SQL"select name, type from sqlite_schema" ).iterate()
      R[ dbo.name ] = { name: dbo.name, type: dbo.type, }
    return R

  #---------------------------------------------------------------------------------------------------------
  teardown: ->
    count = 0
    #.......................................................................................................
    ( @prepare SQL"pragma foreign_keys = off;" ).run()
    for _, { name, type, } of @_get_db_objects()
      count++
      try
        ( @prepare SQL"drop #{type} #{IDN name};" ).run()
      catch error
        warn "Ωdbricm___7 ignored error: #{error.message}" unless /// no \s+ such \s+ #{type}: ///.test error.message
    ( @prepare SQL"pragma foreign_keys = on;" ).run()
    return count

  #---------------------------------------------------------------------------------------------------------
  build: -> if @is_ready then 0 else @rebuild()

  #---------------------------------------------------------------------------------------------------------
  rebuild: ->
    clasz                 = @constructor
    build_statements      = @_get_statements_in_prototype_chain 'build', 'list'
    @teardown()
    #.......................................................................................................
    for build_statement in build_statements
      # debug 'Ωdbricm___8', rpr build_statement
      ( @prepare build_statement ).run()
    #.......................................................................................................
    return build_statements.length

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'super',            -> Object.getPrototypeOf @constructor
  set_getter @::, 'is_ready',         -> @_get_is_ready()
  set_getter @::, 'prefix',           -> @_get_prefix()
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
      throw new Error "Ωdbricm___9 #{error_count} out of #{statement_count} build statement(s) could not be parsed: #{rpr messages}"
    #.......................................................................................................
    present_db_objects = @_get_db_objects()
    for name, { type: expected_type, } of expected_db_objects
      return false unless present_db_objects[ name ]?.type is expected_type
    return true

  #---------------------------------------------------------------------------------------------------------
  _get_prefix: ->
    return R if ( R = @_cache.prefix )?
    clasz = @constructor
    #.......................................................................................................
    ### try instance configuration ###
    R = @cfg.prefix
    #.......................................................................................................
    ### try non-inheritable class property `prefix`: ###
    unless R?
      if ( Object.hasOwn clasz, 'prefix' ) and ( prefix = clasz.prefix )?
        R = clasz.prefix
    #.......................................................................................................
    ### try inheritable class property `default_prefix`: ###
    unless R?
      R = clasz.default_prefix
    #.......................................................................................................
    unless R?
      throw new E.Dbric_no_prefix_configured 'Ωdbricm__10', @
    #.......................................................................................................
    ### TAINT use proper validation ###
    unless /^[a-zA-Z][a-zA-Z_0-9]*$/.test R
      throw new E.Dbric_not_a_wellformed_prefix 'Ωdbricm__11', R
    #.......................................................................................................
    @_cache.prefix = R
    return R

  #---------------------------------------------------------------------------------------------------------
  _get_w: ->
    return @_w if @_w?
    @_w = new @constructor @cfg.db_path, { state: @state, }
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
      throw new Error "Ωdbricm__12 expected a statement or a text, got a #{type}"
    try
      R = @db.prepare sql
    catch cause
      throw new Error "Ωdbricm__13 when trying to prepare the following statement, an error with message: #{rpr cause.message} was thrown: #{rpr sql}", { cause, }
    @state.columns = ( try R?.columns?() catch error then null ) ? []
    return R

  #=========================================================================================================
  # FUNCTIONS
  #---------------------------------------------------------------------------------------------------------
  create_function: ( cfg ) ->
    if ( type_of @db.function ) isnt 'function'
      throw new Error "Ωdbricm__14 DB adapter class #{rpr @db.constructor.name} does not provide user-defined functions"
    { name,
      overwrite,
      value,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__15 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.function name, { deterministic, varargs, directOnly, }, value

  #---------------------------------------------------------------------------------------------------------
  create_aggregate_function: ( cfg ) ->
    if ( type_of @db.aggregate ) isnt 'function'
      throw new Error "Ωdbricm__16 DB adapter class #{rpr @db.constructor.name} does not provide user-defined aggregate functions"
    { name,
      overwrite,
      start,
      step,
      result,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_aggregate_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__17 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_window_function: ( cfg ) ->
    if ( type_of @db.aggregate ) isnt 'function'
      throw new Error "Ωdbricm__18 DB adapter class #{rpr @db.constructor.name} does not provide user-defined window functions"
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
      throw new Error "Ωdbricm__19 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, inverse, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_table_function: ( cfg ) ->
    if ( type_of @db.table ) isnt 'function'
      throw new Error "Ωdbricm__20 DB adapter class #{rpr @db.constructor.name} does not provide table-valued user-defined functions"
    { name,
      overwrite,
      parameters,
      columns,
      rows,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_table_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__21 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.table name, { parameters, columns, rows, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  create_virtual_table: ( cfg ) ->
    if ( type_of @db.table ) isnt 'function'
      throw new Error "Ωdbricm__22 DB adapter class #{rpr @db.constructor.name} does not provide user-defined virtual tables"
    { name,
      overwrite,
      create,   } = { templates.create_virtual_table_cfg..., cfg..., }
    if ( not overwrite ) and ( @_function_names.has name )
      throw new Error "Ωdbricm__23 a UDF or built-in function named #{rpr name} has already been declared"
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



