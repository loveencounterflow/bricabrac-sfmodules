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

  Run = (function() {
    //===========================================================================================================
    class Run {
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

    //---------------------------------------------------------------------------------------------------------
    // set_getter @::, 'size', -> @_size
    set_getter(Run.prototype, 'lo', function() {
      return this._lo;
    });

    set_getter(Run.prototype, 'hi', function() {
      return this._hi;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ludGVybWlzc2lvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLFlBQUEsRUFBQSxjQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUE7OztFQUlBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxHQUFBLEdBQTRCLE9BQUEsQ0FBUSx1Q0FBUjs7RUFDNUIsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFQQTs7O0VBU0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSwrQ0FBUixDQUFGLENBQTJELENBQUMsb0NBQTVELENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsWUFERixFQUVFLG1CQUZGLEVBR0UsVUFIRixDQUFBLEdBRzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4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LE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBRixFQUFPLE9BQVAsRUFBZ0IsU0FBaEIsRUFBMkIsR0FBM0IsQ0FBZDtBQUNaLFdBQU8sQ0FDTCxLQURLLEVBRUwsY0FGSyxFQUdMLFNBSEs7RUFGVyxDQUFBO0FBN1hwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuSUZOICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vLi4vZGVwZW5kZW5jaWVzL2ludGVydmFscy1mbi1saWIuanMnXG57IFQsICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9pbnRlcm1pc3Npb24tdHlwZXMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgaGlkZSxcbiAgc2V0X3JlYWRvbmx5LFxuICBzZXRfaGlkZGVuX3JlYWRvbmx5LFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHJwciwgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBkZXBsb3ksICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9kZXBsb3koKVxuIyB7IGdldF9zaGExc3VtN2QsICAgICAgICB9ID0gcmVxdWlyZSAnLi9zaGFzdW0nXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgTElULFxuICBJRE4sXG4gIFZFQywgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYydcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRlbXBsYXRlcyA9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgcnVuX2NmZzpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAgIHNjYXR0ZXI6ICAgIG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2NmZzpcbiAgICBob2FyZDogICAgICBudWxsXG4gICAgZGF0YTogICAgICAgbnVsbFxuICAgIHNvcnQ6ICAgICAgIGZhbHNlXG4gICAgbm9ybWFsaXplOiAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzY2F0dGVyX2FkZDpcbiAgICBsbzogICAgICAgICBudWxsXG4gICAgaGk6ICAgICAgICAgbnVsbFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGhvYXJkX2NmZzpcbiAgICBmaXJzdDogICAgICAweDAwXzAwMDBcbiAgICBsYXN0OiAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfcnVuOlxuICAgIGxvOiAgICAgICAgIG51bGxcbiAgICBoaTogICAgICAgICBudWxsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X2J1aWxkX3N0YXRlbWVudHM6XG4gICAgcnVuc19yb3dpZF9yZWdleHA6ICAgICAgICAnMHgwMF8wMDAwJ1xuICAgIGZpcnN0X3BvaW50OiAgICAgICAgICAgICAgMHgwMF8wMDAwXG4gICAgbGFzdF9wb2ludDogICAgICAgICAgICAgICAweDEwX2ZmZmZcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBnZXRfaW5zZXJ0X3N0YXRlbWVudHM6XG4gICAgc2NhdHRlcnNfcm93aWRfdGVtcGxhdGU6ICAnc2NhdHRlci0lZCdcbiAgICBydW5zX3Jvd2lkX3RlbXBsYXRlOiAgICAgICdydW4tJWQnXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgZ2V0X3VkZnM6IHt9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYXNfaGV4ID0gKCBuICkgLT5cbiAgc2lnbiA9IGlmIG4gPCAwIHRoZW4gJy0nIGVsc2UgJysnXG4gIHJldHVybiBcIiN7c2lnbn0weCN7KCBNYXRoLmFicyBuICkudG9TdHJpbmcgMTZ9XCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgU3RyYXRlZ2llcyB0byBiZSBhcHBsaWVkIHRvIHN1bW1hcml6ZSBkYXRhIGl0ZW1zICMjI1xuc3VtbWFyaXplX2RhdGEgPVxuICBhc191bmlxdWVfc29ydGVkOiAoIHZhbHVlcyApIC0+IFsgKCBuZXcgU2V0ICggdiBmb3IgdiBpbiB2YWx1ZXMuZmxhdCgpIHdoZW4gdj8gKS5zb3J0KCkgKS4uLiwgXVxuICBhc19ib29sZWFuX2FuZDogKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBhbmQgY3VyID8gZmFsc2UgKSwgdHJ1ZVxuICBhc19ib29sZWFuX29yOiAgKCB2YWx1ZXMgKSAtPiB2YWx1ZXMucmVkdWNlICggKCBhY2MsIGN1ciApIC0+IGFjYyBvciAgY3VyID8gZmFsc2UgKSwgZmFsc2VcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBSdW5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoeyBsbywgaGksIH0pIC0+XG4gICAgIyMjIFRBSU5UIHVzZSB0eXBpbmcgIyMjXG4gICAgIyB0aHJvdyBuZXcgRXJyb3IgXCJcIlxuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2xvJywgICBsb1xuICAgIHNldF9yZWFkb25seSAgICAgICAgQCwgJ2hpJywgICBoaVxuICAgIHNldF9oaWRkZW5fcmVhZG9ubHkgQCwgJ3NpemUnLCBoaSAtIGxvICsgMVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIFsgQGxvIC4uIEBoaSBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsIC0+IEBfc2l6ZVxuICBzZXRfZ2V0dGVyIEA6OiwgJ2xvJywgICAtPiBAX2xvXG4gIHNldF9nZXR0ZXIgQDo6LCAnaGknLCAgIC0+IEBfaGlcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFzX2hhbGZvcGVuOiAgICAgICAgICAgICAgICAtPiB7IHN0YXJ0OiBAbG8sIGVuZDogQGhpICsgMSwgfVxuICBAZnJvbV9oYWxmb3BlbjooIGhhbGZvcGVuICkgLT4gbmV3IEAgeyBsbzogaGFsZm9wZW4uc3RhcnQsIGhpOiBoYWxmb3Blbi5lbmQgLSAxLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICByZXR1cm4gQGxvIDw9IHByb2JlIDw9IEBoaVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIHByb2JlIGluc3RhbmNlb2YgUnVuXG4gICAgICAgIHJldHVybiAoIEBsbyA8PSBwcm9iZS5sbyA8PSBAaGkgKSBhbmQgKCBAbG8gPD0gcHJvYmUuaGkgPD0gQGhpIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBsbyA8PSBuIDw9IEBoaVxuICAgIHJldHVybiB0cnVlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTY2F0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBob2FyZCwgY2ZnICkgLT5cbiAgICAjIyMgVEFJTlQgdmFsaWRhdGUgIyMjXG4gICAgIyMjIFRBSU5UIHNob3VsZCBmcmVlemUgZGF0YSAjIyNcbiAgICBbIGNmZyxcbiAgICAgIHsgZGF0YSwgfSwgIF0gPSBkZXBsb3kgeyB0ZW1wbGF0ZXMuc2NhdHRlcl9jZmcuLi4sIGNmZy4uLiwgfSwgWyAnc29ydCcsICdub3JtYWxpemUnLCBdLCBbICdkYXRhJywgXVxuICAgIEBkYXRhICAgICAgICAgICA9IGZyZWV6ZSBkYXRhXG4gICAgQHJ1bnMgICAgICAgICAgID0gW11cbiAgICBoaWRlIEAsICdjZmcnLCAgICBmcmVlemUgY2ZnXG4gICAgaGlkZSBALCAnaG9hcmQnLCAgaG9hcmRcbiAgICBoaWRlIEAsICdzdGF0ZScsICB7IGlzX25vcm1hbGl6ZWQ6IHRydWUsIH1cbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBbU3ltYm9sLml0ZXJhdG9yXTogLT4geWllbGQgZnJvbSBAd2FsaygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAtPlxuICAgIEBub3JtYWxpemUoKSB1bmxlc3MgQGlzX25vcm1hbGl6ZWRcbiAgICB5aWVsZCBmcm9tIHJ1biBmb3IgcnVuIGluIEBydW5zXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnaXNfbm9ybWFsaXplZCcsICAtPiBAc3RhdGUuaXNfbm9ybWFsaXplZFxuICBzZXRfZ2V0dGVyIEA6OiwgJ3BvaW50cycsIC0+IFsgQC4uLiwgXVxuICAgICMgcG9pbnRzID0gbmV3IFNldCBbICggWyBydW4uLi4sIF0gZm9yIHJ1biBpbiBAcnVucyApLi4uLCBdLmZsYXQoKVxuICAgICMgcmV0dXJuIFsgcG9pbnRzLi4uLCBdLnNvcnQgKCBhLCBiICkgLT5cbiAgICAjICAgcmV0dXJuICsxIGlmIGEgPiBiXG4gICAgIyAgIHJldHVybiAtMSBpZiBhIDwgYlxuICAgICMgICByZXR1cm4gIDBcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWluJywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IDAgKS5sbyBpZiBAaXNfbm9ybWFsaXplZFxuICAgIHJldHVybiBNYXRoLm1pbiAoIHJ1bi5sbyBmb3IgcnVuIGluIEBydW5zICkuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnbWF4JywgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBAcnVucy5sZW5ndGggaXMgMFxuICAgIHJldHVybiAoIEBydW5zLmF0IC0xICkuaGkgaWYgQGlzX25vcm1hbGl6ZWRcbiAgICByZXR1cm4gTWF0aC5tYXggKCBydW4uaGkgZm9yIHJ1biBpbiBAcnVucyApLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ21pbm1heCcsIC0+IHsgbWluOiBAbWluLCBtYXg6IEBtYXgsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9pbnNlcnQ6ICggcnVuICkgLT5cbiAgICAjIyMgTk9URSB0aGlzIHByaXZhdGUgQVBJIHByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIGltcGxlbWVudCBhbHdheXMtb3JkZXJlZCBydW5zOyBob3dldmVyIHdlIG9wdCBmb3JcbiAgICBzb3J0aW5nIGFsbCByYW5nZXMgd2hlbiBuZWVkZWQgYnkgYSBtZXRob2QgbGlrZSBgU2NhdHRlcjo6bm9ybWFsaXplKClgICMjI1xuICAgICMgcnVuLnJvd2lkID0gXCJ0OmhyZDpydW5zLFI9I3tAcnVucy5sZW5ndGggKyAxfVwiXG4gICAgQHJ1bnMucHVzaCBydW5cbiAgICBAc3RhdGUuaXNfbm9ybWFsaXplZCA9IGZhbHNlXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNvcnQ6IC0+XG4gICAgQHJ1bnMuc29ydCAoIGEsIGIgKSAtPlxuICAgICAgcmV0dXJuICsxIGlmIGEubG8gPiBiLmxvXG4gICAgICByZXR1cm4gLTEgaWYgYS5sbyA8IGIubG9cbiAgICAgIHJldHVybiArMSBpZiBhLmhpID4gYi5oaVxuICAgICAgcmV0dXJuIC0xIGlmIGEuaGkgPCBiLmhpXG4gICAgICByZXR1cm4gIDBcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2xlYXI6IC0+XG4gICAgQHJ1bnMubGVuZ3RoID0gW11cbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX3J1bjogKCBQLi4uICkgLT5cbiAgICBAX2luc2VydCBAaG9hcmQuY3JlYXRlX3J1biBQLi4uXG4gICAgaWYgQGNmZy5ub3JtYWxpemUgdGhlbiBAbm9ybWFsaXplKClcbiAgICBlbHNlIGlmIEBjZmcuc29ydCB0aGVuIEBzb3J0KClcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWRkX2NvZGVwb2ludHNfb2Y6ICggdGV4dHMuLi4gKSAtPiBAYWRkX3J1biBjaHIgZm9yIGNociBmcm9tIG5ldyBTZXQgdGV4dHMuam9pbiAnJ1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbm9ybWFsaXplOiAtPlxuICAgIEBzb3J0KClcbiAgICBoYWxmb3BlbnMgPSBJRk4uc2ltcGxpZnkgKCBydW4uYXNfaGFsZm9wZW4oKSBmb3IgcnVuIGluIEBydW5zIClcbiAgICBAY2xlYXIoKVxuICAgIEBydW5zLnB1c2ggUnVuLmZyb21faGFsZm9wZW4gaGFsZm9wZW4gZm9yIGhhbGZvcGVuIGluIGhhbGZvcGVuc1xuICAgIEBzdGF0ZS5pc19ub3JtYWxpemVkID0gdHJ1ZVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb250YWluczogKCBwcm9iZSApIC0+XG4gICAgQG5vcm1hbGl6ZSgpIHVubGVzcyBAaXNfbm9ybWFsaXplZFxuICAgIHsgbWluLCBtYXgsIH0gPSBAbWlubWF4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuIE51bWJlci5pc0Zpbml0ZSBwcm9iZVxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIG1pbiA8PSBwcm9iZSA8PSBtYXhcbiAgICAgICAgcmV0dXJuIEBydW5zLnNvbWUgKCBydW4gKSA9PiBydW4uY29udGFpbnMgcHJvYmVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFJ1blxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzICggbWluIDw9IHByb2JlLmxvIDw9IG1heCApIGFuZCAoIG1pbiA8PSBwcm9iZS5oaSA8PSBtYXggKVxuICAgICAgICByZXR1cm4gQHJ1bnMuc29tZSAoIHJ1biApID0+ICggcnVuLmNvbnRhaW5zIHByb2JlLmxvICkgYW5kICggcnVuLmNvbnRhaW5zIHByb2JlLmhpIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiBwcm9iZSBpbnN0YW5jZW9mIFNjYXR0ZXJcbiAgICAgICAgcHJvYmUubm9ybWFsaXplKCkgdW5sZXNzIHByb2JlLmlzX25vcm1hbGl6ZWRcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyAoIG1pbiA8PSBwcm9iZS5taW4gPD0gbWF4ICkgYW5kICggbWluIDw9IHByb2JlLm1heCA8PSBtYXggKVxuICAgICAgICByZXR1cm4gcHJvYmUucnVucy5ldmVyeSAoIHJ1biApID0+IEBjb250YWlucyBydW5cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAoIHR5cGVfb2YgcHJvYmUgKSBpcyAndGV4dCdcbiAgICAgICAgcHJvYmUgPSAoIGNoci5jb2RlUG9pbnRBdCAwIGZvciBjaHIgaW4gQXJyYXkuZnJvbSBwcm9iZSApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgbiBmcm9tIHByb2JlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBydW5zLnNvbWUgKCBydW4gKSAtPiBydW4uY29udGFpbnMgblxuICAgIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgSG9hcmRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgQGNmZyAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuaG9hcmRfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBAZ2FwcyA9IFtdXG4gICAgQGhpdHMgPSBbXVxuICAgIGhpZGUgQCwgJ3NjYXR0ZXJzJywgW11cbiAgICBoaWRlIEAsICdzdGF0ZScsICAgIHsgaXNfbm9ybWFsaXplZDogdHJ1ZSwgfVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9ydW46IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY3JlYXRlX3J1biwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgIyBkZWJ1ZyAnzqlpbV9fXzEnLCB7IGxvLCBoaSwgY2ZnLCB9XG4gICAgIyBkZWJ1ZyAnzqlpbV9fXzInLCBAX2dldF9oaV9hbmRfbG8gY2ZnXG4gICAgcmV0dXJuIG5ldyBSdW4gQF9nZXRfaGlfYW5kX2xvIGNmZ1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3NjYXR0ZXI6ICggUC4uLiApIC0+IG5ldyBTY2F0dGVyICBALCBQLi4uXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhZGRfc2NhdHRlcjogKCBQLi4uICkgLT5cbiAgICBSID0gQGNyZWF0ZV9zY2F0dGVyIFAuLi5cbiAgICBAc2NhdHRlcnMucHVzaCBSXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnRhaW5zOiAtPlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0X2RhdGFfZm9yX3BvaW50OiAoIHBvaW50ICkgLT5cbiAgICBULnBvaW50LnZhbGlkYXRlIHBvaW50XG4gICAgUiA9IFtdXG4gICAgZm9yIHNjYXR0ZXIgaW4gQHNjYXR0ZXJzXG4gICAgICBjb250aW51ZSB1bmxlc3Mgc2NhdHRlci5jb250YWlucyBwb2ludFxuICAgICAgUi5wdXNoIHNjYXR0ZXIuZGF0YVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdW1tYXJpemVfZGF0YV9mb3JfcG9pbnQ6ICggcG9pbnQgKSAtPlxuICAgIFIgPSBAZ2V0X2RhdGFfZm9yX3BvaW50IHBvaW50XG4gICAgcmV0dXJuIG51bGwgaWYgUi5sZW5ndGggaXMgMFxuICAgIHJldHVybiBAX3N1bW1hcml6ZV9kYXRhIFIuLi5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9zdW1tYXJpemVfZGF0YTogKCBpdGVtcy4uLiApIC0+XG4gICAgaXRlbXMgPSBpdGVtcy5mbGF0KClcbiAgICBSICAgICA9IHt9XG4gICAga2V5cyAgPSBbICggbmV3IFNldCAoIGtleSBmb3Iga2V5IG9mIGl0ZW0gZm9yIGl0ZW0gaW4gaXRlbXMgKS5mbGF0KCkgKS4uLiwgXS5zb3J0KClcbiAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgIHZhbHVlcyAgICA9ICggdmFsdWUgZm9yIGl0ZW0gaW4gaXRlbXMgd2hlbiAoIHZhbHVlID0gaXRlbVsga2V5IF0gKT8gKVxuICAgICAgUlsga2V5IF0gID0gKCBAWyBcInN1bW1hcml6ZV9kYXRhXyN7a2V5fVwiIF0gPyAoICggeCApIC0+IHggKSApLmNhbGwgQCwgdmFsdWVzXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN1bW1hcml6ZV9kYXRhX3RhZ3M6ICggdmFsdWVzICkgLT4gc3VtbWFyaXplX2RhdGEuYXNfdW5pcXVlX3NvcnRlZCB2YWx1ZXNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfaGlfYW5kX2xvOiAoIGNmZyApIC0+XG4gICAgcmV0dXJuIHsgbG86ICggQF9jYXN0X2JvdW5kIGNmZy5sbyApLCBoaTogKCBAX2Nhc3RfYm91bmQgY2ZnLmhpID8gY2ZnLmxvICksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jYXN0X2JvdW5kOiAoIGJvdW5kICkgLT5cbiAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgYm91bmRcbiAgICAgIHdoZW4gJ2Zsb2F0J1xuICAgICAgICB1bmxlc3MgTnVtYmVyLmlzSW50ZWdlciBib3VuZFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paW1fX181IGV4cGVjdGVkIGFuIGludGVnZXIgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgUiA9IGJvdW5kXG4gICAgICB3aGVuICd0ZXh0J1xuICAgICAgICBSID0gYm91bmQuY29kZVBvaW50QXQgMFxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNiBleHBlY3RlZCBhbiBpbnRlZ2VyIG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzICggQGNmZy5maXJzdCA8PSBSIDw9IEBjZmcubGFzdCApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWltX19fNyAje2FzX2hleCBSfSBpcyBub3QgYmV0d2VlbiAje2FzX2hleCBAY2ZnLmZpcnN0fSBhbmQgI3thc19oZXggQGNmZy5sYXN0fVwiXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBmdW5jdGlvbnM6IC0+XG4gICAgUiA9IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGhyZF9hc19sb2hpX2hleDpcbiAgICAgIG5hbWU6ICdocmRfYXNfbG9oaV9oZXgnXG4gICAgICB2YWx1ZTogKCBsbywgaGkgKSAtPiBcIigje2xvLnRvU3RyaW5nIDE2fSwje2hpLnRvU3RyaW5nIDE2fSlcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGJ1aWxkOiAtPlxuICAgIFIgPSBbXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLnB1c2ggU1FMXCJcIlwiXG4gICAgICBjcmVhdGUgdGFibGUgaHJkX2hvYXJkX3NjYXR0ZXJzIChcbiAgICAgICAgICByb3dpZCAgICAgdGV4dCAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICAgIGlzX2hpdCAgICBib29sZWFuICAgICAgICAgbm90IG51bGwgZGVmYXVsdCBmYWxzZSxcbiAgICAgICAgICBkYXRhICAgICAganNvbiAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnXG4gICAgICAgICAgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5wdXNoIFNRTFwiXCJcIlxuICAgICAgY3JlYXRlIHRhYmxlIGhyZF9ob2FyZF9ydW5zIChcbiAgICAgICAgICByb3dpZCAgICAgdGV4dCAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICAgIGxvICAgICAgICBpbnRlZ2VyICAgICAgICAgbm90IG51bGwsXG4gICAgICAgICAgaGkgICAgICAgIGludGVnZXIgICAgICAgICBub3QgbnVsbCxcbiAgICAgICAgICBzY2F0dGVyICAgdGV4dCAgICAgICAgICAgIG5vdCBudWxsLFxuICAgICAgICAtLSBwcmltYXJ5IGtleSAoIHJvd2lkICksXG4gICAgICAgIGZvcmVpZ24ga2V5ICggc2NhdHRlciApIHJlZmVyZW5jZXMgaHJkX2hvYXJkX3NjYXR0ZXJzICggcm93aWQgKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTFcIiBjaGVjayAoIHJvd2lkIHJlZ2V4cCAje0xJVCBjZmcucnVuc19yb3dpZF9yZWdleHAgfSApLFxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18xMFwiIGNoZWNrICggbG8gYmV0d2VlbiAje0xJVCBjZmcuZmlyc3RfcG9pbnR9IGFuZCAje0xJVCBjZmcubGFzdF9wb2ludH0gKSxcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMTFcIiBjaGVjayAoIGhpIGJldHdlZW4gI3tMSVQgY2ZnLmZpcnN0X3BvaW50fSBhbmQgI3tMSVQgY2ZnLmxhc3RfcG9pbnR9ICksXG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEyXCIgY2hlY2sgKCBsbyA8PSBoaSApXG4gICAgICAgIC0tIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzEzXCIgY2hlY2sgKCByb3dpZCByZWdleHAgJ14uKiQnIClcbiAgICAgICAgKTtcIlwiXCJcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAc3RhdGVtZW50czogLT5cbiAgICBSID0ge31cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgUi5pbnNlcnRfaHJkX2hvYXJkX3NjYXR0ZXJfdiA9IFNRTFwiXCJcIlxuICAgICAgaW5zZXJ0IGludG8gaHJkX2hvYXJkX3NjYXR0ZXJzICggcm93aWQsIGlzX2hpdCwgZGF0YSApIHZhbHVlcyAoXG4gICAgICAgICAgcHJpbnRmKCAje0xJVCBjZmcuc2NhdHRlcnNfcm93aWRfdGVtcGxhdGV9LCBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UoICdocmRfc2VxX2hvYXJkX3NjYXR0ZXJzJyApICksXG4gICAgICAgICAgJGlzX2hpdCxcbiAgICAgICAgICAkZGF0YSApXG4gICAgICAgIHJldHVybmluZyAqO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBSLmluc2VydF9ocmRfaG9hcmRfcnVuX3YgPSBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIGhyZF9ob2FyZF9ydW5zICggcm93aWQsIGxvLCBoaSwgc2NhdHRlciApIHZhbHVlcyAoXG4gICAgICAgICAgcHJpbnRmKCAje0xJVCBjZmcucnVuc19yb3dpZF90ZW1wbGF0ZX0sIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSggJ2hyZF9zZXFfaG9hcmRfcnVucycgKSApLFxuICAgICAgICAgICRsbyxcbiAgICAgICAgICAkaGksXG4gICAgICAgICAgJHNjYXR0ZXIgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIFJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBSdW4sIFNjYXR0ZXIsIHRlbXBsYXRlcywgSUZOLCB9XG4gIHJldHVybiB7XG4gICAgSG9hcmQsXG4gICAgc3VtbWFyaXplX2RhdGEsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
