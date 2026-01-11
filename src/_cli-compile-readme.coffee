
'use strict'

#===========================================================================================================
FS                        = require 'node:fs'
PATH                      = require 'node:path'
{ resolve,
  join,                 } = PATH
# { matchesGlob,          } = require
{ walk_lines_with_positions,
                        } = ( require './unstable-fast-linereader-brics' ).require_fast_linereader()
{ warn,
  log,
  debug,                } = console
{ rpr,                  } = ( require './loupe-brics' ).require_loupe()
{ spawnSync,            } = require 'node:child_process'


###
base_path = PATH.resolve PATH.join __dirname, '..'
pattern   = '*.md'
entries   = FS.readdirSync base_path, { recursive: true, }
entries.sort()
for entry in entries
  continue unless ( FS.statSync entry ).isFile()
  continue unless PATH.matchesGlob entry, pattern
  debug 'Ωcrmmd___1', entry
###

#-----------------------------------------------------------------------------------------------------------
file_has_uncommitted_changes = ( path ) ->
  { status, } = spawnSync 'git', [ 'diff', '--quiet', path, ], { cwd: base_path, }
  return false if status is 0
  return true

#-----------------------------------------------------------------------------------------------------------
clear = ( path ) ->
  FS.writeFileSync path, ''
  return null

#-----------------------------------------------------------------------------------------------------------
append = ( path, text ) ->
  FS.appendFileSync path, "#{text}\n"
  return null

#===========================================================================================================
base_path   = resolve join __dirname, '..'
src_path    = resolve join base_path, 'doc-src'
main_path   = resolve src_path, 'main.md'
target_path = resolve base_path, 'README.md'

#===========================================================================================================
debug 'Ωcrmmd___3', { base_path, src_path, main_path, }

#===========================================================================================================
if file_has_uncommitted_changes target_path
  warn()
  warn "target file"
  warn "  #{target_path}"
  warn "has uncomitted changes; terminating"
  warn()
  process.exit 111

#===========================================================================================================
clear target_path
for { line, } from walk_lines_with_positions main_path
  # debug 'Ωcrmmd___4', rpr line
  append target_path, line






