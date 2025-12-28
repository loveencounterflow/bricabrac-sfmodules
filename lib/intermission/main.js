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
      set_getter(Run, 'data', function() {
        return this.scatter.data;
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
        return void 0;
      });

      return Scatter;

    }).call(this);
    
    //=========================================================================================================
    internals = Object.freeze({IFN});
    return exports = {Run, Scatter, internals};
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVIsRUFSOUI7O0lBV0UsU0FBQSxHQUVFLENBQUE7O01BQUEsT0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxFQUFBLEVBQVksSUFEWjtRQUVBLE9BQUEsRUFBWTtNQUZaLENBREY7O01BS0EsV0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFZLElBQVo7UUFDQSxJQUFBLEVBQVksS0FEWjtRQUVBLFNBQUEsRUFBWTtNQUZaLENBTkY7O01BVUEsV0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxF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QUFELENBQUE7VUFDQSxTQUFBLEdBQVksR0FBRyxDQUFDLFFBQUo7O0FBQWU7QUFBQTtZQUFBLEtBQUEscUNBQUE7OzJCQUFBLEdBQUcsQ0FBQyxXQUFKLENBQUE7WUFBQSxDQUFBOzt1QkFBZjtVQUNaLElBQUMsQ0FBQSxLQUFELENBQUE7VUFDQSxLQUFBLDJDQUFBOztZQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLEdBQUcsQ0FBQyxhQUFKLENBQWtCLFFBQWxCLENBQVg7VUFBQTtBQUNBLGlCQUFPO1FBTEUsQ0F4Q2Y7OztRQWdESSxHQUFLLENBQUUsQ0FBRixDQUFBO2lCQUFTLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLFFBQUEsQ0FBRSxHQUFGLENBQUE7bUJBQVcsR0FBRyxDQUFDLEdBQUosQ0FBUSxDQUFSO1VBQVgsQ0FBWDtRQUFUOztNQWpEUDs7YUFDZSxHQUFBLENBQUk7UUFBRSxRQUFBLEVBQVUsU0FBUyxDQUFDO01BQXRCLENBQUosRUFBMEMsUUFBQSxDQUFFLElBQUYsRUFBUSxHQUFSLENBQUEsRUFBQTs7O1FBR3JELElBQUMsQ0FBQSxJQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBQ1YsSUFBQSxDQUFLLElBQUwsRUFBUSxLQUFSLEVBQWUsTUFBTSxDQUFDLE1BQVAsQ0FBYyxHQUFkLENBQWYsRUFKTjtlQUtPO01BTm9ELENBQTFDOzs7O2tCQXJEakI7OztJQXdHRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsQ0FBZDtBQUNaLFdBQU8sT0FBQSxHQUFVLENBQ2YsR0FEZSxFQUVmLE9BRmUsRUFHZixTQUhlO0VBM0dLO0FBTnhCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQHJlcXVpcmVfaW50ZXJtaXNzaW9uID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi9tYWluJ1xuICB7IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBJRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIudHMnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB0ZW1wbGF0ZXMgPVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcnVuX2NmZzpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcbiAgICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfY2ZnOlxuICAgICAgZGF0YTogICAgICAgbnVsbFxuICAgICAgc29ydDogICAgICAgZmFsc2VcbiAgICAgIG5vcm1hbGl6ZTogIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2FkZDpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUnVuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLnJ1bl9jZmcsIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgeyBsbyxcbiAgICAgICAgaGksIH0gPSBsbyBpZiBsbyBpbnN0YW5jZW9mIFJ1blxuICAgICAgbG8gICAgID89IGhpID8gMFxuICAgICAgaGkgICAgID89IGxvXG4gICAgICBAbG8gICAgID0gbG9cbiAgICAgIEBoaSAgICAgPSBoaVxuICAgICAgaGlkZSBALCAnc2NhdHRlcicsIGNmZy5zY2F0dGVyID8gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEAsICdkYXRhJywgLT4gQHNjYXR0ZXIuZGF0YVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGhhczogKCBpICkgLT4gQGxvIDw9IGkgPD0gQGhpXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTY2F0dGVyXG4gICAgY29uc3RydWN0b3I6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcsIH0sICggZGF0YSwgY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB2YWxpZGF0ZSAjIyNcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgZnJlZXplIGRhdGEgIyMjXG4gICAgICBAZGF0YSAgID0gZGF0YVxuICAgICAgQHJ1bnMgICA9IFtdXG4gICAgICBoaWRlIEAsICdjZmcnLCBPYmplY3QuZnJlZXplIGNmZyAjIHsgbm9ybWFsaXplLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAgIEBydW5zLnB1c2ggcnVuXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzb3J0OiAtPlxuICAgICAgQHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYS5sbyA+IGIubG9cbiAgICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgICByZXR1cm4gLTEgaWYgYS5oaSA8IGIuaGlcbiAgICAgICAgcmV0dXJuICAwXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhcjogLT5cbiAgICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGQ6ICggUC4uLiApIC0+XG4gICAgICBydW4gICAgICAgICA9IG5ldyBSdW4gUC4uLlxuICAgICAgcnVuLnNjYXR0ZXIgPSBAXG4gICAgICBAX2luc2VydCBydW5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZTogLT5cbiAgICAgIEBzb3J0KClcbiAgICAgIGhhbGZvcGVucyA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gQHJ1bnMgKVxuICAgICAgQGNsZWFyKClcbiAgICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaGFzOiAoIGkgKSAtPiBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmhhcyBpXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBJRk4sIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgUnVuLFxuICAgIFNjYXR0ZXIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
