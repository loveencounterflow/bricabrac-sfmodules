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
          case selector === '*':
            R.add("data#*");
            R.add("cue#*");
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
          this.cfg = this.configure(cfg);
          this.transforms = [];
          this.shelf = [];
          return void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        configure(cfg) {
          var R;
          R = {...jetstream_cfg_template, ...cfg};
          this.outlet = new Selector(R.outlet);
          return R;
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
                    var j;
                    for (j of gfn(d)) {
                      (yield* nxt(j));
                    }
                    return null;
                  };
                } else {
                  yielder = function*(d) {
                    var j;
                    for (j of gfn(d)) {
                      (me.outlet.select(j) ? (yield j) : void 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7OztJQVFFLE9BQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsQ0FBQTtNQUFTLElBQUssQ0FBQSxZQUFhLFNBQWxCO2VBQW1DLFlBQW5DO09BQUEsTUFBQTtlQUFvRCxRQUFBLENBQVMsQ0FBVCxFQUFwRDs7SUFBVDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUTtJQUFWLEVBVDVCOztJQVlRLFdBQU4sTUFBQSxTQUFBO01BQ0UsV0FBYSxDQUFBLEdB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QUFBLENBQVEsQ0FBUixFQUxuQjs7QUFPUSxxQkFBTztZQVI0QztVQUFkLENBQUEsRUFBTyxLQUExQyxFQTVCVjs7VUFzQ00sSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsaUJBQU87UUF4Q0g7O01BMURSOzs7TUFxQkUsVUFBQSxDQUFXLFNBQUMsQ0FBQSxTQUFaLEVBQWdCLFFBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkExSEo7O0lBeU1FLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQ3hCLEdBRHdCLEVBRXhCLE9BRndCLEVBR3hCLFFBSHdCLEVBSXhCLG9CQUp3QixFQUt4QixtQkFMd0IsRUFNeEIsaUJBTndCLEVBT3hCLGNBUHdCLENBQWQ7QUFRWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxTQUFiO0VBbE5DLEVBVHBCOzs7OztFQWlPQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUFpQyxDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxpQkFBRjtFQUFILENBQUEsR0FBakM7QUFqT0EiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIHR5cGVfb2YgICAgICAgICAgICAgICAgID0gKCB4ICkgLT4gaWYgKCB4IGluc3RhbmNlb2YgSmV0c3RyZWFtICkgdGhlbiAnamV0c3RyZWFtJyBlbHNlIF90eXBlX29mIHhcbiAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX3N5bWJvbCBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fc3ltYm9sID0gKCBzeW1ib2wgKSAtPlxuICAgIFIgPSBTdHJpbmcgc3ltYm9sXG4gICAgcmV0dXJuICggUiApWyA3IC4uLiBSLmxlbmd0aCAtIDEgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcjJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gL14jLisvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcImN1ZSN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgICAgd2hlbiBub3QgLyMvLnRlc3Qgc2VsZWN0b3IgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0jKlwiXG4gICAgICAgIGVsc2UgUi5hZGQgc2VsZWN0b3JcbiAgICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICAgIFIuZGVsZXRlICcnIGlmIFIuc2l6ZSBpc250IDFcbiAgICByZXR1cm4geyBzZWxlY3RvcnM6IFIsIHNlbGVjdG9yc19ycHIsIH1cblxuXG4gICMgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjICQgPSAoIGNmZywgZ2ZuICkgLT5cbiAgIyAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgIyAgICAgd2hlbiAnamV0c3RyZWFtJyAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCAnKGNmZylfKGpldHN0cmVhbSknLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4ud2Fsay5jYWxsIEAsIGRcbiAgIyAgICAgd2hlbiAnZnVuY3Rpb24nICAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyh3YXRjaGVyKV8je2dmbi5uYW1lfVwiLCAoIGQgKSAtPiBnZm4uY2FsbCBALCBkOyB5aWVsZCBkXG4gICMgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJyB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8je2dmbi5uYW1lfVwiLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4uY2FsbCBALCBkXG4gICMgICBSW0NGR10gPSBjZmdcbiAgIyAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW1cblxuICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIEAkOiAkXG4gICAgIyAkOiAgJFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQGNmZyAgICAgICAgPSBAY29uZmlndXJlIGNmZ1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgQHNoZWxmICAgICAgPSBbXVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25maWd1cmU6ICggY2ZnICkgLT5cbiAgICAgIFIgICAgICAgICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgICAgID0gbmV3IFNlbGVjdG9yIFIub3V0bGV0XG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNlbmQ6ICggZHMuLi4gKSAtPlxuICAgICAgQHNoZWxmLnNwbGljZSBAc2hlbGYubGVuZ3RoLCAwLCBkcy4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3VlOiAoIG5hbWVzICkgLT4gQHNlbmQgKCBTeW1ib2wgbmFtZSBmb3IgbmFtZSBpbiBuYW1lcyApLi4uXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGdldF9maXJzdDogKCBQLi4uICkgLT5cbiAgICAgIGlmICggUiA9IEBydW4gUC4uLiApLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18zIG5vIHJlc3VsdFwiXG4gICAgICByZXR1cm4gUlsgMCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT4gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAoIGRzLi4uICkgLT5cbiAgICAgIEBzZW5kIGRzLi4uXG4gICAgICByZXR1cm4gQF93YWxrKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3dhbGs6IC0+XG4gICAgICBpZiBAaXNfZW1wdHlcbiAgICAgICAgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgICAgICB5aWVsZCBAc2hlbGYuc2hpZnQoKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHB1c2g6ICggc2VsZWN0b3JzLi4uLCBnZm4gKSAtPlxuICAgICAgc2VsZWN0b3IgPSBuZXcgU2VsZWN0b3Igc2VsZWN0b3JzLi4uXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgICAgICAgd2hlbiAnamV0c3RyZWFtJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0ICcoamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfZ2ZuLndhbGsgZFxuICAgICAgICB3aGVuICdmdW5jdGlvbidcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX2dmbi5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICBvcmlnaW5hbF9nZm4gZDsgeWllbGQgZFxuICAgICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfZ2ZuIGRcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNSBleHBlY3RlZCBhIGpldHN0cmVhbSBvciBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGdlbmVyYXRvciBmdW5jdGlvbiwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3tnZm4ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgICAgICAgICAgICAgICkgZm9yIGogZnJvbSBnZm4gZDsgbnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGogZnJvbSBnZm4gZDsgbnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7XG4gICAgQ0ZHLFxuICAgIHR5cGVfb2YsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX3N5bWJvbCwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cbiAgIyByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCAkLCBpbnRlcm5hbHMsIH1cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgZG8gPT4geyByZXF1aXJlX2pldHN0cmVhbSwgfVxuIl19
