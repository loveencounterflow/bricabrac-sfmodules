
'use strict'

#===========================================================================================================
{ debug,                      } = console
# { nameit,                     } = ( require './various-brics' ).require_nameit()
{ enumerate_prototypes_and_methods,
  wrap_methods_of_prototypes, } = require './prototype-tools'
{ hide,
  set_getter,                 } = ( require './various-brics' ).require_managed_property_tools()

#===========================================================================================================
class Coverage_analyzer

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    @counts = {}
    ;undefined

  #---------------------------------------------------------------------------------------------------------
  wrap_class: ( clasz ) ->
    for name, { fqname, prototype, descriptor, } of enumerate_prototypes_and_methods clasz
      @counts[ fqname ] ?= 0
    handler = ({ fqname, callme, }) =>
      @counts[ fqname ]++
      return callme()
    wrap_methods_of_prototypes clasz, handler
    ;null

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'unused_names',     -> ( name for name, count of @counts when count is    0 )
  set_getter @::, 'used_names',       -> ( name for name, count of @counts when count isnt  0 )
  set_getter @::, 'names_by_counts',  ->
    R = {}
    for name, count of @counts
      ( R[ count ] ?= [] ).push name
    return R


#-----------------------------------------------------------------------------------------------------------
module.exports = { Coverage_analyzer, }




