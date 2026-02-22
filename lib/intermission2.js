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
  -- unique ( lo, hi, key, value ),
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
        SQL`create index "hrd_index_runs_lo_hi" on _hrd_runs ( lo,  hi  );`,
        SQL`create index "hrd_index_runs_hi"    on _hrd_runs (      hi  );`,
        SQL`create index "hrd_index_runs_key"   on _hrd_runs ( key      );`,
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
        hrd_delete_run: SQL`delete from _hrd_runs where rowid = $rowid;`,
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
);`,
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
        _hrd_as_halfopen: function(run) {
          return {
            start: run.lo,
            end: run.hi + 1
          };
        },
        _hrd_from_halfopen: function(halfopen) {
          return {
            lo: halfopen.start,
            hi: halfopen.end - 1
          };
        },
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
        // hrd_find_overlaps: nfa { template: templates.lo_hi, }, ( lo, hi, cfg ) ->
        hrd_find_overlaps: function*(lo, hi = null) {
          var row;
          if (hi == null) {
            hi = lo;
          }
          for (row of this.walk(this.statements.hrd_find_overlaps, {lo, hi})) {
            /* TAINT code duplication, use casting method */
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
        _hrd_normalize_family: function(key, value_json) {
          /* TAINT potentially doing too much as we only have to join adjacent, remove overlaps */
          this.with_transaction(() => {
            var halfopen, i, j, len, len1, new_halfopens, new_run, new_runs, old_halfopens, old_run, old_runs, value;
            old_runs = this.get_all(this.statements._hrd_find_runs_of_family_sorted, {
              key,
              value: value_json
            });
            for (i = 0, len = old_runs.length; i < len; i++) {
              old_run = old_runs[i];
              this.statements.hrd_delete_run.run({
                rowid: old_run.rowid
              });
            }
            old_halfopens = (function() {
              var j, len1, results;
              results = [];
              for (j = 0, len1 = old_runs.length; j < len1; j++) {
                old_run = old_runs[j];
                results.push(this._hrd_as_halfopen(old_run));
              }
              return results;
            }).call(this);
            new_halfopens = IFN.simplify(old_halfopens);
            new_runs = (function() {
              var j, len1, results;
              results = [];
              for (j = 0, len1 = new_halfopens.length; j < len1; j++) {
                halfopen = new_halfopens[j];
                results.push(this._hrd_from_halfopen(halfopen));
              }
              return results;
            }).call(this);
            value = JSON.parse(value_json);
            for (j = 0, len1 = new_runs.length; j < len1; j++) {
              new_run = new_runs[j];
              this.hrd_add_run({...new_run, key, value});
            }
            return null;
          });
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_normalize: function() {
          var families, family, i, len;
          families = this.get_all(SQL`select * from hrd_normalization where is_normal = false;`);
          for (i = 0, len = families.length; i < len; i++) {
            family = families[i];
            this._hrd_normalize_family(family.key, family.value);
          }
          return null;
        },
        //-----------------------------------------------------------------------------------------------------
        hrd_validate_1: function() {
          var conflicts;
          if ((conflicts = [...(this.hrd_find_runs_with_conflicts_1())]).length === 0) {
            return null;
          }
          throw new Error(`Ωhrd___6 found conflicts: ${rpr(conflicts)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlB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USxDQXZIaEI7O1FBNEhBLDBCQUFBLEVBQTRCLFNBQUEsQ0FBRSxLQUFGLENBQUE7QUFDbEMsY0FBQTtVQUFRLEtBQUEscUVBQUEsR0FBQTs7WUFFRSxJQUFBLENBQUssR0FBTCxFQUFVLFlBQVYsRUFBd0IsR0FBRyxDQUFDLEtBQTVCO1lBQ0EsR0FBRyxDQUFDLEtBQUosR0FBWSxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxLQUFmO1lBQ1osTUFBTTtVQUpSO2lCQUtDO1FBTnlCO01BNUg1QjtJQWpRRjtFQUxGLEVBcERGOzs7RUErYkEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxTQUFGO01BQWEsR0FBYjtNQUFrQixJQUFsQjtNQUF3QixTQUFBLEVBQVc7SUFBbkMsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxZQURLO0VBRlcsQ0FBQTtBQS9icEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBpbnNwZWN0OiBycHIsICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiMgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IGYsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnZWZmc3RyaW5nJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbmxldHMgPSAoIG9yaWdpbmFsLCBtb2RpZmllciA9IG51bGwgKSAtPlxuICBkcmFmdCA9IGlmIEFycmF5LmlzQXJyYXkgdGhlbiBbIG9yaWdpbmFsLi4uLCBdIGVsc2UgeyBvcmlnaW5hbC4uLiwgfVxuICBtb2RpZmllciBkcmFmdFxuICByZXR1cm4gZnJlZXplIGRyYWZ0XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudGVtcGxhdGVzID1cbiAgYWRkX3J1bl9jZmc6XG4gICAgbG86ICAgICAgIDBcbiAgICBoaTogICAgICAgbnVsbFxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcbiAgaHJkX2ZpbmRfZmFtaWxpZXM6XG4gICAga2V5OiAgICAgIG51bGxcbiAgICB2YWx1ZTogICAgbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGJyaWNfcGx1Z2luID1cbiAgbmFtZTogICAnaHJkX2hvYXJkX3BsdWdpbicgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgcHJlZml4OiAnaHJkJyAgICAgICAgICAgICAgIyMjIE5PVEUgaW5mb3JtYXRpdmUsIG5vdCBlbmZvcmNlZCAjIyNcbiAgZXhwb3J0czpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IFtcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgX2hyZF9ydW5zIChcbiAgICAgICAgICAgIHJvd2lkICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGlub3JuICAgaW50ZWdlciBub3QgbnVsbCwgLS0gSU5zZXJ0aW9uIE9SZGVyIE51bWJlclxuICAgICAgICAgICAgbG8gICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICByZWFsICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgZmFjZXQgICB0ZXh0ICAgIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBwcmludGYoICclczolcycsIGtleSwgdmFsdWUgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGtleSAgICAgdGV4dCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIHZhbHVlICAgdGV4dCAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJywgLS0gcHJvcGVyIGRhdGEgdHlwZSBpcyBganNvbmAgYnV0IGRlY2xhcmVkIGFzIGB0ZXh0YCBiL2Mgb2YgYHN0cmljdGBcbiAgICAgICAgICBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggcm93aWQgKSxcbiAgICAgICAgICAtLSB1bmlxdWUgKCBsbywgaGksIGtleSwgdmFsdWUgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBrZXkgcmVnZXhwICcuKicgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNVwiIGNoZWNrICgga2V5IHJlZ2V4cCAnXlxcJHgkfF5bXiRdLisnIClcbiAgICAgICAgKSBzdHJpY3Q7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfbG9faGlcIiBvbiBfaHJkX3J1bnMgKCBsbywgIGhpICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICBvbiBfaHJkX3J1bnMgKCAgICAgIGhpICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfa2V5XCIgICBvbiBfaHJkX3J1bnMgKCBrZXkgICAgICApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ydW5zIGFzIHNlbGVjdCAqIGZyb20gX2hyZF9ydW5zO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIGhyZF9vbl9iZWZvcmVfaW5zZXJ0X3J1blxuICAgICAgICBpbnN0ZWFkIG9mIGluc2VydCBvbiBocmRfcnVuc1xuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgaW5zZXJ0IGludG8gX2hyZF9ydW5zICggcm93aWQsIGlub3JuLCBsbywgaGksIGtleSwgdmFsdWUgKSB2YWx1ZXNcbiAgICAgICAgICAgICAgKCBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZCgpLCBfaHJkX2dldF9ydW5faW5vcm4oKSwgbmV3LmxvLCBuZXcuaGksIG5ldy5rZXksIG5ldy52YWx1ZSApO1xuICAgICAgICAgICAgZW5kO1xuICAgICAgICA7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9mYW1pbGllcyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBjb3VudCgqKSAgYXMgcnVuc1xuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGdyb3VwIGJ5IGEua2V5LCBhLnZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkgYS5rZXksIGEudmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2ZhbWlseV9jb25mbGljdHNfMiBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGEucm93aWQgIGFzIHJvd2lkLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG8sXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaSxcbiAgICAgICAgICAgIGEua2V5ICAgIGFzIGtleSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbHlfY29uZmxpY3RzXzEgYXNcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZF9hLFxuICAgICAgICAgICAgYS5sbyAgICAgYXMgbG9fYSxcbiAgICAgICAgICAgIGEuaGkgICAgIGFzIGhpX2EsXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXlfYSxcbiAgICAgICAgICAgIGEudmFsdWUgIGFzIHZhbHVlX2EsXG4gICAgICAgICAgICBiLnJvd2lkICBhcyByb3dpZF9iLFxuICAgICAgICAgICAgYi5sbyAgICAgYXMgbG9fYixcbiAgICAgICAgICAgIGIuaGkgICAgIGFzIGhpX2IsXG4gICAgICAgICAgICBiLmtleSAgICBhcyBrZXlfYixcbiAgICAgICAgICAgIGIudmFsdWUgIGFzIHZhbHVlX2JcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICAgIG9uIHRydWVcbiAgICAgICAgICAgICAgYW5kICggYS5yb3dpZCA8ICAgYi5yb3dpZCApXG4gICAgICAgICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gICAgICAgIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIClcbiAgICAgICAgc2VsZWN0XG4gICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgICAgICAgY2FzZVxuICAgICAgICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgICAgICAgIGZyb20gb3JkZXJlZFxuICAgICAgICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICAgICAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbGllcyBhc1xuICAgICAgICBzZWxlY3QgZGlzdGluY3RcbiAgICAgICAgICAgIGcua2V5ICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBnLnZhbHVlICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICAgICAgICBtaW4oIHIubG8gKSBvdmVyIHcgICAgICAgICAgYXMgZmlyc3QsXG4gICAgICAgICAgICBtYXgoIHIuaGkgKSBvdmVyIHcgICAgICAgICAgYXMgbGFzdCxcbiAgICAgICAgICAgIGcucnVucyAgICAgICAgICAgICAgICAgICAgICBhcyBydW5zLFxuICAgICAgICAgICAgZmFsc2UgICAgICAgICAgICAgICAgICAgICAgIGFzIGhhc19jb25mbGljdCwgLS0gISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISFcbiAgICAgICAgICAgIG4uaXNfbm9ybWFsICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIF9ocmRfZmFtaWxpZXMgICAgICAgICAgIGFzIGdcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX25vcm1hbGl6YXRpb24gICAgIGFzIG4gdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICBsZWZ0IGpvaW4gaHJkX3J1bnMgICAgICAgICAgICAgIGFzIHIgdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSByLmtleSwgci52YWx1ZSApXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X3J1bl9pbm9ybigpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQ6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAtPiBAX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfanNvbl9xdW90ZTpcbiAgICAgICMgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAjICAgdmFsdWU6ICggeCApIC0+IEpTT04uc3RyaW5naWZ5IHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RhdGVtZW50czpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2luc2VydF9ydW46IFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBocmRfcnVucyAoIGxvLCBoaSwga2V5LCB2YWx1ZSApXG4gICAgICAgICAgdmFsdWVzICggJGxvLCAkaGksICRrZXksICR2YWx1ZSApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2ZpbmRfcnVuc19vZl9mYW1pbHlfc29ydGVkOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICgga2V5ICAgPSAka2V5ICAgIClcbiAgICAgICAgICAgIGFuZCAoIHZhbHVlID0gJHZhbHVlICApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qgcm93aWQsIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnNcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9vdmVybGFwc19mb3Jfa2V5OiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICgga2V5ID0gJGtleSApXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJGxvIClcbiAgICAgICAgICBvcmRlciBieSBsbywgaGksIGtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzE6IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlseV9jb25mbGljdHNfMTtcIlwiXCJcbiAgICAgIGhyZF9kZWxldGVfcnVuOiAgICAgICAgICAgICAgICAgU1FMXCJcIlwiZGVsZXRlIGZyb20gX2hyZF9ydW5zIHdoZXJlIHJvd2lkID0gJHJvd2lkO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9mYW1pbGllczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCBrZXksIHZhbHVlIGZyb20gaHJkX25vcm1hbGl6YXRpb24gd2hlcmUgaXNfbm9ybWFsID0gZmFsc2Ugb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcmVtb3ZlX292ZXJsYXBfMTogU1FMXCJcIlwiXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgIGZyb20gKCBzZWxlY3RcbiAgICAgICAgICAgICAgYi5sbyAgICAgIGFzIGxvLFxuICAgICAgICAgICAgICBtLmxvIC0gMSAgYXMgaGksXG4gICAgICAgICAgICAgIGIua2V5ICAgICBhcyBrZXksXG4gICAgICAgICAgICAgIGIudmFsdWUgICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgbSBvbiAoIG0ucm93aWQgPSAkbWFza19yb3dpZCApXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgYW5kIGIubG8gPCBtLmxvXG4gICAgICAgIC0tIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdW5pb24gYWxsIHNlbGVjdFxuICAgICAgICAgICAgICAgIG0uaGkgKyAxLFxuICAgICAgICAgICAgICAgIGIuaGksXG4gICAgICAgICAgICAgICAgYi5rZXksXG4gICAgICAgICAgICAgICAgYi52YWx1ZVxuICAgICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gbS5yb3dpZCA9ICRtYXNrX3Jvd2lkXG4gICAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgICAgYW5kIGIubG8gPD0gbS5oaVxuICAgICAgICAgICAgICBhbmQgYi5oaSA+PSBtLmxvXG4gICAgICAgICAgICAgIGFuZCBiLmhpID4gbS5oaVxuICAgICAgICApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3RvcHJ1bnNfZm9yX3BvaW50OiBTUUxcIlwiXCJcbiAgICAgICAgd2l0aCByYW5rZWQgYXMgKCBzZWxlY3RcbiAgICAgICAgICAgIGEucm93aWQgICAgICAgICAgICAgICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEuaW5vcm4gICAgICAgICAgICAgICBhcyBpbm9ybixcbiAgICAgICAgICAgIHJvd19udW1iZXIoKSBvdmVyIHcgICBhcyBybixcbiAgICAgICAgICAgIGEubG8gICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgIGEuaGkgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgIGEuZmFjZXQgICAgICAgICAgICAgICBhcyBmYWNldCxcbiAgICAgICAgICAgIGEua2V5ICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICAgICAgICAgICAgICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgICBhbmQgKCBsbyA8PSAkcG9pbnQgKVxuICAgICAgICAgICAgYW5kICggaGkgPj0gJHBvaW50IClcbiAgICAgICAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSBhLmtleSBvcmRlciBieSBhLmlub3JuIGRlc2MgKSApXG4gICAgICAgIHNlbGVjdCAqIGZyb20gcmFua2VkIHdoZXJlICggcm4gPSAxICkgb3JkZXIgYnkga2V5IGFzYztcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbWV0aG9kczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2FzX2hhbGZvcGVuOiAgICggcnVuICAgICAgICkgLT4geyBzdGFydDogcnVuLmxvLCAgICAgICAgIGVuZDogIHJ1bi5oaSAgICAgICAgKyAxLCB9XG4gICAgICBfaHJkX2Zyb21faGFsZm9wZW46ICggaGFsZm9wZW4gICkgLT4geyBsbzogICAgaGFsZm9wZW4uc3RhcnQsIGhpOiAgIGhhbGZvcGVuLmVuZCAgLSAxLCB9XG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIF9ocmRfc3VidHJhY3Q6ICggYmFzZSwgbWFzayApIC0+XG4gICAgICAjICAgaGFsZm9wZW5zID0gSUZOLnN1YnN0cmFjdCBbICggQF9ocmRfYXNfaGFsZm9wZW4gYmFzZSApLCBdLCBbICggQF9ocmRfYXNfaGFsZm9wZW4gbWFzayApLCBdXG4gICAgICAjICAgcmV0dXJuICggQF9ocmRfZnJvbV9oYWxmb3BlbiBoYWxmb3BlbiBmb3IgaGFsZm9wZW4gaW4gaGFsZm9wZW5zIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiAgICAgICAgICAgICAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc1xuICAgICAgaHJkX2ZpbmRfbm9ubm9ybWFsX2ZhbWlsaWVzOiAgLT4gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfbm9ubm9ybWFsX2ZhbWlsaWVzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyMjIFRBSU5UIHNob3VsZCB1c2UgYG5mYWAgYnV0IGN1cnJlbnRseSBmYWlscyBmb3IgZ2VuZXJhdG9ycyAjIyNcbiAgICAgICMgaHJkX2ZpbmRfZmFtaWxpZXM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuaHJkX2ZpbmRfZmFtaWxpZXMsIH0sICgga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgIGhyZF9maW5kX2ZhbWlsaWVzOiAoIGNmZyApIC0+XG4gICAgICAgIGNmZyA9IHsgdGVtcGxhdGVzLmhyZF9maW5kX2ZhbWlsaWVzLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIGNmZy5rZXk/IGFuZCBjZmcudmFsdWU/XG4gICAgICAgICAgICBjZmcudmFsdWUgPSBKU09OLnN0cmluZ2lmeSBjZmcudmFsdWVcbiAgICAgICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIHdoZXJlIGtleSA9ICRrZXkgYW5kIHZhbHVlID0gJHZhbHVlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAgICAgd2hlbiBjZmcua2V5P1xuICAgICAgICAgICAgc3FsICAgICAgID0gU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWxpZXMgd2hlcmUga2V5ID0gJGtleSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgICAgIHdoZW4gY2ZnLnZhbHVlP1xuICAgICAgICAgICAgY2ZnLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkgY2ZnLnZhbHVlXG4gICAgICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyB3aGVyZSB2YWx1ZSA9ICR2YWx1ZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBzcWwsIGNmZ1xuICAgICAgICAgIHJvdy5oYXNfY29uZmxpY3QgID0gYXNfYm9vbCByb3cuaGFzX2NvbmZsaWN0XG4gICAgICAgICAgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgICAgICByb3cudmFsdWUgICAgICAgICA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xOiAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xXG4gICAgICAgICAgIyByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgICMgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9ydW5faW5vcm46IC0+IEBzdGF0ZS5ocmRfcnVuX2lub3JuID0gKCBAc3RhdGUuaHJkX3J1bl9pbm9ybiA/IDAgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPlxuICAgICAgICBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9IFIgPSBAX2hyZF9nZXRfcnVuX2lub3JuKCkgKyAxXG4gICAgICAgIHJldHVybiBcInQ6aHJkOnJ1bnM6Uj0je1J9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZzogKCBsbywgaGksIGtleSwgdmFsdWUgKSAtPlxuICAgICAgICBoaSAgID89IGxvXG4gICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgcmV0dXJuIHsgbG8sIGhpLCBrZXksIHZhbHVlLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBocmRfZmluZF9vdmVybGFwczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5sb19oaSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9vdmVybGFwczogKCBsbywgaGkgPSBudWxsICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfb3ZlcmxhcHMsIHsgbG8sIGhpLCB9XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24sIHVzZSBjYXN0aW5nIG1ldGhvZCAjIyNcbiAgICAgICAgICBoaWRlIHJvdywgJ3ZhbHVlX2pzb24nLCByb3cudmFsdWVcbiAgICAgICAgICByb3cudmFsdWUgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9hZGRfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAgICAgcmV0dXJuIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0XzE6ICggY29uZmxpY3QsIG9rX3ZhbHVlX2pzb24gKSAtPlxuICAgICAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgICAgICByb3dpZF9iLCBsb19iLCBoaV9iLCBrZXlfYiwgdmFsdWVfYiwgfSAgPSBjb25mbGljdFxuICAgICAgICAgIHJ1bl9vayA9IHsgcm93aWQ6IHJvd2lkX2EsIGxvOiBsb19hLCBoaTogaGlfYSwga2V5OiBrZXlfYSwgdmFsdWU6IHZhbHVlX2EsIH1cbiAgICAgICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rLCBydW5fbmssIH0gaWYgcnVuX29rLnZhbHVlIGlzIG9rX3ZhbHVlX2pzb25cbiAgICAgICAgICByZXR1cm4geyBydW5fb2s6IHJ1bl9uaywgcnVuX25rOiBydW5fb2ssIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfcHVuY2hfMTogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgICMjIyBsaWtlIGBfaHJkX2FkZF9ydW4oKWAgYnV0IHJlc29sdmVzIGtleS92YWx1ZSBjb25mbGljdHMgaW4gZmF2b3Igb2YgdmFsdWUgZ2l2ZW4gIyMjXG4gICAgICAgICMgQGhyZF92YWxpZGF0ZV8xKClcbiAgICAgICAgbmV3X29rID0gQF9ocmRfY3JlYXRlX2luc2VydF9ydW5fY2ZnIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICBAd2l0aF90cmFuc2FjdGlvbiA9PlxuICAgICAgICAgIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gbmV3X29rXG4gICAgICAgICAgY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzEoKSApLi4uLCBdXG4gICAgICAgICAgZm9yIGNvbmZsaWN0IGluIGNvbmZsaWN0c1xuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIGNvbmZsaWN0LmtleV9hIGlzIG5ld19vay5rZXkgIyMjIGRvIG5vdCByZXNvbHZlIGNvbmZsaWN0cyBvZiBvdGhlciBrZXkvdmFsdWUgcGFpcnMgIyMjXG4gICAgICAgICAgICB7IHJ1bl9vaywgcnVuX25rLCB9ID0gQF9ocmRfcnVuc19mcm9tX2NvbmZsaWN0XzEgY29uZmxpY3QsIG5ld19vay52YWx1ZVxuICAgICAgICAgICAgQHN0YXRlbWVudHMuaHJkX3JlbW92ZV9vdmVybGFwXzEucnVuIHsgYmFzZV9yb3dpZDogcnVuX25rLnJvd2lkLCBtYXNrX3Jvd2lkOiBydW5fb2sucm93aWQsIH1cbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfcnVuLnJ1biB7IHJvd2lkOiBydW5fbmsucm93aWQsIH1cbiAgICAgICAgICAgIDtudWxsXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9ub3JtYWxpemVfZmFtaWx5OiAoIGtleSwgdmFsdWVfanNvbiApIC0+XG4gICAgICAgICMjIyBUQUlOVCBwb3RlbnRpYWxseSBkb2luZyB0b28gbXVjaCBhcyB3ZSBvbmx5IGhhdmUgdG8gam9pbiBhZGphY2VudCwgcmVtb3ZlIG92ZXJsYXBzICMjI1xuICAgICAgICBAd2l0aF90cmFuc2FjdGlvbiA9PlxuICAgICAgICAgIG9sZF9ydW5zICAgICAgPSBAZ2V0X2FsbCBAc3RhdGVtZW50cy5faHJkX2ZpbmRfcnVuc19vZl9mYW1pbHlfc29ydGVkLCB7IGtleSwgdmFsdWU6IHZhbHVlX2pzb24sIH1cbiAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfZGVsZXRlX3J1bi5ydW4geyByb3dpZDogb2xkX3J1bi5yb3dpZCwgfSBmb3Igb2xkX3J1biBpbiBvbGRfcnVuc1xuICAgICAgICAgIG9sZF9oYWxmb3BlbnMgPSAoIEBfaHJkX2FzX2hhbGZvcGVuIG9sZF9ydW4gZm9yIG9sZF9ydW4gaW4gb2xkX3J1bnMgKVxuICAgICAgICAgIG5ld19oYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgb2xkX2hhbGZvcGVuc1xuICAgICAgICAgIG5ld19ydW5zICAgICAgPSAoIEBfaHJkX2Zyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIG5ld19oYWxmb3BlbnMgKVxuICAgICAgICAgIHZhbHVlICAgICAgICAgPSBKU09OLnBhcnNlIHZhbHVlX2pzb25cbiAgICAgICAgICBAaHJkX2FkZF9ydW4geyBuZXdfcnVuLi4uLCBrZXksIHZhbHVlLCB9IGZvciBuZXdfcnVuIGluIG5ld19ydW5zXG4gICAgICAgICAgO251bGxcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfbm9ybWFsaXplOiAtPlxuICAgICAgICBmYW1pbGllcyA9IEBnZXRfYWxsIFNRTFwic2VsZWN0ICogZnJvbSBocmRfbm9ybWFsaXphdGlvbiB3aGVyZSBpc19ub3JtYWwgPSBmYWxzZTtcIlxuICAgICAgICBmb3IgZmFtaWx5IGluIGZhbWlsaWVzXG4gICAgICAgICAgQF9ocmRfbm9ybWFsaXplX2ZhbWlseSBmYW1pbHkua2V5LCBmYW1pbHkudmFsdWVcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfdmFsaWRhdGVfMTogLT5cbiAgICAgICAgcmV0dXJuIG51bGwgaWYgKCBjb25mbGljdHMgPSBbICggQGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMSgpICkuLi4sIF0gKS5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhyZF9fXzYgZm91bmQgY29uZmxpY3RzOiAje3JwciBjb25mbGljdHN9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICAgIGZvciByb3cgZnJvbSBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludCwgeyBwb2ludCwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgZGJyaWNfcGx1Z2luLFxuICB9XG5cblxuIl19
