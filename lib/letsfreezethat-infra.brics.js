(function() {
  'use strict';
  var BRICS, debug,
    splice = [].splice,
    indexOf = [].indexOf;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_letsfreezethat_infra: function() {
      var Howto, Project, exports, fallback, internals, known_prototypes, s, simple, type_of;
      //=======================================================================================================
      ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());
      //=======================================================================================================
      s = {
        take: Symbol('take'),
        toss: Symbol('toss'),
        call: Symbol('call'),
        error: Symbol('error'),
        assign: Symbol('assign'),
        dive: Symbol('dive')
      };
      s.fallback = s.error;
      internals = {};
      //=======================================================================================================
      Howto = class Howto extends Map {};
      //-------------------------------------------------------------------------------------------------------
      fallback = {
        action: 'error'
      };
      Project = (function() {
        var project;

        //-------------------------------------------------------------------------------------------------------
        class Project {};

        project = function(x, howto = new Howto()) {
          var R, k, protoype, v;
          if (!(howto instanceof Howto)) {
            howto = new Howto(howto);
          }
          // unless ( )
          if (x != null) {
            protoype = Object.getPrototypeOf(x);
            R = protoype != null ? new x.constructor() : Object.create(null);
            switch (action) {
              case 'assign':
                Object.assign(R, x);
                break;
              case 'dive':
                for (k in x) {
                  v = x[k];
                  R[k] = clone(v);
                }
                break;
              default:
                throw new Error(`Ωlfti___1 unknown action ${rpr_string(action)}`);
            }
            return R;
          } else {
            protoype = null;
            R = x;
          }
          return null;
        };

        return Project;

      }).call(this);
      //-------------------------------------------------------------------------------------------------------
      known_prototypes = [Object.getPrototypeOf({}), Object.getPrototypeOf(Object.create(null)), Object.getPrototypeOf([])];
      //-------------------------------------------------------------------------------------------------------
      simple = {
        freeze: Object.freeze,
        lets: function(d, ...P) {
          var R, fn, prototype, ref, ref1;
          ref = P, [...P] = ref, [fn] = splice.call(P, -1);
          if (d == null) {
            throw new Error(`Ωlfti___2 unable to process values of type ${type_of(d)}`);
          }
          if (ref1 = (prototype = Object.getPrototypeOf(d)), indexOf.call(known_prototypes, ref1) < 0) {
            throw new Error(`Ωlfti___3 unable to process values of type ${type_of(d)}`);
          }
          R = prototype != null ? new d.constructor() : Object.create(null);
          Object.assign(R, d);
          if (fn != null) {
            fn(R, ...P);
          }
          return Object.freeze(R);
        }
      };
      //.......................................................................................................
      return exports = {simple, internals};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xldHNmcmVlemV0aGF0LWluZnJhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTtJQUFBO3dCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSw0QkFBQSxFQUE4QixRQUFBLENBQUEsQ0FBQTtBQUVoQyxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxTQUFBLEVBQUEsZ0JBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUE7O01BQ0ksQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE5QixFQURKOztNQUlJLENBQUEsR0FDRTtRQUFBLElBQUEsRUFBVSxNQUFBLENBQU8sTUFBUCxDQUFWO1FBQ0EsSUFBQSxFQUFVLE1BQUEsQ0FBTyxNQUFQLENBRFY7UUFFQSxJQUFBLEVBQVUsTUFBQSxDQUFPLE1BQVAsQ0FGVjtRQUdBLEtBQUEsRUFBVSxNQUFBLENBQU8sT0FBUCxDQUhWO1FBSUEsTUFBQSxFQUFVLE1BQUEsQ0FBTyxRQUFQLENBSlY7UUFLQSxJQUFBLEVBQVUsTUFBQSxDQUFPLE1BQVA7TUFMVjtNQU1GLENBQUMsQ0FBQyxRQUFGLEdBQWEsQ0FBQyxDQUFDO01BRWYsU0FBQSxHQUFZLENBQUEsRUFiaEI7O01BZVUsUUFBTixNQUFBLE1BQUEsUUFBb0IsSUFBcEIsQ0FBQSxFQWZKOztNQWtCSSxRQUFBLEdBQVc7UUFBRSxNQUFBLEVBQVE7TUFBVjtNQUdMOzs7O1FBQU4sTUFBQSxRQUFBLENBQUE7O1FBQ0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLEVBQUssUUFBUSxJQUFJLEtBQUosQ0FBQSxDQUFiLENBQUE7QUFDaEIsY0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLFFBQUEsRUFBQTtVQUFRLE1BQW1DLEtBQUEsWUFBaUIsTUFBcEQ7WUFBQSxLQUFBLEdBQVUsSUFBSSxLQUFKLENBQVUsS0FBVixFQUFWO1dBQVI7O1VBRVEsSUFBRyxTQUFIO1lBQ0UsUUFBQSxHQUFZLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQXRCO1lBQ1osQ0FBQSxHQUFlLGdCQUFILEdBQXFCLElBQUksQ0FBQyxDQUFDLFdBQU4sQ0FBQSxDQUFyQixHQUFnRCxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7QUFDNUQsb0JBQU8sTUFBUDtBQUFBLG1CQUNPLFFBRFA7Z0JBRUksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLENBQWpCO0FBREc7QUFEUCxtQkFHTyxNQUhQO2dCQUlJLEtBQUEsTUFBQTs7a0JBQ0UsQ0FBQyxDQUFFLENBQUYsQ0FBRCxHQUFTLEtBQUEsQ0FBTSxDQUFOO2dCQURYO0FBREc7QUFIUDtnQkFNTyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEseUJBQUEsQ0FBQSxDQUE0QixVQUFBLENBQVcsTUFBWCxDQUE1QixDQUFBLENBQVY7QUFOYjtBQU9BLG1CQUFPLEVBVlQ7V0FBQSxNQUFBO1lBWUUsUUFBQSxHQUFZO1lBQ1osQ0FBQSxHQUFRLEVBYlY7O2lCQWNDO1FBakJPOzs7O29CQXRCaEI7O01BMENJLGdCQUFBLEdBQW1CLENBQ2YsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsQ0FBQSxDQUF0QixDQURlLEVBRWYsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkLENBQXRCLENBRmUsRUFHZixNQUFNLENBQUMsY0FBUCxDQUFzQixFQUF0QixDQUhlLEVBMUN2Qjs7TUFpREksTUFBQSxHQUNFO1FBQUEsTUFBQSxFQUFRLE1BQU0sQ0FBQyxNQUFmO1FBQ0EsSUFBQSxFQUFNLFFBQUEsQ0FBRSxDQUFGLEVBQUEsR0FBSyxDQUFMLENBQUE7QUFDWixjQUFBLENBQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQTtrQ0FEdUI7VUFDZixJQUFPLFNBQVA7WUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMkNBQUEsQ0FBQSxDQUE4QyxPQUFBLENBQVEsQ0FBUixDQUE5QyxDQUFBLENBQVYsRUFEUjs7VUFFQSxXQUFPLENBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQXRCLENBQWQsZ0JBQTJDLGtCQUEzQyxTQUFQO1lBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDJDQUFBLENBQUEsQ0FBOEMsT0FBQSxDQUFRLENBQVIsQ0FBOUMsQ0FBQSxDQUFWLEVBRFI7O1VBRUEsQ0FBQSxHQUFPLGlCQUFILEdBQXFCLElBQUksQ0FBQyxDQUFDLFdBQU4sQ0FBQSxDQUFyQixHQUFnRCxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7VUFDcEQsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLENBQWpCO1VBQ0EsSUFBYyxVQUFkO1lBQUEsRUFBQSxDQUFHLENBQUgsRUFBTSxHQUFBLENBQU4sRUFBQTs7QUFDQSxpQkFBTyxNQUFNLENBQUMsTUFBUCxDQUFjLENBQWQ7UUFSSDtNQUROLEVBbEROOztBQThESSxhQUFPLE9BQUEsR0FBVSxDQUFFLE1BQUYsRUFBVSxTQUFWO0lBaEVXO0VBQTlCLEVBYkY7OztFQWdGQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQWhGQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmE6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBzID1cbiAgICAgIHRha2U6ICAgICBTeW1ib2wgJ3Rha2UnXG4gICAgICB0b3NzOiAgICAgU3ltYm9sICd0b3NzJ1xuICAgICAgY2FsbDogICAgIFN5bWJvbCAnY2FsbCdcbiAgICAgIGVycm9yOiAgICBTeW1ib2wgJ2Vycm9yJ1xuICAgICAgYXNzaWduOiAgIFN5bWJvbCAnYXNzaWduJ1xuICAgICAgZGl2ZTogICAgIFN5bWJvbCAnZGl2ZSdcbiAgICBzLmZhbGxiYWNrID0gcy5lcnJvclxuXG4gICAgaW50ZXJuYWxzID0ge31cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIEhvd3RvIGV4dGVuZHMgTWFwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZhbGxiYWNrID0geyBhY3Rpb246ICdlcnJvcicsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xhc3MgUHJvamVjdFxuICAgICAgcHJvamVjdCA9ICggeCwgaG93dG8gPSBuZXcgSG93dG8oKSApIC0+XG4gICAgICAgIGhvd3RvID0gKCBuZXcgSG93dG8gaG93dG8gKSB1bmxlc3MgaG93dG8gaW5zdGFuY2VvZiBIb3d0b1xuICAgICAgICAjIHVubGVzcyAoIClcbiAgICAgICAgaWYgeD9cbiAgICAgICAgICBwcm90b3lwZSAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICAgICAgICAgIFIgICAgICAgICA9IGlmIHByb3RveXBlPyAgdGhlbiAoIG5ldyB4LmNvbnN0cnVjdG9yICkgZWxzZSAoIE9iamVjdC5jcmVhdGUgbnVsbCApXG4gICAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnYXNzaWduJ1xuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduIFIsIHhcbiAgICAgICAgICAgIHdoZW4gJ2RpdmUnXG4gICAgICAgICAgICAgIGZvciBrLCB2IG9mIHhcbiAgICAgICAgICAgICAgICBSWyBrIF0gPSBjbG9uZSB2XG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6pbGZ0aV9fXzEgdW5rbm93biBhY3Rpb24gI3tycHJfc3RyaW5nIGFjdGlvbn1cIlxuICAgICAgICAgIHJldHVybiBSXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwcm90b3lwZSAgPSBudWxsXG4gICAgICAgICAgUiAgICAgPSB4XG4gICAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGtub3duX3Byb3RvdHlwZXMgPSBbXG4gICAgICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fSApXG4gICAgICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBPYmplY3QuY3JlYXRlIG51bGwgKVxuICAgICAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgW10gKVxuICAgICAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzaW1wbGUgPVxuICAgICAgZnJlZXplOiBPYmplY3QuZnJlZXplXG4gICAgICBsZXRzOiAoIGQsIFAuLi4sIGZuICkgLT5cbiAgICAgICAgdW5sZXNzIGQ/XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlsZnRpX19fMiB1bmFibGUgdG8gcHJvY2VzcyB2YWx1ZXMgb2YgdHlwZSAje3R5cGVfb2YgZH1cIlxuICAgICAgICB1bmxlc3MgKCBwcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgZCApIGluIGtub3duX3Byb3RvdHlwZXNcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWxmdGlfX18zIHVuYWJsZSB0byBwcm9jZXNzIHZhbHVlcyBvZiB0eXBlICN7dHlwZV9vZiBkfVwiXG4gICAgICAgIFIgPSBpZiBwcm90b3R5cGU/IHRoZW4gKCBuZXcgZC5jb25zdHJ1Y3RvciApIGVsc2UgKCBPYmplY3QuY3JlYXRlIG51bGwgKVxuICAgICAgICBPYmplY3QuYXNzaWduIFIsIGRcbiAgICAgICAgZm4gUiwgUC4uLiBpZiBmbj9cbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUgUlxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgc2ltcGxlLCBpbnRlcm5hbHMsIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
