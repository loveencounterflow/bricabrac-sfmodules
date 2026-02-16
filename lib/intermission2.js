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
        SQL`create view hrd_group_facets as
select distinct
    a.key   as key,
    a.value as value
  from hrd_runs as a
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
        SQL`create view hrd_groups_plus as
select
    g.key                       as key,
    g.value                     as value,
    first_value( r.lo ) over w  as first,
    last_value(  r.hi ) over w  as last,
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
        hrd_find_groups_plus: SQL`select * from hrd_groups_plus order by key, value;`,
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
        hrd_find_groups_plus: function() {
          return this.walk(this.statements.hrd_find_groups_plus);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FINUI7O0VBSUEsQ0FBQTtJ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S0FBQSxHQUFZO1VBQ1osS0FBQSxzREFBQTthQUFJLENBQUUsS0FBRixFQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEdBQWpCLEVBQXNCLEtBQXRCO1lBQ0YsTUFBTyxDQUFFLEdBQUEsS0FBTyxPQUFULENBQUEsSUFBdUIsQ0FBRSxLQUFBLEtBQVMsU0FBWCxFQUE5QjtjQUNFLElBQWUsYUFBZjtnQkFBQSxNQUFNLE1BQU47O2NBQ0EsS0FBQSxHQUFnQjtnQkFBRSxHQUFGO2dCQUFPLEtBQVA7Z0JBQWMsSUFBQSxFQUFNO2NBQXBCO2NBQ2hCLE9BQUEsR0FBZ0I7Y0FDaEIsU0FBQSxHQUFnQixNQUpsQjs7WUFLQSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVgsQ0FBZ0IsQ0FBRSxLQUFGLEVBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsR0FBakIsRUFBc0IsS0FBdEIsQ0FBaEI7VUFORjtVQU9BLElBQWUsYUFBZjtZQUFBLE1BQU0sTUFBTjs7QUFDQSxpQkFBTztRQVplO01BWHhCO0lBM0tGO0VBTEYsRUF6Q0Y7OztFQW1QQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUE7SUFBRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYztNQUFFLFNBQUY7TUFBYSxHQUFiO01BQWtCLElBQWxCO01BQXdCLFNBQUEsRUFBVztJQUFuQyxDQUFkO0FBQ1osV0FBTyxDQUNMLFlBREs7RUFGVyxDQUFBO0FBblBwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IGluc3BlY3Q6IHJwciwgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuIyB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgZiwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdlZmZzdHJpbmcnXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG4jIyMgTk9URSBub3QgdXNpbmcgYGxldHNmcmVlemV0aGF0YCB0byBhdm9pZCBpc3N1ZSB3aXRoIGRlZXAtZnJlZXppbmcgYFJ1bmAgaW5zdGFuY2VzICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPSB7fVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIGhyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggaHJkX2dldF9ydW5fcm93aWQoIGxvLCBoaSwga2V5ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBsbyAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBoaSAgICAgIHJlYWwgbm90IG51bGwsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggbG8sIGhpLCBrZXksIHZhbHVlICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNFwiIGNoZWNrICgga2V5IHJlZ2V4cCAnLionIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzVcIiBjaGVjayAoIGtleSByZWdleHAgJ15cXCR4JHxeW14kXS4rJyApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2hpXCIgIG9uIGhyZF9ydW5zICggaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2tleVwiIG9uIGhyZF9ydW5zICgga2V5ICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2dyb3VwX2ZhY2V0cyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEua2V5ICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9jb25mbGljdHMgYXNcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZF9hLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG9fYSxcbiAgICAgICAgICAgIGEuaGkgICAgIGFzIGhpX2EsXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXlfYSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlX2EsXG4gICAgICAgICAgICBiLnJvd2lkICBhcyByb3dpZF9iLFxuICAgICAgICAgICAgYi5sbyAgICAgYXMgbG9fYixcbiAgICAgICAgICAgIGIuaGkgICAgIGFzIGhpX2IsXG4gICAgICAgICAgICBiLmtleSAgICBhcyBrZXlfYixcbiAgICAgICAgICAgIGIudmFsdWUgIGFzIHZhbHVlX2JcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICAgIG9uIHRydWVcbiAgICAgICAgICAgICAgYW5kICggYS5yb3dpZCA8ICAgYi5yb3dpZCApXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlIDw+ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZ3JvdXBfaGFzX2NvbmZsaWN0IGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGYudmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIG5vdCAoIGNhLmtleV9hIGlzIG51bGwgYW5kIGNiLmtleV9iIGlzIG51bGwgKSAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3RcbiAgICAgICAgZnJvbSBocmRfZ3JvdXBfZmFjZXRzIGFzIGZcbiAgICAgICAgbGVmdCBqb2luIGhyZF9jb25mbGljdHMgYXMgY2Egb24gKCBmLmtleSA9IGNhLmtleV9hIGFuZCBmLnZhbHVlID0gY2EudmFsdWVfYSApXG4gICAgICAgIGxlZnQgam9pbiBocmRfY29uZmxpY3RzIGFzIGNiIG9uICggZi5rZXkgPSBjYi5rZXlfYiBhbmQgZi52YWx1ZSA9IGNiLnZhbHVlX2IgKVxuICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gICAgICAgIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIClcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgICAgICAgY2FzZVxuICAgICAgICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gb3JkZXJlZFxuICAgICAgICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ncm91cHNfcGx1cyBhc1xuICAgICAgICBzZWxlY3RcbiAgICAgICAgICAgIGcua2V5ICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBnLnZhbHVlICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBmaXJzdF92YWx1ZSggci5sbyApIG92ZXIgdyAgYXMgZmlyc3QsXG4gICAgICAgICAgICBsYXN0X3ZhbHVlKCAgci5oaSApIG92ZXIgdyAgYXMgbGFzdCxcbiAgICAgICAgICAgIG4uaXNfbm9ybWFsICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIGhyZF9ncm91cF9mYWNldHMgICAgICAgICAgIGFzIGdcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX25vcm1hbGl6YXRpb24gICAgIGFzIG4gdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX3J1bnMgICAgICAgICAgICAgIGFzIHIgdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSByLmtleSwgci52YWx1ZSBvcmRlciBieSByLmxvLCByLmhpLCByLmtleSwgci52YWx1ZSApXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2dldF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggbG8sIGhpLCBrZXkgKSAtPlxuICAgICAgICAgIGxzID0gaWYgbG8gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgICAgICAgaHMgPSBpZiBoaSA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICAgICAgICBmXCJ0OmhyZDpydW5zOlY9I3tsc30je01hdGguYWJzIGxvfToqPDA2eDssI3toc30je01hdGguYWJzIGhpfToqPDA2eDssI3trZXl9XCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2luc2VydF9ydW46IFNRTFwiXCJcImluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzX2Zvcl9rZXk6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBrZXkgPSAka2V5IClcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2NvbmZsaWN0czogICAgICAgICBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9jb25mbGljdHM7XCJcIlwiXG4gICAgICBocmRfZmluZF9ncm91cF9mYWNldHM6ICAgICAgU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZ3JvdXBfZmFjZXRzO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfcnVuc19ieV9ncm91cDogICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX3J1bnMgb3JkZXIgYnkga2V5LCB2YWx1ZSwgbG8sIGhpO1wiXCJcIlxuICAgICAgaHJkX2ZpbmRfZ3JvdXBzX3BsdXM6ICAgICAgIFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2dyb3Vwc19wbHVzIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3VwczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCBrZXksIHZhbHVlIGZyb20gaHJkX25vcm1hbGl6YXRpb24gd2hlcmUgaXNfbm9ybWFsID0gZmFsc2Ugb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb25mbGljdHM6ICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY29uZmxpY3RzXG4gICAgICBocmRfZmluZF9ncm91cF9mYWNldHM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfZ3JvdXBfZmFjZXRzXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZ3JvdXBzOiAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfbm9ubm9ybWFsX2dyb3Vwc1xuICAgICAgaHJkX2ZpbmRfZ3JvdXBzX3BsdXM6ICAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2dyb3Vwc19wbHVzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlOiAtPlxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfY29uZmxpY3RzKCkgKS4uLiwgXSApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX19fNiBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnNfYnlfZ3JvdXA6IC0+XG4gICAgICAgIHBydl9rZXkgICA9IG51bGxcbiAgICAgICAgcHJ2X3ZhbHVlID0gbnVsbFxuICAgICAgICBncm91cCAgICAgPSBudWxsXG4gICAgICAgIGZvciB7IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWUsIH0gZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zX2J5X2dyb3VwXG4gICAgICAgICAgdW5sZXNzICgga2V5IGlzIHBydl9rZXkgKSBhbmQgKCB2YWx1ZSBpcyBwcnZfdmFsdWUgKVxuICAgICAgICAgICAgeWllbGQgZ3JvdXAgaWYgZ3JvdXA/XG4gICAgICAgICAgICBncm91cCAgICAgICAgID0geyBrZXksIHZhbHVlLCBydW5zOiBbXSwgfVxuICAgICAgICAgICAgcHJ2X2tleSAgICAgICA9IGtleVxuICAgICAgICAgICAgcHJ2X3ZhbHVlICAgICA9IHZhbHVlXG4gICAgICAgICAgZ3JvdXAucnVucy5wdXNoIHsgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuICAgICAgICB5aWVsZCBncm91cCBpZiBncm91cD9cbiAgICAgICAgcmV0dXJuIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfcGx1Z2luLFxuICB9XG5cblxuIl19
