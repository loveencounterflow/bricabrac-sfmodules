


'use strict'

#===========================================================================================================
# { log,
#   debug,                } = console
#-----------------------------------------------------------------------------------------------------------
SFMODULES                 = require '../main'
# SFMODULES                 = require 'bricabrac-sfmodules'
{ ansi_colors_and_effects: \
    C,                  } = SFMODULES.require_ansi_colors_and_effects()
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ walk_require_statements,
                        } = SFMODULES.require_parse_require_statements()
{ strip_ansi,           } = SFMODULES.require_strip_ansi()
# { SQL: SH,              } = SFMODULES.unstable.require_dbric()
# { walk_js_tokens,
#   walk_essential_js_tokens,
#   summarize,            } = SFMODULES.require_walk_js_tokens()
PATH                      = require 'node:path'
FS                        = require 'node:fs'
#-----------------------------------------------------------------------------------------------------------
{ createRequire,
  findPackageJSON,      } = require 'node:module'
# { pathToFileURL,        } = require 'node:url'
# { register,             } = require 'node:module'
# { stripTypeScriptTypes, } = require 'node:module'
# { isBuiltin,            } = require 'node:module'
# isBuiltin('node:fs'); // true
# isBuiltin('fs'); // true
# isBuiltin('wss'); // false
#-----------------------------------------------------------------------------------------------------------
{ warn,
  info,
  debug,
  whisper,              } = do \
require_console_output = ->
  line_width = if process.stdout.isTTY then process.stdout.columns else 108
  pen = ( P... ) ->
    text = ( "#{p}" for p in P ).join ' '
     # ( strip_ansi text ).length
    return text.padEnd line_width, ' '
  warn = ( P... ) ->
    console.log "#{C.bg_navy}#{C.red}#{C.bold}#{pen P...}#{C.bold0}#{C.default}#{C.bg_default}"
  info = ( P... ) ->
    console.log "#{C.bg_honeydew}#{C.black}#{C.bold}#{pen P...}#{C.bold0}#{C.default}#{C.bg_default}"
  whisper = ( P... ) ->
    console.log "#{C.bg_slategray}#{C.black}#{C.bold}#{pen P...}#{C.bold0}#{C.default}#{C.bg_default}"
  debug = ( P... ) ->
    console.log "#{C.bg_violet}#{C.white}#{C.bold}#{pen P...}#{C.bold0}#{C.default}#{C.bg_default}"
  return exports = { pen, warn, info, whisper, debug, }


#===========================================================================================================
debug "ΩLRS___1 ————————————————————————————————————————"


### NOTE: it's possible to use customized logic for `require()` ###
# { registerHooks,        } = require 'node:module'
# registerHooks {
#   resolve:  ( specifier, context, nextResolve ) ->
#     debug 'ΩLRS___2', {  specifier, context, nextResolve, }
#     if specifier is 'bric:package.json'
#       return nextResolve '/home/flow/jzr/bricabrac-sfmodules/package.json'
#     return nextResolve specifier
#   # load:     ( url, context, nextLoad ) ->
#   #   debug 'ΩLRS___3', {  url, context, nextLoad, }
#   #   return nextLoad url
#     # return nextLoad '/home/flow/jzr/bricabrac-sfmodules/package.json'
#   }
# debug 'ΩLRS___4', ( require '/home/flow/jzr/bricabrac-sfmodules/lib/main.js' ).version
# debug 'ΩLRS___5', ( require 'bric:package.json' ).version
# # debug 'ΩLRS___6', ( require 'bric:package' ).version
# # require 'node:module'

source_path = process.argv[ 2 ]
# source_path = __filename
debug "ΩLRS___7 using source path:  #{source_path}"

collect_transitive_require_statements = ( path ) ->
  seen_paths  = new Set()
  R           = []
  return _collect_transitive_require_statements path, R, seen_paths

_collect_transitive_require_statements = ( path, collector, seen_paths ) ->
  custom_require  = createRequire path
  for { type, disposition, selector, } from walk_require_statements { path, } # NOTE can explicitly give source
    switch type
      when 'require'
        switch disposition
          when 'node'
            warn "ΩLRS___8 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
          when 'npm'
            warn "ΩLRS___9 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
          when 'inside', 'outside'
            dependent_path = custom_require.resolve selector
            whisper 'ΩLRS__10', "(#{disposition}) #{path} -> #{dependent_path}"
            if seen_paths.has dependent_path
              continue
            #   throw new Error "ΩLRS__11 detected cyclic dependency from #{rpr path} to #{rpr dependent_path}"
            seen_paths.add dependent_path
            # debug 'ΩLRS__12', findPackageJSON selector, path
            # debug 'ΩLRS__13', findPackageJSON path
            # debug 'ΩLRS__14', findPackageJSON selector
            collector.push { disposition, source_path: path, path: dependent_path, selector, }
            _collect_transitive_require_statements dependent_path, collector, seen_paths
          # when 'outside'
          #   warn "ΩLRS__15 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
          when 'unresolved'
            warn "ΩLRS__16 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
      else
        warn "ΩLRS__17 ignoring require statement with type #{rpr type}"
  return collector

dependencies = collect_transitive_require_statements source_path
# info 'ΩLRS__18', ( rpr d.path ), ( "(#{rpr d.selector})" ) for d in dependencies
# cwd         = process.cwd()
{ Shell,  } = require '../../../bvfs'
remote_urls = {}
rows        = []
#...........................................................................................................
for d in dependencies
  #.........................................................................................................
  cwd = PATH.dirname d.path
  unless ( remote_url = remote_urls[ cwd ] )?
    sh = new Shell { cwd, lines: false, only_stdout: true, }
    try
      remote_url          = sh.call 'git', 'config', '--get', 'remote.origin.url'
      remote_urls[ cwd ]  = remote_url
    catch error
      warn 'ΩLRS__19', error.message
      remote_url          = '?unknown?'
      remote_urls[ cwd ]  = remote_url
  #.........................................................................................................
  source_relpath    = PATH.relative cwd, d.source_path
  target_path       = PATH.resolve ( PATH.dirname d.source_path ), d.selector
  rows.push           { source_relpath, selector: d.selector, target_path, remote_url, }
  info 'ΩLRS__20', d.disposition, source_relpath, target_path, d.selector, remote_url
#...........................................................................................................
rows.sort ( a, b ) ->
  return +1 if a.remote_url  > b.remote_url
  return -1 if a.remote_url  < b.remote_url
  return +1 if a.target_path > b.target_path
  return -1 if a.target_path < b.target_path
  return 0
console.table Object.fromEntries ( [ idx + 1, row, ] for row, idx in rows )

# shell_cfg = { cwd: '/tmp', lines: false, only_stdout: true, }




