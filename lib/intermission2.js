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
    insert_run_cfg: {
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
        //-----------------------------------------------------------------------------------------------------
        hrd_find_nonnormal_groups: SQL`select key, value from hrd_normalization where is_normal = false order by key, value;`
      },
      //-------------------------------------------------------------------------------------------------------
      methods: {
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
        hrd_insert_run: nfa({
          template: templates.insert_run_cfg
        }, function(lo, hi, key, value, cfg) {
          return this.statements.hrd_insert_run.run(this._hrd_create_insert_run_cfg(lo, hi, key, value));
        }),
        //-----------------------------------------------------------------------------------------------------
        hrd_punch: nfa({
          template: templates.insert_run_cfg
        }, function(lo, hi, key, value, cfg) {
          /* like `hrd_insert_run()` but resolves key/value conflicts in favor of value given */
          return this.hrd_validate();
        }),
        //-----------------------------------------------------------------------------------------------------
        hrd_validate: function() {
          var conflicts;
          if ((conflicts = [...(this.hrd_find_conflicts())]).length === 0) {
            return null;
          }
          throw new Error(`Ωhrd___6 found conflicts: ${rpr(conflicts)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FINUI7O0VBSUEsQ0FBQTtJ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QWY7Z0JBQUEsTUFBTSxNQUFOOztjQUNBLEtBQUEsR0FBZ0I7Z0JBQUUsR0FBRjtnQkFBTyxLQUFQO2dCQUFjLElBQUEsRUFBTTtjQUFwQjtjQUNoQixPQUFBLEdBQWdCO2NBQ2hCLFNBQUEsR0FBZ0IsTUFKbEI7O1lBS0EsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFYLENBQWdCLENBQUUsS0FBRixFQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEdBQWpCLEVBQXNCLEtBQXRCLENBQWhCO1VBTkY7VUFPQSxJQUFlLGFBQWY7WUFBQSxNQUFNLE1BQU47O0FBQ0EsaUJBQU87UUFaZTtNQTFCeEI7SUE5S0Y7RUFMRixFQTdDRjs7O0VBeVFBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjO01BQUUsU0FBRjtNQUFhLEdBQWI7TUFBa0IsSUFBbEI7TUFBd0IsU0FBQSxFQUFXO0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUF6UXBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG4jIyMgTk9URSBub3QgdXNpbmcgYGxldHNmcmVlemV0aGF0YCB0byBhdm9pZCBpc3N1ZSB3aXRoIGRlZXAtZnJlZXppbmcgYFJ1bmAgaW5zdGFuY2VzICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICBpbnNlcnRfcnVuX2NmZzpcbiAgICBsbzogICAgICAgMFxuICAgIGhpOiAgICAgICBudWxsXG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIGhyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggaHJkX2dldF9ydW5fcm93aWQoIGxvLCBoaSwga2V5ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBsbyAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBoaSAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggbG8sIGhpLCBrZXksIHZhbHVlICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNFwiIGNoZWNrICgga2V5IHJlZ2V4cCAnLionIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzVcIiBjaGVjayAoIGtleSByZWdleHAgJ15cXCR4JHxeW14kXS4rJyApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2hpXCIgIG9uIGhyZF9ydW5zICggaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2tleVwiIG9uIGhyZF9ydW5zICgga2V5ICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2dyb3VwX2ZhY2V0cyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBjb3VudCgqKSAgYXMgcnVuc1xuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGdyb3VwIGJ5IGEua2V5LCBhLnZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkgYS5rZXksIGEudmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2NvbmZsaWN0cyBhc1xuICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgIGEucm93aWQgIGFzIHJvd2lkX2EsXG4gICAgICAgICAgICBhLmxvICAgICBhcyBsb19hLFxuICAgICAgICAgICAgYS5oaSAgICAgYXMgaGlfYSxcbiAgICAgICAgICAgIGEua2V5ICAgIGFzIGtleV9hLFxuICAgICAgICAgICAgYS52YWx1ZSAgYXMgdmFsdWVfYSxcbiAgICAgICAgICAgIGIucm93aWQgIGFzIHJvd2lkX2IsXG4gICAgICAgICAgICBiLmxvICAgICBhcyBsb19iLFxuICAgICAgICAgICAgYi5oaSAgICAgYXMgaGlfYixcbiAgICAgICAgICAgIGIua2V5ICAgIGFzIGtleV9iLFxuICAgICAgICAgICAgYi52YWx1ZSAgYXMgdmFsdWVfYlxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgb24gdHJ1ZVxuICAgICAgICAgICAgICBhbmQgKCBhLnJvd2lkIDwgICBiLnJvd2lkIClcbiAgICAgICAgICAgICAgYW5kICggYS5rZXkgICA9ICAgYi5rZXkgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEudmFsdWUgPD4gIGIudmFsdWUgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmxvICAgIDw9ICBiLmhpICAgIClcbiAgICAgICAgICAgICAgYW5kICggYS5oaSAgICA+PSAgYi5sbyAgICApXG4gICAgICAgICAgb3JkZXIgYnkgYS5sbywgYS5oaSwgYS5rZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9ncm91cF9oYXNfY29uZmxpY3QgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBmLmtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZi52YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgbm90ICggY2Eua2V5X2EgaXMgbnVsbCBhbmQgY2Iua2V5X2IgaXMgbnVsbCApICAgICAgICAgICAgIGFzIGhhc19jb25mbGljdFxuICAgICAgICBmcm9tIGhyZF9ncm91cF9mYWNldHMgYXMgZlxuICAgICAgICBsZWZ0IGpvaW4gaHJkX2NvbmZsaWN0cyBhcyBjYSBvbiAoIGYua2V5ID0gY2Eua2V5X2EgYW5kIGYudmFsdWUgPSBjYS52YWx1ZV9hIClcbiAgICAgICAgbGVmdCBqb2luIGhyZF9jb25mbGljdHMgYXMgY2Igb24gKCBmLmtleSA9IGNiLmtleV9iIGFuZCBmLnZhbHVlID0gY2IudmFsdWVfYiApXG4gICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX25vcm1hbGl6YXRpb24gYXNcbiAgICAgICAgd2l0aCBvcmRlcmVkIGFzIChcbiAgICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgICAga2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICAgIHZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICAgIGxvICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgbG8sXG4gICAgICAgICAgICAgIGhpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgaGksXG4gICAgICAgICAgICAgIGxhZyggaGkgKSBvdmVyICggcGFydGl0aW9uIGJ5IGtleSwgdmFsdWUgb3JkZXIgYnkgbG8gKSAgYXMgcHJldl9oaVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgKVxuICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBjYXNlIHdoZW4gc3VtKFxuICAgICAgICAgICAgICBjYXNlXG4gICAgICAgICAgICAgICAgd2hlbiAoIHByZXZfaGkgaXMgbm90IG51bGwgKSBhbmQgKCBsbyA8PSBwcmV2X2hpICsgMSApIHRoZW4gMSBlbHNlIDAgZW5kICkgPiAwXG4gICAgICAgICAgICAgICAgdGhlbiAwIGVsc2UgMSBlbmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBvcmRlcmVkXG4gICAgICAgICAgZ3JvdXAgYnkga2V5LCB2YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2dyb3VwcyBhc1xuICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgIGcua2V5ICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBnLnZhbHVlICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBmaXJzdF92YWx1ZSggci5sbyApIG92ZXIgdyAgYXMgZmlyc3QsXG4gICAgICAgICAgICBsYXN0X3ZhbHVlKCAgci5oaSApIG92ZXIgdyAgYXMgbGFzdCxcbiAgICAgICAgICAgIGcucnVucyAgICAgICAgICAgICAgICAgICAgICBhcyBydW5zLFxuICAgICAgICAgICAgbi5pc19ub3JtYWwgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gaHJkX2dyb3VwX2ZhY2V0cyAgICAgICAgICAgYXMgZ1xuICAgICAgICAgIGxlZnQgam9pbiBocmRfbm9ybWFsaXphdGlvbiAgICAgYXMgbiB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIGxlZnQgam9pbiBocmRfcnVucyAgICAgICAgICAgICAgYXMgciB1c2luZyAoIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IHIua2V5LCByLnZhbHVlIG9yZGVyIGJ5IHIubG8sIHIuaGksIHIua2V5LCByLnZhbHVlIClcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZ2V0X3J1bl9yb3dpZDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCBsbywgaGksIGtleSApIC0+XG4gICAgICAgICAgbHMgPSBpZiBsbyA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBocyA9IGlmIGhpIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgICAgICAgIGZcInQ6aHJkOnJ1bnM6Vj0je2xzfSN7TWF0aC5hYnMgbG99Oio8MDZ4Oywje2hzfSN7TWF0aC5hYnMgaGl9Oio8MDZ4Oywje2tleX1cIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHNfZm9yX2tleTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY29uZmxpY3RzOiAgICAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2NvbmZsaWN0cztcIlwiXCJcbiAgICAgIGhyZF9maW5kX2dyb3VwX2ZhY2V0czogICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9ncm91cF9mYWNldHM7XCJcIlwiXG4gICAgICBocmRfZmluZF9ydW5zX2J5X2dyb3VwOiAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfcnVucyBvcmRlciBieSBrZXksIHZhbHVlLCBsbywgaGk7XCJcIlwiXG4gICAgICBocmRfZmluZF9ncm91cHM6ICAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2dyb3VwcyBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9ncm91cHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qga2V5LCB2YWx1ZSBmcm9tIGhyZF9ub3JtYWxpemF0aW9uIHdoZXJlIGlzX25vcm1hbCA9IGZhbHNlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1ldGhvZHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY29uZmxpY3RzOiAgICAgICAgICAgICAgICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9jb25mbGljdHNcbiAgICAgIGhyZF9maW5kX2dyb3VwX2ZhY2V0czogICAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiAgICAgICAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX25vbm5vcm1hbF9ncm91cHNcbiAgICAgIGhyZF9maW5kX2dyb3VwczogICAgICAgICAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmc6ICggbG8sIGhpLCBrZXksIHZhbHVlICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIHJldHVybiB7IGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9pbnNlcnRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmluc2VydF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLmhyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3B1bmNoOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmluc2VydF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgIyMjIGxpa2UgYGhyZF9pbnNlcnRfcnVuKClgIGJ1dCByZXNvbHZlcyBrZXkvdmFsdWUgY29uZmxpY3RzIGluIGZhdm9yIG9mIHZhbHVlIGdpdmVuICMjI1xuICAgICAgICBAaHJkX3ZhbGlkYXRlKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfdmFsaWRhdGU6IC0+XG4gICAgICAgIHJldHVybiBudWxsIGlmICggY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9jb25mbGljdHMoKSApLi4uLCBdICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlocmRfX182IGZvdW5kIGNvbmZsaWN0czogI3tycHIgY29uZmxpY3RzfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogLT5cbiAgICAgICAgcHJ2X2tleSAgID0gbnVsbFxuICAgICAgICBwcnZfdmFsdWUgPSBudWxsXG4gICAgICAgIGdyb3VwICAgICA9IG51bGxcbiAgICAgICAgZm9yIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfSBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNfYnlfZ3JvdXBcbiAgICAgICAgICB1bmxlc3MgKCBrZXkgaXMgcHJ2X2tleSApIGFuZCAoIHZhbHVlIGlzIHBydl92YWx1ZSApXG4gICAgICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgICAgIGdyb3VwICAgICAgICAgPSB7IGtleSwgdmFsdWUsIHJ1bnM6IFtdLCB9XG4gICAgICAgICAgICBwcnZfa2V5ICAgICAgID0ga2V5XG4gICAgICAgICAgICBwcnZfdmFsdWUgICAgID0gdmFsdWVcbiAgICAgICAgICBncm91cC5ydW5zLnB1c2ggeyByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG4gICAgICAgIHlpZWxkIGdyb3VwIGlmIGdyb3VwP1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgSUZOLCBsZXRzLCB0eXBlc3BhY2U6IFQsIH1cbiAgcmV0dXJuIHtcbiAgICBkYnJpY19wbHVnaW4sXG4gIH1cblxuXG4iXX0=
