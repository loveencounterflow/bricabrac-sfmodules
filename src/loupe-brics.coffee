'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_loupe: ->
    { custom,
      inspect,
      registerConstructor,
      registerStringTag, } = require '../dependencies/loupe-2.js'
    rpr = ( x ) ->
      return '0'          if x is 0 ### NOTE catches +0, -0 ###
      return 'null'       if x is null
      return 'undefined'  if x is undefined
      return '+Infinity'  if x is +Infinity
      return '-Infinity'  if x is -Infinity
      return ''           if x is ''
      return inspect x
    return exports = { rpr, internals: { custom, registerConstructor, registerStringTag, }, }

#===========================================================================================================
Object.assign module.exports, BRICS

