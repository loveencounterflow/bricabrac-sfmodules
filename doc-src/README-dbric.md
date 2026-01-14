

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

* check that setting `prefix` is valid both in JS and SQL contexts when used to form unescaped identifiers
  as in (JS) `object.$prefix_property` and (SQL) `create table $prefix_name`

* **`[—]`** rename class properties:
  * `build` -> `build_statements`
  * `statements` -> `runtime_statements`

<!--
* **`[—]`** restructure class properties `functions`, `aggregate_functions`, `window_functions`,
  `table_functions`, `virtual_tables`:
  * replace with single class property, `udfs`
  * add a new mandatory property `type` that must be set to one of:
    * `'scalar'` (the default),
    * `'aggregate'`,
    * `'window'`,
    * `'table'`, or
    * `'virtual_table'`.
* **`[—]`** allow for all three of the above class properties `build_statements`, `runtime_statements`,
  `udfs` to be:
  * in the case of `build_statements`: either an object or a list, or a function that returns an object or a list
  * in the case of `runtime_statements`: either an object or a function that returns an object
  * in the case of `udfs`: either an object or a function that returns an object
-->

* allow functions for the entire `@build` property or any of its elements (but not both, functions may not
  transitively return functions) as well as for the other class properties whose names start with one of
  `scalar_udf_`, `table_udf_`, `aggregate_udf_`, `window_udf_`, `virtual_table_udf_`; these functions will
  be called in the context of the instance and thus allow to use values that are only known at runtime

* allow single string for `build`, can be segmented

Examples for class definitions; notice use of symbolic `$PREFIX`

```coffee
class My_db extends Dbric_std
  @build: [
    SQL"create table words ( w text );",
    SQL"insert into words ( w ) values ( 'first' );",
    ]
  @create_statement_$PREFIX_insert_word: SQL"insert into words ( w ) values ( $w );"`
  @create_statement_$PREFIX_select_word: SQL"select w as word from words where w regexp $pattern;"`
  @create_scalar_udf_$PREFIX_square:
    deterministic:      true
    value:              ( n ) -> n * n
  @create_table_udf_$PREFIX_letters_of:
    deterministic:      true
    value:              ( word ) -> yield chr for chr in Array.from word
  @create_aggregate_udf_your_name_here:     ...
  @create_window_udf_your_name_here:        ...
  @create_virtual_table_udf_your_name_here: ...
```

Values can be represented as functions:

```coffee
class My_db extends Dbric_std
  @build: -> [
    SQL"create table words ( w text );",
    SQL"insert into words ( w ) values ( #{LIT @cfg.first_word} );",
    ]
  @create_statement_$PREFIX_insert_word: ->
    ...
    return SQL"insert into words ( w ) values ( $w );"`
  @create_statement_$PREFIX_select_word: SQL"select w as word from words where w regexp $pattern;"`
  @create_scalar_udf_$PREFIX_square: ->
    value = if whatever then ( ( n ) -> n * n ) else ( ( n ) -> n ** 2 )
    return { value, }
  @create_table_udf_$PREFIX_letters_of:
    deterministic:      true
    value:              ( word ) -> yield chr for chr in Array.from word
  @create_aggregate_udf_your_name_here:     ...
  @create_window_udf_your_name_here:        ...
  @create_virtual_table_udf_your_name_here: ...
```

## Won't Do


* **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with
  realistically assumed benefits; implemented parts remain in code for the time being.
