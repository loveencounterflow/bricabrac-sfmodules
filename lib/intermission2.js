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
  unique ( rowid ),
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
  -- constraint "Ωhrd_constraint___4" check ( key regexp '.*' )
  -- constraint "Ωhrd_constraint___5" check ( key regexp '^\$x$|^[^$].+' )
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
;`
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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WUFDWixNQUFNO1VBSlI7aUJBS0M7UUFQcUIsQ0FwQnhCOztRQThCQSwwQkFBQSxFQUE0QixTQUFBLENBQUUsS0FBRixDQUFBO0FBQ2xDLGNBQUE7VUFBUSxLQUFBLHFFQUFBLEdBQUE7O1lBRUUsSUFBQSxDQUFLLEdBQUwsRUFBVSxZQUFWLEVBQXdCLEdBQUcsQ0FBQyxLQUE1QjtZQUNBLEdBQUcsQ0FBQyxLQUFKLEdBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsS0FBZjtZQUNaLE1BQU07VUFKUjtpQkFLQztRQU55QjtNQTlCNUI7SUFwSEY7RUFMRixFQXBERjs7O0VBb05BLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjO01BQUUsU0FBRjtNQUFhLEdBQWI7TUFBa0IsSUFBbEI7TUFBd0IsU0FBQSxFQUFXO0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUFwTnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gIGFkZF9ydW5fY2ZnOlxuICAgIGxvOiAgICAgICAwXG4gICAgaGk6ICAgICAgIG51bGxcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG4gIGhyZF9maW5kX2ZhbWlsaWVzOlxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIF9ocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICBpbm9ybiAgIGludGVnZXIgbm90IG51bGwsIC0tIElOc2VydGlvbiBPUmRlciBOdW1iZXJcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGZhY2V0ICAgdGV4dCAgICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggcHJpbnRmKCAnJXM6JXMnLCBrZXksIHZhbHVlICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggaW5vcm4gKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzRcIiBjaGVjayAoIGtleSByZWdleHAgJy4qJyApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX181XCIgY2hlY2sgKCBrZXkgcmVnZXhwICdeXFwkeCR8XlteJF0uKycgKVxuICAgICAgICApIHN0cmljdDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19sb19oaVwiICAgICAgIG9uIF9ocmRfcnVucyAoIGxvLCAgaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2hpXCIgICAgICAgICAgb24gX2hyZF9ydW5zICggaGkgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2lub3JuX2Rlc2NcIiAgb24gX2hyZF9ydW5zICggaW5vcm4gZGVzYyApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfa2V5XCIgICAgICAgICBvbiBfaHJkX3J1bnMgKCBrZXkgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfcnVucyBhcyBzZWxlY3QgKiBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdHJpZ2dlciBocmRfb25fYmVmb3JlX2luc2VydF9ydW5cbiAgICAgICAgaW5zdGVhZCBvZiBpbnNlcnQgb24gaHJkX3J1bnNcbiAgICAgICAgICBmb3IgZWFjaCByb3cgYmVnaW5cbiAgICAgICAgICAgIGluc2VydCBpbnRvIF9ocmRfcnVucyAoIHJvd2lkLCBpbm9ybiwgbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzXG4gICAgICAgICAgICAgICggX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKSwgX2hyZF9nZXRfcnVuX2lub3JuKCksIG5ldy5sbywgbmV3LmhpLCBuZXcua2V5LCBuZXcudmFsdWUgKTtcbiAgICAgICAgICAgIGVuZDtcbiAgICAgICAgO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X3J1bl9pbm9ybjpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6IC0+IEBfaHJkX2dldF9ydW5faW5vcm4oKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkKClcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9pbnNlcnRfcnVuOiBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHZhbHVlcyAoICRsbywgJGhpLCAka2V5LCAkdmFsdWUgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBpbm9ybiwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9kZWxldGVfcnVuOiBTUUxcIlwiXCJkZWxldGUgZnJvbSBfaHJkX3J1bnMgd2hlcmUgcm93aWQgPSAkcm93aWQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50OiBTUUxcIlwiXCJcbiAgICAgICAgd2l0aCByYW5rZWQgYXMgKCBzZWxlY3RcbiAgICAgICAgICAgIGEucm93aWQgICAgICAgICAgICAgICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEuaW5vcm4gICAgICAgICAgICAgICBhcyBpbm9ybixcbiAgICAgICAgICAgIHJvd19udW1iZXIoKSBvdmVyIHcgICBhcyBybixcbiAgICAgICAgICAgIGEubG8gICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgIGEuaGkgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgIGEuZmFjZXQgICAgICAgICAgICAgICBhcyBmYWNldCxcbiAgICAgICAgICAgIGEua2V5ICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgICAgICAgICAgICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkcG9pbnQgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJHBvaW50IClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSBhLmtleSBvcmRlciBieSBhLmlub3JuIGRlc2MgKSApXG4gICAgICAgIHNlbGVjdCAqIGZyb20gcmFua2VkIHdoZXJlICggcm4gPSAxICkgb3JkZXIgYnkga2V5IGFzYztcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNcbiAgICAgIF9ocmRfZ2V0X3J1bl9pbm9ybjogLT4gQHN0YXRlLmhyZF9ydW5faW5vcm4gPSAoIEBzdGF0ZS5ocmRfcnVuX2lub3JuID8gMCApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6IC0+XG4gICAgICAgIEBzdGF0ZS5ocmRfcnVuX2lub3JuID0gUiA9IEBfaHJkX2dldF9ydW5faW5vcm4oKSArIDFcbiAgICAgICAgcmV0dXJuIFwidDpocmQ6cnVuczpSPSN7Un1cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnOiAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgICByZXR1cm4geyBsbywgaGksIGtleSwgdmFsdWUsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5faHJkX2luc2VydF9ydW4ucnVuIEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9maW5kX2NvdmVyaW5nX3J1bnM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMubG9faGksIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogKCBsbywgaGkgPSBudWxsICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY292ZXJpbmdfcnVucywgeyBsbywgaGksIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQsIHsgcG9pbnQsIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
