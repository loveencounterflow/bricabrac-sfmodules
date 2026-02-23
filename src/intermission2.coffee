
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
      SQL"""create table _hrd_runs (
            rowid   text    not null,
            inorn   integer not null, -- INsertion ORder Number
            lo      real    not null,
            hi      real    not null,
            facet   text    not null generated always as ( printf( '%s:%s', key, value ) ) stored,
            key     text    not null,
            value   text    not null default 'null', -- proper data type is `json` but declared as `text` b/c of `strict`
          primary key ( rowid ),
          unique ( inorn ),
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
          constraint "Ωhrd_constraint___3" check ( lo <= hi )
        ) strict;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create index "hrd_index_runs_lo_hi"       on _hrd_runs ( lo,  hi );"""
      SQL"""create index "hrd_index_runs_hi"          on _hrd_runs ( hi );"""
      SQL"""create index "hrd_index_runs_inorn_desc"  on _hrd_runs ( inorn desc );"""
      SQL"""create index "hrd_index_runs_key"         on _hrd_runs ( key );"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_runs as select * from _hrd_runs;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create trigger hrd_on_before_insert_run
        instead of insert on hrd_runs
          for each row begin
            insert into _hrd_runs ( rowid, inorn, lo, hi, key, value ) values
              ( _hrd_get_next_run_rowid(), _hrd_get_run_inorn(), new.lo, new.hi, new.key, new.value );
            end;
        ;"""

      #-----------------------------------------------------------------------------------------------------
      ]

    #-------------------------------------------------------------------------------------------------------
    functions:

      #-----------------------------------------------------------------------------------------------------
      _hrd_get_run_inorn:
        deterministic: false
        value: -> @_hrd_get_run_inorn()

      #-----------------------------------------------------------------------------------------------------
      _hrd_get_next_run_rowid:
        deterministic: false
        value: -> @_hrd_get_next_run_rowid()

      # #-----------------------------------------------------------------------------------------------------
      # hrd_json_quote:
      #   deterministic: true
      #   value: ( x ) -> JSON.stringify x

    #-------------------------------------------------------------------------------------------------------
    statements:

      #-----------------------------------------------------------------------------------------------------
      _hrd_insert_run: SQL"""
        insert into hrd_runs ( lo, hi, key, value )
          values ( $lo, $hi, $key, $value );"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs: SQL"""
        select rowid, inorn, lo, hi, key, value
          from hrd_runs
          order by lo, hi, key;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_delete_run:       SQL"""delete from _hrd_runs where rowid = $rowid;"""
      hrd_delete_all_runs:  SQL"""delete from _hrd_runs;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_covering_runs: SQL"""
        select rowid, lo, hi, key, value
          from hrd_runs
          where true
            and ( lo <= $hi )
            and ( hi >= $lo )
          order by lo, hi, key;"""

      #-----------------------------------------------------------------------------------------------------
      hrd_find_topruns_for_point: SQL"""
        with ranked as ( select
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
        select * from ranked where ( rn = 1 ) order by key asc;"""

    #-------------------------------------------------------------------------------------------------------
    methods:

      #-----------------------------------------------------------------------------------------------------
      hrd_find_runs:      -> @walk @statements.hrd_find_runs
      _hrd_get_run_inorn: -> @state.hrd_run_inorn = ( @state.hrd_run_inorn ? 0 )

      #-----------------------------------------------------------------------------------------------------
      _hrd_get_next_run_rowid: ->
        @state.hrd_run_inorn = R = @_hrd_get_run_inorn() + 1
        return "t:hrd:runs:R=#{R}"

      #-----------------------------------------------------------------------------------------------------
      _hrd_create_insert_run_cfg: ( lo, hi, key, value ) ->
        hi   ?= lo
        value = JSON.stringify value
        return { lo, hi, key, value, }

      #-----------------------------------------------------------------------------------------------------
      hrd_add_run: nfa { template: templates.add_run_cfg, }, ( lo, hi, key, value, cfg ) ->
        return @statements._hrd_insert_run.run @_hrd_create_insert_run_cfg lo, hi, key, value

      #-----------------------------------------------------------------------------------------------------
      # hrd_find_covering_runs: nfa { template: templates.lo_hi, }, ( lo, hi, cfg ) ->
      hrd_find_covering_runs: ( lo, hi = null ) ->
        hi   ?= lo
        for row from @walk @statements.hrd_find_covering_runs, { lo, hi, }
          ### TAINT code duplication, use casting method ###
          hide row, 'value_json', row.value
          row.value = JSON.parse row.value
          yield row
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_find_topruns_for_point: ( point ) ->
        for row from @walk @statements.hrd_find_topruns_for_point, { point, }
          ### TAINT code duplication, use casting method ###
          hide row, 'value_json', row.value
          row.value = JSON.parse row.value
          yield row
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_delete_runs: -> @statements.hrd_delete_all_runs.run()

      #-----------------------------------------------------------------------------------------------------
      hrd_describe_point: ( point ) -> freeze Object.fromEntries ( \
        [ key, value, ] for { key, value, } from @hrd_find_topruns_for_point point )


#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { templates, IFN, lets, typespace: T, }
  return {
    dbric_plugin,
  }


