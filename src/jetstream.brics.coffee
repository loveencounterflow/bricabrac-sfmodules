
'use strict'

#===========================================================================================================
{ debug, }  = console


############################################################################################################
#
#===========================================================================================================
require_jetstream = ->
  { nameit,               } = ( require './various-brics' ).require_nameit()
  { type_of: _type_of,    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
  { hide,
    set_getter,           } = ( require './various-brics' ).require_managed_property_tools()

  #=========================================================================================================
  ### TAINT use proper typing ###
  type_of                 = ( x ) -> if ( x instanceof Jetstream ) then 'jetstream' else _type_of x
  misfit                  = Symbol 'misfit'
  jetstream_cfg_template  = { outlet: 'data#*', pick: 'all', fallback: misfit, }

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
            throw new Error "Ωjstrm___1 IDs on data items not supported, got #{selector}"
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
      throw new Error "Ωjstrm___2 IDs on data items not supported in selector #{rpr @toString}"
      # return @data.has id_from_value item

    #-------------------------------------------------------------------------------------------------------
    ### TAINT should provide method to generate normalized representation ###
    toString: -> @selectors_rpr

  #---------------------------------------------------------------------------------------------------------
  id_from_symbol = ( symbol ) -> R = String symbol; ( R )[ 7 ... R.length - 1 ]

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
        when selector is '*'            then R.add "data#*"; R.add "cue#*"
        when selector is '#'            then R.add "cue#*"
        when /^#.+/.test selector       then R.add "cue#{selector}"
        when /.+#$/.test selector       then R.add "#{selector}*"
        when not /#/.test selector      then R.add "#{selector}#*"
        else R.add selector
    R.add 'data#*' if R.size is 0
    R.delete '' if R.size isnt 1
    return { selectors: R, selectors_rpr, }


  # #=========================================================================================================
  # $ = ( cfg, gfn ) ->
  #   switch type = type_of gfn
  #     when 'jetstream'         then R = nameit '(cfg)_(jetstream)',           ( d ) -> yield from gfn.walk.call @, d
  #     when 'function'          then R = nameit "(cfg)_(watcher)_#{gfn.name}", ( d ) -> gfn.call @, d; yield d
  #     when 'generatorfunction' then R = nameit "(cfg)_#{gfn.name}",           ( d ) -> yield from gfn.call @, d
  #   R[CFG] = cfg
  #   return R

  #=========================================================================================================
  class Jetstream

    # #-------------------------------------------------------------------------------------------------------
    # @$: $
    # $:  $

    #-------------------------------------------------------------------------------------------------------
    constructor: ( cfg ) ->
      ### TAINT use Object.freeze, push sets new array ###
      @configure cfg
      @transforms = []
      @shelf      = []
      return undefined

    #-------------------------------------------------------------------------------------------------------
    configure: ( cfg ) ->
      @cfg    = { jetstream_cfg_template..., cfg..., }
      @outlet = new Selector @cfg.outlet
      ;null

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'length',   -> @transforms.length
    set_getter @::, 'is_empty', -> @transforms.length is 0

    #=======================================================================================================
    send: ( ds... ) -> @shelf.splice @shelf.length, 0, ds... ;null

    #-------------------------------------------------------------------------------------------------------
    cue: ( names ) -> @send ( Symbol name for name in names )... ;null

    #=======================================================================================================
    get_first: ( P... ) ->
      R = [ ( @walk P... )..., ]
      if R.length is 0
        throw new Error "Ωjstrm___3 no results" if @cfg.fallback is misfit
        return @cfg.fallback
      return R.at 0

    #-------------------------------------------------------------------------------------------------------
    get_last: ( P... ) ->
      R = [ ( @walk P... )..., ]
      if R.length is 0
        throw new Error "Ωjstrm___4 no results" if @cfg.fallback is misfit
        return @cfg.fallback
      return R.at -1

    #-------------------------------------------------------------------------------------------------------
    run: ( P... ) ->
      R = [ ( @walk P... )..., ]
      return R unless @cfg.pick in [ 'first', 'last', ]
      if R.length is 0
        throw new Error "Ωjstrm___5 no results" if @cfg.fallback is misfit
        return @cfg.fallback
      return R.at  0 if @cfg.pick is 'first'
      return R.at -1

    #-------------------------------------------------------------------------------------------------------
    walk: ( ds... ) ->
      @send ds...
      return @_walk_and_pick()

    #-------------------------------------------------------------------------------------------------------
    _walk_and_pick: ->
      previous  = misfit
      count     = 0
      #.....................................................................................................
      for value from @_walk_all_to_exhaustion()
        count++
        if ( count is 1 ) and ( @cfg.pick is 'first' )
          yield value
        else if @cfg.pick is 'all'
          yield value
        previous = value
      #.....................................................................................................
      yield previous if ( @cfg.pick is 'last' ) and ( count > 0 )
      ;null

    #-------------------------------------------------------------------------------------------------------
    _walk_all_to_exhaustion: ->
      #.....................................................................................................
      if @is_empty
        while @shelf.length > 0
          yield @shelf.shift()
        ;null
      #.....................................................................................................
      while @shelf.length > 0
        yield from @transforms[ 0 ] @shelf.shift()
      #.....................................................................................................
      ;null

    #-------------------------------------------------------------------------------------------------------
    configure_transform: ( selectors..., tfm ) -> ( @_configure_transform selectors..., tfm ).tfm

    #-------------------------------------------------------------------------------------------------------
    _configure_transform: ( selectors..., tfm ) ->
      selector      = new Selector selectors...
      original_tfm  = tfm
      #.....................................................................................................
      switch type = type_of tfm
        #...................................................................................................
        when 'jetstream'
          tfm = nameit '(jetstream)', ( d ) ->
            return yield d unless selector.select d
            yield from original_tfm.walk d ;null
        #...................................................................................................
        when 'function'
          tfm = nameit "(watcher)_#{original_tfm.name}", ( d ) ->
            return yield d unless selector.select d
            original_tfm d; yield d ;null
        #...................................................................................................
        when 'generatorfunction'
          tfm = nameit "(generator)_#{original_tfm.name}", ( d ) ->
            return yield d unless selector.select d
            yield from original_tfm d ;null
        #...................................................................................................
        else throw new Error "Ωjstrm___6 expected a jetstream or a synchronous function or generator function, got a #{type}"
      #.....................................................................................................
      return { tfm, original_tfm, type, }

    #-------------------------------------------------------------------------------------------------------
    push: ( selectors..., tfm ) ->
      tfm         = @configure_transform selectors..., tfm
      my_idx      = @transforms.length
      #.....................................................................................................
      nxt         = null
      yielder     = null
      #.....................................................................................................
      R = nameit "(managed)_#{tfm.name}", do ( me = @ ) -> ( d ) ->
        unless nxt?
          nxt = me.transforms[ my_idx + 1 ]
          if nxt? then  yielder = ( d ) -> ( yield from nxt j               ) for j from tfm d ;null
          else          yielder = ( d ) -> ( yield j if me.outlet.select j  ) for j from tfm d ;null
        #...................................................................................................
        yield from yielder d ;null
      #.....................................................................................................
      @transforms.push R
      return R

  #=========================================================================================================
  internals = Object.freeze {
    type_of,
    misfit,
    jetstream_cfg_template,
    Selector,
    _normalize_selectors,
    normalize_selectors,
    selectors_as_list,
    id_from_symbol, }
  return exports = { Jetstream, internals, }
  # return exports = { Jetstream, $, internals, }



#===========================================================================================================
Object.assign module.exports, do => { require_jetstream, }
