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
        SQL`create index "hrd_index_runs_lo_hi"       on _hrd_runs ( lo,  hi  );`,
        SQL`create index "hrd_index_runs_hi"          on _hrd_runs (      hi  );`,
        SQL`create index "hrd_index_runs_inorm_desc"  on _hrd_runs (      inorn desc );`,
        SQL`create index "hrd_index_runs_key"         on _hrd_runs ( key      );`,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbjIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7O0VBSUEsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHVDQUFSOztFQUM1QixDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQVBBOzs7RUFTQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSw4QkFBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxZQURGLEVBRUUsbUJBRkYsRUFHRSxVQUhGLENBQUEsR0FHNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBSDVCOztFQUlBLENBQUE7SUFBRSxPQUFBLEVBQVM7RUFBWCxDQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSLENBQTVCLEVBaEJBOzs7O0VBbUJBLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxTQURGLEVBRUUsSUFGRixFQUdFLEtBSEYsRUFJRSxPQUpGLEVBS0UsU0FMRixFQU1FLEdBTkYsRUFPRSxHQVBGLEVBUUUsR0FSRixFQVNFLEdBVEYsQ0FBQSxHQVM0QixPQUFBLENBQVEsU0FBUixDQVQ1QixFQXBCQTs7OztFQWlDQSxJQUFBLEdBQU8sUUFBQSxDQUFFLFFBQUYsRUFBWSxXQUFXLElBQXZCLENBQUE7QUFDUCxRQUFBO0lBQUUsS0FBQSxHQUFXLEtBQUssQ0FBQyxPQUFULEdBQXNCLENBQUUsR0FBQSxRQUFGLENBQXRCLEdBQTRDLENBQUUsR0FBQSxRQUFGO0lBQ3BELFFBQUEsQ0FBUyxLQUFUO0FBQ0EsV0FBTyxNQUFBLENBQU8sS0FBUDtFQUhGLEVBakNQOzs7RUF1Q0EsU0FBQSxHQUNFO0lBQUEsV0FBQSxFQUNFO01BQUEsRUFBQSxFQUFVLENBQVY7TUFDQSxFQUFBLEVBQVUsSUFEVjtNQUVBLEdBQUEsRUFBVSxJQUZWO01BR0EsS0FBQSxFQUFVO0lBSFYsQ0FERjtJQUtBLGlCQUFBLEVBQ0U7TUFBQSxHQUFBLEVBQVUsSUFBVjtNQUNBLEtBQUEsRUFBVTtJQURWO0VBTkYsRUF4Q0Y7OztFQW1EQSxZQUFBLEdBQ0U7SUFBQSxJQUFBLEVBQVEsa0JBQW1CLG9DQUEzQjtJQUNBLE1BQUEsRUFBUSxLQUFtQixvQ0FEM0I7SUFFQSxPQUFBLEVBR0UsQ0FBQTs7TUFBQSxLQUFBLEVBQU87O1FBR0wsR0FBRyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7a0JBQUEsQ0FBQSxDQWVtQixNQUFNLENBQUMsZ0JBZjFCLENBQUE7a0JBQUEsQ0FBQSxDQWdCbUIsTUFBTSxDQUFDLGdCQWhCMUIsQ0FBQTs7OztrQkFBQSxDQUFBLENBb0JtQixNQUFNLENBQUMsZ0JBcEIxQixDQUFBO2tCQUFBLENBQUEsQ0FxQm1CLE1BQU0sQ0FBQyxnQkFyQjFCLENBQUE7Ozs7U0FBQSxDQUhFOztRQStCTCxHQUFHLENBQUEsb0VBQUEsQ0EvQkU7UUFnQ0wsR0FBRyxDQUFBLG9FQUFBLENBaENFO1FBaUNMLEdBQUcsQ0FBQSwyRUFBQSxDQWpDRTtRQWtDTCxHQUFHLENBQUEsb0VBQUEsQ0FsQ0U7O1FBcUNMLEdBQUcsQ0FBQSxnREFBQSxDQXJDRTs7UUF3Q0wsR0FBRyxDQUFBOzs7Ozs7Q0FBQSxDQXhDRTs7UUFpREwsR0FBRyxDQUFBOzs7Ozs7OzBCQUFBLENBakRFOztRQTJETCxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7OzZCQUFBLENBM0RFOztRQTRFTCxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQUFBLENBNUVFOztRQW1HTCxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFBQSxDQW5HRTs7UUF3SEwsR0FBRyxDQUFBOzs7Ozs7Ozs7Ozs7O3NCQUFBLENBeEhFO09BQVA7OztNQTBJQSxTQUFBLEVBR0UsQ0FBQTs7UUFBQSxrQkFBQSxFQUNFO1VBQUEsYUFBQSxFQUFlLEtBQWY7VUFDQSxLQUFBLEVBQU8sUUFBQSxDQUFBLENBQUE7bUJBQUcsSUFBQyxDQUFBLGtCQUFELENBQUE7VUFBSDtRQURQLENBREY7O1FBS0EsdUJBQUEsRUFDRTtVQUFBLGFBQUEsRUFBZSxLQUFmO1VBQ0EsS0FBQSxFQUFPLFFBQUEsQ0FBQSxDQUFBO21CQUFHLElBQUMsQ0FBQSx1QkFBRCxDQUFBO1VBQUg7UUFEUDtNQU5GLENBN0lGOzs7Ozs7O01BNEpBLFVBQUEsRUFHRSxDQUFBOztRQUFBLGVBQUEsRUFBaUIsR0FBRyxDQUFBO29DQUFBLENBQXBCOztRQUtBLGFBQUEsRUFBZSxHQUFHLENBQUE7O3VCQUFBLENBTGxCOztRQVdBLCtCQUFBLEVBQWlDLEdBQUcsQ0FBQTs7Ozs7dUJBQUEsQ0FYcEM7O1FBb0JBLGlCQUFBLEVBQW1CLEdBQUcsQ0FBQTs7Ozs7dUJBQUEsQ0FwQnRCOztRQTZCQSx5QkFBQSxFQUEyQixHQUFHLENBQUE7Ozs7Ozt1QkFBQSxDQTdCOUI7O1FBdUNBLDhCQUFBLEVBQWdDLEdBQUcsQ0FBQSxxQ0FBQSxDQXZDbkM7UUF3Q0EsY0FBQSxFQUFnQyxHQUFHLENBQUEsMkNBQUEsQ0F4Q25DOztRQTJDQSwyQkFBQSxFQUE2QixHQUFHLENBQUEscUZBQUEsQ0EzQ2hDOztRQStDQSxvQkFBQSxFQUFzQixHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFBQSxDQS9DekI7O1FBK0VBLDBCQUFBLEVBQTRCLEdBQUcsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7dURBQUE7TUEvRS9CLENBL0pGOztNQWdRQSxPQUFBLEVBR0UsQ0FBQTs7UUFBQSxnQkFBQSxFQUFvQixRQUFBLENBQUUsR0FBRixDQUFBO2lCQUFpQjtZQUFFLEtBQUEsRUFBTyxHQUFHLENBQUMsRUFBYjtZQUF5QixHQUFBLEVBQU0sR0FBRyxDQUFDLEVBQUosR0FBZ0I7VUFBL0M7UUFBakIsQ0FBcEI7UUFDQSxrQkFBQSxFQUFvQixRQUFBLENBQUUsUUFBRixDQUFBO2lCQUFpQjtZQUFFLEVBQUEsRUFBTyxRQUFRLENBQUMsS0FBbEI7WUFBeUIsRUFBQSxFQUFNLFFBQVEsQ0FBQyxHQUFULEdBQWdCO1VBQS9DO1FBQWpCLENBRHBCOzs7Ozs7O1FBU0EsYUFBQSxFQUE0QixRQUFBLENBQUEsQ0FBQTtpQkFBRyxJQUFDLENBQUEsSUFBRCxDQUFNLElBQUMsQ0FBQSxVQUFVLENBQUMsYUFBbEI7UUFBSCxDQVQ1QjtRQVVBLDJCQUFBLEVBQThCLFFBQUEsQ0FBQSxDQUFBO2lCQUFHLElBQUMsQ0FBQSxJQUFELENBQU0sSUFBQyxDQUFBLFVBQVUsQ0FBQywyQkFBbEI7UUFBSCxDQVY5Qjs7OztRQWVBLGlCQUFBLEVBQW1CLFNBQUEsQ0FBRSxHQUFGLENBQUE7QUFDekIsY0FBQSxHQUFBLEVBQUE7VUFBUSxHQUFBLEdBQU0sQ0FBRSxHQUFBLFNBQVMsQ0FBQyxpQkFBWixFQUFrQyxHQUFBLEdBQWxDO0FBQ04sa0JBQU8sSUFBUDtBQUFBLGlCQUNPLGlCQUFBLElBQWEsbUJBRHBCO2NBRUksR0FBRyxDQUFDLEtBQUosR0FBWSxJQUFJLENBQUMsU0FBTCxDQUFlLEdBQUcsQ0FBQyxLQUFuQjtjQUNaLEdBQUEsR0FBWSxHQUFHLENBQUEsbUZBQUE7QUFGWjtBQURQLGlCQUlPLGVBSlA7Y0FLSSxHQUFBLEdBQVksR0FBRyxDQUFBLGdFQUFBO0FBRFo7QUFKUCxpQkFNTyxpQkFOUDtjQU9JLEdBQUcsQ0FBQyxLQUFKLEdBQVksSUFBSSxDQUFDLFNBQUwsQ0FBZSxHQUFHLENBQUMsS0FBbkI7Y0FDWixHQUFBLEdBQVksR0FBRyxDQUFBLG9FQUFBO0FBRlo7QUFOUDtjQVVJLEdBQUEsR0FBWSxHQUFHLENBQUEsK0NBQUE7QUFWbkI7VUFXQSxLQUFBLDBCQUFBO1lBQ0UsR0FBRyxDQUFDLFlBQUosR0FBb0IsT0FBQSxDQUFRLEdBQUcsQ0FBQyxZQUFaO1lBQ3BCLEdBQUcsQ0FBQyxTQUFKLEdBQW9CLE9BQUEsQ0FBUSxHQUFHLENBQUMsU0FBWjtZQUNwQixHQUFHLENBQUMsS0FBSixHQUFvQixJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxLQUFmO1lBQ3BCLE1BQU07VUFKUjtpQkFLQztRQWxCZ0IsQ0FmbkI7O1FBb0NBLDhCQUFBLEVBQWdDLFNBQUEsQ0FBQSxDQUFBO0FBQ3RDLGNBQUE7VUFBUSxLQUFBLGdFQUFBLEdBQUE7OztZQUdFLE1BQU07VUFIUjtpQkFJQztRQUw2QixDQXBDaEM7O1FBNENBLGtCQUFBLEVBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQUUsY0FBQTtpQkFBQyxJQUFDLENBQUEsS0FBSyxDQUFDLGFBQVAsb0RBQWdEO1FBQW5ELENBNUNwQjs7UUErQ0EsdUJBQUEsRUFBeUIsUUFBQSxDQUFBLENBQUE7QUFDL0IsY0FBQTtVQUFRLElBQUMsQ0FBQSxLQUFLLENBQUMsYUFBUCxHQUF1QixDQUFBLEdBQUksSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FBQSxHQUF3QjtBQUNuRCxpQkFBTyxDQUFBLGFBQUEsQ0FBQSxDQUFnQixDQUFoQixDQUFBO1FBRmdCLENBL0N6Qjs7UUFvREEsMEJBQUEsRUFBNEIsUUFBQSxDQUFFLEVBQUYsRUFBTSxFQUFOLEVBQVUsR0FBVixFQUFlLEtBQWYsQ0FBQTs7WUFDMUIsS0FBUTs7VUFDUixLQUFBLEdBQVEsSUFBSSxDQUFDLFNBQUwsQ0FBZSxLQUFmO0FBQ1IsaUJBQU8sQ0FBRSxFQUFGLEVBQU0sRUFBTixFQUFVLEdBQVYsRUFBZSxLQUFmO1FBSG1CLENBcEQ1Qjs7O1FBMkRBLGlCQUFBLEVBQW1CLFNBQUEsQ0FBRSxFQUFGLEVBQU0sS0FBSyxJQUFYLENBQUE7QUFDekIsY0FBQTs7WUFBUSxLQUFROztVQUNSLEtBQUEsNkRBQUEsR0FBQTs7WUFFRSxJQUFBLENBQUssR0FBTCxFQUFVLFlBQVYsRUFBd0IsR0FBRyxDQUFDLEtBQTVCO1lBQ0EsR0FBRyxDQUFDLEtBQUosR0FBWSxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxLQUFmO1lBQ1osTUFBTTtVQUpSO2lCQUtDO1FBUGdCLENBM0RuQjs7UUFxRUEsV0FBQSxFQUFhLEdBQUEsQ0FBSTtVQUFFLFFBQUEsRUFBVSxTQUFTLENBQUM7UUFBdEIsQ0FBSixFQUEwQyxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sRUFBVSxHQUFWLEVBQWUsS0FBZixFQUFzQixHQUF0QixDQUFBO0FBQ3JELGlCQUFPLElBQUMsQ0FBQSxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQTVCLENBQWdDLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixFQUE1QixFQUFnQyxFQUFoQyxFQUFvQyxHQUFwQyxFQUF5QyxLQUF6QyxDQUFoQztRQUQ4QyxDQUExQyxDQXJFYjs7UUF5RUEseUJBQUEsRUFBMkIsUUFBQSxDQUFFLFFBQUYsRUFBWSxhQUFaLENBQUE7QUFDakMsY0FBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBO1VBQVUsQ0FBQSxDQUFFLE9BQUYsRUFBVyxJQUFYLEVBQWlCLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLE9BQTlCLEVBQ0UsT0FERixFQUNXLElBRFgsRUFDaUIsSUFEakIsRUFDdUIsS0FEdkIsRUFDOEIsT0FEOUIsQ0FBQSxHQUM0QyxRQUQ1QztVQUVBLE1BQUEsR0FBUztZQUFFLEtBQUEsRUFBTyxPQUFUO1lBQWtCLEVBQUEsRUFBSSxJQUF0QjtZQUE0QixFQUFBLEVBQUksSUFBaEM7WUFBc0MsR0FBQSxFQUFLLEtBQTNDO1lBQWtELEtBQUEsRUFBTztVQUF6RDtVQUNULE1BQUEsR0FBUztZQUFFLEtBQUEsRUFBTyxPQUFUO1lBQWtCLEVBQUEsRUFBSSxJQUF0QjtZQUE0QixFQUFBLEVBQUksSUFBaEM7WUFBc0MsR0FBQSxFQUFLLEtBQTNDO1lBQWtELEtBQUEsRUFBTztVQUF6RDtVQUNULElBQThCLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLGFBQTlDO0FBQUEsbUJBQU8sQ0FBRSxNQUFGLEVBQVUsTUFBVixFQUFQOztBQUNBLGlCQUFPO1lBQUUsTUFBQSxFQUFRLE1BQVY7WUFBa0IsTUFBQSxFQUFRO1VBQTFCO1FBTmdCLENBekUzQjs7UUFrRkEsV0FBQSxFQUFhLEdBQUEsQ0FBSTtVQUFFLFFBQUEsRUFBVSxTQUFTLENBQUM7UUFBdEIsQ0FBSixFQUEwQyxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sRUFBVSxHQUFWLEVBQWUsS0FBZixFQUFzQixHQUF0QixDQUFBO0FBQzdELGNBQUEsTUFBQTs7O1VBRVEsTUFBQSxHQUFTLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixFQUE1QixFQUFnQyxFQUFoQyxFQUFvQyxHQUFwQyxFQUF5QyxLQUF6QztVQUNULElBQUMsQ0FBQSxnQkFBRCxDQUFrQixDQUFBLENBQUEsR0FBQTtBQUMxQixnQkFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQTtZQUFVLElBQUMsQ0FBQSxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQTVCLENBQWdDLE1BQWhDO1lBQ0EsU0FBQSxHQUFZLENBQUUsR0FBQSxDQUFFLElBQUMsQ0FBQSw4QkFBRCxDQUFBLENBQUYsQ0FBRjtBQUNaO1lBQUEsS0FBQSwyQ0FBQTs7Y0FDRSxJQUFnQixRQUFRLENBQUMsS0FBVCxLQUFrQixNQUFNLENBQUMsR0FBSSx1REFBN0M7QUFBQSx5QkFBQTs7Y0FDQSxDQUFBLENBQUUsTUFBRixFQUFVLE1BQVYsQ0FBQSxHQUFzQixJQUFDLENBQUEseUJBQUQsQ0FBMkIsUUFBM0IsRUFBcUMsTUFBTSxDQUFDLEtBQTVDLENBQXRCO2NBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFqQyxDQUFxQztnQkFBRSxVQUFBLEVBQVksTUFBTSxDQUFDLEtBQXJCO2dCQUE0QixVQUFBLEVBQVksTUFBTSxDQUFDO2NBQS9DLENBQXJDO2NBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxjQUFjLENBQUMsR0FBM0IsQ0FBK0I7Z0JBQUUsS0FBQSxFQUFPLE1BQU0sQ0FBQztjQUFoQixDQUEvQjsyQkFDQztZQUxILENBQUE7O1VBSGdCLENBQWxCO2lCQVNDO1FBYm9ELENBQTFDLENBbEZiOztRQWtHQSxxQkFBQSxFQUF1QixRQUFBLENBQUUsR0FBRixFQUFPLFVBQVAsQ0FBQSxFQUFBOztVQUVyQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsQ0FBQSxDQUFBLEdBQUE7QUFDMUIsZ0JBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxhQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxhQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTtZQUFVLFFBQUEsR0FBZ0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFDLENBQUEsVUFBVSxDQUFDLCtCQUFyQixFQUFzRDtjQUFFLEdBQUY7Y0FBTyxLQUFBLEVBQU87WUFBZCxDQUF0RDtZQUNoQixLQUFBLDBDQUFBOztjQUFBLElBQUMsQ0FBQSxVQUFVLENBQUMsY0FBYyxDQUFDLEdBQTNCLENBQStCO2dCQUFFLEtBQUEsRUFBTyxPQUFPLENBQUM7Y0FBakIsQ0FBL0I7WUFBQTtZQUNBLGFBQUE7O0FBQWtCO2NBQUEsS0FBQSw0Q0FBQTs7NkJBQUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLE9BQWxCO2NBQUEsQ0FBQTs7O1lBQ2xCLGFBQUEsR0FBZ0IsR0FBRyxDQUFDLFFBQUosQ0FBYSxhQUFiO1lBQ2hCLFFBQUE7O0FBQWtCO2NBQUEsS0FBQSxpREFBQTs7NkJBQUEsSUFBQyxDQUFBLGtCQUFELENBQW9CLFFBQXBCO2NBQUEsQ0FBQTs7O1lBQ2xCLEtBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUwsQ0FBVyxVQUFYO1lBQ2hCLEtBQUEsNENBQUE7O2NBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFFLEdBQUEsT0FBRixFQUFjLEdBQWQsRUFBbUIsS0FBbkIsQ0FBYjtZQUFBO21CQUNDO1VBUmUsQ0FBbEI7aUJBU0M7UUFYb0IsQ0FsR3ZCOztRQWdIQSxhQUFBLEVBQWUsUUFBQSxDQUFBLENBQUE7QUFDckIsY0FBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLENBQUEsRUFBQTtVQUFRLFFBQUEsR0FBVyxJQUFDLENBQUEsT0FBRCxDQUFTLEdBQUcsQ0FBQSx3REFBQSxDQUFaO1VBQ1gsS0FBQSwwQ0FBQTs7WUFDRSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsTUFBTSxDQUFDLEdBQTlCLEVBQW1DLE1BQU0sQ0FBQyxLQUExQztVQURGO2lCQUVDO1FBSlksQ0FoSGY7O1FBdUhBLGNBQUEsRUFBZ0IsUUFBQSxDQUFBLENBQUE7QUFDdEIsY0FBQTtVQUFRLElBQWUsQ0FBRSxTQUFBLEdBQVksQ0FBRSxHQUFBLENBQUUsSUFBQyxDQUFBLDhCQUFELENBQUEsQ0FBRixDQUFGLENBQWQsQ0FBNkQsQ0FBQyxNQUE5RCxLQUF3RSxDQUF2RjtBQUFBLG1CQUFPLEtBQVA7O1VBQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDBCQUFBLENBQUEsQ0FBNkIsR0FBQSxDQUFJLFNBQUosQ0FBN0IsQ0FBQSxDQUFWO1FBRlEsQ0F2SGhCOztRQTRIQSwwQkFBQSxFQUE0QixTQUFBLENBQUUsS0FBRixDQUFBO0FBQ2xDLGNBQUE7VUFBUSxLQUFBLHFFQUFBLEdBQUE7O1lBRUUsSUFBQSxDQUFLLEdBQUwsRUFBVSxZQUFWLEVBQXdCLEdBQUcsQ0FBQyxLQUE1QjtZQUNBLEdBQUcsQ0FBQyxLQUFKLEdBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsS0FBZjtZQUNaLE1BQU07VUFKUjtpQkFLQztRQU55QjtNQTVINUI7SUFuUUY7RUFMRixFQXBERjs7O0VBaWNBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjO01BQUUsU0FBRjtNQUFhLEdBQWI7TUFBa0IsSUFBbEI7TUFBd0IsU0FBQSxFQUFXO0lBQW5DLENBQWQ7QUFDWixXQUFPLENBQ0wsWUFESztFQUZXLENBQUE7QUFqY3BCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBmLCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gIGFkZF9ydW5fY2ZnOlxuICAgIGxvOiAgICAgICAwXG4gICAgaGk6ICAgICAgIG51bGxcbiAgICBrZXk6ICAgICAgbnVsbFxuICAgIHZhbHVlOiAgICBudWxsXG4gIGhyZF9maW5kX2ZhbWlsaWVzOlxuICAgIGtleTogICAgICBudWxsXG4gICAgdmFsdWU6ICAgIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRicmljX3BsdWdpbiA9XG4gIG5hbWU6ICAgJ2hyZF9ob2FyZF9wbHVnaW4nICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIHByZWZpeDogJ2hyZCcgICAgICAgICAgICAgICMjIyBOT1RFIGluZm9ybWF0aXZlLCBub3QgZW5mb3JjZWQgIyMjXG4gIGV4cG9ydHM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIF9ocmRfcnVucyAoXG4gICAgICAgICAgICByb3dpZCAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICBpbm9ybiAgIGludGVnZXIgbm90IG51bGwsIC0tIElOc2VydGlvbiBPUmRlciBOdW1iZXJcbiAgICAgICAgICAgIGxvICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgcmVhbCAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGZhY2V0ICAgdGV4dCAgICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggcHJpbnRmKCAnJXM6JXMnLCBrZXksIHZhbHVlICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBrZXkgICAgIHRleHQgICAgbm90IG51bGwsXG4gICAgICAgICAgICB2YWx1ZSAgIHRleHQgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsIC0tIHByb3BlciBkYXRhIHR5cGUgaXMgYGpzb25gIGJ1dCBkZWNsYXJlZCBhcyBgdGV4dGAgYi9jIG9mIGBzdHJpY3RgXG4gICAgICAgICAgcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIHVuaXF1ZSAoIHJvd2lkICksXG4gICAgICAgICAgdW5pcXVlICggaW5vcm4gKSxcbiAgICAgICAgICAtLSB1bmlxdWUgKCBsbywgaGksIGtleSwgdmFsdWUgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzFcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggbG8gKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGxvID0gY2FzdCggbG8gYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gbG8gKVxuICAgICAgICAgICAgICBhbmQgKCBsbyA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzJcIiBjaGVjayAoXG4gICAgICAgICAgICAoIGFicyggaGkgKSA9IDllOTk5ICkgb3IgKFxuICAgICAgICAgICAgICAoIGhpID0gY2FzdCggaGkgYXMgaW50ZWdlciApIClcbiAgICAgICAgICAgICAgYW5kICggICAgICAgI3tOdW1iZXIuTUlOX1NBRkVfSU5URUdFUn0gPD0gaGkgKVxuICAgICAgICAgICAgICBhbmQgKCBoaSA8PSAje051bWJlci5NQVhfU0FGRV9JTlRFR0VSfSApICkgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqlocmRfY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIDw9IGhpICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6paHJkX2NvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBrZXkgcmVnZXhwICcuKicgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWhyZF9jb25zdHJhaW50X19fNVwiIGNoZWNrICgga2V5IHJlZ2V4cCAnXlxcJHgkfF5bXiRdLisnIClcbiAgICAgICAgKSBzdHJpY3Q7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfbG9faGlcIiAgICAgICBvbiBfaHJkX3J1bnMgKCBsbywgIGhpICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaGlcIiAgICAgICAgICBvbiBfaHJkX3J1bnMgKCAgICAgIGhpICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIGluZGV4IFwiaHJkX2luZGV4X3J1bnNfaW5vcm1fZGVzY1wiICBvbiBfaHJkX3J1bnMgKCAgICAgIGlub3JuIGRlc2MgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSBpbmRleCBcImhyZF9pbmRleF9ydW5zX2tleVwiICAgICAgICAgb24gX2hyZF9ydW5zICgga2V5ICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfcnVucyBhcyBzZWxlY3QgKiBmcm9tIF9ocmRfcnVucztcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdHJpZ2dlciBocmRfb25fYmVmb3JlX2luc2VydF9ydW5cbiAgICAgICAgaW5zdGVhZCBvZiBpbnNlcnQgb24gaHJkX3J1bnNcbiAgICAgICAgICBmb3IgZWFjaCByb3cgYmVnaW5cbiAgICAgICAgICAgIGluc2VydCBpbnRvIF9ocmRfcnVucyAoIHJvd2lkLCBpbm9ybiwgbG8sIGhpLCBrZXksIHZhbHVlICkgdmFsdWVzXG4gICAgICAgICAgICAgICggX2hyZF9nZXRfbmV4dF9ydW5fcm93aWQoKSwgX2hyZF9nZXRfcnVuX2lub3JuKCksIG5ldy5sbywgbmV3LmhpLCBuZXcua2V5LCBuZXcudmFsdWUgKTtcbiAgICAgICAgICAgIGVuZDtcbiAgICAgICAgO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgY291bnQoKikgIGFzIHJ1bnNcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICAgICAgICBncm91cCBieSBhLmtleSwgYS52YWx1ZVxuICAgICAgICAgIG9yZGVyIGJ5IGEua2V5LCBhLnZhbHVlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbHlfY29uZmxpY3RzXzIgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBhLnJvd2lkICBhcyByb3dpZCxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvLFxuICAgICAgICAgICAgYS5oaSAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmtleSAgICBhcyBrZXksXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZVxuICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgICAgICAgIGpvaW4gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgb24gdHJ1ZVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSAhPSAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWx5X2NvbmZsaWN0c18xIGFzXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgYS5yb3dpZCAgYXMgcm93aWRfYSxcbiAgICAgICAgICAgIGEubG8gICAgIGFzIGxvX2EsXG4gICAgICAgICAgICBhLmhpICAgICBhcyBoaV9hLFxuICAgICAgICAgICAgYS5rZXkgICAgYXMga2V5X2EsXG4gICAgICAgICAgICBhLnZhbHVlICBhcyB2YWx1ZV9hLFxuICAgICAgICAgICAgYi5yb3dpZCAgYXMgcm93aWRfYixcbiAgICAgICAgICAgIGIubG8gICAgIGFzIGxvX2IsXG4gICAgICAgICAgICBiLmhpICAgICBhcyBoaV9iLFxuICAgICAgICAgICAgYi5rZXkgICAgYXMga2V5X2IsXG4gICAgICAgICAgICBiLnZhbHVlICBhcyB2YWx1ZV9iXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICAgICAgICBvbiB0cnVlXG4gICAgICAgICAgICAgIGFuZCAoIGEucm93aWQgPCAgIGIucm93aWQgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmtleSAgID0gICBiLmtleSAgIClcbiAgICAgICAgICAgICAgYW5kICggYS52YWx1ZSAhPSAgYi52YWx1ZSApXG4gICAgICAgICAgICAgIGFuZCAoIGEubG8gICAgPD0gIGIuaGkgICAgKVxuICAgICAgICAgICAgICBhbmQgKCBhLmhpICAgID49ICBiLmxvICAgIClcbiAgICAgICAgICBvcmRlciBieSBhLmxvLCBhLmhpLCBhLmtleTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfbm9ybWFsaXphdGlvbiBhc1xuICAgICAgICB3aXRoIG9yZGVyZWQgYXMgKFxuICAgICAgICAgIHNlbGVjdFxuICAgICAgICAgICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgICAgbG8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgaGkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBoaSxcbiAgICAgICAgICAgICAgbGFnKCBoaSApIG92ZXIgKCBwYXJ0aXRpb24gYnkga2V5LCB2YWx1ZSBvcmRlciBieSBsbyApICBhcyBwcmV2X2hpXG4gICAgICAgICAgZnJvbSBocmRfcnVucyApXG4gICAgICAgIHNlbGVjdFxuICAgICAgICAgICAga2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgICAgICAgIHZhbHVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgICAgICAgIGNhc2Ugd2hlbiBzdW0oXG4gICAgICAgICAgICAgIGNhc2VcbiAgICAgICAgICAgICAgICB3aGVuICggcHJldl9oaSBpcyBub3QgbnVsbCApIGFuZCAoIGxvIDw9IHByZXZfaGkgKyAxICkgdGhlbiAxIGVsc2UgMCBlbmQgKSA+IDBcbiAgICAgICAgICAgICAgICB0aGVuIDAgZWxzZSAxIGVuZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICAgICAgICBmcm9tIG9yZGVyZWRcbiAgICAgICAgICBncm91cCBieSBrZXksIHZhbHVlXG4gICAgICAgICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBocmRfZmFtaWxpZXMgYXNcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0XG4gICAgICAgICAgICBnLmtleSAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgZy52YWx1ZSAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICAgICAgbWluKCByLmxvICkgb3ZlciB3ICAgICAgICAgIGFzIGZpcnN0LFxuICAgICAgICAgICAgbWF4KCByLmhpICkgb3ZlciB3ICAgICAgICAgIGFzIGxhc3QsXG4gICAgICAgICAgICBnLnJ1bnMgICAgICAgICAgICAgICAgICAgICAgYXMgcnVucyxcbiAgICAgICAgICAgIGZhbHNlICAgICAgICAgICAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3QsIC0tICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhXG4gICAgICAgICAgICBuLmlzX25vcm1hbCAgICAgICAgICAgICAgICAgYXMgaXNfbm9ybWFsXG4gICAgICAgICAgZnJvbSBfaHJkX2ZhbWlsaWVzICAgICAgICAgICBhcyBnXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ub3JtYWxpemF0aW9uICAgICBhcyBuIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgbGVmdCBqb2luIGhyZF9ydW5zICAgICAgICAgICAgICBhcyByIHVzaW5nICgga2V5LCB2YWx1ZSApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgci5rZXksIHIudmFsdWUgKVxuICAgICAgICAgIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X3J1bl9pbm9ybjpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6IC0+IEBfaHJkX2dldF9ydW5faW5vcm4oKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogLT4gQF9ocmRfZ2V0X25leHRfcnVuX3Jvd2lkKClcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2pzb25fcXVvdGU6XG4gICAgICAjICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgIyAgIHZhbHVlOiAoIHggKSAtPiBKU09OLnN0cmluZ2lmeSB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9pbnNlcnRfcnVuOiBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gaHJkX3J1bnMgKCBsbywgaGksIGtleSwgdmFsdWUgKVxuICAgICAgICAgIHZhbHVlcyAoICRsbywgJGhpLCAka2V5LCAkdmFsdWUgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ydW5zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9maW5kX3J1bnNfb2ZfZmFtaWx5X3NvcnRlZDogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSAgID0gJGtleSAgICApXG4gICAgICAgICAgICBhbmQgKCB2YWx1ZSA9ICR2YWx1ZSAgKVxuICAgICAgICAgIG9yZGVyIGJ5IGxvLCBoaSwga2V5O1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX292ZXJsYXBzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0IHJvd2lkLCBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHNfZm9yX2tleTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJGhpIClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRsbyApXG4gICAgICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xOiBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbHlfY29uZmxpY3RzXzE7XCJcIlwiXG4gICAgICBocmRfZGVsZXRlX3J1bjogICAgICAgICAgICAgICAgIFNRTFwiXCJcImRlbGV0ZSBmcm9tIF9ocmRfcnVucyB3aGVyZSByb3dpZCA9ICRyb3dpZDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF9ub25ub3JtYWxfZmFtaWxpZXM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3Qga2V5LCB2YWx1ZSBmcm9tIGhyZF9ub3JtYWxpemF0aW9uIHdoZXJlIGlzX25vcm1hbCA9IGZhbHNlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3JlbW92ZV9vdmVybGFwXzE6IFNRTFwiXCJcIlxuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICAgICAgc2VsZWN0IGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgICBmcm9tICggc2VsZWN0XG4gICAgICAgICAgICAgIGIubG8gICAgICBhcyBsbyxcbiAgICAgICAgICAgICAgbS5sbyAtIDEgIGFzIGhpLFxuICAgICAgICAgICAgICBiLmtleSAgICAgYXMga2V5LFxuICAgICAgICAgICAgICBiLnZhbHVlICAgYXMgdmFsdWVcbiAgICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgICBqb2luIGhyZF9ydW5zIGFzIG0gb24gKCBtLnJvd2lkID0gJG1hc2tfcm93aWQgKVxuICAgICAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgICAgIGFuZCBiLnJvd2lkID0gJGJhc2Vfcm93aWRcbiAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgIGFuZCBiLmhpID49IG0ubG9cbiAgICAgICAgICAgIGFuZCBiLmxvIDwgbS5sb1xuICAgICAgICAtLSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHVuaW9uIGFsbCBzZWxlY3RcbiAgICAgICAgICAgICAgICBtLmhpICsgMSxcbiAgICAgICAgICAgICAgICBiLmhpLFxuICAgICAgICAgICAgICAgIGIua2V5LFxuICAgICAgICAgICAgICAgIGIudmFsdWVcbiAgICAgICAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgICAgICAgam9pbiBocmRfcnVucyBhcyBtIG9uIG0ucm93aWQgPSAkbWFza19yb3dpZFxuICAgICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgICBhbmQgYi5yb3dpZCA9ICRiYXNlX3Jvd2lkXG4gICAgICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICAgICAgYW5kIGIuaGkgPj0gbS5sb1xuICAgICAgICAgICAgICBhbmQgYi5oaSA+IG0uaGlcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfZmluZF90b3BydW5zX2Zvcl9wb2ludDogU1FMXCJcIlwiXG4gICAgICAgIHdpdGggcmFua2VkIGFzICggc2VsZWN0XG4gICAgICAgICAgICBhLnJvd2lkICAgICAgICAgICAgICAgYXMgcm93aWQsXG4gICAgICAgICAgICBhLmlub3JuICAgICAgICAgICAgICAgYXMgaW5vcm4sXG4gICAgICAgICAgICByb3dfbnVtYmVyKCkgb3ZlciB3ICAgYXMgcm4sXG4gICAgICAgICAgICBhLmxvICAgICAgICAgICAgICAgICAgYXMgbG8sXG4gICAgICAgICAgICBhLmhpICAgICAgICAgICAgICAgICAgYXMgaGksXG4gICAgICAgICAgICBhLmZhY2V0ICAgICAgICAgICAgICAgYXMgZmFjZXQsXG4gICAgICAgICAgICBhLmtleSAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICAgICAgYS52YWx1ZSAgICAgICAgICAgICAgIGFzIHZhbHVlXG4gICAgICAgICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICAgICAgYW5kICggbG8gPD0gJHBvaW50IClcbiAgICAgICAgICAgIGFuZCAoIGhpID49ICRwb2ludCApXG4gICAgICAgICAgd2luZG93IHcgYXMgKCBwYXJ0aXRpb24gYnkgYS5rZXkgb3JkZXIgYnkgYS5pbm9ybiBkZXNjICkgKVxuICAgICAgICBzZWxlY3QgKiBmcm9tIHJhbmtlZCB3aGVyZSAoIHJuID0gMSApIG9yZGVyIGJ5IGtleSBhc2M7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1ldGhvZHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9hc19oYWxmb3BlbjogICAoIHJ1biAgICAgICApIC0+IHsgc3RhcnQ6IHJ1bi5sbywgICAgICAgICBlbmQ6ICBydW4uaGkgICAgICAgICsgMSwgfVxuICAgICAgX2hyZF9mcm9tX2hhbGZvcGVuOiAoIGhhbGZvcGVuICApIC0+IHsgbG86ICAgIGhhbGZvcGVuLnN0YXJ0LCBoaTogICBoYWxmb3Blbi5lbmQgIC0gMSwgfVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBfaHJkX3N1YnRyYWN0OiAoIGJhc2UsIG1hc2sgKSAtPlxuICAgICAgIyAgIGhhbGZvcGVucyA9IElGTi5zdWJzdHJhY3QgWyAoIEBfaHJkX2FzX2hhbGZvcGVuIGJhc2UgKSwgXSwgWyAoIEBfaHJkX2FzX2hhbGZvcGVuIG1hc2sgKSwgXVxuICAgICAgIyAgIHJldHVybiAoIEBfaHJkX2Zyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVucyApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfcnVuczogICAgICAgICAgICAgIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNcbiAgICAgIGhyZF9maW5kX25vbm5vcm1hbF9mYW1pbGllczogIC0+IEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX25vbm5vcm1hbF9mYW1pbGllc1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMjIyBUQUlOVCBzaG91bGQgdXNlIGBuZmFgIGJ1dCBjdXJyZW50bHkgZmFpbHMgZm9yIGdlbmVyYXRvcnMgIyMjXG4gICAgICAjIGhyZF9maW5kX2ZhbWlsaWVzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhyZF9maW5kX2ZhbWlsaWVzLCB9LCAoIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICBocmRfZmluZF9mYW1pbGllczogKCBjZmcgKSAtPlxuICAgICAgICBjZmcgPSB7IHRlbXBsYXRlcy5ocmRfZmluZF9mYW1pbGllcy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBjZmcua2V5PyBhbmQgY2ZnLnZhbHVlP1xuICAgICAgICAgICAgY2ZnLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkgY2ZnLnZhbHVlXG4gICAgICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyB3aGVyZSBrZXkgPSAka2V5IGFuZCB2YWx1ZSA9ICR2YWx1ZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgICAgIHdoZW4gY2ZnLmtleT9cbiAgICAgICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIHdoZXJlIGtleSA9ICRrZXkgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICAgICB3aGVuIGNmZy52YWx1ZT9cbiAgICAgICAgICAgIGNmZy52YWx1ZSA9IEpTT04uc3RyaW5naWZ5IGNmZy52YWx1ZVxuICAgICAgICAgICAgc3FsICAgICAgID0gU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWxpZXMgd2hlcmUgdmFsdWUgPSAkdmFsdWUgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgc3FsLCBjZmdcbiAgICAgICAgICByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgICAgIHJvdy5pc19ub3JtYWwgICAgID0gYXNfYm9vbCByb3cuaXNfbm9ybWFsXG4gICAgICAgICAgcm93LnZhbHVlICAgICAgICAgPSBKU09OLnBhcnNlIHJvdy52YWx1ZVxuICAgICAgICAgIHlpZWxkIHJvd1xuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMTogLT5cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMVxuICAgICAgICAgICMgcm93Lmhhc19jb25mbGljdCAgPSBhc19ib29sIHJvdy5oYXNfY29uZmxpY3RcbiAgICAgICAgICAjIHJvdy5pc19ub3JtYWwgICAgID0gYXNfYm9vbCByb3cuaXNfbm9ybWFsXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9nZXRfcnVuX2lub3JuOiAtPiBAc3RhdGUuaHJkX3J1bl9pbm9ybiA9ICggQHN0YXRlLmhyZF9ydW5faW5vcm4gPyAwIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX2dldF9uZXh0X3J1bl9yb3dpZDogLT5cbiAgICAgICAgQHN0YXRlLmhyZF9ydW5faW5vcm4gPSBSID0gQF9ocmRfZ2V0X3J1bl9pbm9ybigpICsgMVxuICAgICAgICByZXR1cm4gXCJ0OmhyZDpydW5zOlI9I3tSfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmc6ICggbG8sIGhpLCBrZXksIHZhbHVlICkgLT5cbiAgICAgICAgaGkgICA/PSBsb1xuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIHJldHVybiB7IGxvLCBoaSwga2V5LCB2YWx1ZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaHJkX2ZpbmRfb3ZlcmxhcHM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMubG9faGksIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgaHJkX2ZpbmRfb3ZlcmxhcHM6ICggbG8sIGhpID0gbnVsbCApIC0+XG4gICAgICAgIGhpICAgPz0gbG9cbiAgICAgICAgZm9yIHJvdyBmcm9tIEB3YWxrIEBzdGF0ZW1lbnRzLmhyZF9maW5kX292ZXJsYXBzLCB7IGxvLCBoaSwgfVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uLCB1c2UgY2FzdGluZyBtZXRob2QgIyMjXG4gICAgICAgICAgaGlkZSByb3csICd2YWx1ZV9qc29uJywgcm93LnZhbHVlXG4gICAgICAgICAgcm93LnZhbHVlID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgICAgICB5aWVsZCByb3dcbiAgICAgICAgO251bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBocmRfYWRkX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5hZGRfcnVuX2NmZywgfSwgKCBsbywgaGksIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gICAgICAgIHJldHVybiBAc3RhdGVtZW50cy5faHJkX2luc2VydF9ydW4ucnVuIEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfaHJkX3J1bnNfZnJvbV9jb25mbGljdF8xOiAoIGNvbmZsaWN0LCBva192YWx1ZV9qc29uICkgLT5cbiAgICAgICAgICB7IHJvd2lkX2EsIGxvX2EsIGhpX2EsIGtleV9hLCB2YWx1ZV9hLFxuICAgICAgICAgICAgcm93aWRfYiwgbG9fYiwgaGlfYiwga2V5X2IsIHZhbHVlX2IsIH0gID0gY29uZmxpY3RcbiAgICAgICAgICBydW5fb2sgPSB7IHJvd2lkOiByb3dpZF9hLCBsbzogbG9fYSwgaGk6IGhpX2EsIGtleToga2V5X2EsIHZhbHVlOiB2YWx1ZV9hLCB9XG4gICAgICAgICAgcnVuX25rID0geyByb3dpZDogcm93aWRfYiwgbG86IGxvX2IsIGhpOiBoaV9iLCBrZXk6IGtleV9iLCB2YWx1ZTogdmFsdWVfYiwgfVxuICAgICAgICAgIHJldHVybiB7IHJ1bl9vaywgcnVuX25rLCB9IGlmIHJ1bl9vay52YWx1ZSBpcyBva192YWx1ZV9qc29uXG4gICAgICAgICAgcmV0dXJuIHsgcnVuX29rOiBydW5fbmssIHJ1bl9uazogcnVuX29rLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3B1bmNoXzE6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWRkX3J1bl9jZmcsIH0sICggbG8sIGhpLCBrZXksIHZhbHVlLCBjZmcgKSAtPlxuICAgICAgICAjIyMgbGlrZSBgX2hyZF9hZGRfcnVuKClgIGJ1dCByZXNvbHZlcyBrZXkvdmFsdWUgY29uZmxpY3RzIGluIGZhdm9yIG9mIHZhbHVlIGdpdmVuICMjI1xuICAgICAgICAjIEBocmRfdmFsaWRhdGVfMSgpXG4gICAgICAgIG5ld19vayA9IEBfaHJkX2NyZWF0ZV9pbnNlcnRfcnVuX2NmZyBsbywgaGksIGtleSwgdmFsdWVcbiAgICAgICAgQHdpdGhfdHJhbnNhY3Rpb24gPT5cbiAgICAgICAgICBAc3RhdGVtZW50cy5faHJkX2luc2VydF9ydW4ucnVuIG5ld19va1xuICAgICAgICAgIGNvbmZsaWN0cyA9IFsgKCBAaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xKCkgKS4uLiwgXVxuICAgICAgICAgIGZvciBjb25mbGljdCBpbiBjb25mbGljdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBjb25mbGljdC5rZXlfYSBpcyBuZXdfb2sua2V5ICMjIyBkbyBub3QgcmVzb2x2ZSBjb25mbGljdHMgb2Ygb3RoZXIga2V5L3ZhbHVlIHBhaXJzICMjI1xuICAgICAgICAgICAgeyBydW5fb2ssIHJ1bl9uaywgfSA9IEBfaHJkX3J1bnNfZnJvbV9jb25mbGljdF8xIGNvbmZsaWN0LCBuZXdfb2sudmFsdWVcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9yZW1vdmVfb3ZlcmxhcF8xLnJ1biB7IGJhc2Vfcm93aWQ6IHJ1bl9uay5yb3dpZCwgbWFza19yb3dpZDogcnVuX29rLnJvd2lkLCB9XG4gICAgICAgICAgICBAc3RhdGVtZW50cy5ocmRfZGVsZXRlX3J1bi5ydW4geyByb3dpZDogcnVuX25rLnJvd2lkLCB9XG4gICAgICAgICAgICA7bnVsbFxuICAgICAgICA7bnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9ocmRfbm9ybWFsaXplX2ZhbWlseTogKCBrZXksIHZhbHVlX2pzb24gKSAtPlxuICAgICAgICAjIyMgVEFJTlQgcG90ZW50aWFsbHkgZG9pbmcgdG9vIG11Y2ggYXMgd2Ugb25seSBoYXZlIHRvIGpvaW4gYWRqYWNlbnQsIHJlbW92ZSBvdmVybGFwcyAjIyNcbiAgICAgICAgQHdpdGhfdHJhbnNhY3Rpb24gPT5cbiAgICAgICAgICBvbGRfcnVucyAgICAgID0gQGdldF9hbGwgQHN0YXRlbWVudHMuX2hyZF9maW5kX3J1bnNfb2ZfZmFtaWx5X3NvcnRlZCwgeyBrZXksIHZhbHVlOiB2YWx1ZV9qc29uLCB9XG4gICAgICAgICAgQHN0YXRlbWVudHMuaHJkX2RlbGV0ZV9ydW4ucnVuIHsgcm93aWQ6IG9sZF9ydW4ucm93aWQsIH0gZm9yIG9sZF9ydW4gaW4gb2xkX3J1bnNcbiAgICAgICAgICBvbGRfaGFsZm9wZW5zID0gKCBAX2hyZF9hc19oYWxmb3BlbiBvbGRfcnVuIGZvciBvbGRfcnVuIGluIG9sZF9ydW5zIClcbiAgICAgICAgICBuZXdfaGFsZm9wZW5zID0gSUZOLnNpbXBsaWZ5IG9sZF9oYWxmb3BlbnNcbiAgICAgICAgICBuZXdfcnVucyAgICAgID0gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBuZXdfaGFsZm9wZW5zIClcbiAgICAgICAgICB2YWx1ZSAgICAgICAgID0gSlNPTi5wYXJzZSB2YWx1ZV9qc29uXG4gICAgICAgICAgQGhyZF9hZGRfcnVuIHsgbmV3X3J1bi4uLiwga2V5LCB2YWx1ZSwgfSBmb3IgbmV3X3J1biBpbiBuZXdfcnVuc1xuICAgICAgICAgIDtudWxsXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX25vcm1hbGl6ZTogLT5cbiAgICAgICAgZmFtaWxpZXMgPSBAZ2V0X2FsbCBTUUxcInNlbGVjdCAqIGZyb20gaHJkX25vcm1hbGl6YXRpb24gd2hlcmUgaXNfbm9ybWFsID0gZmFsc2U7XCJcbiAgICAgICAgZm9yIGZhbWlseSBpbiBmYW1pbGllc1xuICAgICAgICAgIEBfaHJkX25vcm1hbGl6ZV9mYW1pbHkgZmFtaWx5LmtleSwgZmFtaWx5LnZhbHVlXG4gICAgICAgIDtudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX3ZhbGlkYXRlXzE6IC0+XG4gICAgICAgIHJldHVybiBudWxsIGlmICggY29uZmxpY3RzID0gWyAoIEBocmRfZmluZF9ydW5zX3dpdGhfY29uZmxpY3RzXzEoKSApLi4uLCBdICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlocmRfX182IGZvdW5kIGNvbmZsaWN0czogI3tycHIgY29uZmxpY3RzfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfdG9wcnVuc19mb3JfcG9pbnQsIHsgcG9pbnQsIH1cbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiwgdXNlIGNhc3RpbmcgbWV0aG9kICMjI1xuICAgICAgICAgIGhpZGUgcm93LCAndmFsdWVfanNvbicsIHJvdy52YWx1ZVxuICAgICAgICAgIHJvdy52YWx1ZSA9IEpTT04ucGFyc2Ugcm93LnZhbHVlXG4gICAgICAgICAgeWllbGQgcm93XG4gICAgICAgIDtudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCBJRk4sIGxldHMsIHR5cGVzcGFjZTogVCwgfVxuICByZXR1cm4ge1xuICAgIGRicmljX3BsdWdpbixcbiAgfVxuXG5cbiJdfQ==
