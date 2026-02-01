(function() {
  'use strict';
  var Db_adapter, Dbric, Dbric_classprop_absorber, E, False, IDN, LIT, SQL, True, VEC, as_bool, debug, freeze, from_bool, get_all_in_prototype_chain, get_prototype_chain, hide, ignored_prototypes, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn,
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

  // #-----------------------------------------------------------------------------------------------------------
  // ### TAINT put into separate module ###
  // ### TAINT rewrite with `get_all_in_prototype_chain()` ###
  // ### TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` ###
  // get_property_descriptor = ( x, name, fallback = misfit ) ->
  //   while x?
  //     return R if ( R = Object.getOwnPropertyDescriptor x, name )?
  //     x = Object.getPrototypeOf x
  //   return fallback unless fallback is misfit
  //   throw new Error "unable to find descriptor for property #{String(name)} not found on object or its prototypes"

  // #-----------------------------------------------------------------------------------------------------------
  // build_statement_re = ///
  //   ^ \s*
  //   insert | (
  //     ( create | alter ) \s+
  //     (?<type> table | view | index | trigger ) \s+
  //     (?<name> \S+ ) \s+
  //     )
  //   ///is

  //-----------------------------------------------------------------------------------------------------------
  templates = {
    dbric_cfg: {
      db_path: ':memory:',
      rebuild: false,
      prefix: misfit
    },
    // overwrite:      misfit
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

  Dbric_classprop_absorber = (function() {
    //===========================================================================================================
    class Dbric_classprop_absorber {
      // @overwrite: false

        //---------------------------------------------------------------------------------------------------------
      _resolve_function(x) {
        if ((type_of(x)) === 'function') {
          return x.call(this);
        } else {
          return x;
        }
      }

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
          source = type === 'plugin' ? contributor.exports : contributor;
          if (Object.hasOwn(source, 'build')) {
            ref1 = this._resolve_function((ref = source.build) != null ? ref : []);
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
          this.statements[statement_name] = this.prepare(this._resolve_function(statement));
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
              warn(`Ωdbricm___6 ignored error: ${error.message}`);
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
          (this.prepare(this._resolve_function(build_statement))).run();
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
          //.....................................................................................................
          for (udf_name in ref1) {
            fn_cfg = ref1[udf_name];
            fn_cfg = this._resolve_function(fn_cfg);
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
          throw new Error(`Ωdbricm___7 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm___8 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      _create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm___9 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__10 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__11 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__12 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__13 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__14 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__15 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__16 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, create);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric_classprop_absorber.prefix = null;

    return Dbric_classprop_absorber;

  }).call(this);

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

    };

    //---------------------------------------------------------------------------------------------------------
    Dbric.functions = {};

    Dbric.statements = {};

    Dbric.build = null;

    Dbric.plugins = null;

    // @overwrite:       false
    // @prefix:          null

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
      var clasz, extra, ref;
      //.......................................................................................................
      if (db_path == null) {
        db_path = ':memory:';
      }
      //.......................................................................................................
      clasz = this.constructor;
      hide(this, 'db', new Db_adapter(db_path));
      //.......................................................................................................
      extra = {};
      cfg = {...templates.dbric_cfg, db_path, ...cfg};
      if (cfg.prefix === misfit) {
        cfg.prefix = clasz.prefix;
      }
      // cfg.overwrite             = clasz.overwrite if cfg.overwrite  is misfit
      this.cfg = freeze(cfg);
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
    internals: freeze({E, ignored_prototypes, type_of, templates})
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLDBCQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsa0JBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLElBQUE7SUFBQSxvQkFBQTs7Ozs7RUFLQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQyxFQUxBOzs7O0VBU0EsVUFBQSxHQUFrQyxPQUFBLENBQVEsZ0JBQVIsRUFUbEM7OztFQVdBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLDhCQUFSLENBQWxDLEVBWEE7OztFQWFBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQ2tDLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQURsQzs7RUFFQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxlQUEzQyxDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLE1BREYsQ0FBQSxHQUNrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBD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QUQrQixFQUUvQixNQUFNLENBQUMsY0FBUCxDQUFzQixNQUF0QixDQUYrQixFQUdqQyx3QkFIaUMsRUFJakMsS0FKaUMsQ0FBZCxFQXphckI7OztFQWtiQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLEtBRGU7SUFFZixHQUZlO0lBR2YsR0FIZTtJQUlmLEdBSmU7SUFLZixHQUxlO0lBTWYsR0FOZTtJQU9mLElBUGU7SUFRZixLQVJlO0lBU2YsT0FUZTtJQVVmLFNBVmU7SUFXZixZQVhlO0lBWWYsU0FBQSxFQUFXLE1BQUEsQ0FBTyxDQUNoQixDQURnQixFQUVoQixrQkFGZ0IsRUFHaEIsT0FIZ0IsRUFJaEIsU0FKZ0IsQ0FBUDtFQVpJO0FBbGJqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZyxcbiAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiMgRGJfYWRhcHRlciAgICAgICAgICAgICAgICAgICAgICA9ICggcmVxdWlyZSAnbm9kZTpzcWxpdGUnICkuRGF0YWJhc2VTeW5jXG5EYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYmV0dGVyLXNxbGl0ZTMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IGxldHMsXG4gIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xldHNmcmVlemV0aGF0LWluZnJhLmJyaWNzJyApLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbnsgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sXG4gIGdldF9wcm90b3R5cGVfY2hhaW4sICAgICAgICB9ID0gcmVxdWlyZSAnLi9wcm90b3R5cGUtdG9vbHMnXG57IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICkucmVxdWlyZV9ub3JtYWxpemVfZnVuY3Rpb25fYXJndW1lbnRzKClcbiMgeyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiMgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9jb2Fyc2Utc3FsaXRlLXN0YXRlbWVudC1zZWdtZW50ZXIuYnJpY3MnICkucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbm1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBUcnVlLFxuICBGYWxzZSxcbiAgZnJvbV9ib29sLFxuICBhc19ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIElETixcbiAgTElULFxuICBWRUMsXG4gIFNRTCwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy11dGlsaXRpZXMnXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmlnbm9yZWRfcHJvdG90eXBlcyAgICAgICAgICAgICAgPSBudWxsXG5cblxuIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiMgIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4jICMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuIyBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuIyAgIHdoaWxlIHg/XG4jICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiMgICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuIyAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4jICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4jICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBidWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiMgICBeIFxccypcbiMgICBpbnNlcnQgfCAoXG4jICAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuIyAgICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuIyAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiMgICAgIClcbiMgICAvLy9pc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnRlbXBsYXRlcyA9XG4gIGRicmljX2NmZzpcbiAgICBkYl9wYXRoOiAgICAgICAgJzptZW1vcnk6J1xuICAgIHJlYnVpbGQ6ICAgICAgICBmYWxzZVxuICAgIHByZWZpeDogICAgICAgICBtaXNmaXRcbiAgICAjIG92ZXJ3cml0ZTogICAgICBtaXNmaXRcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBwcmVmaXg6ICAgIG51bGxcbiAgIyBAb3ZlcndyaXRlOiBmYWxzZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3Jlc29sdmVfZnVuY3Rpb246ICggeCApIC0+IGlmICggKCB0eXBlX29mIHggKSBpcyAnZnVuY3Rpb24nICkgdGhlbiAoIHguY2FsbCBAICkgZWxzZSB4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIF92YWxpZGF0ZV9wbHVnaW5zX3Byb3BlcnR5OiAoIHggKSAtPlxuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX2xpc3RfZm9yX3BsdWdpbnMgJ86pZGJyaWNtX19fMScsIHR5cGVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGRlbHRhID0geC5sZW5ndGggLSAoIG5ldyBTZXQgeCApLnNpemUgKSBpcyAwXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF91bmlxdWVfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18yJywgZGVsdGFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyAoIGlkeF9vZl9tZSA9IHguaW5kZXhPZiAnbWUnICkgPiAoIGlkeF9vZl9wcm90b3R5cGVzID0geC5pbmRleE9mICdwcm90b3R5cGVzJyApXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9tZV9iZWZvcmVfcHJvdG90eXBlc19mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18zJywgaWR4X29mX21lLCBpZHhfb2ZfcHJvdG90eXBlc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVsZW1lbnQsIGVsZW1lbnRfaWR4IGluIHhcbiAgICAgIGNvbnRpbnVlIGlmIGVsZW1lbnQgaXMgJ21lJ1xuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAncHJvdG90eXBlcydcbiAgICAgIHVubGVzcyBlbGVtZW50P1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfb3JfcGxhY2Vob2xkZXJfZm9yX3BsdWdpbiAnzqlkYnJpY21fX180JywgZWxlbWVudF9pZHhcbiAgICAgIHVubGVzcyBSZWZsZWN0LmhhcyBlbGVtZW50LCAnZXhwb3J0cydcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfb2JqZWN0X3dpdGhfZXhwb3J0c19mb3JfcGx1Z2luICfOqWRicmljbV9fXzUnLCBlbGVtZW50X2lkeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfYWNxdWlzaXRpb25fY2hhaW46IC0+XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICA9IFtdXG4gICAgY2xhc3ogICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBwcm90b3R5cGVzICA9IGdldF9wcm90b3R5cGVfY2hhaW4gY2xhc3pcbiAgICBwcm90b3R5cGVzICA9ICggcCBmb3IgcCBpbiBwcm90b3R5cGVzIHdoZW4gKCBwIGlzbnQgY2xhc3ogKSBhbmQgcCBub3QgaW4gaWdub3JlZF9wcm90b3R5cGVzICkucmV2ZXJzZSgpXG4gICAgcGx1Z2lucyAgICAgPSBjbGFzei5wbHVnaW5zID8gW11cbiAgICBwbHVnaW5zLnVuc2hpZnQgJ3Byb3RvdHlwZXMnICB1bmxlc3MgJ3Byb3RvdHlwZXMnIGluIHBsdWdpbnNcbiAgICBwbHVnaW5zLnB1c2ggICAgJ21lJyAgICAgICAgICB1bmxlc3MgJ21lJyAgICAgICAgIGluIHBsdWdpbnNcbiAgICBAX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHkgcGx1Z2luc1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGVudHJ5IGluIHBsdWdpbnNcbiAgICAgIHN3aXRjaCBlbnRyeVxuICAgICAgICB3aGVuICdtZSdcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgY29udHJpYnV0b3I6IGNsYXN6LCB9XG4gICAgICAgIHdoZW4gJ3Byb3RvdHlwZXMnXG4gICAgICAgICAgZm9yIHByb3RvdHlwZSBpbiBwcm90b3R5cGVzXG4gICAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncHJvdG90eXBlJywgY29udHJpYnV0b3I6IHByb3RvdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgUi5wdXNoIHsgdHlwZTogJ3BsdWdpbicsIGNvbnRyaWJ1dG9yOiBlbnRyeSwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jb2xsZWN0X2NvbnRyaWJ1dG9yX3Byb3BlcnRpZXM6IC0+XG4gICAgY2xhc3ogICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBhY3F1aXNpdGlvbl9jaGFpbiA9IEBfZ2V0X2FjcXVpc2l0aW9uX2NoYWluKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgICAgID1cbiAgICAgIGJ1aWxkOiAgICAgICAgICAgICAgICBbXVxuICAgICAgc3RhdGVtZW50czogICAgICAgICAgIHt9XG4gICAgICBmdW5jdGlvbnM6ICAgICAgICAgICAge31cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbnM6ICB7fVxuICAgICAgd2luZG93X2Z1bmN0aW9uczogICAgIHt9XG4gICAgICB0YWJsZV9mdW5jdGlvbnM6ICAgICAge31cbiAgICAgIHZpcnR1YWxfdGFibGVzOiAgICAgICB7fVxuICAgICAgbWV0aG9kczogICAgICAgICAgICAgIHt9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgeyB0eXBlLCBjb250cmlidXRvciwgfSBpbiBhY3F1aXNpdGlvbl9jaGFpblxuICAgICAgc291cmNlID0gaWYgdHlwZSBpcyAncGx1Z2luJyB0aGVuIGNvbnRyaWJ1dG9yLmV4cG9ydHMgZWxzZSBjb250cmlidXRvclxuICAgICAgaWYgKCBPYmplY3QuaGFzT3duIHNvdXJjZSwgJ2J1aWxkJyApXG4gICAgICAgIFIuYnVpbGQucHVzaCBpdGVtIGZvciBpdGVtIGluICggQF9yZXNvbHZlX2Z1bmN0aW9uIHNvdXJjZS5idWlsZCA/IFtdIClcbiAgICAgIGZvciBwcm9wZXJ0eV9uYW1lLCB0YXJnZXQgb2YgUlxuICAgICAgICBjb250aW51ZSBpZiAoIHByb3BlcnR5X25hbWUgaXMgJ2J1aWxkJyApXG4gICAgICAgIGNvbnRpbnVlIGlmICggcHJvcGVydHlfbmFtZSBpcyAnbWV0aG9kcycgKSBhbmQgKCB0eXBlIGlzbnQgJ3BsdWdpbicgKVxuICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBPYmplY3QuaGFzT3duIHNvdXJjZSwgcHJvcGVydHlfbmFtZSApXG4gICAgICAgICMjIyBUQUlOVCBtYWtlIG92ZXJ3cml0aW5nIGJlaGF2aW9yIGNvbmZpZ3VyYWJsZSAjIyNcbiAgICAgICAgdGFyZ2V0WyBrZXkgXSA9IHZhbHVlIGZvciBrZXksIHZhbHVlIG9mICggc291cmNlWyBwcm9wZXJ0eV9uYW1lIF0gPyB7fSApXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9hcHBseV9jb250cmlidXRpb25zOiAtPlxuICAgIGNsYXN6ICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBjb250cmlidXRpb25zID0gQF9jb2xsZWN0X2NvbnRyaWJ1dG9yX3Byb3BlcnRpZXMoKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQF9hY3F1aXJlX21ldGhvZHMgICAgIGNvbnRyaWJ1dGlvbnNcbiAgICBAX2NyZWF0ZV91ZGZzICAgICAgICAgY29udHJpYnV0aW9uc1xuICAgIEBfcmVidWlsZCAgICAgICAgICAgICBjb250cmlidXRpb25zIGlmIEBjZmcucmVidWlsZFxuICAgIEBfYWNxdWlyZV9zdGF0ZW1lbnRzICBjb250cmlidXRpb25zXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9hY3F1aXJlX21ldGhvZHM6ICggY29udHJpYnV0aW9ucyApIC0+XG4gICAgZm9yIG1ldGhvZF9uYW1lLCBtZXRob2Qgb2YgY29udHJpYnV0aW9ucy5tZXRob2RzXG4gICAgICBoaWRlIEAsIG1ldGhvZF9uYW1lLCBtZXRob2RcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FjcXVpcmVfc3RhdGVtZW50czogKCBjb250cmlidXRpb25zICkgLT5cbiAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBjb250cmlidXRpb25zLnN0YXRlbWVudHNcbiAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgQF9yZXNvbHZlX2Z1bmN0aW9uIHN0YXRlbWVudFxuICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIFRFQVJET1dOICYgUkVCVUlMRFxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICBSID0ge31cbiAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVhcmRvd246IC0+XG4gICAgY291bnQgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGNvdW50KytcbiAgICAgIHRyeVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7SUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljbV9fXzYgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3JlYnVpbGQ6ICggY29udHJpYnV0aW9ucyApIC0+XG4gICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICBAdGVhcmRvd24oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBjb250cmlidXRpb25zLmJ1aWxkXG4gICAgICAoIEBwcmVwYXJlIEBfcmVzb2x2ZV9mdW5jdGlvbiBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBVREZzXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV91ZGZzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIE9iamVjdC5rZXlzIG5hbWVzX29mX2NhbGxhYmxlc1xuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiX2NyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGNvbnRyaWJ1dGlvbnNbIHByb3BlcnR5X25hbWUgXVxuICAgICAgICBmbl9jZmcgPSBAX3Jlc29sdmVfZnVuY3Rpb24gZm5fY2ZnXG4gICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgZm9yIG5hbWVfb2ZfY2FsbGFibGUgaW4gbmFtZXNfb2ZfY2FsbGFibGVzWyBjYXRlZ29yeSBdXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3VkZl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX183IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX184IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX185IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEwIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE2IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogICAgICAge31cbiAgQHN0YXRlbWVudHM6ICAgICAge31cbiAgQGJ1aWxkOiAgICAgICAgICAgbnVsbFxuICBAcGx1Z2luczogICAgICAgICBudWxsXG4gICMgQG92ZXJ3cml0ZTogICAgICAgZmFsc2VcbiAgIyBAcHJlZml4OiAgICAgICAgICBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcmVidWlsZDogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5kYnJpY19jZmcsIH0sICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBjZmcucmVidWlsZCA9IHRydWVcbiAgICByZXR1cm4gbmV3IEAgY2ZnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgTk9URSB0aGlzIHVudXN1YWwgYXJyYW5nZW1lbnQgaXMgc29sZWx5IHRoZXJlIHNvIHdlIGNhbiBjYWxsIGBzdXBlcigpYCBmcm9tIGFuIGluc3RhbmNlIG1ldGhvZCAjIyNcbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IERiX2FkYXB0ZXIgZGJfcGF0aFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZXh0cmEgICAgICAgICAgICAgICAgICAgICA9IHt9XG4gICAgY2ZnICAgICAgICAgICAgICAgICAgICAgICA9IHsgdGVtcGxhdGVzLmRicmljX2NmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgY2ZnLnByZWZpeCAgICAgICAgICAgICAgICA9IGNsYXN6LnByZWZpeCAgICBpZiBjZmcucHJlZml4ICAgICBpcyBtaXNmaXRcbiAgICAjIGNmZy5vdmVyd3JpdGUgICAgICAgICAgICAgPSBjbGFzei5vdmVyd3JpdGUgaWYgY2ZnLm92ZXJ3cml0ZSAgaXMgbWlzZml0XG4gICAgQGNmZyAgICAgICAgICAgICAgICAgICAgICA9IGZyZWV6ZSBjZmdcbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgQF9hcHBseV9jb250cmlidXRpb25zKClcbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNyBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHRyeVxuICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgIGNhdGNoIGNhdXNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTggd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgIHJldHVybiBSXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaWdub3JlZF9wcm90b3R5cGVzID0gT2JqZWN0LmZyZWV6ZSBbXG4gICggT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9ICksXG4gICggT2JqZWN0LmdldFByb3RvdHlwZU9mIE9iamVjdCApLFxuICBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXIsXG4gIERicmljLFxuICBdXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRGJyaWMsXG4gIFNRTCxcbiAgSUROLFxuICBMSVQsXG4gIFNRTCxcbiAgVkVDLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIGludGVybmFsczogZnJlZXplIHtcbiAgICBFLFxuICAgIGlnbm9yZWRfcHJvdG90eXBlcyxcbiAgICB0eXBlX29mLFxuICAgIHRlbXBsYXRlcywgfVxuICB9XG5cblxuXG4iXX0=
