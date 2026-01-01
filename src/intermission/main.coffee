


'use strict'




#===========================================================================================================
@require_intermission = ->

  #=========================================================================================================
  { debug,                } = console
  SFMODULES                 = require '../main'
  { nfa,                  } = SFMODULES.unstable.require_normalize_function_arguments()
  { nameit,               } = SFMODULES.require_nameit()
  { type_of,              } = SFMODULES.unstable.require_type_of()
  { hide,
    set_getter,           } = SFMODULES.require_managed_property_tools()
  IFN                       = require '../../dependencies/intervals-fn-lib.ts'

  #=========================================================================================================
  templates =
    #.......................................................................................................
    run_cfg:
      lo:         null
      hi:         null
      scatter:    null
    #.......................................................................................................
    scatter_cfg:
      data:       null
      sort:       false
      normalize:  false
      first:      0x00_0000
      last:       0x10_ffff
    #.......................................................................................................
    scatter_add:
      lo:         null
      hi:         null

  #=========================================================================================================
  as_hex = ( n ) ->
    sign = if n < 0 then '-' else '+'
    return "#{sign}0x#{( Math.abs n ).toString 16}"

  #=========================================================================================================
  # run_class_count = 0
  create_run_class = ( scatter = null ) ->
    # run_class_count++

    #-------------------------------------------------------------------------------------------------------
    cast_bound = ( bound ) ->
      switch type = type_of bound
        when 'float'
          unless Number.isInteger bound
            throw new Error "Ωim___1 expected an integer or a text, got a #{type}"
          R = bound
        when 'text'
          R = bound.codePointAt 0
        else
          throw new Error "Ωim___2 expected an integer or a text, got a #{type}"
      if scatter? and not ( scatter.cfg.first <= R <= scatter.cfg.last )
        throw new Error "Ωim___3 #{as_hex R} is not between #{as_hex scatter.cfg.first} and #{as_hex scatter.cfg.last}"
      return R

    #-------------------------------------------------------------------------------------------------------
    get_hi_and_lo = ( cfg ) ->
      return scatter.get_hi_and_lo cfg if scatter?.get_hi_and_lo?
      return [ ( cast_bound cfg.lo ), ( cast_bound cfg.hi ? cfg.lo ), ]

    #=========================================================================================================
    R = class Run # ["Run_nr#{run_class_count}"]

      #-------------------------------------------------------------------------------------------------------
      constructor: nfa { template: templates.run_cfg, }, ( lo, hi, cfg ) ->
        [ @lo, @hi, ] = get_hi_and_lo cfg
        hide @, 'scatter', cfg.scatter ? null

      #-------------------------------------------------------------------------------------------------------
      [Symbol.iterator]: -> yield from [ @lo .. @hi ]

      #-------------------------------------------------------------------------------------------------------
      set_getter @::, 'data', -> @scatter.data
      set_getter @::, 'size', -> @hi - @lo + 1 ### TAINT consider to make `Run`s immutable, then size is a constant ###

      #-------------------------------------------------------------------------------------------------------
      as_halfopen:                -> { start: @lo, end: @hi + 1, }
      @from_halfopen:( halfopen ) -> new @ { lo: halfopen.start, hi: halfopen.end - 1, }

      #-------------------------------------------------------------------------------------------------------
      has: ( i ) -> @lo <= i <= @hi
    return R
  Run = create_run_class null

  #=========================================================================================================
  class Scatter
    constructor: nfa { template: templates.scatter_cfg, }, ( data, cfg ) ->
      ### TAINT validate ###
      ### TAINT should freeze data ###
      @data   = data
      @runs   = []
      hide @, 'cfg',        Object.freeze cfg # { normalize, }
      hide @, 'state',      { is_normalized: true, }
      hide @, 'run_class',  create_run_class @
      ;undefined

    #-------------------------------------------------------------------------------------------------------
    ### NOTE override to define custom cast from arguments to bounds ###
    get_hi_and_lo: null # ( cfg ) ->

    #-------------------------------------------------------------------------------------------------------
    [Symbol.iterator]: ->
      @normalize() unless @is_normalized
      yield from run for run in @runs
      ;null

    #-------------------------------------------------------------------------------------------------------
    walk:     -> yield from @
    walk_raw: -> yield from @points

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'is_normalized',  -> @state.is_normalized
    set_getter @::, 'points', ->
      points = new Set [ ( [ run..., ] for run in @runs )..., ].flat()
      return [ points..., ].sort ( a, b ) ->
        return +1 if a > b
        return -1 if a < b
        return  0

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'min', ->
      return null if @runs.length is 0
      return ( @runs.at 0 ).lo if @is_normalized
      return Math.min ( run.lo for run in @runs )...

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'max', ->
      return null if @runs.length is 0
      return ( @runs.at -1 ).hi if @is_normalized
      return Math.max ( run.hi for run in @runs )...

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'minmax', -> { min: @min, max: @max, }

    #-------------------------------------------------------------------------------------------------------
    _insert: ( run ) ->
      ### NOTE this private API provides an opportunity to implement always-ordered runs; however we opt for
      sorting all ranges when needed by a method like `Scatter::normalize()` ###
      @runs.push run
      @state.is_normalized = false
      ;null

    #-------------------------------------------------------------------------------------------------------
    sort: ->
      @runs.sort ( a, b ) ->
        return +1 if a.lo > b.lo
        return -1 if a.lo < b.lo
        return +1 if a.hi > b.hi
        return -1 if a.hi < b.hi
        return  0
      ;null

    #-------------------------------------------------------------------------------------------------------
    clear: ->
      @runs.length = []
      ;null

    #-------------------------------------------------------------------------------------------------------
    add: ( P... ) ->
      run         = new @run_class P...
      # unless
      run.scatter = @
      @_insert run
      if @cfg.normalize then @normalize()
      else if @cfg.sort then @sort()
      return null

    #-------------------------------------------------------------------------------------------------------
    add_codepoints_of: ( texts... ) -> @add chr for chr from new Set texts.join ''

    #-------------------------------------------------------------------------------------------------------
    normalize: ->
      @sort()
      halfopens = IFN.simplify ( run.as_halfopen() for run in @runs )
      @clear()
      @runs.push Run.from_halfopen halfopen for halfopen in halfopens
      @state.is_normalized = true
      return null

    #-------------------------------------------------------------------------------------------------------
    has: ( i ) -> @runs.some ( run ) -> run.has i
  
  #=========================================================================================================
  internals = Object.freeze { IFN, }
  return exports = {
    Run,
    Scatter,
    internals, }
