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
          var R, ref;
          R = [...(this.walk(...P))];
          if ((ref = this.cfg.pick) === 'first' || ref === 'last') {
            if (R.length === 0) {
              if (this.cfg.fallback === misfit) {
                throw new Error("Ωjstrm___2 no results");
              }
              return this.cfg.fallback;
            }
            if (this.cfg.pisk === 'first') {
              return R.at(0);
            } else {
              return R.at(-1);
            }
          }
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk();
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk() {
          var count, done, generator, previous, value;
          previous = misfit;
          count = 0;
          //.....................................................................................................
          if (this.is_empty) {
            while (this.shelf.length > 0) {
              yield this.shelf.shift();
            }
            return null;
          }
          //.....................................................................................................
          while (this.shelf.length > 0) {
            generator = this.transforms[0](this.shelf.shift());
            while (true) {
              ({value, done} = generator.next());
              if (done) {
                break;
              }
              count++;
              if ((count === 1) && (this.cfg.pick === 'first')) {
                yield value;
                break;
              } else if (this.cfg.pick === 'all') {
                yield value;
              }
              previous = value;
            }
          }
          if ((this.cfg.pick === 'last') && (count > 0)) {
            //.....................................................................................................
            yield previous;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUI7SUFFQSxHQUFBLEdBQTRCLE1BQUEsQ0FBTyxLQUFQLEVBSjlCOzs7SUFRRSxPQUFBLEdBQTBCLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQ7SUFDMUIsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDtJQUMxQixzQkFBQSxHQUEwQjtNQUFFLE1BQUEsRUFBUSxRQUFWO01B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QixDQUFqQixDQUFYLEdBQUEsQ0FBQSxNQUFNLENBQU4sQ0FBQSxHQUFBLE1BQUY7b0JBQUE7MkJBQXFEO2tCQUE5RCxFQUR4QjtpQkFGRjs7Y0FLQSxPQUFXLE9BQUEsQ0FBUSxDQUFSLEVBTG5COztBQU9RLHFCQUFPO1lBUjRDO1VBQWQsQ0FBQSxFQUFPLEtBQTFDLEVBNUJWOztVQXNDTSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxpQkFBTztRQXhDSDs7TUFqRlI7OztNQXFCRSxVQUFBLENBQVcsU0FBQyxDQUFBLFNBQVosRUFBZ0IsUUFBaEIsRUFBNEIsUUFBQSxDQUFBLENBQUE7ZUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDO01BQWYsQ0FBNUI7O01BQ0EsVUFBQSxDQUFXLFNBQUMsQ0FBQSxTQUFaLEVBQWdCLFVBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLEtBQXNCO01BQXpCLENBQTVCOzs7O2tCQTNISjs7SUFpT0UsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FDeEIsR0FEd0IsRUFFeEIsT0FGd0IsRUFHeEIsTUFId0IsRUFJeEIsc0JBSndCLEVBS3hCLFFBTHdCLEVBTXhCLG9CQU53QixFQU94QixtQkFQd0IsRUFReEIsaUJBUndCLEVBU3hCLGNBVHdCLENBQWQ7QUFVWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxTQUFiO0VBNU9DLEVBVHBCOzs7OztFQTJQQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUFpQyxDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxpQkFBRjtFQUFILENBQUEsR0FBakM7QUEzUEEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBDRkcgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdDRkcnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIHR5cGVfb2YgICAgICAgICAgICAgICAgID0gKCB4ICkgLT4gaWYgKCB4IGluc3RhbmNlb2YgSmV0c3RyZWFtICkgdGhlbiAnamV0c3RyZWFtJyBlbHNlIF90eXBlX29mIHhcbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIHBpY2s6ICdhbGwnLCBmYWxsYmFjazogbWlzZml0LCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTZWxlY3RvclxuICAgIGNvbnN0cnVjdG9yOiAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICAgIHNlbGVjdG9ycywgIH0gPSBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi5cbiAgICAgIEBzZWxlY3RvcnNfcnByICA9IHNlbGVjdG9yc19ycHJcbiAgICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICAgIEBjdWVzICAgICAgICAgICA9IGZhbHNlXG4gICAgICBmb3Igc2VsZWN0b3IgZnJvbSBzZWxlY3RvcnNcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdkYXRhIyonIHRoZW4gQGRhdGEgPSB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnY3VlIyonIHRoZW4gQGN1ZXMgPSB0cnVlXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICAjIyMgVEFJTlQgbWVudGlvbiBvcmlnaW5hbCBzZWxlY3RvciBuZXh0IHRvIG5vcm1hbGl6ZWQgZm9ybSAjIyNcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQsIGdvdCAje3NlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgIEBjdWVzID0gbmV3IFNldCgpIGlmIEBjdWVzIGluIFsgdHJ1ZSwgZmFsc2UsIF1cbiAgICAgICAgICAgIEBjdWVzLmFkZCBtYXRjaC5ncm91cHMuaWRcbiAgICAgICAgICBlbHNlIG51bGxcbiAgICAgIEBhY2NlcHRfYWxsICAgICA9ICggQGRhdGEgaXMgdHJ1ZSApIGFuZCAoIEBjdWVzIGlzIHRydWUgKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZWxlY3Q6ICggaXRlbSApIC0+XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBAYWNjZXB0X2FsbFxuICAgICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICAgIHJldHVybiB0cnVlICAgaWYgQGN1ZXMgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2UgIGlmIEBjdWVzIGlzIGZhbHNlXG4gICAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9zeW1ib2wgaXRlbVxuICAgICAgcmV0dXJuIHRydWUgICBpZiBAZGF0YSBpcyB0cnVlXG4gICAgICByZXR1cm4gZmFsc2UgIGlmIEBkYXRhIGlzIGZhbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICAgIyByZXR1cm4gQGRhdGEuaGFzIGlkX2Zyb21fdmFsdWUgaXRlbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgc2hvdWxkIHByb3ZpZGUgbWV0aG9kIHRvIGdlbmVyYXRlIG5vcm1hbGl6ZWQgcmVwcmVzZW50YXRpb24gIyMjXG4gICAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZF9mcm9tX3N5bWJvbCA9ICggc3ltYm9sICkgLT5cbiAgICBSID0gU3RyaW5nIHN5bWJvbFxuICAgIHJldHVybiAoIFIgKVsgNyAuLi4gUi5sZW5ndGggLSAxIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuZmxhdCBJbmZpbml0eVxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gWyAnJywgXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDEgYW5kIHNlbGVjdG9yc1sgMCBdIGlzICcnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmpvaW4gJywnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnNwbGl0ICcsJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICByZXR1cm4gc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX25vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgc2VsZWN0b3JzICAgICA9IHNlbGVjdG9yc19hc19saXN0IHNlbGVjdG9ycy4uLlxuICAgIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gICAgUiAgICAgICAgICAgICA9IG5ldyBTZXQoKVxuICAgIGZvciBzZWxlY3RvciBpbiBzZWxlY3RvcnNcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJycgICAgICAgICAgICAgdGhlbiBudWxsXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyonICAgICAgICAgICAgdGhlbiBSLmFkZCBcImRhdGEjKlwiOyBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cblxuICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyAkID0gKCBjZmcsIGdmbiApIC0+XG4gICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICMgICAgIHdoZW4gJ2pldHN0cmVhbScgICAgICAgICB0aGVuIFIgPSBuYW1laXQgJyhjZmcpXyhqZXRzdHJlYW0pJywgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLndhbGsuY2FsbCBALCBkXG4gICMgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAjICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbicgdGhlbiBSID0gbmFtZWl0IFwiKGNmZylfI3tnZm4ubmFtZX1cIiwgICAgICAgICAgICggZCApIC0+IHlpZWxkIGZyb20gZ2ZuLmNhbGwgQCwgZFxuICAjICAgUltDRkddID0gY2ZnXG4gICMgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBAJDogJFxuICAgICMgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjZmcgICAgICAgID0gQGNvbmZpZ3VyZSBjZmdcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgICBSICAgICAgICAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgICBAb3V0bGV0ICAgICA9IG5ldyBTZWxlY3RvciBSLm91dGxldFxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdsZW5ndGgnLCAgIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAdHJhbnNmb3Jtcy5sZW5ndGggaXMgMFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBzZW5kOiAoIGRzLi4uICkgLT5cbiAgICAgIEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGN1ZTogKCBuYW1lcyApIC0+IEBzZW5kICggU3ltYm9sIG5hbWUgZm9yIG5hbWUgaW4gbmFtZXMgKS4uLlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBnZXRfZmlyc3Q6ICggUC4uLiApIC0+XG4gICAgICBpZiAoIFIgPSBAcnVuIFAuLi4gKS5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMyBubyByZXN1bHRcIlxuICAgICAgcmV0dXJuIFJbIDAgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBydW46ICggUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgaWYgQGNmZy5waWNrIGluIFsgJ2ZpcnN0JywgJ2xhc3QnLCBdXG4gICAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgICAgICByZXR1cm4gaWYgQGNmZy5waXNrIGlzICdmaXJzdCcgdGhlbiBSLmF0IDAgZWxzZSBSLmF0IC0xXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAoIGRzLi4uICkgLT5cbiAgICAgIEBzZW5kIGRzLi4uXG4gICAgICByZXR1cm4gQF93YWxrKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3dhbGs6IC0+XG4gICAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICAgIGNvdW50ICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgQGlzX2VtcHR5XG4gICAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgICAgeWllbGQgQHNoZWxmLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgICAgZ2VuZXJhdG9yID0gQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKVxuICAgICAgICBsb29wXG4gICAgICAgICAgeyB2YWx1ZSxcbiAgICAgICAgICAgIGRvbmUsIH0gPSBnZW5lcmF0b3IubmV4dCgpXG4gICAgICAgICAgYnJlYWsgaWYgZG9uZVxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgICBwcmV2aW91cyA9IHZhbHVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwdXNoOiAoIHNlbGVjdG9ycy4uLiwgZ2ZuICkgLT5cbiAgICAgIHNlbGVjdG9yID0gbmV3IFNlbGVjdG9yIHNlbGVjdG9ycy4uLlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZ2ZuXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICBvcmlnaW5hbF9nZm4gID0gZ2ZuXG4gICAgICAgICAgZ2ZuICAgICAgICAgICA9IG5hbWVpdCAnKGpldHN0cmVhbSknLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbi53YWxrIGRcbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF9nZm4ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgb3JpZ2luYWxfZ2ZuIGQ7IHlpZWxkIGRcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgXCIoZ2VuZXJhdG9yKV8je29yaWdpbmFsX2dmbi5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX2dmbiBkXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzYgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiAoIGNmZyA9IGdmblsgQ0ZHIF0gKT9cbiAgICAgICAgbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7Z2ZuLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gbnh0IGogICAgICAgICAgICAgICApIGZvciBqIGZyb20gZ2ZuIGQ7IG51bGxcbiAgICAgICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciBqIGZyb20gZ2ZuIGQ7IG51bGxcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIENGRyxcbiAgICB0eXBlX29mLFxuICAgIG1pc2ZpdCxcbiAgICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9zeW1ib2wsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgaW50ZXJuYWxzLCB9XG4gICMgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIGRvID0+IHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
