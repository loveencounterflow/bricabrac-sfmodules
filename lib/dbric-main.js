(function() {
  'use strict';
  var Dbric, Dbric_classprop_absorber, E, False, IDN, LIT, SFMODULES, SQL, SQLITE, True, Undumper, VEC, as_bool, build_statement_re, debug, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn;

  //###########################################################################################################

  //===========================================================================================================
  SFMODULES = require('./main');

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);

  ({nfa} = require('normalize-function-arguments'));

  SQLITE = require('node:sqlite');

  ({debug, warn} = console);

  misfit = Symbol('misfit');

  ({get_prototype_chain, get_all_in_prototype_chain} = SFMODULES.unstable.require_get_prototype_chain());

  ({Undumper} = SFMODULES.require_coarse_sqlite_statement_segmenter());

  ({E} = require('./dbric-errors'));

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
    static _get_build_statements_in_prototype_chain() {
      return (get_all_in_prototype_chain(this, 'build')).reverse();
    }

    //---------------------------------------------------------------------------------------------------------
    _get_objects_in_build_statements() {
      /* TAINT does not yet deal with quoted names */
      var build_statements, build_statements_list, clasz, db_objects, error_count, i, j, len, len1, match, message, name/* NOTE ignore statements like `insert` */, statement, statement_count, type;
      clasz = this.constructor;
      db_objects = {};
      statement_count = 0;
      error_count = 0;
      build_statements_list = clasz._get_build_statements_in_prototype_chain();
      for (i = 0, len = build_statements_list.length; i < len; i++) {
        build_statements = build_statements_list[i];
        if (build_statements == null) {
          continue;
        }
        for (j = 0, len1 = build_statements.length; j < len1; j++) {
          statement = build_statements[j];
          switch (type = type_of(statement)) {
            case 'function':
              statement = statement.call(this);
              if ((type = type_of(statement)) !== 'text') {
                throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___1', type);
              }
              break;
            case 'text':
              null;
              break;
            default:
              throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___2', type);
          }
          statement_count++;
          if ((match = statement.match(build_statement_re)) != null) {
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
            message = `non-conformant statement: ${rpr(statement)}`;
            db_objects[name] = {name, type, message};
          }
        }
      }
      return {error_count, statement_count, db_objects};
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_statements() {
      var clasz, i, len, statement, statement_name, statements, statements_list;
      clasz = this.constructor;
      statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
      for (i = 0, len = statements_list.length; i < len; i++) {
        statements = statements_list[i];
        for (statement_name in statements) {
          statement = statements[statement_name];
          if (this.statements[statement_name] != null) {
            throw new Error(`Ωdbricm___3 statement ${rpr(statement_name)} is already declared`);
          }
          this.statements[statement_name] = this.prepare(statement);
        }
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
        var clasz, db_class, fn_cfg_template, ref, ref1;
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
        db_class = (ref = (cfg != null ? cfg.db_class : void 0)) != null ? ref : clasz.db_class;
        hide(this, 'db', new db_class(db_path));
        // @db                       = new SQLITE.DatabaseSync db_path
        this.cfg = freeze({...clasz.cfg, db_path, ...cfg});
        hide(this, 'statements', {});
        hide(this, '_w', null);
        hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
        hide(this, 'state', (ref1 = (cfg != null ? cfg.state : void 0)) != null ? ref1 : {
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
        throw new Error(`Ωdbricm___4 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
            throw new Error(`Ωdbricm___5 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
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
              warn(`Ωdbricm___6 ignored error: ${error.message}`);
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
        /* TAINT use proper validation */
        var build_statement, build_statements, build_statements_list, clasz, count, has_torn_down, i, j, len, len1, ref, type;
        clasz = this.constructor;
        count = 0;
        build_statements_list = clasz._get_build_statements_in_prototype_chain();
        has_torn_down = false;
//.......................................................................................................
        for (i = 0, len = build_statements_list.length; i < len; i++) {
          build_statements = build_statements_list[i];
          if ((ref = (type = type_of(build_statements))) !== 'undefined' && ref !== 'null' && ref !== 'list') {
            throw new Error(`Ωdbricm___7 expected an optional list for ${clasz.name}.build, got a ${type}`);
          }
          if ((build_statements == null) || (build_statements.length === 0)) {
            //.....................................................................................................
            continue;
          }
          if (!has_torn_down) {
            //.....................................................................................................
            this.teardown();
          }
          has_torn_down = true;
//.....................................................................................................
          for (j = 0, len1 = build_statements.length; j < len1; j++) {
            build_statement = build_statements[j];
            count++;
            (this.prepare(build_statement)).run();
          }
        }
        //.......................................................................................................
        return count;
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
          throw new Error(`Ωdbricm___8 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
          db_class: this.db.constructor,
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
          throw new Error(`Ωdbricm___9 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__10 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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
          throw new Error(`Ωdbricm__11 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__12 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__13 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__14 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__15 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__16 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__17 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__18 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__19 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__20 a UDF or built-in function named ${rpr(name)} has already been declared`);
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

    Dbric.db_class = SQLITE.DatabaseSync;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSx3QkFBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsa0JBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSwwQkFBQSxFQUFBLHVCQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBOzs7OztFQUtBLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVI7O0VBQ2xDLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRGxDOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw0QkFBVixDQUFBLENBQXdDLENBQUMsTUFEM0U7O0VBRUEsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsOEJBQVIsQ0FBbEM7O0VBQ0EsTUFBQSxHQUFrQyxPQUFBLENBQVEsYUFBUjs7RUFDbEMsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEs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Z0IsT0FBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7YUFBRyxNQUFNLENBQUMsY0FBUCxDQUFzQixJQUFDLENBQUEsV0FBdkI7SUFBSCxDQUFwQzs7SUFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLFNBQVosRUFBZ0IsVUFBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBO0lBQUgsQ0FBcEM7O0lBQ0EsVUFBQSxDQUFXLEtBQUMsQ0FBQSxTQUFaLEVBQWdCLFFBQWhCLEVBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUFILENBQXBDOztJQUNBLFVBQUEsQ0FBVyxLQUFDLENBQUEsU0FBWixFQUFnQixXQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxjQUFELENBQUE7SUFBSCxDQUFwQzs7SUFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLFNBQVosRUFBZ0IsaUJBQWhCLEVBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFBSCxDQUFwQzs7SUFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLFNBQVosRUFBZ0IsR0FBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsTUFBRCxDQUFBO0lBQUgsQ0FBcEM7Ozs7Z0JBcFRGOzs7RUFnY0EsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixLQURlO0lBRWYsR0FGZTtJQUdmLEdBSGU7SUFJZixHQUplO0lBS2YsR0FMZTtJQU1mLEdBTmU7SUFPZixJQVBlO0lBUWYsS0FSZTtJQVNmLE9BVGU7SUFVZixTQVZlO0lBV2YsWUFYZTtJQVlmLFNBQUEsRUFBVyxNQUFBLENBQU8sQ0FDaEIsQ0FEZ0IsRUFFaEIsT0FGZ0IsRUFHaEIsa0JBSGdCLEVBSWhCLFNBSmdCLENBQVA7RUFaSTtBQWhjakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcblNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xueyBnZXRfcHJvdG90eXBlX2NoYWluLFxuICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxueyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgVHJ1ZSxcbiAgRmFsc2UsXG4gIGZyb21fYm9vbCxcbiAgYXNfYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBJRE4sXG4gIExJVCxcbiAgVkVDLFxuICBTUUwsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtdXRpbGl0aWVzJ1xuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG5nZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICB3aGlsZSB4P1xuICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYnVpbGRfc3RhdGVtZW50X3JlID0gLy8vXG4gIF4gXFxzKlxuICBpbnNlcnQgfCAoXG4gICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICApXG4gIC8vL2lzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGVtcGxhdGVzID1cbiAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZzoge31cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAX2dldF9idWlsZF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogLT4gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBALCAnYnVpbGQnICkucmV2ZXJzZSgpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgZGJfb2JqZWN0cyAgICAgICAgICAgID0ge31cbiAgICBzdGF0ZW1lbnRfY291bnQgICAgICAgPSAwXG4gICAgZXJyb3JfY291bnQgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgY29udGludWUgdW5sZXNzIGJ1aWxkX3N0YXRlbWVudHM/XG4gICAgICBmb3Igc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHN0YXRlbWVudFxuICAgICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgc3RhdGVtZW50ID0gc3RhdGVtZW50LmNhbGwgQFxuICAgICAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ3RleHQnXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZ19vcl9zdHJpbmdfdmFsX2ZuICfOqWRicmljbV9fXzEnLCB0eXBlXG4gICAgICAgICAgd2hlbiAndGV4dCcgdGhlbiBudWxsXG4gICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9zdHJpbmdfb3Jfc3RyaW5nX3ZhbF9mbiAnzqlkYnJpY21fX18yJywgdHlwZVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IHVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByIHN0YXRlbWVudH1cIlxuICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ3N0YXRlbWVudHMnICkucmV2ZXJzZSgpXG4gICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgIGlmIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdP1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fMyBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWMgZXh0ZW5kcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBjZmc6IGZyZWV6ZVxuICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gIEBmdW5jdGlvbnM6ICAge31cbiAgQHN0YXRlbWVudHM6ICB7fVxuICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgQGRiX2NsYXNzOiAgICBTUUxJVEUuRGF0YWJhc2VTeW5jXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgc3VwZXIoKVxuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGRiX2NsYXNzICAgICAgICAgICAgICAgICAgPSAoIGNmZz8uZGJfY2xhc3MgKSA/IGNsYXN6LmRiX2NsYXNzXG4gICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBkYl9jbGFzcyBkYl9wYXRoXG4gICAgIyBAZGIgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IFNRTElURS5EYXRhYmFzZVN5bmMgZGJfcGF0aFxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgIEBpbml0aWFsaXplKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgQGJ1aWxkKClcbiAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGluaXRpYWxpemU6IC0+XG4gICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzQgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgbnVsbFxuICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgZWxzZVxuICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fNSBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgY291bnQrK1xuICAgICAgdHJ5XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tJRE4gbmFtZX07XCIgKS5ydW4oKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgd2FybiBcIs6pZGJyaWNtX19fNiBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgcmV0dXJuIGNvdW50XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlYnVpbGQ6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY291bnQgICAgICAgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX183IGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0ZWFyZG93bigpIHVubGVzcyBoYXNfdG9ybl9kb3duXG4gICAgICBoYXNfdG9ybl9kb3duID0gdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgY291bnQrK1xuICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gY291bnRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnc3VwZXInLCAgICAgICAgICAgIC0+IE9iamVjdC5nZXRQcm90b3R5cGVPZiBAY29uc3RydWN0b3JcbiAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeF9yZScsICAgICAgICAtPiBAX2dldF9wcmVmaXhfcmUoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9pc19yZWFkeTogLT5cbiAgICB7IGVycm9yX2NvdW50LFxuICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX184ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3ByZWZpeDogLT5cbiAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9wcmVmaXhfcmU6IC0+XG4gICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3c6IC0+XG4gICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgZGJfY2xhc3M6IEBkYi5jb25zdHJ1Y3Rvciwgc3RhdGU6IEBzdGF0ZSwgfVxuICAgIHJldHVybiBAX3dcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOSBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHRyeVxuICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgIGNhdGNoIGNhdXNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTAgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIEZVTkNUSU9OU1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE2IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE3IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHBhcmFtZXRlcnMsXG4gICAgICBjb2x1bW5zLFxuICAgICAgcm93cyxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEYnJpYyxcbiAgU1FMLFxuICBJRE4sXG4gIExJVCxcbiAgU1FMLFxuICBWRUMsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBhc19ib29sLFxuICBmcm9tX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgaW50ZXJuYWxzOiBmcmVlemUge1xuICAgIEUsXG4gICAgdHlwZV9vZixcbiAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgdGVtcGxhdGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
