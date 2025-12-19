'use strict'

############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_cli_table_3a: ->
    #-------------------------------------------------------------------------------------------------------
    _Table                          = require 'cli-table3'
    SFMODULES                       = require './main'
    { ansi_colors_and_effects: C, } = SFMODULES.require_ansi_colors_and_effects()

    #-------------------------------------------------------------------------------------------------------
    templates =
      mytable:
        horizontal_lines: false
        # chars:
          # 'top':            '═'
          # 'top-mid':        '╤'
          # 'top-left':       '╔'
          # 'top-right':      '╗'
          # 'bottom':         '═'
          # 'bottom-mid':     '╧'
          # 'bottom-left':    '╚'
          # 'bottom-right':   '╝'
          # 'left':           '║'
          # 'left-mid':       '╟'
          # 'right':          '║'
          # 'right-mid':      '╢'
        # colWidths:          [11, 5, 5]
        # wordWrap:           true
        # wrapOnWordBoundary: false

        chars:
          'top':            '─'
          'top-mid':        '┬'
          'top-left':       '┌'
          'top-right':      '┐'
          'bottom':         '─'
          'bottom-mid':     '┴'
          'bottom-left':    '└'
          'bottom-right':   '┘'
          'left':           '│'
          'left-mid':       '├'
          'mid':            '─'
          'mid-mid':        '┼'
          'right':          '│'
          'right-mid':      '┤'
          'middle':         '│'
        # truncate:         '…'
        # colWidths:        []
        # rowHeights:       []
        # colAligns:        []
        # rowAligns:        []
        style:
          'padding-left':   1
          'padding-right':  1
          'head':           [ 'bold', 'brightYellow', 'bgBlue', ]
          'border':         [ 'grey', ]
          'compact':        false
        head: []

    #=======================================================================================================
    class Table extends _Table

      #-----------------------------------------------------------------------------------------------------
      constructor: ( cfg ) ->
        cfg = { templates.mytable..., cfg..., }
        super cfg
        ;undefined

      #-----------------------------------------------------------------------------------------------------
      push: ( row ) ->
        for cell, idx in row
          # debug 'Ωjzrsdb___1', P
          ### TAINT not a good solution ###
          # row[ idx ] = C.turquoise + cell + C.default
          row[ idx ] = cell
        return super row

    #=======================================================================================================
    return exports = { Table, internals: { templates, }, }

#===========================================================================================================
Object.assign module.exports, BRICS

