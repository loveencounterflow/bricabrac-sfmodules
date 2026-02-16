
'use strict'


#===========================================================================================================
{ debug,                } = console
{ freeze,               } = Object
IFN                       = require './../dependencies/intervals-fn-lib.js'
{ T,                    } = require './intermission-types'
#...........................................................................................................
{ nfa,                  } = ( require './unstable-normalize-function-arguments-brics' ).require_normalize_function_arguments()
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
  SQL,
  LIT,
  IDN,
  VEC,                  } = require './dbric'

#===========================================================================================================
#===========================================================================================================
### TAINT move to dedicated module ###
### NOTE not using `letsfreezethat` to avoid issue with deep-freezing `Run` instances ###
lets = ( original, modifier = null ) ->
  draft = if Array.isArray then [ original..., ] else { original..., }
  modifier draft
  return freeze draft

#===========================================================================================================
templates = {}

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
      SQL"""create view hrd_group_facets as
        select distinct
            a.key     as key,
            a.value   as value,
            count(*)  as runs
          from hrd_runs as a
          group by a.key, a.value
          order by a.key, a.value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_conflicts as
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
              and ( a.value <>  b.value )
              and ( a.lo    <=  b.hi    )
              and ( a.hi    >=  b.lo    )
          order by a.lo, a.hi, a.key;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view _hrd_group_has_conflict as
        select distinct
            f.key                                                     as key,
            f.value                                                   as value,
            not ( ca.key_a is null and cb.key_b is null )             as has_conflict
        from hrd_group_facets as f
        left join hrd_conflicts as ca on ( f.key = ca.key_a and f.value = ca.value_a )
        left join hrd_conflicts as cb on ( f.key = cb.key_b and f.value = cb.value_b )
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
      SQL"""create view hrd_groups_plus as
        select
            g.key                       as key,
            g.value                     as value,
            first_value( r.lo ) over w  as first,
            last_value(  r.hi ) over w  as last,
            g.runs                      as runs,
            n.is_normal                 as is_normal
          from hrd_group_facets           as g
          left join hrd_normalization     as n using ( key, value )
          left join hrd_runs              as r using ( key, value )
          window w as ( partition by r.key, r.value order by r.lo, r.hi, r.key, r.value )
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
      hrd_insert_run: SQL"""insert into hrd_runs ( lo, hi, key, value ) values ( $lo, $hi, $key, $value );"""

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
      hrd_find_conflicts:         SQL"""select * from hrd_conflicts;"""
      hrd_find_group_facets:      SQL"""select * from hrd_group_facets;"""
      hrd_find_runs_by_group:     SQL"""select * from hrd_runs order by key, value, lo, hi;"""
      hrd_find_groups_plus:       SQL"""select * from hrd_groups_plus order by key, value;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_nonnormal_groups: SQL"""
        select key, value from hrd_normalization where is_normal = false order by key, value;"""

    #-------------------------------------------------------------------------------------------------------
    methods:

      #-----------------------------------------------------------------------------------------------------
      hrd_find_conflicts:         -> @walk @statements.hrd_find_conflicts
      hrd_find_group_facets:      -> @walk @statements.hrd_find_group_facets
      hrd_find_nonnormal_groups:  -> @walk @statements.hrd_find_nonnormal_groups
      hrd_find_groups_plus:       -> @walk @statements.hrd_find_groups_plus

      #-----------------------------------------------------------------------------------------------------
      hrd_validate: ->
        return null if ( conflicts = [ ( @hrd_find_conflicts() )..., ] ).length is 0
        throw new Error "Ωhrd___6 found conflicts: #{rpr conflicts}"

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs_by_group: ->
        prv_key   = null
        prv_value = null
        group     = null
        for { rowid, lo, hi, key, value, } from @walk @statements.hrd_find_runs_by_group
          unless ( key is prv_key ) and ( value is prv_value )
            yield group if group?
            group         = { key, value, runs: [], }
            prv_key       = key
            prv_value     = value
          group.runs.push { rowid, lo, hi, key, value, }
        yield group if group?
        return null

#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { templates, IFN, lets, typespace: T, }
  return {
    dbric_plugin,
  }


