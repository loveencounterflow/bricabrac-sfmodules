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
        get_first(...P) {
          var R;
          R = [...(this.walk(...P))];
          if (R.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___3 no results");
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
              throw new Error("Ωjstrm___5 no results");
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
            null;
          }
          //.....................................................................................................
          while (this.shelf.length > 0) {
            yield* this.transforms[0](this.shelf.shift());
          }
          //.....................................................................................................
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
              throw new Error(`Ωjstrm___6 expected a jetstream or a synchronous function or generator function, got a ${type}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxzQkFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QixFQUZGOzs7SUFPRSxPQUFBLEdBQTBCLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQ7SUFDMUIsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUSxRQUFWO01BQW9CLElBQUEsRUFBTSxLQUExQjtNQUFpQyxRQUFBLEVBQVU7SUFBM0Ms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QUE7ZUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosS0FBc0I7TUFBekIsQ0FBNUI7Ozs7a0JBeEhKOztJQThPRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUN4QixPQUR3QixFQUV4QixNQUZ3QixFQUd4QixzQkFId0IsRUFJeEIsUUFKd0IsRUFLeEIsb0JBTHdCLEVBTXhCLG1CQU53QixFQU94QixpQkFQd0IsRUFReEIsY0FSd0IsQ0FBZDtBQVNaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLFNBQWI7RUF4UEMsRUFUcEI7Ozs7O0VBdVFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7V0FBRyxDQUFFLGlCQUFGO0VBQUgsQ0FBQSxHQUFqQztBQXZRQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSAgPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xuICB0eXBlX29mICAgICAgICAgICAgICAgICA9ICggeCApIC0+IGlmICggeCBpbnN0YW5jZW9mIEpldHN0cmVhbSApIHRoZW4gJ2pldHN0cmVhbScgZWxzZSBfdHlwZV9vZiB4XG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUgID0geyBvdXRsZXQ6ICdkYXRhIyonLCBwaWNrOiAnYWxsJywgZmFsbGJhY2s6IG1pc2ZpdCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VsZWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgICAgeyBzZWxlY3RvcnNfcnByLFxuICAgICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgICBAc2VsZWN0b3JzX3JwciAgPSBzZWxlY3RvcnNfcnByXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBpZiBzZWxlY3RvcnMuc2l6ZSBpcyAwIHRoZW4gdHJ1ZSBlbHNlIGZhbHNlXG4gICAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgICAgZm9yIHNlbGVjdG9yIGZyb20gc2VsZWN0b3JzXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2N1ZSMqJyB0aGVuIEBjdWVzID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eZGF0YSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMSBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkLCBnb3QgI3tzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eY3VlIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgICBAY3Vlcy5hZGQgbWF0Y2guZ3JvdXBzLmlkXG4gICAgICAgICAgZWxzZSBudWxsXG4gICAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9leGNlcnB0OiAtPiB7IGRhdGE6IEBkYXRhLCBjdWVzOiBAY3VlcywgYWNjZXB0X2FsbDogQGFjY2VwdF9hbGwsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgICAgcmV0dXJuIHRydWUgaWYgQGFjY2VwdF9hbGxcbiAgICAgIGlmIGlzX2N1ZSA9ICggdHlwZW9mIGl0ZW0gKSBpcyAnc3ltYm9sJ1xuICAgICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlICBpZiBAY3VlcyBpcyBmYWxzZVxuICAgICAgICByZXR1cm4gQGN1ZXMuaGFzIGlkX2Zyb21fc3ltYm9sIGl0ZW1cbiAgICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgICAgcmV0dXJuIGZhbHNlICBpZiBAZGF0YSBpcyBmYWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzIgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCBpbiBzZWxlY3RvciAje3JwciBAdG9TdHJpbmd9XCJcbiAgICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHNob3VsZCBwcm92aWRlIG1ldGhvZCB0byBnZW5lcmF0ZSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uICMjI1xuICAgIHRvU3RyaW5nOiAtPiBAc2VsZWN0b3JzX3JwclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWRfZnJvbV9zeW1ib2wgPSAoIHN5bWJvbCApIC0+IFIgPSBTdHJpbmcgc3ltYm9sOyAoIFIgKVsgNyAuLi4gUi5sZW5ndGggLSAxIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuZmxhdCBJbmZpbml0eVxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gWyAnJywgXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDEgYW5kIHNlbGVjdG9yc1sgMCBdIGlzICcnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmpvaW4gJywnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnNwbGl0ICcsJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICByZXR1cm4gc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX25vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgc2VsZWN0b3JzICAgICA9IHNlbGVjdG9yc19hc19saXN0IHNlbGVjdG9ycy4uLlxuICAgIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gICAgUiAgICAgICAgICAgICA9IG5ldyBTZXQoKVxuICAgIGZvciBzZWxlY3RvciBpbiBzZWxlY3RvcnNcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJycgICAgICAgICAgICAgdGhlbiBudWxsXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyonICAgICAgICAgICAgdGhlbiBSLmFkZCBcImRhdGEjKlwiOyBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cblxuICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyAkID0gKCBjZmcsIGdmbiApIC0+XG4gICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICMgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICMgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAjICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbicgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfI3tnZm4ubmFtZX1cIiwgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLmNhbGwgQCwgZFxuICAjICAgUltDRkddID0gY2ZnXG4gICMgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBAJDogJFxuICAgICMgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjb25maWd1cmUgY2ZnXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZTogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgICBAb3V0bGV0ID0gbmV3IFNlbGVjdG9yIEBjZmcub3V0bGV0XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNlbmQ6ICggZHMuLi4gKSAtPiBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGN1ZTogKCBuYW1lcyApIC0+IEBzZW5kICggU3ltYm9sIG5hbWUgZm9yIG5hbWUgaW4gbmFtZXMgKS4uLiA7bnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBnZXRfZmlyc3Q6ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMyBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0IDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2xhc3Q6ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNCBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0IC0xXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT5cbiAgICAgIFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdXG4gICAgICByZXR1cm4gUiB1bmxlc3MgQGNmZy5waWNrIGluIFsgJ2ZpcnN0JywgJ2xhc3QnLCBdXG4gICAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX181IG5vIHJlc3VsdHNcIiBpZiBAY2ZnLmZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgICAgcmV0dXJuIFIuYXQgIDAgaWYgQGNmZy5waWNrIGlzICdmaXJzdCdcbiAgICAgIHJldHVybiBSLmF0IC0xXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfMSgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF93YWxrXzE6IC0+XG4gICAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICAgIGNvdW50ICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHZhbHVlIGZyb20gQF93YWxrXzIoKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF93YWxrXzI6IC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmIEBpc19lbXB0eVxuICAgICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICAgIHlpZWxkIEBzaGVsZi5zaGlmdCgpXG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25maWd1cmVfdHJhbnNmb3JtOiAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT4gKCBAX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm0gKS50Zm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NvbmZpZ3VyZV90cmFuc2Zvcm06ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgc2VsZWN0b3IgICAgICA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzYgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4geyB0Zm0sIG9yaWdpbmFsX3RmbSwgdHlwZSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICAgIHRmbSAgICAgICAgID0gQGNvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgICAgICAgICAgICAgICkgZm9yIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkXG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIHR5cGVfb2YsXG4gICAgbWlzZml0LFxuICAgIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX3N5bWJvbCwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cbiAgIyByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCAkLCBpbnRlcm5hbHMsIH1cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgZG8gPT4geyByZXF1aXJlX2pldHN0cmVhbSwgfVxuIl19
