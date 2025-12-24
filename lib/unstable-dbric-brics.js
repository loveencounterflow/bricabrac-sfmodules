(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_rng, Dbric_std, Esql, SFMODULES, SQL, SQLITE, Undumper, as_bool, create_statement_re, debug, esql, exports, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, rpr_string, set_getter, templates, type_of, warn;
      //=======================================================================================================
      SFMODULES = require('./main');
      ({hide, set_getter} = SFMODULES.require_managed_property_tools());
      ({type_of} = SFMODULES.unstable.require_type_of());
      // { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
      // { nameit,                     } = SFMODULES.require_nameit()
      ({rpr_string} = SFMODULES.require_rpr_string());
      ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);
      SQLITE = require('node:sqlite');
      ({debug, warn} = console);
      misfit = Symbol('misfit');
      ({get_prototype_chain, get_all_in_prototype_chain} = SFMODULES.unstable.require_get_prototype_chain());
      ({Undumper} = SFMODULES.require_coarse_sqlite_statement_segmenter());
      //-------------------------------------------------------------------------------------------------------
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
      //-------------------------------------------------------------------------------------------------------
      create_statement_re = /^\s*create\s+(?<type>table|view|index|trigger)\s+(?<name>\S+)\s+/is;
      //-------------------------------------------------------------------------------------------------------
      templates = {
        create_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          overwrite: false
        },
        //.....................................................................................................
        create_aggregate_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          start: null,
          overwrite: false
        },
        //.....................................................................................................
        create_window_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          start: null,
          overwrite: false
        },
        //.....................................................................................................
        create_table_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          overwrite: false
        },
        //.....................................................................................................
        create_virtual_table_cfg: {}
      };
      
    const True  = 1;
    const False = 0;
    //=======================================================================================================
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
      //-------------------------------------------------------------------------------------------------------
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
          this.I = this.I.bind(this);
        }

        //---------------------------------------------------------------------------------------------------
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
          throw new Error(`Ωdbric___4 expected a name, got ${rpr_string(name)}`);
        }

        I(name) {
          return '"' + (name.replace(/"/g, '""')) + '"';
        }

      };
      // #---------------------------------------------------------------------------------------------------------
      // L: ( x ) =>
      //   return 'null' unless x?
      //   switch type = type_of x
      //     when 'text'       then return  "'" + ( x.replace /'/g, "''" ) + "'"
      //     # when 'list'       then return "'#{@list_as_json x}'"
      //     when 'float'      then return x.toString()
      //     when 'boolean'    then return ( if x then '1' else '0' )
      //     # when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
      //   throw new E.DBay_sql_value_error '^dbay/sql@1^', type, x

      // #---------------------------------------------------------------------------------------------------------
      // V: ( x ) =>
      //   throw new E.DBay_sql_not_a_list_error '^dbay/sql@2^', type, x unless ( type = type_of x ) is 'list'
      //   return '( ' + ( ( @L e for e in x ).join ', ' ) + ' )'

      // #---------------------------------------------------------------------------------------------------------
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
      //     throw new E.DBay_interpolation_format_unknown '^dbay/sql@3^', format
      // _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g
      //-------------------------------------------------------------------------------------------------------
      esql = new Esql();
      //-------------------------------------------------------------------------------------------------------
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
        //=======================================================================================================
        class Dbric {
          //-----------------------------------------------------------------------------------------------------
          /* TAINT use normalize-function-arguments */
          constructor(db_path, cfg) {
            var clasz, db_class, fn_cfg_template, ref;
            this._validate_is_property('is_ready');
            this._validate_is_property('prefix');
            this._validate_is_property('prefix_re');
            //...................................................................................................
            if (db_path == null) {
              db_path = ':memory:';
            }
            //...................................................................................................
            clasz = this.constructor;
            db_class = (ref = (cfg != null ? cfg.db_class : void 0)) != null ? ref : clasz.db_class;
            hide(this, 'db', new db_class(db_path));
            // @db                       = new SQLITE.DatabaseSync db_path
            this.cfg = Object.freeze({...clasz.cfg, db_path, ...cfg});
            hide(this, 'statements', {});
            hide(this, '_w', null);
            hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
            hide(this, 'state', {
              columns: null
            });
            //...................................................................................................
            this.run_standard_pragmas();
            this.initialize();
            //...................................................................................................
            fn_cfg_template = {
              deterministic: true,
              varargs: false
            };
            this._create_udfs();
            //...................................................................................................
            /* NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
                   contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
                   the instance. */
            this.is_fresh = !this.is_ready;
            this.build();
            this._prepare_statements();
            return void 0;
          }

          //-----------------------------------------------------------------------------------------------------
          isa_statement(x) {
            return x instanceof this._statement_class;
          }

          //-----------------------------------------------------------------------------------------------------
          run_standard_pragmas() {
            /* not using `@db.pragma` as it is only provided by `better-sqlite3`'s DB class */
            (this.db.prepare(SQL`pragma journal_mode = wal;`)).run();
            (this.db.prepare(SQL`pragma foreign_keys = on;`)).run();
            (this.db.prepare(SQL`pragma busy_timeout = 60000;`)).run();
            (this./* time in ms */db.prepare(SQL`pragma strict       = on;`)).run();
// @db.pragma SQL"journal_mode = wal"
// @db.pragma SQL"foreign_keys = on"
/* time in ms */            return null;
          }

          //-----------------------------------------------------------------------------------------------------
          initialize() {
            /* This method will be called *before* any build statements are executed and before any statements
                   in `@constructor.statements` are prepared and is a good place to create user-defined functions
                   (UDFs). You probably want to override it with a method that starts with `super()`. */
            return null;
          }

          //-----------------------------------------------------------------------------------------------------
          _validate_is_property(name) {
            var descriptor;
            descriptor = get_property_descriptor(this, name);
            if ((type_of(descriptor.get)) === 'function') {
              return null;
            }
            throw new Error(`Ωdbric___5 not allowed to override property ${rpr_string(name)}; use '_get_${name} instead`);
          }

          //-----------------------------------------------------------------------------------------------------
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

          //-----------------------------------------------------------------------------------------------------
          teardown({test = null} = {}) {
            var _, count, error, name, prefix_re, ref, type;
            count = 0;
            //...................................................................................................
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
                throw new Error(`Ωdbric___6 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
            }
            //...................................................................................................
            (this.prepare(SQL`pragma foreign_keys = off;`)).run();
            ref = this._get_db_objects();
            for (_ in ref) {
              ({name, type} = ref[_]);
              if (!test(name)) {
                continue;
              }
              count++;
              try {
                (this.prepare(SQL`drop ${type} ${esql.I(name)};`)).run();
              } catch (error1) {
                error = error1;
                if (!RegExp(`no\\s+such\\s+${type}:`).test(error.message)) {
                  warn(`Ωdbric___7 ignored error: ${error.message}`);
                }
              }
            }
            (this.prepare(SQL`pragma foreign_keys = on;`)).run();
            return count;
          }

          //-----------------------------------------------------------------------------------------------------
          build() {
            if (this.is_ready) {
              return 0;
            } else {
              return this.rebuild();
            }
          }

          //-----------------------------------------------------------------------------------------------------
          rebuild() {
            /* TAINT use proper validation */
            var build_statement, build_statements, build_statements_list, clasz, count, has_torn_down, i, j, len, len1, ref, type;
            clasz = this.constructor;
            count = 0;
            build_statements_list = (get_all_in_prototype_chain(clasz, 'build')).reverse();
            has_torn_down = false;
//...................................................................................................
            for (i = 0, len = build_statements_list.length; i < len; i++) {
              build_statements = build_statements_list[i];
              if ((ref = (type = type_of(build_statements))) !== 'undefined' && ref !== 'null' && ref !== 'list') {
                throw new Error(`Ωdbric___8 expected an optional list for ${clasz.name}.build, got a ${type}`);
              }
              if ((build_statements == null) || (build_statements.length === 0)) {
                //.................................................................................................
                continue;
              }
              if (!has_torn_down) {
                //.................................................................................................
                this.teardown();
              }
              has_torn_down = true;
//.................................................................................................
              for (j = 0, len1 = build_statements.length; j < len1; j++) {
                build_statement = build_statements[j];
                count++;
                (this.prepare(build_statement)).run();
              }
            }
            //...................................................................................................
            return count;
          }

          //-----------------------------------------------------------------------------------------------------
          _get_is_ready() {
            var error_count, expected_db_objects, expected_type, message, messages, name, present_db_objects, ref, statement_count, type;
            ({
              error_count,
              statement_count,
              db_objects: expected_db_objects
            } = this._get_objects_in_build_statements());
            //...................................................................................................
            if (error_count !== 0) {
              messages = [];
              for (name in expected_db_objects) {
                ({type, message} = expected_db_objects[name]);
                if (type !== 'error') {
                  continue;
                }
                messages.push(message);
              }
              throw new Error(`Ωdbric___9 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr_string(messages)}`);
            }
            //...................................................................................................
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

          //---------------------------------------------------------------------------------------------------
          _get_prefix() {
            if ((this.cfg.prefix == null) || (this.cfg.prefix === '(NOPREFIX)')) {
              return '';
            }
            return this.cfg.prefix;
          }

          //---------------------------------------------------------------------------------------------------
          _get_prefix_re() {
            if (this.prefix === '') {
              return /|/;
            }
            return RegExp(`^_?${RegExp.escape(this.prefix)}_.*$`);
          }

          //---------------------------------------------------------------------------------------------------
          _get_w() {
            if (this._w != null) {
              return this._w;
            }
            this._w = new this.constructor(this.cfg.db_path);
            return this._w;
          }

          //---------------------------------------------------------------------------------------------------
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

          //---------------------------------------------------------------------------------------------------
          _get_objects_in_build_statements() {
            /* TAINT does not yet deal with quoted names */
            var clasz, db_objects, error_count, i, len, match, message, name, ref, ref1, statement, statement_count, type;
            clasz = this.constructor;
            db_objects = {};
            statement_count = 0;
            error_count = 0;
            ref1 = (ref = clasz.build) != null ? ref : [];
            for (i = 0, len = ref1.length; i < len; i++) {
              statement = ref1[i];
              statement_count++;
              if ((match = statement.match(create_statement_re)) != null) {
                ({name, type} = match.groups);
                name = esql.unquote_name(name);
                db_objects[name] = {name, type};
              } else {
                error_count++;
                name = `error_${statement_count}`;
                type = 'error';
                message = `non-conformant statement: ${rpr_string(statement)}`;
                db_objects[name] = {name, type, message};
              }
            }
            return {error_count, statement_count, db_objects};
          }

          //-----------------------------------------------------------------------------------------------------
          _prepare_statements() {
            var clasz, i, len, statement, statement_name, statements, statements_list;
            // #.................................................................................................
            // for name, sql of clasz.statements
            //   switch true
            //     when name.startsWith 'create_table_'
            //       null
            //     when name.startsWith 'insert_'
            //       null
            //     else
            //       throw new Error "Ωnql__10 unable to parse statement name #{rpr_string name}"
            // #   @[ name ] = @prepare sql
            clasz = this.constructor;
            statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
            for (i = 0, len = statements_list.length; i < len; i++) {
              statements = statements_list[i];
              for (statement_name in statements) {
                statement = statements[statement_name];
                if (this.statements[statement_name] != null) {
                  throw new Error(`Ωdbric__11 statement ${rpr_string(statement_name)} is already declared`);
                }
                // if ( type_of statement ) is 'list'
                //   @statements[ statement_name ] = ( @prepare sub_statement for sub_statement in statement )
                //   continue
                this.statements[statement_name] = this.prepare(statement);
              }
            }
            return null;
          }

          //-----------------------------------------------------------------------------------------------------
          execute(sql) {
            return this.db.exec(sql);
          }

          //-----------------------------------------------------------------------------------------------------
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

          //-----------------------------------------------------------------------------------------------------
          prepare(sql) {
            var R, cause, error, ref, type;
            if (this.isa_statement(sql)) {
              return sql;
            }
            if ((type = type_of(sql)) !== 'text') {
              throw new Error(`Ωdbric__12 expected a statement or a text, got a ${type}`);
            }
            try {
              R = this.db.prepare(sql);
            } catch (error1) {
              cause = error1;
              throw new Error(`Ωdbric__13 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
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

          //=====================================================================================================
          // FUNCTIONS
          //-----------------------------------------------------------------------------------------------------
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
            //...................................................................................................
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
//...............................................................................................
                for (udf_name in declarations) {
                  fn_cfg = declarations[udf_name];
                  //.............................................................................................
                  fn_cfg = lets(fn_cfg, (d) => {
                    var callable, k, len2, name_of_callable, ref1;
                    if (d.name == null) {
                      d.name = udf_name;
                    }
                    ref1 = names_of_callables[category];
                    //...........................................................................................
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
            //...................................................................................................
            return null;
          }

          //-----------------------------------------------------------------------------------------------------
          create_function(cfg) {
            var deterministic, directOnly, name, overwrite, value, varargs;
            if ((type_of(this.db.function)) !== 'function') {
              throw new Error(`Ωdbric__14 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined functions`);
            }
            ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__15 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.function(name, {deterministic, varargs, directOnly}, value);
          }

          //-----------------------------------------------------------------------------------------------------
          create_aggregate_function(cfg) {
            var deterministic, directOnly, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__16 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined aggregate functions`);
            }
            ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__17 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_window_function(cfg) {
            var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__18 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined window functions`);
            }
            ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__19 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_table_function(cfg) {
            var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__20 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide table-valued user-defined functions`);
            }
            ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__21 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_virtual_table(cfg) {
            var create, name, overwrite;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__22 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined virtual tables`);
            }
            ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__23 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.table(name, create);
          }

        };

        //-----------------------------------------------------------------------------------------------------
        Dbric.cfg = Object.freeze({
          prefix: '(NOPREFIX)'
        });

        Dbric.functions = {};

        Dbric.statements = {};

        Dbric.build = null;

        Dbric.db_class = SQLITE.DatabaseSync;

        //---------------------------------------------------------------------------------------------------
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
      Dbric_std = (function() {
        //=======================================================================================================
        class Dbric_std extends Dbric {};

        //-----------------------------------------------------------------------------------------------------
        Dbric_std.cfg = Object.freeze({
          prefix: 'std'
        });

        //=====================================================================================================
        Dbric_std.functions = {
          //---------------------------------------------------------------------------------------------------
          regexp: {
            value: function(pattern, text) {
              if ((new RegExp(pattern, 'v')).test(text)) {
                return 1;
              } else {
                return 0;
              }
            }
          },
          //---------------------------------------------------------------------------------------------------
          std_is_uc_normal: {
            /* NOTE: also see `String::isWellFormed()` */
            value: function(text, form = 'NFC') {
              return from_bool(text === text.normalize(form));
            }
          }
        };

        //=====================================================================================================
        Dbric_std./* 'NFC', 'NFD', 'NFKC', or 'NFKD' */table_functions = {
          //---------------------------------------------------------------------------------------------------
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

        //=====================================================================================================
        Dbric_std.statements = {
          std_get_schema: SQL`select * from sqlite_schema;`,
          std_get_tables: SQL`select * from sqlite_schema where type is 'table';`,
          std_get_views: SQL`select * from sqlite_schema where type is 'view';`,
          std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' );`
        };

        //-----------------------------------------------------------------------------------------------------
        Dbric_std.build = [
          SQL`create view std_tables as
select * from sqlite_schema
  where type is 'table';`,
          SQL`create view std_views as
select * from sqlite_schema
  where type is 'view';`,
          SQL`create view "std_relations" as
select * from sqlite_schema
  where type in ( 'table', 'view' );`
        ];

        return Dbric_std;

      }).call(this);
      Dbric_rng = (function() {
        //=======================================================================================================
        class Dbric_rng extends Dbric_std {};

        //-----------------------------------------------------------------------------------------------------
        Dbric_rng.cfg = Object.freeze({
          prefix: 'rng'
        });

        //=====================================================================================================
        Dbric_rng.functions = {
          //---------------------------------------------------------------------------------------------------
          rng_validate_lo: {
            value: function(lo) {
              if (!Number.isFinite(lo)) {
                return False;
              }
              return True;
            }
          },
          //---------------------------------------------------------------------------------------------------
          rng_validate_hi: {
            value: function(hi) {
              if (!Number.isFinite(hi)) {
                return False;
              }
              return True;
            }
          },
          //---------------------------------------------------------------------------------------------------
          rng_validate_lohi: {
            value: function(lo, hi) {
              if (!(lo <= hi)) {
                return False;
              }
              return True;
            }
          }
        };

        // #=====================================================================================================
        // @table_functions:

        //   #---------------------------------------------------------------------------------------------------
        //   rng_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:
        //     columns:      [ 'value', ]
        //     parameters:   [ 'start', 'stop', 'step', ]
        //     rows: ( start, stop = 4_294_967_295, step = 1 ) ->
        //       yield return null
        //       ;null

        //=====================================================================================================
        Dbric_rng.statements = {
          //---------------------------------------------------------------------------------------------------
          rng_add_range: SQL`insert into rng_ranges ( lo, hi, data ) values ( $lo, $hi, $data )
  ;`,
          //---------------------------------------------------------------------------------------------------
          rng_all_ranges: SQL`select * from rng_ranges order by id;`
        };

        //-----------------------------------------------------------------------------------------------------
        Dbric_rng.build = [
          SQL`create table rng_ranges (
  id      integer not null primary key autoincrement,
  lo      integer not null,
  hi      integer not null,
  data    json    not null,
constraint "Ωlo_isa_number__24" check ( rng_validate_lo( lo ) )
constraint "Ωhi_isa_number__25" check ( rng_validate_hi( hi ) )
constraint "Ωlo_lte_hi_rng__26" check ( rng_validate_lohi( lo, hi ) )
);`
        ];

        return Dbric_rng;

      }).call(this);
      //=======================================================================================================
      return exports = {
        Dbric,
        Dbric_std,
        Dbric_rng,
        esql,
        SQL,
        True,
        False,
        from_bool,
        as_bool,
        internals: Object.freeze({type_of, create_statement_re, templates})
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, UNSTABLE_DBRIC_BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsT0FBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSwwQkFBQSxFQUFBLHVCQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQTs7TUFDSSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSO01BQ2xDLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRGxDO01BRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBbEMsRUFKSjs7O01BT0ksQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFsQztNQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw0QkFBVixDQUFBLENBQXdDLENBQUMsTUFEM0U7TUFFQSxNQUFBLEdBQWtDLE9BQUEsQ0FBUSxhQUFSO01BQ2xDLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDO01BRUEsTUFBQSxHQUFrQyxNQUFBLENBQU8sUUFBUDtNQUNsQyxDQUFBLENB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QVA7O0FBQ0EscUJBQU87WUFGRjtVQUFQLENBUEY7O1VBWUEsaUJBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sQ0FBQTtjQUNMLE1BQW9CLEVBQUEsSUFBTSxHQUExQjtBQUFBLHVCQUFPLE1BQVA7O0FBQ0EscUJBQU87WUFGRjtVQUFQO1FBYkY7Ozs7Ozs7Ozs7Ozs7O1FBNkJGLFNBQUMsQ0FBQSxVQUFELEdBR0UsQ0FBQTs7VUFBQSxhQUFBLEVBQWUsR0FBRyxDQUFBO0dBQUEsQ0FBbEI7O1VBS0EsY0FBQSxFQUFnQixHQUFHLENBQUEscUNBQUE7UUFMbkI7OztRQVNGLFNBQUMsQ0FBQSxLQUFELEdBQVE7VUFDTixHQUFHLENBQUE7Ozs7Ozs7O0VBQUEsQ0FERzs7Ozs7b0JBcm1CZDs7QUFtbkJJLGFBQU8sT0FBQSxHQUFVO1FBQ2YsS0FEZTtRQUVmLFNBRmU7UUFHZixTQUhlO1FBSWYsSUFKZTtRQUtmLEdBTGU7UUFNZixJQU5lO1FBT2YsS0FQZTtRQVFmLFNBUmU7UUFTZixPQVRlO1FBVWYsU0FBQSxFQUFXLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxPQUFGLEVBQVcsbUJBQVgsRUFBZ0MsU0FBaEMsQ0FBZDtNQVZJO0lBcm5CSjtFQUFmLEVBVkY7OztFQThvQkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsb0JBQTlCO0FBOW9CQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuVU5TVEFCTEVfREJSSUNfQlJJQ1MgPVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RicmljOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICAgIHsgaGlkZSxcbiAgICAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICAgICMgeyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxuICAgICMgeyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gICAgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgbGV0cyxcbiAgICAgIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbiAgICBTUUxJVEUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICAgeyBkZWJ1ZyxcbiAgICAgIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICAgIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuICAgIHsgVW5kdW1wZXIsICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAgICMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICAgICMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICAgIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgICB3aGlsZSB4P1xuICAgICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgICBeIFxccypcbiAgICAgIGNyZWF0ZSBcXHMrXG4gICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgICAgLy8vaXNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGBgYFxuICAgIGNvbnN0IFRydWUgID0gMTtcbiAgICBjb25zdCBGYWxzZSA9IDA7XG4gICAgYGBgXG5cbiAgICBmcm9tX2Jvb2wgPSAoIHggKSAtPiBzd2l0Y2ggeFxuICAgICAgd2hlbiB0cnVlICB0aGVuIFRydWVcbiAgICAgIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzEgZXhwZWN0ZWQgdHJ1ZSBvciBmYWxzZSwgZ290ICN7cnByIHh9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXNfYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgICAgIHdoZW4gRmFsc2UgIHRoZW4gZmFsc2VcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18yIGV4cGVjdGVkIDAgb3IgMSwgZ290ICN7cnByIHh9XCJcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRXNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB1bnF1b3RlX25hbWU6ICggbmFtZSApIC0+XG4gICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIG5hbWUgKSBpcyAndGV4dCdcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gL15bXlwiXSguKilbXlwiXSQvLnRlc3QgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVxuICAgICAgICAgIHdoZW4gL15cIiguKylcIiQvLnRlc3QgICAgICAgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVsgMSAuLi4gbmFtZS5sZW5ndGggLSAxIF0ucmVwbGFjZSAvXCJcIi9nLCAnXCInXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGEgbmFtZSwgZ290ICN7cnByX3N0cmluZyBuYW1lfVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEk6ICggbmFtZSApID0+ICdcIicgKyAoIG5hbWUucmVwbGFjZSAvXCIvZywgJ1wiXCInICkgKyAnXCInXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBMOiAoIHggKSA9PlxuICAgICAgIyAgIHJldHVybiAnbnVsbCcgdW5sZXNzIHg/XG4gICAgICAjICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHhcbiAgICAgICMgICAgIHdoZW4gJ3RleHQnICAgICAgIHRoZW4gcmV0dXJuICBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiJydcIiApICsgXCInXCJcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiByZXR1cm4gXCInI3tAbGlzdF9hc19qc29uIHh9J1wiXG4gICAgICAjICAgICB3aGVuICdmbG9hdCcgICAgICB0aGVuIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICMgICAgIHdoZW4gJ2Jvb2xlYW4nICAgIHRoZW4gcmV0dXJuICggaWYgeCB0aGVuICcxJyBlbHNlICcwJyApXG4gICAgICAjICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gdGhyb3cgbmV3IEVycm9yIFwiXmRiYUAyM14gdXNlIGBYKClgIGZvciBsaXN0c1wiXG4gICAgICAjICAgdGhyb3cgbmV3IEUuREJheV9zcWxfdmFsdWVfZXJyb3IgJ15kYmF5L3NxbEAxXicsIHR5cGUsIHhcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIFY6ICggeCApID0+XG4gICAgICAjICAgdGhyb3cgbmV3IEUuREJheV9zcWxfbm90X2FfbGlzdF9lcnJvciAnXmRiYXkvc3FsQDJeJywgdHlwZSwgeCB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiB4ICkgaXMgJ2xpc3QnXG4gICAgICAjICAgcmV0dXJuICcoICcgKyAoICggQEwgZSBmb3IgZSBpbiB4ICkuam9pbiAnLCAnICkgKyAnICknXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBpbnRlcnBvbGF0ZTogKCBzcWwsIHZhbHVlcyApID0+XG4gICAgICAjICAgaWR4ID0gLTFcbiAgICAgICMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgPT5cbiAgICAgICMgICAgIGlkeCsrXG4gICAgICAjICAgICBzd2l0Y2ggb3BlbmVyXG4gICAgICAjICAgICAgIHdoZW4gJyQnXG4gICAgICAjICAgICAgICAgdmFsaWRhdGUubm9uZW1wdHlfdGV4dCBuYW1lXG4gICAgICAjICAgICAgICAga2V5ID0gbmFtZVxuICAgICAgIyAgICAgICB3aGVuICc/J1xuICAgICAgIyAgICAgICAgIGtleSA9IGlkeFxuICAgICAgIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4gICAgICAjICAgICBzd2l0Y2ggZm9ybWF0XG4gICAgICAjICAgICAgIHdoZW4gJycsICdJJyAgdGhlbiByZXR1cm4gQEkgdmFsdWVcbiAgICAgICMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4gICAgICAjICAgICB0aHJvdyBuZXcgRS5EQmF5X2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gJ15kYmF5L3NxbEAzXicsIGZvcm1hdFxuICAgICAgIyBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuOiAvKD88b3BlbmVyPlskP10pKD88Zm9ybWF0Pi4/KTooPzxuYW1lPlxcdyopL2dcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGVzcWwgPSBuZXcgRXNxbCgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFNRTCA9ICggcGFydHMsIGV4cHJlc3Npb25zLi4uICkgLT5cbiAgICAgIFIgPSBwYXJ0c1sgMCBdXG4gICAgICBmb3IgZXhwcmVzc2lvbiwgaWR4IGluIGV4cHJlc3Npb25zXG4gICAgICAgIFIgKz0gZXhwcmVzc2lvbi50b1N0cmluZygpICsgcGFydHNbIGlkeCArIDEgXVxuICAgICAgcmV0dXJuIFJcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBEYnJpY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBjZmc6IE9iamVjdC5mcmVlemVcbiAgICAgICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgICAgIEBmdW5jdGlvbnM6ICAge31cbiAgICAgIEBzdGF0ZW1lbnRzOiAge31cbiAgICAgIEBidWlsZDogICAgICAgbnVsbFxuICAgICAgQGRiX2NsYXNzOiAgICBTUUxJVEUuRGF0YWJhc2VTeW5jXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyMjIFRBSU5UIHVzZSBub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzICMjI1xuICAgICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9jbGFzcyAgICAgICAgICAgICAgICAgID0gKCBjZmc/LmRiX2NsYXNzICkgPyBjbGFzei5kYl9jbGFzc1xuICAgICAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IGRiX2NsYXNzIGRiX3BhdGhcbiAgICAgICAgIyBAZGIgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IFNRTElURS5EYXRhYmFzZVN5bmMgZGJfcGF0aFxuICAgICAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IGNsYXN6LmNmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgICAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICAgICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgIHsgY29sdW1uczogbnVsbCwgfVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgICBjb250cmFkaXN0aW5jdGlvbiB0byBgRGJyaWM6OmlzX3JlYWR5YCwgYERicmljOjppc19mcmVzaGAgcmV0YWlucyBpdHMgdmFsdWUgZm9yIHRoZSBsaWZldGltZSBvZlxuICAgICAgICB0aGUgaW5zdGFuY2UuICMjI1xuICAgICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICAgIEBidWlsZCgpXG4gICAgICAgIEBfcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAgICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAgICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGluaXRpYWxpemU6IC0+XG4gICAgICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgICAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgICAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX181IG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByX3N0cmluZyBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHRlYXJkb3duOiAoeyB0ZXN0ID0gbnVsbCwgfT17fSkgLT5cbiAgICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIHRlc3QgaXMgJyonXG4gICAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgICAgIHdoZW4gKCB0eXBlX29mIHRlc3QgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICBudWxsXG4gICAgICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgICAgIHByZWZpeF9yZSA9IEBwcmVmaXhfcmVcbiAgICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiBwcmVmaXhfcmUudGVzdCBuYW1lXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHlwZSA9IHR5cGVfb2YgdGVzdFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzYgZXhwZWN0ZWQgYCcqJ2AsIGEgUmVnRXhwLCBhIGZ1bmN0aW9uLCBudWxsIG9yIHVuZGVmaW5lZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgICAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0ZXN0IG5hbWVcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7ZXNxbC5JIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgICAgd2FybiBcIs6pZGJyaWNfX183IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlYnVpbGQ6IC0+XG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBjb3VudCAgICAgICAgICAgICAgICAgPSAwXG4gICAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgICAgaGFzX3Rvcm5fZG93biAgICAgICAgID0gZmFsc2VcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGJ1aWxkX3N0YXRlbWVudHMgKSBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzggZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBAdGVhcmRvd24oKSB1bmxlc3MgaGFzX3Rvcm5fZG93blxuICAgICAgICAgIGhhc190b3JuX2Rvd24gPSB0cnVlXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gY291bnRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgICAgICAtPiBAX2dldF93KClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgICB7IGVycm9yX2NvdW50LFxuICAgICAgICAgIHN0YXRlbWVudF9jb3VudCxcbiAgICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgICAgICBtZXNzYWdlcyA9IFtdXG4gICAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoIG1lc3NhZ2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3Jwcl9zdHJpbmcgbWVzc2FnZXN9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgICAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXhfcmU6IC0+XG4gICAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgICByZXR1cm4gLy8vIF4gXz8gI3tSZWdFeHAuZXNjYXBlIEBwcmVmaXh9IF8gLiogJCAvLy9cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF93OiAtPlxuICAgICAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGhcbiAgICAgICAgcmV0dXJuIEBfd1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICAgICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByX3N0cmluZyBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICBlbHNlXG4gICAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfXzEwIHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuICAgICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICAgICAgc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ3N0YXRlbWVudHMnICkucmV2ZXJzZSgpXG4gICAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgICAgICAgIGlmIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdP1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMSBzdGF0ZW1lbnQgI3tycHJfc3RyaW5nIHN0YXRlbWVudF9uYW1lfSBpcyBhbHJlYWR5IGRlY2xhcmVkXCJcbiAgICAgICAgICAgICMgaWYgKCB0eXBlX29mIHN0YXRlbWVudCApIGlzICdsaXN0J1xuICAgICAgICAgICAgIyAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gKCBAcHJlcGFyZSBzdWJfc3RhdGVtZW50IGZvciBzdWJfc3RhdGVtZW50IGluIHN0YXRlbWVudCApXG4gICAgICAgICAgICAjICAgY29udGludWVcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gICAgICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICAgICAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMiBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICB0cnlcbiAgICAgICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTMgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3Jwcl9zdHJpbmcgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHJfc3RyaW5nIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgICAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICMgRlVOQ1RJT05TXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIHB1dCBzb21ld2hlcmUgZWxzZT8gIyMjXG4gICAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgICBhZ2dyZWdhdGVfZnVuY3Rpb246ICAgWyAnc3RhcnQnLCAnc3RlcCcsICdyZXN1bHQnLCBdXG4gICAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgICAgdmlydHVhbF90YWJsZTogICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgICAgIHByb3BlcnR5X25hbWUgICAgID0gXCIje2NhdGVnb3J5fXNcIlxuICAgICAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgICAgIGZvciBkZWNsYXJhdGlvbnMgaW4gZGVjbGFyYXRpb25zX2xpc3RcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICAgICAgZm9yIG5hbWVfb2ZfY2FsbGFibGUgaW4gbmFtZXNfb2ZfY2FsbGFibGVzWyBjYXRlZ29yeSBdXG4gICAgICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTQgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICAgIHsgbmFtZSxcbiAgICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE1IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByX3N0cmluZyBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIHZhbHVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE2IERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBzdGVwLFxuICAgICAgICAgIHJlc3VsdCxcbiAgICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE3IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByX3N0cmluZyBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE4IERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBzdGVwLFxuICAgICAgICAgIGludmVyc2UsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBwYXJhbWV0ZXJzLFxuICAgICAgICAgIGNvbHVtbnMsXG4gICAgICAgICAgcm93cyxcbiAgICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjMgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQGZ1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJlZ2V4cDpcbiAgICAgICAgICB2YWx1ZTogKCBwYXR0ZXJuLCB0ZXh0ICkgLT4gaWYgKCAoIG5ldyBSZWdFeHAgcGF0dGVybiwgJ3YnICkudGVzdCB0ZXh0ICkgdGhlbiAxIGVsc2UgMFxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgc3RkX2lzX3VjX25vcm1hbDpcbiAgICAgICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgICAgICBsb29wXG4gICAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgICA7bnVsbFxuXG4gICAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAYnVpbGQ6IFtcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdmlld3MgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBcInN0ZF9yZWxhdGlvbnNcIiBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgICAgICBdXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNfcm5nIGV4dGVuZHMgRGJyaWNfc3RkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICdybmcnXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQGZ1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ192YWxpZGF0ZV9sbzpcbiAgICAgICAgICB2YWx1ZTogKCBsbyApIC0+XG4gICAgICAgICAgICByZXR1cm4gRmFsc2UgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBsb1xuICAgICAgICAgICAgcmV0dXJuIFRydWVcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ192YWxpZGF0ZV9oaTpcbiAgICAgICAgICB2YWx1ZTogKCBoaSApIC0+XG4gICAgICAgICAgICByZXR1cm4gRmFsc2UgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBoaVxuICAgICAgICAgICAgcmV0dXJuIFRydWVcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ192YWxpZGF0ZV9sb2hpOlxuICAgICAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+XG4gICAgICAgICAgICByZXR1cm4gRmFsc2UgdW5sZXNzIGxvIDw9IGhpXG4gICAgICAgICAgICByZXR1cm4gVHJ1ZVxuXG4gICAgICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBAdGFibGVfZnVuY3Rpb25zOlxuXG4gICAgICAjICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyAgIHJuZ196enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6ejpcbiAgICAgICMgICAgIGNvbHVtbnM6ICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAjICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICMgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAjICAgICAgIHlpZWxkIHJldHVybiBudWxsXG4gICAgICAjICAgICAgIDtudWxsXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQHN0YXRlbWVudHM6XG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBybmdfYWRkX3JhbmdlOiBTUUxcIlwiXCJcbiAgICAgICAgICBpbnNlcnQgaW50byBybmdfcmFuZ2VzICggbG8sIGhpLCBkYXRhICkgdmFsdWVzICggJGxvLCAkaGksICRkYXRhIClcbiAgICAgICAgICAgIDtcIlwiXCJcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ19hbGxfcmFuZ2VzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHJuZ19yYW5nZXMgb3JkZXIgYnkgaWQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGJ1aWxkOiBbXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBybmdfcmFuZ2VzIChcbiAgICAgICAgICAgIGlkICAgICAgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBhdXRvaW5jcmVtZW50LFxuICAgICAgICAgICAgbG8gICAgICBpbnRlZ2VyIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICBpbnRlZ2VyIG5vdCBudWxsLFxuICAgICAgICAgICAgZGF0YSAgICBqc29uICAgIG5vdCBudWxsLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWxvX2lzYV9udW1iZXJfXzI0XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfbG8oIGxvICkgKVxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhpX2lzYV9udW1iZXJfXzI1XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfaGkoIGhpICkgKVxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWxvX2x0ZV9oaV9ybmdfXzI2XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfbG9oaSggbG8sIGhpICkgKVxuICAgICAgICAgICk7XCJcIlwiXG4gICAgICAgIF1cblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICAgIERicmljLFxuICAgICAgRGJyaWNfc3RkLFxuICAgICAgRGJyaWNfcm5nLFxuICAgICAgZXNxbCxcbiAgICAgIFNRTCxcbiAgICAgIFRydWUsXG4gICAgICBGYWxzZSxcbiAgICAgIGZyb21fYm9vbCxcbiAgICAgIGFzX2Jvb2wsXG4gICAgICBpbnRlcm5hbHM6IE9iamVjdC5mcmVlemUgeyB0eXBlX29mLCBjcmVhdGVfc3RhdGVtZW50X3JlLCB0ZW1wbGF0ZXMsIH1cbiAgICAgIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFVOU1RBQkxFX0RCUklDX0JSSUNTXG5cbiJdfQ==
