(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Jetstream, _type_of, exports, hide, internals, nameit, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    //=========================================================================================================
    type_of = function(x) {
      if (x instanceof Jetstream) {
        return 'jetstream';
      } else {
        return _type_of(x);
      }
    };
    //=========================================================================================================
    $ = function(cfg, gfn) {
      var R, type;
      switch (type = type_of(gfn)) {
        case 'jetstream':
          R = nameit('(cfg)_(jetstream)', function*(d) {
            return (yield* gfn.walk.call(this, d));
          });
          break;
        case 'function':
          R = nameit(`(cfg)_(watcher)_${gfn.name}`, function*(d) {
            gfn.call(this, d);
            return (yield d);
          });
          break;
        case 'generatorfunction':
          R = nameit(`(cfg)_${gfn.name}`, function*(d) {
            return (yield* gfn.call(this, d));
          });
      }
      R[CFG] = cfg;
      return R;
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
          var R, cfg, first, has_first, has_last, last, my_idx, nxt, original_gfn, type, yielder;
          switch (type = type_of(gfn)) {
            case 'jetstream':
              original_gfn = gfn;
              gfn = nameit('(jetstream)', function*(d) {
                return (yield* original_gfn.walk(d));
              });
              break;
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
              throw new Error(`Ωjstrm___2 expected a jetstream or a synchronous function or generator function, got a ${type}`);
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
          yielder = null;
          //.....................................................................................................
          R = nameit(`(managed)_${gfn.name}`, (function(me) {
            return function*(d) {
              if (nxt == null) {
                nxt = me.transforms[my_idx + 1];
                if (nxt != null) {
                  yielder = function*(d) {
                    var j, results;
                    results = [];
                    for (j of gfn(d)) {
                      results.push((yield* nxt(j)));
                    }
                    return results;
                  };
                } else {
                  yielder = function*(d) {
                    var j, results;
                    results = [];
                    for (j of gfn(d)) {
                      results.push((yield j));
                    }
                    return results;
                  };
                }
              }
              if (has_first) {
                yield* yielder(first);
              }
              yield* yielder(d);
              if (has_last) {
                yield* yielder(last);
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
    internals = Object.freeze({CFG, type_of});
    return exports = {Jetstream, $, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_jetstream});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUI7SUFFQSxHQUFBLEdBQTRCLE1BQUEsQ0FBTyxLQUFQLEVBSjlCOztJQU9FLE9BQUEsR0FBVSxRQUFBLENBQUUsQ0FBRixDQUFBO01BQVMsSUFBSyxDQUFBLFlBQWEsU0FBbEI7ZUFBbUMsWUFBbkM7T0FBQSxNQUFBO2VBQW9ELFFBQUEsQ0FBUyxDQUFULEVBQXBEOztJQUFULEVBUFo7O0lBVUUsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sR0FBUCxDQUFBO0FBQ04sVUFBQSxDQUFBLEVBQUE7QUFBSSxjQUFPLElBQUEsR0FBTyxPQUFBLENBQVEsR0FBUixDQUFkO0FBQUEsYUFDTyxXQURQO1VBQ2dDLENBQUEsR0FBSSxNQUFBLENB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QUE1QjtnQkFBQSxPQUFXLE9BQUEsQ0FBUSxJQUFSLEVBQVg7ZUFQUjs7QUFTUSxxQkFBTztZQVY0QztVQUFkLENBQUEsRUFBTyxLQUExQyxFQTFCVjs7VUFzQ00sSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsaUJBQU87UUF4Q0g7O01BL0JSOzs7TUFHRSxTQUFDLENBQUEsQ0FBRCxHQUFJOzswQkFDSixDQUFBLEdBQUk7OztNQVNKLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixRQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUM7TUFBZixDQUE1Qjs7TUFDQSxVQUFBLENBQVcsU0FBQyxDQUFBLFNBQVosRUFBZ0IsVUFBaEIsRUFBNEIsUUFBQSxDQUFBLENBQUE7ZUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosS0FBc0I7TUFBekIsQ0FBNUI7Ozs7a0JBakNKOztJQTZGRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsRUFBTyxPQUFQLENBQWQ7QUFDWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxDQUFiLEVBQWdCLFNBQWhCO0VBL0ZDLEVBVHBCOzs7RUE2R0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsQ0FBRSxpQkFBRixDQUE5QjtBQTdHQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucmVxdWlyZV9qZXRzdHJlYW0gPSAtPlxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2Y6IF90eXBlX29mLCAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIENGRyAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ0NGRydcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHR5cGVfb2YgPSAoIHggKSAtPiBpZiAoIHggaW5zdGFuY2VvZiBKZXRzdHJlYW0gKSB0aGVuICdqZXRzdHJlYW0nIGVsc2UgX3R5cGVfb2YgeFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgJCA9ICggY2ZnLCBnZm4gKSAtPlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICAgICB3aGVuICdmdW5jdGlvbicgICAgICAgICAgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfKHdhdGNoZXIpXyN7Z2ZuLm5hbWV9XCIsICggZCApIC0+IGdmbi5jYWxsIEAsIGQ7IHlpZWxkIGRcbiAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJyB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8je2dmbi5uYW1lfVwiLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4uY2FsbCBALCBkXG4gICAgUltDRkddID0gY2ZnXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAJDogJFxuICAgICQ6ICAkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9maXJzdDogKCBQLi4uICkgLT5cbiAgICAgIGlmICggUiA9IEBydW4gUC4uLiApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIG5vIHJlc3VsdFwiXG4gICAgICByZXR1cm4gUlsgMCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT4gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAoIGQgKSAtPlxuICAgICAgcmV0dXJuIHlpZWxkIGQgaWYgQGlzX2VtcHR5XG4gICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCAnKGpldHN0cmVhbSknLCAoIGQgKSAtPiB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbi53YWxrIGRcbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT4gb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7Z2ZuLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgbGFzdCAgaWYgaGFzX2xhc3RcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgQ0ZHLCB0eXBlX29mLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
