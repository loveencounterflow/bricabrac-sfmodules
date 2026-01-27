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
{ get_all_in_prototype_chain,
  get_prototype_chain,        } = require './prototype-tools'
{ nfa,                        } = ( require './unstable-normalize-function-arguments-brics' ).require_normalize_function_arguments()
# { nameit,                     } = ( require './various-brics' ).require_nameit()
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
ignored_prototypes              = null


# #-----------------------------------------------------------------------------------------------------------
# ### TAINT put into separate module ###
# ### TAINT rewrite with `get_all_in_prototype_chain()` ###
# ### TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` ###
# get_property_descriptor = ( x, name, fallback = misfit ) ->
#   while x?
#     return R if ( R = Object.getOwnPropertyDescriptor x, name )?
#     x = Object.getPrototypeOf x
#   return fallback unless fallback is misfit
#   throw new Error "unable to find descriptor for property #{String(name)} not found on object or its prototypes"

# #-----------------------------------------------------------------------------------------------------------
# build_statement_re = ///
#   ^ \s*
#   insert | (
#     ( create | alter ) \s+
#     (?<type> table | view | index | trigger ) \s+
#     (?<name> \S+ ) \s+
#     )
#   ///is

#-----------------------------------------------------------------------------------------------------------
templates =
  dbric_cfg:
    db_path:        ':memory:'
    rebuild:        false
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
  ### TAINT use proper typing ###
  _validate_plugins_property: ( x ) ->
    unless ( type = type_of x ) is 'list'
      throw new E.Dbric_expected_list_for_plugins 'Ωdbricm___5', type
    #.......................................................................................................
    unless ( delta = x.length - ( new Set x ).size ) is 0
      throw new E.Dbric_expected_unique_list_for_plugins 'Ωdbricm___6', delta
    #.......................................................................................................
    unless ( idx_of_me = x.indexOf 'me' ) > ( idx_of_prototypes = x.indexOf 'prototypes' )
      throw new E.Dbric_expected_me_before_prototypes_for_plugins 'Ωdbricm___7', idx_of_me, idx_of_prototypes
    #.......................................................................................................
    for element, element_idx in x
      continue if element is 'me'
      continue if element is 'prototypes'
      unless element?
        throw new E.Dbric_expected_object_or_placeholder_for_plugin 'Ωdbricm___8', element_idx
      unless Reflect.has element, 'exports'
        throw new E.Dbric_expected_object_with_exports_for_plugin 'Ωdbricm___9', element_idx
    #.......................................................................................................
    return x

  #---------------------------------------------------------------------------------------------------------
  _get_acquisition_chain: ->
    #.......................................................................................................
    R           = []
    clasz       = @constructor
    prototypes  = get_prototype_chain clasz
    prototypes  = ( p for p in prototypes when ( p isnt clasz ) and p not in ignored_prototypes ).reverse()
    plugins     = clasz.plugins ? []
    plugins.unshift 'prototypes'  unless 'prototypes' in plugins
    plugins.push    'me'          unless 'me'         in plugins
    @_validate_plugins_property plugins
    #.......................................................................................................
    for entry in plugins
      switch entry
        when 'me'
          R.push { type: 'prototype', contributor: clasz, }
        when 'prototypes'
          for prototype in prototypes
            R.push { type: 'prototype', contributor: prototype, }
        else
          R.push { type: 'plugin', contributor: entry, }
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  _collect_contributor_properties: ->
    clasz             = @constructor
    acquisition_chain = @_get_acquisition_chain()
    #.......................................................................................................
    R                 =
      build:                []
      statements:           {}
      functions:            {}
      aggregate_functions:  {}
      window_functions:     {}
      table_functions:      {}
      virtual_tables:       {}
      methods:              {}
    #.......................................................................................................
    for { type, contributor, } in acquisition_chain
      source = if type is 'plugin' then contributor.exports else contributor
      if ( Object.hasOwn source, 'build' )
        R.build.push item for item in ( source.build ? [] )
      for property_name, target of R
        continue if ( property_name is 'build' )
        continue if ( property_name is 'methods' ) and ( type isnt 'plugin' )
        continue if ( not Object.hasOwn source, property_name )
        ### TAINT make overwriting behavior configurable ###
        target[ key ] = value for key, value of ( source[ property_name ] ? {} )
    return R

  #---------------------------------------------------------------------------------------------------------
  _apply_contributions: ->
    clasz         = @constructor
    contributions = @_collect_contributor_properties()
    #.......................................................................................................
    @_acquire_methods     contributions
    @_create_udfs         contributions
    @_rebuild             contributions if @cfg.rebuild
    @_acquire_statements  contributions
    ;null

  #---------------------------------------------------------------------------------------------------------
  _acquire_methods: ( contributions ) ->
    for method_name, method of contributions.methods
      hide @, method_name, method
    ;null

  #---------------------------------------------------------------------------------------------------------
  _acquire_statements: ( contributions ) ->
    for statement_name, statement of contributions.statements
      @statements[ statement_name ] = @prepare statement
    ;null

  #=========================================================================================================
  # TEARDOWN & REBUILD
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
        warn "Ωdbricm__10 ignored error: #{error.message}" unless /// no \s+ such \s+ #{type}: ///.test error.message
    ( @prepare SQL"pragma foreign_keys = on;" ).run()
    return count

  #---------------------------------------------------------------------------------------------------------
  _rebuild: ( contributions ) ->
    clasz = @constructor
    @teardown()
    #.......................................................................................................
    for build_statement in contributions.build
      ( @prepare build_statement ).run()
    #.......................................................................................................
    ;null


  #=========================================================================================================
  # UDFs
  #---------------------------------------------------------------------------------------------------------
  _create_udfs: ( contributions ) ->
    names_of_callables  =
      function:             [ 'value', ]
      aggregate_function:   [ 'start', 'step', 'result', ]
      window_function:      [ 'start', 'step', 'inverse', 'result', ]
      table_function:       [ 'rows', ]
      virtual_table:        [ 'rows', ]
    #.......................................................................................................
    for category in Object.keys names_of_callables
      property_name     = "#{category}s"
      method_name       = "_create_#{category}"
      #.....................................................................................................
      for udf_name, fn_cfg of contributions[ property_name ]
        fn_cfg = lets fn_cfg, ( d ) =>
          d.name ?= udf_name
          #.................................................................................................
          ### bind UDFs to `this` ###
          for name_of_callable in names_of_callables[ category ]
            continue unless ( callable = d[ name_of_callable ] )?
            d[ name_of_callable ] = callable.bind @
          return null
        @[ method_name ] fn_cfg
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _get_udf_names: -> new Set ( name for { name, } from \
    @walk SQL"select name from pragma_function_list() order by name;" )

  #---------------------------------------------------------------------------------------------------------
  _create_function: ( cfg ) ->
    if ( type_of @db.function ) isnt 'function'
      throw new Error "Ωdbricm__11 DB adapter class #{rpr @db.constructor.name} does not provide user-defined functions"
    { name,
      overwrite,
      value,
      directOnly,
      deterministic,
      varargs,        } = { templates.create_function_cfg..., cfg..., }
    if ( not overwrite ) and ( @_get_udf_names().has name )
      throw new Error "Ωdbricm__12 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.function name, { deterministic, varargs, directOnly, }, value

  #---------------------------------------------------------------------------------------------------------
  _create_aggregate_function: ( cfg ) ->
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
    if ( not overwrite ) and ( @_get_udf_names().has name )
      throw new Error "Ωdbricm__14 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  _create_window_function: ( cfg ) ->
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
    if ( not overwrite ) and ( @_get_udf_names().has name )
      throw new Error "Ωdbricm__16 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.aggregate name, { start, step, inverse, result, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  _create_table_function: ( cfg ) ->
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
    if ( not overwrite ) and ( @_get_udf_names().has name )
      throw new Error "Ωdbricm__18 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.table name, { parameters, columns, rows, deterministic, varargs, directOnly, }

  #---------------------------------------------------------------------------------------------------------
  _create_virtual_table: ( cfg ) ->
    if ( type_of @db.table ) isnt 'function'
      throw new Error "Ωdbricm__19 DB adapter class #{rpr @db.constructor.name} does not provide user-defined virtual tables"
    { name,
      overwrite,
      create,   } = { templates.create_virtual_table_cfg..., cfg..., }
    if ( not overwrite ) and ( @_get_udf_names().has name )
      throw new Error "Ωdbricm__20 a UDF or built-in function named #{rpr name} has already been declared"
    return @db.table name, create


