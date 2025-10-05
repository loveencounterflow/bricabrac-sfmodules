(function() {
  'use strict';
  var BRICS, debug;

  //===========================================================================================================
  ({debug} = console);

  /*

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

  */
  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_get_local_destinations: function() {
      var FS, OS, PATH, exports, get_env_paths, get_local_destinations;
      //===========================================================================================================
      OS = require('node:os');
      FS = require('node:fs');
      PATH = require('node:path');
      ({
        default: get_env_paths
      } = require('env-paths'));
      //===========================================================================================================
      get_local_destinations = function({app_name = '', app_home = ''} = {}) {
        var R, app, user, user_nfo;
        if ((app_name == null) || (app_name === '')) {
          app_name = '<YOUR-APP-NAME-HERE>';
        }
        if (app_home == null) {
          app_home = '';
        }
        app = get_env_paths(app_name, {
          suffix: null
        });
        user = {};
        R = {app, user};
        //.........................................................................................................
        user_nfo = OS.userInfo();
        user.name = user_nfo.username;
        user.home = FS.realpathSync(OS.homedir());
        user.temp = FS.realpathSync(OS.tmpdir());
        //.........................................................................................................
        app.name = app_name;
        app.home = PATH.resolve(user.home, app_home, app_name);
        app.node_modules = PATH.resolve(app.home, 'node_modules');
        app.dep_bin = PATH.resolve(app.node_modules, '.bin');
        app.own_bin = PATH.resolve(app.home, 'bin');
        //.........................................................................................................
        // debug 'Ωgelode___1', R
        return R;
      };
      //.......................................................................................................
      return exports = {
        get_local_destinations,
        internals: {get_env_paths}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldC1sb2NhbC1kZXN0aW5hdGlvbnMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWlDQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsOEJBQUEsRUFBZ0MsUUFBQSxDQUFBLENBQUE7QUFFbEMsVUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLHNCQUFBOztNQUNJLEVBQUEsR0FBOEIsT0FBQSxDQUFRLFNBQVI7TUFDOUIsRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUE7UUFBRSxPQUFBLEVBQVM7TUFBWCxDQUFBLEdBQThCLE9BQUEsQ0FBUyxXQUFULENBQTlCLEVBSko7O01BT0ksc0JBQUEsR0FBeUIsUUFBQSxDQUFDLENBQUUsUUFBQSxHQUFXLEVBQWIsRUFBaUIsUUFBQSxHQUFXLEVBQTVCLElBQWtDLENBQUEsQ0FBbkMsQ0FBQTtBQUM3QixZQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO1FBQU0sSUFBZ0QsQ0FBTSxnQkFBTixDQUFBLElBQXFCLENBQUUsUUFBQSxLQUFZLEVBQWQsQ0FBckU7VUFBQSxRQUFBLEdBQXNCLHVCQUF0Qjs7O1VBQ0EsV0FBc0I7O1FBQ3RCLEdBQUEsR0FBc0IsYUFBQSxDQUFjLFFBQWQsRUFBd0I7VUFBRSxNQUFBLEVBQVE7UUFBVixDQUF4QjtRQUN0QixJQUFBLEdBQXNCLENBQUE7UUFDdEIsQ0FBQSxHQUFzQixDQUFFLEdBQUYsRUFBTyxJQUFQLEVBSjVCOztRQU1NLFFBQUEsR0FBc0IsRUFBRSxDQUFDLFFBQUgsQ0FBQTtRQUN0QixJQUFJLENBQUMsSUFBTCxHQUFzQixRQUFRLENBQUM7UUFDL0IsSUFBSSxDQUFDLElBQUwsR0FBc0IsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsRUFBRSxDQUFDLE9BQUgsQ0FBQSxDQUFoQjtRQUN0QixJQUFJLENBQUMsSUFBTCxHQUFzQixFQUFFLENBQUMsWUFBSCxDQUFnQixFQUFFLENBQUMsTUFBSCxDQUFBLENBQWhCLEVBVDVCOztRQVdNLEdBQUcsQ0FBQyxJQUFKLEdBQXNCO1FBQ3RCLEdBQUcsQ0FBQyxJQUFKLEdBQXNCLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCLEVBQXdCLFFBQXhCLEVBQWtDLFFBQWxDO1FBQ3RCLEdBQUcsQ0FBQyxZQUFKLEdBQXNCLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBRyxDQUFDLElBQWpCLEVBQStCLGNBQS9CO1FBQ3RCLEdBQUcsQ0FBQyxPQUFKLEdBQXNCLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBRyxDQUFDLFlBQWpCLEVBQStCLE1BQS9CO1FBQ3RCLEdBQUcsQ0FBQyxPQUFKLEdBQXNCLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBRyxDQUFDLElBQWpCLEVBQStCLEtBQS9CLEVBZjVCOzs7QUFrQk0sZUFBTztNQW5CZ0IsRUFQN0I7O0FBNkJJLGFBQU8sT0FBQSxHQUFVO1FBQUUsc0JBQUY7UUFBMEIsU0FBQSxFQUFXLENBQUUsYUFBRjtNQUFyQztJQS9CYTtFQUFoQyxFQXJDRjs7O0VBdUVBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBdkVBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuIyMjXG5cbnNlYXJjaC5icmF2ZS5jb206XG5cblRoZSBkaXJlY3RvcmllcyB+Ly5sb2NhbC9zaGFyZSwgfi8uY29uZmlnLCB+Ly5jYWNoZSwgYW5kIH4vLmxvY2FsL3N0YXRlIGFyZSBkZWZpbmVkIGJ5IHRoZSBYREcgQmFzZSBEaXJlY3RvcnkgU3BlY2lmaWNhdGlvbiwgYSBzdGFuZGFyZCBhaW1lZCBhdCBvcmdhbml6aW5nIHVzZXItc3BlY2lmaWMgZGF0YSBhbmQgY29uZmlndXJhdGlvbiBmaWxlcyBpbiBhIHByZWRpY3RhYmxlIG1hbm5lci5cbiBUaGlzIHNwZWNpZmljYXRpb24gaGVscHMgYXZvaWQgdGhlIGhpc3RvcmljYWwgY2hhb3Mgb2YgYXBwbGljYXRpb25zIHNjYXR0ZXJpbmcgZmlsZXMgdGhyb3VnaG91dCB0aGUgaG9tZSBkaXJlY3RvcnkuXG5cbn4vLmxvY2FsL3NoYXJlIGlzIHRoZSBkZWZhdWx0IGJhc2UgZGlyZWN0b3J5IGZvciB1c2VyLXNwZWNpZmljIGRhdGEgZmlsZXMgdGhhdCBhcmUgbm90IGNvbmZpZ3VyYXRpb24gZmlsZXMuXG4gVGhpcyBpbmNsdWRlcyBhcHBsaWNhdGlvbiBkYXRhIHN1Y2ggYXMgZ2FtZSBzYXZlIGZpbGVzLCBsb2NhbCBlbWFpbCBjb3BpZXMsIHBsYXlsaXN0cywgbG9jYWwgY2FsZW5kYXJzLCBhbmQgY29udGFjdHMuXG4gVGhlIHNwZWNpZmljYXRpb24gbm90ZXMgdGhhdCBkYXRhIHN0b3JlZCBoZXJlIGlzIGludGVuZGVkIHRvIGJlIGVpdGhlciBpbXBvcnRhbnQgb3IgcG9ydGFibGUgdG8gdGhlIHVzZXIuXG4gSG93ZXZlciwgaXQgaXMgYWxzbyB1c2VkIGZvciBub24tcG9ydGFibGUsIG1hY2hpbmUtc3BlY2lmaWMgc3RhdGUgZGF0YSB0aGF0IHNob3VsZCBwZXJzaXN0IGJldHdlZW4gYXBwbGljYXRpb24gcmVzdGFydHMgYnV0IGlzbid0IGNyaXRpY2FsIGVub3VnaCB0byBiZSBzdG9yZWQgaW4gdGhlIGRhdGEgZGlyZWN0b3J5LlxuIEl0IGNhbiBhbHNvIGNvbnRhaW4gbG9jYWxseSBpbnN0YWxsZWQgZm9udHMuXG5+Ly5jb25maWcgaXMgdGhlIGRlZmF1bHQgYmFzZSBkaXJlY3RvcnkgZm9yIHVzZXItc3BlY2lmaWMgY29uZmlndXJhdGlvbiBmaWxlcy5cbiBUaGlzIGlzIHdoZXJlIGFwcGxpY2F0aW9ucyBzdG9yZSBzZXR0aW5ncyBhbmQgcHJlZmVyZW5jZXMsIHN1Y2ggYXMgdGhvc2UgbWFuYWdlZCBieSBnc2V0dGluZ3Mgb24gR05PTUUgb3Iga3dyaXRlY29uZmlnIG9uIEtERS5cbiBUaGUgc3BlY2lmaWNhdGlvbiBkZWZpbmVzIHRoaXMgZGlyZWN0b3J5IGFzIHRoZSBsb2NhdGlvbiBmb3IgdXNlci1zcGVjaWZpYyBjb25maWd1cmF0aW9uIGZpbGVzLCBhbmQgaXQgaXMgdGhlIHN0YW5kYXJkIGxvY2F0aW9uIGZvciBwZXItdXNlciBjb25maWd1cmF0aW9uLlxufi8uY2FjaGUgaXMgdGhlIGRlZmF1bHQgYmFzZSBkaXJlY3RvcnkgZm9yIHVzZXItc3BlY2lmaWMgbm9uLWVzc2VudGlhbCBkYXRhIGZpbGVzLCBzdWNoIGFzIGNhY2hlZCBmaWxlcyB0aGF0IGNhbiBiZSByZWdlbmVyYXRlZCBvciByZS1kb3dubG9hZGVkIGlmIGxvc3QuXG4gVGhpcyBkaXJlY3RvcnkgaXMgaW50ZW5kZWQgZm9yIHRlbXBvcmFyeSBkYXRhIHRoYXQgZG9lcyBub3QgbmVlZCB0byBiZSBwcmVzZXJ2ZWQgYWNyb3NzIHN5c3RlbSByZWJvb3RzIG9yIGFwcGxpY2F0aW9uIHJlc3RhcnRzLlxuIFRoZSBzcGVjaWZpY2F0aW9uIGV4cGxpY2l0bHkgc3RhdGVzIHRoYXQgZGF0YSBpbiB0aGlzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IHJlbW92ZWQgd2l0aG91dCBsb3NpbmcgZXNzZW50aWFsIHVzZXIgaW5mb3JtYXRpb24sIGFzIGFwcGxpY2F0aW9ucyBzaG91bGQgYmUgYWJsZSB0byByZWNvdmVyIGl0Llxufi8ubG9jYWwvc3RhdGUgaXMgdGhlIGRlZmF1bHQgYmFzZSBkaXJlY3RvcnkgZm9yIHVzZXItc3BlY2lmaWMgc3RhdGUgZGF0YSB0aGF0IHNob3VsZCBwZXJzaXN0IGJldHdlZW4gYXBwbGljYXRpb24gcmVzdGFydHMgYnV0IGlzIG5vdCBpbXBvcnRhbnQgb3IgcG9ydGFibGUgZW5vdWdoIHRvIGJlIHN0b3JlZCBpbiB+Ly5sb2NhbC9zaGFyZS5cbiBUaGlzIGluY2x1ZGVzIGRhdGEgbGlrZSB0aGUgbGlzdCBvZiByZWNlbnRseSB1c2VkIGZpbGVzLCBjdXJyZW50IGZpbGUgcG9zaXRpb25zIGluIGVkaXRvcnMsIG9yIG90aGVyIGVwaGVtZXJhbCBzdGF0ZSBpbmZvcm1hdGlvbiB0aGF0IGlzIG5vdCBjcml0aWNhbCB0byB1c2VyIGRhdGEuXG4gSXQgaXMgaW50ZW5kZWQgZm9yIGRhdGEgdGhhdCBpcyBzeXN0ZW0tc3BlY2lmaWMgYW5kIG5vdCBtZWFudCB0byBiZSBzaGFyZWQgYmV0d2VlbiBkaWZmZXJlbnQgbWFjaGluZXMuXG5JbiBzdW1tYXJ5LCB+Ly5sb2NhbC9zaGFyZSBob2xkcyB1c2VyIGRhdGEsIH4vLmNvbmZpZyBob2xkcyB1c2VyIGNvbmZpZ3VyYXRpb24sIH4vLmNhY2hlIGhvbGRzIG5vbi1lc3NlbnRpYWwsIGVhc2lseS1yZWNvdmVyYWJsZSBkYXRhLCBhbmQgfi8ubG9jYWwvc3RhdGUgaG9sZHMgbm9uLXBvcnRhYmxlLCBwZXJzaXN0ZW50IHN0YXRlIGRhdGEuXG5cbiMjI1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9nZXRfbG9jYWxfZGVzdGluYXRpb25zOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgT1MgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpvcydcbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIFBBVEggICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICB7IGRlZmF1bHQ6IGdldF9lbnZfcGF0aHMsIH0gPSByZXF1aXJlKCAnZW52LXBhdGhzJylcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGdldF9sb2NhbF9kZXN0aW5hdGlvbnMgPSAoeyBhcHBfbmFtZSA9ICcnLCBhcHBfaG9tZSA9ICcnLCB9PXt9KSAtPlxuICAgICAgYXBwX25hbWUgICAgICAgICAgICA9ICc8WU9VUi1BUFAtTkFNRS1IRVJFPicgaWYgKCBub3QgYXBwX25hbWU/ICkgb3IgKCBhcHBfbmFtZSBpcyAnJyApXG4gICAgICBhcHBfaG9tZSAgICAgICAgICAgPz0gJydcbiAgICAgIGFwcCAgICAgICAgICAgICAgICAgPSBnZXRfZW52X3BhdGhzIGFwcF9uYW1lLCB7IHN1ZmZpeDogbnVsbCwgfVxuICAgICAgdXNlciAgICAgICAgICAgICAgICA9IHt9XG4gICAgICBSICAgICAgICAgICAgICAgICAgID0geyBhcHAsIHVzZXIsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHVzZXJfbmZvICAgICAgICAgICAgPSBPUy51c2VySW5mbygpXG4gICAgICB1c2VyLm5hbWUgICAgICAgICAgID0gdXNlcl9uZm8udXNlcm5hbWVcbiAgICAgIHVzZXIuaG9tZSAgICAgICAgICAgPSBGUy5yZWFscGF0aFN5bmMgT1MuaG9tZWRpcigpXG4gICAgICB1c2VyLnRlbXAgICAgICAgICAgID0gRlMucmVhbHBhdGhTeW5jIE9TLnRtcGRpcigpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBhcHAubmFtZSAgICAgICAgICAgID0gYXBwX25hbWVcbiAgICAgIGFwcC5ob21lICAgICAgICAgICAgPSBQQVRILnJlc29sdmUgdXNlci5ob21lLCBhcHBfaG9tZSwgYXBwX25hbWVcbiAgICAgIGFwcC5ub2RlX21vZHVsZXMgICAgPSBQQVRILnJlc29sdmUgYXBwLmhvbWUsICAgICAgICAgJ25vZGVfbW9kdWxlcydcbiAgICAgIGFwcC5kZXBfYmluICAgICAgICAgPSBQQVRILnJlc29sdmUgYXBwLm5vZGVfbW9kdWxlcywgJy5iaW4nXG4gICAgICBhcHAub3duX2JpbiAgICAgICAgID0gUEFUSC5yZXNvbHZlIGFwcC5ob21lLCAgICAgICAgICdiaW4nXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIGRlYnVnICfOqWdlbG9kZV9fXzEnLCBSXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgZ2V0X2xvY2FsX2Rlc3RpbmF0aW9ucywgaW50ZXJuYWxzOiB7IGdldF9lbnZfcGF0aHMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
