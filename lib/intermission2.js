(function() {
  'use strict';
  var Dbric, Dbric_std, False, GUY, Hoard, IDN, IFN, LIT, SQL, T, True, VEC, as_bool, dbric_hoard_plugin, debug, echo, f, freeze, from_bool, hide, lets, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, templates, type_of;

  GUY = require('../../guy');

  ({
    //===========================================================================================================
    debug,
    log: echo
  } = console);

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
  dbric_hoard_plugin = {
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
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_visualize: function({lo, hi}) {
          var chr, cid, color, colors, delta, facet_from_row, facets_from_rows, first, gfph, global_facet, global_facets, global_width, i, id, last, left, line, local_keys, max, mid, min, point, points, prv_point, ref, ref1, right, row, row_count, statement, x;
          ({min, max} = this.hrd_get_min_max());
          if (lo == null) {
            lo = Math.max(min, 0);
          }
          if (hi == null) {
            hi = Math.min(max, +100);
          }
          facet_from_row = function(row) {
            return `${row.key}:${row.value_json}`;
          };
          facets_from_rows = function(rows) {
            var row;
            return new Set([
              ...(new Set((function() {
                var results;
                results = [];
                for (row of rows) {
                  results.push(facet_from_row(row));
                }
                return results;
              })()))
            ].sort());
          };
          global_facets = facets_from_rows(this.hrd_find_covering_runs(lo, hi));
          global_width = hi - lo;
          colors = {
            fallback: function(...P) {
              return GUY.trm.grey(...P);
            },
            warn: function(...P) {
              return GUY.trm.red(...P);
            },
            in: function(...P) {
              return GUY.trm.gold(...P);
            },
            out: function(...P) {
              return GUY.trm.blue(...P);
            },
            run: function(...P) {
              return GUY.trm.grey(...P);
            }
          };
          //...................................................................................................
          ({row_count} = this.get_first(SQL`select count(*) as row_count from hrd_runs;`));
          echo();
          echo(GUY.trm.white(GUY.trm.reverse(GUY.trm.bold(` hoard with ${row_count} runs `))));
//...................................................................................................
          for (global_facet of global_facets) {
            gfph = ' '.repeat(global_facet.length);
            //.................................................................................................
            statement = SQL`select * from hrd_runs
  where true
    and ( facet = $global_facet )
    and ( lo <= $hi )
    and ( hi >= $lo )
  -- order by hi - lo asc, lo desc, key, value
  order by inorn desc
  ;`;
            //.................................................................................................
            points = '';
            for (cid = i = ref = lo, ref1 = hi; (ref <= ref1 ? i <= ref1 : i >= ref1); cid = ref <= ref1 ? ++i : --i) {
              local_keys = facets_from_rows(this.hrd_find_covering_runs(cid));
              chr = String.fromCodePoint(cid);
              color = (local_keys.has(global_facet)) ? colors.in : colors.out;
              points += color(chr);
            }
            echo(f`${global_facet}:<15c; ${' '}:>6c; ${points}`);
//.................................................................................................
            for (row of this.walk(statement, {global_facet, lo, hi})) {
              id = row.rowid.replace(/^.*?=(\d+)/, '[$1]');
              first = (Math.max(row.lo, lo)) - lo;
              last = (Math.min(row.hi, hi)) - lo;
              left = GUY.trm.grey(GUY.trm.reverse('🮊'.repeat(first)));
              // left        = GUY.trm.grey '│'.repeat first
              mid = GUY.trm.gold('🮊'.repeat(last - first + 1));
              // mid         = GUY.trm.gold '♦'.repeat last - first + 1
              // mid         = GUY.trm.gold '█'.repeat last - first + 1
              right = GUY.trm.grey(GUY.trm.reverse('🮊'.repeat(global_width - last + 1)));
              echo(colors.run(f`${gfph}:<15c; ${id}:>6c; ${left}${mid}${right}`));
            }
          }
          //...................................................................................................
          prv_point = 0;
          line = '';
          for (x of this.walk(SQL`select * from hrd_inspection_points;`)) {
            ({point} = x);
            point -= lo;
            delta = Math.max(0, point - prv_point - 1);
            line += ' '.repeat(delta);
            line += GUY.trm.gold((function() {
              switch (point) {
                case min:
                  return '[';
                case max:
                  return ']';
                default:
                  return '▲';
              }
            })());
            prv_point = point;
          }
          echo(colors.run(f`${gfph}:<15c; ${''}:>6c; ${line}`));
          //...................................................................................................
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_regularize: function() {
          var facets, facets_by_point, keyvalue_by_facet, lopoints/* TAINT use _get_facets */, max, min, new_runs;
          /* Rewrite runs so no overlapping families exist within a clan */
          this.with_;
          ({min, max} = this.hrd_get_min_max());
          keyvalue_by_facet = this._hrd_get_keyvalue_by_facet();
          facets_by_point = this._hrd_map_facets_of_inspection_points();
          facets = Object.keys(this._hrd_get_families());
          lopoints = {};
          new_runs = [];
          //...................................................................................................
          this.with_transaction(() => {
            var chr, facet, hi, i, key, len, lo, point, point_facets, value, x, y;
//.................................................................................................
            for (i = 0, len = facets.length; i < len; i++) {
              facet = facets[i];
              for (x of facets_by_point) {
                [point, point_facets] = x;
                chr = String.fromCodePoint(point);
                if (point_facets.has(facet)) {
                  if (lopoints[facet] == null) {
                    lopoints[facet] = point;
                  }
                } else if (lopoints[facet] != null) {
                  ({key, value} = keyvalue_by_facet[facet]);
                  new_runs.push({
                    facet,
                    key,
                    value,
                    lo: lopoints[facet],
                    hi: point - 1
                  });
                  lopoints[facet] = null;
                }
              }
            }
//.................................................................................................
            for (facet in lopoints) {
              lo = lopoints[facet];
              if (!(lo != null)) {
                continue;
              }
              ({key, value} = keyvalue_by_facet[facet]);
              new_runs.push({
                facet,
                key,
                value,
                lo,
                hi: max
              });
            }
            this.hrd_delete_runs();
            for (y of new_runs) {
              ({facet, key, value, lo, hi} = y);
              //.................................................................................................
              this.hrd_add_run(lo, hi, key, value);
            }
            return null;
          });
          //...................................................................................................
          return null;
        }
      }
    }
  };

  Hoard = (function() {
    //===========================================================================================================
    class Hoard extends Dbric_std {};

    Hoard.plugins = [dbric_hoard_plugin];

    return Hoard;

  }).call(this);

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = Object.freeze({
      templates,
      IFN,
      lets,
      typespace: T
    });
    return {dbric_hoard_plugin, Hoard, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxrQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsU0FBQSxFQUFBOztFQUVBLEdBQUEsR0FBTSxPQUFBLENBQVEsV0FBUjs7RUFHTixDQUFBLENBQUE7O0lBQUUsS0FBRjtJQUNFLEdBQUEsRUFBSztFQURQLENBQUEsR0FDNEIsT0FENUI7O0VBRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx1Q0FBUjs7RUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFUQTs7O0VBV0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsOEJBQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsWUFERixFQUVFLG1CQUZG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QUFBO0FBN1pwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbkdVWSA9IHJlcXVpcmUgJy4uLy4uL2d1eSdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICBsb2c6IGVjaG8sICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX2hvYXJkX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIF9ocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICBpbm9ybiAgIGludGVnZXIgbm90IG51bGwsIC0tIElOc2VydGlvbiBPUmRlciBOdW1iZXJcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGZhY2V0ICAgdGV4dCAgICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggcHJpbnRmKCAnJXM6JXMnLCBrZXksIHZhbHVlICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIGlub3JuICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18xXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGxvICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBsbyA9IGNhc3QoIGxvIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGxvIClcbiAgICAgICAgICAgICAgYW5kICggbG8gPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18yXCIgY2hlY2sgKFxuICAgICAgICAgICAgKCBhYnMoIGhpICkgPSA5ZTk5OSApIG9yIChcbiAgICAgICAgICAgICAgKCBoaSA9IGNhc3QoIGhpIGFzIGludGVnZXIgKSApXG4gICAgICAgICAgICAgIGFuZCAoICAgICAgICN7TnVtYmVyLk1JTl9TQUZFX0lOVEVHRVJ9IDw9IGhpIClcbiAgICAgICAgICAgICAgYW5kICggaGkgPD0gI3tOdW1iZXIuTUFYX1NBRkVfSU5URUdFUn0gKSApICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX18zXCIgY2hlY2sgKCBsbyA8PSBoaSApXG4gICAgICAgICkgc3RyaWN0O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2xvX2hpXCIgICAgICAgb24gX2hyZF9ydW5zICggbG8sICBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICAgICAgICBvbiBfaHJkX3J1bnMgKCBoaSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaW5vcm5fZGVzY1wiICBvbiBfaHJkX3J1bnMgKCBpbm9ybiBkZXNjICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19rZXlcIiAgICAgICAgIG9uIF9ocmRfcnVucyAoIGtleSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zIGFzIHNlbGVjdCAqIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIGhyZF9vbl9iZWZvcmVfaW5zZXJ0X3J1blxuICAgICAgICBpbnN0ZWFkIG9mIGluc2VydCBvbiBocmRfcnVuc1xuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgaW5zZXJ0IGludG8gX2hyZF9ydW5zICggcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXNcbiAgICAgICAgICAgICAgKCBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpLCBfaHJkX2dldF9ydW5faW5vcm4oKSwgbmV3LmxvLCBuZXcuaGksIG5ldy5rZXksIG5ldy52YWx1ZSApO1xuICAgICAgICAgICAgZW5kO1xuICAgICAgICA7XCJcIlwiXG5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgICAgICAgIGFzIGZhY2V0XG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZ2xvYmFsX2JvdW5kcyBhc1xuICAgICAgICBzZWxlY3QgJ21pbicgYXMgYm91bmQsIG1pbiggbG8gKSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zIHVuaW9uXG4gICAgICAgIHNlbGVjdCAnbWF4JyBhcyBib3VuZCwgbWF4KCBoaSApIGFzIHBvaW50IGZyb20gaHJkX3J1bnNcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2JyZWFrcG9pbnRzIGFzXG4gICAgICAgIHNlbGVjdCAnbG8nIGFzIGJvdW5kLCBsbyBhcyBwb2ludCBmcm9tIGhyZF9ydW5zIHVuaW9uXG4gICAgICAgIHNlbGVjdCAnaGknIGFzIGJvdW5kLCBoaSBhcyBwb2ludCBmcm9tIGhyZF9ydW5zXG4gICAgICAgIG9yZGVyIGJ5IHBvaW50O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9pbnNwZWN0aW9uX3BvaW50cyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3QgcG9pbnRcbiAgICAgICAgZnJvbSAoXG4gICAgICAgICAgLS0gYWxsIGJyZWFrcG9pbnRzIHRoZW1zZWx2ZXNcbiAgICAgICAgICBzZWxlY3QgcG9pbnQgZnJvbSBocmRfYnJlYWtwb2ludHNcbiAgICAgICAgICB1bmlvbiBhbGxcbiAgICAgICAgICAtLSBmb3IgZWFjaCAnaGknIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGFmdGVyXG4gICAgICAgICAgc2VsZWN0IGIucG9pbnQgKyAxXG4gICAgICAgICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYiwgaHJkX2dsb2JhbF9ib3VuZHMgZ1xuICAgICAgICAgIHdoZXJlIGIuYm91bmQgPSAnaGknXG4gICAgICAgICAgICBhbmQgYi5wb2ludCArIDEgPD0gKCBzZWxlY3QgcG9pbnQgZnJvbSBocmRfZ2xvYmFsX2JvdW5kcyB3aGVyZSBib3VuZCA9ICdtYXgnIClcbiAgICAgICAgICB1bmlvbiBhbGxcbiAgICAgICAgICAtLSBmb3IgZWFjaCAnbG8nIGJyZWFrcG9pbnQsIHRoZSBwb2ludCBqdXN0IGJlZm9yZVxuICAgICAgICAgIHNlbGVjdCBiLnBvaW50IC0gMVxuICAgICAgICAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGIsIGhyZF9nbG9iYWxfYm91bmRzIGdcbiAgICAgICAgICB3aGVyZSBiLmJvdW5kID0gJ2xvJ1xuICAgICAgICAgICAgYW5kIGIucG9pbnQgLSAxID49ICggc2VsZWN0IHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgd2hlcmUgYm91bmQgPSAnbWluJyApXG4gICAgICAgIClcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIFNRTFwiXCJcIiBjcmVhdGUgdmlldyBocmRfYnJlYWtwb2ludF9mYWNldHMgYXNcbiAgICAgICMgICBzZWxlY3QgKlxuICAgICAgIyAgIGZyb20gaHJkX2JyZWFrcG9pbnRzIGFzIGFcbiAgICAgICMgICBqb2luIGhyZF9ydW5zIGFzIGIgb24gKCBhLnBvaW50ID0gYi5sbyBvciBhLnBvaW50ID0gYi5oaSApXG4gICAgICAjICAgb3JkZXIgYnkgcG9pbnQsIGlub3JuIGRlc2M7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X3J1bl9pbm9ybigpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZpbmRfZmFtaWxpZXM6IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfaW5zZXJ0X3J1bjogU1FMXCJcIlwiXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgICB2YWx1ZXMgKCAkbG8sICRoaSwgJGtleSwgJHZhbHVlICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgaW5vcm4sIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgU1FMXCJcIlwiZGVsZXRlIGZyb20gX2hyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuICAgICAgaHJkX2RlbGV0ZV9hbGxfcnVuczogIFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6IFNRTFwiXCJcIlxuICAgICAgICB3aXRoIHJhbmtlZCBhcyAoIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgICAgICAgICAgICAgIGFzIHJvd2lkLFxuICAgICAgICAgICAgYS5pbm9ybiAgICAgICAgICAgICAgIGFzIGlub3JuLFxuICAgICAgICAgICAgcm93X251bWJlcigpIG92ZXIgdyAgIGFzIHJuLFxuICAgICAgICAgICAgYS5sbyAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgYS5mYWNldCAgICAgICAgICAgICAgIGFzIGZhY2V0LFxuICAgICAgICAgICAgYS5rZXkgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgICAgICAgICAgICAgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRwb2ludCApXG4gICAgICAgICAgICBhbmQgKCBoaSA+PSAkcG9pbnQgKVxuICAgICAgICAgIHdpbmRvdyB3IGFzICggcGFydGl0aW9uIGJ5IGEua2V5IG9yZGVyIGJ5IGEuaW5vcm4gZGVzYyApIClcbiAgICAgICAgc2VsZWN0ICogZnJvbSByYW5rZWQgd2hlcmUgKCBybiA9IDEgKSBvcmRlciBieSBrZXkgYXNjO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtZXRob2RzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6ICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOiAtPiBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9ICggQHN0YXRlLmhyZF9ydW5faW5vcm4gPyAwIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9mYW1pbGllczogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciB7IGtleSwgdmFsdWUsIGZhY2V0LCB9IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuX2hyZF9maW5kX2ZhbWlsaWVzXG4gICAgICAgICAgdmFsdWVfanNvbiAgPSB2YWx1ZVxuICAgICAgICAgIHZhbHVlICAgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICAgIFJbIGZhY2V0IF0gID0geyBrZXksIHZhbHVlLCBmYWNldCwgdmFsdWVfanNvbiwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPlxuICAgICAgICBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9IFIgPSBAX2hyZF9nZXRfcnVuX2lub3JuKCkgKyAxXG4gICAgICAgIHJldHVybiBcInQ6aHJkOnJ1bnM6Uj0je1J9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2FkZF9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICByZXR1cm4gQHN0YXRlbWVudHMuX2hyZF9pbnNlcnRfcnVuLnJ1biBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfZmluZF9jb3ZlcmluZ19ydW5zOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmxvX2hpLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIGhyZF9maW5kX2NvdmVyaW5nX3J1bnM6ICggbG8sIGhpID0gbnVsbCApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX2NvdmVyaW5nX3J1bnMsIHsgbG8sIGhpLCB9XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24sIHVzZSBjYXN0aW5nIG1ldGhvZCAjIyNcbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50LCB7IHBvaW50LCB9XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24sIHVzZSBjYXN0aW5nIG1ldGhvZCAjIyNcbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9kZWxldGVfcnVuczogLT4gQHN0YXRlbWVudHMuaHJkX2RlbGV0ZV9hbGxfcnVucy5ydW4oKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9nZXRfbWluX21heDogKCBwb2ludCApIC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgU1FMXCJzZWxlY3QgYm91bmQsIHBvaW50IGZyb20gaHJkX2dsb2JhbF9ib3VuZHMgb3JkZXIgYnkgYm91bmQgZGVzYztcIlxuICAgICAgICAgIFJbIHJvdy5ib3VuZCBdID0gcm93LnBvaW50XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2Rlc2NyaWJlX3BvaW50OiAoIHBvaW50ICkgLT4gZnJlZXplIE9iamVjdC5mcm9tRW50cmllcyAoIFxcXG4gICAgICAgIFsga2V5LCB2YWx1ZSwgXSBmb3IgeyBrZXksIHZhbHVlLCB9IGZyb20gQGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50IHBvaW50IClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZhY2V0c19mcm9tX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgICAgcmV0dXJuIG5ldyBTZXQgKCBmYWNldCBmb3IgeyBmYWNldCwgfSBmcm9tIEBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCBwb2ludCApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9tYXBfZmFjZXRzX29mX2luc3BlY3Rpb25fcG9pbnRzOiAtPlxuICAgICAgICBSID0gbmV3IE1hcCgpXG4gICAgICAgIGZvciB7IHBvaW50LCB9IGZyb20gQHdhbGsgU1FMXCJzZWxlY3QgKiBmcm9tIGhyZF9pbnNwZWN0aW9uX3BvaW50cztcIlxuICAgICAgICAgIFIuc2V0IHBvaW50LCBAX2hyZF9mYWNldHNfZnJvbV9wb2ludCBwb2ludFxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X2tleXZhbHVlX2J5X2ZhY2V0OiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIHsgZmFjZXQsIGtleSwgdmFsdWUsIH0gZnJvbSBAd2FsayBTUUxcInNlbGVjdCBkaXN0aW5jdCBmYWNldCwga2V5LCB2YWx1ZSBmcm9tIGhyZF9ydW5zIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcbiAgICAgICAgICB2YWx1ZV9qc29uICA9IHZhbHVlXG4gICAgICAgICAgdmFsdWUgICAgICAgPSBKU09OLnBhcnNlIHZhbHVlX2pzb25cbiAgICAgICAgICBSWyBmYWNldCBdICA9IHsga2V5LCB2YWx1ZSwgdmFsdWVfanNvbiwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF92aXN1YWxpemU6ICh7IGxvLCBoaSwgfSkgLT5cbiAgICAgICAgeyBtaW4sIG1heCwgfSAgICAgPSBAaHJkX2dldF9taW5fbWF4KClcbiAgICAgICAgbG8gICAgICAgICAgICAgICA/PSBNYXRoLm1heCBtaW4sIDBcbiAgICAgICAgaGkgICAgICAgICAgICAgICA/PSBNYXRoLm1pbiBtYXgsICsxMDBcbiAgICAgICAgZmFjZXRfZnJvbV9yb3cgICAgPSAoIHJvdyApIC0+IFwiI3tyb3cua2V5fToje3Jvdy52YWx1ZV9qc29ufVwiXG4gICAgICAgIGZhY2V0c19mcm9tX3Jvd3MgID0gKCByb3dzICkgLT4gbmV3IFNldCBbICggbmV3IFNldCAoICggZmFjZXRfZnJvbV9yb3cgcm93ICkgZm9yIHJvdyBmcm9tIHJvd3MgKSApLi4uLCBdLnNvcnQoKVxuICAgICAgICBnbG9iYWxfZmFjZXRzICAgICA9IGZhY2V0c19mcm9tX3Jvd3MgQGhyZF9maW5kX2NvdmVyaW5nX3J1bnMgbG8sIGhpXG4gICAgICAgIGdsb2JhbF93aWR0aCAgICAgID0gaGkgLSBsb1xuICAgICAgICBjb2xvcnMgICAgICAgICAgICA9XG4gICAgICAgICAgZmFsbGJhY2s6ICAgKCBQLi4uICkgLT4gR1VZLnRybS5ncmV5ICBQLi4uXG4gICAgICAgICAgd2FybjogICAgICAgKCBQLi4uICkgLT4gR1VZLnRybS5yZWQgICBQLi4uXG4gICAgICAgICAgaW46ICAgICAgICAgKCBQLi4uICkgLT4gR1VZLnRybS5nb2xkICBQLi4uXG4gICAgICAgICAgb3V0OiAgICAgICAgKCBQLi4uICkgLT4gR1VZLnRybS5ibHVlICBQLi4uXG4gICAgICAgICAgcnVuOiAgICAgICAgKCBQLi4uICkgLT4gR1VZLnRybS5ncmV5ICBQLi4uXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeyByb3dfY291bnQsIH0gPSBAZ2V0X2ZpcnN0IFNRTFwic2VsZWN0IGNvdW50KCopIGFzIHJvd19jb3VudCBmcm9tIGhyZF9ydW5zO1wiXG4gICAgICAgIGVjaG8oKVxuICAgICAgICBlY2hvIEdVWS50cm0ud2hpdGUgR1VZLnRybS5yZXZlcnNlIEdVWS50cm0uYm9sZCBcIiBob2FyZCB3aXRoICN7cm93X2NvdW50fSBydW5zIFwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGdsb2JhbF9mYWNldCBmcm9tIGdsb2JhbF9mYWNldHNcbiAgICAgICAgICBnZnBoICAgICAgPSAnICcucmVwZWF0IGdsb2JhbF9mYWNldC5sZW5ndGhcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHN0YXRlbWVudCA9IFNRTFwiXCJcIlxuICAgICAgICAgICAgc2VsZWN0ICogZnJvbSBocmRfcnVuc1xuICAgICAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICAgICAgYW5kICggZmFjZXQgPSAkZ2xvYmFsX2ZhY2V0IClcbiAgICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgICAgIC0tIG9yZGVyIGJ5IGhpIC0gbG8gYXNjLCBsbyBkZXNjLCBrZXksIHZhbHVlXG4gICAgICAgICAgICAgIG9yZGVyIGJ5IGlub3JuIGRlc2NcbiAgICAgICAgICAgICAgO1wiXCJcIlxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgcG9pbnRzID0gJydcbiAgICAgICAgICBmb3IgY2lkIGluIFsgbG8gLi4gaGkgXVxuICAgICAgICAgICAgbG9jYWxfa2V5cyAgPSBmYWNldHNfZnJvbV9yb3dzIEBocmRfZmluZF9jb3ZlcmluZ19ydW5zIGNpZFxuICAgICAgICAgICAgY2hyICAgICAgICAgPSBTdHJpbmcuZnJvbUNvZGVQb2ludCBjaWRcbiAgICAgICAgICAgIGNvbG9yICAgICAgID0gaWYgKCBsb2NhbF9rZXlzLmhhcyBnbG9iYWxfZmFjZXQgKSB0aGVuIGNvbG9ycy5pbiBlbHNlIGNvbG9ycy5vdXRcbiAgICAgICAgICAgIHBvaW50cyAgICAgKz0gY29sb3IgY2hyXG4gICAgICAgICAgZWNobyBmXCIje2dsb2JhbF9mYWNldH06PDE1YzsgI3snICd9Oj42YzsgI3twb2ludHN9XCJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBzdGF0ZW1lbnQsIHsgZ2xvYmFsX2ZhY2V0LCBsbywgaGksIH1cbiAgICAgICAgICAgIGlkICAgICAgICAgID0gcm93LnJvd2lkLnJlcGxhY2UgL14uKj89KFxcZCspLywgJ1skMV0nXG4gICAgICAgICAgICBmaXJzdCAgICAgICA9ICggTWF0aC5tYXggcm93LmxvLCBsbyApIC0gbG9cbiAgICAgICAgICAgIGxhc3QgICAgICAgID0gKCBNYXRoLm1pbiByb3cuaGksIGhpICkgLSBsb1xuICAgICAgICAgICAgbGVmdCAgICAgICAgPSBHVVkudHJtLmdyZXkgR1VZLnRybS5yZXZlcnNlICfwn66KJy5yZXBlYXQgZmlyc3RcbiAgICAgICAgICAgICMgbGVmdCAgICAgICAgPSBHVVkudHJtLmdyZXkgJ+KUgicucmVwZWF0IGZpcnN0XG4gICAgICAgICAgICBtaWQgICAgICAgICA9IEdVWS50cm0uZ29sZCAn8J+uiicucmVwZWF0IGxhc3QgLSBmaXJzdCArIDFcbiAgICAgICAgICAgICMgbWlkICAgICAgICAgPSBHVVkudHJtLmdvbGQgJ+KZpicucmVwZWF0IGxhc3QgLSBmaXJzdCArIDFcbiAgICAgICAgICAgICMgbWlkICAgICAgICAgPSBHVVkudHJtLmdvbGQgJ+KWiCcucmVwZWF0IGxhc3QgLSBmaXJzdCArIDFcbiAgICAgICAgICAgIHJpZ2h0ICAgICAgID0gR1VZLnRybS5ncmV5IEdVWS50cm0ucmV2ZXJzZSAn8J+uiicucmVwZWF0ICggZ2xvYmFsX3dpZHRoIC0gbGFzdCArIDEgKVxuICAgICAgICAgICAgZWNobyBjb2xvcnMucnVuIGZcIiN7Z2ZwaH06PDE1YzsgI3tpZH06PjZjOyAje2xlZnR9I3ttaWR9I3tyaWdodH1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHBydl9wb2ludCA9IDBcbiAgICAgICAgbGluZSAgICAgID0gJydcbiAgICAgICAgZm9yIHsgcG9pbnQsIH0gZnJvbSBAd2FsayBTUUxcInNlbGVjdCAqIGZyb20gaHJkX2luc3BlY3Rpb25fcG9pbnRzO1wiXG4gICAgICAgICAgcG9pbnQgIC09IGxvXG4gICAgICAgICAgZGVsdGEgICA9IE1hdGgubWF4IDAsIHBvaW50IC0gcHJ2X3BvaW50IC0gMVxuICAgICAgICAgIGxpbmUgICArPSAnICcucmVwZWF0IGRlbHRhXG4gICAgICAgICAgbGluZSAgICs9IEdVWS50cm0uZ29sZCBzd2l0Y2ggcG9pbnRcbiAgICAgICAgICAgIHdoZW4gbWluIHRoZW4gJ1snXG4gICAgICAgICAgICB3aGVuIG1heCB0aGVuICddJ1xuICAgICAgICAgICAgZWxzZSAgICAgICAgICAn4payJ1xuICAgICAgICAgIHBydl9wb2ludCA9IHBvaW50XG4gICAgICAgIGVjaG8gY29sb3JzLnJ1biBmXCIje2dmcGh9OjwxNWM7ICN7Jyd9Oj42YzsgI3tsaW5lfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcmVndWxhcml6ZTogLT5cbiAgICAgICAgIyMjIFJld3JpdGUgcnVucyBzbyBubyBvdmVybGFwcGluZyBmYW1pbGllcyBleGlzdCB3aXRoaW4gYSBjbGFuICMjI1xuICAgICAgICBAd2l0aF9cbiAgICAgICAgeyBtaW4sIG1heCwgfSAgICAgPSBAaHJkX2dldF9taW5fbWF4KClcbiAgICAgICAga2V5dmFsdWVfYnlfZmFjZXQgPSBAX2hyZF9nZXRfa2V5dmFsdWVfYnlfZmFjZXQoKVxuICAgICAgICBmYWNldHNfYnlfcG9pbnQgICA9IEBfaHJkX21hcF9mYWNldHNfb2ZfaW5zcGVjdGlvbl9wb2ludHMoKVxuICAgICAgICBmYWNldHMgICAgICAgICAgICA9IE9iamVjdC5rZXlzIEBfaHJkX2dldF9mYW1pbGllcygpICMjIyBUQUlOVCB1c2UgX2dldF9mYWNldHMgIyMjXG4gICAgICAgIGxvcG9pbnRzICAgICAgICAgID0ge31cbiAgICAgICAgbmV3X3J1bnMgICAgICAgICAgPSBbXVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIEB3aXRoX3RyYW5zYWN0aW9uID0+XG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgZmFjZXQgaW4gZmFjZXRzXG4gICAgICAgICAgICBmb3IgWyBwb2ludCwgcG9pbnRfZmFjZXRzLCBdIGZyb20gZmFjZXRzX2J5X3BvaW50XG4gICAgICAgICAgICAgIGNociAgICAgICAgID0gU3RyaW5nLmZyb21Db2RlUG9pbnQgcG9pbnRcbiAgICAgICAgICAgICAgaWYgcG9pbnRfZmFjZXRzLmhhcyBmYWNldFxuICAgICAgICAgICAgICAgIGxvcG9pbnRzWyBmYWNldCBdID89IHBvaW50XG4gICAgICAgICAgICAgIGVsc2UgaWYgbG9wb2ludHNbIGZhY2V0IF0/XG4gICAgICAgICAgICAgICAgeyBrZXksIHZhbHVlLCB9ICAgPSBrZXl2YWx1ZV9ieV9mYWNldFsgZmFjZXQgXVxuICAgICAgICAgICAgICAgIG5ld19ydW5zLnB1c2ggeyBmYWNldCwga2V5LCB2YWx1ZSwgbG86IGxvcG9pbnRzWyBmYWNldCBdLCBoaTogcG9pbnQgLSAxLCB9XG4gICAgICAgICAgICAgICAgbG9wb2ludHNbIGZhY2V0IF0gPSBudWxsXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgZmFjZXQsIGxvIG9mIGxvcG9pbnRzIHdoZW4gbG8/XG4gICAgICAgICAgICB7IGtleSwgdmFsdWUsIH0gPSBrZXl2YWx1ZV9ieV9mYWNldFsgZmFjZXQgXVxuICAgICAgICAgICAgbmV3X3J1bnMucHVzaCB7IGZhY2V0LCBrZXksIHZhbHVlLCBsbywgaGk6IG1heCwgfVxuICAgICAgICAgIEBocmRfZGVsZXRlX3J1bnMoKVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgQGhyZF9hZGRfcnVuIGxvLCBoaSwga2V5LCB2YWx1ZSBmb3IgeyBmYWNldCwga2V5LCB2YWx1ZSwgbG8sIGhpLCB9IGZyb20gbmV3X3J1bnNcbiAgICAgICAgICA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIDtudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgSG9hcmQgZXh0ZW5kcyBEYnJpY19zdGRcbiAgQHBsdWdpbnM6IFtcbiAgICBkYnJpY19ob2FyZF9wbHVnaW5cbiAgICBdXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfaG9hcmRfcGx1Z2luLFxuICAgIEhvYXJkLFxuICAgIGludGVybmFscywgfVxuXG5cbiJdfQ==
