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
              function: ['call'],
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
            var call, deterministic, directOnly, name, overwrite, varargs;
            if ((type_of(this.db.function)) !== 'function') {
              throw new Error(`Ωdbric__14 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined functions`);
            }
            ({name, overwrite, call, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__15 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.function(name, {deterministic, varargs, directOnly}, call);
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
            call: function(pattern, text) {
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
            call: function(text, form = 'NFC') {
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
            call: function(lo) {
              if (!Number.isFinite(lo)) {
                return False;
              }
              return True;
            }
          },
          //---------------------------------------------------------------------------------------------------
          rng_validate_hi: {
            call: function(hi) {
              if (!Number.isFinite(hi)) {
                return False;
              }
              return True;
            }
          },
          //---------------------------------------------------------------------------------------------------
          rng_validate_lohi: {
            call: function(lo, hi) {
              debug('Ωdbric__11', this);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsT0FBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSwwQkFBQSxFQUFBLHVCQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQTs7TUFDSSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSO01BQ2xDLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRGxDO01BRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBbEMsRUFKSjs7O01BT0ksQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFsQztNQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw0QkFBVixDQUFBLENBQXdDLENBQUMsTUFEM0U7TUFFQSxNQUFBLEdBQWtDLE9BQUEsQ0FBUSxhQUFSO01BQ2xDLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQ2tDLE9BRGxDO01BRUEsTUFBQSxHQUFrQyxNQUFBLENBQU8sUUFBUDtNQUNsQyxDQUFBLENB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QVA7O0FBQ0EscUJBQU87WUFGSDtVQUFOLENBUEY7O1VBWUEsaUJBQUEsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFBLENBQUUsRUFBRixFQUFNLEVBQU4sQ0FBQTtjQUNKLEtBQUEsQ0FBTSxZQUFOLEVBQW9CLElBQXBCO2NBQ0EsTUFBb0IsRUFBQSxJQUFNLEdBQTFCO0FBQUEsdUJBQU8sTUFBUDs7QUFDQSxxQkFBTztZQUhIO1VBQU47UUFiRjs7Ozs7Ozs7Ozs7Ozs7UUE4QkYsU0FBQyxDQUFBLFVBQUQsR0FHRSxDQUFBOztVQUFBLGFBQUEsRUFBZSxHQUFHLENBQUE7R0FBQSxDQUFsQjs7VUFLQSxjQUFBLEVBQWdCLEdBQUcsQ0FBQSxxQ0FBQTtRQUxuQjs7O1FBU0YsU0FBQyxDQUFBLEtBQUQsR0FBUTtVQUNOLEdBQUcsQ0FBQTs7Ozs7Ozs7RUFBQSxDQURHOzs7OztvQkF0bUJkOztBQW9uQkksYUFBTyxPQUFBLEdBQVU7UUFDZixLQURlO1FBRWYsU0FGZTtRQUdmLFNBSGU7UUFJZixJQUplO1FBS2YsR0FMZTtRQU1mLElBTmU7UUFPZixLQVBlO1FBUWYsU0FSZTtRQVNmLE9BVGU7UUFVZixTQUFBLEVBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLE9BQUYsRUFBVyxtQkFBWCxFQUFnQyxTQUFoQyxDQUFkO01BVkk7SUF0bkJKO0VBQWYsRUFWRjs7O0VBK29CQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixvQkFBOUI7QUEvb0JBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5VTlNUQUJMRV9EQlJJQ19CUklDUyA9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZGJyaWM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gICAgeyBoaWRlLFxuICAgICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4gICAgIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbmFtZWl0KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyBsZXRzLFxuICAgICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAgIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgICB7IGRlYnVnLFxuICAgICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICAgIHsgZ2V0X3Byb3RvdHlwZV9jaGFpbixcbiAgICAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG4gICAgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICAgIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgIHdoaWxlIHg/XG4gICAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICAgIF4gXFxzKlxuICAgICAgY3JlYXRlIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgICAvLy9pc1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgYGBgXG4gICAgY29uc3QgVHJ1ZSAgPSAxO1xuICAgIGNvbnN0IEZhbHNlID0gMDtcbiAgICBgYGBcblxuICAgIGZyb21fYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICAgICAgd2hlbiBmYWxzZSB0aGVuIEZhbHNlXG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panpyc2RiX19fMSBleHBlY3RlZCB0cnVlIG9yIGZhbHNlLCBnb3QgI3tycHIgeH1cIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICAgIHdoZW4gVHJ1ZSAgIHRoZW4gdHJ1ZVxuICAgICAgd2hlbiBGYWxzZSAgdGhlbiBmYWxzZVxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBFc3FsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzQgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHJfc3RyaW5nIG5hbWV9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgSTogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIEw6ICggeCApID0+XG4gICAgICAjICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgIyAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICMgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgIyAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgVjogKCB4ICkgPT5cbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgICMgICByZXR1cm4gJyggJyArICggKCBATCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAgICMgICBpZHggPSAtMVxuICAgICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICAgIyAgICAgaWR4KytcbiAgICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAgICMgICAgIHRocm93IG5ldyBFLkRCYXlfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgICByZXR1cm4gUlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgICAgQGZ1bmN0aW9uczogICB7fVxuICAgICAgQHN0YXRlbWVudHM6ICB7fVxuICAgICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGRiX2NsYXNzICAgICAgICAgICAgICAgICAgPSAoIGNmZz8uZGJfY2xhc3MgKSA/IGNsYXN6LmRiX2NsYXNzXG4gICAgICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBuZXcgZGJfY2xhc3MgZGJfcGF0aFxuICAgICAgICAjIEBkYiAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgICAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgeyBjb2x1bW5zOiBudWxsLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyMjIE5PVEUgQSAnZnJlc2gnIERCIGluc3RhbmNlIGlzIGEgREIgdGhhdCBzaG91bGQgYmUgKHJlLSlidWlsdCBhbmQvb3IgKHJlLSlwb3B1bGF0ZWQ7IGluXG4gICAgICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICAgIEBpc19mcmVzaCA9IG5vdCBAaXNfcmVhZHlcbiAgICAgICAgQGJ1aWxkKClcbiAgICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAgICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHJfc3RyaW5nIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgdGVhcmRvd246ICh7IHRlc3QgPSBudWxsLCB9PXt9KSAtPlxuICAgICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gdGVzdCBpcyAnKidcbiAgICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiB0cnVlXG4gICAgICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICB3aGVuIG5vdCB0ZXN0P1xuICAgICAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHByZWZpeF9yZS50ZXN0IG5hbWVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNiBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tlc3FsLkkgbmFtZX07XCIgKS5ydW4oKVxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVidWlsZDogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgICAgYnVpbGRfc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ2J1aWxkJyApLnJldmVyc2UoKVxuICAgICAgICBoYXNfdG9ybl9kb3duICAgICAgICAgPSBmYWxzZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgYnVpbGRfc3RhdGVtZW50cyApIGluIFsgJ3VuZGVmaW5lZCcsICdudWxsJywgJ2xpc3QnLCBdXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGNvbnRpbnVlIGlmICggbm90IGJ1aWxkX3N0YXRlbWVudHM/ICkgb3IgKCBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aCBpcyAwIClcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIEB0ZWFyZG93bigpIHVubGVzcyBoYXNfdG9ybl9kb3duXG4gICAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICAgICAgY291bnQrK1xuICAgICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXhfcmUnLCAgICAgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX185ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByX3N0cmluZyBtZXNzYWdlc31cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICAgIHJldHVybiAnJyBpZiAoIG5vdCBAY2ZnLnByZWZpeD8gKSBvciAoIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJyApXG4gICAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgICAgIHJldHVybiAvLy8gXiBfPyAje1JlZ0V4cC5lc2NhcGUgQHByZWZpeH0gXyAuKiAkIC8vL1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X3c6IC0+XG4gICAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aFxuICAgICAgICByZXR1cm4gQF93XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgICAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICAgICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGRiX29iamVjdHMgICAgICA9IHt9XG4gICAgICAgIHN0YXRlbWVudF9jb3VudCA9IDBcbiAgICAgICAgZXJyb3JfY291bnQgICAgID0gMFxuICAgICAgICBmb3Igc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkID8gW11cbiAgICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICAgIGlmICggbWF0Y2ggPSBzdGF0ZW1lbnQubWF0Y2ggY3JlYXRlX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgICAgeyBuYW1lLFxuICAgICAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHJfc3RyaW5nIHN0YXRlbWVudH1cIlxuICAgICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgICAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIGZvciBuYW1lLCBzcWwgb2YgY2xhc3ouc3RhdGVtZW50c1xuICAgICAgICAjICAgc3dpdGNoIHRydWVcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2NyZWF0ZV90YWJsZV8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnaW5zZXJ0XydcbiAgICAgICAgIyAgICAgICBudWxsXG4gICAgICAgICMgICAgIGVsc2VcbiAgICAgICAgIyAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqW5xbF9fMTAgdW5hYmxlIHRvIHBhcnNlIHN0YXRlbWVudCBuYW1lICN7cnByX3N0cmluZyBuYW1lfVwiXG4gICAgICAgICMgIyAgIEBbIG5hbWUgXSA9IEBwcmVwYXJlIHNxbFxuICAgICAgICBjbGFzeiA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICAgICAgZm9yIHN0YXRlbWVudF9uYW1lLCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50c1xuICAgICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIHN0YXRlbWVudCAje3Jwcl9zdHJpbmcgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgICAgIyBpZiAoIHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ2xpc3QnXG4gICAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSAoIEBwcmVwYXJlIHN1Yl9zdGF0ZW1lbnQgZm9yIHN1Yl9zdGF0ZW1lbnQgaW4gc3RhdGVtZW50IClcbiAgICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgICAgIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gICAgICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHRyeVxuICAgICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMyB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBGVU5DVElPTlNcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2NyZWF0ZV91ZGZzOiAtPlxuICAgICAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgICAgbmFtZXNfb2ZfY2FsbGFibGVzICA9XG4gICAgICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ2NhbGwnLCBdXG4gICAgICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIGNhbGwsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE1IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByX3N0cmluZyBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIGNhbGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTYgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTcgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTggREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjAgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgY29sdW1ucyxcbiAgICAgICAgICByb3dzLFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICAgIHsgbmFtZSxcbiAgICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgcmVnZXhwOlxuICAgICAgICAgIGNhbGw6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHN0ZF9pc191Y19ub3JtYWw6XG4gICAgICAgICAgIyMjIE5PVEU6IGFsc28gc2VlIGBTdHJpbmc6OmlzV2VsbEZvcm1lZCgpYCAjIyNcbiAgICAgICAgICBjYWxsOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgICAgICBsb29wXG4gICAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgICA7bnVsbFxuXG4gICAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAYnVpbGQ6IFtcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdmlld3MgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBcInN0ZF9yZWxhdGlvbnNcIiBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgICAgICBdXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNfcm5nIGV4dGVuZHMgRGJyaWNfc3RkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICdybmcnXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQGZ1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ192YWxpZGF0ZV9sbzpcbiAgICAgICAgICBjYWxsOiAoIGxvICkgLT5cbiAgICAgICAgICAgIHJldHVybiBGYWxzZSB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIGxvXG4gICAgICAgICAgICByZXR1cm4gVHJ1ZVxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgcm5nX3ZhbGlkYXRlX2hpOlxuICAgICAgICAgIGNhbGw6ICggaGkgKSAtPlxuICAgICAgICAgICAgcmV0dXJuIEZhbHNlIHVubGVzcyBOdW1iZXIuaXNGaW5pdGUgaGlcbiAgICAgICAgICAgIHJldHVybiBUcnVlXG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBybmdfdmFsaWRhdGVfbG9oaTpcbiAgICAgICAgICBjYWxsOiAoIGxvLCBoaSApIC0+XG4gICAgICAgICAgICBkZWJ1ZyAnzqlkYnJpY19fMTEnLCBAXG4gICAgICAgICAgICByZXR1cm4gRmFsc2UgdW5sZXNzIGxvIDw9IGhpXG4gICAgICAgICAgICByZXR1cm4gVHJ1ZVxuXG4gICAgICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBAdGFibGVfZnVuY3Rpb25zOlxuXG4gICAgICAjICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyAgIHJuZ196enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6ejpcbiAgICAgICMgICAgIGNvbHVtbnM6ICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAjICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICMgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAjICAgICAgIHlpZWxkIHJldHVybiBudWxsXG4gICAgICAjICAgICAgIDtudWxsXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgQHN0YXRlbWVudHM6XG5cbiAgICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBybmdfYWRkX3JhbmdlOiBTUUxcIlwiXCJcbiAgICAgICAgICBpbnNlcnQgaW50byBybmdfcmFuZ2VzICggbG8sIGhpLCBkYXRhICkgdmFsdWVzICggJGxvLCAkaGksICRkYXRhIClcbiAgICAgICAgICAgIDtcIlwiXCJcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJuZ19hbGxfcmFuZ2VzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHJuZ19yYW5nZXMgb3JkZXIgYnkgaWQ7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGJ1aWxkOiBbXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBybmdfcmFuZ2VzIChcbiAgICAgICAgICAgIGlkICAgICAgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBhdXRvaW5jcmVtZW50LFxuICAgICAgICAgICAgbG8gICAgICBpbnRlZ2VyIG5vdCBudWxsLFxuICAgICAgICAgICAgaGkgICAgICBpbnRlZ2VyIG5vdCBudWxsLFxuICAgICAgICAgICAgZGF0YSAgICBqc29uICAgIG5vdCBudWxsLFxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWxvX2lzYV9udW1iZXJfXzI0XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfbG8oIGxvICkgKVxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWhpX2lzYV9udW1iZXJfXzI1XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfaGkoIGhpICkgKVxuICAgICAgICAgIGNvbnN0cmFpbnQgXCLOqWxvX2x0ZV9oaV9ybmdfXzI2XCIgY2hlY2sgKCBybmdfdmFsaWRhdGVfbG9oaSggbG8sIGhpICkgKVxuICAgICAgICAgICk7XCJcIlwiXG4gICAgICAgIF1cblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICAgIERicmljLFxuICAgICAgRGJyaWNfc3RkLFxuICAgICAgRGJyaWNfcm5nLFxuICAgICAgZXNxbCxcbiAgICAgIFNRTCxcbiAgICAgIFRydWUsXG4gICAgICBGYWxzZSxcbiAgICAgIGZyb21fYm9vbCxcbiAgICAgIGFzX2Jvb2wsXG4gICAgICBpbnRlcm5hbHM6IE9iamVjdC5mcmVlemUgeyB0eXBlX29mLCBjcmVhdGVfc3RhdGVtZW50X3JlLCB0ZW1wbGF0ZXMsIH1cbiAgICAgIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFVOU1RBQkxFX0RCUklDX0JSSUNTXG5cbiJdfQ==
