
'use strict'

#-----------------------------------------------------------------------------------------------------------
enumerate_prototypes_and_methods = ( clasz ) ->
  prototype = clasz::
  seen      = new Set()
  R         = {}
  while prototype? and ( prototype isnt Object.prototype )
    for key, descriptor of Object.getOwnPropertyDescriptors prototype
      continue if key is 'constructor'
      continue if seen.has key
      continue unless ( typeof descriptor.value ) is 'function'
      R[ key ] = { prototype, descriptor, }
    prototype = Object.getPrototypeOf prototype
  return R

#-----------------------------------------------------------------------------------------------------------
wrap_methods_of_prototypes = ( clasz, handler = -> ) ->
  for key, { prototype, descriptor, } of enumerate_prototypes_and_methods clasz
    do ( key, prototype, descriptor ) ->
      method = descriptor.value
      descriptor.value = ( P... ) ->
        handler { key, prototype, }
        return method.call @, P...
      Object.defineProperty prototype, key, descriptor
  ;null

#-----------------------------------------------------------------------------------------------------------
module.exports = { enumerate_prototypes_and_method, wrap_methods_of_prototype, }


