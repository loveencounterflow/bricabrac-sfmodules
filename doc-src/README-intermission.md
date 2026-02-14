

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
