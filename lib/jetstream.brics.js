(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Jetstream, Selector, _normalize_selectors, _type_of, exports, hide, id_from_symbol, internals, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
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
    Selector = class Selector {
      constructor(...selectors) {
        var match, ref, selector, selectors_rpr;
        ({selectors_rpr, selectors} = _normalize_selectors(...selectors));
        this.selectors_rpr = selectors_rpr;
        this.data = true;
        this.cues = false;
        for (selector of selectors) {
          switch (true) {
            case selector === 'data#*':
              this.data = true;
              break;
            case selector === 'cue#*':
              this.cues = true;
              break;
            case (match = selector.match(/^data#(?<id>.+)$/)) != null:
              /* TAINT mention original selector next to normalized form */
              throw new Error(`Ωjstrm_188 IDs on data items not supported, got ${selector}`);
            case (match = selector.match(/^cue#(?<id>.+)$/)) != null:
              if ((ref = this.cues) === true || ref === false) {
                this.cues = new Set();
              }
              this.cues.add(match.groups.id);
              break;
            default:
              null;
          }
        }
        this.accept_all = (this.data === true) && (this.cues === true);
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      _get_excerpt() {
        return {
          data: this.data,
          cues: this.cues,
          accept_all: this.accept_all
        };
      }

      //-------------------------------------------------------------------------------------------------------
      select(item) {
        var is_cue;
        if (this.accept_all) {
          return true;
        }
        if (is_cue = (typeof item) === 'symbol') {
          if (this.cues === true) {
            return true;
          }
          if (this.cues === false) {
            return false;
          }
          return this.cues.has(id_from_symbol(item));
        }
        if (this.data === true) {
          return true;
        }
        if (this.data === false) {
          return false;
        }
        throw new Error(`Ωjstrm_189 IDs on data items not supported in selector ${rpr(this.toString)}`);
      }

      // return @data.has id_from_value item

        //-------------------------------------------------------------------------------------------------------
      /* TAINT should provide method to generate normalized representation */
      toString() {
        return this.selectors_rpr;
      }

    };
    //---------------------------------------------------------------------------------------------------------
    id_from_symbol = function(symbol) {
      var R;
      R = String(symbol);
      return R.slice(7, R.length - 1);
    };
    //---------------------------------------------------------------------------------------------------------
    selectors_as_list = function(...selectors) {
      if (selectors.length === 0) {
        return [];
      }
      selectors = selectors.flat(2e308);
      if (selectors.length === 0) {
        return [];
      }
      if (selectors.length === 1 && selectors[0] === '') {
        return [''];
      }
      selectors = selectors.join(',');
      selectors = selectors.replace(/\s+/g, '');
      selectors = selectors.split(',');
/* TAINT not generally possible */      return selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    normalize_selectors = function(...selectors) {
      return (_normalize_selectors(...selectors)).selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    _normalize_selectors = function(...selectors) {
      var R, i, len, selector, selectors_rpr;
      selectors = selectors_as_list(...selectors);
      selectors_rpr = selectors.join(', ');
      R = new Set();
      for (i = 0, len = selectors.length; i < len; i++) {
        selector = selectors[i];
        switch (true) {
          case selector === '':
            null;
            break;
          case selector === '#':
            R.add("cue#*");
            break;
          case /^#.+/.test(selector):
            R.add(`cue${selector}`);
            break;
          case /.+#$/.test(selector):
            R.add(`${selector}*`);
            break;
          case !/#/.test(selector):
            R.add(`${selector}#*`);
            break;
          default:
            R.add(selector);
        }
      }
      if (R.size === 0) {
        R.add('data#*');
      }
      if (R.size !== 1) {
        R.delete('');
      }
      return {
        selectors: R,
        selectors_rpr
      };
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
    internals = Object.freeze({CFG, type_of, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_symbol});
    return exports = {Jetstream, $, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQsRUFQWjs7SUFVUSxXQUFOLE1BQUEsU0FBQTtNQUNFLFdBQWEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUNqQixZQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsUUFBQSxFQUFB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QixFQUV4QixPQUZ3QixFQUd4QixRQUh3QixFQUl4QixvQkFKd0IsRUFLeEIsbUJBTHdCLEVBTXhCLGlCQU53QixFQU94QixjQVB3QixDQUFkO0FBUVosV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsQ0FBYixFQUFnQixTQUFoQjtFQXBMQyxFQVRwQjs7O0VBa01BLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7V0FBRyxDQUFFLGlCQUFGO0VBQUgsQ0FBQSxHQUFqQztBQWxNQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucmVxdWlyZV9qZXRzdHJlYW0gPSAtPlxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2Y6IF90eXBlX29mLCAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIENGRyAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ0NGRydcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHR5cGVfb2YgPSAoIHggKSAtPiBpZiAoIHggaW5zdGFuY2VvZiBKZXRzdHJlYW0gKSB0aGVuICdqZXRzdHJlYW0nIGVsc2UgX3R5cGVfb2YgeFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VsZWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgICAgeyBzZWxlY3RvcnNfcnByLFxuICAgICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgICBAc2VsZWN0b3JzX3JwciAgPSBzZWxlY3RvcnNfcnByXG4gICAgICBAZGF0YSAgICAgICAgICAgPSB0cnVlXG4gICAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgICAgZm9yIHNlbGVjdG9yIGZyb20gc2VsZWN0b3JzXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2N1ZSMqJyB0aGVuIEBjdWVzID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eZGF0YSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtXzE4OCBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkLCBnb3QgI3tzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eY3VlIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgICBAY3Vlcy5hZGQgbWF0Y2guZ3JvdXBzLmlkXG4gICAgICAgICAgZWxzZSBudWxsXG4gICAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9leGNlcnB0OiAtPiB7IGRhdGE6IEBkYXRhLCBjdWVzOiBAY3VlcywgYWNjZXB0X2FsbDogQGFjY2VwdF9hbGwsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgICAgcmV0dXJuIHRydWUgaWYgQGFjY2VwdF9hbGxcbiAgICAgIGlmIGlzX2N1ZSA9ICggdHlwZW9mIGl0ZW0gKSBpcyAnc3ltYm9sJ1xuICAgICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlICBpZiBAY3VlcyBpcyBmYWxzZVxuICAgICAgICByZXR1cm4gQGN1ZXMuaGFzIGlkX2Zyb21fc3ltYm9sIGl0ZW1cbiAgICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgICAgcmV0dXJuIGZhbHNlICBpZiBAZGF0YSBpcyBmYWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV8xODkgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCBpbiBzZWxlY3RvciAje3JwciBAdG9TdHJpbmd9XCJcbiAgICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHNob3VsZCBwcm92aWRlIG1ldGhvZCB0byBnZW5lcmF0ZSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uICMjI1xuICAgIHRvU3RyaW5nOiAtPiBAc2VsZWN0b3JzX3JwclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWRfZnJvbV9zeW1ib2wgPSAoIHN5bWJvbCApIC0+XG4gICAgUiA9IFN0cmluZyBzeW1ib2xcbiAgICByZXR1cm4gKCBSIClbIDcgLi4uIFIubGVuZ3RoIC0gMSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZWxlY3RvcnNfYXNfbGlzdCA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmZsYXQgSW5maW5pdHlcbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5qb2luICcsJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5yZXBsYWNlIC9cXHMrL2csICcnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgcmV0dXJuIHNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT4gKCBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi4gKS5zZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHNlbGVjdG9ycyAgICAgPSBzZWxlY3RvcnNfYXNfbGlzdCBzZWxlY3RvcnMuLi5cbiAgICBzZWxlY3RvcnNfcnByID0gc2VsZWN0b3JzLmpvaW4gJywgJ1xuICAgIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgICBmb3Igc2VsZWN0b3IgaW4gc2VsZWN0b3JzXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcjJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gL14jLisvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcImN1ZSN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgICAgd2hlbiBub3QgLyMvLnRlc3Qgc2VsZWN0b3IgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0jKlwiXG4gICAgICAgIGVsc2UgUi5hZGQgc2VsZWN0b3JcbiAgICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICAgIFIuZGVsZXRlICcnIGlmIFIuc2l6ZSBpc250IDFcbiAgICByZXR1cm4geyBzZWxlY3RvcnM6IFIsIHNlbGVjdG9yc19ycHIsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgJCA9ICggY2ZnLCBnZm4gKSAtPlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICAgICB3aGVuICdmdW5jdGlvbicgICAgICAgICAgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfKHdhdGNoZXIpXyN7Z2ZuLm5hbWV9XCIsICggZCApIC0+IGdmbi5jYWxsIEAsIGQ7IHlpZWxkIGRcbiAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJyB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8je2dmbi5uYW1lfVwiLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4uY2FsbCBALCBkXG4gICAgUltDRkddID0gY2ZnXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAJDogJFxuICAgICQ6ICAkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9maXJzdDogKCBQLi4uICkgLT5cbiAgICAgIGlmICggUiA9IEBydW4gUC4uLiApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIG5vIHJlc3VsdFwiXG4gICAgICByZXR1cm4gUlsgMCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT4gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAoIGQgKSAtPlxuICAgICAgcmV0dXJuIHlpZWxkIGQgaWYgQGlzX2VtcHR5XG4gICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCAnKGpldHN0cmVhbSknLCAoIGQgKSAtPiB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbi53YWxrIGRcbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT4gb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7Z2ZuLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgbGFzdCAgaWYgaGFzX2xhc3RcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICBDRkcsXG4gICAgdHlwZV9vZixcbiAgICBTZWxlY3RvcixcbiAgICBfbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIHNlbGVjdG9yc19hc19saXN0LFxuICAgIGlkX2Zyb21fc3ltYm9sLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
