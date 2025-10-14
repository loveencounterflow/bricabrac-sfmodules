(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var CFG, Jetstream, Selector, _normalize_selectors, _type_of, exports, hide, id_from_symbol, internals, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
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
    misfit = Symbol('misfit');
    jetstream_cfg_template = {
      outlet: 'data#*',
      pick: 'all',
      fallback: misfit
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
          this.configure(cfg);
          this.transforms = [];
          this.shelf = [];
          return void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        configure(cfg) {
          this.cfg = {...jetstream_cfg_template, ...cfg};
          this.outlet = new Selector(this.cfg.outlet);
          return null;
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
          R = [...(this.walk(...P))];
          if (R.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___4 no results");
            }
            return this.cfg.fallback;
          }
          return R.at(0);
        }

        //-------------------------------------------------------------------------------------------------------
        get_last(...P) {
          var R;
          R = [...(this.walk(...P))];
          if (R.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___4 no results");
            }
            return this.cfg.fallback;
          }
          return R.at(-1);
        }

        //-------------------------------------------------------------------------------------------------------
        run(...P) {
          var R, ref;
          R = [...(this.walk(...P))];
          if ((ref = this.cfg.pick) !== 'first' && ref !== 'last') {
            return R;
          }
          if (R.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___4 no results");
            }
            return this.cfg.fallback;
          }
          if (this.cfg.pick === 'first') {
            return R.at(0);
          }
          return R.at(-1);
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk_1();
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk_1() {
          var count, previous, value;
          previous = misfit;
          count = 0;
//.....................................................................................................
          for (value of this._walk_2()) {
            count++;
            if ((count === 1) && (this.cfg.pick === 'first')) {
              yield value;
            } else if (this.cfg.pick === 'all') {
              yield value;
            }
            previous = value;
          }
          if ((this.cfg.pick === 'last') && (count > 0)) {
            //.....................................................................................................
            yield previous;
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk_2() {
          //.....................................................................................................
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
          //.....................................................................................................
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
    internals = Object.freeze({CFG, type_of, misfit, jetstream_cfg_template, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_symbol});
    return exports = {Jetstream, internals};
  };

  // return exports = { Jetstream, $, internals, }

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUI7SUFFQSxHQUFBLEdBQTRCLE1BQUEsQ0FBTyxLQUFQLEVBSjlCOzs7SUFRRSxPQUFBLEdBQTBCLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQ7SUFDMUIsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUSxRQUFWO01B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RUFNeEIsb0JBTndCLEVBT3hCLG1CQVB3QixFQVF4QixpQkFSd0IsRUFTeEIsY0FUd0IsQ0FBZDtBQVVaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLFNBQWI7RUF4UEMsRUFUcEI7Ozs7O0VBdVFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7V0FBRyxDQUFFLGlCQUFGO0VBQUgsQ0FBQSxHQUFqQztBQXZRQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucmVxdWlyZV9qZXRzdHJlYW0gPSAtPlxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2Y6IF90eXBlX29mLCAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIENGRyAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ0NGRydcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgdHlwZV9vZiAgICAgICAgICAgICAgICAgPSAoIHggKSAtPiBpZiAoIHggaW5zdGFuY2VvZiBKZXRzdHJlYW0gKSB0aGVuICdqZXRzdHJlYW0nIGVsc2UgX3R5cGVfb2YgeFxuICBtaXNmaXQgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlICA9IHsgb3V0bGV0OiAnZGF0YSMqJywgcGljazogJ2FsbCcsIGZhbGxiYWNrOiBtaXNmaXQsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX3N5bWJvbCBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fc3ltYm9sID0gKCBzeW1ib2wgKSAtPlxuICAgIFIgPSBTdHJpbmcgc3ltYm9sXG4gICAgcmV0dXJuICggUiApWyA3IC4uLiBSLmxlbmd0aCAtIDEgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcjJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gL14jLisvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcImN1ZSN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgICAgd2hlbiBub3QgLyMvLnRlc3Qgc2VsZWN0b3IgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0jKlwiXG4gICAgICAgIGVsc2UgUi5hZGQgc2VsZWN0b3JcbiAgICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICAgIFIuZGVsZXRlICcnIGlmIFIuc2l6ZSBpc250IDFcbiAgICByZXR1cm4geyBzZWxlY3RvcnM6IFIsIHNlbGVjdG9yc19ycHIsIH1cblxuXG4gICMgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjICQgPSAoIGNmZywgZ2ZuICkgLT5cbiAgIyAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBnZm5cbiAgIyAgICAgd2hlbiAnamV0c3RyZWFtJyAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCAnKGNmZylfKGpldHN0cmVhbSknLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4ud2Fsay5jYWxsIEAsIGRcbiAgIyAgICAgd2hlbiAnZnVuY3Rpb24nICAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyh3YXRjaGVyKV8je2dmbi5uYW1lfVwiLCAoIGQgKSAtPiBnZm4uY2FsbCBALCBkOyB5aWVsZCBkXG4gICMgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJyB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8je2dmbi5uYW1lfVwiLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4uY2FsbCBALCBkXG4gICMgICBSW0NGR10gPSBjZmdcbiAgIyAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW1cblxuICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIEAkOiAkXG4gICAgIyAkOiAgJFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQGNvbmZpZ3VyZSBjZmdcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgPSBuZXcgU2VsZWN0b3IgQGNmZy5vdXRsZXRcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+XG4gICAgICBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjdWU6ICggbmFtZXMgKSAtPiBAc2VuZCAoIFN5bWJvbCBuYW1lIGZvciBuYW1lIGluIG5hbWVzICkuLi5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgUiA9IFsgKCBAd2FsayBQLi4uICkuLi4sIF1cbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzQgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9sYXN0OiAoIFAuLi4gKSAtPlxuICAgICAgUiA9IFsgKCBAd2FsayBQLi4uICkuLi4sIF1cbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzQgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAtMVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBydW46ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgcmV0dXJuIFIgdW5sZXNzIEBjZmcucGljayBpbiBbICdmaXJzdCcsICdsYXN0JywgXVxuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNCBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0ICAwIGlmIEBjZmcucGljayBpcyAnZmlyc3QnXG4gICAgICByZXR1cm4gUi5hdCAtMVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAoIGRzLi4uICkgLT5cbiAgICAgIEBzZW5kIGRzLi4uXG4gICAgICByZXR1cm4gQF93YWxrXzEoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfd2Fsa18xOiAtPlxuICAgICAgcHJldmlvdXMgID0gbWlzZml0XG4gICAgICBjb3VudCAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB2YWx1ZSBmcm9tIEBfd2Fsa18yKClcbiAgICAgICAgY291bnQrK1xuICAgICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgZWxzZSBpZiBAY2ZnLnBpY2sgaXMgJ2FsbCdcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBwcmV2aW91cyA9IHZhbHVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfd2Fsa18yOiAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBAaXNfZW1wdHlcbiAgICAgICAgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgICAgICB5aWVsZCBAc2hlbGYuc2hpZnQoKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHVzaDogKCBzZWxlY3RvcnMuLi4sIGdmbiApIC0+XG4gICAgICBzZWxlY3RvciA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAgICAgICB3aGVuICdqZXRzdHJlYW0nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF9nZm4ud2FsayBkXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF9nZm4gZFxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX181IGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgKCBjZmcgPSBnZm5bIENGRyBdICk/XG4gICAgICAgIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je2dmbi5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tIG54dCBqICAgICAgICAgICAgICAgKSBmb3IgaiBmcm9tIGdmbiBkOyBudWxsXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqIGlmIG1lLm91dGxldC5zZWxlY3QgaiAgKSBmb3IgaiBmcm9tIGdmbiBkOyBudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICBDRkcsXG4gICAgdHlwZV9vZixcbiAgICBtaXNmaXQsXG4gICAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSxcbiAgICBTZWxlY3RvcixcbiAgICBfbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIHNlbGVjdG9yc19hc19saXN0LFxuICAgIGlkX2Zyb21fc3ltYm9sLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sIGludGVybmFscywgfVxuICAjIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sICQsIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
