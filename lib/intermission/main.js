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
        prefix: 'hrd',
        runs_rowid_regexp: '0x00_0000',
        first_point: 0x00_0000,
        last_point: 0x10_ffff
      },
      //.......................................................................................................
      get_insert_statements: {
        prefix: 'hrd',
        scatters_rowid_template: 'scatter-%d',
        runs_rowid_template: 'run-%d'
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

        //-------------------------------------------------------------------------------------------------------
        _get_udfs() {
          var R;
          R = {
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
      Hoard.prototype._get_build_statements = nfa({
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
        R.push(SQL`create table ${IDN(`${prefix}_hoard_runs`)} (
    rowid     text    unique  not null,
    lo        integer         not null,
    hi        integer         not null,
    scatter   text            not null,
  -- primary key ( rowid ),
  foreign key ( scatter ) references ${IDN(`${prefix}_hoard_scatters`)} ( rowid ),
  constraint "Ωconstraint__11" check ( rowid regexp ${LIT(cfg.runs_rowid_regexp)} ),
  constraint "Ωconstraint__10" check ( lo between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint__11" check ( hi between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint__12" check ( lo <= hi )
  -- constraint "Ωconstraint__13" check ( rowid regexp '^.*$' )
  );`);
        return R;
      });

      //-------------------------------------------------------------------------------------------------------
      Hoard.prototype._get_insert_statements = nfa({
        template: templates.get_insert_statements
      }, function(prefix, cfg) {
        var R;
        R = {};
        //.......................................................................................................
        R[`insert_${prefix}_hoard_scatter_v`] = SQL`insert into ${IDN(`${prefix}_hoard_scatters`)} ( rowid, is_hit, data ) values (
    printf( ${LIT(cfg.scatters_rowid_template)}, std_get_next_in_sequence( ${LIT('#{prefix}_seq_hoard_scatters')} ) ),
    $is_hit,
    $data )
  returning *;`;
        //.......................................................................................................
        return R[`insert_${prefix}_hoard_run_v`] = SQL`insert into ${IDN(`${prefix}_hoard_runs`)} ( rowid, lo, hi, scatter ) values (
    printf( ${LIT(cfg.runs_rowid_template)}, std_get_next_in_sequence( ${LIT('#{prefix}_seq_hoard_runs')} ) ),
    $lo,
    $hi,
    $scatter );`;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ludGVybWlzc2lvbi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtFQUFBLGFBQUE7O0VBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFFBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOztJQUNFLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCO0lBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsd0NBQVI7SUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUixDQUE1QixFQUpGOztJQU1FLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsZ0RBQVIsQ0FBRixDQUE0RCxDQUFDLG9DQUE3RCxDQUFBLENBQTVCO0lBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxrQkFBUixDQUFGLENBQThCLENBQUMsY0FBL0IsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQUEyQyxDQUFDLGVBQTVDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxrQkFBUixD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QixHQUEzQixDQUFkO0FBQ1osYUFBTyxDQUNMLEtBREssRUFFTCxjQUZLLEVBR0wsU0FISztJQUZXLENBQUE7RUEvV0U7QUFOeEIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuXG4ndXNlIHN0cmljdCdcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcmVxdWlyZV9pbnRlcm1pc3Npb24gPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgeyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuICBJRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIudHMnXG4gIHsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL3R5cGVzJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgeyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiAgIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi4vc2hhc3VtJ1xuICB7IERicmljLFxuICAgIFNRTCxcbiAgICBlc3FsLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtZGJyaWMtYnJpY3MnICkucmVxdWlyZV9kYnJpYygpXG4gIHsgTElULCBJRE4sIFZFQywgICAgICAgIH0gPSBlc3FsXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHRlbXBsYXRlcyA9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBydW5fY2ZnOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICAgc2NhdHRlcjogICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc2NhdHRlcl9jZmc6XG4gICAgICBob2FyZDogICAgICBudWxsXG4gICAgICBkYXRhOiAgICAgICBudWxsXG4gICAgICBzb3J0OiAgICAgICBmYWxzZVxuICAgICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNjYXR0ZXJfYWRkOlxuICAgICAgbG86ICAgICAgICAgbnVsbFxuICAgICAgaGk6ICAgICAgICAgbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaG9hcmRfY2ZnOlxuICAgICAgZmlyc3Q6ICAgICAgMHgwMF8wMDAwXG4gICAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9ydW46XG4gICAgICBsbzogICAgICAgICBudWxsXG4gICAgICBoaTogICAgICAgICBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBnZXRfYnVpbGRfc3RhdGVtZW50czpcbiAgICAgIHByZWZpeDogICAgICAgICAgICAgICAgICAgJ2hyZCdcbiAgICAgIHJ1bnNfcm93aWRfcmVnZXhwOiAgICAgICAgJzB4MDBfMDAwMCdcbiAgICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgICBsYXN0X3BvaW50OiAgICAgICAgICAgICAgIDB4MTBfZmZmZlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZ2V0X2luc2VydF9zdGF0ZW1lbnRzOlxuICAgICAgcHJlZml4OiAgICAgICAgICAgICAgICAgICAnaHJkJ1xuICAgICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICAgIHJ1bnNfcm93aWRfdGVtcGxhdGU6ICAgICAgJ3J1bi0lZCdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGdldF91ZGZzOlxuICAgICAgcHJlZml4OiAgICAgICAgICAgICAgICAgICAnaHJkJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgYXNfaGV4ID0gKCBuICkgLT5cbiAgICBzaWduID0gaWYgbiA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgICByZXR1cm4gXCIje3NpZ259MHgjeyggTWF0aC5hYnMgbiApLnRvU3RyaW5nIDE2fVwiXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuICBzdW1tYXJpemVfZGF0YSA9XG4gICAgYXNfdW5pcXVlX3NvcnRlZDogKCB2YWx1ZXMgKSAtPiBbICggbmV3IFNldCAoIHYgZm9yIHYgaW4gdmFsdWVzLmZsYXQoKSB3aGVuIHY/ICkuc29ydCgpICkuLi4sIF1cbiAgICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICAgIGFzX2Jvb2xlYW5fb3I6ICAoIHZhbHVlcyApIC0+IHZhbHVlcy5yZWR1Y2UgKCAoIGFjYywgY3VyICkgLT4gYWNjIG9yICBjdXIgPyBmYWxzZSApLCBmYWxzZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUnVuXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgICBAbG8gICA9IGxvXG4gICAgICBAaGkgICA9IGhpXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsIC0+IEBoaSAtIEBsbyArIDEgIyMjIFRBSU5UIGNvbnNpZGVyIHRvIG1ha2UgYFJ1bmBzIGltbXV0YWJsZSwgdGhlbiBzaXplIGlzIGEgY29uc3RhbnQgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICAgIEBmcm9tX2hhbGZvcGVuOiggaGFsZm9wZW4gKSAtPiBuZXcgQCB7IGxvOiBoYWxmb3Blbi5zdGFydCwgaGk6IGhhbGZvcGVuLmVuZCAtIDEsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuICggQGxvIDw9IHByb2JlLmxvIDw9IEBoaSApIGFuZCAoIEBsbyA8PSBwcm9iZS5oaSA8PSBAaGkgKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICAgIHJldHVybiB0cnVlXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNjYXR0ZXJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggaG9hcmQsIGNmZyApIC0+XG4gICAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGZyZWV6ZSBkYXRhICMjI1xuICAgICAgWyBjZmcsXG4gICAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgICAgQGRhdGEgICAgICAgICAgID0gZnJlZXplIGRhdGFcbiAgICAgIEBydW5zICAgICAgICAgICA9IFtdXG4gICAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgICBoaWRlIEAsICdob2FyZCcsICBob2FyZFxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEB3YWxrKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogLT5cbiAgICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsICAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuICAgIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG4gICAgICAjIHBvaW50cyA9IG5ldyBTZXQgWyAoIFsgcnVuLi4uLCBdIGZvciBydW4gaW4gQHJ1bnMgKS4uLiwgXS5mbGF0KClcbiAgICAgICMgcmV0dXJuIFsgcG9pbnRzLi4uLCBdLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgICMgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAgICMgICByZXR1cm4gLTEgaWYgYSA8IGJcbiAgICAgICMgICByZXR1cm4gIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdtaW4nLCAtPlxuICAgICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWluICggcnVuLmxvIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21heCcsIC0+XG4gICAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuICggQHJ1bnMuYXQgLTEgKS5oaSBpZiBAaXNfbm9ybWFsaXplZFxuICAgICAgcmV0dXJuIE1hdGgubWF4ICggcnVuLmhpIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2luc2VydDogKCBydW4gKSAtPlxuICAgICAgIyMjIE5PVEUgdGhpcyBwcml2YXRlIEFQSSBwcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBpbXBsZW1lbnQgYWx3YXlzLW9yZGVyZWQgcnVuczsgaG93ZXZlciB3ZSBvcHQgZm9yXG4gICAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgICAgQHJ1bnMucHVzaCBydW5cbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gZmFsc2VcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNvcnQ6IC0+XG4gICAgICBAcnVucy5zb3J0ICggYSwgYiApIC0+XG4gICAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgICAgcmV0dXJuICsxIGlmIGEuaGkgPiBiLmhpXG4gICAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgICByZXR1cm4gIDBcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsZWFyOiAtPlxuICAgICAgQHJ1bnMubGVuZ3RoID0gW11cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGFkZF9ydW46ICggUC4uLiApIC0+XG4gICAgICBAX2luc2VydCBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgICBpZiBAY2ZnLm5vcm1hbGl6ZSB0aGVuIEBub3JtYWxpemUoKVxuICAgICAgZWxzZSBpZiBAY2ZnLnNvcnQgdGhlbiBAc29ydCgpXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfY29kZXBvaW50c19vZjogKCB0ZXh0cy4uLiApIC0+IEBhZGRfcnVuIGNociBmb3IgY2hyIGZyb20gbmV3IFNldCB0ZXh0cy5qb2luICcnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vcm1hbGl6ZTogLT5cbiAgICAgIEBzb3J0KClcbiAgICAgIGhhbGZvcGVucyA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gQHJ1bnMgKVxuICAgICAgQGNsZWFyKClcbiAgICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSB0cnVlXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBtaW4gPD0gcHJvYmUgPD0gbWF4XG4gICAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiBydW4uY29udGFpbnMgcHJvYmVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5sbyA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUuaGkgPD0gbWF4IClcbiAgICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+ICggcnVuLmNvbnRhaW5zIHByb2JlLmxvICkgYW5kICggcnVuLmNvbnRhaW5zIHByb2JlLmhpIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICAgIHByb2JlLm5vcm1hbGl6ZSgpIHVubGVzcyBwcm9iZS5pc19ub3JtYWxpemVkXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5taW4gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLm1heCA8PSBtYXggKVxuICAgICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmNvbnRhaW5zIG5cbiAgICAgIHJldHVybiB0cnVlXG4gIFxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEhvYXJkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgQGdhcHMgPSBbXVxuICAgICAgQGhpdHMgPSBbXVxuICAgICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICAgIDt1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5jcmVhdGVfcnVuLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgICMgZGVidWcgJ86paW1fX18xJywgeyBsbywgaGksIGNmZywgfVxuICAgICAgIyBkZWJ1ZyAnzqlpbV9fXzInLCBAX2dldF9oaV9hbmRfbG8gY2ZnXG4gICAgICByZXR1cm4gbmV3IFJ1biBAX2dldF9oaV9hbmRfbG8gY2ZnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zY2F0dGVyOiAoIFAuLi4gKSAtPiBuZXcgU2NhdHRlciAgQCwgUC4uLlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhZGRfc2NhdHRlcjogKCBQLi4uICkgLT5cbiAgICAgIFIgPSBAY3JlYXRlX3NjYXR0ZXIgUC4uLlxuICAgICAgQHNjYXR0ZXJzLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29udGFpbnM6IC0+XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgICBULnBvaW50LnZhbGlkYXRlIHBvaW50XG4gICAgICBSID0gW11cbiAgICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgICBjb250aW51ZSB1bmxlc3Mgc2NhdHRlci5jb250YWlucyBwb2ludFxuICAgICAgICBSLnB1c2ggc2NhdHRlci5kYXRhXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemVfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgICAgUiA9IEBnZXRfZGF0YV9mb3JfcG9pbnQgcG9pbnRcbiAgICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiBAX3N1bW1hcml6ZV9kYXRhIFIuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3N1bW1hcml6ZV9kYXRhOiAoIGl0ZW1zLi4uICkgLT5cbiAgICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgICBSICAgICA9IHt9XG4gICAgICBrZXlzICA9IFsgKCBuZXcgU2V0ICgga2V5IGZvciBrZXkgb2YgaXRlbSBmb3IgaXRlbSBpbiBpdGVtcyApLmZsYXQoKSApLi4uLCBdLnNvcnQoKVxuICAgICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICAgIHZhbHVlcyAgICA9ICggdmFsdWUgZm9yIGl0ZW0gaW4gaXRlbXMgd2hlbiAoIHZhbHVlID0gaXRlbVsga2V5IF0gKT8gKVxuICAgICAgICBSWyBrZXkgXSAgPSAoIEBbIFwic3VtbWFyaXplX2RhdGFfI3trZXl9XCIgXSA/ICggKCB4ICkgLT4geCApICkuY2FsbCBALCB2YWx1ZXNcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN1bW1hcml6ZV9kYXRhX3RhZ3M6ICggdmFsdWVzICkgLT4gc3VtbWFyaXplX2RhdGEuYXNfdW5pcXVlX3NvcnRlZCB2YWx1ZXNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jYXN0X2JvdW5kOiAoIGJvdW5kICkgLT5cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzUgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAgIFIgPSBib3VuZFxuICAgICAgICB3aGVuICd0ZXh0J1xuICAgICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNiBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzcgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF91ZGZzOiAtPlxuICAgICAgUiA9XG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBbXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIl06XG4gICAgICAgICAgbmFtZTogXCIje3ByZWZpeH1fYXNfbG9oaV9oZXhcIlxuICAgICAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+IFwiKCN7bG8udG9TdHJpbmcgMTZ9LCN7aGkudG9TdHJpbmcgMTZ9KVwiXG5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9idWlsZF9zdGF0ZW1lbnRzOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmdldF9idWlsZF9zdGF0ZW1lbnRzLCB9LCAoIHByZWZpeCwgY2ZnICkgLT5cbiAgICAgIFIgPSBbXVxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdGFibGUgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfc2NhdHRlcnNcIn0gKFxuICAgICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCwgLS0gZ2VuZXJhdGVkIGFsd2F5cyBhcyAoICd0OmhyZDpzOlM9JyB8fCAje0lETiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJ9KCBpc19oaXQsIGRhdGEgKSApLFxuICAgICAgICAgICAgaXNfaGl0ICAgIGJvb2xlYW4gICAgICAgICBub3QgbnVsbCBkZWZhdWx0IGZhbHNlLFxuICAgICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJ1xuICAgICAgICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgICBjcmVhdGUgdGFibGUgI3tJRE4gXCIje3ByZWZpeH1faG9hcmRfcnVuc1wifSAoXG4gICAgICAgICAgICByb3dpZCAgICAgdGV4dCAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICAgICAgbG8gICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgICBzY2F0dGVyICAgdGV4dCAgICAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9ICggcm93aWQgKSxcbiAgICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggcm93aWQgcmVnZXhwICN7TElUIGNmZy5ydW5zX3Jvd2lkX3JlZ2V4cCB9ICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTBcIiBjaGVjayAoIGxvIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTFcIiBjaGVjayAoIGhpIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTJcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xM1wiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICAgKTtcIlwiXCJcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaW5zZXJ0X3N0YXRlbWVudHM6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZ2V0X2luc2VydF9zdGF0ZW1lbnRzLCB9LCAoIHByZWZpeCwgY2ZnICkgLT5cbiAgICAgIFIgPSB7fVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFJbIFwiaW5zZXJ0XyN7cHJlZml4fV9ob2FyZF9zY2F0dGVyX3ZcIiBdID0gU1FMXCJcIlwiXG4gICAgICAgIGluc2VydCBpbnRvICN7SUROIFwiI3twcmVmaXh9X2hvYXJkX3NjYXR0ZXJzXCJ9ICggcm93aWQsIGlzX2hpdCwgZGF0YSApIHZhbHVlcyAoXG4gICAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5zY2F0dGVyc19yb3dpZF90ZW1wbGF0ZX0sIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSggI3tMSVQgJyN7cHJlZml4fV9zZXFfaG9hcmRfc2NhdHRlcnMnfSApICksXG4gICAgICAgICAgICAkaXNfaGl0LFxuICAgICAgICAgICAgJGRhdGEgKVxuICAgICAgICAgIHJldHVybmluZyAqO1wiXCJcIlxuXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUlsgXCJpbnNlcnRfI3twcmVmaXh9X2hvYXJkX3J1bl92XCIgXSA9IFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byAje0lETiBcIiN7cHJlZml4fV9ob2FyZF9ydW5zXCJ9ICggcm93aWQsIGxvLCBoaSwgc2NhdHRlciApIHZhbHVlcyAoXG4gICAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5ydW5zX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAje0xJVCAnI3twcmVmaXh9X3NlcV9ob2FyZF9ydW5zJ30gKSApLFxuICAgICAgICAgICAgJGxvLFxuICAgICAgICAgICAgJGhpLFxuICAgICAgICAgICAgJHNjYXR0ZXIgKTtcIlwiXCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICAgIHJldHVybiB7XG4gICAgICBIb2FyZCxcbiAgICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgICAgaW50ZXJuYWxzLCB9XG4iXX0=
