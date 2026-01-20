(function() {
  'use strict';
  var Db_adapter, Dbric, Dbric_classprop_absorber, E, False, IDN, LIT, SQL, True, VEC, as_bool, build_statement_re, debug, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, ignored_prototypes, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn,
    indexOf = [].indexOf;

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

  ({get_all_in_prototype_chain, get_prototype_chain} = require('./prototype-tools'));

  ({nfa} = (require('./unstable-normalize-function-arguments-brics')).require_normalize_function_arguments());

  // { nameit,                     } = ( require './various-brics' ).require_nameit()
  // { Undumper,                   } = ( require './coarse-sqlite-statement-segmenter.brics' ).require_coarse_sqlite_statement_segmenter()
  //...........................................................................................................
  ({E} = require('./dbric-errors'));

  //...........................................................................................................
  misfit = Symbol('misfit');

  //-----------------------------------------------------------------------------------------------------------
  ({True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL} = require('./dbric-utilities'));

  //-----------------------------------------------------------------------------------------------------------
  ignored_prototypes = null;

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
      db_path: ':memory:'
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
    /* TAINT use proper typing */
    _validate_plugins_property(x) {
      var delta, element, element_idx, i, idx_of_me, idx_of_prototypes, len, type;
      if ((type = type_of(x)) !== 'list') {
        throw new E.Dbric_expected_list_for_plugins('Ωdbricm___1', type);
      }
      //.......................................................................................................
      if ((delta = x.length - (new Set(x)).size) !== 0) {
        throw new E.Dbric_expected_unique_list_for_plugins('Ωdbricm___2', delta);
      }
      //.......................................................................................................
      if (!((idx_of_me = x.indexOf('me')) > (idx_of_prototypes = x.indexOf('prototypes')))) {
        throw new E.Dbric_expected_me_before_prototypes_for_plugins('Ωdbricm___3', idx_of_me, idx_of_prototypes);
      }
//.......................................................................................................
      for (element_idx = i = 0, len = x.length; i < len; element_idx = ++i) {
        element = x[element_idx];
        if (element === 'me') {
          continue;
        }
        if (element === 'prototypes') {
          continue;
        }
        if (element == null) {
          throw new E.Dbric_expected_object_or_placeholder_for_plugin('Ωdbricm___4', element_idx);
        }
        if (!Reflect.has(element, 'exports')) {
          throw new E.Dbric_expected_object_with_exports_for_plugin('Ωdbricm___5', element_idx);
        }
      }
      //.......................................................................................................
      return x;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_acquisition_chain() {
      var R, clasz, entry, i, j, len, len1, p, plugins, prototype, prototypes, ref;
      //.......................................................................................................
      R = [];
      clasz = this.constructor;
      prototypes = get_prototype_chain(clasz);
      prototypes = ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = prototypes.length; i < len; i++) {
          p = prototypes[i];
          if ((p !== clasz) && indexOf.call(ignored_prototypes, p) < 0) {
            results.push(p);
          }
        }
        return results;
      })()).reverse();
      plugins = (ref = clasz.plugins) != null ? ref : [];
      if (indexOf.call(plugins, 'prototypes') < 0) {
        plugins.unshift('prototypes');
      }
      if (indexOf.call(plugins, 'me') < 0) {
        plugins.push('me');
      }
      this._validate_plugins_property(plugins);
//.......................................................................................................
      for (i = 0, len = plugins.length; i < len; i++) {
        entry = plugins[i];
        switch (entry) {
          case 'me':
            R.push({
              type: 'prototype',
              value: clasz
            });
            break;
          case 'prototypes':
            for (j = 0, len1 = prototypes.length; j < len1; j++) {
              prototype = prototypes[j];
              R.push({
                type: 'prototype',
                value: prototype
              });
            }
            break;
          default:
            R.push({
              type: 'plugin',
              value: entry
            });
        }
      }
      //.......................................................................................................
      return R;
    }

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
          throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___6', type);
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
            throw new E.Dbric_internal_error('Ωdbricm___7', `unknown property_type ${rpr(property_type)}`);
        }
      })();
