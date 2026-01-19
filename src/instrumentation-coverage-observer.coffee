
'use strict'

#===========================================================================================================
{ nameit,                     } = ( require './various-brics' ).require_nameit()


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
wrap_methods_of_prototypes = ( clasz, handler = -> ) ->
  for name, { prototype, descriptor, } of enumerate_prototypes_and_methods clasz
    do ( name, prototype, descriptor ) ->
      method = descriptor.value
      descriptor.value = nameit "$wrapped_#{name}", ( P... ) ->
        handler { name, prototype, }
        return method.call @, P...
      Object.defineProperty prototype, name, descriptor
  ;null

#-----------------------------------------------------------------------------------------------------------
module.exports = { enumerate_prototypes_and_methods, wrap_methods_of_prototypes, }




