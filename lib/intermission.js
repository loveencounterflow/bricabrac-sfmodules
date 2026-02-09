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
      lo: 0,
      hi: null
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

  Run = (function() {
    //===========================================================================================================
    class Run {
      //---------------------------------------------------------------------------------------------------------
      constructor(...P) {
        this._constructor(...P);
      }

      //---------------------------------------------------------------------------------------------------------
      toString(base = 10) {
        if (base === 16) {
          return `{ lo: ${as_hex(this.lo)}, ${as_hex(this.hi)}, }`;
        }
        return `{ lo: ${this.lo.toString(base)}, ${this.hi.toString(base)}, }`;
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

    Run.prototype._constructor = nfa({
      template: templates.run_cfg
    }, function(lo, hi, cfg) {
      T.point.validate(lo);
      T.point.validate(hi != null ? hi : hi = lo);
      /* TAINT should be covered by typing */
      if (!(lo <= hi)) {
        throw new Error(`Ωim___1 lo must be less than or equal to hi, got lo: ${lo}, hi: ${hi}`);
      }
      set_readonly(this, 'lo', lo);
      set_readonly(this, 'hi', hi);
      set_hidden_readonly(this, 'size', hi - lo + 1);
      return void 0;
    });

    return Run;

  }).call(this);

  Scatter = (function() {
    //===========================================================================================================
    class Scatter {
      //---------------------------------------------------------------------------------------------------------
      constructor(hoard, data = null, {rowid, is_normalized} = {}) {
        /* TAINT validate */
        set_readonly(this, 'data', data != null ? freeze(data) : data);
        set_readonly(this, 'rowid', rowid != null ? rowid : `t:hrd:scatters,R=${hoard.scatters.length + 1}`);
        // set_readonly @, 'runs', freeze []
        this.runs = freeze([]);
        hide(this, 'hoard', hoard);
        hide(this, 'state', {
          is_normalized: is_normalized != null ? is_normalized : false
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
        /* TAINT preliminary solution; handling of out-of-bound runs should be configurable */
        var first, last, ref, ref1;
        ({first, last} = this.hoard.cfg);
        if (!(((first <= (ref = run.lo) && ref <= last)) && ((first <= (ref1 = run.hi) && ref1 <= last)))) {
          throw new Error(`Ωim___1 expected run to be entirely between ${as_hex(first)} and ${as_hex(last)}, ` + `got ${run.toString(16)}`);
        }
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
        this._insert(new Run(...P));
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      add_codepoints_of(...texts) {
        var chr, results;
        results = [];
        for (chr of new Set(texts.join(''))) {
          results.push(this.add_run(chr.codePointAt(0)));
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

  //===========================================================================================================
  Hoard = class Hoard {
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
    contains(...P) {
      return this.scatters.some(function(scatter) {
        return scatter.contains(...P);
      });
    }

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
  constraint "Ωconstraint___2" check ( rowid regexp ${LIT(cfg.runs_rowid_regexp)} ),
  constraint "Ωconstraint___3" check ( lo between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint___4" check ( hi between ${LIT(cfg.first_point)} and ${LIT(cfg.last_point)} ),
  constraint "Ωconstraint___5" check ( lo <= hi )
  -- constraint "Ωconstraint___6" check ( rowid regexp '^.*$' )
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

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = Object.freeze({Run, Scatter, templates, IFN, lets});
    return {Hoard, Scatter, Run, summarize_data, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENB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QUMsQ0FBQywwQkFBRixHQUErQixHQUFHLENBQUE7WUFBQSxDQUFBLENBRWxCLEdBQUEsQ0FBSSxHQUFHLENBQUMsdUJBQVIsQ0FGa0IsQ0FBQTs7O2NBQUEsRUFIdEM7O01BV0ksQ0FBQyxDQUFDLHNCQUFGLEdBQTJCLEdBQUcsQ0FBQTtZQUFBLENBQUEsQ0FFZCxHQUFBLENBQUksR0FBRyxDQUFDLG1CQUFSLENBRmMsQ0FBQTs7O2VBQUEsRUFYbEM7O0FBbUJJLGFBQU87SUFwQkk7O0VBOUZmLEVBalBBOzs7RUFzV0EsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFGLEVBQU8sT0FBUCxFQUFnQixTQUFoQixFQUEyQixHQUEzQixFQUFnQyxJQUFoQyxDQUFkO0FBQ1osV0FBTyxDQUNMLEtBREssRUFFTCxPQUZLLEVBR0wsR0FISyxFQUlMLGNBSkssRUFLTCxTQUxLO0VBRlcsQ0FBQTtBQXRXcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbklGTiAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLy4uL2RlcGVuZGVuY2llcy9pbnRlcnZhbHMtZm4tbGliLmpzJ1xueyBULCAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vaW50ZXJtaXNzaW9uLXR5cGVzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IGhpZGUsXG4gIHNldF9yZWFkb25seSxcbiAgc2V0X2hpZGRlbl9yZWFkb25seSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBycHIsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgZGVwbG95LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfZGVwbG95KClcbiMgeyBnZXRfc2hhMXN1bTdkLCAgICAgICAgfSA9IHJlcXVpcmUgJy4vc2hhc3VtJ1xueyBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBTUUwsXG4gIExJVCxcbiAgSUROLFxuICBWRUMsICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFRBSU5UIG1vdmUgdG8gZGVkaWNhdGVkIG1vZHVsZSAjIyNcbiMjIyBOT1RFIG5vdCB1c2luZyBgbGV0c2ZyZWV6ZXRoYXRgIHRvIGF2b2lkIGlzc3VlIHdpdGggZGVlcC1mcmVlemluZyBgUnVuYCBpbnN0YW5jZXMgIyMjXG5sZXRzID0gKCBvcmlnaW5hbCwgbW9kaWZpZXIgPSBudWxsICkgLT5cbiAgZHJhZnQgPSBpZiBBcnJheS5pc0FycmF5IHRoZW4gWyBvcmlnaW5hbC4uLiwgXSBlbHNlIHsgb3JpZ2luYWwuLi4sIH1cbiAgbW9kaWZpZXIgZHJhZnRcbiAgcmV0dXJuIGZyZWV6ZSBkcmFmdFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcnVuX2NmZzpcbiAgICBsbzogICAgICAgICAwXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHNjYXR0ZXJfY2ZnOlxuICAgIGhvYXJkOiAgICAgIG51bGxcbiAgICBkYXRhOiAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgc2NhdHRlcl9hZGQ6XG4gICAgbG86ICAgICAgICAgbnVsbFxuICAgIGhpOiAgICAgICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBob2FyZF9jZmc6XG4gICAgZmlyc3Q6ICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdDogICAgICAgMHgxMF9mZmZmXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgcnVuc19yb3dpZF9yZWdleHA6ICAgICAgICAnMHgwMF8wMDAwJ1xuICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdF9wb2ludDogICAgICAgICAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfaW5zZXJ0X3N0YXRlbWVudHM6XG4gICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICBydW5zX3Jvd2lkX3RlbXBsYXRlOiAgICAgICdydW4tJWQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X3VkZnM6IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYXNfaGV4ID0gKCBuICkgLT5cbiAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuc3VtbWFyaXplX2RhdGEgPVxuICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBSdW5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLnJ1bl9jZmcsIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgIFQucG9pbnQudmFsaWRhdGUgbG9cbiAgICBULnBvaW50LnZhbGlkYXRlIGhpID89IGxvXG4gICAgIyMjIFRBSU5UIHNob3VsZCBiZSBjb3ZlcmVkIGJ5IHR5cGluZyAjIyNcbiAgICB1bmxlc3MgbG8gPD0gaGlcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX18xIGxvIG11c3QgYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGhpLCBnb3QgbG86ICN7bG99LCBoaTogI3toaX1cIlxuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2xvJywgICBsb1xuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2hpJywgICBoaVxuICAgIHNldF9oaWRkZW5fcmVhZG9ubHkgQCwgJ3NpemUnLCBoaSAtIGxvICsgMVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRvU3RyaW5nOiAoIGJhc2UgPSAxMCApIC0+XG4gICAgcmV0dXJuIFwieyBsbzogI3thc19oZXggQGxvfSwgI3thc19oZXggQGhpfSwgfVwiIGlmIGJhc2UgaXMgMTZcbiAgICByZXR1cm4gXCJ7IGxvOiAje0Bsby50b1N0cmluZyBiYXNlfSwgI3tAaGkudG9TdHJpbmcgYmFzZX0sIH1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gWyBAbG8gLi4gQGhpIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgIHJldHVybiB0cnVlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTY2F0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgZGF0YSA9IG51bGwsIHsgcm93aWQsIGlzX25vcm1hbGl6ZWQsIH09e30gKSAtPlxuICAgICMjIyBUQUlOVCB2YWxpZGF0ZSAjIyNcbiAgICBzZXRfcmVhZG9ubHkgQCwgJ2RhdGEnLCBpZiBkYXRhPyB0aGVuIGZyZWV6ZSBkYXRhIGVsc2UgZGF0YVxuICAgIHNldF9yZWFkb25seSBALCAncm93aWQnLCByb3dpZCA/IFwidDpocmQ6c2NhdHRlcnMsUj0je2hvYXJkLnNjYXR0ZXJzLmxlbmd0aCArIDF9XCJcbiAgICAjIHNldF9yZWFkb25seSBALCAncnVucycsIGZyZWV6ZSBbXVxuICAgIEBydW5zID0gZnJlZXplIFtdXG4gICAgaGlkZSBALCAnaG9hcmQnLCAgaG9hcmRcbiAgICBoaWRlIEAsICdzdGF0ZScsICB7IGlzX25vcm1hbGl6ZWQ6IGlzX25vcm1hbGl6ZWQgPyBmYWxzZSwgfVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEB3YWxrKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6IC0+XG4gICAgQG5vcm1hbGl6ZSgpXG4gICAgeWllbGQgZnJvbSBydW4gZm9yIHJ1biBpbiBAcnVuc1xuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgc2V0X2dldHRlciBAOjosICdwb2ludHMnLCAtPiBbIEAuLi4sIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWluJywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgIHJldHVybiBNYXRoLm1pbiAoIHJ1bi5sbyBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IC0xICkuaGkgaWYgQGlzX25vcm1hbGl6ZWRcbiAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgICMjIyBUQUlOVCBwcmVsaW1pbmFyeSBzb2x1dGlvbjsgaGFuZGxpbmcgb2Ygb3V0LW9mLWJvdW5kIHJ1bnMgc2hvdWxkIGJlIGNvbmZpZ3VyYWJsZSAjIyNcbiAgICB7IGZpcnN0LCBsYXN0LCB9ID0gQGhvYXJkLmNmZ1xuICAgIHVubGVzcyAoIGZpcnN0IDw9IHJ1bi5sbyA8PSBsYXN0ICkgYW5kICggZmlyc3QgPD0gcnVuLmhpIDw9IGxhc3QgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzEgZXhwZWN0ZWQgcnVuIHRvIGJlIGVudGlyZWx5IGJldHdlZW4gI3thc19oZXggZmlyc3R9IGFuZCAje2FzX2hleCBsYXN0fSwgXCIgXFxcbiAgICAgICAgKyBcImdvdCAje3J1bi50b1N0cmluZyAxNn1cIlxuICAgIEBydW5zID0gbGV0cyBAcnVucywgKCBydW5zICkgPT4gcnVucy5wdXNoIHJ1blxuICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gZmFsc2VcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3NvcnRfcnVuczogKCBydW5zICkgLT5cbiAgICBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgcmV0dXJuICAwXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9ydW46ICggUC4uLiApIC0+XG4gICAgQF9pbnNlcnQgbmV3IFJ1biBQLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gKCBjaHIuY29kZVBvaW50QXQgMCApIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZTogKCBmb3JjZSA9IGZhbHNlICkgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAaXNfbm9ybWFsaXplZCBhbmQgKCBub3QgZm9yY2UgKVxuICAgIEBydW5zID0gbGV0cyBAcnVucywgKCBydW5zICkgPT5cbiAgICAgIEBfc29ydF9ydW5zIHJ1bnNcbiAgICAgIGhhbGZvcGVucyAgID0gSUZOLnNpbXBsaWZ5ICggcnVuLmFzX2hhbGZvcGVuKCkgZm9yIHJ1biBpbiBydW5zIClcbiAgICAgIHJ1bnMubGVuZ3RoID0gMFxuICAgICAgZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgICAgICBydW4gPSBSdW4uZnJvbV9oYWxmb3BlbiBoYWxmb3BlblxuICAgICAgICAjIyMgVEFJTlQgdXNlIEFQSSAjIyNcbiAgICAgICAgcnVuLnJvd2lkICAgPSBAaG9hcmQuX2dldF9uZXh0X3J1bl9yb3dpZCgpXG4gICAgICAgIHJ1bi5zY2F0dGVyID0gIEByb3dpZFxuICAgICAgICBydW5zLnB1c2ggZnJlZXplIHJ1blxuICAgICAgO251bGxcbiAgICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgQG5vcm1hbGl6ZSgpXG4gICAgeyBtaW4sIG1heCwgfSA9IEBtaW5tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHN3aXRjaCB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gTnVtYmVyLmlzRmluaXRlIHByb2JlXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+IHJ1bi5jb250YWlucyBwcm9iZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubG8gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLmhpIDw9IG1heCApXG4gICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gKCBydW4uY29udGFpbnMgcHJvYmUubG8gKSBhbmQgKCBydW4uY29udGFpbnMgcHJvYmUuaGkgKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgU2NhdHRlclxuICAgICAgICBwcm9iZS5ub3JtYWxpemUoKSB1bmxlc3MgcHJvYmUuaXNfbm9ybWFsaXplZFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLm1pbiA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUubWF4IDw9IG1heCApXG4gICAgICAgIHJldHVybiBwcm9iZS5ydW5zLmV2ZXJ5ICggcnVuICkgPT4gQGNvbnRhaW5zIHJ1blxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICggdHlwZV9vZiBwcm9iZSApIGlzICd0ZXh0J1xuICAgICAgICBwcm9iZSA9ICggY2hyLmNvZGVQb2ludEF0IDAgZm9yIGNociBpbiBBcnJheS5mcm9tIHByb2JlIClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBuIGZyb20gcHJvYmVcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJ1bnMuc29tZSAoIHJ1biApIC0+IHJ1bi5jb250YWlucyBuXG4gICAgcmV0dXJuIHRydWVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2FyZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIEBnYXBzID0gW11cbiAgICBAaGl0cyA9IFtdXG4gICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCBydW5fcm93aWQ6IDAsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPiBAc3RhdGUucnVuX3Jvd2lkKys7IFwidDpocmQ6cnVucyxSPSN7QHN0YXRlLnJ1bl9yb3dpZH1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgUiA9IG5ldyBTY2F0dGVyIEAsIFAuLi5cbiAgICBAc2NhdHRlcnMucHVzaCBSXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnRhaW5zOiAoIFAuLi4gKSAtPiBAc2NhdHRlcnMuc29tZSAoIHNjYXR0ZXIgKSAtPiBzY2F0dGVyLmNvbnRhaW5zIFAuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgIFIgPSBbXVxuICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgIFIucHVzaCBzY2F0dGVyLmRhdGFcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICBSID0gQGdldF9kYXRhX2Zvcl9wb2ludCBwb2ludFxuICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3VtbWFyaXplX2RhdGE6ICggaXRlbXMuLi4gKSAtPlxuICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgUiAgICAgPSB7fVxuICAgIGtleXMgID0gWyAoIG5ldyBTZXQgKCBrZXkgZm9yIGtleSBvZiBpdGVtIGZvciBpdGVtIGluIGl0ZW1zICkuZmxhdCgpICkuLi4sIF0uc29ydCgpXG4gICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgIFJbIGtleSBdICA9ICggQFsgXCJzdW1tYXJpemVfZGF0YV8je2tleX1cIiBdID8gKCAoIHggKSAtPiB4ICkgKS5jYWxsIEAsIHZhbHVlc1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBocmRfYXNfbG9oaV9oZXg6XG4gICAgICBuYW1lOiAnaHJkX2FzX2xvaGlfaGV4J1xuICAgICAgdmFsdWU6ICggbG8sIGhpICkgLT4gXCIoI3tsby50b1N0cmluZyAxNn0sI3toaS50b1N0cmluZyAxNn0pXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBidWlsZDogLT5cbiAgICBSID0gW11cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgY3JlYXRlIHRhYmxlIGhyZF9ob2FyZF9zY2F0dGVycyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJ1xuICAgICAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfcnVucyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBsbyAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgc2NhdHRlciAgIHRleHQgICAgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfX18yXCIgY2hlY2sgKCByb3dpZCByZWdleHAgI3tMSVQgY2ZnLnJ1bnNfcm93aWRfcmVnZXhwIH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBoaSBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X19fNVwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X19fNlwiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICk7XCJcIlwiXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHN0YXRlbWVudHM6IC0+XG4gICAgUiA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9zY2F0dGVyX3YgPSBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkLCBpc19oaXQsIGRhdGEgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnNjYXR0ZXJzX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9zY2F0dGVycycgKSApLFxuICAgICAgICAgICRpc19oaXQsXG4gICAgICAgICAgJGRhdGEgKVxuICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5pbnNlcnRfaHJkX2hvYXJkX3J1bl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfcnVucyAoIHJvd2lkLCBsbywgaGksIHNjYXR0ZXIgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnJ1bnNfcm93aWRfdGVtcGxhdGV9LCBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UoICdocmRfc2VxX2hvYXJkX3J1bnMnICkgKSxcbiAgICAgICAgICAkbG8sXG4gICAgICAgICAgJGhpLFxuICAgICAgICAgICRzY2F0dGVyICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgfVxuICByZXR1cm4ge1xuICAgIEhvYXJkLFxuICAgIFNjYXR0ZXIsXG4gICAgUnVuLFxuICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgIGludGVybmFscywgfVxuIl19
