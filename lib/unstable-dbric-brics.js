(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_std, Esql, SFMODULES, SQL, SQLITE, Segment_width_db, Undumper, create_statement_re, debug, esql, exports, freeze, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, internals, lets, misfit, rpr_string, set_getter, templates, type_of, warn;
      //=======================================================================================================
      SFMODULES = require('./main');
      ({hide, set_getter} = SFMODULES.require_managed_property_tools());
      ({type_of} = SFMODULES.unstable.require_type_of());
      // { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
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
      //-------------------------------------------------------------------------------------------------------
      internals = {type_of, create_statement_re, templates};
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
            throw new Error(`Ωdbric___1 expected a text, got a ${type}`);
          }
          switch (true) {
            case /^[^"](.*)[^"]$/.test(name):
              return name;
            case /^"(.+)"$/.test(name):
              return name.slice(1, name.length - 1).replace(/""/g, '"');
          }
          throw new Error(`Ωdbric___2 expected a name, got ${rpr_string(name)}`);
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
            var clasz, fn_cfg_template;
            this._validate_is_property('is_ready');
            this._validate_is_property('prefix');
            this._validate_is_property('prefix_re');
            //...................................................................................................
            if (db_path == null) {
              db_path = ':memory:';
            }
            //...................................................................................................
            clasz = this.constructor;
            hide(this, 'db', new clasz.db_class(db_path));
            // @db                 = new SQLITE.DatabaseSync db_path
            this.cfg = Object.freeze({...clasz.cfg, db_path, ...cfg});
            hide(this, 'statements', {});
            hide(this, '_w', null);
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
            throw new Error(`Ωdbric___3 not allowed to override property ${rpr_string(name)}; use '_get_${name} instead`);
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
                throw new Error(`Ωdbric___4 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
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
                  warn(`Ωdbric___5 ignored error: ${error.message}`);
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
                throw new Error(`Ωdbric___6 expected an optional list for ${clasz.name}.build, got a ${type}`);
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
              throw new Error(`Ωdbric___7 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr_string(messages)}`);
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
            //       throw new Error "Ωnql___8 unable to parse statement name #{rpr_string name}"
            // #   @[ name ] = @prepare sql
            clasz = this.constructor;
            statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
            for (i = 0, len = statements_list.length; i < len; i++) {
              statements = statements_list[i];
              for (statement_name in statements) {
                statement = statements[statement_name];
                if (this.statements[statement_name] != null) {
                  throw new Error(`Ωdbric___9 statement ${rpr_string(statement_name)} is already declared`);
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
            return (this.db.prepare(sql)).iterate(...P);
          }

          //-----------------------------------------------------------------------------------------------------
          prepare(sql) {
            var R, cause;
            try {
              R = this.db.prepare(sql);
            } catch (error1) {
              cause = error1;
              throw new Error(`Ωdbric__10 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
            }
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
              throw new Error(`Ωdbric__11 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined functions`);
            }
            ({name, overwrite, call, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__12 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.function(name, {deterministic, varargs, directOnly}, call);
          }

          //-----------------------------------------------------------------------------------------------------
          create_aggregate_function(cfg) {
            var deterministic, directOnly, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__13 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined aggregate functions`);
            }
            ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__14 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_window_function(cfg) {
            var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__15 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined window functions`);
            }
            ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__16 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_table_function(cfg) {
            var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__17 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide table-valued user-defined functions`);
            }
            ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__18 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_virtual_table(cfg) {
            var create, name, overwrite;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__19 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined virtual tables`);
            }
            ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__20 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
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

        //-----------------------------------------------------------------------------------------------------
        Dbric_std.functions = {
          //---------------------------------------------------------------------------------------------------
          regexp: {
            deterministic: true,
            call: function(pattern, text) {
              if ((new RegExp(pattern, 'v')).test(text)) {
                return 1;
              } else {
                return 0;
              }
            }
          }
        };

        //-----------------------------------------------------------------------------------------------------
        Dbric_std.statements = {
          std_get_schema: SQL`select * from sqlite_schema order by name, type;`,
          std_get_tables: SQL`select * from sqlite_schema where type is 'table' order by name, type;`,
          std_get_views: SQL`select * from sqlite_schema where type is 'view' order by name, type;`,
          std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' ) order by name, type;`
        };

        //-----------------------------------------------------------------------------------------------------
        Dbric_std.build = [
          SQL`create view std_tables as
select * from sqlite_schema
  where type is 'table' order by name, type;`,
          SQL`create view std_views as
select * from sqlite_schema
  where type is 'view' order by name, type;`,
          SQL`create view "std_relations" as
select * from sqlite_schema
  where type in ( 'table', 'view' ) order by name, type;`
        ];

        return Dbric_std;

      }).call(this);
      Segment_width_db = (function() {
        //=======================================================================================================
        class Segment_width_db extends Dbric {
          //-----------------------------------------------------------------------------------------------------
          constructor(db_path) {
            var clasz;
            super(db_path);
            clasz = this.constructor;
            this.cache = new Map();
            /* TAINT should be done automatically */
            this.statements = {
              insert_segment: this.prepare(clasz.statements.insert_segment),
              select_row_from_segments: this.prepare(clasz.statements.select_row_from_segments)
            };
            return void 0;
          }

        };

        //-----------------------------------------------------------------------------------------------------
        Segment_width_db.functions = {
          //...................................................................................................
          width_from_text: {
            deterministic: true,
            varargs: false,
            call: function(text) {
              return get_wc_max_line_length(text);
            }
          },
          //...................................................................................................
          length_from_text: {
            deterministic: true,
            varargs: false,
            call: function(text) {
              return text.length;
            }
          }
        };

        //-----------------------------------------------------------------------------------------------------
        Segment_width_db.statements = {
          //...................................................................................................
          create_table_segments: SQL`drop table if exists segments;
create table segments (
    segment_text      text    not null primary key,
    segment_width     integer not null generated always as ( width_from_text(  segment_text ) ) stored,
    segment_length    integer not null generated always as ( length_from_text( segment_text ) ) stored,
  constraint segment_width_eqgt_zero  check ( segment_width  >= 0 ),
  constraint segment_length_eqgt_zero check ( segment_length >= 0 ) );`,
          // #.................................................................................................
          // insert_segment: SQL"""
          //   insert into segments  ( segment_text,   segment_width,  segment_length  )
          //                 values  ( $segment_text,  $segment_width, $segment_length )
          //     on conflict ( segment_text ) do update
          //                 set     (                 segment_width,  segment_length  ) =
          //                         ( excluded.segment_width, excluded.segment_length );"""
          //...................................................................................................
          insert_segment: SQL`insert into segments  ( segment_text  )
              values  ( $segment_text )
  on conflict ( segment_text ) do nothing
  returning *;`,
          //...................................................................................................
          select_row_from_segments: SQL`select * from segments where segment_text = $segment_text limit 1;`
        };

        return Segment_width_db;

      }).call(this);
      //=======================================================================================================
      internals = Object.freeze({...internals, Segment_width_db});
      return exports = {Dbric, Dbric_std, esql, SQL, internals};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, UNSTABLE_DBRIC_BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxFQUFBLGdCQUFBLEVBQUEsUUFBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLDBCQUFBLEVBQUEsdUJBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQTs7TUFDSSxTQUFBLEdBQWtDLE9BQUEsQ0FBUSxRQUFSO01BQ2xDLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQ2tDLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRGxDO01BRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBbEMsRUFKSjs7TUFNSSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxrQkFBVixDQUFBLENBQWxDO01BQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxNQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDRCQUFWLENBQUEsQ0FBd0MsQ0FBQyxNQUQzRTtNQUVBLE1BQUEsR0FBa0MsT0FBQSxDQUFRLGFBQVI7TUFDbEMsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDa0MsT0FEbEM7TUFFQSxNQUFBLEdBQWtDLE1BQUEsQ0FBTyxRQUFQO01BQ2xDLENBQUEsQ0FBRSxtQkFBRixF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LE9BQUQsQ0FBUyxLQUFLLENBQUMsVUFBVSxDQUFDLHdCQUExQjtZQUQxQjtBQUVGLG1CQUFPO1VBUkk7O1FBNUNmOzs7UUFHRSxnQkFBQyxDQUFBLFNBQUQsR0FFRSxDQUFBOztVQUFBLGVBQUEsRUFDRTtZQUFBLGFBQUEsRUFBZ0IsSUFBaEI7WUFDQSxPQUFBLEVBQWdCLEtBRGhCO1lBRUEsSUFBQSxFQUFnQixRQUFBLENBQUUsSUFBRixDQUFBO3FCQUFZLHNCQUFBLENBQXVCLElBQXZCO1lBQVo7VUFGaEIsQ0FERjs7VUFLQSxnQkFBQSxFQUNFO1lBQUEsYUFBQSxFQUFnQixJQUFoQjtZQUNBLE9BQUEsRUFBZ0IsS0FEaEI7WUFFQSxJQUFBLEVBQWdCLFFBQUEsQ0FBRSxJQUFGLENBQUE7cUJBQVksSUFBSSxDQUFDO1lBQWpCO1VBRmhCO1FBTkY7OztRQVdGLGdCQUFDLENBQUEsVUFBRCxHQUVFLENBQUE7O1VBQUEscUJBQUEsRUFBdUIsR0FBRyxDQUFBOzs7Ozs7c0VBQUEsQ0FBMUI7Ozs7Ozs7OztVQWdCQSxjQUFBLEVBQWdCLEdBQUcsQ0FBQTs7O2NBQUEsQ0FoQm5COztVQXNCQSx3QkFBQSxFQUEwQixHQUFHLENBQUEsa0VBQUE7UUF0QjdCOzs7O29CQWxoQlI7O01BdWpCSSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUEsU0FBRixFQUFnQixnQkFBaEIsQ0FBZDtBQUNaLGFBQU8sT0FBQSxHQUFVLENBQ2YsS0FEZSxFQUVmLFNBRmUsRUFHZixJQUhlLEVBSWYsR0FKZSxFQUtmLFNBTGU7SUExakJKO0VBQWYsRUFWRjs7O0VBNmtCQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixvQkFBOUI7QUE3a0JBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5VTlNUQUJMRV9EQlJJQ19CUklDUyA9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZGJyaWM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gICAgeyBoaWRlLFxuICAgICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4gICAgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgbGV0cyxcbiAgICAgIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbiAgICBTUUxJVEUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICAgeyBkZWJ1ZyxcbiAgICAgIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICAgIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuICAgIHsgVW5kdW1wZXIsICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAgICMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICAgICMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICAgIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgICB3aGlsZSB4P1xuICAgICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgICBeIFxccypcbiAgICAgIGNyZWF0ZSBcXHMrXG4gICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgICAgLy8vaXNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbnRlcm5hbHMgPSB7IHR5cGVfb2YsIGNyZWF0ZV9zdGF0ZW1lbnRfcmUsIHRlbXBsYXRlcywgfVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBFc3FsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzIgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHJfc3RyaW5nIG5hbWV9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgSTogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIEw6ICggeCApID0+XG4gICAgICAjICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgIyAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICMgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgIyAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgVjogKCB4ICkgPT5cbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgICMgICByZXR1cm4gJyggJyArICggKCBATCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAgICMgICBpZHggPSAtMVxuICAgICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICAgIyAgICAgaWR4KytcbiAgICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAgICMgICAgIHRocm93IG5ldyBFLkRCYXlfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgICByZXR1cm4gUlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgICAgQGZ1bmN0aW9uczogICB7fVxuICAgICAgQHN0YXRlbWVudHM6ICB7fVxuICAgICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZGJfcGF0aCAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICBuZXcgY2xhc3ouZGJfY2xhc3MgZGJfcGF0aFxuICAgICAgICAjIEBkYiAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICAgIEBjZmcgICAgICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICBudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyMjIE5PVEUgQSAnZnJlc2gnIERCIGluc3RhbmNlIGlzIGEgREIgdGhhdCBzaG91bGQgYmUgKHJlLSlidWlsdCBhbmQvb3IgKHJlLSlwb3B1bGF0ZWQ7IGluXG4gICAgICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICAgIEBpc19mcmVzaCA9IG5vdCBAaXNfcmVhZHlcbiAgICAgICAgQGJ1aWxkKClcbiAgICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAgICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzMgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHJfc3RyaW5nIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgICAgIFIgPSB7fVxuICAgICAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgdGVhcmRvd246ICh7IHRlc3QgPSBudWxsLCB9PXt9KSAtPlxuICAgICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gdGVzdCBpcyAnKidcbiAgICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiB0cnVlXG4gICAgICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICB3aGVuIG5vdCB0ZXN0P1xuICAgICAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHByZWZpeF9yZS50ZXN0IG5hbWVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNCBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tlc3FsLkkgbmFtZX07XCIgKS5ydW4oKVxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzUgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVidWlsZDogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgICAgYnVpbGRfc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ2J1aWxkJyApLnJldmVyc2UoKVxuICAgICAgICBoYXNfdG9ybl9kb3duICAgICAgICAgPSBmYWxzZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgYnVpbGRfc3RhdGVtZW50cyApIGluIFsgJ3VuZGVmaW5lZCcsICdudWxsJywgJ2xpc3QnLCBdXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNiBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGNvbnRpbnVlIGlmICggbm90IGJ1aWxkX3N0YXRlbWVudHM/ICkgb3IgKCBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aCBpcyAwIClcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIEB0ZWFyZG93bigpIHVubGVzcyBoYXNfdG9ybl9kb3duXG4gICAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICAgICAgY291bnQrK1xuICAgICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXhfcmUnLCAgICAgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX183ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByX3N0cmluZyBtZXNzYWdlc31cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICAgIHJldHVybiAnJyBpZiAoIG5vdCBAY2ZnLnByZWZpeD8gKSBvciAoIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJyApXG4gICAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgICAgIHJldHVybiAvLy8gXiBfPyAje1JlZ0V4cC5lc2NhcGUgQHByZWZpeH0gXyAuKiAkIC8vL1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X3c6IC0+XG4gICAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aFxuICAgICAgICByZXR1cm4gQF93XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgICAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICAgICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGRiX29iamVjdHMgICAgICA9IHt9XG4gICAgICAgIHN0YXRlbWVudF9jb3VudCA9IDBcbiAgICAgICAgZXJyb3JfY291bnQgICAgID0gMFxuICAgICAgICBmb3Igc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkID8gW11cbiAgICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICAgIGlmICggbWF0Y2ggPSBzdGF0ZW1lbnQubWF0Y2ggY3JlYXRlX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgICAgeyBuYW1lLFxuICAgICAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHJfc3RyaW5nIHN0YXRlbWVudH1cIlxuICAgICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgICAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIGZvciBuYW1lLCBzcWwgb2YgY2xhc3ouc3RhdGVtZW50c1xuICAgICAgICAjICAgc3dpdGNoIHRydWVcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2NyZWF0ZV90YWJsZV8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnaW5zZXJ0XydcbiAgICAgICAgIyAgICAgICBudWxsXG4gICAgICAgICMgICAgIGVsc2VcbiAgICAgICAgIyAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqW5xbF9fXzggdW5hYmxlIHRvIHBhcnNlIHN0YXRlbWVudCBuYW1lICN7cnByX3N0cmluZyBuYW1lfVwiXG4gICAgICAgICMgIyAgIEBbIG5hbWUgXSA9IEBwcmVwYXJlIHNxbFxuICAgICAgICBjbGFzeiA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICAgICAgZm9yIHN0YXRlbWVudF9uYW1lLCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50c1xuICAgICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX185IHN0YXRlbWVudCAje3Jwcl9zdHJpbmcgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgICAgIyBpZiAoIHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ2xpc3QnXG4gICAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSAoIEBwcmVwYXJlIHN1Yl9zdGF0ZW1lbnQgZm9yIHN1Yl9zdGF0ZW1lbnQgaW4gc3RhdGVtZW50IClcbiAgICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHdhbGs6ICggc3FsLCBQLi4uICkgLT4gKCBAZGIucHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMCB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBGVU5DVElPTlNcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2NyZWF0ZV91ZGZzOiAtPlxuICAgICAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgICAgbmFtZXNfb2ZfY2FsbGFibGVzICA9XG4gICAgICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ2NhbGwnLCBdXG4gICAgICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIGNhbGwsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByX3N0cmluZyBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIGNhbGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTMgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTQgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTUgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNiBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTcgREIgYWRhcHRlciBjbGFzcyAje3Jwcl9zdHJpbmcgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgY29sdW1ucyxcbiAgICAgICAgICByb3dzLFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE5IERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICAgIHsgbmFtZSxcbiAgICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgcmVnZXhwOlxuICAgICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgICAgY2FsbDogKCBwYXR0ZXJuLCB0ZXh0ICkgLT4gaWYgKCAoIG5ldyBSZWdFeHAgcGF0dGVybiwgJ3YnICkudGVzdCB0ZXh0ICkgdGhlbiAxIGVsc2UgMFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd2aWV3JyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBidWlsZDogW1xuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzIGFzXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgICB3aGVyZSB0eXBlIGlzICd0YWJsZScgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzIGFzXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgICB3aGVyZSB0eXBlIGlzICd2aWV3JyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBcInN0ZF9yZWxhdGlvbnNcIiBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIF1cblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBTZWdtZW50X3dpZHRoX2RiIGV4dGVuZHMgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAZnVuY3Rpb25zOlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdpZHRoX2Zyb21fdGV4dDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICAgIGNhbGw6ICAgICAgICAgICAoIHRleHQgKSAtPiBnZXRfd2NfbWF4X2xpbmVfbGVuZ3RoIHRleHRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBsZW5ndGhfZnJvbV90ZXh0OlxuICAgICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgICAgY2FsbDogICAgICAgICAgICggdGV4dCApIC0+IHRleHQubGVuZ3RoXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQHN0YXRlbWVudHM6XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgY3JlYXRlX3RhYmxlX3NlZ21lbnRzOiBTUUxcIlwiXCJcbiAgICAgICAgICBkcm9wIHRhYmxlIGlmIGV4aXN0cyBzZWdtZW50cztcbiAgICAgICAgICBjcmVhdGUgdGFibGUgc2VnbWVudHMgKFxuICAgICAgICAgICAgICBzZWdtZW50X3RleHQgICAgICB0ZXh0ICAgIG5vdCBudWxsIHByaW1hcnkga2V5LFxuICAgICAgICAgICAgICBzZWdtZW50X3dpZHRoICAgICBpbnRlZ2VyIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCB3aWR0aF9mcm9tX3RleHQoICBzZWdtZW50X3RleHQgKSApIHN0b3JlZCxcbiAgICAgICAgICAgICAgc2VnbWVudF9sZW5ndGggICAgaW50ZWdlciBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggbGVuZ3RoX2Zyb21fdGV4dCggc2VnbWVudF90ZXh0ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBjb25zdHJhaW50IHNlZ21lbnRfd2lkdGhfZXFndF96ZXJvICBjaGVjayAoIHNlZ21lbnRfd2lkdGggID49IDAgKSxcbiAgICAgICAgICAgIGNvbnN0cmFpbnQgc2VnbWVudF9sZW5ndGhfZXFndF96ZXJvIGNoZWNrICggc2VnbWVudF9sZW5ndGggPj0gMCApICk7XCJcIlwiXG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBpbnNlcnRfc2VnbWVudDogU1FMXCJcIlwiXG4gICAgICAgICMgICBpbnNlcnQgaW50byBzZWdtZW50cyAgKCBzZWdtZW50X3RleHQsICAgc2VnbWVudF93aWR0aCwgIHNlZ21lbnRfbGVuZ3RoICApXG4gICAgICAgICMgICAgICAgICAgICAgICAgIHZhbHVlcyAgKCAkc2VnbWVudF90ZXh0LCAgJHNlZ21lbnRfd2lkdGgsICRzZWdtZW50X2xlbmd0aCApXG4gICAgICAgICMgICAgIG9uIGNvbmZsaWN0ICggc2VnbWVudF90ZXh0ICkgZG8gdXBkYXRlXG4gICAgICAgICMgICAgICAgICAgICAgICAgIHNldCAgICAgKCAgICAgICAgICAgICAgICAgc2VnbWVudF93aWR0aCwgIHNlZ21lbnRfbGVuZ3RoICApID1cbiAgICAgICAgIyAgICAgICAgICAgICAgICAgICAgICAgICAoIGV4Y2x1ZGVkLnNlZ21lbnRfd2lkdGgsIGV4Y2x1ZGVkLnNlZ21lbnRfbGVuZ3RoICk7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0X3NlZ21lbnQ6IFNRTFwiXCJcIlxuICAgICAgICAgIGluc2VydCBpbnRvIHNlZ21lbnRzICAoIHNlZ21lbnRfdGV4dCAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzICAoICRzZWdtZW50X3RleHQgKVxuICAgICAgICAgICAgb24gY29uZmxpY3QgKCBzZWdtZW50X3RleHQgKSBkbyBub3RoaW5nXG4gICAgICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzZWxlY3Rfcm93X2Zyb21fc2VnbWVudHM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc2VnbWVudHMgd2hlcmUgc2VnbWVudF90ZXh0ID0gJHNlZ21lbnRfdGV4dCBsaW1pdCAxO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGggKSAtPlxuICAgICAgICBzdXBlciBkYl9wYXRoXG4gICAgICAgIGNsYXN6ICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgQGNhY2hlICA9IG5ldyBNYXAoKVxuICAgICAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIGRvbmUgYXV0b21hdGljYWxseSAjIyNcbiAgICAgICAgQHN0YXRlbWVudHMgPVxuICAgICAgICAgIGluc2VydF9zZWdtZW50OiAgICAgICAgICAgQHByZXBhcmUgY2xhc3ouc3RhdGVtZW50cy5pbnNlcnRfc2VnbWVudFxuICAgICAgICAgIHNlbGVjdF9yb3dfZnJvbV9zZWdtZW50czogQHByZXBhcmUgY2xhc3ouc3RhdGVtZW50cy5zZWxlY3Rfcm93X2Zyb21fc2VnbWVudHNcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCBTZWdtZW50X3dpZHRoX2RiLCB9XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgICBEYnJpYyxcbiAgICAgIERicmljX3N0ZCxcbiAgICAgIGVzcWwsXG4gICAgICBTUUwsXG4gICAgICBpbnRlcm5hbHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFVOU1RBQkxFX0RCUklDX0JSSUNTXG5cbiJdfQ==
