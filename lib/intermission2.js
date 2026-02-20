(function() {
  'use strict';
  var Dbric, Dbric_std, False, IDN, IFN, LIT, SQL, T, True, VEC, as_bool, dbric_plugin, debug, f, freeze, from_bool, hide, lets, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, templates, type_of;

  //===========================================================================================================
  ({debug} = console);

  ({freeze} = Object);

  IFN = require('./../dependencies/intervals-fn-lib.js');

  ({T} = require('./intermission-types'));

  //...........................................................................................................
  ({nfa} = require('normalize-function-arguments'));

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
    },
    hrd_find_families: {
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
        SQL`create view _hrd_families as
select distinct
    a.key     as key,
    a.value   as value,
    count(*)  as runs
  from hrd_runs as a
  group by a.key, a.value
  order by a.key, a.value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_family_conflicts_2 as
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
        SQL`create view hrd_family_conflicts_1 as
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
        SQL`create view hrd_families as
select distinct
    g.key                       as key,
    g.value                     as value,
    min( r.lo ) over w          as first,
    max( r.hi ) over w          as last,
    g.runs                      as runs,
    false                       as has_conflict, -- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    n.is_normal                 as is_normal
  from _hrd_families           as g
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
        _hrd_insert_run: SQL`insert into hrd_runs ( lo, hi, key, value ) values ( $lo, $hi, $key, $value );`,
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
        hrd_find_runs_with_conflicts_1: SQL`select * from hrd_family_conflicts_1;`,
        hrd_delete_run: SQL`delete from hrd_runs where rowid = $rowid;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_nonnormal_families: SQL`select key, value from hrd_normalization where is_normal = false order by key, value;`,
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
        hrd_find_nonnormal_families: function() {
          return this.walk(this.statements.hrd_find_nonnormal_families);
        },
        //-----------------------------------------------------------------------------------------------------
        /* TAINT should use `nfa` but currently fails for generators */
        // hrd_find_families: nfa { template: templates.hrd_find_families, }, ( key, value, cfg ) ->
        hrd_find_families: function*(cfg) {
          var row, sql;
          cfg = {...templates.hrd_find_families, ...cfg};
          switch (true) {
            case (cfg.key != null) && (cfg.value != null):
              cfg.value = JSON.stringify(cfg.value);
              sql = SQL`select * from hrd_families where key = $key and value = $value order by key, value;`;
              break;
            case cfg.key != null:
              sql = SQL`select * from hrd_families where key = $key order by key, value;`;
              break;
            case cfg.value != null:
              cfg.value = JSON.stringify(cfg.value);
              sql = SQL`select * from hrd_families where value = $value order by key, value;`;
              break;
            default:
              sql = SQL`select * from hrd_families order by key, value;`;
          }
          for (row of this.walk(sql, cfg)) {
            row.has_conflict = as_bool(row.has_conflict);
            row.is_normal = as_bool(row.is_normal);
            row.value = JSON.parse(row.value);
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
            hide(row, 'value_json', row.value);
            row.value = JSON.parse(row.value);
            yield row;
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_add_run: nfa({
          template: templates.add_run_cfg
        }, function(lo, hi, key, value, cfg) {
          return this.statements._hrd_insert_run.run(this._hrd_create_insert_run_cfg(lo, hi, key, value));
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
          /* like `_hrd_add_run()` but resolves key/value conflicts in favor of value given */
          // @hrd_validate_1()
          new_ok = this._hrd_create_insert_run_cfg(lo, hi, key, value);
          this.with_transaction(() => {
            var conflict, conflicts, i, len, results, run_nk, run_ok;
            this.statements._hrd_insert_run.run(new_ok);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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UUFBQSxDQUFBLENBQUE7QUFDdEIsY0FBQTtVQUFRLElBQWUsQ0FBRSxTQUFBLEdBQVksQ0FBRSxHQUFBLENBQUUsSUFBQyxDQUFBLDhCQUFELENBQUEsQ0FBRixDQUFGLENBQWQsQ0FBNkQsQ0FBQyxNQUE5RCxLQUF3RSxDQUF2RjtBQUFBLG1CQUFPLEtBQVA7O1VBQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDBCQUFBLENBQUEsQ0FBNkIsR0FBQSxDQUFJLFNBQUosQ0FBN0IsQ0FBQSxDQUFWO1FBRlE7TUFqRmhCO0lBNU5GO0VBTEYsRUFwREY7OztFQTRXQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUE7SUFBRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYztNQUFFLFNBQUY7TUFBYSxHQUFiO01BQWtCLElBQWxCO01BQXdCLFNBQUEsRUFBVztJQUFuQyxDQUFkO0FBQ1osV0FBTyxDQUNMLFlBREs7RUFGVyxDQUFBO0FBNVdwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IGluc3BlY3Q6IHJwciwgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuIyB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgZiwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdlZmZzdHJpbmcnXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBhc19ib29sLFxuICBmcm9tX2Jvb2wsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgVEFJTlQgbW92ZSB0byBkZWRpY2F0ZWQgbW9kdWxlICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICBhZGRfcnVuX2NmZzpcbiAgICBsbzogICAgICAgMFxuICAgIGhpOiAgICAgICBudWxsXG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuICBocmRfZmluZF9mYW1pbGllczpcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kYnJpY19wbHVnaW4gPVxuICBuYW1lOiAgICdocmRfaG9hcmRfcGx1Z2luJyAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBwcmVmaXg6ICdocmQnICAgICAgICAgICAgICAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBleHBvcnRzOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogW1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGhyZF9nZXRfcnVuX3Jvd2lkKCBsbywgaGksIGtleSApICkgc3RvcmVkLFxuICAgICAgICAgICAgbG8gICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsIG5vdCBudWxsLFxuICAgICAgICAgICAga2V5ICAgICB0ZXh0IG5vdCBudWxsLFxuICAgICAgICAgICAgdmFsdWUgICB0ZXh0IG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLCAtLSBwcm9wZXIgZGF0YSB0eXBlIGlzIGBqc29uYCBidXQgZGVjbGFyZWQgYXMgYHRleHRgIGIvYyBvZiBgc3RyaWN0YFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGxvLCBoaSwga2V5LCB2YWx1ZSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzRcIiBjaGVjayAoIGtleSByZWdleHAgJy4qJyApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX181XCIgY2hlY2sgKCBrZXkgcmVnZXhwICdeXFwkeCR8XlteJF0uKycgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19oaVwiICBvbiBocmRfcnVucyAoIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiBvbiBocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbHlfY29uZmxpY3RzXzIgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgb24gdHJ1ZVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSAhPSAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWx5X2NvbmZsaWN0c18xIGFzXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgYXMgcm93aWRfYSxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvX2EsXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaV9hLFxuICAgICAgICAgICAgYS5rZXkgICAgYXMga2V5X2EsXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZV9hLFxuICAgICAgICAgICAgYi5yb3dpZCAgYXMgcm93aWRfYixcbiAgICAgICAgICAgIGIubG8gICAgIGFzIGxvX2IsXG4gICAgICAgICAgICBiLmhpICAgICBhcyBoaV9iLFxuICAgICAgICAgICAgYi5rZXkgICAgYXMga2V5X2IsXG4gICAgICAgICAgICBiLnZhbHVlICBhcyB2YWx1ZV9iXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEucm93aWQgPCAgIGIucm93aWQgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSAhPSAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfbm9ybWFsaXphdGlvbiBhc1xuICAgICAgICB3aXRoIG9yZGVyZWQgYXMgKFxuICAgICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgICAgbG8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgaGkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgICAgbGFnKCBoaSApIG92ZXIgKCBwYXJ0aXRpb24gYnkga2V5LCB2YWx1ZSBvcmRlciBieSBsbyApICBhcyBwcmV2X2hpXG4gICAgICAgICAgZnJvbSBocmRfcnVucyApXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAga2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIHZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGNhc2Ugd2hlbiBzdW0oXG4gICAgICAgICAgICAgIGNhc2VcbiAgICAgICAgICAgICAgICB3aGVuICggcHJldl9oaSBpcyBub3QgbnVsbCApIGFuZCAoIGxvIDw9IHByZXZfaGkgKyAxICkgdGhlbiAxIGVsc2UgMCBlbmQgKSA+IDBcbiAgICAgICAgICAgICAgICB0aGVuIDAgZWxzZSAxIGVuZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIG9yZGVyZWRcbiAgICAgICAgICBncm91cCBieSBrZXksIHZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBnLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZy52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgbWluKCByLmxvICkgb3ZlciB3ICAgICAgICAgIGFzIGZpcnN0LFxuICAgICAgICAgICAgbWF4KCByLmhpICkgb3ZlciB3ICAgICAgICAgIGFzIGxhc3QsXG4gICAgICAgICAgICBnLnJ1bnMgICAgICAgICAgICAgICAgICAgICAgYXMgcnVucyxcbiAgICAgICAgICAgIGZhbHNlICAgICAgICAgICAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3QsIC0tICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhXG4gICAgICAgICAgICBuLmlzX25vcm1hbCAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBfaHJkX2ZhbWlsaWVzICAgICAgICAgICBhcyBnXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ub3JtYWxpemF0aW9uICAgICBhcyBuIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ydW5zICAgICAgICAgICAgICBhcyByIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgci5rZXksIHIudmFsdWUgKVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9nZXRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGxvLCBoaSwga2V5ICkgLT5cbiAgICAgICAgICBscyA9IGlmIGxvIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGhzID0gaWYgaGkgPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgZlwidDpocmQ6cnVuczpWPSN7bHN9I3tNYXRoLmFicyBsb306KjwwNng7LCN7aHN9I3tNYXRoLmFicyBoaX06KjwwNng7LCN7a2V5fVwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9qc29uX3F1b3RlOlxuICAgICAgIyAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICMgICB2YWx1ZTogKCB4ICkgLT4gSlNPTi5zdHJpbmdpZnkgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGF0ZW1lbnRzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHNfZm9yX2tleTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xOiBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbHlfY29uZmxpY3RzXzE7XCJcIlwiXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgICAgICAgICAgIFNRTFwiXCJcImRlbGV0ZSBmcm9tIGhyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9mYW1pbGllczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCBrZXksIHZhbHVlIGZyb20gaHJkX25vcm1hbGl6YXRpb24gd2hlcmUgaXNfbm9ybWFsID0gZmFsc2Ugb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcmVtb3ZlX292ZXJsYXBfMTogU1FMXCJcIlwiXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIGZyb20gKCBzZWxlY3RcbiAgICAgICAgICAgICAgYi5sbyAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBtLmxvIC0gMSAgYXMgaGksXG4gICAgICAgICAgICAgIGIua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICAgIGIudmFsdWUgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgbSBvbiAoIG0ucm93aWQgPSAkbWFza19yb3dpZCApXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgYW5kIGIubG8gPCBtLmxvXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdW5pb24gYWxsIHNlbGVjdFxuICAgICAgICAgICAgICAgIG0uaGkgKyAxLFxuICAgICAgICAgICAgICAgIGIuaGksXG4gICAgICAgICAgICAgICAgYi5rZXksXG4gICAgICAgICAgICAgICAgYi52YWx1ZVxuICAgICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gbS5yb3dpZCA9ICRtYXNrX3Jvd2lkXG4gICAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgICBhbmQgYi5oaSA+PSBtLmxvXG4gICAgICAgICAgICAgIGFuZCBiLmhpID4gbS5oaVxuICAgICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBfaHJkX2FzX2hhbGZvcGVuOiAgICggcnVuICAgICAgICkgLT4geyBzdGFydDogcnVuLmxvLCAgICAgICAgIGVuZDogIHJ1bi5oaSAgICAgICAgKyAxLCB9XG4gICAgICAjIF9ocmRfZnJvbV9oYWxmb3BlbjogKCBoYWxmb3BlbiAgKSAtPiB7IGxvOiAgICBoYWxmb3Blbi5zdGFydCwgaGk6ICAgaGFsZm9wZW4uZW5kICAtIDEsIH1cblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgX2hyZF9zdWJ0cmFjdDogKCBiYXNlLCBtYXNrICkgLT5cbiAgICAgICMgICBoYWxmb3BlbnMgPSBJRk4uc3Vic3RyYWN0IFsgKCBAX2hyZF9hc19oYWxmb3BlbiBiYXNlICksIF0sIFsgKCBAX2hyZF9hc19oYWxmb3BlbiBtYXNrICksIF1cbiAgICAgICMgICByZXR1cm4gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnMgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgICAgICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZmFtaWxpZXM6ICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ub25ub3JtYWxfZmFtaWxpZXNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIHVzZSBgbmZhYCBidXQgY3VycmVudGx5IGZhaWxzIGZvciBnZW5lcmF0b3JzICMjI1xuICAgICAgIyBocmRfZmluZF9mYW1pbGllczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5ocmRfZmluZF9mYW1pbGllcywgfSwgKCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgaHJkX2ZpbmRfZmFtaWxpZXM6ICggY2ZnICkgLT5cbiAgICAgICAgY2ZnID0geyB0ZW1wbGF0ZXMuaHJkX2ZpbmRfZmFtaWxpZXMuLi4sIGNmZy4uLiwgfVxuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gY2ZnLmtleT8gYW5kIGNmZy52YWx1ZT9cbiAgICAgICAgICAgIGNmZy52YWx1ZSA9IEpTT04uc3RyaW5naWZ5IGNmZy52YWx1ZVxuICAgICAgICAgICAgc3FsICAgICAgID0gU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWxpZXMgd2hlcmUga2V5ID0gJGtleSBhbmQgdmFsdWUgPSAkdmFsdWUgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICAgICB3aGVuIGNmZy5rZXk/XG4gICAgICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyB3aGVyZSBrZXkgPSAka2V5IG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAgICAgd2hlbiBjZmcudmFsdWU/XG4gICAgICAgICAgICBjZmcudmFsdWUgPSBKU09OLnN0cmluZ2lmeSBjZmcudmFsdWVcbiAgICAgICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIHdoZXJlIHZhbHVlID0gJHZhbHVlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3FsICAgICAgID0gU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWxpZXMgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIHNxbCwgY2ZnXG4gICAgICAgICAgcm93Lmhhc19jb25mbGljdCAgPSBhc19ib29sIHJvdy5oYXNfY29uZmxpY3RcbiAgICAgICAgICByb3cuaXNfbm9ybWFsICAgICA9IGFzX2Jvb2wgcm93LmlzX25vcm1hbFxuICAgICAgICAgIHJvdy52YWx1ZSAgICAgICAgID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzE6IC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzFcbiAgICAgICAgICAjIHJvdy5oYXNfY29uZmxpY3QgID0gYXNfYm9vbCByb3cuaGFzX2NvbmZsaWN0XG4gICAgICAgICAgIyByb3cuaXNfbm9ybWFsICAgICA9IGFzX2Jvb2wgcm93LmlzX25vcm1hbFxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnOiAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgICByZXR1cm4geyBsbywgaGksIGtleSwgdmFsdWUsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9maW5kX292ZXJsYXBzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmxvX2hpLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiAoIGxvLCBoaSA9IG51bGwgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9vdmVybGFwcywgeyBsbywgaGksIH1cbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0XzE6ICggY29uZmxpY3QsIG9rX3ZhbHVlX2pzb24gKSAtPlxuICAgICAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgICAgICByb3dpZF9iLCBsb19iLCBoaV9iLCBrZXlfYiwgdmFsdWVfYiwgfSAgPSBjb25mbGljdFxuICAgICAgICAgIHJ1bl9vayA9IHsgcm93aWQ6IHJvd2lkX2EsIGxvOiBsb19hLCBoaTogaGlfYSwga2V5OiBrZXlfYSwgdmFsdWU6IHZhbHVlX2EsIH1cbiAgICAgICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rLCBydW5fbmssIH0gaWYgcnVuX29rLnZhbHVlIGlzIG9rX3ZhbHVlX2pzb25cbiAgICAgICAgICByZXR1cm4geyBydW5fb2s6IHJ1bl9uaywgcnVuX25rOiBydW5fb2ssIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcHVuY2hfMTogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgICMjIyBUQUlOVCBuZWVkIHRvIHdyYXAgaW4gdHJhbnNhY3Rpb24gIyMjXG4gICAgICAgICMjIyBsaWtlIGBfaHJkX2FkZF9ydW4oKWAgYnV0IHJlc29sdmVzIGtleS92YWx1ZSBjb25mbGljdHMgaW4gZmF2b3Igb2YgdmFsdWUgZ2l2ZW4gIyMjXG4gICAgICAgICMgQGhyZF92YWxpZGF0ZV8xKClcbiAgICAgICAgbmV3X29rID0gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICBAd2l0aF90cmFuc2FjdGlvbiA9PlxuICAgICAgICAgIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gbmV3X29rXG4gICAgICAgICAgY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzEoKSApLi4uLCBdXG4gICAgICAgICAgZm9yIGNvbmZsaWN0IGluIGNvbmZsaWN0c1xuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIGNvbmZsaWN0LmtleV9hIGlzIG5ld19vay5rZXkgIyMjIGRvIG5vdCByZXNvbHZlIGNvbmZsaWN0cyBvZiBvdGhlciBrZXkvdmFsdWUgcGFpcnMgIyMjXG4gICAgICAgICAgICB7IHJ1bl9vaywgcnVuX25rLCB9ID0gQF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0XzEgY29uZmxpY3QsIG5ld19vay52YWx1ZVxuICAgICAgICAgICAgQHN0YXRlbWVudHMuaHJkX3JlbW92ZV9vdmVybGFwXzEucnVuIHsgYmFzZV9yb3dpZDogcnVuX25rLnJvd2lkLCBtYXNrX3Jvd2lkOiBydW5fb2sucm93aWQsIH1cbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfcnVuLnJ1biB7IHJvd2lkOiBydW5fbmsucm93aWQsIH1cbiAgICAgICAgICAgIDtudWxsXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlXzE6IC0+XG4gICAgICAgIHJldHVybiBudWxsIGlmICggY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzEoKSApLi4uLCBdICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlocmRfX182IGZvdW5kIGNvbmZsaWN0czogI3tycHIgY29uZmxpY3RzfVwiXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfcGx1Z2luLFxuICB9XG5cblxuIl19
