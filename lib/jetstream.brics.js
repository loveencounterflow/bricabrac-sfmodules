(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var Async_jetstream, Jetstream, Jetstream_abc, Selector, _normalize_selectors, _type_of, exports, hide, id_from_cue, internals, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
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

        //-------------------------------------------------------------------------------------------------------
        configure_transform(...selectors) {
          var ref, tfm;
          ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
          return (this._configure_transform(...selectors, tfm)).tfm;
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
    Jetstream.prototype._configure_transform = function(...selectors) {
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
          throw new Error(`Ωjstrm__10 expected a jetstream or a synchronous function or generator function, got a ${type}`);
      }
      //.....................................................................................................
      return {tfm, original_tfm, type};
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._configure_transform = function(...selectors) {
      var original_tfm, ref, selector, tfm, type;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      selector = new Selector(...selectors);
      original_tfm = tfm;
      //.....................................................................................................
      switch (type = type_of(tfm)) {
        //...................................................................................................
        case 'jetstream':
          tfm = nameit('(jetstream)', async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm.walk(d));
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
        case 'asyncfunction':
          tfm = nameit(`(watcher)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            await original_tfm(d);
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
        //...................................................................................................
        case 'asyncgeneratorfunction':
          tfm = nameit(`(generator)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm(d));
            return null;
          });
          break;
        default:
          //...................................................................................................
          throw new Error(`Ωjstrm__11 expected a jetstream or a synchronous function or generator function, got a ${type}`);
      }
      //.....................................................................................................
      return {tfm, original_tfm, type};
    };
    //=========================================================================================================
    Jetstream.prototype.push = function(...selectors) {
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
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype.push = function(...selectors) {
      var R, my_idx, nxt, ref, tfm, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      tfm = this.configure_transform(...selectors, tfm);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsb0JBQUEsRUFBQSxRQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsU0FBQSxFQUFBLHNCQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxtQkFBQSxFQUFBLGlCQUFBLEVBQUEsVUFBQSxFQUFBO0lBQUUsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1QjtJQUNBLENBQUE7TUFBRSxPQUFBLEVBQVM7SUFBWCxDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRDVCLEVBRkY7OztJQU9FLE9BQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsQ0FBQTtNQUFTLElBQUssQ0FBQSxZQUFhLFNBQWxCO2VBQW1DLFlBQW5DO09BQUEsTUFBQTtlQUFvRCxRQUFBLENBQVMsQ0FBVCxFQUFwRDs7SUFBVDtJQUMxQixNQUFBLEdBQTBCLE1BQUEsQ0FBTyxRQUFQO0lBQzFCLHNCQUFBLEdBQTBCO01BQUUsTUFBQSxFQUFRLFFBQVY7TUFBb0IsSUFBQSxFQUFNLEtBQTFCO01B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QUE7Y0FDYyxPQUFBLEdBQVUsTUFBQSxTQUFBLENBQUUsQ0FBRixDQUFBO0FBQVEsb0JBQUE7Z0JBQUMsdUJBQUE7a0JBQUEsQ0FBYSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQVYsQ0FBaUIsQ0FBakIsQ0FBWCxHQUFBLENBQUEsTUFBTSxDQUFOLENBQUEsR0FBQSxNQUFGO2dCQUFBO3VCQUEyRDtjQUFwRSxFQUR4QjthQUZGOztVQUtBLE9BQVcsQ0FBQSxNQUFNLE9BQUEsQ0FBUSxDQUFSLENBQU47aUJBQWlCO1FBTnVCO01BQWQsQ0FBQSxFQUFPLEtBQTFDLEVBTlY7O01BY00sSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCO0FBQ0EsYUFBTztJQWhCYSxFQXpSMUI7O0lBNFNFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQ3hCLE9BRHdCLEVBRXhCLE1BRndCLEVBR3hCLHNCQUh3QixFQUl4QixRQUp3QixFQUt4QixvQkFMd0IsRUFNeEIsbUJBTndCLEVBT3hCLGlCQVB3QixFQVF4QixXQVJ3QixDQUFkO0FBU1osV0FBTyxPQUFBLEdBQVUsQ0FBRSxTQUFGLEVBQWEsZUFBYixFQUE4QixTQUE5QjtFQXRUQyxFQVRwQjs7O0VBb1VBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQWlDLENBQUEsQ0FBQSxDQUFBLEdBQUE7V0FBRyxDQUFFLGlCQUFGO0VBQUgsQ0FBQSxHQUFqQztBQXBVQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSAgPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfamV0c3RyZWFtID0gLT5cbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mOiBfdHlwZV9vZiwgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdHlwaW5nICMjI1xuICB0eXBlX29mICAgICAgICAgICAgICAgICA9ICggeCApIC0+IGlmICggeCBpbnN0YW5jZW9mIEpldHN0cmVhbSApIHRoZW4gJ2pldHN0cmVhbScgZWxzZSBfdHlwZV9vZiB4XG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUgID0geyBvdXRsZXQ6ICdkYXRhIyonLCBwaWNrOiAnYWxsJywgZmFsbGJhY2s6IG1pc2ZpdCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VsZWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgICAgeyBzZWxlY3RvcnNfcnByLFxuICAgICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgICBAc2VsZWN0b3JzX3JwciAgPSBzZWxlY3RvcnNfcnByXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBpZiBzZWxlY3RvcnMuc2l6ZSBpcyAwIHRoZW4gdHJ1ZSBlbHNlIGZhbHNlXG4gICAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgICAgZm9yIHNlbGVjdG9yIGZyb20gc2VsZWN0b3JzXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2N1ZSMqJyB0aGVuIEBjdWVzID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eZGF0YSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMSBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkLCBnb3QgI3tzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eY3VlIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgICBAY3Vlcy5hZGQgbWF0Y2guZ3JvdXBzLmlkXG4gICAgICAgICAgZWxzZSBudWxsXG4gICAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9leGNlcnB0OiAtPiB7IGRhdGE6IEBkYXRhLCBjdWVzOiBAY3VlcywgYWNjZXB0X2FsbDogQGFjY2VwdF9hbGwsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgICAgcmV0dXJuIHRydWUgaWYgQGFjY2VwdF9hbGxcbiAgICAgIGlmIGlzX2N1ZSA9ICggdHlwZW9mIGl0ZW0gKSBpcyAnc3ltYm9sJ1xuICAgICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlICBpZiBAY3VlcyBpcyBmYWxzZVxuICAgICAgICByZXR1cm4gQGN1ZXMuaGFzIGlkX2Zyb21fY3VlIGl0ZW1cbiAgICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgICAgcmV0dXJuIGZhbHNlICBpZiBAZGF0YSBpcyBmYWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzIgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCBpbiBzZWxlY3RvciAje3JwciBAdG9TdHJpbmd9XCJcbiAgICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHNob3VsZCBwcm92aWRlIG1ldGhvZCB0byBnZW5lcmF0ZSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uICMjI1xuICAgIHRvU3RyaW5nOiAtPiBAc2VsZWN0b3JzX3JwclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWRfZnJvbV9jdWUgPSAoIHN5bWJvbCApIC0+IHN5bWJvbC5kZXNjcmlwdGlvblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcjJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gL14jLisvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcImN1ZSN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgICAgd2hlbiBub3QgLyMvLnRlc3Qgc2VsZWN0b3IgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0jKlwiXG4gICAgICAgIGVsc2UgUi5hZGQgc2VsZWN0b3JcbiAgICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICAgIFIuZGVsZXRlICcnIGlmIFIuc2l6ZSBpc250IDFcbiAgICByZXR1cm4geyBzZWxlY3RvcnM6IFIsIHNlbGVjdG9yc19ycHIsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtX2FiY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQGNvbmZpZ3VyZSBjZmdcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgPSBuZXcgU2VsZWN0b3IgQGNmZy5vdXRsZXRcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+IEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi4gIDtudWxsXG4gICAgY3VlOiAgKCBpZCAgICApIC0+IEBzZW5kIFN5bWJvbC5mb3IgaWQgICAgICAgICAgICAgICAgICAgIDtudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHBpY2tfZmlyc3Q6ICggUC4uLiApIC0+IEBfcGljayAnZmlyc3QnLCAgIFAuLi5cbiAgICBwaWNrX2xhc3Q6ICAoIFAuLi4gKSAtPiBAX3BpY2sgJ2xhc3QnLCAgICBQLi4uXG4gICAgcGlja19hbGw6ICAgKCBQLi4uICkgLT4gQF9waWNrICdhbGwnLCAgICAgUC4uLlxuICAgIHJ1bjogICAgICAgICggUC4uLiApIC0+IEBfcGljayBAY2ZnLnBpY2ssIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogKCBkcy4uLiApIC0+XG4gICAgICBAc2VuZCBkcy4uLlxuICAgICAgcmV0dXJuIEBfd2Fsa19hbmRfcGljaygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZV90cmFuc2Zvcm06ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPiAoIEBfY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbSApLnRmbVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW0gICAgICAgZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG4gIGNsYXNzIEFzeW5jX2pldHN0cmVhbSBleHRlbmRzIEpldHN0cmVhbV9hYmNcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+XG4gICAgICBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXVxuICAgICAgcmV0dXJuIFIgaWYgcGlja2VyIGlzICdhbGwnXG4gICAgICBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18zIG5vIHJlc3VsdHNcIiBpZiBAY2ZnLmZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgICByZXR1cm4gQGNmZy5mYWxsYmFja1xuICAgICAgcmV0dXJuIFIuYXQgIDAgaWYgcGlja2VyIGlzICdmaXJzdCdcbiAgICAgIHJldHVybiBSLmF0IC0xIGlmIHBpY2tlciBpcyAnbGFzdCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX180IHVua25vd24gcGlja2VyICN7cGlja2VyfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06Ol9waWNrID0gKCBwaWNrZXIsIFAuLi4gKSAtPlxuICAgICAgIyMjIE5PVEUgYmVzdCBhc3luYyBlcXVpdmFsZW50IHRvIGBbICggQHdhbGsgUC4uLiApLi4uLCBdYCBJIGNvdWxkIGZpbmQgIyMjXG4gICAgICBSID0gKCBkIGZvciBhd2FpdCBkIGZyb20gQHdhbGsgUC4uLiApXG4gICAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzggbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAgMCBpZiBwaWNrZXIgaXMgJ2ZpcnN0J1xuICAgICAgcmV0dXJuIFIuYXQgLTEgaWYgcGlja2VyIGlzICdsYXN0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzkgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICAgICAgcHJldmlvdXMgID0gbWlzZml0XG4gICAgICBjb3VudCAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB2YWx1ZSBmcm9tICAgICAgICBAX3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24oKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06Ol93YWxrX2FuZF9waWNrID0gLT5cbiAgICAgIHByZXZpb3VzICA9IG1pc2ZpdFxuICAgICAgY291bnQgICAgID0gMFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgYXdhaXQgdmFsdWUgZnJvbSBAX3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24oKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIGlmICggY291bnQgaXMgMSApIGFuZCAoIEBjZmcucGljayBpcyAnZmlyc3QnIClcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBKZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgICAgIGlmIEBpc19lbXB0eSAgdGhlbiAgeWllbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICBlbHNlICAgICAgICAgICAgICAgIHlpZWxkIGZyb20gICAgICAgQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24gPSAtPlxuICAgICAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpfY29uZmlndXJlX3RyYW5zZm9ybSA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgc2VsZWN0b3IgICAgICA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fMTAgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4geyB0Zm0sIG9yaWdpbmFsX3RmbSwgdHlwZSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpfY29uZmlndXJlX3RyYW5zZm9ybSA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgc2VsZWN0b3IgICAgICA9IG5ldyBTZWxlY3RvciBzZWxlY3RvcnMuLi5cbiAgICAgIG9yaWdpbmFsX3RmbSAgPSB0Zm1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gJ2pldHN0cmVhbSdcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgdGZtID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfdGZtLm5hbWV9XCIsICggZCApIC0+XG4gICAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnYXN5bmNmdW5jdGlvbidcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgICAgYXdhaXQgb3JpZ2luYWxfdGZtIGQ7IHlpZWxkIGQgO251bGxcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICdnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgXCIoZ2VuZXJhdG9yKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAnYXN5bmNnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgICB0Zm0gPSBuYW1laXQgXCIoZ2VuZXJhdG9yKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX18xMSBleHBlY3RlZCBhIGpldHN0cmVhbSBvciBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGdlbmVyYXRvciBmdW5jdGlvbiwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiB7IHRmbSwgb3JpZ2luYWxfdGZtLCB0eXBlLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBKZXRzdHJlYW06OnB1c2ggPSAoIHNlbGVjdG9ycy4uLiwgdGZtICkgLT5cbiAgICAgIHRmbSAgICAgICAgID0gQGNvbmZpZ3VyZV90cmFuc2Zvcm0gc2VsZWN0b3JzLi4uLCB0Zm1cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSAgICAgICBueHQgaiAgICAgICAgICkgZm9yIGogZnJvbSAgICAgICB0Zm0gZCA7bnVsbFxuICAgICAgICAgIGVsc2UgICAgICAgICAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgaiBpZiBtZS5vdXRsZXQuc2VsZWN0IGogICkgZm9yIGogZnJvbSAgICAgICB0Zm0gZCA7bnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGZyb20geWllbGRlciBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6cHVzaCA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgdGZtICAgICAgICAgPSBAY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbVxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je3RmbS5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tIGF3YWl0IG54dCBqICAgICAgICAgKSBmb3IgYXdhaXQgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqIGlmIG1lLm91dGxldC5zZWxlY3QgaiAgKSBmb3IgYXdhaXQgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSBhd2FpdCB5aWVsZGVyIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7XG4gICAgdHlwZV9vZixcbiAgICBtaXNmaXQsXG4gICAgamV0c3RyZWFtX2NmZ190ZW1wbGF0ZSxcbiAgICBTZWxlY3RvcixcbiAgICBfbm9ybWFsaXplX3NlbGVjdG9ycyxcbiAgICBub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIHNlbGVjdG9yc19hc19saXN0LFxuICAgIGlkX2Zyb21fY3VlLCB9XG4gIHJldHVybiBleHBvcnRzID0geyBKZXRzdHJlYW0sIEFzeW5jX2pldHN0cmVhbSwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIGRvID0+IHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
