

# Instrumentation: Coverage Observer


## Usage Example

```coffee
{ enumerate_prototypes_and_method,
  wrap_methods_of_prototype, } = require 'bricabrac-sfmodules/lib/instrumentation-coverage-observer'
catalog       = enumerate_prototypes_and_methods Dbric_std
known_names   = new Set Object.keys catalog
unused_names  = new Set known_names
used_names    = new Set()
handler       = ({ key, }) ->
  info 'Ωbbdbr_318', key
  unused_names.delete key
  used_names.add key
wrap_methods Dbric_std, handler
db = new Dbric_std()
warn 'Ωbbdbr_319', unused_names
help 'Ωbbdbr_320', used_names
db._get_acquisition_chain()
warn 'Ωbbdbr_321', unused_names
help 'Ωbbdbr_322', used_names
```



<!-- ## To Do -->

<!-- * **`[—]`** DBric: paramterized views as in DBay `parametrized-views.demo` -->

<!-- ## Won't Do -->


<!-- * **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with -->
