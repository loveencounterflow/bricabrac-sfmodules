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

      // #---------------------------------------------------------------------------------------------------------
      // build: ->

        //---------------------------------------------------------------------------------------------------------
      _rebuild() {
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
      var clasz, fn_cfg_template, ref;
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
      //.......................................................................................................
      fn_cfg_template = {
        deterministic: true,
        varargs: false
      };
      this._create_udfs();
      if (this.cfg.rebuild) {
        //.......................................................................................................
        this._rebuild();
      }
      this._prepare_statements();
      return void 0;
    });

    //---------------------------------------------------------------------------------------------------------
    set_getter(Dbric.prototype, 'super', function() {
      return Object.getPrototypeOf(this.constructor);
    });

    set_getter(Dbric.prototype, '_function_names', function() {
      return this._get_function_names();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLGtCQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxJQUFBO0lBQUEsb0JBQUE7Ozs7O0VBS0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEMsRUFMQTs7OztFQVNBLFVBQUEsR0FBa0MsT0FBQSxDQUFRLGdCQUFSLEVBVGxDOzs7RUFXQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSw4QkFBUixDQUFsQyxFQVhBOzs7RUFhQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFB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LE9BSGdCLEVBSWhCLGtCQUpnQixFQUtoQixTQUxnQixDQUFQO0VBWkk7QUExZGpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuIyBEYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICdub2RlOnNxbGl0ZScgKS5EYXRhYmFzZVN5bmNcbkRiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdiZXR0ZXItc3FsaXRlMydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbGV0c2ZyZWV6ZXRoYXQtaW5mcmEuYnJpY3MnICkucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgICAgICAgIH0gPSByZXF1aXJlICcuL3Byb3RvdHlwZS10b29scydcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4jIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgd2hpbGUgeD9cbiAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICBeIFxccypcbiAgaW5zZXJ0IHwgKFxuICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgKVxuICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGRicmljX2NmZzpcbiAgICBkYl9wYXRoOiAgICAgICAgJzptZW1vcnk6J1xuICAgIHJlYnVpbGQ6ICAgICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogKCBwcm9wZXJ0eV9uYW1lLCBwcm9wZXJ0eV90eXBlICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjYW5kaWRhdGVzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzdGF0ZW1lbnRfZnJvbV9jYW5kaWRhdGUgPSAoIGNhbmRpZGF0ZSApID0+XG4gICAgICBpZiAoIHR5cGVfb2YgY2FuZGlkYXRlICkgaXMgJ2Z1bmN0aW9uJyB0aGVuIFIgPSBjYW5kaWRhdGUuY2FsbCBAXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjYW5kaWRhdGVcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIFIgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gJ86pZGJyaWNtX19fNicsIHR5cGVcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gc3dpdGNoIHByb3BlcnR5X3R5cGVcbiAgICAgIHdoZW4gJ2xpc3QnIHRoZW4gW11cbiAgICAgIHdoZW4gJ3BvZCcgIHRoZW4ge31cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgJ86pZGJyaWNtX19fNycsIFwidW5rbm93biBwcm9wZXJ0eV90eXBlICN7cnByIHByb3BlcnR5X3R5cGV9XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYW5kaWRhdGVzIGluIGNhbmRpZGF0ZXNfbGlzdFxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGNhbmRpZGF0ZXMgKSBpcyBwcm9wZXJ0eV90eXBlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCAje3Byb3BlcnR5X3R5cGV9IGZvciAje2NsYXN6Lm5hbWV9LiN7cHJvcGVydHlfbmFtZX0sIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBwcm9wZXJ0eV90eXBlIGlzICdsaXN0J1xuICAgICAgICBmb3IgY2FuZGlkYXRlIGluIGNhbmRpZGF0ZXNcbiAgICAgICAgICBSLnB1c2ggc3RhdGVtZW50X2Zyb21fY2FuZGlkYXRlIGNhbmRpZGF0ZVxuICAgICAgZWxzZVxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzXG4gICAgICAgICAgaWYgUmVmbGVjdC5oYXMgUiwgc3RhdGVtZW50X25hbWVcbiAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX25hbWVkX3N0YXRlbWVudF9leGlzdHMgJ86pZGJyaWNtX19fOScsIHN0YXRlbWVudF9uYW1lXG4gICAgICAgICAgUlsgc3RhdGVtZW50X25hbWUgXSA9IHN0YXRlbWVudF9mcm9tX2NhbmRpZGF0ZSBjYW5kaWRhdGVcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHN0YXRlbWVudHMgID0gQF9nZXRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4gJ3N0YXRlbWVudHMnLCAncG9kJ1xuICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdWRmczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICdhZ2dyZWdhdGVfZnVuY3Rpb24nLCAnd2luZG93X2Z1bmN0aW9uJywgJ3RhYmxlX2Z1bmN0aW9uJywgJ3ZpcnR1YWxfdGFibGUnLCBdXG4gICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgZGVjbGFyYXRpb25zX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIHVkZl9uYW1lLCBmbl9jZmcgb2YgZGVjbGFyYXRpb25zXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBudWxsXG5cbiAgIyMjXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gIMOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGw4bDhsOGXG4gICMjI1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHk6ICggeCApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18xJywgdHlwZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggZGVsdGEgPSB4Lmxlbmd0aCAtICggbmV3IFNldCB4ICkuc2l6ZSApIGlzIDBcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3VuaXF1ZV9saXN0X2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzInLCBkZWx0YVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggaWR4X29mX21lID0geC5pbmRleE9mICdtZScgKSA+ICggaWR4X29mX3Byb3RvdHlwZXMgPSB4LmluZGV4T2YgJ3Byb3RvdHlwZXMnIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX21lX2JlZm9yZV9wcm90b3R5cGVzX2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzMnLCBpZHhfb2ZfbWUsIGlkeF9vZl9wcm90b3R5cGVzXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZWxlbWVudCwgZWxlbWVudF9pZHggaW4geFxuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAnbWUnXG4gICAgICBjb250aW51ZSBpZiBlbGVtZW50IGlzICdwcm90b3R5cGVzJ1xuICAgICAgdW5sZXNzIGVsZW1lbnQ/XG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX29iamVjdF9vcl9wbGFjZWhvbGRlcl9mb3JfcGx1Z2luICfOqWRicmljbV9fXzQnLCBlbGVtZW50X2lkeFxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIGVsZW1lbnQsICdleHBvcnRzJ1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfd2l0aF9leHBvcnRzX2Zvcl9wbHVnaW4gJ86pZGJyaWNtX19fNScsIGVsZW1lbnRfaWR4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4geFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9hY3F1aXNpdGlvbl9jaGFpbjogLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gW11cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHByb3RvdHlwZXMgID0gZ2V0X3Byb3RvdHlwZV9jaGFpbiBjbGFzelxuICAgIHByb3RvdHlwZXMgID0gKCBwIGZvciBwIGluIHByb3RvdHlwZXMgd2hlbiAoIHAgaXNudCBjbGFzeiApIGFuZCBwIG5vdCBpbiBpZ25vcmVkX3Byb3RvdHlwZXMgKS5yZXZlcnNlKClcbiAgICBwbHVnaW5zICAgICA9IGNsYXN6LnBsdWdpbnMgPyBbXVxuICAgIHBsdWdpbnMudW5zaGlmdCAncHJvdG90eXBlcycgIHVubGVzcyAncHJvdG90eXBlcycgaW4gcGx1Z2luc1xuICAgIHBsdWdpbnMucHVzaCAgICAnbWUnICAgICAgICAgIHVubGVzcyAnbWUnICAgICAgICAgaW4gcGx1Z2luc1xuICAgIEBfdmFsaWRhdGVfcGx1Z2luc19wcm9wZXJ0eSBwbHVnaW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZW50cnkgaW4gcGx1Z2luc1xuICAgICAgc3dpdGNoIGVudHJ5XG4gICAgICAgIHdoZW4gJ21lJ1xuICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogY2xhc3osIH1cbiAgICAgICAgd2hlbiAncHJvdG90eXBlcydcbiAgICAgICAgICBmb3IgcHJvdG90eXBlIGluIHByb3RvdHlwZXNcbiAgICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogcHJvdG90eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncGx1Z2luJywgY29udHJpYnV0b3I6IGVudHJ5LCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGFjcXVpc2l0aW9uX2NoYWluID0gQF9nZXRfYWNxdWlzaXRpb25fY2hhaW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgICAgICAgPVxuICAgICAgYnVpbGQ6ICAgICAgICAgICAgICAgIFtdXG4gICAgICBzdGF0ZW1lbnRzOiAgICAgICAgICAge31cbiAgICAgIGZ1bmN0aW9uczogICAgICAgICAgICB7fVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uczogIHt9XG4gICAgICB3aW5kb3dfZnVuY3Rpb25zOiAgICAge31cbiAgICAgIHRhYmxlX2Z1bmN0aW9uczogICAgICB7fVxuICAgICAgdmlydHVhbF90YWJsZXM6ICAgICAgIHt9XG4gICAgICBtZXRob2RzOiAgICAgICAgICAgICAge31cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciB7IHR5cGUsIGNvbnRyaWJ1dG9yLCB9IGluIGFjcXVpc2l0aW9uX2NoYWluXG4gICAgICBSLmJ1aWxkLnB1c2ggaXRlbSBmb3IgaXRlbSBpbiAoIGNvbnRyaWJ1dG9yLmJ1aWxkID8gW10gKVxuICAgICAgc291cmNlID0gaWYgdHlwZSBpcyAncGx1Z2luJyB0aGVuIGNvbnRyaWJ1dG9yLmV4cG9ydHMgZWxzZSBjb250cmlidXRvclxuICAgICAgZm9yIHByb3BlcnR5X25hbWUsIHRhcmdldCBvZiBSXG4gICAgICAgIGNvbnRpbnVlIGlmICggdHlwZSBpc250ICdwbHVnaW4nICkgYW5kICggcHJvcGVydHlfbmFtZSBpcyAnbWV0aG9kcycgKVxuICAgICAgICAjIyMgVEFJTlQgbWFrZSBvdmVyd3JpdGluZyBiZWhhdmlvciBjb25maWd1cmFibGUgIyMjXG4gICAgICAgIHRhcmdldFsga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSBvZiAoIHNvdXJjZVsgcHJvcGVydHlfbmFtZSBdID8ge30gKVxuICAgICAgICAjIFIuc3RhdGVtZW50c1sgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci5zdGF0ZW1lbnRzICAgICAgICAgID8ge30gKVxuICAgICAgICAjIFIuZnVuY3Rpb25zWyAgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci5mdW5jdGlvbnMgICAgICAgICAgID8ge30gKVxuICAgICAgICAjIFIuYWdncmVnYXRlX2Z1bmN0aW9uc1sga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci5hZ2dyZWdhdGVfZnVuY3Rpb25zID8ge30gKVxuICAgICAgICAjIFIud2luZG93X2Z1bmN0aW9uc1sgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci53aW5kb3dfZnVuY3Rpb25zICAgID8ge30gKVxuICAgICAgICAjIFIudGFibGVfZnVuY3Rpb25zWyAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci50YWJsZV9mdW5jdGlvbnMgICAgID8ge30gKVxuICAgICAgICAjIFIudmlydHVhbF90YWJsZXNbICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci52aXJ0dWFsX3RhYmxlcyAgICAgID8ge30gKVxuICAgICAgICAjIFIuZXhwb3J0c1sgICAgICAgICAgICAga2V5IF0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSAgb2YgKCBjb250cmlidXRvci5leHBvcnRzICAgICAgICAgICAgID8ge30gKVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfYXBwbHlfY29udHJpYnV0aW9uczogLT5cbiAgICBjbGFzeiAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgY29udHJpYnV0aW9ucyA9IEBfY29sbGVjdF9jb250cmlidXRvcl9wcm9wZXJ0aWVzKClcbiAgICAjIGRlYnVnICfOqWRicmljbV9fXzEnLCBjbGFzei5uYW1lLCBjbGFzei5idWlsZFxuICAgICMgZm9yIHN0YXRlbWVudCBpbiBjb250cmlidXRpb25zLmJ1aWxkXG4gICAgbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljIGV4dGVuZHMgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZnVuY3Rpb25zOiAgICAgICB7fVxuICBAc3RhdGVtZW50czogICAgICB7fVxuICBAYnVpbGQ6ICAgICAgICAgICBudWxsXG4gIEBwbHVnaW5zOiAgICAgICAgIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEByZWJ1aWxkOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgIGNmZy5yZWJ1aWxkID0gdHJ1ZVxuICAgIHJldHVybiBuZXcgQCBjZmdcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBOT1RFIHRoaXMgdW51c3VhbCBhcnJhbmdlbWVudCBpcyBzb2xlbHkgdGhlcmUgc28gd2UgY2FuIGNhbGwgYHN1cGVyKClgIGZyb20gYW4gaW5zdGFuY2UgbWV0aG9kICMjI1xuICBjb25zdHJ1Y3RvcjogKCBQLi4uICkgLT5cbiAgICBzdXBlcigpXG4gICAgcmV0dXJuIEBfY29uc3RydWN0b3IgUC4uLlxuICBfY29uc3RydWN0b3I6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZGJyaWNfY2ZnLCB9LCAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBuZXcgRGJfYWRhcHRlciBkYl9wYXRoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgdGVtcGxhdGVzLmRicmljX2NmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQF9yZWJ1aWxkKCkgaWYgQGNmZy5yZWJ1aWxkXG4gICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgUiA9IHt9XG4gICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlYXJkb3duOiAtPlxuICAgIGNvdW50ID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBjb3VudCsrXG4gICAgICB0cnlcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje0lETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICB3YXJuIFwizqlkYnJpY21fXzE0IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICByZXR1cm4gY291bnRcblxuICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBidWlsZDogLT5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9yZWJ1aWxkOiAtPlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGJ1aWxkX3N0YXRlbWVudHMgICAgICA9IEBfZ2V0X3N0YXRlbWVudHNfaW5fcHJvdG90eXBlX2NoYWluICdidWlsZCcsICdsaXN0J1xuICAgIEB0ZWFyZG93bigpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICMgZGVidWcgJ86pZGJyaWNtX18xNScsIHJwciBidWlsZF9zdGF0ZW1lbnRcbiAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTcgZXhwZWN0ZWQgYSBzdGF0ZW1lbnQgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB0cnlcbiAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICBjYXRjaCBjYXVzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE4IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBGVU5DVElPTlNcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzIxIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjIgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yMyBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICBpbnZlcnNlLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yNCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18yNSBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIHJvd3MsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjYgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCB7IHBhcmFtZXRlcnMsIGNvbHVtbnMsIHJvd3MsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzI3IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMjggYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmlnbm9yZWRfcHJvdG90eXBlcyA9IE9iamVjdC5mcmVlemUgW1xuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fSApLFxuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBPYmplY3QgKSxcbiAgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyLFxuICBEYnJpYyxcbiAgXVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICBpZ25vcmVkX3Byb3RvdHlwZXMsXG4gICAgdHlwZV9vZixcbiAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgdGVtcGxhdGVzLCB9XG4gIH1cblxuXG5cbiJdfQ==
