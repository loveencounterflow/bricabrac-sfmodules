(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Pipeline, hide, nameit, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    //=========================================================================================================
    $ = function(cfg, fn) {
      fn[CFG] = cfg;
      return fn;
    };
    Pipeline = (function() {
      //=========================================================================================================
      class Pipeline {
        //-------------------------------------------------------------------------------------------------------
        constructor() {
          var callable, me;
          /* TAINT use Object.freeze, push sets new array */
          this.transforms = [];
          me = this;
          callable = function*(d) {
            return (yield* (me.is_empty ? [d] : me.transforms[0](d)));
          };
          Object.setPrototypeOf(callable, this);
          return callable;
        }

        //-------------------------------------------------------------------------------------------------------
        push(gfn) {
          var R, cfg, first, has_first, has_last, has_nxt, last, my_idx, nxt, original_gfn, type;
          switch (type = type_of(gfn)) {
            case 'function':
              original_gfn = gfn;
              if (gfn instanceof Pipeline) {
                gfn = function*(d) {
                  return (yield* original_gfn(d));
                };
              } else {
                gfn = function*(d) {
                  original_gfn(d);
                  return (yield d);
                };
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
      Pipeline.$ = $;

      Pipeline.prototype.$ = $;

      //-------------------------------------------------------------------------------------------------------
      set_getter(Pipeline.prototype, 'length', function() {
        return this.transforms.length;
      });

      set_getter(Pipeline.prototype, 'is_empty', function() {
        return this.transforms.length === 0;
      });

      return Pipeline;

    }).call(this);
    (function() {      //.........................................................................................................
      var add_2, d, ex, first, last, p, upper, watch;
      first = Symbol('(first)');
      last = Symbol('(last)');
      p = new Pipeline();
      p.push(upper = function*(d) {
        return (yield d.toUpperCase());
      });
      p.push(ex = function*(d, mark = '!') {
        return (yield d + mark);
      });
      // p.push nothing  = ( d              ) -> urge 'Ωap___6', 'nothing:', rpr d; yield return null
      // p.push add      = ( d              ) -> urge 'Ωap___7', 'add:    ', rpr d; yield """Let's say: \""""; yield d; yield '".'
      p.push(watch = function(d) {
        return help('Ωap___8', rpr(d));
      });
      p.push($({first, last}, add_2 = function*(d) {
        if (d === first) {
          // urge 'Ωap___9', 'add_2:    ', rpr d
          return (yield `Let's say: \"`);
        }
        if (d === last) {
          return (yield '".');
        }
        return (yield d);
      }));
      p.push(watch = function(d) {
        return urge('Ωap__10', rpr(d));
      });
      //.......................................................................................................
      debug('Ωap__11', p);
      info('Ωap__12', [
        ...((function() {
          var results;
          results = [];
          for (d of p('hidey-ho')) {
            results.push(d);
          }
          return results;
        })())
      ]);
      info('Ωap__13', [
        ...((function() {
          var results;
          results = [];
          for (d of p('hidey-ho')) {
            results.push(d);
          }
          return results;
        })())
      ].join(''));
      info('Ωap__14', [
        ...((function() {
          var results;
          results = [];
          for (d of p('hidey-ho')) {
            results.push(d);
          }
          return results;
        })())
      ].join(''));
      return null;
    })();
    (function() {      //.........................................................................................................
      var collector, d, p_1, p_2, p_3;
      /* empty pipeline is a pipeline without transforms, so data is passed through untransformed: */
      debug('Ωap__15', type_of(new Pipeline()));
      debug('Ωap__16', type_of((new Pipeline())('data')));
      debug('Ωap__17', [...((new Pipeline())('data'))]);
      collector = [];
      //.......................................................................................................
      p_1 = new Pipeline();
      p_1.push(function*(d) {
        collector.push('p1-t1');
        return (yield d + ' № 1');
      });
      p_1.push(function*(d) {
        collector.push('p1-t2');
        return (yield d + ' № 2');
      });
      //.......................................................................................................
      p_2 = new Pipeline();
      p_2.push(function*(d) {
        collector.push('p2-t1');
        return (yield d + ' № 3');
      });
      p_2.push(p_1);
      p_2.push(function*(d) {
        collector.push('p2-t2');
        return (yield d + ' № 4');
      });
      //.......................................................................................................
      p_3 = new Pipeline();
      p_3.push(function*(d) {
        collector.push('p3-t1');
        return (yield d + ' № 5');
      });
      p_3.push(p_2);
      p_3.push(function*(d) {
        collector.push('p3-t2');
        return (yield d + ' № 6');
      });
      for (d of p_3('my-data')) {
        info('Ωap__18', d);
      }
      return help('Ωap__19', collector);
    })();
    //.........................................................................................................
    return null;
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_jetstream});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxRQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7O0lBT0UsQ0FBQSxHQUFJLFFBQUEsQ0FBRSxHQUFGLEVBQU8sRUFBUCxDQUFBO01BQ0YsRUFBRSxDQUFDLEdBQUQsQ0FBRixHQUFVO0FBQ1YsYUFBTztJQUZMO0lBS0U7O01BQU4sTUFBQSxTQUFBLENBQUE7O1FBT0UsV0FBYSxDQUFBLENBQUE7QUFDakIsY0FBQSxRQUFBLEVBQUEsRUFBQTs7VUFDTSxJQUFDLENBQUEsVUFBRCxHQUFjO1VBQ2QsRUFBQSxHQUFjO1VBQ2QsUUFBQSxHQUFjLFNBQUEsQ0FBRSxDQUFGLENBQUE7bUJBQVMsQ0FBQSxPQUFXLENBQUcsRUFBRSxDQUFDLFFBQU4sR0FBb0IsQ0FBRSxDQUFGLENBQXBCLEdBQWdDLEVB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QUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLENBQUUsaUJBQUYsQ0FBOUI7QUF2SUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAkID0gKCBjZmcsIGZuICkgLT5cbiAgICBmbltDRkddID0gY2ZnXG4gICAgcmV0dXJuIGZuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBQaXBlbGluZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAJDogJFxuICAgICQ6ICAkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgbWUgICAgICAgICAgPSBAXG4gICAgICBjYWxsYWJsZSAgICA9ICggZCApIC0+IHlpZWxkIGZyb20gaWYgbWUuaXNfZW1wdHkgdGhlbiBbIGQsIF0gZWxzZSBtZS50cmFuc2Zvcm1zWyAwIF0gZFxuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mIGNhbGxhYmxlLCBAXG4gICAgICByZXR1cm4gY2FsbGFibGVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdsZW5ndGgnLCAgIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAdHJhbnNmb3Jtcy5sZW5ndGggaXMgMFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBpZiBnZm4gaW5zdGFuY2VvZiBQaXBlbGluZVxuICAgICAgICAgICAgZ2ZuICAgICAgICAgICA9ICggZCApIC0+IHlpZWxkIGZyb20gb3JpZ2luYWxfZ2ZuIGRcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBnZm4gICAgICAgICAgID0gKCBkICkgLT4gb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlIFwidGhyb3cgbmV3IEVycm9yIGV4cGVjdCBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGEgc3luY2hyb25vdXMgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIGhhc19ueHQgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IGdmbi5uYW1lLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ICAgICAgICAgICAgID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaGFzX254dCAgICAgICAgID0gbnh0P1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20gZ2ZuIGZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBpZiBoYXNfbnh0ICB0aGVuICAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICBlbHNlICAgICAgICAgICAgICAoIHlpZWxkIGogICAgICAgICAgICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICB5aWVsZCBmcm9tIGdmbiBsYXN0IGlmIGhhc19sYXN0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG5cbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBkbyAtPlxuICAgIGZpcnN0ICAgPSBTeW1ib2wgJyhmaXJzdCknXG4gICAgbGFzdCAgICA9IFN5bWJvbCAnKGxhc3QpJ1xuICAgIHAgICAgICAgPSBuZXcgUGlwZWxpbmUoKVxuICAgIHAucHVzaCB1cHBlciAgICA9ICggZCAgICAgICAgICAgICAgKSAtPiB5aWVsZCBkLnRvVXBwZXJDYXNlKClcbiAgICBwLnB1c2ggZXggICAgICAgPSAoIGQsIG1hcmsgPSAnIScgICkgLT4geWllbGQgZCArIG1hcmtcbiAgICAjIHAucHVzaCBub3RoaW5nICA9ICggZCAgICAgICAgICAgICAgKSAtPiB1cmdlICfOqWFwX19fNicsICdub3RoaW5nOicsIHJwciBkOyB5aWVsZCByZXR1cm4gbnVsbFxuICAgICMgcC5wdXNoIGFkZCAgICAgID0gKCBkICAgICAgICAgICAgICApIC0+IHVyZ2UgJ86pYXBfX183JywgJ2FkZDogICAgJywgcnByIGQ7IHlpZWxkIFwiXCJcIkxldCdzIHNheTogXFxcIlwiXCJcIjsgeWllbGQgZDsgeWllbGQgJ1wiLidcbiAgICBwLnB1c2ggd2F0Y2ggPSAoIGQgKSAtPiBoZWxwICfOqWFwX19fOCcsIHJwciBkXG4gICAgcC5wdXNoICQgeyBmaXJzdCwgbGFzdCwgfSwgYWRkXzIgPSAoIGQgKSAtPlxuICAgICAgIyB1cmdlICfOqWFwX19fOScsICdhZGRfMjogICAgJywgcnByIGRcbiAgICAgIHJldHVybiB5aWVsZCBcIlwiXCJMZXQncyBzYXk6IFxcXCJcIlwiXCIgIGlmIGQgaXMgZmlyc3RcbiAgICAgIHJldHVybiB5aWVsZCAnXCIuJyAgICAgICAgICAgICAgICAgaWYgZCBpcyBsYXN0XG4gICAgICB5aWVsZCBkXG4gICAgcC5wdXNoIHdhdGNoID0gKCBkICkgLT4gdXJnZSAnzqlhcF9fMTAnLCBycHIgZFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGVidWcgJ86pYXBfXzExJywgcFxuICAgIGluZm8gJ86pYXBfXzEyJywgWyAoIGQgZm9yIGQgZnJvbSBwICdoaWRleS1obycgKS4uLiwgXVxuICAgIGluZm8gJ86pYXBfXzEzJywgWyAoIGQgZm9yIGQgZnJvbSBwICdoaWRleS1obycgKS4uLiwgXS5qb2luICcnXG4gICAgaW5mbyAnzqlhcF9fMTQnLCBbICggZCBmb3IgZCBmcm9tIHAgJ2hpZGV5LWhvJyApLi4uLCBdLmpvaW4gJydcbiAgICByZXR1cm4gbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGRvIC0+XG4gICAgIyMjIGVtcHR5IHBpcGVsaW5lIGlzIGEgcGlwZWxpbmUgd2l0aG91dCB0cmFuc2Zvcm1zLCBzbyBkYXRhIGlzIHBhc3NlZCB0aHJvdWdoIHVudHJhbnNmb3JtZWQ6ICMjI1xuICAgIGRlYnVnICfOqWFwX18xNScsIHR5cGVfb2YgKCBuZXcgUGlwZWxpbmUoKSApXG4gICAgZGVidWcgJ86pYXBfXzE2JywgdHlwZV9vZiAoIG5ldyBQaXBlbGluZSgpICkgJ2RhdGEnXG4gICAgZGVidWcgJ86pYXBfXzE3JywgWyAoICggbmV3IFBpcGVsaW5lKCkgKSAnZGF0YScgKS4uLiwgXVxuICAgIGNvbGxlY3RvciA9IFtdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwXzEgPSBuZXcgUGlwZWxpbmUoKVxuICAgIHBfMS5wdXNoICggZCApIC0+IGNvbGxlY3Rvci5wdXNoICdwMS10MSc7IHlpZWxkIGQgKyAnIOKEliAxJ1xuICAgIHBfMS5wdXNoICggZCApIC0+IGNvbGxlY3Rvci5wdXNoICdwMS10Mic7IHlpZWxkIGQgKyAnIOKEliAyJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcF8yID0gbmV3IFBpcGVsaW5lKClcbiAgICBwXzIucHVzaCAoIGQgKSAtPiBjb2xsZWN0b3IucHVzaCAncDItdDEnOyB5aWVsZCBkICsgJyDihJYgMydcbiAgICBwXzIucHVzaCBwXzFcbiAgICBwXzIucHVzaCAoIGQgKSAtPiBjb2xsZWN0b3IucHVzaCAncDItdDInOyB5aWVsZCBkICsgJyDihJYgNCdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHBfMyA9IG5ldyBQaXBlbGluZSgpXG4gICAgcF8zLnB1c2ggKCBkICkgLT4gY29sbGVjdG9yLnB1c2ggJ3AzLXQxJzsgeWllbGQgZCArICcg4oSWIDUnXG4gICAgcF8zLnB1c2ggcF8yXG4gICAgcF8zLnB1c2ggKCBkICkgLT4gY29sbGVjdG9yLnB1c2ggJ3AzLXQyJzsgeWllbGQgZCArICcg4oSWIDYnXG4gICAgaW5mbyAnzqlhcF9fMTgnLCBkIGZvciBkIGZyb20gcF8zICdteS1kYXRhJ1xuICAgIGhlbHAgJ86pYXBfXzE5JywgY29sbGVjdG9yXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcmV0dXJuIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
