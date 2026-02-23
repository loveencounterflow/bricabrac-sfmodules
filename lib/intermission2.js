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
        SQL`create table _hrd_runs (
    rowid   text    not null,
    inorn   integer not null, -- INsertion ORder Number
    lo      real    not null,
    hi      real    not null,
    facet   text    not null generated always as ( printf( '%s:%s', key, value ) ) stored,
    key     text    not null,
    value   text    not null default 'null', -- proper data type is \`json\` but declared as \`text\` b/c of \`strict\`
  primary key ( rowid ),
  unique ( inorn ),
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
  constraint "Ωhrd_constraint___3" check ( lo <= hi )
) strict;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create index "hrd_index_runs_lo_hi"       on _hrd_runs ( lo,  hi );`,
        SQL`create index "hrd_index_runs_hi"          on _hrd_runs ( hi );`,
        SQL`create index "hrd_index_runs_inorn_desc"  on _hrd_runs ( inorn desc );`,
        SQL`create index "hrd_index_runs_key"         on _hrd_runs ( key );`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_runs as select * from _hrd_runs;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create trigger hrd_on_before_insert_run
instead of insert on hrd_runs
  for each row begin
    insert into _hrd_runs ( rowid, inorn, lo, hi, key, value ) values
      ( _hrd_get_next_run_rowid(), _hrd_get_run_inorn(), new.lo, new.hi, new.key, new.value );
    end;
;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_global_bounds as
select 'lo' as bound, min( lo ) as point from hrd_runs union
select 'hi' as bound, max( hi ) as point from hrd_runs
order by point;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_breakpoints as
select 'lo' as bound, lo as point from hrd_runs union
select 'hi' as bound, hi as point from hrd_runs
order by point;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_inspection_points as
select distinct point
from (
  -- all breakpoints themselves
  select point from hrd_breakpoints

  union all

  -- for each 'hi' breakpoint, the point just after
  select b.point + 1
  from hrd_breakpoints b, hrd_global_bounds g
  where b.bound = 'hi'
    and b.point + 1 <= ( select point from hrd_global_bounds where bound = 'hi' )

  union all

  -- for each 'lo' breakpoint, the point just before
  select b.point - 1
  from hrd_breakpoints b, hrd_global_bounds g
  where b.bound = 'lo'
    and b.point - 1 >= ( select point from hrd_global_bounds where bound = 'lo' )
)
order by point;`,
        // #-----------------------------------------------------------------------------------------------------
        // SQL""" create view hrd_breakpoint_facets_1 as
        //   with ranked as ( select
        //       a.rowid               as rowid,
        //       a.inorn               as inorn,
        //       b.point               as point,
        //       row_number() over w   as rn,
        //       a.lo                  as lo,
        //       a.hi                  as hi,
        //       a.facet               as facet,
        //       a.key                 as key,
        //       a.value               as value
        //     from hrd_breakpoints as b
        //     join hrd_runs as a on ( b.point in ( a.lo, a. hi ) )
        //     window w as ( partition by a.key order by a.inorn desc ) )
        //   select * from ranked where true or ( rn = 1 ) order by key asc;"""

        //-----------------------------------------------------------------------------------------------------
        SQL` create view hrd_breakpoint_facets as
select *
from hrd_breakpoints as a
join hrd_runs as b on ( a.point = b.lo or a.point = b.hi )
order by point, inorn desc;`
      ],
      //-------------------------------------------------------------------------------------------------------
      //-----------------------------------------------------------------------------------------------------
      functions: {
        //-----------------------------------------------------------------------------------------------------
        _hrd_get_run_inorn: {
          deterministic: false,
          value: function() {
            return this._hrd_get_run_inorn();
          }
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_get_next_run_rowid: {
          deterministic: false,
          value: function() {
            return this._hrd_get_next_run_rowid();
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
        _hrd_insert_run: SQL`insert into hrd_runs ( lo, hi, key, value )
  values ( $lo, $hi, $key, $value );`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs: SQL`select rowid, inorn, lo, hi, key, value
  from hrd_runs
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_delete_run: SQL`delete from _hrd_runs where rowid = $rowid;`,
        hrd_delete_all_runs: SQL`delete from _hrd_runs;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_covering_runs: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  where true
    and ( lo <= $hi )
    and ( hi >= $lo )
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_find_topruns_for_point: SQL`with ranked as ( select
    a.rowid               as rowid,
    a.inorn               as inorn,
    row_number() over w   as rn,
    a.lo                  as lo,
    a.hi                  as hi,
    a.facet               as facet,
    a.key                 as key,
    a.value               as value
  from hrd_runs as a
  where true
    and ( lo <= $point )
    and ( hi >= $point )
  window w as ( partition by a.key order by a.inorn desc ) )
