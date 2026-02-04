(function() {
  'use strict';
  var Dbric, Dbric_std, Hoard, IDN, IFN, LIT, Run, SQL, Scatter, T, VEC, as_hex, debug, deploy, freeze, hide, lets, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, summarize_data, templates, type_of;

  //===========================================================================================================
  ({debug} = console);

  ({freeze} = Object);

  IFN = require('./../dependencies/intervals-fn-lib.js');

  ({T} = require('./intermission-types'));

  //...........................................................................................................
  ({nfa} = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());

  ({nameit} = (require('./various-brics')).require_nameit());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({hide, set_readonly, set_hidden_readonly, set_getter} = (require('./various-brics')).require_managed_property_tools());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({deploy} = (require('./unstable-object-tools-brics')).require_deploy());

  // { get_sha1sum7d,        } = require './shasum'
  ({Dbric, Dbric_std, SQL, LIT, IDN, VEC} = require('./dbric'));

  //===========================================================================================================
  /* TAINT move to dedicated module */
  /* NOTE not using `letsfreezethat` to avoid issue with deep-freezing `Run` instances */
  lets = function(original, modifier = null) {
    var draft;
    draft = Array.isArray ? [...original] : {...original};
    modifier(draft);
    return freeze(draft);
  };

  //===========================================================================================================
  templates = {
    //.........................................................................................................
    run_cfg: {
      lo: null,
      hi: null,
      scatter: null
    },
    //.........................................................................................................
    scatter_cfg: {
      hoard: null,
      data: null
    },
    //.........................................................................................................
    scatter_add: {
      lo: null,
      hi: null
    },
    //.........................................................................................................
    hoard_cfg: {
      first: 0x00_0000,
      last: 0x10_ffff
    },
    //.........................................................................................................
    create_run: {
      lo: null,
      hi: null
    },
    //.........................................................................................................
    get_build_statements: {
      runs_rowid_regexp: '0x00_0000',
      first_point: 0x00_0000,
      last_point: 0x10_ffff
    },
    //.........................................................................................................
    get_insert_statements: {
      scatters_rowid_template: 'scatter-%d',
      runs_rowid_template: 'run-%d'
    },
    //.........................................................................................................
    get_udfs: {}
  };

  //===========================================================================================================
  as_hex = function(n) {
    var sign;
    sign = n < 0 ? '-' : '+';
    return `${sign}0x${(Math.abs(n)).toString(16)}`;
  };

  //===========================================================================================================
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

  //===========================================================================================================
  Run = class Run {
    //---------------------------------------------------------------------------------------------------------
    constructor({lo, hi}) {
      /* TAINT use typing */
      // throw new Error ""
      set_readonly(this, 'lo', lo);
      set_readonly(this, 'hi', hi);
      set_hidden_readonly(this, 'size', hi - lo + 1);
      void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    * [Symbol.iterator]() {
      var ref, ref1;
      return (yield* (function() {
        var results = [];
        for (var i = ref = this.lo, ref1 = this.hi; ref <= ref1 ? i <= ref1 : i >= ref1; ref <= ref1 ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this));
    }

    //---------------------------------------------------------------------------------------------------------
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

    //---------------------------------------------------------------------------------------------------------
    contains(probe) {
      var chr, n, ref, ref1;
      //.......................................................................................................
      switch (true) {
        //.....................................................................................................
        case Number.isFinite(probe):
          return (this.lo <= probe && probe <= this.hi);
        //.....................................................................................................
        case probe instanceof Run:
          return ((this.lo <= (ref = probe.lo) && ref <= this.hi)) && ((this.lo <= (ref1 = probe.hi) && ref1 <= this.hi));
        //.....................................................................................................
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
//.......................................................................................................
      for (n of probe) {
        if (!((this.lo <= n && n <= this.hi))) {
          return false;
        }
      }
      return true;
    }

  };

  Scatter = (function() {
    //===========================================================================================================
    class Scatter {
      //---------------------------------------------------------------------------------------------------------
      constructor(hoard, data = null) {
        /* TAINT validate */
        set_readonly(this, 'data', data != null ? freeze(data) : data);
        set_readonly(this, 'rowid', `t:hrd:scatters,R=${hoard.scatters.length + 1}`);
        // set_readonly @, 'runs', freeze []
        this.runs = freeze([]);
        hide(this, 'hoard', hoard);
        hide(this, 'state', {
          is_normalized: false
        });
        void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      * [Symbol.iterator]() {
        return (yield* this.walk());
      }

      //---------------------------------------------------------------------------------------------------------
      * walk() {
        var i, len, ref, run;
        this.normalize();
        ref = this.runs;
        for (i = 0, len = ref.length; i < len; i++) {
          run = ref[i];
          yield* run;
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _insert(run) {
        /* NOTE this private API provides an opportunity to implement always-ordered runs; however we opt for
           sorting all ranges when needed by a method like `Scatter::normalize()` */
        this.runs = lets(this.runs, (runs) => {
          return runs.push(run);
        });
        this.state.is_normalized = false;
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _sort_runs(runs) {
        runs.sort(function(a, b) {
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

      //---------------------------------------------------------------------------------------------------------
      add_run(...P) {
        this._insert(this.hoard.create_run(...P));
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      add_codepoints_of(...texts) {
        var chr, results;
        results = [];
        for (chr of new Set(texts.join(''))) {
          results.push(this.add_run(chr));
        }
        return results;
      }

      //---------------------------------------------------------------------------------------------------------
      normalize(force = false) {
        if (this.is_normalized && (!force)) {
          return null;
        }
        this.runs = lets(this.runs, (runs) => {
          var halfopen, halfopens, i, len, run;
          this._sort_runs(runs);
          halfopens = IFN.simplify((function() {
            var i, len, results;
            results = [];
            for (i = 0, len = runs.length; i < len; i++) {
              run = runs[i];
              results.push(run.as_halfopen());
            }
            return results;
          })());
          runs.length = 0;
          for (i = 0, len = halfopens.length; i < len; i++) {
            halfopen = halfopens[i];
            run = Run.from_halfopen(halfopen);
            /* TAINT use API */
            run.rowid = this.hoard._get_next_run_rowid();
            run.scatter = this.rowid;
            runs.push(freeze(run));
          }
          null;
          return this.state.is_normalized = true;
        });
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      contains(probe) {
        var chr, max, min, n, ref, ref1, ref2, ref3;
        this.normalize();
        ({min, max} = this.minmax);
        //.......................................................................................................
        switch (true) {
          //.....................................................................................................
          case Number.isFinite(probe):
            if (!((min <= probe && probe <= max))) {
              return false;
            }
            return this.runs.some((run) => {
              return run.contains(probe);
            });
          //.....................................................................................................
          case probe instanceof Run:
            if (!(((min <= (ref = probe.lo) && ref <= max)) && ((min <= (ref1 = probe.hi) && ref1 <= max)))) {
              return false;
            }
            return this.runs.some((run) => {
              return (run.contains(probe.lo)) && (run.contains(probe.hi));
            });
          //.....................................................................................................
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
          //.....................................................................................................
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
//.......................................................................................................
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

    //---------------------------------------------------------------------------------------------------------
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

    //---------------------------------------------------------------------------------------------------------
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

    //---------------------------------------------------------------------------------------------------------
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

    //---------------------------------------------------------------------------------------------------------
    set_getter(Scatter.prototype, 'minmax', function() {
      return {
        min: this.min,
        max: this.max
      };
    });

    return Scatter;

  }).call(this);

  Hoard = (function() {
    //===========================================================================================================
    class Hoard {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        this.cfg = freeze({...templates.hoard_cfg, ...cfg});
        this.gaps = [];
        this.hits = [];
        hide(this, 'scatters', []);
        hide(this, 'state', {
          is_normalized: true,
          run_rowid: 0
        });
        void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_next_run_rowid() {
        this.state.run_rowid++;
        return `t:hrd:runs,R=${this.state.run_rowid}`;
      }

      //---------------------------------------------------------------------------------------------------------
      add_scatter(...P) {
        var R;
        R = new Scatter(this, ...P);
        this.scatters.push(R);
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      contains() {}

      //---------------------------------------------------------------------------------------------------------
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

      //---------------------------------------------------------------------------------------------------------
      summarize_data_for_point(point) {
        var R;
        R = this.get_data_for_point(point);
        if (R.length === 0) {
          return null;
        }
        return this._summarize_data(...R);
      }

      //---------------------------------------------------------------------------------------------------------
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

      //---------------------------------------------------------------------------------------------------------
      summarize_data_tags(values) {
        return summarize_data.as_unique_sorted(values);
      }

      //---------------------------------------------------------------------------------------------------------
      _get_hi_and_lo(cfg) {
        var ref;
        return {
          lo: this._cast_bound(cfg.lo),
          hi: this._cast_bound((ref = cfg.hi) != null ? ref : cfg.lo)
        };
      }

      //---------------------------------------------------------------------------------------------------------
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

      //---------------------------------------------------------------------------------------------------------
      static functions() {
        var R;
        R = {};
        ({
          //-------------------------------------------------------------------------------------------------------
          hrd_as_lohi_hex: {
            name: 'hrd_as_lohi_hex',
            value: function(lo, hi) {
              return `(${lo.toString(16)},${hi.toString(16)})`;
            }
          }
        });
        //-------------------------------------------------------------------------------------------------------
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      static build() {
        var R;
        R = [];
        //-------------------------------------------------------------------------------------------------------
        R.push(SQL`create table hrd_hoard_scatters (
    rowid     text    unique  not null,
    is_hit    boolean         not null default false,
    data      json            not null default 'null'
    );`);
        //-------------------------------------------------------------------------------------------------------
        R.push(SQL`create table hrd_hoard_runs (
    rowid     text    unique  not null,
    lo        integer         not null,
    hi        integer         not null,
    scatter   text            not null,
  -- primary key ( rowid ),
  foreign key ( scatter ) references hrd_hoard_scatters ( rowid ),
  constraint "Ωconstraint__11" check ( rowid regexp ${LIT(cfg.runs_rowid_regexp)} ),
  constraint "Ωconstraint__10" check ( lo between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint__11" check ( hi between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint__12" check ( lo <= hi )
  -- constraint "Ωconstraint__13" check ( rowid regexp '^.*$' )
  );`);
        //-------------------------------------------------------------------------------------------------------
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      static statements() {
        var R;
        R = {};
        //-------------------------------------------------------------------------------------------------------
        R.insert_hrd_hoard_scatter_v = SQL`insert into hrd_hoard_scatters ( rowid, is_hit, data ) values (
    printf( ${LIT(cfg.scatters_rowid_template)}, std_get_next_in_sequence( 'hrd_seq_hoard_scatters' ) ),
    $is_hit,
    $data )
  returning *;`;
        //-------------------------------------------------------------------------------------------------------
        R.insert_hrd_hoard_run_v = SQL`insert into hrd_hoard_runs ( rowid, lo, hi, scatter ) values (
    printf( ${LIT(cfg.runs_rowid_template)}, std_get_next_in_sequence( 'hrd_seq_hoard_runs' ) ),
    $lo,
    $hi,
    $scatter );`;
        //-------------------------------------------------------------------------------------------------------
        return R;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Hoard.prototype.create_run = nfa({
      template: templates.create_run
    }, function(lo, hi, cfg) {
      // debug 'Ωim___1', { lo, hi, cfg, }
      // debug 'Ωim___2', @_get_hi_and_lo cfg
      return new Run(this._get_hi_and_lo(cfg));
    });

    return Hoard;

  }).call(this);

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = Object.freeze({Run, Scatter, templates, IFN});
    return {Hoard, summarize_data, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENB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LElBQUksR0FBSixDQUFRLElBQUMsQ0FBQSxjQUFELENBQWdCLEdBQWhCLENBQVI7SUFINEMsQ0FBekM7Ozs7Z0JBelBkOzs7RUEyWEEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLEVBQU8sT0FBUCxFQUFnQixTQUFoQixFQUEyQixHQUEzQixDQUFkO0FBQ1osV0FBTyxDQUNMLEtBREssRUFFTCxjQUZLLEVBR0wsU0FISztFQUZXLENBQUE7QUEzWHBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG4jIyMgTk9URSBub3QgdXNpbmcgYGxldHNmcmVlemV0aGF0YCB0byBhdm9pZCBpc3N1ZSB3aXRoIGRlZXAtZnJlZXppbmcgYFJ1bmAgaW5zdGFuY2VzICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHJ1bl9jZmc6XG4gICAgbG86ICAgICAgICAgbnVsbFxuICAgIGhpOiAgICAgICAgIG51bGxcbiAgICBzY2F0dGVyOiAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgc2NhdHRlcl9jZmc6XG4gICAgaG9hcmQ6ICAgICAgbnVsbFxuICAgIGRhdGE6ICAgICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2FkZDpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGhvYXJkX2NmZzpcbiAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfcnVuOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgcnVuc19yb3dpZF9yZWdleHA6ICAgICAgICAnMHgwMF8wMDAwJ1xuICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdF9wb2ludDogICAgICAgICAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfaW5zZXJ0X3N0YXRlbWVudHM6XG4gICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICBydW5zX3Jvd2lkX3RlbXBsYXRlOiAgICAgICdydW4tJWQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X3VkZnM6IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYXNfaGV4ID0gKCBuICkgLT5cbiAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuc3VtbWFyaXplX2RhdGEgPVxuICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBSdW5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgIyMjIFRBSU5UIHVzZSB0eXBpbmcgIyMjXG4gICAgIyB0aHJvdyBuZXcgRXJyb3IgXCJcIlxuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2xvJywgICBsb1xuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2hpJywgICBoaVxuICAgIHNldF9oaWRkZW5fcmVhZG9ubHkgQCwgJ3NpemUnLCBoaSAtIGxvICsgMVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICByZXR1cm4gKCBAbG8gPD0gcHJvYmUubG8gPD0gQGhpICkgYW5kICggQGxvIDw9IHByb2JlLmhpIDw9IEBoaSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2NhdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggaG9hcmQsIGRhdGEgPSBudWxsICkgLT5cbiAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgc2V0X3JlYWRvbmx5IEAsICdkYXRhJywgaWYgZGF0YT8gdGhlbiBmcmVlemUgZGF0YSBlbHNlIGRhdGFcbiAgICBzZXRfcmVhZG9ubHkgQCwgJ3Jvd2lkJywgXCJ0OmhyZDpzY2F0dGVycyxSPSN7aG9hcmQuc2NhdHRlcnMubGVuZ3RoICsgMX1cIlxuICAgICMgc2V0X3JlYWRvbmx5IEAsICdydW5zJywgZnJlZXplIFtdXG4gICAgQHJ1bnMgPSBmcmVlemUgW11cbiAgICBoaWRlIEAsICdob2FyZCcsICBob2FyZFxuICAgIGhpZGUgQCwgJ3N0YXRlJywgIHsgaXNfbm9ybWFsaXplZDogZmFsc2UsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAtPlxuICAgIEBub3JtYWxpemUoKVxuICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdpc19ub3JtYWxpemVkJywgIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG4gIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG4gICAgIyBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgIyByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICMgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAjICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgIyAgIHJldHVybiAgMFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtaW4nLCAtPlxuICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgcmV0dXJuIE1hdGgubWluICggcnVuLmxvIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtYXgnLCAtPlxuICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuICggQHJ1bnMuYXQgLTEgKS5oaSBpZiBAaXNfbm9ybWFsaXplZFxuICAgIHJldHVybiBNYXRoLm1heCAoIHJ1bi5oaSBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2luc2VydDogKCBydW4gKSAtPlxuICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgQHJ1bnMgPSBsZXRzIEBydW5zLCAoIHJ1bnMgKSA9PiBydW5zLnB1c2ggcnVuXG4gICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc29ydF9ydW5zOiAoIHJ1bnMgKSAtPlxuICAgIHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICByZXR1cm4gIDBcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3J1bjogKCBQLi4uICkgLT5cbiAgICBAX2luc2VydCBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gY2hyIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZTogKCBmb3JjZSA9IGZhbHNlICkgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAaXNfbm9ybWFsaXplZCBhbmQgKCBub3QgZm9yY2UgKVxuICAgIEBydW5zID0gbGV0cyBAcnVucywgKCBydW5zICkgPT5cbiAgICAgIEBfc29ydF9ydW5zIHJ1bnNcbiAgICAgIGhhbGZvcGVucyAgID0gSUZOLnNpbXBsaWZ5ICggcnVuLmFzX2hhbGZvcGVuKCkgZm9yIHJ1biBpbiBydW5zIClcbiAgICAgIHJ1bnMubGVuZ3RoID0gMFxuICAgICAgZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgICBydW4gPSBSdW4uZnJvbV9oYWxmb3BlbiBoYWxmb3BlblxuICAgICAgICAjIyMgVEFJTlQgdXNlIEFQSSAjIyNcbiAgICAgICAgcnVuLnJvd2lkICAgPSBAaG9hcmQuX2dldF9uZXh0X3J1bl9yb3dpZCgpXG4gICAgICAgIHJ1bi5zY2F0dGVyID0gIEByb3dpZFxuICAgICAgICBydW5zLnB1c2ggZnJlZXplIHJ1blxuICAgICAgO251bGxcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgQG5vcm1hbGl6ZSgpXG4gICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHN3aXRjaCB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+IHJ1bi5jb250YWlucyBwcm9iZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gKCBydW4uY29udGFpbnMgcHJvYmUubG8gKSBhbmQgKCBydW4uY29udGFpbnMgcHJvYmUuaGkgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLm1pbiA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUubWF4IDw9IG1heCApXG4gICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgcmV0dXJuIHRydWVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2FyZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIEBnYXBzID0gW11cbiAgICBAaGl0cyA9IFtdXG4gICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCBydW5fcm93aWQ6IDAsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmNyZWF0ZV9ydW4sIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICMgZGVidWcgJ86paW1fX18xJywgeyBsbywgaGksIGNmZywgfVxuICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgIHJldHVybiBuZXcgUnVuIEBfZ2V0X2hpX2FuZF9sbyBjZmdcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfbmV4dF9ydW5fcm93aWQ6IC0+IEBzdGF0ZS5ydW5fcm93aWQrKzsgXCJ0OmhyZDpydW5zLFI9I3tAc3RhdGUucnVuX3Jvd2lkfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhZGRfc2NhdHRlcjogKCBQLi4uICkgLT5cbiAgICBSID0gbmV3IFNjYXR0ZXIgQCwgUC4uLlxuICAgIEBzY2F0dGVycy5wdXNoIFJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6IC0+XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBnZXRfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgIFQucG9pbnQudmFsaWRhdGUgcG9pbnRcbiAgICBSID0gW11cbiAgICBmb3Igc2NhdHRlciBpbiBAc2NhdHRlcnNcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBzY2F0dGVyLmNvbnRhaW5zIHBvaW50XG4gICAgICBSLnB1c2ggc2NhdHRlci5kYXRhXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN1bW1hcml6ZV9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgUiA9IEBnZXRfZGF0YV9mb3JfcG9pbnQgcG9pbnRcbiAgICByZXR1cm4gbnVsbCBpZiBSLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIEBfc3VtbWFyaXplX2RhdGEgUi4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3N1bW1hcml6ZV9kYXRhOiAoIGl0ZW1zLi4uICkgLT5cbiAgICBpdGVtcyA9IGl0ZW1zLmZsYXQoKVxuICAgIFIgICAgID0ge31cbiAgICBrZXlzICA9IFsgKCBuZXcgU2V0ICgga2V5IGZvciBrZXkgb2YgaXRlbSBmb3IgaXRlbSBpbiBpdGVtcyApLmZsYXQoKSApLi4uLCBdLnNvcnQoKVxuICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgdmFsdWVzICAgID0gKCB2YWx1ZSBmb3IgaXRlbSBpbiBpdGVtcyB3aGVuICggdmFsdWUgPSBpdGVtWyBrZXkgXSApPyApXG4gICAgICBSWyBrZXkgXSAgPSAoIEBbIFwic3VtbWFyaXplX2RhdGFfI3trZXl9XCIgXSA/ICggKCB4ICkgLT4geCApICkuY2FsbCBALCB2YWx1ZXNcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfdGFnczogKCB2YWx1ZXMgKSAtPiBzdW1tYXJpemVfZGF0YS5hc191bmlxdWVfc29ydGVkIHZhbHVlc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICByZXR1cm4geyBsbzogKCBAX2Nhc3RfYm91bmQgY2ZnLmxvICksIGhpOiAoIEBfY2FzdF9ib3VuZCBjZmcuaGkgPyBjZmcubG8gKSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2Nhc3RfYm91bmQ6ICggYm91bmQgKSAtPlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgd2hlbiAnZmxvYXQnXG4gICAgICAgIHVubGVzcyBOdW1iZXIuaXNJbnRlZ2VyIGJvdW5kXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzUgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICBSID0gYm91bmRcbiAgICAgIHdoZW4gJ3RleHQnXG4gICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX182IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX183ICN7YXNfaGV4IFJ9IGlzIG5vdCBiZXR3ZWVuICN7YXNfaGV4IEBjZmcuZmlyc3R9IGFuZCAje2FzX2hleCBAY2ZnLmxhc3R9XCJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogLT5cbiAgICBSID0ge31cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaHJkX2FzX2xvaGlfaGV4OlxuICAgICAgbmFtZTogJ2hyZF9hc19sb2hpX2hleCdcbiAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+IFwiKCN7bG8udG9TdHJpbmcgMTZ9LCN7aGkudG9TdHJpbmcgMTZ9KVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAYnVpbGQ6IC0+XG4gICAgUiA9IFtdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfc2NhdHRlcnMgKFxuICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgaXNfaGl0ICAgIGJvb2xlYW4gICAgICAgICBub3QgbnVsbCBkZWZhdWx0IGZhbHNlLFxuICAgICAgICAgIGRhdGEgICAgICBqc29uICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCdcbiAgICAgICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICBjcmVhdGUgdGFibGUgaHJkX2hvYXJkX3J1bnMgKFxuICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgbG8gICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICBoaSAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIHNjYXR0ZXIgICB0ZXh0ICAgICAgICAgICAgbm90IG51bGwsXG4gICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgZm9yZWlnbiBrZXkgKCBzY2F0dGVyICkgcmVmZXJlbmNlcyBocmRfaG9hcmRfc2NhdHRlcnMgKCByb3dpZCApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggcm93aWQgcmVnZXhwICN7TElUIGNmZy5ydW5zX3Jvd2lkX3JlZ2V4cCB9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEwXCIgY2hlY2sgKCBsbyBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggaGkgYmV0d2VlbiAje0xJVCBjZmcuZmlyc3RfcG9pbnR9IGFuZCAje0xJVCBjZmcubGFzdF9wb2ludH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTJcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgLS0gY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTNcIiBjaGVjayAoIHJvd2lkIHJlZ2V4cCAnXi4qJCcgKVxuICAgICAgICApO1wiXCJcIlxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBzdGF0ZW1lbnRzOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLmluc2VydF9ocmRfaG9hcmRfc2NhdHRlcl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfc2NhdHRlcnMgKCByb3dpZCwgaXNfaGl0LCBkYXRhICkgdmFsdWVzIChcbiAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5zY2F0dGVyc19yb3dpZF90ZW1wbGF0ZX0sIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSggJ2hyZF9zZXFfaG9hcmRfc2NhdHRlcnMnICkgKSxcbiAgICAgICAgICAkaXNfaGl0LFxuICAgICAgICAgICRkYXRhIClcbiAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9ydW5fdiA9IFNRTFwiXCJcIlxuICAgICAgaW5zZXJ0IGludG8gaHJkX2hvYXJkX3J1bnMgKCByb3dpZCwgbG8sIGhpLCBzY2F0dGVyICkgdmFsdWVzIChcbiAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5ydW5zX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9ydW5zJyApICksXG4gICAgICAgICAgJGxvLFxuICAgICAgICAgICRoaSxcbiAgICAgICAgICAkc2NhdHRlciApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IFJ1biwgU2NhdHRlciwgdGVtcGxhdGVzLCBJRk4sIH1cbiAgcmV0dXJuIHtcbiAgICBIb2FyZCxcbiAgICBzdW1tYXJpemVfZGF0YSxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
