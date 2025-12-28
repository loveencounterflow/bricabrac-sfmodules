(function() {
  'use strict';
  //===========================================================================================================
  this.require_intermission = function() {
    var IFN, Run, SFMODULES, Scatter, debug, exports, hide, internals, nameit, nfa, set_getter, templates, type_of;
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
        normalize: false
      },
      //.......................................................................................................
      scatter_add: {
        lo: null,
        hi: null
      }
    };
    Run = (function() {
      var ctor;

      //=========================================================================================================
      class Run {
        constructor() {
          return ctor.apply(this, arguments);
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
        if (lo instanceof Run) {
          ({lo, hi} = lo);
        }
        if (lo == null) {
          lo = hi != null ? hi : 0;
        }
        if (hi == null) {
          hi = lo;
        }
        this.lo = lo;
        this.hi = hi;
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
    Scatter = (function() {
      var ctor;

      //=========================================================================================================
      class Scatter {
        constructor() {
          return ctor.apply(this, arguments);
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
          run = new Run(...P);
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
        return void 0;
      });

      //-------------------------------------------------------------------------------------------------------
      set_getter(Scatter.prototype, 'is_normalized', function() {
        return this.state.is_normalized;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVIsRUFSOUI7O0lBV0UsU0FBQSxHQUVFLENBQUE7O01BQUEsT0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxFQUFBLEVBQVksSUFEWjtRQUVBLE9BQUEsRUFBWTtNQUZaLENBREY7O01BS0EsV0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFZLElBQVo7UUFDQSxJQUFBLEVBQVksS0FEWjtRQUVBLFNBQUEsRUFBWTtNQUZaLENBTkY7O01BVUEsV0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxF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LEdBQVI7VUFBYSxHQUFBLEVBQUssSUFBQyxDQUFBO1FBQW5CO01BQUgsQ0FBMUI7Ozs7a0JBL0VKOzs7SUE4SEUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLENBQWQ7QUFDWixXQUFPLE9BQUEsR0FBVSxDQUNmLEdBRGUsRUFFZixPQUZlLEVBR2YsU0FIZTtFQWpJSztBQU54QiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkByZXF1aXJlX2ludGVybWlzc2lvbiA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vbWFpbidcbiAgeyBuZmEsICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLnRzJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJ1bl9jZmc6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgICBzY2F0dGVyOiAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2NmZzpcbiAgICAgIGRhdGE6ICAgICAgIG51bGxcbiAgICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgICBub3JtYWxpemU6ICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9hZGQ6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFJ1blxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5ydW5fY2ZnLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIHsgbG8sXG4gICAgICAgIGhpLCB9ID0gbG8gaWYgbG8gaW5zdGFuY2VvZiBSdW5cbiAgICAgIGxvICAgICA/PSBoaSA/IDBcbiAgICAgIGhpICAgICA/PSBsb1xuICAgICAgQGxvICAgICA9IGxvXG4gICAgICBAaGkgICAgID0gaGlcbiAgICAgIGhpZGUgQCwgJ3NjYXR0ZXInLCBjZmcuc2NhdHRlciA/IG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdkYXRhJywgLT4gQHNjYXR0ZXIuZGF0YVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsIC0+IEBoaSAtIEBsbyArIDEgIyMjIFRBSU5UIGNvbnNpZGVyIHRvIG1ha2UgYFJ1bmBzIGltbXV0YWJsZSwgdGhlbiBzaXplIGlzIGEgY29uc3RhbnQgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICAgIEBmcm9tX2hhbGZvcGVuOiggaGFsZm9wZW4gKSAtPiBuZXcgQCB7IGxvOiBoYWxmb3Blbi5zdGFydCwgaGk6IGhhbGZvcGVuLmVuZCAtIDEsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaGFzOiAoIGkgKSAtPiBAbG8gPD0gaSA8PSBAaGlcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcbiAgICBjb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5zY2F0dGVyX2NmZywgfSwgKCBkYXRhLCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHZhbGlkYXRlICMjI1xuICAgICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICAgIEBkYXRhICAgPSBkYXRhXG4gICAgICBAcnVucyAgID0gW11cbiAgICAgIGhpZGUgQCwgJ2NmZycsICAgIE9iamVjdC5mcmVlemUgY2ZnICMgeyBub3JtYWxpemUsIH1cbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgIHsgaXNfbm9ybWFsaXplZDogdHJ1ZSwgfVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgICBAcnVucy5wdXNoIHJ1blxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc29ydDogLT5cbiAgICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICAgIHJldHVybiAgMFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYXI6IC0+XG4gICAgICBAcnVucy5sZW5ndGggPSBbXVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkOiAoIFAuLi4gKSAtPlxuICAgICAgcnVuICAgICAgICAgPSBuZXcgUnVuIFAuLi5cbiAgICAgIHJ1bi5zY2F0dGVyID0gQFxuICAgICAgQF9pbnNlcnQgcnVuXG4gICAgICBpZiBAY2ZnLm5vcm1hbGl6ZSB0aGVuIEBub3JtYWxpemUoKVxuICAgICAgZWxzZSBpZiBAY2ZnLnNvcnQgdGhlbiBAc29ydCgpXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaGFzOiAoIGkgKSAtPiBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmhhcyBpXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBJRk4sIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgUnVuLFxuICAgIFNjYXR0ZXIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
