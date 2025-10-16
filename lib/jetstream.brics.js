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
    _configure_transform = function(me, ...selectors) {
      var iam, original_tfm, ref, selector, tfm, type;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      iam = type_of(me);
      //.......................................................................................................
      selector = new Selector(...selectors);
      original_tfm = tfm;
      //.......................................................................................................
      switch (type = type_of(tfm)) {
        //.....................................................................................................
        case 'sync_jetstream':
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
      return {tfm, original_tfm, type};
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
          return (_configure_transform(this, ...selectors, tfm)).tfm;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsb0JBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUIsRUFGRjs7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsZUFBUSxpQkFBUjs7TUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxlQUFPLGtCQUFQOztBQUNBLGFBQU8sUUFBQSxDQUFTLENBQVQ7SUFIQyxFQVBaOztJQWFFLE1BQUEsR0FBMEIsTUFBQSxDQUFPLFFBQVA7SUFDMUIsc0JB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SDtjQUFjLE9BQUEsR0FBVSxNQUFBLFNBQUEsQ0FBRSxDQUFGLENBQUE7QUFBUSxvQkFBQTtnQkFBQyx1QkFBQTtrQkFBRSxDQUFBLE9BQVcsQ0FBQSxNQUFNLEdBQUEsQ0FBSSxDQUFKLENBQU4sQ0FBWDtnQkFBRjt1QkFBMkQ7Y0FBcEUsRUFBeEI7YUFBQSxNQUFBO2NBQ2MsT0FBQSxHQUFVLE1BQUEsU0FBQSxDQUFFLENBQUYsQ0FBQTtBQUFRLG9CQUFBO2dCQUFDLHVCQUFBO2tCQUFBLENBQWEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFWLENBQWlCLENBQWpCLENBQVgsR0FBQSxDQUFBLE1BQU0sQ0FBTixDQUFBLEdBQUEsTUFBRjtnQkFBQTt1QkFBMkQ7Y0FBcEUsRUFEeEI7YUFGRjs7VUFLQSxPQUFXLENBQUEsTUFBTSxPQUFBLENBQVEsQ0FBUixDQUFOO2lCQUFpQjtRQU51QjtNQUFkLENBQUEsRUFBTyxLQUExQyxFQU5WOztNQWNNLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFqQjtBQUNBLGFBQU87SUFoQmEsRUEzUTFCOztJQThSRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUN4QixPQUR3QixFQUV4QixNQUZ3QixFQUd4QixzQkFId0IsRUFJeEIsUUFKd0IsRUFLeEIsb0JBTHdCLEVBTXhCLG1CQU53QixFQU94QixpQkFQd0IsRUFReEIsV0FSd0IsQ0FBZDtBQVNaLFdBQU8sT0FBQSxHQUFVLENBQUUsU0FBRixFQUFhLGVBQWIsRUFBOEIsU0FBOUI7RUF4U0MsRUFUcEI7OztFQXNUQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUFpQyxDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxpQkFBRjtFQUFILENBQUEsR0FBakM7QUF0VEEiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgdHlwZV9vZiA9ICggeCApIC0+XG4gICAgcmV0dXJuICAnc3luY19qZXRzdHJlYW0nIGlmICggeCBpbnN0YW5jZW9mICAgICAgIEpldHN0cmVhbSApXG4gICAgcmV0dXJuICdhc3luY19qZXRzdHJlYW0nIGlmICggeCBpbnN0YW5jZW9mIEFzeW5jX2pldHN0cmVhbSApXG4gICAgcmV0dXJuIF90eXBlX29mIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gIGpldHN0cmVhbV9jZmdfdGVtcGxhdGUgID0geyBvdXRsZXQ6ICdkYXRhIyonLCBwaWNrOiAnYWxsJywgZmFsbGJhY2s6IG1pc2ZpdCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2VsZWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgICAgeyBzZWxlY3RvcnNfcnByLFxuICAgICAgICBzZWxlY3RvcnMsICB9ID0gX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uXG4gICAgICBAc2VsZWN0b3JzX3JwciAgPSBzZWxlY3RvcnNfcnByXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBpZiBzZWxlY3RvcnMuc2l6ZSBpcyAwIHRoZW4gdHJ1ZSBlbHNlIGZhbHNlXG4gICAgICBAY3VlcyAgICAgICAgICAgPSBmYWxzZVxuICAgICAgZm9yIHNlbGVjdG9yIGZyb20gc2VsZWN0b3JzXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnZGF0YSMqJyB0aGVuIEBkYXRhID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2N1ZSMqJyB0aGVuIEBjdWVzID0gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eZGF0YSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgIyMjIFRBSU5UIG1lbnRpb24gb3JpZ2luYWwgc2VsZWN0b3IgbmV4dCB0byBub3JtYWxpemVkIGZvcm0gIyMjXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMSBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkLCBnb3QgI3tzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gKCBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoIC9eY3VlIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICBAY3VlcyA9IG5ldyBTZXQoKSBpZiBAY3VlcyBpbiBbIHRydWUsIGZhbHNlLCBdXG4gICAgICAgICAgICBAY3Vlcy5hZGQgbWF0Y2guZ3JvdXBzLmlkXG4gICAgICAgICAgZWxzZSBudWxsXG4gICAgICBAYWNjZXB0X2FsbCAgICAgPSAoIEBkYXRhIGlzIHRydWUgKSBhbmQgKCBAY3VlcyBpcyB0cnVlIClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9leGNlcnB0OiAtPiB7IGRhdGE6IEBkYXRhLCBjdWVzOiBAY3VlcywgYWNjZXB0X2FsbDogQGFjY2VwdF9hbGwsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2VsZWN0OiAoIGl0ZW0gKSAtPlxuICAgICAgcmV0dXJuIHRydWUgaWYgQGFjY2VwdF9hbGxcbiAgICAgIGlmIGlzX2N1ZSA9ICggdHlwZW9mIGl0ZW0gKSBpcyAnc3ltYm9sJ1xuICAgICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBjdWVzIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlICBpZiBAY3VlcyBpcyBmYWxzZVxuICAgICAgICByZXR1cm4gQGN1ZXMuaGFzIGlkX2Zyb21fY3VlIGl0ZW1cbiAgICAgIHJldHVybiB0cnVlICAgaWYgQGRhdGEgaXMgdHJ1ZVxuICAgICAgcmV0dXJuIGZhbHNlICBpZiBAZGF0YSBpcyBmYWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzIgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCBpbiBzZWxlY3RvciAje3JwciBAdG9TdHJpbmd9XCJcbiAgICAgICMgcmV0dXJuIEBkYXRhLmhhcyBpZF9mcm9tX3ZhbHVlIGl0ZW1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHNob3VsZCBwcm92aWRlIG1ldGhvZCB0byBnZW5lcmF0ZSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uICMjI1xuICAgIHRvU3RyaW5nOiAtPiBAc2VsZWN0b3JzX3JwclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWRfZnJvbV9jdWUgPSAoIHN5bWJvbCApIC0+IHN5bWJvbC5kZXNjcmlwdGlvblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0b3JzX2FzX2xpc3QgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9ycy5mbGF0IEluZmluaXR5XG4gICAgcmV0dXJuIFtdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMFxuICAgIHJldHVybiBbICcnLCBdIGlmIHNlbGVjdG9ycy5sZW5ndGggaXMgMSBhbmQgc2VsZWN0b3JzWyAwIF0gaXMgJydcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuam9pbiAnLCdcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMucmVwbGFjZSAvXFxzKy9nLCAnJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuc3BsaXQgJywnICMjIyBUQUlOVCBub3QgZ2VuZXJhbGx5IHBvc3NpYmxlICMjI1xuICAgIHJldHVybiBzZWxlY3RvcnNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+ICggX25vcm1hbGl6ZV9zZWxlY3RvcnMgc2VsZWN0b3JzLi4uICkuc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfbm9ybWFsaXplX3NlbGVjdG9ycyA9ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICBzZWxlY3RvcnMgICAgID0gc2VsZWN0b3JzX2FzX2xpc3Qgc2VsZWN0b3JzLi4uXG4gICAgc2VsZWN0b3JzX3JwciA9IHNlbGVjdG9ycy5qb2luICcsICdcbiAgICBSICAgICAgICAgICAgID0gbmV3IFNldCgpXG4gICAgZm9yIHNlbGVjdG9yIGluIHNlbGVjdG9yc1xuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnJyAgICAgICAgICAgICB0aGVuIG51bGxcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnKicgICAgICAgICAgICB0aGVuIFIuYWRkIFwiZGF0YSMqXCI7IFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICcjJyAgICAgICAgICAgIHRoZW4gUi5hZGQgXCJjdWUjKlwiXG4gICAgICAgIHdoZW4gL14jLisvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcImN1ZSN7c2VsZWN0b3J9XCJcbiAgICAgICAgd2hlbiAvLisjJC8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0qXCJcbiAgICAgICAgd2hlbiBub3QgLyMvLnRlc3Qgc2VsZWN0b3IgICAgICB0aGVuIFIuYWRkIFwiI3tzZWxlY3Rvcn0jKlwiXG4gICAgICAgIGVsc2UgUi5hZGQgc2VsZWN0b3JcbiAgICBSLmFkZCAnZGF0YSMqJyBpZiBSLnNpemUgaXMgMFxuICAgIFIuZGVsZXRlICcnIGlmIFIuc2l6ZSBpc250IDFcbiAgICByZXR1cm4geyBzZWxlY3RvcnM6IFIsIHNlbGVjdG9yc19ycHIsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jb25maWd1cmVfdHJhbnNmb3JtID0gKCBtZSwgc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgIGlhbSA9IHR5cGVfb2YgbWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNlbGVjdG9yICAgICAgPSBuZXcgU2VsZWN0b3Igc2VsZWN0b3JzLi4uXG4gICAgb3JpZ2luYWxfdGZtICA9IHRmbVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdzeW5jX2pldHN0cmVhbSdcbiAgICAgICAgdGZtID0gbmFtZWl0ICcoc3luY19qZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX3RmbS53YWxrIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnYXN5bmNfamV0c3RyZWFtJ1xuICAgICAgICB0Zm0gPSBuYW1laXQgJyhhc3luY19qZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbS53YWxrIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgIHRmbSA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2FzeW5jZnVuY3Rpb24nXG4gICAgICAgIHRmbSA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIGF3YWl0IG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICB0Zm0gPSBuYW1laXQgXCIoZ2VuZXJhdG9yKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIHlpZWxkIGZyb20gb3JpZ2luYWxfdGZtIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnYXN5bmNnZW5lcmF0b3JmdW5jdGlvbidcbiAgICAgICAgdGZtID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fMTAgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIHsgdGZtLCBvcmlnaW5hbF90Zm0sIHR5cGUsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtX2FiY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQGNvbmZpZ3VyZSBjZmdcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgPSBuZXcgU2VsZWN0b3IgQGNmZy5vdXRsZXRcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+IEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi4gIDtudWxsXG4gICAgY3VlOiAgKCBpZCAgICApIC0+IEBzZW5kIFN5bWJvbC5mb3IgaWQgICAgICAgICAgICAgICAgICAgIDtudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHBpY2tfZmlyc3Q6ICggUC4uLiApIC0+IEBfcGljayAnZmlyc3QnLCAgIFAuLi5cbiAgICBwaWNrX2xhc3Q6ICAoIFAuLi4gKSAtPiBAX3BpY2sgJ2xhc3QnLCAgICBQLi4uXG4gICAgcGlja19hbGw6ICAgKCBQLi4uICkgLT4gQF9waWNrICdhbGwnLCAgICAgUC4uLlxuICAgIHJ1bjogICAgICAgICggUC4uLiApIC0+IEBfcGljayBAY2ZnLnBpY2ssIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogKCBkcy4uLiApIC0+XG4gICAgICBAc2VuZCBkcy4uLlxuICAgICAgcmV0dXJuIEBfd2Fsa19hbmRfcGljaygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbmZpZ3VyZV90cmFuc2Zvcm06ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPiAoIF9jb25maWd1cmVfdHJhbnNmb3JtIEAsIHNlbGVjdG9ycy4uLiwgdGZtICkudGZtXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEpldHN0cmVhbSAgICAgICBleHRlbmRzIEpldHN0cmVhbV9hYmNcbiAgY2xhc3MgQXN5bmNfamV0c3RyZWFtIGV4dGVuZHMgSmV0c3RyZWFtX2FiY1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpfcGljayA9ICggcGlja2VyLCBQLi4uICkgLT5cbiAgICAgIFIgPSBbICggQHdhbGsgUC4uLiApLi4uLCBdXG4gICAgICByZXR1cm4gUiBpZiBwaWNrZXIgaXMgJ2FsbCdcbiAgICAgIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gUi5hdCAgMCBpZiBwaWNrZXIgaXMgJ2ZpcnN0J1xuICAgICAgcmV0dXJuIFIuYXQgLTEgaWYgcGlja2VyIGlzICdsYXN0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzQgdW5rbm93biBwaWNrZXIgI3twaWNrZXJ9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3BpY2sgPSAoIHBpY2tlciwgUC4uLiApIC0+XG4gICAgICAjIyMgTk9URSBiZXN0IGFzeW5jIGVxdWl2YWxlbnQgdG8gYFsgKCBAd2FsayBQLi4uICkuLi4sIF1gIEkgY291bGQgZmluZCAjIyNcbiAgICAgIFIgPSAoIGQgZm9yIGF3YWl0IGQgZnJvbSBAd2FsayBQLi4uIClcbiAgICAgIHJldHVybiBSIGlmIHBpY2tlciBpcyAnYWxsJ1xuICAgICAgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fOCBubyByZXN1bHRzXCIgaWYgQGNmZy5mYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgcmV0dXJuIEBjZmcuZmFsbGJhY2tcbiAgICAgIHJldHVybiBSLmF0ICAwIGlmIHBpY2tlciBpcyAnZmlyc3QnXG4gICAgICByZXR1cm4gUi5hdCAtMSBpZiBwaWNrZXIgaXMgJ2xhc3QnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fOSB1bmtub3duIHBpY2tlciAje3BpY2tlcn1cIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpfd2Fsa19hbmRfcGljayA9IC0+XG4gICAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICAgIGNvdW50ICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHZhbHVlIGZyb20gQF93YWxrX2FsbF90b19leGhhdXN0aW9uKClcbiAgICAgICAgY291bnQrK1xuICAgICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgZWxzZSBpZiBAY2ZnLnBpY2sgaXMgJ2FsbCdcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBwcmV2aW91cyA9IHZhbHVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gICAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpfd2Fsa19hbmRfcGljayA9IC0+XG4gICAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICAgIGNvdW50ICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGF3YWl0IHZhbHVlIGZyb20gQF93YWxrX2FsbF90b19leGhhdXN0aW9uKClcbiAgICAgICAgY291bnQrK1xuICAgICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgICAgZWxzZSBpZiBAY2ZnLnBpY2sgaXMgJ2FsbCdcbiAgICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgICBwcmV2aW91cyA9IHZhbHVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbiA9IC0+XG4gICAgICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgZWxzZSAgICAgICAgICAgICAgICB5aWVsZCBmcm9tICAgICAgIEB0cmFuc2Zvcm1zWyAwIF0gQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgICAgIGlmIEBpc19lbXB0eSAgdGhlbiAgeWllbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICBlbHNlICAgICAgICAgICAgICAgIHlpZWxkIGZyb20gYXdhaXQgQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgO251bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6cHVzaCA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgICAgdGZtICAgICAgICAgPSBAY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbVxuICAgICAgbXlfaWR4ICAgICAgPSBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUiA9IG5hbWVpdCBcIihtYW5hZ2VkKV8je3RmbS5uYW1lfVwiLCBkbyAoIG1lID0gQCApIC0+ICggZCApIC0+XG4gICAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgICAgaWYgbnh0PyB0aGVuICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBmcm9tICAgICAgIG54dCBqICAgICAgICAgKSBmb3IgaiBmcm9tICAgICAgIHRmbSBkIDtudWxsXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqIGlmIG1lLm91dGxldC5zZWxlY3QgaiAgKSBmb3IgaiBmcm9tICAgICAgIHRmbSBkIDtudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgZnJvbSB5aWVsZGVyIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRyYW5zZm9ybXMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpwdXNoID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gICAgICB0Zm0gICAgICAgICA9IEBjb25maWd1cmVfdHJhbnNmb3JtIHNlbGVjdG9ycy4uLiwgdGZtXG4gICAgICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBueHQgICAgICAgICA9IG51bGxcbiAgICAgIHlpZWxkZXIgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7dGZtLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgICBueHQgPSBtZS50cmFuc2Zvcm1zWyBteV9pZHggKyAxIF1cbiAgICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gYXdhaXQgbnh0IGogICAgICAgICApIGZvciBhd2FpdCBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciBhd2FpdCBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IHlpZWxkZXIgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICB0eXBlX29mLFxuICAgIG1pc2ZpdCxcbiAgICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9jdWUsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgQXN5bmNfamV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgZG8gPT4geyByZXF1aXJlX2pldHN0cmVhbSwgfVxuIl19
