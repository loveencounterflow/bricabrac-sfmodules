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
                throw new Error(`Ωim___2 expected an integer or a text, got a ${type}`);
              }
              R = bound;
              break;
            case 'text':
              R = bound.codePointAt(0);
              break;
            default:
              throw new Error(`Ωim___3 expected an integer or a text, got a ${type}`);
          }
          if (!((this.cfg.first <= R && R <= this.cfg.last))) {
            throw new Error(`Ωim___4 ${as_hex(R)} is not between ${as_hex(this.cfg.first)} and ${as_hex(this.cfg.last)}`);
          }
          return R;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Hoard.prototype.create_run = nfa({
        template: templates.create_run
      }, function(lo, hi, cfg) {
        // debug 'Ωim___1', { lo, hi, cfg, }
        // debug 'Ωim___1', @_get_hi_and_lo cfg
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxnQ0FBUixDQUFGLENBQTRDLENBQUMsY0FBN0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7SUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx3Q0FBUixFQVY5Qjs7SUFhRSxTQUFBLEdBRUUsQ0FBQTs7TUFBQSxPQUFBLEVBQ0U7UUFBQSxFQUFBLEVBQVksSUFBWjtRQUNBLEVBQUEsRUFBWSxJ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LENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixFQUFPLE9BQVAsRUFBZ0IsU0FBaEIsRUFBMkIsR0FBM0IsQ0FBZDtBQUNaLGFBQU8sQ0FDTCxLQURLLEVBRUwsU0FGSztJQUZXLENBQUE7RUFsUEU7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uL21haW4nXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4gIHsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiAgSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLnRzJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJ1bl9jZmc6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgICBzY2F0dGVyOiAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2NmZzpcbiAgICAgIGhvYXJkOiAgICAgIG51bGxcbiAgICAgIGRhdGE6ICAgICAgIG51bGxcbiAgICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgICBub3JtYWxpemU6ICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9hZGQ6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBob2FyZF9jZmc6XG4gICAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICAgIGxhc3Q6ICAgICAgIDB4MTBfZmZmZlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3J1bjpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFzX2hleCA9ICggbiApIC0+XG4gICAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBSdW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IGxvLCBoaSwgfSkgLT5cbiAgICAgIEBsbyAgID0gbG9cbiAgICAgIEBoaSAgID0gaGlcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gWyBAbG8gLi4gQGhpIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXNfaGFsZm9wZW46ICAgICAgICAgICAgICAgIC0+IHsgc3RhcnQ6IEBsbywgZW5kOiBAaGkgKyAxLCB9XG4gICAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBSdW5cbiAgICAgICAgICByZXR1cm4gKCBAbG8gPD0gcHJvYmUubG8gPD0gQGhpICkgYW5kICggQGxvIDw9IHByb2JlLmhpIDw9IEBoaSApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgICAgcmV0dXJuIHRydWVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2NhdHRlclxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB2YWxpZGF0ZSAjIyNcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgZnJlZXplIGRhdGEgIyMjXG4gICAgICBbIGNmZyxcbiAgICAgICAgeyBkYXRhLCB9LCAgXSA9IGRlcGxveSB7IHRlbXBsYXRlcy5zY2F0dGVyX2NmZy4uLiwgY2ZnLi4uLCB9LCBbICdzb3J0JywgJ25vcm1hbGl6ZScsIF0sIFsgJ2RhdGEnLCBdXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBmcmVlemUgZGF0YVxuICAgICAgQHJ1bnMgICAgICAgICAgID0gW11cbiAgICAgIGhpZGUgQCwgJ2NmZycsICAgIGZyZWV6ZSBjZmdcbiAgICAgIGhpZGUgQCwgJ2hvYXJkJywgIGhvYXJkXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gQHdhbGsoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAtPlxuICAgICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgICAgeWllbGQgZnJvbSBydW4gZm9yIHJ1biBpbiBAcnVuc1xuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdpc19ub3JtYWxpemVkJywgIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG4gICAgc2V0X2dldHRlciBAOjosICdwb2ludHMnLCAtPiBbIEAuLi4sIF1cbiAgICAgICMgcG9pbnRzID0gbmV3IFNldCBbICggWyBydW4uLi4sIF0gZm9yIHJ1biBpbiBAcnVucyApLi4uLCBdLmZsYXQoKVxuICAgICAgIyByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICAgIyAgIHJldHVybiArMSBpZiBhID4gYlxuICAgICAgIyAgIHJldHVybiAtMSBpZiBhIDwgYlxuICAgICAgIyAgIHJldHVybiAgMFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgICBAcnVucy5wdXNoIHJ1blxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc29ydDogLT5cbiAgICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICAgIHJldHVybiAgMFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYXI6IC0+XG4gICAgICBAcnVucy5sZW5ndGggPSBbXVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkOiAoIFAuLi4gKSAtPlxuICAgICAgQF9pbnNlcnQgQGhvYXJkLmNyZWF0ZV9ydW4gUC4uLlxuICAgICAgaWYgQGNmZy5ub3JtYWxpemUgdGhlbiBAbm9ybWFsaXplKClcbiAgICAgIGVsc2UgaWYgQGNmZy5zb3J0IHRoZW4gQHNvcnQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX2NvZGVwb2ludHNfb2Y6ICggdGV4dHMuLi4gKSAtPiBAYWRkIGNociBmb3IgY2hyIGZyb20gbmV3IFNldCB0ZXh0cy5qb2luICcnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZTogLT5cbiAgICAgIEBzb3J0KClcbiAgICAgIGhhbGZvcGVucyA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gQHJ1bnMgKVxuICAgICAgQGNsZWFyKClcbiAgICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSB0cnVlXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBtaW4gPD0gcHJvYmUgPD0gbWF4XG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiBydW4uY29udGFpbnMgcHJvYmVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5sbyA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUuaGkgPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+ICggcnVuLmNvbnRhaW5zIHByb2JlLmxvICkgYW5kICggcnVuLmNvbnRhaW5zIHByb2JlLmhpIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICAgIHByb2JlLm5vcm1hbGl6ZSgpIHVubGVzcyBwcm9iZS5pc19ub3JtYWxpemVkXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5taW4gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLm1heCA8PSBtYXggKVxuICAgICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmNvbnRhaW5zIG5cbiAgICAgIHJldHVybiB0cnVlXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEhvYXJkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgQGdhcHMgPSBbXVxuICAgICAgQGhpdHMgPSBbXVxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY3JlYXRlX3J1biwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICAjIGRlYnVnICfOqWltX19fMScsIHsgbG8sIGhpLCBjZmcsIH1cbiAgICAgICMgZGVidWcgJ86paW1fX18xJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgICAgcmV0dXJuIG5ldyBSdW4gQF9nZXRfaGlfYW5kX2xvIGNmZ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc2NhdHRlcjogKCBQLi4uICkgLT4gbmV3IFNjYXR0ZXIgIEAsIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jYXN0X2JvdW5kOiAoIGJvdW5kICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzIgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAgIFIgPSBib3VuZFxuICAgICAgICB3aGVuICd0ZXh0J1xuICAgICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fMyBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzQgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICAgIHJldHVybiB7XG4gICAgICBIb2FyZCxcbiAgICAgIGludGVybmFscywgfVxuIl19
