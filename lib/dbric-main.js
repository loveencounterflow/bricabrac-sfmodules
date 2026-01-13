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
      /* TAINT use normalize-function-arguments */
      constructor(db_path, cfg) {
        var clasz, fn_cfg_template, ref;
        super();
        this._validate_is_property('is_ready');
        this._validate_is_property('prefix');
        this._validate_is_property('prefix_re');
        //.......................................................................................................
        if (db_path == null) {
          db_path = ':memory:';
        }
        //.......................................................................................................
        clasz = this.constructor;
        hide(this, 'db', new Db_adapter(db_path));
        this.cfg = freeze({...clasz.cfg, db_path, ...cfg});
        hide(this, 'statements', {});
        hide(this, '_w', null);
        hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
        hide(this, 'state', (ref = (cfg != null ? cfg.state : void 0)) != null ? ref : {
          columns: null
        });
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
      teardown({test = null} = {}) {
        var _, count, error, name, prefix_re, ref, type;
        count = 0;
        //.......................................................................................................
        switch (true) {
          case test === '*':
            test = function(name) {
              return true;
            };
            break;
          case (type_of(test)) === 'function':
            null;
            break;
          case test == null:
            prefix_re = this.prefix_re;
            test = function(name) {
              return prefix_re.test(name);
            };
            break;
          default:
            type = type_of(test);
            throw new Error(`Ωdbricm___6 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
        }
        //.......................................................................................................
        (this.prepare(SQL`pragma foreign_keys = off;`)).run();
        ref = this._get_db_objects();
        for (_ in ref) {
          ({name, type} = ref[_]);
          if (!test(name)) {
            continue;
          }
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
        if ((this.cfg.prefix == null) || (this.cfg.prefix === '(NOPREFIX)')) {
          return '';
        }
        return this.cfg.prefix;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_prefix_re() {
        if (this.prefix === '') {
          return /|/;
        }
        return RegExp(`^_?${RegExp.escape(this.prefix)}_.*$`);
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
          throw new Error(`Ωdbricm__10 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__11 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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
          throw new Error(`Ωdbricm__12 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__13 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__14 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__15 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__16 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__17 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__18 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__19 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__20 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__21 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, create);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric.cfg = freeze({
      prefix: '(NOPREFIX)'
    });

    Dbric.functions = {};

    Dbric.statements = {};

    Dbric.build = null;

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

    set_getter(Dbric.prototype, 'prefix_re', function() {
      return this._get_prefix_re();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLElBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLDRCQUEz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T0FGZ0IsRUFHaEIsa0JBSGdCLEVBSWhCLFNBSmdCLENBQVA7RUFaSTtBQXZjakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4jIERiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSAoIHJlcXVpcmUgJ25vZGU6c3FsaXRlJyApLkRhdGFiYXNlU3luY1xuRGJfYWRhcHRlciAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JldHRlci1zcWxpdGUzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sZXRzZnJlZXpldGhhdC1pbmZyYS5icmljcycgKS5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgICAgPSBzd2l0Y2ggcHJvcGVydHlfdHlwZVxuICAgICAgd2hlbiAnbGlzdCcgdGhlbiBbXVxuICAgICAgd2hlbiAncG9kJyAgdGhlbiB7fVxuICAgICAgZWxzZSB0aHJvdyBuZXcgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAnzqlkYnJpY21fX18yJywgXCJ1bmtub3duIHByb3BlcnR5X3R5cGUgI3tycHIgcHJvcGVydHlfdHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhbmRpZGF0ZXMgaW4gY2FuZGlkYXRlc19saXN0XG4gICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgY2FuZGlkYXRlcyApIGlzIHByb3BlcnR5X3R5cGVcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX18zIGV4cGVjdGVkIGFuIG9wdGlvbmFsICN7cHJvcGVydHlfdHlwZX0gZm9yICN7Y2xhc3oubmFtZX0uI3twcm9wZXJ0eV9uYW1lfSwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmIHByb3BlcnR5X3R5cGUgaXMgJ2xpc3QnXG4gICAgICAgIGZvciBjYW5kaWRhdGUgaW4gY2FuZGlkYXRlc1xuICAgICAgICAgIFIucHVzaCBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgY2FuZGlkYXRlXG4gICAgICBlbHNlXG4gICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXNcbiAgICAgICAgICBpZiBSZWZsZWN0LmhhcyBSLCBzdGF0ZW1lbnRfbmFtZVxuICAgICAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfbmFtZWRfc3RhdGVtZW50X2V4aXN0cyAnzqlkYnJpY21fX180Jywgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICBSWyBzdGF0ZW1lbnRfbmFtZSBdID0gc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgZGJfb2JqZWN0cyAgICAgICAgICAgID0ge31cbiAgICBzdGF0ZW1lbnRfY291bnQgICAgICAgPSAwXG4gICAgZXJyb3JfY291bnQgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHMgICAgICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdidWlsZCcsICdsaXN0J1xuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgIGlmICggbWF0Y2ggPSBidWlsZF9zdGF0ZW1lbnQubWF0Y2ggYnVpbGRfc3RhdGVtZW50X3JlICk/XG4gICAgICAgIHsgbmFtZSxcbiAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgbmFtZT8gIyMjIE5PVEUgaWdub3JlIHN0YXRlbWVudHMgbGlrZSBgaW5zZXJ0YCAjIyNcbiAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IHVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgIGVsc2VcbiAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByIGJ1aWxkX3N0YXRlbWVudH1cIlxuICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCBtZXNzYWdlLCB9XG4gICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHN0YXRlbWVudHMgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ3N0YXRlbWVudHMnLCAncG9kJ1xuICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdWRmczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICdhZ2dyZWdhdGVfZnVuY3Rpb24nLCAnd2luZG93X2Z1bmN0aW9uJywgJ3RhYmxlX2Z1bmN0aW9uJywgJ3ZpcnR1YWxfdGFibGUnLCBdXG4gICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgZGVjbGFyYXRpb25zX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIHVkZl9uYW1lLCBmbl9jZmcgb2YgZGVjbGFyYXRpb25zXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGNmZzogZnJlZXplXG4gICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgQGZ1bmN0aW9uczogICB7fVxuICBAc3RhdGVtZW50czogIHt9XG4gIEBidWlsZDogICAgICAgbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIFRBSU5UIHVzZSBub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzICMjI1xuICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgIHN1cGVyKClcbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IERiX2FkYXB0ZXIgZGJfcGF0aFxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgIEBpbml0aWFsaXplKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgQGJ1aWxkKClcbiAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGluaXRpYWxpemU6IC0+XG4gICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzUgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgbnVsbFxuICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgZWxzZVxuICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fNiBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgY291bnQrK1xuICAgICAgdHJ5XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tJRE4gbmFtZX07XCIgKS5ydW4oKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgd2FybiBcIs6pZGJyaWNtX19fNyBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgcmV0dXJuIGNvdW50XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlYnVpbGQ6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgYnVpbGRfc3RhdGVtZW50cyAgICAgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ2J1aWxkJywgJ2xpc3QnXG4gICAgQHRlYXJkb3duKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgIyBkZWJ1ZyAnzqlkYnJpY21fX184JywgcnByIGJ1aWxkX3N0YXRlbWVudFxuICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGJ1aWxkX3N0YXRlbWVudHMubGVuZ3RoXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3N1cGVyJywgICAgICAgICAgICAtPiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgQGNvbnN0cnVjdG9yXG4gIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgc2V0X2dldHRlciBAOjosICdwcmVmaXhfcmUnLCAgICAgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgICAgICAtPiBAX2dldF93KClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgeyBlcnJvcl9jb3VudCxcbiAgICAgIHN0YXRlbWVudF9jb3VudCxcbiAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICBtZXNzYWdlcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICBtZXNzYWdlcy5wdXNoIG1lc3NhZ2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHJlc2VudF9kYl9vYmplY3RzID0gQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9wcmVmaXg6IC0+XG4gICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfcHJlZml4X3JlOiAtPlxuICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgIHJldHVybiAvLy8gXiBfPyAje1JlZ0V4cC5lc2NhcGUgQHByZWZpeH0gXyAuKiAkIC8vL1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF93OiAtPlxuICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgIEBfdyA9IG5ldyBAY29uc3RydWN0b3IgQGNmZy5kYl9wYXRoLCB7IHN0YXRlOiBAc3RhdGUsIH1cbiAgICByZXR1cm4gQF93XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTAgZXhwZWN0ZWQgYSBzdGF0ZW1lbnQgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB0cnlcbiAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICBjYXRjaCBjYXVzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzExIHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBGVU5DVElPTlNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTIgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICBpbnZlcnNlLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIHJvd3MsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCB7IHBhcmFtZXRlcnMsIGNvbHVtbnMsIHJvd3MsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRGJyaWMsXG4gIFNRTCxcbiAgSUROLFxuICBMSVQsXG4gIFNRTCxcbiAgVkVDLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIGludGVybmFsczogZnJlZXplIHtcbiAgICBFLFxuICAgIHR5cGVfb2YsXG4gICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAgIHRlbXBsYXRlcywgfVxuICB9XG5cblxuXG4iXX0=
