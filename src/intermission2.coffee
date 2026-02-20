
'use strict'


#===========================================================================================================
{ debug,                } = console
{ freeze,               } = Object
IFN                       = require './../dependencies/intervals-fn-lib.js'
{ T,                    } = require './intermission-types'
#...........................................................................................................
{ nfa,                  } = require 'normalize-function-arguments'
{ nameit,               } = ( require './various-brics' ).require_nameit()
{ type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ hide,
  set_readonly,
  set_hidden_readonly,
  set_getter,           } = ( require './various-brics' ).require_managed_property_tools()
{ inspect: rpr,         } = require 'node:util'
# { deploy,               } = ( require './unstable-object-tools-brics' ).require_deploy()
# { get_sha1sum7d,        } = require './shasum'
{ f,                    } = require 'effstring'
{ Dbric,
  Dbric_std,
  True,
  False,
  as_bool,
  from_bool,
  SQL,
  LIT,
  IDN,
  VEC,                  } = require './dbric'

#===========================================================================================================
### TAINT move to dedicated module ###
lets = ( original, modifier = null ) ->
  draft = if Array.isArray then [ original..., ] else { original..., }
  modifier draft
  return freeze draft

#===========================================================================================================
templates =
  add_run_cfg:
    lo:       0
    hi:       null
    key:      null
    value:    null
  hrd_find_families:
    key:      null
    value:    null


