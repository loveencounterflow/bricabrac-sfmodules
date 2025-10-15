(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var Jetstream, Selector, _normalize_selectors, _type_of, exports, hide, id_from_symbol, internals, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
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
          this.send(...((function() {
            var i, len, results;
            results = [];
            for (i = 0, len = names.length; i < len; i++) {
              name = names[i];
              results.push(Symbol(name));
            }
            return results;
          })()));
          return null;
        }

        //=======================================================================================================
        _pick(picker, ...P) {
          var R;
          R = [...(this.walk(...P))];
          if (picker === 'all') {
            return R;
          }
          if (R.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___3 no results");
            }
            return this.cfg.fallback;
          }
          if (picker === 'first') {
            return R.at(0);
          }
          if (picker === 'last') {
            return R.at(-1);
          }
          throw new Error(`Ωjstrm___4 unknown picker ${picker}`);
        }

        //-------------------------------------------------------------------------------------------------------
        get_first(...P) {
          return this._pick('first', ...P);
        }

        get_last(...P) {
          return this._pick('last', ...P);
        }

        run(...P) {
          return this._pick(this.cfg.pick, ...P);
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk_and_pick();
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk_and_pick() {
          var count, previous, value;
          previous = misfit;
          count = 0;
//.....................................................................................................
          for (value of this._walk_all_to_exhaustion()) {
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
        * _walk_all_to_exhaustion() {
          if (this.is_empty) {
            while (this.shelf.length > 0) {
              yield this.shelf.shift();
            }
          } else {
            while (this.shelf.length > 0) {
              yield* this.transforms[0](this.shelf.shift());
            }
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        configure_transform(...selectors) {
          var ref, tfm;
          ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
          return (this._configure_transform(...selectors, tfm)).tfm;
        }

        //-------------------------------------------------------------------------------------------------------
        _configure_transform(...selectors) {
          var original_tfm, ref, selector, tfm, type;
          ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
          selector = new Selector(...selectors);
          original_tfm = tfm;
          //.....................................................................................................
          switch (type = type_of(tfm)) {
            //...................................................................................................
            case 'jetstream':
              tfm = nameit('(jetstream)', function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                yield* original_tfm.walk(d);
                return null;
              });
              break;
            //...................................................................................................
            case 'function':
              tfm = nameit(`(watcher)_${original_tfm.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                original_tfm(d);
                yield d;
                return null;
              });
              break;
            //...................................................................................................
            case 'generatorfunction':
              tfm = nameit(`(generator)_${original_tfm.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                yield* original_tfm(d);
                return null;
              });
              break;
            default:
              //...................................................................................................
              throw new Error(`Ωjstrm___5 expected a jetstream or a synchronous function or generator function, got a ${type}`);
          }
          //.....................................................................................................
          return {tfm, original_tfm, type};
        }

        //-------------------------------------------------------------------------------------------------------
        push(...selectors) {
          var R, my_idx, nxt, ref, tfm, yielder;
          ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
          tfm = this.configure_transform(...selectors, tfm);
          my_idx = this.transforms.length;
          //.....................................................................................................
          nxt = null;
          yielder = null;
          //.....................................................................................................
          R = nameit(`(managed)_${tfm.name}`, (function(me) {
            return function*(d) {
              if (nxt == null) {
                nxt = me.transforms[my_idx + 1];
                if (nxt != null) {
                  yielder = function*(d) {
                    var j;
                    for (j of tfm(d)) {
                      (yield* nxt(j));
                    }
                    return null;
                  };
                } else {
                  yielder = function*(d) {
                    var j;
                    for (j of tfm(d)) {
                      (me.outlet.select(j) ? (yield j) : void 0);
                    }
                    return null;
                  };
                }
              }
              yield* yielder(d);
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
    internals = Object.freeze({type_of, misfit, jetstream_cfg_template, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_symbol});
    return exports = {Jetstream, internals};
  };

  // return exports = { Jetstream, $, internals, }

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxzQkFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QixFQUZGOzs7SUFPRSxPQUFBLEdBQTBCLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQ7SUFDMUIsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUSxRQUFWO01BQW9CLElBQUEsRUFBTSxLQUExQjtNQUFpQyxRQUFBLEVBQVU7SUFBM0Ms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QUFyQixFQUFpQyxDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxpQkFBRjtFQUFILENBQUEsR0FBakM7QUFyUEEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgdHlwZV9vZiAgICAgICAgICAgICAgICAgPSAoIHggKSAtPiBpZiAoIHggaW5zdGFuY2VvZiBKZXRzdHJlYW0gKSB0aGVuICdqZXRzdHJlYW0nIGVsc2UgX3R5cGVfb2YgeFxuICBtaXNmaXQgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlICA9IHsgb3V0bGV0OiAnZGF0YSMqJywgcGljazogJ2FsbCcsIGZhbGxiYWNrOiBtaXNmaXQsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX3N5bWJvbCBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fc3ltYm9sID0gKCBzeW1ib2wgKSAtPiBSID0gU3RyaW5nIHN5bWJvbDsgKCBSIClbIDcgLi4uIFIubGVuZ3RoIC0gMSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZWxlY3RvcnNfYXNfbGlzdCA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmZsYXQgSW5maW5pdHlcbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5qb2luICcsJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5yZXBsYWNlIC9cXHMrL2csICcnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgcmV0dXJuIHNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT4gKCBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi4gKS5zZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHNlbGVjdG9ycyAgICAgPSBzZWxlY3RvcnNfYXNfbGlzdCBzZWxlY3RvcnMuLi5cbiAgICBzZWxlY3RvcnNfcnByID0gc2VsZWN0b3JzLmpvaW4gJywgJ1xuICAgIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgICBmb3Igc2VsZWN0b3IgaW4gc2VsZWN0b3JzXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcqJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJkYXRhIypcIjsgUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyMnICAgICAgICAgICAgdGhlbiBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgICB3aGVuIC8uKyMkLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSpcIlxuICAgICAgICB3aGVuIG5vdCAvIy8udGVzdCBzZWxlY3RvciAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSMqXCJcbiAgICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICAgIFIuYWRkICdkYXRhIyonIGlmIFIuc2l6ZSBpcyAwXG4gICAgUi5kZWxldGUgJycgaWYgUi5zaXplIGlzbnQgMVxuICAgIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG5cbiAgIyAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgJCA9ICggY2ZnLCBnZm4gKSAtPlxuICAjICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAjICAgICB3aGVuICdqZXRzdHJlYW0nICAgICAgICAgdGhlbiBSID0gbmFtZWl0ICcoY2ZnKV8oamV0c3RyZWFtKScsICAgICAgICAgICAoIGQgKSAtPiB5aWVsZCBmcm9tIGdmbi53YWxrLmNhbGwgQCwgZFxuICAjICAgICB3aGVuICdmdW5jdGlvbicgICAgICAgICAgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfKHdhdGNoZXIpXyN7Z2ZuLm5hbWV9XCIsICggZCApIC0+IGdmbi5jYWxsIEAsIGQ7IHlpZWxkIGRcbiAgIyAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyN7Z2ZuLm5hbWV9XCIsICAgICAgICAgICAoIGQgKSAtPiB5aWVsZCBmcm9tIGdmbi5jYWxsIEAsIGRcbiAgIyAgIFJbQ0ZHXSA9IGNmZ1xuICAjICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbVxuXG4gICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgQCQ6ICRcbiAgICAjICQ6ICAkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIE9iamVjdC5mcmVlemUsIHB1c2ggc2V0cyBuZXcgYXJyYXkgIyMjXG4gICAgICBAY29uZmlndXJlIGNmZ1xuICAgICAgQHRyYW5zZm9ybXMgPSBbXVxuICAgICAgQHNoZWxmICAgICAgPSBbXVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25maWd1cmU6ICggY2ZnICkgLT5cbiAgICAgIEBjZmcgICAgPSB7IGpldHN0cmVhbV9jZmdfdGVtcGxhdGUuLi4sIGNmZy4uLiwgfVxuICAgICAgQG91dGxldCA9IG5ldyBTZWxlY3RvciBAY2ZnLm91dGxldFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdsZW5ndGgnLCAgIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAdHJhbnNmb3Jtcy5sZW5ndGggaXMgMFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBzZW5kOiAoIGRzLi4uICkgLT4gQHNoZWxmLnNwbGljZSBAc2hlbGYubGVuZ3RoLCAwLCBkcy4uLiA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjdWU6ICggbmFtZXMgKSAtPiBAc2VuZCAoIFN5bWJvbCBuYW1lIGZvciBuYW1lIGluIG5hbWVzICkuLi4gO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3BpY2s6ICggcGlja2VyLCBQLi4uICkgLT5cbiAgICAgIFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdXG4gICAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAgMCBpZiBwaWNrZXIgaXMgJ2ZpcnN0J1xuICAgICAgcmV0dXJuIFIuYXQgLTEgaWYgcGlja2VyIGlzICdsYXN0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzQgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2ZpcnN0OiAgKCBQLi4uICkgLT4gQF9waWNrICdmaXJzdCcsICAgUC4uLlxuICAgIGdldF9sYXN0OiAgICggUC4uLiApIC0+IEBfcGljayAnbGFzdCcsICAgIFAuLi5cbiAgICBydW46ICAgICAgICAoIFAuLi4gKSAtPiBAX3BpY2sgQGNmZy5waWNrLCBQLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfYW5kX3BpY2soKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfd2Fsa19hbmRfcGljazogLT5cbiAgICAgIHByZXZpb3VzICA9IG1pc2ZpdFxuICAgICAgY291bnQgICAgID0gMFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgdmFsdWUgZnJvbSBAX3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24oKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF93YWxrX2FsbF90b19leGhhdXN0aW9uOiAtPlxuICAgICAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgeWllbGQgZnJvbSBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25maWd1cmVfdHJhbnNmb3JtOiAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT4gKCBAX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm0gKS50Zm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NvbmZpZ3VyZV90cmFuc2Zvcm06ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgc2VsZWN0b3IgICAgICA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzUgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4geyB0Zm0sIG9yaWdpbmFsX3RmbSwgdHlwZSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICAgIHRmbSAgICAgICAgID0gQGNvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgICAgICAgICAgICAgICkgZm9yIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIHR5cGVfb2YsXG4gICAgbWlzZml0LFxuICAgIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX3N5bWJvbCwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cbiAgIyByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCAkLCBpbnRlcm5hbHMsIH1cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgZG8gPT4geyByZXF1aXJlX2pldHN0cmVhbSwgfVxuIl19
