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

  ({get_all_in_prototype_chain, get_prototype_chain} = (require('./unstable-object-tools-brics')).require_get_prototype_chain());

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
        throw new E.Dbric_expected_list_for_plugins('Ωdbricm___2', type);
      }
      //.......................................................................................................
      if ((delta = x.length - (new Set(x)).size) !== 0) {
        throw new E.Dbric_expected_unique_list_for_plugins('Ωdbricm___3', delta);
      }
      //.......................................................................................................
      if (!((idx_of_me = x.indexOf('me')) > (idx_of_prototypes = x.indexOf('prototypes')))) {
        throw new E.Dbric_expected_me_before_prototypes_for_plugins('Ωdbricm___4', idx_of_me, idx_of_prototypes);
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
          throw new E.Dbric_expected_object_or_placeholder_for_plugin('Ωdbricm___5', element_idx);
        }
        if (!Reflect.has(element, 'exports')) {
          throw new E.Dbric_expected_object_with_exports_for_plugin('Ωdbricm___6', element_idx);
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
          throw new E.Dbric_expected_string_or_string_val_fn('Ωdbricm___7', type);
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
            throw new E.Dbric_internal_error('Ωdbricm___8', `unknown property_type ${rpr(property_type)}`);
        }
      })();
//.......................................................................................................
      for (i = 0, len = candidates_list.length; i < len; i++) {
        candidates = candidates_list[i];
        if ((type = type_of(candidates)) !== property_type) {
          throw new Error(`Ωdbricm___9 expected an optional ${property_type} for ${clasz.name}.${property_name}, got a ${type}`);
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
              throw new E.Dbric_named_statement_exists('Ωdbricm__10', statement_name);
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
        throw new Error(`Ωdbricm__14 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
              warn(`Ωdbricm__15 ignored error: ${error.message}`);
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
          // debug 'Ωdbricm__16', rpr build_statement
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
          throw new Error(`Ωdbricm__17 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
          throw new Error(`Ωdbricm__18 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__19 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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
          throw new Error(`Ωdbricm__20 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__21 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__22 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__23 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__24 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__25 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__26 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__27 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__28 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._function_names.has(name))) {
          throw new Error(`Ωdbricm__29 a UDF or built-in function named ${rpr(name)} has already been declared`);
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
      debug('Ωdbricm__11', this.constructor.name, 'host:', cfg.host);
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
      //   debug 'Ωdbricm__12', plugin_name, plugin_class
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
        debug('Ωdbricm__13', this.constructor.name, "initializing");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBO0lBQUEsb0JBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLDRCQUEzQyxDQUFBLENBQXlFLENBQUMsTUFENUc7O0VBRUEsQ0FBQSxDQUFFLDBCQUFGLEVBQ0UsbUJBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSwrQkFBUixDQUFGLENBQTJDLENBQUMsMkJBQTVDLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSwrQ0FBUixDQUFGLENBQTJELENBQUMsb0NBQTVELENBQUEsQ0FBbEMsRUFyQkE7Ozs7O0VBeUJBLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLENBQWxDLEVBekJBOzs7RUEyQkEsTUFBQSxHQUFrQyxNQUFBLENBQU8sUUFBUCxFQTNCbEM7OztFQTZCQSxDQUFBLENBQUUsSUFBRixFQUNFLEtBREYsRUFFRSxTQUZGLEVBR0UsT0FIRixFQUlFLFlBSkYsRUFLRSxHQUxGLEVBTUUsR0FORixFQU9FLEdBUEYsRUFRRSxHQVJGLENBQUEsR0FRa0MsT0FBQSxDQUFRLG1CQUFSLENBUmxDLEVBN0JBOzs7RUF1Q0Esa0JBQUEsR0FBa0MsS0F2Q2xDOzs7Ozs7RUE4Q0EsdUJBQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsRUFBSyxJQUFMLEVBQVcsV0FBVyxNQUF0QixDQUFBO0FBQzFCLFFBQUE7QUFBRSxXQUFNLFNBQU47TUFDRSxJQUFZLHNEQUFaO0FBQUEsZUFBTyxFQUFQOztNQUNBLENBQUEsR0FBSSxNQUFNLENBQUMsY0FBUCxDQUFzQixDQUF0QjtJQUZOO0lBR0EsSUFBdUIsUUFBQSxLQUFZLE1BQW5DO0FBQUEsYUFBTyxTQUFQOztJQUNBLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx1Q0FBQSxDQUFBLENBQTBDLE1BQUEsQ0FBTyxJQUFQLENBQTFDLENBQUEsc0NBQUEsQ0FBVjtFQUxrQixFQTlDMUI7OztFQXNEQSxrQkFBQSxHQUFxQixzRkF0RHJCOzs7RUFnRUEsU0FBQSxHQUNFO0lBQUEsU0FBQSxFQUNFO01BQUEsT0FBQSxFQUFnQjtJQUFoQixDQURGOztJQUdBLG1CQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWdCLElBQWhCO01BQ0EsT0FBQSxFQUFnQixLQURoQjtNQUVBLFVBQUEsRUFBZ0IsS0FGaEI7TUFHQSxTQUFBLEVBQWdCO0lBSGhCLENBSkY7O0lBU0EsNkJBQUEsRUFDRTtNQUFBLGFBQUEsRUFBZ0IsSUFBaEI7TUFDQSxPQUFBLEVBQWdCLEtBRGhCO01BRUEsVUFBQSxFQUFnQixLQUZoQjtNQUdBLEtBQUEsRUFBZ0IsSUFIaEI7TUFJQSxTQUFBLEVBQWdCO0lBSmhCLENBVkY7O0lBZ0JBLDBCQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWdCLElBQWhCO01BQ0EsT0FBQSxFQUFnQixLQURoQjtNQUVBLFVBQUEsRUFBZ0IsS0FGaEI7TUFHQSxLQUFBLEVBQWdCLElBSGhCO01BSUEsU0FBQSxFQUFnQjtJQUpoQixDQWpCRjs7SUF1QkEseUJBQUEsRUFDRTtNQUFBLGFBQUEsRUFBZ0IsSUFBaEI7TUFDQSxPQUFBLEVBQWdCLEtBRGhCO01BRUEsVUFBQSxFQUFnQixLQUZoQjtNQUdBLFNBQUEsRUFBZ0I7SUFIaEIsQ0F4QkY7O0lBNkJBLHdCQUFBLEVBQTBCLENBQUE7RUE3QjFCLEVBakVGOzs7RUFtR00sMkJBQU4sTUFBQSx5QkFBQSxDQUFBOztJQUdFLDBCQUE0QixDQUFFLENBQUYsQ0FBQTtBQUM5QixVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsV0FBQSxFQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxHQUFBLEVBQUE7TUFBSSxJQUFPLENBQUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxDQUFSLENBQVQsQ0FBQSxLQUF3QixNQUEvQjtRQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsK0JBQU4sQ0FBc0MsYUFBdEMsRUFBcUQsSUFBckQsRUFEUjtPQUFKOztNQUdJLElBQU8sQ0FBRSxLQUFBLEdBQVEsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUFFLElBQUksR0FBSixDQUFRLENBQVIsQ0FBRixDQUFhLENBQUMsSUFBbkMsQ0FBQSxLQUE2QyxDQUFwRDtRQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsc0NBQU4sQ0FBNkMsYUFBN0MsRUFBNEQsS0FBNUQsRUFEUjtPQUhKOztNQU1JLE1BQU8sQ0FBRSxTQUFBLEdBQVksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFWLENBQWQsQ0FBQSxHQUFpQyxDQUFFLGlCQUFBLEdBQW9CLENBQUMsQ0FBQyxPQUFGLENBQVUsWUFBVixDQUF0QixFQUF4QztRQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsK0NBQU4sQ0FBc0QsYUFBdEQsRUFBcUUsU0FBckUsRUFBZ0YsaUJBQWhGLEVBRFI7T0FOSjs7TUFTSSxLQUFBLCtEQUFBOztRQUNFLElBQVksT0FBQSxLQUFXLElBQXZCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBWSxPQUFBLEtBQVcsWUFBdkI7QUFBQSxtQkFBQTs7UUFDQSxJQUFPLGVBQVA7VUFDRSxNQUFNLElBQUksQ0FBQyxDQUFDLCtDQUFOLENBQXNELGFBQXRELEVBQXFFLFdBQXJFLEVBRFI7O1FBRUEsS0FBTyxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosRUFBcUIsU0FBckIsQ0FBUDtVQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsNkNBQU4sQ0FBb0QsYUFBcEQsRUFBbUUsV0FBbkUsRUFEUjs7TUFMRixDQVRKOztBQWlCSSxhQUFPO0lBbEJtQixDQUQ5Qjs7O0lBc0JFLHNCQUF3QixDQUFBLENBQUE7QUFDMUIsVUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLEdBQUE7O01BQ0ksQ0FBQSxHQUFjO01BQ2QsS0FBQSxHQUFjLElBQUMsQ0FBQTtNQUNmLFVBQUEsR0FBYyxtQkFBQSxDQUFvQixLQUFwQjtNQUNkLFVBQUEsR0FBYzs7QUFBRTtRQUFBLEtBQUEsNENBQUE7O2NBQTJCLENBQUUsQ0FBQSxLQUFPLEtBQVQsQ0FBQSxpQkFBOEIsb0JBQVQ7eUJBQWhEOztRQUFBLENBQUE7O1VBQUYsQ0FBK0UsQ0FBQyxPQUFoRixDQUFBO01BQ2QsT0FBQSx5Q0FBOEI7TUFDOUIsaUJBQXFELFNBQWhCLGlCQUFyQztRQUFBLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFlBQWhCLEVBQUE7O01BQ0EsaUJBQXFELFNBQWhCLFNBQXJDO1FBQUEsT0FBTyxDQUFDLElBQVIsQ0FBZ0IsSUFBaEIsRUFBQTs7TUFDQSxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsT0FBNUIsRUFSSjs7TUFVSSxLQUFBLHlDQUFBOztBQUNFLGdCQUFPLEtBQVA7QUFBQSxlQUNPLElBRFA7WUFFSSxDQUFDLENBQUMsSUFBRixDQUFPO2NBQUUsSUFBQSxFQUFNLFdBQVI7Y0FBcUIsS0FBQSxFQUFPO1lBQTVCLENBQVA7QUFERztBQURQLGVBR08sWUFIUDtZQUlJLEtBQUEsOENBQUE7O2NBQ0UsQ0FBQyxDQUFDLElBQUYsQ0FBTztnQkFBRSxJQUFBLEVBQU0sV0FBUjtnQkFBcUIsS0FBQSxFQUFPO2NBQTVCLENBQVA7WUFERjtBQURHO0FBSFA7WUFPSSxDQUFDLENBQUMsSUFBRixDQUFPO2NBQUUsSUFBQSxFQUFNLFFBQVI7Y0FBa0IsS0FBQSxFQUFPO1lBQXpCLENBQVA7QUFQSjtNQURGLENBVko7O0FBb0JJLGFBQU87SUFyQmUsQ0F0QjFCOzs7SUE4Q0Usa0NBQW9DLENBQUUsYUFBRixFQUFpQixhQUFqQixDQUFBLEVBQUE7O0FBQ3RDLFVBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsd0JBQUEsRUFBQSxjQUFBLEVBQUE7TUFBSSxLQUFBLEdBQWtCLElBQUMsQ0FBQTtNQUNuQixlQUFBLEdBQWtCLENBQUUsMEJBQUEsQ0FBMkIsS0FBM0IsRUFBa0MsYUFBbEMsQ0FBRixDQUFtRCxDQUFDLE9BQXBELENBQUEsRUFEdEI7O01BR0ksd0JBQUEsR0FBMkIsQ0FBRSxTQUFGLENBQUEsR0FBQTtBQUMvQixZQUFBLENBQUEsRUFBQTtRQUFNLElBQUcsQ0FBRSxPQUFBLENBQVEsU0FBUixDQUFGLENBQUEsS0FBeUIsVUFBNUI7VUFBNEMsQ0FBQSxHQUFJLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixFQUFoRDtTQUFBLE1BQUE7VUFDNEMsQ0FBQSxHQUFJLFVBRGhEOztRQUVBLElBQU8sQ0FBRSxJQUFBLEdBQU8sT0FBQSxDQUFRLENBQVIsQ0FBVCxDQUFBLEtBQXdCLE1BQS9CO1VBQ0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxzQ0FBTixDQUE2QyxhQUE3QyxFQUE0RCxJQUE1RCxFQURSOztBQUVBLGVBQU87TUFMa0IsRUFIL0I7O01BVUksQ0FBQTtBQUFJLGdCQUFPLGFBQVA7QUFBQSxlQUNHLE1BREg7bUJBQ2U7QUFEZixlQUVHLEtBRkg7bUJBRWUsQ0FBQTtBQUZmO1lBR0csTUFBTSxJQUFJLENBQUMsQ0FBQyxvQkFBTixDQUEyQixhQUEzQixFQUEwQyxDQUFBLHNCQUFBLENBQUEsQ0FBeUIsR0FBQSxDQUFJLGFBQUosQ0FBekIsQ0FBQSxDQUExQztBQUhUO1dBVlI7O01BZUksS0FBQSxpREFBQTs7UUFFRSxJQUFPLENBQUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxVQUFSLENBQVQsQ0FBQSxLQUFpQyxhQUF4QztVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxpQ0FBQSxDQUFBLENBQW9DLGFBQXBDLENBQUEsS0FBQSxDQUFBLENBQXlELEtBQUssQ0FBQyxJQUEvRCxDQUFBLENBQUEsQ0FBQSxDQUF1RSxhQUF2RSxDQUFBLFFBQUEsQ0FBQSxDQUErRixJQUEvRixDQUFBLENBQVYsRUFEUjtTQUROOztRQUlNLElBQUcsYUFBQSxLQUFpQixNQUFwQjtVQUNFLEtBQUEsOENBQUE7O1lBQ0UsQ0FBQyxDQUFDLElBQUYsQ0FBTyx3QkFBQSxDQUF5QixTQUF6QixDQUFQO1VBREYsQ0FERjtTQUFBLE1BQUE7VUFJRSxLQUFBLDRCQUFBOztZQUNFLElBQUcsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFaLEVBQWUsY0FBZixDQUFIO2NBQ0UsTUFBTSxJQUFJLENBQUMsQ0FBQyw0QkFBTixDQUFtQyxhQUFuQyxFQUFrRCxjQUFsRCxFQURSOztZQUVBLENBQUMsQ0FBRSxjQUFGLENBQUQsR0FBc0Isd0JBQUEsQ0FBeUIsU0FBekI7VUFIeEIsQ0FKRjs7TUFMRjtBQWFBLGFBQU87SUE3QjJCLENBOUN0Qzs7O0lBOEVFLGdDQUFrQyxDQUFBLENBQUEsRUFBQTs7QUFDcEMsVUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFXOEIsMENBWDlCLEVBQUEsZUFBQSxFQUFBO01BQ0ksS0FBQSxHQUF3QixJQUFDLENBQUE7TUFDekIsVUFBQSxHQUF3QixDQUFBO01BQ3hCLGVBQUEsR0FBd0I7TUFDeEIsV0FBQSxHQUF3QjtNQUN4QixnQkFBQSxHQUF3QixJQUFDLENBQUEsa0NBQUQsQ0FBb0MsT0FBcEMsRUFBNkMsTUFBN0M7TUFDeEIsS0FBQSxrREFBQTs7UUFDRSxlQUFBO1FBQ0EsSUFBRywyREFBSDtVQUNFLENBQUEsQ0FBRSxJQUFGLEVBQ0UsSUFERixDQUFBLEdBQ3NCLEtBQUssQ0FBQyxNQUQ1QjtVQUVBLElBQWdCLFlBQWhCO0FBQUEscUJBQUE7O1VBQ0EsSUFBQSxHQUFzQixZQUFBLENBQWEsSUFBYjtVQUN0QixVQUFVLENBQUUsSUFBRixDQUFWLEdBQXNCLENBQUUsSUFBRixFQUFRLElBQVIsRUFMeEI7U0FBQSxNQUFBO1VBT0UsV0FBQTtVQUNBLElBQUEsR0FBc0IsQ0FBQSxNQUFBLENBQUEsQ0FBUyxlQUFULENBQUE7VUFDdEIsSUFBQSxHQUFzQjtVQUN0QixPQUFBLEdBQXNCLENBQUEsMEJBQUEsQ0FBQSxDQUE2QixHQUFBLENBQUksZUFBSixDQUE3QixDQUFBO1VBQ3RCLFVBQVUsQ0FBRSxJQUFGLENBQVYsR0FBc0IsQ0FBRSxJQUFGLEVBQVEsSUFBUixFQUFjLE9BQWQsRUFYeEI7O01BRkY7QUFjQSxhQUFPLENBQUUsV0FBRixFQUFlLGVBQWYsRUFBZ0MsVUFBaEM7SUFyQnlCLENBOUVwQzs7O0lBc0dFLG1CQUFxQixDQUFBLENBQUE7QUFDdkIsVUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQTtNQUFJLEtBQUEsR0FBYyxJQUFDLENBQUE7TUFDZixVQUFBLEdBQWMsSUFBQyxDQUFBLGtDQUFELENBQW9DLFlBQXBDLEVBQWtELEtBQWxEO01BQ2QsS0FBQSw0QkFBQTs7UUFDRSxJQUFDLENBQUEsVUFBVSxDQUFFLGNBQUYsQ0FBWCxHQUFnQyxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQ7TUFEbEM7QUFFQSxhQUFPO0lBTFksQ0F0R3ZCOzs7SUE4R0UsWUFBYyxDQUFBLENBQUEsRUFBQTs7QUFDaEIsVUFBQSxRQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxpQkFBQSxFQUFBLE1BQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsV0FBQSxFQUFBLGtCQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQTtNQUFJLEtBQUEsR0FBc0IsSUFBQyxDQUFBO01BRXZCLGtCQUFBLEdBQ0U7UUFBQSxRQUFBLEVBQXNCLENBQUUsT0FBRixDQUF0QjtRQUNBLGtCQUFBLEVBQXNCLENBQUUsT0FBRixFQUFXLE1BQVgsRUFBbUIsUUFBbkIsQ0FEdEI7UUFFQSxlQUFBLEVBQXNCLENBQUUsT0FBRixFQUFXLE1BQVgsRUFBbUIsU0FBbkIsRUFBOEIsUUFBOUIsQ0FGdEI7UUFHQSxjQUFBLEVBQXNCLENBQUUsTUFBRixDQUh0QjtRQUlBLGFBQUEsRUFBc0IsQ0FBRSxNQUFGO01BSnRCO0FBTUY7O01BQUEsS0FBQSxxQ0FBQTs7UUFFRSxhQUFBLEdBQW9CLENBQUEsQ0FBQSxDQUFHLFFBQUgsQ0FBQSxDQUFBO1FBQ3BCLFdBQUEsR0FBb0IsQ0FBQSxPQUFBLENBQUEsQ0FBVSxRQUFWLENBQUE7UUFDcEIsaUJBQUEsR0FBb0IsQ0FBRSwwQkFBQSxDQUEyQixLQUEzQixFQUFrQyxhQUFsQyxDQUFGLENBQW1ELENBQUMsT0FBcEQsQ0FBQTtRQUNwQixLQUFBLHFEQUFBOztVQUNFLElBQWdCLG9CQUFoQjtBQUFBLHFCQUFBO1dBQVI7O1VBRVEsS0FBQSx3QkFBQTs0Q0FBQTs7WUFFRSxNQUFBLEdBQVMsSUFBQSxDQUFLLE1BQUwsRUFBYSxDQUFFLENBQUYsQ0FBQSxHQUFBO0FBQ2hDLGtCQUFBLFFBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLGdCQUFBLEVBQUE7O2dCQUFZLENBQUMsQ0FBQyxPQUFROztBQUdWOzs7Y0FBQSxLQUFBLHdDQUFBOztnQkFDRSxJQUFnQix3Q0FBaEI7QUFBQSwyQkFBQTs7Z0JBQ0EsQ0FBQyxDQUFFLGdCQUFGLENBQUQsR0FBd0IsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO2NBRjFCO0FBR0EscUJBQU87WUFQYSxDQUFiO1lBUVQsSUFBQyxDQUFFLFdBQUYsQ0FBRCxDQUFpQixNQUFqQjtVQVZGO1FBSEY7TUFMRixDQVRKOztBQTZCSSxhQUFPO0lBOUJLOztFQWhIaEI7O0VBa0pNOztJQUFOLE1BQUEsTUFBQSxRQUFvQix5QkFBcEIsQ0FBQTs7O01BVUUsV0FBYSxDQUFBLEdBQUUsQ0FBRixDQUFBO2FBQ1gsQ0FBQTtBQUNBLGVBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFBLENBQWQ7TUFGSSxDQVJmOzs7TUErQ0UsYUFBZSxDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUEsWUFBYSxJQUFDLENBQUE7TUFBdkIsQ0EvQ2pCOzs7TUFrREUsb0JBQXNCLENBQUEsQ0FBQSxFQUFBOztRQUVwQixDQUFFLElBQUMsQ0FBQSxFQUFFLENBQUMsT0FBSixDQUFZLEdBQUcsQ0FBQSwwQkFBQSxDQUFmLENBQUYsQ0FBaUQsQ0FBQyxHQUFsRCxDQUFBO1FBQ0EsQ0FBRSxJQUFDLENBQUEsRUFBRSxDQUFDLE9BQUosQ0FBWSxHQUFHLENBQUEseUJBQUEsQ0FBZixDQUFGLENBQWlELENBQUMsR0FBbEQsQ0FBQTtRQUNBLENBQUUsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFBLDRCQUFBLENBQWYsQ0FBRixDQUFpRCxDQUFDLEdBQWxELENBQUE7UUFDQSxDQUFFLElBQUMsQ0FEcUQsZ0JBQ3JELEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFBLHlCQUFBLENBQWYsQ0FBRixDQUFpRCxDQUFDLEdBQWxELENBQUEsRUFKSjs7O0FBT0ksZUFBTztNQVJhLENBbER4Qjs7O01BNkRFLFVBQVksQ0FBQSxDQUFBLEVBQUE7Ozs7QUFJVixlQUFPO01BSkcsQ0E3RGQ7OztNQW9FRSxxQkFBdUIsQ0FBRSxJQUFGLENBQUE7QUFDekIsWUFBQTtRQUFJLFVBQUEsR0FBYSx1QkFBQSxDQUF3QixJQUF4QixFQUEyQixJQUEzQjtRQUNiLElBQWUsQ0FBRSxPQUFBLENBQVEsVUFBVSxDQUFDLEdBQW5CLENBQUYsQ0FBQSxLQUE4QixVQUE3QztBQUFBLGlCQUFPLEtBQVA7O1FBQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZDQUFBLENBQUEsQ0FBZ0QsR0FBQSxDQUFJLElBQUosQ0FBaEQsQ0FBQSxZQUFBLENBQUEsQ0FBdUUsSUFBdkUsQ0FBQSxRQUFBLENBQVY7TUFIZSxDQXBFekI7OztNQTBFRSxlQUFpQixDQUFBLENBQUE7QUFDbkIsWUFBQSxDQUFBLEVBQUE7UUFBSSxDQUFBLEdBQUksQ0FBQTtRQUNKLEtBQUEsNkVBQUE7VUFDRSxDQUFDLENBQUUsR0FBRyxDQUFDLElBQU4sQ0FBRCxHQUFnQjtZQUFFLElBQUEsRUFBTSxHQUFHLENBQUMsSUFBWjtZQUFrQixJQUFBLEVBQU0sR0FBRyxDQUFDO1VBQTVCO1FBRGxCO0FBRUEsZUFBTztNQUpRLENBMUVuQjs7O01BaUZFLFFBQVUsQ0FBQSxDQUFBO0FBQ1osWUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBO1FBQUksS0FBQSxHQUFRLEVBQVo7O1FBRUksQ0FBRSxJQUFDLENBQUEsT0FBRCxDQUFTLEdBQUcsQ0FBQSwwQkFBQSxDQUFaLENBQUYsQ0FBNEMsQ0FBQyxHQUE3QyxDQUFBO0FBQ0E7UUFBQSxLQUFBLFFBQUE7V0FBTyxDQUFFLElBQUYsRUFBUSxJQUFSO1VBQ0wsS0FBQTtBQUNBO1lBQ0UsQ0FBRSxJQUFDLENBQUEsT0FBRCxDQUFTLEdBQUcsQ0FBQSxLQUFBLENBQUEsQ0FBUSxJQUFSLEVBQUEsQ0FBQSxDQUFnQixHQUFBLENBQUksSUFBSixDQUFoQixFQUFBLENBQVosQ0FBRixDQUEyQyxDQUFDLEdBQTVDLENBQUEsRUFERjtXQUVBLGNBQUE7WUFBTTtZQUNKLEtBQTBELE1BQUEsQ0FBQSxDQUFBLGNBQUEsQ0FBQSxDQUFzQixJQUF0QixDQUFBLENBQUEsQ0FBQSxDQUFnQyxDQUFDLElBQWpDLENBQXNDLEtBQUssQ0FBQyxPQUE1QyxDQUExRDtjQUFBLElBQUEsQ0FBSyxDQUFBLDJCQUFBLENBQUEsQ0FBOEIsS0FBSyxDQUFDLE9BQXBDLENBQUEsQ0FBTCxFQUFBO2FBREY7O1FBSkY7UUFNQSxDQUFFLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBRyxDQUFBLHlCQUFBLENBQVosQ0FBRixDQUEyQyxDQUFDLEdBQTVDLENBQUE7QUFDQSxlQUFPO01BWEMsQ0FqRlo7OztNQStGRSxLQUFPLENBQUEsQ0FBQTtRQUFHLElBQUcsSUFBQyxDQUFBLFFBQUo7aUJBQWtCLEVBQWxCO1NBQUEsTUFBQTtpQkFBeUIsSUFBQyxDQUFBLE9BQUQsQ0FBQSxFQUF6Qjs7TUFBSCxDQS9GVDs7O01Ba0dFLE9BQVMsQ0FBQSxDQUFBO0FBQ1gsWUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBO1FBQUksS0FBQSxHQUF3QixJQUFDLENBQUE7UUFDekIsZ0JBQUEsR0FBd0IsSUFBQyxDQUFBLGtDQUFELENBQW9DLE9BQXBDLEVBQTZDLE1BQTdDO1FBQ3hCLElBQUMsQ0FBQSxRQUFELENBQUEsRUFGSjs7UUFJSSxLQUFBLGtEQUFBO2dEQUFBOztVQUVFLENBQUUsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUYsQ0FBNEIsQ0FBQyxHQUE3QixDQUFBO1FBRkYsQ0FKSjs7QUFRSSxlQUFPLGdCQUFnQixDQUFDO01BVGpCLENBbEdYOzs7TUFvSEUsYUFBZSxDQUFBLENBQUE7QUFDakIsWUFBQSxXQUFBLEVBQUEsbUJBQUEsRUFBQSxhQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsa0JBQUEsRUFBQSxHQUFBLEVBQUEsZUFBQSxFQUFBO1FBQUksQ0FBQTtVQUFFLFdBQUY7VUFDRSxlQURGO1VBRUUsVUFBQSxFQUFZO1FBRmQsQ0FBQSxHQUV1QyxJQUFDLENBQUEsZ0NBQUQsQ0FBQSxDQUZ2QyxFQUFKOztRQUlJLElBQUcsV0FBQSxLQUFpQixDQUFwQjtVQUNFLFFBQUEsR0FBVztVQUNYLEtBQUEsMkJBQUE7YUFBVSxDQUFFLElBQUYsRUFBUSxPQUFSO1lBQ1IsSUFBZ0IsSUFBQSxLQUFRLE9BQXhCO0FBQUEsdUJBQUE7O1lBQ0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxPQUFkO1VBRkY7VUFHQSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsWUFBQSxDQUFBLENBQWUsV0FBZixDQUFBLFFBQUEsQ0FBQSxDQUFxQyxlQUFyQyxDQUFBLHlDQUFBLENBQUEsQ0FBZ0csR0FBQSxDQUFJLFFBQUosQ0FBaEcsQ0FBQSxDQUFWLEVBTFI7U0FKSjs7UUFXSSxrQkFBQSxHQUFxQixJQUFDLENBQUEsZUFBRCxDQUFBO1FBQ3JCLEtBQUEsMkJBQUE7V0FBVTtZQUFFLElBQUEsRUFBTTtVQUFSO1VBQ1IsbURBQThDLENBQUUsY0FBNUIsS0FBb0MsYUFBeEQ7QUFBQSxtQkFBTyxNQUFQOztRQURGO0FBRUEsZUFBTztNQWZNLENBcEhqQjs7O01Bc0lFLE1BQVEsQ0FBQSxDQUFBO1FBQ04sSUFBYyxlQUFkO0FBQUEsaUJBQU8sSUFBQyxDQUFBLEdBQVI7O1FBQ0EsSUFBQyxDQUFBLEVBQUQsR0FBTSxJQUFJLElBQUMsQ0FBQSxXQUFMLENBQWlCLElBQUMsQ0FBQSxHQUFHLENBQUMsT0FBdEIsRUFBK0I7VUFBRSxLQUFBLEVBQU8sSUFBQyxDQUFBO1FBQVYsQ0FBL0I7QUFDTixlQUFPLElBQUMsQ0FBQTtNQUhGLENBdElWOzs7TUE0SUUsbUJBQXFCLENBQUEsQ0FBQTtBQUFFLFlBQUE7ZUFBQyxJQUFJLEdBQUo7O0FBQVU7VUFBQSxLQUFBLDJFQUFBO2FBQVMsQ0FBRSxJQUFGO3lCQUFUO1VBQUEsQ0FBQTs7cUJBQVY7TUFBSCxDQTVJdkI7OztNQWdKRSxPQUFTLENBQUUsR0FBRixDQUFBO2VBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsR0FBVDtNQUFYLENBaEpYOzs7TUFtSkUsSUFBWSxDQUFFLEdBQUYsRUFBQSxHQUFPLENBQVAsQ0FBQTtlQUFpQixDQUFFLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBVCxDQUFGLENBQWdCLENBQUMsT0FBakIsQ0FBeUIsR0FBQSxDQUF6QjtNQUFqQjs7TUFDWixPQUFZLENBQUUsR0FBRixFQUFBLEdBQU8sQ0FBUCxDQUFBO2VBQWlCLENBQUUsR0FBQSxDQUFFLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLEdBQUEsQ0FBWCxDQUFGLENBQUY7TUFBakI7O01BQ1osU0FBWSxDQUFFLEdBQUYsRUFBQSxHQUFPLENBQVAsQ0FBQTtBQUFnQixZQUFBO29FQUErQjtNQUEvQyxDQXJKZDs7O01Bd0pFLE9BQVMsQ0FBRSxHQUFGLENBQUE7QUFDWCxZQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQTtRQUFJLElBQWMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLENBQWQ7QUFBQSxpQkFBTyxJQUFQOztRQUNBLElBQU8sQ0FBRSxJQUFBLEdBQU8sT0FBQSxDQUFRLEdBQVIsQ0FBVCxDQUFBLEtBQTBCLE1BQWpDO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGtEQUFBLENBQUEsQ0FBcUQsSUFBckQsQ0FBQSxDQUFWLEVBRFI7O0FBRUE7VUFDRSxDQUFBLEdBQUksSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBWixFQUROO1NBRUEsY0FBQTtVQUFNO1VBQ0osTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLG1GQUFBLENBQUEsQ0FBc0YsR0FBQSxDQUFJLEtBQUssQ0FBQyxPQUFWLENBQXRGLENBQUEsYUFBQSxDQUFBLENBQXVILEdBQUEsQ0FBSSxHQUFKLENBQXZILENBQUEsQ0FBVixFQUE0SSxDQUFFLEtBQUYsQ0FBNUksRUFEUjs7UUFFQSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVA7Ozs7Ozs7K0JBQStEO0FBQy9ELGVBQU87TUFUQSxDQXhKWDs7Ozs7TUFzS0UsZUFBaUIsQ0FBRSxHQUFGLENBQUE7QUFDbkIsWUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLFFBQVosQ0FBRixDQUFBLEtBQThCLFVBQWpDO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsd0NBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLEtBRkYsRUFHRSxVQUhGLEVBSUUsYUFKRixFQUtFLE9BTEYsQ0FBQSxHQUtzQixDQUFFLEdBQUEsU0FBUyxDQUFDLG1CQUFaLEVBQW9DLEdBQUEsR0FBcEMsQ0FMdEI7UUFNQSxJQUFHLENBQUUsQ0FBSSxTQUFOLENBQUEsSUFBc0IsQ0FBRSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLElBQXJCLENBQUYsQ0FBekI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksSUFBSixDQUFoRCxDQUFBLDBCQUFBLENBQVYsRUFEUjs7QUFFQSxlQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsUUFBSixDQUFhLElBQWIsRUFBbUIsQ0FBRSxhQUFGLEVBQWlCLE9BQWpCLEVBQTBCLFVBQTFCLENBQW5CLEVBQTRELEtBQTVEO01BWFEsQ0F0S25COzs7TUFvTEUseUJBQTJCLENBQUUsR0FBRixDQUFBO0FBQzdCLFlBQUEsYUFBQSxFQUFBLFVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLFNBQVosQ0FBRixDQUFBLEtBQStCLFVBQWxDO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsa0RBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLEtBRkYsRUFHRSxJQUhGLEVBSUUsTUFKRixFQUtFLFVBTEYsRUFNRSxhQU5GLEVBT0UsT0FQRixDQUFBLEdBT3NCLENBQUUsR0FBQSxTQUFTLENBQUMsNkJBQVosRUFBOEMsR0FBQSxHQUE5QyxDQVB0QjtRQVFBLElBQUcsQ0FBRSxDQUFJLFNBQU4sQ0FBQSxJQUFzQixDQUFFLElBQUMsQ0FBQSxlQUFlLENBQUMsR0FBakIsQ0FBcUIsSUFBckIsQ0FBRixDQUF6QjtVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSw2Q0FBQSxDQUFBLENBQWdELEdBQUEsQ0FBSSxJQUFKLENBQWhELENBQUEsMEJBQUEsQ0FBVixFQURSOztBQUVBLGVBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxTQUFKLENBQWMsSUFBZCxFQUFvQixDQUFFLEtBQUYsRUFBUyxJQUFULEVBQWUsTUFBZixFQUF1QixhQUF2QixFQUFzQyxPQUF0QyxFQUErQyxVQUEvQyxDQUFwQjtNQWJrQixDQXBMN0I7OztNQW9NRSxzQkFBd0IsQ0FBRSxHQUFGLENBQUE7QUFDMUIsWUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLFNBQVosQ0FBRixDQUFBLEtBQStCLFVBQWxDO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsK0NBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLEtBRkYsRUFHRSxJQUhGLEVBSUUsT0FKRixFQUtFLE1BTEYsRUFNRSxVQU5GLEVBT0UsYUFQRixFQVFFLE9BUkYsQ0FBQSxHQVFzQixDQUFFLEdBQUEsU0FBUyxDQUFDLDBCQUFaLEVBQTJDLEdBQUEsR0FBM0MsQ0FSdEI7UUFTQSxJQUFHLENBQUUsQ0FBSSxTQUFOLENBQUEsSUFBc0IsQ0FBRSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLElBQXJCLENBQUYsQ0FBekI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksSUFBSixDQUFoRCxDQUFBLDBCQUFBLENBQVYsRUFEUjs7QUFFQSxlQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsU0FBSixDQUFjLElBQWQsRUFBb0IsQ0FBRSxLQUFGLEVBQVMsSUFBVCxFQUFlLE9BQWYsRUFBd0IsTUFBeEIsRUFBZ0MsYUFBaEMsRUFBK0MsT0FBL0MsRUFBd0QsVUFBeEQsQ0FBcEI7TUFkZSxDQXBNMUI7OztNQXFORSxxQkFBdUIsQ0FBRSxHQUFGLENBQUE7QUFDekIsWUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLFVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxJQUFBLEVBQUE7UUFBSSxJQUFHLENBQUUsT0FBQSxDQUFRLElBQUMsQ0FBQSxFQUFFLENBQUMsS0FBWixDQUFGLENBQUEsS0FBMkIsVUFBOUI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkJBQUEsQ0FBQSxDQUFnQyxHQUFBLENBQUksSUFBQyxDQUFBLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBcEIsQ0FBaEMsQ0FBQSxxREFBQSxDQUFWLEVBRFI7O1FBRUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxTQURGLEVBRUUsVUFGRixFQUdFLE9BSEYsRUFJRSxJQUpGLEVBS0UsVUFMRixFQU1FLGFBTkYsRUFPRSxPQVBGLENBQUEsR0FPc0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQyx5QkFBWixFQUEwQyxHQUFBLEdBQTFDLENBUHRCO1FBUUEsSUFBRyxDQUFFLENBQUksU0FBTixDQUFBLElBQXNCLENBQUUsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixJQUFyQixDQUFGLENBQXpCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZDQUFBLENBQUEsQ0FBZ0QsR0FBQSxDQUFJLElBQUosQ0FBaEQsQ0FBQSwwQkFBQSxDQUFWLEVBRFI7O0FBRUEsZUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUosQ0FBVSxJQUFWLEVBQWdCLENBQUUsVUFBRixFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsYUFBN0IsRUFBNEMsT0FBNUMsRUFBcUQsVUFBckQsQ0FBaEI7TUFiYyxDQXJOekI7OztNQXFPRSxvQkFBc0IsQ0FBRSxHQUFGLENBQUE7QUFDeEIsWUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQVosQ0FBRixDQUFBLEtBQTJCLFVBQTlCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsNkNBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLE1BRkYsQ0FBQSxHQUVnQixDQUFFLEdBQUEsU0FBUyxDQUFDLHdCQUFaLEVBQXlDLEdBQUEsR0FBekMsQ0FGaEI7UUFHQSxJQUFHLENBQUUsQ0FBSSxTQUFOLENBQUEsSUFBc0IsQ0FBRSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLElBQXJCLENBQUYsQ0FBekI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksSUFBSixDQUFoRCxDQUFBLDBCQUFBLENBQVYsRUFEUjs7QUFFQSxlQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsS0FBSixDQUFVLElBQVYsRUFBZ0IsTUFBaEI7TUFSYSxDQXJPeEI7Ozs7Ozs7Ozs7Ozs7Ozs7O01BOFBFLCtCQUFpQyxDQUFBLENBQUE7QUFDbkMsWUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQTtRQUFJLEtBQUEsR0FBYyxJQUFDLENBQUE7UUFDZixVQUFBLEdBQ0U7VUFBQSxLQUFBLEVBQXNCLEVBQXRCO1VBQ0EsVUFBQSxFQUFzQixDQUFBLENBRHRCO1VBRUEsU0FBQSxFQUFzQixDQUFBLENBRnRCO1VBR0EsbUJBQUEsRUFBc0IsQ0FBQSxDQUh0QjtVQUlBLGdCQUFBLEVBQXNCLENBQUEsQ0FKdEI7VUFLQSxlQUFBLEVBQXNCLENBQUEsQ0FMdEI7VUFNQSxjQUFBLEVBQXNCLENBQUEsQ0FOdEI7VUFPQSxPQUFBLEVBQXNCLENBQUE7UUFQdEI7QUFRRjtRQUFBLEtBQUEsc0NBQUE7O0FBQ0U7VUFBQSxLQUFBLHdDQUFBOztZQUFBLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBakIsQ0FBZ0MsSUFBaEM7VUFBQTtBQUNBO1VBQUEsS0FBQSxXQUFBOztZQUFBLFVBQVUsQ0FBQyxVQUFVLENBQVcsR0FBWCxDQUFyQixHQUF3QztVQUF4QztBQUNBO1VBQUEsS0FBQSxXQUFBOztZQUFBLFVBQVUsQ0FBQyxTQUFTLENBQVksR0FBWixDQUFwQixHQUF3QztVQUF4QztBQUNBO1VBQUEsS0FBQSxXQUFBOztZQUFBLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBRSxHQUFGLENBQTlCLEdBQXdDO1VBQXhDO0FBQ0E7VUFBQSxLQUFBLFlBQUE7O1lBQUEsVUFBVSxDQUFDLGdCQUFnQixDQUFLLEdBQUwsQ0FBM0IsR0FBd0M7VUFBeEM7QUFDQTtVQUFBLEtBQUEsWUFBQTs7WUFBQSxVQUFVLENBQUMsZUFBZSxDQUFNLEdBQU4sQ0FBMUIsR0FBd0M7VUFBeEM7QUFDQTtVQUFBLEtBQUEsWUFBQTs7WUFBQSxVQUFVLENBQUMsY0FBYyxDQUFPLEdBQVAsQ0FBekIsR0FBd0M7VUFBeEM7QUFDQTtVQUFBLEtBQUEsWUFBQTs7WUFBQSxVQUFVLENBQUMsT0FBTyxDQUFjLEdBQWQsQ0FBbEIsR0FBd0M7VUFBeEM7UUFSRjtBQVNBLGVBQU87TUFwQndCOztJQWhRbkM7OztJQUdFLEtBQUMsQ0FBQSxTQUFELEdBQWtCLENBQUE7O0lBQ2xCLEtBQUMsQ0FBQSxVQUFELEdBQWtCLENBQUE7O0lBQ2xCLEtBQUMsQ0FBQSxLQUFELEdBQWtCOztJQUNsQixLQUFDLENBQUEsT0FBRCxHQUFrQjs7b0JBT2xCLFlBQUEsR0FBYyxHQUFBLENBQUk7TUFBRSxRQUFBLEVBQVUsU0FBUyxDQUFDO0lBQXRCLENBQUosRUFBd0MsUUFBQSxDQUFFLE9BQUYsRUFBVyxHQUFYLENBQUE7QUFDeEQsVUFBQSxLQUFBLEVBQUEsZUFBQSxFQUFBO01BQUksS0FBQSxDQUFNLGFBQU4sRUFBcUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFsQyxFQUF3QyxPQUF4QyxFQUFpRCxHQUFHLENBQUMsSUFBckQ7TUFDQSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsVUFBdkIsRUFESjs7O1FBR0ksVUFBNEI7T0FIaEM7O01BS0ksS0FBQSxHQUE0QixJQUFDLENBQUE7TUFDN0IsSUFBQSxDQUFLLElBQUwsRUFBUSxJQUFSLEVBQStCLGdCQUFILEdBQWtCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBM0IsR0FBbUMsSUFBSSxVQUFKLENBQWUsT0FBZixDQUEvRCxFQU5KOzs7Ozs7TUFZSSxJQUFDLENBQUEsR0FBRCxHQUE0QixNQUFBLENBQU8sQ0FBRSxHQUFBLFNBQVMsQ0FBQyxTQUFaLEVBQTBCLE9BQTFCLEVBQW1DLEdBQUEsR0FBbkMsQ0FBUDtNQUM1QixJQUFBLENBQUssSUFBTCxFQUFRLFlBQVIsRUFBNEIsQ0FBQSxDQUE1QjtNQUNBLElBQUEsQ0FBSyxJQUFMLEVBQVEsSUFBUixFQUE0QixJQUE1QjtNQUNBLElBQUEsQ0FBSyxJQUFMLEVBQVEsa0JBQVIsRUFBNEIsQ0FBRSxJQUFDLENBQUEsRUFBRSxDQUFDLE9BQUosQ0FBWSxHQUFHLENBQUEsU0FBQSxDQUFmLENBQUYsQ0FBOEIsQ0FBQyxXQUEzRDtNQUNBLElBQUEsQ0FBSyxJQUFMLEVBQVEsT0FBUiw2REFBNkM7UUFBRSxPQUFBLEVBQVM7TUFBWCxDQUE3QyxFQWhCSjs7TUFrQkksSUFBTyxnQkFBUDtRQUNFLEtBQUEsQ0FBTSxhQUFOLEVBQXFCLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBbEMsRUFBd0MsY0FBeEM7UUFDQSxJQUFDLENBQUEsb0JBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFGTjs7UUFJTSxlQUFBLEdBQWtCO1VBQUUsYUFBQSxFQUFlLElBQWpCO1VBQXVCLE9BQUEsRUFBUztRQUFoQztRQUNsQixJQUFDLENBQUEsWUFBRCxDQUFBLEVBTE47Ozs7O1FBVU0sSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFJLElBQUMsQ0FBQTtRQUNqQixJQUFDLENBQUEsS0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFiRjs7QUFjQSxhQUFPO0lBakM2QyxDQUF4Qzs7O0lBbUdkLFVBQUEsQ0FBVyxLQUFDLENBQUEsU0FBWixFQUFnQixPQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTthQUFHLE1BQU0sQ0FBQyxjQUFQLENBQXNCLElBQUMsQ0FBQSxXQUF2QjtJQUFILENBQXBDOztJQUNBLFVBQUEsQ0FBVyxLQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxhQUFELENBQUE7SUFBSCxDQUFwQzs7SUFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLFNBQVosRUFBZ0IsaUJBQWhCLEVBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFBSCxDQUFwQzs7SUFDQSxVQUFBLENBQVcsS0FBQyxDQUFBLFNBQVosRUFBZ0IsR0FBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7YUFBRyxJQUFDLENBQUEsTUFBRCxDQUFBO0lBQUgsQ0FBcEM7Ozs7Z0JBeFdGOzs7RUE0Z0JBLGtCQUFBLEdBQXFCLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FDL0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsQ0FBQSxDQUF0QixDQUQrQixFQUUvQixNQUFNLENBQUMsY0FBUCxDQUFzQixNQUF0QixDQUYrQixFQUdqQyx3QkFIaUMsRUFJakMsS0FKaUMsQ0FBZCxFQTVnQnJCOzs7RUFxaEJBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2YsS0FEZTtJQUVmLEdBRmU7SUFHZixHQUhlO0lBSWYsR0FKZTtJQUtmLEdBTGU7SUFNZixHQU5lO0lBT2YsSUFQZTtJQVFmLEtBUmU7SUFTZixPQVRlO0lBVWYsU0FWZTtJQVdmLFlBWGU7SUFZZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLGtCQUZnQixFQUdoQixPQUhnQixFQUloQixrQkFKZ0IsRUFLaEIsU0FMZ0IsQ0FBUDtFQVpJO0FBcmhCakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4jIERiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSAoIHJlcXVpcmUgJ25vZGU6c3FsaXRlJyApLkRhdGFiYXNlU3luY1xuRGJfYWRhcHRlciAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JldHRlci1zcWxpdGUzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG57IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxueyBsZXRzLFxuICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sZXRzZnJlZXpldGhhdC1pbmZyYS5icmljcycgKS5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG57IGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLFxuICBnZXRfcHJvdG90eXBlX2NoYWluLCAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGRicmljX2NmZzpcbiAgICBkYl9wYXRoOiAgICAgICAgJzptZW1vcnk6J1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHk6ICggeCApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18yJywgdHlwZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggZGVsdGEgPSB4Lmxlbmd0aCAtICggbmV3IFNldCB4ICkuc2l6ZSApIGlzIDBcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3VuaXF1ZV9saXN0X2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzMnLCBkZWx0YVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggaWR4X29mX21lID0geC5pbmRleE9mICdtZScgKSA+ICggaWR4X29mX3Byb3RvdHlwZXMgPSB4LmluZGV4T2YgJ3Byb3RvdHlwZXMnIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX21lX2JlZm9yZV9wcm90b3R5cGVzX2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzQnLCBpZHhfb2ZfbWUsIGlkeF9vZl9wcm90b3R5cGVzXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZWxlbWVudCwgZWxlbWVudF9pZHggaW4geFxuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAnbWUnXG4gICAgICBjb250aW51ZSBpZiBlbGVtZW50IGlzICdwcm90b3R5cGVzJ1xuICAgICAgdW5sZXNzIGVsZW1lbnQ/XG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX29iamVjdF9vcl9wbGFjZWhvbGRlcl9mb3JfcGx1Z2luICfOqWRicmljbV9fXzUnLCBlbGVtZW50X2lkeFxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIGVsZW1lbnQsICdleHBvcnRzJ1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfd2l0aF9leHBvcnRzX2Zvcl9wbHVnaW4gJ86pZGJyaWNtX19fNicsIGVsZW1lbnRfaWR4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4geFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9hY3F1aXNpdGlvbl9jaGFpbjogLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gW11cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHByb3RvdHlwZXMgID0gZ2V0X3Byb3RvdHlwZV9jaGFpbiBjbGFzelxuICAgIHByb3RvdHlwZXMgID0gKCBwIGZvciBwIGluIHByb3RvdHlwZXMgd2hlbiAoIHAgaXNudCBjbGFzeiApIGFuZCBwIG5vdCBpbiBpZ25vcmVkX3Byb3RvdHlwZXMgKS5yZXZlcnNlKClcbiAgICBwbHVnaW5zICAgICA9IGNsYXN6LnBsdWdpbnMgPyBbXVxuICAgIHBsdWdpbnMudW5zaGlmdCAncHJvdG90eXBlcycgIHVubGVzcyAncHJvdG90eXBlcycgaW4gcGx1Z2luc1xuICAgIHBsdWdpbnMucHVzaCAgICAnbWUnICAgICAgICAgIHVubGVzcyAnbWUnICAgICAgICAgaW4gcGx1Z2luc1xuICAgIEBfdmFsaWRhdGVfcGx1Z2luc19wcm9wZXJ0eSBwbHVnaW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZW50cnkgaW4gcGx1Z2luc1xuICAgICAgc3dpdGNoIGVudHJ5XG4gICAgICAgIHdoZW4gJ21lJ1xuICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCB2YWx1ZTogY2xhc3osIH1cbiAgICAgICAgd2hlbiAncHJvdG90eXBlcydcbiAgICAgICAgICBmb3IgcHJvdG90eXBlIGluIHByb3RvdHlwZXNcbiAgICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCB2YWx1ZTogcHJvdG90eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncGx1Z2luJywgdmFsdWU6IGVudHJ5LCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fNycsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gc3dpdGNoIHByb3BlcnR5X3R5cGVcbiAgICAgIHdoZW4gJ2xpc3QnIHRoZW4gW11cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4ge31cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgJ86pZGJyaWNtX19fOCcsIFwidW5rbm93biBwcm9wZXJ0eV90eXBlICN7cnByIHByb3BlcnR5X3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYW5kaWRhdGVzIGluIGNhbmRpZGF0ZXNfbGlzdFxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGNhbmRpZGF0ZXMgKSBpcyBwcm9wZXJ0eV90eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOSBleHBlY3RlZCBhbiBvcHRpb25hbCAje3Byb3BlcnR5X3R5cGV9IGZvciAje2NsYXN6Lm5hbWV9LiN7cHJvcGVydHlfbmFtZX0sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBwcm9wZXJ0eV90eXBlIGlzICdsaXN0J1xuICAgICAgICBmb3IgY2FuZGlkYXRlIGluIGNhbmRpZGF0ZXNcbiAgICAgICAgICBSLnB1c2ggc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgICAgZWxzZVxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzXG4gICAgICAgICAgaWYgUmVmbGVjdC5oYXMgUiwgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX25hbWVkX3N0YXRlbWVudF9leGlzdHMgJ86pZGJyaWNtX18xMCcsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgUlsgc3RhdGVtZW50X25hbWUgXSA9IHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGRiX29iamVjdHMgICAgICAgICAgICA9IHt9XG4gICAgc3RhdGVtZW50X2NvdW50ICAgICAgID0gMFxuICAgIGVycm9yX2NvdW50ICAgICAgICAgICA9IDBcbiAgICBidWlsZF9zdGF0ZW1lbnRzICAgICAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnYnVpbGQnLCAnbGlzdCdcbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICBpZiAoIG1hdGNoID0gYnVpbGRfc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSB1bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBidWlsZF9zdGF0ZW1lbnR9XCJcbiAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBzdGF0ZW1lbnRzICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdzdGF0ZW1lbnRzJywgJ3BvZCdcbiAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWMgZXh0ZW5kcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBmdW5jdGlvbnM6ICAgICAgIHt9XG4gIEBzdGF0ZW1lbnRzOiAgICAgIHt9XG4gIEBidWlsZDogICAgICAgICAgIG51bGxcbiAgQHBsdWdpbnM6ICAgICAgICAgbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIE5PVEUgdGhpcyB1bnVzdWFsIGFycmFuZ2VtZW50IGlzIHNvbGVseSB0aGVyZSBzbyB3ZSBjYW4gY2FsbCBgc3VwZXIoKWAgZnJvbSBhbiBpbnN0YW5jZSBtZXRob2QgIyMjXG4gIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgIHN1cGVyKClcbiAgICByZXR1cm4gQF9jb25zdHJ1Y3RvciBQLi4uXG4gIF9jb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5kYnJpY19jZmcsIH0sICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBkZWJ1ZyAnzqlkYnJpY21fXzExJywgQGNvbnN0cnVjdG9yLm5hbWUsICdob3N0OicsIGNmZy5ob3N0XG4gICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBpZiBjZmcuaG9zdD8gdGhlbiBjZmcuaG9zdC5kYiBlbHNlIG5ldyBEYl9hZGFwdGVyIGRiX3BhdGhcbiAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBmb3IgcGx1Z2luX25hbWUsIHBsdWdpbl9jbGFzcyBvZiBjbGFzei5wbHVnaW5zID8ge31cbiAgICAjICAgZGVidWcgJ86pZGJyaWNtX18xMicsIHBsdWdpbl9uYW1lLCBwbHVnaW5fY2xhc3NcbiAgICAjICAgQFsgcGx1Z2luX25hbWUgXSA9IG5ldyBwbHVnaW5fY2xhc3MgeyBjZmcuLi4sIGhvc3Q6IEAsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyB0ZW1wbGF0ZXMuZGJyaWNfY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzIGNmZy5ob3N0P1xuICAgICAgZGVidWcgJ86pZGJyaWNtX18xMycsIEBjb25zdHJ1Y3Rvci5uYW1lLCBcImluaXRpYWxpemluZ1wiXG4gICAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICBAYnVpbGQoKVxuICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpbml0aWFsaXplOiAtPlxuICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE0IG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICBSID0ge31cbiAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVhcmRvd246IC0+XG4gICAgY291bnQgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGNvdW50KytcbiAgICAgIHRyeVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7SUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljbV9fMTUgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICByZWJ1aWxkOiAtPlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGJ1aWxkX3N0YXRlbWVudHMgICAgICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdidWlsZCcsICdsaXN0J1xuICAgIEB0ZWFyZG93bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICMgZGVidWcgJ86pZGJyaWNtX18xNicsIHJwciBidWlsZF9zdGF0ZW1lbnRcbiAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgc2V0X2dldHRlciBAOjosICd3JywgICAgICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgIHsgZXJyb3JfY291bnQsXG4gICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTcgI3tlcnJvcl9jb3VudH0gb3V0IG9mICN7c3RhdGVtZW50X2NvdW50fSBidWlsZCBzdGF0ZW1lbnQocykgY291bGQgbm90IGJlIHBhcnNlZDogI3tycHIgbWVzc2FnZXN9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfdzogLT5cbiAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aCwgeyBzdGF0ZTogQHN0YXRlLCB9XG4gICAgcmV0dXJuIEBfd1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9mdW5jdGlvbl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogICAgICAgKCBzcWwsIFAuLi4gKSAtPiAoIEBwcmVwYXJlIHNxbCApLml0ZXJhdGUgUC4uLlxuICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE4IGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdHJ5XG4gICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgY2F0Y2ggY2F1c2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOSB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgRlVOQ1RJT05TXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIHZhbHVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIzIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjQgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgc3RhcnQsXG4gICAgICBzdGVwLFxuICAgICAgaW52ZXJzZSxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjYgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI3IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yOCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI5IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyNcblxuICBvb29vb29vb28uICAgb29vbyAgICAgICAgICAgICAgICAgICAgICAgICAgbzhvXG4gIGA4ODggICBgWTg4LiBgODg4ICAgICAgICAgICAgICAgICAgICAgICAgICBgXCInXG4gICA4ODggICAuZDg4JyAgODg4ICBvb29vICBvb29vICAgLm9vb29vb29vIG9vb28gIG9vby4gLm9vLiAgICAub29vby5vXG4gICA4ODhvb284OFAnICAgODg4ICBgODg4ICBgODg4ICA4ODgnIGA4OGIgIGA4ODggIGA4ODhQXCJZODhiICBkODgoICBcIjhcbiAgIDg4OCAgICAgICAgICA4ODggICA4ODggICA4ODggIDg4OCAgIDg4OCAgIDg4OCAgIDg4OCAgIDg4OCAgYFwiWTg4Yi5cbiAgIDg4OCAgICAgICAgICA4ODggICA4ODggICA4ODggIGA4OGJvZDhQJyAgIDg4OCAgIDg4OCAgIDg4OCAgby4gICk4OGJcbiAgbzg4OG8gICAgICAgIG84ODhvICBgVjg4VlwiVjhQJyBgOG9vb29vby4gIG84ODhvIG84ODhvIG84ODhvIDhcIlwiODg4UCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRcIiAgICAgWURcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiWTg4ODg4UCdcblxuICAjIyNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY29sbGVjdF9kYnJpY19jbGFzc19wcm9wZXJ0aWVzOiAtPlxuICAgIGNsYXN6ICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY29sbGVjdG9ycyAgPVxuICAgICAgYnVpbGQ6ICAgICAgICAgICAgICAgIFtdXG4gICAgICBzdGF0ZW1lbnRzOiAgICAgICAgICAge31cbiAgICAgIGZ1bmN0aW9uczogICAgICAgICAgICB7fVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uczogIHt9XG4gICAgICB3aW5kb3dfZnVuY3Rpb25zOiAgICAge31cbiAgICAgIHRhYmxlX2Z1bmN0aW9uczogICAgICB7fVxuICAgICAgdmlydHVhbF90YWJsZXM6ICAgICAgIHt9XG4gICAgICBleHBvcnRzOiAgICAgICAgICAgICAge31cbiAgICBmb3IgcGx1Z2luIGluICggY2xhc3oucGx1Z2lucyA/IFtdIClcbiAgICAgIGNvbGxlY3RvcnMuYnVpbGQucHVzaCAgICAgICAgICAgaXRlbSAgICAgICAgICBmb3IgaXRlbSAgICAgICAgaW4gKCBwbHVnaW4uYnVpbGQgICAgICAgICAgICAgICA/IFtdIClcbiAgICAgIGNvbGxlY3RvcnMuc3RhdGVtZW50c1sgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4uc3RhdGVtZW50cyAgICAgICAgICA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMuZnVuY3Rpb25zWyAgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4uZnVuY3Rpb25zICAgICAgICAgICA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMuYWdncmVnYXRlX2Z1bmN0aW9uc1sga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4uYWdncmVnYXRlX2Z1bmN0aW9ucyA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMud2luZG93X2Z1bmN0aW9uc1sgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4ud2luZG93X2Z1bmN0aW9ucyAgICA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMudGFibGVfZnVuY3Rpb25zWyAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4udGFibGVfZnVuY3Rpb25zICAgICA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMudmlydHVhbF90YWJsZXNbICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4udmlydHVhbF90YWJsZXMgICAgICA/IHt9IClcbiAgICAgIGNvbGxlY3RvcnMuZXhwb3J0c1sgICAgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBwbHVnaW4uZXhwb3J0cyAgICAgICAgICAgICA/IHt9IClcbiAgICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmlnbm9yZWRfcHJvdG90eXBlcyA9IE9iamVjdC5mcmVlemUgW1xuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fSApLFxuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBPYmplY3QgKSxcbiAgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyLFxuICBEYnJpYyxcbiAgXVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICBpZ25vcmVkX3Byb3RvdHlwZXMsXG4gICAgdHlwZV9vZixcbiAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgdGVtcGxhdGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
