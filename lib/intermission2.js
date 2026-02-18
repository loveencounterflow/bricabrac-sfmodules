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
        SQL`create view _hrd_facet_groups as
select distinct
    a.key     as key,
    a.value   as value,
    count(*)  as runs
  from hrd_runs as a
  group by a.key, a.value
  order by a.key, a.value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_conflicts_2 as
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
        SQL`create view _hrd_key_group_has_conflict_2 as
select distinct
    f.key                     as key,
    not ( c.key is null )     as has_conflict
from _hrd_facet_groups   as f
left join hrd_conflicts_2 as c on ( f.key = c.key and f.value = c.value )
order by f.key, f.value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_runs_with_conflict_1 as
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
        SQL`create view _hrd_facet_group_has_conflict_1 as
select distinct
    f.key                                                     as key,
    f.value                                                   as value,
    not ( ca.key_a is null and cb.key_b is null )             as has_conflict
from _hrd_facet_groups as f
left join hrd_runs_with_conflict_1 as ca on ( f.key = ca.key_a and f.value = ca.value_a )
left join hrd_runs_with_conflict_1 as cb on ( f.key = cb.key_b and f.value = cb.value_b )
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
  from _hrd_facet_groups           as g
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
        hrd_find_runs_with_conflicts_1: SQL`select * from hrd_runs_with_conflict_1;`,
        hrd_find_facet_groups: SQL`select * from hrd_groups order by key, value;`,
        hrd_delete_run: SQL`delete from hrd_runs where rowid = $rowid;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_nonnormal_groups: SQL`select key, value from hrd_normalization where is_normal = false order by key, value;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_remove_overlap_1: SQL`-- .................................................................................................
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
        hrd_find_facet_groups: function*() {
          var row;
          for (row of this.walk(this.statements.hrd_find_facet_groups)) {
            row.has_conflict = as_bool(row.has_conflict);
            row.is_normal = as_bool(row.is_normal);
            yield row;
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs_with_conflicts_1: function*() {
          var row;
          for (row of this.walk(this.statements.hrd_find_runs_with_conflicts_1)) {
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
        _hrd_runs_from_conflict_1: function(conflict, ok_value_json) {
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
        hrd_punch_1: nfa({
          template: templates.add_run_cfg
        }, function(lo, hi, key, value, cfg) {
          var new_ok;
          /* TAINT need to wrap in transaction */
          /* like `hrd_insert_run()` but resolves key/value conflicts in favor of value given */
          // @hrd_validate_1()
          new_ok = this._hrd_create_insert_run_cfg(lo, hi, key, value);
          this.with_transaction(() => {
            var conflict, conflicts, i, len, results, run_nk, run_ok;
            this.statements.hrd_insert_run.run(new_ok);
            conflicts = [...(this.hrd_find_runs_with_conflicts_1())];
            results = [];
            for (i = 0, len = conflicts.length; i < len; i++) {
              conflict = conflicts[i];
              if (conflict.key_a !== new_ok.key/* do not resolve conflicts of other key/value pairs */) {
                continue;
              }
              ({run_ok, run_nk} = this._hrd_runs_from_conflict_1(conflict, new_ok.value));
              this.statements.hrd_remove_overlap_1.run({
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
        hrd_validate_1: function() {
          var conflicts;
          if ((conflicts = [...(this.hrd_find_runs_with_conflicts_1())]).length === 0) {
            return null;
          }
          throw new Error(`Ωhrd___6 found conflicts: ${rpr(conflicts)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtDQUFSLENBQUYsQ0FBMkQsQ0FBQyxvQ0FBNUQsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixD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YSxHQUFiO01BQWtCLElBQWxCO01BQXdCLFNBQUEsRUFBVztJQUFuQyxDQUFkO0FBQ1osV0FBTyxDQUNMLFlBREs7RUFGVyxDQUFBO0FBOVdwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IGluc3BlY3Q6IHJwciwgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuIyB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgZiwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdlZmZzdHJpbmcnXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBhc19ib29sLFxuICBmcm9tX2Jvb2wsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgVEFJTlQgbW92ZSB0byBkZWRpY2F0ZWQgbW9kdWxlICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICBhZGRfcnVuX2NmZzpcbiAgICBsbzogICAgICAgMFxuICAgIGhpOiAgICAgICBudWxsXG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIGhyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggaHJkX2dldF9ydW5fcm93aWQoIGxvLCBoaSwga2V5ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBsbyAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBoaSAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggbG8sIGhpLCBrZXksIHZhbHVlICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNFwiIGNoZWNrICgga2V5IHJlZ2V4cCAnLionIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzVcIiBjaGVjayAoIGtleSByZWdleHAgJ15cXCR4JHxeW14kXS4rJyApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2hpXCIgIG9uIGhyZF9ydW5zICggaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2tleVwiIG9uIGhyZF9ydW5zICgga2V5ICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9mYWNldF9ncm91cHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9jb25mbGljdHNfMiBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEucm93aWQgIGFzIHJvd2lkLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG8sXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaSxcbiAgICAgICAgICAgIGEua2V5ICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfa2V5X2dyb3VwX2hhc19jb25mbGljdF8yIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBub3QgKCBjLmtleSBpcyBudWxsICkgICAgIGFzIGhhc19jb25mbGljdFxuICAgICAgICBmcm9tIF9ocmRfZmFjZXRfZ3JvdXBzICAgYXMgZlxuICAgICAgICBsZWZ0IGpvaW4gaHJkX2NvbmZsaWN0c18yIGFzIGMgb24gKCBmLmtleSA9IGMua2V5IGFuZCBmLnZhbHVlID0gYy52YWx1ZSApXG4gICAgICAgIG9yZGVyIGJ5IGYua2V5LCBmLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zX3dpdGhfY29uZmxpY3RfMSBhc1xuICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgIGEucm93aWQgIGFzIHJvd2lkX2EsXG4gICAgICAgICAgICBhLmxvICAgICBhcyBsb19hLFxuICAgICAgICAgICAgYS5oaSAgICAgYXMgaGlfYSxcbiAgICAgICAgICAgIGEua2V5ICAgIGFzIGtleV9hLFxuICAgICAgICAgICAgYS52YWx1ZSAgYXMgdmFsdWVfYSxcbiAgICAgICAgICAgIGIucm93aWQgIGFzIHJvd2lkX2IsXG4gICAgICAgICAgICBiLmxvICAgICBhcyBsb19iLFxuICAgICAgICAgICAgYi5oaSAgICAgYXMgaGlfYixcbiAgICAgICAgICAgIGIua2V5ICAgIGFzIGtleV9iLFxuICAgICAgICAgICAgYi52YWx1ZSAgYXMgdmFsdWVfYlxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgb24gdHJ1ZVxuICAgICAgICAgICAgICBhbmQgKCBhLnJvd2lkIDwgICBiLnJvd2lkIClcbiAgICAgICAgICAgICAgYW5kICggYS5rZXkgICA9ICAgYi5rZXkgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEudmFsdWUgIT0gIGIudmFsdWUgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmxvICAgIDw9ICBiLmhpICAgIClcbiAgICAgICAgICAgICAgYW5kICggYS5oaSAgICA+PSAgYi5sbyAgICApXG4gICAgICAgICAgb3JkZXIgYnkgYS5sbywgYS5oaSwgYS5rZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9mYWNldF9ncm91cF9oYXNfY29uZmxpY3RfMSBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBmLnZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBub3QgKCBjYS5rZXlfYSBpcyBudWxsIGFuZCBjYi5rZXlfYiBpcyBudWxsICkgICAgICAgICAgICAgYXMgaGFzX2NvbmZsaWN0XG4gICAgICAgIGZyb20gX2hyZF9mYWNldF9ncm91cHMgYXMgZlxuICAgICAgICBsZWZ0IGpvaW4gaHJkX3J1bnNfd2l0aF9jb25mbGljdF8xIGFzIGNhIG9uICggZi5rZXkgPSBjYS5rZXlfYSBhbmQgZi52YWx1ZSA9IGNhLnZhbHVlX2EgKVxuICAgICAgICBsZWZ0IGpvaW4gaHJkX3J1bnNfd2l0aF9jb25mbGljdF8xIGFzIGNiIG9uICggZi5rZXkgPSBjYi5rZXlfYiBhbmQgZi52YWx1ZSA9IGNiLnZhbHVlX2IgKVxuICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gICAgICAgIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIClcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgICAgICAgY2FzZVxuICAgICAgICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gb3JkZXJlZFxuICAgICAgICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBnLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZy52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgbWluKCByLmxvICkgb3ZlciB3ICAgICAgICAgIGFzIGZpcnN0LFxuICAgICAgICAgICAgbWF4KCByLmhpICkgb3ZlciB3ICAgICAgICAgIGFzIGxhc3QsXG4gICAgICAgICAgICBnLnJ1bnMgICAgICAgICAgICAgICAgICAgICAgYXMgcnVucyxcbiAgICAgICAgICAgIGZhbHNlICAgICAgICAgICAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3QsIC0tICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhXG4gICAgICAgICAgICBuLmlzX25vcm1hbCAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBfaHJkX2ZhY2V0X2dyb3VwcyAgICAgICAgICAgYXMgZ1xuICAgICAgICAgIGxlZnQgam9pbiBocmRfbm9ybWFsaXphdGlvbiAgICAgYXMgbiB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIGxlZnQgam9pbiBocmRfcnVucyAgICAgICAgICAgICAgYXMgciB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IHIua2V5LCByLnZhbHVlIClcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZ2V0X3J1bl9yb3dpZDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCBsbywgaGksIGtleSApIC0+XG4gICAgICAgICAgbHMgPSBpZiBsbyA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBocyA9IGlmIGhpIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGZcInQ6aHJkOnJ1bnM6Vj0je2xzfSN7TWF0aC5hYnMgbG99Oio8MDZ4Oywje2hzfSN7TWF0aC5hYnMgaGl9Oio8MDZ4Oywje2tleX1cIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHNfZm9yX2tleTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xOiBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ydW5zX3dpdGhfY29uZmxpY3RfMTtcIlwiXCJcbiAgICAgIGhyZF9maW5kX2ZhY2V0X2dyb3VwczogICAgICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZ3JvdXBzIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgICAgICAgICAgIFNRTFwiXCJcImRlbGV0ZSBmcm9tIGhyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9ncm91cHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qga2V5LCB2YWx1ZSBmcm9tIGhyZF9ub3JtYWxpemF0aW9uIHdoZXJlIGlzX25vcm1hbCA9IGZhbHNlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3JlbW92ZV9vdmVybGFwXzE6IFNRTFwiXCJcIlxuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgc2VsZWN0IGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICBmcm9tICggc2VsZWN0XG4gICAgICAgICAgICAgIGIubG8gICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgbS5sbyAtIDEgIGFzIGhpLFxuICAgICAgICAgICAgICBiLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgICBiLnZhbHVlICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gKCBtLnJvd2lkID0gJG1hc2tfcm93aWQgKVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgIGFuZCBiLmhpID49IG0ubG9cbiAgICAgICAgICAgIGFuZCBiLmxvIDwgbS5sb1xuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHVuaW9uIGFsbCBzZWxlY3RcbiAgICAgICAgICAgICAgICBtLmhpICsgMSxcbiAgICAgICAgICAgICAgICBiLmhpLFxuICAgICAgICAgICAgICAgIGIua2V5LFxuICAgICAgICAgICAgICAgIGIudmFsdWVcbiAgICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgam9pbiBocmRfcnVucyBhcyBtIG9uIG0ucm93aWQgPSAkbWFza19yb3dpZFxuICAgICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgICBhbmQgYi5yb3dpZCA9ICRiYXNlX3Jvd2lkXG4gICAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgICBhbmQgYi5oaSA+IG0uaGlcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgX2hyZF9hc19oYWxmb3BlbjogICAoIHJ1biAgICAgICApIC0+IHsgc3RhcnQ6IHJ1bi5sbywgICAgICAgICBlbmQ6ICBydW4uaGkgICAgICAgICsgMSwgfVxuICAgICAgIyBfaHJkX2Zyb21faGFsZm9wZW46ICggaGFsZm9wZW4gICkgLT4geyBsbzogICAgaGFsZm9wZW4uc3RhcnQsIGhpOiAgIGhhbGZvcGVuLmVuZCAgLSAxLCB9XG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIF9ocmRfc3VidHJhY3Q6ICggYmFzZSwgbWFzayApIC0+XG4gICAgICAjICAgaGFsZm9wZW5zID0gSUZOLnN1YnN0cmFjdCBbICggQF9ocmRfYXNfaGFsZm9wZW4gYmFzZSApLCBdLCBbICggQF9ocmRfYXNfaGFsZm9wZW4gbWFzayApLCBdXG4gICAgICAjICAgcmV0dXJuICggQF9ocmRfZnJvbV9oYWxmb3BlbiBoYWxmb3BlbiBmb3IgaGFsZm9wZW4gaW4gaGFsZm9wZW5zIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzOiAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2dyb3VwX2ZhY2V0c1xuICAgICAgaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3VwczogIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX25vbm5vcm1hbF9ncm91cHNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9mYWNldF9ncm91cHM6IC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9mYWNldF9ncm91cHNcbiAgICAgICAgICByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgIHJvdy5pc19ub3JtYWwgICAgID0gYXNfYm9vbCByb3cuaXNfbm9ybWFsXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xOiAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xXG4gICAgICAgICAgIyByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgICMgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfZmluZF9vdmVybGFwczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5sb19oaSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9vdmVybGFwczogKCBsbywgaGkgPSBudWxsICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfb3ZlcmxhcHMsIHsgbG8sIGhpLCB9XG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0XzE6ICggY29uZmxpY3QsIG9rX3ZhbHVlX2pzb24gKSAtPlxuICAgICAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgICAgICByb3dpZF9iLCBsb19iLCBoaV9iLCBrZXlfYiwgdmFsdWVfYiwgfSAgPSBjb25mbGljdFxuICAgICAgICAgIHJ1bl9vayA9IHsgcm93aWQ6IHJvd2lkX2EsIGxvOiBsb19hLCBoaTogaGlfYSwga2V5OiBrZXlfYSwgdmFsdWU6IHZhbHVlX2EsIH1cbiAgICAgICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rLCBydW5fbmssIH0gaWYgcnVuX29rLnZhbHVlIGlzIG9rX3ZhbHVlX2pzb25cbiAgICAgICAgICByZXR1cm4geyBydW5fb2s6IHJ1bl9uaywgcnVuX25rOiBydW5fb2ssIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcHVuY2hfMTogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgICMjIyBUQUlOVCBuZWVkIHRvIHdyYXAgaW4gdHJhbnNhY3Rpb24gIyMjXG4gICAgICAgICMjIyBsaWtlIGBocmRfaW5zZXJ0X3J1bigpYCBidXQgcmVzb2x2ZXMga2V5L3ZhbHVlIGNvbmZsaWN0cyBpbiBmYXZvciBvZiB2YWx1ZSBnaXZlbiAjIyNcbiAgICAgICAgIyBAaHJkX3ZhbGlkYXRlXzEoKVxuICAgICAgICBuZXdfb2sgPSBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIEB3aXRoX3RyYW5zYWN0aW9uID0+XG4gICAgICAgICAgQHN0YXRlbWVudHMuaHJkX2luc2VydF9ydW4ucnVuIG5ld19va1xuICAgICAgICAgIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xKCkgKS4uLiwgXVxuICAgICAgICAgIGZvciBjb25mbGljdCBpbiBjb25mbGljdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBjb25mbGljdC5rZXlfYSBpcyBuZXdfb2sua2V5ICMjIyBkbyBub3QgcmVzb2x2ZSBjb25mbGljdHMgb2Ygb3RoZXIga2V5L3ZhbHVlIHBhaXJzICMjI1xuICAgICAgICAgICAgeyBydW5fb2ssIHJ1bl9uaywgfSA9IEBfaHJkX3J1bnNfZnJvbV9jb25mbGljdF8xIGNvbmZsaWN0LCBuZXdfb2sudmFsdWVcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9yZW1vdmVfb3ZlcmxhcF8xLnJ1biB7IGJhc2Vfcm93aWQ6IHJ1bl9uay5yb3dpZCwgbWFza19yb3dpZDogcnVuX29rLnJvd2lkLCB9XG4gICAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfZGVsZXRlX3J1bi5ydW4geyByb3dpZDogcnVuX25rLnJvd2lkLCB9XG4gICAgICAgICAgICA7bnVsbFxuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF92YWxpZGF0ZV8xOiAtPlxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xKCkgKS4uLiwgXSApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX19fNiBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
