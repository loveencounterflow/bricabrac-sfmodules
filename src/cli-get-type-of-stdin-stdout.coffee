
'use strict'

#---------------------------------------------------------------------------------------------------------
fstatSync = null

#---------------------------------------------------------------------------------------------------------
get_type_of_stat = ( fd ) ->
  fstatSync  ?= ( require 'node:fs' ).fstatSync
  stats       = fstatSync fd
  return 'pipe'   if stats.isFIFO()
  return 'file'   if stats.isFile()
  return 'socket' if stats.isSocket()
  return 'other'   # z.B. /dev/null, Block Device

#---------------------------------------------------------------------------------------------------------
@get_type_of_stdout = ->
  return 'tty'    if process.stdout.isTTY
  return get_type_of_stat 1

#---------------------------------------------------------------------------------------------------------
@get_type_of_stdin = ->
  return 'tty'    if process.stdin.isTTY
  return get_type_of_stat 0

