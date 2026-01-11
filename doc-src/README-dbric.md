

# DBric Database Adapter

* can use `node:sqlite` ('nSQL') or `better-sqlite3` ('bSQL') as implementation class for the `Dbric::db`
  property, but since there are subtle (and not so subtle) differences in behavior and capabilities, it will
  probably be best to choose one of the two and stick to it.
  * generally recommended to use bSQL (`better-sqlite3`) as it has stricter error handling (e.g. bSQL will
    complain when a statement without required parameters is executed, nSQL has been found to silently
    assume `null` for missing parameters).
  * subtle differences in the interpretation of options for UDF aggregate functions

* handlers invoked for lifetime stages:
  * `on_create()`
  * `on_prepared()`
  * `on_fresh()`
  * `on_populated()`

* consider to apply [Gaps and Islands empty select statements for referential integrity
  (ESSFRIs)](https://github.com/loveencounterflow/gaps-and-islands?tab=readme-ov-file#essfri-improving-integrity-checks-in-sqlite)
  (i.e. `select * from my_view where false;`) to newly created views
  * alternatively, implement a method to do zero-row selects from all relations / only views; call it
    always on instantiation
  * create a method to do system-defined and user-defined health checks on DB

* generate `insert` statements
* implement the optiona to generate `trigger`s to be called before each `insert`, thus enabling error
  messages that quote the offending row; this could be enabled by registering a function with a suitable
  known name, such as `trigger_on_before_insert()`


## To Do

* **`[—]`** DBric: paramterized views as in DBay `parametrized-views.demo`
* **`[—]`** adapter for recutils?
  * https://www.gnu.org/software/recutils/manual/recutils.html
  * https://news.ycombinator.com/item?id=46265811


