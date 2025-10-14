(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var CFG, Jetstream, Selector, _normalize_selectors, _type_of, exports, hide, id_from_symbol, internals, jetstream_cfg_template, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    //=========================================================================================================
    /* TAINT use proper typing */
    type_of = function(x) {
      if (x instanceof Jetstream) {
        return 'jetstream';
      } else {
        return _type_of(x);
      }
    };
    jetstream_cfg_template = {
      outlet: 'data#*'
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
              throw new Error(`Ωjstrm___1 IDs on data items not supported, got ${selector}`);
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
        throw new Error(`Ωjstrm___2 IDs on data items not supported in selector ${rpr(this.toString)}`);
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
    Jetstream = (function() {
      // #=========================================================================================================
      // $ = ( cfg, gfn ) ->
      //   switch type = type_of gfn
      //     when 'jetstream'         then R = nameit '(cfg)_(jetstream)',           ( d ) -> yield from gfn.walk.call @, d
      //     when 'function'          then R = nameit "(cfg)_(watcher)_#{gfn.name}", ( d ) -> gfn.call @, d; yield d
      //     when 'generatorfunction' then R = nameit "(cfg)_#{gfn.name}",           ( d ) -> yield from gfn.call @, d
      //   R[CFG] = cfg
      //   return R

        //=========================================================================================================
      class Jetstream {
        // #-------------------------------------------------------------------------------------------------------
        // @$: $
        // $:  $

          //-------------------------------------------------------------------------------------------------------
        constructor(cfg) {
          /* TAINT use Object.freeze, push sets new array */
          this.cfg = {...jetstream_cfg_template, ...cfg};
          this.outlet = new Selector(this.cfg.outlet);
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
            throw new Error("Ωjstrm___3 no result");
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
        push(...selectors) {
          var R, cfg, gfn, my_idx, nxt, original_gfn, ref, selector, type, yielder;
          ref = selectors, [...selectors] = ref, [gfn] = splice.call(selectors, -1);
          selector = new Selector(...selectors);
          //.....................................................................................................
          switch (type = type_of(gfn)) {
            case 'jetstream':
              original_gfn = gfn;
              gfn = nameit('(jetstream)', function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                return (yield* original_gfn.walk(d));
              });
              break;
            case 'function':
              original_gfn = gfn;
              gfn = nameit(`(watcher)_${original_gfn.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                original_gfn(d);
                return (yield d);
              });
              break;
            case 'generatorfunction':
              original_gfn = gfn;
              gfn = nameit(`(generator)_${original_gfn.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                return (yield* original_gfn(d));
              });
              break;
            default:
              throw new Error(`Ωjstrm___5 expected a jetstream or a synchronous function or generator function, got a ${type}`);
          }
          //.....................................................................................................
          my_idx = this.transforms.length;
          //.....................................................................................................
          if ((cfg = gfn[CFG]) != null) {
            null;
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
                    var j;
                    for (j of gfn(d)) {
                      if (me.outlet.select(j)) {
                        yield j;
                      }
                    }
                    return null;
                  };
                }
              }
              yield* yielder(d);
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
    return exports = {Jetstream, internals};
  };

  // return exports = { Jetstream, $, internals, }

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7OztJQVFFLE9BQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsQ0FBQTtNQUFTLElBQUssQ0FBQSxZQUFhLFNBQWxCO2VBQW1DLFlBQW5DO09BQUEsTUFBQTtlQUFvRCxRQUFBLENBQVMsQ0FBVCxFQUFwRDs7SUFBVDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUTtJQUFWLEVBVDVCOztJQVlRLFdBQU4sTUFBQSxTQUFBO01BQ0UsV0FBYSxDQUFBLEdB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LFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkFwSEo7O0lBdU1FLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQ3hCLEdBRHdCLEVBRXhCLE9BRndCLEVBR3hCLFFBSHdCLEVBSXhCLG9CQUp3QixFQUt4QixtQkFMd0IsRUFNeEIsaUJBTndCLEVBT3hCLGNBUHdCLENBQWQ7QUFRWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxTQUFiO0VBaE5DLEVBVHBCOzs7OztFQStOQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUFpQyxDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxpQkFBRjtFQUFILENBQUEsR0FBakM7QUEvTkEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIHR5cGVfb2YgICAgICAgICAgICAgICAgID0gKCB4ICkgLT4gaWYgKCB4IGluc3RhbmNlb2YgSmV0c3RyZWFtICkgdGhlbiAnamV0c3RyZWFtJyBlbHNlIF90eXBlX29mIHhcbiAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX3N5bWJvbCBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fc3ltYm9sID0gKCBzeW1ib2wgKSAtPlxuICAgIFIgPSBTdHJpbmcgc3ltYm9sXG4gICAgcmV0dXJuICggUiApWyA3IC4uLiBSLmxlbmd0aCAtIDEgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cblxuICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyAkID0gKCBjZmcsIGdmbiApIC0+XG4gICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICMgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICMgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAjICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbicgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfI3tnZm4ubmFtZX1cIiwgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLmNhbGwgQCwgZFxuICAjICAgUltDRkddID0gY2ZnXG4gICMgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBAJDogJFxuICAgICMgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjZmcgICAgICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgICAgID0gbmV3IFNlbGVjdG9yIEBjZmcub3V0bGV0XG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+XG4gICAgICBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjdWU6ICggbmFtZXMgKSAtPiBAc2VuZCAoIFN5bWJvbCBuYW1lIGZvciBuYW1lIGluIG5hbWVzICkuLi5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgaWYgKCBSID0gQHJ1biBQLi4uICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgbm8gcmVzdWx0XCJcbiAgICAgIHJldHVybiBSWyAwIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuOiAoIFAuLi4gKSAtPiBbICggQHdhbGsgUC4uLiApLi4uLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGsoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfd2FsazogLT5cbiAgICAgIGlmIEBpc19lbXB0eVxuICAgICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICAgIHlpZWxkIEBzaGVsZi5zaGlmdCgpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHVzaDogKCBzZWxlY3RvcnMuLi4sIGdmbiApIC0+XG4gICAgICBzZWxlY3RvciA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAgICAgICB3aGVuICdqZXRzdHJlYW0nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF9nZm4ud2FsayBkXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF9nZm4gZFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX181IGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgKCBjZmcgPSBnZm5bIENGRyBdICk/XG4gICAgICAgIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je2dmbi5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tIG54dCBqICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT5cbiAgICAgICAgICAgICAgZm9yIGogZnJvbSBnZm4gZFxuICAgICAgICAgICAgICAgIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqXG4gICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICBDRkcsXG4gICAgdHlwZV9vZixcbiAgICBTZWxlY3RvcixcbiAgICBfbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIHNlbGVjdG9yc19hc19saXN0LFxuICAgIGlkX2Zyb21fc3ltYm9sLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sIGludGVybmFscywgfVxuICAjIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
