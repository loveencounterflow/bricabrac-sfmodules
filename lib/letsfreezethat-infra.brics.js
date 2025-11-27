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
          var R, fn, prototype, ref, ref1, ref2;
          ref = P, [...P] = ref, [fn] = splice.call(P, -1);
          if (d == null) {
            throw new Error(`Ωlfti___2 unable to process values of type ${type_of(d)}`);
          }
          if (ref1 = (prototype = Object.getPrototypeOf(d)), indexOf.call(known_prototypes, ref1) < 0) {
            throw new Error(`Ωlfti___3 unable to process values of type ${(ref2 = d.constructor.name) != null ? ref2 : type_of(d)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xldHNmcmVlemV0aGF0LWluZnJhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTtJQUFBO3dCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSw0QkFBQSxFQUE4QixRQUFBLENBQUEsQ0FBQTtBQUVoQyxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxTQUFBLEVBQUEsZ0JBQUEsRUFBQSxDQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUE7O01BQ0ksQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE5QixFQURKOztNQUlJLENBQUEsR0FDRTtRQUFBLElBQUEsRUFBVSxNQUFBLENBQU8sTUFBUCxDQUFWO1FBQ0EsSUFBQSxFQUFVLE1BQUEsQ0FBTyxNQUFQLENBRFY7UUFFQSxJQUFBLEVBQVUsTUFBQSxDQUFPLE1BQVAsQ0FGVjtRQUdBLEtBQUEsRUFBVSxNQUFBLENBQU8sT0FBUCxDQUhWO1FBSUEsTUFBQSxFQUFVLE1BQUEsQ0FBTyxRQUFQLENBSlY7UUFLQSxJQUFBLEVBQVUsTUFBQSxDQUFPLE1BQVA7TUFMVjtNQU1GLENBQUMsQ0FBQyxRQUFGLEdBQWEsQ0FBQyxDQUFDO01BRWYsU0FBQSxHQUFZLENBQUEsRUFiaEI7O01BZVUsUUFBTixNQUFBLE1BQUEsUUFBb0IsSUFBcEIsQ0FBQSxFQWZKOztNQWtCSSxRQUFBLEdBQVc7UUFBRSxNQUFBLEVBQVE7TUFBVjtNQUdMOzs7O1FBQU4sTUFBQSxRQUFBLENBQUE7O1FBQ0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLEVBQUssUUFBUSxJQUFJLEtBQUosQ0FBQSxDQUFiLENBQUE7QUFDaEIsY0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLFFBQUEsRUFBQTtVQUFRLE1BQW1DLEtBQUEsWUFBaUIsTUFBcEQ7WUFBQSxLQUFBLEdBQVUsSUFBSSxLQUFKLENBQVUsS0FBVixFQUFWO1dBQVI7O1VBRVEsSUFBRyxTQUFIO1lBQ0UsUUFBQSxHQUFZLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQXRCO1lBQ1osQ0FBQSxHQUFlLGdCQUFILEdBQXFCLElBQUksQ0FBQyxDQUFDLFdBQU4sQ0FBQSxDQUFyQixHQUFnRCxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQ7QUFDNUQsb0JBQU8sTUFBUDtBQUFBLG1CQUNPLFFBRFA7Z0JBRUksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLENBQWpCO0FBREc7QUFEUCxtQkFHTyxNQUhQO2dCQUlJLEtBQUEsTUFBQTs7a0JBQ0UsQ0FBQyxDQUFFLENBQUYsQ0FBRCxHQUFTLEtBQUEsQ0FBTSxDQUFOO2dCQURYO0FBREc7QUFIUDtnQkFNTyxNQUFNLElBQUksS0FBSixDQUFVLENBQUEseUJBQUEsQ0FBQSxDQUE0QixVQUFBLENBQVcsTUFBWCxDQUE1QixDQUFBLENBQVY7QUFOYjtBQU9BLG1CQUFPLEVBVlQ7V0FBQSxNQUFBO1lBWUUsUUFBQSxHQUFZO1lBQ1osQ0FBQSxHQUFRLEVBYlY7O2lCQWNDO1FBakJPOzs7O29CQXRCaEI7O01BMENJLGdCQUFBLEdBQW1CLENBQ2YsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsQ0FBQSxDQUF0QixDQURlLEVBRWYsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFkLENBQXRCLENBRmUsRUFHZixNQUFNLENBQUMsY0FBUCxDQUFzQixFQUF0QixDQUhlLEVBMUN2Qjs7TUFpREksTUFBQSxHQUNFO1FBQUEsTUFBQSxFQUFRLE1BQU0sQ0FBQyxNQUFmO1FBQ0EsSUFBQSxFQUFNLFFBQUEsQ0FBRSxDQUFGLEVBQUEsR0FBSyxDQUFMLENBQUE7QUFDWixjQUFBLENBQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7a0NBRHVCO1VBQ2YsSUFBTyxTQUFQO1lBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDJDQUFBLENBQUEsQ0FBOEMsT0FBQSxDQUFRLENBQVIsQ0FBOUMsQ0FBQSxDQUFWLEVBRFI7O1VBRUEsV0FBTyxDQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsY0FBUCxDQUFzQixDQUF0QixDQUFkLGdCQUEyQyxrQkFBM0MsU0FBUDtZQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSwyQ0FBQSxDQUFBLDhDQUFtRSxPQUFBLENBQVEsQ0FBUixDQUFuRSxDQUFBLENBQVYsRUFEUjs7VUFFQSxDQUFBLEdBQU8saUJBQUgsR0FBcUIsSUFBSSxDQUFDLENBQUMsV0FBTixDQUFBLENBQXJCLEdBQWdELE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBZDtVQUNwRCxNQUFNLENBQUMsTUFBUCxDQUFjLENBQWQsRUFBaUIsQ0FBakI7VUFDQSxJQUFjLFVBQWQ7WUFBQSxFQUFBLENBQUcsQ0FBSCxFQUFNLEdBQUEsQ0FBTixFQUFBOztBQUNBLGlCQUFPLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBZDtRQVJIO01BRE4sRUFsRE47O0FBOERJLGFBQU8sT0FBQSxHQUFVLENBQUUsTUFBRixFQUFVLFNBQVY7SUFoRVc7RUFBOUIsRUFiRjs7O0VBZ0ZBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBaEZBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYTogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHMgPVxuICAgICAgdGFrZTogICAgIFN5bWJvbCAndGFrZSdcbiAgICAgIHRvc3M6ICAgICBTeW1ib2wgJ3Rvc3MnXG4gICAgICBjYWxsOiAgICAgU3ltYm9sICdjYWxsJ1xuICAgICAgZXJyb3I6ICAgIFN5bWJvbCAnZXJyb3InXG4gICAgICBhc3NpZ246ICAgU3ltYm9sICdhc3NpZ24nXG4gICAgICBkaXZlOiAgICAgU3ltYm9sICdkaXZlJ1xuICAgIHMuZmFsbGJhY2sgPSBzLmVycm9yXG5cbiAgICBpbnRlcm5hbHMgPSB7fVxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgSG93dG8gZXh0ZW5kcyBNYXBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZmFsbGJhY2sgPSB7IGFjdGlvbjogJ2Vycm9yJywgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGFzcyBQcm9qZWN0XG4gICAgICBwcm9qZWN0ID0gKCB4LCBob3d0byA9IG5ldyBIb3d0bygpICkgLT5cbiAgICAgICAgaG93dG8gPSAoIG5ldyBIb3d0byBob3d0byApIHVubGVzcyBob3d0byBpbnN0YW5jZW9mIEhvd3RvXG4gICAgICAgICMgdW5sZXNzICggKVxuICAgICAgICBpZiB4P1xuICAgICAgICAgIHByb3RveXBlICA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgICAgICAgUiAgICAgICAgID0gaWYgcHJvdG95cGU/ICB0aGVuICggbmV3IHguY29uc3RydWN0b3IgKSBlbHNlICggT2JqZWN0LmNyZWF0ZSBudWxsIClcbiAgICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdhc3NpZ24nXG4gICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gUiwgeFxuICAgICAgICAgICAgd2hlbiAnZGl2ZSdcbiAgICAgICAgICAgICAgZm9yIGssIHYgb2YgeFxuICAgICAgICAgICAgICAgIFJbIGsgXSA9IGNsb25lIHZcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlsZnRpX19fMSB1bmtub3duIGFjdGlvbiAje3Jwcl9zdHJpbmcgYWN0aW9ufVwiXG4gICAgICAgICAgcmV0dXJuIFJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHByb3RveXBlICA9IG51bGxcbiAgICAgICAgICBSICAgICA9IHhcbiAgICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAga25vd25fcHJvdG90eXBlcyA9IFtcbiAgICAgICggT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9IClcbiAgICAgICggT2JqZWN0LmdldFByb3RvdHlwZU9mIE9iamVjdC5jcmVhdGUgbnVsbCApXG4gICAgICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBbXSApXG4gICAgICBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNpbXBsZSA9XG4gICAgICBmcmVlemU6IE9iamVjdC5mcmVlemVcbiAgICAgIGxldHM6ICggZCwgUC4uLiwgZm4gKSAtPlxuICAgICAgICB1bmxlc3MgZD9cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWxmdGlfX18yIHVuYWJsZSB0byBwcm9jZXNzIHZhbHVlcyBvZiB0eXBlICN7dHlwZV9vZiBkfVwiXG4gICAgICAgIHVubGVzcyAoIHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiBkICkgaW4ga25vd25fcHJvdG90eXBlc1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pbGZ0aV9fXzMgdW5hYmxlIHRvIHByb2Nlc3MgdmFsdWVzIG9mIHR5cGUgI3tkLmNvbnN0cnVjdG9yLm5hbWUgPyB0eXBlX29mIGR9XCJcbiAgICAgICAgUiA9IGlmIHByb3RvdHlwZT8gdGhlbiAoIG5ldyBkLmNvbnN0cnVjdG9yICkgZWxzZSAoIE9iamVjdC5jcmVhdGUgbnVsbCApXG4gICAgICAgIE9iamVjdC5hc3NpZ24gUiwgZFxuICAgICAgICBmbiBSLCBQLi4uIGlmIGZuP1xuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSBSXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBzaW1wbGUsIGludGVybmFscywgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
