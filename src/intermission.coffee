
'use strict'

GUY = require '../../guy'

#===========================================================================================================
{ debug,
  log: echo,            } = console
{ freeze,               } = Object
# IFN                       = require './../dependencies/intervals-fn-lib.js'
# { T,                    } = require './intermission-types'
#...........................................................................................................
{ nfa,                  } = require 'normalize-function-arguments'
{ type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ hide,                 } = ( require './various-brics' ).require_managed_property_tools()
{ inspect: rpr,         } = require 'node:util'
{ f,                    } = require 'effstring'
{ Dbric_std,
  SQL,                  } = require './dbric'

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


#===========================================================================================================
dbric_hoard_plugin =
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
      SQL"""create view hrd_families as
        select distinct
            a.key                       as key,
            a.value                     as value,
            a.facet                     as facet
          from hrd_runs as a
          order by key, value;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_global_bounds as
        select 'min' as bound, min( lo ) as point from hrd_runs union
        select 'max' as bound, max( hi ) as point from hrd_runs
        order by point;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_breakpoints as
        select 'lo' as bound, lo as point from hrd_runs union
        select 'hi' as bound, hi as point from hrd_runs
        order by point;"""

      #-----------------------------------------------------------------------------------------------------
      SQL"""create view hrd_inspection_points as
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
        order by point;"""

      # #-----------------------------------------------------------------------------------------------------
      # SQL""" create view hrd_breakpoint_facets as
      #   select *
      #   from hrd_breakpoints as a
      #   join hrd_runs as b on ( a.point = b.lo or a.point = b.hi )
      #   order by point, inorn desc;"""

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
      _hrd_find_families: SQL"""select * from hrd_families;"""

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
      _hrd_get_families: ->
        R = {}
        for { key, value, facet, } from @walk @statements._hrd_find_families
          value_json  = value
          value       = JSON.parse value
          R[ facet ]  = { key, value, facet, value_json, }
        return R

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
      hrd_get_min_max: ( point ) ->
        R = {}
        for row from @walk SQL"select bound, point from hrd_global_bounds order by bound desc;"
          R[ row.bound ] = row.point
        return R

      #-----------------------------------------------------------------------------------------------------
      hrd_describe_point: ( point ) -> freeze Object.fromEntries ( \
        [ key, value, ] for { key, value, } from @hrd_find_topruns_for_point point )

      #-----------------------------------------------------------------------------------------------------
      _hrd_facets_from_point: ( point ) ->
        return new Set ( facet for { facet, } from @hrd_find_topruns_for_point point )

      #-----------------------------------------------------------------------------------------------------
      _hrd_map_facets_of_inspection_points: ->
        R = new Map()
        for { point, } from @walk SQL"select * from hrd_inspection_points;"
          R.set point, @_hrd_facets_from_point point
        return R

      #-----------------------------------------------------------------------------------------------------
      _hrd_get_keyvalue_by_facet: ->
        R = {}
        for { facet, key, value, } from @walk SQL"select distinct facet, key, value from hrd_runs order by key, value;"
          value_json  = value
          value       = JSON.parse value_json
          R[ facet ]  = { key, value, value_json, }
        return R

      #-----------------------------------------------------------------------------------------------------
      hrd_visualize: ({ lo, hi, }) ->
        { min, max, }     = @hrd_get_min_max()
        lo               ?= Math.max min, 0
        hi               ?= Math.min max, +100
        facet_from_row    = ( row ) -> "#{row.key}:#{row.value_json}"
        facets_from_rows  = ( rows ) -> new Set [ ( new Set ( ( facet_from_row row ) for row from rows ) )..., ].sort()
        global_facets     = facets_from_rows @hrd_find_covering_runs lo, hi
        global_width      = hi - lo
        colors            =
          fallback:   ( P... ) -> GUY.trm.grey  P...
          warn:       ( P... ) -> GUY.trm.red   P...
          in:         ( P... ) -> GUY.trm.gold  P...
          out:        ( P... ) -> GUY.trm.blue  P...
          run:        ( P... ) -> GUY.trm.grey  P...
        #...................................................................................................
        { row_count, } = @get_first SQL"select count(*) as row_count from hrd_runs;"
        echo()
        echo GUY.trm.white GUY.trm.reverse GUY.trm.bold " hoard with #{row_count} runs "
        #...................................................................................................
        for global_facet from global_facets
          gfph      = ' '.repeat global_facet.length
          #.................................................................................................
          statement = SQL"""
            select * from hrd_runs
              where true
                and ( facet = $global_facet )
                and ( lo <= $hi )
                and ( hi >= $lo )
              -- order by hi - lo asc, lo desc, key, value
              order by inorn desc
              ;"""
          #.................................................................................................
          points = ''
          for cid in [ lo .. hi ]
            local_keys  = facets_from_rows @hrd_find_covering_runs cid
            chr         = String.fromCodePoint cid
            color       = if ( local_keys.has global_facet ) then colors.in else colors.out
            points     += color chr
          echo f"#{global_facet}:<15c; #{' '}:>6c; #{points}"
          #.................................................................................................
          for row from @walk statement, { global_facet, lo, hi, }
            id          = row.rowid.replace /^.*?=(\d+)/, '[$1]'
            first       = ( Math.max row.lo, lo ) - lo
            last        = ( Math.min row.hi, hi ) - lo
            left        = GUY.trm.grey GUY.trm.reverse '🮊'.repeat first
            # left        = GUY.trm.grey '│'.repeat first
            mid         = GUY.trm.gold '🮊'.repeat last - first + 1
            # mid         = GUY.trm.gold '♦'.repeat last - first + 1
            # mid         = GUY.trm.gold '█'.repeat last - first + 1
            right       = GUY.trm.grey GUY.trm.reverse '🮊'.repeat ( global_width - last + 1 )
            echo colors.run f"#{gfph}:<15c; #{id}:>6c; #{left}#{mid}#{right}"
        #...................................................................................................
        prv_point = 0
        line      = ''
        for { point, } from @walk SQL"select * from hrd_inspection_points;"
          point  -= lo
          delta   = Math.max 0, point - prv_point - 1
          line   += ' '.repeat delta
          line   += GUY.trm.gold switch point
            when min then '['
            when max then ']'
            else          '▲'
          prv_point = point
        echo colors.run f"#{gfph}:<15c; #{''}:>6c; #{line}"
        #...................................................................................................
        ;null

      #-----------------------------------------------------------------------------------------------------
      hrd_regularize: ->
        ### Rewrite runs so no overlapping families exist within a clan ###
        @with_
        { min, max, }     = @hrd_get_min_max()
        keyvalue_by_facet = @_hrd_get_keyvalue_by_facet()
        facets_by_point   = @_hrd_map_facets_of_inspection_points()
        facets            = Object.keys @_hrd_get_families() ### TAINT use _get_facets ###
        lopoints          = {}
        new_runs          = []
        #...................................................................................................
        @with_transaction =>
          #.................................................................................................
          for facet in facets
            for [ point, point_facets, ] from facets_by_point
              chr         = String.fromCodePoint point
              if point_facets.has facet
                lopoints[ facet ] ?= point
              else if lopoints[ facet ]?
                { key, value, }   = keyvalue_by_facet[ facet ]
                new_runs.push { facet, key, value, lo: lopoints[ facet ], hi: point - 1, }
                lopoints[ facet ] = null
          #.................................................................................................
          for facet, lo of lopoints when lo?
            { key, value, } = keyvalue_by_facet[ facet ]
            new_runs.push { facet, key, value, lo, hi: max, }
          @hrd_delete_runs()
          #.................................................................................................
          @hrd_add_run lo, hi, key, value for { facet, key, value, lo, hi, } from new_runs
          ;null
        #...................................................................................................
        ;null

#===========================================================================================================
class Hoard extends Dbric_std
  @plugins: [
    dbric_hoard_plugin
    ]


#===========================================================================================================
module.exports = do =>
  internals = Object.freeze { templates, lets, }
  return {
    dbric_hoard_plugin,
    Hoard,
    internals, }


