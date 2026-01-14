
'use strict'


#===========================================================================================================
{ debug,                } = console
{ freeze,               } = Object
IFN                       = require './../dependencies/intervals-fn-lib.ts'
{ T,                    } = require './intermission-types'
#...........................................................................................................
{ nfa,                  } = ( require './unstable-normalize-function-arguments-brics' ).require_normalize_function_arguments()
{ nameit,               } = ( require './various-brics' ).require_nameit()
{ type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ hide,
  set_getter,           } = ( require './various-brics' ).require_managed_property_tools()
{ rpr,                  } = ( require './loupe-brics' ).require_loupe()
{ deploy,               } = ( require './unstable-object-tools-brics' ).require_deploy()
# { get_sha1sum7d,        } = require './shasum'
{ Dbric,
  Dbric_std,
  SQL,
  LIT,
  IDN,
  VEC,                  } = require './dbric'


#===========================================================================================================
templates =
  #.........................................................................................................
  run_cfg:
    lo:         null
    hi:         null
    scatter:    null
  #.........................................................................................................
  scatter_cfg:
    hoard:      null
    data:       null
    sort:       false
    normalize:  false
  #.........................................................................................................
  scatter_add:
    lo:         null
    hi:         null
  #.........................................................................................................
  hoard_cfg:
    first:      0x00_0000
    last:       0x10_ffff
  #.........................................................................................................
  create_run:
    lo:         null
    hi:         null
  #.........................................................................................................
  get_build_statements:
    runs_rowid_regexp:        '0x00_0000'
    first_point:              0x00_0000
    last_point:               0x10_ffff
  #.........................................................................................................
  get_insert_statements:
    scatters_rowid_template:  'scatter-%d'
    runs_rowid_template:      'run-%d'
  #.........................................................................................................
  get_udfs: {}

#===========================================================================================================
as_hex = ( n ) ->
  sign = if n < 0 then '-' else '+'
  return "#{sign}0x#{( Math.abs n ).toString 16}"

#===========================================================================================================
### Strategies to be applied to summarize data items ###
summarize_data =
  as_unique_sorted: ( values ) -> [ ( new Set ( v for v in values.flat() when v? ).sort() )..., ]
  as_boolean_and: ( values ) -> values.reduce ( ( acc, cur ) -> acc and cur ? false ), true
  as_boolean_or:  ( values ) -> values.reduce ( ( acc, cur ) -> acc or  cur ? false ), false

#===========================================================================================================
class Run

  #---------------------------------------------------------------------------------------------------------
  constructor: ({ lo, hi, }) ->
    @lo   = lo
    @hi   = hi
    ;undefined

  #---------------------------------------------------------------------------------------------------------
  [Symbol.iterator]: -> yield from [ @lo .. @hi ]

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'size', -> @hi - @lo + 1 ### TAINT consider to make `Run`s immutable, then size is a constant ###

  #---------------------------------------------------------------------------------------------------------
  as_halfopen:                -> { start: @lo, end: @hi + 1, }
  @from_halfopen:( halfopen ) -> new @ { lo: halfopen.start, hi: halfopen.end - 1, }

  #---------------------------------------------------------------------------------------------------------
  contains: ( probe ) ->
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when Number.isFinite probe
        return @lo <= probe <= @hi
      #.....................................................................................................
      when probe instanceof Run
        return ( @lo <= probe.lo <= @hi ) and ( @lo <= probe.hi <= @hi )
      #.....................................................................................................
      when ( type_of probe ) is 'text'
        probe = ( chr.codePointAt 0 for chr in Array.from probe )
    #.......................................................................................................
    for n from probe
      return false unless @lo <= n <= @hi
    return true


