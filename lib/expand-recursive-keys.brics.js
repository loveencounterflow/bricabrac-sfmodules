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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2V4cGFuZC1yZWN1cnNpdmUta2V5cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLDZCQUFBLEVBQStCLFFBQUEsQ0FBQSxDQUFBO0FBRWpDLFVBQUEsTUFBQSxFQUFBLHFCQUFBLEVBQUEsT0FBQTs7TUFDSSxNQUFBLEdBQVMsUUFBQSxDQUFFLE9BQUYsRUFBVyxHQUFYLEVBQWdCLE9BQU8sSUFBSSxHQUFKLENBQUEsQ0FBdkIsQ0FBQTtBQUNiLFlBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQTtRQUFNLElBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFULENBQUg7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsdUNBQUEsQ0FBQSxDQUEwQyxHQUExQyxDQUFBLENBQVYsRUFEUjs7UUFFQSxLQUFPLE9BQU8sQ0FBQyxHQUFSLENBQVksT0FBWixFQUFxQixHQUFyQixDQUFQO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHFCQUFBLENBQUEsQ0FBd0IsR0FBeEIsQ0FBQSxDQUFWLEVBRFI7O1FBRUEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFUO1FBQ0EsS0FBQSxHQUFRLE9BQU8sQ0FBRSxHQUFGO1FBQ2YsS0FBQSxZQUFBOztVQUNFLEtBQUEsR0FBUSxLQUFLLENBQUMsVUFBTixDQUFpQixDQUFqQixFQUFvQixRQUFBLENBQUEsQ0FBQTttQkFBRyxNQUFBLENBQU8sT0FBUCxFQUFnQixDQUFoQixFQUFtQixJQUFuQjtVQUFILENBQXBCO1FBRFY7QUFFQSxlQUFPO01BVEEsRUFEYjs7TUFjSSxxQkFBQSxHQUF3QixRQUFBLENBQUUsT0FBRixDQUFBLEVBQUE7O0FBQzVCLFlBQUEsQ0FBQSxFQUFBO1FBQ00sQ0FBQSxHQUFZLENBQUE7UUFDWixLQUFBLGNBQUE7VUFBQSxDQUFDLENBQUUsR0FBRixDQUFELEdBQVksTUFBQSxDQUFPLE9BQVAsRUFBZ0IsR0FBaEI7UUFBWjtBQUNBLGVBQU87TUFKZSxFQWQ1Qjs7QUFxQkksYUFBTyxPQUFBLEdBQVU7UUFBRSxxQkFBRjtRQUF5QixTQUFBLEVBQVcsQ0FBRSxNQUFGO01BQXBDO0lBdkJZO0VBQS9CLEVBYkY7OztFQXVDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXZDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZXhwYW5kX3JlY3Vyc2l2ZV9rZXlzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgZXhwYW5kID0gKCBzdHJpbmdzLCBrZXksIHNlZW4gPSBuZXcgU2V0KCkgKSAtPlxuICAgICAgaWYgc2Vlbi5oYXMga2V5XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pa3ZyX19fMSBjeWNsaWMgcmVmZXJlbmNlIGRldGVjdGVkIGZvciAje2tleX1cIlxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIHN0cmluZ3MsIGtleVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWt2cl9fXzEgdW5rbm93biBrZXkgI3trZXl9XCJcbiAgICAgIHNlZW4uYWRkIGtleVxuICAgICAgdmFsdWUgPSBzdHJpbmdzWyBrZXkgXVxuICAgICAgZm9yIGssIHYgb2Ygc3RyaW5nc1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2VBbGwgaywgLT4gZXhwYW5kIHN0cmluZ3MsIGssIHNlZW5cbiAgICAgIHJldHVybiB2YWx1ZVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBleHBhbmRfcmVjdXJzaXZlX2tleXMgPSAoIHN0cmluZ3MgKSAtPlxuICAgICAgIyMjIEV4cGFuZCBhbGwgc3RyaW5nIHZhbHVlcyBieSByZWN1cnNpdmVseSByZXBsYWNpbmcga2V5cyB3aXRoIHRoZWlyIG1hcHBlZCB2YWx1ZXMgIyMjXG4gICAgICBSICAgICAgICAgPSB7fVxuICAgICAgUlsga2V5IF0gID0gZXhwYW5kIHN0cmluZ3MsIGtleSBmb3Iga2V5IG9mIHN0cmluZ3NcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBleHBhbmRfcmVjdXJzaXZlX2tleXMsIGludGVybmFsczogeyBleHBhbmQsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
