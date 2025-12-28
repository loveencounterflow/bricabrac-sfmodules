


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
    #.......................................................................................................
    scatter_add:
      lo:         null
      hi:         null


  #=========================================================================================================
  class Run

    #-------------------------------------------------------------------------------------------------------
    constructor: nfa { template: templates.run_cfg, }, ( lo, hi, cfg ) ->
      { lo,
        hi, } = lo if lo instanceof Run
      lo     ?= hi ? 0
      hi     ?= lo
      @lo     = lo
      @hi     = hi
      hide @, 'scatter', cfg.scatter ? null

    #-------------------------------------------------------------------------------------------------------
    set_getter @, 'data', -> @scatter.data

    #-------------------------------------------------------------------------------------------------------
    as_halfopen:                -> { start: @lo, end: @hi + 1, }
    @from_halfopen:( halfopen ) -> new @ { lo: halfopen.start, hi: halfopen.end - 1, }

    #-------------------------------------------------------------------------------------------------------
    has: ( i ) -> @lo <= i <= @hi

  #=========================================================================================================
  class Scatter
    constructor: nfa { template: templates.scatter_cfg, }, ( data, cfg ) ->
      ### TAINT validate ###
      ### TAINT should freeze data ###
      @data   = data
      @runs   = []
      hide @, 'cfg', Object.freeze cfg # { normalize, }
      ;undefined

    #-------------------------------------------------------------------------------------------------------
    _insert: ( run ) ->
      ### NOTE this private API provides an opportunity to implement always-ordered runs; however we opt for
      sorting all ranges when needed by a method like `Scatter::normalize()` ###
      @runs.push run
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
      run         = new Run P...
      run.scatter = @
      @_insert run
      if @cfg.normalize then @normalize()
      else if @cfg.sort then @sort()
      return null

    #-------------------------------------------------------------------------------------------------------
    normalize: ->
      @sort()
      halfopens = IFN.simplify ( run.as_halfopen() for run in @runs )
      @clear()
      @runs.push Run.from_halfopen halfopen for halfopen in halfopens
      return null

    #-------------------------------------------------------------------------------------------------------
    has: ( i ) -> @runs.some ( run ) -> run.has i
  
  #=========================================================================================================
  internals = Object.freeze { IFN, }
  return exports = {
    Run,
    Scatter,
    internals, }
