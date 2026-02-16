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
  /* TAINT move to dedicated module */
  /* NOTE not using `letsfreezethat` to avoid issue with deep-freezing `Run` instances */
  lets = function(original, modifier = null) {
    var draft;
    draft = Array.isArray ? [...original] : {...original};
    modifier(draft);
    return freeze(draft);
  };

  //===========================================================================================================
  templates = {
    add_run_cfg: {
      lo: 0,
      hi: null,
      key: null,
      value: null
    }
  };

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
        SQL`create view hrd_group_facets as
select distinct
    a.key     as key,
    a.value   as value,
    count(*)  as runs
  from hrd_runs as a
  group by a.key, a.value
  order by a.key, a.value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_conflicts as
select
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
        SQL`create view _hrd_group_has_conflict as
select distinct
    f.key                                                     as key,
    f.value                                                   as value,
    not ( ca.key_a is null and cb.key_b is null )             as has_conflict
from hrd_group_facets as f
left join hrd_conflicts as ca on ( f.key = ca.key_a and f.value = ca.value_a )
left join hrd_conflicts as cb on ( f.key = cb.key_b and f.value = cb.value_b )
order by key, value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_normalization as
with ordered as (
  select
      key                                                     as key,
      value                                                   as value,
      lo                                                      as lo,
      hi                                                      as hi,
      lag( hi ) over ( partition by key, value order by lo )  as prev_hi
  from hrd_runs )
select
    key                                                       as key,
    value                                                     as value,
    case when sum(
      case
        when ( prev_hi is not null ) and ( lo <= prev_hi + 1 ) then 1 else 0 end ) > 0
        then 0 else 1 end                                     as is_normal
  from ordered
  group by key, value
  order by key, value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_groups as
select
    g.key                       as key,
    g.value                     as value,
    first_value( r.lo ) over w  as first,
    last_value(  r.hi ) over w  as last,
    g.runs                      as runs,
    n.is_normal                 as is_normal
  from hrd_group_facets           as g
  left join hrd_normalization     as n using ( key, value )
  left join hrd_runs              as r using ( key, value )
  window w as ( partition by r.key, r.value order by r.lo, r.hi, r.key, r.value )
  order by key, value;`
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
        hrd_find_conflicts: SQL`select * from hrd_conflicts;`,
        hrd_find_group_facets: SQL`select * from hrd_group_facets;`,
        hrd_find_runs_by_group: SQL`select * from hrd_runs order by key, value, lo, hi;`,
        hrd_find_groups: SQL`select * from hrd_groups order by key, value;`,
        hrd_delete_run: SQL`delete from hrd_runs where rowid = $rowid;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_nonnormal_groups: SQL`select key, value from hrd_normalization where is_normal = false order by key, value;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_remove_overlap: SQL`-- .................................................................................................
