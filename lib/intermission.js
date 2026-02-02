(function() {
  'use strict';
  var Dbric, Dbric_std, Hoard, IDN, IFN, LIT, Run, SQL, Scatter, T, VEC, as_hex, debug, deploy, freeze, hide, nameit, nfa, rpr, set_getter, set_hidden_readonly, set_readonly, summarize_data, templates, type_of;

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
        // run.rowid = "t:hrd:runs,R=#{@runs.length + 1}"
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxjQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUE7OztFQUlBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx1Q0FBUjs7RUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFQQTs7O0VBU0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSwrQ0FBUixDQUFGLENBQTJELENBQUMsb0NBQTVELENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsWUFERixFQUVFLG1CQUZGLEVBR0UsVUFIRixDQUFBLEdBRzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4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QUFBO0FBeFhwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcnVuX2NmZzpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2NmZzpcbiAgICBob2FyZDogICAgICBudWxsXG4gICAgZGF0YTogICAgICAgbnVsbFxuICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2FkZDpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGhvYXJkX2NmZzpcbiAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfcnVuOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgcnVuc19yb3dpZF9yZWdleHA6ICAgICAgICAnMHgwMF8wMDAwJ1xuICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdF9wb2ludDogICAgICAgICAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfaW5zZXJ0X3N0YXRlbWVudHM6XG4gICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICBydW5zX3Jvd2lkX3RlbXBsYXRlOiAgICAgICdydW4tJWQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X3VkZnM6IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYXNfaGV4ID0gKCBuICkgLT5cbiAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuc3VtbWFyaXplX2RhdGEgPVxuICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBSdW5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgIyMjIFRBSU5UIHVzZSB0eXBpbmcgIyMjXG4gICAgIyB0aHJvdyBuZXcgRXJyb3IgXCJcIlxuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2xvJywgICBsb1xuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2hpJywgICBoaVxuICAgIHNldF9oaWRkZW5fcmVhZG9ubHkgQCwgJ3NpemUnLCBoaSAtIGxvICsgMVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19oYWxmb3BlbjogICAgICAgICAgICAgICAgLT4geyBzdGFydDogQGxvLCBlbmQ6IEBoaSArIDEsIH1cbiAgQGZyb21faGFsZm9wZW46KCBoYWxmb3BlbiApIC0+IG5ldyBAIHsgbG86IGhhbGZvcGVuLnN0YXJ0LCBoaTogaGFsZm9wZW4uZW5kIC0gMSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgcmV0dXJuIEBsbyA8PSBwcm9iZSA8PSBAaGlcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICByZXR1cm4gKCBAbG8gPD0gcHJvYmUubG8gPD0gQGhpICkgYW5kICggQGxvIDw9IHByb2JlLmhpIDw9IEBoaSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAbG8gPD0gbiA8PSBAaGlcbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2NhdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggaG9hcmQsIGNmZyApIC0+XG4gICAgIyMjIFRBSU5UIHZhbGlkYXRlICMjI1xuICAgICMjIyBUQUlOVCBzaG91bGQgZnJlZXplIGRhdGEgIyMjXG4gICAgWyBjZmcsXG4gICAgICB7IGRhdGEsIH0sICBdID0gZGVwbG95IHsgdGVtcGxhdGVzLnNjYXR0ZXJfY2ZnLi4uLCBjZmcuLi4sIH0sIFsgJ3NvcnQnLCAnbm9ybWFsaXplJywgXSwgWyAnZGF0YScsIF1cbiAgICBAZGF0YSAgICAgICAgICAgPSBmcmVlemUgZGF0YVxuICAgIEBydW5zICAgICAgICAgICA9IFtdXG4gICAgaGlkZSBALCAnY2ZnJywgICAgZnJlZXplIGNmZ1xuICAgIGhpZGUgQCwgJ2hvYXJkJywgIGhvYXJkXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgeyBpc19ub3JtYWxpemVkOiB0cnVlLCB9XG4gICAgO3VuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgW1N5bWJvbC5pdGVyYXRvcl06IC0+IHlpZWxkIGZyb20gQHdhbGsoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogLT5cbiAgICBAbm9ybWFsaXplKCkgdW5sZXNzIEBpc19ub3JtYWxpemVkXG4gICAgeWllbGQgZnJvbSBydW4gZm9yIHJ1biBpbiBAcnVuc1xuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX25vcm1hbGl6ZWQnLCAgLT4gQHN0YXRlLmlzX25vcm1hbGl6ZWRcbiAgc2V0X2dldHRlciBAOjosICdwb2ludHMnLCAtPiBbIEAuLi4sIF1cbiAgICAjIHBvaW50cyA9IG5ldyBTZXQgWyAoIFsgcnVuLi4uLCBdIGZvciBydW4gaW4gQHJ1bnMgKS4uLiwgXS5mbGF0KClcbiAgICAjIHJldHVybiBbIHBvaW50cy4uLiwgXS5zb3J0ICggYSwgYiApIC0+XG4gICAgIyAgIHJldHVybiArMSBpZiBhID4gYlxuICAgICMgICByZXR1cm4gLTEgaWYgYSA8IGJcbiAgICAjICAgcmV0dXJuICAwXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21pbicsIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gKCBAcnVucy5hdCAwICkubG8gaWYgQGlzX25vcm1hbGl6ZWRcbiAgICByZXR1cm4gTWF0aC5taW4gKCBydW4ubG8gZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21heCcsIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQHJ1bnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gKCBAcnVucy5hdCAtMSApLmhpIGlmIEBpc19ub3JtYWxpemVkXG4gICAgcmV0dXJuIE1hdGgubWF4ICggcnVuLmhpIGZvciBydW4gaW4gQHJ1bnMgKS4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdtaW5tYXgnLCAtPiB7IG1pbjogQG1pbiwgbWF4OiBAbWF4LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfaW5zZXJ0OiAoIHJ1biApIC0+XG4gICAgIyMjIE5PVEUgdGhpcyBwcml2YXRlIEFQSSBwcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBpbXBsZW1lbnQgYWx3YXlzLW9yZGVyZWQgcnVuczsgaG93ZXZlciB3ZSBvcHQgZm9yXG4gICAgc29ydGluZyBhbGwgcmFuZ2VzIHdoZW4gbmVlZGVkIGJ5IGEgbWV0aG9kIGxpa2UgYFNjYXR0ZXI6Om5vcm1hbGl6ZSgpYCAjIyNcbiAgICAjIHJ1bi5yb3dpZCA9IFwidDpocmQ6cnVucyxSPSN7QHJ1bnMubGVuZ3RoICsgMX1cIlxuICAgIEBydW5zLnB1c2ggcnVuXG4gICAgQHN0YXRlLmlzX25vcm1hbGl6ZWQgPSBmYWxzZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzb3J0OiAtPlxuICAgIEBydW5zLnNvcnQgKCBhLCBiICkgLT5cbiAgICAgIHJldHVybiArMSBpZiBhLmxvID4gYi5sb1xuICAgICAgcmV0dXJuIC0xIGlmIGEubG8gPCBiLmxvXG4gICAgICByZXR1cm4gKzEgaWYgYS5oaSA+IGIuaGlcbiAgICAgIHJldHVybiAtMSBpZiBhLmhpIDwgYi5oaVxuICAgICAgcmV0dXJuICAwXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsZWFyOiAtPlxuICAgIEBydW5zLmxlbmd0aCA9IFtdXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9ydW46ICggUC4uLiApIC0+XG4gICAgQF9pbnNlcnQgQGhvYXJkLmNyZWF0ZV9ydW4gUC4uLlxuICAgIGlmIEBjZmcubm9ybWFsaXplIHRoZW4gQG5vcm1hbGl6ZSgpXG4gICAgZWxzZSBpZiBAY2ZnLnNvcnQgdGhlbiBAc29ydCgpXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFkZF9jb2RlcG9pbnRzX29mOiAoIHRleHRzLi4uICkgLT4gQGFkZF9ydW4gY2hyIGZvciBjaHIgZnJvbSBuZXcgU2V0IHRleHRzLmpvaW4gJydcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG5vcm1hbGl6ZTogLT5cbiAgICBAc29ydCgpXG4gICAgaGFsZm9wZW5zID0gSUZOLnNpbXBsaWZ5ICggcnVuLmFzX2hhbGZvcGVuKCkgZm9yIHJ1biBpbiBAcnVucyApXG4gICAgQGNsZWFyKClcbiAgICBAcnVucy5wdXNoIFJ1bi5mcm9tX2hhbGZvcGVuIGhhbGZvcGVuIGZvciBoYWxmb3BlbiBpbiBoYWxmb3BlbnNcbiAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IHRydWVcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29udGFpbnM6ICggcHJvYmUgKSAtPlxuICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICB7IG1pbiwgbWF4LCB9ID0gQG1pbm1heFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBOdW1iZXIuaXNGaW5pdGUgcHJvYmVcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBtaW4gPD0gcHJvYmUgPD0gbWF4XG4gICAgICAgIHJldHVybiBAcnVucy5zb21lICggcnVuICkgPT4gcnVuLmNvbnRhaW5zIHByb2JlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBSdW5cbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5sbyA8PSBtYXggKSBhbmQgKCBtaW4gPD0gcHJvYmUuaGkgPD0gbWF4IClcbiAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiAoIHJ1bi5jb250YWlucyBwcm9iZS5sbyApIGFuZCAoIHJ1bi5jb250YWlucyBwcm9iZS5oaSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gcHJvYmUgaW5zdGFuY2VvZiBTY2F0dGVyXG4gICAgICAgIHByb2JlLm5vcm1hbGl6ZSgpIHVubGVzcyBwcm9iZS5pc19ub3JtYWxpemVkXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBtaW4gPD0gcHJvYmUubWluIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5tYXggPD0gbWF4IClcbiAgICAgICAgcmV0dXJuIHByb2JlLnJ1bnMuZXZlcnkgKCBydW4gKSA9PiBAY29udGFpbnMgcnVuXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gKCB0eXBlX29mIHByb2JlICkgaXMgJ3RleHQnXG4gICAgICAgIHByb2JlID0gKCBjaHIuY29kZVBvaW50QXQgMCBmb3IgY2hyIGluIEFycmF5LmZyb20gcHJvYmUgKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIG4gZnJvbSBwcm9iZVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAcnVucy5zb21lICggcnVuICkgLT4gcnVuLmNvbnRhaW5zIG5cbiAgICByZXR1cm4gdHJ1ZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvYXJkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIEBjZmcgID0gZnJlZXplIHsgdGVtcGxhdGVzLmhvYXJkX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgQGdhcHMgPSBbXVxuICAgIEBoaXRzID0gW11cbiAgICBoaWRlIEAsICdzY2F0dGVycycsIFtdXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfcnVuOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmNyZWF0ZV9ydW4sIH0sICggbG8sIGhpLCBjZmcgKSAtPlxuICAgICMgZGVidWcgJ86paW1fX18xJywgeyBsbywgaGksIGNmZywgfVxuICAgICMgZGVidWcgJ86paW1fX18yJywgQF9nZXRfaGlfYW5kX2xvIGNmZ1xuICAgIHJldHVybiBuZXcgUnVuIEBfZ2V0X2hpX2FuZF9sbyBjZmdcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9zY2F0dGVyOiAoIFAuLi4gKSAtPiBuZXcgU2NhdHRlciAgQCwgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3NjYXR0ZXI6ICggUC4uLiApIC0+XG4gICAgUiA9IEBjcmVhdGVfc2NhdHRlciBQLi4uXG4gICAgQHNjYXR0ZXJzLnB1c2ggUlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogLT5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9kYXRhX2Zvcl9wb2ludDogKCBwb2ludCApIC0+XG4gICAgVC5wb2ludC52YWxpZGF0ZSBwb2ludFxuICAgIFIgPSBbXVxuICAgIGZvciBzY2F0dGVyIGluIEBzY2F0dGVyc1xuICAgICAgY29udGludWUgdW5sZXNzIHNjYXR0ZXIuY29udGFpbnMgcG9pbnRcbiAgICAgIFIucHVzaCBzY2F0dGVyLmRhdGFcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VtbWFyaXplX2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICBSID0gQGdldF9kYXRhX2Zvcl9wb2ludCBwb2ludFxuICAgIHJldHVybiBudWxsIGlmIFIubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gQF9zdW1tYXJpemVfZGF0YSBSLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3VtbWFyaXplX2RhdGE6ICggaXRlbXMuLi4gKSAtPlxuICAgIGl0ZW1zID0gaXRlbXMuZmxhdCgpXG4gICAgUiAgICAgPSB7fVxuICAgIGtleXMgID0gWyAoIG5ldyBTZXQgKCBrZXkgZm9yIGtleSBvZiBpdGVtIGZvciBpdGVtIGluIGl0ZW1zICkuZmxhdCgpICkuLi4sIF0uc29ydCgpXG4gICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICB2YWx1ZXMgICAgPSAoIHZhbHVlIGZvciBpdGVtIGluIGl0ZW1zIHdoZW4gKCB2YWx1ZSA9IGl0ZW1bIGtleSBdICk/IClcbiAgICAgIFJbIGtleSBdICA9ICggQFsgXCJzdW1tYXJpemVfZGF0YV8je2tleX1cIiBdID8gKCAoIHggKSAtPiB4ICkgKS5jYWxsIEAsIHZhbHVlc1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdW1tYXJpemVfZGF0YV90YWdzOiAoIHZhbHVlcyApIC0+IHN1bW1hcml6ZV9kYXRhLmFzX3VuaXF1ZV9zb3J0ZWQgdmFsdWVzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2hpX2FuZF9sbzogKCBjZmcgKSAtPlxuICAgIHJldHVybiB7IGxvOiAoIEBfY2FzdF9ib3VuZCBjZmcubG8gKSwgaGk6ICggQF9jYXN0X2JvdW5kIGNmZy5oaSA/IGNmZy5sbyApLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY2FzdF9ib3VuZDogKCBib3VuZCApIC0+XG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGJvdW5kXG4gICAgICB3aGVuICdmbG9hdCdcbiAgICAgICAgdW5sZXNzIE51bWJlci5pc0ludGVnZXIgYm91bmRcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNSBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIFIgPSBib3VuZFxuICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgUiA9IGJvdW5kLmNvZGVQb2ludEF0IDBcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzYgZXhwZWN0ZWQgYW4gaW50ZWdlciBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyAoIEBjZmcuZmlyc3QgPD0gUiA8PSBAY2ZnLmxhc3QgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpbV9fXzcgI3thc19oZXggUn0gaXMgbm90IGJldHdlZW4gI3thc19oZXggQGNmZy5maXJzdH0gYW5kICN7YXNfaGV4IEBjZmcubGFzdH1cIlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAtPlxuICAgIFIgPSB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBocmRfYXNfbG9oaV9oZXg6XG4gICAgICBuYW1lOiAnaHJkX2FzX2xvaGlfaGV4J1xuICAgICAgdmFsdWU6ICggbG8sIGhpICkgLT4gXCIoI3tsby50b1N0cmluZyAxNn0sI3toaS50b1N0cmluZyAxNn0pXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBidWlsZDogLT5cbiAgICBSID0gW11cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgY3JlYXRlIHRhYmxlIGhyZF9ob2FyZF9zY2F0dGVycyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBpc19oaXQgICAgYm9vbGVhbiAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgZmFsc2UsXG4gICAgICAgICAgZGF0YSAgICAgIGpzb24gICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJ1xuICAgICAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIucHVzaCBTUUxcIlwiXCJcbiAgICAgIGNyZWF0ZSB0YWJsZSBocmRfaG9hcmRfcnVucyAoXG4gICAgICAgICAgcm93aWQgICAgIHRleHQgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICBsbyAgICAgICAgaW50ZWdlciAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAgIGhpICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgc2NhdHRlciAgIHRleHQgICAgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgLS0gcHJpbWFyeSBrZXkgKCByb3dpZCApLFxuICAgICAgICBmb3JlaWduIGtleSAoIHNjYXR0ZXIgKSByZWZlcmVuY2VzIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzExXCIgY2hlY2sgKCByb3dpZCByZWdleHAgI3tMSVQgY2ZnLnJ1bnNfcm93aWRfcmVnZXhwIH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTBcIiBjaGVjayAoIGxvIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzExXCIgY2hlY2sgKCBoaSBiZXR3ZWVuICN7TElUIGNmZy5maXJzdF9wb2ludH0gYW5kICN7TElUIGNmZy5sYXN0X3BvaW50fSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMlwiIGNoZWNrICggbG8gPD0gaGkgKVxuICAgICAgICAtLSBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xM1wiIGNoZWNrICggcm93aWQgcmVnZXhwICdeLiokJyApXG4gICAgICAgICk7XCJcIlwiXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHN0YXRlbWVudHM6IC0+XG4gICAgUiA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFIuaW5zZXJ0X2hyZF9ob2FyZF9zY2F0dGVyX3YgPSBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIGhyZF9ob2FyZF9zY2F0dGVycyAoIHJvd2lkLCBpc19oaXQsIGRhdGEgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnNjYXR0ZXJzX3Jvd2lkX3RlbXBsYXRlfSwgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlKCAnaHJkX3NlcV9ob2FyZF9zY2F0dGVycycgKSApLFxuICAgICAgICAgICRpc19oaXQsXG4gICAgICAgICAgJGRhdGEgKVxuICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5pbnNlcnRfaHJkX2hvYXJkX3J1bl92ID0gU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBocmRfaG9hcmRfcnVucyAoIHJvd2lkLCBsbywgaGksIHNjYXR0ZXIgKSB2YWx1ZXMgKFxuICAgICAgICAgIHByaW50ZiggI3tMSVQgY2ZnLnJ1bnNfcm93aWRfdGVtcGxhdGV9LCBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UoICdocmRfc2VxX2hvYXJkX3J1bnMnICkgKSxcbiAgICAgICAgICAkbG8sXG4gICAgICAgICAgJGhpLFxuICAgICAgICAgICRzY2F0dGVyICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgUnVuLCBTY2F0dGVyLCB0ZW1wbGF0ZXMsIElGTiwgfVxuICByZXR1cm4ge1xuICAgIEhvYXJkLFxuICAgIHN1bW1hcml6ZV9kYXRhLFxuICAgIGludGVybmFscywgfVxuIl19
