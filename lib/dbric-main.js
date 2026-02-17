(function() {
  'use strict';
  var Db_adapter, Dbric, Dbric_classprop_absorber, Dbric_table_formatter, E, False, IDN, LIT, SQL, True, VEC, as_bool, debug, freeze, from_bool, get_all_in_prototype_chain, get_prototype_chain, hide, ignored_prototypes, lets, misfit, nfa, rpr, set_getter, templates, type_of, unquote_name, warn,
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

  ({Dbric_table_formatter} = require('./dbric-table-formatter'));

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
    class Dbric_classprop_absorber extends Dbric_table_formatter {
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
        var cause, ref, statement, statement_name;
        ref = contributions.statements;
        for (statement_name in ref) {
          statement = ref[statement_name];
          try {
            this.statements[statement_name] = this.prepare(this._resolve_function(statement));
          } catch (error1) {
            cause = error1;
            throw new Error(`Ωdbricm___6 when trying to prepare statement ${rpr(statement_name)}, ` + "an error occurred; maybe you forgot to call `@{constructor.name}.rebuild()`? " + "See above cause for details", {cause});
          }
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
              warn(`Ωdbricm___7 ignored error: ${error.message}`);
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
          throw new Error(`Ωdbricm___8 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
        }
        ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm___9 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.function(name, {deterministic, varargs, directOnly}, value);
      }

      //---------------------------------------------------------------------------------------------------------
      _create_aggregate_function(cfg) {
        var deterministic, directOnly, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__10 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
        }
        ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__11 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_window_function(cfg) {
        var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
        if ((type_of(this.db.aggregate)) !== 'function') {
          throw new Error(`Ωdbricm__12 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
        }
        ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__13 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_table_function(cfg) {
        var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__14 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
        }
        ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__15 a UDF or built-in function named ${rpr(name)} has already been declared`);
        }
        return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
      }

      //---------------------------------------------------------------------------------------------------------
      _create_virtual_table(cfg) {
        var create, name, overwrite;
        if ((type_of(this.db.table)) !== 'function') {
          throw new Error(`Ωdbricm__16 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
        }
        ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
        if ((!overwrite) && (this._get_udf_names().has(name))) {
          throw new Error(`Ωdbricm__17 a UDF or built-in function named ${rpr(name)} has already been declared`);
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

      //---------------------------------------------------------------------------------------------------------
      with_transaction(f) {
        var R, cfg, error;
        // with_transaction: ( cfg, f ) ->
        //   switch arity = arguments.length
        //     when 1 then [ cfg, f, ] = [ null, cfg, ]
        //     when 2 then null
        //     else throw new E.DBay_wrong_arity '^dbay/ctx@4^', 'with_transaction()', 1, 2, arity
        //   @types.validate.dbay_with_transaction_cfg ( cfg = { @constructor.C.defaults.dbay_with_transaction_cfg..., cfg..., } )
        //   @types.validate.function f
        cfg = {
          mode: 'deferred'
        };
        if (this.db.inTransaction) {
          throw new E.Dbric_no_nested_transactions('Ωdbricm__20');
        }
        this.execute(SQL`begin ${cfg.mode} transaction;`);
        error = null;
        try {
          R = f();
        } catch (error1) {
          error = error1;
          if (this.db.inTransaction) {
            this.execute(SQL`rollback;`);
          }
          throw error;
        }
        try {
          if (this.db.inTransaction) {
            this.execute(SQL`commit;`);
          }
        } catch (error1) {
          error = error1;
          if (this.db.inTransaction) {
            this.execute(SQL`rollback;`);
          }
        }
        // try @execute SQL"rollback;" if @db.inTransaction catch error then null
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
  ignored_prototypes = Object.freeze([Object.getPrototypeOf({}), Object.getPrototypeOf(Object), Dbric_table_formatter, Dbric_classprop_absorber, Dbric]);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxxQkFBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxrQkFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTtJQUFBLG9CQUFBOzs7OztFQUtBLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDLEVBTEE7Ozs7RUFTQSxVQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixFQVRsQzs7O0VBV0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsOEJBQVIsQ0FBbEMsRUFYQTs7O0VBYUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRGxDOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLENBQUUsT0FBQSxDQUFRLDhCQUFS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QyxjQUFQLENBQXNCLENBQUEsQ0FBdEIsQ0FEK0IsRUFFL0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBdEIsQ0FGK0IsRUFHakMscUJBSGlDLEVBSWpDLHdCQUppQyxFQUtqQyxLQUxpQyxDQUFkLEVBeGNyQjs7O0VBa2RBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2YsS0FEZTtJQUVmLEdBRmU7SUFHZixHQUhlO0lBSWYsR0FKZTtJQUtmLEdBTGU7SUFNZixHQU5lO0lBT2YsSUFQZTtJQVFmLEtBUmU7SUFTZixPQVRlO0lBVWYsU0FWZTtJQVdmLFlBWGU7SUFZZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLGtCQUZnQixFQUdoQixPQUhnQixFQUloQixTQUpnQixDQUFQO0VBWkk7QUFsZGpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuIyBEYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICdub2RlOnNxbGl0ZScgKS5EYXRhYmFzZVN5bmNcbkRiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdiZXR0ZXItc3FsaXRlMydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbGV0c2ZyZWV6ZXRoYXQtaW5mcmEuYnJpY3MnICkucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgICAgICAgIH0gPSByZXF1aXJlICcuL3Byb3RvdHlwZS10b29scydcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbnsgRGJyaWNfdGFibGVfZm9ybWF0dGVyLCAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXRhYmxlLWZvcm1hdHRlcidcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuIyAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4jIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4jICAgd2hpbGUgeD9cbiMgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuIyAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4jICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiMgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuIyAgIF4gXFxzKlxuIyAgIGluc2VydCB8IChcbiMgICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4jICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4jICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuIyAgICAgKVxuIyAgIC8vL2lzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGVtcGxhdGVzID1cbiAgZGJyaWNfY2ZnOlxuICAgIGRiX3BhdGg6ICAgICAgICAnOm1lbW9yeTonXG4gICAgcmVidWlsZDogICAgICAgIGZhbHNlXG4gICAgcHJlZml4OiAgICAgICAgIG1pc2ZpdFxuICAgICMgb3ZlcndyaXRlOiAgICAgIG1pc2ZpdFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlciBleHRlbmRzIERicmljX3RhYmxlX2Zvcm1hdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHByZWZpeDogICAgbnVsbFxuICAjIEBvdmVyd3JpdGU6IGZhbHNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcmVzb2x2ZV9mdW5jdGlvbjogKCB4ICkgLT4gaWYgKCAoIHR5cGVfb2YgeCApIGlzICdmdW5jdGlvbicgKSB0aGVuICggeC5jYWxsIEAgKSBlbHNlIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHk6ICggeCApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18xJywgdHlwZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggZGVsdGEgPSB4Lmxlbmd0aCAtICggbmV3IFNldCB4ICkuc2l6ZSApIGlzIDBcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3VuaXF1ZV9saXN0X2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzInLCBkZWx0YVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggaWR4X29mX21lID0geC5pbmRleE9mICdtZScgKSA+ICggaWR4X29mX3Byb3RvdHlwZXMgPSB4LmluZGV4T2YgJ3Byb3RvdHlwZXMnIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX21lX2JlZm9yZV9wcm90b3R5cGVzX2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzMnLCBpZHhfb2ZfbWUsIGlkeF9vZl9wcm90b3R5cGVzXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZWxlbWVudCwgZWxlbWVudF9pZHggaW4geFxuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAnbWUnXG4gICAgICBjb250aW51ZSBpZiBlbGVtZW50IGlzICdwcm90b3R5cGVzJ1xuICAgICAgdW5sZXNzIGVsZW1lbnQ/XG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX29iamVjdF9vcl9wbGFjZWhvbGRlcl9mb3JfcGx1Z2luICfOqWRicmljbV9fXzQnLCBlbGVtZW50X2lkeFxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIGVsZW1lbnQsICdleHBvcnRzJ1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfd2l0aF9leHBvcnRzX2Zvcl9wbHVnaW4gJ86pZGJyaWNtX19fNScsIGVsZW1lbnRfaWR4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4geFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9hY3F1aXNpdGlvbl9jaGFpbjogLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gW11cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHByb3RvdHlwZXMgID0gZ2V0X3Byb3RvdHlwZV9jaGFpbiBjbGFzelxuICAgIHByb3RvdHlwZXMgID0gKCBwIGZvciBwIGluIHByb3RvdHlwZXMgd2hlbiAoIHAgaXNudCBjbGFzeiApIGFuZCBwIG5vdCBpbiBpZ25vcmVkX3Byb3RvdHlwZXMgKS5yZXZlcnNlKClcbiAgICBwbHVnaW5zICAgICA9IGNsYXN6LnBsdWdpbnMgPyBbXVxuICAgIHBsdWdpbnMudW5zaGlmdCAncHJvdG90eXBlcycgIHVubGVzcyAncHJvdG90eXBlcycgaW4gcGx1Z2luc1xuICAgIHBsdWdpbnMucHVzaCAgICAnbWUnICAgICAgICAgIHVubGVzcyAnbWUnICAgICAgICAgaW4gcGx1Z2luc1xuICAgIEBfdmFsaWRhdGVfcGx1Z2luc19wcm9wZXJ0eSBwbHVnaW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZW50cnkgaW4gcGx1Z2luc1xuICAgICAgc3dpdGNoIGVudHJ5XG4gICAgICAgIHdoZW4gJ21lJ1xuICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogY2xhc3osIH1cbiAgICAgICAgd2hlbiAncHJvdG90eXBlcydcbiAgICAgICAgICBmb3IgcHJvdG90eXBlIGluIHByb3RvdHlwZXNcbiAgICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogcHJvdG90eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncGx1Z2luJywgY29udHJpYnV0b3I6IGVudHJ5LCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGFjcXVpc2l0aW9uX2NoYWluID0gQF9nZXRfYWNxdWlzaXRpb25fY2hhaW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgICAgICAgPVxuICAgICAgYnVpbGQ6ICAgICAgICAgICAgICAgIFtdXG4gICAgICBzdGF0ZW1lbnRzOiAgICAgICAgICAge31cbiAgICAgIGZ1bmN0aW9uczogICAgICAgICAgICB7fVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uczogIHt9XG4gICAgICB3aW5kb3dfZnVuY3Rpb25zOiAgICAge31cbiAgICAgIHRhYmxlX2Z1bmN0aW9uczogICAgICB7fVxuICAgICAgdmlydHVhbF90YWJsZXM6ICAgICAgIHt9XG4gICAgICBtZXRob2RzOiAgICAgICAgICAgICAge31cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciB7IHR5cGUsIGNvbnRyaWJ1dG9yLCB9IGluIGFjcXVpc2l0aW9uX2NoYWluXG4gICAgICBzb3VyY2UgPSBpZiB0eXBlIGlzICdwbHVnaW4nIHRoZW4gY29udHJpYnV0b3IuZXhwb3J0cyBlbHNlIGNvbnRyaWJ1dG9yXG4gICAgICBpZiAoIE9iamVjdC5oYXNPd24gc291cmNlLCAnYnVpbGQnIClcbiAgICAgICAgUi5idWlsZC5wdXNoIGl0ZW0gZm9yIGl0ZW0gaW4gKCBAX3Jlc29sdmVfZnVuY3Rpb24gc291cmNlLmJ1aWxkID8gW10gKVxuICAgICAgZm9yIHByb3BlcnR5X25hbWUsIHRhcmdldCBvZiBSXG4gICAgICAgIGNvbnRpbnVlIGlmICggcHJvcGVydHlfbmFtZSBpcyAnYnVpbGQnIClcbiAgICAgICAgY29udGludWUgaWYgKCBwcm9wZXJ0eV9uYW1lIGlzICdtZXRob2RzJyApIGFuZCAoIHR5cGUgaXNudCAncGx1Z2luJyApXG4gICAgICAgIGNvbnRpbnVlIGlmICggbm90IE9iamVjdC5oYXNPd24gc291cmNlLCBwcm9wZXJ0eV9uYW1lIClcbiAgICAgICAgIyMjIFRBSU5UIG1ha2Ugb3ZlcndyaXRpbmcgYmVoYXZpb3IgY29uZmlndXJhYmxlICMjI1xuICAgICAgICB0YXJnZXRbIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgb2YgKCBzb3VyY2VbIHByb3BlcnR5X25hbWUgXSA/IHt9IClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FwcGx5X2NvbnRyaWJ1dGlvbnM6IC0+XG4gICAgY2xhc3ogICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGNvbnRyaWJ1dGlvbnMgPSBAX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllcygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAX2FjcXVpcmVfbWV0aG9kcyAgICAgY29udHJpYnV0aW9uc1xuICAgIEBfY3JlYXRlX3VkZnMgICAgICAgICBjb250cmlidXRpb25zXG4gICAgQF9yZWJ1aWxkICAgICAgICAgICAgIGNvbnRyaWJ1dGlvbnMgaWYgQGNmZy5yZWJ1aWxkXG4gICAgQF9hY3F1aXJlX3N0YXRlbWVudHMgIGNvbnRyaWJ1dGlvbnNcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FjcXVpcmVfbWV0aG9kczogKCBjb250cmlidXRpb25zICkgLT5cbiAgICBmb3IgbWV0aG9kX25hbWUsIG1ldGhvZCBvZiBjb250cmlidXRpb25zLm1ldGhvZHNcbiAgICAgIGhpZGUgQCwgbWV0aG9kX25hbWUsIG1ldGhvZFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfYWNxdWlyZV9zdGF0ZW1lbnRzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIGNvbnRyaWJ1dGlvbnMuc3RhdGVtZW50c1xuICAgICAgdHJ5XG4gICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgQF9yZXNvbHZlX2Z1bmN0aW9uIHN0YXRlbWVudFxuICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX182IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgc3RhdGVtZW50ICN7cnByIHN0YXRlbWVudF9uYW1lfSwgXCIgXFxcbiAgICAgICAgICArIFwiYW4gZXJyb3Igb2NjdXJyZWQ7IG1heWJlIHlvdSBmb3Jnb3QgdG8gY2FsbCBgQHtjb25zdHJ1Y3Rvci5uYW1lfS5yZWJ1aWxkKClgPyBcIiBcXFxuICAgICAgICAgICsgXCJTZWUgYWJvdmUgY2F1c2UgZm9yIGRldGFpbHNcIiwgeyBjYXVzZSwgfVxuICAgIDtudWxsXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIFRFQVJET1dOICYgUkVCVUlMRFxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICBSID0ge31cbiAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVhcmRvd246IC0+XG4gICAgY291bnQgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGNvdW50KytcbiAgICAgIHRyeVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7SUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHdhcm4gXCLOqWRicmljbV9fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgIHJldHVybiBjb3VudFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3JlYnVpbGQ6ICggY29udHJpYnV0aW9ucyApIC0+XG4gICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICBAdGVhcmRvd24oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBjb250cmlidXRpb25zLmJ1aWxkXG4gICAgICAoIEBwcmVwYXJlIEBfcmVzb2x2ZV9mdW5jdGlvbiBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgO251bGxcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBVREZzXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV91ZGZzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGNhdGVnb3J5IGluIE9iamVjdC5rZXlzIG5hbWVzX29mX2NhbGxhYmxlc1xuICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiX2NyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGNvbnRyaWJ1dGlvbnNbIHByb3BlcnR5X25hbWUgXVxuICAgICAgICBmbl9jZmcgPSBAX3Jlc29sdmVfZnVuY3Rpb24gZm5fY2ZnXG4gICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgZm9yIG5hbWVfb2ZfY2FsbGFibGUgaW4gbmFtZXNfb2ZfY2FsbGFibGVzWyBjYXRlZ29yeSBdXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X3VkZl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX184IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgdmFsdWUsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX185IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzExIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzEyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgc3RlcCxcbiAgICAgIGludmVyc2UsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTQgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGNvbHVtbnMsXG4gICAgICByb3dzLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE2IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9nZXRfdWRmX25hbWVzKCkuaGFzIG5hbWUgKVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE3IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpYyBleHRlbmRzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGZ1bmN0aW9uczogICAgICAge31cbiAgQHN0YXRlbWVudHM6ICAgICAge31cbiAgQGJ1aWxkOiAgICAgICAgICAgbnVsbFxuICBAcGx1Z2luczogICAgICAgICBudWxsXG4gICMgQG92ZXJ3cml0ZTogICAgICAgZmFsc2VcbiAgIyBAcHJlZml4OiAgICAgICAgICBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcmVidWlsZDogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5kYnJpY19jZmcsIH0sICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICBjZmcucmVidWlsZCA9IHRydWVcbiAgICByZXR1cm4gbmV3IEAgY2ZnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgTk9URSB0aGlzIHVudXN1YWwgYXJyYW5nZW1lbnQgaXMgc29sZWx5IHRoZXJlIHNvIHdlIGNhbiBjYWxsIGBzdXBlcigpYCBmcm9tIGFuIGluc3RhbmNlIG1ldGhvZCAjIyNcbiAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgc3VwZXIoKVxuICAgIHJldHVybiBAX2NvbnN0cnVjdG9yIFAuLi5cbiAgX2NvbnN0cnVjdG9yOiBuZmEgeyB0ZW1wbGF0ZTogdGVtcGxhdGVzLmRicmljX2NmZywgfSwgKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IERiX2FkYXB0ZXIgZGJfcGF0aFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZXh0cmEgICAgICAgICAgICAgICAgICAgICA9IHt9XG4gICAgY2ZnICAgICAgICAgICAgICAgICAgICAgICA9IHsgdGVtcGxhdGVzLmRicmljX2NmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgY2ZnLnByZWZpeCAgICAgICAgICAgICAgICA9IGNsYXN6LnByZWZpeCAgICBpZiBjZmcucHJlZml4ICAgICBpcyBtaXNmaXRcbiAgICAjIGNmZy5vdmVyd3JpdGUgICAgICAgICAgICAgPSBjbGFzei5vdmVyd3JpdGUgaWYgY2ZnLm92ZXJ3cml0ZSAgaXMgbWlzZml0XG4gICAgQGNmZyAgICAgICAgICAgICAgICAgICAgICA9IGZyZWV6ZSBjZmdcbiAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgQF9hcHBseV9jb250cmlidXRpb25zKClcbiAgICA7dW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xOCBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHRyeVxuICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgIGNhdGNoIGNhdXNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTkgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3aXRoX3RyYW5zYWN0aW9uOiAoIGYgKSAtPlxuICAjIHdpdGhfdHJhbnNhY3Rpb246ICggY2ZnLCBmICkgLT5cbiAgIyAgIHN3aXRjaCBhcml0eSA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgIyAgICAgd2hlbiAxIHRoZW4gWyBjZmcsIGYsIF0gPSBbIG51bGwsIGNmZywgXVxuICAjICAgICB3aGVuIDIgdGhlbiBudWxsXG4gICMgICAgIGVsc2UgdGhyb3cgbmV3IEUuREJheV93cm9uZ19hcml0eSAnXmRiYXkvY3R4QDReJywgJ3dpdGhfdHJhbnNhY3Rpb24oKScsIDEsIDIsIGFyaXR5XG4gICMgICBAdHlwZXMudmFsaWRhdGUuZGJheV93aXRoX3RyYW5zYWN0aW9uX2NmZyAoIGNmZyA9IHsgQGNvbnN0cnVjdG9yLkMuZGVmYXVsdHMuZGJheV93aXRoX3RyYW5zYWN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9IClcbiAgIyAgIEB0eXBlcy52YWxpZGF0ZS5mdW5jdGlvbiBmXG4gICAgY2ZnID0geyBtb2RlOiAnZGVmZXJyZWQnLCB9XG4gICAgdGhyb3cgbmV3IEUuRGJyaWNfbm9fbmVzdGVkX3RyYW5zYWN0aW9ucyAnzqlkYnJpY21fXzIwJyBpZiBAZGIuaW5UcmFuc2FjdGlvblxuICAgIEBleGVjdXRlIFNRTFwiYmVnaW4gI3tjZmcubW9kZX0gdHJhbnNhY3Rpb247XCJcbiAgICBlcnJvciA9IG51bGxcbiAgICB0cnlcbiAgICAgIFIgPSBmKClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGV4ZWN1dGUgU1FMXCJyb2xsYmFjaztcIiBpZiBAZGIuaW5UcmFuc2FjdGlvblxuICAgICAgdGhyb3cgZXJyb3JcbiAgICB0cnlcbiAgICAgIEBleGVjdXRlIFNRTFwiY29tbWl0O1wiICAgaWYgQGRiLmluVHJhbnNhY3Rpb25cbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGV4ZWN1dGUgU1FMXCJyb2xsYmFjaztcIiBpZiBAZGIuaW5UcmFuc2FjdGlvblxuICAgICAgIyB0cnkgQGV4ZWN1dGUgU1FMXCJyb2xsYmFjaztcIiBpZiBAZGIuaW5UcmFuc2FjdGlvbiBjYXRjaCBlcnJvciB0aGVuIG51bGxcbiAgICByZXR1cm4gUlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmlnbm9yZWRfcHJvdG90eXBlcyA9IE9iamVjdC5mcmVlemUgW1xuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fSApLFxuICAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiBPYmplY3QgKSxcbiAgRGJyaWNfdGFibGVfZm9ybWF0dGVyLFxuICBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXIsXG4gIERicmljLFxuICBdXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRGJyaWMsXG4gIFNRTCxcbiAgSUROLFxuICBMSVQsXG4gIFNRTCxcbiAgVkVDLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIGludGVybmFsczogZnJlZXplIHtcbiAgICBFLFxuICAgIGlnbm9yZWRfcHJvdG90eXBlcyxcbiAgICB0eXBlX29mLFxuICAgIHRlbXBsYXRlcywgfVxuICB9XG5cblxuXG4iXX0=