#===========================================================================================================
class Scatter

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hoard, cfg ) ->
    ### TAINT validate ###
    ### TAINT should freeze data ###
    [ cfg,
      { data, },  ] = deploy { templates.scatter_cfg..., cfg..., }, [ 'sort', 'normalize', ], [ 'data', ]
    @data           = freeze data
    @runs           = []
    hide @, 'cfg',    freeze cfg
    hide @, 'hoard',  hoard
    hide @, 'state',  { is_normalized: true, }
    ;undefined

  #---------------------------------------------------------------------------------------------------------
  [Symbol.iterator]: -> yield from @walk()

  #---------------------------------------------------------------------------------------------------------
  walk: ->
    @normalize() unless @is_normalized
    yield from run for run in @runs
    ;null

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'is_normalized',  -> @state.is_normalized
  set_getter @::, 'points', -> [ @..., ]
    # points = new Set [ ( [ run..., ] for run in @runs )..., ].flat()
    # return [ points..., ].sort ( a, b ) ->
    #   return +1 if a > b
    #   return -1 if a < b
    #   return  0

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'min', ->
    return null if @runs.length is 0
    return ( @runs.at 0 ).lo if @is_normalized
    return Math.min ( run.lo for run in @runs )...

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'max', ->
    return null if @runs.length is 0
    return ( @runs.at -1 ).hi if @is_normalized
    return Math.max ( run.hi for run in @runs )...

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'minmax', -> { min: @min, max: @max, }

  #---------------------------------------------------------------------------------------------------------
  _insert: ( run ) ->
    ### NOTE this private API provides an opportunity to implement always-ordered runs; however we opt for
    sorting all ranges when needed by a method like `Scatter::normalize()` ###
    @runs.push run
    @state.is_normalized = false
    ;null

  #---------------------------------------------------------------------------------------------------------
  sort: ->
    @runs.sort ( a, b ) ->
      return +1 if a.lo > b.lo
      return -1 if a.lo < b.lo
      return +1 if a.hi > b.hi
      return -1 if a.hi < b.hi
      return  0
    ;null

  #---------------------------------------------------------------------------------------------------------
  clear: ->
    @runs.length = []
    ;null

  #---------------------------------------------------------------------------------------------------------
  add_run: ( P... ) ->
    @_insert @hoard.create_run P...
    if @cfg.normalize then @normalize()
    else if @cfg.sort then @sort()
    return null

  #---------------------------------------------------------------------------------------------------------
  add_codepoints_of: ( texts... ) -> @add_run chr for chr from new Set texts.join ''

  #---------------------------------------------------------------------------------------------------------
  normalize: ->
    @sort()
    halfopens = IFN.simplify ( run.as_halfopen() for run in @runs )
    @clear()
    @runs.push Run.from_halfopen halfopen for halfopen in halfopens
    @state.is_normalized = true
    return null

  #---------------------------------------------------------------------------------------------------------
  contains: ( probe ) ->
    @normalize() unless @is_normalized
    { min, max, } = @minmax
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when Number.isFinite probe
        return false unless min <= probe <= max
        return @runs.some ( run ) => run.contains probe
      #.....................................................................................................
      when probe instanceof Run
        return false unless ( min <= probe.lo <= max ) and ( min <= probe.hi <= max )
        return @runs.some ( run ) => ( run.contains probe.lo ) and ( run.contains probe.hi )
      #.....................................................................................................
      when probe instanceof Scatter
        probe.normalize() unless probe.is_normalized
        return false unless ( min <= probe.min <= max ) and ( min <= probe.max <= max )
        return probe.runs.every ( run ) => @contains run
      #.....................................................................................................
      when ( type_of probe ) is 'text'
        probe = ( chr.codePointAt 0 for chr in Array.from probe )
    #.......................................................................................................
    for n from probe
      return false unless @runs.some ( run ) -> run.contains n
    return true

