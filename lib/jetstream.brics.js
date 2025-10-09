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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUI7SUFFQSxHQUFBLEdBQTRCLE1BQUEsQ0FBTyxLQUFQLEVBSjlCOztJQU9FLE9BQUEsR0FBVSxRQUFBLENBQUUsQ0FBRixDQUFBO01BQVMsSUFBSyxDQUFBLFlBQWEsU0FBbEI7ZUFBbUMsWUFBbkM7T0FBQSxNQUFBO2VBQW9ELFFBQUEsQ0FBUyxDQUFULEVBQXBEOztJQUFULEVBUFo7O0lBVUUsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sR0FBUCxDQUFBO0FBQ04sVUFBQSxDQUFBLEVBQUE7QUFBSSxjQUFPLElBQUEsR0FBTyxPQUFBLENBQVEsR0FBUixDQUFkO0FBQUEsYUFDTyxXQURQO1VBQ2dDLENBQUEsR0FBSSxNQUFBLENB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LFFBQTVCO2dCQUFBLE9BQVcsT0FBQSxDQUFRLElBQVIsRUFBWDtlQVBSOztBQVNRLHFCQUFPO1lBVjRDO1VBQWQsQ0FBQSxFQUFPLEtBQTFDLEVBMUJWOztVQXNDTSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxpQkFBTztRQXhDSDs7TUEvQlI7OztNQUdFLFNBQUMsQ0FBQSxDQUFELEdBQUk7OzBCQUNKLENBQUEsR0FBSTs7O01BU0osVUFBQSxDQUFXLFNBQUMsQ0FBQSxTQUFaLEVBQWdCLFFBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkFqQ0o7O0lBNkZFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBZDtBQUNaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLENBQWIsRUFBZ0IsU0FBaEI7RUEvRkMsRUFUcEI7OztFQTZHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGlCQUFGLENBQTlCO0FBN0dBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnQ0ZHJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdHlwZV9vZiA9ICggeCApIC0+IGlmICggeCBpbnN0YW5jZW9mIEpldHN0cmVhbSApIHRoZW4gJ2pldHN0cmVhbScgZWxzZSBfdHlwZV9vZiB4XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAkID0gKCBjZmcsIGdmbiApIC0+XG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAgICAgd2hlbiAnamV0c3RyZWFtJyAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCAnKGNmZylfKGpldHN0cmVhbSknLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4ud2Fsay5jYWxsIEAsIGRcbiAgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyN7Z2ZuLm5hbWV9XCIsICAgICAgICAgICAoIGQgKSAtPiB5aWVsZCBmcm9tIGdmbi5jYWxsIEAsIGRcbiAgICBSW0NGR10gPSBjZmdcbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEAkOiAkXG4gICAgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIE9iamVjdC5mcmVlemUsIHB1c2ggc2V0cyBuZXcgYXJyYXkgIyMjXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgaWYgKCBSID0gQHJ1biBQLi4uICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgbm8gcmVzdWx0XCJcbiAgICAgIHJldHVybiBSWyAwIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuOiAoIFAuLi4gKSAtPiBbICggQHdhbGsgUC4uLiApLi4uLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICAgICAgICggZCApIC0+XG4gICAgICByZXR1cm4geWllbGQgZCBpZiBAaXNfZW1wdHlcbiAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHB1c2g6ICggZ2ZuICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgICAgd2hlbiAnamV0c3RyZWFtJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0ICcoamV0c3RyZWFtKScsICggZCApIC0+IHlpZWxkIGZyb20gb3JpZ2luYWxfZ2ZuLndhbGsgZFxuICAgICAgICB3aGVuICdmdW5jdGlvbidcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX2dmbi5uYW1lfVwiLCAoIGQgKSAtPiBvcmlnaW5hbF9nZm4gZDsgeWllbGQgZFxuICAgICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgICBudWxsXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzIgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgICAgZmlyc3QgICAgICAgPSBudWxsXG4gICAgICBsYXN0ICAgICAgICA9IG51bGxcbiAgICAgIGhhc19maXJzdCAgID0gZmFsc2VcbiAgICAgIGhhc19sYXN0ICAgID0gZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgKCBjZmcgPSBnZm5bIENGRyBdICk/XG4gICAgICAgIGhhc19maXJzdCAgID0gUmVmbGVjdC5oYXMgY2ZnLCAnZmlyc3QnXG4gICAgICAgIGhhc19sYXN0ICAgID0gUmVmbGVjdC5oYXMgY2ZnLCAnbGFzdCdcbiAgICAgICAgZmlyc3QgICAgICAgPSBjZmcuZmlyc3QgaWYgaGFzX2ZpcnN0XG4gICAgICAgIGxhc3QgICAgICAgID0gY2ZnLmxhc3QgIGlmIGhhc19sYXN0XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3tnZm4ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqICAgICAgICAgICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZmlyc3QgaWYgaGFzX2ZpcnN0XG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBsYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBDRkcsIHR5cGVfb2YsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
