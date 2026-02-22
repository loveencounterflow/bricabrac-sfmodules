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
        hrd_find_runs: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        _hrd_find_runs_of_family_sorted: SQL`select rowid, lo, hi, key, value
  from hrd_runs
  where true
    and ( key   = $key    )
    and ( value = $value  )
  order by lo, hi, key;`,
        //-----------------------------------------------------------------------------------------------------
        hrd_delete_run: SQL`delete from _hrd_runs where rowid = $rowid;`,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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O01BbkI1QjtJQXBIRjtFQUxGLEVBcERGOzs7RUF5TUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQXpNcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcbiAgaHJkX2ZpbmRfZmFtaWxpZXM6XG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGJyaWNfcGx1Z2luID1cbiAgbmFtZTogICAnaHJkX2hvYXJkX3BsdWdpbicgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgcHJlZml4OiAnaHJkJyAgICAgICAgICAgICAgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgZXhwb3J0czpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IFtcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgX2hyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGlub3JuICAgaW50ZWdlciBub3QgbnVsbCwgLS0gSU5zZXJ0aW9uIE9SZGVyIE51bWJlclxuICAgICAgICAgICAgbG8gICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgZmFjZXQgICB0ZXh0ICAgIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBwcmludGYoICclczolcycsIGtleSwgdmFsdWUgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGtleSAgICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIHZhbHVlICAgdGV4dCAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJywgLS0gcHJvcGVyIGRhdGEgdHlwZSBpcyBganNvbmAgYnV0IGRlY2xhcmVkIGFzIGB0ZXh0YCBiL2Mgb2YgYHN0cmljdGBcbiAgICAgICAgICBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggcm93aWQgKSxcbiAgICAgICAgICB1bmlxdWUgKCBpbm9ybiApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMVwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBsbyApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggbG8gPSBjYXN0KCBsbyBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBsbyApXG4gICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fMlwiIGNoZWNrIChcbiAgICAgICAgICAgICggYWJzKCBoaSApID0gOWU5OTkgKSBvciAoXG4gICAgICAgICAgICAgICggaGkgPSBjYXN0KCBoaSBhcyBpbnRlZ2VyICkgKVxuICAgICAgICAgICAgICBhbmQgKCAgICAgICAje051bWJlci5NSU5fU0FGRV9JTlRFR0VSfSA8PSBoaSApXG4gICAgICAgICAgICAgIGFuZCAoIGhpIDw9ICN7TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJ9ICkgKSApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fM1wiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNFwiIGNoZWNrICgga2V5IHJlZ2V4cCAnLionIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzVcIiBjaGVjayAoIGtleSByZWdleHAgJ15cXCR4JHxeW14kXS4rJyApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2xvX2hpXCIgICAgICAgb24gX2hyZF9ydW5zICggbG8sICBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICAgICAgICBvbiBfaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaW5vcm5fZGVzY1wiICBvbiBfaHJkX3J1bnMgKCBpbm9ybiBkZXNjICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiAgICAgICAgIG9uIF9ocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zIGFzIHNlbGVjdCAqIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIGhyZF9vbl9iZWZvcmVfaW5zZXJ0X3J1blxuICAgICAgICBpbnN0ZWFkIG9mIGluc2VydCBvbiBocmRfcnVuc1xuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgaW5zZXJ0IGludG8gX2hyZF9ydW5zICggcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXNcbiAgICAgICAgICAgICAgKCBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpLCBfaHJkX2dldF9ydW5faW5vcm4oKSwgbmV3LmxvLCBuZXcuaGksIG5ldy5rZXksIG5ldy52YWx1ZSApO1xuICAgICAgICAgICAgZW5kO1xuICAgICAgICA7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X3J1bl9pbm9ybigpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2luc2VydF9ydW46IFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBocmRfcnVucyAoIGxvLCBoaSwga2V5LCB2YWx1ZSApXG4gICAgICAgICAgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZpbmRfcnVuc19vZl9mYW1pbHlfc29ydGVkOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICgga2V5ICAgPSAka2V5ICAgIClcbiAgICAgICAgICAgIGFuZCAoIHZhbHVlID0gJHZhbHVlICApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2RlbGV0ZV9ydW46IFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucyB3aGVyZSByb3dpZCA9ICRyb3dpZDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogU1FMXCJcIlwiXG4gICAgICAgIHdpdGggcmFua2VkIGFzICggc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICAgICAgICAgICAgICAgYXMgcm93aWQsXG4gICAgICAgICAgICBhLmlub3JuICAgICAgICAgICAgICAgYXMgaW5vcm4sXG4gICAgICAgICAgICByb3dfbnVtYmVyKCkgb3ZlciB3ICAgYXMgcm4sXG4gICAgICAgICAgICBhLmxvICAgICAgICAgICAgICAgICAgYXMgbG8sXG4gICAgICAgICAgICBhLmhpICAgICAgICAgICAgICAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmZhY2V0ICAgICAgICAgICAgICAgYXMgZmFjZXQsXG4gICAgICAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgICAgICAgICAgICAgIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJHBvaW50IClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRwb2ludCApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgYS5rZXkgb3JkZXIgYnkgYS5pbm9ybiBkZXNjICkgKVxuICAgICAgICBzZWxlY3QgKiBmcm9tIHJhbmtlZCB3aGVyZSAoIHJuID0gMSApIG9yZGVyIGJ5IGtleSBhc2M7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1ldGhvZHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zXG4gICAgICBfaHJkX2dldF9ydW5faW5vcm46IC0+IEBzdGF0ZS5ocmRfcnVuX2lub3JuID0gKCBAc3RhdGUuaHJkX3J1bl9pbm9ybiA/IDAgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPlxuICAgICAgICBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9IFIgPSBAX2hyZF9nZXRfcnVuX2lub3JuKCkgKyAxXG4gICAgICAgIHJldHVybiBcInQ6aHJkOnJ1bnM6Uj0je1J9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2FkZF9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICByZXR1cm4gQHN0YXRlbWVudHMuX2hyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQsIHsgcG9pbnQsIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
