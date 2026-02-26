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
        SQL`create view hrd_families as
select distinct
    a.key                       as key,
    a.value                     as value,
    a.facet                     as facet
  from hrd_runs as a
  order by key, value;`,
        //-----------------------------------------------------------------------------------------------------
        SQL`create view hrd_global_bounds as
select 'min' as bound, min( lo ) as point from hrd_runs union
select 'max' as bound, max( hi ) as point from hrd_runs
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
    and b.point + 1 <= ( select point from hrd_global_bounds where bound = 'max' )
  union all
  -- for each 'lo' breakpoint, the point just before
  select b.point - 1
  from hrd_breakpoints b, hrd_global_bounds g
  where b.bound = 'lo'
    and b.point - 1 >= ( select point from hrd_global_bounds where bound = 'min' )
)
order by point;`
      ],
      //-------------------------------------------------------------------------------------------------------
      // #-----------------------------------------------------------------------------------------------------
      // SQL""" create view hrd_breakpoint_facets as
      //   select *
      //   from hrd_breakpoints as a
      //   join hrd_runs as b on ( a.point = b.lo or a.point = b.hi )
      //   order by point, inorn desc;"""

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
        _hrd_find_families: SQL`select * from hrd_families;`,
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
        _hrd_get_families: function() {
          var R, facet, key, value, value_json, x;
          R = {};
          for (x of this.walk(this.statements._hrd_find_families)) {
            ({key, value, facet} = x);
            value_json = value;
            value = JSON.parse(value);
            R[facet] = {key, value, facet, value_json};
          }
          return R;
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
        hrd_get_min_max: function(point) {
          var R, row;
          R = {};
          for (row of this.walk(SQL`select bound, point from hrd_global_bounds order by bound desc;`)) {
            R[row.bound] = row.point;
          }
          return R;
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
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_facets_from_point: function(point) {
          var facet;
          return new Set((function() {
            var results, x;
            results = [];
            for (x of this.hrd_find_topruns_for_point(point)) {
              ({facet} = x);
              results.push(facet);
            }
            return results;
          }).call(this));
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_map_facets_of_inspection_points: function() {
          var R, point, x;
          R = new Map();
          for (x of this.walk(SQL`select * from hrd_inspection_points;`)) {
            ({point} = x);
            R.set(point, this._hrd_facets_from_point(point));
          }
          return R;
        },
        //-----------------------------------------------------------------------------------------------------
        _hrd_get_keyvalue_by_facet: function() {
          var R, facet, key, value, value_json, x;
          R = {};
          for (x of this.walk(SQL`select distinct facet, key, value from hrd_runs order by key, value;`)) {
            ({facet, key, value} = x);
            value_json = value;
            value = JSON.parse(value_json);
            R[facet] = {key, value, value_json};
          }
          return R;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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LENBQUMsQ0FBRSxLQUFGLENBQUQsR0FBYyxDQUFFLEdBQUYsRUFBTyxLQUFQLEVBQWMsVUFBZDtVQUhoQjtBQUlBLGlCQUFPO1FBTm1CO01BekU1QjtJQXZLRjtFQUxGLEVBakRGOzs7RUFnVEEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQWhUcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIF9ocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICBpbm9ybiAgIGludGVnZXIgbm90IG51bGwsIC0tIElOc2VydGlvbiBPUmRlciBOdW1iZXJcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGZhY2V0ICAgdGV4dCAgICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggcHJpbnRmKCAnJXM6JXMnLCBrZXksIHZhbHVlICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGlub3JuICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2xvX2hpXCIgICAgICAgb24gX2hyZF9ydW5zICggbG8sICBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICAgICAgICBvbiBfaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaW5vcm5fZGVzY1wiICBvbiBfaHJkX3J1bnMgKCBpbm9ybiBkZXNjICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiAgICAgICAgIG9uIF9ocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zIGFzIHNlbGVjdCAqIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIGhyZF9vbl9iZWZvcmVfaW5zZXJ0X3J1blxuICAgICAgICBpbnN0ZWFkIG9mIGluc2VydCBvbiBocmRfcnVuc1xuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgaW5zZXJ0IGludG8gX2hyZF9ydW5zICggcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXNcbiAgICAgICAgICAgICAgKCBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpLCBfaHJkX2dldF9ydW5faW5vcm4oKSwgbmV3LmxvLCBuZXcuaGksIG5ldy5rZXksIG5ldy52YWx1ZSApO1xuICAgICAgICAgICAgZW5kO1xuICAgICAgICA7XCJcIlwiXG5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgICAgICAgIGFzIGZhY2V0XG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ2xvYmFsX2JvdW5kcyBhc1xuICAgICAgICBzZWxlY3QgJ21pbicgYXMgYm91bmQsIG1pbiggbG8gKSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zIHVuaW9uXG4gICAgICAgIHNlbGVjdCAnbWF4JyBhcyBib3VuZCwgbWF4KCBoaSApIGFzIHBvaW50IGZyb20gaHJkX3J1bnNcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2JyZWFrcG9pbnRzIGFzXG4gICAgICAgIHNlbGVjdCAnbG8nIGFzIGJvdW5kLCBsbyBhcyBwb2ludCBmcm9tIGhyZF9ydW5zIHVuaW9uXG4gICAgICAgIHNlbGVjdCAnaGknIGFzIGJvdW5kLCBoaSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zXG4gICAgICAgIG9yZGVyIGJ5IHBvaW50O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9pbnNwZWN0aW9uX3BvaW50cyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3QgcG9pbnRcbiAgICAgICAgZnJvbSAoXG4gICAgICAgICAgLS0gYWxsIGJyZWFrcG9pbnRzIHRoZW1zZWx2ZXNcbiAgICAgICAgICBzZWxlY3QgcG9pbnQgZnJvbSBocmRfYnJlYWtwb2ludHNcbiAgICAgICAgICB1bmlvbiBhbGxcbiAgICAgICAgICAtLSBmb3IgZWFjaCAnaGknIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGFmdGVyXG4gICAgICAgICAgc2VsZWN0IGIucG9pbnQgKyAxXG4gICAgICAgICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYiwgaHJkX2dsb2JhbF9ib3VuZHMgZ1xuICAgICAgICAgIHdoZXJlIGIuYm91bmQgPSAnaGknXG4gICAgICAgICAgICBhbmQgYi5wb2ludCArIDEgPD0gKCBzZWxlY3QgcG9pbnQgZnJvbSBocmRfZ2xvYmFsX2JvdW5kcyB3aGVyZSBib3VuZCA9ICdtYXgnIClcbiAgICAgICAgICB1bmlvbiBhbGxcbiAgICAgICAgICAtLSBmb3IgZWFjaCAnbG8nIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGJlZm9yZVxuICAgICAgICAgIHNlbGVjdCBiLnBvaW50IC0gMVxuICAgICAgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGIsIGhyZF9nbG9iYWxfYm91bmRzIGdcbiAgICAgICAgICB3aGVyZSBiLmJvdW5kID0gJ2xvJ1xuICAgICAgICAgICAgYW5kIGIucG9pbnQgLSAxID49ICggc2VsZWN0IHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgd2hlcmUgYm91bmQgPSAnbWluJyApXG4gICAgICAgIClcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIFNRTFwiXCJcIiBjcmVhdGUgdmlldyBocmRfYnJlYWtwb2ludF9mYWNldHMgYXNcbiAgICAgICMgICBzZWxlY3QgKlxuICAgICAgIyAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGFzIGFcbiAgICAgICMgICBqb2luIGhyZF9ydW5zIGFzIGIgb24gKCBhLnBvaW50ID0gYi5sbyBvciBhLnBvaW50ID0gYi5oaSApXG4gICAgICAjICAgb3JkZXIgYnkgcG9pbnQsIGlub3JuIGRlc2M7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X3J1bl9pbm9ybigpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZpbmRfZmFtaWxpZXM6IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgICB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgaW5vcm4sIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgU1FMXCJcIlwiZGVsZXRlIGZyb20gX2hyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuICAgICAgaHJkX2RlbGV0ZV9hbGxfcnVuczogIFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6IFNRTFwiXCJcIlxuICAgICAgICB3aXRoIHJhbmtlZCBhcyAoIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgICAgICAgICAgICAgIGFzIHJvd2lkLFxuICAgICAgICAgICAgYS5pbm9ybiAgICAgICAgICAgICAgIGFzIGlub3JuLFxuICAgICAgICAgICAgcm93X251bWJlcigpIG92ZXIgdyAgIGFzIHJuLFxuICAgICAgICAgICAgYS5sbyAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgIGFzIGZhY2V0LFxuICAgICAgICAgICAgYS5rZXkgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgICAgICAgICAgICAgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRwb2ludCApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkcG9pbnQgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IGEua2V5IG9yZGVyIGJ5IGEuaW5vcm4gZGVzYyApIClcbiAgICAgICAgc2VsZWN0ICogZnJvbSByYW5rZWQgd2hlcmUgKCBybiA9IDEgKSBvcmRlciBieSBrZXkgYXNjO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOiAtPiBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9ICggQHN0YXRlLmhyZF9ydW5faW5vcm4gPyAwIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9mYW1pbGllczogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciB7IGtleSwgdmFsdWUsIGZhY2V0LCB9IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuX2hyZF9maW5kX2ZhbWlsaWVzXG4gICAgICAgICAgdmFsdWVfanNvbiAgPSB2YWx1ZVxuICAgICAgICAgIHZhbHVlICAgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICAgIFJbIGZhY2V0IF0gID0geyBrZXksIHZhbHVlLCBmYWNldCwgdmFsdWVfanNvbiwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPlxuICAgICAgICBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9IFIgPSBAX2hyZF9nZXRfcnVuX2lub3JuKCkgKyAxXG4gICAgICAgIHJldHVybiBcInQ6aHJkOnJ1bnM6Uj0je1J9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2FkZF9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICByZXR1cm4gQHN0YXRlbWVudHMuX2hyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmxvX2hpLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIGhyZF9maW5kX2NvdmVyaW5nX3J1bnM6ICggbG8sIGhpID0gbnVsbCApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2NvdmVyaW5nX3J1bnMsIHsgbG8sIGhpLCB9XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24sIHVzZSBjYXN0aW5nIG1ldGhvZCAjIyNcbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50LCB7IHBvaW50LCB9XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24sIHVzZSBjYXN0aW5nIG1ldGhvZCAjIyNcbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9kZWxldGVfcnVuczogLT4gQHN0YXRlbWVudHMuaHJkX2RlbGV0ZV9hbGxfcnVucy5ydW4oKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9nZXRfbWluX21heDogKCBwb2ludCApIC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgU1FMXCJzZWxlY3QgYm91bmQsIHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgb3JkZXIgYnkgYm91bmQgZGVzYztcIlxuICAgICAgICAgIFJbIHJvdy5ib3VuZCBdID0gcm93LnBvaW50XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2Rlc2NyaWJlX3BvaW50OiAoIHBvaW50ICkgLT4gZnJlZXplIE9iamVjdC5mcm9tRW50cmllcyAoIFxcXG4gICAgICAgIFsga2V5LCB2YWx1ZSwgXSBmb3IgeyBrZXksIHZhbHVlLCB9IGZyb20gQGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50IHBvaW50IClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZhY2V0c19mcm9tX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgICAgcmV0dXJuIG5ldyBTZXQgKCBmYWNldCBmb3IgeyBmYWNldCwgfSBmcm9tIEBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCBwb2ludCApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9tYXBfZmFjZXRzX29mX2luc3BlY3Rpb25fcG9pbnRzOiAtPlxuICAgICAgICBSID0gbmV3IE1hcCgpXG4gICAgICAgIGZvciB7IHBvaW50LCB9IGZyb20gQHdhbGsgU1FMXCJzZWxlY3QgKiBmcm9tIGhyZF9pbnNwZWN0aW9uX3BvaW50cztcIlxuICAgICAgICAgIFIuc2V0IHBvaW50LCBAX2hyZF9mYWNldHNfZnJvbV9wb2ludCBwb2ludFxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X2tleXZhbHVlX2J5X2ZhY2V0OiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIHsgZmFjZXQsIGtleSwgdmFsdWUsIH0gZnJvbSBAd2FsayBTUUxcInNlbGVjdCBkaXN0aW5jdCBmYWNldCwga2V5LCB2YWx1ZSBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcbiAgICAgICAgICB2YWx1ZV9qc29uICA9IHZhbHVlXG4gICAgICAgICAgdmFsdWUgICAgICAgPSBKU09OLnBhcnNlIHZhbHVlX2pzb25cbiAgICAgICAgICBSWyBmYWNldCBdICA9IHsga2V5LCB2YWx1ZSwgdmFsdWVfanNvbiwgfVxuICAgICAgICByZXR1cm4gUlxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
