'use strict'

#===========================================================================================================
require_wc = ->

  #---------------------------------------------------------------------------------------------------------
  wc = ( path ) ->
    CP = require 'node:child_process'
    result = CP.spawnSync 'wc', [ '--bytes', '--lines', path, ], { encoding: 'utf-8', }
      # warn 'Ωtcs__72', rpr cause.code
      # throw new Error "Ωtcs__31 file not found: #{path}", { cause, } if cause.code is 'ENOENT'
      # debug 'Ωtcs__70', process.stdout
      # debug 'Ωtcs__71', process.stderr
      # warn 'Ωtcs__72', cause.message
    throw result.error if result.error?
    # help 'Ωtcs__73', rpr result.status
    # help 'Ωtcs__74', rpr result.stdout
    # help 'Ωtcs__78', rpr result.stderr
    # help 'Ωtcs__79', rpr result.error
    match = result.stdout?.match /// ^ \s* (?<lines> \d+ ) \s+ (?<bytes> \d+ ) \s+ ///
    bytes = Number match?.groups.bytes
    lines = Number match?.groups.lines
    return { bytes, lines, }

  #---------------------------------------------------------------------------------------------------------
  return exports = { wc, }

#===========================================================================================================
module.exports = { require_wc, }

