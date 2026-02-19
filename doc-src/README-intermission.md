

# InterMission: Tables and Methods to Handle Integer Intervals


## Ranges / Integer Intervals

* A **Run** is defined by a tuple `( lo, hi, key, value, )`.

* A run is conceptualized to 'cover' or 'contain' all consecutive integers `n` such that `lo <= n <= hi`.
  Both bounds are inclusive; empty intervals are not representable; non-contiguous intervals are only
  representable by using multiple runs; for single-point runs, `lo == n == hi` holds.

* `lo` and `hi` are either JS 'safe' integers (that satisfy `Number.isSafeInteger n`) or positive or
  negative `Infinity`; thus, the set of representable integers `n` is given by `( abs( n ) == Infinity ) or
  ( -9007199254740991 <= n <= +9007199254740991 )`. No coercion of fractional numbers is attempted because
  it will depend on the application whether to understand a value like `4.5` as meaning `4` or `5` or
  whether to treat it as an error. These constraint are implemented in the database (which, incidentally,
  uses the `real` datatype to allow for `Infinity`).

* The field `key` must be a non-empty string. Valid JS identifiers are preferred. Keys starting with `$` are
  considered special.

* The field `value` must be JSON-serializable value such as e.g. `true`, `"a text"`, `22.5` or `[6,8,11]`.
  (It is possible to store JSON object literals in `value`, but observe that doing so requires normalizing
  the value e.g. with the [RFC8785](https://github.com/erdtman/canonicalize) algorithm to allow for trivial
  value equality checks.)

* The triplet `( lo, hi, key, )` must be unique in a given collection (hoard).

* All runs with a given `key` form a 'clan'; all runs with a given `key` / `value` pair, a.k.a. a 'facet',
  form a 'family'.

* A family is considered 'normalized' when it is represented with the minimal number of runs with overlaps
  removed and adjacent runs merged.

* Points can only be covered by up to one family from each clan, meaning that one never needs to resolve
  conflicts between contradictory facets for a single point.

<!--   * The clan with the special key `$x` and any allowable value are used to declare 'exclusion zones' that no
    non-special runs can cover. For example, in a hoard that is only used for points between `0` and `100`,
    one may define exclusion zones as `{ lo: -Infinity, hi: -1, key: '$x', value: 'too small', }`, `{ lo:
    101, hi: +Infinity, key: '$x', value: 'too big', }` where the `value`s can be used for error messages
    and so on.
 --><!--   * The clans with the special key `$t:` followed by a key name and associated with any allowable value are
    used to declare 'templates', i.e. fallback values that apply to points that don't have the corresponding
    facet explicitly set. -->


<!-- ## Bipolarity of Runs

* Inclusive runs are defined by the points they include
* Exclusive runs are defined by the points they exclude.

As an example, a base intended to represent valid Unicode codepoints could contain, among others, the
following exclusive runs:

* `{ lo: -Infinity, hi:        -1, key: '$x', value: "negative CIDs",   }`
* `{ lo:    0x0000, hi:    0x0000, key: '$x', value: "zero bytes",      }`
* `{ lo:    0xd800, hi:    0xdbff, key: '$x', value: "high surrogates", }`
* `{ lo:    0xdc00, hi:    0xdfff, key: '$x', value: "low surrogates",  }`
* `{ lo:    0xfdd0, hi:    0xfdef, key: '$x', value: "noncharacters",   }`
* `{ lo:    0xfffe, hi:    0xffff, key: '$x', value: "noncharacters",   }`
* `{ lo:  0x110000, hi: +Infinity, key: '$x', value: "excessive CIDs",  }`

Each of these runs will prevent some points from being used in any associated (and normalized) scatters
and, additionaly, allow to formulate instructive error messages that may be caused e.g. by a text
processing utility that encounters illegal codepoints.
 -->

## To Do

* **`[—]`** implement immutability

## Is Done

* **`[+]`** reject floats
