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
            for (var j = ref = this.lo, ref1 = this.hi; ref <= ref1 ? j <= ref1 : j >= ref1; ref <= ref1 ? j++ : j--){ results.push(j); }
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
        contains(i) {
          return (this.lo <= i && i <= this.hi);
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
          var j, len, ref, run;
          if (!this.is_normalized) {
            this.normalize();
          }
          ref = this.runs;
          for (j = 0, len = ref.length; j < len; j++) {
            run = ref[j];
            yield* run;
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        * walk() {
          return (yield* this);
        }

        * walk_raw() {
          return (yield* this.points);
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
          var run;
          run = this.hoard.create_run(...P);
          this._insert(run);
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
          var halfopen, halfopens, j, len, run;
          this.sort();
          halfopens = IFN.simplify((function() {
            var j, len, ref, results;
            ref = this.runs;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              run = ref[j];
              results.push(run.as_halfopen());
            }
            return results;
          }).call(this));
          this.clear();
          for (j = 0, len = halfopens.length; j < len; j++) {
            halfopen = halfopens[j];
            this.runs.push(Run.from_halfopen(halfopen));
          }
          this.state.is_normalized = true;
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        contains(i) {
          return this.runs.some(function(run) {
            return run.contains(i);
          });
        }

      };

      //-------------------------------------------------------------------------------------------------------
      /* NOTE override to define custom cast from arguments to bounds */
      Scatter.prototype.get_hi_and_lo = null; // ( cfg ) ->

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'is_normalized', function() {
        return this.state.is_normalized;
      });

      set_getter(Scatter.prototype, 'points', function() {
        var points, run;
        points = new Set([
          ...((function() {
            var j,
          len,
          ref,
          results;
            ref = this.runs;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              run = ref[j];
              results.push([...run]);
            }
            return results;
          }).call(this))
        ].flat());
        return [...points].sort(function(a, b) {
          if (a > b) {
            return +1;
          }
          if (a < b) {
            return -1;
          }
          return 0;
        });
      });

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
          var j, len, ref, results;
          ref = this.runs;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            run = ref[j];
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
          var j, len, ref, results;
          ref = this.runs;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            run = ref[j];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxnQ0FBUixDQUFGLENBQTRDLENBQUMsY0FBN0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7SUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx3Q0FBUixFQVY5Qjs7SUFhRSxTQUFBLEdBRUUsQ0FBQTs7TUFBQSxPQUFBLEVBQ0U7UUFBQSxFQUFBLEVBQVksSUFBWjtRQUNBLEVBQUEsRUFBWSxJ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Y0FBRCxDQUFnQixHQUFoQixDQUFSO01BSDRDLENBQXpDOzs7O2tCQWhMaEI7O0FBNE1FLFdBQU8sT0FBQSxHQUFhLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDdEIsVUFBQTtNQUFJLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixFQUFPLE9BQVAsRUFBZ0IsU0FBaEIsRUFBMkIsR0FBM0IsQ0FBZDtBQUNaLGFBQU8sQ0FDTCxLQURLLEVBRUwsU0FGSztJQUZXLENBQUE7RUE5TUU7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uL21haW4nXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4gIHsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiAgSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLnRzJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJ1bl9jZmc6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgICBzY2F0dGVyOiAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2NmZzpcbiAgICAgIGhvYXJkOiAgICAgIG51bGxcbiAgICAgIGRhdGE6ICAgICAgIG51bGxcbiAgICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgICBub3JtYWxpemU6ICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9hZGQ6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBob2FyZF9jZmc6XG4gICAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICAgIGxhc3Q6ICAgICAgIDB4MTBfZmZmZlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3J1bjpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFzX2hleCA9ICggbiApIC0+XG4gICAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBSdW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IGxvLCBoaSwgfSkgLT5cbiAgICAgIEBsbyAgID0gbG9cbiAgICAgIEBoaSAgID0gaGlcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gWyBAbG8gLi4gQGhpIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXNfaGFsZm9wZW46ICAgICAgICAgICAgICAgIC0+IHsgc3RhcnQ6IEBsbywgZW5kOiBAaGkgKyAxLCB9XG4gICAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBpICkgLT4gQGxvIDw9IGkgPD0gQGhpXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggaG9hcmQsIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGZyZWV6ZSBkYXRhICMjI1xuICAgICAgWyBjZmcsXG4gICAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgICAgQGRhdGEgICAgICAgICAgID0gZnJlZXplIGRhdGFcbiAgICAgIEBydW5zICAgICAgICAgICA9IFtdXG4gICAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgICBoaWRlIEAsICdob2FyZCcsICBob2FyZFxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBOT1RFIG92ZXJyaWRlIHRvIGRlZmluZSBjdXN0b20gY2FzdCBmcm9tIGFyZ3VtZW50cyB0byBib3VuZHMgIyMjXG4gICAgZ2V0X2hpX2FuZF9sbzogbnVsbCAjICggY2ZnICkgLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgLT4geWllbGQgZnJvbSBAXG4gICAgd2Fsa19yYXc6IC0+IHlpZWxkIGZyb20gQHBvaW50c1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+XG4gICAgICBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgICByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICAgIHJldHVybiAgMFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgICBAcnVucy5wdXNoIHJ1blxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc29ydDogLT5cbiAgICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICAgIHJldHVybiAgMFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYXI6IC0+XG4gICAgICBAcnVucy5sZW5ndGggPSBbXVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkOiAoIFAuLi4gKSAtPlxuICAgICAgcnVuICAgICAgICAgPSBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgICBAX2luc2VydCBydW5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZCBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggaSApIC0+IEBydW5zLnNvbWUgKCBydW4gKSAtPiBydW4uY29udGFpbnMgaVxuICBcbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBIb2FyZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgQGNmZyA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmNyZWF0ZV9ydW4sIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgIyBkZWJ1ZyAnzqlpbV9fXzEnLCB7IGxvLCBoaSwgY2ZnLCB9XG4gICAgICAjIGRlYnVnICfOqWltX19fMScsIEBfZ2V0X2hpX2FuZF9sbyBjZmdcbiAgICAgIHJldHVybiBuZXcgUnVuIEBfZ2V0X2hpX2FuZF9sbyBjZmdcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3NjYXR0ZXI6ICggUC4uLiApIC0+IG5ldyBTY2F0dGVyICBALCBQLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaGlfYW5kX2xvOiAoIGNmZyApIC0+XG4gICAgICByZXR1cm4geyBsbzogKCBAX2Nhc3RfYm91bmQgY2ZnLmxvICksIGhpOiAoIEBfY2FzdF9ib3VuZCBjZmcuaGkgPyBjZmcubG8gKSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY2FzdF9ib3VuZDogKCBib3VuZCApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgYm91bmRcbiAgICAgICAgd2hlbiAnZmxvYXQnXG4gICAgICAgICAgdW5sZXNzIE51bWJlci5pc0ludGVnZXIgYm91bmRcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX18yIGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgICBSID0gYm91bmRcbiAgICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgICBSID0gYm91bmQuY29kZVBvaW50QXQgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzMgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdW5sZXNzICggQGNmZy5maXJzdCA8PSBSIDw9IEBjZmcubGFzdCApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX180ICN7YXNfaGV4IFJ9IGlzIG5vdCBiZXR3ZWVuICN7YXNfaGV4IEBjZmcuZmlyc3R9IGFuZCAje2FzX2hleCBAY2ZnLmxhc3R9XCJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICByZXR1cm4gZXhwb3J0cyA9IGRvID0+XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IFJ1biwgU2NhdHRlciwgdGVtcGxhdGVzLCBJRk4sIH1cbiAgICByZXR1cm4ge1xuICAgICAgSG9hcmQsXG4gICAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
