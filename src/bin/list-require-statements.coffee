


'use strict'

#===========================================================================================================
{ log,
  debug,                } = console
#-----------------------------------------------------------------------------------------------------------
SFMODULES                 = require '../main'
# SFMODULES                 = require 'bricabrac-sfmodules'
{ ansi_colors_and_effects: \
    C,                  } = SFMODULES.require_ansi_colors_and_effects()
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ walk_require_statements,
                        } = SFMODULES.require_parse_require_statements()
# { walk_js_tokens,
#   walk_essential_js_tokens,
#   summarize,            } = SFMODULES.require_walk_js_tokens()
PATH                      = require 'node:path'
FS                        = require 'node:fs'
warn = ( P... ) ->
  x = ( "#{p}" for p in P ).join ' '
  log "#{C.bg_navy}#{C.red}#{C.bold}#{x}#{C.bold0}#{C.default}#{C.bg_default}"
info = ( P... ) ->
  x = ( "#{p}" for p in P ).join ' '
  log "#{C.bg_honeydew}#{C.black}#{C.bold}#{x}#{C.bold0}#{C.default}#{C.bg_default}"
whisper = ( P... ) ->
  x = ( "#{p}" for p in P ).join ' '
  log "#{C.bg_slategray}#{C.black}#{C.bold}#{x}#{C.bold0}#{C.default}#{C.bg_default}"

debug "ΩLRS___1 ————————————————————————————————————————"

{ createRequire,        } = require 'node:module'
# { findPackageJSON,      } = require 'node:module'
# { pathToFileURL,        } = require 'node:url'
# { register,             } = require 'node:module'
# { stripTypeScriptTypes, } = require 'node:module'
# { isBuiltin,            } = require 'node:module'
# isBuiltin('node:fs'); // true
# isBuiltin('fs'); // true
# isBuiltin('wss'); // false

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
            whisper 'ΩLRS__11', "(#{disposition}) #{path} -> #{dependent_path}"
            if seen_paths.has dependent_path
              continue
            #   throw new Error "ΩLRS__12 detected cyclic dependency from #{rpr path} to #{rpr dependent_path}"
            seen_paths.add dependent_path
            collector.push { disposition, source_path: path, path: dependent_path, }
            _collect_transitive_require_statements dependent_path, collector, seen_paths
          # when 'outside'
          #   warn "ΩLRS__13 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
          when 'unresolved'
            warn "ΩLRS__14 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
      else
        warn "ΩLRS__15 ignoring require statement with type #{rpr type}"
  return collector

dependents = collect_transitive_require_statements source_path
info 'ΩLRS__16', rpr dependent.path for dependent in dependents


