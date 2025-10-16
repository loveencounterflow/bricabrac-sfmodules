(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var Async_jetstream, Jetstream, Jetstream_abc, Selector, _configure_transform, _normalize_selectors, _type_of, exports, hide, id_from_cue, internals, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    //=========================================================================================================
    /* TAINT use proper typing */
    type_of = function(x) {
      if (x instanceof Jetstream) {
        return 'sync_jetstream';
      }
      if (x instanceof Async_jetstream) {
        return 'async_jetstream';
      }
      return _type_of(x);
    };
    //---------------------------------------------------------------------------------------------------------
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
          return this.cues.has(id_from_cue(item));
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
    id_from_cue = function(symbol) {
      return symbol.description;
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
    //---------------------------------------------------------------------------------------------------------
    _configure_transform = function(...selectors) {
      var is_sync, original_tfm, ref, selector, tfm, type;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      selector = new Selector(...selectors);
      original_tfm = tfm;
      //.......................................................................................................
      switch (type = type_of(tfm)) {
        //.....................................................................................................
        case 'sync_jetstream':
          is_sync = true;
          tfm = nameit('(sync_jetstream)', function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* original_tfm.walk(d);
            return null;
          });
          break;
        //.....................................................................................................
        case 'async_jetstream':
          is_sync = false;
          tfm = nameit('(async_jetstream)', async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm.walk(d));
            return null;
          });
          break;
        //.....................................................................................................
        case 'function':
          is_sync = true;
          tfm = nameit(`(watcher)_${original_tfm.name}`, function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            original_tfm(d);
            yield d;
            return null;
          });
          break;
        //.....................................................................................................
        case 'asyncfunction':
          is_sync = false;
          tfm = nameit(`(watcher)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            await original_tfm(d);
            yield d;
            return null;
          });
          break;
        //.....................................................................................................
        case 'generatorfunction':
          is_sync = true;
          tfm = nameit(`(generator)_${original_tfm.name}`, function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* original_tfm(d);
            return null;
          });
          break;
        //.....................................................................................................
        case 'asyncgeneratorfunction':
          is_sync = false;
          tfm = nameit(`(generator)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm(d));
            return null;
          });
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ωjstrm__10 expected a jetstream or a synchronous function or generator function, got a ${type}`);
      }
      //.......................................................................................................
      return {tfm, original_tfm, type, is_sync};
    };
    Jetstream_abc = (function() {
      //=========================================================================================================
      class Jetstream_abc {
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

        cue(id) {
          this.send(Symbol.for(id));
          return null;
        }

        //=======================================================================================================
        pick_first(...P) {
          return this._pick('first', ...P);
        }

        pick_last(...P) {
          return this._pick('last', ...P);
        }

        pick_all(...P) {
          return this._pick('all', ...P);
        }

        run(...P) {
          return this._pick(this.cfg.pick, ...P);
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk_and_pick();
        }

      };

      //-------------------------------------------------------------------------------------------------------
      set_getter(Jetstream_abc.prototype, 'length', function() {
        return this.transforms.length;
      });

      set_getter(Jetstream_abc.prototype, 'is_empty', function() {
        return this.transforms.length === 0;
      });

      return Jetstream_abc;

    }).call(this);
    //=========================================================================================================
    Jetstream = class Jetstream extends Jetstream_abc {};
    Async_jetstream = class Async_jetstream extends Jetstream_abc {};
    //=========================================================================================================
    Jetstream.prototype._pick = function(picker, ...P) {
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
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._pick = async function(picker, ...P) {
      /* NOTE best async equivalent to `[ ( @walk P... )..., ]` I could find */
      var R, d;
      R = (await (async function() {
        var results;
        results = [];
        for await (d of this.walk(...P)) {
          results.push(d);
        }
        return results;
      }).call(this));
      if (picker === 'all') {
        return R;
      }
      if (R.length === 0) {
        if (this.cfg.fallback === misfit) {
          throw new Error("Ωjstrm___8 no results");
        }
        return this.cfg.fallback;
      }
      if (picker === 'first') {
        return R.at(0);
      }
      if (picker === 'last') {
        return R.at(-1);
      }
      throw new Error(`Ωjstrm___9 unknown picker ${picker}`);
    };
    //=========================================================================================================
    Jetstream.prototype._walk_and_pick = function*() {
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
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._walk_and_pick = async function*() {
      var count, previous, value;
      previous = misfit;
      count = 0;
//.....................................................................................................
      for await (value of this._walk_all_to_exhaustion()) {
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
    };
    //=========================================================================================================
    Jetstream.prototype._walk_all_to_exhaustion = function*() {
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
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._walk_all_to_exhaustion = async function*() {
      if (this.is_empty) {
        while (this.shelf.length > 0) {
          yield this.shelf.shift();
        }
      } else {
        while (this.shelf.length > 0) {
          yield* (await this.transforms[0](this.shelf.shift()));
        }
      }
      return null;
    };
    //=========================================================================================================
    Jetstream.prototype.push = function(...selectors) {
      var R, is_sync, my_idx, nxt, ref, tfm, type, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      ({tfm, type, is_sync} = _configure_transform(...selectors, tfm));
      if (!is_sync) {
        throw new Error(`Ωjstrm___2 cannot use async transform in sync jetstream, got a ${type}`);
      }
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
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype.push = function(...selectors) {
      var R, is_sync, my_idx, nxt, ref, tfm, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      ({tfm, is_sync} = _configure_transform(...selectors, tfm));
      my_idx = this.transforms.length;
      //.....................................................................................................
      nxt = null;
      yielder = null;
      //.....................................................................................................
      R = nameit(`(managed)_${tfm.name}`, (function(me) {
        return async function*(d) {
          if (nxt == null) {
            nxt = me.transforms[my_idx + 1];
            if (nxt != null) {
              yielder = async function*(d) {
                var j;
                for await (j of tfm(d)) {
                  (yield* (await nxt(j)));
                }
                return null;
              };
            } else {
              yielder = async function*(d) {
                var j;
                for await (j of tfm(d)) {
                  (me.outlet.select(j) ? (yield j) : void 0);
                }
                return null;
              };
            }
          }
          yield* (await yielder(d));
          return null;
        };
      })(this));
      //.....................................................................................................
      this.transforms.push(R);
      return R;
    };
    //=========================================================================================================
    internals = Object.freeze({type_of, misfit, jetstream_cfg_template, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_cue});
    return exports = {Jetstream, Async_jetstream, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsb0JBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUIsRUFGRjs7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsZUFBUSxpQkFBUjs7TUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxlQUFPLGtCQUFQOztBQUNBLGFBQU8sUUFBQSxDQUFTLENBQVQ7SUFIQyxFQVBaOztJQWFFLE1BQUEsR0FBMEIsTUFBQSxDQUFPLFFBQVA7SUFDMUIsc0JB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XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSAgPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xuICB0eXBlX29mID0gKCB4ICkgLT5cbiAgICByZXR1cm4gICdzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgICAgICAgSmV0c3RyZWFtIClcbiAgICByZXR1cm4gJ2FzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgQXN5bmNfamV0c3RyZWFtIClcbiAgICByZXR1cm4gX3R5cGVfb2YgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIHBpY2s6ICdhbGwnLCBmYWxsYmFjazogbWlzZml0LCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTZWxlY3RvclxuICAgIGNvbnN0cnVjdG9yOiAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICAgIHNlbGVjdG9ycywgIH0gPSBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi5cbiAgICAgIEBzZWxlY3RvcnNfcnByICA9IHNlbGVjdG9yc19ycHJcbiAgICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICAgIEBjdWVzICAgICAgICAgICA9IGZhbHNlXG4gICAgICBmb3Igc2VsZWN0b3IgZnJvbSBzZWxlY3RvcnNcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdkYXRhIyonIHRoZW4gQGRhdGEgPSB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnY3VlIyonIHRoZW4gQGN1ZXMgPSB0cnVlXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICAjIyMgVEFJTlQgbWVudGlvbiBvcmlnaW5hbCBzZWxlY3RvciBuZXh0IHRvIG5vcm1hbGl6ZWQgZm9ybSAjIyNcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQsIGdvdCAje3NlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgIEBjdWVzID0gbmV3IFNldCgpIGlmIEBjdWVzIGluIFsgdHJ1ZSwgZmFsc2UsIF1cbiAgICAgICAgICAgIEBjdWVzLmFkZCBtYXRjaC5ncm91cHMuaWRcbiAgICAgICAgICBlbHNlIG51bGxcbiAgICAgIEBhY2NlcHRfYWxsICAgICA9ICggQGRhdGEgaXMgdHJ1ZSApIGFuZCAoIEBjdWVzIGlzIHRydWUgKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZWxlY3Q6ICggaXRlbSApIC0+XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBAYWNjZXB0X2FsbFxuICAgICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICAgIHJldHVybiB0cnVlICAgaWYgQGN1ZXMgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2UgIGlmIEBjdWVzIGlzIGZhbHNlXG4gICAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9jdWUgaXRlbVxuICAgICAgcmV0dXJuIHRydWUgICBpZiBAZGF0YSBpcyB0cnVlXG4gICAgICByZXR1cm4gZmFsc2UgIGlmIEBkYXRhIGlzIGZhbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICAgIyByZXR1cm4gQGRhdGEuaGFzIGlkX2Zyb21fdmFsdWUgaXRlbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgc2hvdWxkIHByb3ZpZGUgbWV0aG9kIHRvIGdlbmVyYXRlIG5vcm1hbGl6ZWQgcmVwcmVzZW50YXRpb24gIyMjXG4gICAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZF9mcm9tX2N1ZSA9ICggc3ltYm9sICkgLT4gc3ltYm9sLmRlc2NyaXB0aW9uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZWxlY3RvcnNfYXNfbGlzdCA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmZsYXQgSW5maW5pdHlcbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5qb2luICcsJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5yZXBsYWNlIC9cXHMrL2csICcnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgcmV0dXJuIHNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT4gKCBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi4gKS5zZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHNlbGVjdG9ycyAgICAgPSBzZWxlY3RvcnNfYXNfbGlzdCBzZWxlY3RvcnMuLi5cbiAgICBzZWxlY3RvcnNfcnByID0gc2VsZWN0b3JzLmpvaW4gJywgJ1xuICAgIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgICBmb3Igc2VsZWN0b3IgaW4gc2VsZWN0b3JzXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcqJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJkYXRhIypcIjsgUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyMnICAgICAgICAgICAgdGhlbiBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgICB3aGVuIC8uKyMkLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSpcIlxuICAgICAgICB3aGVuIG5vdCAvIy8udGVzdCBzZWxlY3RvciAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSMqXCJcbiAgICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICAgIFIuYWRkICdkYXRhIyonIGlmIFIuc2l6ZSBpcyAwXG4gICAgUi5kZWxldGUgJycgaWYgUi5zaXplIGlzbnQgMVxuICAgIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbmZpZ3VyZV90cmFuc2Zvcm0gPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICBzZWxlY3RvciAgICAgID0gbmV3IFNlbGVjdG9yIHNlbGVjdG9ycy4uLlxuICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnc3luY19qZXRzdHJlYW0nXG4gICAgICAgIGlzX3N5bmMgPSB0cnVlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgJyhzeW5jX2pldHN0cmVhbSknLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfdGZtLndhbGsgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdhc3luY19qZXRzdHJlYW0nXG4gICAgICAgIGlzX3N5bmMgPSBmYWxzZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0ICcoYXN5bmNfamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gdHJ1ZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgb3JpZ2luYWxfdGZtIGQ7IHlpZWxkIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnYXN5bmNmdW5jdGlvbidcbiAgICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICBhd2FpdCBvcmlnaW5hbF90Zm0gZDsgeWllbGQgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgaXNfc3luYyA9IHRydWVcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdhc3luY2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gZmFsc2VcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fXzEwIGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiB7IHRmbSwgb3JpZ2luYWxfdGZtLCB0eXBlLCBpc19zeW5jLCB9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbV9hYmNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjb25maWd1cmUgY2ZnXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZTogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgICBAb3V0bGV0ID0gbmV3IFNlbGVjdG9yIEBjZmcub3V0bGV0XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNlbmQ6ICggZHMuLi4gKSAtPiBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uICA7bnVsbFxuICAgIGN1ZTogICggaWQgICAgKSAtPiBAc2VuZCBTeW1ib2wuZm9yIGlkICAgICAgICAgICAgICAgICAgICA7bnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBwaWNrX2ZpcnN0OiAoIFAuLi4gKSAtPiBAX3BpY2sgJ2ZpcnN0JywgICBQLi4uXG4gICAgcGlja19sYXN0OiAgKCBQLi4uICkgLT4gQF9waWNrICdsYXN0JywgICAgUC4uLlxuICAgIHBpY2tfYWxsOiAgICggUC4uLiApIC0+IEBfcGljayAnYWxsJywgICAgIFAuLi5cbiAgICBydW46ICAgICAgICAoIFAuLi4gKSAtPiBAX3BpY2sgQGNmZy5waWNrLCBQLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfYW5kX3BpY2soKVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW0gICAgICAgZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG4gIGNsYXNzIEFzeW5jX2pldHN0cmVhbSBleHRlbmRzIEpldHN0cmVhbV9hYmNcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgcmV0dXJuIFIgaWYgcGlja2VyIGlzICdhbGwnXG4gICAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18zIG5vIHJlc3VsdHNcIiBpZiBAY2ZnLmZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgICAgcmV0dXJuIFIuYXQgIDAgaWYgcGlja2VyIGlzICdmaXJzdCdcbiAgICAgIHJldHVybiBSLmF0IC0xIGlmIHBpY2tlciBpcyAnbGFzdCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX180IHVua25vd24gcGlja2VyICN7cGlja2VyfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06Ol9waWNrID0gKCBwaWNrZXIsIFAuLi4gKSAtPlxuICAgICAgIyMjIE5PVEUgYmVzdCBhc3luYyBlcXVpdmFsZW50IHRvIGBbICggQHdhbGsgUC4uLiApLi4uLCBdYCBJIGNvdWxkIGZpbmQgIyMjXG4gICAgICBSID0gKCBkIGZvciBhd2FpdCBkIGZyb20gQHdhbGsgUC4uLiApXG4gICAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzggbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAgMCBpZiBwaWNrZXIgaXMgJ2ZpcnN0J1xuICAgICAgcmV0dXJuIFIuYXQgLTEgaWYgcGlja2VyIGlzICdsYXN0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzkgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICAgICAgcHJldmlvdXMgID0gbWlzZml0XG4gICAgICBjb3VudCAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB2YWx1ZSBmcm9tIEBfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbigpXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgaWYgKCBjb3VudCBpcyAxICkgYW5kICggQGNmZy5waWNrIGlzICdmaXJzdCcgKVxuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIGVsc2UgaWYgQGNmZy5waWNrIGlzICdhbGwnXG4gICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgcHJldmlvdXMgPSB2YWx1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB5aWVsZCBwcmV2aW91cyBpZiAoIEBjZmcucGljayBpcyAnbGFzdCcgKSBhbmQgKCBjb3VudCA+IDAgKVxuICAgICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICAgICAgcHJldmlvdXMgID0gbWlzZml0XG4gICAgICBjb3VudCAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBhd2FpdCB2YWx1ZSBmcm9tIEBfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbigpXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgaWYgKCBjb3VudCBpcyAxICkgYW5kICggQGNmZy5waWNrIGlzICdmaXJzdCcgKVxuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIGVsc2UgaWYgQGNmZy5waWNrIGlzICdhbGwnXG4gICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgcHJldmlvdXMgPSB2YWx1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB5aWVsZCBwcmV2aW91cyBpZiAoIEBjZmcucGljayBpcyAnbGFzdCcgKSBhbmQgKCBjb3VudCA+IDAgKVxuICAgICAgO251bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24gPSAtPlxuICAgICAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgeWllbGQgZnJvbSAgICAgICBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbiA9IC0+XG4gICAgICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgZWxzZSAgICAgICAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBKZXRzdHJlYW06OnB1c2ggPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICAgIHsgdGZtXG4gICAgICAgIHR5cGVcbiAgICAgICAgaXNfc3luYyB9ID0gX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICAgIHVubGVzcyBpc19zeW5jXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIGNhbm5vdCB1c2UgYXN5bmMgdHJhbnNmb3JtIGluIHN5bmMgamV0c3RyZWFtLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSAgICAgICBueHQgaiAgICAgICAgICkgZm9yICAgICAgIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yICAgICAgIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6cHVzaCA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgeyB0Zm1cbiAgICAgICAgaXNfc3luYyB9ID0gX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBhd2FpdCBueHQgaiAgICAgICAgICkgZm9yIGF3YWl0IGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGF3YWl0IGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20gYXdhaXQgeWllbGRlciBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIHR5cGVfb2YsXG4gICAgbWlzZml0LFxuICAgIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX2N1ZSwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBBc3luY19qZXRzdHJlYW0sIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
