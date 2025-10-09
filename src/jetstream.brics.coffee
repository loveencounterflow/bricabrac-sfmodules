
'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
require_jetstream = ->
  { nameit,               } = ( require './various-brics' ).require_nameit()
  { type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
  { hide,
    set_getter,           } = ( require './various-brics' ).require_managed_property_tools()
  CFG                       = Symbol 'CFG'
  internals                 = Object.freeze { CFG, }

  #=========================================================================================================
  $ = ( cfg, fn ) ->
    ### TAINT do not change original function ###
    fn[CFG] = cfg
    return fn

  #=========================================================================================================
  class Jetstream

    #-------------------------------------------------------------------------------------------------------
    @$: $
    $:  $

    #-------------------------------------------------------------------------------------------------------
    constructor: ->
      ### TAINT use Object.freeze, push sets new array ###
      @transforms = []
      return undefined

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'length',   -> @transforms.length
    set_getter @::, 'is_empty', -> @transforms.length is 0

    #-------------------------------------------------------------------------------------------------------
    get_first: ( P... ) ->
      if ( R = @run P... ).length is 0
        throw new Error "Ωjstrm___3 no result"
      return R[ 0 ]

    #-------------------------------------------------------------------------------------------------------
    run: ( P... ) -> [ ( @walk P... )..., ]

    #-------------------------------------------------------------------------------------------------------
    walk:       ( d ) ->
      return yield d if @is_empty
      yield from @transforms[ 0 ] d

    #-------------------------------------------------------------------------------------------------------
    push: ( gfn ) ->
      switch type = type_of gfn
        when 'function'
          original_gfn  = gfn
          if gfn instanceof Jetstream
            gfn = nameit 'jetstream', ( d ) -> yield from original_gfn d
          else
            gfn = nameit "(watcher)_#{original_gfn.name}", ( d ) -> original_gfn d; yield d
        when 'generatorfunction'
          null
        else "throw new Error expect a synchronous function or a synchronous generator function, got a #{type}"
      #.....................................................................................................
      my_idx      = @transforms.length
      first       = null
      last        = null
      has_first   = false
      has_last    = false
      #.....................................................................................................
      if ( cfg = gfn[ CFG ] )?
        has_first   = Reflect.has cfg, 'first'
        has_last    = Reflect.has cfg, 'last'
        first       = cfg.first if has_first
        last        = cfg.last  if has_last
      #.....................................................................................................
      nxt         = null
      has_nxt     = null
      #.....................................................................................................
      R = nameit gfn.name, do ( me = @ ) -> ( d ) ->
        unless nxt?
          nxt             = me.transforms[ my_idx + 1 ]
          has_nxt         = nxt?
        #...................................................................................................
        yield from gfn first if has_first
        if has_nxt  then  ( yield from nxt j  ) for j from gfn d
        else              ( yield j           ) for j from gfn d
        yield from gfn last if has_last
        #...................................................................................................
        return null
      #.....................................................................................................
      @transforms.push R
      return R

  #=========================================================================================================
  return exports = { Jetstream, $, internals, }



#===========================================================================================================
Object.assign module.exports, { require_jetstream, }
