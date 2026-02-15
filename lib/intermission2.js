(function() {
  'use strict';
  var Dbric, Dbric_std, IDN, IFN, LIT, SQL, T, VEC, dbric_plugin, debug, f, freeze, hide, lets, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, templates, type_of;

  //===========================================================================================================
  ({debug} = console);

  ({freeze} = Object);

  IFN = require('./../dependencies/intervals-fn-lib.js');

  ({T} = require('./intermission-types'));

  //...........................................................................................................
  ({nfa} = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());

  ({nameit} = (require('./various-brics')).require_nameit());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({hide, set_readonly, set_hidden_readonly, set_getter} = (require('./various-brics')).require_managed_property_tools());

  ({
    inspect: rpr
  } = require('node:util'));

  // { deploy,               } = ( require './unstable-object-tools-brics' ).require_deploy()
  // { get_sha1sum7d,        } = require './shasum'
  ({f} = require('effstring'));

  ({Dbric, Dbric_std, SQL, LIT, IDN, VEC} = require('./dbric'));

  //===========================================================================================================
  //===========================================================================================================
  /* TAINT move to dedicated module */
  /* NOTE not using `letsfreezethat` to avoid issue with deep-freezing `Run` instances */
  lets = function(original, modifier = null) {
    var draft;
    draft = Array.isArray ? [...original] : {...original};
    modifier(draft);
    return freeze(draft);
  };

  //===========================================================================================================
  templates = {};

  //===========================================================================================================
  dbric_plugin = {
    name: 'hrd_hoard_plugin'/* NOTE informative, not enforced */,
    prefix: 'hrd'/* NOTE informative, not enforced */,
    exports: {
      //-------------------------------------------------------------------------------------------------------
      build: [
        //-----------------------------------------------------------------------------------------------------
        SQL`create table hrd_runs (
    rowid   text not null generated always as ( hrd_get_run_rowid( lo, hi, key ) ) stored,
    lo      real not null,
    hi      real not null,
    key     text not null,
    value   text not null default 'null', -- proper data type is \`json\` but declared as \`text\` b/c of \`strict\`
  -- primary key ( rowid ),
  unique ( rowid ),
  unique ( lo, hi, key, value ),
  constraint "Ωhrd_constraint___1" check (
    ( abs( lo ) = 9e999 ) or (
      ( lo = cast( lo as integer ) )
      and (       ${Number.MIN_SAFE_INTEGER} <= lo )
      and ( lo <= ${Number.MAX_SAFE_INTEGER} ) ) ),
  constraint "Ωhrd_constraint___2" check (
    ( abs( hi ) = 9e999 ) or (
      ( hi = cast( hi as integer ) )
      and (       ${Number.MIN_SAFE_INTEGER} <= hi )
      and ( hi <= ${Number.MAX_SAFE_INTEGER} ) ) ),
  constraint "Ωhrd_constraint___3" check ( lo <= hi ),
  constraint "Ωhrd_constraint___4" check ( key regexp '.*' )
  -- constraint "Ωhrd_constraint___5" check ( key regexp '^\$x$|^[^$].+' )
) strict;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create index "hrd_index_runs_hi"  on hrd_runs ( hi );`,
        SQL`create index "hrd_index_runs_key" on hrd_runs ( key );`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_groups as
select distinct
    a.key   as key,
    a.value as value
  from hrd_runs as a
  order by a.key, a.value;`
      ],
      //-------------------------------------------------------------------------------------------------------
      //-----------------------------------------------------------------------------------------------------
      functions: {
        //-----------------------------------------------------------------------------------------------------
        hrd_get_run_rowid: {
          deterministic: true,
          value: function(lo, hi, key) {
            var hs, ls;
            ls = lo < 0 ? '-' : '+';
            hs = hi < 0 ? '-' : '+';
            return f`t:hrd:runs:V=${ls}${Math.abs(lo)}:*<06x;,${hs}${Math.abs(hi)}:*<06x;,${key}`;
          }
        }
      },
      // #-----------------------------------------------------------------------------------------------------
      // hrd_json_quote:
      //   deterministic: true
      //   value: ( x ) -> JSON.stringify x

      //-------------------------------------------------------------------------------------------------------
      statements: {
        //-----------------------------------------------------------------------------------------------------
        hrd_insert_run: SQL`insert into hrd_runs ( lo, hi, key, value ) values ( $lo, $hi, $key, $value );`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_overlaps: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  where true
    and ( lo <= $hi )
    and ( hi >= $lo )
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_overlaps_for_key: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  where true
    and ( key = $key )
    and ( lo <= $hi )
    and ( hi >= $lo )
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_conflicts: SQL`select
    a.rowid  as rowid_a,
    a.lo     as lo_a,
    a.hi     as hi_a,
    a.key    as key_a,
    a.value  as value_a,
    b.rowid  as rowid_b,
    b.lo     as lo_b,
    b.hi     as hi_b,
    b.key    as key_b,
    b.value  as value_b
  from hrd_runs as a
  join hrd_runs as b
    on true
      and ( a.rowid <   b.rowid )
      and ( a.key   =   b.key   )
      and ( a.value <>  b.value )
      and ( a.lo    <=  b.hi    )
      and ( a.hi    >=  b.lo    )
  order by a.lo, a.hi, a.key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_groups: SQL`select * from hrd_groups;`,
        hrd_find_runs_by_group: SQL`select * from hrd_runs order by key, value, lo, hi;`
      },
      //-------------------------------------------------------------------------------------------------------
      methods: {
        //-----------------------------------------------------------------------------------------------------
        hrd_find_conflicts: function() {
          return this.walk(this.statements.hrd_find_conflicts);
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_validate: function() {
          var conflicts;
          if ((conflicts = [...(this.hrd_find_conflicts())]).length === 0) {
            return null;
          }
          throw new Error(`Ωhrd___6 found conflicts: ${rpr(conflicts)}`);
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_groups: function() {
          return this.walk(this.statements.hrd_find_groups);
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs_by_group: function*() {
          var group, hi, key, lo, prv_key, prv_value, rowid, value, x;
          prv_key = null;
          prv_value = null;
          group = null;
          for (x of this.walk(this.statements.hrd_find_runs_by_group)) {
            ({rowid, lo, hi, key, value} = x);
            if (!((key === prv_key) && (value === prv_value))) {
              if (group != null) {
                yield group;
              }
              group = {
                key,
                value,
                runs: []
              };
              prv_key = key;
              prv_value = value;
            }
            group.runs.push({rowid, lo, hi, key, value});
          }
          if (group != null) {
            yield group;
          }
          return null;
        }
      }
    }
  };

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = Object.freeze({
      templates,
      IFN,
      lets,
      typespace: T
    });
    return {dbric_plugin};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FINUI7O0VBSUEsQ0FBQTtJ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O1FBWmU7TUFYeEI7SUF6SEY7RUFMRixFQXpDRjs7O0VBaU1BLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjO01BQUUsU0FBRjtNQUFhLEdBQWI7TUFBa0IsSUFBbEI7TUFBd0IsU0FBQSxFQUFXO0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUFqTXBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbiMjIyBOT1RFIG5vdCB1c2luZyBgbGV0c2ZyZWV6ZXRoYXRgIHRvIGF2b2lkIGlzc3VlIHdpdGggZGVlcC1mcmVlemluZyBgUnVuYCBpbnN0YW5jZXMgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGJyaWNfcGx1Z2luID1cbiAgbmFtZTogICAnaHJkX2hvYXJkX3BsdWdpbicgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgcHJlZml4OiAnaHJkJyAgICAgICAgICAgICAgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgZXhwb3J0czpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IFtcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgaHJkX3J1bnMgKFxuICAgICAgICAgICAgcm93aWQgICB0ZXh0IG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBocmRfZ2V0X3J1bl9yb3dpZCggbG8sIGhpLCBrZXkgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCBub3QgbnVsbCxcbiAgICAgICAgICAgIGtleSAgICAgdGV4dCBub3QgbnVsbCxcbiAgICAgICAgICAgIHZhbHVlICAgdGV4dCBub3QgbnVsbCBkZWZhdWx0ICdudWxsJywgLS0gcHJvcGVyIGRhdGEgdHlwZSBpcyBganNvbmAgYnV0IGRlY2xhcmVkIGFzIGB0ZXh0YCBiL2Mgb2YgYHN0cmljdGBcbiAgICAgICAgICAtLSBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCBsbywgaGksIGtleSwgdmFsdWUgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBrZXkgcmVnZXhwICcuKicgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNVwiIGNoZWNrICgga2V5IHJlZ2V4cCAnXlxcJHgkfF5bXiRdLisnIClcbiAgICAgICAgKSBzdHJpY3Q7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgb24gaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfa2V5XCIgb24gaHJkX3J1bnMgKCBrZXkgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ3JvdXBzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgYS5rZXkgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgb3JkZXIgYnkgYS5rZXksIGEudmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2dldF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggbG8sIGhpLCBrZXkgKSAtPlxuICAgICAgICAgIGxzID0gaWYgbG8gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgaHMgPSBpZiBoaSA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBmXCJ0OmhyZDpydW5zOlY9I3tsc30je01hdGguYWJzIGxvfToqPDA2eDssI3toc30je01hdGguYWJzIGhpfToqPDA2eDssI3trZXl9XCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2luc2VydF9ydW46IFNRTFwiXCJcImluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzX2Zvcl9rZXk6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBrZXkgPSAka2V5IClcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2NvbmZsaWN0czogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgYXMgcm93aWRfYSxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvX2EsXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaV9hLFxuICAgICAgICAgICAgYS5rZXkgICAgYXMga2V5X2EsXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZV9hLFxuICAgICAgICAgICAgYi5yb3dpZCAgYXMgcm93aWRfYixcbiAgICAgICAgICAgIGIubG8gICAgIGFzIGxvX2IsXG4gICAgICAgICAgICBiLmhpICAgICBhcyBoaV9iLFxuICAgICAgICAgICAgYi5rZXkgICAgYXMga2V5X2IsXG4gICAgICAgICAgICBiLnZhbHVlICBhcyB2YWx1ZV9iXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEucm93aWQgPCAgIGIucm93aWQgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSA8PiAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ncm91cHM6ICAgICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ncm91cHM7XCJcIlwiXG4gICAgICBocmRfZmluZF9ydW5zX2J5X2dyb3VwOiBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGtleSwgdmFsdWUsIGxvLCBoaTtcIlwiXCJcblxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2NvbmZsaWN0czogLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY29uZmxpY3RzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlOiAtPlxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXSApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX19fNiBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2dyb3VwczogLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogLT5cbiAgICAgICAgcHJ2X2tleSAgID0gbnVsbFxuICAgICAgICBwcnZfdmFsdWUgPSBudWxsXG4gICAgICAgIGdyb3VwICAgICA9IG51bGxcbiAgICAgICAgZm9yIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfSBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNfYnlfZ3JvdXBcbiAgICAgICAgICB1bmxlc3MgKCBrZXkgaXMgcHJ2X2tleSApIGFuZCAoIHZhbHVlIGlzIHBydl92YWx1ZSApXG4gICAgICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgICAgIGdyb3VwICAgICAgICAgPSB7IGtleSwgdmFsdWUsIHJ1bnM6IFtdLCB9XG4gICAgICAgICAgICBwcnZfa2V5ICAgICAgID0ga2V5XG4gICAgICAgICAgICBwcnZfdmFsdWUgICAgID0gdmFsdWVcbiAgICAgICAgICBncm91cC5ydW5zLnB1c2ggeyByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG4gICAgICAgIHlpZWxkIGdyb3VwIGlmIGdyb3VwP1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgSUZOLCBsZXRzLCB0eXBlc3BhY2U6IFQsIH1cbiAgcmV0dXJuIHtcbiAgICBkYnJpY19wbHVnaW4sXG4gIH1cblxuXG4iXX0=
