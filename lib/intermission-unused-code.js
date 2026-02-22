(function() {
  'use strict';
  var methods, statements;

  //-----------------------------------------------------------------------------------------------------
  SQL`create view _hrd_clan_has_conflict_2 as
select distinct
    f.key                     as key,
    not ( c.key is null )     as has_conflict
from _hrd_families   as f
left join hrd_family_conflicts_2 as c on ( f.key = c.key and f.value = c.value )
order by f.key, f.value;`;

  //-----------------------------------------------------------------------------------------------------
  SQL`create view _hrd_family_has_conflict_1 as
select distinct
    f.key                                                     as key,
    f.value                                                   as value,
    not ( ca.key_a is null and cb.key_b is null )             as has_conflict
from _hrd_families as f
left join hrd_family_conflicts_1 as ca on ( f.key = ca.key_a and f.value = ca.value_a )
left join hrd_family_conflicts_1 as cb on ( f.key = cb.key_b and f.value = cb.value_b )
order by key, value;`;

  //-----------------------------------------------------------------------------------------------------
  SQL`create view _hrd_families as
select distinct
    a.key     as key,
    a.value   as value,
    count(*)  as runs
  from hrd_runs as a
  group by a.key, a.value
  order by a.key, a.value;`;

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
  order by a.lo, a.hi, a.key;`;

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
  order by a.lo, a.hi, a.key;`;

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
  order by key, value;`;

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
  order by key, value;`;

  statements = {
    //-----------------------------------------------------------------------------------------------------
    _hrd_find_runs_of_family_sorted: SQL`select rowid, inorn, lo, hi, key, value
  from hrd_runs
  where true
    and ( key   = $key    )
    and ( value = $value  )
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
);`
  };

  methods = {
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
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi11bnVzZWQtY29kZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsT0FBQSxFQUFBLFVBQUE7OztFQUlBLEdBQUcsQ0FBQTs7Ozs7O3dCQUFBLEVBSkg7OztFQWFBLEdBQUcsQ0FBQTs7Ozs7Ozs7b0JBQUEsRUFiSDs7O0VBeUJBLEdBQUcsQ0FBQTs7Ozs7OzswQkFBQSxFQXpCSDs7O0VBbUNBLEdBQUcsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7NkJBQUEsRUFuQ0g7OztFQW9EQSxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQUFBLEVBcERIOzs7RUEyRUEsR0FBRyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBQUEsRUEzRUg7OztFQWdHQSxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7c0JBQUE7O0VBZUgsVUFBQSxHQUdFLENBQUE7O0lBQUEsK0JBQUEsRUFBaUMsR0FBRyxDQUFBOzs7Ozt1QkFBQSxDQUFwQzs7SUFTQSx5QkFBQSxFQUEyQixHQUFHLENBQUE7Ozs7Ozt1QkFBQSxDQVQ5Qjs7SUFtQkEsOEJBQUEsRUFBZ0MsR0FBRyxDQUFBLHFDQUFBLENBbkJuQzs7SUF1QkEsMkJBQUEsRUFBNkIsR0FBRyxDQUFBLHFGQUFBLENBdkJoQzs7SUEyQkEsb0JBQUEsRUFBc0IsR0FBRyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBQUE7RUEzQnpCOztFQTBERixPQUFBLEdBSUUsQ0FBQTs7SUFBQSxnQkFBQSxFQUFvQixRQUFBLENBQUUsR0FBRixDQUFBO2FBQWlCO1FBQUUsS0FBQSxFQUFPLEdBQUcsQ0FBQyxFQUFiO1FBQXlCLEdBQUEsRUFBTSxHQUFHLENBQUMsRUFBSixHQUFnQjtNQUEvQztJQUFqQixDQUFwQjtJQUNBLGtCQUFBLEVBQW9CLFFBQUEsQ0FBRSxRQUFGLENBQUE7YUFBaUI7UUFBRSxFQUFBLEVBQU8s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LENBQUE7QUFDbEIsVUFBQTtNQUFJLElBQWUsQ0FBRSxTQUFBLEdBQVksQ0FBRSxHQUFBLENBQUUsSUFBQyxDQUFBLDhCQUFELENBQUEsQ0FBRixDQUFGLENBQWQsQ0FBNkQsQ0FBQyxNQUE5RCxLQUF3RSxDQUF2RjtBQUFBLGVBQU8sS0FBUDs7TUFDQSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMEJBQUEsQ0FBQSxDQUE2QixHQUFBLENBQUksU0FBSixDQUE3QixDQUFBLENBQVY7SUFGUTtFQTFGaEI7QUFoTEYiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9jbGFuX2hhc19jb25mbGljdF8yIGFzXG4gIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICBub3QgKCBjLmtleSBpcyBudWxsICkgICAgIGFzIGhhc19jb25mbGljdFxuICBmcm9tIF9ocmRfZmFtaWxpZXMgICBhcyBmXG4gIGxlZnQgam9pbiBocmRfZmFtaWx5X2NvbmZsaWN0c18yIGFzIGMgb24gKCBmLmtleSA9IGMua2V5IGFuZCBmLnZhbHVlID0gYy52YWx1ZSApXG4gIG9yZGVyIGJ5IGYua2V5LCBmLnZhbHVlO1wiXCJcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTFwiXCJcImNyZWF0ZSB2aWV3IF9ocmRfZmFtaWx5X2hhc19jb25mbGljdF8xIGFzXG4gIHNlbGVjdCBkaXN0aW5jdFxuICAgICAgZi5rZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGtleSxcbiAgICAgIGYudmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcyB2YWx1ZSxcbiAgICAgIG5vdCAoIGNhLmtleV9hIGlzIG51bGwgYW5kIGNiLmtleV9iIGlzIG51bGwgKSAgICAgICAgICAgICBhcyBoYXNfY29uZmxpY3RcbiAgZnJvbSBfaHJkX2ZhbWlsaWVzIGFzIGZcbiAgbGVmdCBqb2luIGhyZF9mYW1pbHlfY29uZmxpY3RzXzEgYXMgY2Egb24gKCBmLmtleSA9IGNhLmtleV9hIGFuZCBmLnZhbHVlID0gY2EudmFsdWVfYSApXG4gIGxlZnQgam9pbiBocmRfZmFtaWx5X2NvbmZsaWN0c18xIGFzIGNiIG9uICggZi5rZXkgPSBjYi5rZXlfYiBhbmQgZi52YWx1ZSA9IGNiLnZhbHVlX2IgKVxuICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU1FMXCJcIlwiY3JlYXRlIHZpZXcgX2hyZF9mYW1pbGllcyBhc1xuICBzZWxlY3QgZGlzdGluY3RcbiAgICAgIGEua2V5ICAgICBhcyBrZXksXG4gICAgICBhLnZhbHVlICAgYXMgdmFsdWUsXG4gICAgICBjb3VudCgqKSAgYXMgcnVuc1xuICAgIGZyb20gaHJkX3J1bnMgYXMgYVxuICAgIGdyb3VwIGJ5IGEua2V5LCBhLnZhbHVlXG4gICAgb3JkZXIgYnkgYS5rZXksIGEudmFsdWU7XCJcIlwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU1FMXCJcIlwiY3JlYXRlIHZpZXcgaHJkX2ZhbWlseV9jb25mbGljdHNfMiBhc1xuICBzZWxlY3QgZGlzdGluY3RcbiAgICAgIGEucm93aWQgIGFzIHJvd2lkLFxuICAgICAgYS5sbyAgICAgYXMgbG8sXG4gICAgICBhLmhpICAgICBhcyBoaSxcbiAgICAgIGEua2V5ICAgIGFzIGtleSxcbiAgICAgIGEudmFsdWUgIGFzIHZhbHVlXG4gICAgZnJvbSBocmRfcnVucyBhcyBhXG4gICAgam9pbiBocmRfcnVucyBhcyBiXG4gICAgICBvbiB0cnVlXG4gICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbHlfY29uZmxpY3RzXzEgYXNcbiAgc2VsZWN0XG4gICAgICBhLnJvd2lkICBhcyByb3dpZF9hLFxuICAgICAgYS5sbyAgICAgYXMgbG9fYSxcbiAgICAgIGEuaGkgICAgIGFzIGhpX2EsXG4gICAgICBhLmtleSAgICBhcyBrZXlfYSxcbiAgICAgIGEudmFsdWUgIGFzIHZhbHVlX2EsXG4gICAgICBiLnJvd2lkICBhcyByb3dpZF9iLFxuICAgICAgYi5sbyAgICAgYXMgbG9fYixcbiAgICAgIGIuaGkgICAgIGFzIGhpX2IsXG4gICAgICBiLmtleSAgICBhcyBrZXlfYixcbiAgICAgIGIudmFsdWUgIGFzIHZhbHVlX2JcbiAgICBmcm9tIGhyZF9ydW5zIGFzIGFcbiAgICBqb2luIGhyZF9ydW5zIGFzIGJcbiAgICAgIG9uIHRydWVcbiAgICAgICAgYW5kICggYS5yb3dpZCA8ICAgYi5yb3dpZCApXG4gICAgICAgIGFuZCAoIGEua2V5ICAgPSAgIGIua2V5ICAgKVxuICAgICAgICBhbmQgKCBhLnZhbHVlICE9ICBiLnZhbHVlIClcbiAgICAgICAgYW5kICggYS5sbyAgICA8PSAgYi5oaSAgICApXG4gICAgICAgIGFuZCAoIGEuaGkgICAgPj0gIGIubG8gICAgKVxuICAgIG9yZGVyIGJ5IGEubG8sIGEuaGksIGEua2V5O1wiXCJcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9ub3JtYWxpemF0aW9uIGFzXG4gIHdpdGggb3JkZXJlZCBhcyAoXG4gICAgc2VsZWN0XG4gICAgICAgIGtleSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgICB2YWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgICBsbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGxvLFxuICAgICAgICBoaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGhpLFxuICAgICAgICBsYWcoIGhpICkgb3ZlciAoIHBhcnRpdGlvbiBieSBrZXksIHZhbHVlIG9yZGVyIGJ5IGxvICkgIGFzIHByZXZfaGlcbiAgICBmcm9tIGhyZF9ydW5zIClcbiAgc2VsZWN0XG4gICAgICBrZXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXMga2V5LFxuICAgICAgdmFsdWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIHZhbHVlLFxuICAgICAgY2FzZSB3aGVuIHN1bShcbiAgICAgICAgY2FzZVxuICAgICAgICAgIHdoZW4gKCBwcmV2X2hpIGlzIG5vdCBudWxsICkgYW5kICggbG8gPD0gcHJldl9oaSArIDEgKSB0aGVuIDEgZWxzZSAwIGVuZCApID4gMFxuICAgICAgICAgIHRoZW4gMCBlbHNlIDEgZW5kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzIGlzX25vcm1hbFxuICAgIGZyb20gb3JkZXJlZFxuICAgIGdyb3VwIGJ5IGtleSwgdmFsdWVcbiAgICBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTFwiXCJcImNyZWF0ZSB2aWV3IGhyZF9mYW1pbGllcyBhc1xuICBzZWxlY3QgZGlzdGluY3RcbiAgICAgIGcua2V5ICAgICAgICAgICAgICAgICAgICAgICBhcyBrZXksXG4gICAgICBnLnZhbHVlICAgICAgICAgICAgICAgICAgICAgYXMgdmFsdWUsXG4gICAgICBtaW4oIHIubG8gKSBvdmVyIHcgICAgICAgICAgYXMgZmlyc3QsXG4gICAgICBtYXgoIHIuaGkgKSBvdmVyIHcgICAgICAgICAgYXMgbGFzdCxcbiAgICAgIGcucnVucyAgICAgICAgICAgICAgICAgICAgICBhcyBydW5zLFxuICAgICAgZmFsc2UgICAgICAgICAgICAgICAgICAgICAgIGFzIGhhc19jb25mbGljdCwgLS0gISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISFcbiAgICAgIG4uaXNfbm9ybWFsICAgICAgICAgICAgICAgICBhcyBpc19ub3JtYWxcbiAgICBmcm9tIF9ocmRfZmFtaWxpZXMgICAgICAgICAgIGFzIGdcbiAgICBsZWZ0IGpvaW4gaHJkX25vcm1hbGl6YXRpb24gICAgIGFzIG4gdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICBsZWZ0IGpvaW4gaHJkX3J1bnMgICAgICAgICAgICAgIGFzIHIgdXNpbmcgKCBrZXksIHZhbHVlIClcbiAgICB3aW5kb3cgdyBhcyAoIHBhcnRpdGlvbiBieSByLmtleSwgci52YWx1ZSApXG4gICAgb3JkZXIgYnkga2V5LCB2YWx1ZTtcIlwiXCJcblxuc3RhdGVtZW50cyA9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9ocmRfZmluZF9ydW5zX29mX2ZhbWlseV9zb3J0ZWQ6IFNRTFwiXCJcIlxuICAgIHNlbGVjdCByb3dpZCwgaW5vcm4sIGxvLCBoaSwga2V5LCB2YWx1ZVxuICAgICAgZnJvbSBocmRfcnVuc1xuICAgICAgd2hlcmUgdHJ1ZVxuICAgICAgICBhbmQgKCBrZXkgICA9ICRrZXkgICAgKVxuICAgICAgICBhbmQgKCB2YWx1ZSA9ICR2YWx1ZSAgKVxuICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhyZF9maW5kX292ZXJsYXBzX2Zvcl9rZXk6IFNRTFwiXCJcIlxuICAgIHNlbGVjdCByb3dpZCwgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgICBmcm9tIGhyZF9ydW5zXG4gICAgICB3aGVyZSB0cnVlXG4gICAgICAgIGFuZCAoIGtleSA9ICRrZXkgKVxuICAgICAgICBhbmQgKCBsbyA8PSAkaGkgKVxuICAgICAgICBhbmQgKCBoaSA+PSAkbG8gKVxuICAgICAgb3JkZXIgYnkgbG8sIGhpLCBrZXk7XCJcIlwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMTogU1FMXCJcIlwic2VsZWN0ICogZnJvbSBocmRfZmFtaWx5X2NvbmZsaWN0c18xO1wiXCJcIlxuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhyZF9maW5kX25vbm5vcm1hbF9mYW1pbGllczogU1FMXCJcIlwiXG4gICAgc2VsZWN0IGtleSwgdmFsdWUgZnJvbSBocmRfbm9ybWFsaXphdGlvbiB3aGVyZSBpc19ub3JtYWwgPSBmYWxzZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBocmRfcmVtb3ZlX292ZXJsYXBfMTogU1FMXCJcIlwiXG4gICAgLS0gLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGluc2VydCBpbnRvIGhyZF9ydW5zICggbG8sIGhpLCBrZXksIHZhbHVlIClcbiAgICBzZWxlY3QgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgZnJvbSAoIHNlbGVjdFxuICAgICAgICAgIGIubG8gICAgICBhcyBsbyxcbiAgICAgICAgICBtLmxvIC0gMSAgYXMgaGksXG4gICAgICAgICAgYi5rZXkgICAgIGFzIGtleSxcbiAgICAgICAgICBiLnZhbHVlICAgYXMgdmFsdWVcbiAgICAgIGZyb20gaHJkX3J1bnMgYXMgYlxuICAgICAgam9pbiBocmRfcnVucyBhcyBtIG9uICggbS5yb3dpZCA9ICRtYXNrX3Jvd2lkIClcbiAgICAgIHdoZXJlIHRydWVcbiAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICBhbmQgYi5sbyA8PSBtLmhpXG4gICAgICAgIGFuZCBiLmhpID49IG0ubG9cbiAgICAgICAgYW5kIGIubG8gPCBtLmxvXG4gICAgLS0gLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVuaW9uIGFsbCBzZWxlY3RcbiAgICAgICAgICAgIG0uaGkgKyAxLFxuICAgICAgICAgICAgYi5oaSxcbiAgICAgICAgICAgIGIua2V5LFxuICAgICAgICAgICAgYi52YWx1ZVxuICAgICAgICBmcm9tIGhyZF9ydW5zIGFzIGJcbiAgICAgICAgam9pbiBocmRfcnVucyBhcyBtIG9uIG0ucm93aWQgPSAkbWFza19yb3dpZFxuICAgICAgICB3aGVyZSB0cnVlXG4gICAgICAgICAgYW5kIGIucm93aWQgPSAkYmFzZV9yb3dpZFxuICAgICAgICAgIGFuZCBiLmxvIDw9IG0uaGlcbiAgICAgICAgICBhbmQgYi5oaSA+PSBtLmxvXG4gICAgICAgICAgYW5kIGIuaGkgPiBtLmhpXG4gICAgKTtcIlwiXCJcblxubWV0aG9kcyA9XG5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2hyZF9hc19oYWxmb3BlbjogICAoIHJ1biAgICAgICApIC0+IHsgc3RhcnQ6IHJ1bi5sbywgICAgICAgICBlbmQ6ICBydW4uaGkgICAgICAgICsgMSwgfVxuICBfaHJkX2Zyb21faGFsZm9wZW46ICggaGFsZm9wZW4gICkgLT4geyBsbzogICAgaGFsZm9wZW4uc3RhcnQsIGhpOiAgIGhhbGZvcGVuLmVuZCAgLSAxLCB9XG5cbiAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBfaHJkX3N1YnRyYWN0OiAoIGJhc2UsIG1hc2sgKSAtPlxuICAjICAgaGFsZm9wZW5zID0gSUZOLnN1YnN0cmFjdCBbICggQF9ocmRfYXNfaGFsZm9wZW4gYmFzZSApLCBdLCBbICggQF9ocmRfYXNfaGFsZm9wZW4gbWFzayApLCBdXG4gICMgICByZXR1cm4gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnMgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBocmRfZmluZF9ub25ub3JtYWxfZmFtaWxpZXM6ICAtPiBAd2FsayBAc3RhdGVtZW50cy5ocmRfZmluZF9ub25ub3JtYWxfZmFtaWxpZXNcblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgc2hvdWxkIHVzZSBgbmZhYCBidXQgY3VycmVudGx5IGZhaWxzIGZvciBnZW5lcmF0b3JzICMjI1xuICAjIGhyZF9maW5kX2ZhbWlsaWVzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhyZF9maW5kX2ZhbWlsaWVzLCB9LCAoIGtleSwgdmFsdWUsIGNmZyApIC0+XG4gIGhyZF9maW5kX2ZhbWlsaWVzOiAoIGNmZyApIC0+XG4gICAgY2ZnID0geyB0ZW1wbGF0ZXMuaHJkX2ZpbmRfZmFtaWxpZXMuLi4sIGNmZy4uLiwgfVxuICAgIHN3aXRjaCB0cnVlXG4gICAgICB3aGVuIGNmZy5rZXk/IGFuZCBjZmcudmFsdWU/XG4gICAgICAgIGNmZy52YWx1ZSA9IEpTT04uc3RyaW5naWZ5IGNmZy52YWx1ZVxuICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyB3aGVyZSBrZXkgPSAka2V5IGFuZCB2YWx1ZSA9ICR2YWx1ZSBvcmRlciBieSBrZXksIHZhbHVlO1wiXCJcIlxuICAgICAgd2hlbiBjZmcua2V5P1xuICAgICAgICBzcWwgICAgICAgPSBTUUxcIlwiXCJzZWxlY3QgKiBmcm9tIGhyZF9mYW1pbGllcyB3aGVyZSBrZXkgPSAka2V5IG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICB3aGVuIGNmZy52YWx1ZT9cbiAgICAgICAgY2ZnLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkgY2ZnLnZhbHVlXG4gICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIHdoZXJlIHZhbHVlID0gJHZhbHVlIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgICBlbHNlXG4gICAgICAgIHNxbCAgICAgICA9IFNRTFwiXCJcInNlbGVjdCAqIGZyb20gaHJkX2ZhbWlsaWVzIG9yZGVyIGJ5IGtleSwgdmFsdWU7XCJcIlwiXG4gICAgZm9yIHJvdyBmcm9tIEB3YWxrIHNxbCwgY2ZnXG4gICAgICByb3cuaGFzX2NvbmZsaWN0ICA9IGFzX2Jvb2wgcm93Lmhhc19jb25mbGljdFxuICAgICAgcm93LmlzX25vcm1hbCAgICAgPSBhc19ib29sIHJvdy5pc19ub3JtYWxcbiAgICAgIHJvdy52YWx1ZSAgICAgICAgID0gSlNPTi5wYXJzZSByb3cudmFsdWVcbiAgICAgIHlpZWxkIHJvd1xuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMTogLT5cbiAgICBmb3Igcm93IGZyb20gQHdhbGsgQHN0YXRlbWVudHMuaHJkX2ZpbmRfcnVuc193aXRoX2NvbmZsaWN0c18xXG4gICAgICAjIHJvdy5oYXNfY29uZmxpY3QgID0gYXNfYm9vbCByb3cuaGFzX2NvbmZsaWN0XG4gICAgICAjIHJvdy5pc19ub3JtYWwgICAgID0gYXNfYm9vbCByb3cuaXNfbm9ybWFsXG4gICAgICB5aWVsZCByb3dcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfaHJkX3J1bnNfZnJvbV9jb25mbGljdF8xOiAoIGNvbmZsaWN0LCBva192YWx1ZV9qc29uICkgLT5cbiAgICAgIHsgcm93aWRfYSwgbG9fYSwgaGlfYSwga2V5X2EsIHZhbHVlX2EsXG4gICAgICAgIHJvd2lkX2IsIGxvX2IsIGhpX2IsIGtleV9iLCB2YWx1ZV9iLCB9ICA9IGNvbmZsaWN0XG4gICAgICBydW5fb2sgPSB7IHJvd2lkOiByb3dpZF9hLCBsbzogbG9fYSwgaGk6IGhpX2EsIGtleToga2V5X2EsIHZhbHVlOiB2YWx1ZV9hLCB9XG4gICAgICBydW5fbmsgPSB7IHJvd2lkOiByb3dpZF9iLCBsbzogbG9fYiwgaGk6IGhpX2IsIGtleToga2V5X2IsIHZhbHVlOiB2YWx1ZV9iLCB9XG4gICAgICByZXR1cm4geyBydW5fb2ssIHJ1bl9uaywgfSBpZiBydW5fb2sudmFsdWUgaXMgb2tfdmFsdWVfanNvblxuICAgICAgcmV0dXJuIHsgcnVuX29rOiBydW5fbmssIHJ1bl9uazogcnVuX29rLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhyZF9wdW5jaF8xOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFkZF9ydW5fY2ZnLCB9LCAoIGxvLCBoaSwga2V5LCB2YWx1ZSwgY2ZnICkgLT5cbiAgICAjIyMgbGlrZSBgX2hyZF9hZGRfcnVuKClgIGJ1dCByZXNvbHZlcyBrZXkvdmFsdWUgY29uZmxpY3RzIGluIGZhdm9yIG9mIHZhbHVlIGdpdmVuICMjI1xuICAgICMgQGhyZF92YWxpZGF0ZV8xKClcbiAgICBuZXdfb2sgPSBAX2hyZF9jcmVhdGVfaW5zZXJ0X3J1bl9jZmcgbG8sIGhpLCBrZXksIHZhbHVlXG4gICAgQHdpdGhfdHJhbnNhY3Rpb24gPT5cbiAgICAgIEBzdGF0ZW1lbnRzLl9ocmRfaW5zZXJ0X3J1bi5ydW4gbmV3X29rXG4gICAgICBjb25mbGljdHMgPSBbICggQGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMSgpICkuLi4sIF1cbiAgICAgIGZvciBjb25mbGljdCBpbiBjb25mbGljdHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIGNvbmZsaWN0LmtleV9hIGlzIG5ld19vay5rZXkgIyMjIGRvIG5vdCByZXNvbHZlIGNvbmZsaWN0cyBvZiBvdGhlciBrZXkvdmFsdWUgcGFpcnMgIyMjXG4gICAgICAgIHsgcnVuX29rLCBydW5fbmssIH0gPSBAX2hyZF9ydW5zX2Zyb21fY29uZmxpY3RfMSBjb25mbGljdCwgbmV3X29rLnZhbHVlXG4gICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9yZW1vdmVfb3ZlcmxhcF8xLnJ1biB7IGJhc2Vfcm93aWQ6IHJ1bl9uay5yb3dpZCwgbWFza19yb3dpZDogcnVuX29rLnJvd2lkLCB9XG4gICAgICAgIEBzdGF0ZW1lbnRzLmhyZF9kZWxldGVfcnVuLnJ1biB7IHJvd2lkOiBydW5fbmsucm93aWQsIH1cbiAgICAgICAgO251bGxcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfaHJkX25vcm1hbGl6ZV9mYW1pbHk6ICgga2V5LCB2YWx1ZV9qc29uICkgLT5cbiAgICAjIyMgVEFJTlQgcG90ZW50aWFsbHkgZG9pbmcgdG9vIG11Y2ggYXMgd2Ugb25seSBoYXZlIHRvIGpvaW4gYWRqYWNlbnQsIHJlbW92ZSBvdmVybGFwcyAjIyNcbiAgICBAd2l0aF90cmFuc2FjdGlvbiA9PlxuICAgICAgb2xkX3J1bnMgICAgICA9IEBnZXRfYWxsIEBzdGF0ZW1lbnRzLl9ocmRfZmluZF9ydW5zX29mX2ZhbWlseV9zb3J0ZWQsIHsga2V5LCB2YWx1ZTogdmFsdWVfanNvbiwgfVxuICAgICAgQHN0YXRlbWVudHMuaHJkX2RlbGV0ZV9ydW4ucnVuIHsgcm93aWQ6IG9sZF9ydW4ucm93aWQsIH0gZm9yIG9sZF9ydW4gaW4gb2xkX3J1bnNcbiAgICAgIG9sZF9oYWxmb3BlbnMgPSAoIEBfaHJkX2FzX2hhbGZvcGVuIG9sZF9ydW4gZm9yIG9sZF9ydW4gaW4gb2xkX3J1bnMgKVxuICAgICAgbmV3X2hhbGZvcGVucyA9IElGTi5zaW1wbGlmeSBvbGRfaGFsZm9wZW5zXG4gICAgICBuZXdfcnVucyAgICAgID0gKCBAX2hyZF9mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBuZXdfaGFsZm9wZW5zIClcbiAgICAgIHZhbHVlICAgICAgICAgPSBKU09OLnBhcnNlIHZhbHVlX2pzb25cbiAgICAgIEBocmRfYWRkX3J1biB7IG5ld19ydW4uLi4sIGtleSwgdmFsdWUsIH0gZm9yIG5ld19ydW4gaW4gbmV3X3J1bnNcbiAgICAgIDtudWxsXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaHJkX25vcm1hbGl6ZTogLT5cbiAgICBmYW1pbGllcyA9IEBnZXRfYWxsIFNRTFwic2VsZWN0ICogZnJvbSBocmRfbm9ybWFsaXphdGlvbiB3aGVyZSBpc19ub3JtYWwgPSBmYWxzZTtcIlxuICAgIGZvciBmYW1pbHkgaW4gZmFtaWxpZXNcbiAgICAgIEBfaHJkX25vcm1hbGl6ZV9mYW1pbHkgZmFtaWx5LmtleSwgZmFtaWx5LnZhbHVlXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaHJkX3ZhbGlkYXRlXzE6IC0+XG4gICAgcmV0dXJuIG51bGwgaWYgKCBjb25mbGljdHMgPSBbICggQGhyZF9maW5kX3J1bnNfd2l0aF9jb25mbGljdHNfMSgpICkuLi4sIF0gKS5sZW5ndGggaXMgMFxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paHJkX19fNiBmb3VuZCBjb25mbGljdHM6ICN7cnByIGNvbmZsaWN0c31cIlxuXG4iXX0=
