

'use strict'

#===========================================================================================================
{ debug,
  warn                  } = console
{ Table, }                = ( require './cli-table3a.brics' ).require_cli_table3a()
{ f, }                    = require 'effstring'
# { type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()


#===========================================================================================================
class Dbric_table_formatter

  #---------------------------------------------------------------------------------------------------------
  _tbl_get_column_names: ( sql ) ->
    return ( c.name for c in sql.columns()  ) if @isa_statement sql
    return ( c.name for c in @state.columns )

  #---------------------------------------------------------------------------------------------------------
  tbl_as_text: ( sql, P... ) ->
    rows        = @walk sql, P...
    # caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
    col_names   = @_tbl_get_column_names sql
    caption     = "(caption here)"
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
  echo_cli_table = ( P... ) -> echo @tbl_as_text P...

#===========================================================================================================
module.exports = do =>
  internals = {}
  return {
    Dbric_table_formatter,
    internals, }
