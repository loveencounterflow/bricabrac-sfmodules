
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

  #=========================================================================================================
  $ = ( cfg, fn ) ->
    fn[CFG] = cfg
    return fn

  #=========================================================================================================
  class Pipeline

    #-------------------------------------------------------------------------------------------------------
    @$: $
    $:  $

    #-------------------------------------------------------------------------------------------------------
    constructor: ->
      ### TAINT use Object.freeze, push sets new array ###
      @transforms = []
      me          = @
      callable    = ( d ) -> yield from if me.is_empty then [ d, ] else me.transforms[ 0 ] d
      Object.setPrototypeOf callable, @
      return callable

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'length',   -> @transforms.length
    set_getter @::, 'is_empty', -> @transforms.length is 0

    #-------------------------------------------------------------------------------------------------------
    push: ( gfn ) ->
      switch type = type_of gfn
        when 'function'
          original_gfn  = gfn
          if gfn instanceof Pipeline
            gfn           = ( d ) -> yield from original_gfn d
          else
            gfn           = ( d ) -> original_gfn d; yield d
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


  #.........................................................................................................
  do ->
    first   = Symbol '(first)'
    last    = Symbol '(last)'
    p       = new Pipeline()
    p.push upper    = ( d              ) -> yield d.toUpperCase()
    p.push ex       = ( d, mark = '!'  ) -> yield d + mark
    # p.push nothing  = ( d              ) -> urge 'Ωap___6', 'nothing:', rpr d; yield return null
    # p.push add      = ( d              ) -> urge 'Ωap___7', 'add:    ', rpr d; yield """Let's say: \""""; yield d; yield '".'
    p.push watch = ( d ) -> help 'Ωap___8', rpr d
    p.push $ { first, last, }, add_2 = ( d ) ->
      # urge 'Ωap___9', 'add_2:    ', rpr d
      return yield """Let's say: \""""  if d is first
      return yield '".'                 if d is last
      yield d
    p.push watch = ( d ) -> urge 'Ωap__10', rpr d
    #.......................................................................................................
    debug 'Ωap__11', p
    info 'Ωap__12', [ ( d for d from p 'hidey-ho' )..., ]
    info 'Ωap__13', [ ( d for d from p 'hidey-ho' )..., ].join ''
    info 'Ωap__14', [ ( d for d from p 'hidey-ho' )..., ].join ''
    return null
  #.........................................................................................................
  do ->
    ### empty pipeline is a pipeline without transforms, so data is passed through untransformed: ###
    debug 'Ωap__15', type_of ( new Pipeline() )
    debug 'Ωap__16', type_of ( new Pipeline() ) 'data'
    debug 'Ωap__17', [ ( ( new Pipeline() ) 'data' )..., ]
    collector = []
    #.......................................................................................................
    p_1 = new Pipeline()
    p_1.push ( d ) -> collector.push 'p1-t1'; yield d + ' № 1'
    p_1.push ( d ) -> collector.push 'p1-t2'; yield d + ' № 2'
    #.......................................................................................................
    p_2 = new Pipeline()
    p_2.push ( d ) -> collector.push 'p2-t1'; yield d + ' № 3'
    p_2.push p_1
    p_2.push ( d ) -> collector.push 'p2-t2'; yield d + ' № 4'
    #.......................................................................................................
    p_3 = new Pipeline()
    p_3.push ( d ) -> collector.push 'p3-t1'; yield d + ' № 5'
    p_3.push p_2
    p_3.push ( d ) -> collector.push 'p3-t2'; yield d + ' № 6'
    info 'Ωap__18', d for d from p_3 'my-data'
    help 'Ωap__19', collector
  #.........................................................................................................
  return null


#===========================================================================================================
Object.assign module.exports, { require_jetstream, }
