(function() {
  'use strict';
  var Dbric, Dbric_std, False, IDN, IFN, LIT, SQL, T, True, VEC, as_bool, dbric_plugin, debug, f, freeze, from_bool, hide, lets, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, templates, type_of;

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

  ({Dbric, Dbric_std, True, False, as_bool, from_bool, SQL, LIT, IDN, VEC} = require('./dbric'));

  //===========================================================================================================
  /* TAINT move to dedicated module */
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
select distinct
    a.rowid  as rowid,
    a.lo     as lo,
    a.hi     as hi,
    a.key    as key,
    a.value  as value
  from hrd_runs as a
  join hrd_runs as b
    on true
      and ( a.key   =   b.key   )
      and ( a.value !=  b.value )
      and ( a.lo    <=  b.hi    )
      and ( a.hi    >=  b.lo    )
  order by a.lo, a.hi, a.key;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view _hrd_group_has_conflict as
select distinct
    f.key                     as key,
    not ( c.key is null )     as has_conflict
from hrd_group_facets   as f
left join hrd_conflicts as c on ( f.key = c.key and f.value = c.value )
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
select distinct
    g.key                       as key,
    g.value                     as value,
    min( r.lo ) over w          as first,
    max( r.hi ) over w          as last,
    g.runs                      as runs,
    false                       as has_conflict, -- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    n.is_normal                 as is_normal
  from hrd_group_facets           as g
  left join hrd_normalization     as n using ( key, value )
  left join hrd_runs              as r using ( key, value )
  window w as ( partition by r.key, r.value )
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
        hrd_find_group_facets: function() {
          return this.walk(this.statements.hrd_find_group_facets);
        },
        hrd_find_nonnormal_groups: function() {
          return this.walk(this.statements.hrd_find_nonnormal_groups);
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_groups: function*() {
          var row;
          for (row of this.walk(this.statements.hrd_find_groups)) {
            row.has_conflict = as_bool(row.has_conflict);
            row.is_normal = as_bool(row.is_normal);
            yield row;
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_conflicts: function*() {
          var row;
          for (row of this.walk(this.statements.hrd_find_conflicts)) {
            // row.has_conflict  = as_bool row.has_conflict
            // row.is_normal     = as_bool row.is_normal
            yield row;
          }
          return null;
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
        // hrd_find_overlaps: nfa { template: templates.lo_hi, }, ( lo, hi, cfg ) ->
        hrd_find_overlaps: function*(lo, hi = null) {
          var row;
          if (hi == null) {
            hi = lo;
          }
          for (row of this.walk(this.statements.hrd_find_overlaps, {lo, hi})) {
            row.value = JSON.parse(row.value);
            yield row;
          }
          return null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtDQUFSLENBQUYsQ0FBMkQsQ0FBQyxvQ0FBNUQsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixD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QSxHQUFZO1VBQ1osU0FBQSxHQUFZO1VBQ1osS0FBQSxHQUFZO1VBQ1osS0FBQSxzREFBQTthQUFJLENBQUUsS0FBRixFQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEdBQWpCLEVBQXNCLEtBQXRCO1lBQ0YsTUFBTyxDQUFFLEdBQUEsS0FBTyxPQUFULENBQUEsSUFBdUIsQ0FBRSxLQUFBLEtBQVMsU0FBWCxFQUE5QjtjQUNFLElBQWUsYUFBZjtnQkFBQSxNQUFNLE1BQU47O2NBQ0EsS0FBQSxHQUFnQjtnQkFBRSxHQUFGO2dCQUFPLEtBQVA7Z0JBQWMsSUFBQSxFQUFNO2NBQXBCO2NBQ2hCLE9BQUEsR0FBZ0I7Y0FDaEIsU0FBQSxHQUFnQixNQUpsQjs7WUFLQSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVgsQ0FBZ0IsQ0FBRSxLQUFGLEVBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsR0FBakIsRUFBc0IsS0FBdEIsQ0FBaEI7VUFORjtVQU9BLElBQWUsYUFBZjtZQUFBLE1BQU0sTUFBTjs7QUFDQSxpQkFBTztRQVplO01BdkV4QjtJQWpORjtFQUxGLEVBaERGOzs7RUE0VkEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQTVWcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kYnJpY19wbHVnaW4gPVxuICBuYW1lOiAgICdocmRfaG9hcmRfcGx1Z2luJyAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBwcmVmaXg6ICdocmQnICAgICAgICAgICAgICAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBleHBvcnRzOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogW1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGhyZF9nZXRfcnVuX3Jvd2lkKCBsbywgaGksIGtleSApICkgc3RvcmVkLFxuICAgICAgICAgICAgbG8gICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAga2V5ICAgICB0ZXh0IG5vdCBudWxsLFxuICAgICAgICAgICAgdmFsdWUgICB0ZXh0IG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLCAtLSBwcm9wZXIgZGF0YSB0eXBlIGlzIGBqc29uYCBidXQgZGVjbGFyZWQgYXMgYHRleHRgIGIvYyBvZiBgc3RyaWN0YFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGxvLCBoaSwga2V5LCB2YWx1ZSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzRcIiBjaGVjayAoIGtleSByZWdleHAgJy4qJyApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX181XCIgY2hlY2sgKCBrZXkgcmVnZXhwICdeXFwkeCR8XlteJF0uKycgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19oaVwiICBvbiBocmRfcnVucyAoIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiBvbiBocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cF9mYWNldHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9jb25mbGljdHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgb24gdHJ1ZVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSAhPSAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBfaHJkX2dyb3VwX2hhc19jb25mbGljdCBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgbm90ICggYy5rZXkgaXMgbnVsbCApICAgICBhcyBoYXNfY29uZmxpY3RcbiAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzICAgYXMgZlxuICAgICAgICBsZWZ0IGpvaW4gaHJkX2NvbmZsaWN0cyBhcyBjIG9uICggZi5rZXkgPSBjLmtleSBhbmQgZi52YWx1ZSA9IGMudmFsdWUgKVxuICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gICAgICAgIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIClcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgICAgICAgY2FzZVxuICAgICAgICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gb3JkZXJlZFxuICAgICAgICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBnLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZy52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgbWluKCByLmxvICkgb3ZlciB3ICAgICAgICAgIGFzIGZpcnN0LFxuICAgICAgICAgICAgbWF4KCByLmhpICkgb3ZlciB3ICAgICAgICAgIGFzIGxhc3QsXG4gICAgICAgICAgICBnLnJ1bnMgICAgICAgICAgICAgICAgICAgICAgYXMgcnVucyxcbiAgICAgICAgICAgIGZhbHNlICAgICAgICAgICAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3QsIC0tICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhXG4gICAgICAgICAgICBuLmlzX25vcm1hbCAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzICAgICAgICAgICBhcyBnXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ub3JtYWxpemF0aW9uICAgICBhcyBuIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ydW5zICAgICAgICAgICAgICBhcyByIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgci5rZXksIHIudmFsdWUgKVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9nZXRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGxvLCBoaSwga2V5ICkgLT5cbiAgICAgICAgICBscyA9IGlmIGxvIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGhzID0gaWYgaGkgPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgZlwidDpocmQ6cnVuczpWPSN7bHN9I3tNYXRoLmFicyBsb306KjwwNng7LCN7aHN9I3tNYXRoLmFicyBoaX06KjwwNng7LCN7a2V5fVwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9qc29uX3F1b3RlOlxuICAgICAgIyAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICMgICB2YWx1ZTogKCB4ICkgLT4gSlNPTi5zdHJpbmdpZnkgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGF0ZW1lbnRzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9pbnNlcnRfcnVuOiBTUUxcIlwiXCJpbnNlcnQgaW50byBocmRfcnVucyAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIHZhbHVlcyAoICRsbywgJGhpLCAka2V5LCAkdmFsdWUgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwc19mb3Jfa2V5OiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICgga2V5ID0gJGtleSApXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb25mbGljdHM6ICAgICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfY29uZmxpY3RzO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzOiAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2dyb3VwX2ZhY2V0cztcIlwiXCJcbiAgICAgIGhyZF9maW5kX3J1bnNfYnlfZ3JvdXA6ICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGtleSwgdmFsdWUsIGxvLCBoaTtcIlwiXCJcbiAgICAgIGhyZF9maW5kX2dyb3VwczogICAgICAgICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ncm91cHMgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgIGhyZF9kZWxldGVfcnVuOiAgICAgICAgICAgICBTUUxcIlwiXCJkZWxldGUgZnJvbSBocmRfcnVucyB3aGVyZSByb3dpZCA9ICRyb3dpZDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IGtleSwgdmFsdWUgZnJvbSBocmRfbm9ybWFsaXphdGlvbiB3aGVyZSBpc19ub3JtYWwgPSBmYWxzZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9yZW1vdmVfb3ZlcmxhcDogU1FMXCJcIlwiXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIGZyb20gKCBzZWxlY3RcbiAgICAgICAgICAgICAgYi5sbyAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBtLmxvIC0gMSAgYXMgaGksXG4gICAgICAgICAgICAgIGIua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICAgIGIudmFsdWUgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgbSBvbiAoIG0ucm93aWQgPSAkbWFza19yb3dpZCApXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgYW5kIGIubG8gPCBtLmxvXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdW5pb24gYWxsIHNlbGVjdFxuICAgICAgICAgICAgICAgIG0uaGkgKyAxLFxuICAgICAgICAgICAgICAgIGIuaGksXG4gICAgICAgICAgICAgICAgYi5rZXksXG4gICAgICAgICAgICAgICAgYi52YWx1ZVxuICAgICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gbS5yb3dpZCA9ICRtYXNrX3Jvd2lkXG4gICAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgICBhbmQgYi5oaSA+PSBtLmxvXG4gICAgICAgICAgICAgIGFuZCBiLmhpID4gbS5oaVxuICAgICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBfaHJkX2FzX2hhbGZvcGVuOiAgICggcnVuICAgICAgICkgLT4geyBzdGFydDogcnVuLmxvLCAgICAgICAgIGVuZDogIHJ1bi5oaSAgICAgICAgKyAxLCB9XG4gICAgICAjIF9ocmRfZnJvbV9oYWxmb3BlbjogKCBoYWxmb3BlbiAgKSAtPiB7IGxvOiAgICBoYWxmb3Blbi5zdGFydCwgaGk6ICAgaGFsZm9wZW4uZW5kICAtIDEsIH1cblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgX2hyZF9zdWJ0cmFjdDogKCBiYXNlLCBtYXNrICkgLT5cbiAgICAgICMgICBoYWxmb3BlbnMgPSBJRk4uc3Vic3RyYWN0IFsgKCBAX2hyZF9hc19oYWxmb3BlbiBiYXNlICksIF0sIFsgKCBAX2hyZF9hc19oYWxmb3BlbiBtYXNrICksIF1cbiAgICAgICMgICByZXR1cm4gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnMgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgICAgICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zXG4gICAgICBocmRfZmluZF9ncm91cF9mYWNldHM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3Vwc1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2dyb3VwczogLT5cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2dyb3Vwc1xuICAgICAgICAgIHJvdy5oYXNfY29uZmxpY3QgID0gYXNfYm9vbCByb3cuaGFzX2NvbmZsaWN0XG4gICAgICAgICAgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb25mbGljdHM6IC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9jb25mbGljdHNcbiAgICAgICAgICAjIHJvdy5oYXNfY29uZmxpY3QgID0gYXNfYm9vbCByb3cuaGFzX2NvbmZsaWN0XG4gICAgICAgICAgIyByb3cuaXNfbm9ybWFsICAgICA9IGFzX2Jvb2wgcm93LmlzX25vcm1hbFxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnOiAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgICByZXR1cm4geyBsbywgaGksIGtleSwgdmFsdWUsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9maW5kX292ZXJsYXBzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmxvX2hpLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiAoIGxvLCBoaSA9IG51bGwgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9vdmVybGFwcywgeyBsbywgaGksIH1cbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLmhyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9ydW5zX2Zyb21fY29uZmxpY3Q6ICggY29uZmxpY3QsIG9rX3ZhbHVlX2pzb24gKSAtPlxuICAgICAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgICAgICByb3dpZF9iLCBsb19iLCBoaV9iLCBrZXlfYiwgdmFsdWVfYiwgfSAgPSBjb25mbGljdFxuICAgICAgICAgIHJ1bl9vayA9IHsgcm93aWQ6IHJvd2lkX2EsIGxvOiBsb19hLCBoaTogaGlfYSwga2V5OiBrZXlfYSwgdmFsdWU6IHZhbHVlX2EsIH1cbiAgICAgICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rLCBydW5fbmssIH0gaWYgcnVuX29rLnZhbHVlIGlzIG9rX3ZhbHVlX2pzb25cbiAgICAgICAgICByZXR1cm4geyBydW5fb2s6IHJ1bl9uaywgcnVuX25rOiBydW5fb2ssIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcHVuY2g6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgbmVlZCB0byB3cmFwIGluIHRyYW5zYWN0aW9uICMjI1xuICAgICAgICAjIyMgbGlrZSBgaHJkX2luc2VydF9ydW4oKWAgYnV0IHJlc29sdmVzIGtleS92YWx1ZSBjb25mbGljdHMgaW4gZmF2b3Igb2YgdmFsdWUgZ2l2ZW4gIyMjXG4gICAgICAgICMgQGhyZF92YWxpZGF0ZSgpXG4gICAgICAgIG5ld19vayA9IEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgQHdpdGhfdHJhbnNhY3Rpb24gPT5cbiAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfaW5zZXJ0X3J1bi5ydW4gbmV3X29rXG4gICAgICAgICAgY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9jb25mbGljdHMoKSApLi4uLCBdXG4gICAgICAgICAgZm9yIGNvbmZsaWN0IGluIGNvbmZsaWN0c1xuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIGNvbmZsaWN0LmtleV9hIGlzIG5ld19vay5rZXkgIyMjIGRvIG5vdCByZXNvbHZlIGNvbmZsaWN0cyBvZiBvdGhlciBrZXkvdmFsdWUgcGFpcnMgIyMjXG4gICAgICAgICAgICB7IHJ1bl9vaywgcnVuX25rLCB9ID0gQF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0IGNvbmZsaWN0LCBuZXdfb2sudmFsdWVcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9yZW1vdmVfb3ZlcmxhcC5ydW4geyBiYXNlX3Jvd2lkOiBydW5fbmsucm93aWQsIG1hc2tfcm93aWQ6IHJ1bl9vay5yb3dpZCwgfVxuICAgICAgICAgICAgQHN0YXRlbWVudHMuaHJkX2RlbGV0ZV9ydW4ucnVuIHsgcm93aWQ6IHJ1bl9uay5yb3dpZCwgfVxuICAgICAgICAgICAgO251bGxcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfdmFsaWRhdGU6IC0+XG4gICAgICAgIHJldHVybiBudWxsIGlmICggY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9jb25mbGljdHMoKSApLi4uLCBdICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlocmRfXzE0IGZvdW5kIGNvbmZsaWN0czogI3tycHIgY29uZmxpY3RzfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogLT5cbiAgICAgICAgcHJ2X2tleSAgID0gbnVsbFxuICAgICAgICBwcnZfdmFsdWUgPSBudWxsXG4gICAgICAgIGdyb3VwICAgICA9IG51bGxcbiAgICAgICAgZm9yIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfSBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNfYnlfZ3JvdXBcbiAgICAgICAgICB1bmxlc3MgKCBrZXkgaXMgcHJ2X2tleSApIGFuZCAoIHZhbHVlIGlzIHBydl92YWx1ZSApXG4gICAgICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgICAgIGdyb3VwICAgICAgICAgPSB7IGtleSwgdmFsdWUsIHJ1bnM6IFtdLCB9XG4gICAgICAgICAgICBwcnZfa2V5ICAgICAgID0ga2V5XG4gICAgICAgICAgICBwcnZfdmFsdWUgICAgID0gdmFsdWVcbiAgICAgICAgICBncm91cC5ydW5zLnB1c2ggeyByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG4gICAgICAgIHlpZWxkIGdyb3VwIGlmIGdyb3VwP1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgSUZOLCBsZXRzLCB0eXBlc3BhY2U6IFQsIH1cbiAgcmV0dXJuIHtcbiAgICBkYnJpY19wbHVnaW4sXG4gIH1cblxuXG4iXX0=
