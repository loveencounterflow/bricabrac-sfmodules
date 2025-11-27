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
      get_progress = function({total, task_rpr, stats} = {}) {
        var divisor, processed, progress;
        /* TAINT integrate into `Benchmarker` */
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
          if (stats != null) {
            stats.processed = processed;
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
          var base, dt, dt_rpr, dts_brand, dts_task, progress, result, stats, t0, t1, task_rpr;
          cfg = {...{
              total: null
            }, ...cfg};
          task = task != null ? task : ((fn.name === '') ? '(anonymous)' : fn.name);
          task_rpr = (task + ':').padEnd(40, ' ');
          stats = {
            processed: 0
          };
          progress = get_progress({
            total: cfg.total,
            task_rpr,
            stats
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
            console.log(`${ANSI.el2}${task_rpr} dt:   ${dt_rpr} ms`);
            console.log(`${ANSI.el2}${task_rpr} n:    ${this.format_dt(stats.processed)}`);
            console.log(`${ANSI.el2}${task_rpr} ???:  ${this.format_dt(1000 * dt / stats.processed)} ms/1k`);
            console.log(`${ANSI.el2}${task_rpr} f:    ${this.format_dt(1000 * stats.processed / dt)} Hz`);
          }
          // console.log { stats, } # "#{ANSI.el2}#{task_rpr} #{dt_rpr} ms"
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWJlbmNobWFyay1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7SUFBQSwyREFBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7O0VBTUEsS0FBQSxHQUlFLENBQUE7OztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBQ3hCLFVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLEVBQUEsa0JBQUEsRUFBQSxPQUFBLEVBQUEsa0JBQUEsRUFBQSxZQUFBLEVBQUEsZ0JBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBOzs7TUFFSSxDQUFBLENBQUUsa0JBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxrQkFBUixDQUFGLENBQThCLENBQUMsMkJBQS9CLENBQUEsQ0FBbEM7TUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQWxDO01BQ0EsR0FBQSxHQUFNLENBQUUsT0FBQSxDQUFRLCtDQUFSLENBQUYsQ0FBMkQsQ0FBQyxvQ0FBNUQsQ0FBQSxFQUpWOzs7O01BS0ksQ0FBQSxDQUlFLEdBSkYsQ0FBQSxHQUkwQixHQUoxQixFQUxKOztNQVdJLGtCQUFBLEdBQXNCLFFBQUEsQ0FBQyxDQUFFLENBQUYsRUFBSyxFQUFMLENBQUQsQ0FBQTtlQUFpQixDQUFFLE1BQUEsQ0FBTyxDQUFQLENBQUYsQ0FBQSxHQUFlLGNBQWYsR0FBZ0MsQ0FBRSxNQUFBLENBQU8sRUFBUCxDQUFGO01BQWpEO01BQ3RCLGdCQUFBLEdBQW9DLFFBQUEsQ0FBQSxDQUFBO2VBQUcsa0JBQUEsQ0FBbUIsT0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUFuQjtNQUFIO01B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QUFBLENBQWlDLElBQUMsQ0FBQSxTQUFELENBQWEsSUFBQSxHQUFPLEVBQVAsR0FBeUIsS0FBSyxDQUFDLFNBQTVDLENBQWpDLENBQUEsTUFBQSxDQUFaO1lBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFBLENBQUEsQ0FBRyxJQUFJLENBQUMsR0FBUixDQUFBLENBQUEsQ0FBYyxRQUFkLENBQUEsT0FBQSxDQUFBLENBQWlDLElBQUMsQ0FBQSxTQUFELENBQWEsSUFBQSxHQUFPLEtBQUssQ0FBQyxTQUFiLEdBQXlCLEVBQXRDLENBQWpDLENBQUEsR0FBQSxDQUFaLEVBZEY7V0FoQlI7OztBQWlDUSxpQkFBTztRQWxDOEIsQ0FBL0I7Ozs7b0JBckRkOztNQStHSSxNQUFBLEdBQVMsUUFBQSxDQUFBLENBQUE7UUFBRyxNQUFNLElBQUksS0FBSixDQUFVLGlDQUFWO01BQVQsRUEvR2I7Ozs7Ozs7OztBQXdISSxhQUFPLE9BQUEsR0FBVSxDQUFFLFdBQUYsRUFBZSxrQkFBZixFQUFtQyxnQkFBbkMsRUFBcUQsTUFBckQ7SUF6SEc7RUFBdEIsRUFWRjs7O0VBc0lBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBdElBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2JlbmNobWFya2luZzogLT5cbiAgICAjIHsgZ2V0X3NldHRlcixcbiAgICAjICAgaGlkZSwgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIHsgZ2V0X3BlcmNlbnRhZ2VfYmFyLCAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtYnJpY3MnICkucmVxdWlyZV9wcm9ncmVzc19pbmRpY2F0b3JzKClcbiAgICB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICAgIE5GQSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gICAgeyAjIGdldF9zaWduYXR1cmUsXG4gICAgICAjIE5vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMsXG4gICAgICAjIFRlbXBsYXRlLFxuICAgICAgIyBpbnRlcm5hbHMsXG4gICAgICBuZmEsICAgICAgICAgICAgICAgIH0gPSBORkFcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJpZ2ludF9mcm9tX2hydGltZSAgPSAoWyBzLCBucywgXSkgIC0+ICggQmlnSW50IHMgKSAqIDFfMDAwXzAwMF8wMDBuICsgKCBCaWdJbnQgbnMgKVxuICAgIGhydGltZV9hc19iaWdpbnQgICAgPSAgICAgICAgICAgICAgIC0+IGJpZ2ludF9mcm9tX2hydGltZSBwcm9jZXNzLmhydGltZSgpXG4gICAgQU5TSSAgICAgICAgICAgICAgICA9XG4gICAgICBjcjogICAnXFx4MWJbMUcnICAgICAgICMgQ2FycmlhZ2UgUmV0dXJuOyBtb3ZlIHRvIGZpcnN0IGNvbHVtbiAoQ0hBIG4g4oCUIEN1cnNvciBIb3Jpem9udGFsIEFic29sdXQpXG4gICAgICBlbDA6ICAnXFx4MWJbMEsnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMDogZnJvbSBjdXJzb3IgdG8gZW5kXG4gICAgICBlbDE6ICAnXFx4MWJbMUsnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMTogZnJvbSBjdXJzb3IgdG8gYmVnaW5uaW5nXG4gICAgICBlbDI6ICAnXFx4MWJbMksnICAgICAgICMgRUwgRXJhc2UgaW4gTGluZTsgMjogZW50aXJlIGxpbmVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X3Byb2dyZXNzID0gKHsgdG90YWwsIHRhc2tfcnByLCBzdGF0cywgfT17fSkgLT5cbiAgICAgICMjIyBUQUlOVCBpbnRlZ3JhdGUgaW50byBgQmVuY2htYXJrZXJgICMjI1xuICAgICAgdW5sZXNzIHRvdGFsP1xuICAgICAgICByZXR1cm4gcHJvZ3Jlc3MgPSAtPiB0aHJvdyBuZXcgRXJyb3IgXCLOqWJtX19fMSBtdXN0IGNhbGwgd2l0aCBvcHRpb24gYHRvdGFsYCBpbiBvcmRlciB0byB1c2UgcHJvZ3Jlc3MgYmFyXCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcHJvY2Vzc2VkID0gLTFcbiAgICAgIGRpdmlzb3IgICA9IE1hdGgucm91bmQgdG90YWwgLyAxMDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIHByb2dyZXNzID0gKHsgZGVsdGEgPSAxLCB9PXt9KSAtPlxuICAgICAgICBwcm9jZXNzZWQgICAgICAgICs9IGRlbHRhOyByZXR1cm4gbnVsbCB1bmxlc3MgKCBwcm9jZXNzZWQgJSUgZGl2aXNvciApIGlzIDBcbiAgICAgICAgc3RhdHM/LnByb2Nlc3NlZCAgPSBwcm9jZXNzZWRcbiAgICAgICAgcGVyY2VudGFnZSAgICAgICAgPSBNYXRoLnJvdW5kIHByb2Nlc3NlZCAvIHRvdGFsICogMTAwXG4gICAgICAgIHBlcmNlbnRhZ2VfcnByICAgID0gcGVyY2VudGFnZS50b1N0cmluZygpLnBhZFN0YXJ0IDNcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUgXCIje3Rhc2tfcnByfSAje2dldF9wZXJjZW50YWdlX2JhciBwZXJjZW50YWdlfSAje0FOU0kuY3J9XCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGltZWl0X3RwbCA9IHsgYnJhbmQ6ICd1bm5hbWVkJywgdGFzazogbnVsbCwgfVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBCZW5jaG1hcmtlclxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAYnJhbmRzICAgICAgICAgICA9IHt9XG4gICAgICAgICMgIGxvY2FsZTogJ2VuLVVTJywgbnVtYmVyaW5nU3lzdGVtOiAnbGF0bicsIHN0eWxlOiAnZGVjaW1hbCcsIG1pbmltdW1JbnRlZ2VyRGlnaXRzOiAxLCBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDAsXG4gICAgICAgICMgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAzLCB1c2VHcm91cGluZzogJ2F1dG8nLCBub3RhdGlvbjogJ3N0YW5kYXJkJywgc2lnbkRpc3BsYXk6ICdhdXRvJywgcm91bmRpbmdJbmNyZW1lbnQ6IDEsXG4gICAgICAgICMgcm91bmRpbmdNb2RlOiAnaGFsZkV4cGFuZCcsIHJvdW5kaW5nUHJpb3JpdHk6ICdhdXRvJywgdHJhaWxpbmdaZXJvRGlzcGxheTogJ2F1dG8nIH1cbiAgICAgICAgQG51bWJlcl9mb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQgJ2VuLVVTJywgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDMsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMywgfVxuICAgICAgICAjIEB0YXNrcyAgICA9IHt9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0aW1laXQ6IG5mYSB7IHRlbXBsYXRlOiB0aW1laXRfdHBsLCB9LCAoIGJyYW5kLCB0YXNrLCBjZmcsIGZuICkgLT5cbiAgICAgICAgY2ZnICAgICAgICAgICAgICAgICA9IHsgeyB0b3RhbDogbnVsbCwgfS4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHRhc2sgICAgICAgICAgICAgICAgPSB0YXNrID8gKCBpZiAoIGZuLm5hbWUgaXMgJycgKSB0aGVuICcoYW5vbnltb3VzKScgZWxzZSBmbi5uYW1lIClcbiAgICAgICAgdGFza19ycHIgICAgICAgICAgICA9ICggdGFzayArICc6JyApLnBhZEVuZCA0MCwgJyAnXG4gICAgICAgIHN0YXRzICAgICAgICAgICAgICAgPSB7IHByb2Nlc3NlZDogMCwgfVxuICAgICAgICBwcm9ncmVzcyAgICAgICAgICAgID0gZ2V0X3Byb2dyZXNzIHsgdG90YWw6IGNmZy50b3RhbCwgdGFza19ycHIsIHN0YXRzLCB9XG4gICAgICAgIHQwICAgICAgICAgICAgICAgICAgPSBocnRpbWVfYXNfYmlnaW50KClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJlc3VsdCAgICAgICAgICAgICAgPSBmbiB7IHByb2dyZXNzLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB0MSAgICAgICAgICAgICAgICAgID0gaHJ0aW1lX2FzX2JpZ2ludCgpXG4gICAgICAgIGR0ICAgICAgICAgICAgICAgICAgPSAoIE51bWJlciB0MSAtIHQwICkgLyAxXzAwMF8wMDBcbiAgICAgICAgZHRfcnByICAgICAgICAgICAgICA9IEBmb3JtYXRfZHQgZHRcbiAgICAgICAgZHRzX2JyYW5kICAgICAgICAgICA9IEBicmFuZHNbICAgIGJyYW5kIF0gPz0ge31cbiAgICAgICAgZHRzX3Rhc2sgICAgICAgICAgICA9IGR0c19icmFuZFsgIHRhc2sgIF0gPz0gW11cbiAgICAgICAgZHRzX3Rhc2sucHVzaCBkdFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGNmZy5oYW5kbGVyP1xuICAgICAgICAgIGNmZy5oYW5kbGVyIHtcbiAgICAgICAgICAgIGJyYW5kLFxuICAgICAgICAgICAgdGFzayxcbiAgICAgICAgICAgIGR0LFxuICAgICAgICAgICAgZHRfcnByLFxuICAgICAgICAgICAgdG90YWw6ICAgIGNmZy50b3RhbCxcbiAgICAgICAgICAgIGJyYW5kczogICBAYnJhbmRzLFxuICAgICAgICAgICAgIyB0YXNrczogICAgQHRhc2tzLFxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIje0FOU0kuZWwyfSN7dGFza19ycHJ9IGR0OiAgICN7ZHRfcnByfSBtc1wiXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIje0FOU0kuZWwyfSN7dGFza19ycHJ9IG46ICAgICN7IEBmb3JtYXRfZHQgc3RhdHMucHJvY2Vzc2VkfVwiXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIje0FOU0kuZWwyfSN7dGFza19ycHJ9ID8/PzogICN7IEBmb3JtYXRfZHQgKCAxMDAwICogZHQgICAgICAgICAgICAgIC8gc3RhdHMucHJvY2Vzc2VkICkgfSBtcy8xa1wiXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIje0FOU0kuZWwyfSN7dGFza19ycHJ9IGY6ICAgICN7IEBmb3JtYXRfZHQgKCAxMDAwICogc3RhdHMucHJvY2Vzc2VkIC8gZHQgICAgICAgICAgICAgICkgfSBIelwiXG4gICAgICAgICAgIyBjb25zb2xlLmxvZyB7IHN0YXRzLCB9ICMgXCIje0FOU0kuZWwyfSN7dGFza19ycHJ9ICN7ZHRfcnByfSBtc1wiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGZvcm1hdF9kdDogKCBkdCApIC0+ICggQG51bWJlcl9mb3JtYXR0ZXIuZm9ybWF0IGR0ICkucGFkU3RhcnQgMjAsICcgJ1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldF9hdmVyYWdlc19ieV9icmFuZHM6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgYnJhbmQsIHRhc2tzIG9mIEBicmFuZHNcbiAgICAgICAgICB0YXJnZXQgPSBSWyBicmFuZCBdID0ge31cbiAgICAgICAgICBmb3IgdGFzaywgZHRzIG9mIHRhc2tzXG4gICAgICAgICAgICB0YXJnZXRbIHRhc2sgXSA9ICggZHRzLnJlZHVjZSAoICggYSwgYiApIC0+IGEgKyBiICksIDAgKSAvIGR0cy5sZW5ndGhcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBnZXRfYXZlcmFnZXNfYnlfdGFza3M6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgYnJhbmQsIHRhc2tzIG9mIEBicmFuZHNcbiAgICAgICAgICBmb3IgdGFzaywgZHRzIG9mIHRhc2tzXG4gICAgICAgICAgICB0YXJnZXQgICAgICAgICAgPSBSWyB0YXNrIF0gPz0ge31cbiAgICAgICAgICAgIHRhcmdldFsgYnJhbmQgXSA9ICggZHRzLnJlZHVjZSAoICggYSwgYiApIC0+IGEgKyBiICksIDAgKSAvIGR0cy5sZW5ndGhcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgdGltZWl0ID0gLT4gdGhyb3cgbmV3IEVycm9yIFwizqlibV9fXzEgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGVcIlxuICAgICMgZG8gPT5cbiAgICAjICAgYm0gID0gbmV3IEJlbmNobWFya2VyKClcbiAgICAjICAgUiAgID0gKCBQLi4uICkgLT4gYm0udGltZWl0IFAuLi5cbiAgICAjICAgbmFtZWl0ICd0aW1laXQnLCBSXG4gICAgIyAgIFIuYm0gPSBibVxuICAgICMgICByZXR1cm4gUlxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgQmVuY2htYXJrZXIsIGJpZ2ludF9mcm9tX2hydGltZSwgaHJ0aW1lX2FzX2JpZ2ludCwgdGltZWl0LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuIl19
