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
    require_dictionary_tools: function() {
      var expand, expand_dictionary, exports;
      //===========================================================================================================
      expand = function(strings, key, seen = new Set()) {
        var k, v, value;
        if (seen.has(key)) {
          throw new Error(`Ωdito___1 cyclic reference detected for ${key}`);
        }
        if (!Reflect.has(strings, key)) {
          throw new Error(`Ωdito___2 unknown key ${key}`);
        }
        seen.add(key);
        value = strings[key];
        for (k in strings) {
          v = strings[k];
          value = value.replaceAll(k, function() {
            return expand(strings, k, seen);
          });
        }
        return value;
      };
      //===========================================================================================================
      expand_dictionary = function(strings) {
        /* Expand all string values by recursively replacing keys with their mapped values */
        var R, key;
        R = {};
        for (key in strings) {
          R[key] = expand(strings, key);
        }
        return R;
      };
      //.......................................................................................................
      return exports = {
        expand_dictionary,
        internals: {expand}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RpY3Rpb25hcnktdG9vbHMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSx3QkFBQSxFQUEwQixRQUFBLENBQUEsQ0FBQTtBQUU1QixVQUFBLE1BQUEsRUFBQSxpQkFBQSxFQUFBLE9BQUE7O01BQ0ksTUFBQSxHQUFTLFFBQUEsQ0FBRSxPQUFGLEVBQVcsR0FBWCxFQUFnQixPQUFPLElBQUksR0FBSixDQUFBLENBQXZCLENBQUE7QUFDYixZQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7UUFBTSxJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBVCxDQUFIO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHdDQUFBLENBQUEsQ0FBMkMsR0FBM0MsQ0FBQSxDQUFWLEVBRFI7O1FBRUEsS0FBTyxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosRUFBcUIsR0FBckIsQ0FBUDtVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxzQkFBQSxDQUFBLENBQXlCLEdBQXpCLENBQUEsQ0FBVixFQURSOztRQUVBLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBVDtRQUNBLEtBQUEsR0FBUSxPQUFPLENBQUUsR0FBRjtRQUNmLEtBQUEsWUFBQTs7VUFDRSxLQUFBLEdBQVEsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsQ0FBakIsRUFBb0IsUUFBQSxDQUFBLENBQUE7bUJBQUcsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsQ0FBaEIsRUFBbUIsSUFBbkI7VUFBSCxDQUFwQjtRQURWO0FBRUEsZUFBTztNQVRBLEVBRGI7O01BY0ksaUJBQUEsR0FBb0IsUUFBQSxDQUFFLE9BQUYsQ0FBQSxFQUFBOztBQUN4QixZQUFBLENBQUEsRUFBQTtRQUNNLENBQUEsR0FBWSxDQUFBO1FBQ1osS0FBQSxjQUFBO1VBQUEsQ0FBQyxDQUFFLEdBQUYsQ0FBRCxHQUFZLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLEdBQWhCO1FBQVo7QUFDQSxlQUFPO01BSlcsRUFkeEI7O0FBcUJJLGFBQU8sT0FBQSxHQUFVO1FBQUUsaUJBQUY7UUFBcUIsU0FBQSxFQUFXLENBQUUsTUFBRjtNQUFoQztJQXZCTztFQUExQixFQWJGOzs7RUF1Q0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUF2Q0EiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RpY3Rpb25hcnlfdG9vbHM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBleHBhbmQgPSAoIHN0cmluZ3MsIGtleSwgc2VlbiA9IG5ldyBTZXQoKSApIC0+XG4gICAgICBpZiBzZWVuLmhhcyBrZXlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkaXRvX19fMSBjeWNsaWMgcmVmZXJlbmNlIGRldGVjdGVkIGZvciAje2tleX1cIlxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIHN0cmluZ3MsIGtleVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRpdG9fX18yIHVua25vd24ga2V5ICN7a2V5fVwiXG4gICAgICBzZWVuLmFkZCBrZXlcbiAgICAgIHZhbHVlID0gc3RyaW5nc1sga2V5IF1cbiAgICAgIGZvciBrLCB2IG9mIHN0cmluZ3NcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlQWxsIGssIC0+IGV4cGFuZCBzdHJpbmdzLCBrLCBzZWVuXG4gICAgICByZXR1cm4gdmFsdWVcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgZXhwYW5kX2RpY3Rpb25hcnkgPSAoIHN0cmluZ3MgKSAtPlxuICAgICAgIyMjIEV4cGFuZCBhbGwgc3RyaW5nIHZhbHVlcyBieSByZWN1cnNpdmVseSByZXBsYWNpbmcga2V5cyB3aXRoIHRoZWlyIG1hcHBlZCB2YWx1ZXMgIyMjXG4gICAgICBSICAgICAgICAgPSB7fVxuICAgICAgUlsga2V5IF0gID0gZXhwYW5kIHN0cmluZ3MsIGtleSBmb3Iga2V5IG9mIHN0cmluZ3NcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBleHBhbmRfZGljdGlvbmFyeSwgaW50ZXJuYWxzOiB7IGV4cGFuZCwgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
