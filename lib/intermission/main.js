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
          // #---------------------------------------------------------------------------------------------------
          // ["#{prefix}_normalize_data"]:
          //   name: "#{prefix}_normalize_data"
          //   value: ( data ) ->
          //     return data if data is 'null'
          //     # debug 'Ωim___5', rpr data
          //     data  = JSON.parse data
          //     keys  = ( Object.keys data ).sort()
          //     return JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1QjtJQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHdDQUFSO0lBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVIsQ0FBNUIsRUFKRjs7SUFNRSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGdEQUFSLENBQUYsQ0FBNEQsQ0FBQyxvQ0FBN0QsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsa0JBQVIsQ0FBRixDQUE4QixDQUFDLGNBQS9CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxlQUE1QyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENB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QSxDQUVhLEdBQUEsQ0FBSSxDQUFBLENBQUEsQ0FBRyxNQUFILENBQUEsZUFBQSxDQUFKLENBRmIsQ0FBQTs7O3NCQUFBLENBQUEsQ0FLZ0IsR0FBQSxDQUFJLENBQUEsQ0FBQSxDQUFHLE1BQUgsQ0FBQSxlQUFBLENBQUosQ0FMaEIsQ0FBQTtRQUFBLENBQVYsRUFWTjs7UUFtQk0sQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFHLENBQUEsYUFBQSxDQUFBLENBQ08sR0FBQSxDQUFJLENBQUEsQ0FBQSxDQUFHLE1BQUgsQ0FBQSxXQUFBLENBQUosQ0FEUCxDQUFBOzZFQUFBLENBQUEsQ0FFdUUsR0FBQSxDQUFJLENBQUEsQ0FBQSxDQUFHLE1BQUgsQ0FBQSxZQUFBLENBQUosQ0FGdkUsQ0FBQTs7Ozs7cUNBQUEsQ0FBQSxDQU8rQixHQUFBLENBQUksQ0FBQSxDQUFBLENBQUcsTUFBSCxDQUFBLGVBQUEsQ0FBSixDQVAvQixDQUFBOzs7OztJQUFBLENBQVY7QUFhQSxlQUFPO01BakNpRSxDQUFuRDs7OztrQkF0VTNCOztBQTBXRSxXQUFPLE9BQUEsR0FBYSxDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3RCLFVBQUE7TUFBSSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsRUFBTyxPQUFQLEVBQWdCLFNBQWhCLEVBQTJCLEdBQTNCLENBQWQ7QUFDWixhQUFPLENBQ0wsS0FESyxFQUVMLGNBRkssRUFHTCxTQUhLO0lBRlcsQ0FBQTtFQTVXRTtBQU54QiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkByZXF1aXJlX2ludGVybWlzc2lvbiA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICB7IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4gIElGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi50cydcbiAgeyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vdHlwZXMnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgeyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICB7IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuICB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi4vc2hhc3VtJ1xuICB7IERicmljLFxuICAgIFNRTCxcbiAgICBlc3FsLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtZGJyaWMtYnJpY3MnICkucmVxdWlyZV9kYnJpYygpXG4gIHsgTElULCBJRE4sIFZFQywgICAgICAgIH0gPSBlc3FsXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHRlbXBsYXRlcyA9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBydW5fY2ZnOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICAgc2NhdHRlcjogICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9jZmc6XG4gICAgICBob2FyZDogICAgICBudWxsXG4gICAgICBkYXRhOiAgICAgICBudWxsXG4gICAgICBzb3J0OiAgICAgICBmYWxzZVxuICAgICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfYWRkOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaG9hcmRfY2ZnOlxuICAgICAgZmlyc3Q6ICAgICAgMHgwMF8wMDAwXG4gICAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9ydW46XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBnZXRfYnVpbGRfc3RhdGVtZW50czpcbiAgICAgIHByZWZpeDogICAgICdocmQnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBnZXRfdWRmczpcbiAgICAgIHByZWZpeDogICAgICdocmQnXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFzX2hleCA9ICggbiApIC0+XG4gICAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFN0cmF0ZWdpZXMgdG8gYmUgYXBwbGllZCB0byBzdW1tYXJpemUgZGF0YSBpdGVtcyAjIyNcbiAgc3VtbWFyaXplX2RhdGEgPVxuICAgIGFzX3VuaXF1ZV9zb3J0ZWQ6ICggdmFsdWVzICkgLT4gWyAoIG5ldyBTZXQgKCB2IGZvciB2IGluIHZhbHVlcy5mbGF0KCkgd2hlbiB2PyApLnNvcnQoKSApLi4uLCBdXG4gICAgYXNfYm9vbGVhbl9hbmQ6ICggdmFsdWVzICkgLT4gdmFsdWVzLnJlZHVjZSAoICggYWNjLCBjdXIgKSAtPiBhY2MgYW5kIGN1ciA/IGZhbHNlICksIHRydWVcbiAgICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFJ1blxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKHsgbG8sIGhpLCB9KSAtPlxuICAgICAgQGxvICAgPSBsb1xuICAgICAgQGhpICAgPSBoaVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBbIEBsbyAuLiBAaGkgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3NpemUnLCAtPiBAaGkgLSBAbG8gKyAxICMjIyBUQUlOVCBjb25zaWRlciB0byBtYWtlIGBSdW5gcyBpbW11dGFibGUsIHRoZW4gc2l6ZSBpcyBhIGNvbnN0YW50ICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAoIHByb2JlICkgLT5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICAgIHJldHVybiBAbG8gPD0gcHJvYmUgPD0gQGhpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGxvIDw9IG4gPD0gQGhpXG4gICAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTY2F0dGVyXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGhvYXJkLCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHZhbGlkYXRlICMjI1xuICAgICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICAgIFsgY2ZnLFxuICAgICAgICB7IGRhdGEsIH0sICBdID0gZGVwbG95IHsgdGVtcGxhdGVzLnNjYXR0ZXJfY2ZnLi4uLCBjZmcuLi4sIH0sIFsgJ3NvcnQnLCAnbm9ybWFsaXplJywgXSwgWyAnZGF0YScsIF1cbiAgICAgIEBkYXRhICAgICAgICAgICA9IGZyZWV6ZSBkYXRhXG4gICAgICBAcnVucyAgICAgICAgICAgPSBbXVxuICAgICAgaGlkZSBALCAnY2ZnJywgICAgZnJlZXplIGNmZ1xuICAgICAgaGlkZSBALCAnaG9hcmQnLCAgaG9hcmRcbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgIHsgaXNfbm9ybWFsaXplZDogdHJ1ZSwgfVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6IC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+IFsgQC4uLiwgXVxuICAgICAgIyBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgICAjIHJldHVybiBbIHBvaW50cy4uLiwgXS5zb3J0ICggYSwgYiApIC0+XG4gICAgICAjICAgcmV0dXJuICsxIGlmIGEgPiBiXG4gICAgICAjICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICAjICAgcmV0dXJuICAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWluJywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAwICkubG8gaWYgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHJldHVybiBNYXRoLm1pbiAoIHJ1bi5sbyBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtYXgnLCAtPlxuICAgICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiAoIEBydW5zLmF0IC0xICkuaGkgaWYgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHJldHVybiBNYXRoLm1heCAoIHJ1bi5oaSBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtaW5tYXgnLCAtPiB7IG1pbjogQG1pbiwgbWF4OiBAbWF4LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAgIEBydW5zLnB1c2ggcnVuXG4gICAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IGZhbHNlXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzb3J0OiAtPlxuICAgICAgQHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYS5sbyA+IGIubG9cbiAgICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgICByZXR1cm4gLTEgaWYgYS5oaSA8IGIuaGlcbiAgICAgICAgcmV0dXJuICAwXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhcjogLT5cbiAgICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfcnVuOiAoIFAuLi4gKSAtPlxuICAgICAgQF9pbnNlcnQgQGhvYXJkLmNyZWF0ZV9ydW4gUC4uLlxuICAgICAgaWYgQGNmZy5ub3JtYWxpemUgdGhlbiBAbm9ybWFsaXplKClcbiAgICAgIGVsc2UgaWYgQGNmZy5zb3J0IHRoZW4gQHNvcnQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX2NvZGVwb2ludHNfb2Y6ICggdGV4dHMuLi4gKSAtPiBAYWRkX3J1biBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiAoIHJ1bi5jb250YWlucyBwcm9iZS5sbyApIGFuZCAoIHJ1bi5jb250YWlucyBwcm9iZS5oaSApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFNjYXR0ZXJcbiAgICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubWluIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5tYXggPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gcHJvYmUucnVucy5ldmVyeSAoIHJ1biApID0+IEBjb250YWlucyBydW5cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgICByZXR1cm4gdHJ1ZVxuICBcbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBIb2FyZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuaG9hcmRfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBnYXBzID0gW11cbiAgICAgIEBoaXRzID0gW11cbiAgICAgIGhpZGUgQCwgJ3NjYXR0ZXJzJywgW11cbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY3JlYXRlX3J1biwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICAjIGRlYnVnICfOqWltX19fMScsIHsgbG8sIGhpLCBjZmcsIH1cbiAgICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgICAgcmV0dXJuIG5ldyBSdW4gQF9nZXRfaGlfYW5kX2xvIGNmZ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc2NhdHRlcjogKCBQLi4uICkgLT4gbmV3IFNjYXR0ZXIgIEAsIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgICBSID0gQGNyZWF0ZV9zY2F0dGVyIFAuLi5cbiAgICAgIEBzY2F0dGVycy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgICAgUiA9IFtdXG4gICAgICBmb3Igc2NhdHRlciBpbiBAc2NhdHRlcnNcbiAgICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgICAgUi5wdXNoIHNjYXR0ZXIuZGF0YVxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgIFIgPSBAZ2V0X2RhdGFfZm9yX3BvaW50IHBvaW50XG4gICAgICByZXR1cm4gbnVsbCBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9zdW1tYXJpemVfZGF0YTogKCBpdGVtcy4uLiApIC0+XG4gICAgICBpdGVtcyA9IGl0ZW1zLmZsYXQoKVxuICAgICAgUiAgICAgPSB7fVxuICAgICAga2V5cyAgPSBbICggbmV3IFNldCAoIGtleSBmb3Iga2V5IG9mIGl0ZW0gZm9yIGl0ZW0gaW4gaXRlbXMgKS5mbGF0KCkgKS4uLiwgXS5zb3J0KClcbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgICAgUlsga2V5IF0gID0gKCBAWyBcInN1bW1hcml6ZV9kYXRhXyN7a2V5fVwiIF0gPyAoICggeCApIC0+IHggKSApLmNhbGwgQCwgdmFsdWVzXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaGlfYW5kX2xvOiAoIGNmZyApIC0+XG4gICAgICByZXR1cm4geyBsbzogKCBAX2Nhc3RfYm91bmQgY2ZnLmxvICksIGhpOiAoIEBfY2FzdF9ib3VuZCBjZmcuaGkgPyBjZmcubG8gKSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY2FzdF9ib3VuZDogKCBib3VuZCApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgYm91bmRcbiAgICAgICAgd2hlbiAnZmxvYXQnXG4gICAgICAgICAgdW5sZXNzIE51bWJlci5pc0ludGVnZXIgYm91bmRcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX181IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgICBSID0gYm91bmRcbiAgICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgICBSID0gYm91bmQuY29kZVBvaW50QXQgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzYgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdW5sZXNzICggQGNmZy5maXJzdCA8PSBSIDw9IEBjZmcubGFzdCApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX183ICN7YXNfaGV4IFJ9IGlzIG5vdCBiZXR3ZWVuICN7YXNfaGV4IEBjZmcuZmlyc3R9IGFuZCAje2FzX2hleCBAY2ZnLmxhc3R9XCJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBnZXRfdWRmczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5nZXRfdWRmcywgfSwgKCBwcmVmaXgsIGNmZyApIC0+XG4gICAgICBSID1cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBbXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXTpcbiAgICAgICAgICAjIyMgTk9URSBhc3N1bWVzIHRoYXQgYGRhdGFgIGlzIGluIGl0cyBub3JtYWxpemVkIHN0cmluZyBmb3JtICMjI1xuICAgICAgICAgIG5hbWU6IFwiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIlxuICAgICAgICAgIHZhbHVlOiAoIGlzX2hpdCwgZGF0YSApIC0+IGdldF9zaGExc3VtN2QgXCIje2lmIGlzX2hpdCB0aGVuICdIJyBlbHNlICdHJ30je2RhdGF9XCJcblxuICAgICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgIyBbXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIl06XG4gICAgICAgICMgICBuYW1lOiBcIiN7cHJlZml4fV9ub3JtYWxpemVfZGF0YVwiXG4gICAgICAgICMgICB2YWx1ZTogKCBkYXRhICkgLT5cbiAgICAgICAgIyAgICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICAgICAgIyAgICAgIyBkZWJ1ZyAnzqlpbV9fXzUnLCBycHIgZGF0YVxuICAgICAgICAjICAgICBkYXRhICA9IEpTT04ucGFyc2UgZGF0YVxuICAgICAgICAjICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgICAjICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBbXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIl06XG4gICAgICAgICAgbmFtZTogXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIlxuICAgICAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+IFwiKCN7bG8udG9TdHJpbmcgMTZ9LCN7aGkudG9TdHJpbmcgMTZ9KVwiXG5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGdldF9idWlsZF9zdGF0ZW1lbnRzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmdldF9idWlsZF9zdGF0ZW1lbnRzLCB9LCAoIHByZWZpeCwgY2ZnICkgLT5cbiAgICAgIFIgPSBbXVxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdGFibGUgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn0gKFxuICAgICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggJ3Q6aHJkOnM6Uz0nIHx8ICN7SUROIFwiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIn0oIGlzX2hpdCwgZGF0YSApICksXG4gICAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgICBkYXRhICAgICAganNvbiAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnXG4gICAgICAgICAgICApO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICAgIGNyZWF0ZSB0cmlnZ2VyICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzX2luc2VydFwifVxuICAgICAgICAgIGJlZm9yZSBpbnNlcnQgb24gI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn1cbiAgICAgICAgICBmb3IgZWFjaCByb3cgYmVnaW5cbiAgICAgICAgICAgIC0tIGNhc2Ugd2hlbiBuZXcuZGF0YSAhPSAnbnVsbCcgdGhlblxuICAgICAgICAgICAgc2VsZWN0IG5ldy5kYXRhID0gI3tJRE4gXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIn0oIG5ldy5kYXRhICk7XG4gICAgICAgICAgICBlbmQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgICAgY3JlYXRlIHRhYmxlICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3J1bnNcIn0gKFxuICAgICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggJ3Q6aHJkOnI6Vj0nIHx8ICN7SUROIFwiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJ9KCBsbywgaGkgKSApLFxuICAgICAgICAgICAgbG8gICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgICBzY2F0dGVyICAgdGV4dCAgICAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9ICggcm93aWQgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMFwiIGNoZWNrICggbG8gYmV0d2VlbiAweDAwMDAwMCBhbmQgMHgxMGZmZmYgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggaGkgYmV0d2VlbiAweDAwMDAwMCBhbmQgMHgxMGZmZmYgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMlwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEzXCIgY2hlY2sgKCByb3dpZCByZWdleHAgJ14uKiQnIClcbiAgICAgICAgICApO1wiXCJcIlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICAgIHJldHVybiB7XG4gICAgICBIb2FyZCxcbiAgICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgICAgaW50ZXJuYWxzLCB9XG4iXX0=
