

'use strict'

#===========================================================================================================
{ debug,
  log: echo,
  warn                  } = console
{ Table, }                = ( require './cli-table3a.brics' ).require_cli_table3a()
{ f, }                    = require 'effstring'
{ type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()


#===========================================================================================================
class Dbric_table_formatter

  #---------------------------------------------------------------------------------------------------------
  _tbl_get_column_names: ( sql ) ->
    return ( c.name for c in sql.columns()  ) if @isa_statement sql
    return ( c.name for c in @state.columns )

  #---------------------------------------------------------------------------------------------------------
  tbl_as_text: ( sql, P... ) ->
    switch type = type_of sql
      when 'generator'
        ### TAINT assert P is empty ###
        rows    = sql
        caption = '?'
      when 'generatorfunction'
        rows    = sql.call @, P...
        caption = sql.name
      when 'text'
        rows    = @walk sql, P...
        caption = sql
      else
        rows    = @walk sql, P...
        caption = sql.toString()
    # caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
    col_names   = @_tbl_get_column_names sql
    caption     = " #{caption} "
    table       = new Table { caption, head: [ '', col_names..., ], }
    count       = 0
    #.......................................................................................................
    for row from rows
      count++
      #.....................................................................................................
      cells = []
      #.....................................................................................................
      for col_name, col_idx in col_names
        cell = row[ col_name ]
        # cell = color cell if ( color = col_colors[ col_idx ] )?
        cells.push cell
      table.push table_row = [ "(#{count})", cells..., ]
    return table.toString()

  #---------------------------------------------------------------------------------------------------------
  tbl_echo_as_text: ( P... ) -> echo @tbl_as_text P...


#-----------------------------------------------------------------------------------------------------------
output_query_as_csv = ( query ) ->
  CSV   = require 'csv-stringify/sync'
  jzr   = new Jizura()
  wout  = ( P... ) -> process.stdout.write P...;                            ;null
  woutn = ( P... ) -> process.stdout.write P...; process.stdout.write '\n'  ;null
  werr  = ( P... ) -> process.stderr.write P...;                            ;null
  werrn = ( P... ) -> process.stderr.write P...; process.stderr.write '\n'  ;null
  # query = process.argv[ 2 ] ? null
  if ( not query? ) or ( query is '' )
    werrn reverse red " Ωdtf___2 no query given "
    process.exit 111
    return null
  rows  = jzr.dba.get_all query
  # woutn cli_commands.use_pspg
  wout CSV.stringify [ ( column.name for column in jzr.dba.state.columns ), ]
  wout CSV.stringify rows
  ;null


#===========================================================================================================
module.exports = do =>
  internals = {}
  return {
    Dbric_table_formatter,
    internals, }
