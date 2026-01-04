(function() {
  'use strict';
  //===========================================================================================================
  this.require_intermission = function() {
    var Dbric, Hoard, IDN, IFN, LIT, Run, SQL, Scatter, T, VEC, as_hex, debug, deploy, esql, exports, freeze, get_sha1sum7d, hide, nameit, nfa, rpr, set_getter, summarize_data, templates, type_of;
    //=========================================================================================================
    ({debug} = console);
    ({freeze} = Object);
    IFN = require('../../dependencies/intervals-fn-lib.ts');
    ({T} = require('./types'));
    //.........................................................................................................
    ({nfa} = (require('../unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());
    ({nameit} = (require('../various-brics')).require_nameit());
    ({type_of} = (require('../unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('../various-brics')).require_managed_property_tools());
    ({rpr} = (require('../loupe-brics')).require_loupe());
    ({deploy} = (require('../unstable-object-tools-brics')).require_deploy());
    ({get_sha1sum7d} = require('../shasum'));
    ({Dbric, SQL, esql} = (require('../unstable-dbric-brics')).require_dbric());
    ({LIT, IDN, VEC} = esql);
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
      },
      //.......................................................................................................
      get_build_statements: {
        prefix: 'hrd'
      },
      //.......................................................................................................
      get_udfs: {
        prefix: 'hrd'
      }
    };
    //=========================================================================================================
    as_hex = function(n) {
      var sign;
      sign = n < 0 ? '-' : '+';
      return `${sign}0x${(Math.abs(n)).toString(16)}`;
    };
    //=========================================================================================================
    /* Strategies to be applied to summarize data items */
    summarize_data = {
      as_unique_sorted: function(values) {
        var v;
        return [
          ...(new Set(((function() {
            var i,
          len,
          ref,
          results;
            ref = values.flat();
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              v = ref[i];
              if (v != null) {
                results.push(v);
              }
            }
            return results;
          })()).sort()))
        ];
      },
      as_boolean_and: function(values) {
        return values.reduce((function(acc, cur) {
          var ref;
          return (ref = acc && cur) != null ? ref : false;
        }), true);
      },
      as_boolean_or: function(values) {
        return values.reduce((function(acc, cur) {
          var ref;
          return (ref = acc || cur) != null ? ref : false;
        }), false);
      }
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
        add_run(...P) {
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
            results.push(this.add_run(chr));
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
        get_data_for_point(point) {
          var R, i, len, ref, scatter;
          T.point.validate(point);
          R = [];
          ref = this.scatters;
          for (i = 0, len = ref.length; i < len; i++) {
            scatter = ref[i];
            if (!scatter.contains(point)) {
              continue;
            }
            R.push(scatter.data);
          }
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        summarize_data_for_point(point) {
          var R;
          R = this.get_data_for_point(point);
          if (R.length === 0) {
            return null;
          }
          return this._summarize_data(...R);
        }

        //-------------------------------------------------------------------------------------------------------
        _summarize_data(...items) {
          var R, i, item, key, keys, len, ref, value, values;
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
                if ((value = item[key]) != null) {
                  results.push(value);
                }
              }
              return results;
            })();
            R[key] = ((ref = this[`summarize_data_${key}`]) != null ? ref : (function(x) {
              return x;
            })).call(this, values);
          }
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        summarize_data_tags(values) {
          return summarize_data.as_unique_sorted(values);
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

      //-------------------------------------------------------------------------------------------------------
      Hoard.get_udfs = nfa({
        template: templates.get_udfs
      }, function(prefix, cfg) {
        var R;
        R = {
          //---------------------------------------------------------------------------------------------------
          [`${prefix}_get_sha1sum7d`]: {
            /* NOTE assumes that `data` is in its normalized string form */
            name: `${prefix}_get_sha1sum7d`,
            value: function(is_hit, data) {
              return get_sha1sum7d(`${is_hit ? 'H' : 'G'}${data}`);
            }
          },
          //---------------------------------------------------------------------------------------------------
          [`${prefix}_normalize_data`]: {
            name: `${prefix}_normalize_data`,
            value: function(data) {
              var k, keys;
              if (data === 'null') {
                return data;
              }
              debug('Ωim___5', rpr(data));
              data = JSON.parse(data);
              keys = (Object.keys(data)).sort();
              return JSON.stringify(Object.fromEntries((function() {
                var i, len, results;
                results = [];
                for (i = 0, len = keys.length; i < len; i++) {
                  k = keys[i];
                  results.push([k, data[k]]);
                }
                return results;
              })()));
            }
          },
          //---------------------------------------------------------------------------------------------------
          [`${prefix}_as_lohi_hex`]: {
            name: `${prefix}_as_lohi_hex`,
            value: function(lo, hi) {
              return `(${lo.toString(16)},${hi.toString(16)})`;
            }
          }
        };
        //.....................................................................................................
        return R;
      });

      //-------------------------------------------------------------------------------------------------------
      Hoard.get_build_statements = nfa({
        template: templates.get_build_statements
      }, function(prefix, cfg) {
        var R;
        R = [];
        //---------------------------------------------------------------------------------------------------
        R.push(SQL`create table ${IDN(`${prefix}_hoard_scatters`)} (
    rowid     text    unique  not null generated always as ( 't:hrd:s:S=' || ${IDN(`${prefix}_get_sha1sum7d`)}( is_hit, data ) ),
    is_hit    boolean         not null default false,
    data      json            not null default 'null'
    );`);
        //---------------------------------------------------------------------------------------------------
        R.push(SQL`create trigger ${IDN(`${prefix}_hoard_scatters_insert`)}
  before insert on ${IDN(`${prefix}_hoard_scatters`)}
  for each row begin
    -- case when new.data != 'null' then
    select new.data = ${IDN(`${prefix}_normalize_data`)}( new.data );
    end;`);
        //---------------------------------------------------------------------------------------------------
        R.push(SQL`create table ${IDN(`${prefix}_hoard_runs`)} (
    rowid     text    unique  not null generated always as ( 't:hrd:r:V=' || ${IDN(`${prefix}_as_lohi_hex`)}( lo, hi ) ),
    lo        integer         not null,
    hi        integer         not null,
    scatter   text            not null,
  -- primary key ( rowid ),
  foreign key ( scatter ) references ${IDN(`${prefix}_hoard_scatters`)} ( rowid ),
  constraint "Ωconstraint__10" check ( lo between 0x000000 and 0x10ffff ),
  constraint "Ωconstraint__11" check ( hi between 0x000000 and 0x10ffff ),
  constraint "Ωconstraint__12" check ( lo <= hi )
  -- constraint "Ωconstraint__13" check ( rowid regexp '^.*$' )
  );`);
        return R;
      });

      return Hoard;

    }).call(this);
    //=========================================================================================================
    return exports = (() => {
      var internals;
      internals = Object.freeze({Run, Scatter, templates, IFN});
      return {Hoard, summarize_data, internals};
    })();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1QjtJQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHdDQUFSO0lBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVIsQ0FBNUIsRUFKRjs7SUFNRSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGdEQUFSLENBQUYsQ0FBNEQsQ0FBQyxvQ0FBN0QsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsa0JBQVIsQ0FBRixDQUE4QixDQUFDLGNBQS9CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxlQUE1QyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENB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QUFKLENBUC9CLENBQUE7Ozs7O0lBQUEsQ0FBVjtBQWFBLGVBQU87TUFqQ2lFLENBQW5EOzs7O2tCQXRVM0I7O0FBMFdFLFdBQU8sT0FBQSxHQUFhLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDdEIsVUFBQTtNQUFJLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixFQUFPLE9BQVAsRUFBZ0IsU0FBaEIsRUFBMkIsR0FBM0IsQ0FBZDtBQUNaLGFBQU8sQ0FDTCxLQURLLEVBRUwsY0FGSyxFQUdMLFNBSEs7SUFGVyxDQUFBO0VBNVdFO0FBTnhCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQHJlcXVpcmVfaW50ZXJtaXNzaW9uID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIHsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiAgSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLnRzJ1xuICB7IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi90eXBlcydcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICB7IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgeyBycHIsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG4gIHsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4gIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuLi9zaGFzdW0nXG4gIHsgRGJyaWMsXG4gICAgU1FMLFxuICAgIGVzcWwsICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1kYnJpYy1icmljcycgKS5yZXF1aXJlX2RicmljKClcbiAgeyBMSVQsIElETiwgVkVDLCAgICAgICAgfSA9IGVzcWxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJ1bl9jZmc6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgICBzY2F0dGVyOiAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2NmZzpcbiAgICAgIGhvYXJkOiAgICAgIG51bGxcbiAgICAgIGRhdGE6ICAgICAgIG51bGxcbiAgICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgICBub3JtYWxpemU6ICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9hZGQ6XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBob2FyZF9jZmc6XG4gICAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICAgIGxhc3Q6ICAgICAgIDB4MTBfZmZmZlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3J1bjpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGdldF9idWlsZF9zdGF0ZW1lbnRzOlxuICAgICAgcHJlZml4OiAgICAgJ2hyZCdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGdldF91ZGZzOlxuICAgICAgcHJlZml4OiAgICAgJ2hyZCdcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgYXNfaGV4ID0gKCBuICkgLT5cbiAgICBzaWduID0gaWYgbiA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICByZXR1cm4gXCIje3NpZ259MHgjeyggTWF0aC5hYnMgbiApLnRvU3RyaW5nIDE2fVwiXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuICBzdW1tYXJpemVfZGF0YSA9XG4gICAgYXNfdW5pcXVlX3NvcnRlZDogKCB2YWx1ZXMgKSAtPiBbICggbmV3IFNldCAoIHYgZm9yIHYgaW4gdmFsdWVzLmZsYXQoKSB3aGVuIHY/ICkuc29ydCgpICkuLi4sIF1cbiAgICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICAgIGFzX2Jvb2xlYW5fb3I6ICAoIHZhbHVlcyApIC0+IHZhbHVlcy5yZWR1Y2UgKCAoIGFjYywgY3VyICkgLT4gYWNjIG9yICBjdXIgPyBmYWxzZSApLCBmYWxzZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUnVuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgICBAbG8gICA9IGxvXG4gICAgICBAaGkgICA9IGhpXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsIC0+IEBoaSAtIEBsbyArIDEgIyMjIFRBSU5UIGNvbnNpZGVyIHRvIG1ha2UgYFJ1bmBzIGltbXV0YWJsZSwgdGhlbiBzaXplIGlzIGEgY29uc3RhbnQgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICAgIEBmcm9tX2hhbGZvcGVuOiggaGFsZm9wZW4gKSAtPiBuZXcgQCB7IGxvOiBoYWxmb3Blbi5zdGFydCwgaGk6IGhhbGZvcGVuLmVuZCAtIDEsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuICggQGxvIDw9IHByb2JlLmxvIDw9IEBoaSApIGFuZCAoIEBsbyA8PSBwcm9iZS5oaSA8PSBAaGkgKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICAgIHJldHVybiB0cnVlXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggaG9hcmQsIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGZyZWV6ZSBkYXRhICMjI1xuICAgICAgWyBjZmcsXG4gICAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgICAgQGRhdGEgICAgICAgICAgID0gZnJlZXplIGRhdGFcbiAgICAgIEBydW5zICAgICAgICAgICA9IFtdXG4gICAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgICBoaWRlIEAsICdob2FyZCcsICBob2FyZFxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEB3YWxrKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogLT5cbiAgICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsICAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuICAgIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG4gICAgICAjIHBvaW50cyA9IG5ldyBTZXQgWyAoIFsgcnVuLi4uLCBdIGZvciBydW4gaW4gQHJ1bnMgKS4uLiwgXS5mbGF0KClcbiAgICAgICMgcmV0dXJuIFsgcG9pbnRzLi4uLCBdLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICMgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAgICMgICByZXR1cm4gLTEgaWYgYSA8IGJcbiAgICAgICMgICByZXR1cm4gIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtaW4nLCAtPlxuICAgICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWluICggcnVuLmxvIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21heCcsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgLTEgKS5oaSBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWF4ICggcnVuLmhpIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2luc2VydDogKCBydW4gKSAtPlxuICAgICAgIyMjIE5PVEUgdGhpcyBwcml2YXRlIEFQSSBwcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBpbXBsZW1lbnQgYWx3YXlzLW9yZGVyZWQgcnVuczsgaG93ZXZlciB3ZSBvcHQgZm9yXG4gICAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgICAgQHJ1bnMucHVzaCBydW5cbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gZmFsc2VcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNvcnQ6IC0+XG4gICAgICBAcnVucy5zb3J0ICggYSwgYiApIC0+XG4gICAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgICAgcmV0dXJuICsxIGlmIGEuaGkgPiBiLmhpXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgICByZXR1cm4gIDBcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsZWFyOiAtPlxuICAgICAgQHJ1bnMubGVuZ3RoID0gW11cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9ydW46ICggUC4uLiApIC0+XG4gICAgICBAX2luc2VydCBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgICBpZiBAY2ZnLm5vcm1hbGl6ZSB0aGVuIEBub3JtYWxpemUoKVxuICAgICAgZWxzZSBpZiBAY2ZnLnNvcnQgdGhlbiBAc29ydCgpXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfY29kZXBvaW50c19vZjogKCB0ZXh0cy4uLiApIC0+IEBhZGRfcnVuIGNociBmb3IgY2hyIGZyb20gbmV3IFNldCB0ZXh0cy5qb2luICcnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZTogLT5cbiAgICAgIEBzb3J0KClcbiAgICAgIGhhbGZvcGVucyA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gQHJ1bnMgKVxuICAgICAgQGNsZWFyKClcbiAgICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSB0cnVlXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBtaW4gPD0gcHJvYmUgPD0gbWF4XG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiBydW4uY29udGFpbnMgcHJvYmVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5sbyA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUuaGkgPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+ICggcnVuLmNvbnRhaW5zIHByb2JlLmxvICkgYW5kICggcnVuLmNvbnRhaW5zIHByb2JlLmhpIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICAgIHByb2JlLm5vcm1hbGl6ZSgpIHVubGVzcyBwcm9iZS5pc19ub3JtYWxpemVkXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5taW4gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLm1heCA8PSBtYXggKVxuICAgICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmNvbnRhaW5zIG5cbiAgICAgIHJldHVybiB0cnVlXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEhvYXJkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgQGdhcHMgPSBbXVxuICAgICAgQGhpdHMgPSBbXVxuICAgICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5jcmVhdGVfcnVuLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgICMgZGVidWcgJ86paW1fX18xJywgeyBsbywgaGksIGNmZywgfVxuICAgICAgIyBkZWJ1ZyAnzqlpbV9fXzInLCBAX2dldF9oaV9hbmRfbG8gY2ZnXG4gICAgICByZXR1cm4gbmV3IFJ1biBAX2dldF9oaV9hbmRfbG8gY2ZnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zY2F0dGVyOiAoIFAuLi4gKSAtPiBuZXcgU2NhdHRlciAgQCwgUC4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfc2NhdHRlcjogKCBQLi4uICkgLT5cbiAgICAgIFIgPSBAY3JlYXRlX3NjYXR0ZXIgUC4uLlxuICAgICAgQHNjYXR0ZXJzLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6IC0+XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICBULnBvaW50LnZhbGlkYXRlIHBvaW50XG4gICAgICBSID0gW11cbiAgICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgICBjb250aW51ZSB1bmxlc3Mgc2NhdHRlci5jb250YWlucyBwb2ludFxuICAgICAgICBSLnB1c2ggc2NhdHRlci5kYXRhXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemVfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgUiA9IEBnZXRfZGF0YV9mb3JfcG9pbnQgcG9pbnRcbiAgICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiBAX3N1bW1hcml6ZV9kYXRhIFIuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3N1bW1hcml6ZV9kYXRhOiAoIGl0ZW1zLi4uICkgLT5cbiAgICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgICBSICAgICA9IHt9XG4gICAgICBrZXlzICA9IFsgKCBuZXcgU2V0ICgga2V5IGZvciBrZXkgb2YgaXRlbSBmb3IgaXRlbSBpbiBpdGVtcyApLmZsYXQoKSApLi4uLCBdLnNvcnQoKVxuICAgICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICAgIHZhbHVlcyAgICA9ICggdmFsdWUgZm9yIGl0ZW0gaW4gaXRlbXMgd2hlbiAoIHZhbHVlID0gaXRlbVsga2V5IF0gKT8gKVxuICAgICAgICBSWyBrZXkgXSAgPSAoIEBbIFwic3VtbWFyaXplX2RhdGFfI3trZXl9XCIgXSA/ICggKCB4ICkgLT4geCApICkuY2FsbCBALCB2YWx1ZXNcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN1bW1hcml6ZV9kYXRhX3RhZ3M6ICggdmFsdWVzICkgLT4gc3VtbWFyaXplX2RhdGEuYXNfdW5pcXVlX3NvcnRlZCB2YWx1ZXNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jYXN0X2JvdW5kOiAoIGJvdW5kICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzUgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAgIFIgPSBib3VuZFxuICAgICAgICB3aGVuICd0ZXh0J1xuICAgICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNiBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzcgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGdldF91ZGZzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmdldF91ZGZzLCB9LCAoIHByZWZpeCwgY2ZnICkgLT5cbiAgICAgIFIgPVxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIFtcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJdOlxuICAgICAgICAgICMjIyBOT1RFIGFzc3VtZXMgdGhhdCBgZGF0YWAgaXMgaW4gaXRzIG5vcm1hbGl6ZWQgc3RyaW5nIGZvcm0gIyMjXG4gICAgICAgICAgbmFtZTogXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXG4gICAgICAgICAgdmFsdWU6ICggaXNfaGl0LCBkYXRhICkgLT4gZ2V0X3NoYTFzdW03ZCBcIiN7aWYgaXNfaGl0IHRoZW4gJ0gnIGVsc2UgJ0cnfSN7ZGF0YX1cIlxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgW1wiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJdOlxuICAgICAgICAgIG5hbWU6IFwiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJcbiAgICAgICAgICB2YWx1ZTogKCBkYXRhICkgLT5cbiAgICAgICAgICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgICAgICAgICBkZWJ1ZyAnzqlpbV9fXzUnLCBycHIgZGF0YVxuICAgICAgICAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgICAgICAgIGtleXMgID0gKCBPYmplY3Qua2V5cyBkYXRhICkuc29ydCgpXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBbXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIl06XG4gICAgICAgICAgbmFtZTogXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIlxuICAgICAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+IFwiKCN7bG8udG9TdHJpbmcgMTZ9LCN7aGkudG9TdHJpbmcgMTZ9KVwiXG5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGdldF9idWlsZF9zdGF0ZW1lbnRzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmdldF9idWlsZF9zdGF0ZW1lbnRzLCB9LCAoIHByZWZpeCwgY2ZnICkgLT5cbiAgICAgIFIgPSBbXVxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdGFibGUgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn0gKFxuICAgICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggJ3Q6aHJkOnM6Uz0nIHx8ICN7SUROIFwiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIn0oIGlzX2hpdCwgZGF0YSApICksXG4gICAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgICBkYXRhICAgICAganNvbiAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnXG4gICAgICAgICAgICApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICAgIGNyZWF0ZSB0cmlnZ2VyICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzX2luc2VydFwifVxuICAgICAgICAgIGJlZm9yZSBpbnNlcnQgb24gI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn1cbiAgICAgICAgICBmb3IgZWFjaCByb3cgYmVnaW5cbiAgICAgICAgICAgIC0tIGNhc2Ugd2hlbiBuZXcuZGF0YSAhPSAnbnVsbCcgdGhlblxuICAgICAgICAgICAgc2VsZWN0IG5ldy5kYXRhID0gI3tJRE4gXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIn0oIG5ldy5kYXRhICk7XG4gICAgICAgICAgICBlbmQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgICAgY3JlYXRlIHRhYmxlICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3J1bnNcIn0gKFxuICAgICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggJ3Q6aHJkOnI6Vj0nIHx8ICN7SUROIFwiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJ9KCBsbywgaGkgKSApLFxuICAgICAgICAgICAgbG8gICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgICBzY2F0dGVyICAgdGV4dCAgICAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9ICggcm93aWQgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMFwiIGNoZWNrICggbG8gYmV0d2VlbiAweDAwMDAwMCBhbmQgMHgxMGZmZmYgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggaGkgYmV0d2VlbiAweDAwMDAwMCBhbmQgMHgxMGZmZmYgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMlwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEzXCIgY2hlY2sgKCByb3dpZCByZWdleHAgJ14uKiQnIClcbiAgICAgICAgICApO1wiXCJcIlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICAgIHJldHVybiB7XG4gICAgICBIb2FyZCxcbiAgICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgICAgaW50ZXJuYWxzLCB9XG4iXX0=
