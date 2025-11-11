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
    fallback: misfit,
    empty_call: misfit
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
        if ((ds.length === 0) && this.shelf_is_empty && this.has_empty_value) {
          this.send(this.cfg.empty_call);
        } else {
          this.send(...ds);
        }
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

    set_getter(Jetstream_abc.prototype, 'shelf_is_empty', function() {
      return this.shelf.length === 0;
    });

    set_getter(Jetstream_abc.prototype, 'has_empty_value', function() {
      return this.cfg.empty_call !== misfit;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pldHN0cmVhbXMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZUFBQSxFQUFBLFNBQUEsRUFBQSxhQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsb0JBQUEsRUFBQSxRQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQTtJQUFBLGtCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZDs7RUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxVQUFSLENBQTVCOztFQUNBLENBQUE7SUFBRSxPQUFBLEVBQVM7RUFBWCxDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxlQUE1QyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGtCQUFSLENBQUYsQ0FBOEIsQ0FBQyw4QkFBL0IsQ0FBQSxDQUQ1QixFQU5BOzs7O0VBV0EsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7SUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsYUFBUSxpQkFBUjs7SUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxhQUFPLGtCQUFQOztBQUNBLFdBQU8sUUFBQSxDQUFTLENBQVQ7RUFIQyxFQVhWOzs7RUFpQkEsTUFBQSxHQUEwQixNQUFBLENBQU8sUUFBUDs7RUFDMUIsc0JBQUEsR0FBMEI7SUFBRSxNQUFBLEVBQVEsUUFBVjtJQUFvQixJQUFBLEVBQU0sS0FBMUI7SUFBaUMsUUFBQSxFQUFVLE1BQTNDO0lBQW1ELFVBQUEsRUFBWTtFQUEvRCxF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PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSAgPSBjb25zb2xlXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9uYW1laXQnXG57IHR5cGVfb2Y6IF90eXBlX29mLCAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbnR5cGVfb2YgPSAoIHggKSAtPlxuICByZXR1cm4gICdzeW5jX2pldHN0cmVhbScgaWYgKCB4IGluc3RhbmNlb2YgICAgICAgSmV0c3RyZWFtIClcbiAgcmV0dXJuICdhc3luY19qZXRzdHJlYW0nIGlmICggeCBpbnN0YW5jZW9mIEFzeW5jX2pldHN0cmVhbSApXG4gIHJldHVybiBfdHlwZV9vZiB4XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxubWlzZml0ICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbmpldHN0cmVhbV9jZmdfdGVtcGxhdGUgID0geyBvdXRsZXQ6ICdkYXRhIyonLCBwaWNrOiAnYWxsJywgZmFsbGJhY2s6IG1pc2ZpdCwgZW1wdHlfY2FsbDogbWlzZml0LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2VsZWN0b3JcbiAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICBlbHNlIG51bGxcbiAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9jdWUgaXRlbVxuICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWRfZnJvbV9jdWUgPSAoIHN5bWJvbCApIC0+IHN5bWJvbC5kZXNjcmlwdGlvblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICByZXR1cm4gW10gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAwXG4gIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgcmV0dXJuIFsgJycsIF0gaWYgc2VsZWN0b3JzLmxlbmd0aCBpcyAxIGFuZCBzZWxlY3RvcnNbIDAgXSBpcyAnJ1xuICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5zcGxpdCAnLCcgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gIHJldHVybiBzZWxlY3RvcnNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbl9ub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gIFIgICAgICAgICAgICAgPSBuZXcgU2V0KClcbiAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgIHN3aXRjaCB0cnVlXG4gICAgICB3aGVuIHNlbGVjdG9yIGlzICcnICAgICAgICAgICAgIHRoZW4gbnVsbFxuICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbl9jb25maWd1cmVfdHJhbnNmb3JtID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gIHNlbGVjdG9yICAgICAgPSBuZXcgU2VsZWN0b3Igc2VsZWN0b3JzLi4uXG4gIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgdGZtXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdzeW5jX2pldHN0cmVhbSdcbiAgICAgIGlzX3N5bmMgPSB0cnVlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0ICcoc3luY19qZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfdGZtLndhbGsgZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2hlbiAnYXN5bmNfamV0c3RyZWFtJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0ICcoYXN5bmNfamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbS53YWxrIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IHRydWVcbiAgICAgIHRmbSAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdhc3luY2Z1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICBhd2FpdCBvcmlnaW5hbF90Zm0gZDsgeWllbGQgZCA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICBpc19zeW5jID0gdHJ1ZVxuICAgICAgdGZtICAgICA9IG5hbWVpdCBcIihnZW5lcmF0b3IpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3aGVuICdhc3luY2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgIHlpZWxkIGZyb20gYXdhaXQgb3JpZ2luYWxfdGZtIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHJldHVybiB7IHRmbSwgb3JpZ2luYWxfdGZtLCB0eXBlLCBpc19zeW5jLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBKZXRzdHJlYW1fYWJjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgT2JqZWN0LmZyZWV6ZSwgcHVzaCBzZXRzIG5ldyBhcnJheSAjIyNcbiAgICBAY29uZmlndXJlIGNmZ1xuICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgQGNmZyAgICA9IHsgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZS4uLiwgY2ZnLi4uLCB9XG4gICAgQG91dGxldCA9IG5ldyBTZWxlY3RvciBAY2ZnLm91dGxldFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ2xlbmd0aCcsICAgICAgICAgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsICAgICAgICAgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcbiAgc2V0X2dldHRlciBAOjosICdzaGVsZl9pc19lbXB0eScsICAgLT4gQHNoZWxmLmxlbmd0aCAgICAgIGlzIDBcbiAgc2V0X2dldHRlciBAOjosICdoYXNfZW1wdHlfdmFsdWUnLCAgLT4gQGNmZy5lbXB0eV9jYWxsICAgIGlzbnQgbWlzZml0XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBzZW5kOiAoIGRzLi4uICkgLT4gQHNoZWxmLnNwbGljZSBAc2hlbGYubGVuZ3RoLCAwLCBkcy4uLiAgO251bGxcbiAgY3VlOiAgKCBpZCAgICApIC0+IEBzZW5kIFN5bWJvbC5mb3IgaWQgICAgICAgICAgICAgICAgICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBwaWNrX2ZpcnN0OiAoIFAuLi4gKSAtPiBAX3BpY2sgJ2ZpcnN0JywgICBQLi4uXG4gIHBpY2tfbGFzdDogICggUC4uLiApIC0+IEBfcGljayAnbGFzdCcsICAgIFAuLi5cbiAgcGlja19hbGw6ICAgKCBQLi4uICkgLT4gQF9waWNrICdhbGwnLCAgICAgUC4uLlxuICBydW46ICAgICAgICAoIFAuLi4gKSAtPiBAX3BpY2sgQGNmZy5waWNrLCBQLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcGlja19mcm9tX2xpc3Q6ICggcGlja2VyLCB2YWx1ZXMgKSAtPlxuICAgIHJldHVybiB2YWx1ZXMgaWYgcGlja2VyIGlzICdhbGwnXG4gICAgaWYgdmFsdWVzLmxlbmd0aCBpcyAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fNiBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgcmV0dXJuIHZhbHVlcy5hdCAgMCBpZiBwaWNrZXIgaXMgJ2ZpcnN0J1xuICAgIHJldHVybiB2YWx1ZXMuYXQgLTEgaWYgcGlja2VyIGlzICdsYXN0J1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX183IHVua25vd24gcGlja2VyICN7cGlja2VyfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAoIGRzLi4uICkgLT5cbiAgICBpZiAoIGRzLmxlbmd0aCBpcyAwICkgYW5kIEBzaGVsZl9pc19lbXB0eSBhbmQgQGhhc19lbXB0eV92YWx1ZSAgdGhlbiAgQHNlbmQgQGNmZy5lbXB0eV9jYWxsXG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZW5kIGRzLi4uXG4gICAgcmV0dXJuIEBfd2Fsa19hbmRfcGljaygpXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBKZXRzdHJlYW0gICAgICAgZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG5jbGFzcyBBc3luY19qZXRzdHJlYW0gZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgdGhpcyB1c2VkIHRvIGJlIHRoZSBpZGlvbWF0aWMgZm9ybXVsYXRpb24gYFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdYDsgZm9yIHRoZSBzYWtlIG9mIG1ha2luZ1xuc3luYyBhbmQgYXN5bmMgdmVyc2lvbnMgbWF4aW1hbGx5IHNpbWlsYXIsIHRoZSBzeW5jIHZlcnNpb24gaGFzIGJlZW4gYWRhcHRlZCB0byB0aGUgYXN5bmMgZm9ybXVsYXRpb24uIE15XG5maXJzdCBhc3luYyBzb2x1dGlvbiB3YXMgYFIgPSAoIGQgZm9yIGF3YWl0IGQgZnJvbSBnZW5mbiBQLi4uIClgLCB3aGljaCBkb2Vzbid0IHRyYW5zcGlsZW5pY2VseS4gIyMjXG4jIyMgdGh4IHRvIGh0dHBzOi8vYWxsdGhpbmdzc21pdHR5LmNvbS8yMDI1LzA3LzE0L21vZGVybi1hc3luYy1pdGVyYXRpb24taW4tamF2YXNjcmlwdC13aXRoLWFycmF5LWZyb21hc3luYy8gIyMjXG5KZXRzdHJlYW06Ol9waWNrICAgICAgID0gKCBwaWNrZXIsIFAuLi4gKSAtPiBAX3BpY2tfZnJvbV9saXN0IHBpY2tlciwgICAgICAgQXJyYXkuZnJvbSAgICAgIEB3YWxrIFAuLi5cbkFzeW5jX2pldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+IEBfcGlja19mcm9tX2xpc3QgcGlja2VyLCBhd2FpdCBBcnJheS5mcm9tQXN5bmMgQHdhbGsgUC4uLlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkpldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgY291bnQgICAgID0gMFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGZvciB2YWx1ZSBmcm9tIEBfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbigpXG4gICAgY291bnQrK1xuICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgIHlpZWxkIHZhbHVlXG4gICAgZWxzZSBpZiBAY2ZnLnBpY2sgaXMgJ2FsbCdcbiAgICAgIHlpZWxkIHZhbHVlXG4gICAgcHJldmlvdXMgPSB2YWx1ZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gIDtudWxsXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuQXN5bmNfamV0c3RyZWFtOjpfd2Fsa19hbmRfcGljayA9IC0+XG4gIHByZXZpb3VzICA9IG1pc2ZpdFxuICBjb3VudCAgICAgPSAwXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZm9yIGF3YWl0IHZhbHVlIGZyb20gQF93YWxrX2FsbF90b19leGhhdXN0aW9uKClcbiAgICBjb3VudCsrXG4gICAgaWYgKCBjb3VudCBpcyAxICkgYW5kICggQGNmZy5waWNrIGlzICdmaXJzdCcgKVxuICAgICAgeWllbGQgdmFsdWVcbiAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgeWllbGQgdmFsdWVcbiAgICBwcmV2aW91cyA9IHZhbHVlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgO251bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5KZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgZWxzZSAgICAgICAgICAgICAgICB5aWVsZCBmcm9tICAgICAgIEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgO251bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5Bc3luY19qZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgZWxzZSAgICAgICAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgO251bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5KZXRzdHJlYW06OnB1c2ggPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgeyB0Zm0sXG4gICAgaXNfc3luYyxcbiAgICB0eXBlLCAgIH0gPSBfY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbVxuICB1bmxlc3MgaXNfc3luY1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX184IGNhbm5vdCB1c2UgYXN5bmMgdHJhbnNmb3JtIGluIHN5bmMgamV0c3RyZWFtLCBnb3QgYSAje3R5cGV9XCJcbiAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBueHQgICAgICAgICA9IG51bGxcbiAgeWllbGRlciAgICAgPSBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je3RmbS5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgdW5sZXNzIG54dD9cbiAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tICAgICAgIG54dCBqICAgICAgICAgKSBmb3IgICAgICAgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciAgICAgICBqIGZyb20gdGZtIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHlpZWxkIGZyb20geWllbGRlciBkIDtudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgQHRyYW5zZm9ybXMucHVzaCBSXG4gIHJldHVybiBSXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuQXN5bmNfamV0c3RyZWFtOjpwdXNoID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gIHsgdGZtLCAgICB9ID0gX2NvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBueHQgICAgICAgICA9IG51bGxcbiAgeWllbGRlciAgICAgPSBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je3RmbS5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgdW5sZXNzIG54dD9cbiAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tIGF3YWl0IG54dCBqICAgICAgICAgKSBmb3IgYXdhaXQgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciBhd2FpdCBqIGZyb20gdGZtIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHlpZWxkIGZyb20gYXdhaXQgeWllbGRlciBkIDtudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgQHRyYW5zZm9ybXMucHVzaCBSXG4gIHJldHVybiBSXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICB0eXBlX29mLFxuICAgIG1pc2ZpdCxcbiAgICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9jdWUsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgQXN5bmNfamV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cbiJdfQ==
