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
    Dbric_std_base.prefix = 'std';

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

    //---------------------------------------------------------------------------------------------------------
    Dbric_std_variables.prefix = 'std';

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

  Dbric_std = (function() {
    //===========================================================================================================
    class Dbric_std extends Dbric_std_variables {};

    //---------------------------------------------------------------------------------------------------------
    Dbric_std.prefix = 'std';

    return Dbric_std;

  }).call(this);

  //===========================================================================================================
  module.exports = {
    Dbric_std,
    internals: {Dbric_std_base, Dbric_std_variables}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXN0ZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTs7O0VBR0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjs7RUFDbEMsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDhCQUFWLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDRCQUFWLENBQUEsQ0FBd0MsQ0FBQyxNQUQzRTs7RUFFQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQzs7RUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQzs7RUFFQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixDQUFsQyxFQWJBOzs7RUFlQSxDQUFBLENBQUUsSUFBRixFQUNFLEtB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QUEsd0JBQUQsQ0FBMEIsSUFBMUI7UUFBWjtNQURSLENBREY7O01BS0EsZ0JBQUEsRUFDRTtRQUFBLGFBQUEsRUFBZSxLQUFmO1FBQ0EsS0FBQSxFQUFRLFFBQUEsQ0FBRSxJQUFGLENBQUE7aUJBQVksSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQWxCO1FBQVo7TUFEUjtJQU5GOzs7SUFVRixtQkFBQyxDQUFBLFVBQUQsR0FDRTtNQUFBLGdCQUFBLEVBQXNCLEdBQUcsQ0FBQTs7dUNBQUEsQ0FBekI7TUFJQSxpQkFBQSxFQUFzQixHQUFHLENBQUEsMkRBQUE7SUFKekI7Ozs7OztFQWlIRTs7SUFBTixNQUFBLFVBQUEsUUFBd0Isb0JBQXhCLENBQUE7OztJQUdFLFNBQUMsQ0FBQSxNQUFELEdBQVM7Ozs7Z0JBcFNYOzs7RUF3U0EsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBRSxTQUFGO0lBQWEsU0FBQSxFQUFXLENBQUUsY0FBRixFQUFrQixtQkFBbEI7RUFBeEI7QUF4U2pCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBFLCAgICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtZXJyb3JzJ1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbnsgRGJyaWMsXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cdD0gcmVxdWlyZSAnLi9kYnJpYy1tYWluJ1xuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19zdGRfYmFzZSBleHRlbmRzIERicmljXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcHJlZml4OiAnc3RkJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGZ1bmN0aW9uczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmVnZXhwOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2lzX3VjX25vcm1hbDpcbiAgICAgICMjIyBOT1RFOiBhbHNvIHNlZSBgU3RyaW5nOjppc1dlbGxGb3JtZWQoKWAgIyMjXG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBmcm9tX2Jvb2wgdGV4dCBpcyB0ZXh0Lm5vcm1hbGl6ZSBmb3JtICMjIyAnTkZDJywgJ05GRCcsICdORktDJywgb3IgJ05GS0QnICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX3RleHQ6XG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV90ZXh0IHRleHQsIGZvcm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDpcbiAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEB0YWJsZV9mdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgcGFyYW1ldGVyczogICBbICdzdGFydCcsICdzdG9wJywgJ3N0ZXAnLCBdXG4gICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgIHN0ZXAgID0gMSBpZiBzdGVwIGlzIDAgIyMjIE5PVEUgZXF1aXZhbGVudCBgKCBPYmplY3QuaXMgc3RlcCwgKzAgKSBvciAoIE9iamVjdC5pcyBzdGVwLCAtMCApICMjI1xuICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgIGxvb3BcbiAgICAgICAgICBpZiBzdGVwID4gMCB0aGVuICBicmVhayBpZiB2YWx1ZSA+IHN0b3BcbiAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgdmFsdWUgKz0gc3RlcFxuICAgICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHN0YXRlbWVudHM6XG4gICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAYnVpbGQ6IFtcbiAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzICAgIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3JlbGF0aW9ucyBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgIF1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBVREYgaW1wbGVtZW50YXRpb25zICMjI1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9ub3JtYWxpemVfdGV4dDogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiB0ZXh0Lm5vcm1hbGl6ZSBmb3JtXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgZGF0YSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nICfOqWRicmljc19fXzEnLCB0eXBlLCBkYXRhXG4gICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICB1bmxlc3MgKCBkYXRhLnN0YXJ0c1dpdGggJ3snICkgYW5kICggZGF0YS5lbmRzV2l0aCAnfScgKVxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljc19fXzInLCBkYXRhXG4gICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgIFIgICAgID0gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG4gICAgcmV0dXJuIEBzdGRfbm9ybWFsaXplX3RleHQgUiwgZm9ybVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgW1wiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIl06XG4gICAgICAjICAgIyMjIE5PVEUgYXNzdW1lcyB0aGF0IGBkYXRhYCBpcyBpbiBpdHMgbm9ybWFsaXplZCBzdHJpbmcgZm9ybSAjIyNcbiAgICAgICMgICBuYW1lOiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJcbiAgICAgICMgICB2YWx1ZTogKCBpc19oaXQsIGRhdGEgKSAtPiBnZXRfc2hhMXN1bTdkIFwiI3tpZiBpc19oaXQgdGhlbiAnSCcgZWxzZSAnRyd9I3tkYXRhfVwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBbXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIl06XG4gICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIlxuICAgICAgIyAgIHZhbHVlOiAoIGRhdGEgKSAtPlxuICAgICAgIyAgICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICAgICMgICAgICMgZGVidWcgJ86paW1fX18zJywgcnByIGRhdGFcbiAgICAgICMgICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAgICAjICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgIyAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkX3ZhcmlhYmxlcyBleHRlbmRzIERicmljX3N0ZF9iYXNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcHJlZml4OiAnc3RkJ1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIgUC4uLlxuICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzICAgICAgICAgICAgICAgICA/PSBmcmVlemUge31cbiAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgID89IGZhbHNlXG4gICAgO3VuZGVmaW5lZFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGJ1aWxkOiBbXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBzdGRfdmFyaWFibGVzIChcbiAgICAgICAgbmFtZSAgICAgIHRleHQgICAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICB2YWx1ZSAgICAganNvbiAgICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsXG4gICAgICAgIGRlbHRhICAgICBpbnRlZ2VyICAgICAgICAgICAgICAgbnVsbCBkZWZhdWx0IG51bGwsXG4gICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKVxuICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fXzRcIiBjaGVjayAoICggZGVsdGEgaXMgbnVsbCApIG9yICggZGVsdGEgIT0gMCApIClcbiAgICAgICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFNRTFwiXCJcImluc2VydCBpbnRvIHN0ZF92YXJpYWJsZXMgKCBuYW1lLCB2YWx1ZSwgZGVsdGEgKSB2YWx1ZXMgKCAnc2VxOmdsb2JhbDpyb3dpZCcsIDAsICsxICk7XCJcIlwiXG4gICAgXVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGZ1bmN0aW9uczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZSBuYW1lXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfdmFyaWFibGU6XG4gICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgdmFsdWU6ICAoIG5hbWUgKSAtPiBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAc3RhdGVtZW50czpcbiAgICBzdGRfc2V0X3ZhcmlhYmxlOiAgICAgU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJG5hbWUsICR2YWx1ZSwgJGRlbHRhIClcbiAgICAgICAgb24gY29uZmxpY3QgKCBuYW1lICkgZG8gdXBkYXRlXG4gICAgICAgICAgc2V0IHZhbHVlID0gJHZhbHVlLCBkZWx0YSA9ICRkZWx0YTtcIlwiXCJcbiAgICBzdGRfZ2V0X3ZhcmlhYmxlczogICAgU1FMXCJzZWxlY3QgbmFtZSwgdmFsdWUsIGRlbHRhIGZyb20gc3RkX3ZhcmlhYmxlcyBvcmRlciBieSBuYW1lO1wiXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBfc3RkX2FjcXVpcmVfc3RhdGU6ICggdHJhbnNpZW50cyA9IHt9ICkgLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgKCB2ICkgPT5cbiAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIEBzdGF0ZW1lbnRzLnN0ZF9nZXRfdmFyaWFibGVzLml0ZXJhdGUoKVxuICAgICAgICB2YWx1ZSAgICAgPSBKU09OLnBhcnNlIHZhbHVlXG4gICAgICAgIHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgdHJhbnNpZW50c1xuICAgICAgICB0WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCB9XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9zdGRfcGVyc2lzdF9zdGF0ZTogLT5cbiAgICAjIHdoaXNwZXIgJ86pZGJyaWNzX19fNScsIFwiX3N0ZF9wZXJzaXN0X3N0YXRlXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBfLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBvZiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1xuICAgICAgIyMjIFRBSU5UIGNsZWFyIGNhY2hlIGluIEBzdGF0ZS5zdGRfdmFyaWFibGVzID8gIyMjXG4gICAgICAjIHdoaXNwZXIgJ86pZGJyaWNzX19fNicsIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICBkZWx0YSAgPz0gbnVsbFxuICAgICAgdmFsdWUgICA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICBAc3RhdGVtZW50cy5zdGRfc2V0X3ZhcmlhYmxlLnJ1biB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICBkZWxldGUgdFsgbmFtZSBdIGZvciBuYW1lIG9mIHRcbiAgICAgIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX3dpdGhfdmFyaWFibGVzOiAoIHRyYW5zaWVudHMsIGZuICkgLT5cbiAgICBzd2l0Y2ggYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aGVuIDEgdGhlbiBbIHRyYW5zaWVudHMsIGZuLCBdID0gWyB7fSwgdHJhbnNpZW50cywgXVxuICAgICAgd2hlbiAyIHRoZW4gbnVsbFxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fXzcgZXhwZWN0ZWQgMSBvciAyIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fXzggaWxsZWdhbCB0byBuZXN0IGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ID0gdHJ1ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQF9zdGRfYWNxdWlyZV9zdGF0ZSB0cmFuc2llbnRzXG4gICAgdHJ5XG4gICAgICBSID0gZm4oKVxuICAgIGZpbmFsbHlcbiAgICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ID0gZmFsc2VcbiAgICAgIEBfc3RkX3BlcnNpc3Rfc3RhdGUoKVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfc2V0X3ZhcmlhYmxlOiAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIC0+XG4gICAgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fXzkgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICBpZiBSZWZsZWN0LmhhcyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsIG5hbWVcbiAgICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSA9PiB0WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCB9XG4gICAgZWxzZVxuICAgICAgZGVsdGEgPz0gbnVsbFxuICAgICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgPSBsZXRzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCAgICggdiApID0+IHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9nZXRfdmFyaWFibGU6ICggbmFtZSApIC0+XG4gICAgIyB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfXzEwIGlsbGVnYWwgdG8gZ2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICByZXR1cm4gQHN0YXRlLnN0ZF90cmFuc2llbnRzWyBuYW1lIF0udmFsdWVcbiAgICBpZiBSZWZsZWN0LmhhcyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgbmFtZVxuICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0udmFsdWVcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljc19fMTEgdW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTogKCBuYW1lICkgLT5cbiAgICB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX18xMiBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgIHVubGVzcyAoIGVudHJ5ID0gQHN0YXRlLnN0ZF92YXJpYWJsZXNbIG5hbWUgXSApP1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY3NfXzEzIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgIHVubGVzcyAoIGRlbHRhID0gZW50cnkuZGVsdGEgKT9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNzX18xNCBub3QgYSBzZXF1ZW5jZSBuYW1lOiAje3JwciBuYW1lfVwiXG4gICAgZW50cnkudmFsdWUgKz0gZGVsdGFcbiAgICByZXR1cm4gZW50cnkudmFsdWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9zaG93X3ZhcmlhYmxlczogKCBwcmludF90YWJsZSA9IGZhbHNlICkgLT5cbiAgICBzdG9yZSAgICAgICA9IE9iamVjdC5mcm9tRW50cmllcyAoIFxcXG4gICAgICBbIG5hbWUsIHsgdmFsdWUsIGRlbHRhLCB9LCBdIFxcXG4gICAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIFxcXG4gICAgICAgICAgQHN0YXRlbWVudHMuc3RkX2dldF92YXJpYWJsZXMuaXRlcmF0ZSgpIClcbiAgICBjYWNoZV9uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICB0cmFuc19uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzXG4gICAgc3RvcmVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIHN0b3JlXG4gICAgYWxsX25hbWVzICAgPSBbICggKCBjYWNoZV9uYW1lcy51bmlvbiBzdG9yZV9uYW1lcyApLnVuaW9uIHRyYW5zX25hbWVzICkuLi4sIF0uc29ydCgpXG4gICAgUiA9IHt9XG4gICAgZm9yIG5hbWUgaW4gYWxsX25hbWVzXG4gICAgICBzICAgICAgICAgPSBzdG9yZVsgICAgICAgICAgICAgICAgICBuYW1lIF0gPyB7fVxuICAgICAgYyAgICAgICAgID0gQHN0YXRlLnN0ZF92YXJpYWJsZXNbICAgbmFtZSBdID8ge31cbiAgICAgIHQgICAgICAgICA9IEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgIG5hbWUgXSA/IHt9XG4gICAgICBndiAgICAgICAgPSBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG4gICAgICBSWyBuYW1lIF0gPSB7IHN2OiBzLnZhbHVlLCBzZDogcy5kZWx0YSwgY3Y6IGMudmFsdWUsIGNkOiBjLmRlbHRhLCB0djogdC52YWx1ZSwgZ3YsIH1cbiAgICBjb25zb2xlLnRhYmxlIFIgaWYgcHJpbnRfdGFibGVcbiAgICByZXR1cm4gUlxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNfc3RkX3ZhcmlhYmxlc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHByZWZpeDogJ3N0ZCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0geyBEYnJpY19zdGQsIGludGVybmFsczogeyBEYnJpY19zdGRfYmFzZSwgRGJyaWNfc3RkX3ZhcmlhYmxlcywgfSwgfVxuXG5cbiJdfQ==
