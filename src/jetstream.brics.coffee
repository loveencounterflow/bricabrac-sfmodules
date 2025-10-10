
'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
require_jetstream = ->
  { nameit,               } = ( require './various-brics' ).require_nameit()
  { type_of: _type_of,    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
  { hide,
    set_getter,           } = ( require './various-brics' ).require_managed_property_tools()
  CFG                       = Symbol 'CFG'

  #=========================================================================================================
  type_of = ( x ) -> if ( x instanceof Jetstream ) then 'jetstream' else _type_of x

  #=========================================================================================================
  $ = ( cfg, gfn ) ->
    switch type = type_of gfn
      when 'jetstream'         then R = nameit '(cfg)_(jetstream)',           ( d ) -> yield from gfn.walk.call @, d
      when 'function'          then R = nameit "(cfg)_(watcher)_#{gfn.name}", ( d ) -> gfn.call @, d; yield d
      when 'generatorfunction' then R = nameit "(cfg)_#{gfn.name}",           ( d ) -> yield from gfn.call @, d
    R[CFG] = cfg
    return R

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
        throw new Error "Ωjstrm___1 no result"
      return R[ 0 ]

    #-------------------------------------------------------------------------------------------------------
    run: ( P... ) -> [ ( @walk P... )..., ]

    #-------------------------------------------------------------------------------------------------------
    walk: ( d ) ->
      return yield d if @is_empty
      yield from @transforms[ 0 ] d

    #-------------------------------------------------------------------------------------------------------
    push: ( gfn ) ->
      switch type = type_of gfn
        when 'jetstream'
          original_gfn  = gfn
          gfn           = nameit '(jetstream)', ( d ) -> yield from original_gfn.walk d
        when 'function'
          original_gfn  = gfn
          gfn           = nameit "(watcher)_#{original_gfn.name}", ( d ) -> original_gfn d; yield d
        when 'generatorfunction'
          null
        else throw new Error "Ωjstrm___2 expected a jetstream or a synchronous function or generator function, got a #{type}"
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
      yielder     = null
      #.....................................................................................................
      R = nameit "(managed)_#{gfn.name}", do ( me = @ ) -> ( d ) ->
        unless nxt?
          nxt = me.transforms[ my_idx + 1 ]
          if nxt? then  yielder = ( d ) -> ( yield from nxt j  ) for j from gfn d
          else          yielder = ( d ) -> ( yield j           ) for j from gfn d
        #...................................................................................................
        yield from yielder first if has_first
        yield from yielder d
        yield from yielder last  if has_last
        #...................................................................................................
        return null
      #.....................................................................................................
      @transforms.push R
      return R

  #=========================================================================================================
  internals = Object.freeze { CFG, type_of, }
  return exports = { Jetstream, $, internals, }



#===========================================================================================================
Object.assign module.exports, { require_jetstream, }