#===========================================================================================================
class Dbric extends Dbric_classprop_absorber

  #---------------------------------------------------------------------------------------------------------
  @functions:       {}
  @statements:      {}
  @build:           null
  @plugins:         null

  #---------------------------------------------------------------------------------------------------------
  @rebuild: nfa { template: templates.dbric_cfg, }, ( db_path, cfg ) ->
    cfg.rebuild = true
    return new @ cfg

  #---------------------------------------------------------------------------------------------------------
  ### NOTE this unusual arrangement is solely there so we can call `super()` from an instance method ###
  constructor: ( P... ) ->
    super()
    return @_constructor P...
  _constructor: nfa { template: templates.dbric_cfg, }, ( db_path, cfg ) ->
    #.......................................................................................................
    db_path                  ?= ':memory:'
    #.......................................................................................................
    clasz                     = @constructor
    hide @, 'db',               new Db_adapter db_path
    #.......................................................................................................
    @cfg                      = freeze { templates.dbric_cfg..., db_path, cfg..., }
    hide @, 'statements',       {}
    hide @, '_statement_class', ( @db.prepare SQL"select 1;" ).constructor
    hide @, 'state',            ( cfg?.state ) ? { columns: null, }
    #.......................................................................................................
    @run_standard_pragmas()
    @_apply_contributions()
    ;undefined

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
    ;null

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
      throw new Error "Ωdbricm__21 expected a statement or a text, got a #{type}"
    try
      R = @db.prepare sql
    catch cause
      throw new Error "Ωdbricm__22 when trying to prepare the following statement, an error with message: #{rpr cause.message} was thrown: #{rpr sql}", { cause, }
    @state.columns = ( try R?.columns?() catch error then null ) ? []
    return R

#===========================================================================================================
ignored_prototypes = Object.freeze [
  ( Object.getPrototypeOf {} ),
  ( Object.getPrototypeOf Object ),
  Dbric_classprop_absorber,
  Dbric,
  ]


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
    ignored_prototypes,
    type_of,
    templates, }
  }