insert into hrd_runs ( lo, hi, key, value )
select lo, hi, key, value
from ( select
      b.lo      as lo,
      m.lo - 1  as hi,
      b.key     as key,
      b.value   as value
  from hrd_runs as b
  join hrd_runs as m on ( m.rowid = $mask_rowid )
  where true
    and b.rowid = $base_rowid
    and b.lo <= m.hi
    and b.hi >= m.lo
    and b.lo < m.lo
-- .................................................................................................
union all select
        m.hi + 1,
        b.hi,
        b.key,
        b.value
    from hrd_runs as b
    join hrd_runs as m on m.rowid = $mask_rowid
    where true
      and b.rowid = $base_rowid
      and b.lo <= m.hi
      and b.hi >= m.lo
      and b.hi > m.hi
);`
      },
      //-------------------------------------------------------------------------------------------------------
      methods: {
        // #-----------------------------------------------------------------------------------------------------
        // _hrd_as_halfopen:   ( run       ) -> { start: run.lo,         end:  run.hi        + 1, }
        // _hrd_from_halfopen: ( halfopen  ) -> { lo:    halfopen.start, hi:   halfopen.end  - 1, }

        // #-----------------------------------------------------------------------------------------------------
        // _hrd_subtract: ( base, mask ) ->
        //   halfopens = IFN.substract [ ( @_hrd_as_halfopen base ), ], [ ( @_hrd_as_halfopen mask ), ]
        //   return ( @_hrd_from_halfopen halfopen for halfopen in halfopens )

        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs: function() {
          return this.walk(this.statements.hrd_find_runs);
        },
        hrd_find_conflicts: function() {
          return this.walk(this.statements.hrd_find_conflicts);
        },
        hrd_find_group_facets: function() {
          return this.walk(this.statements.hrd_find_group_facets);
        },
        hrd_find_nonnormal_groups: function() {
          return this.walk(this.statements.hrd_find_nonnormal_groups);
        },
        hrd_find_groups: function() {
          return this.walk(this.statements.hrd_find_groups);
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_create_insert_run_cfg: function(lo, hi, key, value) {
          if (hi == null) {
            hi = lo;
          }
          value = JSON.stringify(value);
          return {lo, hi, key, value};
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_add_run: nfa({
          template: templates.add_run_cfg
        }, function(lo, hi, key, value, cfg) {
          return this.statements.hrd_insert_run.run(this._hrd_create_insert_run_cfg(lo, hi, key, value));
        }),
        //-----------------------------------------------------------------------------------------------------
        _hrd_runs_from_conflict: function(conflict, ok_value_json) {
          var hi_a, hi_b, key_a, key_b, lo_a, lo_b, rowid_a, rowid_b, run_nk, run_ok, value_a, value_b;
          ({rowid_a, lo_a, hi_a, key_a, value_a, rowid_b, lo_b, hi_b, key_b, value_b} = conflict);
          run_ok = {
            rowid: rowid_a,
            lo: lo_a,
            hi: hi_a,
            key: key_a,
            value: value_a
          };
          run_nk = {
            rowid: rowid_b,
            lo: lo_b,
            hi: hi_b,
            key: key_b,
            value: value_b
          };
          if (run_ok.value === ok_value_json) {
            return {run_ok, run_nk};
          }
          return {
            run_ok: run_nk,
            run_nk: run_ok
          };
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_punch: nfa({
          template: templates.add_run_cfg
        }, function(lo, hi, key, value, cfg) {
          var new_ok;
          /* TAINT need to wrap in transaction */
          /* like `hrd_insert_run()` but resolves key/value conflicts in favor of value given */
          // @hrd_validate()
          new_ok = this._hrd_create_insert_run_cfg(lo, hi, key, value);
          this.with_transaction(() => {
            var conflict, conflicts, i, len, results, run_nk, run_ok;
            this.statements.hrd_insert_run.run(new_ok);
            conflicts = [...(this.hrd_find_conflicts())];
            results = [];
            for (i = 0, len = conflicts.length; i < len; i++) {
              conflict = conflicts[i];
              if (conflict.key_a !== new_ok.key/* do not resolve conflicts of other key/value pairs */) {
                continue;
              }
              ({run_ok, run_nk} = this._hrd_runs_from_conflict(conflict, new_ok.value));
              this.statements.hrd_remove_overlap.run({
                base_rowid: run_nk.rowid,
                mask_rowid: run_ok.rowid
              });
              this.statements.hrd_delete_run.run({
                rowid: run_nk.rowid
              });
              results.push(null);
            }
            return results;
          });
          return null;
        }),
        //-----------------------------------------------------------------------------------------------------
        hrd_validate: function() {
          var conflicts;
          if ((conflicts = [...(this.hrd_find_conflicts())]).length === 0) {
            return null;
          }
          throw new Error(`Ωhrd__14 found conflicts: ${rpr(conflicts)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FINUI7O0VBSUEsQ0FBQTtJ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QUFhLEVBQWIsRUFBaUIsR0FBakIsRUFBc0IsS0FBdEIsQ0FBaEI7VUFORjtVQU9BLElBQWUsYUFBZjtZQUFBLE1BQU0sTUFBTjs7QUFDQSxpQkFBTztRQVplO01BaER4QjtJQXhORjtFQUxGLEVBN0NGOzs7RUF5VUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQXpVcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbiMjIyBOT1RFIG5vdCB1c2luZyBgbGV0c2ZyZWV6ZXRoYXRgIHRvIGF2b2lkIGlzc3VlIHdpdGggZGVlcC1mcmVlemluZyBgUnVuYCBpbnN0YW5jZXMgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gIGFkZF9ydW5fY2ZnOlxuICAgIGxvOiAgICAgICAwXG4gICAgaGk6ICAgICAgIG51bGxcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGJyaWNfcGx1Z2luID1cbiAgbmFtZTogICAnaHJkX2hvYXJkX3BsdWdpbicgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgcHJlZml4OiAnaHJkJyAgICAgICAgICAgICAgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgZXhwb3J0czpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IFtcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgaHJkX3J1bnMgKFxuICAgICAgICAgICAgcm93aWQgICB0ZXh0IG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBocmRfZ2V0X3J1bl9yb3dpZCggbG8sIGhpLCBrZXkgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCBub3QgbnVsbCxcbiAgICAgICAgICAgIGtleSAgICAgdGV4dCBub3QgbnVsbCxcbiAgICAgICAgICAgIHZhbHVlICAgdGV4dCBub3QgbnVsbCBkZWZhdWx0ICdudWxsJywgLS0gcHJvcGVyIGRhdGEgdHlwZSBpcyBganNvbmAgYnV0IGRlY2xhcmVkIGFzIGB0ZXh0YCBiL2Mgb2YgYHN0cmljdGBcbiAgICAgICAgICAtLSBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCBsbywgaGksIGtleSwgdmFsdWUgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBrZXkgcmVnZXhwICcuKicgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNVwiIGNoZWNrICgga2V5IHJlZ2V4cCAnXlxcJHgkfF5bXiRdLisnIClcbiAgICAgICAgKSBzdHJpY3Q7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgb24gaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfa2V5XCIgb24gaHJkX3J1bnMgKCBrZXkgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ3JvdXBfZmFjZXRzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgYS5rZXkgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGNvdW50KCopICBhcyBydW5zXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgZ3JvdXAgYnkgYS5rZXksIGEudmFsdWVcbiAgICAgICAgICBvcmRlciBieSBhLmtleSwgYS52YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfY29uZmxpY3RzIGFzXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgYXMgcm93aWRfYSxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvX2EsXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaV9hLFxuICAgICAgICAgICAgYS5rZXkgICAgYXMga2V5X2EsXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZV9hLFxuICAgICAgICAgICAgYi5yb3dpZCAgYXMgcm93aWRfYixcbiAgICAgICAgICAgIGIubG8gICAgIGFzIGxvX2IsXG4gICAgICAgICAgICBiLmhpICAgICBhcyBoaV9iLFxuICAgICAgICAgICAgYi5rZXkgICAgYXMga2V5X2IsXG4gICAgICAgICAgICBiLnZhbHVlICBhcyB2YWx1ZV9iXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEucm93aWQgPCAgIGIucm93aWQgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSA8PiAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBfaHJkX2dyb3VwX2hhc19jb25mbGljdCBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBmLnZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBub3QgKCBjYS5rZXlfYSBpcyBudWxsIGFuZCBjYi5rZXlfYiBpcyBudWxsICkgICAgICAgICAgICAgYXMgaGFzX2NvbmZsaWN0XG4gICAgICAgIGZyb20gaHJkX2dyb3VwX2ZhY2V0cyBhcyBmXG4gICAgICAgIGxlZnQgam9pbiBocmRfY29uZmxpY3RzIGFzIGNhIG9uICggZi5rZXkgPSBjYS5rZXlfYSBhbmQgZi52YWx1ZSA9IGNhLnZhbHVlX2EgKVxuICAgICAgICBsZWZ0IGpvaW4gaHJkX2NvbmZsaWN0cyBhcyBjYiBvbiAoIGYua2V5ID0gY2Iua2V5X2IgYW5kIGYudmFsdWUgPSBjYi52YWx1ZV9iIClcbiAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfbm9ybWFsaXphdGlvbiBhc1xuICAgICAgICB3aXRoIG9yZGVyZWQgYXMgKFxuICAgICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgICAgbG8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgaGkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgICAgbGFnKCBoaSApIG92ZXIgKCBwYXJ0aXRpb24gYnkga2V5LCB2YWx1ZSBvcmRlciBieSBsbyApICBhcyBwcmV2X2hpXG4gICAgICAgICAgZnJvbSBocmRfcnVucyApXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAga2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIHZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGNhc2Ugd2hlbiBzdW0oXG4gICAgICAgICAgICAgIGNhc2VcbiAgICAgICAgICAgICAgICB3aGVuICggcHJldl9oaSBpcyBub3QgbnVsbCApIGFuZCAoIGxvIDw9IHByZXZfaGkgKyAxICkgdGhlbiAxIGVsc2UgMCBlbmQgKSA+IDBcbiAgICAgICAgICAgICAgICB0aGVuIDAgZWxzZSAxIGVuZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIG9yZGVyZWRcbiAgICAgICAgICBncm91cCBieSBrZXksIHZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ3JvdXBzIGFzXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgZy5rZXkgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGcudmFsdWUgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGZpcnN0X3ZhbHVlKCByLmxvICkgb3ZlciB3ICBhcyBmaXJzdCxcbiAgICAgICAgICAgIGxhc3RfdmFsdWUoICByLmhpICkgb3ZlciB3ICBhcyBsYXN0LFxuICAgICAgICAgICAgZy5ydW5zICAgICAgICAgICAgICAgICAgICAgIGFzIHJ1bnMsXG4gICAgICAgICAgICBuLmlzX25vcm1hbCAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzICAgICAgICAgICBhcyBnXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ub3JtYWxpemF0aW9uICAgICBhcyBuIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ydW5zICAgICAgICAgICAgICBhcyByIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgci5rZXksIHIudmFsdWUgb3JkZXIgYnkgci5sbywgci5oaSwgci5rZXksIHIudmFsdWUgKVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9nZXRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGxvLCBoaSwga2V5ICkgLT5cbiAgICAgICAgICBscyA9IGlmIGxvIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGhzID0gaWYgaGkgPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgZlwidDpocmQ6cnVuczpWPSN7bHN9I3tNYXRoLmFicyBsb306KjwwNng7LCN7aHN9I3tNYXRoLmFicyBoaX06KjwwNng7LCN7a2V5fVwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9qc29uX3F1b3RlOlxuICAgICAgIyAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICMgICB2YWx1ZTogKCB4ICkgLT4gSlNPTi5zdHJpbmdpZnkgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGF0ZW1lbnRzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9pbnNlcnRfcnVuOiBTUUxcIlwiXCJpbnNlcnQgaW50byBocmRfcnVucyAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIHZhbHVlcyAoICRsbywgJGhpLCAka2V5LCAkdmFsdWUgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwc19mb3Jfa2V5OiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICgga2V5ID0gJGtleSApXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb25mbGljdHM6ICAgICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfY29uZmxpY3RzO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzOiAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2dyb3VwX2ZhY2V0cztcIlwiXCJcbiAgICAgIGhyZF9maW5kX3J1bnNfYnlfZ3JvdXA6ICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGtleSwgdmFsdWUsIGxvLCBoaTtcIlwiXCJcbiAgICAgIGhyZF9maW5kX2dyb3VwczogICAgICAgICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ncm91cHMgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgIGhyZF9kZWxldGVfcnVuOiAgICAgICAgICAgICBTUUxcIlwiXCJkZWxldGUgZnJvbSBocmRfcnVucyB3aGVyZSByb3dpZCA9ICRyb3dpZDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IGtleSwgdmFsdWUgZnJvbSBocmRfbm9ybWFsaXphdGlvbiB3aGVyZSBpc19ub3JtYWwgPSBmYWxzZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9yZW1vdmVfb3ZlcmxhcDogU1FMXCJcIlwiXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIGZyb20gKCBzZWxlY3RcbiAgICAgICAgICAgICAgYi5sbyAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBtLmxvIC0gMSAgYXMgaGksXG4gICAgICAgICAgICAgIGIua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICAgIGIudmFsdWUgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgbSBvbiAoIG0ucm93aWQgPSAkbWFza19yb3dpZCApXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgYW5kIGIubG8gPCBtLmxvXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdW5pb24gYWxsIHNlbGVjdFxuICAgICAgICAgICAgICAgIG0uaGkgKyAxLFxuICAgICAgICAgICAgICAgIGIuaGksXG4gICAgICAgICAgICAgICAgYi5rZXksXG4gICAgICAgICAgICAgICAgYi52YWx1ZVxuICAgICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gbS5yb3dpZCA9ICRtYXNrX3Jvd2lkXG4gICAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgICBhbmQgYi5oaSA+PSBtLmxvXG4gICAgICAgICAgICAgIGFuZCBiLmhpID4gbS5oaVxuICAgICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBfaHJkX2FzX2hhbGZvcGVuOiAgICggcnVuICAgICAgICkgLT4geyBzdGFydDogcnVuLmxvLCAgICAgICAgIGVuZDogIHJ1bi5oaSAgICAgICAgKyAxLCB9XG4gICAgICAjIF9ocmRfZnJvbV9oYWxmb3BlbjogKCBoYWxmb3BlbiAgKSAtPiB7IGxvOiAgICBoYWxmb3Blbi5zdGFydCwgaGk6ICAgaGFsZm9wZW4uZW5kICAtIDEsIH1cblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgX2hyZF9zdWJ0cmFjdDogKCBiYXNlLCBtYXNrICkgLT5cbiAgICAgICMgICBoYWxmb3BlbnMgPSBJRk4uc3Vic3RyYWN0IFsgKCBAX2hyZF9hc19oYWxmb3BlbiBiYXNlICksIF0sIFsgKCBAX2hyZF9hc19oYWxmb3BlbiBtYXNrICksIF1cbiAgICAgICMgICByZXR1cm4gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnMgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgICAgICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zXG4gICAgICBocmRfZmluZF9jb25mbGljdHM6ICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY29uZmxpY3RzXG4gICAgICBocmRfZmluZF9ncm91cF9mYWNldHM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3Vwc1xuICAgICAgaHJkX2ZpbmRfZ3JvdXBzOiAgICAgICAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2dyb3Vwc1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnOiAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgICByZXR1cm4geyBsbywgaGksIGtleSwgdmFsdWUsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0OiAoIGNvbmZsaWN0LCBva192YWx1ZV9qc29uICkgLT5cbiAgICAgICAgICB7IHJvd2lkX2EsIGxvX2EsIGhpX2EsIGtleV9hLCB2YWx1ZV9hLFxuICAgICAgICAgICAgcm93aWRfYiwgbG9fYiwgaGlfYiwga2V5X2IsIHZhbHVlX2IsIH0gID0gY29uZmxpY3RcbiAgICAgICAgICBydW5fb2sgPSB7IHJvd2lkOiByb3dpZF9hLCBsbzogbG9fYSwgaGk6IGhpX2EsIGtleToga2V5X2EsIHZhbHVlOiB2YWx1ZV9hLCB9XG4gICAgICAgICAgcnVuX25rID0geyByb3dpZDogcm93aWRfYiwgbG86IGxvX2IsIGhpOiBoaV9iLCBrZXk6IGtleV9iLCB2YWx1ZTogdmFsdWVfYiwgfVxuICAgICAgICAgIHJldHVybiB7IHJ1bl9vaywgcnVuX25rLCB9IGlmIHJ1bl9vay52YWx1ZSBpcyBva192YWx1ZV9qc29uXG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rOiBydW5fbmssIHJ1bl9uazogcnVuX29rLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3B1bmNoOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIG5lZWQgdG8gd3JhcCBpbiB0cmFuc2FjdGlvbiAjIyNcbiAgICAgICAgIyMjIGxpa2UgYGhyZF9pbnNlcnRfcnVuKClgIGJ1dCByZXNvbHZlcyBrZXkvdmFsdWUgY29uZmxpY3RzIGluIGZhdm9yIG9mIHZhbHVlIGdpdmVuICMjI1xuICAgICAgICAjIEBocmRfdmFsaWRhdGUoKVxuICAgICAgICBuZXdfb2sgPSBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIEB3aXRoX3RyYW5zYWN0aW9uID0+XG4gICAgICAgICAgQHN0YXRlbWVudHMuaHJkX2luc2VydF9ydW4ucnVuIG5ld19va1xuICAgICAgICAgIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXVxuICAgICAgICAgIGZvciBjb25mbGljdCBpbiBjb25mbGljdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBjb25mbGljdC5rZXlfYSBpcyBuZXdfb2sua2V5ICMjIyBkbyBub3QgcmVzb2x2ZSBjb25mbGljdHMgb2Ygb3RoZXIga2V5L3ZhbHVlIHBhaXJzICMjI1xuICAgICAgICAgICAgeyBydW5fb2ssIHJ1bl9uaywgfSA9IEBfaHJkX3J1bnNfZnJvbV9jb25mbGljdCBjb25mbGljdCwgbmV3X29rLnZhbHVlXG4gICAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfcmVtb3ZlX292ZXJsYXAucnVuIHsgYmFzZV9yb3dpZDogcnVuX25rLnJvd2lkLCBtYXNrX3Jvd2lkOiBydW5fb2sucm93aWQsIH1cbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfcnVuLnJ1biB7IHJvd2lkOiBydW5fbmsucm93aWQsIH1cbiAgICAgICAgICAgIDtudWxsXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlOiAtPlxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXSApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX18xNCBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnNfYnlfZ3JvdXA6IC0+XG4gICAgICAgIHBydl9rZXkgICA9IG51bGxcbiAgICAgICAgcHJ2X3ZhbHVlID0gbnVsbFxuICAgICAgICBncm91cCAgICAgPSBudWxsXG4gICAgICAgIGZvciB7IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWUsIH0gZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zX2J5X2dyb3VwXG4gICAgICAgICAgdW5sZXNzICgga2V5IGlzIHBydl9rZXkgKSBhbmQgKCB2YWx1ZSBpcyBwcnZfdmFsdWUgKVxuICAgICAgICAgICAgeWllbGQgZ3JvdXAgaWYgZ3JvdXA/XG4gICAgICAgICAgICBncm91cCAgICAgICAgID0geyBrZXksIHZhbHVlLCBydW5zOiBbXSwgfVxuICAgICAgICAgICAgcHJ2X2tleSAgICAgICA9IGtleVxuICAgICAgICAgICAgcHJ2X3ZhbHVlICAgICA9IHZhbHVlXG4gICAgICAgICAgZ3JvdXAucnVucy5wdXNoIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgcmV0dXJuIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfcGx1Z2luLFxuICB9XG5cblxuIl19
