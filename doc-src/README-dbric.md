

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

* **`[—]`** Prefix:
  * `Dbric` and all its derived classes have a setting `prefix` which must be a non-empty string.
  * The prefix is used
  * For the sake of simplicity, we err on the safe side and restrict legal prefixes to
    `/[a-zA-Z][a-zA-Z_0-9]*/`; this restriction may be relaxed later but the goal is to allow only such
    prefixes that, when concatenated with a safe suffix such as `_my_table_name`, do not require quoting the
    name in SQL statements; we disregard the unattainable task of aspiring to make name clashes impossible
    but settle for syntactic safety. Settings like `''` (empty string), `'foo bar'` (contains spaces) or
    `höh` (contains non-ASCII letters) are not acceptable.
  * The default value for instances of a given derivative `C` of `Dbric` is the first match from these
    sources:
    * the `prefix` parameter given at instantiation;
    * the class property `C.prefix` *but only if `( Object.hasOwn C ) and ( prefix = C.prefix )?` is true*
      (i.e. property `prefix` is not treated as inheritable and is ignored when set to `null` or
      `undefined`);
    * the result of `@constructor.name.match /_[a-zA-Z][a-zA-Z_0-9]*$/`, if it matches;
    * the value of `@constructor.name.toLowerCase()`, if it is a legal prefix;
    * the value of setting `C.default_prefix` *which **is** treated as inheritable*.
    * Since `Dbric.default_prefix: null`, a class that doesn't set `prefix` itself or sets `default_prefix`
      itself or transitively can only make use of prefixes when instantiated with an explicit, valid
      `prefix` setting.
    * It's still possible to use `Dbric` or a derivative without setting `prefix` or `default_prefix`, but
      in that case any attempt to access the computed instance property `Dbric::prefix` or the symbolic
      `$PREFIX` in class property names and statement SQL will cause an error, so one can not use e.g.
      `SQL"select * from %prefix%_table;"` or `My_class.create_scalar_udf_$prefix_frobulate`.
  * SQLite allows `?` for positional parameters and `@`, `:` and `$` as prefixes for named parameters; in order
    not to clash with any of these, Dbric
  * `$PREFIX` in class properties:
    * in class properties like `create_statement_$PREFIX_whatever_name`,
      `create_scalar_udf_$PREFIX_whatever_name` as well as in SQL source strings like `select * from
      $PREFIX_whatever_name`, `$PREFIX` will be recognized and replaced by the configured prefix (derived by
      the rules as above).
    * In SQL statements, this works by replacing all matches of `/(?<=[^\\])\$PREFIX/` (i.e. literal
      `'$PREFIX'` that is not preceded by a backslash) with the instance's prefix as configured (or fail
      with error in case no prefix is configured).
    * No syntax analysis of any kind will be performed and the replacement will be interpolated no matter
      whether it appears in a quoted or an unquoted name, a string literal, a comment or, indeed, a
      parameter name.
    * The capitalization of `$PREFIX` (and possibly other symbolic placeholders in the future) has been
      chosen so as to minimize opportunities of clashes between these compile-time placeholders and the
      usual run-time parameters; as long as run-time parameters are spelled without writing them in all-caps
      (probably a reasonable choice regardless), no clashes are possible.
    * Placing a backslash immediately before `$PREFIX` will inhibit interpolation; also, all appearances of
      a backslash within sequences of `\\$PREFIX` (backslash, dollar sign, letters `PREFIX`) will be elided.