#===========================================================================================================
dbric_plugin =
  name:   'hrd_hoard_plugin' ### NOTE informative, not enforced ###
  prefix: 'hrd'              ### NOTE informative, not enforced ###
  exports:

    #-------------------------------------------------------------------------------------------------------
    build: [

      #-----------------------------------------------------------------------------------------------------
      SQL"""create table hrd_runs (
            rowid   text not null generated always as ( hrd_get_run_rowid( lo, hi, key ) ) stored,
            lo      real not null,
            hi      real not null,
            key     text not null,
            value   text not null default 'null', -- proper data type is `json` but declared as `text` b/c of `strict`
          -- primary key ( rowid ),
          unique ( rowid ),
          unique ( lo, hi, key, value ),
          constraint "Ωhrd_constraint___1" check (
            ( abs( lo ) = 9e999 ) or (
              ( lo = cast( lo as integer ) )
              and (       #{Number.MIN_SAFE_INTEGER} <= lo )
              and ( lo <= #{Number.MAX_SAFE_INTEGER} ) ) ),
          constraint "Ωhrd_constraint___2" check (
            ( abs( hi ) = 9e999 ) or (
              ( hi = cast( hi as integer ) )
              and (       #{Number.MIN_SAFE_INTEGER} <= hi )
              and ( hi <= #{Number.MAX_SAFE_INTEGER} ) ) ),
          constraint "Ωhrd_constraint___3" check ( lo <= hi ),
          constraint "Ωhrd_constraint___4" check ( key regexp '.*' )
          -- constraint "Ωhrd_constraint___5" check ( key regexp '^\$x$|^[^$].+' )
        ) strict;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create index "hrd_index_runs_hi"  on hrd_runs ( hi );"""
      SQL"""create index "hrd_index_runs_key" on hrd_runs ( key );"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view _hrd_facet_groups as
        select distinct
            a.key     as key,
            a.value   as value,
            count(*)  as runs
          from hrd_runs as a
          group by a.key, a.value
          order by a.key, a.value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_family_conflicts_2 as
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
          order by a.lo, a.hi, a.key;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view _hrd_clan_has_conflict_2 as
        select distinct
            f.key                     as key,
            not ( c.key is null )     as has_conflict
        from _hrd_facet_groups   as f
        left join hrd_family_conflicts_2 as c on ( f.key = c.key and f.value = c.value )
        order by f.key, f.value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_family_conflicts_1 as
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
          order by a.lo, a.hi, a.key;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view _hrd_family_has_conflict_1 as
        select distinct
            f.key                                                     as key,
            f.value                                                   as value,
            not ( ca.key_a is null and cb.key_b is null )             as has_conflict
        from _hrd_facet_groups as f
        left join hrd_family_conflicts_1 as ca on ( f.key = ca.key_a and f.value = ca.value_a )
        left join hrd_family_conflicts_1 as cb on ( f.key = cb.key_b and f.value = cb.value_b )
        order by key, value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_normalization as
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
          order by key, value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_families as
        select distinct
            g.key                       as key,
            g.value                     as value,
            min( r.lo ) over w          as first,
            max( r.hi ) over w          as last,
            g.runs                      as runs,
            false                       as has_conflict, -- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            n.is_normal                 as is_normal
          from _hrd_facet_groups           as g
          left join hrd_normalization     as n using ( key, value )
          left join hrd_runs              as r using ( key, value )
          window w as ( partition by r.key, r.value )
          order by key, value;"""
      #-----------------------------------------------------------------------------------------------------
      ]

    #-------------------------------------------------------------------------------------------------------
    functions:

      #-----------------------------------------------------------------------------------------------------
      hrd_get_run_rowid:
        deterministic: true
        value: ( lo, hi, key ) ->
          ls = if lo < 0 then '-' else '+'
          hs = if hi < 0 then '-' else '+'
          f"t:hrd:runs:V=#{ls}#{Math.abs lo}:*<06x;,#{hs}#{Math.abs hi}:*<06x;,#{key}"

      # #-----------------------------------------------------------------------------------------------------
      # hrd_json_quote:
      #   deterministic: true
      #   value: ( x ) -> JSON.stringify x

    #-------------------------------------------------------------------------------------------------------
    statements:

      #-----------------------------------------------------------------------------------------------------
      _hrd_insert_run: SQL"""insert into hrd_runs ( lo, hi, key, value ) values ( $lo, $hi, $key, $value );"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs: SQL"""
        select rowid, lo, hi, key, value
          from hrd_runs
          order by lo, hi, key;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_overlaps: SQL"""
        select rowid, lo, hi, key, value
          from hrd_runs
          where true
            and ( lo <= $hi )
            and ( hi >= $lo )
          order by lo, hi, key;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_overlaps_for_key: SQL"""
        select rowid, lo, hi, key, value
          from hrd_runs
          where true
            and ( key = $key )
            and ( lo <= $hi )
            and ( hi >= $lo )
          order by lo, hi, key;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs_with_conflicts_1: SQL"""select * from hrd_family_conflicts_1;"""
      hrd_delete_run:                 SQL"""delete from hrd_runs where rowid = $rowid;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_nonnormal_families: SQL"""
        select key, value from hrd_normalization where is_normal = false order by key, value;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_remove_overlap_1: SQL"""
        -- .................................................................................................
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
        );"""

    #-------------------------------------------------------------------------------------------------------
    methods:

      # #-----------------------------------------------------------------------------------------------------
      # _hrd_as_halfopen:   ( run       ) -> { start: run.lo,         end:  run.hi        + 1, }
      # _hrd_from_halfopen: ( halfopen  ) -> { lo:    halfopen.start, hi:   halfopen.end  - 1, }

      # #-----------------------------------------------------------------------------------------------------
      # _hrd_subtract: ( base, mask ) ->
      #   halfopens = IFN.substract [ ( @_hrd_as_halfopen base ), ], [ ( @_hrd_as_halfopen mask ), ]
      #   return ( @_hrd_from_halfopen halfopen for halfopen in halfopens )

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs:              -> @walk @statements.hrd_find_runs
      hrd_find_nonnormal_families:  -> @walk @statements.hrd_find_nonnormal_families

      #-----------------------------------------------------------------------------------------------------
      ### TAINT should use `nfa` but currently fails for generators ###
      # hrd_find_families: nfa { template: templates.hrd_find_families, }, ( key, value, cfg ) ->
      hrd_find_families: ( cfg ) ->
        cfg = { templates.hrd_find_families..., cfg..., }
        switch true
          when cfg.key? and cfg.value?
            cfg.value = JSON.stringify cfg.value
            sql       = SQL"""select * from hrd_families where key = $key and value = $value order by key, value;"""
          when cfg.key?
            sql       = SQL"""select * from hrd_families where key = $key order by key, value;"""
          when cfg.value?
            cfg.value = JSON.stringify cfg.value
            sql       = SQL"""select * from hrd_families where value = $value order by key, value;"""
          else
            sql       = SQL"""select * from hrd_families order by key, value;"""
        for row from @walk sql, cfg
          row.has_conflict  = as_bool row.has_conflict
          row.is_normal     = as_bool row.is_normal
          row.value         = JSON.parse row.value
          yield row
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs_with_conflicts_1: ->
        for row from @walk @statements.hrd_find_runs_with_conflicts_1
          # row.has_conflict  = as_bool row.has_conflict
          # row.is_normal     = as_bool row.is_normal
          yield row
        ;null

      #-----------------------------------------------------------------------------------------------------
      _hrd_create_insert_run_cfg: ( lo, hi, key, value ) ->
        hi   ?= lo
        value = JSON.stringify value
        return { lo, hi, key, value, }

      #-----------------------------------------------------------------------------------------------------
      # hrd_find_overlaps: nfa { template: templates.lo_hi, }, ( lo, hi, cfg ) ->
      hrd_find_overlaps: ( lo, hi = null ) ->
        hi   ?= lo
        for row from @walk @statements.hrd_find_overlaps, { lo, hi, }
          row.value = JSON.parse row.value
          yield row
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_add_run: nfa { template: templates.add_run_cfg, }, ( lo, hi, key, value, cfg ) ->
        return @statements._hrd_insert_run.run @_hrd_create_insert_run_cfg lo, hi, key, value

      #-----------------------------------------------------------------------------------------------------
      _hrd_runs_from_conflict_1: ( conflict, ok_value_json ) ->
          { rowid_a, lo_a, hi_a, key_a, value_a,
            rowid_b, lo_b, hi_b, key_b, value_b, }  = conflict
          run_ok = { rowid: rowid_a, lo: lo_a, hi: hi_a, key: key_a, value: value_a, }
          run_nk = { rowid: rowid_b, lo: lo_b, hi: hi_b, key: key_b, value: value_b, }
          return { run_ok, run_nk, } if run_ok.value is ok_value_json
          return { run_ok: run_nk, run_nk: run_ok, }

      #-----------------------------------------------------------------------------------------------------
      hrd_punch_1: nfa { template: templates.add_run_cfg, }, ( lo, hi, key, value, cfg ) ->
        ### TAINT need to wrap in transaction ###
        ### like `_hrd_add_run()` but resolves key/value conflicts in favor of value given ###
        # @hrd_validate_1()
        new_ok = @_hrd_create_insert_run_cfg lo, hi, key, value
        @with_transaction =>
          @statements._hrd_insert_run.run new_ok
          conflicts = [ ( @hrd_find_runs_with_conflicts_1() )..., ]
          for conflict in conflicts
            continue unless conflict.key_a is new_ok.key ### do not resolve conflicts of other key/value pairs ###
            { run_ok, run_nk, } = @_hrd_runs_from_conflict_1 conflict, new_ok.value
            @statements.hrd_remove_overlap_1.run { base_rowid: run_nk.rowid, mask_rowid: run_ok.rowid, }
            @statements.hrd_delete_run.run { rowid: run_nk.rowid, }
            ;null
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_validate_1: ->
        return null if ( conflicts = [ ( @hrd_find_runs_with_conflicts_1() )..., ] ).length is 0
        throw new Error "Ωhrd___6 found conflicts: #{rpr conflicts}"


#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { templates, IFN, lets, typespace: T, }
  return {
    dbric_plugin,
  }


