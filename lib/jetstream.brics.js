(function() {
  'use strict';
  var ___, debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  ___ = null;

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
          return ___;
        }

        //=======================================================================================================
        send(...ds) {
          this.shelf.splice(this.shelf.length, 0, ...ds);
          return ___;
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
          return ___;
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
          return ___;
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk_2() {
          //.....................................................................................................
          if (this.is_empty) {
            while (this.shelf.length > 0) {
              yield this.shelf.shift();
            }
            ___;
          }
          //.....................................................................................................
          while (this.shelf.length > 0) {
            yield* this.transforms[0](this.shelf.shift());
          }
          //.....................................................................................................
          return ___;
        }

        //-------------------------------------------------------------------------------------------------------
        push(...selectors) {
          var R, cfg, gfn, my_idx, nxt, original_gfn, ref, selector, type, yielder;
          ref = selectors, [...selectors] = ref, [gfn] = splice.call(selectors, -1);
          selector = new Selector(...selectors);
          //.....................................................................................................
          switch (type = type_of(gfn)) {
            //...................................................................................................
            case 'jetstream':
              original_gfn = gfn;
              gfn = nameit('(jetstream)', function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                yield* original_gfn.walk(d);
                return ___;
              });
              break;
            //...................................................................................................
            case 'function':
              original_gfn = gfn;
              gfn = nameit(`(watcher)_${original_gfn.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                original_gfn(d);
                yield d;
                return ___;
              });
              break;
            //...................................................................................................
            case 'generatorfunction':
              original_gfn = gfn;
              gfn = nameit(`(generator)_${original_gfn.name}`, function*(d) {
                if (!selector.select(d)) {
                  return (yield d);
                }
                yield* original_gfn(d);
                return ___;
              });
              break;
            default:
              //...................................................................................................
              throw new Error(`Ωjstrm___6 expected a jetstream or a synchronous function or generator function, got a ${type}`);
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
                    return ___;
                  };
                } else {
                  yielder = function*(d) {
                    var j;
                    for (j of gfn(d)) {
                      (me.outlet.select(j) ? (yield j) : void 0);
                    }
                    return ___;
                  };
                }
              }
              yield* yielder(d);
              return ___;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsR0FBQSxFQUFBLEtBQUEsRUFBQSxpQkFBQTtJQUFBLGtCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZDs7RUFDQSxHQUFBLEdBQWMsS0FKZDs7Ozs7RUFVQSxpQkFBQSxHQUFvQixRQUFBLENBQUEsQ0FBQTtBQUNwQixRQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxzQkFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7OztJQVFFLE9BQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsQ0FBQTtNQUFTLElBQUssQ0FBQSxZQUFhLFNBQWxCO2VBQW1DLFlBQW5DO09BQUEsTUFBQTtlQUFvRCxRQUFBLENBQVMsQ0FBVCxFQUFwRDs7SUFBVDtJQUMxQixNQUFBLEdBQTBCLE1BQUEsQ0FBTyxRQUFQO0lBQzFCLHNCQUFBLEdB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d0IsRUFPeEIsbUJBUHdCLEVBUXhCLGlCQVJ3QixFQVN4QixjQVR3QixDQUFkO0FBVVosV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsU0FBYjtFQTFQQyxFQVZwQjs7Ozs7RUEwUUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBaUMsQ0FBQSxDQUFBLENBQUEsR0FBQTtXQUFHLENBQUUsaUJBQUY7RUFBSCxDQUFBLEdBQWpDO0FBMVFBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ICA9IGNvbnNvbGVcbl9fXyAgICAgICAgID0gbnVsbFxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnQ0ZHJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xuICB0eXBlX29mICAgICAgICAgICAgICAgICA9ICggeCApIC0+IGlmICggeCBpbnN0YW5jZW9mIEpldHN0cmVhbSApIHRoZW4gJ2pldHN0cmVhbScgZWxzZSBfdHlwZV9vZiB4XG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUgID0geyBvdXRsZXQ6ICdkYXRhIyonLCBwaWNrOiAnYWxsJywgZmFsbGJhY2s6IG1pc2ZpdCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VsZWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgICAgeyBzZWxlY3RvcnNfcnByLFxuICAgICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgICBAc2VsZWN0b3JzX3JwciAgPSBzZWxlY3RvcnNfcnByXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBpZiBzZWxlY3RvcnMuc2l6ZSBpcyAwIHRoZW4gdHJ1ZSBlbHNlIGZhbHNlXG4gICAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgICAgZm9yIHNlbGVjdG9yIGZyb20gc2VsZWN0b3JzXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2N1ZSMqJyB0aGVuIEBjdWVzID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eZGF0YSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMSBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkLCBnb3QgI3tzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eY3VlIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgICBAY3Vlcy5hZGQgbWF0Y2guZ3JvdXBzLmlkXG4gICAgICAgICAgZWxzZSBudWxsXG4gICAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9leGNlcnB0OiAtPiB7IGRhdGE6IEBkYXRhLCBjdWVzOiBAY3VlcywgYWNjZXB0X2FsbDogQGFjY2VwdF9hbGwsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgICAgcmV0dXJuIHRydWUgaWYgQGFjY2VwdF9hbGxcbiAgICAgIGlmIGlzX2N1ZSA9ICggdHlwZW9mIGl0ZW0gKSBpcyAnc3ltYm9sJ1xuICAgICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlICBpZiBAY3VlcyBpcyBmYWxzZVxuICAgICAgICByZXR1cm4gQGN1ZXMuaGFzIGlkX2Zyb21fc3ltYm9sIGl0ZW1cbiAgICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgICAgcmV0dXJuIGZhbHNlICBpZiBAZGF0YSBpcyBmYWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzIgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCBpbiBzZWxlY3RvciAje3JwciBAdG9TdHJpbmd9XCJcbiAgICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHNob3VsZCBwcm92aWRlIG1ldGhvZCB0byBnZW5lcmF0ZSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uICMjI1xuICAgIHRvU3RyaW5nOiAtPiBAc2VsZWN0b3JzX3JwclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWRfZnJvbV9zeW1ib2wgPSAoIHN5bWJvbCApIC0+IFIgPSBTdHJpbmcgc3ltYm9sOyAoIFIgKVsgNyAuLi4gUi5sZW5ndGggLSAxIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuZmxhdCBJbmZpbml0eVxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gWyAnJywgXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDEgYW5kIHNlbGVjdG9yc1sgMCBdIGlzICcnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmpvaW4gJywnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnNwbGl0ICcsJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICByZXR1cm4gc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX25vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgc2VsZWN0b3JzICAgICA9IHNlbGVjdG9yc19hc19saXN0IHNlbGVjdG9ycy4uLlxuICAgIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gICAgUiAgICAgICAgICAgICA9IG5ldyBTZXQoKVxuICAgIGZvciBzZWxlY3RvciBpbiBzZWxlY3RvcnNcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJycgICAgICAgICAgICAgdGhlbiBudWxsXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyonICAgICAgICAgICAgdGhlbiBSLmFkZCBcImRhdGEjKlwiOyBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cblxuICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyAkID0gKCBjZmcsIGdmbiApIC0+XG4gICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICMgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICMgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAjICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbicgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfI3tnZm4ubmFtZX1cIiwgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLmNhbGwgQCwgZFxuICAjICAgUltDRkddID0gY2ZnXG4gICMgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBAJDogJFxuICAgICMgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjb25maWd1cmUgY2ZnXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZTogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgICBAb3V0bGV0ID0gbmV3IFNlbGVjdG9yIEBjZmcub3V0bGV0XG4gICAgICA7X19fXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+IEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi4gO19fX1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjdWU6ICggbmFtZXMgKSAtPiBAc2VuZCAoIFN5bWJvbCBuYW1lIGZvciBuYW1lIGluIG5hbWVzICkuLi4gO19fX1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBnZXRfZmlyc3Q6ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMyBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0IDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2xhc3Q6ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNCBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0IC0xXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bjogKCBQLi4uICkgLT5cbiAgICAgIFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdXG4gICAgICByZXR1cm4gUiB1bmxlc3MgQGNmZy5waWNrIGluIFsgJ2ZpcnN0JywgJ2xhc3QnLCBdXG4gICAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX181IG5vIHJlc3VsdHNcIiBpZiBAY2ZnLmZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgICAgcmV0dXJuIFIuYXQgIDAgaWYgQGNmZy5waWNrIGlzICdmaXJzdCdcbiAgICAgIHJldHVybiBSLmF0IC0xXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfMSgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF93YWxrXzE6IC0+XG4gICAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICAgIGNvdW50ICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHZhbHVlIGZyb20gQF93YWxrXzIoKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICAgIDtfX19cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3dhbGtfMjogLT5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgQGlzX2VtcHR5XG4gICAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgICAgeWllbGQgQHNoZWxmLnNoaWZ0KClcbiAgICAgICAgO19fX1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICB5aWVsZCBmcm9tIEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgO19fX1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIHNlbGVjdG9ycy4uLiwgZ2ZuICkgLT5cbiAgICAgIHNlbGVjdG9yID0gbmV3IFNlbGVjdG9yIHNlbGVjdG9ycy4uLlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnamV0c3RyZWFtJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0ICcoamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfZ2ZuLndhbGsgZFxuICAgICAgICAgICAgO19fX1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgICAgICA7X19fXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIoZ2VuZXJhdG9yKV8je29yaWdpbmFsX2dmbi5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbiBkXG4gICAgICAgICAgICA7X19fXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNiBleHBlY3RlZCBhIGpldHN0cmVhbSBvciBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGdlbmVyYXRvciBmdW5jdGlvbiwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3tnZm4ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgICAgICAgICAgICAgICkgZm9yIGogZnJvbSBnZm4gZCA7X19fXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqIGlmIG1lLm91dGxldC5zZWxlY3QgaiAgKSBmb3IgaiBmcm9tIGdmbiBkIDtfX19cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICA7X19fXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIENGRyxcbiAgICB0eXBlX29mLFxuICAgIG1pc2ZpdCxcbiAgICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9zeW1ib2wsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgaW50ZXJuYWxzLCB9XG4gICMgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIGRvID0+IHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
