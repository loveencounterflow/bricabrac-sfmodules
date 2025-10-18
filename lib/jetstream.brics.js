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
          throw new Error(`Ωjstrm___3 expected a jetstream or a synchronous function or generator function, got a ${type}`);
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
      /* NOTE this used to be the idiomatic formulation `R = [ ( @walk P... )..., ]`; for the sake of making
         sync and async versions maximally similar, rewritten as the sync version of `await Array.fromAsync @walk P...` */
      var R;
      R = Array.from(this.walk(...P));
      if (picker === 'all') {
        return R;
      }
      if (R.length === 0) {
        if (this.cfg.fallback === misfit) {
          throw new Error("Ωjstrm___4 no results");
        }
        return this.cfg.fallback;
      }
      if (picker === 'first') {
        return R.at(0);
      }
      if (picker === 'last') {
        return R.at(-1);
      }
      throw new Error(`Ωjstrm___5 unknown picker ${picker}`);
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._pick = async function(picker, ...P) {
      /* NOTE best async equivalent to `[ ( @walk P... )..., ]` I could find */
      /* NOTE my first solution was `R = ( d for await d from @walk P... )`, but that transpiles into quite a few lines of JS */
      /* thx to https://allthingssmitty.com/2025/07/14/modern-async-iteration-in-javascript-with-array-fromasync/ */
      var R;
      R = (await Array.fromAsync(this.walk(...P)));
      if (picker === 'all') {
        return R;
      }
      if (R.length === 0) {
        if (this.cfg.fallback === misfit) {
          throw new Error("Ωjstrm___6 no results");
        }
        return this.cfg.fallback;
      }
      if (picker === 'first') {
        return R.at(0);
      }
      if (picker === 'last') {
        return R.at(-1);
      }
      throw new Error(`Ωjstrm___7 unknown picker ${picker}`);
    };
    //=========================================================================================================
    Jetstream.prototype._walk_and_pick = function*() {
      var count, previous, value;
      previous = misfit;
      count = 0;
//.......................................................................................................
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
        //.......................................................................................................
        yield previous;
      }
      return null;
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._walk_and_pick = async function*() {
      var count, previous, value;
      previous = misfit;
      count = 0;
//.......................................................................................................
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
        //.......................................................................................................
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
      ({tfm, is_sync, type} = _configure_transform(...selectors, tfm));
      if (!is_sync) {
        throw new Error(`Ωjstrm___8 cannot use async transform in sync jetstream, got a ${type}`);
      }
      my_idx = this.transforms.length;
      //.......................................................................................................
      nxt = null;
      yielder = null;
      //.......................................................................................................
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
      //.......................................................................................................
      this.transforms.push(R);
      return R;
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype.push = function(...selectors) {
      var R, my_idx, nxt, ref, tfm, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      ({tfm} = _configure_transform(...selectors, tfm));
      my_idx = this.transforms.length;
      //.......................................................................................................
      nxt = null;
      yielder = null;
      //.......................................................................................................
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
      //.......................................................................................................
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsb0JBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUIsRUFGRjs7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsZUFBUSxpQkFBUjs7TUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxlQUFPLGtCQUFQOztBQUNBLGFBQU8sUUFBQSxDQUFTLENBQVQ7SUFIQyxFQVBaOztJQWFFLE1BQUEsR0FBMEIsTUFBQSxDQUFPLFFBQVA7SUFDMUIsc0JBQUEsR0FBMEI7TUFBRSxNQUFBLEVBQVEsUUFBVjtNQUFvQixJQUFBLEVBQU0sS0FBMUI7TUFBaUMsUUFBQSxFQUFVO0lBQTNDLEVBZDVCOztJQWlCUSxXQUFOLE1BQUEsU0FBQTtNQUNFLFdBQWEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUNqQixZQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsUUFBQSxFQUFBO1FBQU0sQ0FBQSxDQUFFLGFBQUYsRUFDRSxTQURGLENBQUEsR0FDa0Isb0JBQUEsQ0FBcUIsR0FBQSxTQUFyQixDQURsQjtRQUVBLElBQUMsQ0FBQSxhQUFELEdBQWtCO1FBQ2xCLElBQUMsQ0FBQSxJQUFELEdBQXFCLFNBQVMsQ0FBQyxJQUFWLEtBQWtCLENBQXJCLEdBQTRCLElBQTVCLEdBQXNDO1FBQ3hELElBQUMsQ0FBQSxJQUFELEdBQWtCO1FBQ2xCLEtBQUEscUJBQUE7QUFDRSxrQkFBTyxJQUFQO0FBQUEsaUJBQ08sUUFBQSxLQUFZLFFBRG5CO2NBQ2lDLElBQUMsQ0FBQSxJQUFELEdBQVE7QUFBbEM7QUFEUCxpQkFFTyxRQUFBLEtBQVksT0FGbkI7Y0FFZ0MsSUFBQyxDQUFBLElBQUQsR0FBUTtBQUFqQztBQUZQLGlCQUdPLG9EQUhQOztjQUtJLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxnREFBQSxDQUFBLENBQW1ELFFBQW5ELENBQUEsQ0FBVjtBQUxWLGlCQU1PLG1EQU5QO2NBT0ksV0FBcUIsSUFBQyxDQUFBLFVBQVUsUUFBWCxRQUFpQixLQUF0QztnQkFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksR0FBSixDQUFBLEVBQVI7O2NBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENBQVUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUF2QjtBQUZHO0FBTlA7Y0FTTztBQVRQO1FBREY7UUFXQSxJQUFDLENBQUEsVUFBRCxHQUFrQixDQUFFLElBQUMsQ0FBQSxJQUFELEtBQVMsSUFBWCxDQUFBLElBQXNCLENBQUUsSUFBQyxDQUFBLElBQUQsS0FBUyxJQUFYO0FBQ3hDLGVBQU87TUFsQkksQ0FBakI7OztNQXFCSSxZQUFjLENBQUEsQ0FBQTtlQUFHO1VBQUUsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFUO1VBQWUsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUF0QjtVQUE0QixVQUFBLEVBQVksSUFBQyxDQUFBO1FBQXpDO01BQUgsQ0FyQmxCOzs7TUF3QkksTUFBUSxDQUFFLElBQUYsQ0FBQTtBQUNaLFlBQUE7UUFBTSxJQUFlLElBQUMsQ0FBQSxVQUFoQjtBQUFBLGlCQUFPLEtBQVA7O1FBQ0EsSUFBRyxNQUFBLEdBQVMsQ0FBRSxPQUFPLElBQVQsQ0FBQSxLQUFtQixRQUEvQjtVQUNFLElBQWlCLElBQUMsQ0FBQSxJQUFELEtBQVMsSUFBMUI7QUFBQSxtQkFBTyxLQUFQOztVQUNBLElBQWlCLElBQUMsQ0FBQSxJQUFELEtBQVMsS0FBMUI7QUFBQSxtQkFBTyxNQUFQOztBQUNBLGlCQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLFdBQUEsQ0FBWSxJQUFaLENBQVYsRUFIVDs7UUFJQSxJQUFpQixJQUFDLENBQUEsSUFBRCxLQUFTLElBQTFCO0FBQUEsaUJBQU8sS0FBUDs7UUFDQSxJQUFpQixJQUFDLENBQUEsSUFBRCxLQUFTLEtBQTFCO0FBQUEsaUJBQU8sTUFBUDs7UUFDQSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsdURBQUEsQ0FBQSxDQUEwRCxHQUFBLENBQUksSUFBQyxDQUFBLFFBQUwsQ0FBMUQsQ0FBQSxDQUFWO01BUkEsQ0F4Qlo7Ozs7OztNQXFDSSxRQUFVLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQTtNQUFKOztJQXRDWixFQWpCRjs7SUEwREUsV0FBQSxHQUFjLFFBQUEsQ0FBRSxNQUFGLENBQUE7YUFBYyxNQUFNLENBQUM7SUFBckIsRUExRGhCOztJQTZERSxpQkFBQSxHQUFvQixRQUFBLENBQUEsR0FBRSxTQUFGLENBQUE7TUFDbEIsSUFBYSxTQUFTLENBQUMsTUFBVixLQUFvQixDQUFqQztBQUFBLGVBQU8sR0FBUDs7TUFDQSxTQUFBLEdBQVksU0FBUyxDQUFDLElBQVYsQ0FBZSxLQUFmO01BQ1osSUFBYSxTQUFTLENBQUMsTUFBVixLQUFvQixDQUFqQztBQUFBLGVBQU8sR0FBUDs7TUFDQSxJQUFrQixTQUFTLENBQUMsTUFBVixLQUFvQixDQUFwQixJQUEwQixTQUFTLENBQUUsQ0FBRixDQUFULEtBQWtCLEVBQTlEO0FBQUEsZUFBTyxDQUFFLEVBQUYsRUFBUDs7TUFDQSxTQUFBLEdBQVksU0FBUyxDQUFDLElBQVYsQ0FBZSxHQUFmO01BQ1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxPQUFWLENBQWtCLE1BQWxCLEVBQTBCLEVBQTFCO01BQ1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxLQUFWLENBQWdCLEdBQWhCO0FBQW9CLGtDQUNoQyxhQUFPO0lBUlcsRUE3RHRCOztJQXdFRSxtQkFBQSxHQUFzQixRQUFBLENBQUEsR0FBRSxTQUFGLENBQUE7YUFBb0IsQ0FBRSxvQkFBQSxDQUFxQixHQUFBLFNBQXJCLENBQUYsQ0FBcUMsQ0FBQztJQUExRCxFQXhFeEI7O0lBMkVFLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUN6QixVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFFBQUEsRUFBQTtNQUFJLFNBQUEsR0FBZ0IsaUJBQUEsQ0FBa0IsR0FBQSxTQUFsQjtNQUNoQixhQUFBLEdBQWdCLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZjtNQUNoQixDQUFBLEdBQWdCLElBQUksR0FBSixDQUFBO01BQ2hCLEtBQUEsMkNBQUE7O0FBQ0UsZ0JBQU8sSUFBUDtBQUFBLGVBQ08sUUFBQSxLQUFZLEVBRG5CO1lBQ3VDO0FBQWhDO0FBRFAsZUFFTyxRQUFBLEtBQVksR0FGbkI7WUFFdUMsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxRQUFOO1lBQWdCLENBQUMsQ0FBQyxHQUFGLENBQU0sT0FBTjtBQUFoRDtBQUZQLGVBR08sUUFBQSxLQUFZLEdBSG5CO1lBR3VDLENBQUMsQ0FBQyxHQUFGLENBQU0sT0FBTjtBQUFoQztBQUhQLGVBSU8sTUFBTSxDQUFDLElBQVAsQ0FBWSxRQUFaLENBSlA7WUFJdUMsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFBLEdBQUEsQ0FBQSxDQUFNLFFBQU4sQ0FBQSxDQUFOO0FBQWhDO0FBSlAsZUFLTyxNQUFNLENBQUMsSUFBUCxDQUFZLFFBQVosQ0FMUDtZQUt1QyxDQUFDLENBQUMsR0FBRixDQUFNLENBQUEsQ0FBQSxDQUFHLFFBQUgsQ0FBQSxDQUFBLENBQU47QUFBaEM7QUFMUCxlQU1PLENBQUksR0FBRyxDQUFDLElBQUosQ0FBUyxRQUFULENBTlg7WUFNdUMsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFBLENBQUEsQ0FBRyxRQUFILENBQUEsRUFBQSxDQUFOO0FBQWhDO0FBTlA7WUFPTyxDQUFDLENBQUMsR0FBRixDQUFNLFFBQU47QUFQUDtNQURGO01BU0EsSUFBa0IsQ0FBQyxDQUFDLElBQUYsS0FBVSxDQUE1QjtRQUFBLENBQUMsQ0FBQyxHQUFGLENBQU0sUUFBTixFQUFBOztNQUNBLElBQWUsQ0FBQyxDQUFDLElBQUYsS0FBWSxDQUEzQjtRQUFBLENBQUMsQ0FBQyxNQUFGLENBQVMsRUFBVCxFQUFBOztBQUNBLGFBQU87UUFBRSxTQUFBLEVBQVcsQ0FBYjtRQUFnQjtNQUFoQjtJQWZjLEVBM0V6Qjs7SUE2RkUsb0JBQUEsR0FBdUIsUUFBQSxDQUFBLEdBQUUsU0FBRixDQUFBO0FBQ3pCLFVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxHQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTs4Q0FEeUM7TUFDckMsUUFBQSxHQUFnQixJQUFJLFFBQUosQ0FBYSxHQUFBLFNBQWI7TUFDaEIsWUFBQSxHQUFnQixJQURwQjs7QUFHSSxjQUFPLElBQUEsR0FBTyxPQUFBLENBQVEsR0FBUixDQUFkOztBQUFBLGFBRU8sZ0JBRlA7VUFHSSxPQUFBLEdBQVU7VUFDVixHQUFBLEdBQVUsTUFBQSxDQUFPLGtCQUFQLEVBQTJCLFNBQUEsQ0FBRSxDQUFGLENBQUE7WUFDbkMsS0FBc0IsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsQ0FBaEIsQ0FBdEI7QUFBQSxxQkFBTyxDQUFBLE1BQU0sQ0FBTixFQUFQOztZQUNBLE9BQVcsWUFBWSxDQUFDLElBQWIsQ0FBa0IsQ0FBbEI7bUJBQXFCO1VBRkcsQ0FBM0I7QUFGUDs7QUFGUCxhQVFPLGlCQVJQO1VBU0ksT0FBQSxHQUFVO1VBQ1YsR0FBQSxHQUFVLE1BQUEsQ0FBTyxtQkFBUCxFQUE0QixNQUFBLFNBQUEsQ0FBRSxDQUFGLENBQUE7WUFDcEMsS0FBc0IsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsQ0FBaEIsQ0FBdEI7QUFBQSxxQkFBTyxDQUFBLE1BQU0sQ0FBTixFQUFQOztZQUNBLE9BQVcsQ0FBQSxNQUFNLFlBQVksQ0FBQyxJQUFiLENBQWtCLENBQWxCLENBQU47bUJBQTJCO1VBRkYsQ0FBNUI7QUFGUDs7QUFSUCxhQWNPLFVBZFA7VUFlSSxPQUFBLEdBQVU7VUFDVixHQUFBLEdBQVUsTUFBQSxDQUFPLENBQUEsVUFBQSxDQUFBLENBQWEsWUFBWSxDQUFDLElBQTFCLENBQUEsQ0FBUCxFQUF5QyxTQUFBLENBQUUsQ0FBRixDQUFBO1lBQ2pELEtBQXNCLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLENBQXRCO0FBQUEscUJBQU8sQ0FBQSxNQUFNLENBQU4sRUFBUDs7WUFDQSxZQUFBLENBQWEsQ0FBYjtZQUFnQixNQUFNO21CQUFHO1VBRndCLENBQXpDO0FBRlA7O0FBZFAsYUFvQk8sZUFwQlA7VUFxQkksT0FBQSxHQUFVO1VBQ1YsR0FBQSxHQUFVLE1BQUEsQ0FBTyxDQUFBLFVBQUEsQ0FBQSxDQUFhLFlBQVksQ0FBQyxJQUExQixDQUFBLENBQVAsRUFBeUMsTUFBQSxTQUFBLENBQUUsQ0FBRixDQUFBO1lBQ2pELEtBQXNCLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLENBQXRCO0FBQUEscUJBQU8sQ0FBQSxNQUFNLENBQU4sRUFBUDs7WUFDQSxNQUFNLFlBQUEsQ0FBYSxDQUFiO1lBQWdCLE1BQU07bUJBQUc7VUFGa0IsQ0FBekM7QUFGUDs7QUFwQlAsYUEwQk8sbUJBMUJQO1VBMkJJLE9BQUEsR0FBVTtVQUNWLEdBQUEsR0FBVSxNQUFBLENBQU8sQ0FBQSxZQUFBLENBQUEsQ0FBZSxZQUFZLENBQUMsSUFBNUIsQ0FBQSxDQUFQLEVBQTJDLFNBQUEsQ0FBRSxDQUFGLENBQUE7WUFDbkQsS0FBc0IsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsQ0FBaEIsQ0FBdEI7QUFBQSxxQkFBTyxDQUFBLE1BQU0sQ0FBTixFQUFQOztZQUNBLE9BQVcsWUFBQSxDQUFhLENBQWI7bUJBQWdCO1VBRndCLENBQTNDO0FBRlA7O0FBMUJQLGFBZ0NPLHdCQWhDUDtVQWlDSSxPQUFBLEdBQVU7VUFDVixHQUFBLEdBQVUsTUFBQSxDQUFPLENBQUEsWUFBQSxDQUFBLENBQWUsWUFBWSxDQUFDLElBQTVCLENBQUEsQ0FBUCxFQUEyQyxNQUFBLFNBQUEsQ0FBRSxDQUFGLENBQUE7WUFDbkQsS0FBc0IsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsQ0FBaEIsQ0FBdEI7QUFBQSxxQkFBTyxDQUFBLE1BQU0sQ0FBTixFQUFQOztZQUNBLE9BQVcsQ0FBQSxNQUFNLFlBQUEsQ0FBYSxDQUFiLENBQU47bUJBQXNCO1VBRmtCLENBQTNDO0FBRlA7QUFoQ1A7O1VBc0NPLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx1RkFBQSxDQUFBLENBQTBGLElBQTFGLENBQUEsQ0FBVjtBQXRDYixPQUhKOztBQTJDSSxhQUFPLENBQUUsR0FBRixFQUFPLFlBQVAsRUFBcUIsSUFBckIsRUFBMkIsT0FBM0I7SUE1Q2M7SUFnRGpCOztNQUFOLE1BQUEsY0FBQSxDQUFBOztRQUdFLFdBQWEsQ0FBRSxHQUFGLENBQUEsRUFBQTs7VUFFWCxJQUFDLENBQUEsU0FBRCxDQUFXLEdBQVg7VUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO1VBQ2QsSUFBQyxDQUFBLEtBQUQsR0FBYztBQUNkLGlCQUFPO1FBTEksQ0FEakI7OztRQVNJLFNBQVcsQ0FBRSxHQUFGLENBQUE7VUFDVCxJQUFDLENBQUEsR0FBRCxHQUFVLENBQUUsR0FBQSxzQkFBRixFQUE2QixHQUFBLEdBQTdCO1VBQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFFBQUosQ0FBYSxJQUFDLENBQUEsR0FBRyxDQUFDLE1BQWxCO2lCQUNUO1FBSFEsQ0FUZjs7O1FBbUJJLElBQU0sQ0FBQSxHQUFFLEVBQUYsQ0FBQTtVQUFhLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBckIsRUFBNkIsQ0FBN0IsRUFBZ0MsR0FBQSxFQUFoQztpQkFBd0M7UUFBckQ7O1FBQ04sR0FBTSxDQUFFLEVBQUYsQ0FBQTtVQUFhLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTSxDQUFDLEdBQVAsQ0FBVyxFQUFYLENBQU47aUJBQXdDO1FBQXJELENBcEJWOzs7UUF1QkksVUFBWSxDQUFBLEdBQUUsQ0FBRixDQUFBO2lCQUFZLElBQUMsQ0FBQSxLQUFELENBQU8sT0FBUCxFQUFrQixHQUFBLENBQWxCO1FBQVo7O1FBQ1osU0FBWSxDQUFBLEdBQUUsQ0FBRixDQUFBO2lCQUFZLElBQUMsQ0FBQSxLQUFELENBQU8sTUFBUCxFQUFrQixHQUFBLENBQWxCO1FBQVo7O1FBQ1osUUFBWSxDQUFBLEdBQUUsQ0FBRixDQUFBO2lCQUFZLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxFQUFrQixHQUFBLENBQWxCO1FBQVo7O1FBQ1osR0FBWSxDQUFBLEdBQUUsQ0FBRixDQUFBO2lCQUFZLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFaLEVBQWtCLEdBQUEsQ0FBbEI7UUFBWixDQTFCaEI7OztRQTZCSSxJQUFNLENBQUEsR0FBRSxFQUFGLENBQUE7VUFDSixJQUFDLENBQUEsSUFBRCxDQUFNLEdBQUEsRUFBTjtBQUNBLGlCQUFPLElBQUMsQ0FBQSxjQUFELENBQUE7UUFGSDs7TUEvQlI7OztNQWlCRSxVQUFBLENBQVcsYUFBQyxDQUFBLFNBQVosRUFBZ0IsUUFBaEIsRUFBNEIsUUFBQSxDQUFBLENBQUE7ZUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDO01BQWYsQ0FBNUI7O01BQ0EsVUFBQSxDQUFXLGFBQUMsQ0FBQSxTQUFaLEVBQWdCLFVBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLEtBQXNCO01BQXpCLENBQTVCOzs7O2tCQS9KSjs7SUFrTFEsWUFBTixNQUFBLFVBQUEsUUFBOEIsY0FBOUIsQ0FBQTtJQUNNLGtCQUFOLE1BQUEsZ0JBQUEsUUFBOEIsY0FBOUIsQ0FBQSxFQW5MRjs7SUFzTEUsU0FBUyxDQUFBLFNBQUUsQ0FBQSxLQUFYLEdBQW1CLFFBQUEsQ0FBRSxNQUFGLEVBQUEsR0FBVSxDQUFWLENBQUEsRUFBQTs7O0FBQ3JCLFVBQUE7TUFFSSxDQUFBLEdBQUksS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsSUFBRCxDQUFNLEdBQUEsQ0FBTixDQUFYO01BQ0osSUFBWSxNQUFBLEtBQVUsS0FBdEI7QUFBQSxlQUFPLEVBQVA7O01BQ0EsSUFBRyxDQUFDLENBQUMsTUFBRixLQUFZLENBQWY7UUFDRSxJQUEyQyxJQUFDLENBQUEsR0FBRyxDQUFDLFFBQUwsS0FBaUIsTUFBNUQ7VUFBQSxNQUFNLElBQUksS0FBSixDQUFVLHVCQUFWLEVBQU47O0FBQ0EsZUFBTyxJQUFDLENBQUEsR0FBRyxDQUFDLFNBRmQ7O01BR0EsSUFBa0IsTUFBQSxLQUFVLE9BQTVCO0FBQUEsZUFBTyxDQUFDLENBQUMsRUFBRixDQUFNLENBQU4sRUFBUDs7TUFDQSxJQUFrQixNQUFBLEtBQVUsTUFBNUI7QUFBQSxlQUFPLENBQUMsQ0FBQyxFQUFGLENBQUssQ0FBQyxDQUFOLEVBQVA7O01BQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDBCQUFBLENBQUEsQ0FBNkIsTUFBN0IsQ0FBQSxDQUFWO0lBVlcsRUF0THJCOztJQW1NRSxlQUFlLENBQUEsU0FBRSxDQUFBLEtBQWpCLEdBQXlCLE1BQUEsUUFBQSxDQUFFLE1BQUYsRUFBQSxHQUFVLENBQVYsQ0FBQSxFQUFBOzs7O0FBQzNCLFVBQUE7TUFHSSxDQUFBLEdBQUksQ0FBQSxNQUFNLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBQSxDQUFOLENBQWhCLENBQU47TUFDSixJQUFZLE1BQUEsS0FBVSxLQUF0QjtBQUFBLGVBQU8sRUFBUDs7TUFDQSxJQUFHLENBQUMsQ0FBQyxNQUFGLEtBQVksQ0FBZjtRQUNFLElBQTJDLElBQUMsQ0FBQSxHQUFHLENBQUMsUUFBTCxLQUFpQixNQUE1RDtVQUFBLE1BQU0sSUFBSSxLQUFKLENBQVUsdUJBQVYsRUFBTjs7QUFDQSxlQUFPLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FGZDs7TUFHQSxJQUFrQixNQUFBLEtBQVUsT0FBNUI7QUFBQSxlQUFPLENBQUMsQ0FBQyxFQUFGLENBQU0sQ0FBTixFQUFQOztNQUNBLElBQWtCLE1BQUEsS0FBVSxNQUE1QjtBQUFBLGVBQU8sQ0FBQyxDQUFDLEVBQUYsQ0FBSyxDQUFDLENBQU4sRUFBUDs7TUFDQSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMEJBQUEsQ0FBQSxDQUE2QixNQUE3QixDQUFBLENBQVY7SUFYaUIsRUFuTTNCOztJQWlORSxTQUFTLENBQUEsU0FBRSxDQUFBLGNBQVgsR0FBNEIsU0FBQSxDQUFBLENBQUE7QUFDOUIsVUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBO01BQUksUUFBQSxHQUFZO01BQ1osS0FBQSxHQUFZLEVBRGhCOztNQUdJLEtBQUEsdUNBQUE7UUFDRSxLQUFBO1FBQ0EsSUFBRyxDQUFFLEtBQUEsS0FBUyxDQUFYLENBQUEsSUFBbUIsQ0FBRSxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUwsS0FBYSxPQUFmLENBQXRCO1VBQ0UsTUFBTSxNQURSO1NBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsSUFBTCxLQUFhLEtBQWhCO1VBQ0gsTUFBTSxNQURIOztRQUVMLFFBQUEsR0FBVztNQU5iO01BUUEsSUFBa0IsQ0FBRSxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUwsS0FBYSxNQUFmLENBQUEsSUFBNEIsQ0FBRSxLQUFBLEdBQVEsQ0FBVixDQUE5Qzs7UUFBQSxNQUFNLFNBQU47O2FBQ0M7SUFieUIsRUFqTjlCOztJQWlPRSxlQUFlLENBQUEsU0FBRSxDQUFBLGNBQWpCLEdBQWtDLE1BQUEsU0FBQSxDQUFBLENBQUE7QUFDcEMsVUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBO01BQUksUUFBQSxHQUFZO01BQ1osS0FBQSxHQUFZLEVBRGhCOztNQUdJLG1EQUFBO1FBQ0UsS0FBQTtRQUNBLElBQUcsQ0FBRSxLQUFBLEtBQVMsQ0FBWCxDQUFBLElBQW1CLENBQUUsSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFMLEtBQWEsT0FBZixDQUF0QjtVQUNFLE1BQU0sTUFEUjtTQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUwsS0FBYSxLQUFoQjtVQUNILE1BQU0sTUFESDs7UUFFTCxRQUFBLEdBQVc7TUFOYjtNQVFBLElBQWtCLENBQUUsSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFMLEtBQWEsTUFBZixDQUFBLElBQTRCLENBQUUsS0FBQSxHQUFRLENBQVYsQ0FBOUM7O1FBQUEsTUFBTSxTQUFOOzthQUNDO0lBYitCLEVBak9wQzs7SUFpUEUsU0FBUyxDQUFBLFNBQUUsQ0FBQSx1QkFBWCxHQUFxQyxTQUFBLENBQUEsQ0FBQTtNQUNuQyxJQUFHLElBQUMsQ0FBQSxRQUFKO0FBQW9CLGVBQXVELElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxHQUFnQixDQUF2RTtVQUFBLE1BQWtDLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFBO1FBQWxDLENBQXBCO09BQUEsTUFBQTtBQUNvQixlQUF1RCxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsR0FBZ0IsQ0FBdkU7VUFBQSxPQUFpQixJQUFDLENBQUEsVUFBVSxDQUFFLENBQUYsQ0FBWCxDQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQSxDQUFqQjtRQUFqQixDQURwQjs7YUFFQztJQUhrQyxFQWpQdkM7O0lBdVBFLGVBQWUsQ0FBQSxTQUFFLENBQUEsdUJBQWpCLEdBQTJDLE1BQUEsU0FBQSxDQUFBLENBQUE7TUFDekMsSUFBRyxJQUFDLENBQUEsUUFBSjtBQUFvQixlQUF1RCxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsR0FBZ0IsQ0FBdkU7VUFBQSxNQUFrQyxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTtRQUFsQyxDQUFwQjtPQUFBLE1BQUE7QUFDb0IsZUFBdUQsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLEdBQWdCLENBQXZFO1VBQUEsT0FBVyxDQUFBLE1BQU0sSUFBQyxDQUFBLFVBQVUsQ0FBRSxDQUFGLENBQVgsQ0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUEsQ0FBakIsQ0FBTjtRQUFYLENBRHBCOzthQUVDO0lBSHdDLEVBdlA3Qzs7SUE2UEUsU0FBUyxDQUFBLFNBQUUsQ0FBQSxJQUFYLEdBQWtCLFFBQUEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUNwQixVQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTs4Q0FEb0M7TUFDaEMsQ0FBQSxDQUFFLEdBQUYsRUFDRSxPQURGLEVBRUUsSUFGRixDQUFBLEdBRWMsb0JBQUEsQ0FBcUIsR0FBQSxTQUFyQixFQUFtQyxHQUFuQyxDQUZkO01BR0EsS0FBTyxPQUFQO1FBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLCtEQUFBLENBQUEsQ0FBa0UsSUFBbEUsQ0FBQSxDQUFWLEVBRFI7O01BRUEsTUFBQSxHQUFjLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FMOUI7O01BT0ksR0FBQSxHQUFjO01BQ2QsT0FBQSxHQUFjLEtBUmxCOztNQVVJLENBQUEsR0FBSSxNQUFBLENBQU8sQ0FBQSxVQUFBLENBQUEsQ0FBYSxHQUFHLENBQUMsSUFBakIsQ0FBQSxDQUFQLEVBQW1DLENBQUEsUUFBQSxDQUFFLEVBQUYsQ0FBQTtlQUFjLFNBQUEsQ0FBRSxDQUFGLENBQUE7VUFDbkQsSUFBTyxXQUFQO1lBQ0UsR0FBQSxHQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUUsTUFBQSxHQUFTLENBQVg7WUFDbkIsSUFBRyxXQUFIO2NBQWMsT0FBQSxHQUFVLFNBQUEsQ0FBRSxDQUFGLENBQUE7QUFBUSxvQkFBQTtnQkFBQyxLQUFBLFdBQUE7a0JBQUUsQ0FBQSxPQUFpQixHQUFBLENBQUksQ0FBSixDQUFqQjtnQkFBRjt1QkFBMkQ7Y0FBcEUsRUFBeEI7YUFBQSxNQUFBO2NBQ2MsT0FBQSxHQUFVLFNBQUEsQ0FBRSxDQUFGLENBQUE7QUFBUSxvQkFBQTtnQkFBQyxLQUFBLFdBQUE7a0JBQUEsQ0FBYSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQVYsQ0FBaUIsQ0FBakIsQ0FBWCxHQUFBLENBQUEsTUFBTSxDQUFOLENBQUEsR0FBQSxNQUFGO2dCQUFBO3VCQUEyRDtjQUFwRSxFQUR4QjthQUZGOztVQUtBLE9BQVcsT0FBQSxDQUFRLENBQVI7aUJBQVc7UUFONkI7TUFBZCxDQUFBLEVBQU8sS0FBMUMsRUFWUjs7TUFrQkksSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsYUFBTztJQXBCUyxFQTdQcEI7O0lBb1JFLGVBQWUsQ0FBQSxTQUFFLENBQUEsSUFBakIsR0FBd0IsUUFBQSxDQUFBLEdBQUUsU0FBRixDQUFBO0FBQzFCLFVBQUEsQ0FBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTs4Q0FEMEM7TUFDdEMsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFjLG9CQUFBLENBQXFCLEdBQUEsU0FBckIsRUFBbUMsR0FBbkMsQ0FBZDtNQUNBLE1BQUEsR0FBYyxJQUFDLENBQUEsVUFBVSxDQUFDLE9BRDlCOztNQUdJLEdBQUEsR0FBYztNQUNkLE9BQUEsR0FBYyxLQUpsQjs7TUFNSSxDQUFBLEdBQUksTUFBQSxDQUFPLENBQUEsVUFBQSxDQUFBLENBQWEsR0FBRyxDQUFDLElBQWpCLENBQUEsQ0FBUCxFQUFtQyxDQUFBLFFBQUEsQ0FBRSxFQUFGLENBQUE7ZUFBYyxNQUFBLFNBQUEsQ0FBRSxDQUFGLENBQUE7VUFDbkQsSUFBTyxXQUFQO1lBQ0UsR0FBQSxHQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUUsTUFBQSxHQUFTLENBQVg7WUFDbkIsSUFBRyxXQUFIO2NBQWMsT0FBQSxHQUFVLE1BQUEsU0FBQSxDQUFFLENBQUYsQ0FBQTtBQUFRLG9CQUFBO2dCQUFDLHVCQUFBO2tCQUFFLENBQUEsT0FBVyxDQUFBLE1BQU0sR0FBQSxDQUFJLENBQUosQ0FBTixDQUFYO2dCQUFGO3VCQUEyRDtjQUFwRSxFQUF4QjthQUFBLE1BQUE7Y0FDYyxPQUFBLEdBQVUsTUFBQSxTQUFBLENBQUUsQ0FBRixDQUFBO0FBQVEsb0JBQUE7Z0JBQUMsdUJBQUE7a0JBQUEsQ0FBYSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQVYsQ0FBaUIsQ0FBakIsQ0FBWCxHQUFBLENBQUEsTUFBTSxDQUFOLENBQUEsR0FBQSxNQUFGO2dCQUFBO3VCQUEyRDtjQUFwRSxFQUR4QjthQUZGOztVQUtBLE9BQVcsQ0FBQSxNQUFNLE9BQUEsQ0FBUSxDQUFSLENBQU47aUJBQWlCO1FBTnVCO01BQWQsQ0FBQSxFQUFPLEtBQTFDLEVBTlI7O01BY0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsYUFBTztJQWhCZSxFQXBSMUI7O0lBdVNFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQ3hCLE9BRHdCLEVBRXhCLE1BRndCLEVBR3hCLHNCQUh3QixFQUl4QixRQUp3QixFQUt4QixvQkFMd0IsRUFNeEIsbUJBTndCLEVBT3hCLGlCQVB3QixFQVF4QixXQVJ3QixDQUFkO0FBU1osV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsZUFBYixFQUE4QixTQUE5QjtFQWpUQyxFQVRwQjs7O0VBK1RBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7V0FBRyxDQUFFLGlCQUFGO0VBQUgsQ0FBQSxHQUFqQztBQS9UQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSAgPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xuICB0eXBlX29mID0gKCB4ICkgLT5cbiAgICByZXR1cm4gICdzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgICAgICAgSmV0c3RyZWFtIClcbiAgICByZXR1cm4gJ2FzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgQXN5bmNfamV0c3RyZWFtIClcbiAgICByZXR1cm4gX3R5cGVfb2YgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIHBpY2s6ICdhbGwnLCBmYWxsYmFjazogbWlzZml0LCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTZWxlY3RvclxuICAgIGNvbnN0cnVjdG9yOiAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICAgIHNlbGVjdG9ycywgIH0gPSBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi5cbiAgICAgIEBzZWxlY3RvcnNfcnByICA9IHNlbGVjdG9yc19ycHJcbiAgICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICAgIEBjdWVzICAgICAgICAgICA9IGZhbHNlXG4gICAgICBmb3Igc2VsZWN0b3IgZnJvbSBzZWxlY3RvcnNcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdkYXRhIyonIHRoZW4gQGRhdGEgPSB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnY3VlIyonIHRoZW4gQGN1ZXMgPSB0cnVlXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICAjIyMgVEFJTlQgbWVudGlvbiBvcmlnaW5hbCBzZWxlY3RvciBuZXh0IHRvIG5vcm1hbGl6ZWQgZm9ybSAjIyNcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18xIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQsIGdvdCAje3NlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgIEBjdWVzID0gbmV3IFNldCgpIGlmIEBjdWVzIGluIFsgdHJ1ZSwgZmFsc2UsIF1cbiAgICAgICAgICAgIEBjdWVzLmFkZCBtYXRjaC5ncm91cHMuaWRcbiAgICAgICAgICBlbHNlIG51bGxcbiAgICAgIEBhY2NlcHRfYWxsICAgICA9ICggQGRhdGEgaXMgdHJ1ZSApIGFuZCAoIEBjdWVzIGlzIHRydWUgKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZWxlY3Q6ICggaXRlbSApIC0+XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBAYWNjZXB0X2FsbFxuICAgICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICAgIHJldHVybiB0cnVlICAgaWYgQGN1ZXMgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2UgIGlmIEBjdWVzIGlzIGZhbHNlXG4gICAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9jdWUgaXRlbVxuICAgICAgcmV0dXJuIHRydWUgICBpZiBAZGF0YSBpcyB0cnVlXG4gICAgICByZXR1cm4gZmFsc2UgIGlmIEBkYXRhIGlzIGZhbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICAgIyByZXR1cm4gQGRhdGEuaGFzIGlkX2Zyb21fdmFsdWUgaXRlbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgc2hvdWxkIHByb3ZpZGUgbWV0aG9kIHRvIGdlbmVyYXRlIG5vcm1hbGl6ZWQgcmVwcmVzZW50YXRpb24gIyMjXG4gICAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZF9mcm9tX2N1ZSA9ICggc3ltYm9sICkgLT4gc3ltYm9sLmRlc2NyaXB0aW9uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZWxlY3RvcnNfYXNfbGlzdCA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmZsYXQgSW5maW5pdHlcbiAgICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5qb2luICcsJ1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5yZXBsYWNlIC9cXHMrL2csICcnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgcmV0dXJuIHNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT4gKCBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi4gKS5zZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHNlbGVjdG9ycyAgICAgPSBzZWxlY3RvcnNfYXNfbGlzdCBzZWxlY3RvcnMuLi5cbiAgICBzZWxlY3RvcnNfcnByID0gc2VsZWN0b3JzLmpvaW4gJywgJ1xuICAgIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgICBmb3Igc2VsZWN0b3IgaW4gc2VsZWN0b3JzXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcqJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJkYXRhIypcIjsgUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyMnICAgICAgICAgICAgdGhlbiBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgICB3aGVuIC8uKyMkLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSpcIlxuICAgICAgICB3aGVuIG5vdCAvIy8udGVzdCBzZWxlY3RvciAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSMqXCJcbiAgICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICAgIFIuYWRkICdkYXRhIyonIGlmIFIuc2l6ZSBpcyAwXG4gICAgUi5kZWxldGUgJycgaWYgUi5zaXplIGlzbnQgMVxuICAgIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbmZpZ3VyZV90cmFuc2Zvcm0gPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICBzZWxlY3RvciAgICAgID0gbmV3IFNlbGVjdG9yIHNlbGVjdG9ycy4uLlxuICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnc3luY19qZXRzdHJlYW0nXG4gICAgICAgIGlzX3N5bmMgPSB0cnVlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgJyhzeW5jX2pldHN0cmVhbSknLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfdGZtLndhbGsgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdhc3luY19qZXRzdHJlYW0nXG4gICAgICAgIGlzX3N5bmMgPSBmYWxzZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0ICcoYXN5bmNfamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gdHJ1ZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgb3JpZ2luYWxfdGZtIGQ7IHlpZWxkIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnYXN5bmNmdW5jdGlvbidcbiAgICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICBhd2FpdCBvcmlnaW5hbF90Zm0gZDsgeWllbGQgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgaXNfc3luYyA9IHRydWVcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdhc3luY2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gZmFsc2VcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18zIGV4cGVjdGVkIGEgamV0c3RyZWFtIG9yIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gb3IgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiB7IHRmbSwgb3JpZ2luYWxfdGZtLCB0eXBlLCBpc19zeW5jLCB9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbV9hYmNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICAgIEBjb25maWd1cmUgY2ZnXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZTogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgICBAb3V0bGV0ID0gbmV3IFNlbGVjdG9yIEBjZmcub3V0bGV0XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEB0cmFuc2Zvcm1zLmxlbmd0aCBpcyAwXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNlbmQ6ICggZHMuLi4gKSAtPiBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uICA7bnVsbFxuICAgIGN1ZTogICggaWQgICAgKSAtPiBAc2VuZCBTeW1ib2wuZm9yIGlkICAgICAgICAgICAgICAgICAgICA7bnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBwaWNrX2ZpcnN0OiAoIFAuLi4gKSAtPiBAX3BpY2sgJ2ZpcnN0JywgICBQLi4uXG4gICAgcGlja19sYXN0OiAgKCBQLi4uICkgLT4gQF9waWNrICdsYXN0JywgICAgUC4uLlxuICAgIHBpY2tfYWxsOiAgICggUC4uLiApIC0+IEBfcGljayAnYWxsJywgICAgIFAuLi5cbiAgICBydW46ICAgICAgICAoIFAuLi4gKSAtPiBAX3BpY2sgQGNmZy5waWNrLCBQLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfYW5kX3BpY2soKVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW0gICAgICAgZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG4gIGNsYXNzIEFzeW5jX2pldHN0cmVhbSBleHRlbmRzIEpldHN0cmVhbV9hYmNcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+XG4gICAgIyMjIE5PVEUgdGhpcyB1c2VkIHRvIGJlIHRoZSBpZGlvbWF0aWMgZm9ybXVsYXRpb24gYFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdYDsgZm9yIHRoZSBzYWtlIG9mIG1ha2luZ1xuICAgIHN5bmMgYW5kIGFzeW5jIHZlcnNpb25zIG1heGltYWxseSBzaW1pbGFyLCByZXdyaXR0ZW4gYXMgdGhlIHN5bmMgdmVyc2lvbiBvZiBgYXdhaXQgQXJyYXkuZnJvbUFzeW5jIEB3YWxrIFAuLi5gICMjI1xuICAgIFIgPSBBcnJheS5mcm9tIEB3YWxrIFAuLi5cbiAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNCBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgcmV0dXJuIFIuYXQgIDAgaWYgcGlja2VyIGlzICdmaXJzdCdcbiAgICByZXR1cm4gUi5hdCAtMSBpZiBwaWNrZXIgaXMgJ2xhc3QnXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzUgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+XG4gICAgIyMjIE5PVEUgYmVzdCBhc3luYyBlcXVpdmFsZW50IHRvIGBbICggQHdhbGsgUC4uLiApLi4uLCBdYCBJIGNvdWxkIGZpbmQgIyMjXG4gICAgIyMjIE5PVEUgbXkgZmlyc3Qgc29sdXRpb24gd2FzIGBSID0gKCBkIGZvciBhd2FpdCBkIGZyb20gQHdhbGsgUC4uLiApYCwgYnV0IHRoYXQgdHJhbnNwaWxlcyBpbnRvIHF1aXRlIGEgZmV3IGxpbmVzIG9mIEpTICMjI1xuICAgICMjIyB0aHggdG8gaHR0cHM6Ly9hbGx0aGluZ3NzbWl0dHkuY29tLzIwMjUvMDcvMTQvbW9kZXJuLWFzeW5jLWl0ZXJhdGlvbi1pbi1qYXZhc2NyaXB0LXdpdGgtYXJyYXktZnJvbWFzeW5jLyAjIyNcbiAgICBSID0gYXdhaXQgQXJyYXkuZnJvbUFzeW5jIEB3YWxrIFAuLi5cbiAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNiBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgcmV0dXJuIFIuYXQgIDAgaWYgcGlja2VyIGlzICdmaXJzdCdcbiAgICByZXR1cm4gUi5hdCAtMSBpZiBwaWNrZXIgaXMgJ2xhc3QnXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzcgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICAgIHByZXZpb3VzICA9IG1pc2ZpdFxuICAgIGNvdW50ICAgICA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciB2YWx1ZSBmcm9tIEBfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbigpXG4gICAgICBjb3VudCsrXG4gICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgcHJldmlvdXMgPSB2YWx1ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpfd2Fsa19hbmRfcGljayA9IC0+XG4gICAgcHJldmlvdXMgID0gbWlzZml0XG4gICAgY291bnQgICAgID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGF3YWl0IHZhbHVlIGZyb20gQF93YWxrX2FsbF90b19leGhhdXN0aW9uKClcbiAgICAgIGNvdW50KytcbiAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgIGVsc2UgaWYgQGNmZy5waWNrIGlzICdhbGwnXG4gICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICBwcmV2aW91cyA9IHZhbHVlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB5aWVsZCBwcmV2aW91cyBpZiAoIEBjZmcucGljayBpcyAnbGFzdCcgKSBhbmQgKCBjb3VudCA+IDAgKVxuICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBKZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgeWllbGQgZnJvbSAgICAgICBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24gPSAtPlxuICAgIGlmIEBpc19lbXB0eSAgdGhlbiAgeWllbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgZWxzZSAgICAgICAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpwdXNoID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gICAgeyB0Zm0sXG4gICAgICBpc19zeW5jLFxuICAgICAgdHlwZSwgICB9ID0gX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICB1bmxlc3MgaXNfc3luY1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzggY2Fubm90IHVzZSBhc3luYyB0cmFuc2Zvcm0gaW4gc3luYyBqZXRzdHJlYW0sIGdvdCBhICN7dHlwZX1cIlxuICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBueHQgICAgICAgICA9IG51bGxcbiAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSAgICAgICBueHQgaiAgICAgICAgICkgZm9yICAgICAgIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciAgICAgICBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06OnB1c2ggPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICB7IHRmbSwgICAgfSA9IF9jb25maWd1cmVfdHJhbnNmb3JtIHNlbGVjdG9ycy4uLiwgdGZtXG4gICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je3RmbS5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tIGF3YWl0IG54dCBqICAgICAgICAgKSBmb3IgYXdhaXQgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGF3YWl0IGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB5aWVsZCBmcm9tIGF3YWl0IHlpZWxkZXIgZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIHR5cGVfb2YsXG4gICAgbWlzZml0LFxuICAgIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX2N1ZSwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBBc3luY19qZXRzdHJlYW0sIGludGVybmFscywgfVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PiB7IHJlcXVpcmVfamV0c3RyZWFtLCB9XG4iXX0=
