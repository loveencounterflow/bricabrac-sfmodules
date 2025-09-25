(function() {
  'use strict';
  var BRICS, debug,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //===========================================================================================================
  ({debug} = console);

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_benchmarking: function() {
      var ANSI, Benchmarker, NFA, bigint_from_hrtime, exports, get_percentage_bar, get_progress, hrtime_as_bigint, nameit, nfa, timeit, timeit_tpl;
      // { get_setter,
      //   hide,                       } = ( require './various-brics' ).require_managed_property_tools()
      ({get_percentage_bar} = (require('./unstable-brics')).require_progress_indicators());
      ({nameit} = (require('./various-brics')).require_nameit());
      NFA = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments(); // get_signature,
      // Normalize_function_arguments,
      // Template,
      // internals,
      ({nfa} = NFA);
      //-------------------------------------------------------------------------------------------------------
      bigint_from_hrtime = function([s, ns]) {
        return (BigInt(s)) * 1_000_000_000n + (BigInt(ns));
      };
      hrtime_as_bigint = function() {
        return bigint_from_hrtime(process.hrtime());
      };
      ANSI = {
        cr: '\x1b[1G', // Carriage Return; move to first column (CHA n — Cursor Horizontal Absolut)
        el0: '\x1b[0K', // EL Erase in Line; 0: from cursor to end
        el1: '\x1b[1K', // EL Erase in Line; 1: from cursor to beginning
        el2: '\x1b[2K' // EL Erase in Line; 2: entire line
      };
      
      //-------------------------------------------------------------------------------------------------------
      get_progress = function({total, task_rpr} = {}) {
        var divisor, processed, progress;
        if (total == null) {
          return progress = function() {
            throw new Error("Ωbm___1 must call with option `total` in order to use progress bar");
          };
        }
        //.....................................................................................................
        processed = -1;
        divisor = Math.round(total / 100);
        //.....................................................................................................
        return progress = function({delta = 1} = {}) {
          var percentage, percentage_rpr;
          processed += delta;
          if ((modulo(processed, divisor)) !== 0) {
            return null;
          }
          percentage = Math.round(processed / total * 100);
          percentage_rpr = percentage.toString().padStart(3);
          process.stdout.write(`${task_rpr} ${get_percentage_bar(percentage)} ${ANSI.cr}`);
          return null;
        };
      };
      //-------------------------------------------------------------------------------------------------------
      timeit_tpl = {
        brand: 'unnamed',
        task: null
      };
      Benchmarker = (function() {
        //=======================================================================================================
        class Benchmarker {
          //-----------------------------------------------------------------------------------------------------
          constructor() {
            this.brands = {};
            //  locale: 'en-US', numberingSystem: 'latn', style: 'decimal', minimumIntegerDigits: 1, minimumFractionDigits: 0,
            // maximumFractionDigits: 3, useGrouping: 'auto', notation: 'standard', signDisplay: 'auto', roundingIncrement: 1,
            // roundingMode: 'halfExpand', roundingPriority: 'auto', trailingZeroDisplay: 'auto' }
            this.number_formatter = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3
            });
            // @tasks    = {}
            return void 0;
          }

          //-----------------------------------------------------------------------------------------------------
          format_dt(dt) {
            return (this.number_formatter.format(dt)).padStart(20, ' ');
          }

          //-----------------------------------------------------------------------------------------------------
          get_averages_by_brands() {
            var R, brand, dts, ref, target, task, tasks;
            R = {};
            ref = this.brands;
            for (brand in ref) {
              tasks = ref[brand];
              target = R[brand] = {};
              for (task in tasks) {
                dts = tasks[task];
                target[task] = (dts.reduce((function(a, b) {
                  return a + b;
                }), 0)) / dts.length;
              }
            }
            return R;
          }

          //-----------------------------------------------------------------------------------------------------
          get_averages_by_tasks() {
            var R, brand, dts, ref, target, task, tasks;
            R = {};
            ref = this.brands;
            for (brand in ref) {
              tasks = ref[brand];
              for (task in tasks) {
                dts = tasks[task];
                target = R[task] != null ? R[task] : R[task] = {};
                target[brand] = (dts.reduce((function(a, b) {
                  return a + b;
                }), 0)) / dts.length;
              }
            }
            return R;
          }

        };

        //-----------------------------------------------------------------------------------------------------
        Benchmarker.prototype.timeit = nfa({
          template: timeit_tpl
        }, function(brand, task, cfg, fn) {
          var base, dt, dt_rpr, dts_brand, dts_task, progress, result, t0, t1, task_rpr;
          cfg = {...{
              total: null
            }, ...cfg};
          task = task != null ? task : ((fn.name === '') ? '(anonymous)' : fn.name);
          task_rpr = (task + ':').padEnd(40, ' ');
          progress = get_progress({
            total: cfg.total,
            task_rpr
          });
          t0 = hrtime_as_bigint();
          //.....................................................................................................
          result = fn({progress});
          //.....................................................................................................
          t1 = hrtime_as_bigint();
          dt = (Number(t1 - t0)) / 1_000_000;
          dt_rpr = this.format_dt(dt);
          dts_brand = (base = this.brands)[brand] != null ? base[brand] : base[brand] = {};
          dts_task = dts_brand[task] != null ? dts_brand[task] : dts_brand[task] = [];
          dts_task.push(dt);
          //...................................................................................................
          if (cfg.handler != null) {
            cfg.handler({
              brand,
              task,
              dt,
              dt_rpr,
              total: cfg.total,
              brands: this.brands
            });
          } else {
            // tasks:    @tasks,
            console.log(`${ANSI.el2}${task_rpr} ${dt_rpr}`);
          }
          //...................................................................................................
          return result;
        });

        return Benchmarker;

      }).call(this);
      //=======================================================================================================
      timeit = function() {
        throw new Error("Ωbm___1 temporarily unavailable");
      };
      // do =>
      //   bm  = new Benchmarker()
      //   R   = ( P... ) -> bm.timeit P...
      //   nameit 'timeit', R
      //   R.bm = bm
      //   return R

      //.......................................................................................................
      return exports = {Benchmarker, bigint_from_hrtime, hrtime_as_bigint, timeit};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWJlbmNobWFyay1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7SUFBQSwyREFBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7O0VBTUEsS0FBQSxHQUlFLENBQUE7OztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBQ3hCLFVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLEVBQUEsa0JBQUEsRUFBQSxPQUFBLEVBQUEsa0JBQUEsRUFBQSxZQUFBLEVBQUEsZ0JBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBOzs7TUFFSSxDQUFBLENBQUUsa0JBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxrQkFBUixDQUFGLENBQThCLENBQUMsMkJBQS9CLENBQUEsQ0FBbEM7TUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQWxDO01BQ0EsR0FBQSxHQUFNLENBQUUsT0FBQSxDQUFRLCtDQUFSLENBQUYsQ0FBMkQsQ0FBQyxvQ0FBNUQsQ0FBQSxFQUpWOzs7O01BS0ksQ0FBQSxDQUlFLEdBSkYsQ0FBQSxHQUkwQixHQUoxQixFQUxKOztNQVdJLGtCQUFBLEdBQXNCLFFBQUEsQ0FBQyxDQUFFLENBQUYsRUFBSyxFQUFMLENBQUQsQ0FBQTtlQUFpQixDQUFFLE1BQUEsQ0FBTyxDQUFQLENBQUYsQ0FBQSxHQUFlLGNBQWYsR0FBZ0MsQ0FBRSxNQUFBLENBQU8sRUFBUCxDQUFGO01BQWpEO01BQ3RCLGdCQUFBLEdBQW9DLFFBQUEsQ0FBQSxDQUFBO2VBQUcsa0JBQUEsQ0FBbUIsT0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUFuQjtNQUFIO01B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QVFRLEVBQUEsR0FBc0IsZ0JBQUEsQ0FBQTtVQUN0QixFQUFBLEdBQXNCLENBQUUsTUFBQSxDQUFPLEVBQUEsR0FBSyxFQUFaLENBQUYsQ0FBQSxHQUFxQjtVQUMzQyxNQUFBLEdBQXNCLElBQUMsQ0FBQSxTQUFELENBQVcsRUFBWDtVQUN0QixTQUFBLDZDQUE2QixDQUFLLEtBQUwsUUFBQSxDQUFLLEtBQUwsSUFBZ0IsQ0FBQTtVQUM3QyxRQUFBLDZCQUFzQixTQUFTLENBQUcsSUFBSCxJQUFULFNBQVMsQ0FBRyxJQUFILElBQWM7VUFDN0MsUUFBUSxDQUFDLElBQVQsQ0FBYyxFQUFkLEVBYlI7O1VBZVEsSUFBRyxtQkFBSDtZQUNFLEdBQUcsQ0FBQyxPQUFKLENBQVk7Y0FDVixLQURVO2NBRVYsSUFGVTtjQUdWLEVBSFU7Y0FJVixNQUpVO2NBS1YsS0FBQSxFQUFVLEdBQUcsQ0FBQyxLQUxKO2NBTVYsTUFBQSxFQUFVLElBQUMsQ0FBQTtZQU5ELENBQVosRUFERjtXQUFBLE1BQUE7O1lBV0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFBLENBQUEsQ0FBRyxJQUFJLENBQUMsR0FBUixDQUFBLENBQUEsQ0FBYyxRQUFkLEVBQUEsQ0FBQSxDQUEwQixNQUExQixDQUFBLENBQVosRUFYRjtXQWZSOztBQTRCUSxpQkFBTztRQTdCOEIsQ0FBL0I7Ozs7b0JBbkRkOztNQXdHSSxNQUFBLEdBQVMsUUFBQSxDQUFBLENBQUE7UUFBRyxNQUFNLElBQUksS0FBSixDQUFVLGlDQUFWO01BQVQsRUF4R2I7Ozs7Ozs7OztBQWlISSxhQUFPLE9BQUEsR0FBVSxDQUFFLFdBQUYsRUFBZSxrQkFBZixFQUFtQyxnQkFBbkMsRUFBcUQsTUFBckQ7SUFsSEc7RUFBdEIsRUFWRjs7O0VBK0hBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBL0hBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2JlbmNobWFya2luZzogLT5cbiAgICAjIHsgZ2V0X3NldHRlcixcbiAgICAjICAgaGlkZSwgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIHsgZ2V0X3BlcmNlbnRhZ2VfYmFyLCAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtYnJpY3MnICkucmVxdWlyZV9wcm9ncmVzc19pbmRpY2F0b3JzKClcbiAgICB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICAgIE5GQSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gICAgeyAjIGdldF9zaWduYXR1cmUsXG4gICAgICAjIE5vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMsXG4gICAgICAjIFRlbXBsYXRlLFxuICAgICAgIyBpbnRlcm5hbHMsXG4gICAgICBuZmEsICAgICAgICAgICAgICAgIH0gPSBORkFcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJpZ2ludF9mcm9tX2hydGltZSAgPSAoWyBzLCBucywgXSkgIC0+ICggQmlnSW50IHMgKSAqIDFfMDAwXzAwMF8wMDBuICsgKCBCaWdJbnQgbnMgKVxuICAgIGhydGltZV9hc19iaWdpbnQgICAgPSAgICAgICAgICAgICAgIC0+IGJpZ2ludF9mcm9tX2hydGltZSBwcm9jZXNzLmhydGltZSgpXG4gICAgQU5TSSAgICAgICAgICAgICAgICA9XG4gICAgICBjcjogICAnXFx4MWJbMUcnICAgICAgICMgQ2FycmlhZ2UgUmV0dXJuOyBtb3ZlIHRvIGZpcnN0IGNvbHVtbiAoQ0hBIG4g4oCUIEN1cnNvciBIb3Jpem9udGFsIEFic29sdXQpXG4gICAgICBlbDA6ICAnXFx4MWJbMEsnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMDogZnJvbSBjdXJzb3IgdG8gZW5kXG4gICAgICBlbDE6ICAnXFx4MWJbMUsnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMTogZnJvbSBjdXJzb3IgdG8gYmVnaW5uaW5nXG4gICAgICBlbDI6ICAnXFx4MWJbMksnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMjogZW50aXJlIGxpbmVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X3Byb2dyZXNzID0gKHsgdG90YWwsIHRhc2tfcnByLCB9PXt9KSAtPlxuICAgICAgdW5sZXNzIHRvdGFsP1xuICAgICAgICByZXR1cm4gcHJvZ3Jlc3MgPSAtPiB0aHJvdyBuZXcgRXJyb3IgXCLOqWJtX19fMSBtdXN0IGNhbGwgd2l0aCBvcHRpb24gYHRvdGFsYCBpbiBvcmRlciB0byB1c2UgcHJvZ3Jlc3MgYmFyXCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcHJvY2Vzc2VkID0gLTFcbiAgICAgIGRpdmlzb3IgICA9IE1hdGgucm91bmQgdG90YWwgLyAxMDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIHByb2dyZXNzID0gKHsgZGVsdGEgPSAxLCB9PXt9KSAtPlxuICAgICAgICBwcm9jZXNzZWQgICAgICArPSBkZWx0YTsgcmV0dXJuIG51bGwgdW5sZXNzICggcHJvY2Vzc2VkICUlIGRpdmlzb3IgKSBpcyAwXG4gICAgICAgIHBlcmNlbnRhZ2UgICAgICA9IE1hdGgucm91bmQgcHJvY2Vzc2VkIC8gdG90YWwgKiAxMDBcbiAgICAgICAgcGVyY2VudGFnZV9ycHIgID0gcGVyY2VudGFnZS50b1N0cmluZygpLnBhZFN0YXJ0IDNcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUgXCIje3Rhc2tfcnByfSAje2dldF9wZXJjZW50YWdlX2JhciBwZXJjZW50YWdlfSAje0FOU0kuY3J9XCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGltZWl0X3RwbCA9IHsgYnJhbmQ6ICd1bm5hbWVkJywgdGFzazogbnVsbCwgfVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBCZW5jaG1hcmtlclxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAYnJhbmRzICAgICAgICAgICA9IHt9XG4gICAgICAgICMgIGxvY2FsZTogJ2VuLVVTJywgbnVtYmVyaW5nU3lzdGVtOiAnbGF0bicsIHN0eWxlOiAnZGVjaW1hbCcsIG1pbmltdW1JbnRlZ2VyRGlnaXRzOiAxLCBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsXG4gICAgICAgICMgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAzLCB1c2VHcm91cGluZzogJ2F1dG8nLCBub3RhdGlvbjogJ3N0YW5kYXJkJywgc2lnbkRpc3BsYXk6ICdhdXRvJywgcm91bmRpbmdJbmNyZW1lbnQ6IDEsXG4gICAgICAgICMgcm91bmRpbmdNb2RlOiAnaGFsZkV4cGFuZCcsIHJvdW5kaW5nUHJpb3JpdHk6ICdhdXRvJywgdHJhaWxpbmdaZXJvRGlzcGxheTogJ2F1dG8nIH1cbiAgICAgICAgQG51bWJlcl9mb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQgJ2VuLVVTJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDMsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMywgfVxuICAgICAgICAjIEB0YXNrcyAgICA9IHt9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0aW1laXQ6IG5mYSB7IHRlbXBsYXRlOiB0aW1laXRfdHBsLCB9LCAoIGJyYW5kLCB0YXNrLCBjZmcsIGZuICkgLT5cbiAgICAgICAgY2ZnICAgICAgICAgICAgICAgICA9IHsgeyB0b3RhbDogbnVsbCwgfS4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHRhc2sgICAgICAgICAgICAgICAgPSB0YXNrID8gKCBpZiAoIGZuLm5hbWUgaXMgJycgKSB0aGVuICcoYW5vbnltb3VzKScgZWxzZSBmbi5uYW1lIClcbiAgICAgICAgdGFza19ycHIgICAgICAgICAgICA9ICggdGFzayArICc6JyApLnBhZEVuZCA0MCwgJyAnXG4gICAgICAgIHByb2dyZXNzICAgICAgICAgICAgPSBnZXRfcHJvZ3Jlc3MgeyB0b3RhbDogY2ZnLnRvdGFsLCB0YXNrX3JwciwgfVxuICAgICAgICB0MCAgICAgICAgICAgICAgICAgID0gaHJ0aW1lX2FzX2JpZ2ludCgpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXN1bHQgICAgICAgICAgICAgID0gZm4geyBwcm9ncmVzcywgfVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdDEgICAgICAgICAgICAgICAgICA9IGhydGltZV9hc19iaWdpbnQoKVxuICAgICAgICBkdCAgICAgICAgICAgICAgICAgID0gKCBOdW1iZXIgdDEgLSB0MCApIC8gMV8wMDBfMDAwXG4gICAgICAgIGR0X3JwciAgICAgICAgICAgICAgPSBAZm9ybWF0X2R0IGR0XG4gICAgICAgIGR0c19icmFuZCAgICAgICAgICAgPSBAYnJhbmRzWyAgICBicmFuZCBdID89IHt9XG4gICAgICAgIGR0c190YXNrICAgICAgICAgICAgPSBkdHNfYnJhbmRbICB0YXNrICBdID89IFtdXG4gICAgICAgIGR0c190YXNrLnB1c2ggZHRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiBjZmcuaGFuZGxlcj9cbiAgICAgICAgICBjZmcuaGFuZGxlciB7XG4gICAgICAgICAgICBicmFuZCxcbiAgICAgICAgICAgIHRhc2ssXG4gICAgICAgICAgICBkdCxcbiAgICAgICAgICAgIGR0X3JwcixcbiAgICAgICAgICAgIHRvdGFsOiAgICBjZmcudG90YWwsXG4gICAgICAgICAgICBicmFuZHM6ICAgQGJyYW5kcyxcbiAgICAgICAgICAgICMgdGFza3M6ICAgIEB0YXNrcyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiI3tBTlNJLmVsMn0je3Rhc2tfcnByfSAje2R0X3Jwcn1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiByZXN1bHRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBmb3JtYXRfZHQ6ICggZHQgKSAtPiAoIEBudW1iZXJfZm9ybWF0dGVyLmZvcm1hdCBkdCApLnBhZFN0YXJ0IDIwLCAnICdcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBnZXRfYXZlcmFnZXNfYnlfYnJhbmRzOiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIGJyYW5kLCB0YXNrcyBvZiBAYnJhbmRzXG4gICAgICAgICAgdGFyZ2V0ID0gUlsgYnJhbmQgXSA9IHt9XG4gICAgICAgICAgZm9yIHRhc2ssIGR0cyBvZiB0YXNrc1xuICAgICAgICAgICAgdGFyZ2V0WyB0YXNrIF0gPSAoIGR0cy5yZWR1Y2UgKCAoIGEsIGIgKSAtPiBhICsgYiApLCAwICkgLyBkdHMubGVuZ3RoXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZ2V0X2F2ZXJhZ2VzX2J5X3Rhc2tzOiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIGJyYW5kLCB0YXNrcyBvZiBAYnJhbmRzXG4gICAgICAgICAgZm9yIHRhc2ssIGR0cyBvZiB0YXNrc1xuICAgICAgICAgICAgdGFyZ2V0ICAgICAgICAgID0gUlsgdGFzayBdID89IHt9XG4gICAgICAgICAgICB0YXJnZXRbIGJyYW5kIF0gPSAoIGR0cy5yZWR1Y2UgKCAoIGEsIGIgKSAtPiBhICsgYiApLCAwICkgLyBkdHMubGVuZ3RoXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRpbWVpdCA9IC0+IHRocm93IG5ldyBFcnJvciBcIs6pYm1fX18xIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlXCJcbiAgICAjIGRvID0+XG4gICAgIyAgIGJtICA9IG5ldyBCZW5jaG1hcmtlcigpXG4gICAgIyAgIFIgICA9ICggUC4uLiApIC0+IGJtLnRpbWVpdCBQLi4uXG4gICAgIyAgIG5hbWVpdCAndGltZWl0JywgUlxuICAgICMgICBSLmJtID0gYm1cbiAgICAjICAgcmV0dXJuIFJcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IEJlbmNobWFya2VyLCBiaWdpbnRfZnJvbV9ocnRpbWUsIGhydGltZV9hc19iaWdpbnQsIHRpbWVpdCwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
