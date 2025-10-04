'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_get_local_destinations: ->

    #===========================================================================================================
    OS                          = require 'node:os'
    FS                          = require 'node:fs'
    PATH                        = require 'node:path'
    { default: get_env_paths, } = require( 'env-paths')

    #===========================================================================================================
    get_local_destinations = ({ app_name = '', app_home = '', }={}) ->
      app_name            = '<YOUR-APP-NAME-HERE>' if ( not app_name? ) or ( app_name is '' )
      app_home           ?= ''
      app                 = get_env_paths app_name, { suffix: null, }
      user                = {}
      R                   = { app, user, }
      #.........................................................................................................
      user_nfo            = OS.userInfo()
      user.name           = user_nfo.username
      user.home           = FS.realpathSync OS.homedir()
      user.temp           = FS.realpathSync OS.tmpdir()
      #.........................................................................................................
      app.name            = app_name
      app.home            = PATH.resolve user.home, app_home, app_name
      app.node_modules    = PATH.resolve app.home,         'node_modules'
      app.dep_bin         = PATH.resolve app.node_modules, '.bin'
      app.own_bin         = PATH.resolve app.home,         'bin'
      #.........................................................................................................
      debug 'Ωkvr___1', R
      return R

    #.......................................................................................................
    return exports = { get_local_destinations, internals: { get_env_paths, }, }

#===========================================================================================================
Object.assign module.exports, BRICS




