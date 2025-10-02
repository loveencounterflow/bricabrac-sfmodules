(function() {
  'use strict';
  var BRICS, debug, demo;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_expand_recursive_keys: function() {
      var expand, expand_recursive_keys, exports;
      //===========================================================================================================
      expand = function(strings, key, seen = new Set()) {
        var k, v, value;
        if (seen.has(key)) {
          throw new Error(`Ωkvr___1 cyclic reference detected for ${key}`);
        }
        if (!Reflect.has(strings, key)) {
          throw new Error(`Ωkvr___1 unknown key ${key}`);
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
      expand_recursive_keys = function(strings) {
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
        expand_recursive_keys,
        internals: {expand}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

  //===========================================================================================================
  demo = function() {
    var strings, strings_error;
    strings = {
      '${greet}': "Hello ${who}",
      '${who}': "dear ${target}",
      '${target}': "world"
    };
    strings_error = {
      '${greet}': "Hello ${who}",
      '${who}': "dear ${target}",
      '${target}': "world ${greet}"
    };
    (() => {
      var expanded;
      expanded = expand_recursive_keys(strings);
      info('Ωkvr___2', strings);
      help('Ωkvr___3', expanded);
      help('Ωkvr___4', expanded === strings);
      return null;
    })();
    // =>
    // { greet: "Hello dear world"
    //   who:   "dear world"
    //   target:"world" }
    ((strings) => {
      var error, expanded;
      error = null;
      try {
        expanded = expand_recursive_keys(strings);
      } catch (error1) {
        error = error1;
        warn('Ωkvr___6', error.message);
      }
      if (error == null) {
        warn('Ωkvr___7', "expected error, none was thrown");
      }
      info('Ωkvr___8', strings);
      help('Ωkvr___9', expanded);
      return null;
    })(strings_error);
    return null;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2V4cGFuZC1yZWN1cnNpdmUta2V5cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxJQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSw2QkFBQSxFQUErQixRQUFBLENBQUEsQ0FBQTtBQUVqQyxVQUFBLE1BQUEsRUFBQSxxQkFBQSxFQUFBLE9BQUE7O01BQ0ksTUFBQSxHQUFTLFFBQUEsQ0FBRSxPQUFGLEVBQVcsR0FBWCxFQUFnQixPQUFPLElBQUksR0FBSixDQUFBLENBQXZCLENBQUE7QUFDYixZQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7UUFBTSxJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBVCxDQUFIO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHVDQUFBLENBQUEsQ0FBMEMsR0FBMUMsQ0FBQSxDQUFWLEVBRFI7O1FBRUEsS0FBTyxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosRUFBcUIsR0FBckIsQ0FBUDtVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxxQkFBQSxDQUFBLENBQXdCLEdBQXhCLENBQUEsQ0FBVixFQURSOztRQUVBLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBVDtRQUNBLEtBQUEsR0FBUSxPQUFPLENBQUUsR0FBRjtRQUNmLEtBQUEsWUFBQTs7VUFDRSxLQUFBLEdBQVEsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsQ0FBakIsRUFBb0IsUUFBQSxDQUFBLENBQUE7bUJBQUcsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsQ0FBaEIsRUFBbUIsSUFBbkI7VUFBSCxDQUFwQjtRQURWO0FBRUEsZUFBTztNQVRBLEVBRGI7O01BY0kscUJBQUEsR0FBd0IsUUFBQSxDQUFFLE9BQUYsQ0FBQSxFQUFBOztBQUM1QixZQUFBLENBQUEsRUFBQTtRQUNNLENBQUEsR0FBWSxDQUFBO1FBQ1osS0FBQSxjQUFBO1VBQUEsQ0FBQyxDQUFFLEdBQUYsQ0FBRCxHQUFZLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLEdBQWhCO1FBQVo7QUFDQSxlQUFPO01BSmUsRUFkNUI7O0FBcUJJLGFBQU8sT0FBQSxHQUFVO1FBQUUscUJBQUY7UUFBeUIsU0FBQSxFQUFXLENBQUUsTUFBRjtNQUFwQztJQXZCWTtFQUEvQixFQWJGOzs7RUF1Q0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUIsRUF2Q0E7OztFQTBDQSxJQUFBLEdBQU8sUUFBQSxDQUFBLENBQUE7QUFDUCxRQUFBLE9BQUEsRUFBQTtJQUFFLE9BQUEsR0FDRTtNQUFBLFVBQUEsRUFBYyxjQUFkO01BQ0EsUUFBQSxFQUFjLGdCQURkO01BRUEsV0FBQSxFQUFjO0lBRmQ7SUFHRixhQUFBLEdBQ0U7TUFBQSxVQUFBLEVBQWMsY0FBZDtNQUNBLFFBQUEsRUFBYyxnQkFEZDtNQUVBLFdBQUEsRUFBYztJQUZkO0lBR0MsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNMLFVBQUE7TUFBSSxRQUFBLEdBQVcscUJBQUEsQ0FBc0IsT0FBdEI7TUFDWCxJQUFBLENBQUssVUFBTCxFQUFpQixPQUFqQjtNQUNBLElBQUEsQ0FBSyxVQUFMLEVBQWlCLFFBQWpCO01BQ0EsSUFBQSxDQUFLLFVBQUwsRUFBaUIsUUFBQSxLQUFZLE9BQTdCO0FBQ0EsYUFBTztJQUxOLENBQUEsSUFSTDs7Ozs7SUFrQkssQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFBO0FBQ0wsVUFBQSxLQUFBLEVBQUE7TUFBSSxLQUFBLEdBQVE7QUFDUjtRQUFJLFFBQUEsR0FBVyxxQkFBQSxDQUFzQixPQUF0QixFQUFmO09BQ0EsY0FBQTtRQUFNO1FBQVcsSUFBQSxDQUFLLFVBQUwsRUFBaUIsS0FBSyxDQUFDLE9BQXZCLEVBQWpCOztNQUNBLElBQTBELGFBQTFEO1FBQUEsSUFBQSxDQUFLLFVBQUwsRUFBaUIsaUNBQWpCLEVBQUE7O01BQ0EsSUFBQSxDQUFLLFVBQUwsRUFBaUIsT0FBakI7TUFDQSxJQUFBLENBQUssVUFBTCxFQUFpQixRQUFqQjtBQUNBLGFBQU87SUFQTixDQUFBLEVBQVk7QUFRZixXQUFPO0VBM0JGO0FBMUNQIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9leHBhbmRfcmVjdXJzaXZlX2tleXM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBleHBhbmQgPSAoIHN0cmluZ3MsIGtleSwgc2VlbiA9IG5ldyBTZXQoKSApIC0+XG4gICAgICBpZiBzZWVuLmhhcyBrZXlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlrdnJfX18xIGN5Y2xpYyByZWZlcmVuY2UgZGV0ZWN0ZWQgZm9yICN7a2V5fVwiXG4gICAgICB1bmxlc3MgUmVmbGVjdC5oYXMgc3RyaW5ncywga2V5XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pa3ZyX19fMSB1bmtub3duIGtleSAje2tleX1cIlxuICAgICAgc2Vlbi5hZGQga2V5XG4gICAgICB2YWx1ZSA9IHN0cmluZ3NbIGtleSBdXG4gICAgICBmb3IgaywgdiBvZiBzdHJpbmdzXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZUFsbCBrLCAtPiBleHBhbmQgc3RyaW5ncywgaywgc2VlblxuICAgICAgcmV0dXJuIHZhbHVlXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGV4cGFuZF9yZWN1cnNpdmVfa2V5cyA9ICggc3RyaW5ncyApIC0+XG4gICAgICAjIyMgRXhwYW5kIGFsbCBzdHJpbmcgdmFsdWVzIGJ5IHJlY3Vyc2l2ZWx5IHJlcGxhY2luZyBrZXlzIHdpdGggdGhlaXIgbWFwcGVkIHZhbHVlcyAjIyNcbiAgICAgIFIgICAgICAgICA9IHt9XG4gICAgICBSWyBrZXkgXSAgPSBleHBhbmQgc3RyaW5ncywga2V5IGZvciBrZXkgb2Ygc3RyaW5nc1xuICAgICAgcmV0dXJuIFJcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IGV4cGFuZF9yZWN1cnNpdmVfa2V5cywgaW50ZXJuYWxzOiB7IGV4cGFuZCwgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGVtbyA9IC0+XG4gIHN0cmluZ3MgPVxuICAgICcke2dyZWV0fSc6ICAgXCJIZWxsbyAke3dob31cIlxuICAgICcke3dob30nOiAgICAgXCJkZWFyICR7dGFyZ2V0fVwiXG4gICAgJyR7dGFyZ2V0fSc6ICBcIndvcmxkXCJcbiAgc3RyaW5nc19lcnJvciA9XG4gICAgJyR7Z3JlZXR9JzogICBcIkhlbGxvICR7d2hvfVwiXG4gICAgJyR7d2hvfSc6ICAgICBcImRlYXIgJHt0YXJnZXR9XCJcbiAgICAnJHt0YXJnZXR9JzogIFwid29ybGQgJHtncmVldH1cIlxuICBkbyA9PlxuICAgIGV4cGFuZGVkID0gZXhwYW5kX3JlY3Vyc2l2ZV9rZXlzIHN0cmluZ3NcbiAgICBpbmZvICfOqWt2cl9fXzInLCBzdHJpbmdzXG4gICAgaGVscCAnzqlrdnJfX18zJywgZXhwYW5kZWRcbiAgICBoZWxwICfOqWt2cl9fXzQnLCBleHBhbmRlZCBpcyBzdHJpbmdzXG4gICAgcmV0dXJuIG51bGxcbiAgIyA9PlxuICAjIHsgZ3JlZXQ6IFwiSGVsbG8gZGVhciB3b3JsZFwiXG4gICMgICB3aG86ICAgXCJkZWFyIHdvcmxkXCJcbiAgIyAgIHRhcmdldDpcIndvcmxkXCIgfVxuICBkbyAoIHN0cmluZ3MgPSBzdHJpbmdzX2Vycm9yICkgPT5cbiAgICBlcnJvciA9IG51bGxcbiAgICB0cnkgZXhwYW5kZWQgPSBleHBhbmRfcmVjdXJzaXZlX2tleXMgc3RyaW5nc1xuICAgIGNhdGNoIGVycm9yIHRoZW4gd2FybiAnzqlrdnJfX182JywgZXJyb3IubWVzc2FnZVxuICAgIHdhcm4gJ86pa3ZyX19fNycsIFwiZXhwZWN0ZWQgZXJyb3IsIG5vbmUgd2FzIHRocm93blwiIHVubGVzcyBlcnJvcj9cbiAgICBpbmZvICfOqWt2cl9fXzgnLCBzdHJpbmdzXG4gICAgaGVscCAnzqlrdnJfX185JywgZXhwYW5kZWRcbiAgICByZXR1cm4gbnVsbFxuICByZXR1cm4gbnVsbFxuIl19
