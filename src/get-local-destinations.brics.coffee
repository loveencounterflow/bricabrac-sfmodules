'use strict'

#===========================================================================================================
{ debug, } = console

###

search.brave.com:

The directories ~/.local/share, ~/.config, ~/.cache, and ~/.local/state are defined by the XDG Base Directory Specification, a standard aimed at organizing user-specific data and configuration files in a predictable manner.
 This specification helps avoid the historical chaos of applications scattering files throughout the home directory.

~/.local/share is the default base directory for user-specific data files that are not configuration files.
 This includes application data such as game save files, local email copies, playlists, local calendars, and contacts.
 The specification notes that data stored here is intended to be either important or portable to the user.
 However, it is also used for non-portable, machine-specific state data that should persist between application restarts but isn't critical enough to be stored in the data directory.
 It can also contain locally installed fonts.
~/.config is the default base directory for user-specific configuration files.
 This is where applications store settings and preferences, such as those managed by gsettings on GNOME or kwriteconfig on KDE.
 The specification defines this directory as the location for user-specific configuration files, and it is the standard location for per-user configuration.
~/.cache is the default base directory for user-specific non-essential data files, such as cached files that can be regenerated or re-downloaded if lost.
 This directory is intended for temporary data that does not need to be preserved across system reboots or application restarts.
 The specification explicitly states that data in this directory can be safely removed without losing essential user information, as applications should be able to recover it.
~/.local/state is the default base directory for user-specific state data that should persist between application restarts but is not important or portable enough to be stored in ~/.local/share.
 This includes data like the list of recently used files, current file positions in editors, or other ephemeral state information that is not critical to user data.
 It is intended for data that is system-specific and not meant to be shared between different machines.
In summary, ~/.local/share holds user data, ~/.config holds user configuration, ~/.cache holds non-essential, easily-recoverable data, and ~/.local/state holds non-portable, persistent state data.

###

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
      # debug 'Ωgelode___1', R
      return R

    #.......................................................................................................
    return exports = { get_local_destinations, internals: { get_env_paths, }, }

#===========================================================================================================
Object.assign module.exports, BRICS




