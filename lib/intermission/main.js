(function() {
  'use strict';
  //===========================================================================================================
  this.require_intermission = function() {
    var Dbric, Hoard, IDN, IFN, LIT, Run, SQL, Scatter, T, VEC, as_hex, debug, deploy, esql, exports, freeze, hide, nameit, nfa, rpr, set_getter, summarize_data, templates, type_of;
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
    // { get_sha1sum7d,        } = require '../shasum'
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
          // #---------------------------------------------------------------------------------------------------
          // ["#{prefix}_get_sha1sum7d"]:
          //   ### NOTE assumes that `data` is in its normalized string form ###
          //   name: "#{prefix}_get_sha1sum7d"
          //   value: ( is_hit, data ) -> get_sha1sum7d "#{if is_hit then 'H' else 'G'}#{data}"

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
    rowid     text    unique  not null, -- generated always as ( 't:hrd:s:S=' || ${IDN(`${prefix}_get_sha1sum7d`)}( is_hit, data ) ),
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOztJQUNFLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCO0lBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVI7SUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUixDQUE1QixFQUpGOztJQU1FLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsZ0RBQVIsQ0FBRixDQUE0RCxDQUFDLG9DQUE3RCxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxrQkFBUixDQUFGLENBQThCLENBQUMsY0FBL0IsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQUEyQyxDQUFDLGVBQTVDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxrQkFBUixD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QSxDQUFKLENBRnZFLENBQUE7Ozs7O3FDQUFBLENBQUEsQ0FPK0IsR0FBQSxDQUFJLENBQUEsQ0FBQSxDQUFHLE1BQUgsQ0FBQSxlQUFBLENBQUosQ0FQL0IsQ0FBQTs7Ozs7SUFBQSxDQUFWO0FBYUEsZUFBTztNQWpDaUUsQ0FBbkQ7Ozs7a0JBdFUzQjs7QUEwV0UsV0FBTyxPQUFBLEdBQWEsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUN0QixVQUFBO01BQUksU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLEVBQU8sT0FBUCxFQUFnQixTQUFoQixFQUEyQixHQUEzQixDQUFkO0FBQ1osYUFBTyxDQUNMLEtBREssRUFFTCxjQUZLLEVBR0wsU0FISztJQUZXLENBQUE7RUE1V0U7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgeyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuICBJRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIudHMnXG4gIHsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL3R5cGVzJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiAgIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi4vc2hhc3VtJ1xuICB7IERicmljLFxuICAgIFNRTCxcbiAgICBlc3FsLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtZGJyaWMtYnJpY3MnICkucmVxdWlyZV9kYnJpYygpXG4gIHsgTElULCBJRE4sIFZFQywgICAgICAgIH0gPSBlc3FsXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHRlbXBsYXRlcyA9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBydW5fY2ZnOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICAgc2NhdHRlcjogICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9jZmc6XG4gICAgICBob2FyZDogICAgICBudWxsXG4gICAgICBkYXRhOiAgICAgICBudWxsXG4gICAgICBzb3J0OiAgICAgICBmYWxzZVxuICAgICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfYWRkOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaG9hcmRfY2ZnOlxuICAgICAgZmlyc3Q6ICAgICAgMHgwMF8wMDAwXG4gICAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9ydW46XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBnZXRfYnVpbGRfc3RhdGVtZW50czpcbiAgICAgIHByZWZpeDogICAgICdocmQnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBnZXRfdWRmczpcbiAgICAgIHByZWZpeDogICAgICdocmQnXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFzX2hleCA9ICggbiApIC0+XG4gICAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gICAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIFN0cmF0ZWdpZXMgdG8gYmUgYXBwbGllZCB0byBzdW1tYXJpemUgZGF0YSBpdGVtcyAjIyNcbiAgc3VtbWFyaXplX2RhdGEgPVxuICAgIGFzX3VuaXF1ZV9zb3J0ZWQ6ICggdmFsdWVzICkgLT4gWyAoIG5ldyBTZXQgKCB2IGZvciB2IGluIHZhbHVlcy5mbGF0KCkgd2hlbiB2PyApLnNvcnQoKSApLi4uLCBdXG4gICAgYXNfYm9vbGVhbl9hbmQ6ICggdmFsdWVzICkgLT4gdmFsdWVzLnJlZHVjZSAoICggYWNjLCBjdXIgKSAtPiBhY2MgYW5kIGN1ciA/IGZhbHNlICksIHRydWVcbiAgICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFJ1blxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKHsgbG8sIGhpLCB9KSAtPlxuICAgICAgQGxvICAgPSBsb1xuICAgICAgQGhpICAgPSBoaVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBbIEBsbyAuLiBAaGkgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3NpemUnLCAtPiBAaGkgLSBAbG8gKyAxICMjIyBUQUlOVCBjb25zaWRlciB0byBtYWtlIGBSdW5gcyBpbW11dGFibGUsIHRoZW4gc2l6ZSBpcyBhIGNvbnN0YW50ICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAoIHByb2JlICkgLT5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICAgIHJldHVybiBAbG8gPD0gcHJvYmUgPD0gQGhpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGxvIDw9IG4gPD0gQGhpXG4gICAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTY2F0dGVyXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGhvYXJkLCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHZhbGlkYXRlICMjI1xuICAgICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICAgIFsgY2ZnLFxuICAgICAgICB7IGRhdGEsIH0sICBdID0gZGVwbG95IHsgdGVtcGxhdGVzLnNjYXR0ZXJfY2ZnLi4uLCBjZmcuLi4sIH0sIFsgJ3NvcnQnLCAnbm9ybWFsaXplJywgXSwgWyAnZGF0YScsIF1cbiAgICAgIEBkYXRhICAgICAgICAgICA9IGZyZWV6ZSBkYXRhXG4gICAgICBAcnVucyAgICAgICAgICAgPSBbXVxuICAgICAgaGlkZSBALCAnY2ZnJywgICAgZnJlZXplIGNmZ1xuICAgICAgaGlkZSBALCAnaG9hcmQnLCAgaG9hcmRcbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgIHsgaXNfbm9ybWFsaXplZDogdHJ1ZSwgfVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6IC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+IFsgQC4uLiwgXVxuICAgICAgIyBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgICAjIHJldHVybiBbIHBvaW50cy4uLiwgXS5zb3J0ICggYSwgYiApIC0+XG4gICAgICAjICAgcmV0dXJuICsxIGlmIGEgPiBiXG4gICAgICAjICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICAjICAgcmV0dXJuICAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWluJywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAwICkubG8gaWYgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHJldHVybiBNYXRoLm1pbiAoIHJ1bi5sbyBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtYXgnLCAtPlxuICAgICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiAoIEBydW5zLmF0IC0xICkuaGkgaWYgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHJldHVybiBNYXRoLm1heCAoIHJ1bi5oaSBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtaW5tYXgnLCAtPiB7IG1pbjogQG1pbiwgbWF4OiBAbWF4LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAgIEBydW5zLnB1c2ggcnVuXG4gICAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IGZhbHNlXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzb3J0OiAtPlxuICAgICAgQHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgICByZXR1cm4gKzEgaWYgYS5sbyA+IGIubG9cbiAgICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgICByZXR1cm4gLTEgaWYgYS5oaSA8IGIuaGlcbiAgICAgICAgcmV0dXJuICAwXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGVhcjogLT5cbiAgICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfcnVuOiAoIFAuLi4gKSAtPlxuICAgICAgQF9pbnNlcnQgQGhvYXJkLmNyZWF0ZV9ydW4gUC4uLlxuICAgICAgaWYgQGNmZy5ub3JtYWxpemUgdGhlbiBAbm9ybWFsaXplKClcbiAgICAgIGVsc2UgaWYgQGNmZy5zb3J0IHRoZW4gQHNvcnQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX2NvZGVwb2ludHNfb2Y6ICggdGV4dHMuLi4gKSAtPiBAYWRkX3J1biBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3JtYWxpemU6IC0+XG4gICAgICBAc29ydCgpXG4gICAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICAgIEBjbGVhcigpXG4gICAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiAoIHJ1bi5jb250YWlucyBwcm9iZS5sbyApIGFuZCAoIHJ1bi5jb250YWlucyBwcm9iZS5oaSApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFNjYXR0ZXJcbiAgICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubWluIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5tYXggPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gcHJvYmUucnVucy5ldmVyeSAoIHJ1biApID0+IEBjb250YWlucyBydW5cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgICByZXR1cm4gdHJ1ZVxuICBcbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBIb2FyZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgQGNmZyAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuaG9hcmRfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBnYXBzID0gW11cbiAgICAgIEBoaXRzID0gW11cbiAgICAgIGhpZGUgQCwgJ3NjYXR0ZXJzJywgW11cbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY3JlYXRlX3J1biwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICAjIGRlYnVnICfOqWltX19fMScsIHsgbG8sIGhpLCBjZmcsIH1cbiAgICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgICAgcmV0dXJuIG5ldyBSdW4gQF9nZXRfaGlfYW5kX2xvIGNmZ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc2NhdHRlcjogKCBQLi4uICkgLT4gbmV3IFNjYXR0ZXIgIEAsIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgICBSID0gQGNyZWF0ZV9zY2F0dGVyIFAuLi5cbiAgICAgIEBzY2F0dGVycy5wdXNoIFJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAtPlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgICAgUiA9IFtdXG4gICAgICBmb3Igc2NhdHRlciBpbiBAc2NhdHRlcnNcbiAgICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgICAgUi5wdXNoIHNjYXR0ZXIuZGF0YVxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgIFIgPSBAZ2V0X2RhdGFfZm9yX3BvaW50IHBvaW50XG4gICAgICByZXR1cm4gbnVsbCBpZiBSLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9zdW1tYXJpemVfZGF0YTogKCBpdGVtcy4uLiApIC0+XG4gICAgICBpdGVtcyA9IGl0ZW1zLmZsYXQoKVxuICAgICAgUiAgICAgPSB7fVxuICAgICAga2V5cyAgPSBbICggbmV3IFNldCAoIGtleSBmb3Iga2V5IG9mIGl0ZW0gZm9yIGl0ZW0gaW4gaXRlbXMgKS5mbGF0KCkgKS4uLiwgXS5zb3J0KClcbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgICAgUlsga2V5IF0gID0gKCBAWyBcInN1bW1hcml6ZV9kYXRhXyN7a2V5fVwiIF0gPyAoICggeCApIC0+IHggKSApLmNhbGwgQCwgdmFsdWVzXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaGlfYW5kX2xvOiAoIGNmZyApIC0+XG4gICAgICByZXR1cm4geyBsbzogKCBAX2Nhc3RfYm91bmQgY2ZnLmxvICksIGhpOiAoIEBfY2FzdF9ib3VuZCBjZmcuaGkgPyBjZmcubG8gKSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY2FzdF9ib3VuZDogKCBib3VuZCApIC0+XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgYm91bmRcbiAgICAgICAgd2hlbiAnZmxvYXQnXG4gICAgICAgICAgdW5sZXNzIE51bWJlci5pc0ludGVnZXIgYm91bmRcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX181IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgICBSID0gYm91bmRcbiAgICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgICBSID0gYm91bmQuY29kZVBvaW50QXQgMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzYgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdW5sZXNzICggQGNmZy5maXJzdCA8PSBSIDw9IEBjZmcubGFzdCApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX183ICN7YXNfaGV4IFJ9IGlzIG5vdCBiZXR3ZWVuICN7YXNfaGV4IEBjZmcuZmlyc3R9IGFuZCAje2FzX2hleCBAY2ZnLmxhc3R9XCJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBnZXRfdWRmczogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5nZXRfdWRmcywgfSwgKCBwcmVmaXgsIGNmZyApIC0+XG4gICAgICBSID1cbiAgICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICMgW1wiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIl06XG4gICAgICAgICMgICAjIyMgTk9URSBhc3N1bWVzIHRoYXQgYGRhdGFgIGlzIGluIGl0cyBub3JtYWxpemVkIHN0cmluZyBmb3JtICMjI1xuICAgICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXG4gICAgICAgICMgICB2YWx1ZTogKCBpc19oaXQsIGRhdGEgKSAtPiBnZXRfc2hhMXN1bTdkIFwiI3tpZiBpc19oaXQgdGhlbiAnSCcgZWxzZSAnRyd9I3tkYXRhfVwiXG5cbiAgICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICMgW1wiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJdOlxuICAgICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIlxuICAgICAgICAjICAgdmFsdWU6ICggZGF0YSApIC0+XG4gICAgICAgICMgICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgICAgICMgICAgICMgZGVidWcgJ86paW1fX181JywgcnByIGRhdGFcbiAgICAgICAgIyAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgICAgIyAgICAga2V5cyAgPSAoIE9iamVjdC5rZXlzIGRhdGEgKS5zb3J0KClcbiAgICAgICAgIyAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgW1wiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJdOlxuICAgICAgICAgIG5hbWU6IFwiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJcbiAgICAgICAgICB2YWx1ZTogKCBsbywgaGkgKSAtPiBcIigje2xvLnRvU3RyaW5nIDE2fSwje2hpLnRvU3RyaW5nIDE2fSlcIlxuXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBnZXRfYnVpbGRfc3RhdGVtZW50czogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5nZXRfYnVpbGRfc3RhdGVtZW50cywgfSwgKCBwcmVmaXgsIGNmZyApIC0+XG4gICAgICBSID0gW11cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgICAgY3JlYXRlIHRhYmxlICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9IChcbiAgICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwsIC0tIGdlbmVyYXRlZCBhbHdheXMgYXMgKCAndDpocmQ6czpTPScgfHwgI3tJRE4gXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwifSggaXNfaGl0LCBkYXRhICkgKSxcbiAgICAgICAgICAgIGlzX2hpdCAgICBib29sZWFuICAgICAgICAgbm90IG51bGwgZGVmYXVsdCBmYWxzZSxcbiAgICAgICAgICAgIGRhdGEgICAgICBqc29uICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCdcbiAgICAgICAgICAgICk7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgICAgY3JlYXRlIHRyaWdnZXIgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNfaW5zZXJ0XCJ9XG4gICAgICAgICAgYmVmb3JlIGluc2VydCBvbiAje0lETiBcIiN7cHJlZml4fV9ob2FyZF9zY2F0dGVyc1wifVxuICAgICAgICAgIGZvciBlYWNoIHJvdyBiZWdpblxuICAgICAgICAgICAgLS0gY2FzZSB3aGVuIG5ldy5kYXRhICE9ICdudWxsJyB0aGVuXG4gICAgICAgICAgICBzZWxlY3QgbmV3LmRhdGEgPSAje0lETiBcIiN7cHJlZml4fV9ub3JtYWxpemVfZGF0YVwifSggbmV3LmRhdGEgKTtcbiAgICAgICAgICAgIGVuZDtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdGFibGUgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfcnVuc1wifSAoXG4gICAgICAgICAgICByb3dpZCAgICAgdGV4dCAgICB1bmlxdWUgIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCAndDpocmQ6cjpWPScgfHwgI3tJRE4gXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIn0oIGxvLCBoaSApICksXG4gICAgICAgICAgICBsbyAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIHNjYXR0ZXIgICB0ZXh0ICAgICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICAgIGZvcmVpZ24ga2V5ICggc2NhdHRlciApIHJlZmVyZW5jZXMgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn0gKCByb3dpZCApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEwXCIgY2hlY2sgKCBsbyBiZXR3ZWVuIDB4MDAwMDAwIGFuZCAweDEwZmZmZiApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzExXCIgY2hlY2sgKCBoaSBiZXR3ZWVuIDB4MDAwMDAwIGFuZCAweDEwZmZmZiApLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEyXCIgY2hlY2sgKCBsbyA8PSBoaSApXG4gICAgICAgICAgLS0gY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTNcIiBjaGVjayAoIHJvd2lkIHJlZ2V4cCAnXi4qJCcgKVxuICAgICAgICAgICk7XCJcIlwiXG4gICAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcmV0dXJuIGV4cG9ydHMgPSBkbyA9PlxuICAgIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBSdW4sIFNjYXR0ZXIsIHRlbXBsYXRlcywgSUZOLCB9XG4gICAgcmV0dXJuIHtcbiAgICAgIEhvYXJkLFxuICAgICAgc3VtbWFyaXplX2RhdGEsXG4gICAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
