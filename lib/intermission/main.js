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

      return Scatter;

    }).call(this);
    
    //=========================================================================================================
    internals = Object.freeze({IFN});
    return exports = {Run, Scatter, internals};
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjtJQUM1QixDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0NBQW5CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCO0lBRUEsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVIsRUFSOUI7O0lBV0UsU0FBQSxHQUVFLENBQUE7O01BQUEsT0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxFQUFBLEVBQVksSUFEWjtRQUVBLE9BQUEsRUFBWTtNQUZaLENBREY7O01BS0EsV0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFZLElBQVo7UUFDQSxJQUFBLEVBQVksS0FEWjtRQUVBLFNBQUEsRUFBWTtNQUZaLENBTkY7O01BVUEsV0FBQSxFQUNFO1FBQUEsRUFBQSxFQUFZLElBQVo7UUFDQSxF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LFVBQUEsQ0FBVyxPQUFDLENBQUEsU0FBWixFQUFnQixlQUFoQixFQUFpQyxRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFLLENBQUM7TUFBVixDQUFqQzs7OztrQkFoRUo7OztJQStHRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsQ0FBZDtBQUNaLFdBQU8sT0FBQSxHQUFVLENBQ2YsR0FEZSxFQUVmLE9BRmUsRUFHZixTQUhlO0VBbEhLO0FBTnhCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQHJlcXVpcmVfaW50ZXJtaXNzaW9uID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi9tYWluJ1xuICB7IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICBJRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIudHMnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB0ZW1wbGF0ZXMgPVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcnVuX2NmZzpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcbiAgICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfY2ZnOlxuICAgICAgZGF0YTogICAgICAgbnVsbFxuICAgICAgc29ydDogICAgICAgZmFsc2VcbiAgICAgIG5vcm1hbGl6ZTogIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2FkZDpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUnVuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLnJ1bl9jZmcsIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgeyBsbyxcbiAgICAgICAgaGksIH0gPSBsbyBpZiBsbyBpbnN0YW5jZW9mIFJ1blxuICAgICAgbG8gICAgID89IGhpID8gMFxuICAgICAgaGkgICAgID89IGxvXG4gICAgICBAbG8gICAgID0gbG9cbiAgICAgIEBoaSAgICAgPSBoaVxuICAgICAgaGlkZSBALCAnc2NhdHRlcicsIGNmZy5zY2F0dGVyID8gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2RhdGEnLCAtPiBAc2NhdHRlci5kYXRhXG4gICAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXNfaGFsZm9wZW46ICAgICAgICAgICAgICAgIC0+IHsgc3RhcnQ6IEBsbywgZW5kOiBAaGkgKyAxLCB9XG4gICAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBoYXM6ICggaSApIC0+IEBsbyA8PSBpIDw9IEBoaVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2NhdHRlclxuICAgIGNvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLnNjYXR0ZXJfY2ZnLCB9LCAoIGRhdGEsIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGZyZWV6ZSBkYXRhICMjI1xuICAgICAgQGRhdGEgICA9IGRhdGFcbiAgICAgIEBydW5zICAgPSBbXVxuICAgICAgaGlkZSBALCAnY2ZnJywgICAgT2JqZWN0LmZyZWV6ZSBjZmcgIyB7IG5vcm1hbGl6ZSwgfVxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAgIEBydW5zLnB1c2ggcnVuXG4gICAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IGZhbHNlXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzb3J0OiAtPlxuICAgICAgQHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYS5sbyA+IGIubG9cbiAgICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgICByZXR1cm4gLTEgaWYgYS5oaSA8IGIuaGlcbiAgICAgICAgcmV0dXJuICAwXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhcjogLT5cbiAgICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGQ6ICggUC4uLiApIC0+XG4gICAgICBydW4gICAgICAgICA9IG5ldyBSdW4gUC4uLlxuICAgICAgcnVuLnNjYXR0ZXIgPSBAXG4gICAgICBAX2luc2VydCBydW5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZTogLT5cbiAgICAgIEBzb3J0KClcbiAgICAgIGhhbGZvcGVucyA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gQHJ1bnMgKVxuICAgICAgQGNsZWFyKClcbiAgICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSB0cnVlXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBoYXM6ICggaSApIC0+IEBydW5zLnNvbWUgKCBydW4gKSAtPiBydW4uaGFzIGlcbiAgXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IElGTiwgfVxuICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICBSdW4sXG4gICAgU2NhdHRlcixcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
