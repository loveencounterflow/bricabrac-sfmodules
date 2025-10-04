'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_dictionary_tools: ->

    #===========================================================================================================
    expand = ( strings, key, seen = new Set() ) ->
      if seen.has key
        throw new Error "Ωdito___1 cyclic reference detected for #{key}"
      unless Reflect.has strings, key
        throw new Error "Ωdito___2 unknown key #{key}"
      seen.add key
      value = strings[ key ]
      for k, v of strings
        value = value.replaceAll k, -> expand strings, k, seen
      return value


    #===========================================================================================================
    expand_dictionary = ( strings ) ->
      ### Expand all string values by recursively replacing keys with their mapped values ###
      R         = {}
      R[ key ]  = expand strings, key for key of strings
      return R

    #.......................................................................................................
    return exports = { expand_dictionary, internals: { expand, }, }

#===========================================================================================================
Object.assign module.exports, BRICS

