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
      var exports, get_env_paths, get_local_destinations;
      ({
        //===========================================================================================================
        default: get_env_paths
      } = require('env-paths'));
      //===========================================================================================================
      get_local_destinations = function(name, cfg) {
        return get_env_paths(name, {
          suffix: null,
          ...cfg
        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldC1sb2NhbC1kZXN0aW5hdGlvbnMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSw4QkFBQSxFQUFnQyxRQUFBLENBQUEsQ0FBQTtBQUVsQyxVQUFBLE9BQUEsRUFBQSxhQUFBLEVBQUE7TUFDSSxDQUFBLENBQUE7O1FBQUUsT0FBQSxFQUFTO01BQVgsQ0FBQSxHQUE4QixPQUFBLENBQVMsV0FBVCxDQUE5QixFQURKOztNQUlJLHNCQUFBLEdBQXlCLFFBQUEsQ0FBRSxJQUFGLEVBQVEsR0FBUixDQUFBO2VBQWlCLGFBQUEsQ0FBYyxJQUFkLEVBQW9CO1VBQUUsTUFBQSxFQUFRLElBQVY7VUFBZ0IsR0FBQTtRQUFoQixDQUFwQjtNQUFqQixFQUo3Qjs7QUFPSSxhQUFPLE9BQUEsR0FBVTtRQUFFLHNCQUFGO1FBQTBCLFNBQUEsRUFBVyxDQUFFLGFBQUY7TUFBckM7SUFUYTtFQUFoQyxFQWJGOzs7RUF5QkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUF6QkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2dldF9sb2NhbF9kZXN0aW5hdGlvbnM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB7IGRlZmF1bHQ6IGdldF9lbnZfcGF0aHMsIH0gPSByZXF1aXJlKCAnZW52LXBhdGhzJylcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGdldF9sb2NhbF9kZXN0aW5hdGlvbnMgPSAoIG5hbWUsIGNmZyApIC0+IGdldF9lbnZfcGF0aHMgbmFtZSwgeyBzdWZmaXg6IG51bGwsIGNmZy4uLiwgfVxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgZ2V0X2xvY2FsX2Rlc3RpbmF0aW9ucywgaW50ZXJuYWxzOiB7IGdldF9lbnZfcGF0aHMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