//.......................................................................................................
      for (i = 0, len = candidates_list.length; i < len; i++) {
        candidates = candidates_list[i];
        if ((type = type_of(candidates)) !== property_type) {
          throw new Error(`Ωdbricm___8 expected an optional ${property_type} for ${clasz.name}.${property_name}, got a ${type}`);
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
              throw new E.Dbric_named_statement_exists('Ωdbricm___9', statement_name);
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
        throw new Error(`Ωdbricm__13 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
              warn(`Ωdbricm__14 ignored error: ${error.message}`);
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
          // debug 'Ωdbricm__15', rpr build_statement
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
          throw new Error(`Ωdbricm__16 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
          throw new Error(`Ωdbricm__17 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__18 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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
          throw new Error(`Ωdbricm__19 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__20 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__21 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__22 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__23 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__24 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__25 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__26 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__27 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__28 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, create);
      }

      //=========================================================================================================
      /*

      ooooooooo.   oooo                          o8o
      `888   `Y88. `888                          `"'
       888   .d88'  888  oooo  oooo   .oooooooo oooo  ooo. .oo.    .oooo.o
       888ooo88P'   888  `888  `888  888' `88b  `888  `888P"Y88b  d88(  "8
       888          888   888   888  888   888   888   888   888  `"Y88b.
       888          888   888   888  `88bod8P'   888   888   888  o.  )88b
      o888o        o888o  `V88V"V8P' `8oooooo.  o888o o888o o888o 8""888P'
                                     d"     YD
                                     "Y88888P'

      */
      //---------------------------------------------------------------------------------------------------------
      _collect_dbric_class_properties() {
        var clasz, collectors, i, item, j, key, len, len1, plugin, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref17, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, value;
        clasz = this.constructor;
        collectors = {
          build: [],
          statements: {},
          functions: {},
          aggregate_functions: {},
          window_functions: {},
          table_functions: {},
          virtual_tables: {},
          exports: {}
        };
        ref1 = (ref = clasz.plugins) != null ? ref : [];
        for (i = 0, len = ref1.length; i < len; i++) {
          plugin = ref1[i];
          ref3 = (ref2 = plugin.build) != null ? ref2 : [];
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            item = ref3[j];
            collectors.build.push(item);
          }
          ref5 = (ref4 = plugin.statements) != null ? ref4 : {};
          for (key in ref5) {
            value = ref5[key];
            collectors.statements[key] = value;
          }
          ref7 = (ref6 = plugin.functions) != null ? ref6 : {};
          for (key in ref7) {
            value = ref7[key];
            collectors.functions[key] = value;
          }
          ref9 = (ref8 = plugin.aggregate_functions) != null ? ref8 : {};
          for (key in ref9) {
            value = ref9[key];
            collectors.aggregate_functions[key] = value;
          }
          ref11 = (ref10 = plugin.window_functions) != null ? ref10 : {};
          for (key in ref11) {
            value = ref11[key];
            collectors.window_functions[key] = value;
          }
          ref13 = (ref12 = plugin.table_functions) != null ? ref12 : {};
          for (key in ref13) {
            value = ref13[key];
            collectors.table_functions[key] = value;
          }
          ref15 = (ref14 = plugin.virtual_tables) != null ? ref14 : {};
          for (key in ref15) {
            value = ref15[key];
            collectors.virtual_tables[key] = value;
          }
          ref17 = (ref16 = plugin.exports) != null ? ref16 : {};
          for (key in ref17) {
            value = ref17[key];
            collectors.exports[key] = value;
          }
        }
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric.functions = {};

    Dbric.statements = {};

    Dbric.build = null;

    Dbric.plugins = null;

    Dbric.prototype._constructor = nfa({
      template: templates.dbric_cfg
    }, function(db_path, cfg) {
      var clasz, fn_cfg_template, ref;
      this._validate_is_property('is_ready');
      //.......................................................................................................
      if (db_path == null) {
        db_path = ':memory:';
      }
      //.......................................................................................................
      clasz = this.constructor;
      hide(this, 'db', cfg.host != null ? cfg.host.db : new Db_adapter(db_path));
      // #.......................................................................................................
      // for plugin_name, plugin_class of clasz.plugins ? {}
      //   debug 'Ωdbricm__11', plugin_name, plugin_class
      //   @[ plugin_name ] = new plugin_class { cfg..., host: @, }
      //.......................................................................................................
      this.cfg = freeze({...templates.dbric_cfg, db_path, ...cfg});
      hide(this, 'statements', {});
      hide(this, '_w', null);
      hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
      hide(this, 'state', (ref = (cfg != null ? cfg.state : void 0)) != null ? ref : {
        columns: null
      });
      //.......................................................................................................
      if (cfg.host == null) {
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
      }
      return void 0;
    });

    //---------------------------------------------------------------------------------------------------------
    set_getter(Dbric.prototype, 'super', function() {
      return Object.getPrototypeOf(this.constructor);
    });

    set_getter(Dbric.prototype, 'is_ready', function() {
      return this._get_is_ready();
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
  ignored_prototypes = Object.freeze([Object.getPrototypeOf({}), Object.getPrototypeOf(Object), Dbric_classprop_absorber, Dbric]);

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
    internals: freeze({E, ignored_prototypes, type_of, build_statement_re, templates})
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBO0lBQUEsb0JBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFB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QSxDQUFXLEtBQUMsQ0FBQSxTQUFaLEVBQWdCLFVBQWhCLEVBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUFILENBQXBDOztJQUNBLFVBQUEsQ0FBVyxLQUFDLENBQUEsU0FBWixFQUFnQixpQkFBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQUFILENBQXBDOztJQUNBLFVBQUEsQ0FBVyxLQUFDLENBQUEsU0FBWixFQUFnQixHQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxNQUFELENBQUE7SUFBSCxDQUFwQzs7OztnQkF0V0Y7OztFQTBnQkEsa0JBQUEsR0FBcUIsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUMvQixNQUFNLENBQUMsY0FBUCxDQUFzQixDQUFBLENBQXRCLENBRCtCLEVBRS9CLE1BQU0sQ0FBQyxjQUFQLENBQXNCLE1BQXRCLENBRitCLEVBR2pDLHdCQUhpQyxFQUlqQyxLQUppQyxDQUFkLEVBMWdCckI7OztFQW1oQkEsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixLQURlO0lBRWYsR0FGZTtJQUdmLEdBSGU7SUFJZixHQUplO0lBS2YsR0FMZTtJQU1mLEdBTmU7SUFPZixJQVBlO0lBUWYsS0FSZTtJQVNmLE9BVGU7SUFVZixTQVZlO0lBV2YsWUFYZTtJQVlmLFNBQUEsRUFBVyxNQUFBLENBQU8sQ0FDaEIsQ0FEZ0IsRUFFaEIsa0JBRmdCLEVBR2hCLE9BSGdCLEVBSWhCLGtCQUpnQixFQUtoQixTQUxnQixDQUFQO0VBWkk7QUFuaEJqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZyxcbiAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiMgRGJfYWRhcHRlciAgICAgICAgICAgICAgICAgICAgICA9ICggcmVxdWlyZSAnbm9kZTpzcWxpdGUnICkuRGF0YWJhc2VTeW5jXG5EYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYmV0dGVyLXNxbGl0ZTMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IGxldHMsXG4gIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xldHNmcmVlemV0aGF0LWluZnJhLmJyaWNzJyApLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbnsgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sXG4gIGdldF9wcm90b3R5cGVfY2hhaW4sICAgICAgICB9ID0gcmVxdWlyZSAnLi9wcm90b3R5cGUtdG9vbHMnXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiMgeyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiMgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9jb2Fyc2Utc3FsaXRlLXN0YXRlbWVudC1zZWdtZW50ZXIuYnJpY3MnICkucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbm1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBUcnVlLFxuICBGYWxzZSxcbiAgZnJvbV9ib29sLFxuICBhc19ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIElETixcbiAgTElULFxuICBWRUMsXG4gIFNRTCwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy11dGlsaXRpZXMnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmlnbm9yZWRfcHJvdG90eXBlcyAgICAgICAgICAgICAgPSBudWxsXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSBhcyBgZ2V0X2ZpcnN0X2Rlc2NyaXB0b3JfaW5fcHJvdG90eXBlX2NoYWluKClgLCBgZ2V0X2ZpcnN0X2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbmdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gIHdoaWxlIHg/XG4gICAgcmV0dXJuIFIgaWYgKCBSID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciB4LCBuYW1lICk/XG4gICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gIHRocm93IG5ldyBFcnJvciBcInVuYWJsZSB0byBmaW5kIGRlc2NyaXB0b3IgZm9yIHByb3BlcnR5ICN7U3RyaW5nKG5hbWUpfSBub3QgZm91bmQgb24gb2JqZWN0IG9yIGl0cyBwcm90b3R5cGVzXCJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5idWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgXiBcXHMqXG4gIGluc2VydCB8IChcbiAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgIClcbiAgLy8vaXNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG50ZW1wbGF0ZXMgPVxuICBkYnJpY19jZmc6XG4gICAgZGJfcGF0aDogICAgICAgICc6bWVtb3J5OidcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIF92YWxpZGF0ZV9wbHVnaW5zX3Byb3BlcnR5OiAoIHggKSAtPlxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX2xpc3RfZm9yX3BsdWdpbnMgJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGRlbHRhID0geC5sZW5ndGggLSAoIG5ldyBTZXQgeCApLnNpemUgKSBpcyAwXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF91bmlxdWVfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18yJywgZGVsdGFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGlkeF9vZl9tZSA9IHguaW5kZXhPZiAnbWUnICkgPiAoIGlkeF9vZl9wcm90b3R5cGVzID0geC5pbmRleE9mICdwcm90b3R5cGVzJyApXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9tZV9iZWZvcmVfcHJvdG90eXBlc19mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18zJywgaWR4X29mX21lLCBpZHhfb2ZfcHJvdG90eXBlc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVsZW1lbnQsIGVsZW1lbnRfaWR4IGluIHhcbiAgICAgIGNvbnRpbnVlIGlmIGVsZW1lbnQgaXMgJ21lJ1xuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAncHJvdG90eXBlcydcbiAgICAgIHVubGVzcyBlbGVtZW50P1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfb3JfcGxhY2Vob2xkZXJfZm9yX3BsdWdpbiAnzqlkYnJpY21fX180JywgZWxlbWVudF9pZHhcbiAgICAgIHVubGVzcyBSZWZsZWN0LmhhcyBlbGVtZW50LCAnZXhwb3J0cydcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfb2JqZWN0X3dpdGhfZXhwb3J0c19mb3JfcGx1Z2luICfOqWRicmljbV9fXzUnLCBlbGVtZW50X2lkeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfYWNxdWlzaXRpb25fY2hhaW46IC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICA9IFtdXG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBwcm90b3R5cGVzICA9IGdldF9wcm90b3R5cGVfY2hhaW4gY2xhc3pcbiAgICBwcm90b3R5cGVzICA9ICggcCBmb3IgcCBpbiBwcm90b3R5cGVzIHdoZW4gKCBwIGlzbnQgY2xhc3ogKSBhbmQgcCBub3QgaW4gaWdub3JlZF9wcm90b3R5cGVzICkucmV2ZXJzZSgpXG4gICAgcGx1Z2lucyAgICAgPSBjbGFzei5wbHVnaW5zID8gW11cbiAgICBwbHVnaW5zLnVuc2hpZnQgJ3Byb3RvdHlwZXMnICB1bmxlc3MgJ3Byb3RvdHlwZXMnIGluIHBsdWdpbnNcbiAgICBwbHVnaW5zLnB1c2ggICAgJ21lJyAgICAgICAgICB1bmxlc3MgJ21lJyAgICAgICAgIGluIHBsdWdpbnNcbiAgICBAX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHkgcGx1Z2luc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVudHJ5IGluIHBsdWdpbnNcbiAgICAgIHN3aXRjaCBlbnRyeVxuICAgICAgICB3aGVuICdtZSdcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgdmFsdWU6IGNsYXN6LCB9XG4gICAgICAgIHdoZW4gJ3Byb3RvdHlwZXMnXG4gICAgICAgICAgZm9yIHByb3RvdHlwZSBpbiBwcm90b3R5cGVzXG4gICAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgdmFsdWU6IHByb3RvdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgUi5wdXNoIHsgdHlwZTogJ3BsdWdpbicsIHZhbHVlOiBlbnRyeSwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW46ICggcHJvcGVydHlfbmFtZSwgcHJvcGVydHlfdHlwZSApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY2FuZGlkYXRlc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlID0gKCBjYW5kaWRhdGUgKSA9PlxuICAgICAgaWYgKCB0eXBlX29mIGNhbmRpZGF0ZSApIGlzICdmdW5jdGlvbicgdGhlbiBSID0gY2FuZGlkYXRlLmNhbGwgQFxuICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gY2FuZGlkYXRlXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBSICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZ19vcl9zdHJpbmdfdmFsX2ZuICfOqWRicmljbV9fXzYnLCB0eXBlXG4gICAgICByZXR1cm4gUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiA9IHN3aXRjaCBwcm9wZXJ0eV90eXBlXG4gICAgICB3aGVuICdsaXN0JyB0aGVuIFtdXG4gICAgICB3aGVuICdwb2QnICB0aGVuIHt9XG4gICAgICBlbHNlIHRocm93IG5ldyBFLkRicmljX2ludGVybmFsX2Vycm9yICfOqWRicmljbV9fXzcnLCBcInVua25vd24gcHJvcGVydHlfdHlwZSAje3JwciBwcm9wZXJ0eV90eXBlfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgY2FuZGlkYXRlcyBpbiBjYW5kaWRhdGVzX2xpc3RcbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBjYW5kaWRhdGVzICkgaXMgcHJvcGVydHlfdHlwZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fXzggZXhwZWN0ZWQgYW4gb3B0aW9uYWwgI3twcm9wZXJ0eV90eXBlfSBmb3IgI3tjbGFzei5uYW1lfS4je3Byb3BlcnR5X25hbWV9LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgcHJvcGVydHlfdHlwZSBpcyAnbGlzdCdcbiAgICAgICAgZm9yIGNhbmRpZGF0ZSBpbiBjYW5kaWRhdGVzXG4gICAgICAgICAgUi5wdXNoIHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICAgIGVsc2VcbiAgICAgICAgZm9yIHN0YXRlbWVudF9uYW1lLCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlc1xuICAgICAgICAgIGlmIFJlZmxlY3QuaGFzIFIsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19uYW1lZF9zdGF0ZW1lbnRfZXhpc3RzICfOqWRicmljbV9fXzknLCBzdGF0ZW1lbnRfbmFtZVxuICAgICAgICAgIFJbIHN0YXRlbWVudF9uYW1lIF0gPSBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgY2FuZGlkYXRlXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBkYl9vYmplY3RzICAgICAgICAgICAgPSB7fVxuICAgIHN0YXRlbWVudF9jb3VudCAgICAgICA9IDBcbiAgICBlcnJvcl9jb3VudCAgICAgICAgICAgPSAwXG4gICAgYnVpbGRfc3RhdGVtZW50cyAgICAgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ2J1aWxkJywgJ2xpc3QnXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBidWlsZF9zdGF0ZW1lbnRzXG4gICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgaWYgKCBtYXRjaCA9IGJ1aWxkX3N0YXRlbWVudC5tYXRjaCBidWlsZF9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBuYW1lPyAjIyMgTk9URSBpZ25vcmUgc3RhdGVtZW50cyBsaWtlIGBpbnNlcnRgICMjI1xuICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gdW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgZWxzZVxuICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHIgYnVpbGRfc3RhdGVtZW50fVwiXG4gICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgIGNsYXN6ICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgc3RhdGVtZW50cyAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnc3RhdGVtZW50cycsICdwb2QnXG4gICAgZm9yIHN0YXRlbWVudF9uYW1lLCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50c1xuICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV91ZGZzOiAtPlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIHB1dCBzb21ld2hlcmUgZWxzZT8gIyMjXG4gICAgbmFtZXNfb2ZfY2FsbGFibGVzICA9XG4gICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAndmFsdWUnLCBdXG4gICAgICBhZ2dyZWdhdGVfZnVuY3Rpb246ICAgWyAnc3RhcnQnLCAnc3RlcCcsICdyZXN1bHQnLCBdXG4gICAgICB3aW5kb3dfZnVuY3Rpb246ICAgICAgWyAnc3RhcnQnLCAnc3RlcCcsICdpbnZlcnNlJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgdmlydHVhbF90YWJsZTogICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgY2F0ZWdvcnkgaW4gWyAnZnVuY3Rpb24nLCBcXFxuICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgIHByb3BlcnR5X25hbWUgICAgID0gXCIje2NhdGVnb3J5fXNcIlxuICAgICAgbWV0aG9kX25hbWUgICAgICAgPSBcImNyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgIGZvciBkZWNsYXJhdGlvbnMgaW4gZGVjbGFyYXRpb25zX2xpc3RcbiAgICAgICAgY29udGludWUgdW5sZXNzIGRlY2xhcmF0aW9ucz9cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgICAgZC5uYW1lID89IHVkZl9uYW1lXG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgZm9yIG5hbWVfb2ZfY2FsbGFibGUgaW4gbmFtZXNfb2ZfY2FsbGFibGVzWyBjYXRlZ29yeSBdXG4gICAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljIGV4dGVuZHMgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAgICAgICB7fVxuICBAc3RhdGVtZW50czogICAgICB7fVxuICBAYnVpbGQ6ICAgICAgICAgICBudWxsXG4gIEBwbHVnaW5zOiAgICAgICAgIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBOT1RFIHRoaXMgdW51c3VhbCBhcnJhbmdlbWVudCBpcyBzb2xlbHkgdGhlcmUgc28gd2UgY2FuIGNhbGwgYHN1cGVyKClgIGZyb20gYW4gaW5zdGFuY2UgbWV0aG9kICMjI1xuICBjb25zdHJ1Y3RvcjogKCBQLi4uICkgLT5cbiAgICBzdXBlcigpXG4gICAgcmV0dXJuIEBfY29uc3RydWN0b3IgUC4uLlxuICBfY29uc3RydWN0b3I6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZGJyaWNfY2ZnLCB9LCAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBpZiBjZmcuaG9zdD8gdGhlbiBjZmcuaG9zdC5kYiBlbHNlIG5ldyBEYl9hZGFwdGVyIGRiX3BhdGhcbiAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBmb3IgcGx1Z2luX25hbWUsIHBsdWdpbl9jbGFzcyBvZiBjbGFzei5wbHVnaW5zID8ge31cbiAgICAjICAgZGVidWcgJ86pZGJyaWNtX18xMScsIHBsdWdpbl9uYW1lLCBwbHVnaW5fY2xhc3NcbiAgICAjICAgQFsgcGx1Z2luX25hbWUgXSA9IG5ldyBwbHVnaW5fY2xhc3MgeyBjZmcuLi4sIGhvc3Q6IEAsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuZGJyaWNfY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzIGNmZy5ob3N0P1xuICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICB0aGUgaW5zdGFuY2UuICMjI1xuICAgICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgICAgQGJ1aWxkKClcbiAgICAgIEBfcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMyBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3JwciBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgUiA9IHt9XG4gICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlYXJkb3duOiAtPlxuICAgIGNvdW50ID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBjb3VudCsrXG4gICAgICB0cnlcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje0lETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICB3YXJuIFwizqlkYnJpY21fXzE0IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICByZXR1cm4gY291bnRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcmVidWlsZDogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBidWlsZF9zdGF0ZW1lbnRzICAgICAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnYnVpbGQnLCAnbGlzdCdcbiAgICBAdGVhcmRvd24oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBidWlsZF9zdGF0ZW1lbnRzXG4gICAgICAjIGRlYnVnICfOqWRicmljbV9fMTUnLCBycHIgYnVpbGRfc3RhdGVtZW50XG4gICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gYnVpbGRfc3RhdGVtZW50cy5sZW5ndGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNldF9nZXR0ZXIgQDo6LCAnc3VwZXInLCAgICAgICAgICAgIC0+IE9iamVjdC5nZXRQcm90b3R5cGVPZiBAY29uc3RydWN0b3JcbiAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9pc19yZWFkeTogLT5cbiAgICB7IGVycm9yX2NvdW50LFxuICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE2ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3c6IC0+XG4gICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgc3RhdGU6IEBzdGF0ZSwgfVxuICAgIHJldHVybiBAX3dcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNyBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHRyeVxuICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgIGNhdGNoIGNhdXNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTggd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIEZVTkNUSU9OU1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIwIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjEgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIzIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI0IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHBhcmFtZXRlcnMsXG4gICAgICBjb2x1bW5zLFxuICAgICAgcm93cyxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yNiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjcgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yOCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjXG5cbiAgb29vb29vb29vLiAgIG9vb28gICAgICAgICAgICAgICAgICAgICAgICAgIG84b1xuICBgODg4ICAgYFk4OC4gYDg4OCAgICAgICAgICAgICAgICAgICAgICAgICAgYFwiJ1xuICAgODg4ICAgLmQ4OCcgIDg4OCAgb29vbyAgb29vbyAgIC5vb29vb29vbyBvb29vICBvb28uIC5vby4gICAgLm9vb28ub1xuICAgODg4b29vODhQJyAgIDg4OCAgYDg4OCAgYDg4OCAgODg4JyBgODhiICBgODg4ICBgODg4UFwiWTg4YiAgZDg4KCAgXCI4XG4gICA4ODggICAgICAgICAgODg4ICAgODg4ICAgODg4ICA4ODggICA4ODggICA4ODggICA4ODggICA4ODggIGBcIlk4OGIuXG4gICA4ODggICAgICAgICAgODg4ICAgODg4ICAgODg4ICBgODhib2Q4UCcgICA4ODggICA4ODggICA4ODggIG8uICApODhiXG4gIG84ODhvICAgICAgICBvODg4byAgYFY4OFZcIlY4UCcgYDhvb29vb28uICBvODg4byBvODg4byBvODg4byA4XCJcIjg4OFAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkXCIgICAgIFlEXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlk4ODg4OFAnXG5cbiAgIyMjXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbGxlY3RfZGJyaWNfY2xhc3NfcHJvcGVydGllczogLT5cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGNvbGxlY3RvcnMgID1cbiAgICAgIGJ1aWxkOiAgICAgICAgICAgICAgICBbXVxuICAgICAgc3RhdGVtZW50czogICAgICAgICAgIHt9XG4gICAgICBmdW5jdGlvbnM6ICAgICAgICAgICAge31cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbnM6ICB7fVxuICAgICAgd2luZG93X2Z1bmN0aW9uczogICAgIHt9XG4gICAgICB0YWJsZV9mdW5jdGlvbnM6ICAgICAge31cbiAgICAgIHZpcnR1YWxfdGFibGVzOiAgICAgICB7fVxuICAgICAgZXhwb3J0czogICAgICAgICAgICAgIHt9XG4gICAgZm9yIHBsdWdpbiBpbiAoIGNsYXN6LnBsdWdpbnMgPyBbXSApXG4gICAgICBjb2xsZWN0b3JzLmJ1aWxkLnB1c2ggICAgICAgICAgIGl0ZW0gICAgICAgICAgZm9yIGl0ZW0gICAgICAgIGluICggcGx1Z2luLmJ1aWxkICAgICAgICAgICAgICAgPyBbXSApXG4gICAgICBjb2xsZWN0b3JzLnN0YXRlbWVudHNbICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLnN0YXRlbWVudHMgICAgICAgICAgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLmZ1bmN0aW9uc1sgICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLmZ1bmN0aW9ucyAgICAgICAgICAgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLmFnZ3JlZ2F0ZV9mdW5jdGlvbnNbIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLmFnZ3JlZ2F0ZV9mdW5jdGlvbnMgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLndpbmRvd19mdW5jdGlvbnNbICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLndpbmRvd19mdW5jdGlvbnMgICAgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLnRhYmxlX2Z1bmN0aW9uc1sgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLnRhYmxlX2Z1bmN0aW9ucyAgICAgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLnZpcnR1YWxfdGFibGVzWyAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLnZpcnR1YWxfdGFibGVzICAgICAgPyB7fSApXG4gICAgICBjb2xsZWN0b3JzLmV4cG9ydHNbICAgICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggcGx1Z2luLmV4cG9ydHMgICAgICAgICAgICAgPyB7fSApXG4gICAgcmV0dXJuIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pZ25vcmVkX3Byb3RvdHlwZXMgPSBPYmplY3QuZnJlZXplIFtcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge30gKSxcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgT2JqZWN0ICksXG4gIERicmljX2NsYXNzcHJvcF9hYnNvcmJlcixcbiAgRGJyaWMsXG4gIF1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEYnJpYyxcbiAgU1FMLFxuICBJRE4sXG4gIExJVCxcbiAgU1FMLFxuICBWRUMsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBhc19ib29sLFxuICBmcm9tX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgaW50ZXJuYWxzOiBmcmVlemUge1xuICAgIEUsXG4gICAgaWdub3JlZF9wcm90b3R5cGVzLFxuICAgIHR5cGVfb2YsXG4gICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAgIHRlbXBsYXRlcywgfVxuICB9XG5cblxuXG4iXX0=
