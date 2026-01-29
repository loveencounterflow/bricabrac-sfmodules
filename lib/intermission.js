(function() {
  'use strict';
  var Dbric, Dbric_std, Hoard, IDN, IFN, LIT, Run, SQL, Scatter, T, VEC, as_hex, debug, deploy, freeze, hide, nameit, nfa, rpr, set_getter, summarize_data, templates, type_of;

  //===========================================================================================================
  ({debug} = console);

  ({freeze} = Object);

  IFN = require('./../dependencies/intervals-fn-lib.js');

  ({T} = require('./intermission-types'));

  //...........................................................................................................
  ({nfa} = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());

  ({nameit} = (require('./various-brics')).require_nameit());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({deploy} = (require('./unstable-object-tools-brics')).require_deploy());

  // { get_sha1sum7d,        } = require './shasum'
  ({Dbric, Dbric_std, SQL, LIT, IDN, VEC} = require('./dbric'));

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
      data: null,
      sort: false,
      normalize: false
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

  Run = (function() {
    //===========================================================================================================
    class Run {
      //---------------------------------------------------------------------------------------------------------
      constructor({lo, hi}) {
        this.lo = lo;
        this.hi = hi;
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

    //---------------------------------------------------------------------------------------------------------
    set_getter(Run.prototype, 'size', function() {
      return this.hi - this.lo + 1/* TAINT consider to make `Run`s immutable, then size is a constant */;
    });

    return Run;

  }).call(this);

  Scatter = (function() {
    //===========================================================================================================
    class Scatter {
      //---------------------------------------------------------------------------------------------------------
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
        this.runs.push(run);
        this.state.is_normalized = false;
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
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

      //---------------------------------------------------------------------------------------------------------
      clear() {
        this.runs.length = [];
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      add_run(...P) {
        this._insert(this.hoard.create_run(...P));
        if (this.cfg.normalize) {
          this.normalize();
        } else if (this.cfg.sort) {
          this.sort();
        }
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
      create_scatter(...P) {
        return new Scatter(this, ...P);
      }

      //---------------------------------------------------------------------------------------------------------
      add_scatter(...P) {
        var R;
        R = this.create_scatter(...P);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxjQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUE7OztFQUlBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx1Q0FBUjs7RUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFQQTs7O0VBU0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSwrQ0FBUixDQUFGLENBQTJELENBQUMsb0NBQTVELENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsR0FBRixDQUFB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bnQiOlsiXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5JRk4gICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi8uLi9kZXBlbmRlbmNpZXMvaW50ZXJ2YWxzLWZuLWxpYi5qcydcbnsgVCwgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2ludGVybWlzc2lvbi10eXBlcydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG57IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcnVuX2NmZzpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2NmZzpcbiAgICBob2FyZDogICAgICBudWxsXG4gICAgZGF0YTogICAgICAgbnVsbFxuICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2FkZDpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGhvYXJkX2NmZzpcbiAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfcnVuOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgcnVuc19yb3dpZF9yZWdleHA6ICAgICAgICAnMHgwMF8wMDAwJ1xuICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdF9wb2ludDogICAgICAgICAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfaW5zZXJ0X3N0YXRlbWVudHM6XG4gICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICBydW5zX3Jvd2lkX3RlbXBsYXRlOiAgICAgICdydW4tJWQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X3VkZnM6IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYXNfaGV4ID0gKCBuICkgLT5cbiAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuc3VtbWFyaXplX2RhdGEgPVxuICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBSdW5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgQGxvICAgPSBsb1xuICAgIEBoaSAgID0gaGlcbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBbIEBsbyAuLiBAaGkgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdzaXplJywgLT4gQGhpIC0gQGxvICsgMSAjIyMgVEFJTlQgY29uc2lkZXIgdG8gbWFrZSBgUnVuYHMgaW1tdXRhYmxlLCB0aGVuIHNpemUgaXMgYSBjb25zdGFudCAjIyNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgIHJldHVybiB0cnVlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTY2F0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgY2ZnICkgLT5cbiAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICBbIGNmZyxcbiAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgIEBkYXRhICAgICAgICAgICA9IGZyZWV6ZSBkYXRhXG4gICAgQHJ1bnMgICAgICAgICAgID0gW11cbiAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgaGlkZSBALCAnaG9hcmQnLCAgaG9hcmRcbiAgICBoaWRlIEAsICdzdGF0ZScsICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAtPlxuICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsICAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+IFsgQC4uLiwgXVxuICAgICMgcG9pbnRzID0gbmV3IFNldCBbICggWyBydW4uLi4sIF0gZm9yIHJ1biBpbiBAcnVucyApLi4uLCBdLmZsYXQoKVxuICAgICMgcmV0dXJuIFsgcG9pbnRzLi4uLCBdLnNvcnQgKCBhLCBiICkgLT5cbiAgICAjICAgcmV0dXJuICsxIGlmIGEgPiBiXG4gICAgIyAgIHJldHVybiAtMSBpZiBhIDwgYlxuICAgICMgICByZXR1cm4gIDBcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWluJywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgIHJldHVybiBNYXRoLm1pbiAoIHJ1bi5sbyBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IC0xICkuaGkgaWYgQGlzX25vcm1hbGl6ZWRcbiAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgIEBydW5zLnB1c2ggcnVuXG4gICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzb3J0OiAtPlxuICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgcmV0dXJuICAwXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsZWFyOiAtPlxuICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9ydW46ICggUC4uLiApIC0+XG4gICAgQF9pbnNlcnQgQGhvYXJkLmNyZWF0ZV9ydW4gUC4uLlxuICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgZWxzZSBpZiBAY2ZnLnNvcnQgdGhlbiBAc29ydCgpXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gY2hyIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZTogLT5cbiAgICBAc29ydCgpXG4gICAgaGFsZm9wZW5zID0gSUZOLnNpbXBsaWZ5ICggcnVuLmFzX2hhbGZvcGVuKCkgZm9yIHJ1biBpbiBAcnVucyApXG4gICAgQGNsZWFyKClcbiAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IHRydWVcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBtaW4gPD0gcHJvYmUgPD0gbWF4XG4gICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBSdW5cbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5sbyA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUuaGkgPD0gbWF4IClcbiAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiAoIHJ1bi5jb250YWlucyBwcm9iZS5sbyApIGFuZCAoIHJ1bi5jb250YWlucyBwcm9iZS5oaSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBTY2F0dGVyXG4gICAgICAgIHByb2JlLm5vcm1hbGl6ZSgpIHVubGVzcyBwcm9iZS5pc19ub3JtYWxpemVkXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubWluIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5tYXggPD0gbWF4IClcbiAgICAgICAgcmV0dXJuIHByb2JlLnJ1bnMuZXZlcnkgKCBydW4gKSA9PiBAY29udGFpbnMgcnVuXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmNvbnRhaW5zIG5cbiAgICByZXR1cm4gdHJ1ZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvYXJkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIEBjZmcgID0gZnJlZXplIHsgdGVtcGxhdGVzLmhvYXJkX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgQGdhcHMgPSBbXVxuICAgIEBoaXRzID0gW11cbiAgICBoaWRlIEAsICdzY2F0dGVycycsIFtdXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmNyZWF0ZV9ydW4sIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICMgZGVidWcgJ86paW1fX18xJywgeyBsbywgaGksIGNmZywgfVxuICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgIHJldHVybiBuZXcgUnVuIEBfZ2V0X2hpX2FuZF9sbyBjZmdcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9zY2F0dGVyOiAoIFAuLi4gKSAtPiBuZXcgU2NhdHRlciAgQCwgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgUiA9IEBjcmVhdGVfc2NhdHRlciBQLi4uXG4gICAgQHNjYXR0ZXJzLnB1c2ggUlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogLT5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgIFIgPSBbXVxuICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgIFIucHVzaCBzY2F0dGVyLmRhdGFcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICBSID0gQGdldF9kYXRhX2Zvcl9wb2ludCBwb2ludFxuICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3VtbWFyaXplX2RhdGE6ICggaXRlbXMuLi4gKSAtPlxuICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgUiAgICAgPSB7fVxuICAgIGtleXMgID0gWyAoIG5ldyBTZXQgKCBrZXkgZm9yIGtleSBvZiBpdGVtIGZvciBpdGVtIGluIGl0ZW1zICkuZmxhdCgpICkuLi4sIF0uc29ydCgpXG4gICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgIFJbIGtleSBdICA9ICggQFsgXCJzdW1tYXJpemVfZGF0YV8je2tleX1cIiBdID8gKCAoIHggKSAtPiB4ICkgKS5jYWxsIEAsIHZhbHVlc1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2hpX2FuZF9sbzogKCBjZmcgKSAtPlxuICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY2FzdF9ib3VuZDogKCBib3VuZCApIC0+XG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGJvdW5kXG4gICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgdW5sZXNzIE51bWJlci5pc0ludGVnZXIgYm91bmRcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNSBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIFIgPSBib3VuZFxuICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgUiA9IGJvdW5kLmNvZGVQb2ludEF0IDBcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzYgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyAoIEBjZmcuZmlyc3QgPD0gUiA8PSBAY2ZnLmxhc3QgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzcgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBocmRfYXNfbG9oaV9oZXg6XG4gICAgICBuYW1lOiAnaHJkX2FzX2xvaGlfaGV4J1xuICAgICAgdmFsdWU6ICggbG8sIGhpICkgLT4gXCIoI3tsby50b1N0cmluZyAxNn0sI3toaS50b1N0cmluZyAxNn0pXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBidWlsZDogLT5cbiAgICBSID0gW11cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgY3JlYXRlIHRhYmxlIGhyZF9ob2FyZF9zY2F0dGVycyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJ1xuICAgICAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfcnVucyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBsbyAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgc2NhdHRlciAgIHRleHQgICAgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzExXCIgY2hlY2sgKCByb3dpZCByZWdleHAgI3tMSVQgY2ZnLnJ1bnNfcm93aWRfcmVnZXhwIH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTBcIiBjaGVjayAoIGxvIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzExXCIgY2hlY2sgKCBoaSBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMlwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xM1wiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICk7XCJcIlwiXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHN0YXRlbWVudHM6IC0+XG4gICAgUiA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9zY2F0dGVyX3YgPSBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkLCBpc19oaXQsIGRhdGEgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnNjYXR0ZXJzX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9zY2F0dGVycycgKSApLFxuICAgICAgICAgICRpc19oaXQsXG4gICAgICAgICAgJGRhdGEgKVxuICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5pbnNlcnRfaHJkX2hvYXJkX3J1bl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfcnVucyAoIHJvd2lkLCBsbywgaGksIHNjYXR0ZXIgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnJ1bnNfcm93aWRfdGVtcGxhdGV9LCBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UoICdocmRfc2VxX2hvYXJkX3J1bnMnICkgKSxcbiAgICAgICAgICAkbG8sXG4gICAgICAgICAgJGhpLFxuICAgICAgICAgICRzY2F0dGVyICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICByZXR1cm4ge1xuICAgIEhvYXJkLFxuICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgIGludGVybmFscywgfVxuIl19
