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
        this.data = selectors.size === 0 ? true : false;
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
          this.shelf = [];
          return void 0;
        }

        //=======================================================================================================
        send(...ds) {
          this.shelf.splice(this.shelf.length, 0, ...ds);
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        cue(names) {
          var name;
          return this.send(...((function() {
            var i, len, results;
            results = [];
            for (i = 0, len = names.length; i < len; i++) {
              name = names[i];
              results.push(Symbol(name));
            }
            return results;
          })()));
        }

        //=======================================================================================================
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
        walk(...ds) {
          this.send(...ds);
          return this._walk();
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk() {
          if (this.is_empty) {
            while (this.shelf.length > 0) {
              yield this.shelf.shift();
            }
            return null;
          }
          //.....................................................................................................
          while (this.shelf.length > 0) {
            yield* this.transforms[0](this.shelf.shift());
          }
          return null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQsRUFQWjs7SUFVUSxXQUFOLE1BQUEsU0FBQTtNQUNFLFdBQWEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUNqQixZQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsUUFBQSxFQUFB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dCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB0eXBlX29mID0gKCB4ICkgLT4gaWYgKCB4IGluc3RhbmNlb2YgSmV0c3RyZWFtICkgdGhlbiAnamV0c3RyZWFtJyBlbHNlIF90eXBlX29mIHhcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV8xODggSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX3N5bWJvbCBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fMTg5IElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fc3ltYm9sID0gKCBzeW1ib2wgKSAtPlxuICAgIFIgPSBTdHJpbmcgc3ltYm9sXG4gICAgcmV0dXJuICggUiApWyA3IC4uLiBSLmxlbmd0aCAtIDEgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICQgPSAoIGNmZywgZ2ZuICkgLT5cbiAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICB3aGVuICdqZXRzdHJlYW0nICAgICAgICAgdGhlbiBSID0gbmFtZWl0ICcoY2ZnKV8oamV0c3RyZWFtKScsICAgICAgICAgICAoIGQgKSAtPiB5aWVsZCBmcm9tIGdmbi53YWxrLmNhbGwgQCwgZFxuICAgICAgd2hlbiAnZnVuY3Rpb24nICAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyh3YXRjaGVyKV8je2dmbi5uYW1lfVwiLCAoIGQgKSAtPiBnZm4uY2FsbCBALCBkOyB5aWVsZCBkXG4gICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbicgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfI3tnZm4ubmFtZX1cIiwgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLmNhbGwgQCwgZFxuICAgIFJbQ0ZHXSA9IGNmZ1xuICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQCQ6ICRcbiAgICAkOiAgJFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdsZW5ndGgnLCAgIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAdHJhbnNmb3Jtcy5sZW5ndGggaXMgMFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBzZW5kOiAoIGRzLi4uICkgLT5cbiAgICAgIEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGN1ZTogKCBuYW1lcyApIC0+IEBzZW5kICggU3ltYm9sIG5hbWUgZm9yIG5hbWUgaW4gbmFtZXMgKS4uLlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBnZXRfZmlyc3Q6ICggUC4uLiApIC0+XG4gICAgICBpZiAoIFIgPSBAcnVuIFAuLi4gKS5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMSBubyByZXN1bHRcIlxuICAgICAgcmV0dXJuIFJbIDAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBydW46ICggUC4uLiApIC0+IFsgKCBAd2FsayBQLi4uICkuLi4sIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogKCBkcy4uLiApIC0+XG4gICAgICBAc2VuZCBkcy4uLlxuICAgICAgcmV0dXJuIEBfd2FsaygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF93YWxrOiAtPlxuICAgICAgaWYgQGlzX2VtcHR5XG4gICAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgICAgeWllbGQgQHNoZWxmLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgICAgeWllbGQgZnJvbSBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIGdmbiApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCAnKGpldHN0cmVhbSknLCAoIGQgKSAtPiB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbi53YWxrIGRcbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT4gb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgIGZpcnN0ICAgICAgID0gbnVsbFxuICAgICAgbGFzdCAgICAgICAgPSBudWxsXG4gICAgICBoYXNfZmlyc3QgICA9IGZhbHNlXG4gICAgICBoYXNfbGFzdCAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBoYXNfZmlyc3QgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2ZpcnN0J1xuICAgICAgICBoYXNfbGFzdCAgICA9IFJlZmxlY3QuaGFzIGNmZywgJ2xhc3QnXG4gICAgICAgIGZpcnN0ICAgICAgID0gY2ZnLmZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICBsYXN0ICAgICAgICA9IGNmZy5sYXN0ICBpZiBoYXNfbGFzdFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7Z2ZuLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gbnh0IGogICkgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGZpcnN0IGlmIGhhc19maXJzdFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgbGFzdCAgaWYgaGFzX2xhc3RcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICBDRkcsXG4gICAgdHlwZV9vZixcbiAgICBTZWxlY3RvcixcbiAgICBfbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIHNlbGVjdG9yc19hc19saXN0LFxuICAgIGlkX2Zyb21fc3ltYm9sLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
