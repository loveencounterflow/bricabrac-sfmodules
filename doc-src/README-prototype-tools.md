

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
  call the handler instead of the original method. The handler will be passed an object `{ name, fqname,
  prototype, method, context, P, callme, }` where

  * `name` is the method's name,
  * `fqname` is the concatenation of the prototype's constructor's name, a dot, and the method's name,
  * `prototype` is the object is was found on,
  * `context` represents the instance (what [the docs]() call `thisArg`, i.e. the first argument to
    `Function::apply()` and `Function::call()`),
  * `P` is an array with the arguments, and
  * `callme` is a ready-made convenience function defined as `callme = ( -> method.call @, P... ).bind @`
    that can be called by the handler to execute the original method and obtain its return value.

  This setup gives handlers a maximum of flexibility to intercept and change arguments, to measure the
  execution time of methods and to look at and change their return values. A conservative wrapper that only
  takes notes on which methods have been called would not need to make use of `prototype`, `method`,
  `context`,  or `P` and could look like this:

  ```coffee
  counts = {}
  handler = ({ name, fqname, prototype, method, context, P, callme, }) ->
    counts[ name ] = ( counts[ name ] ? 0 ) + 1
    return callme()
  ```

  A more invasive handler could record the return value as `R = method.call context, [ P..., extra_argument,
  ]` and access `R` before returning it as a proxy for the original method.

  An important characteristic of `wrap_methods_of_prototypes()` is that the class you pass in and all the
  classes it extends directly or transitively will get their methods wrapped, which will affect the entirety
  of the current execution context (the process). This is different from instrumenting instances where it is
  easier to restrict the effects of instrumentation to the scope of, say, a single unit test case—typically
  each# case in your entire test suite will get to use a wrapped version of the instrumented class once you
  have instrumented it with `wrap_methods_of_prototypes()`.

## To Do

* **`[—]`** Examples
* **`[—]`** Should extend to cover the other callable types (`generatorfunctions`s, `asyncfunction`s, ...)

## Is Done

* **`[+]`** Move `enumerate_prototypes_and_methods()` and `wrap_methods_of_prototypes()` to `object-tools`


<!-- ## Won't Do -->


<!-- * **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with -->
