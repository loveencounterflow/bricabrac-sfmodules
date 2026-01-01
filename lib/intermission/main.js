(function() {
  'use strict';
  //===========================================================================================================
  this.require_intermission = function() {
    var IFN, Run, SFMODULES, Scatter, as_hex, create_run_class, debug, exports, hide, internals, nameit, nfa, set_getter, templates, type_of;
    //=========================================================================================================
    ({debug} = console);
    SFMODULES = require('../main');
    ({nfa} = SFMODULES.unstable.require_normalize_function_arguments());
    ({nameit} = SFMODULES.require_nameit());
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({hide, set_getter} = SFMODULES.require_managed_property_tools());
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
        data: null,
        sort: false,
        normalize: false,
        first: 0x00_0000,
        last: 0x10_ffff
      },
      //.......................................................................................................
      scatter_add: {
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
    //=========================================================================================================
    // run_class_count = 0
    create_run_class = function(scatter = null) {
      var R, Run, cast_bound, get_hi_and_lo;
      // run_class_count++

      //-------------------------------------------------------------------------------------------------------
      cast_bound = function(bound) {
        var R, type;
        switch (type = type_of(bound)) {
          case 'float':
            if (!Number.isInteger(bound)) {
              throw new Error(`Ωim___1 expected an integer or a text, got a ${type}`);
            }
            R = bound;
            break;
          case 'text':
            R = bound.codePointAt(0);
            break;
          default:
            throw new Error(`Ωim___2 expected an integer or a text, got a ${type}`);
        }
        if ((scatter != null) && !((scatter.cfg.first <= R && R <= scatter.cfg.last))) {
          throw new Error(`Ωim___3 ${as_hex(R)} is not between ${as_hex(scatter.cfg.first)} and ${as_hex(scatter.cfg.last)}`);
        }
        return R;
      };
      //-------------------------------------------------------------------------------------------------------
      get_hi_and_lo = function(cfg) {
        var ref;
        if ((scatter != null ? scatter.get_hi_and_lo : void 0) != null) {
          return scatter.get_hi_and_lo(cfg);
        }
        return [cast_bound(cfg.lo), cast_bound((ref = cfg.hi) != null ? ref : cfg.lo)];
      };
      //=========================================================================================================
      R = Run = (function() {
        var ctor;

        class Run { // ["Run_nr#{run_class_count}"]
          constructor() {
            return ctor.apply(this, arguments);
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
          has(i) {
            return (this.lo <= i && i <= this.hi);
          }

        };

        ctor = nfa({
          template: templates.run_cfg
        }, function(lo, hi, cfg) {
          var ref;
          [this.lo, this.hi] = get_hi_and_lo(cfg);
          return hide(this, 'scatter', (ref = cfg.scatter) != null ? ref : null);
        });

        //-------------------------------------------------------------------------------------------------------
        set_getter(Run.prototype, 'data', function() {
          return this.scatter.data;
        });

        set_getter(Run.prototype, 'size', function() {
          return this.hi - this.lo + 1/* TAINT consider to make `Run`s immutable, then size is a constant */;
        });

        return Run;

      }).call(this);
      return R;
    };
    Run = create_run_class(null);
    Scatter = (function() {
      var ctor;

      //=========================================================================================================
      class Scatter {
        constructor() {
          return ctor.apply(this, arguments);
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
          run = new this.run_class(...P);
          // unless
          run.scatter = this;
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
        has(i) {
          return this.runs.some(function(run) {
            return run.has(i);
          });
        }

      };

      ctor = nfa({
        template: templates.scatter_cfg
      }, function(data, cfg) {
        /* TAINT validate */
        /* TAINT should freeze data */
        this.data = data;
        this.runs = [];
        hide(this, 'cfg', Object.freeze(cfg)); // { normalize, }
        hide(this, 'state', {
          is_normalized: true
        });
        hide(this, 'run_class', create_run_class(this));
        return void 0;
      });

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
    
    //=========================================================================================================
    internals = Object.freeze({IFN});
    return exports = {Run, Scatter, internals};
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQSxnQkFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVIsRUFSOUI7O0lBV0UsU0FBQSxHQUVFLENBQUE7O01BQUEsT0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxFQUFBLEVBQVksSUFEWjtRQUVBLE9BQUEsRUFBWTtNQUZaLENBREY7O01BS0EsV0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFZLElBQVo7UUFDQSxJQUFBLEVBQVksS0FEWjtRQUVBLFNBQUEsRUFBWSxLQUZaO1FBR0EsS0FBQSxFQUFZLFNBSFo7UUFJQSxJ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SSxDQUFDLEVBQU4sQ0FBUyxDQUFULENBQUYsQ0FBYyxDQUFDLEdBQXRCOztBQUNBLGVBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFBOztBQUFFO0FBQUE7VUFBQSxLQUFBLHFDQUFBOzt5QkFBQSxHQUFHLENBQUM7VUFBSixDQUFBOztxQkFBRixDQUFUO01BSGMsQ0FBdkI7OztNQU1BLFVBQUEsQ0FBVyxPQUFDLENBQUEsU0FBWixFQUFnQixLQUFoQixFQUF1QixRQUFBLENBQUEsQ0FBQTtBQUMzQixZQUFBO1FBQU0sSUFBZSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sS0FBZ0IsQ0FBL0I7QUFBQSxpQkFBTyxLQUFQOztRQUNBLElBQTZCLElBQUMsQ0FBQSxhQUE5QjtBQUFBLGlCQUFPLENBQUUsSUFBQyxDQUFBLElBQUksQ0FBQyxFQUFOLENBQVMsQ0FBQyxDQUFWLENBQUYsQ0FBZSxDQUFDLEdBQXZCOztBQUNBLGVBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFBOztBQUFFO0FBQUE7VUFBQSxLQUFBLHFDQUFBOzt5QkFBQSxHQUFHLENBQUM7VUFBSixDQUFBOztxQkFBRixDQUFUO01BSGMsQ0FBdkI7OztNQU1BLFVBQUEsQ0FBVyxPQUFDLENBQUEsU0FBWixFQUFnQixRQUFoQixFQUEwQixRQUFBLENBQUEsQ0FBQTtlQUFHO1VBQUUsR0FBQSxFQUFLLElBQUMsQ0FBQSxHQUFSO1VBQWEsR0FBQSxFQUFLLElBQUMsQ0FBQTtRQUFuQjtNQUFILENBQTFCOzs7O2tCQW5JSjs7O0lBc0xFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixDQUFkO0FBQ1osV0FBTyxPQUFBLEdBQVUsQ0FDZixHQURlLEVBRWYsT0FGZSxFQUdmLFNBSGU7RUF6TEs7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uL21haW4nXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIElGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi50cydcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHRlbXBsYXRlcyA9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBydW5fY2ZnOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICAgc2NhdHRlcjogICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9jZmc6XG4gICAgICBkYXRhOiAgICAgICBudWxsXG4gICAgICBzb3J0OiAgICAgICBmYWxzZVxuICAgICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgICAgIGZpcnN0OiAgICAgIDB4MDBfMDAwMFxuICAgICAgbGFzdDogICAgICAgMHgxMF9mZmZmXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2FkZDpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFzX2hleCA9ICggbiApIC0+XG4gICAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBydW5fY2xhc3NfY291bnQgPSAwXG4gIGNyZWF0ZV9ydW5fY2xhc3MgPSAoIHNjYXR0ZXIgPSBudWxsICkgLT5cbiAgICAjIHJ1bl9jbGFzc19jb3VudCsrXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNhc3RfYm91bmQgPSAoIGJvdW5kICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzEgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAgIFIgPSBib3VuZFxuICAgICAgICB3aGVuICd0ZXh0J1xuICAgICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fMiBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICBpZiBzY2F0dGVyPyBhbmQgbm90ICggc2NhdHRlci5jZmcuZmlyc3QgPD0gUiA8PSBzY2F0dGVyLmNmZy5sYXN0IClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzMgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggc2NhdHRlci5jZmcuZmlyc3R9IGFuZCAje2FzX2hleCBzY2F0dGVyLmNmZy5sYXN0fVwiXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfaGlfYW5kX2xvID0gKCBjZmcgKSAtPlxuICAgICAgcmV0dXJuIHNjYXR0ZXIuZ2V0X2hpX2FuZF9sbyBjZmcgaWYgc2NhdHRlcj8uZ2V0X2hpX2FuZF9sbz9cbiAgICAgIHJldHVybiBbICggY2FzdF9ib3VuZCBjZmcubG8gKSwgKCBjYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCBdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgUiA9IGNsYXNzIFJ1biAjIFtcIlJ1bl9uciN7cnVuX2NsYXNzX2NvdW50fVwiXVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMucnVuX2NmZywgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICAgIFsgQGxvLCBAaGksIF0gPSBnZXRfaGlfYW5kX2xvIGNmZ1xuICAgICAgICBoaWRlIEAsICdzY2F0dGVyJywgY2ZnLnNjYXR0ZXIgPyBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBbIEBsbyAuLiBAaGkgXVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2V0X2dldHRlciBAOjosICdkYXRhJywgLT4gQHNjYXR0ZXIuZGF0YVxuICAgICAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICAgICAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaGFzOiAoIGkgKSAtPiBAbG8gPD0gaSA8PSBAaGlcbiAgICByZXR1cm4gUlxuICBSdW4gPSBjcmVhdGVfcnVuX2NsYXNzIG51bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcbiAgICBjb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5zY2F0dGVyX2NmZywgfSwgKCBkYXRhLCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHZhbGlkYXRlICMjI1xuICAgICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICAgIEBkYXRhICAgPSBkYXRhXG4gICAgICBAcnVucyAgID0gW11cbiAgICAgIGhpZGUgQCwgJ2NmZycsICAgICAgICBPYmplY3QuZnJlZXplIGNmZyAjIHsgbm9ybWFsaXplLCB9XG4gICAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICBoaWRlIEAsICdydW5fY2xhc3MnLCAgY3JlYXRlX3J1bl9jbGFzcyBAXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBOT1RFIG92ZXJyaWRlIHRvIGRlZmluZSBjdXN0b20gY2FzdCBmcm9tIGFyZ3VtZW50cyB0byBib3VuZHMgIyMjXG4gICAgZ2V0X2hpX2FuZF9sbzogbnVsbCAjICggY2ZnICkgLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgLT4geWllbGQgZnJvbSBAXG4gICAgd2Fsa19yYXc6IC0+IHlpZWxkIGZyb20gQHBvaW50c1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+XG4gICAgICBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgICByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICAgIHJldHVybiAgMFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgICBAcnVucy5wdXNoIHJ1blxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc29ydDogLT5cbiAgICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICAgIHJldHVybiAgMFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYXI6IC0+XG4gICAgICBAcnVucy5sZW5ndGggPSBbXVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkOiAoIFAuLi4gKSAtPlxuICAgICAgcnVuICAgICAgICAgPSBuZXcgQHJ1bl9jbGFzcyBQLi4uXG4gICAgICAjIHVubGVzc1xuICAgICAgcnVuLnNjYXR0ZXIgPSBAXG4gICAgICBAX2luc2VydCBydW5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZCBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaGFzOiAoIGkgKSAtPiBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmhhcyBpXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBJRk4sIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgUnVuLFxuICAgIFNjYXR0ZXIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
