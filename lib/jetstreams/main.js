(function() {
  'use strict';
  var Async_jetstream, Jetstream, Jetstream_abc, Selector, _configure_transform, _normalize_selectors, _type_of, debug, hide, id_from_cue, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  ({nameit} = require('./nameit'));

  ({
    type_of: _type_of
  } = (require('../unstable-rpr-type_of-brics')).require_type_of());

  ({hide, set_getter} = (require('../various-brics')).require_managed_property_tools());

  //===========================================================================================================
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

  //-----------------------------------------------------------------------------------------------------------
  misfit = Symbol('misfit');

  jetstream_cfg_template = {
    outlet: 'data#*',
    pick: 'all',
    fallback: misfit
  };

  //===========================================================================================================
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

    //---------------------------------------------------------------------------------------------------------
    _get_excerpt() {
      return {
        data: this.data,
        cues: this.cues,
        accept_all: this.accept_all
      };
    }

    //---------------------------------------------------------------------------------------------------------
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

      //---------------------------------------------------------------------------------------------------------
    /* TAINT should provide method to generate normalized representation */
    toString() {
      return this.selectors_rpr;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  id_from_cue = function(symbol) {
    return symbol.description;
  };

  //-----------------------------------------------------------------------------------------------------------
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
/* TAINT not generally possible */    return selectors;
  };

  //-----------------------------------------------------------------------------------------------------------
  normalize_selectors = function(...selectors) {
    return (_normalize_selectors(...selectors)).selectors;
  };

  //-----------------------------------------------------------------------------------------------------------
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

  //-----------------------------------------------------------------------------------------------------------
  _configure_transform = function(...selectors) {
    var is_sync, original_tfm, ref, selector, tfm, type;
    ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
    selector = new Selector(...selectors);
    original_tfm = tfm;
    //.........................................................................................................
    switch (type = type_of(tfm)) {
      //.......................................................................................................
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
      //.......................................................................................................
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
      //.......................................................................................................
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
      //.......................................................................................................
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
      //.......................................................................................................
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
      //.......................................................................................................
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
        //.......................................................................................................
        throw new Error(`Ωjstrm___3 expected a jetstream or a synchronous function or generator function, got a ${type}`);
    }
    //.........................................................................................................
    return {tfm, original_tfm, type, is_sync};
  };

  Jetstream_abc = (function() {
    //===========================================================================================================
    class Jetstream_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        /* TAINT use Object.freeze, push sets new array */
        this.configure(cfg);
        this.transforms = [];
        this.shelf = [];
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      configure(cfg) {
        this.cfg = {...jetstream_cfg_template, ...cfg};
        this.outlet = new Selector(this.cfg.outlet);
        return null;
      }

      //=========================================================================================================
      send(...ds) {
        this.shelf.splice(this.shelf.length, 0, ...ds);
        return null;
      }

      cue(id) {
        this.send(Symbol.for(id));
        return null;
      }

      //=========================================================================================================
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

      //---------------------------------------------------------------------------------------------------------
      _pick_from_list(picker, values) {
        if (picker === 'all') {
          return values;
        }
        if (values.length === 0) {
          if (this.cfg.fallback === misfit) {
            throw new Error("Ωjstrm___6 no results");
          }
          return this.cfg.fallback;
        }
        if (picker === 'first') {
          return values.at(0);
        }
        if (picker === 'last') {
          return values.at(-1);
        }
        throw new Error(`Ωjstrm___7 unknown picker ${picker}`);
      }

      //---------------------------------------------------------------------------------------------------------
      walk(...ds) {
        this.send(...ds);
        return this._walk_and_pick();
      }

    };

    //---------------------------------------------------------------------------------------------------------
    set_getter(Jetstream_abc.prototype, 'length', function() {
      return this.transforms.length;
    });

    set_getter(Jetstream_abc.prototype, 'is_empty', function() {
      return this.transforms.length === 0;
    });

    return Jetstream_abc;

  }).call(this);

  //===========================================================================================================
  Jetstream = class Jetstream extends Jetstream_abc {};

  Async_jetstream = class Async_jetstream extends Jetstream_abc {};

  //===========================================================================================================
  /* NOTE this used to be the idiomatic formulation `R = [ ( @walk P... )..., ]`; for the sake of making
  sync and async versions maximally similar, the sync version has been adapted to the async formulation. My
  first async solution was `R = ( d for await d from genfn P... )`, which doesn't transpilenicely. */
  /* thx to https://allthingssmitty.com/2025/07/14/modern-async-iteration-in-javascript-with-array-fromasync/ */
  Jetstream.prototype._pick = function(picker, ...P) {
    return this._pick_from_list(picker, Array.from(this.walk(...P)));
  };

  Async_jetstream.prototype._pick = async function(picker, ...P) {
    return this._pick_from_list(picker, (await Array.fromAsync(this.walk(...P))));
  };

  //===========================================================================================================
  Jetstream.prototype._walk_and_pick = function*() {
    var count, previous, value;
    previous = misfit;
    count = 0;
//.........................................................................................................
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
      //.........................................................................................................
      yield previous;
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  Async_jetstream.prototype._walk_and_pick = async function*() {
    var count, previous, value;
    previous = misfit;
    count = 0;
//.........................................................................................................
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
      //.........................................................................................................
      yield previous;
    }
    return null;
  };

  //===========================================================================================================
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

  //-----------------------------------------------------------------------------------------------------------
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

  //===========================================================================================================
  Jetstream.prototype.push = function(...selectors) {
    var R, is_sync, my_idx, nxt, ref, tfm, type, yielder;
    ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
    ({tfm, is_sync, type} = _configure_transform(...selectors, tfm));
    if (!is_sync) {
      throw new Error(`Ωjstrm___8 cannot use async transform in sync jetstream, got a ${type}`);
    }
    my_idx = this.transforms.length;
    //.........................................................................................................
    nxt = null;
    yielder = null;
    //.........................................................................................................
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
    //.........................................................................................................
    this.transforms.push(R);
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  Async_jetstream.prototype.push = function(...selectors) {
    var R, my_idx, nxt, ref, tfm, yielder;
    ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
    ({tfm} = _configure_transform(...selectors, tfm));
    my_idx = this.transforms.length;
    //.........................................................................................................
    nxt = null;
    yielder = null;
    //.........................................................................................................
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
    //.........................................................................................................
    this.transforms.push(R);
    return R;
  };

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    var exports, internals;
    internals = Object.freeze({type_of, misfit, jetstream_cfg_template, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_cue});
    return exports = {Jetstream, Async_jetstream, internals};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pldHN0cmVhbXMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZUFBQSxFQUFBLFNBQUEsRUFBQSxhQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsb0JBQUEsRUFBQSxRQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQTtJQUFBLGtCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZDs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxVQUFSLENBQTVCOztFQUNBLENBQUE7SUFBRSxPQUFBLEVBQVM7RUFBWCxDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxlQUE1QyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGtCQUFSLENBQUYsQ0FBOEIsQ0FBQyw4QkFBL0IsQ0FBQSxDQUQ1QixFQU5BOzs7O0VBV0EsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7SUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsYUFBUSxpQkFBUjs7SUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxhQUFPLGtCQUFQOztBQUNBLFdBQU8sUUFBQSxDQUFTLENBQVQ7RUFIQyxFQVhWOzs7RUFpQkEsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDs7RUFDMUIsc0JBQUEsR0FBMEI7SUFBRSxNQUFBLEVBQVEsUUFBVjtJQUFvQixJQUFBLEVBQU0sS0FBMUI7SUFBaUMsUUFBQSxFQUFVO0VBQTNDLEVBbEIxQjs7O0VBcUJNLFdBQU4sTUFB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QUFNLE9BQUEsQ0FBUSxDQUFSLENBQU47ZUFBaUI7TUFOdUI7SUFBZCxDQUFBLEVBQU8sS0FBMUMsRUFOTjs7SUFjRSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxXQUFPO0VBaEJlLEVBL1F4Qjs7O0VBbVNBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDakMsUUFBQSxPQUFBLEVBQUE7SUFBRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUN4QixPQUR3QixFQUV4QixNQUZ3QixFQUd4QixzQkFId0IsRUFJeEIsUUFKd0IsRUFLeEIsb0JBTHdCLEVBTXhCLG1CQU53QixFQU94QixpQkFQd0IsRUFReEIsV0FSd0IsQ0FBZDtBQVNaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLGVBQWIsRUFBOEIsU0FBOUI7RUFWYyxDQUFBLEdBQWpDO0FBblNBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ICA9IGNvbnNvbGVcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL25hbWVpdCdcbnsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xudHlwZV9vZiA9ICggeCApIC0+XG4gIHJldHVybiAgJ3N5bmNfamV0c3RyZWFtJyBpZiAoIHggaW5zdGFuY2VvZiAgICAgICBKZXRzdHJlYW0gKVxuICByZXR1cm4gJ2FzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgQXN5bmNfamV0c3RyZWFtIClcbiAgcmV0dXJuIF90eXBlX29mIHhcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5taXNmaXQgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSAgPSB7IG91dGxldDogJ2RhdGEjKicsIHBpY2s6ICdhbGwnLCBmYWxsYmFjazogbWlzZml0LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2VsZWN0b3JcbiAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICBlbHNlIG51bGxcbiAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9jdWUgaXRlbVxuICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWRfZnJvbV9jdWUgPSAoIHN5bWJvbCApIC0+IHN5bWJvbC5kZXNjcmlwdGlvblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gIHJldHVybiBzZWxlY3RvcnNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbl9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgIHN3aXRjaCB0cnVlXG4gICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbl9jb25maWd1cmVfdHJhbnNmb3JtID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gIHNlbGVjdG9yICAgICAgPSBuZXcgU2VsZWN0b3Igc2VsZWN0b3JzLi4uXG4gIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgdGZtXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdzeW5jX2pldHN0cmVhbSdcbiAgICAgIGlzX3N5bmMgPSB0cnVlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0ICcoc3luY19qZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfdGZtLndhbGsgZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2hlbiAnYXN5bmNfamV0c3RyZWFtJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0ICcoYXN5bmNfamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbS53YWxrIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IHRydWVcbiAgICAgIHRmbSAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdhc3luY2Z1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICBhd2FpdCBvcmlnaW5hbF90Zm0gZDsgeWllbGQgZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICBpc19zeW5jID0gdHJ1ZVxuICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdhc3luY2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIHlpZWxkIGZyb20gYXdhaXQgb3JpZ2luYWxfdGZtIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHJldHVybiB7IHRmbSwgb3JpZ2luYWxfdGZtLCB0eXBlLCBpc19zeW5jLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBKZXRzdHJlYW1fYWJjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICBAY29uZmlndXJlIGNmZ1xuICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgQG91dGxldCA9IG5ldyBTZWxlY3RvciBAY2ZnLm91dGxldFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoXG4gIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAdHJhbnNmb3Jtcy5sZW5ndGggaXMgMFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgc2VuZDogKCBkcy4uLiApIC0+IEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi4gIDtudWxsXG4gIGN1ZTogICggaWQgICAgKSAtPiBAc2VuZCBTeW1ib2wuZm9yIGlkICAgICAgICAgICAgICAgICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcGlja19maXJzdDogKCBQLi4uICkgLT4gQF9waWNrICdmaXJzdCcsICAgUC4uLlxuICBwaWNrX2xhc3Q6ICAoIFAuLi4gKSAtPiBAX3BpY2sgJ2xhc3QnLCAgICBQLi4uXG4gIHBpY2tfYWxsOiAgICggUC4uLiApIC0+IEBfcGljayAnYWxsJywgICAgIFAuLi5cbiAgcnVuOiAgICAgICAgKCBQLi4uICkgLT4gQF9waWNrIEBjZmcucGljaywgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3BpY2tfZnJvbV9saXN0OiAoIHBpY2tlciwgdmFsdWVzICkgLT5cbiAgICByZXR1cm4gdmFsdWVzIGlmIHBpY2tlciBpcyAnYWxsJ1xuICAgIGlmIHZhbHVlcy5sZW5ndGggaXMgMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzYgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgIHJldHVybiB2YWx1ZXMuYXQgIDAgaWYgcGlja2VyIGlzICdmaXJzdCdcbiAgICByZXR1cm4gdmFsdWVzLmF0IC0xIGlmIHBpY2tlciBpcyAnbGFzdCdcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNyB1bmtub3duIHBpY2tlciAje3BpY2tlcn1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogKCBkcy4uLiApIC0+XG4gICAgQHNlbmQgZHMuLi5cbiAgICByZXR1cm4gQF93YWxrX2FuZF9waWNrKClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEpldHN0cmVhbSAgICAgICBleHRlbmRzIEpldHN0cmVhbV9hYmNcbmNsYXNzIEFzeW5jX2pldHN0cmVhbSBleHRlbmRzIEpldHN0cmVhbV9hYmNcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSB0aGlzIHVzZWQgdG8gYmUgdGhlIGlkaW9tYXRpYyBmb3JtdWxhdGlvbiBgUiA9IFsgKCBAd2FsayBQLi4uICkuLi4sIF1gOyBmb3IgdGhlIHNha2Ugb2YgbWFraW5nXG5zeW5jIGFuZCBhc3luYyB2ZXJzaW9ucyBtYXhpbWFsbHkgc2ltaWxhciwgdGhlIHN5bmMgdmVyc2lvbiBoYXMgYmVlbiBhZGFwdGVkIHRvIHRoZSBhc3luYyBmb3JtdWxhdGlvbi4gTXlcbmZpcnN0IGFzeW5jIHNvbHV0aW9uIHdhcyBgUiA9ICggZCBmb3IgYXdhaXQgZCBmcm9tIGdlbmZuIFAuLi4gKWAsIHdoaWNoIGRvZXNuJ3QgdHJhbnNwaWxlbmljZWx5LiAjIyNcbiMjIyB0aHggdG8gaHR0cHM6Ly9hbGx0aGluZ3NzbWl0dHkuY29tLzIwMjUvMDcvMTQvbW9kZXJuLWFzeW5jLWl0ZXJhdGlvbi1pbi1qYXZhc2NyaXB0LXdpdGgtYXJyYXktZnJvbWFzeW5jLyAjIyNcbkpldHN0cmVhbTo6X3BpY2sgICAgICAgPSAoIHBpY2tlciwgUC4uLiApIC0+IEBfcGlja19mcm9tX2xpc3QgcGlja2VyLCAgICAgICBBcnJheS5mcm9tICAgICAgQHdhbGsgUC4uLlxuQXN5bmNfamV0c3RyZWFtOjpfcGljayA9ICggcGlja2VyLCBQLi4uICkgLT4gQF9waWNrX2Zyb21fbGlzdCBwaWNrZXIsIGF3YWl0IEFycmF5LmZyb21Bc3luYyBAd2FsayBQLi4uXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuSmV0c3RyZWFtOjpfd2Fsa19hbmRfcGljayA9IC0+XG4gIHByZXZpb3VzICA9IG1pc2ZpdFxuICBjb3VudCAgICAgPSAwXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZm9yIHZhbHVlIGZyb20gQF93YWxrX2FsbF90b19leGhhdXN0aW9uKClcbiAgICBjb3VudCsrXG4gICAgaWYgKCBjb3VudCBpcyAxICkgYW5kICggQGNmZy5waWNrIGlzICdmaXJzdCcgKVxuICAgICAgeWllbGQgdmFsdWVcbiAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgeWllbGQgdmFsdWVcbiAgICBwcmV2aW91cyA9IHZhbHVlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgO251bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5Bc3luY19qZXRzdHJlYW06Ol93YWxrX2FuZF9waWNrID0gLT5cbiAgcHJldmlvdXMgID0gbWlzZml0XG4gIGNvdW50ICAgICA9IDBcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBmb3IgYXdhaXQgdmFsdWUgZnJvbSBAX3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24oKVxuICAgIGNvdW50KytcbiAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICB5aWVsZCB2YWx1ZVxuICAgIGVsc2UgaWYgQGNmZy5waWNrIGlzICdhbGwnXG4gICAgICB5aWVsZCB2YWx1ZVxuICAgIHByZXZpb3VzID0gdmFsdWVcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICB5aWVsZCBwcmV2aW91cyBpZiAoIEBjZmcucGljayBpcyAnbGFzdCcgKSBhbmQgKCBjb3VudCA+IDAgKVxuICA7bnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkpldHN0cmVhbTo6X3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24gPSAtPlxuICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICBlbHNlICAgICAgICAgICAgICAgIHlpZWxkIGZyb20gICAgICAgQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICA7bnVsbFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbkFzeW5jX2pldHN0cmVhbTo6X3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24gPSAtPlxuICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICBlbHNlICAgICAgICAgICAgICAgIHlpZWxkIGZyb20gYXdhaXQgQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICA7bnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkpldHN0cmVhbTo6cHVzaCA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICB7IHRmbSxcbiAgICBpc19zeW5jLFxuICAgIHR5cGUsICAgfSA9IF9jb25maWd1cmVfdHJhbnNmb3JtIHNlbGVjdG9ycy4uLiwgdGZtXG4gIHVubGVzcyBpc19zeW5jXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzggY2Fubm90IHVzZSBhc3luYyB0cmFuc2Zvcm0gaW4gc3luYyBqZXRzdHJlYW0sIGdvdCBhICN7dHlwZX1cIlxuICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIG54dCAgICAgICAgID0gbnVsbFxuICB5aWVsZGVyICAgICA9IG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7dGZtLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICB1bmxlc3Mgbnh0P1xuICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gICAgICAgbnh0IGogICAgICAgICApIGZvciAgICAgICBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yICAgICAgIGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgeWllbGQgZnJvbSB5aWVsZGVyIGQgO251bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgcmV0dXJuIFJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5Bc3luY19qZXRzdHJlYW06OnB1c2ggPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgeyB0Zm0sICAgIH0gPSBfY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbVxuICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIG54dCAgICAgICAgID0gbnVsbFxuICB5aWVsZGVyICAgICA9IG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7dGZtLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICB1bmxlc3Mgbnh0P1xuICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gYXdhaXQgbnh0IGogICAgICAgICApIGZvciBhd2FpdCBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGF3YWl0IGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgeWllbGQgZnJvbSBhd2FpdCB5aWVsZGVyIGQgO251bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIHR5cGVfb2YsXG4gICAgbWlzZml0LFxuICAgIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUsXG4gICAgU2VsZWN0b3IsXG4gICAgX25vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBzZWxlY3RvcnNfYXNfbGlzdCxcbiAgICBpZF9mcm9tX2N1ZSwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHsgSmV0c3RyZWFtLCBBc3luY19qZXRzdHJlYW0sIGludGVybmFscywgfVxuIl19
