(function() {
  'use strict';
  var UNSTABLE_CALLSITE_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_CALLSITE_BRICS = {
    
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_get_callsite: function() {
      var URL, UTIL, debug, exports, get_callsite, get_callsite_path, internals;
      //=========================================================================================================
      UTIL = require('node:util');
      URL = require('node:url');
      ({debug} = console);
      //---------------------------------------------------------------------------------------------------------
      internals = {};
      //---------------------------------------------------------------------------------------------------------
      get_callsite = function({delta = 1, sourcemapped = true} = {}) {
        var callsites, frame_count;
        frame_count = delta < 10 ? 10 : 200;
        callsites = UTIL.getCallSites(frame_count, {
          sourceMap: sourcemapped
        });
        return callsites[delta];
      };
      //---------------------------------------------------------------------------------------------------------
      get_callsite_path = function({delta = 1} = {}) {
        var R;
        R = (get_callsite({
          delta: delta + 1
        })).scriptName;
        if (R.startsWith('file://')) {
          R = URL.fileURLToPath(R);
        }
        return R;
      };
      //=========================================================================================================
      internals = Object.freeze(internals);
      return exports = {get_callsite, get_callsite_path, internals};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_get_app_details: function() {
      var CS, PATH, URL, UTIL, debug, exports, get_app_details, get_bricabrac_cfg, internals, misfit, require_from_app_folder;
      //=========================================================================================================
      PATH = require('node:path');
      UTIL = require('node:util');
      URL = require('node:url');
      ({debug} = console);
      misfit = Symbol('misfit');
      CS = UNSTABLE_CALLSITE_BRICS.require_get_callsite();
      //---------------------------------------------------------------------------------------------------------
      internals = {misfit};
      //---------------------------------------------------------------------------------------------------------
      get_app_details = function({delta = 1, path = null} = {}) {
        var error, name, package_json, package_path, version;
        // callsite = get_callsite { delta: delta + 1, }
        if (path == null) {
          path = PATH.dirname(CS.get_callsite_path({
            delta: delta + 1
          }));
        }
        while (true) {
          try {
            // break
            //.......................................................................................................
            package_path = PATH.join(path, 'package.json');
            package_json = require(package_path);
            break;
          } catch (error1) {
            error = error1;
            if (error.code !== 'MODULE_NOT_FOUND') {
              throw error;
            }
          }
          path = PATH.dirname(path);
        }
        //.......................................................................................................
        ({name, version} = package_json);
        return {name, version, path, package_path, package_json};
      };
      //---------------------------------------------------------------------------------------------------------
      require_from_app_folder = function({delta = 1, path} = {}) {
        var abspath, app;
        if ((typeof path) !== 'string') {
          throw new Error(`Ω___3 expected path to be a text, got ${path}`);
        }
        app = get_app_details({
          delta: delta + 1
        });
        abspath = PATH.resolve(PATH.join(app.path, path));
        return require(abspath);
      };
      //---------------------------------------------------------------------------------------------------------
      get_bricabrac_cfg = function({delta = 1, path = 'bricabrac.cfg.js', fallback = misfit} = {}) {
        var R, abspath, app, error;
        app = get_app_details({
          delta: delta + 1
        });
        abspath = PATH.resolve(PATH.join(app.path, path));
        try {
          R = require(abspath);
        } catch (error1) {
          error = error1;
          if (error.code !== 'MODULE_NOT_FOUND') {
            throw error;
          }
          if (fallback === misfit) {
            throw error;
          }
          return fallback;
        }
        R = {app, ...R};
        //.......................................................................................................
        /* TAINT use proper templates for default values */
        if (R.datastore != null) {
          R.datastore.filename = `${R.datastore.name}.sqlite`;
          R.datastore.path = PATH.resolve(PATH.join(app.path, R.datastore.filename));
        }
        //.......................................................................................................
        return R;
      };
      //=========================================================================================================
      internals = Object.freeze(internals);
      return exports = {get_app_details, require_from_app_folder, get_bricabrac_cfg, internals};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, UNSTABLE_CALLSITE_BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWNhbGxzaXRlLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSx1QkFBQTs7Ozs7RUFLQSx1QkFBQSxHQUtFLENBQUE7Ozs7SUFBQSxvQkFBQSxFQUFzQixRQUFBLENBQUEsQ0FBQTtBQUV4QixVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBOztNQUNJLElBQUEsR0FBYyxPQUFBLENBQVEsV0FBUjtNQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsVUFBUjtNQUNkLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEo7O01BTUksU0FBQSxHQUFZLENBQUEsRUFOaEI7O01BU0ksWUFBQSxHQUFlLFFBQUEsQ0FBQyxDQUFFLEtBQUEsR0FBUSxDQUFWLEVBQWEsWUFBQSxHQUFlLElBQTVCLElBQW9DLENBQUEsQ0FBckMsQ0FBQTtBQUNuQixZQUFBLFNBQUEsRUFBQTtRQUFNLFdBQUEsR0FBaUIsS0FBQSxHQUFRLEVBQVgsR0FBbUIsRUFBbkIsR0FBMkI7UUFDekMsU0FBQSxHQUFjLElBQUksQ0FBQyxZQUFMLENBQWtCLFdBQWxCLEVBQStCO1VBQUUsU0FBQSxFQUFXO1FBQWIsQ0FBL0I7QUFDZCxlQUFPLFNBQVMsQ0FBRSxLQUFGO01BSEgsRUFUbkI7O01BZUksaUJBQUEsR0FBb0IsUUFBQSxDQUFDLENBQUUsS0FBQSxHQUFRLENBQVYsSUFBYyxDQUFBLENBQWYsQ0FBQTtBQUN4QixZQUFBO1FBQU0sQ0FBQSxHQUFJLENBQUUsWUFBQSxDQUFhO1VBQUUsS0FBQSxFQUFPLEtBQUEsR0FBUTtRQUFqQixDQUFiLENBQUYsQ0FBc0MsQ0FBQztRQUMzQyxJQUEyQixDQUFDLENBQUMsVUFBRixDQUFhLFNBQWIsQ0FBM0I7VUFBQSxDQUFBLEdBQUksR0FBRyxDQUFDLGFBQUosQ0FBa0IsQ0FBbEIsRUFBSjs7QUFDQSxlQUFPO01BSFcsRUFmeEI7O01BcUJJLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLFNBQWQ7QUFDWixhQUFPLE9BQUEsR0FBVSxDQUNmLFlBRGUsRUFDRCxpQkFEQyxFQUNrQixTQURsQjtJQXhCRyxDQUF0Qjs7O0lBOEJBLHVCQUFBLEVBQXlCLFFBQUEsQ0FBQSxDQUFBO0FBRTNCLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSx1QkFBQTs7TUFDSSxJQUFBLEdBQWMsT0FBQSxDQUFRLFdBQVI7TUFDZCxJQUFBLEdBQWMsT0FBQSxDQUFRLFdBQVI7TUFDZCxHQUFBLEdBQWMsT0FBQSxDQUFRLFVBQVI7TUFDZCxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZDtNQUNBLE1BQUEsR0FBYyxNQUFBLENBQU8sUUFBUDtNQUNkLEVBQUEsR0FBYyx1QkFBdUIsQ0FBQyxvQkFBeEIsQ0FBQSxFQU5sQjs7TUFTSSxTQUFBLEdBQVksQ0FBRSxNQUFGLEVBVGhCOztNQVlJLGVBQUEsR0FBa0IsUUFBQSxDQUFDLENBQUUsS0FBQSxHQUFRLENBQVYsRUFBYSxJQUFBLEdBQU8sSUFBcEIsSUFBNEIsQ0FBQSxDQUE3QixDQUFBO0FBQ3RCLFlBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLE9BQUE7OztVQUNNLE9BQVEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxFQUFFLENBQUMsaUJBQUgsQ0FBcUI7WUFBRSxLQUFBLEVBQU8sS0FBQSxHQUFRO1VBQWpCLENBQXJCLENBQWI7O0FBRVIsZUFBQSxJQUFBO0FBRUU7OztZQUNFLFlBQUEsR0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFWLEVBQWdCLGNBQWhCO1lBQ2hCLFlBQUEsR0FBZ0IsT0FBQSxDQUFRLFlBQVI7QUFDaEIsa0JBSEY7V0FJQSxjQUFBO1lBQU07WUFDSixJQUFtQixLQUFLLENBQUMsSUFBTixLQUFjLGtCQUFqQztjQUFBLE1BQU0sTUFBTjthQURGOztVQUVBLElBQUEsR0FBTyxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWI7UUFSVCxDQUhOOztRQWFNLENBQUEsQ0FBRSxJQUFGLEVBQ0UsT0FERixDQUFBLEdBQ2dCLFlBRGhCO0FBRUEsZUFBTyxDQUFFLElBQUYsRUFBUSxPQUFSLEVBQWlCLElBQWpCLEVBQXVCLFlBQXZCLEVBQXFDLFlBQXJDO01BaEJTLEVBWnRCOztNQStCSSx1QkFBQSxHQUEwQixRQUFBLENBQUMsQ0FBRSxLQUFBLEdBQVEsQ0FBVixFQUFhLElBQWIsSUFBcUIsQ0FBQSxDQUF0QixDQUFBO0FBQzlCLFlBQUEsT0FBQSxFQUFBO1FBQU0sSUFBTyxDQUFFLE9BQU8sSUFBVCxDQUFBLEtBQW1CLFFBQTFCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHNDQUFBLENBQUEsQ0FBeUMsSUFBekMsQ0FBQSxDQUFWLEVBRFI7O1FBRUEsR0FBQSxHQUFVLGVBQUEsQ0FBZ0I7VUFBRSxLQUFBLEVBQU8sS0FBQSxHQUFRO1FBQWpCLENBQWhCO1FBQ1YsT0FBQSxHQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxHQUFHLENBQUMsSUFBZCxFQUFvQixJQUFwQixDQUFiO0FBQ1YsZUFBTyxPQUFBLENBQVEsT0FBUjtNQUxpQixFQS9COUI7O01BdUNJLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQyxDQUFFLEtBQUEsR0FBUSxDQUFWLEVBQWEsSUFBQSxHQUFPLGtCQUFwQixFQUF3QyxRQUFBLEdBQVcsTUFBbkQsSUFBNkQsQ0FBQSxDQUE5RCxDQUFBO0FBQ3hCLFlBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7UUFBTSxHQUFBLEdBQVUsZUFBQSxDQUFnQjtVQUFFLEtBQUEsRUFBTyxLQUFBLEdBQVE7UUFBakIsQ0FBaEI7UUFDVixPQUFBLEdBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQUcsQ0FBQyxJQUFkLEVBQW9CLElBQXBCLENBQWI7QUFDVjtVQUNFLENBQUEsR0FBSSxPQUFBLENBQVEsT0FBUixFQUROO1NBRUEsY0FBQTtVQUFNO1VBQ0osSUFBbUIsS0FBSyxDQUFDLElBQU4sS0FBYyxrQkFBakM7WUFBQSxNQUFNLE1BQU47O1VBQ0EsSUFBZSxRQUFBLEtBQVksTUFBM0I7WUFBQSxNQUFNLE1BQU47O0FBQ0EsaUJBQU8sU0FIVDs7UUFJQSxDQUFBLEdBQUksQ0FBRSxHQUFGLEVBQU8sR0FBQSxDQUFQLEVBUlY7OztRQVdNLElBQUcsbUJBQUg7VUFDRSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVosR0FBd0IsQ0FBQSxDQUFBLENBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQUEsT0FBQTtVQUN4QixDQUFDLENBQUMsU0FBUyxDQUFDLElBQVosR0FBd0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQUcsQ0FBQyxJQUFkLEVBQW9CLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBaEMsQ0FBYixFQUYxQjtTQVhOOztBQWVNLGVBQU87TUFoQlcsRUF2Q3hCOztNQTBESSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxTQUFkO0FBQ1osYUFBTyxPQUFBLEdBQVUsQ0FDZixlQURlLEVBQ0UsdUJBREYsRUFDMkIsaUJBRDNCLEVBQzhDLFNBRDlDO0lBN0RNO0VBOUJ6QixFQVZGOzs7RUEwR0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsdUJBQTlCO0FBMUdBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5VTlNUQUJMRV9DQUxMU0lURV9CUklDUyA9XG4gIFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2dldF9jYWxsc2l0ZTogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBVVElMICAgICAgICA9IHJlcXVpcmUgJ25vZGU6dXRpbCdcbiAgICBVUkwgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6dXJsJ1xuICAgIHsgZGVidWcsICB9ID0gY29uc29sZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGludGVybmFscyA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2NhbGxzaXRlID0gKHsgZGVsdGEgPSAxLCBzb3VyY2VtYXBwZWQgPSB0cnVlLCB9PXt9KSAtPlxuICAgICAgZnJhbWVfY291bnQgPSBpZiBkZWx0YSA8IDEwIHRoZW4gMTAgZWxzZSAyMDBcbiAgICAgIGNhbGxzaXRlcyAgID0gVVRJTC5nZXRDYWxsU2l0ZXMgZnJhbWVfY291bnQsIHsgc291cmNlTWFwOiBzb3VyY2VtYXBwZWQsIH1cbiAgICAgIHJldHVybiBjYWxsc2l0ZXNbIGRlbHRhIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfY2FsbHNpdGVfcGF0aCA9ICh7IGRlbHRhID0gMSB9PXt9KSAtPlxuICAgICAgUiA9ICggZ2V0X2NhbGxzaXRlIHsgZGVsdGE6IGRlbHRhICsgMSwgfSApLnNjcmlwdE5hbWVcbiAgICAgIFIgPSBVUkwuZmlsZVVSTFRvUGF0aCBSIGlmIFIuc3RhcnRzV2l0aCAnZmlsZTovLydcbiAgICAgIHJldHVybiBSXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSBpbnRlcm5hbHNcbiAgICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICAgIGdldF9jYWxsc2l0ZSwgZ2V0X2NhbGxzaXRlX3BhdGgsIGludGVybmFscywgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZ2V0X2FwcF9kZXRhaWxzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFBBVEggICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xuICAgIFVUSUwgICAgICAgID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuICAgIFVSTCAgICAgICAgID0gcmVxdWlyZSAnbm9kZTp1cmwnXG4gICAgeyBkZWJ1ZywgIH0gPSBjb25zb2xlXG4gICAgbWlzZml0ICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgICBDUyAgICAgICAgICA9IFVOU1RBQkxFX0NBTExTSVRFX0JSSUNTLnJlcXVpcmVfZ2V0X2NhbGxzaXRlKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbnRlcm5hbHMgPSB7IG1pc2ZpdCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9hcHBfZGV0YWlscyA9ICh7IGRlbHRhID0gMSwgcGF0aCA9IG51bGwsIH09e30pIC0+XG4gICAgICAjIGNhbGxzaXRlID0gZ2V0X2NhbGxzaXRlIHsgZGVsdGE6IGRlbHRhICsgMSwgfVxuICAgICAgcGF0aCA/PSBQQVRILmRpcm5hbWUgQ1MuZ2V0X2NhbGxzaXRlX3BhdGggeyBkZWx0YTogZGVsdGEgKyAxLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbG9vcFxuICAgICAgICAjIGJyZWFrXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VfcGF0aCAgPSBQQVRILmpvaW4gcGF0aCwgJ3BhY2thZ2UuanNvbidcbiAgICAgICAgICBwYWNrYWdlX2pzb24gID0gcmVxdWlyZSBwYWNrYWdlX3BhdGhcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgIHRocm93IGVycm9yIHVubGVzcyBlcnJvci5jb2RlIGlzICdNT0RVTEVfTk9UX0ZPVU5EJ1xuICAgICAgICBwYXRoID0gUEFUSC5kaXJuYW1lIHBhdGhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IG5hbWUsXG4gICAgICAgIHZlcnNpb24sICB9ID0gcGFja2FnZV9qc29uXG4gICAgICByZXR1cm4geyBuYW1lLCB2ZXJzaW9uLCBwYXRoLCBwYWNrYWdlX3BhdGgsIHBhY2thZ2VfanNvbiwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlcXVpcmVfZnJvbV9hcHBfZm9sZGVyID0gKHsgZGVsdGEgPSAxLCBwYXRoLCB9PXt9KSAtPlxuICAgICAgdW5sZXNzICggdHlwZW9mIHBhdGggKSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqV9fXzMgZXhwZWN0ZWQgcGF0aCB0byBiZSBhIHRleHQsIGdvdCAje3BhdGh9XCJcbiAgICAgIGFwcCAgICAgPSBnZXRfYXBwX2RldGFpbHMgeyBkZWx0YTogZGVsdGEgKyAxLCB9XG4gICAgICBhYnNwYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBhcHAucGF0aCwgcGF0aFxuICAgICAgcmV0dXJuIHJlcXVpcmUgYWJzcGF0aFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9icmljYWJyYWNfY2ZnID0gKHsgZGVsdGEgPSAxLCBwYXRoID0gJ2JyaWNhYnJhYy5jZmcuanMnLCBmYWxsYmFjayA9IG1pc2ZpdCwgfT17fSkgLT5cbiAgICAgIGFwcCAgICAgPSBnZXRfYXBwX2RldGFpbHMgeyBkZWx0YTogZGVsdGEgKyAxLCB9XG4gICAgICBhYnNwYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBhcHAucGF0aCwgcGF0aFxuICAgICAgdHJ5XG4gICAgICAgIFIgPSByZXF1aXJlIGFic3BhdGhcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHRocm93IGVycm9yIHVubGVzcyBlcnJvci5jb2RlIGlzICdNT0RVTEVfTk9UX0ZPVU5EJ1xuICAgICAgICB0aHJvdyBlcnJvciBpZiBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrXG4gICAgICBSID0geyBhcHAsIFIuLi4sIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB0ZW1wbGF0ZXMgZm9yIGRlZmF1bHQgdmFsdWVzICMjI1xuICAgICAgaWYgUi5kYXRhc3RvcmU/XG4gICAgICAgIFIuZGF0YXN0b3JlLmZpbGVuYW1lICA9IFwiI3tSLmRhdGFzdG9yZS5uYW1lfS5zcWxpdGVcIlxuICAgICAgICBSLmRhdGFzdG9yZS5wYXRoICAgICAgPSBQQVRILnJlc29sdmUgUEFUSC5qb2luIGFwcC5wYXRoLCBSLmRhdGFzdG9yZS5maWxlbmFtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBSXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSBpbnRlcm5hbHNcbiAgICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICAgIGdldF9hcHBfZGV0YWlscywgcmVxdWlyZV9mcm9tX2FwcF9mb2xkZXIsIGdldF9icmljYWJyYWNfY2ZnLCBpbnRlcm5hbHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFVOU1RBQkxFX0NBTExTSVRFX0JSSUNTXG5cbiJdfQ==
