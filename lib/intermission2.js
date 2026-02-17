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
        // #-----------------------------------------------------------------------------------------------------
        // SQL"""create view hrd_conflicts as
        //   select distinct
        //       a.rowid  as rowid,
        //       a.lo     as lo,
        //       a.hi     as hi,
        //       a.key    as key,
        //       a.value  as value
        //     from hrd_runs as a
        //     join hrd_runs as b
        //       on true
        //         and ( a.key   =   b.key   )
        //         and ( a.value !=  b.value )
        //         and ( a.lo    <=  b.hi    )
        //         and ( a.hi    >=  b.lo    )
        //     order by a.lo, a.hi, a.key;"""

        // #-----------------------------------------------------------------------------------------------------
        // SQL"""create view _hrd_group_has_conflict as
        //   select distinct
        //       f.key                     as key,
        //       not ( c.key is null )     as has_conflict
        //   from hrd_group_facets   as f
        //   left join hrd_conflicts as c on ( f.key = c.key and f.value = c.value )
        //   order by key, value;"""

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
      and ( a.value !=  b.value )
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtDQUFSLENBQUYsQ0FBMkQsQ0FBQyxvQ0FBNUQsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixD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RUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBO1VBQVEsT0FBQSxHQUFZO1VBQ1osU0FBQSxHQUFZO1VBQ1osS0FBQSxHQUFZO1VBQ1osS0FBQSxzREFBQTthQUFJLENBQUUsS0FBRixFQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEdBQWpCLEVBQXNCLEtBQXRCO1lBQ0YsTUFBTyxDQUFFLEdBQUEsS0FBTyxPQUFULENBQUEsSUFBdUIsQ0FBRSxLQUFBLEtBQVMsU0FBWCxFQUE5QjtjQUNFLElBQWUsYUFBZjtnQkFBQSxNQUFNLE1BQU47O2NBQ0EsS0FBQSxHQUFnQjtnQkFBRSxHQUFGO2dCQUFPLEtBQVA7Z0JBQWMsSUFBQSxFQUFNO2NBQXBCO2NBQ2hCLE9BQUEsR0FBZ0I7Y0FDaEIsU0FBQSxHQUFnQixNQUpsQjs7WUFLQSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVgsQ0FBZ0IsQ0FBRSxLQUFGLEVBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsR0FBakIsRUFBc0IsS0FBdEIsQ0FBaEI7VUFORjtVQU9BLElBQWUsYUFBZjtZQUFBLE1BQU0sTUFBTjs7QUFDQSxpQkFBTztRQVplO01BdkV4QjtJQW5QRjtFQUxGLEVBaERGOzs7RUE4WEEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQTlYcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kYnJpY19wbHVnaW4gPVxuICBuYW1lOiAgICdocmRfaG9hcmRfcGx1Z2luJyAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBwcmVmaXg6ICdocmQnICAgICAgICAgICAgICAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBleHBvcnRzOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogW1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGhyZF9nZXRfcnVuX3Jvd2lkKCBsbywgaGksIGtleSApICkgc3RvcmVkLFxuICAgICAgICAgICAgbG8gICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAga2V5ICAgICB0ZXh0IG5vdCBudWxsLFxuICAgICAgICAgICAgdmFsdWUgICB0ZXh0IG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLCAtLSBwcm9wZXIgZGF0YSB0eXBlIGlzIGBqc29uYCBidXQgZGVjbGFyZWQgYXMgYHRleHRgIGIvYyBvZiBgc3RyaWN0YFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGxvLCBoaSwga2V5LCB2YWx1ZSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzRcIiBjaGVjayAoIGtleSByZWdleHAgJy4qJyApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX181XCIgY2hlY2sgKCBrZXkgcmVnZXhwICdeXFwkeCR8XlteJF0uKycgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19oaVwiICBvbiBocmRfcnVucyAoIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiBvbiBocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cF9mYWNldHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfY29uZmxpY3RzIGFzXG4gICAgICAjICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAjICAgICAgIGEucm93aWQgIGFzIHJvd2lkLFxuICAgICAgIyAgICAgICBhLmxvICAgICBhcyBsbyxcbiAgICAgICMgICAgICAgYS5oaSAgICAgYXMgaGksXG4gICAgICAjICAgICAgIGEua2V5ICAgIGFzIGtleSxcbiAgICAgICMgICAgICAgYS52YWx1ZSAgYXMgdmFsdWVcbiAgICAgICMgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgIyAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAjICAgICAgIG9uIHRydWVcbiAgICAgICMgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICMgICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICMgICAgICAgICBhbmQgKCBhLmxvICAgIDw9ICBiLmhpICAgIClcbiAgICAgICMgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICMgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBTUUxcIlwiXCJjcmVhdGUgdmlldyBfaHJkX2dyb3VwX2hhc19jb25mbGljdCBhc1xuICAgICAgIyAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgIyAgICAgICBmLmtleSAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICMgICAgICAgbm90ICggYy5rZXkgaXMgbnVsbCApICAgICBhcyBoYXNfY29uZmxpY3RcbiAgICAgICMgICBmcm9tIGhyZF9ncm91cF9mYWNldHMgICBhcyBmXG4gICAgICAjICAgbGVmdCBqb2luIGhyZF9jb25mbGljdHMgYXMgYyBvbiAoIGYua2V5ID0gYy5rZXkgYW5kIGYudmFsdWUgPSBjLnZhbHVlIClcbiAgICAgICMgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9jb25mbGljdHMgYXNcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZF9hLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG9fYSxcbiAgICAgICAgICAgIGEuaGkgICAgIGFzIGhpX2EsXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXlfYSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlX2EsXG4gICAgICAgICAgICBiLnJvd2lkICBhcyByb3dpZF9iLFxuICAgICAgICAgICAgYi5sbyAgICAgYXMgbG9fYixcbiAgICAgICAgICAgIGIuaGkgICAgIGFzIGhpX2IsXG4gICAgICAgICAgICBiLmtleSAgICBhcyBrZXlfYixcbiAgICAgICAgICAgIGIudmFsdWUgIGFzIHZhbHVlX2JcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICAgIG9uIHRydWVcbiAgICAgICAgICAgICAgYW5kICggYS5yb3dpZCA8ICAgYi5yb3dpZCApXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZ3JvdXBfaGFzX2NvbmZsaWN0IGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGYudmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIG5vdCAoIGNhLmtleV9hIGlzIG51bGwgYW5kIGNiLmtleV9iIGlzIG51bGwgKSAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3RcbiAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzIGFzIGZcbiAgICAgICAgbGVmdCBqb2luIGhyZF9jb25mbGljdHMgYXMgY2Egb24gKCBmLmtleSA9IGNhLmtleV9hIGFuZCBmLnZhbHVlID0gY2EudmFsdWVfYSApXG4gICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfbm9ybWFsaXphdGlvbiBhc1xuICAgICAgICB3aXRoIG9yZGVyZWQgYXMgKFxuICAgICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgICAgbG8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgaGkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgICAgbGFnKCBoaSApIG92ZXIgKCBwYXJ0aXRpb24gYnkga2V5LCB2YWx1ZSBvcmRlciBieSBsbyApICBhcyBwcmV2X2hpXG4gICAgICAgICAgZnJvbSBocmRfcnVucyApXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAga2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIHZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGNhc2Ugd2hlbiBzdW0oXG4gICAgICAgICAgICAgIGNhc2VcbiAgICAgICAgICAgICAgICB3aGVuICggcHJldl9oaSBpcyBub3QgbnVsbCApIGFuZCAoIGxvIDw9IHByZXZfaGkgKyAxICkgdGhlbiAxIGVsc2UgMCBlbmQgKSA+IDBcbiAgICAgICAgICAgICAgICB0aGVuIDAgZWxzZSAxIGVuZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIG9yZGVyZWRcbiAgICAgICAgICBncm91cCBieSBrZXksIHZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ3JvdXBzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgZy5rZXkgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGcudmFsdWUgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIG1pbiggci5sbyApIG92ZXIgdyAgICAgICAgICBhcyBmaXJzdCxcbiAgICAgICAgICAgIG1heCggci5oaSApIG92ZXIgdyAgICAgICAgICBhcyBsYXN0LFxuICAgICAgICAgICAgZy5ydW5zICAgICAgICAgICAgICAgICAgICAgIGFzIHJ1bnMsXG4gICAgICAgICAgICBmYWxzZSAgICAgICAgICAgICAgICAgICAgICAgYXMgaGFzX2NvbmZsaWN0LCAtLSAhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIVxuICAgICAgICAgICAgbi5pc19ub3JtYWwgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gaHJkX2dyb3VwX2ZhY2V0cyAgICAgICAgICAgYXMgZ1xuICAgICAgICAgIGxlZnQgam9pbiBocmRfbm9ybWFsaXphdGlvbiAgICAgYXMgbiB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIGxlZnQgam9pbiBocmRfcnVucyAgICAgICAgICAgICAgYXMgciB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IHIua2V5LCByLnZhbHVlIClcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZ2V0X3J1bl9yb3dpZDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCBsbywgaGksIGtleSApIC0+XG4gICAgICAgICAgbHMgPSBpZiBsbyA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBocyA9IGlmIGhpIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGZcInQ6aHJkOnJ1bnM6Vj0je2xzfSN7TWF0aC5hYnMgbG99Oio8MDZ4Oywje2hzfSN7TWF0aC5hYnMgaGl9Oio8MDZ4Oywje2tleX1cIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHNfZm9yX2tleTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY29uZmxpY3RzOiAgICAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2NvbmZsaWN0cztcIlwiXCJcbiAgICAgIGhyZF9maW5kX2dyb3VwX2ZhY2V0czogICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ncm91cF9mYWNldHM7XCJcIlwiXG4gICAgICBocmRfZmluZF9ydW5zX2J5X2dyb3VwOiAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfcnVucyBvcmRlciBieSBrZXksIHZhbHVlLCBsbywgaGk7XCJcIlwiXG4gICAgICBocmRfZmluZF9ncm91cHM6ICAgICAgICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZ3JvdXBzIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgICAgICAgU1FMXCJcIlwiZGVsZXRlIGZyb20gaHJkX3J1bnMgd2hlcmUgcm93aWQgPSAkcm93aWQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3VwczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCBrZXksIHZhbHVlIGZyb20gaHJkX25vcm1hbGl6YXRpb24gd2hlcmUgaXNfbm9ybWFsID0gZmFsc2Ugb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcmVtb3ZlX292ZXJsYXA6IFNRTFwiXCJcIlxuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgc2VsZWN0IGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICBmcm9tICggc2VsZWN0XG4gICAgICAgICAgICAgIGIubG8gICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgbS5sbyAtIDEgIGFzIGhpLFxuICAgICAgICAgICAgICBiLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgICBiLnZhbHVlICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gKCBtLnJvd2lkID0gJG1hc2tfcm93aWQgKVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgIGFuZCBiLmhpID49IG0ubG9cbiAgICAgICAgICAgIGFuZCBiLmxvIDwgbS5sb1xuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHVuaW9uIGFsbCBzZWxlY3RcbiAgICAgICAgICAgICAgICBtLmhpICsgMSxcbiAgICAgICAgICAgICAgICBiLmhpLFxuICAgICAgICAgICAgICAgIGIua2V5LFxuICAgICAgICAgICAgICAgIGIudmFsdWVcbiAgICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgam9pbiBocmRfcnVucyBhcyBtIG9uIG0ucm93aWQgPSAkbWFza19yb3dpZFxuICAgICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgICBhbmQgYi5yb3dpZCA9ICRiYXNlX3Jvd2lkXG4gICAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgICBhbmQgYi5oaSA+IG0uaGlcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgX2hyZF9hc19oYWxmb3BlbjogICAoIHJ1biAgICAgICApIC0+IHsgc3RhcnQ6IHJ1bi5sbywgICAgICAgICBlbmQ6ICBydW4uaGkgICAgICAgICsgMSwgfVxuICAgICAgIyBfaHJkX2Zyb21faGFsZm9wZW46ICggaGFsZm9wZW4gICkgLT4geyBsbzogICAgaGFsZm9wZW4uc3RhcnQsIGhpOiAgIGhhbGZvcGVuLmVuZCAgLSAxLCB9XG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIF9ocmRfc3VidHJhY3Q6ICggYmFzZSwgbWFzayApIC0+XG4gICAgICAjICAgaGFsZm9wZW5zID0gSUZOLnN1YnN0cmFjdCBbICggQF9ocmRfYXNfaGFsZm9wZW4gYmFzZSApLCBdLCBbICggQF9ocmRfYXNfaGFsZm9wZW4gbWFzayApLCBdXG4gICAgICAjICAgcmV0dXJuICggQF9ocmRfZnJvbV9oYWxmb3BlbiBoYWxmb3BlbiBmb3IgaGFsZm9wZW4gaW4gaGFsZm9wZW5zIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzOiAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2dyb3VwX2ZhY2V0c1xuICAgICAgaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3VwczogIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX25vbm5vcm1hbF9ncm91cHNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ncm91cHM6IC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ncm91cHNcbiAgICAgICAgICByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgIHJvdy5pc19ub3JtYWwgICAgID0gYXNfYm9vbCByb3cuaXNfbm9ybWFsXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY29uZmxpY3RzOiAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY29uZmxpY3RzXG4gICAgICAgICAgIyByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgICMgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfZmluZF9vdmVybGFwczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5sb19oaSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9vdmVybGFwczogKCBsbywgaGkgPSBudWxsICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfb3ZlcmxhcHMsIHsgbG8sIGhpLCB9XG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0OiAoIGNvbmZsaWN0LCBva192YWx1ZV9qc29uICkgLT5cbiAgICAgICAgICB7IHJvd2lkX2EsIGxvX2EsIGhpX2EsIGtleV9hLCB2YWx1ZV9hLFxuICAgICAgICAgICAgcm93aWRfYiwgbG9fYiwgaGlfYiwga2V5X2IsIHZhbHVlX2IsIH0gID0gY29uZmxpY3RcbiAgICAgICAgICBydW5fb2sgPSB7IHJvd2lkOiByb3dpZF9hLCBsbzogbG9fYSwgaGk6IGhpX2EsIGtleToga2V5X2EsIHZhbHVlOiB2YWx1ZV9hLCB9XG4gICAgICAgICAgcnVuX25rID0geyByb3dpZDogcm93aWRfYiwgbG86IGxvX2IsIGhpOiBoaV9iLCBrZXk6IGtleV9iLCB2YWx1ZTogdmFsdWVfYiwgfVxuICAgICAgICAgIHJldHVybiB7IHJ1bl9vaywgcnVuX25rLCB9IGlmIHJ1bl9vay52YWx1ZSBpcyBva192YWx1ZV9qc29uXG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rOiBydW5fbmssIHJ1bl9uazogcnVuX29rLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3B1bmNoOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIG5lZWQgdG8gd3JhcCBpbiB0cmFuc2FjdGlvbiAjIyNcbiAgICAgICAgIyMjIGxpa2UgYGhyZF9pbnNlcnRfcnVuKClgIGJ1dCByZXNvbHZlcyBrZXkvdmFsdWUgY29uZmxpY3RzIGluIGZhdm9yIG9mIHZhbHVlIGdpdmVuICMjI1xuICAgICAgICAjIEBocmRfdmFsaWRhdGUoKVxuICAgICAgICBuZXdfb2sgPSBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIEB3aXRoX3RyYW5zYWN0aW9uID0+XG4gICAgICAgICAgQHN0YXRlbWVudHMuaHJkX2luc2VydF9ydW4ucnVuIG5ld19va1xuICAgICAgICAgIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXVxuICAgICAgICAgIGZvciBjb25mbGljdCBpbiBjb25mbGljdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBjb25mbGljdC5rZXlfYSBpcyBuZXdfb2sua2V5ICMjIyBkbyBub3QgcmVzb2x2ZSBjb25mbGljdHMgb2Ygb3RoZXIga2V5L3ZhbHVlIHBhaXJzICMjI1xuICAgICAgICAgICAgeyBydW5fb2ssIHJ1bl9uaywgfSA9IEBfaHJkX3J1bnNfZnJvbV9jb25mbGljdCBjb25mbGljdCwgbmV3X29rLnZhbHVlXG4gICAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfcmVtb3ZlX292ZXJsYXAucnVuIHsgYmFzZV9yb3dpZDogcnVuX25rLnJvd2lkLCBtYXNrX3Jvd2lkOiBydW5fb2sucm93aWQsIH1cbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfcnVuLnJ1biB7IHJvd2lkOiBydW5fbmsucm93aWQsIH1cbiAgICAgICAgICAgIDtudWxsXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlOiAtPlxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXSApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX18xNCBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnNfYnlfZ3JvdXA6IC0+XG4gICAgICAgIHBydl9rZXkgICA9IG51bGxcbiAgICAgICAgcHJ2X3ZhbHVlID0gbnVsbFxuICAgICAgICBncm91cCAgICAgPSBudWxsXG4gICAgICAgIGZvciB7IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWUsIH0gZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zX2J5X2dyb3VwXG4gICAgICAgICAgdW5sZXNzICgga2V5IGlzIHBydl9rZXkgKSBhbmQgKCB2YWx1ZSBpcyBwcnZfdmFsdWUgKVxuICAgICAgICAgICAgeWllbGQgZ3JvdXAgaWYgZ3JvdXA/XG4gICAgICAgICAgICBncm91cCAgICAgICAgID0geyBrZXksIHZhbHVlLCBydW5zOiBbXSwgfVxuICAgICAgICAgICAgcHJ2X2tleSAgICAgICA9IGtleVxuICAgICAgICAgICAgcHJ2X3ZhbHVlICAgICA9IHZhbHVlXG4gICAgICAgICAgZ3JvdXAucnVucy5wdXNoIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgcmV0dXJuIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfcGx1Z2luLFxuICB9XG5cblxuIl19
