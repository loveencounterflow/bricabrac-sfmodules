
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
          -- constraint "Ωhrd_constraint___4" check ( key regexp '^\$x$|^[^$].+' )
        ) strict;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create index "hrd_index_runs_hi"  on hrd_runs ( hi );"""
      SQL"""create index "hrd_index_runs_key" on hrd_runs ( key );"""
      ]

    #-------------------------------------------------------------------------------------------------------
    functions:
      hrd_get_run_rowid:
        deterministic: true
        value: ( lo, hi, key ) ->
          ls = if lo < 0 then '-' else '+'
          hs = if hi < 0 then '-' else '+'
          f"t:hrd:runs:V=#{ls}#{Math.abs lo}:*<06x;,#{hs}#{Math.abs hi}:*<06x;,#{key}"
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
      hrd_find_conflicts: SQL"""
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


#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { templates, IFN, lets, typespace: T, }
  return {
    dbric_plugin,
  }


