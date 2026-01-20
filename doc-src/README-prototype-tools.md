

# Prototype Tools


## Usage Example

```coffee
{ enumerate_prototypes_and_methods,
  wrap_methods_of_prototypes, } = require 'bricabrac-sfmodules/lib/prototype-tools'
```

* **`enumerate_prototypes_and_methods = ( clasz ) ->`**: Given an ES class object, return an object whose
  keys are method names and whose values are objects in the shape of `{ prototype, descriptor, }`, where
  `prototype` contains the object that the method was found on and `descriptor` is the object descriptor as
  returned by `Object.getOwnPropertyDescriptor()`. The algorithm will start to examine `clasz::` (i.e.
  `clasz.prototype`) for own property descriptors and add all descriptors whose values are `function`s and
  then proceed to do the same recursively with the result of `Object.getPrototypeOf clasz::` and so on until
  it arrives at the end of the prototype chain. The result is useful to wrap methods of classes (and is used
  by `wrap_methods_of_prototypes()`, below) while ensuring that *all* instances of those classes use the
  wrapped versions right from instance creation onwards.

* **`wrap_methods_of_prototypes = ( clasz, handler = -> ) ->`**: given an ES class object and a `handler`
  function, re-define all `function`s defined on `clasz::` (i.e. `clasz.prototype`) and its prototypes to
  first call the handler as `handler { name, prototype, }, P...` (where `name` is the method's name,
  `prototype` the object it was found on, and `P...` represents the arguments of the method call), and only
  then the original method in its original context as `method.call @, P...`.


## To Do

* **`[—]`** Examples
* **`[—]`** Should extend to cover the other callable types (`generatorfunctions`s, `asyncfunction`s, ...)

## Is Done

* **`[+]`** Move `enumerate_prototypes_and_methods()` and `wrap_methods_of_prototypes()` to `object-tools`


<!-- ## Won't Do -->


<!-- * **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with -->
