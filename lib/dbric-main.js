(function() {
  'use strict';
  var Dbric, Dbric_classprop_absorber, E, False, IDN, LIT, SQL, SQLITE, True, VEC, as_bool, build_statement_re, debug, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn;

  //###########################################################################################################

  //===========================================================================================================
  ({debug, warn} = console);

  //...........................................................................................................
  SQLITE = require('node:sqlite');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSx3QkFBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLElBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7O0VBUUEsTUFBQSxHQUFrQyxPQUFBLENBQVEsYUFBUixFQVJsQzs7O0VBVUEsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsOEJBQVIsQ0FBbEMsRUFWQTs7O0VBWUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRGxDOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyw0QkFBM0Ms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QUhlO0lBSWYsR0FKZTtJQUtmLEdBTGU7SUFNZixHQU5lO0lBT2YsSUFQZTtJQVFmLEtBUmU7SUFTZixPQVRlO0lBVWYsU0FWZTtJQVdmLFlBWGU7SUFZZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLE9BRmdCLEVBR2hCLGtCQUhnQixFQUloQixTQUpnQixDQUFQO0VBWkk7QUF4Y2pCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sZXRzZnJlZXpldGhhdC1pbmZyYS5icmljcycgKS5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgICAgPSBzd2l0Y2ggcHJvcGVydHlfdHlwZVxuICAgICAgd2hlbiAnbGlzdCcgdGhlbiBbXVxuICAgICAgd2hlbiAncG9kJyAgdGhlbiB7fVxuICAgICAgZWxzZSB0aHJvdyBuZXcgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAnzqlkYnJpY21fX18yJywgXCJ1bmtub3duIHByb3BlcnR5X3R5cGUgI3tycHIgcHJvcGVydHlfdHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhbmRpZGF0ZXMgaW4gY2FuZGlkYXRlc19saXN0XG4gICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgY2FuZGlkYXRlcyApIGlzIHByb3BlcnR5X3R5cGVcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX18zIGV4cGVjdGVkIGFuIG9wdGlvbmFsICN7cHJvcGVydHlfdHlwZX0gZm9yICN7Y2xhc3oubmFtZX0uI3twcm9wZXJ0eV9uYW1lfSwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmIHByb3BlcnR5X3R5cGUgaXMgJ2xpc3QnXG4gICAgICAgIGZvciBjYW5kaWRhdGUgaW4gY2FuZGlkYXRlc1xuICAgICAgICAgIFIucHVzaCBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgY2FuZGlkYXRlXG4gICAgICBlbHNlXG4gICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXNcbiAgICAgICAgICBpZiBSZWZsZWN0LmhhcyBSLCBzdGF0ZW1lbnRfbmFtZVxuICAgICAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfbmFtZWRfc3RhdGVtZW50X2V4aXN0cyAnzqlkYnJpY21fX180Jywgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICBSWyBzdGF0ZW1lbnRfbmFtZSBdID0gc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgZGJfb2JqZWN0cyAgICAgICAgICAgID0ge31cbiAgICBzdGF0ZW1lbnRfY291bnQgICAgICAgPSAwXG4gICAgZXJyb3JfY291bnQgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHMgICAgICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdidWlsZCcsICdsaXN0J1xuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgIGlmICggbWF0Y2ggPSBidWlsZF9zdGF0ZW1lbnQubWF0Y2ggYnVpbGRfc3RhdGVtZW50X3JlICk/XG4gICAgICAgIHsgbmFtZSxcbiAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgbmFtZT8gIyMjIE5PVEUgaWdub3JlIHN0YXRlbWVudHMgbGlrZSBgaW5zZXJ0YCAjIyNcbiAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IHVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgIGVsc2VcbiAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByIGJ1aWxkX3N0YXRlbWVudH1cIlxuICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCBtZXNzYWdlLCB9XG4gICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHN0YXRlbWVudHMgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ3N0YXRlbWVudHMnLCAncG9kJ1xuICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdWRmczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICdhZ2dyZWdhdGVfZnVuY3Rpb24nLCAnd2luZG93X2Z1bmN0aW9uJywgJ3RhYmxlX2Z1bmN0aW9uJywgJ3ZpcnR1YWxfdGFibGUnLCBdXG4gICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgZGVjbGFyYXRpb25zX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIHVkZl9uYW1lLCBmbl9jZmcgb2YgZGVjbGFyYXRpb25zXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGNmZzogZnJlZXplXG4gICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgQGZ1bmN0aW9uczogICB7fVxuICBAc3RhdGVtZW50czogIHt9XG4gIEBidWlsZDogICAgICAgbnVsbFxuICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2Ugbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cyAjIyNcbiAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBzdXBlcigpXG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeF9yZSdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgZGJfY2xhc3MgICAgICAgICAgICAgICAgICA9ICggY2ZnPy5kYl9jbGFzcyApID8gY2xhc3ouZGJfY2xhc3NcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IGRiX2NsYXNzIGRiX3BhdGhcbiAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICBAaW5pdGlhbGl6ZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgQF9jcmVhdGVfdWRmcygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICBjb250cmFkaXN0aW5jdGlvbiB0byBgRGJyaWM6OmlzX3JlYWR5YCwgYERicmljOjppc19mcmVzaGAgcmV0YWlucyBpdHMgdmFsdWUgZm9yIHRoZSBsaWZldGltZSBvZlxuICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgIEBidWlsZCgpXG4gICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpbml0aWFsaXplOiAtPlxuICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX181IG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICBSID0ge31cbiAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVhcmRvd246ICh7IHRlc3QgPSBudWxsLCB9PXt9KSAtPlxuICAgIGNvdW50ICAgICAgID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHRydWVcbiAgICAgIHdoZW4gdGVzdCBpcyAnKidcbiAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHRydWVcbiAgICAgIHdoZW4gKCB0eXBlX29mIHRlc3QgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIG51bGxcbiAgICAgIHdoZW4gbm90IHRlc3Q/XG4gICAgICAgIHByZWZpeF9yZSA9IEBwcmVmaXhfcmVcbiAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHByZWZpeF9yZS50ZXN0IG5hbWVcbiAgICAgIGVsc2VcbiAgICAgICAgdHlwZSA9IHR5cGVfb2YgdGVzdFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzYgZXhwZWN0ZWQgYCcqJ2AsIGEgUmVnRXhwLCBhIGZ1bmN0aW9uLCBudWxsIG9yIHVuZGVmaW5lZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGNvbnRpbnVlIHVubGVzcyB0ZXN0IG5hbWVcbiAgICAgIGNvdW50KytcbiAgICAgIHRyeVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7SUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljbV9fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICByZWJ1aWxkOiAtPlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGJ1aWxkX3N0YXRlbWVudHMgICAgICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdidWlsZCcsICdsaXN0J1xuICAgIEB0ZWFyZG93bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICMgZGVidWcgJ86pZGJyaWNtX19fOCcsIHJwciBidWlsZF9zdGF0ZW1lbnRcbiAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgICAgIC0+IEBfZ2V0X3ByZWZpeCgpXG4gIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgc2V0X2dldHRlciBAOjosICd3JywgICAgICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgIHsgZXJyb3JfY291bnQsXG4gICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzkgI3tlcnJvcl9jb3VudH0gb3V0IG9mICN7c3RhdGVtZW50X2NvdW50fSBidWlsZCBzdGF0ZW1lbnQocykgY291bGQgbm90IGJlIHBhcnNlZDogI3tycHIgbWVzc2FnZXN9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfcHJlZml4OiAtPlxuICAgIHJldHVybiAnJyBpZiAoIG5vdCBAY2ZnLnByZWZpeD8gKSBvciAoIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJyApXG4gICAgcmV0dXJuIEBjZmcucHJlZml4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICByZXR1cm4gL3wvIGlmIEBwcmVmaXggaXMgJydcbiAgICByZXR1cm4gLy8vIF4gXz8gI3tSZWdFeHAuZXNjYXBlIEBwcmVmaXh9IF8gLiogJCAvLy9cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfdzogLT5cbiAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aCwgeyBkYl9jbGFzczogQGRiLmNvbnN0cnVjdG9yLCBzdGF0ZTogQHN0YXRlLCB9XG4gICAgcmV0dXJuIEBfd1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9mdW5jdGlvbl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogICAgICAgKCBzcWwsIFAuLi4gKSAtPiAoIEBwcmVwYXJlIHNxbCApLml0ZXJhdGUgUC4uLlxuICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEwIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdHJ5XG4gICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgY2F0Y2ggY2F1c2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMSB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgRlVOQ1RJT05TXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIHZhbHVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE1IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTYgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgaW52ZXJzZSxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTcgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTggREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE5IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIxIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICB0eXBlX29mLFxuICAgIGJ1aWxkX3N0YXRlbWVudF9yZSxcbiAgICB0ZW1wbGF0ZXMsIH1cbiAgfVxuXG5cblxuIl19
