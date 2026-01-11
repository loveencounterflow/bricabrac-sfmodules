

# Bric-A-Brac Standard Brics

A collection of (sometimes not-so) small-ish utilities


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [DBric Database Adapter](#dbric-database-adapter)
  - [To Do](#to-do)
- [InterMission: Tables and Methods to Handle Integer Intervals](#intermission-tables-and-methods-to-handle-integer-intervals)
  - [Ranges / Integer Intervals](#ranges--integer-intervals)
  - [To Do](#to-do-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-dbric.md> -->


# DBric Database Adapter


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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



<!-- END <!insert src=./README-dbric.md> -->
------------------------------------------------------------------------------------------------------------
<!-- BEGIN <!insert src=./README-intermission.md> -->


# InterMission: Tables and Methods to Handle Integer Intervals


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Ranges / Integer Intervals](#ranges--integer-intervals)
- [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
## Ranges / Integer Intervals

<!--
* An integer range `ir` is defined by its lowest element `ir.lo` and its highest element `ir.hi` and an
  associated set of user-defined properties `ir.data`.
* The lowest element `ir.lo` must be less than or equal to `ir.hi`; thus,
  * a range with exactly one element (a *singular range*) will have `ir.lo` = `ir.hi`, and
  * empty ranges with no elements are not representable.
  * It is always the case that all integers `i` for which `ir.lo <= i <= ir.hi` holds are elements of `ir`
    and are invariably associated with the same set of user-defined properties.
* The first inserted range becomes the universal range, `ur`.
* The boundaries of any ranges inserted or otherwise arrived at can not exceed the boundaries of `ur`.
* A *complete range set* is an intrinsically ordered collection of a universal range and *n* integer ranges
  `[ ur, ir_1, ir_2, ..., ir_n, ]` where
-->
<!-- * **Rangeset** -->
<!-- * **Rangegroup** -->

* **Points**: The smallest entity of a hoard, represented as an integer; integers between `0x00_0000` and
  `0x10_ffff` can alternatively be represented as their corresponding Unicode character (i.e. a string that
  will yield an array of length one when passed into `Array.from string`; it may have `string.length == 2`
  notwithstanding, which is an unfortunate legacy of JavaScript being based on UTF-16 code *units*, not
  Unicode 32bit code *points*).

* **Bounds**:
  * In the case of a **Run** instance, its defining `lo`west and `hi`ghest points.
  * In the case of a **Scatter** instance, its `min`imal and `max`imal points found among the `lo`s and
    `hi`s of its constituent runs, if any.
  * In the case of a **Hoard** instance, its `first` and `last` points, which demarcate the maximal extent
    of any runs it contains via its constituent scatters. The default has `first: 0x00_0000, last:
    0x10_ffff` so as to accommodate all Unicode code points, although in an actual implementation one may
    want to set `first: 0x00_0001` so as to avoid `'\x00'` for compatibility with traditional C string
    processing.

* **Run**: A span of consecutive integers `i` defined by two numbers `lo` and `hi` such that `lo <= hi` and
  `lo <= i <= hi`; empty intervals are not representable, nor are non-contiguous runs possible; for
  single-integer runs `lo == i == hi` holds.

* **Scatter**: A set of **Run**s that is associated with a shared set of data. For example, the Unicode
  codepoints that are Latin letters and that are representable with a single UTF-8 byte is commonly seen in
  the regular expression `/[A-Za-z]/` which in our model can be represented as a scatter `[ (0x41,0x5a),
  (0x61,0x7a), ]` (i.e. `[ ('A','Z'), ('a','z'), ]`).

  * The canonical ordering of a scatter is by ascending `lo` bounds, then by ascending `hi` bounds for runs
    that share `lo` points.

  * A normalized (a.k.a. 'simplified') scatter has no overlapping and no directly adjacent runs and is
    sorted by ascending bounds; thus, `[ (3,7), (0,5), ]` and `[ (0,5), (6,7), ]` both get normalized to `[
    (0,7), ]`, but `[ (0,5), (7,7), ]` is already normal as it is sorted and the gap at `(6,6)` prevents
    further simplification.

  * A crucial functionality of our model is the ability to build non-normalized scatters which can at some
    later point get normalized to a lesser or greater degree depending on their associated data.

* Scatter of a *single Universal Inclusion Run* (`0x00_0000..0x10_ffff`); this sets data `ugc:Cn`
  (`Unassigned`, 'a reserved unassigned code point or a noncharacter') as a baseline for all other, more
  specific data; it also reflects the absolute boundaries of the universe of discourse. Among other things,
  this enables set algebra with finite complementary sets such as 'the set of all codepoints that are not
  classified as `ugc:Lu` (**u**ppercase **L**etters)'

* Multiple scatters of multiple universal **Exclusion** / **Gap** / **Hole** Runs

* **Hoard** (**Horde**?) or **Layered Scalar Property Set**: An unordered collection of any number of
  positive and negative scatters plus one neutral scatter.

  * The neutral scatter `s0` defines the universe of discourse (universal set, G. *Grundmenge*; its bounds
    `s0.lo`, `s0.hi` define the lowest `r.lo` and the highest `r.hi` that any *normalized* run `r` can
    have). Since the single neutral scatter must axiomatically be contiguous, it can be represented by a
    single run whose sole properties `r0.lo`, `r0.hi` can then be implemented as properties of the SPS.

  * **Hits**: The positive or inclusive scatters determine which integers are part of the universal set i.e.
    which are considers 'hits' with respect to one ore more scatters; the (one or more) scatters that are
    hit by a given element (point, scalar, integer) determine(s) which properties that element will be
    associated with.

  * **Gaps**: the negative or exclusive scatters determine which integers are not part of the 'set of
    interest', i.e. which are considered 'holes' or 'gaps'. Gaps take precedence over hits in the sense that
    any element that is found in both positive and negative scatters is considered a gap and not a hit.

  * **Layers** are selectable sets of hit scatters so element properties can be selected by purpose (ex.
    different virtual / composite fonts for different printing styles).

    * To this end, hit layers can add 'tags' which are arbitrary data items that can be selected by way of
      on API. The universal set and gap scatters could likewise have tags but the present intention is to
      probably disallow those and at any rate disregards any tags on non-hit scatters when selecting.

* Implementation of Hoards in SQL:

  * The below implementation notes assume use of hoard data structures specifically for the purpose of
    classifying Unicode codepoints (i.e. practically speaking glyphs) and determine associated properties;
    given a codepoint (CP), such data structures should be able to answer questions like: is this CP a CJK
    ideograph? Is it part of IICORE (i.e. moderately frequently used / not rare)? Assuming bold gothic (or
    handwritten, or running text) typesetting context, which font should be used and what typographic tweaks
    should be applied to the outline when rendering it?

  * The boundaries represented by the universal set can probably best be hard coded as SQL `check`
    constraints `lo between 0x000000 and 0x10ffff`, `hi between 0x000000 and 0x10ffff`. These are not moving
    targets and already represent the entire neutral scatter.

    ```sql
    create table jzr_glyphruns (
        rowid     text    unique  not null generated always as ( 't:uc:rsg:V=' || rsg ),
        scatter   text            not null,
        lo        integer         not null,
        hi        integer         not null,
      -- primary key ( rowid ),
      foreign key scatter references jzr_glyphscatters ( rowid ),
      constraint "Ωconstraint___5" check ( lo between 0x000000 and 0x10ffff ),
      constraint "Ωconstraint___6" check ( hi between 0x000000 and 0x10ffff ),
      constraint "Ωconstraint___7" check ( lo <= hi ),
      constraint "Ωconstraint___8" check ( rowid regexp '^.*$' )
      );
    ```

    ```sql
    create table jzr_glyphscatters (
        rowid     text    unique  not null generated always as ( 't:uc:rsg:V=' || rsg ),
        data      json            not null
      -- primary key ( rowid )
      );
    ```

    ```sql
    create table jzr_glyphhoard (
        rowid     text    unique  not null generated always as ( 't:uc:rsg:V=' || rsg ),
        data      json            not null
      -- primary key ( rowid )
      );
    ```

## To Do

* **`[—]`** reject floats
* **`[—]`** implement UR bounds, default `0x00_0000..0x10_ffff`


<!-- END <!insert src=./README-intermission.md> -->
------------------------------------------------------------------------------------------------------------



