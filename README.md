

# Bric-A-Brac Standard Brics

A collection of (sometimes not-so) small-ish utilities


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [DBric Database Adapter](#dbric-database-adapter)
  - [Overwriting / Overriding / Shadowing Behavior](#overwriting--overriding--shadowing-behavior)
  - [API](#api)
    - [Class property `plugins`](#class-property-plugins)
      - [Using Ersatz `super()` in Plugin `methods`](#using-ersatz-super-in-plugin-methods)
    - [`Dbric_classprop_absorber::_get_acquisition_chain()` (private)](#dbric_classprop_absorber_get_acquisition_chain-private)
  - [To Do](#to-do)
  - [Won't Do](#wont-do)
- [InterMission: Tables and Methods to Handle Integer Intervals](#intermission-tables-and-methods-to-handle-integer-intervals)
  - [Ranges / Integer Intervals](#ranges--integer-intervals)
  - [Bipolarity of Runs](#bipolarity-of-runs)
  - [To Do](#to-do-1)
  - [Is Done](#is-done)
- [Prototype Tools](#prototype-tools)
  - [Usage Example](#usage-example)
  - [To Do](#to-do-2)
  - [Is Done](#is-done-1)
- [Coverage Analyzer](#coverage-analyzer)
  - [Usage Example](#usage-example-1)
  - [To Do](#to-do-3)
  - [Is Done](#is-done-2)
- [Unsorted](#unsorted)
  - [To Do](#to-do-4)
    - [Infrastructure for `letsfreezethat`](#infrastructure-for-letsfreezethat)
    - [Fast Line Reader](#fast-line-reader)
    - [Coarse SQLite Statement Segmenter](#coarse-sqlite-statement-segmenter)
    - [SQLite Undumper](#sqlite-undumper)
    - [JetStream](#jetstream)
      - [JetStream: Instantiation, Configuration, Building](#jetstream-instantiation-configuration-building)
      - [JetStream: Adding Data](#jetstream-adding-data)
      - [JetStream: Running and Retrieving Results](#jetstream-running-and-retrieving-results)
      - [JetStream: Note on Picking Values](#jetstream-note-on-picking-values)
      - [JetStream: Selectors](#jetstream-selectors)
      - [See Also](#see-also)
      - [To Do](#to-do-5)
    - [Loupe, Show](#loupe-show)
    - [Random](#random)
      - [Random: Implementation Structure](#random-implementation-structure)
        - [References](#references)
        - [To Do](#to-do-6)
    - [Benchmark](#benchmark)
    - [Errors](#errors)
    - [Remap](#remap)
    - [Other](#other)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-dbric.md> -->


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

<!-- END <!insert src=./README-dbric.md> -->
------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-intermission.md> -->


# InterMission: Tables and Methods to Handle Integer Intervals


## Ranges / Integer Intervals

* A **Run** is defined by a tuple `( lo, hi, key, value, )`.
  * `key` must be a non-empty string. Valid JS identifiers are preferred. Keys starting with `$` are
    considered special.
  * `value` must be JSON-serializable value such as e.g. `true`, `"a text"`, `22.5` or `[6,8,11]`.
    * It is possible to store JSON object literals in `value`, but observe that doing so requires
      normalizing the value e.g. with the [RFC8785](https://github.com/erdtman/canonicalize) algorithm to
      allow for trivial value equality checks.
  * The triplet `( lo, hi, key, )` must be unique in a given collection (hoard).
  * `lo` and `hi` are either JS 'safe' integers (that satisfy `Number.isSafeInteger n`) or positive or
    negative `Infinity`.
  * The pair `{ lo, hi, }` defines a span of consecutive integers `n` such that `lo <= n <= hi`
    * empty intervals are not representable;
    * non-contiguous runs are only representable by using multiple runs;
    * single-point runs `lo == n == hi` holds.
  * All runs with a given combination of `( key, value, )` form a 'group'.
  * A group is considered 'normalized' when it is represented with the minimal number of runs.
  * Two groups that share the same `key` but have different `value`s must be mutually exclusive in a given
    hoard.
  * Runs with the special key `$ex` and any allowable value are used to declare 'exclusion zones' that no
    non-special runs can cover. For example, in a hoard that is only used for points between `0` and `100`,
    one may define exclusion zones as `{ lo: -Infinity, hi: -1, key: '$ex', value: 'too small', }`, `{ lo:
    101, hi: +Infinity, key: '$ex', value: 'too big', }` and use `value`s to give a reason for exclusion
    which may be used for error messages and so on.

  ```sql
    create table hrd_runs (
        rowid   text not null,
        lo      real not null,
        hi      real not null,
        key     text not null,
        value   text not null, -- proper data type is `json` but declared as `text` b/c of `strict`
      primary key ( rowid ),
      unique ( lo, hi, key, value ),
      constraint "Ωconstraint___1" check (
        ( abs( lo ) = 9e999 ) or (
          ( lo = cast( lo as integer ) )
          and (       #{Number.MIN_SAFE_INTEGER} <= lo )
          and ( lo <= #{Number.MAX_SAFE_INTEGER} ) ) )
      constraint "Ωconstraint___2" check (
        ( abs( hi ) = 9e999 ) or (
          ( hi = cast( hi as integer ) )
          and (       #{Number.MIN_SAFE_INTEGER} <= hi )
          and ( hi <= #{Number.MAX_SAFE_INTEGER} ) ) )
      constraint "Ωconstraint___3" check ( lo <= hi )
    ) strict;
  ```

  ```sql
  select lo, hi, key, value
  from hrd_runs
  where true
    and ( lo <= $lo )
    and ( hi >= $hi );
  ```


<!-- * **Hoard**:

  ```sql
    create table hrd_hoard (
        rowid   text not null,
        json    json not null default '{}',
      primary key ( rowid ) )
  ```
 -->


## Bipolarity of Runs

* Inclusive runs are defined by the points they include
* Exclusive runs are defined by the points they exclude.

  As an example, a base intended to represent valid Unicode codepoints could contain, among others, the
  following exclusive runs:

  * `{ lo: -Infinity, hi:        -1, key: '$ex', value: "negative CIDs",   }`
  * `{ lo:    0x0000, hi:    0x0000, key: '$ex', value: "zero bytes",      }`
  * `{ lo:    0xd800, hi:    0xdbff, key: '$ex', value: "high surrogates", }`
  * `{ lo:    0xdc00, hi:    0xdfff, key: '$ex', value: "low surrogates",  }`
  * `{ lo:    0xfdd0, hi:    0xfdef, key: '$ex', value: "noncharacters",   }`
  * `{ lo:    0xfffe, hi:    0xffff, key: '$ex', value: "noncharacters",   }`
  * `{ lo:  0x110000, hi: +Infinity, key: '$ex', value: "excessive CIDs",  }`

  Each of these runs will prevent some points from being used in any associated (and normalized) scatters
  and, additionaly, allow to formulate instructive error messages that may be caused e.g. by a text
  processing utility that encounters illegal codepoints.


## To Do

* **`[—]`** implement UR bounds, default `0x00_0000..0x10_ffff`
* **`[—]`** `rowid`s of runs need to be unique across scatters
* **`[—]`** add ability to name scatters (and runs?)
* **`[—]`** implement `Hoard::normalize()`
* **`[—]`** implement ability to create a `Scatter`-like object from any number of existing scatters
* **`[—]`** implement `Scatter::subtract_run()` / `Scatter::subtract()`
* **`[—]`** implement `Hoard::base`
* **`[—]`** implement a setting to determine whether points added to a scatter but not in `Hoard::base`
  should cause an error or be dropped silently

## Is Done

* **`[+]`** reject floats

<!-- END <!insert src=./README-intermission.md> -->
------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-prototype-tools.md> -->


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

<!-- END <!insert src=./README-prototype-tools.md> -->
------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-coverage-analyzer.md> -->


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

<!-- END <!insert src=./README-coverage-analyzer.md> -->
------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-unsorted.md> -->



# Unsorted

> [!NOTE]
> Documentation in this section is considered WTBD

## To Do

### Infrastructure for `letsfreezethat`

* Clone actions:
  * **`take`**
  * **`toss`**
  * **`call`**
  * **`fallback`**
  * **`error`**
  * **`assign`**
  * **`dive`**

rename `clone` -> `project`

```coffee
s =
  take:     Symbol 'take'
  toss:     Symbol 'toss'
  call:     Symbol 'call'
  error:    Symbol 'error'
  assign:   Symbol 'assign'
  dive:     Symbol 'dive'
s.fallback = s.error

clone = ( x, howto = new Howto() ) ->

  if x?
    protoype  = Object.getPrototypeOf x
    R         = if protoype?  then ( new x.constructor ) else ( Object.create null )
    switch action
      when 'assign'
        Object.assign R, x
      when 'dive'
        for k, v of x
          R[ k ] = clone v
      else throw new Error "Ω___8 unknown action #{rpr_string action}"
    return R
  else
    protoype  = null
    R     = x
```


```
p = Object.getPrototypeOf
debug 'Ωjzrsdb__11', p {}
debug 'Ωjzrsdb__12', p 8
debug 'Ωjzrsdb__13', p Bsql3
debug 'Ωjzrsdb__14', p new Bsql3()
debug 'Ωjzrsdb__15', ( p -> ) is ( p -> )
misfit = Symbol 'misfit'
clone = ( x, seen = new Map() ) ->
```



### Fast Line Reader

* **`[+]`** fix bugs where start-of-lines are missing with small `chunk_size`s
* **`[—]`** allow alternative sources for buffers
* **`[—]`** ensure compatibility with `GUY.fs.walk_lines_with_positions()` especially
  * **`[—]`** recognition of different line endings
  * **`[—]`** treatment of `\r` in the vicinity of `\n`
  * **`[+]`** treatment of trailing empty lines
  * **`[—]`** `( '\n' ).split /\r\n|\r|\n/` gives `[ '', '', ]`, so this method should do the same

### Coarse SQLite Statement Segmenter


* meant to be the basis for being able to read SQLite DB dump files from within a DBric application

* necessitated by the fact that calls UDFs may be present in DDL statements for generated columns, views,
  and triggers

* even using the `REGEXP` operator will fail with the `sqlite3` command line tool in case a regular
  expression with capabilities beyond what `sqlite3` offers is used (e.g. it doesn't understand `\p{...}`
  escapes which JavaScript does with the `v` flag, as in `/^\p{L}+/v`)

* to do its job, the segmenter has to locate those semicolons in an SQL source that are not part of
  comments, string literals, quoted names, or are statement-internal syntax

* turns out a lexer that recognizes line comments (double backslash `//` to the end of line), block comments
  (enclosed in `/* ... */`), string literals (using single quotes `'...'`), quoted names (enclosed in either
  quotes as in `"name"` or brackets as in `[name]`), the only remaining cases are statement-internal
  semicolons; those can only appear in `CREATE TRIGGER` statements.

  Unfortunately, since the relevant portions of SQLite's SQL syntax both allow arbitrary expressions in the
  crucial parts of `CREATE TRIGGER` statements combined with the fact that SQLite is happy not only to
  accept but also to emit, also and entirely unnecessarily in dump files, unquoted names that are also
  keywords (such as in `delete from end where end = 'x' returning end;`, which is, incredibly, valid SQL as
  understood by SQLite), recognizing *all* top-level statement-final semicolons is beyond what can be done
  with a lexer without turning it into a more-or-less full-fledged parser.

  We therefore accept that lexing can capture a good portion but not all of what one might encounter in a
  file full of SQL statements and provide—next to a `Segmenter` class that does its best to fish good
  candidates for portions of text that represent exactly one statement—another class, `Undumper`, that, when
  given a `DBric` instance, will walk over the segments (candidate statements) yielded by the `Segmenter`
  and apply them to the `DBric` database; if this should result in an `incomplete source` error, it will
  then glob on the next segment to the source and try again; if the source file is well-formed, this will
  eventually lead to the database accepting the input. This is not a beautiful state of affairs but it's
  also irrelevant to performance in realistic cases.

  To this we may add that given how SQL is commonly written and what SQLite itself produces for its dump
  files, it can be safely said that with a high degree of certainty the syntactically relevant semicolons of
  SQL source text are found as the last character of lines. That is, as soon as we have the 'incomplete
  source' coping mechanism in place, we can actually fall back to a much faster way to process the
  source—essentially only looking for semicolons at the end of lines, `/;[\x20\x09]*\n/gm`.

* two modes of operation:
  * `{ mode: 'fast', }`: assume only line-trailing semicolons. This should be compatible with DB dump files
    produced by the SQLite command line tool. Observe that since `fast` mode gives a 20x speed gain over
    `slow` mode, it has been made the default. If the assumption is violated by the input, behavior is
    undefined but will likely result in SQL errors; in that case, try `slow` mode.
  * `{ mode: 'slow', }`: scan source for string literals, comments and so on

### SQLite Undumper

Assuming `db` is an instance of `DBric`, `better-sqlite3`, or NodeJS `SQLITE.DatabaseSync`, then from within
your application when you already have all necessary UDFs declared, a single call to `Undumper.undump()`
will read a dump file line by line, look for statements, apply them to the `db` object's `.exec()` or
`.execute()` method, and return a number of statistics when finished; while it's doing it's job, it'll
display a nice progress bar in the terminal:

```coffee
{ Undumper, } = SFMODULES.require_sqlite_undumper()
path          = 'path/to/my-db.dump.sql'
statistics    = Undumper.undump { db, path, } # default is { mode: 'fast', }
# statistics:
{ line_count:         102726,
  statement_count:    102600,
  dt_ms:              1724.422669,
  statements_per_s:   59498 }
```

```
read_and_apply_dump:                      19 %▕██▌          ▏
```

```
read_and_apply_dump:                     dt:              1,724.423 ms
read_and_apply_dump:                     n:             102,700.000
read_and_apply_dump:                     ???:                16.791 ms/1k
read_and_apply_dump:                     f:              59,556.164 Hz
```



### JetStream

* JetStream is a utlity to construct data processing pipelines from series of data transform.
* Each transform is a generator function that accepts one data item and yields any number of transformed
  data items.
* Because of this setup, each transform can choose to ignore a data item, or to swallow it, or to produce
  many new data items in response.
* This makes JetStream much more flexible and useful than approaches that depend on non-generator functions.
  You can still build useful stuff with those but they're inherently incapable to, say, turn a (stream of)
  string(s) into a stream of characters.
* Currently JetStream currently only uses synchronous transforms.
* Actually more of a bucket chain than a garden hose for what it's worth.
* Can 'configure' transforms to receive only some, not all data items; can re-use the same transform in
  multiple configurations in a single pipeline.
* Default is for a transform to receive all data items but no cues.
* Whatever the last transform in the pipeline `yield`s becomes part of the pipeline's output, except that it
  will be implicitly filtered by a conceptual 'outlet' transform. The default for the outlet is the same as
  that for any transform (i.e. all data items, no cues); this can be changed bei configuring the pipeline:
  * at instantiation time: `jet = new Jetstream { outlet: 'data,#stop', }`
  * dynamically: `jet.configure { outlet: 'data,#stop', }`

#### JetStream: Instantiation, Configuration, Building

* **`Jetstream::constructor: ( cfg ) ->`**—

* **`Jetstream::configure: ( cfg ) ->`**—dynamically set properties to determine pipeline characteristics.
  `cfg` should be an object with the following optional keys:
  * **`outlet`**—a [JetStream selector](#jetstream-selectors) that determines the filtering to be applied
    after the last transform for a given item has finished and before that value is made available in the
    output. Default is `'data'`, meaning all data items but no cues will be considered for output.
  * **`pick`**—after result items have been filtered as determined by the `outlet` setting, apply a sieve to
    the stream or list of results. Default is `{ pick: 'all', }`, meaning 'return all results' (as an
    iterator for `walk()`, as a list for `run()`). `'first'` will pick the first, `'last'` the last element
    (of the stream or list); observe that in these cases, `walk()` will still be an iterator (over zero or
    one values), but `run()` will return only the first or last values instead of a possibly empty list. If
    there are no results, calling `run()` will cause an error unless a `fallback` has been explicitly set.
  * **`fallback`**—determine a return value for `run()` to be used in case no other values were produced by
    the pipeline.
  * **Observe** that no matter whether or not you use `pick: 'all'`, `pick: 'first'`, or `pick: 'last'`—when
    you call `Jetstream::run()`, all transforms will be called the same number of times with the same
    values. The same is true when you use `Jetstream::walk()` and make sure the generator runs to
    completion.
  * **`empty_call`**—the value to send, if any, when `Jetstream::walk()` or `Jetstream::run()` are called
    without any data values and an empty 'shelf' (i.e. no unprocessed data from calls to
    `Jetstream::send()`). This allows to start pipelines with a value-producing transform that `yield`s
    values from some source whenever it gets called; whether it drops or passes on the value of
    `Jetstream::cfg.empty_call` is up to the implementation.

* **`Jetstream::push: ( P..., t ) ->`**—add a transform `t` to the pipeline. `t` can be a generator function
  or a non-generator function; in the latter case the transform is called a 'watcher' as it can only observe
  items. If `t` is preceded by one or several arguments, those arguments will be interpreted as
  configurations of `t`. So far [selectors](#jetstream-selectors) are the only implemented configuration
  option.

#### JetStream: Adding Data

* **`Jetstream::send: ( ds... ) ->`**—'shelve' zero or more items in the pipeline; processing will start
  when `Jetstream::walk()` is called.

* **`Jetstream::cue: ( ids ) ->`**—create a public Symbol from `id` and `Jetstream::send()` it. Convenience
  method equivalent to `Jetstream::send Symbol.from id`

#### JetStream: Running and Retrieving Results

* **`Jetstream::walk: ( ds... ) ->`**—'shelve' zero or more items in the pipeline and return an iterator
  over the processed results. Calling `Jetstream::walk d1, d2, ...` is equivalent to calling
  `Jetstream::send d1, d2, ...` followed by `Jetstream::walk()`. When the iterator stops, the pipeline has
  been exhausted (no more shelved items); further processing will only occur when at least one item has been
  sent and `Jetstream::walk()` has been called.

* **`Jetstream::run: ( ds... ) ->`**—same as calling `Jetstream::walk()` with the same arguments, but will
  return either a list containing all results or—depending on
  [configuration](#jetstream-instantiation-configuration-building)—a single result.

* **`Jetstream::pick_first: ( ds... ) ->`**—same as calling `[ ( Jetstream::walk()... )..., ]` with the same
  arguments, and either picking the first value in the list, or, if it's empty, use the configured
  `fallback` value, or else throw an error. Observe that for a pipeline that is configured to always `pick`
  the first or last value, using `Jetstream::pick_first()` will behave just like `Jetstream::run()`.

* **`Jetstream::pick_last: ( ds... ) ->`**—same as calling `[ ( Jetstream::walk()... )..., ]` with the same
  arguments, and either picking the last value in the list, or, if it's empty, use the configured `fallback`
  value, or else throw an error. Observe that for a pipeline that is configured to always `pick` the first
  or last value, using `Jetstream::pick_last()` will behave just like `Jetstream::run()`.

#### JetStream: Note on Picking Values

The result of a JetStream run is always a (possibly empty) list of values, unless either the stream has been
configured to pick the last or the first value, or `Jetstream::pick_first()` or `Jetstream::pick_last()` have
been called. The semantics of picking or getting singular values have been intentionally designed so that
the least possible change is made with regard to calling of transforms and handling of intermediate values.
This also means that if your pipeline computes a million values of which you only need the first value which
doesn't depend on any other value in the result list, then `{ pick: 'first', }` is probably not the right
tool to do that because in order to get that single value, each transform will still be called a million
times. One should rather look for a cutoff point in the input early on and terminate processing as soon as
possible rather than burdening the pipeline with throwaway values.

#### JetStream: Selectors

**to be rewritten**

<!--
* cue < Q (see Shakespeare)
* pip
* blip (as in, a blip in the data)
* vee (for V as in value)
* dee (for D as in data)
 -->


* **`[—]`** When instantiating a pipeline (`new Jetstream()`), should be possible to register cues?
  Registered cues would then only be sent into transforms that are configured to listen to them (ex. `$ {
  first, }, ( d ) -> ...`). Signals can be sent by tranforms or the `Jetstream` API.
  * **`[—]`** problem with that: composing pipelines. Transforms rely on testing for `d is whatever_cue`
    which fails when a sub-pipeline has been built with a different private symbol
  * **`[—]`** maybe treat all symbols specially? Could match an `s1 = Symbol 'A'`, `s2 = Symbol 'A'` by
    demanding configuration of `$ { A, }, ( d ) -> ...` matching the string value of symbols
  * **`[—]`** 'Signals' are meta-data as opposed to 'common'/'business data'. As such cues should, in
    general, only be sent into those transforms that are built to digest them; ex. when you have a transform
    `( d ) -> d ** 2`, that transform will fail when anything but a number is sent into it. That's a Good
    Thing if the business data itself contained something else but numbers (now you know your pipeline was
    incorrectly constructed), but a Bad Thing if this happens because now the transform was called with a
    cue it didn't ask for and isn't prepared to deal with.
  * **`[—]`** hold open the possiblity to send arbitrary structured data as cues (meta data), not only
    `Symbol`s
  * **`[—]`** *The Past*: The way we've been dealing with cues is we had a few known ones like `first`,
    `before_last`, `last`, and so on; the user would declare them with the `$` (transform configurator)
    method, using values of their own choosing. Most of the time cue values are declared in the
    application as appropriately named private symbols such as right before usage `first = Symbol 'first'`,
    then the transform gets declared and added as `$ { first, }, t = ( d ) -> ...`, finally, in the
    transform, a check `d is first` is used to sort out meta data from business data. This all hinges on the
    name (`first`) being known to the pipeline object (`Jetstream` instance) knowing the *names* (`first`,
    `before_last` and so on) and their *semantics* (so names are a controlled vocabulary), and the transform
    knowing their *identity* (because you can't check for a specific private symbol if you don't hold that
    symbol). In essence we're using the same data parameter `d` to transport both business data and meta
    data.
  * **`[—]`** *The Future*:
    * Meta data has distinct types: private symbols, public symbols, instances of class `Signal`.
    * Each piece of meta data has a name; for symbols `s`, that's `( String s )[ 7 ... ( String s ).length -
      1 ]`.
    * Meta data only sent to transforms that are explicitly configured to handle them.
    * Generic configuration could use `$ { select, }, ( d ) -> ...` where `select` is a boolean or a boolen
      function.
    * The default is `select: ( d ) -> not @is_cue d` (or `select: 'data'`), i.e. 'deselect all cues'.
      `select: -> true` (or indeed `select: true`) means 'send all business and meta data'. `select: false`
      indicates 'transform not used'. `select: 'cues'` means 'send all cues but no data'.
    * `### TAINT` unify usage of 'meta', 'cue'
    * Un`select`ed data that is not sent into the transform is to be sent on to the next transform.
    * The custom `select()` function will be called in a context that provides convenience methods.
    * As a shortcut, a descriptive string may be used to configure selection:
      * format similar to CSS selectors
      * `'data'`: select all business data, no cues (the default)
      * `'cue'`: select all cues, no data
      * `'cue, data'`: select all data and all cues (same as `select: ( -> true )`)

    * Another approach:
      * `Jetstream::push()` defined as `( selectors..., transform ) -> ...`
      * `selectors` can be one or more single and arrays of selectors
      * will be flattened, meaning `Jetstream::push s1, [ s2, [ s3, ], ], s4, t` means the same as
        `Jetstream::push s1, s2, s3, s4, t`
      * at first we don't support concatenation of selectors, only series of disjunct selectors
      * concatenated selectors will likely have to default to logical conjunction ('and')
      * as such concatening selectors with `,` (comma) will likely be used to indicate disjunction ('or'),
        as in CSS
      * transform gets to see item when (at least) one selector matches
        * a missing selector expands to the `data` selector. By default, transforms get to see only data items, no cues, which
          is the right thing to do in most cases.
        * an empty selector selects nothing, so the transform gets skipped. As is true for transforms that
          do not accept everything, unselected items are sent to the successor of the current transform.
        * `data` matches business data items (implicitly present)
        * `cue`, `cue` matches cues (opt-in); equivalent to `:not(data)`
        * `cue#first` matches cues with ID (name) `first`
        * `cue#last` matches cues with ID (name) `last`
        * `cue#first,cue#last` ( or `[ 'cue#first', 'cue#last', ]` ) matches cues with IDs `first` or `last`
        * `#first', '#last` same, ID selectors implicitly refer to `cue`, therefore `#first` equals
          `cue#first`
        * `*`, `data,cue`, `data#*,cue#*` are alternatives to mean 'all data items and all cues'
        * `:not(data)` prevents business data items from being sent (opt-out); since all items are
          classified as either `data` or `cue`, it implicitly selects all cues
        * `:not(cue)` prevents cues from being sent (implicitly present), implicitly selects all `data`
          items
      * Jetstream data items are conceptualized as HTML elements

        ```
        "abc"               -> <data type=text value='abc'/>
        876                 -> <data type=float value='876'/>
        Symbol     'first'  -> <cue type=symbol id=first/>
        Symbol.for 'first'  -> <cue type=symbol id=first/>
        ```

```coffee
stream.push 'data', '#first', '#last', ( d ) ->
```

#### See Also

* in case more complicated selectors must be parsed: https://github.com/fb55/css-what


#### To Do

* **`[—]`** presently selectors can only be added by calling `Jetstream::push()`; the only way to make a
  construct like `Jetstream::push $transform()` include selectors is by making `$transform()` return a list
  `[ selectors, transform, ]` and then apply as `Jetstream::push $transform()...`. This is unfortunate as
  now we have to know whther or not a given transform-constructor includes selectors or not

### Loupe, Show

* add `cfg` parameter
* implement stripping of ANSI codes
* implement 'colorful', 'symbolic' mode
* implement callbacks for specifc types / filters

### Random

* **`[—]`** Provide alternative to ditched `unique`, such as filling a `Set` to a certain size with
  characters
* **`[—]`** Provide internal implementations that capture attempt counts for testing, better insights
* **`[—]`** use custom class for `stats` that handles excessive retry counts
* **`[—]`** implement iterators
* **`[—]`** should `on_exhaustion`, `on_stats`, `max_retries` be implemented for each method?

#### Random: Implementation Structure

* the library currently supports four data types to generate instance values for: `float`, `integer`, `chr`,
  `text`
* for each case, instance values can be produced...
  * ...that are not smaller than a given `min`imum and not larger than a given `max`imum
  * ...that are `filter`ed according to a given RegEx pattern or an arbitrary function
  * ...that, in the case of `text`s, are not shorter and not longer than a given pair of `min`imum`_length`
    and `max`imum`_length`
  * ...that are unique in relation to a given collection (IOW that are new to a given collection)

* the foundational Pseudo-Random Number Generator (PRNG) that enables the generation of pseudo-random values
  is piece of code that I [found on the
  Internet](https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript)
  (duh), is called [*SplitMix32*](https://stackoverflow.com/a/47593316/7568091) and is, according to the
  poster,

  > A 32-bit state PRNG that was made by taking MurmurHash3's mixing function, adding a incrementor and
  > tweaking the constants. It's potentially one of the better 32-bit PRNGs so far; even the author of
  > Mulberry32 considers it to be the better choice. It's also just as fast.

* Like JavaScript's built-in `Math.random()` generator, this PRNG will generate evenly distributed values
  `t` between `0` (inclusive) and `1` (exclusive) (i.e. `0 < t ≤ 1`), but other than `Math.random()`, it
  allows to be given a `seed` to set its state to a known fixed point, from whence the series of random
  numbers to be generated will remain constant for each instantiation. This randomly-deterministic (or
  deterministically random, or 'random but foreseeable') operation is valuable for testing.

* Since the random core value `t` (accessible as `Get_random::_float()`) is always in the interval `[0,1)`,
  it's straightforward to both scale (stretch or shrink) it to any other length `[0,p)` and / or transpose
  (shift left or right) it to any other starting point `[q,q+1)`, meaning it can be projected into any
  interval `[min,max)` by computing `j = min + ( t * ( max - min ) )`. That projected value `j` can then be
  rounded e.g. to an integer number `n`, and that integer `n` can be interpreted as a [Unicode Code
  Point](https://de.wikipedia.org/wiki/Codepoint) and be used in `String.fromCodePoint()` to obtain a
  'character'. Since many Unicode codepoints are unassigned or contain control characters, `Get_random`
  methods will filter codepoints to include only 'printable' characters. Lastly, characters can be
  concatenated to strings which, again, can be made shorter or longer, be built from filtered codepoints
  from a narrowed set like, say, `/^[a-zA-ZäöüÄÖÜß]$/` (most commonly used letters to write German), or
  adhere to some predefined pattern or other arbitrary restrictions. It all comes out of `[0,1)` which I
  find amazing.

* A further desirable restriction on random values that is sometimes encountered is the exclusion of
  duplicates; `Get_random` can help with that.

* each type has dedicated methods to produce instances of each type:
  * a convenience function bearing the name of the type: `Get_random::float()`, `Get_random::chr()` and so
    on. These convenience functions will call the associated 'producer methods'
    `Get_random::float_producer()`, `Get_random::chr_producer()` and so on which will analyze the arguments
    given and return a function that in turn will produce random values according to the specs indicated by
    the arguments.

##### References

* [Proposal to add `new Random.Seeded()` to
  JS](https://github.com/tc39/proposal-seeded-random?tab=readme-ov-file)

##### To Do

* **`[—]`** implement a 'raw codepoint' convenience method?
* **`[—]`** adapt `Get_random::float()`, `Get_random::integer()` to match `Get_random::chr()`,
  `Get_random::text()`
* **`[—]`** ensure `Get_random::cfgon_stats` is called when given even when missing or `null` in method call
* **`[—]`** need better `rpr()`
  * **`[—]`** one `rpr()` for use in texts such as error messages, one `rpr()` ('`show()`'?) for use in
    presentational contexts
* **`[—]`** review shuffling algorithm, see [*The Danger of
  Naïveté*](https://blog.codinghorror.com/the-danger-of-naivete/) for a discussion of how to shuffle
  correctly

### Benchmark

* **`[—]`** implement ?`min_count` / ?`max_count` / ?`min_dt` / ?`max_dt`, `prioritize: ( 'dt' | 'count' )`
  * probably best to stick with `min` or `max` for both `count` and `dt`

* **`[—]`** allow to call as `timeit name, -> ...` and / or `timeit { name, ..., }, -> ...` so function name
  can be overriden

* **`[—]`** implement 'tracks' / 'splits' such that within a `timeit()` run, the executed function can call
  sub-timers with `track track_name, -> ...`. Different contestants can re-use track names that can then be
  compared, ex.:

  ```coffee
  timeit contestant_a = ( { track, progress, } ) ->
    data = null
    track load_data         = -> data = a.load_data()
    a.do_other_stuff()
    track evaluate          = -> data = a.evaluate()
    track only_a_does_this  = -> data = a.only_a_does_this()
    track save_data         = -> data = a.save_data()
  timeit contestant_b = ( { track, progress, } ) ->
    data = null
    track load_data         = -> data = b.load_data()
    b.do_other_stuff()
    track evaluate          = -> data = b.evaluate()
    track save_data         = -> data = b.save_data()
  ```
  will show elapsed total times for `contestant_a`, `contestant_b`, as well as comparisons of tracks
  `contestant_a/load_data` v. `contestant_b/load_data`, `contestant_a/evaluate` v. `contestant_b/evaluate`
  and so on; track `contestant_a/only_a_does_this` is shown without comparison. There will inevitable also
  be an 'anonymous track', i.e. time spent by each contestant outside of any named track (here symbolized by
  `_.do_other_stuff()`, but in principle also comprising any part of the function between tracks, and time
  spent to set up and finish each track); these extra times should also be shown, at least when exceeding a
  given threshold. In `timeit()` runs that have no `track()` calls, the anonymous track is all there is.

* **`[—]`** incorporate functionality of `with_capture_output()` (setting `{ capture_output: true, }`),
  return stdout, stdin contents

### Errors

* **`[—]`** custom error base class
  * **`[—]`** or multiple ones, each derived from a built-in class such as `RangeError`, `TypeError`,
    `AggregateError`

* **`[—]`** solution to capture existing error, issue new one a la Python's `raise Error_2 from Error_1`

* **`[—]`** omit repeated lines when displaying `error.cause`?

### Remap

* **`[—]`** provide facility to retrieve all own keys (strings+symbols)
* **`[—]`** use property descriptors
* **`[—]`** can be expanded to provide `shallow_clone()`, `deep_clone()`


### Other

* **`[—]`** publish `clean()` solution to the 'Assign-Problem with Intermediate Nulls and Undefineds' in the
  context of a Bric-A-Brac SFModule
* **`[—]`** integrate `jizura-sources-db/bin/_lxu-utils` as a Bric-A-Brac SFModule
* **`[—]`** implement API for `loadExtension`




<!-- END <!insert src=./README-unsorted.md> -->
------------------------------------------------------------------------------------------------------------



