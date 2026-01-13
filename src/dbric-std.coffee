

'use strict'

#===========================================================================================================
SFMODULES                       = require './main'
{ hide,
  set_getter,                 } = SFMODULES.require_managed_property_tools()
{ type_of,                    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ rpr,                        } = ( require './loupe-brics' ).require_loupe()
{ lets,
  freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
{ nfa,                        } = require 'normalize-function-arguments'
{ debug,
  warn                        } = console
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
{ Dbric,											}	= require './dbric-main'



#===========================================================================================================
class Dbric_std_base extends Dbric

  #---------------------------------------------------------------------------------------------------------
  @prefix: 'std'

  #=========================================================================================================
  @functions:

    #-------------------------------------------------------------------------------------------------------
    regexp:
      deterministic: true
      value: ( pattern, text ) -> if ( ( new RegExp pattern, 'v' ).test text ) then 1 else 0

    #-------------------------------------------------------------------------------------------------------
    std_is_uc_normal:
      ### NOTE: also see `String::isWellFormed()` ###
      deterministic: true
      value: ( text, form = 'NFC' ) -> from_bool text is text.normalize form ### 'NFC', 'NFD', 'NFKC', or 'NFKD' ###

    #-------------------------------------------------------------------------------------------------------
    std_normalize_text:
      deterministic: true
      value: ( text, form = 'NFC' ) -> @std_normalize_text text, form

    #-------------------------------------------------------------------------------------------------------
    std_normalize_json_object:
      deterministic: true
      value: ( data, form = 'NFC' ) -> @std_normalize_json_object data, form

  #=========================================================================================================
  @table_functions:

    #-------------------------------------------------------------------------------------------------------
    std_generate_series:
      columns:      [ 'value', ]
      parameters:   [ 'start', 'stop', 'step', ]
      ### NOTE defaults and behavior as per https://sqlite.org/series.html#overview ###
      rows: ( start, stop = 4_294_967_295, step = 1 ) ->
        step  = 1 if step is 0 ### NOTE equivalent `( Object.is step, +0 ) or ( Object.is step, -0 ) ###
        value = start
        loop
          if step > 0 then  break if value > stop
          else              break if value < stop
          yield { value, }
          value += step
        ;null

  #=========================================================================================================
  @statements:
    std_get_schema: SQL"""
      select * from sqlite_schema;"""
    std_get_tables: SQL"""
      select * from sqlite_schema where type is 'table';"""
    std_get_views: SQL"""
      select * from sqlite_schema where type is 'view';"""
    std_get_relations: SQL"""
      select * from sqlite_schema where type in ( 'table', 'view' );"""

  #---------------------------------------------------------------------------------------------------------
  ### select name, builtin, type from pragma_function_list() ###

  #---------------------------------------------------------------------------------------------------------
  @build: [
    SQL"""create view std_tables    as select * from sqlite_schema where type is 'table';"""
    SQL"""create view std_views     as select * from sqlite_schema where type is 'view';"""
    SQL"""create view std_relations as select * from sqlite_schema where type in ( 'table', 'view' );"""
    ]

  #=========================================================================================================
  ### UDF implementations ###
  #---------------------------------------------------------------------------------------------------------
  std_normalize_text: ( text, form = 'NFC' ) -> text.normalize form

  #---------------------------------------------------------------------------------------------------------
  std_normalize_json_object: ( data, form = 'NFC' ) ->
    unless ( type = type_of data ) is 'text'
      throw new E.Dbric_expected_string 'Ωdbrics___1', type, data
    return data if data is 'null'
    unless ( data.startsWith '{' ) and ( data.endsWith '}' )
      throw new E.Dbric_expected_json_object_string 'Ωdbrics___2', data
    data  = JSON.parse data
    keys  = ( Object.keys data ).sort()
    R     = JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )
    return @std_normalize_text R, form

      # #---------------------------------------------------------------------------------------------------
      # ["#{prefix}_get_sha1sum7d"]:
      #   ### NOTE assumes that `data` is in its normalized string form ###
      #   name: "#{prefix}_get_sha1sum7d"
      #   value: ( is_hit, data ) -> get_sha1sum7d "#{if is_hit then 'H' else 'G'}#{data}"

      # #---------------------------------------------------------------------------------------------------
      # ["#{prefix}_normalize_data"]:
      #   name: "#{prefix}_normalize_data"
      #   value: ( data ) ->
      #     return data if data is 'null'
      #     # debug 'Ωim___3', rpr data
      #     data  = JSON.parse data
      #     keys  = ( Object.keys data ).sort()
      #     return JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )


