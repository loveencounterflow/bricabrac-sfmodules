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

    /*
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    ÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆÆ
    */
    //---------------------------------------------------------------------------------------------------------
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
              contributor: clasz
            });
            break;
          case 'prototypes':
            for (j = 0, len1 = prototypes.length; j < len1; j++) {
              prototype = prototypes[j];
              R.push({
                type: 'prototype',
                contributor: prototype
              });
            }
            break;
          default:
            R.push({
              type: 'plugin',
              contributor: entry
            });
        }
      }
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _collect_contributor_properties() {
      var R, acquisition_chain, clasz, contributor, i, item, j, key, len, len1, property_name, ref, ref1, ref2, ref3, source, target, type, value;
      clasz = this.constructor;
      acquisition_chain = this._get_acquisition_chain();
      //.......................................................................................................
      R = {
        build: [],
        statements: {},
        functions: {},
        aggregate_functions: {},
        window_functions: {},
        table_functions: {},
        virtual_tables: {},
        methods: {}
      };
//.......................................................................................................
      for (i = 0, len = acquisition_chain.length; i < len; i++) {
        ({type, contributor} = acquisition_chain[i]);
        ref1 = (ref = contributor.build) != null ? ref : [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          item = ref1[j];
          R.build.push(item);
        }
        source = type === 'plugin' ? contributor.exports : contributor;
        for (property_name in R) {
          target = R[property_name];
          if ((type !== 'plugin') && (property_name === 'methods')) {
            continue;
          }
          ref3 = (ref2 = source[property_name]) != null ? ref2 : {};
          for (key in ref3) {
            value = ref3[key];
            /* TAINT make overwriting behavior configurable */
            target[key] = value;
          }
        }
      }
      // R.statements[          key ] = value for key, value  of ( contributor.statements          ? {} )
      // R.functions[           key ] = value for key, value  of ( contributor.functions           ? {} )
      // R.aggregate_functions[ key ] = value for key, value  of ( contributor.aggregate_functions ? {} )
      // R.window_functions[    key ] = value for key, value  of ( contributor.window_functions    ? {} )
      // R.table_functions[     key ] = value for key, value  of ( contributor.table_functions     ? {} )
      // R.virtual_tables[      key ] = value for key, value  of ( contributor.virtual_tables      ? {} )
      // R.exports[             key ] = value for key, value  of ( contributor.exports             ? {} )
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _apply_contributions() {
      var clasz, contributions;
      clasz = this.constructor;
      contributions = this._collect_contributor_properties();
      // debug 'Ωdbricm___1', clasz.name, clasz.build
      // for statement in contributions.build
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBO0lBQUEsb0JBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFB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QUFvQyxRQUFBLENBQUEsQ0FBQTthQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBQUgsQ0FBcEM7O0lBQ0EsVUFBQSxDQUFXLEtBQUMsQ0FBQSxTQUFaLEVBQWdCLEdBQWhCLEVBQW9DLFFBQUEsQ0FBQSxDQUFBO2FBQUcsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUFILENBQXBDOzs7O2dCQXRaRjs7O0VBc2hCQSxrQkFBQSxHQUFxQixNQUFNLENBQUMsTUFBUCxDQUFjLENBQy9CLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQUEsQ0FBdEIsQ0FEK0IsRUFFL0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBdEIsQ0FGK0IsRUFHakMsd0JBSGlDLEVBSWpDLEtBSmlDLENBQWQsRUF0aEJyQjs7O0VBK2hCQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLEtBRGU7SUFFZixHQUZlO0lBR2YsR0FIZTtJQUlmLEdBSmU7SUFLZixHQUxlO0lBTWYsR0FOZTtJQU9mLElBUGU7SUFRZixLQVJlO0lBU2YsT0FUZTtJQVVmLFNBVmU7SUFXZixZQVhlO0lBWWYsU0FBQSxFQUFXLE1BQUEsQ0FBTyxDQUNoQixDQURnQixFQUVoQixrQkFGZ0IsRUFHaEIsT0FIZ0IsRUFJaEIsa0JBSmdCLEVBS2hCLFNBTGdCLENBQVA7RUFaSTtBQS9oQmpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuIyBEYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICdub2RlOnNxbGl0ZScgKS5EYXRhYmFzZVN5bmNcbkRiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdiZXR0ZXItc3FsaXRlMydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbGV0c2ZyZWV6ZXRoYXQtaW5mcmEuYnJpY3MnICkucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgICAgICAgIH0gPSByZXF1aXJlICcuL3Byb3RvdHlwZS10b29scydcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGRicmljX2NmZzpcbiAgICBkYl9wYXRoOiAgICAgICAgJzptZW1vcnk6J1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fNicsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gc3dpdGNoIHByb3BlcnR5X3R5cGVcbiAgICAgIHdoZW4gJ2xpc3QnIHRoZW4gW11cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4ge31cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgJ86pZGJyaWNtX19fNycsIFwidW5rbm93biBwcm9wZXJ0eV90eXBlICN7cnByIHByb3BlcnR5X3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYW5kaWRhdGVzIGluIGNhbmRpZGF0ZXNfbGlzdFxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGNhbmRpZGF0ZXMgKSBpcyBwcm9wZXJ0eV90eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCAje3Byb3BlcnR5X3R5cGV9IGZvciAje2NsYXN6Lm5hbWV9LiN7cHJvcGVydHlfbmFtZX0sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBwcm9wZXJ0eV90eXBlIGlzICdsaXN0J1xuICAgICAgICBmb3IgY2FuZGlkYXRlIGluIGNhbmRpZGF0ZXNcbiAgICAgICAgICBSLnB1c2ggc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgICAgZWxzZVxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzXG4gICAgICAgICAgaWYgUmVmbGVjdC5oYXMgUiwgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX25hbWVkX3N0YXRlbWVudF9leGlzdHMgJ86pZGJyaWNtX19fOScsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgUlsgc3RhdGVtZW50X25hbWUgXSA9IHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGRiX29iamVjdHMgICAgICAgICAgICA9IHt9XG4gICAgc3RhdGVtZW50X2NvdW50ICAgICAgID0gMFxuICAgIGVycm9yX2NvdW50ICAgICAgICAgICA9IDBcbiAgICBidWlsZF9zdGF0ZW1lbnRzICAgICAgPSBAX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbiAnYnVpbGQnLCAnbGlzdCdcbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICBpZiAoIG1hdGNoID0gYnVpbGRfc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSB1bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBidWlsZF9zdGF0ZW1lbnR9XCJcbiAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBzdGF0ZW1lbnRzICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdzdGF0ZW1lbnRzJywgJ3BvZCdcbiAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG4gICMjI1xuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICAjIyNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIF92YWxpZGF0ZV9wbHVnaW5zX3Byb3BlcnR5OiAoIHggKSAtPlxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX2xpc3RfZm9yX3BsdWdpbnMgJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGRlbHRhID0geC5sZW5ndGggLSAoIG5ldyBTZXQgeCApLnNpemUgKSBpcyAwXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF91bmlxdWVfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18yJywgZGVsdGFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGlkeF9vZl9tZSA9IHguaW5kZXhPZiAnbWUnICkgPiAoIGlkeF9vZl9wcm90b3R5cGVzID0geC5pbmRleE9mICdwcm90b3R5cGVzJyApXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9tZV9iZWZvcmVfcHJvdG90eXBlc19mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18zJywgaWR4X29mX21lLCBpZHhfb2ZfcHJvdG90eXBlc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVsZW1lbnQsIGVsZW1lbnRfaWR4IGluIHhcbiAgICAgIGNvbnRpbnVlIGlmIGVsZW1lbnQgaXMgJ21lJ1xuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAncHJvdG90eXBlcydcbiAgICAgIHVubGVzcyBlbGVtZW50P1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfb3JfcGxhY2Vob2xkZXJfZm9yX3BsdWdpbiAnzqlkYnJpY21fX180JywgZWxlbWVudF9pZHhcbiAgICAgIHVubGVzcyBSZWZsZWN0LmhhcyBlbGVtZW50LCAnZXhwb3J0cydcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfb2JqZWN0X3dpdGhfZXhwb3J0c19mb3JfcGx1Z2luICfOqWRicmljbV9fXzUnLCBlbGVtZW50X2lkeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfYWNxdWlzaXRpb25fY2hhaW46IC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICA9IFtdXG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBwcm90b3R5cGVzICA9IGdldF9wcm90b3R5cGVfY2hhaW4gY2xhc3pcbiAgICBwcm90b3R5cGVzICA9ICggcCBmb3IgcCBpbiBwcm90b3R5cGVzIHdoZW4gKCBwIGlzbnQgY2xhc3ogKSBhbmQgcCBub3QgaW4gaWdub3JlZF9wcm90b3R5cGVzICkucmV2ZXJzZSgpXG4gICAgcGx1Z2lucyAgICAgPSBjbGFzei5wbHVnaW5zID8gW11cbiAgICBwbHVnaW5zLnVuc2hpZnQgJ3Byb3RvdHlwZXMnICB1bmxlc3MgJ3Byb3RvdHlwZXMnIGluIHBsdWdpbnNcbiAgICBwbHVnaW5zLnB1c2ggICAgJ21lJyAgICAgICAgICB1bmxlc3MgJ21lJyAgICAgICAgIGluIHBsdWdpbnNcbiAgICBAX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHkgcGx1Z2luc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVudHJ5IGluIHBsdWdpbnNcbiAgICAgIHN3aXRjaCBlbnRyeVxuICAgICAgICB3aGVuICdtZSdcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgY29udHJpYnV0b3I6IGNsYXN6LCB9XG4gICAgICAgIHdoZW4gJ3Byb3RvdHlwZXMnXG4gICAgICAgICAgZm9yIHByb3RvdHlwZSBpbiBwcm90b3R5cGVzXG4gICAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgY29udHJpYnV0b3I6IHByb3RvdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgUi5wdXNoIHsgdHlwZTogJ3BsdWdpbicsIGNvbnRyaWJ1dG9yOiBlbnRyeSwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jb2xsZWN0X2NvbnRyaWJ1dG9yX3Byb3BlcnRpZXM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBhY3F1aXNpdGlvbl9jaGFpbiA9IEBfZ2V0X2FjcXVpc2l0aW9uX2NoYWluKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgICAgID1cbiAgICAgIGJ1aWxkOiAgICAgICAgICAgICAgICBbXVxuICAgICAgc3RhdGVtZW50czogICAgICAgICAgIHt9XG4gICAgICBmdW5jdGlvbnM6ICAgICAgICAgICAge31cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbnM6ICB7fVxuICAgICAgd2luZG93X2Z1bmN0aW9uczogICAgIHt9XG4gICAgICB0YWJsZV9mdW5jdGlvbnM6ICAgICAge31cbiAgICAgIHZpcnR1YWxfdGFibGVzOiAgICAgICB7fVxuICAgICAgbWV0aG9kczogICAgICAgICAgICAgIHt9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgeyB0eXBlLCBjb250cmlidXRvciwgfSBpbiBhY3F1aXNpdGlvbl9jaGFpblxuICAgICAgUi5idWlsZC5wdXNoIGl0ZW0gZm9yIGl0ZW0gaW4gKCBjb250cmlidXRvci5idWlsZCA/IFtdIClcbiAgICAgIHNvdXJjZSA9IGlmIHR5cGUgaXMgJ3BsdWdpbicgdGhlbiBjb250cmlidXRvci5leHBvcnRzIGVsc2UgY29udHJpYnV0b3JcbiAgICAgIGZvciBwcm9wZXJ0eV9uYW1lLCB0YXJnZXQgb2YgUlxuICAgICAgICBjb250aW51ZSBpZiAoIHR5cGUgaXNudCAncGx1Z2luJyApIGFuZCAoIHByb3BlcnR5X25hbWUgaXMgJ21ldGhvZHMnIClcbiAgICAgICAgIyMjIFRBSU5UIG1ha2Ugb3ZlcndyaXRpbmcgYmVoYXZpb3IgY29uZmlndXJhYmxlICMjI1xuICAgICAgICB0YXJnZXRbIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgb2YgKCBzb3VyY2VbIHByb3BlcnR5X25hbWUgXSA/IHt9IClcbiAgICAgICAgIyBSLnN0YXRlbWVudHNbICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3Iuc3RhdGVtZW50cyAgICAgICAgICA/IHt9IClcbiAgICAgICAgIyBSLmZ1bmN0aW9uc1sgICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3IuZnVuY3Rpb25zICAgICAgICAgICA/IHt9IClcbiAgICAgICAgIyBSLmFnZ3JlZ2F0ZV9mdW5jdGlvbnNbIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3IuYWdncmVnYXRlX2Z1bmN0aW9ucyA/IHt9IClcbiAgICAgICAgIyBSLndpbmRvd19mdW5jdGlvbnNbICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3Iud2luZG93X2Z1bmN0aW9ucyAgICA/IHt9IClcbiAgICAgICAgIyBSLnRhYmxlX2Z1bmN0aW9uc1sgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3IudGFibGVfZnVuY3Rpb25zICAgICA/IHt9IClcbiAgICAgICAgIyBSLnZpcnR1YWxfdGFibGVzWyAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3IudmlydHVhbF90YWJsZXMgICAgICA/IHt9IClcbiAgICAgICAgIyBSLmV4cG9ydHNbICAgICAgICAgICAgIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgIG9mICggY29udHJpYnV0b3IuZXhwb3J0cyAgICAgICAgICAgICA/IHt9IClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FwcGx5X2NvbnRyaWJ1dGlvbnM6IC0+XG4gICAgY2xhc3ogICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGNvbnRyaWJ1dGlvbnMgPSBAX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllcygpXG4gICAgIyBkZWJ1ZyAnzqlkYnJpY21fX18xJywgY2xhc3oubmFtZSwgY2xhc3ouYnVpbGRcbiAgICAjIGZvciBzdGF0ZW1lbnQgaW4gY29udHJpYnV0aW9ucy5idWlsZFxuICAgIG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogICAgICAge31cbiAgQHN0YXRlbWVudHM6ICAgICAge31cbiAgQGJ1aWxkOiAgICAgICAgICAgbnVsbFxuICBAcGx1Z2luczogICAgICAgICBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgTk9URSB0aGlzIHVudXN1YWwgYXJyYW5nZW1lbnQgaXMgc29sZWx5IHRoZXJlIHNvIHdlIGNhbiBjYWxsIGBzdXBlcigpYCBmcm9tIGFuIGluc3RhbmNlIG1ldGhvZCAjIyNcbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgaWYgY2ZnLmhvc3Q/IHRoZW4gY2ZnLmhvc3QuZGIgZWxzZSBuZXcgRGJfYWRhcHRlciBkYl9wYXRoXG4gICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgZm9yIHBsdWdpbl9uYW1lLCBwbHVnaW5fY2xhc3Mgb2YgY2xhc3oucGx1Z2lucyA/IHt9XG4gICAgIyAgIGRlYnVnICfOqWRicmljbV9fMTEnLCBwbHVnaW5fbmFtZSwgcGx1Z2luX2NsYXNzXG4gICAgIyAgIEBbIHBsdWdpbl9uYW1lIF0gPSBuZXcgcGx1Z2luX2NsYXNzIHsgY2ZnLi4uLCBob3N0OiBALCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgdGVtcGxhdGVzLmRicmljX2NmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgaGlkZSBALCAnX3cnLCAgICAgICAgICAgICAgIG51bGxcbiAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyBjZmcuaG9zdD9cbiAgICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgICBAaW5pdGlhbGl6ZSgpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyMjIE5PVEUgQSAnZnJlc2gnIERCIGluc3RhbmNlIGlzIGEgREIgdGhhdCBzaG91bGQgYmUgKHJlLSlidWlsdCBhbmQvb3IgKHJlLSlwb3B1bGF0ZWQ7IGluXG4gICAgICBjb250cmFkaXN0aW5jdGlvbiB0byBgRGJyaWM6OmlzX3JlYWR5YCwgYERicmljOjppc19mcmVzaGAgcmV0YWlucyBpdHMgdmFsdWUgZm9yIHRoZSBsaWZldGltZSBvZlxuICAgICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICAgIEBpc19mcmVzaCA9IG5vdCBAaXNfcmVhZHlcbiAgICAgIEBidWlsZCgpXG4gICAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGluaXRpYWxpemU6IC0+XG4gICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZWFyZG93bjogLT5cbiAgICBjb3VudCA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgY291bnQrK1xuICAgICAgdHJ5XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tJRE4gbmFtZX07XCIgKS5ydW4oKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgd2FybiBcIs6pZGJyaWNtX18xNCBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgcmV0dXJuIGNvdW50XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlYnVpbGQ6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgYnVpbGRfc3RhdGVtZW50cyAgICAgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ2J1aWxkJywgJ2xpc3QnXG4gICAgQHRlYXJkb3duKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgIyBkZWJ1ZyAnzqlkYnJpY21fXzE1JywgcnByIGJ1aWxkX3N0YXRlbWVudFxuICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGJ1aWxkX3N0YXRlbWVudHMubGVuZ3RoXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3N1cGVyJywgICAgICAgICAgICAtPiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgQGNvbnN0cnVjdG9yXG4gIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgICAgICAtPiBAX2dldF93KClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgeyBlcnJvcl9jb3VudCxcbiAgICAgIHN0YXRlbWVudF9jb3VudCxcbiAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICBtZXNzYWdlcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICBtZXNzYWdlcy5wdXNoIG1lc3NhZ2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNiAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHJlc2VudF9kYl9vYmplY3RzID0gQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF93OiAtPlxuICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgIEBfdyA9IG5ldyBAY29uc3RydWN0b3IgQGNmZy5kYl9wYXRoLCB7IHN0YXRlOiBAc3RhdGUsIH1cbiAgICByZXR1cm4gQF93XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTcgZXhwZWN0ZWQgYSBzdGF0ZW1lbnQgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB0cnlcbiAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICBjYXRjaCBjYXVzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE4IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBGVU5DVElPTlNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIxIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjIgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMyBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICBpbnZlcnNlLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yNCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yNSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIHJvd3MsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjYgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCB7IHBhcmFtZXRlcnMsIGNvbHVtbnMsIHJvd3MsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI3IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjggYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmlnbm9yZWRfcHJvdG90eXBlcyA9IE9iamVjdC5mcmVlemUgW1xuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fSApLFxuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBPYmplY3QgKSxcbiAgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyLFxuICBEYnJpYyxcbiAgXVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICBpZ25vcmVkX3Byb3RvdHlwZXMsXG4gICAgdHlwZV9vZixcbiAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgdGVtcGxhdGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
