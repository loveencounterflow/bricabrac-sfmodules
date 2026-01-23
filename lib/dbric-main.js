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
      db_path: ':memory:',
      rebuild: false
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
        throw new E.Dbric_expected_list_for_plugins('Ωdbricm___5', type);
      }
      //.......................................................................................................
      if ((delta = x.length - (new Set(x)).size) !== 0) {
        throw new E.Dbric_expected_unique_list_for_plugins('Ωdbricm___6', delta);
      }
      //.......................................................................................................
      if (!((idx_of_me = x.indexOf('me')) > (idx_of_prototypes = x.indexOf('prototypes')))) {
        throw new E.Dbric_expected_me_before_prototypes_for_plugins('Ωdbricm___7', idx_of_me, idx_of_prototypes);
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
          throw new E.Dbric_expected_object_or_placeholder_for_plugin('Ωdbricm___8', element_idx);
        }
        if (!Reflect.has(element, 'exports')) {
          throw new E.Dbric_expected_object_with_exports_for_plugin('Ωdbricm___9', element_idx);
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
        source = type === 'plugin' ? contributor.exports : contributor;
        if (Object.hasOwn(source, 'build')) {
          ref1 = (ref = source.build) != null ? ref : [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            item = ref1[j];
            R.build.push(item);
          }
        }
        for (property_name in R) {
          target = R[property_name];
          if (property_name === 'build') {
            continue;
          }
          if ((property_name === 'methods') && (type !== 'plugin')) {
            continue;
          }
          if (!Object.hasOwn(source, property_name)) {
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
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _apply_contributions() {
      var clasz, contributions;
      clasz = this.constructor;
      contributions = this._collect_contributor_properties();
      //.......................................................................................................
      this._acquire_methods(contributions);
      this._create_udfs(contributions);
      if (this.cfg.rebuild) {
        this._rebuild(contributions);
      }
      this._acquire_statements(contributions);
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _acquire_methods(contributions) {
      var method, method_name, ref;
      ref = contributions.methods;
      for (method_name in ref) {
        method = ref[method_name];
        hide(this, method_name, method);
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _acquire_statements(contributions) {
      var ref, statement, statement_name;
      ref = contributions.statements;
      for (statement_name in ref) {
        statement = ref[statement_name];
        this.statements[statement_name] = this.prepare(statement);
      }
      return null;
    }

    //=========================================================================================================
    // TEARDOWN & REBUILD
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
            warn(`Ωdbricm__10 ignored error: ${error.message}`);
          }
        }
      }
      (this.prepare(SQL`pragma foreign_keys = on;`)).run();
      return count;
    }

    //---------------------------------------------------------------------------------------------------------
    _rebuild(contributions) {
      var build_statement, clasz, i, len, ref;
      clasz = this.constructor;
      this.teardown();
      ref = contributions.build;
      //.......................................................................................................
      for (i = 0, len = ref.length; i < len; i++) {
        build_statement = ref[i];
        (this.prepare(build_statement)).run();
      }
      //.......................................................................................................
      return null;
    }

    //=========================================================================================================
    // UDFs
    //---------------------------------------------------------------------------------------------------------
    _create_udfs(contributions) {
      var category, fn_cfg, i, len, method_name, names_of_callables, property_name, ref, ref1, udf_name;
      names_of_callables = {
        function: ['value'],
        aggregate_function: ['start', 'step', 'result'],
        window_function: ['start', 'step', 'inverse', 'result'],
        table_function: ['rows'],
        virtual_table: ['rows']
      };
      ref = Object.keys(names_of_callables);
      //.......................................................................................................
      for (i = 0, len = ref.length; i < len; i++) {
        category = ref[i];
        property_name = `${category}s`;
        method_name = `_create_${category}`;
        ref1 = contributions[property_name];
        for (udf_name in ref1) {
          fn_cfg = ref1[udf_name];
          fn_cfg = lets(fn_cfg, (d) => {
            var callable, j, len1, name_of_callable, ref2;
            if (d.name == null) {
              d.name = udf_name;
            }
            ref2 = names_of_callables[category];
            //.................................................................................................
            /* bind UDFs to `this` */
            for (j = 0, len1 = ref2.length; j < len1; j++) {
              name_of_callable = ref2[j];
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
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_udf_names() {
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
    _create_function(cfg) {
      var deterministic, directOnly, name, overwrite, value, varargs;
      if ((type_of(this.db.function)) !== 'function') {
        throw new Error(`Ωdbricm__11 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
      }
      ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
      if ((!overwrite) && (this._get_udf_names().has(name))) {
        throw new Error(`Ωdbricm__12 a UDF or built-in function named ${rpr(name)} has already been declared`);
      }
      return this.db.function(name, {deterministic, varargs, directOnly}, value);
    }

    //---------------------------------------------------------------------------------------------------------
    _create_aggregate_function(cfg) {
      var deterministic, directOnly, name, overwrite, result, start, step, varargs;
      if ((type_of(this.db.aggregate)) !== 'function') {
        throw new Error(`Ωdbricm__13 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
      }
      ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
      if ((!overwrite) && (this._get_udf_names().has(name))) {
        throw new Error(`Ωdbricm__14 a UDF or built-in function named ${rpr(name)} has already been declared`);
      }
      return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
    }

    //---------------------------------------------------------------------------------------------------------
    _create_window_function(cfg) {
      var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
      if ((type_of(this.db.aggregate)) !== 'function') {
        throw new Error(`Ωdbricm__15 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
      }
      ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
      if ((!overwrite) && (this._get_udf_names().has(name))) {
        throw new Error(`Ωdbricm__16 a UDF or built-in function named ${rpr(name)} has already been declared`);
      }
      return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
    }

    //---------------------------------------------------------------------------------------------------------
    _create_table_function(cfg) {
      var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
      if ((type_of(this.db.table)) !== 'function') {
        throw new Error(`Ωdbricm__17 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
      }
      ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
      if ((!overwrite) && (this._get_udf_names().has(name))) {
        throw new Error(`Ωdbricm__18 a UDF or built-in function named ${rpr(name)} has already been declared`);
      }
      return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
    }

    //---------------------------------------------------------------------------------------------------------
    _create_virtual_table(cfg) {
      var create, name, overwrite;
      if ((type_of(this.db.table)) !== 'function') {
        throw new Error(`Ωdbricm__19 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
      }
      ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
      if ((!overwrite) && (this._get_udf_names().has(name))) {
        throw new Error(`Ωdbricm__20 a UDF or built-in function named ${rpr(name)} has already been declared`);
      }
      return this.db.table(name, create);
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
          throw new Error(`Ωdbricm__21 expected a statement or a text, got a ${type}`);
        }
        try {
          R = this.db.prepare(sql);
        } catch (error1) {
          cause = error1;
          throw new Error(`Ωdbricm__22 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric.functions = {};

    Dbric.statements = {};

    Dbric.build = null;

    Dbric.plugins = null;

    //---------------------------------------------------------------------------------------------------------
    Dbric.rebuild = nfa({
      template: templates.dbric_cfg
    }, function(db_path, cfg) {
      cfg.rebuild = true;
      return new this(cfg);
    });

    Dbric.prototype._constructor = nfa({
      template: templates.dbric_cfg
    }, function(db_path, cfg) {
      var clasz, ref;
      //.......................................................................................................
      if (db_path == null) {
        db_path = ':memory:';
      }
      //.......................................................................................................
      clasz = this.constructor;
      hide(this, 'db', new Db_adapter(db_path));
      //.......................................................................................................
      this.cfg = freeze({...templates.dbric_cfg, db_path, ...cfg});
      hide(this, 'statements', {});
      hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
      hide(this, 'state', (ref = (cfg != null ? cfg.state : void 0)) != null ? ref : {
        columns: null
      });
      //.......................................................................................................
      this.run_standard_pragmas();
      this._apply_contributions();
      return void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBO0lBQUEsb0JBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFB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QixJQUFBLENBQUssSUFBTCxFQUFRLFlBQVIsRUFBNEIsQ0FBQSxDQUE1QjtNQUNBLElBQUEsQ0FBSyxJQUFMLEVBQVEsa0JBQVIsRUFBNEIsQ0FBRSxJQUFDLENBQUEsRUFBRSxDQUFDLE9BQUosQ0FBWSxHQUFHLENBQUEsU0FBQSxDQUFmLENBQUYsQ0FBOEIsQ0FBQyxXQUEzRDtNQUNBLElBQUEsQ0FBSyxJQUFMLEVBQVEsT0FBUiw2REFBNkM7UUFBRSxPQUFBLEVBQVM7TUFBWCxDQUE3QyxFQVRKOztNQVdJLElBQUMsQ0FBQSxvQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLG9CQUFELENBQUE7QUFDQSxhQUFPO0lBZDZDLENBQXhDOzs7O2dCQTlZaEI7OztFQWljQSxrQkFBQSxHQUFxQixNQUFNLENBQUMsTUFBUCxDQUFjLENBQy9CLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQUEsQ0FBdEIsQ0FEK0IsRUFFL0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBdEIsQ0FGK0IsRUFHakMsd0JBSGlDLEVBSWpDLEtBSmlDLENBQWQsRUFqY3JCOzs7RUEwY0EsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixLQURlO0lBRWYsR0FGZTtJQUdmLEdBSGU7SUFJZixHQUplO0lBS2YsR0FMZTtJQU1mLEdBTmU7SUFPZixJQVBlO0lBUWYsS0FSZTtJQVNmLE9BVGU7SUFVZixTQVZlO0lBV2YsWUFYZTtJQVlmLFNBQUEsRUFBVyxNQUFBLENBQU8sQ0FDaEIsQ0FEZ0IsRUFFaEIsa0JBRmdCLEVBR2hCLE9BSGdCLEVBSWhCLGtCQUpnQixFQUtoQixTQUxnQixDQUFQO0VBWkk7QUExY2pCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuIyBEYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICdub2RlOnNxbGl0ZScgKS5EYXRhYmFzZVN5bmNcbkRiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdiZXR0ZXItc3FsaXRlMydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbGV0c2ZyZWV6ZXRoYXQtaW5mcmEuYnJpY3MnICkucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgICAgICAgIH0gPSByZXF1aXJlICcuL3Byb3RvdHlwZS10b29scydcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGRicmljX2NmZzpcbiAgICBkYl9wYXRoOiAgICAgICAgJzptZW1vcnk6J1xuICAgIHJlYnVpbGQ6ICAgICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gc3dpdGNoIHByb3BlcnR5X3R5cGVcbiAgICAgIHdoZW4gJ2xpc3QnIHRoZW4gW11cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4ge31cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgJ86pZGJyaWNtX19fMicsIFwidW5rbm93biBwcm9wZXJ0eV90eXBlICN7cnByIHByb3BlcnR5X3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYW5kaWRhdGVzIGluIGNhbmRpZGF0ZXNfbGlzdFxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGNhbmRpZGF0ZXMgKSBpcyBwcm9wZXJ0eV90eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fMyBleHBlY3RlZCBhbiBvcHRpb25hbCAje3Byb3BlcnR5X3R5cGV9IGZvciAje2NsYXN6Lm5hbWV9LiN7cHJvcGVydHlfbmFtZX0sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBwcm9wZXJ0eV90eXBlIGlzICdsaXN0J1xuICAgICAgICBmb3IgY2FuZGlkYXRlIGluIGNhbmRpZGF0ZXNcbiAgICAgICAgICBSLnB1c2ggc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgICAgZWxzZVxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzXG4gICAgICAgICAgaWYgUmVmbGVjdC5oYXMgUiwgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX25hbWVkX3N0YXRlbWVudF9leGlzdHMgJ86pZGJyaWNtX19fNCcsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgUlsgc3RhdGVtZW50X25hbWUgXSA9IHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICByZXR1cm4gUlxuXG4gICMjI1xuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICDDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhlxuICAjIyNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHk6ICggeCApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX181JywgdHlwZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggZGVsdGEgPSB4Lmxlbmd0aCAtICggbmV3IFNldCB4ICkuc2l6ZSApIGlzIDBcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3VuaXF1ZV9saXN0X2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzYnLCBkZWx0YVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggaWR4X29mX21lID0geC5pbmRleE9mICdtZScgKSA+ICggaWR4X29mX3Byb3RvdHlwZXMgPSB4LmluZGV4T2YgJ3Byb3RvdHlwZXMnIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX21lX2JlZm9yZV9wcm90b3R5cGVzX2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzcnLCBpZHhfb2ZfbWUsIGlkeF9vZl9wcm90b3R5cGVzXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZWxlbWVudCwgZWxlbWVudF9pZHggaW4geFxuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAnbWUnXG4gICAgICBjb250aW51ZSBpZiBlbGVtZW50IGlzICdwcm90b3R5cGVzJ1xuICAgICAgdW5sZXNzIGVsZW1lbnQ/XG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX29iamVjdF9vcl9wbGFjZWhvbGRlcl9mb3JfcGx1Z2luICfOqWRicmljbV9fXzgnLCBlbGVtZW50X2lkeFxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIGVsZW1lbnQsICdleHBvcnRzJ1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfd2l0aF9leHBvcnRzX2Zvcl9wbHVnaW4gJ86pZGJyaWNtX19fOScsIGVsZW1lbnRfaWR4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4geFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9hY3F1aXNpdGlvbl9jaGFpbjogLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gW11cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHByb3RvdHlwZXMgID0gZ2V0X3Byb3RvdHlwZV9jaGFpbiBjbGFzelxuICAgIHByb3RvdHlwZXMgID0gKCBwIGZvciBwIGluIHByb3RvdHlwZXMgd2hlbiAoIHAgaXNudCBjbGFzeiApIGFuZCBwIG5vdCBpbiBpZ25vcmVkX3Byb3RvdHlwZXMgKS5yZXZlcnNlKClcbiAgICBwbHVnaW5zICAgICA9IGNsYXN6LnBsdWdpbnMgPyBbXVxuICAgIHBsdWdpbnMudW5zaGlmdCAncHJvdG90eXBlcycgIHVubGVzcyAncHJvdG90eXBlcycgaW4gcGx1Z2luc1xuICAgIHBsdWdpbnMucHVzaCAgICAnbWUnICAgICAgICAgIHVubGVzcyAnbWUnICAgICAgICAgaW4gcGx1Z2luc1xuICAgIEBfdmFsaWRhdGVfcGx1Z2luc19wcm9wZXJ0eSBwbHVnaW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZW50cnkgaW4gcGx1Z2luc1xuICAgICAgc3dpdGNoIGVudHJ5XG4gICAgICAgIHdoZW4gJ21lJ1xuICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogY2xhc3osIH1cbiAgICAgICAgd2hlbiAncHJvdG90eXBlcydcbiAgICAgICAgICBmb3IgcHJvdG90eXBlIGluIHByb3RvdHlwZXNcbiAgICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogcHJvdG90eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncGx1Z2luJywgY29udHJpYnV0b3I6IGVudHJ5LCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGFjcXVpc2l0aW9uX2NoYWluID0gQF9nZXRfYWNxdWlzaXRpb25fY2hhaW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgICAgICAgPVxuICAgICAgYnVpbGQ6ICAgICAgICAgICAgICAgIFtdXG4gICAgICBzdGF0ZW1lbnRzOiAgICAgICAgICAge31cbiAgICAgIGZ1bmN0aW9uczogICAgICAgICAgICB7fVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uczogIHt9XG4gICAgICB3aW5kb3dfZnVuY3Rpb25zOiAgICAge31cbiAgICAgIHRhYmxlX2Z1bmN0aW9uczogICAgICB7fVxuICAgICAgdmlydHVhbF90YWJsZXM6ICAgICAgIHt9XG4gICAgICBtZXRob2RzOiAgICAgICAgICAgICAge31cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciB7IHR5cGUsIGNvbnRyaWJ1dG9yLCB9IGluIGFjcXVpc2l0aW9uX2NoYWluXG4gICAgICBzb3VyY2UgPSBpZiB0eXBlIGlzICdwbHVnaW4nIHRoZW4gY29udHJpYnV0b3IuZXhwb3J0cyBlbHNlIGNvbnRyaWJ1dG9yXG4gICAgICBpZiAoIE9iamVjdC5oYXNPd24gc291cmNlLCAnYnVpbGQnIClcbiAgICAgICAgUi5idWlsZC5wdXNoIGl0ZW0gZm9yIGl0ZW0gaW4gKCBzb3VyY2UuYnVpbGQgPyBbXSApXG4gICAgICBmb3IgcHJvcGVydHlfbmFtZSwgdGFyZ2V0IG9mIFJcbiAgICAgICAgY29udGludWUgaWYgKCBwcm9wZXJ0eV9uYW1lIGlzICdidWlsZCcgKVxuICAgICAgICBjb250aW51ZSBpZiAoIHByb3BlcnR5X25hbWUgaXMgJ21ldGhvZHMnICkgYW5kICggdHlwZSBpc250ICdwbHVnaW4nIClcbiAgICAgICAgY29udGludWUgaWYgKCBub3QgT2JqZWN0Lmhhc093biBzb3VyY2UsIHByb3BlcnR5X25hbWUgKVxuICAgICAgICAjIyMgVEFJTlQgbWFrZSBvdmVyd3JpdGluZyBiZWhhdmlvciBjb25maWd1cmFibGUgIyMjXG4gICAgICAgIHRhcmdldFsga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSBvZiAoIHNvdXJjZVsgcHJvcGVydHlfbmFtZSBdID8ge30gKVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfYXBwbHlfY29udHJpYnV0aW9uczogLT5cbiAgICBjbGFzeiAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY29udHJpYnV0aW9ucyA9IEBfY29sbGVjdF9jb250cmlidXRvcl9wcm9wZXJ0aWVzKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBfYWNxdWlyZV9tZXRob2RzICAgICBjb250cmlidXRpb25zXG4gICAgQF9jcmVhdGVfdWRmcyAgICAgICAgIGNvbnRyaWJ1dGlvbnNcbiAgICBAX3JlYnVpbGQgICAgICAgICAgICAgY29udHJpYnV0aW9ucyBpZiBAY2ZnLnJlYnVpbGRcbiAgICBAX2FjcXVpcmVfc3RhdGVtZW50cyAgY29udHJpYnV0aW9uc1xuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfYWNxdWlyZV9tZXRob2RzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIGZvciBtZXRob2RfbmFtZSwgbWV0aG9kIG9mIGNvbnRyaWJ1dGlvbnMubWV0aG9kc1xuICAgICAgaGlkZSBALCBtZXRob2RfbmFtZSwgbWV0aG9kXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9hY3F1aXJlX3N0YXRlbWVudHM6ICggY29udHJpYnV0aW9ucyApIC0+XG4gICAgZm9yIHN0YXRlbWVudF9uYW1lLCBzdGF0ZW1lbnQgb2YgY29udHJpYnV0aW9ucy5zdGF0ZW1lbnRzXG4gICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIFRFQVJET1dOICYgUkVCVUlMRFxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICBSID0ge31cbiAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVhcmRvd246IC0+XG4gICAgY291bnQgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGNvdW50KytcbiAgICAgIHRyeVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7SUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljbV9fMTAgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3JlYnVpbGQ6ICggY29udHJpYnV0aW9ucyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgQHRlYXJkb3duKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gY29udHJpYnV0aW9ucy5idWlsZFxuICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBVREZzXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV91ZGZzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIE9iamVjdC5rZXlzIG5hbWVzX29mX2NhbGxhYmxlc1xuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiX2NyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBjb250cmlidXRpb25zWyBwcm9wZXJ0eV9uYW1lIF1cbiAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgZC5uYW1lID89IHVkZl9uYW1lXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIG51bGxcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3VkZl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEzIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE0IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTcgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE5IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIwIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogICAgICAge31cbiAgQHN0YXRlbWVudHM6ICAgICAge31cbiAgQGJ1aWxkOiAgICAgICAgICAgbnVsbFxuICBAcGx1Z2luczogICAgICAgICBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcmVidWlsZDogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5kYnJpY19jZmcsIH0sICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBjZmcucmVidWlsZCA9IHRydWVcbiAgICByZXR1cm4gbmV3IEAgY2ZnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgTk9URSB0aGlzIHVudXN1YWwgYXJyYW5nZW1lbnQgaXMgc29sZWx5IHRoZXJlIHNvIHdlIGNhbiBjYWxsIGBzdXBlcigpYCBmcm9tIGFuIGluc3RhbmNlIG1ldGhvZCAjIyNcbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IERiX2FkYXB0ZXIgZGJfcGF0aFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQGNmZyAgICAgICAgICAgICAgICAgICAgICA9IGZyZWV6ZSB7IHRlbXBsYXRlcy5kYnJpY19jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICBAX2FwcGx5X2NvbnRyaWJ1dGlvbnMoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2FsazogICAgICAgKCBzcWwsIFAuLi4gKSAtPiAoIEBwcmVwYXJlIHNxbCApLml0ZXJhdGUgUC4uLlxuICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIxIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdHJ5XG4gICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgY2F0Y2ggY2F1c2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMiB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgcmV0dXJuIFJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pZ25vcmVkX3Byb3RvdHlwZXMgPSBPYmplY3QuZnJlZXplIFtcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge30gKSxcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgT2JqZWN0ICksXG4gIERicmljX2NsYXNzcHJvcF9hYnNvcmJlcixcbiAgRGJyaWMsXG4gIF1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEYnJpYyxcbiAgU1FMLFxuICBJRE4sXG4gIExJVCxcbiAgU1FMLFxuICBWRUMsXG4gIFRydWUsXG4gIEZhbHNlLFxuICBhc19ib29sLFxuICBmcm9tX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgaW50ZXJuYWxzOiBmcmVlemUge1xuICAgIEUsXG4gICAgaWdub3JlZF9wcm90b3R5cGVzLFxuICAgIHR5cGVfb2YsXG4gICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAgIHRlbXBsYXRlcywgfVxuICB9XG5cblxuXG4iXX0=
