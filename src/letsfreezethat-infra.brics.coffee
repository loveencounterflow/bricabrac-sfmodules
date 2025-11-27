'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_letsfreezethat_infra: ->

    #=======================================================================================================
    { type_of,                } = ( require './unstable-rpr-type_of-brics' ).require_type_of()

    #=======================================================================================================
    s =
      take:     Symbol 'take'
      toss:     Symbol 'toss'
      call:     Symbol 'call'
      error:    Symbol 'error'
      assign:   Symbol 'assign'
      dive:     Symbol 'dive'
    s.fallback = s.error

    internals = {}
    #=======================================================================================================
    class Howto extends Map

    #-------------------------------------------------------------------------------------------------------
    fallback = { action: 'error', }

    #-------------------------------------------------------------------------------------------------------
    class Project
      project = ( x, howto = new Howto() ) ->
        howto = ( new Howto howto ) unless howto instanceof Howto
        # unless ( )
        if x?
          protoype  = Object.getPrototypeOf x
          R         = if protoype?  then ( new x.constructor ) else ( Object.create null )
          switch action
            when 'assign'
              Object.assign R, x
            when 'dive'
              for k, v of x
                R[ k ] = clone v
            else throw new Error "Ωlfti___1 unknown action #{rpr_string action}"
          return R
        else
          protoype  = null
          R     = x
        ;null

    #-------------------------------------------------------------------------------------------------------
    known_prototypes = [
      ( Object.getPrototypeOf {} )
      ( Object.getPrototypeOf Object.create null )
      ( Object.getPrototypeOf [] )
      ]

    #-------------------------------------------------------------------------------------------------------
    simple =
      freeze: Object.freeze
      lets: ( d, P..., fn ) ->
        unless d?
          throw new Error "Ωlfti___2 unable to process values of type #{type_of d}"
        unless ( prototype = Object.getPrototypeOf d ) in known_prototypes
          throw new Error "Ωlfti___3 unable to process values of type #{type_of d}"
        R = if prototype? then ( new d.constructor ) else ( Object.create null )
        Object.assign R, d
        fn R, P... if fn?
        return Object.freeze R

    #.......................................................................................................
    return exports = { simple, internals, }

#===========================================================================================================
Object.assign module.exports, BRICS

