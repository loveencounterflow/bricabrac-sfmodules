(function() {
  'use strict';
  var Db_adapter, Dbric, Dbric_classprop_absorber, E, False, IDN, LIT, SQL, True, VEC, as_bool, build_statement_re, debug, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn;

  //###########################################################################################################

  //===========================================================================================================
  ({debug, warn} = console);

  //...........................................................................................................
  // Db_adapter                      = ( require 'node:sqlite' ).DatabaseSync
  Db_adapter = require('better-sqlite3');

  //...........................................................................................................
  ({nfa} = require('normalize-function-arguments'));

  //...........................................................................................................
  ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({lets, freeze} = (require('./letsfreezethat-infra.brics')).require_letsfreezethat_infra().simple);

  ({get_all_in_prototype_chain} = (require('./unstable-object-tools-brics')).require_get_prototype_chain());

  ({nfa} = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());

  // { Undumper,                   } = ( require './coarse-sqlite-statement-segmenter.brics' ).require_coarse_sqlite_statement_segmenter()
  //...........................................................................................................
  ({E} = require('./dbric-errors'));

  //...........................................................................................................
  misfit = Symbol('misfit');

  //-----------------------------------------------------------------------------------------------------------
  ({True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL} = require('./dbric-utilities'));

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT put into separate module */
  /* TAINT rewrite with `get_all_in_prototype_chain()` */
  /* TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` */
  get_property_descriptor = function(x, name, fallback = misfit) {
    var R;
    while (x != null) {
      if ((R = Object.getOwnPropertyDescriptor(x, name)) != null) {
        return R;
      }
      x = Object.getPrototypeOf(x);
    }
    if (fallback !== misfit) {
      return fallback;
    }
    throw new Error(`unable to find descriptor for property ${String(name)} not found on object or its prototypes`);
  };

  //-----------------------------------------------------------------------------------------------------------
  build_statement_re = /^\s*insert|((create|alter)\s+(?<type>table|view|index|trigger)\s+(?<name>\S+)\s+)/is;

  //-----------------------------------------------------------------------------------------------------------
  templates = {
    dbric_cfg: {
      prefix: null,
      default_prefix: null
    },
    //.........................................................................................................
    create_function_cfg: {
      deterministic: true,
      varargs: false,
      directOnly: false,
      overwrite: false
    },
    //.........................................................................................................
    create_aggregate_function_cfg: {
      deterministic: true,
      varargs: false,
      directOnly: false,
      start: null,
      overwrite: false
    },
    //.........................................................................................................
    create_window_function_cfg: {
      deterministic: true,
      varargs: false,
      directOnly: false,
      start: null,
      overwrite: false
    },
    //.........................................................................................................
    create_table_function_cfg: {
      deterministic: true,
      varargs: false,
      directOnly: false,
      overwrite: false
    },
    //.........................................................................................................
    create_virtual_table_cfg: {}
  };

  //===========================================================================================================
  Dbric_classprop_absorber = class Dbric_classprop_absorber {
    //---------------------------------------------------------------------------------------------------------
    _get_statements_in_prototype_chain(property_name, property_type) {
      /* TAINT use proper validation */
      var R, candidate, candidates, candidates_list, clasz, i, j, len, len1, statement_from_candidate, statement_name, type;
      clasz = this.constructor;
      candidates_list = (get_all_in_prototype_chain(clasz, property_name)).reverse();
      //.......................................................................................................
      statement_from_candidate = (candidate) => {
        var R, type;
        if ((type_of(candidate)) === 'function') {
          R = candidate.call(this);
        } else {
          R = candidate;
        }
        if ((type = type_of(R)) !== 'text') {
          throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___1', type);
        }
        return R;
      };
      //.......................................................................................................
      R = (function() {
        switch (property_type) {
          case 'list':
            return [];
          case 'pod':
            return {};
          default:
            throw new E.Dbric_internal_error('Ωdbricm___2', `unknown property_type ${rpr(property_type)}`);
        }
      })();
//.......................................................................................................
      for (i = 0, len = candidates_list.length; i < len; i++) {
        candidates = candidates_list[i];
        if ((type = type_of(candidates)) !== property_type) {
          throw new Error(`Ωdbricm___3 expected an optional ${property_type} for ${clasz.name}.${property_name}, got a ${type}`);
        }
        //.....................................................................................................
        if (property_type === 'list') {
          for (j = 0, len1 = candidates.length; j < len1; j++) {
            candidate = candidates[j];
            R.push(statement_from_candidate(candidate));
          }
        } else {
          for (statement_name in candidates) {
            candidate = candidates[statement_name];
            if (Reflect.has(R, statement_name)) {
              throw new E.Dbric_named_statement_exists('Ωdbricm___4', statement_name);
            }
            R[statement_name] = statement_from_candidate(candidate);
          }
        }
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_objects_in_build_statements() {
      /* TAINT does not yet deal with quoted names */
      var build_statement, build_statements, clasz, db_objects, error_count, i, len, match, message, name/* NOTE ignore statements like `insert` */, statement_count, type;
      clasz = this.constructor;
      db_objects = {};
      statement_count = 0;
      error_count = 0;
      build_statements = this._get_statements_in_prototype_chain('build', 'list');
      for (i = 0, len = build_statements.length; i < len; i++) {
        build_statement = build_statements[i];
        statement_count++;
        if ((match = build_statement.match(build_statement_re)) != null) {
          ({name, type} = match.groups);
          if (name == null) {
            continue;
          }
          name = unquote_name(name);
          db_objects[name] = {name, type};
        } else {
          error_count++;
          name = `error_${statement_count}`;
          type = 'error';
          message = `non-conformant statement: ${rpr(build_statement)}`;
          db_objects[name] = {name, type, message};
        }
      }
      return {error_count, statement_count, db_objects};
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_statements() {
      var clasz, statement, statement_name, statements;
      clasz = this.constructor;
      statements = this._get_statements_in_prototype_chain('statements', 'pod');
      for (statement_name in statements) {
        statement = statements[statement_name];
        this.statements[statement_name] = this.prepare(statement);
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _create_udfs() {
      /* TAINT should be put somewhere else? */
      var category, clasz, declarations, declarations_list, fn_cfg, i, j, len, len1, method_name, names_of_callables, property_name, ref, udf_name;
      clasz = this.constructor;
      names_of_callables = {
        function: ['value'],
        aggregate_function: ['start', 'step', 'result'],
        window_function: ['start', 'step', 'inverse', 'result'],
        table_function: ['rows'],
        virtual_table: ['rows']
      };
      ref = ['function', 'aggregate_function', 'window_function', 'table_function', 'virtual_table'];
      //.......................................................................................................
      for (i = 0, len = ref.length; i < len; i++) {
        category = ref[i];
        property_name = `${category}s`;
        method_name = `create_${category}`;
        declarations_list = (get_all_in_prototype_chain(clasz, property_name)).reverse();
        for (j = 0, len1 = declarations_list.length; j < len1; j++) {
          declarations = declarations_list[j];
          if (declarations == null) {
            continue;
          }
//...................................................................................................
          for (udf_name in declarations) {
            fn_cfg = declarations[udf_name];
            //.................................................................................................
            fn_cfg = lets(fn_cfg, (d) => {
              var callable, k, len2, name_of_callable, ref1;
              if (d.name == null) {
                d.name = udf_name;
              }
              ref1 = names_of_callables[category];
              //...............................................................................................
              /* bind UDFs to `this` */
              for (k = 0, len2 = ref1.length; k < len2; k++) {
                name_of_callable = ref1[k];
                if ((callable = d[name_of_callable]) == null) {
                  continue;
                }
                d[name_of_callable] = callable.bind(this);
              }
              return null;
            });
            this[method_name](fn_cfg);
          }
        }
      }
      //.......................................................................................................
      return null;
    }

  };

  Dbric = (function() {
    //===========================================================================================================
    class Dbric extends Dbric_classprop_absorber {
      //---------------------------------------------------------------------------------------------------------
      /* NOTE this unusual arrangement is solely there so we can call `super()` from an instance method */
      constructor(...P) {
        super();
        return this._constructor(...P);
      }

      //---------------------------------------------------------------------------------------------------------
      isa_statement(x) {
        return x instanceof this._statement_class;
      }

      //---------------------------------------------------------------------------------------------------------
      run_standard_pragmas() {
        /* not using `@db.pragma` as it is only provided by `better-sqlite3`'s DB class */
        (this.db.prepare(SQL`pragma journal_mode = wal;`)).run();
        (this.db.prepare(SQL`pragma foreign_keys = on;`)).run();
        (this.db.prepare(SQL`pragma busy_timeout = 60000;`)).run();
        (this./* time in ms */db.prepare(SQL`pragma strict       = on;`)).run();
        // @db.pragma SQL"journal_mode = wal"
        // @db.pragma SQL"foreign_keys = on"
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      initialize() {
        /* This method will be called *before* any build statements are executed and before any statements
           in `@constructor.statements` are prepared and is a good place to create user-defined functions
           (UDFs). You probably want to override it with a method that starts with `super()`. */
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _validate_is_property(name) {
        var descriptor;
        descriptor = get_property_descriptor(this, name);
        if ((type_of(descriptor.get)) === 'function') {
          return null;
        }
        throw new Error(`Ωdbricm___5 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
      }

      //---------------------------------------------------------------------------------------------------------
      _get_db_objects() {
        var R, dbo;
        R = {};
        for (dbo of (this.db.prepare(SQL`select name, type from sqlite_schema`)).iterate()) {
          R[dbo.name] = {
            name: dbo.name,
            type: dbo.type
          };
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      teardown() {
        var _, count, error, name, ref, type;
        count = 0;
        //.......................................................................................................
        (this.prepare(SQL`pragma foreign_keys = off;`)).run();
        ref = this._get_db_objects();
        for (_ in ref) {
          ({name, type} = ref[_]);
          count++;
          try {
            (this.prepare(SQL`drop ${type} ${IDN(name)};`)).run();
          } catch (error1) {
            error = error1;
            if (!RegExp(`no\\s+such\\s+${type}:`).test(error.message)) {
              warn(`Ωdbricm___7 ignored error: ${error.message}`);
            }
          }
        }
        (this.prepare(SQL`pragma foreign_keys = on;`)).run();
        return count;
      }

      //---------------------------------------------------------------------------------------------------------
      build() {
        if (this.is_ready) {
          return 0;
        } else {
          return this.rebuild();
        }
      }

      //---------------------------------------------------------------------------------------------------------
      rebuild() {
        var build_statement, build_statements, clasz, i, len;
        clasz = this.constructor;
        build_statements = this._get_statements_in_prototype_chain('build', 'list');
        this.teardown();
//.......................................................................................................
        for (i = 0, len = build_statements.length; i < len; i++) {
          build_statement = build_statements[i];
          // debug 'Ωdbricm___8', rpr build_statement
          (this.prepare(build_statement)).run();
        }
        //.......................................................................................................
        return build_statements.length;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_is_ready() {
        var error_count, expected_db_objects, expected_type, message, messages, name, present_db_objects, ref, statement_count, type;
        ({
          error_count,
          statement_count,
          db_objects: expected_db_objects
        } = this._get_objects_in_build_statements());
        //.......................................................................................................
        if (error_count !== 0) {
          messages = [];
          for (name in expected_db_objects) {
            ({type, message} = expected_db_objects[name]);
            if (type !== 'error') {
              continue;
            }
            messages.push(message);
          }
          throw new Error(`Ωdbricm___9 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
        }
        //.......................................................................................................
        present_db_objects = this._get_db_objects();
        for (name in expected_db_objects) {
          ({
            type: expected_type
          } = expected_db_objects[name]);
          if (((ref = present_db_objects[name]) != null ? ref.type : void 0) !== expected_type) {
            return false;
          }
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_prefix() {
        var R, clasz, prefix;
        if ((R = this._cache.prefix) != null) {
          return R;
        }
        clasz = this.constructor;
        //.......................................................................................................
        /* try instance configuration */
        R = this.cfg.prefix;
        //.......................................................................................................
        /* try non-inheritable class property `prefix`: */
        if (R == null) {
          if ((Object.hasOwn(clasz, 'prefix')) && ((prefix = clasz.prefix) != null)) {
            R = clasz.prefix;
          }
        }
        //.......................................................................................................
        /* try inheritable class property `default_prefix`: */
        if (R == null) {
          R = clasz.default_prefix;
        }
        //.......................................................................................................
        if (R == null) {
          throw new E.Dbric_no_prefix_configured('Ωdbricm__10', this);
        }
        //.......................................................................................................
        /* TAINT use proper validation */
        if (!/^[a-zA-Z][a-zA-Z_0-9]*$/.test(R)) {
          throw new E.Dbric_not_a_wellformed_prefix('Ωdbricm__11', R);
        }
        //.......................................................................................................
        this._cache.prefix = R;
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_w() {
        if (this._w != null) {
          return this._w;
        }
        this._w = new this.constructor(this.cfg.db_path, {
          state: this.state
        });
        return this._w;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_function_names() {
        var name;
        return new Set((function() {
          var results, y;
          results = [];
          for (y of this.walk(SQL`select name from pragma_function_list() order by name;`)) {
            ({name} = y);
            results.push(name);
          }
          return results;
        }).call(this));
      }

      //---------------------------------------------------------------------------------------------------------
      execute(sql) {
        return this.db.exec(sql);
      }

      //---------------------------------------------------------------------------------------------------------
      walk(sql, ...P) {
        return (this.prepare(sql)).iterate(...P);
      }

      get_all(sql, ...P) {
        return [...(this.walk(sql, ...P))];
      }

      get_first(sql, ...P) {
        var ref;
        return (ref = (this.get_all(sql, ...P))[0]) != null ? ref : null;
      }

      //---------------------------------------------------------------------------------------------------------
      prepare(sql) {
        var R, cause, error, ref, type;
        if (this.isa_statement(sql)) {
          return sql;
        }
        if ((type = type_of(sql)) !== 'text') {
          throw new Error(`Ωdbricm__12 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__13 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
        }
        this.state.columns = (ref = ((function() {
          try {
            return R != null ? typeof R.columns === "function" ? R.columns() : void 0 : void 0;
          } catch (error1) {
            error = error1;
            return null;
          }
        })())) != null ? ref : [];
        return R;
      }

      //=========================================================================================================
      // FUNCTIONS
      //---------------------------------------------------------------------------------------------------------
      create_function(cfg) {
        var deterministic, directOnly, name, overwrite, value, varargs;
        if ((type_of(this.db.function)) !== 'function') {
          throw new Error(`Ωdbricm__14 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__15 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__16 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__17 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__18 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__19 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__20 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__21 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__22 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__23 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, create);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric.prefix = null;

    Dbric.default_prefix = null;

    Dbric.functions = {};

    Dbric.statements = {};

    Dbric.build = null;

    Dbric.prototype._constructor = nfa({
      template: templates.dbric_cfg
    }, function(db_path, cfg) {
      var clasz, fn_cfg_template, ref;
      this._validate_is_property('is_ready');
      this._validate_is_property('prefix');
      //.......................................................................................................
      if (db_path == null) {
        db_path = ':memory:';
      }
      //.......................................................................................................
      clasz = this.constructor;
      hide(this, 'db', new Db_adapter(db_path));
      this.cfg = freeze({...templates.dbric_cfg, db_path, ...cfg});
      hide(this, 'statements', {});
      hide(this, '_w', null);
      hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
      hide(this, 'state', (ref = (cfg != null ? cfg.state : void 0)) != null ? ref : {
        columns: null
      });
      hide(this, '_cache', {});
      //.......................................................................................................
      this.run_standard_pragmas();
      this.initialize();
      //.......................................................................................................
      fn_cfg_template = {
        deterministic: true,
        varargs: false
      };
      this._create_udfs();
      //.......................................................................................................
      /* NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
         contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
         the instance. */
      this.is_fresh = !this.is_ready;
      this.build();
      this._prepare_statements();
      return void 0;
    });

    //---------------------------------------------------------------------------------------------------------
    set_getter(Dbric.prototype, 'super', function() {
      return Object.getPrototypeOf(this.constructor);
    });

    set_getter(Dbric.prototype, 'is_ready', function() {
      return this._get_is_ready();
    });

    set_getter(Dbric.prototype, 'prefix', function() {
      return this._get_prefix();
    });

    set_getter(Dbric.prototype, '_function_names', function() {
      return this._get_function_names();
    });

    set_getter(Dbric.prototype, 'w', function() {
      return this._get_w();
    });

    return Dbric;

  }).call(this);

  //===========================================================================================================
  module.exports = {
    Dbric,
    SQL,
    IDN,
    LIT,
    SQL,
    VEC,
    True,
    False,
    as_bool,
    from_bool,
    unquote_name,
    internals: freeze({E, type_of, build_statement_re, templates})
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLElBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLDRCQUEz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Z0IsRUFHaEIsa0JBSGdCLEVBSWhCLFNBSmdCLENBQVA7RUFaSTtBQWpkakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4jIERiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSAoIHJlcXVpcmUgJ25vZGU6c3FsaXRlJyApLkRhdGFiYXNlU3luY1xuRGJfYWRhcHRlciAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JldHRlci1zcWxpdGUzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sZXRzZnJlZXpldGhhdC1pbmZyYS5icmljcycgKS5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzLWJyaWNzJyApLnJlcXVpcmVfbm9ybWFsaXplX2Z1bmN0aW9uX2FyZ3VtZW50cygpXG4jIHsgVW5kdW1wZXIsICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vY29hcnNlLXNxbGl0ZS1zdGF0ZW1lbnQtc2VnbWVudGVyLmJyaWNzJyApLnJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyKClcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBFLCAgICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtZXJyb3JzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG5taXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgVHJ1ZSxcbiAgRmFsc2UsXG4gIGZyb21fYm9vbCxcbiAgYXNfYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBJRE4sXG4gIExJVCxcbiAgVkVDLFxuICBTUUwsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtdXRpbGl0aWVzJ1xuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG5nZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICB3aGlsZSB4P1xuICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYnVpbGRfc3RhdGVtZW50X3JlID0gLy8vXG4gIF4gXFxzKlxuICBpbnNlcnQgfCAoXG4gICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICApXG4gIC8vL2lzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGVtcGxhdGVzID1cbiAgZGJyaWNfY2ZnOlxuICAgIHByZWZpeDogICAgICAgICBudWxsXG4gICAgZGVmYXVsdF9wcmVmaXg6IG51bGxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW46ICggcHJvcGVydHlfbmFtZSwgcHJvcGVydHlfdHlwZSApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY2FuZGlkYXRlc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlID0gKCBjYW5kaWRhdGUgKSA9PlxuICAgICAgaWYgKCB0eXBlX29mIGNhbmRpZGF0ZSApIGlzICdmdW5jdGlvbicgdGhlbiBSID0gY2FuZGlkYXRlLmNhbGwgQFxuICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gY2FuZGlkYXRlXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBSICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZ19vcl9zdHJpbmdfdmFsX2ZuICfOqWRicmljbV9fXzEnLCB0eXBlXG4gICAgICByZXR1cm4gUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgICAgID0gc3dpdGNoIHByb3BlcnR5X3R5cGVcbiAgICAgIHdoZW4gJ2xpc3QnIHRoZW4gW11cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4ge31cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgJ86pZGJyaWNtX19fMicsIFwidW5rbm93biBwcm9wZXJ0eV90eXBlICN7cnByIHByb3BlcnR5X3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYW5kaWRhdGVzIGluIGNhbmRpZGF0ZXNfbGlzdFxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGNhbmRpZGF0ZXMgKSBpcyBwcm9wZXJ0eV90eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fMyBleHBlY3RlZCBhbiBvcHRpb25hbCAje3Byb3BlcnR5X3R5cGV9IGZvciAje2NsYXN6Lm5hbWV9LiN7cHJvcGVydHlfbmFtZX0sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBwcm9wZXJ0eV90eXBlIGlzICdsaXN0J1xuICAgICAgICBmb3IgY2FuZGlkYXRlIGluIGNhbmRpZGF0ZXNcbiAgICAgICAgICBSLnB1c2ggc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgICAgZWxzZVxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzXG4gICAgICAgICAgaWYgUmVmbGVjdC5oYXMgUiwgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX25hbWVkX3N0YXRlbWVudF9leGlzdHMgJ86pZGJyaWNtX19fNCcsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgUlsgc3RhdGVtZW50X25hbWUgXSA9IHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGRiX29iamVjdHMgICAgICAgICAgICA9IHt9XG4gICAgc3RhdGVtZW50X2NvdW50ICAgICAgID0gMFxuICAgIGVycm9yX2NvdW50ICAgICAgICAgICA9IDBcbiAgICBidWlsZF9zdGF0ZW1lbnRzICAgICAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnYnVpbGQnLCAnbGlzdCdcbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICBpZiAoIG1hdGNoID0gYnVpbGRfc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSB1bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBidWlsZF9zdGF0ZW1lbnR9XCJcbiAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBzdGF0ZW1lbnRzICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdzdGF0ZW1lbnRzJywgJ3BvZCdcbiAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWMgZXh0ZW5kcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBwcmVmaXg6ICAgICAgICAgIG51bGxcbiAgQGRlZmF1bHRfcHJlZml4OiAgbnVsbFxuICBAZnVuY3Rpb25zOiAgICAgICB7fVxuICBAc3RhdGVtZW50czogICAgICB7fVxuICBAYnVpbGQ6ICAgICAgICAgICBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgTk9URSB0aGlzIHVudXN1YWwgYXJyYW5nZW1lbnQgaXMgc29sZWx5IHRoZXJlIHNvIHdlIGNhbiBjYWxsIGBzdXBlcigpYCBmcm9tIGFuIGluc3RhbmNlIG1ldGhvZCAjIyNcbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBEYl9hZGFwdGVyIGRiX3BhdGhcbiAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgdGVtcGxhdGVzLmRicmljX2NmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgaGlkZSBALCAnX3cnLCAgICAgICAgICAgICAgIG51bGxcbiAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICBoaWRlIEAsICdfY2FjaGUnLCAgICAgICAgICAge31cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgQGluaXRpYWxpemUoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyMjIE5PVEUgQSAnZnJlc2gnIERCIGluc3RhbmNlIGlzIGEgREIgdGhhdCBzaG91bGQgYmUgKHJlLSlidWlsdCBhbmQvb3IgKHJlLSlwb3B1bGF0ZWQ7IGluXG4gICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICB0aGUgaW5zdGFuY2UuICMjI1xuICAgIEBpc19mcmVzaCA9IG5vdCBAaXNfcmVhZHlcbiAgICBAYnVpbGQoKVxuICAgIEBfcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fNSBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3JwciBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgUiA9IHt9XG4gICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlYXJkb3duOiAtPlxuICAgIGNvdW50ID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBjb3VudCsrXG4gICAgICB0cnlcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje0lETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICB3YXJuIFwizqlkYnJpY21fX183IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICByZXR1cm4gY291bnRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcmVidWlsZDogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBidWlsZF9zdGF0ZW1lbnRzICAgICAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnYnVpbGQnLCAnbGlzdCdcbiAgICBAdGVhcmRvd24oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBidWlsZF9zdGF0ZW1lbnRzXG4gICAgICAjIGRlYnVnICfOqWRicmljbV9fXzgnLCBycHIgYnVpbGRfc3RhdGVtZW50XG4gICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gYnVpbGRfc3RhdGVtZW50cy5sZW5ndGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnc3VwZXInLCAgICAgICAgICAgIC0+IE9iamVjdC5nZXRQcm90b3R5cGVPZiBAY29uc3RydWN0b3JcbiAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9pc19yZWFkeTogLT5cbiAgICB7IGVycm9yX2NvdW50LFxuICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX185ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3ByZWZpeDogLT5cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBAX2NhY2hlLnByZWZpeCApP1xuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgdHJ5IGluc3RhbmNlIGNvbmZpZ3VyYXRpb24gIyMjXG4gICAgUiA9IEBjZmcucHJlZml4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgdHJ5IG5vbi1pbmhlcml0YWJsZSBjbGFzcyBwcm9wZXJ0eSBgcHJlZml4YDogIyMjXG4gICAgdW5sZXNzIFI/XG4gICAgICBpZiAoIE9iamVjdC5oYXNPd24gY2xhc3osICdwcmVmaXgnICkgYW5kICggcHJlZml4ID0gY2xhc3oucHJlZml4ICk/XG4gICAgICAgIFIgPSBjbGFzei5wcmVmaXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyB0cnkgaW5oZXJpdGFibGUgY2xhc3MgcHJvcGVydHkgYGRlZmF1bHRfcHJlZml4YDogIyMjXG4gICAgdW5sZXNzIFI/XG4gICAgICBSID0gY2xhc3ouZGVmYXVsdF9wcmVmaXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyBSP1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfbm9fcHJlZml4X2NvbmZpZ3VyZWQgJ86pZGJyaWNtX18xMCcsIEBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzIC9eW2EtekEtWl1bYS16QS1aXzAtOV0qJC8udGVzdCBSXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19ub3RfYV93ZWxsZm9ybWVkX3ByZWZpeCAnzqlkYnJpY21fXzExJywgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQF9jYWNoZS5wcmVmaXggPSBSXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfdzogLT5cbiAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aCwgeyBzdGF0ZTogQHN0YXRlLCB9XG4gICAgcmV0dXJuIEBfd1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9mdW5jdGlvbl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogICAgICAgKCBzcWwsIFAuLi4gKSAtPiAoIEBwcmVwYXJlIHNxbCApLml0ZXJhdGUgUC4uLlxuICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdHJ5XG4gICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgY2F0Y2ggY2F1c2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMyB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgRlVOQ1RJT05TXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIHZhbHVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE3IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTggREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgaW52ZXJzZSxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjAgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIxIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIzIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICB0eXBlX29mLFxuICAgIGJ1aWxkX3N0YXRlbWVudF9yZSxcbiAgICB0ZW1wbGF0ZXMsIH1cbiAgfVxuXG5cblxuIl19
