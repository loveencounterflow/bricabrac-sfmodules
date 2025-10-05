

'use strict'
#===========================================================================================================
{ debug,                } = console
{ freeze,               } = Object
# { exports: here,        } = module
here = {}
#-----------------------------------------------------------------------------------------------------------
{ rpr_string,           } = ( require './rpr-string.brics' ).require_rpr_string()
PATH                      = require 'node:path'

#===========================================================================================================
here.internals = freeze {}
  # value: true

#===========================================================================================================
here.is_inside = ( anchor, probe ) ->
  ### Given an absolutely anchored path `anchor` (which must start with a slash but may contain arbitrary
  occurrences of `/./` and `/../` segments) and a `probe` path, return whether `anchor` is among the
  ancestors of `probe`, i.e. whether we can go from `anchor` to `probe` without getting closer to the `/`
  root than `anchor` itself. The result will solely judged on by looking at the paths, not at the actual
  file system (which is why `anchor` must be expressed with a leading slash) ###
  unless anchor.startsWith '/'
    throw new Error "Ωdeimst___1 expected an absolute path as anchor, got #{rpr_string anchor}"
  #.........................................................................................................
  abs_anchor  = PATH.resolve  anchor
  abs_probe   = PATH.resolve  abs_anchor, probe
  rel_path    = PATH.relative abs_anchor, abs_probe
  #.........................................................................................................
  switch true
    when rel_path is ''             then return true
    when rel_path is '..'           then return false
    when rel_path.startsWith '../'  then return false
    # when rel_pathis '.'           then return true ### never happens ###
    # when rel_path.startsWith './' then return true ### never happens ###
  return true

# #-----------------------------------------------------------------------------------------------------------
# here.is_inside = ( anchor, probe ) ->
#   ### Given two paths `anchor` and `probe`, returns whether anchor is among the ancestors of `probe`. ###
#   abs_anchor  = PATH.resolve anchor
#   abs_probe   = PATH.resolve probe

#===========================================================================================================
# Object.assign here, { demo_not_attached, }
module.exports.require_path_tools = -> here