#===========================================================================================================
class Hoard

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg  = freeze { templates.hoard_cfg..., cfg..., }
    @gaps = []
    @hits = []
    hide @, 'scatters', []
    hide @, 'state',    { is_normalized: true, }
    ;undefined

  #---------------------------------------------------------------------------------------------------------
  create_run: nfa { template: templates.create_run, }, ( lo, hi, cfg ) ->
    # debug 'Ωim___1', { lo, hi, cfg, }
    # debug 'Ωim___2', @_get_hi_and_lo cfg
    return new Run @_get_hi_and_lo cfg

  #---------------------------------------------------------------------------------------------------------
  create_scatter: ( P... ) -> new Scatter  @, P...

  #---------------------------------------------------------------------------------------------------------
  add_scatter: ( P... ) ->
    R = @create_scatter P...
    @scatters.push R
    return R

  #---------------------------------------------------------------------------------------------------------
  contains: ->

  #---------------------------------------------------------------------------------------------------------
  get_data_for_point: ( point ) ->
    T.point.validate point
    R = []
    for scatter in @scatters
      continue unless scatter.contains point
      R.push scatter.data
    return R

  #---------------------------------------------------------------------------------------------------------
  summarize_data_for_point: ( point ) ->
    R = @get_data_for_point point
    return null if R.length is 0
    return @_summarize_data R...

  #---------------------------------------------------------------------------------------------------------
  _summarize_data: ( items... ) ->
    items = items.flat()
    R     = {}
    keys  = [ ( new Set ( key for key of item for item in items ).flat() )..., ].sort()
    for key in keys
      values    = ( value for item in items when ( value = item[ key ] )? )
      R[ key ]  = ( @[ "summarize_data_#{key}" ] ? ( ( x ) -> x ) ).call @, values
    return R

  #---------------------------------------------------------------------------------------------------------
  summarize_data_tags: ( values ) -> summarize_data.as_unique_sorted values

  #---------------------------------------------------------------------------------------------------------
  _get_hi_and_lo: ( cfg ) ->
    return { lo: ( @_cast_bound cfg.lo ), hi: ( @_cast_bound cfg.hi ? cfg.lo ), }

  #---------------------------------------------------------------------------------------------------------
  _cast_bound: ( bound ) ->
    switch type = type_of bound
      when 'float'
        unless Number.isInteger bound
          throw new Error "Ωim___5 expected an integer or a text, got a #{type}"
        R = bound
      when 'text'
        R = bound.codePointAt 0
      else
        throw new Error "Ωim___6 expected an integer or a text, got a #{type}"
    unless ( @cfg.first <= R <= @cfg.last )
      throw new Error "Ωim___7 #{as_hex R} is not between #{as_hex @cfg.first} and #{as_hex @cfg.last}"
    return R

  #---------------------------------------------------------------------------------------------------------
  @functions: ->
    R = {}

    #-------------------------------------------------------------------------------------------------------
    hrd_as_lohi_hex:
      name: 'hrd_as_lohi_hex'
      value: ( lo, hi ) -> "(#{lo.toString 16},#{hi.toString 16})"

    #-------------------------------------------------------------------------------------------------------
    return R

  #---------------------------------------------------------------------------------------------------------
  @build: ->
    R = []

    #-------------------------------------------------------------------------------------------------------
    R.push SQL"""
      create table hrd_hoard_scatters (
          rowid     text    unique  not null,
          is_hit    boolean         not null default false,
          data      json            not null default 'null'
          );"""

    #-------------------------------------------------------------------------------------------------------
    R.push SQL"""
      create table hrd_hoard_runs (
          rowid     text    unique  not null,
          lo        integer         not null,
          hi        integer         not null,
          scatter   text            not null,
        -- primary key ( rowid ),
        foreign key ( scatter ) references hrd_hoard_scatters ( rowid ),
        constraint "Ωconstraint__11" check ( rowid regexp #{LIT cfg.runs_rowid_regexp } ),
        constraint "Ωconstraint__10" check ( lo between #{LIT cfg.first_point} and #{LIT cfg.last_point} ),
        constraint "Ωconstraint__11" check ( hi between #{LIT cfg.first_point} and #{LIT cfg.last_point} ),
        constraint "Ωconstraint__12" check ( lo <= hi )
        -- constraint "Ωconstraint__13" check ( rowid regexp '^.*$' )
        );"""
    #-------------------------------------------------------------------------------------------------------
    return R

  #---------------------------------------------------------------------------------------------------------
  @statements: ->
    R = {}

    #-------------------------------------------------------------------------------------------------------
    R.insert_hrd_hoard_scatter_v = SQL"""
      insert into hrd_hoard_scatters ( rowid, is_hit, data ) values (
          printf( #{LIT cfg.scatters_rowid_template}, std_get_next_in_sequence( 'hrd_seq_hoard_scatters' ) ),
          $is_hit,
          $data )
        returning *;"""

    #-------------------------------------------------------------------------------------------------------
    R.insert_hrd_hoard_run_v = SQL"""
      insert into hrd_hoard_runs ( rowid, lo, hi, scatter ) values (
          printf( #{LIT cfg.runs_rowid_template}, std_get_next_in_sequence( 'hrd_seq_hoard_runs' ) ),
          $lo,
          $hi,
          $scatter );"""

    #-------------------------------------------------------------------------------------------------------
    return R

#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { Run, Scatter, templates, IFN, }
  return {
    Hoard,
    summarize_data,
    internals, }
