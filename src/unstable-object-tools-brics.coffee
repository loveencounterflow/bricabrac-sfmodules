'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_clean_assign: ->

    #-------------------------------------------------------------------------------------------------------
    clean = ( x ) ->
      throw new Error "Ωrca___1 unable to clean frozen object" if Object.isFrozen x
      delete x[ k ] for k, v of x when v is undefined
      return x

    #-------------------------------------------------------------------------------------------------------
    clean_all = ( P... ) -> ( ( clean x ) for x in P )

    #-------------------------------------------------------------------------------------------------------
    clean_assign  = ( target, P...  ) ->
      R = clean target
      for p in P
        R[ k ] = v for k, v of p when v isnt undefined
      return R

    #-------------------------------------------------------------------------------------------------------
    return exports = { clean, clean_all, clean_assign, }

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_pick: ->

    #-------------------------------------------------------------------------------------------------------
    pick = ( x, keys ) ->
      return Object.fromEntries ( [ key, x[ key ], ] for key from keys )

    #-------------------------------------------------------------------------------------------------------
    return exports = { pick, }

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_deploy: ->

    #-------------------------------------------------------------------------------------------------------
    deploy = ( x, keygroups... ) ->
      return [] unless keygroups.length > 0
      R = []
      for keygroup, idx in keygroups
        R.push Object.fromEntries ( [ key, x[ key ], ] for key in keygroup )
      return R

    #-------------------------------------------------------------------------------------------------------
    return exports = { deploy, }


  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_remap: ->

    #-------------------------------------------------------------------------------------------------------
    ### TAINT use module ###
    isa_function = ( x ) -> ( Object::toString.call x ) is '[object Function]'

    #-------------------------------------------------------------------------------------------------------
    omit = Symbol 'omit'

    #-------------------------------------------------------------------------------------------------------
    remap = ( x, mapping ) ->
      ### TAINT unify with `letsfreezethat-infra#project()`? ###
      throw new Error "Ωrca___2 unable to remap frozen object" if Object.isFrozen x
      original_keys = Object.getOwnPropertyNames x
      tmp           = {}
      for original_key in original_keys
        mapped_key        = mapping[ original_key ] ? original_key
        switch true
          when mapped_key is omit       then  null
          when isa_function mapped_key  then  Object.assign tmp, mapped_key x[ original_key ], original_key
          else                                tmp[ mapped_key ] = x[ original_key ]
        delete x[ original_key ]
      return Object.assign x, tmp

    #.......................................................................................................
    return exports = { remap, omit, }

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_get_prototype_chain: ->

    #-------------------------------------------------------------------------------------------------------
    get_prototype_chain = ( x ) ->
      return [] unless x?
      R = [ x, ]
      loop
        break unless ( x = Object.getPrototypeOf x )?
        R.push x
      return R

    #-------------------------------------------------------------------------------------------------------
    get_all_in_prototype_chain = ( x, name, take = ( ( x ) -> x? ) ) ->
      seen      = new Set()
      R         = []
      for protoype in get_prototype_chain x
        continue unless Object.hasOwn protoype, name
        continue unless take ( value = protoype[ name ] )
        R.push value
      return R

    #.......................................................................................................
    return exports = { get_prototype_chain, get_all_in_prototype_chain, }


#===========================================================================================================
Object.assign module.exports, BRICS

