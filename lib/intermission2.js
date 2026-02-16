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
        hrd_remove_overlap: SQL`insert into hrd_runs ( lo, hi, key, value )
select lo, hi, key, value
from (
    select
        b.lo as lo,
        m.lo - 1 as hi,
        b.key,
        b.value
    from hrd_runs b
    join hrd_runs m on m.rowid = $mask_rowid
    where b.rowid = $base_rowid
      and b.lo <= m.hi
      and b.hi >= m.lo
      and b.lo < m.lo

    union all

    select
        m.hi + 1,
        b.hi,
        b.key,
        b.value
    from hrd_runs b
    join hrd_runs m on m.rowid = $mask_rowid
    where b.rowid = $base_rowid
      and b.lo <= m.hi
      and b.hi >= m.lo
      and b.hi > m.hi
);`
      },
      //-------------------------------------------------------------------------------------------------------
      methods: {
        //-----------------------------------------------------------------------------------------------------
        _hrd_as_halfopen: function(run) {
          return {
            start: run.lo,
            end: run.hi + 1
          };
        },
        _hrd_from_halfopen: function(halfopen) {
          return {
            lo: halfopen.start,
            hi: halfopen.end - 1
          };
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_subtract: function(base, mask) {
          var halfopen, halfopens;
          halfopens = IFN.substract([this._hrd_as_halfopen(base)], [this._hrd_as_halfopen(mask)]);
          return (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = halfopens.length; i < len; i++) {
              halfopen = halfopens[i];
              results.push(this._hrd_from_halfopen(halfopen));
            }
            return results;
          }).call(this);
        },
        //-----------------------------------------------------------------------------------------------------
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
          var conflict, conflicts, i, len, new_ok, row, run_nk, run_ok;
          /* TAINT need to wrap in transaction */
          /* like `hrd_insert_run()` but resolves key/value conflicts in favor of value given */
          // @hrd_validate()
          new_ok = this._hrd_create_insert_run_cfg(lo, hi, key, value);
          this.statements.hrd_insert_run.run(new_ok);
          conflicts = [...(this.hrd_find_conflicts())];
          for (i = 0, len = conflicts.length; i < len; i++) {
            conflict = conflicts[i];
            if (conflict.key_a !== new_ok.key/* do not resolve conflicts of other key/value pairs */) {
              continue;
            }
            ({run_ok, run_nk} = this._hrd_runs_from_conflict(conflict, new_ok.value));
            debug('Ωhrd___6', "new:         ", new_ok);
            debug('Ωhrd___7', "OK:          ", run_ok);
            debug('Ωhrd___8', "not OK:      ", run_nk);
            debug('Ωhrd___9', "subtracted:  ", this._hrd_subtract(run_nk, run_ok));
            debug('Ωhrd__10', {
              rowid: run_nk.rowid
            });
            debug('Ωhrd__12', this.statements.hrd_remove_overlap.run({
              base_rowid: run_nk.rowid,
              mask_rowid: run_ok.rowid
            }));
            debug('Ωhrd__11', this.statements.hrd_delete_run.run({
              rowid: run_nk.rowid
            }));
            for (row of this.walk("select * from hrd_runs order by lo, hi, key;")) {
              debug('Ωhrd__13', row);
            }
          }
          /* remove run_nk */
          /* find new runs */
          /* add/punch new runs */
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FINUI7O0VBSUEsQ0FBQTtJ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QUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUE7SUFBRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYztNQUFFLFNBQUY7TUFBYSxHQUFiO01BQWtCLElBQWxCO01BQXdCLFNBQUEsRUFBVztJQUFuQyxDQUFkO0FBQ1osV0FBTyxDQUNMLFlBREs7RUFGVyxDQUFBO0FBL1VwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IGluc3BlY3Q6IHJwciwgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuIyB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgZiwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdlZmZzdHJpbmcnXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgVEFJTlQgbW92ZSB0byBkZWRpY2F0ZWQgbW9kdWxlICMjI1xuIyMjIE5PVEUgbm90IHVzaW5nIGBsZXRzZnJlZXpldGhhdGAgdG8gYXZvaWQgaXNzdWUgd2l0aCBkZWVwLWZyZWV6aW5nIGBSdW5gIGluc3RhbmNlcyAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kYnJpY19wbHVnaW4gPVxuICBuYW1lOiAgICdocmRfaG9hcmRfcGx1Z2luJyAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBwcmVmaXg6ICdocmQnICAgICAgICAgICAgICAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBleHBvcnRzOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogW1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGhyZF9nZXRfcnVuX3Jvd2lkKCBsbywgaGksIGtleSApICkgc3RvcmVkLFxuICAgICAgICAgICAgbG8gICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAga2V5ICAgICB0ZXh0IG5vdCBudWxsLFxuICAgICAgICAgICAgdmFsdWUgICB0ZXh0IG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLCAtLSBwcm9wZXIgZGF0YSB0eXBlIGlzIGBqc29uYCBidXQgZGVjbGFyZWQgYXMgYHRleHRgIGIvYyBvZiBgc3RyaWN0YFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGxvLCBoaSwga2V5LCB2YWx1ZSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzRcIiBjaGVjayAoIGtleSByZWdleHAgJy4qJyApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX181XCIgY2hlY2sgKCBrZXkgcmVnZXhwICdeXFwkeCR8XlteJF0uKycgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19oaVwiICBvbiBocmRfcnVucyAoIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiBvbiBocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cF9mYWNldHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9jb25mbGljdHMgYXNcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZF9hLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG9fYSxcbiAgICAgICAgICAgIGEuaGkgICAgIGFzIGhpX2EsXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXlfYSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlX2EsXG4gICAgICAgICAgICBiLnJvd2lkICBhcyByb3dpZF9iLFxuICAgICAgICAgICAgYi5sbyAgICAgYXMgbG9fYixcbiAgICAgICAgICAgIGIuaGkgICAgIGFzIGhpX2IsXG4gICAgICAgICAgICBiLmtleSAgICBhcyBrZXlfYixcbiAgICAgICAgICAgIGIudmFsdWUgIGFzIHZhbHVlX2JcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICAgIG9uIHRydWVcbiAgICAgICAgICAgICAgYW5kICggYS5yb3dpZCA8ICAgYi5yb3dpZCApXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlIDw+ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZ3JvdXBfaGFzX2NvbmZsaWN0IGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGYudmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIG5vdCAoIGNhLmtleV9hIGlzIG51bGwgYW5kIGNiLmtleV9iIGlzIG51bGwgKSAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3RcbiAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzIGFzIGZcbiAgICAgICAgbGVmdCBqb2luIGhyZF9jb25mbGljdHMgYXMgY2Egb24gKCBmLmtleSA9IGNhLmtleV9hIGFuZCBmLnZhbHVlID0gY2EudmFsdWVfYSApXG4gICAgICAgIGxlZnQgam9pbiBocmRfY29uZmxpY3RzIGFzIGNiIG9uICggZi5rZXkgPSBjYi5rZXlfYiBhbmQgZi52YWx1ZSA9IGNiLnZhbHVlX2IgKVxuICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gICAgICAgIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIClcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgICAgICAgY2FzZVxuICAgICAgICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gb3JkZXJlZFxuICAgICAgICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cHMgYXNcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBnLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZy52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgZmlyc3RfdmFsdWUoIHIubG8gKSBvdmVyIHcgIGFzIGZpcnN0LFxuICAgICAgICAgICAgbGFzdF92YWx1ZSggIHIuaGkgKSBvdmVyIHcgIGFzIGxhc3QsXG4gICAgICAgICAgICBnLnJ1bnMgICAgICAgICAgICAgICAgICAgICAgYXMgcnVucyxcbiAgICAgICAgICAgIG4uaXNfbm9ybWFsICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIGhyZF9ncm91cF9mYWNldHMgICAgICAgICAgIGFzIGdcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX25vcm1hbGl6YXRpb24gICAgIGFzIG4gdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX3J1bnMgICAgICAgICAgICAgIGFzIHIgdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSByLmtleSwgci52YWx1ZSBvcmRlciBieSByLmxvLCByLmhpLCByLmtleSwgci52YWx1ZSApXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2dldF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggbG8sIGhpLCBrZXkgKSAtPlxuICAgICAgICAgIGxzID0gaWYgbG8gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgaHMgPSBpZiBoaSA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBmXCJ0OmhyZDpydW5zOlY9I3tsc30je01hdGguYWJzIGxvfToqPDA2eDssI3toc30je01hdGguYWJzIGhpfToqPDA2eDssI3trZXl9XCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2luc2VydF9ydW46IFNRTFwiXCJcImluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzX2Zvcl9rZXk6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBrZXkgPSAka2V5IClcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2NvbmZsaWN0czogICAgICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9jb25mbGljdHM7XCJcIlwiXG4gICAgICBocmRfZmluZF9ncm91cF9mYWNldHM6ICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZ3JvdXBfZmFjZXRzO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX3J1bnMgb3JkZXIgYnkga2V5LCB2YWx1ZSwgbG8sIGhpO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfZ3JvdXBzOiAgICAgICAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2dyb3VwcyBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgaHJkX2RlbGV0ZV9ydW46ICAgICAgICAgICAgIFNRTFwiXCJcImRlbGV0ZSBmcm9tIGhyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9ncm91cHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qga2V5LCB2YWx1ZSBmcm9tIGhyZF9ub3JtYWxpemF0aW9uIHdoZXJlIGlzX25vcm1hbCA9IGZhbHNlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3JlbW92ZV9vdmVybGFwOiBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIGZyb20gKFxuICAgICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgICAgYi5sbyBhcyBsbyxcbiAgICAgICAgICAgICAgICBtLmxvIC0gMSBhcyBoaSxcbiAgICAgICAgICAgICAgICBiLmtleSxcbiAgICAgICAgICAgICAgICBiLnZhbHVlXG4gICAgICAgICAgICBmcm9tIGhyZF9ydW5zIGJcbiAgICAgICAgICAgIGpvaW4gaHJkX3J1bnMgbSBvbiBtLnJvd2lkID0gJG1hc2tfcm93aWRcbiAgICAgICAgICAgIHdoZXJlIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgICAgICBhbmQgYi5sbyA8PSBtLmhpXG4gICAgICAgICAgICAgIGFuZCBiLmhpID49IG0ubG9cbiAgICAgICAgICAgICAgYW5kIGIubG8gPCBtLmxvXG5cbiAgICAgICAgICAgIHVuaW9uIGFsbFxuXG4gICAgICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgICAgICBtLmhpICsgMSxcbiAgICAgICAgICAgICAgICBiLmhpLFxuICAgICAgICAgICAgICAgIGIua2V5LFxuICAgICAgICAgICAgICAgIGIudmFsdWVcbiAgICAgICAgICAgIGZyb20gaHJkX3J1bnMgYlxuICAgICAgICAgICAgam9pbiBocmRfcnVucyBtIG9uIG0ucm93aWQgPSAkbWFza19yb3dpZFxuICAgICAgICAgICAgd2hlcmUgYi5yb3dpZCA9ICRiYXNlX3Jvd2lkXG4gICAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgICBhbmQgYi5oaSA+IG0uaGlcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2FzX2hhbGZvcGVuOiAgICggcnVuICAgICAgICkgLT4geyBzdGFydDogcnVuLmxvLCAgICAgICAgIGVuZDogIHJ1bi5oaSAgICAgICAgKyAxLCB9XG4gICAgICBfaHJkX2Zyb21faGFsZm9wZW46ICggaGFsZm9wZW4gICkgLT4geyBsbzogICAgaGFsZm9wZW4uc3RhcnQsIGhpOiAgIGhhbGZvcGVuLmVuZCAgLSAxLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9zdWJ0cmFjdDogKCBiYXNlLCBtYXNrICkgLT5cbiAgICAgICAgaGFsZm9wZW5zID0gSUZOLnN1YnN0cmFjdCBbICggQF9ocmRfYXNfaGFsZm9wZW4gYmFzZSApLCBdLCBbICggQF9ocmRfYXNfaGFsZm9wZW4gbWFzayApLCBdXG4gICAgICAgIHJldHVybiAoIEBfaHJkX2Zyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVucyApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY29uZmxpY3RzOiAgICAgICAgICAgICAgICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9jb25mbGljdHNcbiAgICAgIGhyZF9maW5kX2dyb3VwX2ZhY2V0czogICAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiAgICAgICAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX25vbm5vcm1hbF9ncm91cHNcbiAgICAgIGhyZF9maW5kX2dyb3VwczogICAgICAgICAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmc6ICggbG8sIGhpLCBrZXksIHZhbHVlICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIHJldHVybiB7IGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLmhyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9ydW5zX2Zyb21fY29uZmxpY3Q6ICggY29uZmxpY3QsIG9rX3ZhbHVlX2pzb24gKSAtPlxuICAgICAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgICAgICByb3dpZF9iLCBsb19iLCBoaV9iLCBrZXlfYiwgdmFsdWVfYiwgfSAgPSBjb25mbGljdFxuICAgICAgICAgIHJ1bl9vayA9IHsgcm93aWQ6IHJvd2lkX2EsIGxvOiBsb19hLCBoaTogaGlfYSwga2V5OiBrZXlfYSwgdmFsdWU6IHZhbHVlX2EsIH1cbiAgICAgICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rLCBydW5fbmssIH0gaWYgcnVuX29rLnZhbHVlIGlzIG9rX3ZhbHVlX2pzb25cbiAgICAgICAgICByZXR1cm4geyBydW5fb2s6IHJ1bl9uaywgcnVuX25rOiBydW5fb2ssIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcHVuY2g6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgbmVlZCB0byB3cmFwIGluIHRyYW5zYWN0aW9uICMjI1xuICAgICAgICAjIyMgbGlrZSBgaHJkX2luc2VydF9ydW4oKWAgYnV0IHJlc29sdmVzIGtleS92YWx1ZSBjb25mbGljdHMgaW4gZmF2b3Igb2YgdmFsdWUgZ2l2ZW4gIyMjXG4gICAgICAgICMgQGhyZF92YWxpZGF0ZSgpXG4gICAgICAgIG5ld19vayA9IEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgQHN0YXRlbWVudHMuaHJkX2luc2VydF9ydW4ucnVuIG5ld19va1xuICAgICAgICBjb25mbGljdHMgPSBbICggQGhyZF9maW5kX2NvbmZsaWN0cygpICkuLi4sIF1cbiAgICAgICAgZm9yIGNvbmZsaWN0IGluIGNvbmZsaWN0c1xuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBjb25mbGljdC5rZXlfYSBpcyBuZXdfb2sua2V5ICMjIyBkbyBub3QgcmVzb2x2ZSBjb25mbGljdHMgb2Ygb3RoZXIga2V5L3ZhbHVlIHBhaXJzICMjI1xuICAgICAgICAgIHsgcnVuX29rLCBydW5fbmssIH0gPSBAX2hyZF9ydW5zX2Zyb21fY29uZmxpY3QgY29uZmxpY3QsIG5ld19vay52YWx1ZVxuICAgICAgICAgIGRlYnVnICfOqWhyZF9fXzYnLCBcIm5ldzogICAgICAgICBcIiwgbmV3X29rXG4gICAgICAgICAgZGVidWcgJ86paHJkX19fNycsIFwiT0s6ICAgICAgICAgIFwiLCBydW5fb2tcbiAgICAgICAgICBkZWJ1ZyAnzqlocmRfX184JywgXCJub3QgT0s6ICAgICAgXCIsIHJ1bl9ua1xuICAgICAgICAgIGRlYnVnICfOqWhyZF9fXzknLCBcInN1YnRyYWN0ZWQ6ICBcIiwgQF9ocmRfc3VidHJhY3QgcnVuX25rLCBydW5fb2tcbiAgICAgICAgICBkZWJ1ZyAnzqlocmRfXzEwJywgeyByb3dpZDogcnVuX25rLnJvd2lkLCB9XG4gICAgICAgICAgZGVidWcgJ86paHJkX18xMicsIEBzdGF0ZW1lbnRzLmhyZF9yZW1vdmVfb3ZlcmxhcC5ydW4geyBiYXNlX3Jvd2lkOiBydW5fbmsucm93aWQsIG1hc2tfcm93aWQ6IHJ1bl9vay5yb3dpZCwgfVxuICAgICAgICAgIGRlYnVnICfOqWhyZF9fMTEnLCBAc3RhdGVtZW50cy5ocmRfZGVsZXRlX3J1bi5ydW4geyByb3dpZDogcnVuX25rLnJvd2lkLCB9XG4gICAgICAgICAgZGVidWcgJ86paHJkX18xMycsIHJvdyBmb3Igcm93IGZyb20gQHdhbGsgXCJzZWxlY3QgKiBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXG4gICAgICAgICAgIyMjIHJlbW92ZSBydW5fbmsgIyMjXG4gICAgICAgICAgIyMjIGZpbmQgbmV3IHJ1bnMgIyMjXG4gICAgICAgICAgIyMjIGFkZC9wdW5jaCBuZXcgcnVucyAjIyNcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfdmFsaWRhdGU6IC0+XG4gICAgICAgIHJldHVybiBudWxsIGlmICggY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9jb25mbGljdHMoKSApLi4uLCBdICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlocmRfXzE0IGZvdW5kIGNvbmZsaWN0czogI3tycHIgY29uZmxpY3RzfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogLT5cbiAgICAgICAgcHJ2X2tleSAgID0gbnVsbFxuICAgICAgICBwcnZfdmFsdWUgPSBudWxsXG4gICAgICAgIGdyb3VwICAgICA9IG51bGxcbiAgICAgICAgZm9yIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfSBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNfYnlfZ3JvdXBcbiAgICAgICAgICB1bmxlc3MgKCBrZXkgaXMgcHJ2X2tleSApIGFuZCAoIHZhbHVlIGlzIHBydl92YWx1ZSApXG4gICAgICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgICAgIGdyb3VwICAgICAgICAgPSB7IGtleSwgdmFsdWUsIHJ1bnM6IFtdLCB9XG4gICAgICAgICAgICBwcnZfa2V5ICAgICAgID0ga2V5XG4gICAgICAgICAgICBwcnZfdmFsdWUgICAgID0gdmFsdWVcbiAgICAgICAgICBncm91cC5ydW5zLnB1c2ggeyByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG4gICAgICAgIHlpZWxkIGdyb3VwIGlmIGdyb3VwP1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgSUZOLCBsZXRzLCB0eXBlc3BhY2U6IFQsIH1cbiAgcmV0dXJuIHtcbiAgICBkYnJpY19wbHVnaW4sXG4gIH1cblxuXG4iXX0=