select * from ranked where ( rn = 1 ) order by key asc;`
      },
      //-------------------------------------------------------------------------------------------------------
      methods: {
        //-----------------------------------------------------------------------------------------------------
        hrd_find_runs: function() {
          return this.walk(this.statements.hrd_find_runs);
        },
        _hrd_get_run_inorn: function() {
          var ref;
          return this.state.hrd_run_inorn = (ref = this.state.hrd_run_inorn) != null ? ref : 0;
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_get_next_run_rowid: function() {
          var R;
          this.state.hrd_run_inorn = R = this._hrd_get_run_inorn() + 1;
          return `t:hrd:runs:R=${R}`;
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
          return this.statements._hrd_insert_run.run(this._hrd_create_insert_run_cfg(lo, hi, key, value));
        }),
        //-----------------------------------------------------------------------------------------------------
        // hrd_find_covering_runs: nfa { template: templates.lo_hi, }, ( lo, hi, cfg ) ->
        hrd_find_covering_runs: function*(lo, hi = null) {
          var row;
          if (hi == null) {
            hi = lo;
          }
          for (row of this.walk(this.statements.hrd_find_covering_runs, {lo, hi})) {
            /* TAINT code duplication, use casting method */
            hide(row, 'value_json', row.value);
            row.value = JSON.parse(row.value);
            yield row;
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_find_topruns_for_point: function*(point) {
          var row;
          for (row of this.walk(this.statements.hrd_find_topruns_for_point, {point})) {
            /* TAINT code duplication, use casting method */
            hide(row, 'value_json', row.value);
            row.value = JSON.parse(row.value);
            yield row;
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_delete_runs: function() {
          return this.statements.hrd_delete_all_runs.run();
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_describe_point: function(point) {
          var key, value;
          return freeze(Object.fromEntries((function() {
            var results, x;
            results = [];
            for (x of this.hrd_find_topruns_for_point(point)) {
              ({key, value} = x);
              results.push([key, value]);
            }
            return results;
          }).call(this)));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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O0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUF2UnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gIGFkZF9ydW5fY2ZnOlxuICAgIGxvOiAgICAgICAwXG4gICAgaGk6ICAgICAgIG51bGxcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG4gIGhyZF9maW5kX2ZhbWlsaWVzOlxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIF9ocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICBpbm9ybiAgIGludGVnZXIgbm90IG51bGwsIC0tIElOc2VydGlvbiBPUmRlciBOdW1iZXJcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGZhY2V0ICAgdGV4dCAgICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggcHJpbnRmKCAnJXM6JXMnLCBrZXksIHZhbHVlICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGlub3JuICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2xvX2hpXCIgICAgICAgb24gX2hyZF9ydW5zICggbG8sICBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICAgICAgICBvbiBfaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaW5vcm5fZGVzY1wiICBvbiBfaHJkX3J1bnMgKCBpbm9ybiBkZXNjICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiAgICAgICAgIG9uIF9ocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zIGFzIHNlbGVjdCAqIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIGhyZF9vbl9iZWZvcmVfaW5zZXJ0X3J1blxuICAgICAgICBpbnN0ZWFkIG9mIGluc2VydCBvbiBocmRfcnVuc1xuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgaW5zZXJ0IGludG8gX2hyZF9ydW5zICggcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXNcbiAgICAgICAgICAgICAgKCBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpLCBfaHJkX2dldF9ydW5faW5vcm4oKSwgbmV3LmxvLCBuZXcuaGksIG5ldy5rZXksIG5ldy52YWx1ZSApO1xuICAgICAgICAgICAgZW5kO1xuICAgICAgICA7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2dsb2JhbF9ib3VuZHMgYXNcbiAgICAgICAgc2VsZWN0ICdsbycgYXMgYm91bmQsIG1pbiggbG8gKSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zIHVuaW9uXG4gICAgICAgIHNlbGVjdCAnaGknIGFzIGJvdW5kLCBtYXgoIGhpICkgYXMgcG9pbnQgZnJvbSBocmRfcnVuc1xuICAgICAgICBvcmRlciBieSBwb2ludDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfYnJlYWtwb2ludHMgYXNcbiAgICAgICAgc2VsZWN0ICdsbycgYXMgYm91bmQsIGxvIGFzIHBvaW50IGZyb20gaHJkX3J1bnMgdW5pb25cbiAgICAgICAgc2VsZWN0ICdoaScgYXMgYm91bmQsIGhpIGFzIHBvaW50IGZyb20gaHJkX3J1bnNcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2luc3BlY3Rpb25fcG9pbnRzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdCBwb2ludFxuICAgICAgICBmcm9tIChcbiAgICAgICAgICAtLSBhbGwgYnJlYWtwb2ludHMgdGhlbXNlbHZlc1xuICAgICAgICAgIHNlbGVjdCBwb2ludCBmcm9tIGhyZF9icmVha3BvaW50c1xuXG4gICAgICAgICAgdW5pb24gYWxsXG5cbiAgICAgICAgICAtLSBmb3IgZWFjaCAnaGknIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGFmdGVyXG4gICAgICAgICAgc2VsZWN0IGIucG9pbnQgKyAxXG4gICAgICAgICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYiwgaHJkX2dsb2JhbF9ib3VuZHMgZ1xuICAgICAgICAgIHdoZXJlIGIuYm91bmQgPSAnaGknXG4gICAgICAgICAgICBhbmQgYi5wb2ludCArIDEgPD0gKCBzZWxlY3QgcG9pbnQgZnJvbSBocmRfZ2xvYmFsX2JvdW5kcyB3aGVyZSBib3VuZCA9ICdoaScgKVxuXG4gICAgICAgICAgdW5pb24gYWxsXG5cbiAgICAgICAgICAtLSBmb3IgZWFjaCAnbG8nIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGJlZm9yZVxuICAgICAgICAgIHNlbGVjdCBiLnBvaW50IC0gMVxuICAgICAgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGIsIGhyZF9nbG9iYWxfYm91bmRzIGdcbiAgICAgICAgICB3aGVyZSBiLmJvdW5kID0gJ2xvJ1xuICAgICAgICAgICAgYW5kIGIucG9pbnQgLSAxID49ICggc2VsZWN0IHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgd2hlcmUgYm91bmQgPSAnbG8nIClcbiAgICAgICAgKVxuICAgICAgICBvcmRlciBieSBwb2ludDtcIlwiXCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgU1FMXCJcIlwiIGNyZWF0ZSB2aWV3IGhyZF9icmVha3BvaW50X2ZhY2V0c18xIGFzXG4gICAgICAjICAgd2l0aCByYW5rZWQgYXMgKCBzZWxlY3RcbiAgICAgICMgICAgICAgYS5yb3dpZCAgICAgICAgICAgICAgIGFzIHJvd2lkLFxuICAgICAgIyAgICAgICBhLmlub3JuICAgICAgICAgICAgICAgYXMgaW5vcm4sXG4gICAgICAjICAgICAgIGIucG9pbnQgICAgICAgICAgICAgICBhcyBwb2ludCxcbiAgICAgICMgICAgICAgcm93X251bWJlcigpIG92ZXIgdyAgIGFzIHJuLFxuICAgICAgIyAgICAgICBhLmxvICAgICAgICAgICAgICAgICAgYXMgbG8sXG4gICAgICAjICAgICAgIGEuaGkgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICMgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgIGFzIGZhY2V0LFxuICAgICAgIyAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgIyAgICAgICBhLnZhbHVlICAgICAgICAgICAgICAgYXMgdmFsdWVcbiAgICAgICMgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGFzIGJcbiAgICAgICMgICAgIGpvaW4gaHJkX3J1bnMgYXMgYSBvbiAoIGIucG9pbnQgaW4gKCBhLmxvLCBhLiBoaSApIClcbiAgICAgICMgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IGEua2V5IG9yZGVyIGJ5IGEuaW5vcm4gZGVzYyApIClcbiAgICAgICMgICBzZWxlY3QgKiBmcm9tIHJhbmtlZCB3aGVyZSB0cnVlIG9yICggcm4gPSAxICkgb3JkZXIgYnkga2V5IGFzYztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCIgY3JlYXRlIHZpZXcgaHJkX2JyZWFrcG9pbnRfZmFjZXRzIGFzXG4gICAgICAgIHNlbGVjdCAqXG4gICAgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGFzIGFcbiAgICAgICAgam9pbiBocmRfcnVucyBhcyBiIG9uICggYS5wb2ludCA9IGIubG8gb3IgYS5wb2ludCA9IGIuaGkgKVxuICAgICAgICBvcmRlciBieSBwb2ludCwgaW5vcm4gZGVzYztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9ydW5faW5vcm46XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfcnVuX2lub3JuKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6IC0+IEBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9qc29uX3F1b3RlOlxuICAgICAgIyAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICMgICB2YWx1ZTogKCB4ICkgLT4gSlNPTi5zdHJpbmdpZnkgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGF0ZW1lbnRzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgICB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgaW5vcm4sIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgU1FMXCJcIlwiZGVsZXRlIGZyb20gX2hyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuICAgICAgaHJkX2RlbGV0ZV9hbGxfcnVuczogIFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6IFNRTFwiXCJcIlxuICAgICAgICB3aXRoIHJhbmtlZCBhcyAoIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgICAgICAgICAgICAgIGFzIHJvd2lkLFxuICAgICAgICAgICAgYS5pbm9ybiAgICAgICAgICAgICAgIGFzIGlub3JuLFxuICAgICAgICAgICAgcm93X251bWJlcigpIG92ZXIgdyAgIGFzIHJuLFxuICAgICAgICAgICAgYS5sbyAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgIGFzIGZhY2V0LFxuICAgICAgICAgICAgYS5rZXkgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgICAgICAgICAgICAgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRwb2ludCApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkcG9pbnQgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IGEua2V5IG9yZGVyIGJ5IGEuaW5vcm4gZGVzYyApIClcbiAgICAgICAgc2VsZWN0ICogZnJvbSByYW5rZWQgd2hlcmUgKCBybiA9IDEgKSBvcmRlciBieSBrZXkgYXNjO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOiAtPiBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9ICggQHN0YXRlLmhyZF9ydW5faW5vcm4gPyAwIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZDogLT5cbiAgICAgICAgQHN0YXRlLmhyZF9ydW5faW5vcm4gPSBSID0gQF9ocmRfZ2V0X3J1bl9pbm9ybigpICsgMVxuICAgICAgICByZXR1cm4gXCJ0OmhyZDpydW5zOlI9I3tSfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmc6ICggbG8sIGhpLCBrZXksIHZhbHVlICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIHJldHVybiB7IGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5sb19oaSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiAoIGxvLCBoaSA9IG51bGwgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9jb3ZlcmluZ19ydW5zLCB7IGxvLCBoaSwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCwgeyBwb2ludCwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVsZXRlX3J1bnM6IC0+IEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfYWxsX3J1bnMucnVuKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVzY3JpYmVfcG9pbnQ6ICggcG9pbnQgKSAtPiBmcmVlemUgT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgICAgWyBrZXksIHZhbHVlLCBdIGZvciB7IGtleSwgdmFsdWUsIH0gZnJvbSBAaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQgcG9pbnQgKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
