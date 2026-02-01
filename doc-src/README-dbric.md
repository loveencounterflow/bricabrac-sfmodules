

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

## Overwriting / Overriding / Shadowing Behavior

* pending; probably to be handled by life cycle methods

<!--
When DB instances are built with chains of prototypes and&nbsp;/&nbsp;or plugins there's always the
possibility that the name for a method, a user-defined function (UDF) or a statement is being
unintentionally used more than once.

Users are encouraged to set the class property and&nbsp;/&nbsp;or instance configuration setting `prefix`
and use that setting when defining properties of a given `Dbric` derivative class or DBric plugin. The
appropriate usage of the prefix is up to the user and not enforced in any way.

Each time a `Dbric` instance is set up, the names declared on derived classes and in plugins will be checked
for duplication. All duplicate names that have been encountered in the process will be catalogued in a
property `Dbric::_duplicates` which is intended to be checked and reacted upone from within the
`Dbric::_finalize()` method. (Both items are marked as private so as to signal that mere consumers of
classes or plugins don't have to worry about them; knowledge of their use is only necessary for the
developer of derivatives.)

The items listed in `Dbric::_duplicates` include `counts`, `methods`, `statements`, `udfs`:
* `methods` lists all shadowing methods defined by plugins; it does *not* list any shadowing methods from
  derived classes. Further, a plugin repeating method names already defined by a class or another plugin do
  not cause an error in the default implementation. The reason for this behavior is that in Object Oriented
  Programming the re-use of method names is considered the normal course of action, not something to be
  avoided.
* `statements` lists all statement names that are used more than once.
* `udfs` lists all names of UDFs that are used more than once and that are not licensed by an `overwrite:
  true` setting in the UDF declaration.
* In the default implementation, a non-empty `Dbric::_duplicates.statements` or `Dbric::_duplicates.udfs`
  will cause an error to be thrown. Override `Dbric::_finalize()` to change that behavior.
-->

## API

### Class property `plugins`

* the class property `plugins` defines the so-called 'acquisition chain', which is the sequence of objects
  that are visited during the construction of a `Dbric` instance
* neutral values are `null`, an empty list, `[ 'prototypes', ]`, `[ 'me', ]` and `[ 'prototypes', 'me', ]`
* in addition to the optional entries `prototypes` and `me`, which indicate the relative positioning of the
  instance's prototype chain and the instance itself, suitable objects that act as Dbric plugins may be
  placed into the

#### Using Ersatz `super()` in Plugin `methods`

* functions defined in the `exports.methods` member of a plugin object will become methods of the database
  adapter instance and can be used like regular (non-plugin) methods
* a hitch with defining methods on a further unspecified object is that JavaScript limits the use of
  `super()` to instance methods
* for this reason, instead of using `super()` in your plugin methods, use the 'Ersatz Super Device'
  `@_super()`.
* `@_super()` expects needs to be told the name of the upstream method to be called. Typically, within a
  plugin method `frob()`, when you want to call the original version of that method, you'd use `@_super
  'frob'`, followed by whatever are deemed the appropriate arguments. Other than that, any valid API name
  can be used when calling `@_super()`.
* In any event, `@_super method_name` will refer to the *instance's* method named `method_name`, *not*
  another plugin's method having the same name. Just as with named `statements`, methods coming later in the
  plugin chain will replace values of the same name that have been provided by a plugin coming earlier in
  the chain.

### `Dbric_classprop_absorber::_get_acquisition_chain()` (private)

* returns a list of objects `{ type, contributor, }` that the capabilities of the `Dbric` instance will be
  based on
* uses class property `plugins`, q.v.
* order in list follows logic of `Object.assign()` (i.e. later entries shadow earlier ones)
* always omitted from the list are `Object.getPrototypeOf {}`, `Object.getPrototypeOf Object`,
  `Dbric_classprop_absorber` and `Dbric`, since these never contribute to instance capabilities


## To Do

* **`[—]`** DBric: parameterized views as in DBay `parametrized-views.demo`
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

* **`[—]`** what about transitive plugins, i.e. plugins as declared by a base class?
* **`[—]`** implement life cycle methods to be called at various points during instantiation; might
  use these to handle name clashes
* **`[—]`** plugins should get to define their own `cfg` values under `Dbric::cfg.$prefix`

## Won't Do


* **`[+]`** abandoned prefix schema altogether because implementation effort appears to be unbalanced with
  realistically assumed benefits; implemented parts remain in code for the time being.
