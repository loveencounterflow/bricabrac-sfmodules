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

  ({
    inspect: rpr
  } = require('node:util'));

  // { rpr,                  } = ( require './loupe-brics' ).require_loupe()
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
        return this.contains_number(probe);
      }

      //---------------------------------------------------------------------------------------------------------
      contains_number(probe) {
        var max, min;
        this.normalize();
        T.point.validate(probe);
        ({min, max} = this.minmax);
        if (!((min <= probe && probe <= max))) {
          return false;
        }
        return this.runs.some((run) => {
          return run.contains(probe);
        });
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
    internals = Object.freeze({
      Run,
      Scatter,
      templates,
      IFN,
      lets,
      typespace: T
    });
    return {Hoard, Scatter, Run, summarize_data, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxPQUFBOzs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBQ0EsR0FBQSxHQUE0QixPQUFBLENBQVEsdUNBQVI7O0VBQzVCLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLHNCQUFSLENBQTVCLEVBUEE7OztFQVNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFlBREYsRUFFRSxtQkFGRixFQUdFLFVBSEYsQ0FBQSxHQUc0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENB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RyxDQUFDLG1CQUFSLENBRmMsQ0FBQTs7O2VBQUEsRUFYbEM7O0FBbUJJLGFBQU87SUFwQkk7O0VBOUZmLEVBbk9BOzs7RUF3VkEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBO0lBQUUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWM7TUFBRSxHQUFGO01BQU8sT0FBUDtNQUFnQixTQUFoQjtNQUEyQixHQUEzQjtNQUFnQyxJQUFoQztNQUFzQyxTQUFBLEVBQVc7SUFBakQsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxLQURLLEVBRUwsT0FGSyxFQUdMLEdBSEssRUFJTCxjQUpLLEVBS0wsU0FMSztFQUZXLENBQUE7QUF4VnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfcmVhZG9ubHksXG4gIHNldF9oaWRkZW5fcmVhZG9ubHksXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgaW5zcGVjdDogcnByLCAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG4jIHsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IGRlcGxveSwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2RlcGxveSgpXG4jIHsgZ2V0X3NoYTFzdW03ZCwgICAgICAgIH0gPSByZXF1aXJlICcuL3NoYXN1bSdcbnsgRGJyaWMsXG4gIERicmljX3N0ZCxcbiAgU1FMLFxuICBMSVQsXG4gIElETixcbiAgVkVDLCAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljJ1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBUQUlOVCBtb3ZlIHRvIGRlZGljYXRlZCBtb2R1bGUgIyMjXG4jIyMgTk9URSBub3QgdXNpbmcgYGxldHNmcmVlemV0aGF0YCB0byBhdm9pZCBpc3N1ZSB3aXRoIGRlZXAtZnJlZXppbmcgYFJ1bmAgaW5zdGFuY2VzICMjI1xubGV0cyA9ICggb3JpZ2luYWwsIG1vZGlmaWVyID0gbnVsbCApIC0+XG4gIGRyYWZ0ID0gaWYgQXJyYXkuaXNBcnJheSB0aGVuIFsgb3JpZ2luYWwuLi4sIF0gZWxzZSB7IG9yaWdpbmFsLi4uLCB9XG4gIG1vZGlmaWVyIGRyYWZ0XG4gIHJldHVybiBmcmVlemUgZHJhZnRcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG50ZW1wbGF0ZXMgPVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHJ1bl9jZmc6XG4gICAgbG86ICAgICAgICAgMFxuICAgIGhpOiAgICAgICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2NmZzpcbiAgICBob2FyZDogICAgICBudWxsXG4gICAgZGF0YTogICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHNjYXR0ZXJfYWRkOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgaG9hcmRfY2ZnOlxuICAgIGZpcnN0OiAgICAgIDB4MDBfMDAwMFxuICAgIGxhc3Q6ICAgICAgIDB4MTBfZmZmZlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGdldF9idWlsZF9zdGF0ZW1lbnRzOlxuICAgIHJ1bnNfcm93aWRfcmVnZXhwOiAgICAgICAgJzB4MDBfMDAwMCdcbiAgICBmaXJzdF9wb2ludDogICAgICAgICAgICAgIDB4MDBfMDAwMFxuICAgIGxhc3RfcG9pbnQ6ICAgICAgICAgICAgICAgMHgxMF9mZmZmXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2luc2VydF9zdGF0ZW1lbnRzOlxuICAgIHNjYXR0ZXJzX3Jvd2lkX3RlbXBsYXRlOiAgJ3NjYXR0ZXItJWQnXG4gICAgcnVuc19yb3dpZF90ZW1wbGF0ZTogICAgICAncnVuLSVkJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGdldF91ZGZzOiB7fVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmFzX2hleCA9ICggbiApIC0+XG4gIHNpZ24gPSBpZiBuIDwgMCB0aGVuICctJyBlbHNlICcrJ1xuICByZXR1cm4gXCIje3NpZ259MHgjeyggTWF0aC5hYnMgbiApLnRvU3RyaW5nIDE2fVwiXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIFN0cmF0ZWdpZXMgdG8gYmUgYXBwbGllZCB0byBzdW1tYXJpemUgZGF0YSBpdGVtcyAjIyNcbnN1bW1hcml6ZV9kYXRhID1cbiAgYXNfdW5pcXVlX3NvcnRlZDogKCB2YWx1ZXMgKSAtPiBbICggbmV3IFNldCAoIHYgZm9yIHYgaW4gdmFsdWVzLmZsYXQoKSB3aGVuIHY/ICkuc29ydCgpICkuLi4sIF1cbiAgYXNfYm9vbGVhbl9hbmQ6ICggdmFsdWVzICkgLT4gdmFsdWVzLnJlZHVjZSAoICggYWNjLCBjdXIgKSAtPiBhY2MgYW5kIGN1ciA/IGZhbHNlICksIHRydWVcbiAgYXNfYm9vbGVhbl9vcjogICggdmFsdWVzICkgLT4gdmFsdWVzLnJlZHVjZSAoICggYWNjLCBjdXIgKSAtPiBhY2Mgb3IgIGN1ciA/IGZhbHNlICksIGZhbHNlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgUnVuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBQLi4uICkgLT4gQF9jb25zdHJ1Y3RvciBQLi4uXG4gIF9jb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5ydW5fY2ZnLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICBULnBvaW50LnZhbGlkYXRlIGxvXG4gICAgVC5wb2ludC52YWxpZGF0ZSBoaSA/PSBsb1xuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgY292ZXJlZCBieSB0eXBpbmcgIyMjXG4gICAgdW5sZXNzIGxvIDw9IGhpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fMSBsbyBtdXN0IGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byBoaSwgZ290IGxvOiAje2xvfSwgaGk6ICN7aGl9XCJcbiAgICBzZXRfcmVhZG9ubHkgICAgICAgIEAsICdsbycsICAgbG9cbiAgICBzZXRfcmVhZG9ubHkgICAgICAgIEAsICdoaScsICAgaGlcbiAgICBzZXRfaGlkZGVuX3JlYWRvbmx5IEAsICdzaXplJywgaGkgLSBsbyArIDFcbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0b1N0cmluZzogKCBiYXNlID0gMTAgKSAtPlxuICAgIHJldHVybiBcInsgbG86ICN7YXNfaGV4IEBsb30sICN7YXNfaGV4IEBoaX0sIH1cIiBpZiBiYXNlIGlzIDE2XG4gICAgcmV0dXJuIFwieyBsbzogI3tAbG8udG9TdHJpbmcgYmFzZX0sICN7QGhpLnRvU3RyaW5nIGJhc2V9LCB9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICByZXR1cm4gKCBAbG8gPD0gcHJvYmUubG8gPD0gQGhpICkgYW5kICggQGxvIDw9IHByb2JlLmhpIDw9IEBoaSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2NhdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggaG9hcmQsIGRhdGEgPSBudWxsLCB7IHJvd2lkLCBpc19ub3JtYWxpemVkLCB9PXt9ICkgLT5cbiAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgc2V0X3JlYWRvbmx5IEAsICdkYXRhJywgaWYgZGF0YT8gdGhlbiBmcmVlemUgZGF0YSBlbHNlIGRhdGFcbiAgICBzZXRfcmVhZG9ubHkgQCwgJ3Jvd2lkJywgcm93aWQgPyBcInQ6aHJkOnNjYXR0ZXJzLFI9I3tob2FyZC5zY2F0dGVycy5sZW5ndGggKyAxfVwiXG4gICAgIyBzZXRfcmVhZG9ubHkgQCwgJ3J1bnMnLCBmcmVlemUgW11cbiAgICBAcnVucyA9IGZyZWV6ZSBbXVxuICAgIGhpZGUgQCwgJ2hvYXJkJywgIGhvYXJkXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiBpc19ub3JtYWxpemVkID8gZmFsc2UsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAtPlxuICAgIEBub3JtYWxpemUoKVxuICAgIHlpZWxkIGZyb20gcnVuIGZvciBydW4gaW4gQHJ1bnNcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdpc19ub3JtYWxpemVkJywgIC0+IEBzdGF0ZS5pc19ub3JtYWxpemVkXG4gIHNldF9nZXR0ZXIgQDo6LCAncG9pbnRzJywgLT4gWyBALi4uLCBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gKCBAcnVucy5hdCAwICkubG8gaWYgQGlzX25vcm1hbGl6ZWRcbiAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21heCcsIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgcmV0dXJuIE1hdGgubWF4ICggcnVuLmhpIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtaW5tYXgnLCAtPiB7IG1pbjogQG1pbiwgbWF4OiBAbWF4LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgIyMjIE5PVEUgdGhpcyBwcml2YXRlIEFQSSBwcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBpbXBsZW1lbnQgYWx3YXlzLW9yZGVyZWQgcnVuczsgaG93ZXZlciB3ZSBvcHQgZm9yXG4gICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAjIyMgVEFJTlQgcHJlbGltaW5hcnkgc29sdXRpb247IGhhbmRsaW5nIG9mIG91dC1vZi1ib3VuZCBydW5zIHNob3VsZCBiZSBjb25maWd1cmFibGUgIyMjXG4gICAgeyBmaXJzdCwgbGFzdCwgfSA9IEBob2FyZC5jZmdcbiAgICB1bmxlc3MgKCBmaXJzdCA8PSBydW4ubG8gPD0gbGFzdCApIGFuZCAoIGZpcnN0IDw9IHJ1bi5oaSA8PSBsYXN0IClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX18xIGV4cGVjdGVkIHJ1biB0byBiZSBlbnRpcmVseSBiZXR3ZWVuICN7YXNfaGV4IGZpcnN0fSBhbmQgI3thc19oZXggbGFzdH0sIFwiIFxcXG4gICAgICAgICsgXCJnb3QgI3tydW4udG9TdHJpbmcgMTZ9XCJcbiAgICBAcnVucyA9IGxldHMgQHJ1bnMsICggcnVucyApID0+IHJ1bnMucHVzaCBydW5cbiAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IGZhbHNlXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9zb3J0X3J1bnM6ICggcnVucyApIC0+XG4gICAgcnVucy5zb3J0ICggYSwgYiApIC0+XG4gICAgICByZXR1cm4gKzEgaWYgYS5sbyA+IGIubG9cbiAgICAgIHJldHVybiAtMSBpZiBhLmxvIDwgYi5sb1xuICAgICAgcmV0dXJuICsxIGlmIGEuaGkgPiBiLmhpXG4gICAgICByZXR1cm4gLTEgaWYgYS5oaSA8IGIuaGlcbiAgICAgIHJldHVybiAgMFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhZGRfcnVuOiAoIFAuLi4gKSAtPlxuICAgIEBfaW5zZXJ0IG5ldyBSdW4gUC4uLlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhZGRfY29kZXBvaW50c19vZjogKCB0ZXh0cy4uLiApIC0+IEBhZGRfcnVuICggY2hyLmNvZGVQb2ludEF0IDAgKSBmb3IgY2hyIGZyb20gbmV3IFNldCB0ZXh0cy5qb2luICcnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemU6ICggZm9yY2UgPSBmYWxzZSApIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQGlzX25vcm1hbGl6ZWQgYW5kICggbm90IGZvcmNlIClcbiAgICBAcnVucyA9IGxldHMgQHJ1bnMsICggcnVucyApID0+XG4gICAgICBAX3NvcnRfcnVucyBydW5zXG4gICAgICBoYWxmb3BlbnMgICA9IElGTi5zaW1wbGlmeSAoIHJ1bi5hc19oYWxmb3BlbigpIGZvciBydW4gaW4gcnVucyApXG4gICAgICBydW5zLmxlbmd0aCA9IDBcbiAgICAgIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICAgICAgcnVuID0gUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBBUEkgIyMjXG4gICAgICAgIHJ1bi5yb3dpZCAgID0gQGhvYXJkLl9nZXRfbmV4dF9ydW5fcm93aWQoKVxuICAgICAgICBydW4uc2NhdHRlciA9ICBAcm93aWRcbiAgICAgICAgcnVucy5wdXNoIGZyZWV6ZSBydW5cbiAgICAgIDtudWxsXG4gICAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IHRydWVcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPiBAY29udGFpbnNfbnVtYmVyIHByb2JlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluc19udW1iZXI6ICggcHJvYmUgKSAtPlxuICAgIEBub3JtYWxpemUoKVxuICAgIFQucG9pbnQudmFsaWRhdGUgcHJvYmVcbiAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbWluIDw9IHByb2JlIDw9IG1heFxuICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2FyZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBAY2ZnICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5ob2FyZF9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIEBnYXBzID0gW11cbiAgICBAaGl0cyA9IFtdXG4gICAgaGlkZSBALCAnc2NhdHRlcnMnLCBbXVxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCBydW5fcm93aWQ6IDAsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X25leHRfcnVuX3Jvd2lkOiAtPiBAc3RhdGUucnVuX3Jvd2lkKys7IFwidDpocmQ6cnVucyxSPSN7QHN0YXRlLnJ1bl9yb3dpZH1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgUiA9IG5ldyBTY2F0dGVyIEAsIFAuLi5cbiAgICBAc2NhdHRlcnMucHVzaCBSXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnRhaW5zOiAoIFAuLi4gKSAtPiBAc2NhdHRlcnMuc29tZSAoIHNjYXR0ZXIgKSAtPiBzY2F0dGVyLmNvbnRhaW5zIFAuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgIFIgPSBbXVxuICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgIFIucHVzaCBzY2F0dGVyLmRhdGFcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICBSID0gQGdldF9kYXRhX2Zvcl9wb2ludCBwb2ludFxuICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3VtbWFyaXplX2RhdGE6ICggaXRlbXMuLi4gKSAtPlxuICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgUiAgICAgPSB7fVxuICAgIGtleXMgID0gWyAoIG5ldyBTZXQgKCBrZXkgZm9yIGtleSBvZiBpdGVtIGZvciBpdGVtIGluIGl0ZW1zICkuZmxhdCgpICkuLi4sIF0uc29ydCgpXG4gICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgIFJbIGtleSBdICA9ICggQFsgXCJzdW1tYXJpemVfZGF0YV8je2tleX1cIiBdID8gKCAoIHggKSAtPiB4ICkgKS5jYWxsIEAsIHZhbHVlc1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBocmRfYXNfbG9oaV9oZXg6XG4gICAgICBuYW1lOiAnaHJkX2FzX2xvaGlfaGV4J1xuICAgICAgdmFsdWU6ICggbG8sIGhpICkgLT4gXCIoI3tsby50b1N0cmluZyAxNn0sI3toaS50b1N0cmluZyAxNn0pXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBidWlsZDogLT5cbiAgICBSID0gW11cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgY3JlYXRlIHRhYmxlIGhyZF9ob2FyZF9zY2F0dGVycyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJ1xuICAgICAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfcnVucyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBsbyAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgc2NhdHRlciAgIHRleHQgICAgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfX18yXCIgY2hlY2sgKCByb3dpZCByZWdleHAgI3tMSVQgY2ZnLnJ1bnNfcm93aWRfcmVnZXhwIH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fXzNcIiBjaGVjayAoIGxvIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfX180XCIgY2hlY2sgKCBoaSBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X19fNVwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X19fNlwiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICk7XCJcIlwiXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHN0YXRlbWVudHM6IC0+XG4gICAgUiA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9zY2F0dGVyX3YgPSBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkLCBpc19oaXQsIGRhdGEgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnNjYXR0ZXJzX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9zY2F0dGVycycgKSApLFxuICAgICAgICAgICRpc19oaXQsXG4gICAgICAgICAgJGRhdGEgKVxuICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5pbnNlcnRfaHJkX2hvYXJkX3J1bl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfcnVucyAoIHJvd2lkLCBsbywgaGksIHNjYXR0ZXIgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnJ1bnNfcm93aWRfdGVtcGxhdGV9LCBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UoICdocmRfc2VxX2hvYXJkX3J1bnMnICkgKSxcbiAgICAgICAgICAkbG8sXG4gICAgICAgICAgJGhpLFxuICAgICAgICAgICRzY2F0dGVyICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgbGV0cywgdHlwZXNwYWNlOiBULCB9XG4gIHJldHVybiB7XG4gICAgSG9hcmQsXG4gICAgU2NhdHRlcixcbiAgICBSdW4sXG4gICAgc3VtbWFyaXplX2RhdGEsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
