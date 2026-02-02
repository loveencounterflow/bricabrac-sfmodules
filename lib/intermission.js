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
      normalize() {
        this.runs = lets(this.runs, (runs) => {
          var halfopen, halfopens, i, idx, len, run;
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
          for (idx = i = 0, len = halfopens.length; i < len; idx = ++i) {
            halfopen = halfopens[idx];
            run = Run.from_halfopen(halfopen);
            /* TAINT use API */
            set_readonly(run, 'rowid', `t:hrd:runs,R=${idx + 1}`);
            set_readonly(run, 'scatter', this.rowid);
            runs.push(run);
          }
          null;
          return this.state.is_normalized = true;
        });
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      contains(probe) {
        var chr, max, min, n, ref, ref1, ref2, ref3;
        if (!this.is_normalized) {
          this.normalize();
        }
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
          is_normalized: true
        });
        void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENB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O0FBQ3BCLFFBQUE7SUFBRSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUYsRUFBTyxPQUFQLEVBQWdCLFNBQWhCLEVBQTJCLEdBQTNCLENBQWQ7QUFDWixXQUFPLENBQ0wsS0FESyxFQUVMLGNBRkssRUFHTCxTQUhLO0VBRlcsQ0FBQTtBQXZYcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBycHIsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbiMjIyBOT1RFIG5vdCB1c2luZyBgbGV0c2ZyZWV6ZXRoYXRgIHRvIGF2b2lkIGlzc3VlIHdpdGggZGVlcC1mcmVlemluZyBgUnVuYCBpbnN0YW5jZXMgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcnVuX2NmZzpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2NmZzpcbiAgICBob2FyZDogICAgICBudWxsXG4gICAgZGF0YTogICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHNjYXR0ZXJfYWRkOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgaG9hcmRfY2ZnOlxuICAgIGZpcnN0OiAgICAgIDB4MDBfMDAwMFxuICAgIGxhc3Q6ICAgICAgIDB4MTBfZmZmZlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9ydW46XG4gICAgbG86ICAgICAgICAgbnVsbFxuICAgIGhpOiAgICAgICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfYnVpbGRfc3RhdGVtZW50czpcbiAgICBydW5zX3Jvd2lkX3JlZ2V4cDogICAgICAgICcweDAwXzAwMDAnXG4gICAgZmlyc3RfcG9pbnQ6ICAgICAgICAgICAgICAweDAwXzAwMDBcbiAgICBsYXN0X3BvaW50OiAgICAgICAgICAgICAgIDB4MTBfZmZmZlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGdldF9pbnNlcnRfc3RhdGVtZW50czpcbiAgICBzY2F0dGVyc19yb3dpZF90ZW1wbGF0ZTogICdzY2F0dGVyLSVkJ1xuICAgIHJ1bnNfcm93aWRfdGVtcGxhdGU6ICAgICAgJ3J1bi0lZCdcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfdWRmczoge31cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5hc19oZXggPSAoIG4gKSAtPlxuICBzaWduID0gaWYgbiA8IDAgdGhlbiAnLScgZWxzZSAnKydcbiAgcmV0dXJuIFwiI3tzaWdufTB4I3soIE1hdGguYWJzIG4gKS50b1N0cmluZyAxNn1cIlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBTdHJhdGVnaWVzIHRvIGJlIGFwcGxpZWQgdG8gc3VtbWFyaXplIGRhdGEgaXRlbXMgIyMjXG5zdW1tYXJpemVfZGF0YSA9XG4gIGFzX3VuaXF1ZV9zb3J0ZWQ6ICggdmFsdWVzICkgLT4gWyAoIG5ldyBTZXQgKCB2IGZvciB2IGluIHZhbHVlcy5mbGF0KCkgd2hlbiB2PyApLnNvcnQoKSApLi4uLCBdXG4gIGFzX2Jvb2xlYW5fYW5kOiAoIHZhbHVlcyApIC0+IHZhbHVlcy5yZWR1Y2UgKCAoIGFjYywgY3VyICkgLT4gYWNjIGFuZCBjdXIgPyBmYWxzZSApLCB0cnVlXG4gIGFzX2Jvb2xlYW5fb3I6ICAoIHZhbHVlcyApIC0+IHZhbHVlcy5yZWR1Y2UgKCAoIGFjYywgY3VyICkgLT4gYWNjIG9yICBjdXIgPyBmYWxzZSApLCBmYWxzZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFJ1blxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICh7IGxvLCBoaSwgfSkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHR5cGluZyAjIyNcbiAgICAjIHRocm93IG5ldyBFcnJvciBcIlwiXG4gICAgc2V0X3JlYWRvbmx5ICAgICAgICBALCAnbG8nLCAgIGxvXG4gICAgc2V0X3JlYWRvbmx5ICAgICAgICBALCAnaGknLCAgIGhpXG4gICAgc2V0X2hpZGRlbl9yZWFkb25seSBALCAnc2l6ZScsIGhpIC0gbG8gKyAxXG4gICAgO3VuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gWyBAbG8gLi4gQGhpIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgIHJldHVybiB0cnVlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTY2F0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgZGF0YSA9IG51bGwgKSAtPlxuICAgICMjIyBUQUlOVCB2YWxpZGF0ZSAjIyNcbiAgICBzZXRfcmVhZG9ubHkgQCwgJ2RhdGEnLCBpZiBkYXRhPyB0aGVuIGZyZWV6ZSBkYXRhIGVsc2UgZGF0YVxuICAgIHNldF9yZWFkb25seSBALCAncm93aWQnLCBcInQ6aHJkOnNjYXR0ZXJzLFI9I3tob2FyZC5zY2F0dGVycy5sZW5ndGggKyAxfVwiXG4gICAgIyBzZXRfcmVhZG9ubHkgQCwgJ3J1bnMnLCBmcmVlemUgW11cbiAgICBAcnVucyA9IGZyZWV6ZSBbXVxuICAgIGhpZGUgQCwgJ2hvYXJkJywgIGhvYXJkXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiBmYWxzZSwgfVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEB3YWxrKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6IC0+XG4gICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdpc19ub3JtYWxpemVkJywgIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG4gIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG4gICAgIyBwb2ludHMgPSBuZXcgU2V0IFsgKCBbIHJ1bi4uLiwgXSBmb3IgcnVuIGluIEBydW5zICkuLi4sIF0uZmxhdCgpXG4gICAgIyByZXR1cm4gWyBwb2ludHMuLi4sIF0uc29ydCAoIGEsIGIgKSAtPlxuICAgICMgICByZXR1cm4gKzEgaWYgYSA+IGJcbiAgICAjICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgIyAgIHJldHVybiAgMFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtaW4nLCAtPlxuICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuICggQHJ1bnMuYXQgMCApLmxvIGlmIEBpc19ub3JtYWxpemVkXG4gICAgcmV0dXJuIE1hdGgubWluICggcnVuLmxvIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtYXgnLCAtPlxuICAgIHJldHVybiBudWxsIGlmIEBydW5zLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuICggQHJ1bnMuYXQgLTEgKS5oaSBpZiBAaXNfbm9ybWFsaXplZFxuICAgIHJldHVybiBNYXRoLm1heCAoIHJ1bi5oaSBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWlubWF4JywgLT4geyBtaW46IEBtaW4sIG1heDogQG1heCwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2luc2VydDogKCBydW4gKSAtPlxuICAgICMjIyBOT1RFIHRoaXMgcHJpdmF0ZSBBUEkgcHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gaW1wbGVtZW50IGFsd2F5cy1vcmRlcmVkIHJ1bnM7IGhvd2V2ZXIgd2Ugb3B0IGZvclxuICAgIHNvcnRpbmcgYWxsIHJhbmdlcyB3aGVuIG5lZWRlZCBieSBhIG1ldGhvZCBsaWtlIGBTY2F0dGVyOjpub3JtYWxpemUoKWAgIyMjXG4gICAgQHJ1bnMgPSBsZXRzIEBydW5zLCAoIHJ1bnMgKSA9PiBydW5zLnB1c2ggcnVuXG4gICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc29ydF9ydW5zOiAoIHJ1bnMgKSAtPlxuICAgIHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICByZXR1cm4gIDBcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3J1bjogKCBQLi4uICkgLT5cbiAgICBAX2luc2VydCBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gY2hyIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZTogLT5cbiAgICBAcnVucyA9IGxldHMgQHJ1bnMsICggcnVucyApID0+XG4gICAgICBAX3NvcnRfcnVucyBydW5zXG4gICAgICBoYWxmb3BlbnMgICA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gcnVucyApXG4gICAgICBydW5zLmxlbmd0aCA9IDBcbiAgICAgIGZvciBoYWxmb3BlbiwgaWR4IGluIGhhbGZvcGVuc1xuICAgICAgICBydW4gPSBSdW4uZnJvbV9oYWxmb3BlbiBoYWxmb3BlblxuICAgICAgICAjIyMgVEFJTlQgdXNlIEFQSSAjIyNcbiAgICAgICAgc2V0X3JlYWRvbmx5IHJ1biwgJ3Jvd2lkJywgICAgXCJ0OmhyZDpydW5zLFI9I3tpZHggKyAxfVwiXG4gICAgICAgIHNldF9yZWFkb25seSBydW4sICdzY2F0dGVyJywgIEByb3dpZFxuICAgICAgICBydW5zLnB1c2ggcnVuXG4gICAgICA7bnVsbFxuICAgICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSB0cnVlXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnRhaW5zOiAoIHByb2JlICkgLT5cbiAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHN3aXRjaCB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+IHJ1bi5jb250YWlucyBwcm9iZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gKCBydW4uY29udGFpbnMgcHJvYmUubG8gKSBhbmQgKCBydW4uY29udGFpbnMgcHJvYmUuaGkgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLm1pbiA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUubWF4IDw9IG1heCApXG4gICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgcmV0dXJuIHRydWVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2FyZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIEBnYXBzID0gW11cbiAgICBAaGl0cyA9IFtdXG4gICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgO3VuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3J1bjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5jcmVhdGVfcnVuLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAjIGRlYnVnICfOqWltX19fMScsIHsgbG8sIGhpLCBjZmcsIH1cbiAgICAjIGRlYnVnICfOqWltX19fMicsIEBfZ2V0X2hpX2FuZF9sbyBjZmdcbiAgICByZXR1cm4gbmV3IFJ1biBAX2dldF9oaV9hbmRfbG8gY2ZnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhZGRfc2NhdHRlcjogKCBQLi4uICkgLT5cbiAgICBSID0gbmV3IFNjYXR0ZXIgQCwgUC4uLlxuICAgIEBzY2F0dGVycy5wdXNoIFJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6IC0+XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBnZXRfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgIFQucG9pbnQudmFsaWRhdGUgcG9pbnRcbiAgICBSID0gW11cbiAgICBmb3Igc2NhdHRlciBpbiBAc2NhdHRlcnNcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBzY2F0dGVyLmNvbnRhaW5zIHBvaW50XG4gICAgICBSLnB1c2ggc2NhdHRlci5kYXRhXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN1bW1hcml6ZV9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgUiA9IEBnZXRfZGF0YV9mb3JfcG9pbnQgcG9pbnRcbiAgICByZXR1cm4gbnVsbCBpZiBSLmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIEBfc3VtbWFyaXplX2RhdGEgUi4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3N1bW1hcml6ZV9kYXRhOiAoIGl0ZW1zLi4uICkgLT5cbiAgICBpdGVtcyA9IGl0ZW1zLmZsYXQoKVxuICAgIFIgICAgID0ge31cbiAgICBrZXlzICA9IFsgKCBuZXcgU2V0ICgga2V5IGZvciBrZXkgb2YgaXRlbSBmb3IgaXRlbSBpbiBpdGVtcyApLmZsYXQoKSApLi4uLCBdLnNvcnQoKVxuICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgdmFsdWVzICAgID0gKCB2YWx1ZSBmb3IgaXRlbSBpbiBpdGVtcyB3aGVuICggdmFsdWUgPSBpdGVtWyBrZXkgXSApPyApXG4gICAgICBSWyBrZXkgXSAgPSAoIEBbIFwic3VtbWFyaXplX2RhdGFfI3trZXl9XCIgXSA/ICggKCB4ICkgLT4geCApICkuY2FsbCBALCB2YWx1ZXNcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfdGFnczogKCB2YWx1ZXMgKSAtPiBzdW1tYXJpemVfZGF0YS5hc191bmlxdWVfc29ydGVkIHZhbHVlc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9oaV9hbmRfbG86ICggY2ZnICkgLT5cbiAgICByZXR1cm4geyBsbzogKCBAX2Nhc3RfYm91bmQgY2ZnLmxvICksIGhpOiAoIEBfY2FzdF9ib3VuZCBjZmcuaGkgPyBjZmcubG8gKSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2Nhc3RfYm91bmQ6ICggYm91bmQgKSAtPlxuICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBib3VuZFxuICAgICAgd2hlbiAnZmxvYXQnXG4gICAgICAgIHVubGVzcyBOdW1iZXIuaXNJbnRlZ2VyIGJvdW5kXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzUgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICBSID0gYm91bmRcbiAgICAgIHdoZW4gJ3RleHQnXG4gICAgICAgIFIgPSBib3VuZC5jb2RlUG9pbnRBdCAwXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX182IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgKCBAY2ZnLmZpcnN0IDw9IFIgPD0gQGNmZy5sYXN0IClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX183ICN7YXNfaGV4IFJ9IGlzIG5vdCBiZXR3ZWVuICN7YXNfaGV4IEBjZmcuZmlyc3R9IGFuZCAje2FzX2hleCBAY2ZnLmxhc3R9XCJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogLT5cbiAgICBSID0ge31cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaHJkX2FzX2xvaGlfaGV4OlxuICAgICAgbmFtZTogJ2hyZF9hc19sb2hpX2hleCdcbiAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+IFwiKCN7bG8udG9TdHJpbmcgMTZ9LCN7aGkudG9TdHJpbmcgMTZ9KVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAYnVpbGQ6IC0+XG4gICAgUiA9IFtdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfc2NhdHRlcnMgKFxuICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgaXNfaGl0ICAgIGJvb2xlYW4gICAgICAgICBub3QgbnVsbCBkZWZhdWx0IGZhbHNlLFxuICAgICAgICAgIGRhdGEgICAgICBqc29uICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCdcbiAgICAgICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICBjcmVhdGUgdGFibGUgaHJkX2hvYXJkX3J1bnMgKFxuICAgICAgICAgIHJvd2lkICAgICB0ZXh0ICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgbG8gICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICBoaSAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIHNjYXR0ZXIgICB0ZXh0ICAgICAgICAgICAgbm90IG51bGwsXG4gICAgICAgIC0tIHByaW1hcnkga2V5ICggcm93aWQgKSxcbiAgICAgICAgZm9yZWlnbiBrZXkgKCBzY2F0dGVyICkgcmVmZXJlbmNlcyBocmRfaG9hcmRfc2NhdHRlcnMgKCByb3dpZCApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggcm93aWQgcmVnZXhwICN7TElUIGNmZy5ydW5zX3Jvd2lkX3JlZ2V4cCB9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEwXCIgY2hlY2sgKCBsbyBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMVwiIGNoZWNrICggaGkgYmV0d2VlbiAje0xJVCBjZmcuZmlyc3RfcG9pbnR9IGFuZCAje0xJVCBjZmcubGFzdF9wb2ludH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTJcIiBjaGVjayAoIGxvIDw9IGhpIClcbiAgICAgICAgLS0gY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTNcIiBjaGVjayAoIHJvd2lkIHJlZ2V4cCAnXi4qJCcgKVxuICAgICAgICApO1wiXCJcIlxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBzdGF0ZW1lbnRzOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLmluc2VydF9ocmRfaG9hcmRfc2NhdHRlcl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfc2NhdHRlcnMgKCByb3dpZCwgaXNfaGl0LCBkYXRhICkgdmFsdWVzIChcbiAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5zY2F0dGVyc19yb3dpZF90ZW1wbGF0ZX0sIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSggJ2hyZF9zZXFfaG9hcmRfc2NhdHRlcnMnICkgKSxcbiAgICAgICAgICAkaXNfaGl0LFxuICAgICAgICAgICRkYXRhIClcbiAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9ydW5fdiA9IFNRTFwiXCJcIlxuICAgICAgaW5zZXJ0IGludG8gaHJkX2hvYXJkX3J1bnMgKCByb3dpZCwgbG8sIGhpLCBzY2F0dGVyICkgdmFsdWVzIChcbiAgICAgICAgICBwcmludGYoICN7TElUIGNmZy5ydW5zX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9ydW5zJyApICksXG4gICAgICAgICAgJGxvLFxuICAgICAgICAgICRoaSxcbiAgICAgICAgICAkc2NhdHRlciApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IFJ1biwgU2NhdHRlciwgdGVtcGxhdGVzLCBJRk4sIH1cbiAgcmV0dXJuIHtcbiAgICBIb2FyZCxcbiAgICBzdW1tYXJpemVfZGF0YSxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
