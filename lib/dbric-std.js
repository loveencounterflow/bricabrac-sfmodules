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

    //---------------------------------------------------------------------------------------------------------
    Dbric_std_base.cfg = freeze({
      prefix: 'std'
    });

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
    // ["#{prefix}_get_sha1sum7d"]:
    //   ### NOTE assumes that `data` is in its normalized string form ###
    //   name: "#{prefix}_get_sha1sum7d"
    //   value: ( is_hit, data ) -> get_sha1sum7d "#{if is_hit then 'H' else 'G'}#{data}"

      // #---------------------------------------------------------------------------------------------------
    // ["#{prefix}_normalize_data"]:
    //   name: "#{prefix}_normalize_data"
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
          for (x of this.statements.get_variables.iterate()) {
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
          this.statements.set_variable.run({name, value, delta});
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
          for (x of this.statements.get_variables.iterate()) {
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
      set_variable: SQL`insert into std_variables ( name, value, delta ) values ( $name, $value, $delta )
  on conflict ( name ) do update
    set value = $value, delta = $delta;`,
      get_variables: SQL`select name, value, delta from std_variables order by name;`
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXN0ZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTs7O0VBR0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjs7RUFDbEMsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDhCQUFWLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDRCQUFWLENBQUEsQ0FBd0MsQ0FBQyxNQUQzRTs7RUFFQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQzs7RUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQzs7RUFFQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixDQUFsQyxFQWJBOzs7RUFlQSxDQUFBLENBQUUsSUFBRixFQUNFLEtB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QUMsQ0FBQSx3QkFBRCxDQUEwQixJQUExQjtRQUFaO01BRFIsQ0FERjs7TUFLQSxnQkFBQSxFQUNFO1FBQUEsYUFBQSxFQUFlLEtBQWY7UUFDQSxLQUFBLEVBQVEsUUFBQSxDQUFFLElBQUYsQ0FBQTtpQkFBWSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEI7UUFBWjtNQURSO0lBTkY7OztJQVVGLG1CQUFDLENBQUEsVUFBRCxHQUNFO01BQUEsWUFBQSxFQUFrQixHQUFHLENBQUE7O3VDQUFBLENBQXJCO01BSUEsYUFBQSxFQUFrQixHQUFHLENBQUEsMkRBQUE7SUFKckI7Ozs7Z0JBOUtKOzs7RUErUk0sWUFBTixNQUFBLFVBQUEsUUFBd0Isb0JBQXhCLENBQUEsRUEvUkE7OztFQWtTQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFFLFNBQUY7SUFBYSxTQUFBLEVBQVcsQ0FBRSxjQUFGLEVBQWtCLG1CQUFsQjtFQUF4QjtBQWxTakIiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IGxldHMsXG4gIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xueyBkZWJ1ZyxcbiAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgVHJ1ZSxcbiAgRmFsc2UsXG4gIGZyb21fYm9vbCxcbiAgYXNfYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBJRE4sXG4gIExJVCxcbiAgVkVDLFxuICBTUUwsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtdXRpbGl0aWVzJ1xueyBEYnJpYyxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVx0PSByZXF1aXJlICcuL2RicmljLW1haW4nXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZF9iYXNlIGV4dGVuZHMgRGJyaWNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBjZmc6IGZyZWV6ZVxuICAgIHByZWZpeDogJ3N0ZCdcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBmdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlZ2V4cDpcbiAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgIHZhbHVlOiAoIHBhdHRlcm4sIHRleHQgKSAtPiBpZiAoICggbmV3IFJlZ0V4cCBwYXR0ZXJuLCAndicgKS50ZXN0IHRleHQgKSB0aGVuIDEgZWxzZSAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9pc191Y19ub3JtYWw6XG4gICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gZnJvbV9ib29sIHRleHQgaXMgdGV4dC5ub3JtYWxpemUgZm9ybSAjIyMgJ05GQycsICdORkQnLCAnTkZLQycsIG9yICdORktEJyAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV90ZXh0OlxuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gQHN0ZF9ub3JtYWxpemVfdGV4dCB0ZXh0LCBmb3JtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9ub3JtYWxpemVfanNvbl9vYmplY3Q6XG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdCBkYXRhLCBmb3JtXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAdGFibGVfZnVuY3Rpb25zOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgIHBhcmFtZXRlcnM6ICAgWyAnc3RhcnQnLCAnc3RvcCcsICdzdGVwJywgXVxuICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICBzdGVwICA9IDEgaWYgc3RlcCBpcyAwICMjIyBOT1RFIGVxdWl2YWxlbnQgYCggT2JqZWN0LmlzIHN0ZXAsICswICkgb3IgKCBPYmplY3QuaXMgc3RlcCwgLTAgKSAjIyNcbiAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICBsb29wXG4gICAgICAgICAgaWYgc3RlcCA+IDAgdGhlbiAgYnJlYWsgaWYgdmFsdWUgPiBzdG9wXG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgIHZhbHVlICs9IHN0ZXBcbiAgICAgICAgO251bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBzdGF0ZW1lbnRzOlxuICAgIHN0ZF9nZXRfc2NoZW1hOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgIHN0ZF9nZXRfcmVsYXRpb25zOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgc2VsZWN0IG5hbWUsIGJ1aWx0aW4sIHR5cGUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpICMjI1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGJ1aWxkOiBbXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyAgICAgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF9yZWxhdGlvbnMgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcbiAgICBdXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVURGIGltcGxlbWVudGF0aW9ucyAjIyNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfbm9ybWFsaXplX3RleHQ6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gdGV4dC5ub3JtYWxpemUgZm9ybVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPlxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGRhdGEgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyAnzqlkYnJpY3NfX18xJywgdHlwZSwgZGF0YVxuICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgdW5sZXNzICggZGF0YS5zdGFydHNXaXRoICd7JyApIGFuZCAoIGRhdGEuZW5kc1dpdGggJ30nIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyAnzqlkYnJpY3NfX18yJywgZGF0YVxuICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAga2V5cyAgPSAoIE9iamVjdC5rZXlzIGRhdGEgKS5zb3J0KClcbiAgICBSICAgICA9IEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuICAgIHJldHVybiBAc3RkX25vcm1hbGl6ZV90ZXh0IFIsIGZvcm1cblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIFtcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJdOlxuICAgICAgIyAgICMjIyBOT1RFIGFzc3VtZXMgdGhhdCBgZGF0YWAgaXMgaW4gaXRzIG5vcm1hbGl6ZWQgc3RyaW5nIGZvcm0gIyMjXG4gICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXG4gICAgICAjICAgdmFsdWU6ICggaXNfaGl0LCBkYXRhICkgLT4gZ2V0X3NoYTFzdW03ZCBcIiN7aWYgaXNfaGl0IHRoZW4gJ0gnIGVsc2UgJ0cnfSN7ZGF0YX1cIlxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgW1wiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJdOlxuICAgICAgIyAgIG5hbWU6IFwiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJcbiAgICAgICMgICB2YWx1ZTogKCBkYXRhICkgLT5cbiAgICAgICMgICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgICAjICAgICAjIGRlYnVnICfOqWltX19fMycsIHJwciBkYXRhXG4gICAgICAjICAgICBkYXRhICA9IEpTT04ucGFyc2UgZGF0YVxuICAgICAgIyAgICAga2V5cyAgPSAoIE9iamVjdC5rZXlzIGRhdGEgKS5zb3J0KClcbiAgICAgICMgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGssIGRhdGFbIGsgXSwgXSBmb3IgayBpbiBrZXlzIClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZF92YXJpYWJsZXMgZXh0ZW5kcyBEYnJpY19zdGRfYmFzZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIgUC4uLlxuICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzICAgICAgICAgICAgICAgICA/PSBmcmVlemUge31cbiAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgID89IGZhbHNlXG4gICAgO3VuZGVmaW5lZFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGJ1aWxkOiBbXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBzdGRfdmFyaWFibGVzIChcbiAgICAgICAgbmFtZSAgICAgIHRleHQgICAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICB2YWx1ZSAgICAganNvbiAgICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsXG4gICAgICAgIGRlbHRhICAgICBpbnRlZ2VyICAgICAgICAgICAgICAgbnVsbCBkZWZhdWx0IG51bGwsXG4gICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKVxuICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fXzRcIiBjaGVjayAoICggZGVsdGEgaXMgbnVsbCApIG9yICggZGVsdGEgIT0gMCApIClcbiAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFNRTFwiXCJcImluc2VydCBpbnRvIHN0ZF92YXJpYWJsZXMgKCBuYW1lLCB2YWx1ZSwgZGVsdGEgKSB2YWx1ZXMgKCAnc2VxOmdsb2JhbDpyb3dpZCcsIDAsICsxICk7XCJcIlwiXG4gICAgXVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGZ1bmN0aW9uczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSBuYW1lXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfdmFyaWFibGU6XG4gICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgdmFsdWU6ICAoIG5hbWUgKSAtPiBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAc3RhdGVtZW50czpcbiAgICBzZXRfdmFyaWFibGU6ICAgICBTUUxcIlwiXCJcbiAgICAgIGluc2VydCBpbnRvIHN0ZF92YXJpYWJsZXMgKCBuYW1lLCB2YWx1ZSwgZGVsdGEgKSB2YWx1ZXMgKCAkbmFtZSwgJHZhbHVlLCAkZGVsdGEgKVxuICAgICAgICBvbiBjb25mbGljdCAoIG5hbWUgKSBkbyB1cGRhdGVcbiAgICAgICAgICBzZXQgdmFsdWUgPSAkdmFsdWUsIGRlbHRhID0gJGRlbHRhO1wiXCJcIlxuICAgIGdldF92YXJpYWJsZXM6ICAgIFNRTFwic2VsZWN0IG5hbWUsIHZhbHVlLCBkZWx0YSBmcm9tIHN0ZF92YXJpYWJsZXMgb3JkZXIgYnkgbmFtZTtcIlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgX3N0ZF9hY3F1aXJlX3N0YXRlOiAoIHRyYW5zaWVudHMgPSB7fSApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA9IGxldHMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsICggdiApID0+XG4gICAgICBmb3IgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gZnJvbSBAc3RhdGVtZW50cy5nZXRfdmFyaWFibGVzLml0ZXJhdGUoKVxuICAgICAgICB2YWx1ZSAgICAgPSBKU09OLnBhcnNlIHZhbHVlXG4gICAgICAgIHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgdHJhbnNpZW50c1xuICAgICAgICB0WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCB9XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9zdGRfcGVyc2lzdF9zdGF0ZTogLT5cbiAgICAjIHdoaXNwZXIgJ86pZGJyaWNzX19fNScsIFwiX3N0ZF9wZXJzaXN0X3N0YXRlXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBfLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBvZiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1xuICAgICAgIyMjIFRBSU5UIGNsZWFyIGNhY2hlIGluIEBzdGF0ZS5zdGRfdmFyaWFibGVzID8gIyMjXG4gICAgICAjIHdoaXNwZXIgJ86pZGJyaWNzX19fNicsIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICBkZWx0YSAgPz0gbnVsbFxuICAgICAgdmFsdWUgICA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICBAc3RhdGVtZW50cy5zZXRfdmFyaWFibGUucnVuIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgLT5cbiAgICAgIGRlbGV0ZSB0WyBuYW1lIF0gZm9yIG5hbWUgb2YgdFxuICAgICAgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfd2l0aF92YXJpYWJsZXM6ICggdHJhbnNpZW50cywgZm4gKSAtPlxuICAgIHN3aXRjaCBhcml0eSA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHdoZW4gMSB0aGVuIFsgdHJhbnNpZW50cywgZm4sIF0gPSBbIHt9LCB0cmFuc2llbnRzLCBdXG4gICAgICB3aGVuIDIgdGhlbiBudWxsXG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX19fNyBleHBlY3RlZCAxIG9yIDIgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX19fOCBpbGxlZ2FsIHRvIG5lc3QgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSB0cnVlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAX3N0ZF9hY3F1aXJlX3N0YXRlIHRyYW5zaWVudHNcbiAgICB0cnlcbiAgICAgIFIgPSBmbigpXG4gICAgZmluYWxseVxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSBmYWxzZVxuICAgICAgQF9zdGRfcGVyc2lzdF9zdGF0ZSgpXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9zZXRfdmFyaWFibGU6ICggbmFtZSwgdmFsdWUsIGRlbHRhICkgLT5cbiAgICB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX19fOSBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApID0+IHRbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIH1cbiAgICBlbHNlXG4gICAgICBkZWx0YSA/PSBudWxsXG4gICAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA9IGxldHMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsICAgKCB2ICkgPT4gdlsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX2dldF92YXJpYWJsZTogKCBuYW1lICkgLT5cbiAgICAjIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICMgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fMTAgaWxsZWdhbCB0byBnZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICBpZiBSZWZsZWN0LmhhcyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsIG5hbWVcbiAgICAgIHJldHVybiBAc3RhdGUuc3RkX3RyYW5zaWVudHNbIG5hbWUgXS52YWx1ZVxuICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCBuYW1lXG4gICAgICByZXR1cm4gQHN0YXRlLnN0ZF92YXJpYWJsZXNbIG5hbWUgXS52YWx1ZVxuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX18xMSB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOiAoIG5hbWUgKSAtPlxuICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfXzEyIGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgdW5sZXNzICggZW50cnkgPSBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdICk/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fMTMgdW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICAgdW5sZXNzICggZGVsdGEgPSBlbnRyeS5kZWx0YSApP1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfXzE0IG5vdCBhIHNlcXVlbmNlIG5hbWU6ICN7cnByIG5hbWV9XCJcbiAgICBlbnRyeS52YWx1ZSArPSBkZWx0YVxuICAgIHJldHVybiBlbnRyeS52YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3Nob3dfdmFyaWFibGVzOiAoIHByaW50X3RhYmxlID0gZmFsc2UgKSAtPlxuICAgIHN0b3JlICAgICAgID0gT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgIFsgbmFtZSwgeyB2YWx1ZSwgZGVsdGEsIH0sIF0gXFxcbiAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gXFxcbiAgICAgICAgICBAc3RhdGVtZW50cy5nZXRfdmFyaWFibGVzLml0ZXJhdGUoKSApXG4gICAgY2FjaGVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgdHJhbnNfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1xuICAgIHN0b3JlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBzdG9yZVxuICAgIGFsbF9uYW1lcyAgID0gWyAoICggY2FjaGVfbmFtZXMudW5pb24gc3RvcmVfbmFtZXMgKS51bmlvbiB0cmFuc19uYW1lcyApLi4uLCBdLnNvcnQoKVxuICAgIFIgPSB7fVxuICAgIGZvciBuYW1lIGluIGFsbF9uYW1lc1xuICAgICAgcyAgICAgICAgID0gc3RvcmVbICAgICAgICAgICAgICAgICAgbmFtZSBdID8ge31cbiAgICAgIGMgICAgICAgICA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyAgIG5hbWUgXSA/IHt9XG4gICAgICB0ICAgICAgICAgPSBAc3RhdGUuc3RkX3RyYW5zaWVudHNbICBuYW1lIF0gPyB7fVxuICAgICAgZ3YgICAgICAgID0gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuICAgICAgUlsgbmFtZSBdID0geyBzdjogcy52YWx1ZSwgc2Q6IHMuZGVsdGEsIGN2OiBjLnZhbHVlLCBjZDogYy5kZWx0YSwgdHY6IHQudmFsdWUsIGd2LCB9XG4gICAgY29uc29sZS50YWJsZSBSIGlmIHByaW50X3RhYmxlXG4gICAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljX3N0ZF92YXJpYWJsZXNcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHsgRGJyaWNfc3RkLCBpbnRlcm5hbHM6IHsgRGJyaWNfc3RkX2Jhc2UsIERicmljX3N0ZF92YXJpYWJsZXMsIH0sIH1cblxuXG4iXX0=