#===========================================================================================================
class Dbric_std_variables extends Dbric_std_base

  #---------------------------------------------------------------------------------------------------------
  @prefix: 'std'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( P... ) ->
    super P...
    @state.std_variables                 ?= freeze {}
    @state.std_transients                ?= freeze {}
    @state.std_within_variables_context  ?= false
    ;undefined

  #=========================================================================================================
  @build: [

    #-------------------------------------------------------------------------------------------------------
    SQL"""create table std_variables (
        name      text      unique  not null,
        value     json              not null default 'null',
        delta     integer               null default null,
      primary key ( name )
      constraint "Ωconstraint___4" check ( ( delta is null ) or ( delta != 0 ) )
      );"""

    #-------------------------------------------------------------------------------------------------------
    SQL"""insert into std_variables ( name, value, delta ) values ( 'seq:global:rowid', 0, +1 );"""
    ]

  #=========================================================================================================
  @functions:

    #-------------------------------------------------------------------------------------------------------
    std_get_next_in_sequence:
      deterministic: false
      value:  ( name ) -> @std_get_next_in_sequence name

    #-------------------------------------------------------------------------------------------------------
    std_get_variable:
      deterministic: false
      value:  ( name ) -> @std_get_variable name

  #=========================================================================================================
  @statements:
    set_variable:     SQL"""
      insert into std_variables ( name, value, delta ) values ( $name, $value, $delta )
        on conflict ( name ) do update
          set value = $value, delta = $delta;"""
    get_variables:    SQL"select name, value, delta from std_variables order by name;"

  #=========================================================================================================
  _std_acquire_state: ( transients = {} ) ->
    #.......................................................................................................
    @state.std_variables = lets @state.std_variables, ( v ) =>
      for { name, value, delta, } from @statements.get_variables.iterate()
        value     = JSON.parse value
        v[ name ] = { name, value, delta, }
      ;null
    #.......................................................................................................
    @state.std_transients = lets @state.std_transients, ( t ) ->
      for name, value of transients
        t[ name ] = { name, value, }
      ;null
    #.......................................................................................................
    ;null

  #---------------------------------------------------------------------------------------------------------
  _std_persist_state: ->
    # whisper 'Ωdbrics___5', "_std_persist_state"
    #.......................................................................................................
    for _, { name, value, delta, } of @state.std_variables
      ### TAINT clear cache in @state.std_variables ? ###
      # whisper 'Ωdbrics___6', { name, value, delta, }
      delta  ?= null
      value   = JSON.stringify value
      @statements.set_variable.run { name, value, delta, }
    #.......................................................................................................
    @state.std_transients = lets @state.std_transients, ( t ) ->
      delete t[ name ] for name of t
      ;null
    #.......................................................................................................
    ;null

  #---------------------------------------------------------------------------------------------------------
  std_with_variables: ( transients, fn ) ->
    switch arity = arguments.length
      when 1 then [ transients, fn, ] = [ {}, transients, ]
      when 2 then null
      else throw new Error "Ωdbrics___7 expected 1 or 2 arguments, got #{arity}"
    #.......................................................................................................
    if @state.std_within_variables_context
      throw new Error "Ωdbrics___8 illegal to nest `std_with_variables()` contexts"
    @state.std_within_variables_context = true
    #.......................................................................................................
    @_std_acquire_state transients
    try
      R = fn()
    finally
      @state.std_within_variables_context = false
      @_std_persist_state()
    return R

  #---------------------------------------------------------------------------------------------------------
  std_set_variable: ( name, value, delta ) ->
    unless @state.std_within_variables_context
      throw new Error "Ωdbrics___9 illegal to set variable outside of `std_with_variables()` contexts"
    if Reflect.has @state.std_transients, name
      @state.std_transients = lets @state.std_transients, ( t ) => t[ name ] = { name, value, }
    else
      delta ?= null
      @state.std_variables = lets @state.std_variables,   ( v ) => v[ name ] = { name, value, delta, }
    ;null

  #---------------------------------------------------------------------------------------------------------
  std_get_variable: ( name ) ->
    # unless @state.std_within_variables_context
    #   throw new Error "Ωdbrics__10 illegal to get variable outside of `std_with_variables()` contexts"
    if Reflect.has @state.std_transients, name
      return @state.std_transients[ name ].value
    if Reflect.has @state.std_variables, name
      return @state.std_variables[ name ].value
    throw new Error "Ωdbrics__11 unknown variable #{rpr name}"
    ;null

  #---------------------------------------------------------------------------------------------------------
  std_get_next_in_sequence: ( name ) ->
    unless @state.std_within_variables_context
      throw new Error "Ωdbrics__12 illegal to set variable outside of `std_with_variables()` contexts"
    unless ( entry = @state.std_variables[ name ] )?
      throw new Error "Ωdbrics__13 unknown variable #{rpr name}"
    unless ( delta = entry.delta )?
      throw new Error "Ωdbrics__14 not a sequence name: #{rpr name}"
    entry.value += delta
    return entry.value

  #---------------------------------------------------------------------------------------------------------
  _show_variables: ( print_table = false ) ->
    store       = Object.fromEntries ( \
      [ name, { value, delta, }, ] \
        for { name, value, delta, } from \
          @statements.get_variables.iterate() )
    cache_names = new Set Object.keys @state.std_variables
    trans_names = new Set Object.keys @state.std_transients
    store_names = new Set Object.keys store
    all_names   = [ ( ( cache_names.union store_names ).union trans_names )..., ].sort()
    R = {}
    for name in all_names
      s         = store[                  name ] ? {}
      c         = @state.std_variables[   name ] ? {}
      t         = @state.std_transients[  name ] ? {}
      gv        = @std_get_variable name
      R[ name ] = { sv: s.value, sd: s.delta, cv: c.value, cd: c.delta, tv: t.value, gv, }
    console.table R if print_table
    return R


#===========================================================================================================
class Dbric_std extends Dbric_std_variables

  #---------------------------------------------------------------------------------------------------------
  @prefix: 'std'


#===========================================================================================================
module.exports = { Dbric_std, internals: { Dbric_std_base, Dbric_std_variables, }, }


