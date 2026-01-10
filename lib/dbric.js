(function() {
  'use strict';
  var Dbric, Dbric_std, Dbric_std_base, Dbric_std_variables, E, Esql, SFMODULES, SQL, SQLITE, Undumper, as_bool, build_statement_re, debug, esql, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, warn;

  //###########################################################################################################

  //===========================================================================================================
  SFMODULES = require('./main');

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  // { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
  // { nameit,                     } = SFMODULES.require_nameit()
  // { rpr_string,                 } = SFMODULES.require_rpr_string()
  ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);

  ({nfa} = require('normalize-function-arguments'));

  SQLITE = require('node:sqlite');

  ({debug, warn} = console);

  misfit = Symbol('misfit');

  ({get_prototype_chain, get_all_in_prototype_chain} = SFMODULES.unstable.require_get_prototype_chain());

  ({Undumper} = SFMODULES.require_coarse_sqlite_statement_segmenter());

  ({E} = require('./dbric-errors'));

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

  
const True  = 1;
const False = 0;
//===========================================================================================================
;

  from_bool = function(x) {
    switch (x) {
      case true:
        return True;
      case false:
        return False;
      default:
        throw new Error(`Ωjzrsdb___1 expected true or false, got ${rpr(x)}`);
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  as_bool = function(x) {
    switch (x) {
      case True:
        return true;
      case False:
        return false;
      default:
        throw new Error(`Ωjzrsdb___2 expected 0 or 1, got ${rpr(x)}`);
    }
  };

  //===========================================================================================================
  Esql = class Esql {
    constructor() {
      //---------------------------------------------------------------------------------------------------------
      this.IDN = this.IDN.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.LIT = this.LIT.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.VEC = this.VEC.bind(this);
    }

    //---------------------------------------------------------------------------------------------------------
    unquote_name(name) {
      /* TAINT use proper validation */
      var type;
      if ((type = type_of(name)) !== 'text') {
        throw new Error(`Ωdbric___3 expected a text, got a ${type}`);
      }
      switch (true) {
        case /^[^"](.*)[^"]$/.test(name):
          return name;
        case /^"(.+)"$/.test(name):
          return name.slice(1, name.length - 1).replace(/""/g, '"');
      }
      throw new Error(`Ωdbric___4 expected a name, got ${rpr(name)}`);
    }

    IDN(name) {
      return '"' + (name.replace(/"/g, '""')) + '"';
    }

    LIT(x) {
      var type;
      if (x == null) {
        return 'null';
      }
      switch (type = type_of(x)) {
        case 'text':
          return "'" + (x.replace(/'/g, "''")) + "'";
        // when 'list'       then return "'#{@list_as_json x}'"
        case 'float':
          return x.toString();
        case 'boolean':
          return (x ? '1' : '0');
      }
      // when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
      throw new E.Dbric_sql_value_error('Ωdbric___5^', type, x);
    }

    VEC(x) {
      var e, type;
      if ((type = type_of(x)) !== 'list') {
        throw new E.Dbric_sql_not_a_list_error('Ωdbric___6^', type, x);
      }
      return '( ' + (((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = x.length; i < len; i++) {
          e = x[i];
          results.push(this.LIT(e));
        }
        return results;
      }).call(this)).join(', ')) + ' )';
    }

  };

  // #-------------------------------------------------------------------------------------------------------
  // interpolate: ( sql, values ) =>
  //   idx = -1
  //   return sql.replace @_interpolation_pattern, ( $0, opener, format, name ) =>
  //     idx++
  //     switch opener
  //       when '$'
  //         validate.nonempty_text name
  //         key = name
  //       when '?'
  //         key = idx
  //     value = values[ key ]
  //     switch format
  //       when '', 'I'  then return @I value
  //       when 'L'      then return @L value
  //       when 'V'      then return @V value
  //     throw new E.Dbric_interpolation_format_unknown 'Ωdbric___7^', format
  // _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g
  //-----------------------------------------------------------------------------------------------------------
  esql = new Esql();

  //-----------------------------------------------------------------------------------------------------------
  SQL = function(parts, ...expressions) {
    var R, expression, i, idx, len;
    R = parts[0];
    for (idx = i = 0, len = expressions.length; i < len; idx = ++i) {
      expression = expressions[idx];
      R += expression.toString() + parts[idx + 1];
    }
    return R;
  };

  Dbric = (function() {
    //===========================================================================================================
    class Dbric {
      //---------------------------------------------------------------------------------------------------------
      /* TAINT use normalize-function-arguments */
      constructor(db_path, cfg) {
        var clasz, db_class, fn_cfg_template, ref, ref1;
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
        throw new Error(`Ωdbric___8 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
            throw new Error(`Ωdbric___9 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
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
            (this.prepare(SQL`drop ${type} ${esql.IDN(name)};`)).run();
          } catch (error1) {
            error = error1;
            if (!RegExp(`no\\s+such\\s+${type}:`).test(error.message)) {
              warn(`Ωdbric__10 ignored error: ${error.message}`);
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
      static _get_build_statements_in_prototype_chain() {
        return (get_all_in_prototype_chain(this, 'build')).reverse();
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
            throw new Error(`Ωdbric__11 expected an optional list for ${clasz.name}.build, got a ${type}`);
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
          throw new Error(`Ωdbric__12 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
                  throw new E.Dbric_expected_string_or_string_val_fn('Ωdbric__13', type);
                }
                break;
              case 'text':
                null;
                break;
              default:
                throw new E.Dbric_expected_string_or_string_val_fn('Ωdbric__14', type);
            }
            statement_count++;
            if ((match = statement.match(build_statement_re)) != null) {
              ({name, type} = match.groups);
              if (name == null) {
                continue;
              }
              name = esql.unquote_name(name);
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
              throw new Error(`Ωdbric__16 statement ${rpr(statement_name)} is already declared`);
            }
            this.statements[statement_name] = this.prepare(statement);
          }
        }
        return null;
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
          throw new Error(`Ωdbric__17 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbric__18 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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

      //---------------------------------------------------------------------------------------------------------
      create_function(cfg) {
        var deterministic, directOnly, name, overwrite, value, varargs;
        if ((type_of(this.db.function)) !== 'function') {
          throw new Error(`Ωdbric__19 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbric__20 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbric__21 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbric__22 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbric__23 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbric__24 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbric__25 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbric__26 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbric__27 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbric__28 a UDF or built-in function named ${rpr(name)} has already been declared`);
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
          throw new E.Dbric_expected_string('Ωdbric__29', type, data);
        }
        if (data === 'null') {
          return data;
        }
        if (!((data.startsWith('{')) && (data.endsWith('}')))) {
          throw new E.Dbric_expected_json_object_string('Ωdbric__30', data);
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
    //     # debug 'Ωim__31', rpr data
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
        // whisper 'Ωdbric__33', "_std_persist_state"
        //.......................................................................................................
        for (_ in ref) {
          ({name, value, delta} = ref[_]);
          /* TAINT clear cache in @state.std_variables ? */
          // whisper 'Ωdbric__34', { name, value, delta, }
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
            throw new Error(`Ωdbric__35 expected 1 or 2 arguments, got ${arity}`);
        }
        //.......................................................................................................
        if (this.state.std_within_variables_context) {
          throw new Error("Ωdbric__36 illegal to nest `std_with_variables()` contexts");
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
          throw new Error("Ωdbric__37 illegal to set variable outside of `std_with_variables()` contexts");
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
        //   throw new Error "Ωdbric__38 illegal to get variable outside of `std_with_variables()` contexts"
        if (Reflect.has(this.state.std_transients, name)) {
          return this.state.std_transients[name].value;
        }
        if (Reflect.has(this.state.std_variables, name)) {
          return this.state.std_variables[name].value;
        }
        throw new Error(`Ωdbric__39 unknown variable ${rpr(name)}`);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      std_get_next_in_sequence(name) {
        var delta, entry;
        if (!this.state.std_within_variables_context) {
          throw new Error("Ωdbric__40 illegal to set variable outside of `std_with_variables()` contexts");
        }
        if ((entry = this.state.std_variables[name]) == null) {
          throw new Error(`Ωdbric__41 unknown variable ${rpr(name)}`);
        }
        if ((delta = entry.delta) == null) {
          throw new Error(`Ωdbric__42 not a sequence name: ${rpr(name)}`);
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
constraint "Ωconstraint__32" check ( ( delta is null ) or ( delta != 0 ) )
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
    esql,
    SQL,
    True,
    False,
    from_bool,
    as_bool,
    internals: freeze({E, type_of, build_statement_re, templates, Dbric_std_base, Dbric_std_variables})
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxrQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSwwQkFBQSxFQUFBLHVCQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUE7Ozs7O0VBS0EsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjs7RUFDbEMsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDhCQUFWLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQWxDLEVBVEE7Ozs7O0VBYUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDRCQUFWLENBQUEsQ0FBd0MsQ0FBQyxNQUQzRTs7RUFFQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQzs7RUFDQSxNQUFBLEdBQWtDLE9BQUEsQ0FBUSxhQUFSOztFQUNsQyxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQzs7RUFFQSxNQUFBLEdBQWtDLE1BQUEs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LElBTGU7SUFNZixLQU5lO0lBT2YsU0FQZTtJQVFmLE9BUmU7SUFTZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLE9BRmdCLEVBR2hCLGtCQUhnQixFQUloQixTQUpnQixFQUtoQixjQUxnQixFQU1oQixtQkFOZ0IsQ0FBUDtFQVRJO0FBcndCakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4jIHsgbmFtZWl0LCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuIyB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG57IGxldHMsXG4gIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xueyBkZWJ1ZyxcbiAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG5taXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG57IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG57IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyKClcbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSBhcyBgZ2V0X2ZpcnN0X2Rlc2NyaXB0b3JfaW5fcHJvdG90eXBlX2NoYWluKClgLCBgZ2V0X2ZpcnN0X2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbmdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gIHdoaWxlIHg/XG4gICAgcmV0dXJuIFIgaWYgKCBSID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciB4LCBuYW1lICk/XG4gICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gIHRocm93IG5ldyBFcnJvciBcInVuYWJsZSB0byBmaW5kIGRlc2NyaXB0b3IgZm9yIHByb3BlcnR5ICN7U3RyaW5nKG5hbWUpfSBub3QgZm91bmQgb24gb2JqZWN0IG9yIGl0cyBwcm90b3R5cGVzXCJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5idWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgXiBcXHMqXG4gIGluc2VydCB8IChcbiAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgIClcbiAgLy8vaXNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG50ZW1wbGF0ZXMgPVxuICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYGBgXG5jb25zdCBUcnVlICA9IDE7XG5jb25zdCBGYWxzZSA9IDA7XG5gYGBcblxuZnJvbV9ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgd2hlbiB0cnVlICB0aGVuIFRydWVcbiAgd2hlbiBmYWxzZSB0aGVuIEZhbHNlXG4gIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18xIGV4cGVjdGVkIHRydWUgb3IgZmFsc2UsIGdvdCAje3JwciB4fVwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYXNfYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gIHdoZW4gVHJ1ZSAgIHRoZW4gdHJ1ZVxuICB3aGVuIEZhbHNlICB0aGVuIGZhbHNlXG4gIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18yIGV4cGVjdGVkIDAgb3IgMSwgZ290ICN7cnByIHh9XCJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEVzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIG5hbWUgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgc3dpdGNoIHRydWVcbiAgICAgIHdoZW4gL15bXlwiXSguKilbXlwiXSQvLnRlc3QgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVxuICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNCBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3JwciBuYW1lfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBJRE46ICggbmFtZSApID0+ICdcIicgKyAoIG5hbWUucmVwbGFjZSAvXCIvZywgJ1wiXCInICkgKyAnXCInXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBMSVQ6ICggeCApID0+XG4gICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgJ86pZGJyaWNfX181XicsIHR5cGUsIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFZFQzogKCB4ICkgPT5cbiAgICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAnzqlkYnJpY19fXzZeJywgdHlwZSwgeCB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiB4ICkgaXMgJ2xpc3QnXG4gICAgcmV0dXJuICcoICcgKyAoICggQExJVCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAjICAgaWR4ID0gLTFcbiAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAjICAgICBpZHgrK1xuICAjICAgICBzd2l0Y2ggb3BlbmVyXG4gICMgICAgICAgd2hlbiAnJCdcbiAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAjICAgICAgICAga2V5ID0gbmFtZVxuICAjICAgICAgIHdoZW4gJz8nXG4gICMgICAgICAgICBrZXkgPSBpZHhcbiAgIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4gICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgIyAgICAgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnzqlkYnJpY19fXzdeJywgZm9ybWF0XG4gICMgX2ludGVycG9sYXRpb25fcGF0dGVybjogLyg/PG9wZW5lcj5bJD9dKSg/PGZvcm1hdD4uPyk6KD88bmFtZT5cXHcqKS9nXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmVzcWwgPSBuZXcgRXNxbCgpXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICBSID0gcGFydHNbIDAgXVxuICBmb3IgZXhwcmVzc2lvbiwgaWR4IGluIGV4cHJlc3Npb25zXG4gICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gIHJldHVybiBSXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGNmZzogZnJlZXplXG4gICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgQGZ1bmN0aW9uczogICB7fVxuICBAc3RhdGVtZW50czogIHt9XG4gIEBidWlsZDogICAgICAgbnVsbFxuICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2Ugbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cyAjIyNcbiAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBkYl9jbGFzcyAgICAgICAgICAgICAgICAgID0gKCBjZmc/LmRiX2NsYXNzICkgPyBjbGFzei5kYl9jbGFzc1xuICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBuZXcgZGJfY2xhc3MgZGJfcGF0aFxuICAgICMgQGRiICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICBAaW5pdGlhbGl6ZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgQF9jcmVhdGVfdWRmcygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICBjb250cmFkaXN0aW5jdGlvbiB0byBgRGJyaWM6OmlzX3JlYWR5YCwgYERicmljOjppc19mcmVzaGAgcmV0YWlucyBpdHMgdmFsdWUgZm9yIHRoZSBsaWZldGltZSBvZlxuICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgIEBidWlsZCgpXG4gICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpbml0aWFsaXplOiAtPlxuICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzggbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgbnVsbFxuICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgZWxzZVxuICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX185IGV4cGVjdGVkIGAnKidgLCBhIFJlZ0V4cCwgYSBmdW5jdGlvbiwgbnVsbCBvciB1bmRlZmluZWQsIGdvdCBhICN7dHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBjb250aW51ZSB1bmxlc3MgdGVzdCBuYW1lXG4gICAgICBjb3VudCsrXG4gICAgICB0cnlcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljX18xMCBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgcmV0dXJuIGNvdW50XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBfZ2V0X2J1aWxkX3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluOiAtPiAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIEAsICdidWlsZCcgKS5yZXZlcnNlKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlYnVpbGQ6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY291bnQgICAgICAgICAgICAgICAgID0gMFxuICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTEgZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNvbnRpbnVlIGlmICggbm90IGJ1aWxkX3N0YXRlbWVudHM/ICkgb3IgKCBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aCBpcyAwIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHRlYXJkb3duKCkgdW5sZXNzIGhhc190b3JuX2Rvd25cbiAgICAgIGhhc190b3JuX2Rvd24gPSB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICBjb3VudCsrXG4gICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgICAgIC0+IEBfZ2V0X3ByZWZpeCgpXG4gIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgc2V0X2dldHRlciBAOjosICd3JywgICAgICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgIHsgZXJyb3JfY291bnQsXG4gICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMiAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHJlc2VudF9kYl9vYmplY3RzID0gQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9wcmVmaXg6IC0+XG4gICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfcHJlZml4X3JlOiAtPlxuICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgIHJldHVybiAvLy8gXiBfPyAje1JlZ0V4cC5lc2NhcGUgQHByZWZpeH0gXyAuKiAkIC8vL1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF93OiAtPlxuICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgIEBfdyA9IG5ldyBAY29uc3RydWN0b3IgQGNmZy5kYl9wYXRoLCB7IGRiX2NsYXNzOiBAZGIuY29uc3RydWN0b3IsIHN0YXRlOiBAc3RhdGUsIH1cbiAgICByZXR1cm4gQF93XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBkYl9vYmplY3RzICAgICAgICAgICAgPSB7fVxuICAgIHN0YXRlbWVudF9jb3VudCAgICAgICA9IDBcbiAgICBlcnJvcl9jb3VudCAgICAgICAgICAgPSAwXG4gICAgYnVpbGRfc3RhdGVtZW50c19saXN0ID0gY2xhc3ouX2dldF9idWlsZF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbigpXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudHMgaW4gYnVpbGRfc3RhdGVtZW50c19saXN0XG4gICAgICBjb250aW51ZSB1bmxlc3MgYnVpbGRfc3RhdGVtZW50cz9cbiAgICAgIGZvciBzdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2Ygc3RhdGVtZW50XG4gICAgICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgICAgICBzdGF0ZW1lbnQgPSBzdGF0ZW1lbnQuY2FsbCBAXG4gICAgICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzdGF0ZW1lbnQgKSBpcyAndGV4dCdcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNfXzEzJywgdHlwZVxuICAgICAgICAgIHdoZW4gJ3RleHQnIHRoZW4gbnVsbFxuICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNfXzE0JywgdHlwZVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHIgc3RhdGVtZW50fVwiXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICBmb3Igc3RhdGVtZW50cyBpbiBzdGF0ZW1lbnRzX2xpc3RcbiAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTYgc3RhdGVtZW50ICN7cnByIHN0YXRlbWVudF9uYW1lfSBpcyBhbHJlYWR5IGRlY2xhcmVkXCJcbiAgICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE3IGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdHJ5XG4gICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgY2F0Y2ggY2F1c2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE4IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBGVU5DVElPTlNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTkgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIwIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjIgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIzIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjQgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yNSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIHJvd3MsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yNiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yNyBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjggYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZF9iYXNlIGV4dGVuZHMgRGJyaWNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBjZmc6IGZyZWV6ZVxuICAgIHByZWZpeDogJ3N0ZCdcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBmdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlZ2V4cDpcbiAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgIHZhbHVlOiAoIHBhdHRlcm4sIHRleHQgKSAtPiBpZiAoICggbmV3IFJlZ0V4cCBwYXR0ZXJuLCAndicgKS50ZXN0IHRleHQgKSB0aGVuIDEgZWxzZSAwXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9pc191Y19ub3JtYWw6XG4gICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gZnJvbV9ib29sIHRleHQgaXMgdGV4dC5ub3JtYWxpemUgZm9ybSAjIyMgJ05GQycsICdORkQnLCAnTkZLQycsIG9yICdORktEJyAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV90ZXh0OlxuICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgdmFsdWU6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gQHN0ZF9ub3JtYWxpemVfdGV4dCB0ZXh0LCBmb3JtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9ub3JtYWxpemVfanNvbl9vYmplY3Q6XG4gICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICB2YWx1ZTogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdCBkYXRhLCBmb3JtXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAdGFibGVfZnVuY3Rpb25zOlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgIHBhcmFtZXRlcnM6ICAgWyAnc3RhcnQnLCAnc3RvcCcsICdzdGVwJywgXVxuICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICBzdGVwICA9IDEgaWYgc3RlcCBpcyAwICMjIyBOT1RFIGVxdWl2YWxlbnQgYCggT2JqZWN0LmlzIHN0ZXAsICswICkgb3IgKCBPYmplY3QuaXMgc3RlcCwgLTAgKSAjIyNcbiAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICBsb29wXG4gICAgICAgICAgaWYgc3RlcCA+IDAgdGhlbiAgYnJlYWsgaWYgdmFsdWUgPiBzdG9wXG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgIHZhbHVlICs9IHN0ZXBcbiAgICAgICAgO251bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBzdGF0ZW1lbnRzOlxuICAgIHN0ZF9nZXRfc2NoZW1hOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgIHN0ZF9nZXRfcmVsYXRpb25zOiBTUUxcIlwiXCJcbiAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgc2VsZWN0IG5hbWUsIGJ1aWx0aW4sIHR5cGUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpICMjI1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGJ1aWxkOiBbXG4gICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyAgICAgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF9yZWxhdGlvbnMgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcbiAgICBdXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVURGIGltcGxlbWVudGF0aW9ucyAjIyNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfbm9ybWFsaXplX3RleHQ6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gdGV4dC5ub3JtYWxpemUgZm9ybVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPlxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGRhdGEgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyAnzqlkYnJpY19fMjknLCB0eXBlLCBkYXRhXG4gICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICB1bmxlc3MgKCBkYXRhLnN0YXJ0c1dpdGggJ3snICkgYW5kICggZGF0YS5lbmRzV2l0aCAnfScgKVxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljX18zMCcsIGRhdGFcbiAgICBkYXRhICA9IEpTT04ucGFyc2UgZGF0YVxuICAgIGtleXMgID0gKCBPYmplY3Qua2V5cyBkYXRhICkuc29ydCgpXG4gICAgUiAgICAgPSBKU09OLnN0cmluZ2lmeSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGssIGRhdGFbIGsgXSwgXSBmb3IgayBpbiBrZXlzIClcbiAgICByZXR1cm4gQHN0ZF9ub3JtYWxpemVfdGV4dCBSLCBmb3JtXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBbXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXTpcbiAgICAgICMgICAjIyMgTk9URSBhc3N1bWVzIHRoYXQgYGRhdGFgIGlzIGluIGl0cyBub3JtYWxpemVkIHN0cmluZyBmb3JtICMjI1xuICAgICAgIyAgIG5hbWU6IFwiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIlxuICAgICAgIyAgIHZhbHVlOiAoIGlzX2hpdCwgZGF0YSApIC0+IGdldF9zaGExc3VtN2QgXCIje2lmIGlzX2hpdCB0aGVuICdIJyBlbHNlICdHJ30je2RhdGF9XCJcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIFtcIiN7cHJlZml4fV9ub3JtYWxpemVfZGF0YVwiXTpcbiAgICAgICMgICBuYW1lOiBcIiN7cHJlZml4fV9ub3JtYWxpemVfZGF0YVwiXG4gICAgICAjICAgdmFsdWU6ICggZGF0YSApIC0+XG4gICAgICAjICAgICByZXR1cm4gZGF0YSBpZiBkYXRhIGlzICdudWxsJ1xuICAgICAgIyAgICAgIyBkZWJ1ZyAnzqlpbV9fMzEnLCBycHIgZGF0YVxuICAgICAgIyAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgICMgICAgIGtleXMgID0gKCBPYmplY3Qua2V5cyBkYXRhICkuc29ydCgpXG4gICAgICAjICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19zdGRfdmFyaWFibGVzIGV4dGVuZHMgRGJyaWNfc3RkX2Jhc2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgIHN1cGVyIFAuLi5cbiAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyAgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ICA/PSBmYWxzZVxuICAgIDt1bmRlZmluZWRcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBidWlsZDogW1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgc3RkX3ZhcmlhYmxlcyAoXG4gICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgdmFsdWUgICAgIGpzb24gICAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLFxuICAgICAgICBkZWx0YSAgICAgaW50ZWdlciAgICAgICAgICAgICAgIG51bGwgZGVmYXVsdCBudWxsLFxuICAgICAgcHJpbWFyeSBrZXkgKCBuYW1lIClcbiAgICAgIGNvbnN0cmFpbnQgXCLOqWNvbnN0cmFpbnRfXzMyXCIgY2hlY2sgKCAoIGRlbHRhIGlzIG51bGwgKSBvciAoIGRlbHRhICE9IDAgKSApXG4gICAgICApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUxcIlwiXCJpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJ3NlcTpnbG9iYWw6cm93aWQnLCAwLCArMSApO1wiXCJcIlxuICAgIF1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBmdW5jdGlvbnM6XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTpcbiAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UgbmFtZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2V0X3ZhcmlhYmxlOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHN0YXRlbWVudHM6XG4gICAgc2V0X3ZhcmlhYmxlOiAgICAgU1FMXCJcIlwiXG4gICAgICBpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJG5hbWUsICR2YWx1ZSwgJGRlbHRhIClcbiAgICAgICAgb24gY29uZmxpY3QgKCBuYW1lICkgZG8gdXBkYXRlXG4gICAgICAgICAgc2V0IHZhbHVlID0gJHZhbHVlLCBkZWx0YSA9ICRkZWx0YTtcIlwiXCJcbiAgICBnZXRfdmFyaWFibGVzOiAgICBTUUxcInNlbGVjdCBuYW1lLCB2YWx1ZSwgZGVsdGEgZnJvbSBzdGRfdmFyaWFibGVzIG9yZGVyIGJ5IG5hbWU7XCJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIF9zdGRfYWNxdWlyZV9zdGF0ZTogKCB0cmFuc2llbnRzID0ge30gKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgPSBsZXRzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCAoIHYgKSA9PlxuICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gQHN0YXRlbWVudHMuZ2V0X3ZhcmlhYmxlcy5pdGVyYXRlKClcbiAgICAgICAgdmFsdWUgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIHRyYW5zaWVudHNcbiAgICAgICAgdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfc3RkX3BlcnNpc3Rfc3RhdGU6IC0+XG4gICAgIyB3aGlzcGVyICfOqWRicmljX18zMycsIFwiX3N0ZF9wZXJzaXN0X3N0YXRlXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBfLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBvZiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1xuICAgICAgIyMjIFRBSU5UIGNsZWFyIGNhY2hlIGluIEBzdGF0ZS5zdGRfdmFyaWFibGVzID8gIyMjXG4gICAgICAjIHdoaXNwZXIgJ86pZGJyaWNfXzM0JywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgIGRlbHRhICA/PSBudWxsXG4gICAgICB2YWx1ZSAgID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgIEBzdGF0ZW1lbnRzLnNldF92YXJpYWJsZS5ydW4geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgZGVsZXRlIHRbIG5hbWUgXSBmb3IgbmFtZSBvZiB0XG4gICAgICA7bnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF93aXRoX3ZhcmlhYmxlczogKCB0cmFuc2llbnRzLCBmbiApIC0+XG4gICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gWyB0cmFuc2llbnRzLCBmbiwgXSA9IFsge30sIHRyYW5zaWVudHMsIF1cbiAgICAgIHdoZW4gMiB0aGVuIG51bGxcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMzUgZXhwZWN0ZWQgMSBvciAyIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18zNiBpbGxlZ2FsIHRvIG5lc3QgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSB0cnVlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAX3N0ZF9hY3F1aXJlX3N0YXRlIHRyYW5zaWVudHNcbiAgICB0cnlcbiAgICAgIFIgPSBmbigpXG4gICAgZmluYWxseVxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSBmYWxzZVxuICAgICAgQF9zdGRfcGVyc2lzdF9zdGF0ZSgpXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHN0ZF9zZXRfdmFyaWFibGU6ICggbmFtZSwgdmFsdWUsIGRlbHRhICkgLT5cbiAgICB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzM3IGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgPT4gdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgIGVsc2VcbiAgICAgIGRlbHRhID89IG51bGxcbiAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgICAoIHYgKSA9PiB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdGRfZ2V0X3ZhcmlhYmxlOiAoIG5hbWUgKSAtPlxuICAgICMgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgIyAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzM4IGlsbGVnYWwgdG8gZ2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICByZXR1cm4gQHN0YXRlLnN0ZF90cmFuc2llbnRzWyBuYW1lIF0udmFsdWVcbiAgICBpZiBSZWZsZWN0LmhhcyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgbmFtZVxuICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0udmFsdWVcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18zOSB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOiAoIG5hbWUgKSAtPlxuICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fNDAgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICB1bmxlc3MgKCBlbnRyeSA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0gKT9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzQxIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgIHVubGVzcyAoIGRlbHRhID0gZW50cnkuZGVsdGEgKT9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzQyIG5vdCBhIHNlcXVlbmNlIG5hbWU6ICN7cnByIG5hbWV9XCJcbiAgICBlbnRyeS52YWx1ZSArPSBkZWx0YVxuICAgIHJldHVybiBlbnRyeS52YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3Nob3dfdmFyaWFibGVzOiAoIHByaW50X3RhYmxlID0gZmFsc2UgKSAtPlxuICAgIHN0b3JlICAgICAgID0gT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgIFsgbmFtZSwgeyB2YWx1ZSwgZGVsdGEsIH0sIF0gXFxcbiAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gXFxcbiAgICAgICAgICBAc3RhdGVtZW50cy5nZXRfdmFyaWFibGVzLml0ZXJhdGUoKSApXG4gICAgY2FjaGVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgdHJhbnNfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1xuICAgIHN0b3JlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBzdG9yZVxuICAgIGFsbF9uYW1lcyAgID0gWyAoICggY2FjaGVfbmFtZXMudW5pb24gc3RvcmVfbmFtZXMgKS51bmlvbiB0cmFuc19uYW1lcyApLi4uLCBdLnNvcnQoKVxuICAgIFIgPSB7fVxuICAgIGZvciBuYW1lIGluIGFsbF9uYW1lc1xuICAgICAgcyAgICAgICAgID0gc3RvcmVbICAgICAgICAgICAgICAgICAgbmFtZSBdID8ge31cbiAgICAgIGMgICAgICAgICA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyAgIG5hbWUgXSA/IHt9XG4gICAgICB0ICAgICAgICAgPSBAc3RhdGUuc3RkX3RyYW5zaWVudHNbICBuYW1lIF0gPyB7fVxuICAgICAgZ3YgICAgICAgID0gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuICAgICAgUlsgbmFtZSBdID0geyBzdjogcy52YWx1ZSwgc2Q6IHMuZGVsdGEsIGN2OiBjLnZhbHVlLCBjZDogYy5kZWx0YSwgdHY6IHQudmFsdWUsIGd2LCB9XG4gICAgY29uc29sZS50YWJsZSBSIGlmIHByaW50X3RhYmxlXG4gICAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljX3N0ZF92YXJpYWJsZXNcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBlc3FsLFxuICBTUUwsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIGludGVybmFsczogZnJlZXplIHtcbiAgICBFLFxuICAgIHR5cGVfb2YsXG4gICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAgIHRlbXBsYXRlcyxcbiAgICBEYnJpY19zdGRfYmFzZSxcbiAgICBEYnJpY19zdGRfdmFyaWFibGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
