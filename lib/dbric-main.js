(function() {
  'use strict';
  var Dbric, Dbric_classprop_absorber, Dbric_std, Dbric_std_base, Dbric_std_variables, E, False, IDN, LIT, SFMODULES, SQL, SQLITE, True, Undumper, VEC, as_bool, build_statement_re, debug, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn;

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
                throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___6', type);
              }
              break;
            case 'text':
              null;
              break;
            default:
              throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___7', type);
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
            throw new Error(`Ωdbricm___8 statement ${rpr(statement_name)} is already declared`);
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
              var callable, l, len2, name_of_callable, ref1;
              if (d.name == null) {
                d.name = udf_name;
              }
              ref1 = names_of_callables[category];
              //...............................................................................................
              /* bind UDFs to `this` */
              for (l = 0, len2 = ref1.length; l < len2; l++) {
                name_of_callable = ref1[l];
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
        throw new Error(`Ωdbricm___1 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
            throw new Error(`Ωdbricm___2 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
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
              warn(`Ωdbricm___3 ignored error: ${error.message}`);
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
            throw new Error(`Ωdbricm___4 expected an optional list for ${clasz.name}.build, got a ${type}`);
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
          throw new Error(`Ωdbricm___5 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
          throw new E.Dbric_expected_string('Ωdbricm__21', type, data);
        }
        if (data === 'null') {
          return data;
        }
        if (!((data.startsWith('{')) && (data.endsWith('}')))) {
          throw new E.Dbric_expected_json_object_string('Ωdbricm__22', data);
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
    //     # debug 'Ωim__23', rpr data
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
          var delta, name, value, y;
          for (y of this.statements.get_variables.iterate()) {
            ({name, value, delta} = y);
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
        // whisper 'Ωdbricm__25', "_std_persist_state"
        //.......................................................................................................
        for (_ in ref) {
          ({name, value, delta} = ref[_]);
          /* TAINT clear cache in @state.std_variables ? */
          // whisper 'Ωdbricm__26', { name, value, delta, }
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
            throw new Error(`Ωdbricm__27 expected 1 or 2 arguments, got ${arity}`);
        }
        //.......................................................................................................
        if (this.state.std_within_variables_context) {
          throw new Error("Ωdbricm__28 illegal to nest `std_with_variables()` contexts");
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
          throw new Error("Ωdbricm__29 illegal to set variable outside of `std_with_variables()` contexts");
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
        //   throw new Error "Ωdbricm__30 illegal to get variable outside of `std_with_variables()` contexts"
        if (Reflect.has(this.state.std_transients, name)) {
          return this.state.std_transients[name].value;
        }
        if (Reflect.has(this.state.std_variables, name)) {
          return this.state.std_variables[name].value;
        }
        throw new Error(`Ωdbricm__31 unknown variable ${rpr(name)}`);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      std_get_next_in_sequence(name) {
        var delta, entry;
        if (!this.state.std_within_variables_context) {
          throw new Error("Ωdbricm__32 illegal to set variable outside of `std_with_variables()` contexts");
        }
        if ((entry = this.state.std_variables[name]) == null) {
          throw new Error(`Ωdbricm__33 unknown variable ${rpr(name)}`);
        }
        if ((delta = entry.delta) == null) {
          throw new Error(`Ωdbricm__34 not a sequence name: ${rpr(name)}`);
        }
        entry.value += delta;
        return entry.value;
      }

      //---------------------------------------------------------------------------------------------------------
      _show_variables(print_table = false) {
        var R, all_names, c, cache_names, delta, gv, i, len, name, ref, ref1, ref2, s, store, store_names, t, trans_names, value;
        store = Object.fromEntries((function() {
          var results, y;
          results = [];
          for (y of this.statements.get_variables.iterate()) {
            ({name, value, delta} = y);
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
constraint "Ωconstraint__24" check ( ( delta is null ) or ( delta != 0 ) )
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
    Dbric,
    Dbric_std,
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
    internals: freeze({E, type_of, build_statement_re, templates, Dbric_std_base, Dbric_std_variables})
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSx3QkFBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTs7Ozs7RUFLQSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSOztFQUNsQyxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxTQUFTLENBQUMsOEJBQVYsQ0FBQSxDQURsQzs7RUFFQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLE1BREYsQ0FBQSxHQUNrQyxTQUFTLENBQUMsNEJBQVYsQ0FBQSxDQUF3QyxDQUFDLE1BRDNFOztFQUVBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLDhCQUFSLENBQWxDOztFQUNBLE1BQUEsR0FBa0MsT0FBQSxDQUFRLGFBQVI7O0VBQ2xD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QVNmLEtBVGU7SUFVZixPQVZlO0lBV2YsU0FYZTtJQVlmLFlBWmU7SUFhZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLE9BRmdCLEVBR2hCLGtCQUhnQixFQUloQixTQUpnQixFQUtoQixjQUxnQixFQU1oQixtQkFOZ0IsQ0FBUDtFQWJJO0FBcHNCakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcblNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xueyBnZXRfcHJvdG90eXBlX2NoYWluLFxuICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxueyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgVHJ1ZSxcbiAgRmFsc2UsXG4gIGZyb21fYm9vbCxcbiAgYXNfYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBJRE4sXG4gIExJVCxcbiAgVkVDLFxuICBTUUwsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJy4vZGJyaWMtdXRpbGl0aWVzJ1xuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG5nZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICB3aGlsZSB4P1xuICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYnVpbGRfc3RhdGVtZW50X3JlID0gLy8vXG4gIF4gXFxzKlxuICBpbnNlcnQgfCAoXG4gICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICApXG4gIC8vL2lzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGVtcGxhdGVzID1cbiAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZzoge31cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAX2dldF9idWlsZF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogLT4gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBALCAnYnVpbGQnICkucmV2ZXJzZSgpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgZGJfb2JqZWN0cyAgICAgICAgICAgID0ge31cbiAgICBzdGF0ZW1lbnRfY291bnQgICAgICAgPSAwXG4gICAgZXJyb3JfY291bnQgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgY29udGludWUgdW5sZXNzIGJ1aWxkX3N0YXRlbWVudHM/XG4gICAgICBmb3Igc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHN0YXRlbWVudFxuICAgICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgc3RhdGVtZW50ID0gc3RhdGVtZW50LmNhbGwgQFxuICAgICAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ3RleHQnXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZ19vcl9zdHJpbmdfdmFsX2ZuICfOqWRicmljbV9fXzYnLCB0eXBlXG4gICAgICAgICAgd2hlbiAndGV4dCcgdGhlbiBudWxsXG4gICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9zdHJpbmdfb3Jfc3RyaW5nX3ZhbF9mbiAnzqlkYnJpY21fX183JywgdHlwZVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IHVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByIHN0YXRlbWVudH1cIlxuICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ3N0YXRlbWVudHMnICkucmV2ZXJzZSgpXG4gICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgIGlmIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdP1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOCBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWMgZXh0ZW5kcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBjZmc6IGZyZWV6ZVxuICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gIEBmdW5jdGlvbnM6ICAge31cbiAgQHN0YXRlbWVudHM6ICB7fVxuICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgQGRiX2NsYXNzOiAgICBTUUxJVEUuRGF0YWJhc2VTeW5jXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgc3VwZXIoKVxuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGRiX2NsYXNzICAgICAgICAgICAgICAgICAgPSAoIGNmZz8uZGJfY2xhc3MgKSA/IGNsYXN6LmRiX2NsYXNzXG4gICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBkYl9jbGFzcyBkYl9wYXRoXG4gICAgIyBAZGIgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IFNRTElURS5EYXRhYmFzZVN5bmMgZGJfcGF0aFxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgIEBpbml0aWFsaXplKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgQGJ1aWxkKClcbiAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGluaXRpYWxpemU6IC0+XG4gICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzEgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgbnVsbFxuICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgZWxzZVxuICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fMiBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgY291bnQrK1xuICAgICAgdHJ5XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tJRE4gbmFtZX07XCIgKS5ydW4oKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgd2FybiBcIs6pZGJyaWNtX19fMyBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgcmV0dXJuIGNvdW50XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlYnVpbGQ6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY291bnQgICAgICAgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX180IGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0ZWFyZG93bigpIHVubGVzcyBoYXNfdG9ybl9kb3duXG4gICAgICBoYXNfdG9ybl9kb3duID0gdHJ1ZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgY291bnQrK1xuICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gY291bnRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnc3VwZXInLCAgICAgICAgICAgIC0+IE9iamVjdC5nZXRQcm90b3R5cGVPZiBAY29uc3RydWN0b3JcbiAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeF9yZScsICAgICAgICAtPiBAX2dldF9wcmVmaXhfcmUoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9pc19yZWFkeTogLT5cbiAgICB7IGVycm9yX2NvdW50LFxuICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX181ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3ByZWZpeDogLT5cbiAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9wcmVmaXhfcmU6IC0+XG4gICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3c6IC0+XG4gICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgZGJfY2xhc3M6IEBkYi5jb25zdHJ1Y3Rvciwgc3RhdGU6IEBzdGF0ZSwgfVxuICAgIHJldHVybiBAX3dcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOSBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHRyeVxuICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgIGNhdGNoIGNhdXNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTAgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIEZVTkNUSU9OU1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE2IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE3IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHBhcmFtZXRlcnMsXG4gICAgICBjb2x1bW5zLFxuICAgICAgcm93cyxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkX2Jhc2UgZXh0ZW5kcyBEYnJpY1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGNmZzogZnJlZXplXG4gICAgcHJlZml4OiAnc3RkJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGZ1bmN0aW9uczpcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmVnZXhwOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2lzX3VjX25vcm1hbDpcbiAgICAgICMjIyBOT1RFOiBhbHNvIHNlZSBgU3RyaW5nOjppc1dlbGxGb3JtZWQoKWAgIyMjXG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBmcm9tX2Jvb2wgdGV4dCBpcyB0ZXh0Lm5vcm1hbGl6ZSBmb3JtICMjIyAnTkZDJywgJ05GRCcsICdORktDJywgb3IgJ05GS0QnICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX3RleHQ6XG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV90ZXh0IHRleHQsIGZvcm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDpcbiAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEB0YWJsZV9mdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgcGFyYW1ldGVyczogICBbICdzdGFydCcsICdzdG9wJywgJ3N0ZXAnLCBdXG4gICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgIHN0ZXAgID0gMSBpZiBzdGVwIGlzIDAgIyMjIE5PVEUgZXF1aXZhbGVudCBgKCBPYmplY3QuaXMgc3RlcCwgKzAgKSBvciAoIE9iamVjdC5pcyBzdGVwLCAtMCApICMjI1xuICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgIGxvb3BcbiAgICAgICAgICBpZiBzdGVwID4gMCB0aGVuICBicmVhayBpZiB2YWx1ZSA+IHN0b3BcbiAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgdmFsdWUgKz0gc3RlcFxuICAgICAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHN0YXRlbWVudHM6XG4gICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAYnVpbGQ6IFtcbiAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzICAgIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3JlbGF0aW9ucyBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgIF1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBVREYgaW1wbGVtZW50YXRpb25zICMjI1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9ub3JtYWxpemVfdGV4dDogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiB0ZXh0Lm5vcm1hbGl6ZSBmb3JtXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgZGF0YSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nICfOqWRicmljbV9fMjEnLCB0eXBlLCBkYXRhXG4gICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICB1bmxlc3MgKCBkYXRhLnN0YXJ0c1dpdGggJ3snICkgYW5kICggZGF0YS5lbmRzV2l0aCAnfScgKVxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljbV9fMjInLCBkYXRhXG4gICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgIFIgICAgID0gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG4gICAgcmV0dXJuIEBzdGRfbm9ybWFsaXplX3RleHQgUiwgZm9ybVxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgW1wiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIl06XG4gICAgICAjICAgIyMjIE5PVEUgYXNzdW1lcyB0aGF0IGBkYXRhYCBpcyBpbiBpdHMgbm9ybWFsaXplZCBzdHJpbmcgZm9ybSAjIyNcbiAgICAgICMgICBuYW1lOiBcIiN7cHJlZml4fV9nZXRfc2hhMXN1bTdkXCJcbiAgICAgICMgICB2YWx1ZTogKCBpc19oaXQsIGRhdGEgKSAtPiBnZXRfc2hhMXN1bTdkIFwiI3tpZiBpc19oaXQgdGhlbiAnSCcgZWxzZSAnRyd9I3tkYXRhfVwiXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBbXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIl06XG4gICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIlxuICAgICAgIyAgIHZhbHVlOiAoIGRhdGEgKSAtPlxuICAgICAgIyAgICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICAgICMgICAgICMgZGVidWcgJ86paW1fXzIzJywgcnByIGRhdGFcbiAgICAgICMgICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAgICAjICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgIyAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkX3ZhcmlhYmxlcyBleHRlbmRzIERicmljX3N0ZF9iYXNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBQLi4uICkgLT5cbiAgICBzdXBlciBQLi4uXG4gICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyAgICAgICAgICAgICAgICA/PSBmcmVlemUge31cbiAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCAgPz0gZmFsc2VcbiAgICA7dW5kZWZpbmVkXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAYnVpbGQ6IFtcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIHN0ZF92YXJpYWJsZXMgKFxuICAgICAgICBuYW1lICAgICAgdGV4dCAgICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgIHZhbHVlICAgICBqc29uICAgICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJyxcbiAgICAgICAgZGVsdGEgICAgIGludGVnZXIgICAgICAgICAgICAgICBudWxsIGRlZmF1bHQgbnVsbCxcbiAgICAgIHByaW1hcnkga2V5ICggbmFtZSApXG4gICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18yNFwiIGNoZWNrICggKCBkZWx0YSBpcyBudWxsICkgb3IgKCBkZWx0YSAhPSAwICkgKVxuICAgICAgKTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMXCJcIlwiaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICdzZXE6Z2xvYmFsOnJvd2lkJywgMCwgKzEgKTtcIlwiXCJcbiAgICBdXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAZnVuY3Rpb25zOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2U6XG4gICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgdmFsdWU6ICAoIG5hbWUgKSAtPiBAc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlIG5hbWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF92YXJpYWJsZTpcbiAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X3ZhcmlhYmxlIG5hbWVcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBzdGF0ZW1lbnRzOlxuICAgIHNldF92YXJpYWJsZTogICAgIFNRTFwiXCJcIlxuICAgICAgaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICRuYW1lLCAkdmFsdWUsICRkZWx0YSApXG4gICAgICAgIG9uIGNvbmZsaWN0ICggbmFtZSApIGRvIHVwZGF0ZVxuICAgICAgICAgIHNldCB2YWx1ZSA9ICR2YWx1ZSwgZGVsdGEgPSAkZGVsdGE7XCJcIlwiXG4gICAgZ2V0X3ZhcmlhYmxlczogICAgU1FMXCJzZWxlY3QgbmFtZSwgdmFsdWUsIGRlbHRhIGZyb20gc3RkX3ZhcmlhYmxlcyBvcmRlciBieSBuYW1lO1wiXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBfc3RkX2FjcXVpcmVfc3RhdGU6ICggdHJhbnNpZW50cyA9IHt9ICkgLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgKCB2ICkgPT5cbiAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpXG4gICAgICAgIHZhbHVlICAgICA9IEpTT04ucGFyc2UgdmFsdWVcbiAgICAgICAgdlsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgLT5cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiB0cmFuc2llbnRzXG4gICAgICAgIHRbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIH1cbiAgICAgIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3N0ZF9wZXJzaXN0X3N0YXRlOiAtPlxuICAgICMgd2hpc3BlciAnzqlkYnJpY21fXzI1JywgXCJfc3RkX3BlcnNpc3Rfc3RhdGVcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIF8sIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IG9mIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgICAjIyMgVEFJTlQgY2xlYXIgY2FjaGUgaW4gQHN0YXRlLnN0ZF92YXJpYWJsZXMgPyAjIyNcbiAgICAgICMgd2hpc3BlciAnzqlkYnJpY21fXzI2JywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgIGRlbHRhICA/PSBudWxsXG4gICAgICB2YWx1ZSAgID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgIEBzdGF0ZW1lbnRzLnNldF92YXJpYWJsZS5ydW4geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgZGVsZXRlIHRbIG5hbWUgXSBmb3IgbmFtZSBvZiB0XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF93aXRoX3ZhcmlhYmxlczogKCB0cmFuc2llbnRzLCBmbiApIC0+XG4gICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gWyB0cmFuc2llbnRzLCBmbiwgXSA9IFsge30sIHRyYW5zaWVudHMsIF1cbiAgICAgIHdoZW4gMiB0aGVuIG51bGxcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI3IGV4cGVjdGVkIDEgb3IgMiBhcmd1bWVudHMsIGdvdCAje2FyaXR5fVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI4IGlsbGVnYWwgdG8gbmVzdCBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IHRydWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBfc3RkX2FjcXVpcmVfc3RhdGUgdHJhbnNpZW50c1xuICAgIHRyeVxuICAgICAgUiA9IGZuKClcbiAgICBmaW5hbGx5XG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IGZhbHNlXG4gICAgICBAX3N0ZF9wZXJzaXN0X3N0YXRlKClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX3NldF92YXJpYWJsZTogKCBuYW1lLCB2YWx1ZSwgZGVsdGEgKSAtPlxuICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI5IGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgPT4gdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgIGVsc2VcbiAgICAgIGRlbHRhID89IG51bGxcbiAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgICAoIHYgKSA9PiB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfZ2V0X3ZhcmlhYmxlOiAoIG5hbWUgKSAtPlxuICAgICMgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgIyAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18zMCBpbGxlZ2FsIHRvIGdldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgbmFtZSBdLnZhbHVlXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsIG5hbWVcbiAgICAgIHJldHVybiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdLnZhbHVlXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzMxIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2U6ICggbmFtZSApIC0+XG4gICAgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMzIgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICB1bmxlc3MgKCBlbnRyeSA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0gKT9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18zMyB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICB1bmxlc3MgKCBkZWx0YSA9IGVudHJ5LmRlbHRhICk/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMzQgbm90IGEgc2VxdWVuY2UgbmFtZTogI3tycHIgbmFtZX1cIlxuICAgIGVudHJ5LnZhbHVlICs9IGRlbHRhXG4gICAgcmV0dXJuIGVudHJ5LnZhbHVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc2hvd192YXJpYWJsZXM6ICggcHJpbnRfdGFibGUgPSBmYWxzZSApIC0+XG4gICAgc3RvcmUgICAgICAgPSBPYmplY3QuZnJvbUVudHJpZXMgKCBcXFxuICAgICAgWyBuYW1lLCB7IHZhbHVlLCBkZWx0YSwgfSwgXSBcXFxuICAgICAgICBmb3IgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gZnJvbSBcXFxuICAgICAgICAgIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpIClcbiAgICBjYWNoZV9uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICB0cmFuc19uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzXG4gICAgc3RvcmVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIHN0b3JlXG4gICAgYWxsX25hbWVzICAgPSBbICggKCBjYWNoZV9uYW1lcy51bmlvbiBzdG9yZV9uYW1lcyApLnVuaW9uIHRyYW5zX25hbWVzICkuLi4sIF0uc29ydCgpXG4gICAgUiA9IHt9XG4gICAgZm9yIG5hbWUgaW4gYWxsX25hbWVzXG4gICAgICBzICAgICAgICAgPSBzdG9yZVsgICAgICAgICAgICAgICAgICBuYW1lIF0gPyB7fVxuICAgICAgYyAgICAgICAgID0gQHN0YXRlLnN0ZF92YXJpYWJsZXNbICAgbmFtZSBdID8ge31cbiAgICAgIHQgICAgICAgICA9IEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgIG5hbWUgXSA/IHt9XG4gICAgICBndiAgICAgICAgPSBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG4gICAgICBSWyBuYW1lIF0gPSB7IHN2OiBzLnZhbHVlLCBzZDogcy5kZWx0YSwgY3Y6IGMudmFsdWUsIGNkOiBjLmRlbHRhLCB0djogdC52YWx1ZSwgZ3YsIH1cbiAgICBjb25zb2xlLnRhYmxlIFIgaWYgcHJpbnRfdGFibGVcbiAgICByZXR1cm4gUlxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNfc3RkX3ZhcmlhYmxlc1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgSUROLFxuICBMSVQsXG4gIFNRTCxcbiAgVkVDLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIGludGVybmFsczogZnJlZXplIHtcbiAgICBFLFxuICAgIHR5cGVfb2YsXG4gICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAgIHRlbXBsYXRlcyxcbiAgICBEYnJpY19zdGRfYmFzZSxcbiAgICBEYnJpY19zdGRfdmFyaWFibGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
