(function() {
  'use strict';
  var Dbric, Dbric_std, Dbric_std_base, Dbric_std_variables, E, False, IDN, LIT, SFMODULES, SQL, True, VEC, as_bool, debug, freeze, from_bool, hide, lets, nfa, rpr, set_getter, type_of, unquote_name, warn;

  //===========================================================================================================
  SFMODULES = require('./main');

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);

  ({nfa} = require('normalize-function-arguments'));

  ({debug, warn} = console);

  ({E} = require('./dbric-errors'));

  //-----------------------------------------------------------------------------------------------------------
  ({True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL} = require('./dbric-utilities'));

  ({Dbric} = require('./dbric-main'));

  Dbric_std_base = (function() {
    //===========================================================================================================
    class Dbric_std_base extends Dbric {
      //=========================================================================================================
      /* UDF implementations */
      //---------------------------------------------------------------------------------------------------------
      std_normalize_text(text, form = 'NFC') {
        return text.normalize(form);
      }

      //---------------------------------------------------------------------------------------------------------
      std_normalize_json_object(data, form = 'NFC') {
        var R, k, keys, type;
        if ((type = type_of(data)) !== 'text') {
          throw new E.Dbric_expected_string('Ωdbrics___1', type, data);
        }
        if (data === 'null') {
          return data;
        }
        if (!((data.startsWith('{')) && (data.endsWith('}')))) {
          throw new E.Dbric_expected_json_object_string('Ωdbrics___2', data);
        }
        data = JSON.parse(data);
        keys = (Object.keys(data)).sort();
        R = JSON.stringify(Object.fromEntries((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = keys.length; i < len; i++) {
            k = keys[i];
            results.push([k, data[k]]);
          }
          return results;
        })()));
        return this.std_normalize_text(R, form);
      }

    };

    //=========================================================================================================
    Dbric_std_base.functions = {
      //-------------------------------------------------------------------------------------------------------
      regexp: {
        deterministic: true,
        value: function(pattern, text) {
          if ((new RegExp(pattern, 'v')).test(text)) {
            return 1;
          } else {
            return 0;
          }
        }
      },
      //-------------------------------------------------------------------------------------------------------
      std_is_uc_normal: {
        /* NOTE: also see `String::isWellFormed()` */
        deterministic: true,
        value: function(text, form = 'NFC') {
          return from_bool(text === text.normalize(form));
        }
      },
      //-------------------------------------------------------------------------------------------------------
      /* 'NFC', 'NFD', 'NFKC', or 'NFKD' */std_normalize_text: {
        deterministic: true,
        value: function(text, form = 'NFC') {
          return this.std_normalize_text(text, form);
        }
      },
      //-------------------------------------------------------------------------------------------------------
      std_normalize_json_object: {
        deterministic: true,
        value: function(data, form = 'NFC') {
          return this.std_normalize_json_object(data, form);
        }
      }
    };

    //=========================================================================================================
    Dbric_std_base.table_functions = {
      //-------------------------------------------------------------------------------------------------------
      std_generate_series: {
        columns: ['value'],
        parameters: ['start', 'stop', 'step'],
        /* NOTE defaults and behavior as per https://sqlite.org/series.html#overview */
        rows: function*(start, stop = 4_294_967_295, step = 1) {
          var value;
          if (step === 0/* NOTE equivalent `( Object.is step, +0 ) or ( Object.is step, -0 ) */) {
            step = 1;
          }
          value = start;
          while (true) {
            if (step > 0) {
              if (value > stop) {
                break;
              }
            } else {
              if (value < stop) {
                break;
              }
            }
            yield ({value});
            value += step;
          }
          return null;
        }
      }
    };

    //=========================================================================================================
    Dbric_std_base.statements = {
      std_get_schema: SQL`select * from sqlite_schema;`,
      std_get_tables: SQL`select * from sqlite_schema where type is 'table';`,
      std_get_views: SQL`select * from sqlite_schema where type is 'view';`,
      std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' );`
    };

    //---------------------------------------------------------------------------------------------------------
    /* select name, builtin, type from pragma_function_list() */
    //---------------------------------------------------------------------------------------------------------
    Dbric_std_base.build = [SQL`create view std_tables    as select * from sqlite_schema where type is 'table';`, SQL`create view std_views     as select * from sqlite_schema where type is 'view';`, SQL`create view std_relations as select * from sqlite_schema where type in ( 'table', 'view' );`];

    return Dbric_std_base;

  }).call(this);

  Dbric_std_variables = (function() {
    // #---------------------------------------------------------------------------------------------------
    // get_sha1sum7d:
    //   ### NOTE assumes that `data` is in its normalized string form ###
    //   name: "get_sha1sum7d"
    //   value: ( is_hit, data ) -> get_sha1sum7d "#{if is_hit then 'H' else 'G'}#{data}"

      // #---------------------------------------------------------------------------------------------------
    // normalize_data:
    //   name: "normalize_data"
    //   value: ( data ) ->
    //     return data if data is 'null'
    //     # debug 'Ωim___3', rpr data
    //     data  = JSON.parse data
    //     keys  = ( Object.keys data ).sort()
    //     return JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )

      //===========================================================================================================
    class Dbric_std_variables extends Dbric_std_base {
      //---------------------------------------------------------------------------------------------------------
      constructor(...P) {
        var base, base1, base2;
        super(...P);
        if ((base = this.state).std_variables == null) {
          base.std_variables = freeze({});
        }
        if ((base1 = this.state).std_transients == null) {
          base1.std_transients = freeze({});
        }
        if ((base2 = this.state).std_within_variables_context == null) {
          base2.std_within_variables_context = false;
        }
        void 0;
      }

      //=========================================================================================================
      _std_acquire_state(transients = {}) {
        //.......................................................................................................
        this.state.std_variables = lets(this.state.std_variables, (v) => {
          var delta, name, value, x;
          for (x of this.statements.std_get_variables.iterate()) {
            ({name, value, delta} = x);
            value = JSON.parse(value);
            v[name] = {name, value, delta};
          }
          return null;
        });
        //.......................................................................................................
        this.state.std_transients = lets(this.state.std_transients, function(t) {
          var name, value;
          for (name in transients) {
            value = transients[name];
            t[name] = {name, value};
          }
          return null;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _std_persist_state() {
        var _, delta, name, ref, value;
        ref = this.state.std_variables;
        // whisper 'Ωdbrics___5', "_std_persist_state"
        //.......................................................................................................
        for (_ in ref) {
          ({name, value, delta} = ref[_]);
          /* TAINT clear cache in @state.std_variables ? */
          // whisper 'Ωdbrics___6', { name, value, delta, }
          if (delta == null) {
            delta = null;
          }
          value = JSON.stringify(value);
          this.statements.std_set_variable.run({name, value, delta});
        }
        //.......................................................................................................
        this.state.std_transients = lets(this.state.std_transients, function(t) {
          for (name in t) {
            delete t[name];
          }
          return null;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      std_with_variables(transients, fn) {
        var R, arity;
        switch (arity = arguments.length) {
          case 1:
            [transients, fn] = [{}, transients];
            break;
          case 2:
            null;
            break;
          default:
            throw new Error(`Ωdbrics___7 expected 1 or 2 arguments, got ${arity}`);
        }
        //.......................................................................................................
        if (this.state.std_within_variables_context) {
          throw new Error("Ωdbrics___8 illegal to nest `std_with_variables()` contexts");
        }
        this.state.std_within_variables_context = true;
        //.......................................................................................................
        this._std_acquire_state(transients);
        try {
          R = fn();
        } finally {
          this.state.std_within_variables_context = false;
          this._std_persist_state();
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      std_set_variable(name, value, delta) {
        if (!this.state.std_within_variables_context) {
          throw new Error("Ωdbrics___9 illegal to set variable outside of `std_with_variables()` contexts");
        }
        if (Reflect.has(this.state.std_transients, name)) {
          this.state.std_transients = lets(this.state.std_transients, (t) => {
            return t[name] = {name, value};
          });
        } else {
          if (delta == null) {
            delta = null;
          }
          this.state.std_variables = lets(this.state.std_variables, (v) => {
            return v[name] = {name, value, delta};
          });
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      std_get_variable(name) {
        // unless @state.std_within_variables_context
        //   throw new Error "Ωdbrics__10 illegal to get variable outside of `std_with_variables()` contexts"
        if (Reflect.has(this.state.std_transients, name)) {
          return this.state.std_transients[name].value;
        }
        if (Reflect.has(this.state.std_variables, name)) {
          return this.state.std_variables[name].value;
        }
        throw new Error(`Ωdbrics__11 unknown variable ${rpr(name)}`);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      std_get_next_in_sequence(name) {
        var delta, entry;
        if (!this.state.std_within_variables_context) {
          throw new Error("Ωdbrics__12 illegal to set variable outside of `std_with_variables()` contexts");
        }
        if ((entry = this.state.std_variables[name]) == null) {
          throw new Error(`Ωdbrics__13 unknown variable ${rpr(name)}`);
        }
        if ((delta = entry.delta) == null) {
          throw new Error(`Ωdbrics__14 not a sequence name: ${rpr(name)}`);
        }
        entry.value += delta;
        return entry.value;
      }

      //---------------------------------------------------------------------------------------------------------
      _show_variables(print_table = false) {
        var R, all_names, c, cache_names, delta, gv, i, len, name, ref, ref1, ref2, s, store, store_names, t, trans_names, value;
        store = Object.fromEntries((function() {
          var results, x;
          results = [];
          for (x of this.statements.std_get_variables.iterate()) {
            ({name, value, delta} = x);
            results.push([name, {value, delta}]);
          }
          return results;
        }).call(this));
        cache_names = new Set(Object.keys(this.state.std_variables));
        trans_names = new Set(Object.keys(this.state.std_transients));
        store_names = new Set(Object.keys(store));
        all_names = [...((cache_names.union(store_names)).union(trans_names))].sort();
        R = {};
        for (i = 0, len = all_names.length; i < len; i++) {
          name = all_names[i];
          s = (ref = store[name]) != null ? ref : {};
          c = (ref1 = this.state.std_variables[name]) != null ? ref1 : {};
          t = (ref2 = this.state.std_transients[name]) != null ? ref2 : {};
          gv = this.std_get_variable(name);
          R[name] = {
            sv: s.value,
            sd: s.delta,
            cv: c.value,
            cd: c.delta,
            tv: t.value,
            gv
          };
        }
        if (print_table) {
          console.table(R);
        }
        return R;
      }

    };

    //=========================================================================================================
    Dbric_std_variables.build = [
      //-------------------------------------------------------------------------------------------------------
      SQL`create table std_variables (
  name      text      unique  not null,
  value     json              not null default 'null',
  delta     integer               null default null,
primary key ( name )
constraint "Ωconstraint___4" check ( ( delta is null ) or ( delta != 0 ) )
);`,
      //-------------------------------------------------------------------------------------------------------
      SQL`insert into std_variables ( name, value, delta ) values ( 'seq:global:rowid', 0, +1 );`
    ];

    //=========================================================================================================
    Dbric_std_variables.functions = {
      //-------------------------------------------------------------------------------------------------------
      std_get_next_in_sequence: {
        deterministic: false,
        value: function(name) {
          return this.std_get_next_in_sequence(name);
        }
      },
      //-------------------------------------------------------------------------------------------------------
      std_get_variable: {
        deterministic: false,
        value: function(name) {
          return this.std_get_variable(name);
        }
      }
    };

    //=========================================================================================================
    Dbric_std_variables.statements = {
      std_set_variable: SQL`insert into std_variables ( name, value, delta ) values ( $name, $value, $delta )
  on conflict ( name ) do update
    set value = $value, delta = $delta;`,
      std_get_variables: SQL`select name, value, delta from std_variables order by name;`
    };

    return Dbric_std_variables;

  }).call(this);

  //===========================================================================================================
  Dbric_std = class Dbric_std extends Dbric_std_variables {};

  //===========================================================================================================
  module.exports = {
    Dbric_std,
    internals: {Dbric_std_base, Dbric_std_variables}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXN0ZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTs7O0VBR0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjs7RUFDbEMsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDhCQUFWLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDRCQUFWLENBQUEsQ0FBd0MsQ0FBQyxNQUQzRTs7RUFFQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQzs7RUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQzs7RUFFQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixDQUFsQyxFQWJBOzs7RUFlQSxDQUFBLENBQUUsSUFBRixFQUNFLEtB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QUEsYUFBQSxFQUFlLEtBQWY7UUFDQSxLQUFBLEVBQVEsUUFBQSxDQUFFLElBQUYsQ0FBQTtpQkFBWSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEI7UUFBWjtNQURSO0lBTkY7OztJQVVGLG1CQUFDLENBQUEsVUFBRCxHQUNFO01BQUEsZ0JBQUEsRUFBc0IsR0FBRyxDQUFBOzt1Q0FBQSxDQUF6QjtNQUlBLGlCQUFBLEVBQXNCLEdBQUcsQ0FBQSwyREFBQTtJQUp6Qjs7OztnQkExS0o7OztFQTJSTSxZQUFOLE1BQUEsVUFBQSxRQUF3QixvQkFBeEIsQ0FBQSxFQTNSQTs7O0VBK1JBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUUsU0FBRjtJQUFhLFNBQUEsRUFBVyxDQUFFLGNBQUYsRUFBa0IsbUJBQWxCO0VBQXhCO0FBL1JqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBUcnVlLFxuICBGYWxzZSxcbiAgZnJvbV9ib29sLFxuICBhc19ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIElETixcbiAgTElULFxuICBWRUMsXG4gIFNRTCwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy11dGlsaXRpZXMnXG57IERicmljLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XHQ9IHJlcXVpcmUgJy4vZGJyaWMtbWFpbidcblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkX2Jhc2UgZXh0ZW5kcyBEYnJpY1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGZ1bmN0aW9uczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmVnZXhwOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2lzX3VjX25vcm1hbDpcbiAgICAgICMjIyBOT1RFOiBhbHNvIHNlZSBgU3RyaW5nOjppc1dlbGxGb3JtZWQoKWAgIyMjXG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBmcm9tX2Jvb2wgdGV4dCBpcyB0ZXh0Lm5vcm1hbGl6ZSBmb3JtICMjIyAnTkZDJywgJ05GRCcsICdORktDJywgb3IgJ05GS0QnICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX3RleHQ6XG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV90ZXh0IHRleHQsIGZvcm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDpcbiAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEB0YWJsZV9mdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgcGFyYW1ldGVyczogICBbICdzdGFydCcsICdzdG9wJywgJ3N0ZXAnLCBdXG4gICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgIHN0ZXAgID0gMSBpZiBzdGVwIGlzIDAgIyMjIE5PVEUgZXF1aXZhbGVudCBgKCBPYmplY3QuaXMgc3RlcCwgKzAgKSBvciAoIE9iamVjdC5pcyBzdGVwLCAtMCApICMjI1xuICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgIGxvb3BcbiAgICAgICAgICBpZiBzdGVwID4gMCB0aGVuICBicmVhayBpZiB2YWx1ZSA+IHN0b3BcbiAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgdmFsdWUgKz0gc3RlcFxuICAgICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHN0YXRlbWVudHM6XG4gICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAYnVpbGQ6IFtcbiAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzICAgIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3JlbGF0aW9ucyBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgIF1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBVREYgaW1wbGVtZW50YXRpb25zICMjI1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9ub3JtYWxpemVfdGV4dDogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiB0ZXh0Lm5vcm1hbGl6ZSBmb3JtXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgZGF0YSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nICfOqWRicmljc19fXzEnLCB0eXBlLCBkYXRhXG4gICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICB1bmxlc3MgKCBkYXRhLnN0YXJ0c1dpdGggJ3snICkgYW5kICggZGF0YS5lbmRzV2l0aCAnfScgKVxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljc19fXzInLCBkYXRhXG4gICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgIFIgICAgID0gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG4gICAgcmV0dXJuIEBzdGRfbm9ybWFsaXplX3RleHQgUiwgZm9ybVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgZ2V0X3NoYTFzdW03ZDpcbiAgICAgICMgICAjIyMgTk9URSBhc3N1bWVzIHRoYXQgYGRhdGFgIGlzIGluIGl0cyBub3JtYWxpemVkIHN0cmluZyBmb3JtICMjI1xuICAgICAgIyAgIG5hbWU6IFwiZ2V0X3NoYTFzdW03ZFwiXG4gICAgICAjICAgdmFsdWU6ICggaXNfaGl0LCBkYXRhICkgLT4gZ2V0X3NoYTFzdW03ZCBcIiN7aWYgaXNfaGl0IHRoZW4gJ0gnIGVsc2UgJ0cnfSN7ZGF0YX1cIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgbm9ybWFsaXplX2RhdGE6XG4gICAgICAjICAgbmFtZTogXCJub3JtYWxpemVfZGF0YVwiXG4gICAgICAjICAgdmFsdWU6ICggZGF0YSApIC0+XG4gICAgICAjICAgICByZXR1cm4gZGF0YSBpZiBkYXRhIGlzICdudWxsJ1xuICAgICAgIyAgICAgIyBkZWJ1ZyAnzqlpbV9fXzMnLCBycHIgZGF0YVxuICAgICAgIyAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgICMgICAgIGtleXMgID0gKCBPYmplY3Qua2V5cyBkYXRhICkuc29ydCgpXG4gICAgICAjICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19zdGRfdmFyaWFibGVzIGV4dGVuZHMgRGJyaWNfc3RkX2Jhc2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgIHN1cGVyIFAuLi5cbiAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyAgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ICA/PSBmYWxzZVxuICAgIDt1bmRlZmluZWRcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBidWlsZDogW1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgc3RkX3ZhcmlhYmxlcyAoXG4gICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgdmFsdWUgICAgIGpzb24gICAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLFxuICAgICAgICBkZWx0YSAgICAgaW50ZWdlciAgICAgICAgICAgICAgIG51bGwgZGVmYXVsdCBudWxsLFxuICAgICAgcHJpbWFyeSBrZXkgKCBuYW1lIClcbiAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfX180XCIgY2hlY2sgKCAoIGRlbHRhIGlzIG51bGwgKSBvciAoIGRlbHRhICE9IDAgKSApXG4gICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUxcIlwiXCJpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJ3NlcTpnbG9iYWw6cm93aWQnLCAwLCArMSApO1wiXCJcIlxuICAgIF1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBmdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTpcbiAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UgbmFtZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2V0X3ZhcmlhYmxlOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHN0YXRlbWVudHM6XG4gICAgc3RkX3NldF92YXJpYWJsZTogICAgIFNRTFwiXCJcIlxuICAgICAgaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICRuYW1lLCAkdmFsdWUsICRkZWx0YSApXG4gICAgICAgIG9uIGNvbmZsaWN0ICggbmFtZSApIGRvIHVwZGF0ZVxuICAgICAgICAgIHNldCB2YWx1ZSA9ICR2YWx1ZSwgZGVsdGEgPSAkZGVsdGE7XCJcIlwiXG4gICAgc3RkX2dldF92YXJpYWJsZXM6ICAgIFNRTFwic2VsZWN0IG5hbWUsIHZhbHVlLCBkZWx0YSBmcm9tIHN0ZF92YXJpYWJsZXMgb3JkZXIgYnkgbmFtZTtcIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgX3N0ZF9hY3F1aXJlX3N0YXRlOiAoIHRyYW5zaWVudHMgPSB7fSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA9IGxldHMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsICggdiApID0+XG4gICAgICBmb3IgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gZnJvbSBAc3RhdGVtZW50cy5zdGRfZ2V0X3ZhcmlhYmxlcy5pdGVyYXRlKClcbiAgICAgICAgdmFsdWUgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIHRyYW5zaWVudHNcbiAgICAgICAgdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3RkX3BlcnNpc3Rfc3RhdGU6IC0+XG4gICAgIyB3aGlzcGVyICfOqWRicmljc19fXzUnLCBcIl9zdGRfcGVyc2lzdF9zdGF0ZVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgXywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gb2YgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICAgICMjIyBUQUlOVCBjbGVhciBjYWNoZSBpbiBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA/ICMjI1xuICAgICAgIyB3aGlzcGVyICfOqWRicmljc19fXzYnLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgZGVsdGEgID89IG51bGxcbiAgICAgIHZhbHVlICAgPSBKU09OLnN0cmluZ2lmeSB2YWx1ZVxuICAgICAgQHN0YXRlbWVudHMuc3RkX3NldF92YXJpYWJsZS5ydW4geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgZGVsZXRlIHRbIG5hbWUgXSBmb3IgbmFtZSBvZiB0XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF93aXRoX3ZhcmlhYmxlczogKCB0cmFuc2llbnRzLCBmbiApIC0+XG4gICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gWyB0cmFuc2llbnRzLCBmbiwgXSA9IFsge30sIHRyYW5zaWVudHMsIF1cbiAgICAgIHdoZW4gMiB0aGVuIG51bGxcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfX183IGV4cGVjdGVkIDEgb3IgMiBhcmd1bWVudHMsIGdvdCAje2FyaXR5fVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfX184IGlsbGVnYWwgdG8gbmVzdCBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IHRydWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBfc3RkX2FjcXVpcmVfc3RhdGUgdHJhbnNpZW50c1xuICAgIHRyeVxuICAgICAgUiA9IGZuKClcbiAgICBmaW5hbGx5XG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IGZhbHNlXG4gICAgICBAX3N0ZF9wZXJzaXN0X3N0YXRlKClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX3NldF92YXJpYWJsZTogKCBuYW1lLCB2YWx1ZSwgZGVsdGEgKSAtPlxuICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfX185IGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgPT4gdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgIGVsc2VcbiAgICAgIGRlbHRhID89IG51bGxcbiAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgICAoIHYgKSA9PiB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfZ2V0X3ZhcmlhYmxlOiAoIG5hbWUgKSAtPlxuICAgICMgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgIyAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX18xMCBpbGxlZ2FsIHRvIGdldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgbmFtZSBdLnZhbHVlXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsIG5hbWVcbiAgICAgIHJldHVybiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdLnZhbHVlXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfXzExIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2U6ICggbmFtZSApIC0+XG4gICAgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fMTIgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICB1bmxlc3MgKCBlbnRyeSA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0gKT9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX18xMyB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICB1bmxlc3MgKCBkZWx0YSA9IGVudHJ5LmRlbHRhICk/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fMTQgbm90IGEgc2VxdWVuY2UgbmFtZTogI3tycHIgbmFtZX1cIlxuICAgIGVudHJ5LnZhbHVlICs9IGRlbHRhXG4gICAgcmV0dXJuIGVudHJ5LnZhbHVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc2hvd192YXJpYWJsZXM6ICggcHJpbnRfdGFibGUgPSBmYWxzZSApIC0+XG4gICAgc3RvcmUgICAgICAgPSBPYmplY3QuZnJvbUVudHJpZXMgKCBcXFxuICAgICAgWyBuYW1lLCB7IHZhbHVlLCBkZWx0YSwgfSwgXSBcXFxuICAgICAgICBmb3IgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gZnJvbSBcXFxuICAgICAgICAgIEBzdGF0ZW1lbnRzLnN0ZF9nZXRfdmFyaWFibGVzLml0ZXJhdGUoKSApXG4gICAgY2FjaGVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgdHJhbnNfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1xuICAgIHN0b3JlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBzdG9yZVxuICAgIGFsbF9uYW1lcyAgID0gWyAoICggY2FjaGVfbmFtZXMudW5pb24gc3RvcmVfbmFtZXMgKS51bmlvbiB0cmFuc19uYW1lcyApLi4uLCBdLnNvcnQoKVxuICAgIFIgPSB7fVxuICAgIGZvciBuYW1lIGluIGFsbF9uYW1lc1xuICAgICAgcyAgICAgICAgID0gc3RvcmVbICAgICAgICAgICAgICAgICAgbmFtZSBdID8ge31cbiAgICAgIGMgICAgICAgICA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyAgIG5hbWUgXSA/IHt9XG4gICAgICB0ICAgICAgICAgPSBAc3RhdGUuc3RkX3RyYW5zaWVudHNbICBuYW1lIF0gPyB7fVxuICAgICAgZ3YgICAgICAgID0gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuICAgICAgUlsgbmFtZSBdID0geyBzdjogcy52YWx1ZSwgc2Q6IHMuZGVsdGEsIGN2OiBjLnZhbHVlLCBjZDogYy5kZWx0YSwgdHY6IHQudmFsdWUsIGd2LCB9XG4gICAgY29uc29sZS50YWJsZSBSIGlmIHByaW50X3RhYmxlXG4gICAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljX3N0ZF92YXJpYWJsZXNcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0geyBEYnJpY19zdGQsIGludGVybmFsczogeyBEYnJpY19zdGRfYmFzZSwgRGJyaWNfc3RkX3ZhcmlhYmxlcywgfSwgfVxuXG5cbiJdfQ==
