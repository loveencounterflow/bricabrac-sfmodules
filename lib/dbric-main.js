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
            throw new Error(`Ωdbricm___6 when trying to prepare statement ${rpr(statement_name)}, ` + `an error occurred; maybe you forgot to call \`${this.constructor.name}.rebuild()\`? ` + "See above cause for details", {cause});
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLW1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxxQkFBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsMEJBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxrQkFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsSUFBQTtJQUFBLG9CQUFBOzs7OztFQUtBLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDLEVBTEE7Ozs7RUFTQSxVQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixFQVRsQzs7O0VBV0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsOEJBQVIsQ0FBbEMsRUFYQTs7O0VBYUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRGxDOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQWxDOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyw0QkFBM0MsQ0FBQSxDQUF5RSxDQUFDLE1BRDVHOztFQUVBLENBQUEsQ0FBRSwwQkFBRixFQUNFLG1CQURGLENBQUEsR0FDa0MsT0FBQSxDQUFRLG1CQUFSLENBRGxDOztFQUVBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQUEyRCxDQUFDLG9DQUE1RCxDQUFBLENBQWxDLEVBckJBOzs7OztFQXlCQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxnQkFBUixDQUFsQyxFQXpCQTs7O0VBMkJBLE1BQUEsR0FBa0MsTUFBQSxDQUFPLFFBQVAsRUEzQmxDOzs7RUE2QkEsQ0FBQSxDQUFFLElBQUYsRUFDRSxLQURGLEVBRUUsU0FGRixFQUdFLE9BSEYsRUFJRSxZQUpGLEVBS0UsR0FMRixFQU1FLEdBTkYsRUFPRSxHQVBGLEVBUUUsR0FSRixDQUFBLEdBUWtDLE9BQUEsQ0FBUSxtQkFBUixDQVJsQzs7RUFTQSxDQUFBLENBQUUscUJBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEseUJBQVIsQ0FBbEMsRUF0Q0E7OztFQXdDQSxrQkFBQSxHQUFrQyxLQXhDbEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWlFQSxTQUFBLEdBQ0U7SUFBQSxTQUFBLEVBQ0U7TUFBQSxPQUFBLEVBQWdCLFVBQWhCO01BQ0EsT0FBQSxFQUFnQixLQURoQjtNQUVBLE1BQUEsRUFBZ0I7SUFGaEIsQ0FERjs7O0lBTUEsbUJBQUEsRUFDRTtNQUFBLGFBQUEsRUFBZ0IsSUFBaEI7TUFDQSxPQUFBLEVBQWdCLEtBRGhCO01BRUEsVUFBQSxFQUFnQixLQUZoQjtNQUdBLFNBQUEsRUFBZ0I7SUFIaEIsQ0FQRjs7SUFZQSw2QkFBQSxFQUNFO01BQUEsYUFBQSxFQUFnQixJQUFoQjtNQUNBLE9BQUEsRUFBZ0IsS0FEaEI7TUFFQSxVQUFBLEVBQWdCLEtBRmhCO01BR0EsS0FBQSxFQUFnQixJQUhoQjtNQUlBLFNBQUEsRUFBZ0I7SUFKaEIsQ0FiRjs7SUFtQkEsMEJBQUEsRUFDRTtNQUFBLGFBQUEsRUFBZ0IsSUFBaEI7TUFDQSxPQUFBLEVBQWdCLEtBRGhCO01BRUEsVUFBQSxFQUFnQixLQUZoQjtNQUdBLEtBQUEsRUFBZ0IsSUFIaEI7TUFJQSxTQUFBLEVBQWdCO0lBSmhCLENBcEJGOztJQTBCQSx5QkFBQSxFQUNFO01BQUEsYUFBQSxFQUFnQixJQUFoQjtNQUNBLE9BQUEsRUFBZ0IsS0FEaEI7TUFFQSxVQUFBLEVBQWdCLEtBRmhCO01BR0EsU0FBQSxFQUFnQjtJQUhoQixDQTNCRjs7SUFnQ0Esd0JBQUEsRUFBMEIsQ0FBQTtFQWhDMUI7O0VBcUNJOztJQUFOLE1BQUEseUJBQUEsUUFBdUMsc0JBQXZDLENBQUE7Ozs7TUFPRSxpQkFBbUIsQ0FBRSxDQUFGLENBQUE7UUFBUyxJQUFLLENBQUUsT0FBQSxDQUFRLENBQVIsQ0FBRixDQUFBLEtBQWlCLFVBQXRCO2lCQUEwQyxDQUFDLENBQUMsSUFBRixDQUFPLElBQVAsRUFBMUM7U0FBQSxNQUFBO2lCQUEwRCxFQUExRDs7TUFBVCxDQUxyQjs7OztNQVNFLDBCQUE0QixDQUFFLENBQUYsQ0FBQTtBQUM5QixZQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsV0FBQSxFQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxHQUFBLEVBQUE7UUFBSSxJQUFPLENBQUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxDQUFSLENBQVQsQ0FBQSxLQUF3QixNQUEvQjtVQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsK0JBQU4sQ0FBc0MsYUFBdEMsRUFBcUQsSUFBckQsRUFEUjtTQUFKOztRQUdJLElBQU8sQ0FBRSxLQUFBLEdBQVEsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUFFLElBQUksR0FBSixDQUFRLENBQVIsQ0FBRixDQUFhLENBQUMsSUFBbkMsQ0FBQSxLQUE2QyxDQUFwRDtVQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsc0NBQU4sQ0FBNkMsYUFBN0MsRUFBNEQsS0FBNUQsRUFEUjtTQUhKOztRQU1JLE1BQU8sQ0FBRSxTQUFBLEdBQVksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFWLENBQWQsQ0FBQSxHQUFpQyxDQUFFLGlCQUFBLEdBQW9CLENBQUMsQ0FBQyxPQUFGLENBQVUsWUFBVixDQUF0QixFQUF4QztVQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsK0NBQU4sQ0FBc0QsYUFBdEQsRUFBcUUsU0FBckUsRUFBZ0YsaUJBQWhGLEVBRFI7U0FOSjs7UUFTSSxLQUFBLCtEQUFBOztVQUNFLElBQVksT0FBQSxLQUFXLElBQXZCO0FBQUEscUJBQUE7O1VBQ0EsSUFBWSxPQUFBLEtBQVcsWUFBdkI7QUFBQSxxQkFBQTs7VUFDQSxJQUFPLGVBQVA7WUFDRSxNQUFNLElBQUksQ0FBQyxDQUFDLCtDQUFOLENBQXNELGFBQXRELEVBQXFFLFdBQXJFLEVBRFI7O1VBRUEsS0FBTyxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosRUFBcUIsU0FBckIsQ0FBUDtZQUNFLE1BQU0sSUFBSSxDQUFDLENBQUMsNkNBQU4sQ0FBb0QsYUFBcEQsRUFBbUUsV0FBbkUsRUFEUjs7UUFMRixDQVRKOztBQWlCSSxlQUFPO01BbEJtQixDQVQ5Qjs7O01BOEJFLHNCQUF3QixDQUFBLENBQUE7QUFDMUIsWUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLEdBQUE7O1FBQ0ksQ0FBQSxHQUFjO1FBQ2QsS0FBQSxHQUFjLElBQUMsQ0FBQTtRQUNmLFVBQUEsR0FBYyxtQkFBQSxDQUFvQixLQUFwQjtRQUNkLFVBQUEsR0FBYzs7QUFBRTtVQUFBLEtBQUEsNENBQUE7O2dCQUEyQixDQUFFLENBQUEsS0FBTyxLQUFULENBQUEsaUJBQThCLG9CQUFUOzJCQUFoRDs7VUFBQSxDQUFBOztZQUFGLENBQStFLENBQUMsT0FBaEYsQ0FBQTtRQUNkLE9BQUEseUNBQThCO1FBQzlCLGlCQUFxRCxTQUFoQixpQkFBckM7VUFBQSxPQUFPLENBQUMsT0FBUixDQUFnQixZQUFoQixFQUFBOztRQUNBLGlCQUFxRCxTQUFoQixTQUFyQztVQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWdCLElBQWhCLEVBQUE7O1FBQ0EsSUFBQyxDQUFBLDBCQUFELENBQTRCLE9BQTVCLEVBUko7O1FBVUksS0FBQSx5Q0FBQTs7QUFDRSxrQkFBTyxLQUFQO0FBQUEsaUJBQ08sSUFEUDtjQUVJLENBQUMsQ0FBQyxJQUFGLENBQU87Z0JBQUUsSUFBQSxFQUFNLFdBQVI7Z0JBQXFCLFdBQUEsRUFBYTtjQUFsQyxDQUFQO0FBREc7QUFEUCxpQkFHTyxZQUhQO2NBSUksS0FBQSw4Q0FBQTs7Z0JBQ0UsQ0FBQyxDQUFDLElBQUYsQ0FBTztrQkFBRSxJQUFBLEVBQU0sV0FBUjtrQkFBcUIsV0FBQSxFQUFhO2dCQUFsQyxDQUFQO2NBREY7QUFERztBQUhQO2NBT0ksQ0FBQyxDQUFDLElBQUYsQ0FBTztnQkFBRSxJQUFBLEVBQU0sUUFBUjtnQkFBa0IsV0FBQSxFQUFhO2NBQS9CLENBQVA7QUFQSjtRQURGLENBVko7O0FBb0JJLGVBQU87TUFyQmUsQ0E5QjFCOzs7TUFzREUsK0JBQWlDLENBQUEsQ0FBQTtBQUNuQyxZQUFBLENBQUEsRUFBQSxpQkFBQSxFQUFBLEtBQUEsRUFBQSxXQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQTtRQUFJLEtBQUEsR0FBb0IsSUFBQyxDQUFBO1FBQ3JCLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxzQkFBRCxDQUFBLEVBRHhCOztRQUdJLENBQUEsR0FDRTtVQUFBLEtBQUEsRUFBc0IsRUFBdEI7VUFDQSxVQUFBLEVBQXNCLENBQUEsQ0FEdEI7VUFFQSxTQUFBLEVBQXNCLENBQUEsQ0FGdEI7VUFHQSxtQkFBQSxFQUFzQixDQUFBLENBSHRCO1VBSUEsZ0JBQUEsRUFBc0IsQ0FBQSxDQUp0QjtVQUtBLGVBQUEsRUFBc0IsQ0FBQSxDQUx0QjtVQU1BLGNBQUEsRUFBc0IsQ0FBQSxDQU50QjtVQU9BLE9BQUEsRUFBc0IsQ0FBQTtRQVB0QixFQUpOOztRQWFJLEtBQUEsbURBQUE7V0FBSSxDQUFFLElBQUYsRUFBUSxXQUFSO1VBQ0YsTUFBQSxHQUFZLElBQUEsS0FBUSxRQUFYLEdBQXlCLFdBQVcsQ0FBQyxPQUFyQyxHQUFrRDtVQUMzRCxJQUFLLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBZCxFQUFzQixPQUF0QixDQUFMO0FBQ0U7WUFBQSxLQUFBLHdDQUFBOztjQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBUixDQUFhLElBQWI7WUFBQSxDQURGOztVQUVBLEtBQUEsa0JBQUE7O1lBQ0UsSUFBYyxhQUFBLEtBQWlCLE9BQS9CO0FBQUEsdUJBQUE7O1lBQ0EsSUFBWSxDQUFFLGFBQUEsS0FBaUIsU0FBbkIsQ0FBQSxJQUFtQyxDQUFFLElBQUEsS0FBVSxRQUFaLENBQS9DO0FBQUEsdUJBQUE7O1lBQ0EsSUFBYyxDQUFJLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBZCxFQUFzQixhQUF0QixDQUFsQjtBQUFBLHVCQUFBOztBQUVBO1lBQUEsS0FBQSxXQUFBO2dDQUFBOztjQUFBLE1BQU0sQ0FBRSxHQUFGLENBQU4sR0FBZ0I7WUFBaEI7VUFMRjtRQUpGO0FBVUEsZUFBTztNQXhCd0IsQ0F0RG5DOzs7TUFpRkUsb0JBQXNCLENBQUEsQ0FBQTtBQUN4QixZQUFBLEtBQUEsRUFBQTtRQUFJLEtBQUEsR0FBZ0IsSUFBQyxDQUFBO1FBQ2pCLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLCtCQUFELENBQUEsRUFEcEI7O1FBR0ksSUFBQyxDQUFBLGdCQUFELENBQXNCLGFBQXRCO1FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBc0IsYUFBdEI7UUFDQSxJQUF1QyxJQUFDLENBQUEsR0FBRyxDQUFDLE9BQTVDO1VBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBc0IsYUFBdEIsRUFBQTs7UUFDQSxJQUFDLENBQUEsbUJBQUQsQ0FBc0IsYUFBdEI7ZUFDQztNQVJtQixDQWpGeEI7OztNQTRGRSxnQkFBa0IsQ0FBRSxhQUFGLENBQUE7QUFDcEIsWUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBO0FBQUk7UUFBQSxLQUFBLGtCQUFBOztVQUNFLElBQUEsQ0FBSyxJQUFMLEVBQVEsV0FBUixFQUFxQixNQUFyQjtRQURGO2VBRUM7TUFIZSxDQTVGcEI7OztNQWtHRSxtQkFBcUIsQ0FBRSxhQUFGLENBQUE7QUFDdkIsWUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQTtBQUFJO1FBQUEsS0FBQSxxQkFBQTs7QUFDRTtZQUNFLElBQUMsQ0FBQSxVQUFVLENBQUUsY0FBRixDQUFYLEdBQWdDLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLGlCQUFELENBQW1CLFNBQW5CLENBQVQsRUFEbEM7V0FFQSxjQUFBO1lBQU07WUFDSixNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksY0FBSixDQUFoRCxDQUFBLEVBQUEsQ0FBQSxHQUNaLENBQUEsOENBQUEsQ0FBQSxDQUFnRCxJQUFDLENBQUEsV0FBVyxDQUFDLElBQTdELENBQUEsY0FBQSxDQURZLEdBRVosNkJBRkUsRUFFNkIsQ0FBRSxLQUFGLENBRjdCLEVBRFI7O1FBSEY7ZUFPQztNQVJrQixDQWxHdkI7Ozs7O01BK0dFLGVBQWlCLENBQUEsQ0FBQTtBQUNuQixZQUFBLENBQUEsRUFBQTtRQUFJLENBQUEsR0FBSSxDQUFBO1FBQ0osS0FBQSw2RUFBQTtVQUNFLENBQUMsQ0FBRSxHQUFHLENBQUMsSUFBTixDQUFELEdBQWdCO1lBQUUsSUFBQSxFQUFNLEdBQUcsQ0FBQyxJQUFaO1lBQWtCLElBQUEsRUFBTSxHQUFHLENBQUM7VUFBNUI7UUFEbEI7QUFFQSxlQUFPO01BSlEsQ0EvR25COzs7TUFzSEUsUUFBVSxDQUFBLENBQUE7QUFDWixZQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUE7UUFBSSxLQUFBLEdBQVEsRUFBWjs7UUFFSSxDQUFFLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBRyxDQUFBLDBCQUFBLENBQVosQ0FBRixDQUE0QyxDQUFDLEdBQTdDLENBQUE7QUFDQTtRQUFBLEtBQUEsUUFBQTtXQUFPLENBQUUsSUFBRixFQUFRLElBQVI7VUFDTCxLQUFBO0FBQ0E7WUFDRSxDQUFFLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBRyxDQUFBLEtBQUEsQ0FBQSxDQUFRLElBQVIsRUFBQSxDQUFBLENBQWdCLEdBQUEsQ0FBSSxJQUFKLENBQWhCLEVBQUEsQ0FBWixDQUFGLENBQTJDLENBQUMsR0FBNUMsQ0FBQSxFQURGO1dBRUEsY0FBQTtZQUFNO1lBQ0osS0FBMEQsTUFBQSxDQUFBLENBQUEsY0FBQSxDQUFBLENBQXNCLElBQXRCLENBQUEsQ0FBQSxDQUFBLENBQWdDLENBQUMsSUFBakMsQ0FBc0MsS0FBSyxDQUFDLE9BQTVDLENBQTFEO2NBQUEsSUFBQSxDQUFLLENBQUEsMkJBQUEsQ0FBQSxDQUE4QixLQUFLLENBQUMsT0FBcEMsQ0FBQSxDQUFMLEVBQUE7YUFERjs7UUFKRjtRQU1BLENBQUUsSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFHLENBQUEseUJBQUEsQ0FBWixDQUFGLENBQTJDLENBQUMsR0FBNUMsQ0FBQTtBQUNBLGVBQU87TUFYQyxDQXRIWjs7O01Bb0lFLFFBQVUsQ0FBRSxhQUFGLENBQUE7QUFDWixZQUFBLGVBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQTtRQUFJLEtBQUEsR0FBUSxJQUFDLENBQUE7UUFDVCxJQUFDLENBQUEsUUFBRCxDQUFBO0FBRUE7O1FBQUEsS0FBQSxxQ0FBQTs7VUFDRSxDQUFFLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLGlCQUFELENBQW1CLGVBQW5CLENBQVQsQ0FBRixDQUErQyxDQUFDLEdBQWhELENBQUE7UUFERixDQUhKOztlQU1LO01BUE8sQ0FwSVo7Ozs7O01BaUpFLFlBQWMsQ0FBRSxhQUFGLENBQUE7QUFDaEIsWUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsV0FBQSxFQUFBLGtCQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7UUFBSSxrQkFBQSxHQUNFO1VBQUEsUUFBQSxFQUFzQixDQUFFLE9BQUYsQ0FBdEI7VUFDQSxrQkFBQSxFQUFzQixDQUFFLE9BQUYsRUFBVyxNQUFYLEVBQW1CLFFBQW5CLENBRHRCO1VBRUEsZUFBQSxFQUFzQixDQUFFLE9BQUYsRUFBVyxNQUFYLEVBQW1CLFNBQW5CLEVBQThCLFFBQTlCLENBRnRCO1VBR0EsY0FBQSxFQUFzQixDQUFFLE1BQUYsQ0FIdEI7VUFJQSxhQUFBLEVBQXNCLENBQUUsTUFBRjtRQUp0QjtBQU1GOztRQUFBLEtBQUEscUNBQUE7O1VBQ0UsYUFBQSxHQUFvQixDQUFBLENBQUEsQ0FBRyxRQUFILENBQUEsQ0FBQTtVQUNwQixXQUFBLEdBQW9CLENBQUEsUUFBQSxDQUFBLENBQVcsUUFBWCxDQUFBO0FBRXBCOztVQUFBLEtBQUEsZ0JBQUE7O1lBQ0UsTUFBQSxHQUFTLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQjtZQUNULE1BQUEsR0FBUyxJQUFBLENBQUssTUFBTCxFQUFhLENBQUUsQ0FBRixDQUFBLEdBQUE7QUFDOUIsa0JBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsZ0JBQUEsRUFBQTs7Z0JBQVUsQ0FBQyxDQUFDLE9BQVE7O0FBR1Y7OztjQUFBLEtBQUEsd0NBQUE7O2dCQUNFLElBQWdCLHdDQUFoQjtBQUFBLDJCQUFBOztnQkFDQSxDQUFDLENBQUUsZ0JBQUYsQ0FBRCxHQUF3QixRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7Y0FGMUI7QUFHQSxxQkFBTztZQVBhLENBQWI7WUFRVCxJQUFDLENBQUUsV0FBRixDQUFELENBQWlCLE1BQWpCO1VBVkY7UUFKRixDQVBKOztBQXVCSSxlQUFPO01BeEJLLENBakpoQjs7O01BNEtFLGNBQWdCLENBQUEsQ0FBQTtBQUFFLFlBQUE7ZUFBQyxJQUFJLEdBQUo7O0FBQVU7VUFBQSxLQUFBLDJFQUFBO2FBQVMsQ0FBRSxJQUFGO3lCQUFUO1VBQUEsQ0FBQTs7cUJBQVY7TUFBSCxDQTVLbEI7OztNQWdMRSxnQkFBa0IsQ0FBRSxHQUFGLENBQUE7QUFDcEIsWUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLFFBQVosQ0FBRixDQUFBLEtBQThCLFVBQWpDO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsd0NBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLEtBRkYsRUFHRSxVQUhGLEVBSUUsYUFKRixFQUtFLE9BTEYsQ0FBQSxHQUtzQixDQUFFLEdBQUEsU0FBUyxDQUFDLG1CQUFaLEVBQW9DLEdBQUEsR0FBcEMsQ0FMdEI7UUFNQSxJQUFHLENBQUUsQ0FBSSxTQUFOLENBQUEsSUFBc0IsQ0FBRSxJQUFDLENBQUEsY0FBRCxDQUFBLENBQWlCLENBQUMsR0FBbEIsQ0FBc0IsSUFBdEIsQ0FBRixDQUF6QjtVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSw2Q0FBQSxDQUFBLENBQWdELEdBQUEsQ0FBSSxJQUFKLENBQWhELENBQUEsMEJBQUEsQ0FBVixFQURSOztBQUVBLGVBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxRQUFKLENBQWEsSUFBYixFQUFtQixDQUFFLGFBQUYsRUFBaUIsT0FBakIsRUFBMEIsVUFBMUIsQ0FBbkIsRUFBNEQsS0FBNUQ7TUFYUyxDQWhMcEI7OztNQThMRSwwQkFBNEIsQ0FBRSxHQUFGLENBQUE7QUFDOUIsWUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUE7UUFBSSxJQUFHLENBQUUsT0FBQSxDQUFRLElBQUMsQ0FBQSxFQUFFLENBQUMsU0FBWixDQUFGLENBQUEsS0FBK0IsVUFBbEM7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkJBQUEsQ0FBQSxDQUFnQyxHQUFBLENBQUksSUFBQyxDQUFBLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBcEIsQ0FBaEMsQ0FBQSxrREFBQSxDQUFWLEVBRFI7O1FBRUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxTQURGLEVBRUUsS0FGRixFQUdFLElBSEYsRUFJRSxNQUpGLEVBS0UsVUFMRixFQU1FLGFBTkYsRUFPRSxPQVBGLENBQUEsR0FPc0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQyw2QkFBWixFQUE4QyxHQUFBLEdBQTlDLENBUHRCO1FBUUEsSUFBRyxDQUFFLENBQUksU0FBTixDQUFBLElBQXNCLENBQUUsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFpQixDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQUYsQ0FBekI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksSUFBSixDQUFoRCxDQUFBLDBCQUFBLENBQVYsRUFEUjs7QUFFQSxlQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsU0FBSixDQUFjLElBQWQsRUFBb0IsQ0FBRSxLQUFGLEVBQVMsSUFBVCxFQUFlLE1BQWYsRUFBdUIsYUFBdkIsRUFBc0MsT0FBdEMsRUFBK0MsVUFBL0MsQ0FBcEI7TUFibUIsQ0E5TDlCOzs7TUE4TUUsdUJBQXlCLENBQUUsR0FBRixDQUFBO0FBQzNCLFlBQUEsYUFBQSxFQUFBLFVBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQTtRQUFJLElBQUcsQ0FBRSxPQUFBLENBQVEsSUFBQyxDQUFBLEVBQUUsQ0FBQyxTQUFaLENBQUYsQ0FBQSxLQUErQixVQUFsQztVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSw2QkFBQSxDQUFBLENBQWdDLEdBQUEsQ0FBSSxJQUFDLENBQUEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFwQixDQUFoQyxDQUFBLCtDQUFBLENBQVYsRUFEUjs7UUFFQSxDQUFBLENBQUUsSUFBRixFQUNFLFNBREYsRUFFRSxLQUZGLEVBR0UsSUFIRixFQUlFLE9BSkYsRUFLRSxNQUxGLEVBTUUsVUFORixFQU9FLGFBUEYsRUFRRSxPQVJGLENBQUEsR0FRc0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQywwQkFBWixFQUEyQyxHQUFBLEdBQTNDLENBUnRCO1FBU0EsSUFBRyxDQUFFLENBQUksU0FBTixDQUFBLElBQXNCLENBQUUsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFpQixDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQUYsQ0FBekI7VUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksSUFBSixDQUFoRCxDQUFBLDBCQUFBLENBQVYsRUFEUjs7QUFFQSxlQUFPLElBQUMsQ0FBQSxFQUFFLENBQUMsU0FBSixDQUFjLElBQWQsRUFBb0IsQ0FBRSxLQUFGLEVBQVMsSUFBVCxFQUFlLE9BQWYsRUFBd0IsTUFBeEIsRUFBZ0MsYUFBaEMsRUFBK0MsT0FBL0MsRUFBd0QsVUFBeEQsQ0FBcEI7TUFkZ0IsQ0E5TTNCOzs7TUErTkUsc0JBQXdCLENBQUUsR0FBRixDQUFBO0FBQzFCLFlBQUEsT0FBQSxFQUFBLGFBQUEsRUFBQSxVQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUEsSUFBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQVosQ0FBRixDQUFBLEtBQTJCLFVBQTlCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEscURBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLFVBRkYsRUFHRSxPQUhGLEVBSUUsSUFKRixFQUtFLFVBTEYsRUFNRSxhQU5GLEVBT0UsT0FQRixDQUFBLEdBT3NCLENBQUUsR0FBQSxTQUFTLENBQUMseUJBQVosRUFBMEMsR0FBQSxHQUExQyxDQVB0QjtRQVFBLElBQUcsQ0FBRSxDQUFJLFNBQU4sQ0FBQSxJQUFzQixDQUFFLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixJQUF0QixDQUFGLENBQXpCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZDQUFBLENBQUEsQ0FBZ0QsR0FBQSxDQUFJLElBQUosQ0FBaEQsQ0FBQSwwQkFBQSxDQUFWLEVBRFI7O0FBRUEsZUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUosQ0FBVSxJQUFWLEVBQWdCLENBQUUsVUFBRixFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsYUFBN0IsRUFBNEMsT0FBNUMsRUFBcUQsVUFBckQsQ0FBaEI7TUFiZSxDQS9OMUI7OztNQStPRSxxQkFBdUIsQ0FBRSxHQUFGLENBQUE7QUFDekIsWUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBO1FBQUksSUFBRyxDQUFFLE9BQUEsQ0FBUSxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQVosQ0FBRixDQUFBLEtBQTJCLFVBQTlCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZCQUFBLENBQUEsQ0FBZ0MsR0FBQSxDQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQXBCLENBQWhDLENBQUEsNkNBQUEsQ0FBVixFQURSOztRQUVBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsU0FERixFQUVFLE1BRkYsQ0FBQSxHQUVnQixDQUFFLEdBQUEsU0FBUyxDQUFDLHdCQUFaLEVBQXlDLEdBQUEsR0FBekMsQ0FGaEI7UUFHQSxJQUFHLENBQUUsQ0FBSSxTQUFOLENBQUEsSUFBc0IsQ0FBRSxJQUFDLENBQUEsY0FBRCxDQUFBLENBQWlCLENBQUMsR0FBbEIsQ0FBc0IsSUFBdEIsQ0FBRixDQUF6QjtVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSw2Q0FBQSxDQUFBLENBQWdELEdBQUEsQ0FBSSxJQUFKLENBQWhELENBQUEsMEJBQUEsQ0FBVixFQURSOztBQUVBLGVBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxLQUFKLENBQVUsSUFBVixFQUFnQixNQUFoQjtNQVJjOztJQWpQekI7OztJQUdFLHdCQUFDLENBQUEsTUFBRCxHQUFZOzs7Ozs7RUEwUFI7O0lBQU4sTUFBQSxNQUFBLFFBQW9CLHlCQUFwQixDQUFBOzs7TUFpQkUsV0FBYSxDQUFBLEdBQUUsQ0FBRixDQUFBO2FBQ1gsQ0FBQTtBQUNBLGVBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFBLENBQWQ7TUFGSSxDQWZmOzs7TUF1Q0UsYUFBZSxDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUEsWUFBYSxJQUFDLENBQUE7TUFBdkIsQ0F2Q2pCOzs7TUEwQ0Usb0JBQXNCLENBQUEsQ0FBQSxFQUFBOztRQUVwQixDQUFFLElBQUMsQ0FBQSxFQUFFLENBQUMsT0FBSixDQUFZLEdBQUcsQ0FBQSwwQkFBQSxDQUFmLENBQUYsQ0FBaUQsQ0FBQyxHQUFsRCxDQUFBO1FBQ0EsQ0FBRSxJQUFDLENBQUEsRUFBRSxDQUFDLE9BQUosQ0FBWSxHQUFHLENBQUEseUJBQUEsQ0FBZixDQUFGLENBQWlELENBQUMsR0FBbEQsQ0FBQTtRQUNBLENBQUUsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFBLDRCQUFBLENBQWYsQ0FBRixDQUFpRCxDQUFDLEdBQWxELENBQUE7UUFDQSxDQUFFLElBQUMsQ0FEcUQsZ0JBQ3JELEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFBLHlCQUFBLENBQWYsQ0FBRixDQUFpRCxDQUFDLEdBQWxELENBQUEsRUFKSjs7O2VBT0s7TUFSbUIsQ0ExQ3hCOzs7TUFxREUsT0FBUyxDQUFFLEdBQUYsQ0FBQTtlQUFXLElBQUMsQ0FBQSxFQUFFLENBQUMsSUFBSixDQUFTLEdBQVQ7TUFBWCxDQXJEWDs7O01Bd0RFLElBQVksQ0FBRSxHQUFGLEVBQUEsR0FBTyxDQUFQLENBQUE7ZUFBaUIsQ0FBRSxJQUFDLENBQUEsT0FBRCxDQUFTLEdBQVQsQ0FBRixDQUFnQixDQUFDLE9BQWpCLENBQXlCLEdBQUEsQ0FBekI7TUFBakI7O01BQ1osT0FBWSxDQUFFLEdBQUYsRUFBQSxHQUFPLENBQVAsQ0FBQTtlQUFpQixDQUFFLEdBQUEsQ0FBRSxJQUFDLENBQUEsSUFBRCxDQUFNLEdBQU4sRUFBVyxHQUFBLENBQVgsQ0FBRixDQUFGO01BQWpCOztNQUNaLFNBQVksQ0FBRSxHQUFGLEVBQUEsR0FBTyxDQUFQLENBQUE7QUFBZ0IsWUFBQTtvRUFBK0I7TUFBL0MsQ0ExRGQ7OztNQTZERSxPQUFTLENBQUUsR0FBRixDQUFBO0FBQ1gsWUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUE7UUFBSSxJQUFjLElBQUMsQ0FBQSxhQUFELENBQWUsR0FBZixDQUFkO0FBQUEsaUJBQU8sSUFBUDs7UUFDQSxJQUFPLENBQUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxHQUFSLENBQVQsQ0FBQSxLQUEwQixNQUFqQztVQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxrREFBQSxDQUFBLENBQXFELElBQXJELENBQUEsQ0FBVixFQURSOztBQUVBO1VBQ0UsQ0FBQSxHQUFJLElBQUMsQ0FBQSxFQUFFLENBQUMsT0FBSixDQUFZLEdBQVosRUFETjtTQUVBLGNBQUE7VUFBTTtVQUNKLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxtRkFBQSxDQUFBLENBQXNGLEdBQUEsQ0FBSSxLQUFLLENBQUMsT0FBVixDQUF0RixDQUFBLGFBQUEsQ0FBQSxDQUF1SCxHQUFBLENBQUksR0FBSixDQUF2SCxDQUFBLENBQVYsRUFBNEksQ0FBRSxLQUFGLENBQTVJLEVBRFI7O1FBRUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQOzs7Ozs7OytCQUErRDtBQUMvRCxlQUFPO01BVEEsQ0E3RFg7OztNQXlFRSxnQkFBa0IsQ0FBRSxDQUFGLENBQUE7QUFDcEIsWUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEtBQUE7Ozs7Ozs7O1FBT0ksR0FBQSxHQUFNO1VBQUUsSUFBQSxFQUFNO1FBQVI7UUFDTixJQUEwRCxJQUFDLENBQUEsRUFBRSxDQUFDLGFBQTlEO1VBQUEsTUFBTSxJQUFJLENBQUMsQ0FBQyw0QkFBTixDQUFtQyxhQUFuQyxFQUFOOztRQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBRyxDQUFBLE1BQUEsQ0FBQSxDQUFTLEdBQUcsQ0FBQyxJQUFiLENBQUEsYUFBQSxDQUFaO1FBQ0EsS0FBQSxHQUFRO0FBQ1I7VUFDRSxDQUFBLEdBQUksQ0FBQSxDQUFBLEVBRE47U0FFQSxjQUFBO1VBQU07VUFDSixJQUEyQixJQUFDLENBQUEsRUFBRSxDQUFDLGFBQS9CO1lBQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFHLENBQUEsU0FBQSxDQUFaLEVBQUE7O1VBQ0EsTUFBTSxNQUZSOztBQUdBO1VBQ0UsSUFBMkIsSUFBQyxDQUFBLEVBQUUsQ0FBQyxhQUEvQjtZQUFBLElBQUMsQ0FBQSxPQUFELENBQVMsR0FBRyxDQUFBLE9BQUEsQ0FBWixFQUFBO1dBREY7U0FFQSxjQUFBO1VBQU07VUFDSixJQUEyQixJQUFDLENBQUEsRUFBRSxDQUFDLGFBQS9CO1lBQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFHLENBQUEsU0FBQSxDQUFaLEVBQUE7V0FERjtTQWxCSjs7QUFxQkksZUFBTztNQXRCUzs7SUEzRXBCOzs7SUFHRSxLQUFDLENBQUEsU0FBRCxHQUFrQixDQUFBOztJQUNsQixLQUFDLENBQUEsVUFBRCxHQUFrQixDQUFBOztJQUNsQixLQUFDLENBQUEsS0FBRCxHQUFrQjs7SUFDbEIsS0FBQyxDQUFBLE9BQUQsR0FBa0I7Ozs7OztJQUtsQixLQUFDLENBQUEsT0FBRCxHQUFVLEdBQUEsQ0FBSTtNQUFFLFFBQUEsRUFBVSxTQUFTLENBQUM7SUFBdEIsQ0FBSixFQUF3QyxRQUFBLENBQUUsT0FBRixFQUFXLEdBQVgsQ0FBQTtNQUNoRCxHQUFHLENBQUMsT0FBSixHQUFjO0FBQ2QsYUFBTyxJQUFJLElBQUosQ0FBTSxHQUFOO0lBRnlDLENBQXhDOztvQkFTVixZQUFBLEdBQWMsR0FBQSxDQUFJO01BQUUsUUFBQSxFQUFVLFNBQVMsQ0FBQztJQUF0QixDQUFKLEVBQXdDLFFBQUEsQ0FBRSxPQUFGLEVBQVcsR0FBWCxDQUFBO0FBQ3hELFVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBOzs7UUFDSSxVQUE0QjtPQURoQzs7TUFHSSxLQUFBLEdBQTRCLElBQUMsQ0FBQTtNQUM3QixJQUFBLENBQUssSUFBTCxFQUFRLElBQVIsRUFBNEIsSUFBSSxVQUFKLENBQWUsT0FBZixDQUE1QixFQUpKOztNQU1JLEtBQUEsR0FBNEIsQ0FBQTtNQUM1QixHQUFBLEdBQTRCLENBQUUsR0FBQSxTQUFTLENBQUMsU0FBWixFQUEwQixPQUExQixFQUFtQyxHQUFBLEdBQW5DO01BQzVCLElBQStDLEdBQUcsQ0FBQyxNQUFKLEtBQWtCLE1BQWpFO1FBQUEsR0FBRyxDQUFDLE1BQUosR0FBNEIsS0FBSyxDQUFDLE9BQWxDO09BUko7O01BVUksSUFBQyxDQUFBLEdBQUQsR0FBNEIsTUFBQSxDQUFPLEdBQVA7TUFDNUIsSUFBQSxDQUFLLElBQUwsRUFBUSxZQUFSLEVBQTRCLENBQUEsQ0FBNUI7TUFDQSxJQUFBLENBQUssSUFBTCxFQUFRLGtCQUFSLEVBQTRCLENBQUUsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFBLFNBQUEsQ0FBZixDQUFGLENBQThCLENBQUMsV0FBM0Q7TUFDQSxJQUFBLENBQUssSUFBTCxFQUFRLE9BQVIsNkRBQTZDO1FBQUUsT0FBQSxFQUFTO01BQVgsQ0FBN0MsRUFiSjs7TUFlSSxJQUFDLENBQUEsb0JBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxvQkFBRCxDQUFBO2FBQ0M7SUFsQm1ELENBQXhDOzs7O2dCQXhYaEI7OztFQXdjQSxrQkFBQSxHQUFxQixNQUFNLENBQUMsTUFBUCxDQUFjLENBQy9CLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQUEsQ0FBdEIsQ0FEK0IsRUFFL0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsTUFBdEIsQ0FGK0IsRUFHakMscUJBSGlDLEVBSWpDLHdCQUppQyxFQUtqQyxLQUxpQyxDQUFkLEVBeGNyQjs7O0VBa2RBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2YsS0FEZTtJQUVmLEdBRmU7SUFHZixHQUhlO0lBSWYsR0FKZTtJQUtmLEdBTGU7SUFNZixHQU5lO0lBT2YsSUFQZTtJQVFmLEtBUmU7SUFTZixPQVRlO0lBVWYsU0FWZTtJQVdmLFlBWGU7SUFZZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLENBRGdCLEVBRWhCLGtCQUZnQixFQUdoQixPQUhnQixFQUloQixTQUpnQixDQUFQO0VBWkk7QUFsZGpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuIyBEYl9hZGFwdGVyICAgICAgICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICdub2RlOnNxbGl0ZScgKS5EYXRhYmFzZVN5bmNcbkRiX2FkYXB0ZXIgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdiZXR0ZXItc3FsaXRlMydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxueyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgbGV0cyxcbiAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbGV0c2ZyZWV6ZXRoYXQtaW5mcmEuYnJpY3MnICkucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxueyBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZ2V0X3Byb3RvdHlwZV9jaGFpbiwgICAgICAgIH0gPSByZXF1aXJlICcuL3Byb3RvdHlwZS10b29scydcbnsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cy1icmljcycgKS5yZXF1aXJlX25vcm1hbGl6ZV9mdW5jdGlvbl9hcmd1bWVudHMoKVxuIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuIyB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2NvYXJzZS1zcWxpdGUtc3RhdGVtZW50LXNlZ21lbnRlci5icmljcycgKS5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxubWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IFRydWUsXG4gIEZhbHNlLFxuICBmcm9tX2Jvb2wsXG4gIGFzX2Jvb2wsXG4gIHVucXVvdGVfbmFtZSxcbiAgSUROLFxuICBMSVQsXG4gIFZFQyxcbiAgU1FMLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXV0aWxpdGllcydcbnsgRGJyaWNfdGFibGVfZm9ybWF0dGVyLCAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLXRhYmxlLWZvcm1hdHRlcidcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaWdub3JlZF9wcm90b3R5cGVzICAgICAgICAgICAgICA9IG51bGxcblxuXG4jICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuIyAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiMgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4jIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4jICAgd2hpbGUgeD9cbiMgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuIyAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4jICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiMgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuIyAgIF4gXFxzKlxuIyAgIGluc2VydCB8IChcbiMgICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4jICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4jICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuIyAgICAgKVxuIyAgIC8vL2lzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGVtcGxhdGVzID1cbiAgZGJyaWNfY2ZnOlxuICAgIGRiX3BhdGg6ICAgICAgICAnOm1lbW9yeTonXG4gICAgcmVidWlsZDogICAgICAgIGZhbHNlXG4gICAgcHJlZml4OiAgICAgICAgIG1pc2ZpdFxuICAgICMgb3ZlcndyaXRlOiAgICAgIG1pc2ZpdFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX2NsYXNzcHJvcF9hYnNvcmJlciBleHRlbmRzIERicmljX3RhYmxlX2Zvcm1hdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHByZWZpeDogICAgbnVsbFxuICAjIEBvdmVyd3JpdGU6IGZhbHNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfcmVzb2x2ZV9mdW5jdGlvbjogKCB4ICkgLT4gaWYgKCAoIHR5cGVfb2YgeCApIGlzICdmdW5jdGlvbicgKSB0aGVuICggeC5jYWxsIEAgKSBlbHNlIHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGluZyAjIyNcbiAgX3ZhbGlkYXRlX3BsdWdpbnNfcHJvcGVydHk6ICggeCApIC0+XG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfbGlzdF9mb3JfcGx1Z2lucyAnzqlkYnJpY21fX18xJywgdHlwZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggZGVsdGEgPSB4Lmxlbmd0aCAtICggbmV3IFNldCB4ICkuc2l6ZSApIGlzIDBcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3VuaXF1ZV9saXN0X2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzInLCBkZWx0YVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzICggaWR4X29mX21lID0geC5pbmRleE9mICdtZScgKSA+ICggaWR4X29mX3Byb3RvdHlwZXMgPSB4LmluZGV4T2YgJ3Byb3RvdHlwZXMnIClcbiAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX21lX2JlZm9yZV9wcm90b3R5cGVzX2Zvcl9wbHVnaW5zICfOqWRicmljbV9fXzMnLCBpZHhfb2ZfbWUsIGlkeF9vZl9wcm90b3R5cGVzXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZWxlbWVudCwgZWxlbWVudF9pZHggaW4geFxuICAgICAgY29udGludWUgaWYgZWxlbWVudCBpcyAnbWUnXG4gICAgICBjb250aW51ZSBpZiBlbGVtZW50IGlzICdwcm90b3R5cGVzJ1xuICAgICAgdW5sZXNzIGVsZW1lbnQ/XG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX29iamVjdF9vcl9wbGFjZWhvbGRlcl9mb3JfcGx1Z2luICfOqWRicmljbV9fXzQnLCBlbGVtZW50X2lkeFxuICAgICAgdW5sZXNzIFJlZmxlY3QuaGFzIGVsZW1lbnQsICdleHBvcnRzJ1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9vYmplY3Rfd2l0aF9leHBvcnRzX2Zvcl9wbHVnaW4gJ86pZGJyaWNtX19fNScsIGVsZW1lbnRfaWR4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4geFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF9hY3F1aXNpdGlvbl9jaGFpbjogLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gW11cbiAgICBjbGFzeiAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIHByb3RvdHlwZXMgID0gZ2V0X3Byb3RvdHlwZV9jaGFpbiBjbGFzelxuICAgIHByb3RvdHlwZXMgID0gKCBwIGZvciBwIGluIHByb3RvdHlwZXMgd2hlbiAoIHAgaXNudCBjbGFzeiApIGFuZCBwIG5vdCBpbiBpZ25vcmVkX3Byb3RvdHlwZXMgKS5yZXZlcnNlKClcbiAgICBwbHVnaW5zICAgICA9IGNsYXN6LnBsdWdpbnMgPyBbXVxuICAgIHBsdWdpbnMudW5zaGlmdCAncHJvdG90eXBlcycgIHVubGVzcyAncHJvdG90eXBlcycgaW4gcGx1Z2luc1xuICAgIHBsdWdpbnMucHVzaCAgICAnbWUnICAgICAgICAgIHVubGVzcyAnbWUnICAgICAgICAgaW4gcGx1Z2luc1xuICAgIEBfdmFsaWRhdGVfcGx1Z2luc19wcm9wZXJ0eSBwbHVnaW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZW50cnkgaW4gcGx1Z2luc1xuICAgICAgc3dpdGNoIGVudHJ5XG4gICAgICAgIHdoZW4gJ21lJ1xuICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogY2xhc3osIH1cbiAgICAgICAgd2hlbiAncHJvdG90eXBlcydcbiAgICAgICAgICBmb3IgcHJvdG90eXBlIGluIHByb3RvdHlwZXNcbiAgICAgICAgICAgIFIucHVzaCB7IHR5cGU6ICdwcm90b3R5cGUnLCBjb250cmlidXRvcjogcHJvdG90eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBSLnB1c2ggeyB0eXBlOiAncGx1Z2luJywgY29udHJpYnV0b3I6IGVudHJ5LCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllczogLT5cbiAgICBjbGFzeiAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGFjcXVpc2l0aW9uX2NoYWluID0gQF9nZXRfYWNxdWlzaXRpb25fY2hhaW4oKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgICAgICAgPVxuICAgICAgYnVpbGQ6ICAgICAgICAgICAgICAgIFtdXG4gICAgICBzdGF0ZW1lbnRzOiAgICAgICAgICAge31cbiAgICAgIGZ1bmN0aW9uczogICAgICAgICAgICB7fVxuICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uczogIHt9XG4gICAgICB3aW5kb3dfZnVuY3Rpb25zOiAgICAge31cbiAgICAgIHRhYmxlX2Z1bmN0aW9uczogICAgICB7fVxuICAgICAgdmlydHVhbF90YWJsZXM6ICAgICAgIHt9XG4gICAgICBtZXRob2RzOiAgICAgICAgICAgICAge31cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciB7IHR5cGUsIGNvbnRyaWJ1dG9yLCB9IGluIGFjcXVpc2l0aW9uX2NoYWluXG4gICAgICBzb3VyY2UgPSBpZiB0eXBlIGlzICdwbHVnaW4nIHRoZW4gY29udHJpYnV0b3IuZXhwb3J0cyBlbHNlIGNvbnRyaWJ1dG9yXG4gICAgICBpZiAoIE9iamVjdC5oYXNPd24gc291cmNlLCAnYnVpbGQnIClcbiAgICAgICAgUi5idWlsZC5wdXNoIGl0ZW0gZm9yIGl0ZW0gaW4gKCBAX3Jlc29sdmVfZnVuY3Rpb24gc291cmNlLmJ1aWxkID8gW10gKVxuICAgICAgZm9yIHByb3BlcnR5X25hbWUsIHRhcmdldCBvZiBSXG4gICAgICAgIGNvbnRpbnVlIGlmICggcHJvcGVydHlfbmFtZSBpcyAnYnVpbGQnIClcbiAgICAgICAgY29udGludWUgaWYgKCBwcm9wZXJ0eV9uYW1lIGlzICdtZXRob2RzJyApIGFuZCAoIHR5cGUgaXNudCAncGx1Z2luJyApXG4gICAgICAgIGNvbnRpbnVlIGlmICggbm90IE9iamVjdC5oYXNPd24gc291cmNlLCBwcm9wZXJ0eV9uYW1lIClcbiAgICAgICAgIyMjIFRBSU5UIG1ha2Ugb3ZlcndyaXRpbmcgYmVoYXZpb3IgY29uZmlndXJhYmxlICMjI1xuICAgICAgICB0YXJnZXRbIGtleSBdID0gdmFsdWUgZm9yIGtleSwgdmFsdWUgb2YgKCBzb3VyY2VbIHByb3BlcnR5X25hbWUgXSA/IHt9IClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FwcGx5X2NvbnRyaWJ1dGlvbnM6IC0+XG4gICAgY2xhc3ogICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIGNvbnRyaWJ1dGlvbnMgPSBAX2NvbGxlY3RfY29udHJpYnV0b3JfcHJvcGVydGllcygpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAX2FjcXVpcmVfbWV0aG9kcyAgICAgY29udHJpYnV0aW9uc1xuICAgIEBfY3JlYXRlX3VkZnMgICAgICAgICBjb250cmlidXRpb25zXG4gICAgQF9yZWJ1aWxkICAgICAgICAgICAgIGNvbnRyaWJ1dGlvbnMgaWYgQGNmZy5yZWJ1aWxkXG4gICAgQF9hY3F1aXJlX3N0YXRlbWVudHMgIGNvbnRyaWJ1dGlvbnNcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2FjcXVpcmVfbWV0aG9kczogKCBjb250cmlidXRpb25zICkgLT5cbiAgICBmb3IgbWV0aG9kX25hbWUsIG1ldGhvZCBvZiBjb250cmlidXRpb25zLm1ldGhvZHNcbiAgICAgIGhpZGUgQCwgbWV0aG9kX25hbWUsIG1ldGhvZFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfYWNxdWlyZV9zdGF0ZW1lbnRzOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIGNvbnRyaWJ1dGlvbnMuc3RhdGVtZW50c1xuICAgICAgdHJ5XG4gICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgQF9yZXNvbHZlX2Z1bmN0aW9uIHN0YXRlbWVudFxuICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fX182IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgc3RhdGVtZW50ICN7cnByIHN0YXRlbWVudF9uYW1lfSwgXCIgXFxcbiAgICAgICAgICArIFwiYW4gZXJyb3Igb2NjdXJyZWQ7IG1heWJlIHlvdSBmb3Jnb3QgdG8gY2FsbCBgI3tAY29uc3RydWN0b3IubmFtZX0ucmVidWlsZCgpYD8gXCIgXFxcbiAgICAgICAgICArIFwiU2VlIGFib3ZlIGNhdXNlIGZvciBkZXRhaWxzXCIsIHsgY2F1c2UsIH1cbiAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBURUFSRE9XTiAmIFJFQlVJTERcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgUiA9IHt9XG4gICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlYXJkb3duOiAtPlxuICAgIGNvdW50ID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBjb3VudCsrXG4gICAgICB0cnlcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje0lETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICB3YXJuIFwizqlkYnJpY21fX183IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICByZXR1cm4gY291bnRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9yZWJ1aWxkOiAoIGNvbnRyaWJ1dGlvbnMgKSAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgQHRlYXJkb3duKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gY29udHJpYnV0aW9ucy5idWlsZFxuICAgICAgKCBAcHJlcGFyZSBAX3Jlc29sdmVfZnVuY3Rpb24gYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIDtudWxsXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMgVURGc1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdWRmczogKCBjb250cmlidXRpb25zICkgLT5cbiAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBjYXRlZ29yeSBpbiBPYmplY3Qua2V5cyBuYW1lc19vZl9jYWxsYWJsZXNcbiAgICAgIHByb3BlcnR5X25hbWUgICAgID0gXCIje2NhdGVnb3J5fXNcIlxuICAgICAgbWV0aG9kX25hbWUgICAgICAgPSBcIl9jcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBjb250cmlidXRpb25zWyBwcm9wZXJ0eV9uYW1lIF1cbiAgICAgICAgZm5fY2ZnID0gQF9yZXNvbHZlX2Z1bmN0aW9uIGZuX2NmZ1xuICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2dldF91ZGZfbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2NyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX19fOSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICByZXN1bHQsXG4gICAgICBkaXJlY3RPbmx5LFxuICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICB7IG5hbWUsXG4gICAgICBvdmVyd3JpdGUsXG4gICAgICBzdGFydCxcbiAgICAgIHN0ZXAsXG4gICAgICBpbnZlcnNlLFxuICAgICAgcmVzdWx0LFxuICAgICAgZGlyZWN0T25seSxcbiAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2dldF91ZGZfbmFtZXMoKS5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTMgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgIHsgbmFtZSxcbiAgICAgIG92ZXJ3cml0ZSxcbiAgICAgIHBhcmFtZXRlcnMsXG4gICAgICBjb2x1bW5zLFxuICAgICAgcm93cyxcbiAgICAgIGRpcmVjdE9ubHksXG4gICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2dldF91ZGZfbmFtZXMoKS5oYXMgbmFtZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCB7IHBhcmFtZXRlcnMsIGNvbHVtbnMsIHJvd3MsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9jcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgeyBuYW1lLFxuICAgICAgb3ZlcndyaXRlLFxuICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZ2V0X3VkZl9uYW1lcygpLmhhcyBuYW1lIClcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNtX18xNyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWMgZXh0ZW5kcyBEYnJpY19jbGFzc3Byb3BfYWJzb3JiZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBmdW5jdGlvbnM6ICAgICAgIHt9XG4gIEBzdGF0ZW1lbnRzOiAgICAgIHt9XG4gIEBidWlsZDogICAgICAgICAgIG51bGxcbiAgQHBsdWdpbnM6ICAgICAgICAgbnVsbFxuICAjIEBvdmVyd3JpdGU6ICAgICAgIGZhbHNlXG4gICMgQHByZWZpeDogICAgICAgICAgbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHJlYnVpbGQ6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZGJyaWNfY2ZnLCB9LCAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgY2ZnLnJlYnVpbGQgPSB0cnVlXG4gICAgcmV0dXJuIG5ldyBAIGNmZ1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIE5PVEUgdGhpcyB1bnVzdWFsIGFycmFuZ2VtZW50IGlzIHNvbGVseSB0aGVyZSBzbyB3ZSBjYW4gY2FsbCBgc3VwZXIoKWAgZnJvbSBhbiBpbnN0YW5jZSBtZXRob2QgIyMjXG4gIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgIHN1cGVyKClcbiAgICByZXR1cm4gQF9jb25zdHJ1Y3RvciBQLi4uXG4gIF9jb25zdHJ1Y3RvcjogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5kYnJpY19jZmcsIH0sICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBEYl9hZGFwdGVyIGRiX3BhdGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGV4dHJhICAgICAgICAgICAgICAgICAgICAgPSB7fVxuICAgIGNmZyAgICAgICAgICAgICAgICAgICAgICAgPSB7IHRlbXBsYXRlcy5kYnJpY19jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgIGNmZy5wcmVmaXggICAgICAgICAgICAgICAgPSBjbGFzei5wcmVmaXggICAgaWYgY2ZnLnByZWZpeCAgICAgaXMgbWlzZml0XG4gICAgIyBjZmcub3ZlcndyaXRlICAgICAgICAgICAgID0gY2xhc3oub3ZlcndyaXRlIGlmIGNmZy5vdmVyd3JpdGUgIGlzIG1pc2ZpdFxuICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgY2ZnXG4gICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgIEBfYXBwbHlfY29udHJpYnV0aW9ucygpXG4gICAgO3VuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljbV9fMTggZXhwZWN0ZWQgYSBzdGF0ZW1lbnQgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB0cnlcbiAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICBjYXRjaCBjYXVzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY21fXzE5IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2l0aF90cmFuc2FjdGlvbjogKCBmICkgLT5cbiAgIyB3aXRoX3RyYW5zYWN0aW9uOiAoIGNmZywgZiApIC0+XG4gICMgICBzd2l0Y2ggYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICMgICAgIHdoZW4gMSB0aGVuIFsgY2ZnLCBmLCBdID0gWyBudWxsLCBjZmcsIF1cbiAgIyAgICAgd2hlbiAyIHRoZW4gbnVsbFxuICAjICAgICBlbHNlIHRocm93IG5ldyBFLkRCYXlfd3JvbmdfYXJpdHkgJ15kYmF5L2N0eEA0XicsICd3aXRoX3RyYW5zYWN0aW9uKCknLCAxLCAyLCBhcml0eVxuICAjICAgQHR5cGVzLnZhbGlkYXRlLmRiYXlfd2l0aF90cmFuc2FjdGlvbl9jZmcgKCBjZmcgPSB7IEBjb25zdHJ1Y3Rvci5DLmRlZmF1bHRzLmRiYXlfd2l0aF90cmFuc2FjdGlvbl9jZmcuLi4sIGNmZy4uLiwgfSApXG4gICMgICBAdHlwZXMudmFsaWRhdGUuZnVuY3Rpb24gZlxuICAgIGNmZyA9IHsgbW9kZTogJ2RlZmVycmVkJywgfVxuICAgIHRocm93IG5ldyBFLkRicmljX25vX25lc3RlZF90cmFuc2FjdGlvbnMgJ86pZGJyaWNtX18yMCcgaWYgQGRiLmluVHJhbnNhY3Rpb25cbiAgICBAZXhlY3V0ZSBTUUxcImJlZ2luICN7Y2ZnLm1vZGV9IHRyYW5zYWN0aW9uO1wiXG4gICAgZXJyb3IgPSBudWxsXG4gICAgdHJ5XG4gICAgICBSID0gZigpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBleGVjdXRlIFNRTFwicm9sbGJhY2s7XCIgaWYgQGRiLmluVHJhbnNhY3Rpb25cbiAgICAgIHRocm93IGVycm9yXG4gICAgdHJ5XG4gICAgICBAZXhlY3V0ZSBTUUxcImNvbW1pdDtcIiAgIGlmIEBkYi5pblRyYW5zYWN0aW9uXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBleGVjdXRlIFNRTFwicm9sbGJhY2s7XCIgaWYgQGRiLmluVHJhbnNhY3Rpb25cbiAgICAgICMgdHJ5IEBleGVjdXRlIFNRTFwicm9sbGJhY2s7XCIgaWYgQGRiLmluVHJhbnNhY3Rpb24gY2F0Y2ggZXJyb3IgdGhlbiBudWxsXG4gICAgcmV0dXJuIFJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pZ25vcmVkX3Byb3RvdHlwZXMgPSBPYmplY3QuZnJlZXplIFtcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge30gKSxcbiAgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgT2JqZWN0ICksXG4gIERicmljX3RhYmxlX2Zvcm1hdHRlcixcbiAgRGJyaWNfY2xhc3Nwcm9wX2Fic29yYmVyLFxuICBEYnJpYyxcbiAgXVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIERicmljLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IGZyZWV6ZSB7XG4gICAgRSxcbiAgICBpZ25vcmVkX3Byb3RvdHlwZXMsXG4gICAgdHlwZV9vZixcbiAgICB0ZW1wbGF0ZXMsIH1cbiAgfVxuXG5cblxuIl19
