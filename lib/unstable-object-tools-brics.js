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
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxZQUFBLEVBQUEsT0FBQTs7TUFDSSxLQUFBLEdBQVEsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUNaLFlBQUEsQ0FBQSxFQUFBO1FBQU0sSUFBNEQsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsQ0FBaEIsQ0FBNUQ7VUFBQSxNQUFNLElBQUksS0FBSixDQUFVLHdDQUFWLEVBQU47O1FBQ0EsS0FBQSxNQUFBOztjQUFpQyxDQUFBLEtBQUs7WUFBdEMsT0FBTyxDQUFDLENBQUUsQ0FBRjs7UUFBUjtBQUNBLGVBQU87TUFIRCxFQURaOztNQU9JLFNBQUEsR0FBWSxRQUFBLENBQUEsR0FBRSxDQUFGLENBQUE7QUFBVyxZQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBO0FBQUc7UUFBQSxLQUFBLG1DQUFBOzt1QkFBRSxLQUFBLENBQU0sQ0FBTjtRQUFGLENBQUE7O01BQWQsRUFQaEI7O01BVUksWUFBQSxHQUFnQixRQUFBLENBQUUsTUFBRixFQUFBLEdBQVUsQ0FBVixDQUFBO0FBQ3BCLFlBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQTtRQUFNLENBQUEsR0FBSSxLQUFBLENBQU0sTUFBTjtRQUNKLEtBQUEsbUNBQUE7O1VBQ0UsS0FBQSxNQUFBOztnQkFBOEIsQ0FBQSxLQUFPO2NBQXJDLENBQUMsQ0FBRSxDQUFGLENBQUQsR0FBUzs7VUFBVDtRQURG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Y2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2NsZWFuX2Fzc2lnbjogLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYW4gPSAoIHggKSAtPlxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlyY2FfX18xIHVuYWJsZSB0byBjbGVhbiBmcm96ZW4gb2JqZWN0XCIgaWYgT2JqZWN0LmlzRnJvemVuIHhcbiAgICAgIGRlbGV0ZSB4WyBrIF0gZm9yIGssIHYgb2YgeCB3aGVuIHYgaXMgdW5kZWZpbmVkXG4gICAgICByZXR1cm4geFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhbl9hbGwgPSAoIFAuLi4gKSAtPiAoICggY2xlYW4geCApIGZvciB4IGluIFAgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhbl9hc3NpZ24gID0gKCB0YXJnZXQsIFAuLi4gICkgLT5cbiAgICAgIFIgPSBjbGVhbiB0YXJnZXRcbiAgICAgIGZvciBwIGluIFBcbiAgICAgICAgUlsgayBdID0gdiBmb3IgaywgdiBvZiBwIHdoZW4gdiBpc250IHVuZGVmaW5lZFxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IGNsZWFuLCBjbGVhbl9hbGwsIGNsZWFuX2Fzc2lnbiwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9waWNrOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwaWNrID0gKCB4LCBrZXlzICkgLT5cbiAgICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGtleSwgeFsga2V5IF0sIF0gZm9yIGtleSBmcm9tIGtleXMgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgcGljaywgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9kZXBsb3k6IC0+XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGRlcGxveSA9ICggeCwga2V5Z3JvdXBzLi4uICkgLT5cbiAgICAgIHJldHVybiBbXSB1bmxlc3Mga2V5Z3JvdXBzLmxlbmd0aCA+IDBcbiAgICAgIFIgPSBbXVxuICAgICAgZm9yIGtleWdyb3VwLCBpZHggaW4ga2V5Z3JvdXBzXG4gICAgICAgIFIucHVzaCBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGtleSwgeFsga2V5IF0sIF0gZm9yIGtleSBpbiBrZXlncm91cCApXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgZGVwbG95LCB9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcmVtYXA6IC0+XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCB1c2UgbW9kdWxlICMjI1xuICAgIGlzYV9mdW5jdGlvbiA9ICggeCApIC0+ICggT2JqZWN0Ojp0b1N0cmluZy5jYWxsIHggKSBpcyAnW29iamVjdCBGdW5jdGlvbl0nXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG9taXQgPSBTeW1ib2wgJ29taXQnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlbWFwID0gKCB4LCBtYXBwaW5nICkgLT5cbiAgICAgICMjIyBUQUlOVCB1bmlmeSB3aXRoIGBsZXRzZnJlZXpldGhhdC1pbmZyYSNwcm9qZWN0KClgPyAjIyNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pcmNhX19fMiB1bmFibGUgdG8gcmVtYXAgZnJvemVuIG9iamVjdFwiIGlmIE9iamVjdC5pc0Zyb3plbiB4XG4gICAgICBvcmlnaW5hbF9rZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgeFxuICAgICAgdG1wICAgICAgICAgICA9IHt9XG4gICAgICBmb3Igb3JpZ2luYWxfa2V5IGluIG9yaWdpbmFsX2tleXNcbiAgICAgICAgbWFwcGVkX2tleSAgICAgICAgPSBtYXBwaW5nWyBvcmlnaW5hbF9rZXkgXSA/IG9yaWdpbmFsX2tleVxuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gbWFwcGVkX2tleSBpcyBvbWl0ICAgICAgIHRoZW4gIG51bGxcbiAgICAgICAgICB3aGVuIGlzYV9mdW5jdGlvbiBtYXBwZWRfa2V5ICB0aGVuICBPYmplY3QuYXNzaWduIHRtcCwgbWFwcGVkX2tleSB4WyBvcmlnaW5hbF9rZXkgXSwgb3JpZ2luYWxfa2V5XG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wWyBtYXBwZWRfa2V5IF0gPSB4WyBvcmlnaW5hbF9rZXkgXVxuICAgICAgICBkZWxldGUgeFsgb3JpZ2luYWxfa2V5IF1cbiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduIHgsIHRtcFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgcmVtYXAsIG9taXQsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
