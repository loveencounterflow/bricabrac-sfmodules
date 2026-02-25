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
order by point;`,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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LENBQUMsS0FBTCxDQUFXLFVBQVg7WUFDZCxDQUFDLENBQUUsS0FBRixDQUFELEdBQWMsQ0FBRSxHQUFGLEVBQU8sS0FBUCxFQUFjLFVBQWQ7VUFIaEI7QUFJQSxpQkFBTztRQU5tQjtNQXpFNUI7SUF2S0Y7RUFMRixFQWpERjs7O0VBZ1RBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjO01BQUUsU0FBRjtNQUFhLEdBQWI7TUFBa0IsSUFBbEI7TUFBd0IsU0FBQSxFQUFXO0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUFoVHBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gIGFkZF9ydW5fY2ZnOlxuICAgIGxvOiAgICAgICAwXG4gICAgaGk6ICAgICAgIG51bGxcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kYnJpY19wbHVnaW4gPVxuICBuYW1lOiAgICdocmRfaG9hcmRfcGx1Z2luJyAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBwcmVmaXg6ICdocmQnICAgICAgICAgICAgICAjIyMgTk9URSBpbmZvcm1hdGl2ZSwgbm90IGVuZm9yY2VkICMjI1xuICBleHBvcnRzOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogW1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBfaHJkX3J1bnMgKFxuICAgICAgICAgICAgcm93aWQgICB0ZXh0ICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgaW5vcm4gICBpbnRlZ2VyIG5vdCBudWxsLCAtLSBJTnNlcnRpb24gT1JkZXIgTnVtYmVyXG4gICAgICAgICAgICBsbyAgICAgIHJlYWwgICAgbm90IG51bGwsXG4gICAgICAgICAgICBoaSAgICAgIHJlYWwgICAgbm90IG51bGwsXG4gICAgICAgICAgICBmYWNldCAgIHRleHQgICAgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIHByaW50ZiggJyVzOiVzJywga2V5LCB2YWx1ZSApICkgc3RvcmVkLFxuICAgICAgICAgICAga2V5ICAgICB0ZXh0ICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgdmFsdWUgICB0ZXh0ICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLCAtLSBwcm9wZXIgZGF0YSB0eXBlIGlzIGBqc29uYCBidXQgZGVjbGFyZWQgYXMgYHRleHRgIGIvYyBvZiBgc3RyaWN0YFxuICAgICAgICAgIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCBpbm9ybiApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19sb19oaVwiICAgICAgIG9uIF9ocmRfcnVucyAoIGxvLCAgaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2hpXCIgICAgICAgICAgb24gX2hyZF9ydW5zICggaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2lub3JuX2Rlc2NcIiAgb24gX2hyZF9ydW5zICggaW5vcm4gZGVzYyApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfa2V5XCIgICAgICAgICBvbiBfaHJkX3J1bnMgKCBrZXkgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfcnVucyBhcyBzZWxlY3QgKiBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdHJpZ2dlciBocmRfb25fYmVmb3JlX2luc2VydF9ydW5cbiAgICAgICAgaW5zdGVhZCBvZiBpbnNlcnQgb24gaHJkX3J1bnNcbiAgICAgICAgICBmb3IgZWFjaCByb3cgYmVnaW5cbiAgICAgICAgICAgIGluc2VydCBpbnRvIF9ocmRfcnVucyAoIHJvd2lkLCBpbm9ybiwgbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzXG4gICAgICAgICAgICAgICggX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKSwgX2hyZF9nZXRfcnVuX2lub3JuKCksIG5ldy5sbywgbmV3LmhpLCBuZXcua2V5LCBuZXcudmFsdWUgKTtcbiAgICAgICAgICAgIGVuZDtcbiAgICAgICAgO1wiXCJcIlxuXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2ZhbWlsaWVzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgICAgICAgYS5rZXkgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGEuZmFjZXQgICAgICAgICAgICAgICAgICAgICBhcyBmYWNldFxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2dsb2JhbF9ib3VuZHMgYXNcbiAgICAgICAgc2VsZWN0ICdtaW4nIGFzIGJvdW5kLCBtaW4oIGxvICkgYXMgcG9pbnQgZnJvbSBocmRfcnVucyB1bmlvblxuICAgICAgICBzZWxlY3QgJ21heCcgYXMgYm91bmQsIG1heCggaGkgKSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zXG4gICAgICAgIG9yZGVyIGJ5IHBvaW50O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9icmVha3BvaW50cyBhc1xuICAgICAgICBzZWxlY3QgJ2xvJyBhcyBib3VuZCwgbG8gYXMgcG9pbnQgZnJvbSBocmRfcnVucyB1bmlvblxuICAgICAgICBzZWxlY3QgJ2hpJyBhcyBib3VuZCwgaGkgYXMgcG9pbnQgZnJvbSBocmRfcnVuc1xuICAgICAgICBvcmRlciBieSBwb2ludDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfaW5zcGVjdGlvbl9wb2ludHMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0IHBvaW50XG4gICAgICAgIGZyb20gKFxuICAgICAgICAgIC0tIGFsbCBicmVha3BvaW50cyB0aGVtc2VsdmVzXG4gICAgICAgICAgc2VsZWN0IHBvaW50IGZyb20gaHJkX2JyZWFrcG9pbnRzXG4gICAgICAgICAgdW5pb24gYWxsXG4gICAgICAgICAgLS0gZm9yIGVhY2ggJ2hpJyBicmVha3BvaW50LCB0aGUgcG9pbnQganVzdCBhZnRlclxuICAgICAgICAgIHNlbGVjdCBiLnBvaW50ICsgMVxuICAgICAgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGIsIGhyZF9nbG9iYWxfYm91bmRzIGdcbiAgICAgICAgICB3aGVyZSBiLmJvdW5kID0gJ2hpJ1xuICAgICAgICAgICAgYW5kIGIucG9pbnQgKyAxIDw9ICggc2VsZWN0IHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgd2hlcmUgYm91bmQgPSAnbWF4JyApXG4gICAgICAgICAgdW5pb24gYWxsXG4gICAgICAgICAgLS0gZm9yIGVhY2ggJ2xvJyBicmVha3BvaW50LCB0aGUgcG9pbnQganVzdCBiZWZvcmVcbiAgICAgICAgICBzZWxlY3QgYi5wb2ludCAtIDFcbiAgICAgICAgICBmcm9tIGhyZF9icmVha3BvaW50cyBiLCBocmRfZ2xvYmFsX2JvdW5kcyBnXG4gICAgICAgICAgd2hlcmUgYi5ib3VuZCA9ICdsbydcbiAgICAgICAgICAgIGFuZCBiLnBvaW50IC0gMSA+PSAoIHNlbGVjdCBwb2ludCBmcm9tIGhyZF9nbG9iYWxfYm91bmRzIHdoZXJlIGJvdW5kID0gJ21pbicgKVxuICAgICAgICApXG4gICAgICAgIG9yZGVyIGJ5IHBvaW50O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcIiBjcmVhdGUgdmlldyBocmRfYnJlYWtwb2ludF9mYWNldHMgYXNcbiAgICAgICAgc2VsZWN0ICpcbiAgICAgICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYXMgYVxuICAgICAgICBqb2luIGhyZF9ydW5zIGFzIGIgb24gKCBhLnBvaW50ID0gYi5sbyBvciBhLnBvaW50ID0gYi5oaSApXG4gICAgICAgIG9yZGVyIGJ5IHBvaW50LCBpbm9ybiBkZXNjO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X3J1bl9pbm9ybjpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6IC0+IEBfaHJkX2dldF9ydW5faW5vcm4oKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkKClcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9maW5kX2ZhbWlsaWVzOiBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2luc2VydF9ydW46IFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBocmRfcnVucyAoIGxvLCBoaSwga2V5LCB2YWx1ZSApXG4gICAgICAgICAgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2RlbGV0ZV9ydW46ICAgICAgIFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucyB3aGVyZSByb3dpZCA9ICRyb3dpZDtcIlwiXCJcbiAgICAgIGhyZF9kZWxldGVfYWxsX3J1bnM6ICBTUUxcIlwiXCJkZWxldGUgZnJvbSBfaHJkX3J1bnM7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50OiBTUUxcIlwiXCJcbiAgICAgICAgd2l0aCByYW5rZWQgYXMgKCBzZWxlY3RcbiAgICAgICAgICAgIGEucm93aWQgICAgICAgICAgICAgICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEuaW5vcm4gICAgICAgICAgICAgICBhcyBpbm9ybixcbiAgICAgICAgICAgIHJvd19udW1iZXIoKSBvdmVyIHcgICBhcyBybixcbiAgICAgICAgICAgIGEubG8gICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgIGEuaGkgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgIGEuZmFjZXQgICAgICAgICAgICAgICBhcyBmYWNldCxcbiAgICAgICAgICAgIGEua2V5ICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgICAgICAgICAgICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkcG9pbnQgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJHBvaW50IClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSBhLmtleSBvcmRlciBieSBhLmlub3JuIGRlc2MgKSApXG4gICAgICAgIHNlbGVjdCAqIGZyb20gcmFua2VkIHdoZXJlICggcm4gPSAxICkgb3JkZXIgYnkga2V5IGFzYztcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNcbiAgICAgIF9ocmRfZ2V0X3J1bl9pbm9ybjogLT4gQHN0YXRlLmhyZF9ydW5faW5vcm4gPSAoIEBzdGF0ZS5ocmRfcnVuX2lub3JuID8gMCApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfZmFtaWxpZXM6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgeyBrZXksIHZhbHVlLCBmYWNldCwgfSBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLl9ocmRfZmluZF9mYW1pbGllc1xuICAgICAgICAgIHZhbHVlX2pzb24gID0gdmFsdWVcbiAgICAgICAgICB2YWx1ZSAgICAgICA9IEpTT04ucGFyc2UgdmFsdWVcbiAgICAgICAgICBSWyBmYWNldCBdICA9IHsga2V5LCB2YWx1ZSwgZmFjZXQsIHZhbHVlX2pzb24sIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZDogLT5cbiAgICAgICAgQHN0YXRlLmhyZF9ydW5faW5vcm4gPSBSID0gQF9ocmRfZ2V0X3J1bl9pbm9ybigpICsgMVxuICAgICAgICByZXR1cm4gXCJ0OmhyZDpydW5zOlI9I3tSfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmc6ICggbG8sIGhpLCBrZXksIHZhbHVlICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIHJldHVybiB7IGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5sb19oaSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiAoIGxvLCBoaSA9IG51bGwgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9jb3ZlcmluZ19ydW5zLCB7IGxvLCBoaSwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCwgeyBwb2ludCwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVsZXRlX3J1bnM6IC0+IEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfYWxsX3J1bnMucnVuKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZ2V0X21pbl9tYXg6ICggcG9pbnQgKSAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIFNRTFwic2VsZWN0IGJvdW5kLCBwb2ludCBmcm9tIGhyZF9nbG9iYWxfYm91bmRzIG9yZGVyIGJ5IGJvdW5kIGRlc2M7XCJcbiAgICAgICAgICBSWyByb3cuYm91bmQgXSA9IHJvdy5wb2ludFxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9kZXNjcmliZV9wb2ludDogKCBwb2ludCApIC0+IGZyZWV6ZSBPYmplY3QuZnJvbUVudHJpZXMgKCBcXFxuICAgICAgICBbIGtleSwgdmFsdWUsIF0gZm9yIHsga2V5LCB2YWx1ZSwgfSBmcm9tIEBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCBwb2ludCApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9mYWNldHNfZnJvbV9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICAgIHJldHVybiBuZXcgU2V0ICggZmFjZXQgZm9yIHsgZmFjZXQsIH0gZnJvbSBAaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQgcG9pbnQgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfbWFwX2ZhY2V0c19vZl9pbnNwZWN0aW9uX3BvaW50czogLT5cbiAgICAgICAgUiA9IG5ldyBNYXAoKVxuICAgICAgICBmb3IgeyBwb2ludCwgfSBmcm9tIEB3YWxrIFNRTFwic2VsZWN0ICogZnJvbSBocmRfaW5zcGVjdGlvbl9wb2ludHM7XCJcbiAgICAgICAgICBSLnNldCBwb2ludCwgQF9ocmRfZmFjZXRzX2Zyb21fcG9pbnQgcG9pbnRcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9rZXl2YWx1ZV9ieV9mYWNldDogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciB7IGZhY2V0LCBrZXksIHZhbHVlLCB9IGZyb20gQHdhbGsgU1FMXCJzZWxlY3QgZGlzdGluY3QgZmFjZXQsIGtleSwgdmFsdWUgZnJvbSBocmRfcnVucyBvcmRlciBieSBrZXksIHZhbHVlO1wiXG4gICAgICAgICAgdmFsdWVfanNvbiAgPSB2YWx1ZVxuICAgICAgICAgIHZhbHVlICAgICAgID0gSlNPTi5wYXJzZSB2YWx1ZV9qc29uXG4gICAgICAgICAgUlsgZmFjZXQgXSAgPSB7IGtleSwgdmFsdWUsIHZhbHVlX2pzb24sIH1cbiAgICAgICAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgSUZOLCBsZXRzLCB0eXBlc3BhY2U6IFQsIH1cbiAgcmV0dXJuIHtcbiAgICBkYnJpY19wbHVnaW4sXG4gIH1cblxuXG4iXX0=
