(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Jetstream, exports, hide, nameit, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    //=========================================================================================================
    $ = function(cfg, fn) {
      /* TAINT do not change original function */
      fn[CFG] = cfg;
      return fn;
    };
    Jetstream = (function() {
      //=========================================================================================================
      class Jetstream {
        //-------------------------------------------------------------------------------------------------------
        constructor() {
          /* TAINT use Object.freeze, push sets new array */
          var callable, me, transforms;
          me = this;
          me.transforms = transforms = [];
          callable = function*(d) {
            if (transforms.length === 0) {
              return (yield d);
            }
            return (yield* transforms[0](d));
          };
          Object.setPrototypeOf(callable, this);
          set_getter(callable, 'size', () => {
            return transforms.length;
          });
          set_getter(callable, 'is_empty', () => {
            return transforms.length === 0;
          });
          return callable;
        }

        //-------------------------------------------------------------------------------------------------------
        push(gfn) {
          var R, cfg, first, has_first, has_last, has_nxt, last, my_idx, nxt, original_gfn, type;
          switch (type = type_of(gfn)) {
            case 'function':
              original_gfn = gfn;
              if (gfn instanceof Jetstream) {
                gfn = nameit('jetstream', function*(d) {
                  return (yield* original_gfn(d));
                });
              } else {
                gfn = nameit(`(watcher)_${original_gfn.name}`, function*(d) {
                  original_gfn(d);
                  return (yield d);
                });
              }
              break;
            case 'generatorfunction':
              null;
              break;
            default:
              `throw new Error expect a synchronous function or a synchronous generator function, got a ${type}`;
          }
          //.....................................................................................................
          // debug 'Ωdeimst___1', @transforms
          my_idx = this.transforms.length;
          first = null;
          last = null;
          has_first = false;
          has_last = false;
          //.....................................................................................................
          if ((cfg = gfn[CFG]) != null) {
            has_first = Reflect.has(cfg, 'first');
            has_last = Reflect.has(cfg, 'last');
            if (has_first) {
              first = cfg.first;
            }
            if (has_last) {
              last = cfg.last;
            }
          }
          //.....................................................................................................
          nxt = null;
          has_nxt = null;
          //.....................................................................................................
          R = nameit(gfn.name, (function(me) {
            return function*(d) {
              var j;
              if (nxt == null) {
                nxt = me.transforms[my_idx + 1];
                has_nxt = nxt != null;
              }
              if (has_first) {
                yield* gfn(first);
              }
              if (has_nxt) {
                for (j of gfn(d)) {
                  (yield* nxt(j));
                }
              } else {
                for (j of gfn(d)) {
                  (yield j);
                }
              }
              if (has_last) {
                yield* gfn(last);
              }
              //...................................................................................................
              return null;
            };
          })(this));
          //.....................................................................................................
          this.transforms.push(R);
          return R;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Jetstream.$ = $;

      Jetstream.prototype.$ = $;

      return Jetstream;

    }).call(this);
    //=========================================================================================================
    return exports = {Jetstream, $};
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_jetstream});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBO0lBQUUsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUI7SUFFQSxHQUFBLEdBQTRCLE1BQUEsQ0FBTyxLQUFQLEVBSjlCOztJQU9FLENBQUEsR0FBSSxRQUFBLENBQUUsR0FBRixFQUFPLEVBQVAsQ0FBQSxFQUFBOztNQUVGLEVBQUUsQ0FBQyxHQUFELENBQUYsR0FBVTtBQUNWLGFBQU87SUFITDtJQU1FOztNQUFOLE1BQUEsVUFBQSxDQUFBOztRQU9FLFdBQWEsQ0FBQSxDQUFBLEVBQUE7O0FBQ2pCLGNBQUEsUUFBQSxFQUFBLEVBQUEsRUFBQTtVQUNNLEVBQUEsR0FBYztVQUNkLEVBQUUsQ0FBQyxVQUFILEdBQWdCLFVBQUEsR0FBYTtVQUM3QixRQUFBLEdBQWMsU0FBQSxDQUFFLENBQUYsQ0FBQTtZQUNaLElBQWtCLFVBQVUsQ0FBQyxNQUFYLEtB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RUEzQlY7O1VBd0NNLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFqQjtBQUNBLGlCQUFPO1FBMUNIOztNQXBCUjs7O01BR0UsU0FBQyxDQUFBLENBQUQsR0FBSTs7MEJBQ0osQ0FBQSxHQUFJOzs7O2tCQWpCUjs7QUE4RUUsV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsQ0FBYjtFQS9FQyxFQVRwQjs7O0VBNkZBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLENBQUUsaUJBQUYsQ0FBOUI7QUE3RkEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAkID0gKCBjZmcsIGZuICkgLT5cbiAgICAjIyMgVEFJTlQgZG8gbm90IGNoYW5nZSBvcmlnaW5hbCBmdW5jdGlvbiAjIyNcbiAgICBmbltDRkddID0gY2ZnXG4gICAgcmV0dXJuIGZuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQCQ6ICRcbiAgICAkOiAgJFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIG1lICAgICAgICAgID0gQFxuICAgICAgbWUudHJhbnNmb3JtcyA9IHRyYW5zZm9ybXMgPSBbXVxuICAgICAgY2FsbGFibGUgICAgPSAoIGQgKSAtPlxuICAgICAgICByZXR1cm4geWllbGQgZCBpZiB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG4gICAgICAgIHlpZWxkIGZyb20gdHJhbnNmb3Jtc1sgMCBdIGRcbiAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZiBjYWxsYWJsZSwgQFxuICAgICAgc2V0X2dldHRlciBjYWxsYWJsZSwgJ3NpemUnLCAgICAgPT4gdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIHNldF9nZXR0ZXIgY2FsbGFibGUsICdpc19lbXB0eScsID0+IHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiBjYWxsYWJsZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBpZiBnZm4gaW5zdGFuY2VvZiBKZXRzdHJlYW1cbiAgICAgICAgICAgIGdmbiA9IG5hbWVpdCAnamV0c3RyZWFtJywgKCBkICkgLT4geWllbGQgZnJvbSBvcmlnaW5hbF9nZm4gZFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGdmbiA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX2dmbi5uYW1lfVwiLCAoIGQgKSAtPiBvcmlnaW5hbF9nZm4gZDsgeWllbGQgZFxuICAgICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgICBudWxsXG4gICAgICAgIGVsc2UgXCJ0aHJvdyBuZXcgRXJyb3IgZXhwZWN0IGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgYSBzeW5jaHJvbm91cyBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIGRlYnVnICfOqWRlaW1zdF9fXzEnLCBAdHJhbnNmb3Jtc1xuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIGhhc19ueHQgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IGdmbi5uYW1lLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ICAgICAgICAgICAgID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaGFzX254dCAgICAgICAgID0gbnh0P1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgZGVidWcgJ86pZGVpbXN0X19fMicsIGdmbiwgbnh0XG4gICAgICAgIHlpZWxkIGZyb20gZ2ZuIGZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBpZiBoYXNfbnh0ICB0aGVuICAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICBlbHNlICAgICAgICAgICAgICAoIHlpZWxkIGogICAgICAgICAgICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICB5aWVsZCBmcm9tIGdmbiBsYXN0IGlmIGhhc19sYXN0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
