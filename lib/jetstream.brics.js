(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Jetstream, exports, hide, internals, nameit, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    internals = Object.freeze({CFG});
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
          this.transforms = [];
          return void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        get_first(...P) {
          var R;
          if ((R = this.run(...P)).length === 0) {
            throw new Error("Ωjstrm___1 no result");
          }
          return R[0];
        }

        //-------------------------------------------------------------------------------------------------------
        run(...P) {
          return [...(this.walk(...P))];
        }

        //-------------------------------------------------------------------------------------------------------
        * walk(d) {
          if (this.is_empty) {
            return (yield d);
          }
          return (yield* this.transforms[0](d));
        }

        //-------------------------------------------------------------------------------------------------------
        push(gfn) {
          var R, cfg, first, has_first, has_last, has_nxt, last, my_idx, nxt, original_gfn, type;
          // if gfn instanceof Jetstream
          //   gfn = nameit 'jetstream', ( d ) -> yield from original_gfn d
          // else
          switch (type = type_of(gfn)) {
            case 'function':
              original_gfn = gfn;
              gfn = nameit(`(watcher)_${original_gfn.name}`, function*(d) {
                original_gfn(d);
                return (yield d);
              });
              break;
            case 'generatorfunction':
              null;
              break;
            default:
              throw new Error(`Ωjstrm___2 expected a synchronous function or a synchronous generator function, got a ${type}`);
          }
          //.....................................................................................................
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
          R = nameit(`(managed)_${gfn.name}`, (function(me) {
            return function*(d) {
              var j;
              if (nxt == null) {
                nxt = me.transforms[my_idx + 1];
                has_nxt = nxt != null;
              }
              //...................................................................................................
              if (has_first) {
                // yield from gfn first
                if (has_nxt) {
                  for (j of gfn(first)) {
                    (yield* nxt(j));
                  }
                } else {
                  for (j of gfn(first)) {
                    (yield j);
                  }
                }
              }
              //...................................................................................................
              if (has_nxt) {
                for (j of gfn(d)) {
                  (yield* nxt(j));
                }
              } else {
                for (j of gfn(d)) {
                  (yield j);
                }
              }
              //...................................................................................................
              if (has_last) {
                if (has_nxt) {
                  for (j of gfn(last)) {
                    (yield* nxt(j));
                  }
                } else {
                  for (j of gfn(last)) {
                    (yield j);
                  }
                }
              }
              // yield from gfn last
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

      //-------------------------------------------------------------------------------------------------------
      set_getter(Jetstream.prototype, 'length', function() {
        return this.transforms.length;
      });

      set_getter(Jetstream.prototype, 'is_empty', function() {
        return this.transforms.length === 0;
      });

      return Jetstream;

    }).call(this);
    //=========================================================================================================
    return exports = {Jetstream, $, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_jetstream});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixNQUFBLENBQU8sS0FBUDtJQUM1QixTQUFBLEdBQTRCLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLENBQWQsRUFMOUI7O0lBUUUsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBLEVBQUE7O01BRUYsRUFBRSxDQUFDLEdBQUQsQ0FBRixHQUFVO0FBQ1YsYUFBTztJQUhMO0lBTUU7O01BQU4sTUFBQSxVQUFBLENBQUE7O1FBT0UsV0FBYSxDQUFBLENBQUEsRUFBQTs7VUFFWCxJQUFDLENBQUEsVUFBRCxHQUFjO0FBQ2QsaUJBQU87UUFISSxDQUxqQjs7O1FBZUksU0FBVyxDQUFBLEdBQUUsQ0FBRixDQUFBO0FBQ2Ys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LEtBQUEsV0FBQTtrQkFBRSxDQUFBLE1BQU0sQ0FBTjtnQkFBRixDQURsQjtlQVRSOztjQVlRLElBQUcsUUFBSDtnQkFDRSxJQUFHLE9BQUg7a0JBQWtCLEtBQUEsY0FBQTtvQkFBRSxDQUFBLE9BQVcsR0FBQSxDQUFJLENBQUosQ0FBWDtrQkFBRixDQUFsQjtpQkFBQSxNQUFBO2tCQUNrQixLQUFBLGNBQUE7b0JBQUUsQ0FBQSxNQUFNLENBQU47a0JBQUYsQ0FEbEI7aUJBREY7ZUFaUjs7O0FBaUJRLHFCQUFPO1lBbEI0QztVQUFkLENBQUEsRUFBTyxLQUExQyxFQTFCVjs7VUE4Q00sSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsaUJBQU87UUFoREg7O01BL0JSOzs7TUFHRSxTQUFDLENBQUEsQ0FBRCxHQUFJOzswQkFDSixDQUFBLEdBQUk7OztNQVNKLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixRQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUM7TUFBZixDQUE1Qjs7TUFDQSxVQUFBLENBQVcsU0FBQyxDQUFBLFNBQVosRUFBZ0IsVUFBaEIsRUFBNEIsUUFBQSxDQUFBLENBQUE7ZUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosS0FBc0I7TUFBekIsQ0FBNUI7Ozs7a0JBNUJKOztBQWdHRSxXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxDQUFiLEVBQWdCLFNBQWhCO0VBakdDLEVBVHBCOzs7RUErR0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsQ0FBRSxpQkFBRixDQUE5QjtBQS9HQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucmVxdWlyZV9qZXRzdHJlYW0gPSAtPlxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIENGRyAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ0NGRydcbiAgaW50ZXJuYWxzICAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUgeyBDRkcsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICQgPSAoIGNmZywgZm4gKSAtPlxuICAgICMjIyBUQUlOVCBkbyBub3QgY2hhbmdlIG9yaWdpbmFsIGZ1bmN0aW9uICMjI1xuICAgIGZuW0NGR10gPSBjZmdcbiAgICByZXR1cm4gZm5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAJDogJFxuICAgICQ6ICAkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9maXJzdDogKCBQLi4uICkgLT5cbiAgICAgIGlmICggUiA9IEBydW4gUC4uLiApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIG5vIHJlc3VsdFwiXG4gICAgICByZXR1cm4gUlsgMCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT4gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgICAoIGQgKSAtPlxuICAgICAgcmV0dXJuIHlpZWxkIGQgaWYgQGlzX2VtcHR5XG4gICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICAjIGlmIGdmbiBpbnN0YW5jZW9mIEpldHN0cmVhbVxuICAgICAgIyAgIGdmbiA9IG5hbWVpdCAnamV0c3RyZWFtJywgKCBkICkgLT4geWllbGQgZnJvbSBvcmlnaW5hbF9nZm4gZFxuICAgICAgIyBlbHNlXG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+IG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICAgIG51bGxcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBleHBlY3RlZCBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGEgc3luY2hyb25vdXMgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIGhhc19ueHQgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7Z2ZuLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgICAgICAgICAgICAgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBoYXNfbnh0ICAgICAgICAgPSBueHQ/XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgaGFzX2ZpcnN0XG4gICAgICAgICAgIyB5aWVsZCBmcm9tIGdmbiBmaXJzdFxuICAgICAgICAgIGlmIGhhc19ueHQgIHRoZW4gICggeWllbGQgZnJvbSBueHQgaiAgKSBmb3IgaiBmcm9tIGdmbiBmaXJzdFxuICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBmaXJzdFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGhhc19ueHQgIHRoZW4gICggeWllbGQgZnJvbSBueHQgaiAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgaGFzX2xhc3RcbiAgICAgICAgICBpZiBoYXNfbnh0ICB0aGVuICAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gbGFzdFxuICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBsYXN0XG4gICAgICAgICAgIyB5aWVsZCBmcm9tIGdmbiBsYXN0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
