
'use strict'


#===========================================================================================================
{ nameit,                     } = ( require './various-brics' ).require_nameit()


#-----------------------------------------------------------------------------------------------------------
get_prototype_chain = ( x ) ->
  return [] unless x?
  R = [ x, ]
  loop
    break unless ( x = Object.getPrototypeOf x )?
    R.push x
  return R

#-----------------------------------------------------------------------------------------------------------
get_all_in_prototype_chain = ( x, name, take = ( ( x ) -> x? ) ) ->
  seen      = new Set()
  R         = []
  for protoype in get_prototype_chain x
    continue unless Object.hasOwn protoype, name
    continue unless take ( value = protoype[ name ] )
    R.push value
  return R

#-----------------------------------------------------------------------------------------------------------
enumerate_prototypes_and_methods = ( clasz ) ->
  prototype = clasz::
  seen      = new Set()
  R         = {}
  while prototype? and ( prototype isnt Object.prototype )
    for name, descriptor of Object.getOwnPropertyDescriptors prototype
      continue if name is 'constructor'
      continue if seen.has name
      continue unless ( typeof descriptor.value ) is 'function'
      R[ name ] = { prototype, descriptor, }
    prototype = Object.getPrototypeOf prototype
  return R

#-----------------------------------------------------------------------------------------------------------
wrap_methods_of_prototypes = ( clasz, handler ) ->
  for name, { prototype, descriptor, } of enumerate_prototypes_and_methods clasz
    do ( name, prototype, descriptor ) ->
      method = descriptor.value
      # descriptor.value = nameit "$wrapped_#{name}", ( P... ) ->
      #   return handler { name, prototype, context: @, P, }
      #   # return handler { name, prototype, P, }
      #   # return method.call @, P...
      # Object.defineProperty prototype, name, descriptor
  ;null


#-----------------------------------------------------------------------------------------------------------
module.exports = {
  get_prototype_chain,
  get_all_in_prototype_chain,
  enumerate_prototypes_and_methods,
  wrap_methods_of_prototypes, }
