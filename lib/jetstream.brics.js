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
            throw new Error("Ωjstrm___3 no result");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixNQUFBLENBQU8sS0FBUDtJQUM1QixTQUFBLEdBQTRCLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLENBQWQsRUFMOUI7O0lBUUUsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBLEVBQUE7O01BRUYsRUFBRSxDQUFDLEdBQUQsQ0FBRixHQUFVO0FBQ1YsYUFBTztJQUhMO0lBTUU7O01BQU4sTUFBQSxVQUFBLENBQUE7O1FBT0UsV0FBYSxDQUFBLENBQUEsRUFBQTs7VUFFWCxJQUFDLENBQUEsVUFBRCxHQUFjO0FBQ2QsaUJBQU87UUFISSxDQUxqQjs7O1FBZUksU0FBVyxDQUFBLEdBQUUsQ0FBRixDQUFBO0FBQ2Ys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LENBRGxCOztjQUVBLElBQXVCLFFBQXZCO2dCQUFBLE9BQVcsR0FBQSxDQUFJLElBQUosRUFBWDtlQVBSOztBQVNRLHFCQUFPO1lBVjZCO1VBQWQsQ0FBQSxFQUFPLEtBQTNCLEVBMUJWOztVQXNDTSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxpQkFBTztRQXhDSDs7TUEvQlI7OztNQUdFLFNBQUMsQ0FBQSxDQUFELEdBQUk7OzBCQUNKLENBQUEsR0FBSTs7O01BU0osVUFBQSxDQUFXLFNBQUMsQ0FBQSxTQUFaLEVBQWdCLFFBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkE1Qko7O0FBd0ZFLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLENBQWIsRUFBZ0IsU0FBaEI7RUF6RkMsRUFUcEI7OztFQXVHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGlCQUFGLENBQTlCO0FBdkdBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnQ0ZHJ1xuICBpbnRlcm5hbHMgICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IENGRywgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgJCA9ICggY2ZnLCBmbiApIC0+XG4gICAgIyMjIFRBSU5UIGRvIG5vdCBjaGFuZ2Ugb3JpZ2luYWwgZnVuY3Rpb24gIyMjXG4gICAgZm5bQ0ZHXSA9IGNmZ1xuICAgIHJldHVybiBmblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEAkOiAkXG4gICAgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIE9iamVjdC5mcmVlemUsIHB1c2ggc2V0cyBuZXcgYXJyYXkgIyMjXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgaWYgKCBSID0gQHJ1biBQLi4uICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgbm8gcmVzdWx0XCJcbiAgICAgIHJldHVybiBSWyAwIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuOiAoIFAuLi4gKSAtPiBbICggQHdhbGsgUC4uLiApLi4uLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICAgICAgICggZCApIC0+XG4gICAgICByZXR1cm4geWllbGQgZCBpZiBAaXNfZW1wdHlcbiAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHB1c2g6ICggZ2ZuICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGlmIGdmbiBpbnN0YW5jZW9mIEpldHN0cmVhbVxuICAgICAgICAgICAgZ2ZuID0gbmFtZWl0ICdqZXRzdHJlYW0nLCAoIGQgKSAtPiB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbiBkXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2ZuID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+IG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICAgIG51bGxcbiAgICAgICAgZWxzZSBcInRocm93IG5ldyBFcnJvciBleHBlY3QgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBhIHN5bmNocm9ub3VzIGdlbmVyYXRvciBmdW5jdGlvbiwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICBmaXJzdCAgICAgICA9IG51bGxcbiAgICAgIGxhc3QgICAgICAgID0gbnVsbFxuICAgICAgaGFzX2ZpcnN0ICAgPSBmYWxzZVxuICAgICAgaGFzX2xhc3QgICAgPSBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiAoIGNmZyA9IGdmblsgQ0ZHIF0gKT9cbiAgICAgICAgaGFzX2ZpcnN0ICAgPSBSZWZsZWN0LmhhcyBjZmcsICdmaXJzdCdcbiAgICAgICAgaGFzX2xhc3QgICAgPSBSZWZsZWN0LmhhcyBjZmcsICdsYXN0J1xuICAgICAgICBmaXJzdCAgICAgICA9IGNmZy5maXJzdCBpZiBoYXNfZmlyc3RcbiAgICAgICAgbGFzdCAgICAgICAgPSBjZmcubGFzdCAgaWYgaGFzX2xhc3RcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgICBoYXNfbnh0ICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUiA9IG5hbWVpdCBnZm4ubmFtZSwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCAgICAgICAgICAgICA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGhhc19ueHQgICAgICAgICA9IG54dD9cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIGdmbiBmaXJzdCBpZiBoYXNfZmlyc3RcbiAgICAgICAgaWYgaGFzX254dCAgdGhlbiAgKCB5aWVsZCBmcm9tIG54dCBqICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgKCB5aWVsZCBqICAgICAgICAgICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgeWllbGQgZnJvbSBnZm4gbGFzdCBpZiBoYXNfbGFzdFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
