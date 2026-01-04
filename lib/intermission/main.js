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
    data      json            not null
    );`);
        //---------------------------------------------------------------------------------------------------
        R.push(SQL`create trigger ${IDN(`${prefix}_hoard_scatters_insert`)}
  before insert on ${IDN(`${prefix}_hoard_scatters`)}
  for each row begin
    select new.data = ${IDN(`${prefix}_get_sha1sum7d`)}( new.data );
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7SUFDRSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO0lBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1QjtJQUNBLEdBQUEsR0FBNEIsT0FBQSxDQUFRLHdDQUFSO0lBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVIsQ0FBNUIsRUFKRjs7SUFNRSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGdEQUFSLENBQUYsQ0FBNEQsQ0FBQyxvQ0FBN0QsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsa0JBQVIsQ0FBRixDQUE4QixDQUFDLGNBQS9CLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxlQUE1QyxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENB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bkQ7Ozs7a0JBclUzQjs7QUF3V0UsV0FBTyxPQUFBLEdBQWEsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUN0QixVQUFBO01BQUksU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLEVBQU8sT0FBUCxFQUFnQixTQUFoQixFQUEyQixHQUEzQixDQUFkO0FBQ1osYUFBTyxDQUNMLEtBREssRUFFTCxjQUZLLEVBR0wsU0FISztJQUZXLENBQUE7RUExV0U7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgeyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuICBJRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIudHMnXG4gIHsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL3R5cGVzJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiAgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4uL3NoYXN1bSdcbiAgeyBEYnJpYyxcbiAgICBTUUwsXG4gICAgZXNxbCwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLWRicmljLWJyaWNzJyApLnJlcXVpcmVfZGJyaWMoKVxuICB7IExJVCwgSUROLCBWRUMsICAgICAgICB9ID0gZXNxbFxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB0ZW1wbGF0ZXMgPVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcnVuX2NmZzpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcbiAgICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfY2ZnOlxuICAgICAgaG9hcmQ6ICAgICAgbnVsbFxuICAgICAgZGF0YTogICAgICAgbnVsbFxuICAgICAgc29ydDogICAgICAgZmFsc2VcbiAgICAgIG5vcm1hbGl6ZTogIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzY2F0dGVyX2FkZDpcbiAgICAgIGxvOiAgICAgICAgIG51bGxcbiAgICAgIGhpOiAgICAgICAgIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGhvYXJkX2NmZzpcbiAgICAgIGZpcnN0OiAgICAgIDB4MDBfMDAwMFxuICAgICAgbGFzdDogICAgICAgMHgxMF9mZmZmXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfcnVuOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgICBwcmVmaXg6ICAgICAnaHJkJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZ2V0X3VkZnM6XG4gICAgICBwcmVmaXg6ICAgICAnaHJkJ1xuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBhc19oZXggPSAoIG4gKSAtPlxuICAgIHNpZ24gPSBpZiBuIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICAgIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBTdHJhdGVnaWVzIHRvIGJlIGFwcGxpZWQgdG8gc3VtbWFyaXplIGRhdGEgaXRlbXMgIyMjXG4gIHN1bW1hcml6ZV9kYXRhID1cbiAgICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICAgIGFzX2Jvb2xlYW5fYW5kOiAoIHZhbHVlcyApIC0+IHZhbHVlcy5yZWR1Y2UgKCAoIGFjYywgY3VyICkgLT4gYWNjIGFuZCBjdXIgPyBmYWxzZSApLCB0cnVlXG4gICAgYXNfYm9vbGVhbl9vcjogICggdmFsdWVzICkgLT4gdmFsdWVzLnJlZHVjZSAoICggYWNjLCBjdXIgKSAtPiBhY2Mgb3IgIGN1ciA/IGZhbHNlICksIGZhbHNlXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBSdW5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICh7IGxvLCBoaSwgfSkgLT5cbiAgICAgIEBsbyAgID0gbG9cbiAgICAgIEBoaSAgID0gaGlcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gWyBAbG8gLi4gQGhpIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXNfaGFsZm9wZW46ICAgICAgICAgICAgICAgIC0+IHsgc3RhcnQ6IEBsbywgZW5kOiBAaGkgKyAxLCB9XG4gICAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBSdW5cbiAgICAgICAgICByZXR1cm4gKCBAbG8gPD0gcHJvYmUubG8gPD0gQGhpICkgYW5kICggQGxvIDw9IHByb2JlLmhpIDw9IEBoaSApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgICAgcmV0dXJuIHRydWVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgU2NhdHRlclxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB2YWxpZGF0ZSAjIyNcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgZnJlZXplIGRhdGEgIyMjXG4gICAgICBbIGNmZyxcbiAgICAgICAgeyBkYXRhLCB9LCAgXSA9IGRlcGxveSB7IHRlbXBsYXRlcy5zY2F0dGVyX2NmZy4uLiwgY2ZnLi4uLCB9LCBbICdzb3J0JywgJ25vcm1hbGl6ZScsIF0sIFsgJ2RhdGEnLCBdXG4gICAgICBAZGF0YSAgICAgICAgICAgPSBmcmVlemUgZGF0YVxuICAgICAgQHJ1bnMgICAgICAgICAgID0gW11cbiAgICAgIGhpZGUgQCwgJ2NmZycsICAgIGZyZWV6ZSBjZmdcbiAgICAgIGhpZGUgQCwgJ2hvYXJkJywgIGhvYXJkXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gQHdhbGsoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAtPlxuICAgICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgICAgeWllbGQgZnJvbSBydW4gZm9yIHJ1biBpbiBAcnVuc1xuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdpc19ub3JtYWxpemVkJywgIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG4gICAgc2V0X2dldHRlciBAOjosICdwb2ludHMnLCAtPiBbIEAuLi4sIF1cbiAgICAgICMgcG9pbnRzID0gbmV3IFNldCBbICggWyBydW4uLi4sIF0gZm9yIHJ1biBpbiBAcnVucyApLi4uLCBdLmZsYXQoKVxuICAgICAgIyByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICAgIyAgIHJldHVybiArMSBpZiBhID4gYlxuICAgICAgIyAgIHJldHVybiAtMSBpZiBhIDwgYlxuICAgICAgIyAgIHJldHVybiAgMFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgICBAcnVucy5wdXNoIHJ1blxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc29ydDogLT5cbiAgICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICAgIHJldHVybiAgMFxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xlYXI6IC0+XG4gICAgICBAcnVucy5sZW5ndGggPSBbXVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYWRkX3J1bjogKCBQLi4uICkgLT5cbiAgICAgIEBfaW5zZXJ0IEBob2FyZC5jcmVhdGVfcnVuIFAuLi5cbiAgICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gY2hyIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbm9ybWFsaXplOiAtPlxuICAgICAgQHNvcnQoKVxuICAgICAgaGFsZm9wZW5zID0gSUZOLnNpbXBsaWZ5ICggcnVuLmFzX2hhbGZvcGVuKCkgZm9yIHJ1biBpbiBAcnVucyApXG4gICAgICBAY2xlYXIoKVxuICAgICAgQHJ1bnMucHVzaCBSdW4uZnJvbV9oYWxmb3BlbiBoYWxmb3BlbiBmb3IgaGFsZm9wZW4gaW4gaGFsZm9wZW5zXG4gICAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IHRydWVcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnRhaW5zOiAoIHByb2JlICkgLT5cbiAgICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHsgbWluLCBtYXgsIH0gPSBAbWlubWF4XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIG1pbiA8PSBwcm9iZSA8PSBtYXhcbiAgICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+IHJ1bi5jb250YWlucyBwcm9iZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBSdW5cbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLmxvIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5oaSA8PSBtYXggKVxuICAgICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gKCBydW4uY29udGFpbnMgcHJvYmUubG8gKSBhbmQgKCBydW4uY29udGFpbnMgcHJvYmUuaGkgKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBTY2F0dGVyXG4gICAgICAgICAgcHJvYmUubm9ybWFsaXplKCkgdW5sZXNzIHByb2JlLmlzX25vcm1hbGl6ZWRcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLm1pbiA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUubWF4IDw9IG1heCApXG4gICAgICAgICAgcmV0dXJuIHByb2JlLnJ1bnMuZXZlcnkgKCBydW4gKSA9PiBAY29udGFpbnMgcnVuXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBydW5zLnNvbWUgKCBydW4gKSAtPiBydW4uY29udGFpbnMgblxuICAgICAgcmV0dXJuIHRydWVcbiAgXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSG9hcmRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgIEBjZmcgID0gZnJlZXplIHsgdGVtcGxhdGVzLmhvYXJkX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBAZ2FwcyA9IFtdXG4gICAgICBAaGl0cyA9IFtdXG4gICAgICBoaWRlIEAsICdzY2F0dGVycycsIFtdXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICAgIHsgaXNfbm9ybWFsaXplZDogdHJ1ZSwgfVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmNyZWF0ZV9ydW4sIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICAgIyBkZWJ1ZyAnzqlpbV9fXzEnLCB7IGxvLCBoaSwgY2ZnLCB9XG4gICAgICAjIGRlYnVnICfOqWltX19fMicsIEBfZ2V0X2hpX2FuZF9sbyBjZmdcbiAgICAgIHJldHVybiBuZXcgUnVuIEBfZ2V0X2hpX2FuZF9sbyBjZmdcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3NjYXR0ZXI6ICggUC4uLiApIC0+IG5ldyBTY2F0dGVyICBALCBQLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9zY2F0dGVyOiAoIFAuLi4gKSAtPlxuICAgICAgUiA9IEBjcmVhdGVfc2NhdHRlciBQLi4uXG4gICAgICBAc2NhdHRlcnMucHVzaCBSXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogLT5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICAgIFQucG9pbnQudmFsaWRhdGUgcG9pbnRcbiAgICAgIFIgPSBbXVxuICAgICAgZm9yIHNjYXR0ZXIgaW4gQHNjYXR0ZXJzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBzY2F0dGVyLmNvbnRhaW5zIHBvaW50XG4gICAgICAgIFIucHVzaCBzY2F0dGVyLmRhdGFcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN1bW1hcml6ZV9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICBSID0gQGdldF9kYXRhX2Zvcl9wb2ludCBwb2ludFxuICAgICAgcmV0dXJuIG51bGwgaWYgUi5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuIEBfc3VtbWFyaXplX2RhdGEgUi4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfc3VtbWFyaXplX2RhdGE6ICggaXRlbXMuLi4gKSAtPlxuICAgICAgaXRlbXMgPSBpdGVtcy5mbGF0KClcbiAgICAgIFIgICAgID0ge31cbiAgICAgIGtleXMgID0gWyAoIG5ldyBTZXQgKCBrZXkgZm9yIGtleSBvZiBpdGVtIGZvciBpdGVtIGluIGl0ZW1zICkuZmxhdCgpICkuLi4sIF0uc29ydCgpXG4gICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgdmFsdWVzICAgID0gKCB2YWx1ZSBmb3IgaXRlbSBpbiBpdGVtcyB3aGVuICggdmFsdWUgPSBpdGVtWyBrZXkgXSApPyApXG4gICAgICAgIFJbIGtleSBdICA9ICggQFsgXCJzdW1tYXJpemVfZGF0YV8je2tleX1cIiBdID8gKCAoIHggKSAtPiB4ICkgKS5jYWxsIEAsIHZhbHVlc1xuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3VtbWFyaXplX2RhdGFfdGFnczogKCB2YWx1ZXMgKSAtPiBzdW1tYXJpemVfZGF0YS5hc191bmlxdWVfc29ydGVkIHZhbHVlc1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2hpX2FuZF9sbzogKCBjZmcgKSAtPlxuICAgICAgcmV0dXJuIHsgbG86ICggQF9jYXN0X2JvdW5kIGNmZy5sbyApLCBoaTogKCBAX2Nhc3RfYm91bmQgY2ZnLmhpID8gY2ZnLmxvICksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2Nhc3RfYm91bmQ6ICggYm91bmQgKSAtPlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGJvdW5kXG4gICAgICAgIHdoZW4gJ2Zsb2F0J1xuICAgICAgICAgIHVubGVzcyBOdW1iZXIuaXNJbnRlZ2VyIGJvdW5kXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNSBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICAgUiA9IGJvdW5kXG4gICAgICAgIHdoZW4gJ3RleHQnXG4gICAgICAgICAgUiA9IGJvdW5kLmNvZGVQb2ludEF0IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX182IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgIHVubGVzcyAoIEBjZmcuZmlyc3QgPD0gUiA8PSBAY2ZnLmxhc3QgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNyAje2FzX2hleCBSfSBpcyBub3QgYmV0d2VlbiAje2FzX2hleCBAY2ZnLmZpcnN0fSBhbmQgI3thc19oZXggQGNmZy5sYXN0fVwiXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAZ2V0X3VkZnM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZ2V0X3VkZnMsIH0sICggcHJlZml4LCBjZmcgKSAtPlxuICAgICAgUiA9XG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgW1wiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIl06XG4gICAgICAgICAgIyMjIE5PVEUgYXNzdW1lcyB0aGF0IGBkYXRhYCBpcyBpbiBpdHMgbm9ybWFsaXplZCBzdHJpbmcgZm9ybSAjIyNcbiAgICAgICAgICBuYW1lOiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJcbiAgICAgICAgICB2YWx1ZTogKCBpc19oaXQsIGRhdGEgKSAtPiBnZXRfc2hhMXN1bTdkIFwiI3tpZiBpc19oaXQgdGhlbiAnSCcgZWxzZSAnRyd9I3tkYXRhfVwiXG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBbXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIl06XG4gICAgICAgICAgbmFtZTogXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIlxuICAgICAgICAgIHZhbHVlOiAoIGRhdGEgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICAgICAgICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAgICAgICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgW1wiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJdOlxuICAgICAgICAgIG5hbWU6IFwiI3twcmVmaXh9X2FzX2xvaGlfaGV4XCJcbiAgICAgICAgICB2YWx1ZTogKCBsbywgaGkgKSAtPiBcIigje2xvLnRvU3RyaW5nIDE2fSwje2hpLnRvU3RyaW5nIDE2fSlcIlxuXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBnZXRfYnVpbGRfc3RhdGVtZW50czogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5nZXRfYnVpbGRfc3RhdGVtZW50cywgfSwgKCBwcmVmaXgsIGNmZyApIC0+XG4gICAgICBSID0gW11cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgICAgY3JlYXRlIHRhYmxlICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9IChcbiAgICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoICd0OmhyZDpzOlM9JyB8fCAje0lETiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJ9KCBpc19oaXQsIGRhdGEgKSApLFxuICAgICAgICAgICAgaXNfaGl0ICAgIGJvb2xlYW4gICAgICAgICBub3QgbnVsbCBkZWZhdWx0IGZhbHNlLFxuICAgICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbFxuICAgICAgICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdHJpZ2dlciAje0lETiBcIiN7cHJlZml4fV9ob2FyZF9zY2F0dGVyc19pbnNlcnRcIn1cbiAgICAgICAgICBiZWZvcmUgaW5zZXJ0IG9uICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9XG4gICAgICAgICAgZm9yIGVhY2ggcm93IGJlZ2luXG4gICAgICAgICAgICBzZWxlY3QgbmV3LmRhdGEgPSAje0lETiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJ9KCBuZXcuZGF0YSApO1xuICAgICAgICAgICAgZW5kO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICAgIGNyZWF0ZSB0YWJsZSAje0lETiBcIiN7cHJlZml4fV9ob2FyZF9ydW5zXCJ9IChcbiAgICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoICd0OmhyZDpyOlY9JyB8fCAje0lETiBcIiN7cHJlZml4fV9hc19sb2hpX2hleFwifSggbG8sIGhpICkgKSxcbiAgICAgICAgICAgIGxvICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgICBoaSAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgICAgc2NhdHRlciAgIHRleHQgICAgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICAtLSBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgICAgZm9yZWlnbiBrZXkgKCBzY2F0dGVyICkgcmVmZXJlbmNlcyAje0lETiBcIiN7cHJlZml4fV9ob2FyZF9zY2F0dGVyc1wifSAoIHJvd2lkICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTBcIiBjaGVjayAoIGxvIGJldHdlZW4gMHgwMDAwMDAgYW5kIDB4MTBmZmZmICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTFcIiBjaGVjayAoIGhpIGJldHdlZW4gMHgwMDAwMDAgYW5kIDB4MTBmZmZmICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTJcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xM1wiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICAgKTtcIlwiXCJcbiAgICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICByZXR1cm4gZXhwb3J0cyA9IGRvID0+XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IFJ1biwgU2NhdHRlciwgdGVtcGxhdGVzLCBJRk4sIH1cbiAgICByZXR1cm4ge1xuICAgICAgSG9hcmQsXG4gICAgICBzdW1tYXJpemVfZGF0YSxcbiAgICAgIGludGVybmFscywgfVxuIl19
