(function() {
  'use strict';
  var BRICS, debug;

  //===========================================================================================================
  ({debug} = console);

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
        if (app_name == null) {
          app_name = '';
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
        app.home = PATH.join(user.home, app_home, app_name);
        app.node_modules = PATH.join(app.home, 'node_modules');
        app.dep_bin = PATH.join(app.node_modules, '.bin');
        app.own_bin = PATH.join(app.home, 'bin');
        //.........................................................................................................
        debug('Ωkvr___1', R);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldC1sb2NhbC1kZXN0aW5hdGlvbnMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSw4QkFBQSxFQUFnQyxRQUFBLENBQUEsQ0FBQTtBQUVsQyxVQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxhQUFBLEVBQUEsc0JBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixFQUFBLEdBQThCLE9BQUEsQ0FBUSxTQUFSO01BQzlCLElBQUEsR0FBOEIsT0FBQSxDQUFRLFdBQVI7TUFDOUIsQ0FBQTtRQUFFLE9BQUEsRUFBUztNQUFYLENBQUEsR0FBOEIsT0FBQSxDQUFTLFdBQVQsQ0FBOUIsRUFKSjs7TUFPSSxzQkFBQSxHQUF5QixRQUFBLENBQUMsQ0FBRSxRQUFBLEdBQVcsRUFBYixFQUFpQixRQUFBLEdBQVcsRUFBNUIsSUFBa0MsQ0FBQSxDQUFuQyxDQUFBO0FBQzdCLFlBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7O1VBQU0sV0FBc0I7OztVQUN0QixXQUFzQjs7UUFDdEIsR0FBQSxHQUFzQixhQUFBLENBQWMsUUFBZCxFQUF3QjtVQUFFLE1BQUEsRUFBUTtRQUFWLENBQXhCO1FBQ3RCLElBQUEsR0FBc0IsQ0FBQTtRQUN0QixDQUFBLEdBQXNCLENBQUUsR0FBRixFQUFPLElBQVAsRUFKNUI7O1FBTU0sUUFBQSxHQUFzQixFQUFFLENBQUMsUUFBSCxDQUFBO1FBQ3RCLElBQUksQ0FBQyxJQUFMLEdBQXNCLFFBQVEsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBTCxHQUFzQixFQUFFLENBQUMsWUFBSCxDQUFnQixFQUFFLENBQUMsT0FBSCxDQUFBLENBQWhCO1FBQ3RCLElBQUksQ0FBQyxJQUFMLEdBQXNCLEVBQUUsQ0FBQyxZQUFILENBQWdCLEVBQUUsQ0FBQyxNQUFILENBQUEsQ0FBaEIsRUFUNUI7O1FBV00sR0FBRyxDQUFDLElBQUosR0FBc0I7UUFDdEIsR0FBRyxDQUFDLElBQUosR0FBc0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsSUFBZixFQUFxQixRQUFyQixFQUErQixRQUEvQjtRQUN0QixHQUFHLENBQUMsWUFBSixHQUFzQixJQUFJLENBQUMsSUFBTCxDQUFVLEdBQUcsQ0FBQyxJQUFkLEVBQTRCLGNBQTVCO1FBQ3RCLEdBQUcsQ0FBQyxPQUFKLEdBQXNCLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBRyxDQUFDLFlBQWQsRUFBNEIsTUFBNUI7UUFDdEIsR0FBRyxDQUFDLE9BQUosR0FBc0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxHQUFHLENBQUMsSUFBZCxFQUE0QixLQUE1QixFQWY1Qjs7UUFpQk0sS0FBQSxDQUFNLFVBQU4sRUFBa0IsQ0FBbEI7QUFDQSxlQUFPO01BbkJnQixFQVA3Qjs7QUE2QkksYUFBTyxPQUFBLEdBQVU7UUFBRSxzQkFBRjtRQUEwQixTQUFBLEVBQVcsQ0FBRSxhQUFGO01BQXJDO0lBL0JhO0VBQWhDLEVBYkY7OztFQStDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQS9DQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZ2V0X2xvY2FsX2Rlc3RpbmF0aW9uczogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIE9TICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6b3MnXG4gICAgRlMgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiAgICBQQVRIICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG4gICAgeyBkZWZhdWx0OiBnZXRfZW52X3BhdGhzLCB9ID0gcmVxdWlyZSggJ2Vudi1wYXRocycpXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBnZXRfbG9jYWxfZGVzdGluYXRpb25zID0gKHsgYXBwX25hbWUgPSAnJywgYXBwX2hvbWUgPSAnJywgfT17fSkgLT5cbiAgICAgIGFwcF9uYW1lICAgICAgICAgICA/PSAnJ1xuICAgICAgYXBwX2hvbWUgICAgICAgICAgID89ICcnXG4gICAgICBhcHAgICAgICAgICAgICAgICAgID0gZ2V0X2Vudl9wYXRocyBhcHBfbmFtZSwgeyBzdWZmaXg6IG51bGwsIH1cbiAgICAgIHVzZXIgICAgICAgICAgICAgICAgPSB7fVxuICAgICAgUiAgICAgICAgICAgICAgICAgICA9IHsgYXBwLCB1c2VyLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB1c2VyX25mbyAgICAgICAgICAgID0gT1MudXNlckluZm8oKVxuICAgICAgdXNlci5uYW1lICAgICAgICAgICA9IHVzZXJfbmZvLnVzZXJuYW1lXG4gICAgICB1c2VyLmhvbWUgICAgICAgICAgID0gRlMucmVhbHBhdGhTeW5jIE9TLmhvbWVkaXIoKVxuICAgICAgdXNlci50ZW1wICAgICAgICAgICA9IEZTLnJlYWxwYXRoU3luYyBPUy50bXBkaXIoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgYXBwLm5hbWUgICAgICAgICAgICA9IGFwcF9uYW1lXG4gICAgICBhcHAuaG9tZSAgICAgICAgICAgID0gUEFUSC5qb2luIHVzZXIuaG9tZSwgYXBwX2hvbWUsIGFwcF9uYW1lXG4gICAgICBhcHAubm9kZV9tb2R1bGVzICAgID0gUEFUSC5qb2luIGFwcC5ob21lLCAgICAgICAgICdub2RlX21vZHVsZXMnXG4gICAgICBhcHAuZGVwX2JpbiAgICAgICAgID0gUEFUSC5qb2luIGFwcC5ub2RlX21vZHVsZXMsICcuYmluJ1xuICAgICAgYXBwLm93bl9iaW4gICAgICAgICA9IFBBVEguam9pbiBhcHAuaG9tZSwgICAgICAgICAnYmluJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZGVidWcgJ86pa3ZyX19fMScsIFJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBnZXRfbG9jYWxfZGVzdGluYXRpb25zLCBpbnRlcm5hbHM6IHsgZ2V0X2Vudl9wYXRocywgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cblxuXG5cbiJdfQ==
