
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
  class Selector
    constructor: ( selectors... ) ->
      { selectors_rpr,
        selectors,  } = _normalize_selectors selectors...
      @selectors_rpr  = selectors_rpr
      @data           = if selectors.size is 0 then true else false
      @cues           = false
      for selector from selectors
        switch true
          when selector is 'data#*' then @data = true
          when selector is 'cue#*' then @cues = true
          when ( match = selector.match /^data#(?<id>.+)$/ )?
            ### TAINT mention original selector next to normalized form ###
            throw new Error "Ωjstrm_188 IDs on data items not supported, got #{selector}"
          when ( match = selector.match /^cue#(?<id>.+)$/ )?
            @cues = new Set() if @cues in [ true, false, ]
            @cues.add match.groups.id
          else null
      @accept_all     = ( @data is true ) and ( @cues is true )
      return undefined

    #-------------------------------------------------------------------------------------------------------
    _get_excerpt: -> { data: @data, cues: @cues, accept_all: @accept_all, }

    #-------------------------------------------------------------------------------------------------------
    select: ( item ) ->
      return true if @accept_all
      if is_cue = ( typeof item ) is 'symbol'
        return true   if @cues is true
        return false  if @cues is false
        return @cues.has id_from_symbol item
      return true   if @data is true
      return false  if @data is false
      throw new Error "Ωjstrm_189 IDs on data items not supported in selector #{rpr @toString}"
      # return @data.has id_from_value item

    #-------------------------------------------------------------------------------------------------------
    ### TAINT should provide method to generate normalized representation ###
    toString: -> @selectors_rpr

  #---------------------------------------------------------------------------------------------------------
  id_from_symbol = ( symbol ) ->
    R = String symbol
    return ( R )[ 7 ... R.length - 1 ]

  #---------------------------------------------------------------------------------------------------------
  selectors_as_list = ( selectors... ) ->
    return [] if selectors.length is 0
    selectors = selectors.flat Infinity
    return [] if selectors.length is 0
    return [ '', ] if selectors.length is 1 and selectors[ 0 ] is ''
    selectors = selectors.join ','
    selectors = selectors.replace /\s+/g, '' ### TAINT not generally possible ###
    selectors = selectors.split ',' ### TAINT not generally possible ###
    return selectors

  #---------------------------------------------------------------------------------------------------------
  normalize_selectors = ( selectors... ) -> ( _normalize_selectors selectors... ).selectors

  #---------------------------------------------------------------------------------------------------------
  _normalize_selectors = ( selectors... ) ->
    selectors     = selectors_as_list selectors...
    selectors_rpr = selectors.join ', '
    R             = new Set()
    for selector in selectors
      switch true
        when selector is ''             then null
        when selector is '#'            then R.add "cue#*"
        when /^#.+/.test selector       then R.add "cue#{selector}"
        when /.+#$/.test selector       then R.add "#{selector}*"
        when not /#/.test selector      then R.add "#{selector}#*"
        else R.add selector
    R.add 'data#*' if R.size is 0
    R.delete '' if R.size isnt 1
    return { selectors: R, selectors_rpr, }


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
      @shelf      = []
      return undefined

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'length',   -> @transforms.length
    set_getter @::, 'is_empty', -> @transforms.length is 0

    #=======================================================================================================
    send: ( ds... ) ->
      @shelf.splice @shelf.length, 0, ds...
      return null

    #-------------------------------------------------------------------------------------------------------
    cue: ( names ) -> @send ( Symbol name for name in names )...

    #=======================================================================================================
    get_first: ( P... ) ->
      if ( R = @run P... ).length is 0
        throw new Error "Ωjstrm___1 no result"
      return R[ 0 ]

    #-------------------------------------------------------------------------------------------------------
    run: ( P... ) -> [ ( @walk P... )..., ]

    #-------------------------------------------------------------------------------------------------------
    walk: ( ds... ) ->
      @send ds...
      #.....................................................................................................
      if @is_empty
        while @shelf.length > 0
          yield @shelf.shift()
        return null
      #.....................................................................................................
      while @shelf.length > 0
        yield from @transforms[ 0 ] @shelf.shift()
      return null

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
  internals = Object.freeze {
    CFG,
    type_of,
    Selector,
    _normalize_selectors,
    normalize_selectors,
    selectors_as_list,
    id_from_symbol, }
  return exports = { Jetstream, $, internals, }



#===========================================================================================================
Object.assign module.exports, do => { require_jetstream, }
