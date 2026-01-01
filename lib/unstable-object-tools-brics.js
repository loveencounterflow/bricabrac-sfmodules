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
    require_clean_assign: function() {
      var clean, clean_all, clean_assign, exports;
      //-------------------------------------------------------------------------------------------------------
      clean = function(x) {
        var k, v;
        if (Object.isFrozen(x)) {
          throw new Error("Ωrca___1 unable to clean frozen object");
        }
        for (k in x) {
          v = x[k];
          if (v === void 0) {
            delete x[k];
          }
        }
        return x;
      };
      //-------------------------------------------------------------------------------------------------------
      clean_all = function(...P) {
        var i, len, results, x;
        results = [];
        for (i = 0, len = P.length; i < len; i++) {
          x = P[i];
          results.push(clean(x));
        }
        return results;
      };
      //-------------------------------------------------------------------------------------------------------
      clean_assign = function(target, ...P) {
        var R, i, k, len, p, v;
        R = clean(target);
        for (i = 0, len = P.length; i < len; i++) {
          p = P[i];
          for (k in p) {
            v = p[k];
            if (v !== void 0) {
              R[k] = v;
            }
          }
        }
        return R;
      };
      //-------------------------------------------------------------------------------------------------------
      return exports = {clean, clean_all, clean_assign};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_pick: function() {
      var exports, pick;
      //-------------------------------------------------------------------------------------------------------
      pick = function(x, keys) {
        var key;
        return Object.fromEntries((function() {
          var results;
          results = [];
          for (key of keys) {
            results.push([key, x[key]]);
          }
          return results;
        })());
      };
      //-------------------------------------------------------------------------------------------------------
      return exports = {pick};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_deploy: function() {
      var deploy, exports;
      //-------------------------------------------------------------------------------------------------------
      deploy = function(x, ...keygroups) {
        var R, i, idx, key, keygroup, len;
        if (!(keygroups.length > 0)) {
          return [];
        }
        R = [];
        for (idx = i = 0, len = keygroups.length; i < len; idx = ++i) {
          keygroup = keygroups[idx];
          R.push(Object.fromEntries((function() {
            var j, len1, results;
            results = [];
            for (j = 0, len1 = keygroup.length; j < len1; j++) {
              key = keygroup[j];
              results.push([key, x[key]]);
            }
            return results;
          })()));
        }
        return R;
      };
      //-------------------------------------------------------------------------------------------------------
      return exports = {deploy};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_remap: function() {
      var exports, isa_function, omit, remap;
      //-------------------------------------------------------------------------------------------------------
      /* TAINT use module */
      isa_function = function(x) {
        return (Object.prototype.toString.call(x)) === '[object Function]';
      };
      //-------------------------------------------------------------------------------------------------------
      omit = Symbol('omit');
      //-------------------------------------------------------------------------------------------------------
      remap = function(x, mapping) {
        var i, len, mapped_key, original_key, original_keys, ref, tmp;
        if (Object.isFrozen(x)) {
          /* TAINT unify with `letsfreezethat-infra#project()`? */
          throw new Error("Ωrca___2 unable to remap frozen object");
        }
        original_keys = Object.getOwnPropertyNames(x);
        tmp = {};
        for (i = 0, len = original_keys.length; i < len; i++) {
          original_key = original_keys[i];
          mapped_key = (ref = mapping[original_key]) != null ? ref : original_key;
          switch (true) {
            case mapped_key === omit:
              null;
              break;
            case isa_function(mapped_key):
              Object.assign(tmp, mapped_key(x[original_key], original_key));
              break;
            default:
              tmp[mapped_key] = x[original_key];
          }
          delete x[original_key];
        }
        return Object.assign(x, tmp);
      };
      //.......................................................................................................
      return exports = {remap, omit};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_get_prototype_chain: function() {
      var exports, get_all_in_prototype_chain, get_prototype_chain;
      //-------------------------------------------------------------------------------------------------------
      get_prototype_chain = function(x) {
        var R;
        if (x == null) {
          return [];
        }
        R = [x];
        while (true) {
          if ((x = Object.getPrototypeOf(x)) == null) {
            break;
          }
          R.push(x);
        }
        return R;
      };
      //-------------------------------------------------------------------------------------------------------
      get_all_in_prototype_chain = function(x, name) {
        var R, i, len, protoype, ref, seen;
        seen = new Set();
        R = [];
        ref = get_prototype_chain(x);
        for (i = 0, len = ref.length; i < len; i++) {
          protoype = ref[i];
          if (!Object.hasOwn(protoype, name)) {
            continue;
          }
          R.push(protoype[name]);
        }
        return R;
      };
      //.......................................................................................................
      return exports = {get_prototype_chain, get_all_in_prototype_chain};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxZQUFBLEVBQUEsT0FBQTs7TUFDSSxLQUFBLEdBQVEsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUNaLFlBQUEsQ0FBQSxFQUFBO1FBQU0sSUFBNEQsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsQ0FBaEIsQ0FBNUQ7VUFBQSxNQUFNLElBQUksS0FBSixDQUFVLHdDQUFWLEVBQU47O1FBQ0EsS0FBQSxNQUFBOztjQUFpQyxDQUFBLEtBQUs7WUFBdEMsT0FBTyxDQUFDLENBQUUsQ0FBRjs7UUFBUjtBQUNBLGVBQU87TUFIRCxFQURaOztNQU9JLFNBQUEsR0FBWSxRQUFBLENBQUEsR0FBRSxDQUFGLENBQUE7QUFBVyxZQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBO0FBQUc7UUFBQSxLQUFBLG1DQUFBOzt1QkFBRSxLQUFBLENBQU0sQ0FBTjtRQUFGLENBQUE7O01BQWQsRUFQaEI7O01BVUksWUFBQSxHQUFnQixRQUFBLENBQUUsTUFBRixFQUFBLEdBQVUsQ0FBVixDQUFBO0FBQ3BCLFlBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQTtRQUFNLENBQUEsR0FBSSxLQUFBLENBQU0sTUFBTjtRQUNKLEtBQUEsbUNBQUE7O1VBQ0UsS0FBQSxNQUFBOztnQkFBOEIsQ0FBQSxLQUFPO2NBQXJDLENBQUMsQ0FBRSxDQUFGLENBQUQsR0FBUzs7VUFBVDtRQURG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O01BQ0ksbUJBQUEsR0FBc0IsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUMxQixZQUFBO1FBQU0sSUFBaUIsU0FBakI7QUFBQSxpQkFBTyxHQUFQOztRQUNBLENBQUEsR0FBSSxDQUFFLENBQUY7QUFDSixlQUFBLElBQUE7VUFDRSxJQUFhLHNDQUFiO0FBQUEsa0JBQUE7O1VBQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxDQUFQO1FBRkY7QUFHQSxlQUFPO01BTmEsRUFEMUI7O01BVUksMEJBQUEsR0FBNkIsUUFBQSxDQUFFLENBQUYsRUFBSyxJQUFMLENBQUE7QUFDakMsWUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBO1FBQU0sSUFBQSxHQUFZLElBQUksR0FBSixDQUFBO1FBQ1osQ0FBQSxHQUFZO0FBQ1o7UUFBQSxLQUFBLHFDQUFBOztVQUNFLEtBQWdCLE1BQU0sQ0FBQyxNQUFQLENBQWMsUUFBZCxFQUF3QixJQUF4QixDQUFoQjtBQUFBLHFCQUFBOztVQUNBLENBQUMsQ0FBQyxJQUFGLENBQU8sUUFBUSxDQUFFLElBQUYsQ0FBZjtRQUZGO0FBR0EsZUFBTztNQU5vQixFQVZqQzs7QUFtQkksYUFBTyxPQUFBLEdBQVUsQ0FBRSxtQkFBRixFQUF1QiwwQkFBdkI7SUFyQlU7RUEvRTdCLEVBYkY7OztFQXFIQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXJIQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfY2xlYW5fYXNzaWduOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhbiA9ICggeCApIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqXJjYV9fXzEgdW5hYmxlIHRvIGNsZWFuIGZyb3plbiBvYmplY3RcIiBpZiBPYmplY3QuaXNGcm96ZW4geFxuICAgICAgZGVsZXRlIHhbIGsgXSBmb3IgaywgdiBvZiB4IHdoZW4gdiBpcyB1bmRlZmluZWRcbiAgICAgIHJldHVybiB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsZWFuX2FsbCA9ICggUC4uLiApIC0+ICggKCBjbGVhbiB4ICkgZm9yIHggaW4gUCApXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsZWFuX2Fzc2lnbiAgPSAoIHRhcmdldCwgUC4uLiAgKSAtPlxuICAgICAgUiA9IGNsZWFuIHRhcmdldFxuICAgICAgZm9yIHAgaW4gUFxuICAgICAgICBSWyBrIF0gPSB2IGZvciBrLCB2IG9mIHAgd2hlbiB2IGlzbnQgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgY2xlYW4sIGNsZWFuX2FsbCwgY2xlYW5fYXNzaWduLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3BpY2s6IC0+XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHBpY2sgPSAoIHgsIGtleXMgKSAtPlxuICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyAoIFsga2V5LCB4WyBrZXkgXSwgXSBmb3Iga2V5IGZyb20ga2V5cyApXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBleHBvcnRzID0geyBwaWNrLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RlcGxveTogLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZGVwbG95ID0gKCB4LCBrZXlncm91cHMuLi4gKSAtPlxuICAgICAgcmV0dXJuIFtdIHVubGVzcyBrZXlncm91cHMubGVuZ3RoID4gMFxuICAgICAgUiA9IFtdXG4gICAgICBmb3Iga2V5Z3JvdXAsIGlkeCBpbiBrZXlncm91cHNcbiAgICAgICAgUi5wdXNoIE9iamVjdC5mcm9tRW50cmllcyAoIFsga2V5LCB4WyBrZXkgXSwgXSBmb3Iga2V5IGluIGtleWdyb3VwIClcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBleHBvcnRzID0geyBkZXBsb3ksIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9yZW1hcDogLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHVzZSBtb2R1bGUgIyMjXG4gICAgaXNhX2Z1bmN0aW9uID0gKCB4ICkgLT4gKCBPYmplY3Q6OnRvU3RyaW5nLmNhbGwgeCApIGlzICdbb2JqZWN0IEZ1bmN0aW9uXSdcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgb21pdCA9IFN5bWJvbCAnb21pdCdcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmVtYXAgPSAoIHgsIG1hcHBpbmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVuaWZ5IHdpdGggYGxldHNmcmVlemV0aGF0LWluZnJhI3Byb2plY3QoKWA/ICMjI1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlyY2FfX18yIHVuYWJsZSB0byByZW1hcCBmcm96ZW4gb2JqZWN0XCIgaWYgT2JqZWN0LmlzRnJvemVuIHhcbiAgICAgIG9yaWdpbmFsX2tleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB4XG4gICAgICB0bXAgICAgICAgICAgID0ge31cbiAgICAgIGZvciBvcmlnaW5hbF9rZXkgaW4gb3JpZ2luYWxfa2V5c1xuICAgICAgICBtYXBwZWRfa2V5ICAgICAgICA9IG1hcHBpbmdbIG9yaWdpbmFsX2tleSBdID8gb3JpZ2luYWxfa2V5XG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBtYXBwZWRfa2V5IGlzIG9taXQgICAgICAgdGhlbiAgbnVsbFxuICAgICAgICAgIHdoZW4gaXNhX2Z1bmN0aW9uIG1hcHBlZF9rZXkgIHRoZW4gIE9iamVjdC5hc3NpZ24gdG1wLCBtYXBwZWRfa2V5IHhbIG9yaWdpbmFsX2tleSBdLCBvcmlnaW5hbF9rZXlcbiAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXBbIG1hcHBlZF9rZXkgXSA9IHhbIG9yaWdpbmFsX2tleSBdXG4gICAgICAgIGRlbGV0ZSB4WyBvcmlnaW5hbF9rZXkgXVxuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24geCwgdG1wXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyByZW1hcCwgb21pdCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfcHJvdG90eXBlX2NoYWluID0gKCB4ICkgLT5cbiAgICAgIHJldHVybiBbXSB1bmxlc3MgeD9cbiAgICAgIFIgPSBbIHgsIF1cbiAgICAgIGxvb3BcbiAgICAgICAgYnJlYWsgdW5sZXNzICggeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4ICk/XG4gICAgICAgIFIucHVzaCB4XG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiA9ICggeCwgbmFtZSApIC0+XG4gICAgICBzZWVuICAgICAgPSBuZXcgU2V0KClcbiAgICAgIFIgICAgICAgICA9IFtdXG4gICAgICBmb3IgcHJvdG95cGUgaW4gZ2V0X3Byb3RvdHlwZV9jaGFpbiB4XG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBPYmplY3QuaGFzT3duIHByb3RveXBlLCBuYW1lXG4gICAgICAgIFIucHVzaCBwcm90b3lwZVsgbmFtZSBdXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
