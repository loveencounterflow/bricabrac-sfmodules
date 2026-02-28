(function() {
  'use strict';
  var Dbric_std, GUY, Hoard, SQL, dbric_hoard_plugin, debug, echo, f, freeze, hide, lets, nfa, rpr, templates, type_of;

  GUY = require('../../guy');

  ({
    //===========================================================================================================
    debug,
    log: echo
  } = console);

  ({freeze} = Object);

  // IFN                       = require './../dependencies/intervals-fn-lib.js'
  // { T,                    } = require './intermission-types'
  //...........................................................................................................
  ({nfa} = require('normalize-function-arguments'));

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({hide} = (require('./various-brics')).require_managed_property_tools());

  ({
    inspect: rpr
  } = require('node:util'));

  ({f} = require('effstring'));

  ({Dbric_std, SQL} = require('./dbric'));

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
    internals = Object.freeze({templates, lets});
    return {dbric_hoard_plugin, Hoard, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUE7O0VBRUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxXQUFSOztFQUdOLENBQUEsQ0FBQTs7SUFBRSxLQUFGO0lBQ0UsR0FBQSxFQUFLO0VBRFAsQ0FBQSxHQUM0QixPQUQ1Qjs7RUFFQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCLEVBUEE7Ozs7O0VBV0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsOEJBQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsT0FBQSxFQUFTO0VBQVgsQ0FBQSxHQUE0QixPQUFBLENBQVEsV0FBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxTQUFGLEVBQ0UsR0FERixDQUFBLEdBQzRCLE9BQUEsQ0FBUSxTQUFSLENBRDVCLEVBaEJBOzs7O0VBcUJBLElBQUEsR0FBTyxRQUFBLENBQUUsUUFBRixFQUFZLFdBQVcsSUFBdkIsQ0FBQTtBQUNQLFFBQUE7SUFBRSxLQUFBLEdBQVcsS0FB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LEVBQVMsR0FBVCxFQUFjLEtBQWQsRUFBcUIsRUFBckIsRUFBeUIsRUFBekIsT0FBcEM7O2NBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLEVBQTBCLEtBQTFCO1lBQUE7bUJBQ0M7VUFsQmUsQ0FBbEIsRUFUUjs7aUJBNkJTO1FBOUJhO01BdEpoQjtJQXZLRjtFQUxGOztFQW1XSTs7SUFBTixNQUFBLE1BQUEsUUFBb0IsVUFBcEIsQ0FBQTs7SUFDRSxLQUFDLENBQUEsT0FBRCxHQUFVLENBQ1Isa0JBRFE7Ozs7Z0JBellaOzs7RUErWUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxTQUFGLEVBQWEsSUFBYixDQUFkO0FBQ1osV0FBTyxDQUNMLGtCQURLLEVBRUwsS0FGSyxFQUdMLFNBSEs7RUFGVyxDQUFBO0FBL1lwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbkdVWSA9IHJlcXVpcmUgJy4uLy4uL2d1eSdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICBsb2c6IGVjaG8sICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiMgSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG4jIHsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpY19zdGQsXG4gIFNRTCwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgVEFJTlQgbW92ZSB0byBkZWRpY2F0ZWQgbW9kdWxlICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICBhZGRfcnVuX2NmZzpcbiAgICBsbzogICAgICAgMFxuICAgIGhpOiAgICAgICBudWxsXG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGJyaWNfaG9hcmRfcGx1Z2luID1cbiAgbmFtZTogICAnaHJkX2hvYXJkX3BsdWdpbicgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgcHJlZml4OiAnaHJkJyAgICAgICAgICAgICAgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgZXhwb3J0czpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IFtcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgX2hyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGlub3JuICAgaW50ZWdlciBub3QgbnVsbCwgLS0gSU5zZXJ0aW9uIE9SZGVyIE51bWJlclxuICAgICAgICAgICAgbG8gICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgZmFjZXQgICB0ZXh0ICAgIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBwcmludGYoICclczolcycsIGtleSwgdmFsdWUgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGtleSAgICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIHZhbHVlICAgdGV4dCAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJywgLS0gcHJvcGVyIGRhdGEgdHlwZSBpcyBganNvbmAgYnV0IGRlY2xhcmVkIGFzIGB0ZXh0YCBiL2Mgb2YgYHN0cmljdGBcbiAgICAgICAgICBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggaW5vcm4gKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgKSBzdHJpY3Q7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfbG9faGlcIiAgICAgICBvbiBfaHJkX3J1bnMgKCBsbywgIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19oaVwiICAgICAgICAgIG9uIF9ocmRfcnVucyAoIGhpICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgaW5kZXggXCJocmRfaW5kZXhfcnVuc19pbm9ybl9kZXNjXCIgIG9uIF9ocmRfcnVucyAoIGlub3JuIGRlc2MgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2tleVwiICAgICAgICAgb24gX2hyZF9ydW5zICgga2V5ICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX3J1bnMgYXMgc2VsZWN0ICogZnJvbSBfaHJkX3J1bnM7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRyaWdnZXIgaHJkX29uX2JlZm9yZV9pbnNlcnRfcnVuXG4gICAgICAgIGluc3RlYWQgb2YgaW5zZXJ0IG9uIGhyZF9ydW5zXG4gICAgICAgICAgZm9yIGVhY2ggcm93IGJlZ2luXG4gICAgICAgICAgICBpbnNlcnQgaW50byBfaHJkX3J1bnMgKCByb3dpZCwgaW5vcm4sIGxvLCBoaSwga2V5LCB2YWx1ZSApIHZhbHVlc1xuICAgICAgICAgICAgICAoIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkKCksIF9ocmRfZ2V0X3J1bl9pbm9ybigpLCBuZXcubG8sIG5ldy5oaSwgbmV3LmtleSwgbmV3LnZhbHVlICk7XG4gICAgICAgICAgICBlbmQ7XG4gICAgICAgIDtcIlwiXCJcblxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbGllcyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEua2V5ICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBhLmZhY2V0ICAgICAgICAgICAgICAgICAgICAgYXMgZmFjZXRcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9nbG9iYWxfYm91bmRzIGFzXG4gICAgICAgIHNlbGVjdCAnbWluJyBhcyBib3VuZCwgbWluKCBsbyApIGFzIHBvaW50IGZyb20gaHJkX3J1bnMgdW5pb25cbiAgICAgICAgc2VsZWN0ICdtYXgnIGFzIGJvdW5kLCBtYXgoIGhpICkgYXMgcG9pbnQgZnJvbSBocmRfcnVuc1xuICAgICAgICBvcmRlciBieSBwb2ludDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfYnJlYWtwb2ludHMgYXNcbiAgICAgICAgc2VsZWN0ICdsbycgYXMgYm91bmQsIGxvIGFzIHBvaW50IGZyb20gaHJkX3J1bnMgdW5pb25cbiAgICAgICAgc2VsZWN0ICdoaScgYXMgYm91bmQsIGhpIGFzIHBvaW50IGZyb20gaHJkX3J1bnNcbiAgICAgICAgb3JkZXIgYnkgcG9pbnQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2luc3BlY3Rpb25fcG9pbnRzIGFzXG4gICAgICAgIHNlbGVjdCBkaXN0aW5jdCBwb2ludFxuICAgICAgICBmcm9tIChcbiAgICAgICAgICAtLSBhbGwgYnJlYWtwb2ludHMgdGhlbXNlbHZlc1xuICAgICAgICAgIHNlbGVjdCBwb2ludCBmcm9tIGhyZF9icmVha3BvaW50c1xuICAgICAgICAgIHVuaW9uIGFsbFxuICAgICAgICAgIC0tIGZvciBlYWNoICdoaScgYnJlYWtwb2ludCwgdGhlIHBvaW50IGp1c3QgYWZ0ZXJcbiAgICAgICAgICBzZWxlY3QgYi5wb2ludCArIDFcbiAgICAgICAgICBmcm9tIGhyZF9icmVha3BvaW50cyBiLCBocmRfZ2xvYmFsX2JvdW5kcyBnXG4gICAgICAgICAgd2hlcmUgYi5ib3VuZCA9ICdoaSdcbiAgICAgICAgICAgIGFuZCBiLnBvaW50ICsgMSA8PSAoIHNlbGVjdCBwb2ludCBmcm9tIGhyZF9nbG9iYWxfYm91bmRzIHdoZXJlIGJvdW5kID0gJ21heCcgKVxuICAgICAgICAgIHVuaW9uIGFsbFxuICAgICAgICAgIC0tIGZvciBlYWNoICdsbycgYnJlYWtwb2ludCwgdGhlIHBvaW50IGp1c3QgYmVmb3JlXG4gICAgICAgICAgc2VsZWN0IGIucG9pbnQgLSAxXG4gICAgICAgICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYiwgaHJkX2dsb2JhbF9ib3VuZHMgZ1xuICAgICAgICAgIHdoZXJlIGIuYm91bmQgPSAnbG8nXG4gICAgICAgICAgICBhbmQgYi5wb2ludCAtIDEgPj0gKCBzZWxlY3QgcG9pbnQgZnJvbSBocmRfZ2xvYmFsX2JvdW5kcyB3aGVyZSBib3VuZCA9ICdtaW4nIClcbiAgICAgICAgKVxuICAgICAgICBvcmRlciBieSBwb2ludDtcIlwiXCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgU1FMXCJcIlwiIGNyZWF0ZSB2aWV3IGhyZF9icmVha3BvaW50X2ZhY2V0cyBhc1xuICAgICAgIyAgIHNlbGVjdCAqXG4gICAgICAjICAgZnJvbSBocmRfYnJlYWtwb2ludHMgYXMgYVxuICAgICAgIyAgIGpvaW4gaHJkX3J1bnMgYXMgYiBvbiAoIGEucG9pbnQgPSBiLmxvIG9yIGEucG9pbnQgPSBiLmhpIClcbiAgICAgICMgICBvcmRlciBieSBwb2ludCwgaW5vcm4gZGVzYztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9ydW5faW5vcm46XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfcnVuX2lub3JuKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6IC0+IEBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9qc29uX3F1b3RlOlxuICAgICAgIyAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICMgICB2YWx1ZTogKCB4ICkgLT4gSlNPTi5zdHJpbmdpZnkgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGF0ZW1lbnRzOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZmluZF9mYW1pbGllczogU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWxpZXM7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9pbnNlcnRfcnVuOiBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHZhbHVlcyAoICRsbywgJGhpLCAka2V5LCAkdmFsdWUgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBpbm9ybiwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9kZWxldGVfcnVuOiAgICAgICBTUUxcIlwiXCJkZWxldGUgZnJvbSBfaHJkX3J1bnMgd2hlcmUgcm93aWQgPSAkcm93aWQ7XCJcIlwiXG4gICAgICBocmRfZGVsZXRlX2FsbF9ydW5zOiAgU1FMXCJcIlwiZGVsZXRlIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX2NvdmVyaW5nX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogU1FMXCJcIlwiXG4gICAgICAgIHdpdGggcmFua2VkIGFzICggc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICAgICAgICAgICAgICAgYXMgcm93aWQsXG4gICAgICAgICAgICBhLmlub3JuICAgICAgICAgICAgICAgYXMgaW5vcm4sXG4gICAgICAgICAgICByb3dfbnVtYmVyKCkgb3ZlciB3ICAgYXMgcm4sXG4gICAgICAgICAgICBhLmxvICAgICAgICAgICAgICAgICAgYXMgbG8sXG4gICAgICAgICAgICBhLmhpICAgICAgICAgICAgICAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmZhY2V0ICAgICAgICAgICAgICAgYXMgZmFjZXQsXG4gICAgICAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgICAgICAgICAgICAgIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJHBvaW50IClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRwb2ludCApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgYS5rZXkgb3JkZXIgYnkgYS5pbm9ybiBkZXNjICkgKVxuICAgICAgICBzZWxlY3QgKiBmcm9tIHJhbmtlZCB3aGVyZSAoIHJuID0gMSApIG9yZGVyIGJ5IGtleSBhc2M7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1ldGhvZHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogICAgICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ydW5zXG4gICAgICBfaHJkX2dldF9ydW5faW5vcm46IC0+IEBzdGF0ZS5ocmRfcnVuX2lub3JuID0gKCBAc3RhdGUuaHJkX3J1bl9pbm9ybiA/IDAgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X2ZhbWlsaWVzOiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIHsga2V5LCB2YWx1ZSwgZmFjZXQsIH0gZnJvbSBAd2FsayBAc3RhdGVtZW50cy5faHJkX2ZpbmRfZmFtaWxpZXNcbiAgICAgICAgICB2YWx1ZV9qc29uICA9IHZhbHVlXG4gICAgICAgICAgdmFsdWUgICAgICAgPSBKU09OLnBhcnNlIHZhbHVlXG4gICAgICAgICAgUlsgZmFjZXQgXSAgPSB7IGtleSwgdmFsdWUsIGZhY2V0LCB2YWx1ZV9qc29uLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6IC0+XG4gICAgICAgIEBzdGF0ZS5ocmRfcnVuX2lub3JuID0gUiA9IEBfaHJkX2dldF9ydW5faW5vcm4oKSArIDFcbiAgICAgICAgcmV0dXJuIFwidDpocmQ6cnVuczpSPSN7Un1cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnOiAoIGxvLCBoaSwga2V5LCB2YWx1ZSApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgICByZXR1cm4geyBsbywgaGksIGtleSwgdmFsdWUsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5faHJkX2luc2VydF9ydW4ucnVuIEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGhyZF9maW5kX2NvdmVyaW5nX3J1bnM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMubG9faGksIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgaHJkX2ZpbmRfY292ZXJpbmdfcnVuczogKCBsbywgaGkgPSBudWxsICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfY292ZXJpbmdfcnVucywgeyBsbywgaGksIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQsIHsgcG9pbnQsIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2RlbGV0ZV9ydW5zOiAtPiBAc3RhdGVtZW50cy5ocmRfZGVsZXRlX2FsbF9ydW5zLnJ1bigpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2dldF9taW5fbWF4OiAoIHBvaW50ICkgLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBTUUxcInNlbGVjdCBib3VuZCwgcG9pbnQgZnJvbSBocmRfZ2xvYmFsX2JvdW5kcyBvcmRlciBieSBib3VuZCBkZXNjO1wiXG4gICAgICAgICAgUlsgcm93LmJvdW5kIF0gPSByb3cucG9pbnRcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZGVzY3JpYmVfcG9pbnQ6ICggcG9pbnQgKSAtPiBmcmVlemUgT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgICAgWyBrZXksIHZhbHVlLCBdIGZvciB7IGtleSwgdmFsdWUsIH0gZnJvbSBAaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQgcG9pbnQgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZmFjZXRzX2Zyb21fcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgICByZXR1cm4gbmV3IFNldCAoIGZhY2V0IGZvciB7IGZhY2V0LCB9IGZyb20gQGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50IHBvaW50IClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX21hcF9mYWNldHNfb2ZfaW5zcGVjdGlvbl9wb2ludHM6IC0+XG4gICAgICAgIFIgPSBuZXcgTWFwKClcbiAgICAgICAgZm9yIHsgcG9pbnQsIH0gZnJvbSBAd2FsayBTUUxcInNlbGVjdCAqIGZyb20gaHJkX2luc3BlY3Rpb25fcG9pbnRzO1wiXG4gICAgICAgICAgUi5zZXQgcG9pbnQsIEBfaHJkX2ZhY2V0c19mcm9tX3BvaW50IHBvaW50XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfa2V5dmFsdWVfYnlfZmFjZXQ6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgeyBmYWNldCwga2V5LCB2YWx1ZSwgfSBmcm9tIEB3YWxrIFNRTFwic2VsZWN0IGRpc3RpbmN0IGZhY2V0LCBrZXksIHZhbHVlIGZyb20gaHJkX3J1bnMgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlxuICAgICAgICAgIHZhbHVlX2pzb24gID0gdmFsdWVcbiAgICAgICAgICB2YWx1ZSAgICAgICA9IEpTT04ucGFyc2UgdmFsdWVfanNvblxuICAgICAgICAgIFJbIGZhY2V0IF0gID0geyBrZXksIHZhbHVlLCB2YWx1ZV9qc29uLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3Zpc3VhbGl6ZTogKHsgbG8sIGhpLCB9KSAtPlxuICAgICAgICB7IG1pbiwgbWF4LCB9ICAgICA9IEBocmRfZ2V0X21pbl9tYXgoKVxuICAgICAgICBsbyAgICAgICAgICAgICAgID89IE1hdGgubWF4IG1pbiwgMFxuICAgICAgICBoaSAgICAgICAgICAgICAgID89IE1hdGgubWluIG1heCwgKzEwMFxuICAgICAgICBmYWNldF9mcm9tX3JvdyAgICA9ICggcm93ICkgLT4gXCIje3Jvdy5rZXl9OiN7cm93LnZhbHVlX2pzb259XCJcbiAgICAgICAgZmFjZXRzX2Zyb21fcm93cyAgPSAoIHJvd3MgKSAtPiBuZXcgU2V0IFsgKCBuZXcgU2V0ICggKCBmYWNldF9mcm9tX3JvdyByb3cgKSBmb3Igcm93IGZyb20gcm93cyApICkuLi4sIF0uc29ydCgpXG4gICAgICAgIGdsb2JhbF9mYWNldHMgICAgID0gZmFjZXRzX2Zyb21fcm93cyBAaHJkX2ZpbmRfY292ZXJpbmdfcnVucyBsbywgaGlcbiAgICAgICAgZ2xvYmFsX3dpZHRoICAgICAgPSBoaSAtIGxvXG4gICAgICAgIGNvbG9ycyAgICAgICAgICAgID1cbiAgICAgICAgICBmYWxsYmFjazogICAoIFAuLi4gKSAtPiBHVVkudHJtLmdyZXkgIFAuLi5cbiAgICAgICAgICB3YXJuOiAgICAgICAoIFAuLi4gKSAtPiBHVVkudHJtLnJlZCAgIFAuLi5cbiAgICAgICAgICBpbjogICAgICAgICAoIFAuLi4gKSAtPiBHVVkudHJtLmdvbGQgIFAuLi5cbiAgICAgICAgICBvdXQ6ICAgICAgICAoIFAuLi4gKSAtPiBHVVkudHJtLmJsdWUgIFAuLi5cbiAgICAgICAgICBydW46ICAgICAgICAoIFAuLi4gKSAtPiBHVVkudHJtLmdyZXkgIFAuLi5cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB7IHJvd19jb3VudCwgfSA9IEBnZXRfZmlyc3QgU1FMXCJzZWxlY3QgY291bnQoKikgYXMgcm93X2NvdW50IGZyb20gaHJkX3J1bnM7XCJcbiAgICAgICAgZWNobygpXG4gICAgICAgIGVjaG8gR1VZLnRybS53aGl0ZSBHVVkudHJtLnJldmVyc2UgR1VZLnRybS5ib2xkIFwiIGhvYXJkIHdpdGggI3tyb3dfY291bnR9IHJ1bnMgXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgZ2xvYmFsX2ZhY2V0IGZyb20gZ2xvYmFsX2ZhY2V0c1xuICAgICAgICAgIGdmcGggICAgICA9ICcgJy5yZXBlYXQgZ2xvYmFsX2ZhY2V0Lmxlbmd0aFxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgc3RhdGVtZW50ID0gU1FMXCJcIlwiXG4gICAgICAgICAgICBzZWxlY3QgKiBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgICAgICBhbmQgKCBmYWNldCA9ICRnbG9iYWxfZmFjZXQgKVxuICAgICAgICAgICAgICAgIGFuZCAoIGxvIDw9ICRoaSApXG4gICAgICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICAgICAgLS0gb3JkZXIgYnkgaGkgLSBsbyBhc2MsIGxvIGRlc2MsIGtleSwgdmFsdWVcbiAgICAgICAgICAgICAgb3JkZXIgYnkgaW5vcm4gZGVzY1xuICAgICAgICAgICAgICA7XCJcIlwiXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBwb2ludHMgPSAnJ1xuICAgICAgICAgIGZvciBjaWQgaW4gWyBsbyAuLiBoaSBdXG4gICAgICAgICAgICBsb2NhbF9rZXlzICA9IGZhY2V0c19mcm9tX3Jvd3MgQGhyZF9maW5kX2NvdmVyaW5nX3J1bnMgY2lkXG4gICAgICAgICAgICBjaHIgICAgICAgICA9IFN0cmluZy5mcm9tQ29kZVBvaW50IGNpZFxuICAgICAgICAgICAgY29sb3IgICAgICAgPSBpZiAoIGxvY2FsX2tleXMuaGFzIGdsb2JhbF9mYWNldCApIHRoZW4gY29sb3JzLmluIGVsc2UgY29sb3JzLm91dFxuICAgICAgICAgICAgcG9pbnRzICAgICArPSBjb2xvciBjaHJcbiAgICAgICAgICBlY2hvIGZcIiN7Z2xvYmFsX2ZhY2V0fTo8MTVjOyAjeycgJ306PjZjOyAje3BvaW50c31cIlxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIHN0YXRlbWVudCwgeyBnbG9iYWxfZmFjZXQsIGxvLCBoaSwgfVxuICAgICAgICAgICAgaWQgICAgICAgICAgPSByb3cucm93aWQucmVwbGFjZSAvXi4qPz0oXFxkKykvLCAnWyQxXSdcbiAgICAgICAgICAgIGZpcnN0ICAgICAgID0gKCBNYXRoLm1heCByb3cubG8sIGxvICkgLSBsb1xuICAgICAgICAgICAgbGFzdCAgICAgICAgPSAoIE1hdGgubWluIHJvdy5oaSwgaGkgKSAtIGxvXG4gICAgICAgICAgICBsZWZ0ICAgICAgICA9IEdVWS50cm0uZ3JleSBHVVkudHJtLnJldmVyc2UgJ/CfroonLnJlcGVhdCBmaXJzdFxuICAgICAgICAgICAgIyBsZWZ0ICAgICAgICA9IEdVWS50cm0uZ3JleSAn4pSCJy5yZXBlYXQgZmlyc3RcbiAgICAgICAgICAgIG1pZCAgICAgICAgID0gR1VZLnRybS5nb2xkICfwn66KJy5yZXBlYXQgbGFzdCAtIGZpcnN0ICsgMVxuICAgICAgICAgICAgIyBtaWQgICAgICAgICA9IEdVWS50cm0uZ29sZCAn4pmmJy5yZXBlYXQgbGFzdCAtIGZpcnN0ICsgMVxuICAgICAgICAgICAgIyBtaWQgICAgICAgICA9IEdVWS50cm0uZ29sZCAn4paIJy5yZXBlYXQgbGFzdCAtIGZpcnN0ICsgMVxuICAgICAgICAgICAgcmlnaHQgICAgICAgPSBHVVkudHJtLmdyZXkgR1VZLnRybS5yZXZlcnNlICfwn66KJy5yZXBlYXQgKCBnbG9iYWxfd2lkdGggLSBsYXN0ICsgMSApXG4gICAgICAgICAgICBlY2hvIGNvbG9ycy5ydW4gZlwiI3tnZnBofTo8MTVjOyAje2lkfTo+NmM7ICN7bGVmdH0je21pZH0je3JpZ2h0fVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcHJ2X3BvaW50ID0gMFxuICAgICAgICBsaW5lICAgICAgPSAnJ1xuICAgICAgICBmb3IgeyBwb2ludCwgfSBmcm9tIEB3YWxrIFNRTFwic2VsZWN0ICogZnJvbSBocmRfaW5zcGVjdGlvbl9wb2ludHM7XCJcbiAgICAgICAgICBwb2ludCAgLT0gbG9cbiAgICAgICAgICBkZWx0YSAgID0gTWF0aC5tYXggMCwgcG9pbnQgLSBwcnZfcG9pbnQgLSAxXG4gICAgICAgICAgbGluZSAgICs9ICcgJy5yZXBlYXQgZGVsdGFcbiAgICAgICAgICBsaW5lICAgKz0gR1VZLnRybS5nb2xkIHN3aXRjaCBwb2ludFxuICAgICAgICAgICAgd2hlbiBtaW4gdGhlbiAnWydcbiAgICAgICAgICAgIHdoZW4gbWF4IHRoZW4gJ10nXG4gICAgICAgICAgICBlbHNlICAgICAgICAgICfilrInXG4gICAgICAgICAgcHJ2X3BvaW50ID0gcG9pbnRcbiAgICAgICAgZWNobyBjb2xvcnMucnVuIGZcIiN7Z2ZwaH06PDE1YzsgI3snJ306PjZjOyAje2xpbmV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9yZWd1bGFyaXplOiAtPlxuICAgICAgICAjIyMgUmV3cml0ZSBydW5zIHNvIG5vIG92ZXJsYXBwaW5nIGZhbWlsaWVzIGV4aXN0IHdpdGhpbiBhIGNsYW4gIyMjXG4gICAgICAgIEB3aXRoX1xuICAgICAgICB7IG1pbiwgbWF4LCB9ICAgICA9IEBocmRfZ2V0X21pbl9tYXgoKVxuICAgICAgICBrZXl2YWx1ZV9ieV9mYWNldCA9IEBfaHJkX2dldF9rZXl2YWx1ZV9ieV9mYWNldCgpXG4gICAgICAgIGZhY2V0c19ieV9wb2ludCAgID0gQF9ocmRfbWFwX2ZhY2V0c19vZl9pbnNwZWN0aW9uX3BvaW50cygpXG4gICAgICAgIGZhY2V0cyAgICAgICAgICAgID0gT2JqZWN0LmtleXMgQF9ocmRfZ2V0X2ZhbWlsaWVzKCkgIyMjIFRBSU5UIHVzZSBfZ2V0X2ZhY2V0cyAjIyNcbiAgICAgICAgbG9wb2ludHMgICAgICAgICAgPSB7fVxuICAgICAgICBuZXdfcnVucyAgICAgICAgICA9IFtdXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHdpdGhfdHJhbnNhY3Rpb24gPT5cbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciBmYWNldCBpbiBmYWNldHNcbiAgICAgICAgICAgIGZvciBbIHBvaW50LCBwb2ludF9mYWNldHMsIF0gZnJvbSBmYWNldHNfYnlfcG9pbnRcbiAgICAgICAgICAgICAgY2hyICAgICAgICAgPSBTdHJpbmcuZnJvbUNvZGVQb2ludCBwb2ludFxuICAgICAgICAgICAgICBpZiBwb2ludF9mYWNldHMuaGFzIGZhY2V0XG4gICAgICAgICAgICAgICAgbG9wb2ludHNbIGZhY2V0IF0gPz0gcG9pbnRcbiAgICAgICAgICAgICAgZWxzZSBpZiBsb3BvaW50c1sgZmFjZXQgXT9cbiAgICAgICAgICAgICAgICB7IGtleSwgdmFsdWUsIH0gICA9IGtleXZhbHVlX2J5X2ZhY2V0WyBmYWNldCBdXG4gICAgICAgICAgICAgICAgbmV3X3J1bnMucHVzaCB7IGZhY2V0LCBrZXksIHZhbHVlLCBsbzogbG9wb2ludHNbIGZhY2V0IF0sIGhpOiBwb2ludCAtIDEsIH1cbiAgICAgICAgICAgICAgICBsb3BvaW50c1sgZmFjZXQgXSA9IG51bGxcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciBmYWNldCwgbG8gb2YgbG9wb2ludHMgd2hlbiBsbz9cbiAgICAgICAgICAgIHsga2V5LCB2YWx1ZSwgfSA9IGtleXZhbHVlX2J5X2ZhY2V0WyBmYWNldCBdXG4gICAgICAgICAgICBuZXdfcnVucy5wdXNoIHsgZmFjZXQsIGtleSwgdmFsdWUsIGxvLCBoaTogbWF4LCB9XG4gICAgICAgICAgQGhyZF9kZWxldGVfcnVucygpXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBAaHJkX2FkZF9ydW4gbG8sIGhpLCBrZXksIHZhbHVlIGZvciB7IGZhY2V0LCBrZXksIHZhbHVlLCBsbywgaGksIH0gZnJvbSBuZXdfcnVuc1xuICAgICAgICAgIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgO251bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2FyZCBleHRlbmRzIERicmljX3N0ZFxuICBAcGx1Z2luczogW1xuICAgIGRicmljX2hvYXJkX3BsdWdpblxuICAgIF1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IHRlbXBsYXRlcywgbGV0cywgfVxuICByZXR1cm4ge1xuICAgIGRicmljX2hvYXJkX3BsdWdpbixcbiAgICBIb2FyZCxcbiAgICBpbnRlcm5hbHMsIH1cblxuXG4iXX0=
