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
          var R, cfg, first, has_first, has_last, last, my_idx, nxt, original_gfn, type, yielder;
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
    return exports = {Jetstream, $, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_jetstream});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixNQUFBLENBQU8sS0FBUDtJQUM1QixTQUFBLEdBQTRCLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLENBQWQsRUFMOUI7O0lBUUUsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBLEVBQUE7O01BRUYsRUFBRSxDQUFDLEdBQUQsQ0FBRixHQUFVO0FBQ1YsYUFBTztJQUhMO0lBTUU7O01BQU4sTUFBQSxVQUFBLENBQUE7O1FBT0UsV0FBYSxDQUFBLENBQUEsRUFBQTs7VUFFWCxJQUFDLENBQUEsVUFBRCxHQUFjO0FBQ2QsaUJBQU87UUFISSxDQUxqQjs7O1FBZUksU0FBVyxDQUFBLEdBQUUsQ0FBRixDQUFBO0FBQ2Ys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QUE1QjtnQkFBQSxPQUFXLE9BQUEsQ0FBUSxLQUFSLEVBQVg7O2NBQ0EsT0FBVyxPQUFBLENBQVEsQ0FBUjtjQUNYLElBQTRCLFFBQTVCO2dCQUFBLE9BQVcsT0FBQSxDQUFRLElBQVIsRUFBWDtlQVBSOztBQVNRLHFCQUFPO1lBVjRDO1VBQWQsQ0FBQSxFQUFPLEtBQTFDLEVBMUJWOztVQXNDTSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxpQkFBTztRQXhDSDs7TUEvQlI7OztNQUdFLFNBQUMsQ0FBQSxDQUFELEdBQUk7OzBCQUNKLENBQUEsR0FBSTs7O01BU0osVUFBQSxDQUFXLFNBQUMsQ0FBQSxTQUFaLEVBQWdCLFFBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkE1Qko7O0FBd0ZFLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLENBQWIsRUFBZ0IsU0FBaEI7RUF6RkMsRUFUcEI7OztFQXVHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGlCQUFGLENBQTlCO0FBdkdBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnQ0ZHJ1xuICBpbnRlcm5hbHMgICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IENGRywgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgJCA9ICggY2ZnLCBmbiApIC0+XG4gICAgIyMjIFRBSU5UIGRvIG5vdCBjaGFuZ2Ugb3JpZ2luYWwgZnVuY3Rpb24gIyMjXG4gICAgZm5bQ0ZHXSA9IGNmZ1xuICAgIHJldHVybiBmblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEAkOiAkXG4gICAgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIE9iamVjdC5mcmVlemUsIHB1c2ggc2V0cyBuZXcgYXJyYXkgIyMjXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgaWYgKCBSID0gQHJ1biBQLi4uICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgbm8gcmVzdWx0XCJcbiAgICAgIHJldHVybiBSWyAwIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuOiAoIFAuLi4gKSAtPiBbICggQHdhbGsgUC4uLiApLi4uLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICAgICAgICggZCApIC0+XG4gICAgICByZXR1cm4geWllbGQgZCBpZiBAaXNfZW1wdHlcbiAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHB1c2g6ICggZ2ZuICkgLT5cbiAgICAgICMgaWYgZ2ZuIGluc3RhbmNlb2YgSmV0c3RyZWFtXG4gICAgICAjICAgZ2ZuID0gbmFtZWl0ICdqZXRzdHJlYW0nLCAoIGQgKSAtPiB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbiBkXG4gICAgICAjIGVsc2VcbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT4gb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIGV4cGVjdGVkIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgYSBzeW5jaHJvbm91cyBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgICAgZmlyc3QgICAgICAgPSBudWxsXG4gICAgICBsYXN0ICAgICAgICA9IG51bGxcbiAgICAgIGhhc19maXJzdCAgID0gZmFsc2VcbiAgICAgIGhhc19sYXN0ICAgID0gZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgKCBjZmcgPSBnZm5bIENGRyBdICk/XG4gICAgICAgIGhhc19maXJzdCAgID0gUmVmbGVjdC5oYXMgY2ZnLCAnZmlyc3QnXG4gICAgICAgIGhhc19sYXN0ICAgID0gUmVmbGVjdC5oYXMgY2ZnLCAnbGFzdCdcbiAgICAgICAgZmlyc3QgICAgICAgPSBjZmcuZmlyc3QgaWYgaGFzX2ZpcnN0XG4gICAgICAgIGxhc3QgICAgICAgID0gY2ZnLmxhc3QgIGlmIGhhc19sYXN0XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3tnZm4ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqICAgICAgICAgICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZmlyc3QgaWYgaGFzX2ZpcnN0XG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBsYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
