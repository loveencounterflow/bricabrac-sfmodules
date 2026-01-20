

# Coverage Analyzer


## Usage Example

```coffee
{ Coverage_analyzer, } = require '../../../apps/bricabrac-sfmodules/lib/coverage-analyzer'
ca = new Coverage_analyzer()
ca.wrap_class My_class
db = new My_class()
debug 'Ωbbdbr_320', ca
warn 'Ωbbdbr_320', ca.unused_names
help 'Ωbbdbr_320', ca.used_names
help 'Ωbbdbr_320', ca.counts
```



## To Do

<!-- * **`[—]`** Move `enumerate_prototypes_and_methods()` and `wrap_methods_of_prototypes()` to `object-tools` -->

## Is Done

* **`[+]`** Move `enumerate_prototypes_and_methods()` and `wrap_methods_of_prototypes()` to `object-tools`


<!-- ## Won't Do -->


<!-- * **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with -->
