(function() {
  'use strict';
  //===========================================================================================================
  this.require_intermission = function() {
    var Hoard, IFN, Run, SFMODULES, Scatter, as_hex, debug, deploy, exports, freeze, hide, nameit, nfa, set_getter, templates, type_of;
    //=========================================================================================================
    ({debug} = console);
    SFMODULES = require('../main');
    ({nfa} = SFMODULES.unstable.require_normalize_function_arguments());
    ({nameit} = SFMODULES.require_nameit());
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({hide, set_getter} = SFMODULES.require_managed_property_tools());
    ({deploy} = (require('../unstable-object-tools-brics')).require_deploy());
    ({freeze} = Object);
    IFN = require('../../dependencies/intervals-fn-lib.ts');
    //=========================================================================================================
    templates = {
      //.......................................................................................................
      run_cfg: {
        lo: null,
        hi: null,
        scatter: null
      },
      //.......................................................................................................
      scatter_cfg: {
        hoard: null,
        data: null,
        sort: false,
        normalize: false
      },
      //.......................................................................................................
      scatter_add: {
        lo: null,
        hi: null
      },
      //.......................................................................................................
      hoard_cfg: {
        first: 0x00_0000,
        last: 0x10_ffff
      },
      //.......................................................................................................
      create_run: {
        lo: null,
        hi: null
      }
    };
    //=========================================================================================================
    as_hex = function(n) {
      var sign;
      sign = n < 0 ? '-' : '+';
      return `${sign}0x${(Math.abs(n)).toString(16)}`;
    };
    Run = (function() {
      //=========================================================================================================
      class Run {
        //-------------------------------------------------------------------------------------------------------
        constructor({lo, hi}) {
          this.lo = lo;
          this.hi = hi;
          void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        * [Symbol.iterator]() {
          var ref, ref1;
          return (yield* (function() {
            var results = [];
            for (var i = ref = this.lo, ref1 = this.hi; ref <= ref1 ? i <= ref1 : i >= ref1; ref <= ref1 ? i++ : i--){ results.push(i); }
            return results;
          }).apply(this));
        }

        //-------------------------------------------------------------------------------------------------------
        as_halfopen() {
          return {
            start: this.lo,
            end: this.hi + 1
          };
        }

        static from_halfopen(halfopen) {
          return new this({
            lo: halfopen.start,
            hi: halfopen.end - 1
          });
        }

        //-------------------------------------------------------------------------------------------------------
        contains(probe) {
          var chr, n, ref, ref1;
          //.....................................................................................................
          switch (true) {
            //...................................................................................................
            case Number.isFinite(probe):
              return (this.lo <= probe && probe <= this.hi);
            //...................................................................................................
            case probe instanceof Run:
              return ((this.lo <= (ref = probe.lo) && ref <= this.hi)) && ((this.lo <= (ref1 = probe.hi) && ref1 <= this.hi));
            //...................................................................................................
            case (type_of(probe)) === 'text':
              probe = (function() {
                var i, len, ref2, results;
                ref2 = Array.from(probe);
                results = [];
                for (i = 0, len = ref2.length; i < len; i++) {
                  chr = ref2[i];
                  results.push(chr.codePointAt(0));
                }
                return results;
              })();
          }
//.....................................................................................................
          for (n of probe) {
            if (!((this.lo <= n && n <= this.hi))) {
              return false;
            }
          }
          return true;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      set_getter(Run.prototype, 'size', function() {
        return this.hi - this.lo + 1/* TAINT consider to make `Run`s immutable, then size is a constant */;
      });

      return Run;

    }).call(this);
    Scatter = (function() {
      //=========================================================================================================
      class Scatter {
        //-------------------------------------------------------------------------------------------------------
        constructor(hoard, cfg) {
          var data;
          [cfg, {data}] = deploy({...templates.scatter_cfg, ...cfg}, ['sort', 'normalize'], ['data']);
          this.data = freeze(data);
          this.runs = [];
          hide(this, 'cfg', freeze(cfg));
          hide(this, 'hoard', hoard);
          hide(this, 'state', {
            is_normalized: true
          });
          void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        * [Symbol.iterator]() {
          return (yield* this.walk());
        }

        //-------------------------------------------------------------------------------------------------------
        * walk() {
          var i, len, ref, run;
          if (!this.is_normalized) {
            this.normalize();
          }
          ref = this.runs;
          for (i = 0, len = ref.length; i < len; i++) {
            run = ref[i];
            yield* run;
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        _insert(run) {
          /* NOTE this private API provides an opportunity to implement always-ordered runs; however we opt for
               sorting all ranges when needed by a method like `Scatter::normalize()` */
          this.runs.push(run);
          this.state.is_normalized = false;
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        sort() {
          this.runs.sort(function(a, b) {
            if (a.lo > b.lo) {
              return +1;
            }
            if (a.lo < b.lo) {
              return -1;
            }
            if (a.hi > b.hi) {
              return +1;
            }
            if (a.hi < b.hi) {
              return -1;
            }
            return 0;
          });
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        clear() {
          this.runs.length = [];
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        add(...P) {
          this._insert(this.hoard.create_run(...P));
          if (this.cfg.normalize) {
            this.normalize();
          } else if (this.cfg.sort) {
            this.sort();
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        add_codepoints_of(...texts) {
          var chr, results;
          results = [];
          for (chr of new Set(texts.join(''))) {
            results.push(this.add(chr));
          }
          return results;
        }

        //-------------------------------------------------------------------------------------------------------
        normalize() {
          var halfopen, halfopens, i, len, run;
          this.sort();
          halfopens = IFN.simplify((function() {
            var i, len, ref, results;
            ref = this.runs;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              run = ref[i];
              results.push(run.as_halfopen());
            }
            return results;
          }).call(this));
          this.clear();
          for (i = 0, len = halfopens.length; i < len; i++) {
            halfopen = halfopens[i];
            this.runs.push(Run.from_halfopen(halfopen));
          }
          this.state.is_normalized = true;
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        contains(probe) {
          var chr, max, min, n, ref, ref1, ref2, ref3;
          if (!this.is_normalized) {
            this.normalize();
          }
          ({min, max} = this.minmax);
          //.....................................................................................................
          switch (true) {
            //...................................................................................................
            case Number.isFinite(probe):
              if (!((min <= probe && probe <= max))) {
                return false;
              }
              return this.runs.some((run) => {
                return run.contains(probe);
              });
            //...................................................................................................
            case probe instanceof Run:
              if (!(((min <= (ref = probe.lo) && ref <= max)) && ((min <= (ref1 = probe.hi) && ref1 <= max)))) {
                return false;
              }
              return this.runs.some((run) => {
                return (run.contains(probe.lo)) && (run.contains(probe.hi));
              });
            //...................................................................................................
            case probe instanceof Scatter:
              if (!probe.is_normalized) {
                probe.normalize();
              }
              if (!(((min <= (ref2 = probe.min) && ref2 <= max)) && ((min <= (ref3 = probe.max) && ref3 <= max)))) {
                return false;
              }
              return probe.runs.every((run) => {
                return this.contains(run);
              });
            //...................................................................................................
            case (type_of(probe)) === 'text':
              probe = (function() {
                var i, len, ref4, results;
                ref4 = Array.from(probe);
                results = [];
                for (i = 0, len = ref4.length; i < len; i++) {
                  chr = ref4[i];
                  results.push(chr.codePointAt(0));
                }
                return results;
              })();
          }
//.....................................................................................................
          for (n of probe) {
            if (!this.runs.some(function(run) {
              return run.contains(n);
            })) {
              return false;
            }
          }
          return true;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'is_normalized', function() {
        return this.state.is_normalized;
      });

      set_getter(Scatter.prototype, 'points', function() {
        return [...this];
      });

      // points = new Set [ ( [ run..., ] for run in @runs )..., ].flat()
      // return [ points..., ].sort ( a, b ) ->
      //   return +1 if a > b
      //   return -1 if a < b
      //   return  0

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'min', function() {
        var run;
        if (this.runs.length === 0) {
          return null;
        }
        if (this.is_normalized) {
          return (this.runs.at(0)).lo;
        }
        return Math.min(...((function() {
          var i, len, ref, results;
          ref = this.runs;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            run = ref[i];
            results.push(run.lo);
          }
          return results;
        }).call(this)));
      });

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'max', function() {
        var run;
        if (this.runs.length === 0) {
          return null;
        }
        if (this.is_normalized) {
          return (this.runs.at(-1)).hi;
        }
        return Math.max(...((function() {
          var i, len, ref, results;
          ref = this.runs;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            run = ref[i];
            results.push(run.hi);
          }
          return results;
        }).call(this)));
      });

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'minmax', function() {
        return {
          min: this.min,
          max: this.max
        };
      });

      return Scatter;

    }).call(this);
    Hoard = (function() {
      
        //=========================================================================================================
      class Hoard {
        //-------------------------------------------------------------------------------------------------------
        constructor(cfg) {
          this.cfg = freeze({...templates.hoard_cfg, ...cfg});
          this.gaps = [];
          this.hits = [];
          hide(this, 'scatters', []);
          hide(this, 'state', {
            is_normalized: true
          });
          void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        create_scatter(...P) {
          return new Scatter(this, ...P);
        }

        //-------------------------------------------------------------------------------------------------------
        add_scatter(...P) {
          var R;
          R = this.create_scatter(...P);
          this.scatters.push(R);
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        contains() {}

        //-------------------------------------------------------------------------------------------------------
        data_for(...P) {
          var R, i, len, ref, scatter;
          R = [];
          ref = this.scatters;
          for (i = 0, len = ref.length; i < len; i++) {
            scatter = ref[i];
            if (!scatter.contains(...P)) {
              continue;
            }
            R.push(scatter.data);
          }
          if (R.length === 0) {
            return null;
          }
          return this.normalize_data(...R);
        }

        //-------------------------------------------------------------------------------------------------------
        normalize_data(...items) {
          var R, i, item, key, keys, len, ref, values;
          items = items.flat();
          R = {};
          keys = [
            ...(new Set(((function() {
              var i,
            len,
            results;
              results = [];
              for (i = 0, len = items.length; i < len; i++) {
                item = items[i];
                results.push((function() {
                  var results1;
                  results1 = [];
                  for (key in item) {
                    results1.push(key);
                  }
                  return results1;
                })());
              }
              return results;
            })()).flat()))
          ].sort();
          for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            values = (function() {
              var j, len1, results;
              results = [];
              for (j = 0, len1 = items.length; j < len1; j++) {
                item = items[j];
                results.push(item[key]);
              }
              return results;
            })();
            R[key] = ((ref = this[`normalize_data_${key}`]) != null ? ref : (function(x) {
              return x;
            })).call(this, values);
            // for item in items
            //   for key, value of item
            //     if key is 'data'
            debug('Ωim___3', values);
            debug('Ωim___4', R[key]);
          }
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        normalize_data_tags(values) {
          return [...(new Set(values.flat()))];
        }

        //-------------------------------------------------------------------------------------------------------
        _get_hi_and_lo(cfg) {
          var ref;
          return {
            lo: this._cast_bound(cfg.lo),
            hi: this._cast_bound((ref = cfg.hi) != null ? ref : cfg.lo)
          };
        }

        //-------------------------------------------------------------------------------------------------------
        _cast_bound(bound) {
          var R, type;
          switch (type = type_of(bound)) {
            case 'float':
              if (!Number.isInteger(bound)) {
                throw new Error(`Ωim___5 expected an integer or a text, got a ${type}`);
              }
              R = bound;
              break;
            case 'text':
              R = bound.codePointAt(0);
              break;
            default:
              throw new Error(`Ωim___6 expected an integer or a text, got a ${type}`);
          }
          if (!((this.cfg.first <= R && R <= this.cfg.last))) {
            throw new Error(`Ωim___7 ${as_hex(R)} is not between ${as_hex(this.cfg.first)} and ${as_hex(this.cfg.last)}`);
          }
          return R;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Hoard.prototype.create_run = nfa({
        template: templates.create_run
      }, function(lo, hi, cfg) {
        // debug 'Ωim___1', { lo, hi, cfg, }
        // debug 'Ωim___2', @_get_hi_and_lo cfg
        return new Run(this._get_hi_and_lo(cfg));
      });

      return Hoard;

    }).call(this);
    //=========================================================================================================
    return exports = (() => {
      var internals;
      internals = Object.freeze({Run, Scatter, templates, IFN});
      return {Hoard, internals};
    })();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxnQ0FBUixDQUFGLENBQTRDLENBQUMsY0FBN0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7SUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx3Q0FBUixFQVY5Qjs7SUFhRSxTQUFBLEdBRUUsQ0FBQTs7TUFBQSxPQUFBLEVBQ0U7UUFBQSxFQUFBLEVBQVksSUFBWjtRQUNBLEVBQUEsRUFBWSxJ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LENBQVcsTUFBQSxDQUFPLENBQVAsQ0FBWCxDQUFBLGdCQUFBLENBQUEsQ0FBc0MsTUFBQSxDQUFPLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBWixDQUF0QyxDQUFBLEtBQUEsQ0FBQSxDQUErRCxNQUFBLENBQU8sSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFaLENBQS9ELENBQUEsQ0FBVixFQURSOztBQUVBLGlCQUFPO1FBWkk7O01BN0RmOzs7c0JBWUUsVUFBQSxHQUFZLEdBQUEsQ0FBSTtRQUFFLFFBQUEsRUFBVSxTQUFTLENBQUM7TUFBdEIsQ0FBSixFQUF5QyxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sRUFBVSxHQUFWLENBQUEsRUFBQTs7O0FBR25ELGVBQU8sSUFBSSxHQUFKLENBQVEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsR0FBaEIsQ0FBUjtNQUg0QyxDQUF6Qzs7OztrQkFyTmhCOztBQXFSRSxXQUFPLE9BQUEsR0FBYSxDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3RCLFVBQUE7TUFBSSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsRUFBTyxPQUFQLEVBQWdCLFNBQWhCLEVBQTJCLEdBQTNCLENBQWQ7QUFDWixhQUFPLENBQ0wsS0FESyxFQUVMLFNBRks7SUFGVyxDQUFBO0VBdlJFO0FBTnhCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQHJlcXVpcmVfaW50ZXJtaXNzaW9uID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi9tYWluJ1xuICB7IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuICB7IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4gIElGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi50cydcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHRlbXBsYXRlcyA9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBydW5fY2ZnOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICAgc2NhdHRlcjogICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9jZmc6XG4gICAgICBob2FyZDogICAgICBudWxsXG4gICAgICBkYXRhOiAgICAgICBudWxsXG4gICAgICBzb3J0OiAgICAgICBmYWxzZVxuICAgICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfYWRkOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaG9hcmRfY2ZnOlxuICAgICAgZmlyc3Q6ICAgICAgMHgwMF8wMDAwXG4gICAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9ydW46XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBhc19oZXggPSAoIG4gKSAtPlxuICAgIHNpZ24gPSBpZiBuIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUnVuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgICBAbG8gICA9IGxvXG4gICAgICBAaGkgICA9IGhpXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsIC0+IEBoaSAtIEBsbyArIDEgIyMjIFRBSU5UIGNvbnNpZGVyIHRvIG1ha2UgYFJ1bmBzIGltbXV0YWJsZSwgdGhlbiBzaXplIGlzIGEgY29uc3RhbnQgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICAgIEBmcm9tX2hhbGZvcGVuOiggaGFsZm9wZW4gKSAtPiBuZXcgQCB7IGxvOiBoYWxmb3Blbi5zdGFydCwgaGk6IGhhbGZvcGVuLmVuZCAtIDEsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuICggQGxvIDw9IHByb2JlLmxvIDw9IEBoaSApIGFuZCAoIEBsbyA8PSBwcm9iZS5oaSA8PSBAaGkgKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICAgIHJldHVybiB0cnVlXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggaG9hcmQsIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGZyZWV6ZSBkYXRhICMjI1xuICAgICAgWyBjZmcsXG4gICAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgICAgQGRhdGEgICAgICAgICAgID0gZnJlZXplIGRhdGFcbiAgICAgIEBydW5zICAgICAgICAgICA9IFtdXG4gICAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgICBoaWRlIEAsICdob2FyZCcsICBob2FyZFxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEB3YWxrKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogLT5cbiAgICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsICAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuICAgIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG4gICAgICAjIHBvaW50cyA9IG5ldyBTZXQgWyAoIFsgcnVuLi4uLCBdIGZvciBydW4gaW4gQHJ1bnMgKS4uLiwgXS5mbGF0KClcbiAgICAgICMgcmV0dXJuIFsgcG9pbnRzLi4uLCBdLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICMgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAgICMgICByZXR1cm4gLTEgaWYgYSA8IGJcbiAgICAgICMgICByZXR1cm4gIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtaW4nLCAtPlxuICAgICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWluICggcnVuLmxvIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21heCcsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgLTEgKS5oaSBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWF4ICggcnVuLmhpIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2luc2VydDogKCBydW4gKSAtPlxuICAgICAgIyMjIE5PVEUgdGhpcyBwcml2YXRlIEFQSSBwcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBpbXBsZW1lbnQgYWx3YXlzLW9yZGVyZWQgcnVuczsgaG93ZXZlciB3ZSBvcHQgZm9yXG4gICAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgICAgQHJ1bnMucHVzaCBydW5cbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gZmFsc2VcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNvcnQ6IC0+XG4gICAgICBAcnVucy5zb3J0ICggYSwgYiApIC0+XG4gICAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgICAgcmV0dXJuICsxIGlmIGEuaGkgPiBiLmhpXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgICByZXR1cm4gIDBcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsZWFyOiAtPlxuICAgICAgQHJ1bnMubGVuZ3RoID0gW11cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZDogKCBQLi4uICkgLT5cbiAgICAgIEBfaW5zZXJ0IEBob2FyZC5jcmVhdGVfcnVuIFAuLi5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZCBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiAoIHJ1bi5jb250YWlucyBwcm9iZS5sbyApIGFuZCAoIHJ1bi5jb250YWlucyBwcm9iZS5oaSApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFNjYXR0ZXJcbiAgICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubWluIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5tYXggPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gcHJvYmUucnVucy5ldmVyeSAoIHJ1biApID0+IEBjb250YWlucyBydW5cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgICByZXR1cm4gdHJ1ZVxuICBcbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBIb2FyZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuaG9hcmRfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBnYXBzID0gW11cbiAgICAgIEBoaXRzID0gW11cbiAgICAgIGhpZGUgQCwgJ3NjYXR0ZXJzJywgW11cbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY3JlYXRlX3J1biwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICAjIGRlYnVnICfOqWltX19fMScsIHsgbG8sIGhpLCBjZmcsIH1cbiAgICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgICAgcmV0dXJuIG5ldyBSdW4gQF9nZXRfaGlfYW5kX2xvIGNmZ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc2NhdHRlcjogKCBQLi4uICkgLT4gbmV3IFNjYXR0ZXIgIEAsIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgICBSID0gQGNyZWF0ZV9zY2F0dGVyIFAuLi5cbiAgICAgIEBzY2F0dGVycy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBkYXRhX2ZvcjogKCBQLi4uICkgLT5cbiAgICAgIFIgPSBbXVxuICAgICAgZm9yIHNjYXR0ZXIgaW4gQHNjYXR0ZXJzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBzY2F0dGVyLmNvbnRhaW5zIFAuLi5cbiAgICAgICAgUi5wdXNoIHNjYXR0ZXIuZGF0YVxuICAgICAgcmV0dXJuIG51bGwgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuIEBub3JtYWxpemVfZGF0YSBSLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZV9kYXRhOiAoIGl0ZW1zLi4uICkgLT5cbiAgICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgICBSICAgICA9IHt9XG4gICAgICBrZXlzICA9IFsgKCBuZXcgU2V0ICgga2V5IGZvciBrZXkgb2YgaXRlbSBmb3IgaXRlbSBpbiBpdGVtcyApLmZsYXQoKSApLi4uLCBdLnNvcnQoKVxuICAgICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICAgIHZhbHVlcyAgICA9ICggaXRlbVsga2V5IF0gZm9yIGl0ZW0gaW4gaXRlbXMgKVxuICAgICAgICBSWyBrZXkgXSAgPSAoIEBbIFwibm9ybWFsaXplX2RhdGFfI3trZXl9XCIgXSA/ICggKCB4ICkgLT4geCApICkuY2FsbCBALCB2YWx1ZXNcbiAgICAgICMgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICMgICBmb3Iga2V5LCB2YWx1ZSBvZiBpdGVtXG4gICAgICAjICAgICBpZiBrZXkgaXMgJ2RhdGEnXG4gICAgICAgIGRlYnVnICfOqWltX19fMycsIHZhbHVlc1xuICAgICAgICBkZWJ1ZyAnzqlpbV9fXzQnLCBSWyBrZXkgXVxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbm9ybWFsaXplX2RhdGFfdGFnczogKCB2YWx1ZXMgKSAtPiBbICggbmV3IFNldCB2YWx1ZXMuZmxhdCgpICkuLi4sIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jYXN0X2JvdW5kOiAoIGJvdW5kICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzUgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAgIFIgPSBib3VuZFxuICAgICAgICB3aGVuICd0ZXh0J1xuICAgICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNiBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzcgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICAgIHJldHVybiB7XG4gICAgICBIb2FyZCxcbiAgICAgIGludGVybmFscywgfVxuIl19
