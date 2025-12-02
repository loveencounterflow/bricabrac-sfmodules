(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_std, Esql, SFMODULES, SQL, SQLITE, Segment_width_db, create_statement_re, debug, esql, exports, freeze, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, internals, lets, misfit, rpr_string, set_getter, templates, type_of, warn;
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
          teardown() {
            var _, count, error, name, prefix_re, ref, type;
            count = 0;
            prefix_re = this.prefix_re;
            (this.prepare(SQL`pragma foreign_keys = off;`)).run();
            ref = this._get_db_objects();
            for (_ in ref) {
              ({name, type} = ref[_]);
              if (!prefix_re.test(name)) {
                continue;
              }
              count++;
              try {
                (this.prepare(SQL`drop ${type} ${esql.I(name)};`)).run();
              } catch (error1) {
                error = error1;
                warn(`Ωdbric___4 ignored error: ${error.message}`);
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
                throw new Error(`Ωdbric___5 expected an optional list for ${clasz.name}.build, got a ${type}`);
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
              throw new Error(`Ωdbric___6 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr_string(messages)}`);
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
            //       throw new Error "Ωnql___7 unable to parse statement name #{rpr_string name}"
            // #   @[ name ] = @prepare sql
            clasz = this.constructor;
            statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
            for (i = 0, len = statements_list.length; i < len; i++) {
              statements = statements_list[i];
              for (statement_name in statements) {
                statement = statements[statement_name];
                if (this.statements[statement_name] != null) {
                  throw new Error(`Ωdbric__10 statement ${rpr_string(statement_name)} is already declared`);
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
              throw new Error(`Ωdbric___9 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
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
              throw new Error(`Ωdbric__10 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined functions`);
            }
            ({name, overwrite, call, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__10 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.function(name, {deterministic, varargs, directOnly}, call);
          }

          //-----------------------------------------------------------------------------------------------------
          create_aggregate_function(cfg) {
            var deterministic, directOnly, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__11 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined aggregate functions`);
            }
            ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__10 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_window_function(cfg) {
            var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__12 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined window functions`);
            }
            ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__10 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_table_function(cfg) {
            var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__13 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide table-valued user-defined functions`);
            }
            ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__10 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
            }
            return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_virtual_table(cfg) {
            var create, name, overwrite;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__14 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined virtual tables`);
            }
            ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
            if ((!overwrite) && (this._function_names.has(name))) {
              throw new Error(`Ωdbric__10 a UDF or built-in function named ${rpr_string(name)} has already been declared`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxFQUFBLGdCQUFBLEVBQUEsbUJBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsMEJBQUEsRUFBQSx1QkFBQSxFQUFBLG1CQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBOztNQUNJLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVI7TUFDbEMsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsU0FBUyxDQUFDLDhCQUFWLENBQUEsQ0FEbEM7TUFFQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFsQyxFQUpKOztNQU1JLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBbEM7TUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLE1BREYsQ0FBQSxHQUNrQyxTQUFTLENBQUMsNEJBQVYsQ0FBQSxDQUF3QyxDQUFDLE1BRDNFO01BRUEsTUFBQSxHQUFrQyxPQUFBLENBQVEsYUFBUjtNQUNsQyxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQztNQUVBLE1BQUEsR0FBa0MsTUFBQSxDQUFPLFFBQVA7TUFDbEMsQ0FBQSxDQUFFLG1CQUFGLEVBQ0UsMEJBREYs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LENBQUUsR0FBQSxTQUFGLEVBQWdCLGdCQUFoQixDQUFkO0FBQ1osYUFBTyxPQUFBLEdBQVUsQ0FDZixLQURlLEVBRWYsU0FGZSxFQUdmLElBSGUsRUFJZixHQUplLEVBS2YsU0FMZTtJQTdpQko7RUFBZixFQVZGOzs7RUFna0JBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLG9CQUE5QjtBQWhrQkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblVOU1RBQkxFX0RCUklDX0JSSUNTID1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9kYnJpYzogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgICAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyBsZXRzLFxuICAgICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAgIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgICB7IGRlYnVnLFxuICAgICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICAgIHsgZ2V0X3Byb3RvdHlwZV9jaGFpbixcbiAgICAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICAgIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgIHdoaWxlIHg/XG4gICAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICAgIF4gXFxzKlxuICAgICAgY3JlYXRlIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgICAvLy9pc1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGludGVybmFscyA9IHsgdHlwZV9vZiwgY3JlYXRlX3N0YXRlbWVudF9yZSwgdGVtcGxhdGVzLCB9XG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIEVzcWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgdW5xdW90ZV9uYW1lOiAoIG5hbWUgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzEgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgICB3aGVuIC9eXCIoLispXCIkLy50ZXN0ICAgICAgICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVbIDEgLi4uIG5hbWUubGVuZ3RoIC0gMSBdLnJlcGxhY2UgL1wiXCIvZywgJ1wiJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMiBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBJOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgTDogKCB4ICkgPT5cbiAgICAgICMgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgIyAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB4XG4gICAgICAjICAgICB3aGVuICd0ZXh0JyAgICAgICB0aGVuIHJldHVybiAgXCInXCIgKyAoIHgucmVwbGFjZSAvJy9nLCBcIicnXCIgKSArIFwiJ1wiXG4gICAgICAjICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgIyAgICAgd2hlbiAnZmxvYXQnICAgICAgdGhlbiByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAjICAgICB3aGVuICdib29sZWFuJyAgICB0aGVuIHJldHVybiAoIGlmIHggdGhlbiAnMScgZWxzZSAnMCcgKVxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgIyAgIHRocm93IG5ldyBFLkRCYXlfc3FsX3ZhbHVlX2Vycm9yICdeZGJheS9zcWxAMV4nLCB0eXBlLCB4XG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBWOiAoIHggKSA9PlxuICAgICAgIyAgIHRocm93IG5ldyBFLkRCYXlfc3FsX25vdF9hX2xpc3RfZXJyb3IgJ15kYmF5L3NxbEAyXicsIHR5cGUsIHggdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgIyAgIHJldHVybiAnKCAnICsgKCAoIEBMIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICAgIyAgIGlkeCA9IC0xXG4gICAgICAjICAgcmV0dXJuIHNxbC5yZXBsYWNlIEBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuLCAoICQwLCBvcGVuZXIsIGZvcm1hdCwgbmFtZSApID0+XG4gICAgICAjICAgICBpZHgrK1xuICAgICAgIyAgICAgc3dpdGNoIG9wZW5lclxuICAgICAgIyAgICAgICB3aGVuICckJ1xuICAgICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICAgIyAgICAgICAgIGtleSA9IG5hbWVcbiAgICAgICMgICAgICAgd2hlbiAnPydcbiAgICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAgICMgICAgIHZhbHVlID0gdmFsdWVzWyBrZXkgXVxuICAgICAgIyAgICAgc3dpdGNoIGZvcm1hdFxuICAgICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ0wnICAgICAgdGhlbiByZXR1cm4gQEwgdmFsdWVcbiAgICAgICMgICAgICAgd2hlbiAnVicgICAgICB0aGVuIHJldHVybiBAViB2YWx1ZVxuICAgICAgIyAgICAgdGhyb3cgbmV3IEUuREJheV9pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duICdeZGJheS9zcWxAM14nLCBmb3JtYXRcbiAgICAgICMgX2ludGVycG9sYXRpb25fcGF0dGVybjogLyg/PG9wZW5lcj5bJD9dKSg/PGZvcm1hdD4uPyk6KD88bmFtZT5cXHcqKS9nXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUwgPSAoIHBhcnRzLCBleHByZXNzaW9ucy4uLiApIC0+XG4gICAgICBSID0gcGFydHNbIDAgXVxuICAgICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgICBSICs9IGV4cHJlc3Npb24udG9TdHJpbmcoKSArIHBhcnRzWyBpZHggKyAxIF1cbiAgICAgIHJldHVybiBSXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gICAgICBAZnVuY3Rpb25zOiAgIHt9XG4gICAgICBAc3RhdGVtZW50czogIHt9XG4gICAgICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgICAgIEBkYl9jbGFzczogICAgU1FMSVRFLkRhdGFiYXNlU3luY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMjIyBUQUlOVCB1c2Ugbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cyAjIyNcbiAgICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeF9yZSdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBkYl9wYXRoICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgaGlkZSBALCAnZGInLCAgICAgICAgIG5ldyBjbGFzei5kYl9jbGFzcyBkYl9wYXRoXG4gICAgICAgICMgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgICAgQGNmZyAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgICAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywge31cbiAgICAgICAgaGlkZSBALCAnX3cnLCAgICAgICAgIG51bGxcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgICAgICBAaW5pdGlhbGl6ZSgpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICAgICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgICAgICBAYnVpbGQoKVxuICAgICAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAgICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBpbml0aWFsaXplOiAtPlxuICAgICAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICAgICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgICAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3Jwcl9zdHJpbmcgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0ZWFyZG93bjogLT5cbiAgICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAgIHByZWZpeF9yZSAgID0gQHByZWZpeF9yZVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgICAgY29udGludWUgdW5sZXNzICBwcmVmaXhfcmUudGVzdCBuYW1lXG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSSBuYW1lfTtcIiApLnJ1bigpXG4gICAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICAgIHdhcm4gXCLOqWRicmljX19fNCBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlYnVpbGQ6IC0+XG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBjb3VudCAgICAgICAgICAgICAgICAgPSAwXG4gICAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgICAgaGFzX3Rvcm5fZG93biAgICAgICAgID0gZmFsc2VcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGJ1aWxkX3N0YXRlbWVudHMgKSBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBAdGVhcmRvd24oKSB1bmxlc3MgaGFzX3Rvcm5fZG93blxuICAgICAgICAgIGhhc190b3JuX2Rvd24gPSB0cnVlXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gY291bnRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgICAgICAtPiBAX2dldF93KClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgICB7IGVycm9yX2NvdW50LFxuICAgICAgICAgIHN0YXRlbWVudF9jb3VudCxcbiAgICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgICAgICBtZXNzYWdlcyA9IFtdXG4gICAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoIG1lc3NhZ2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNiAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3Jwcl9zdHJpbmcgbWVzc2FnZXN9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgICAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXhfcmU6IC0+XG4gICAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgICByZXR1cm4gLy8vIF4gXz8gI3tSZWdFeHAuZXNjYXBlIEBwcmVmaXh9IF8gLiogJCAvLy9cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF93OiAtPlxuICAgICAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGhcbiAgICAgICAgcmV0dXJuIEBfd1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICAgICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByX3N0cmluZyBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICBlbHNlXG4gICAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfX183IHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuICAgICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICAgICAgc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ3N0YXRlbWVudHMnICkucmV2ZXJzZSgpXG4gICAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgICAgICAgIGlmIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdP1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMCBzdGF0ZW1lbnQgI3tycHJfc3RyaW5nIHN0YXRlbWVudF9uYW1lfSBpcyBhbHJlYWR5IGRlY2xhcmVkXCJcbiAgICAgICAgICAgICMgaWYgKCB0eXBlX29mIHN0YXRlbWVudCApIGlzICdsaXN0J1xuICAgICAgICAgICAgIyAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gKCBAcHJlcGFyZSBzdWJfc3RhdGVtZW50IGZvciBzdWJfc3RhdGVtZW50IGluIHN0YXRlbWVudCApXG4gICAgICAgICAgICAjICAgY29udGludWVcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB3YWxrOiAoIHNxbCwgUC4uLiApIC0+ICggQGRiLnByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgICB0cnlcbiAgICAgICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzkgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3Jwcl9zdHJpbmcgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHJfc3RyaW5nIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICMgRlVOQ1RJT05TXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIHB1dCBzb21ld2hlcmUgZWxzZT8gIyMjXG4gICAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICdjYWxsJywgXVxuICAgICAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgICB3aW5kb3dfZnVuY3Rpb246ICAgICAgWyAnc3RhcnQnLCAnc3RlcCcsICdpbnZlcnNlJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgY2F0ZWdvcnkgaW4gWyAnZnVuY3Rpb24nLCBcXFxuICAgICAgICAgICdhZ2dyZWdhdGVfZnVuY3Rpb24nLCAnd2luZG93X2Z1bmN0aW9uJywgJ3RhYmxlX2Z1bmN0aW9uJywgJ3ZpcnR1YWxfdGFibGUnLCBdXG4gICAgICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgICAgbWV0aG9kX25hbWUgICAgICAgPSBcImNyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICAgICAgZGVjbGFyYXRpb25zX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIGRlY2xhcmF0aW9ucz9cbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgZm9yIHVkZl9uYW1lLCBmbl9jZmcgb2YgZGVjbGFyYXRpb25zXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICAgICAgZC5uYW1lID89IHVkZl9uYW1lXG4gICAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMCBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBjYWxsLFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMCBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3Jwcl9zdHJpbmcgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCBjYWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBzdGVwLFxuICAgICAgICAgIHJlc3VsdCxcbiAgICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEwIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByX3N0cmluZyBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBzdGVwLFxuICAgICAgICAgIGludmVyc2UsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTAgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEzIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgICBwYXJhbWV0ZXJzLFxuICAgICAgICAgIGNvbHVtbnMsXG4gICAgICAgICAgcm93cyxcbiAgICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTAgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNCBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTAgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHJfc3RyaW5nIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGZ1bmN0aW9uczpcblxuICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJlZ2V4cDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIGNhbGw6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAc3RhdGVtZW50czpcbiAgICAgICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3ZpZXdzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICkgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAYnVpbGQ6IFtcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgXCJzdGRfcmVsYXRpb25zXCIgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBdXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU2VnbWVudF93aWR0aF9kYiBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGZ1bmN0aW9uczpcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aWR0aF9mcm9tX3RleHQ6XG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgICBjYWxsOiAgICAgICAgICAgKCB0ZXh0ICkgLT4gZ2V0X3djX21heF9saW5lX2xlbmd0aCB0ZXh0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgbGVuZ3RoX2Zyb21fdGV4dDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICAgIGNhbGw6ICAgICAgICAgICAoIHRleHQgKSAtPiB0ZXh0Lmxlbmd0aFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNyZWF0ZV90YWJsZV9zZWdtZW50czogU1FMXCJcIlwiXG4gICAgICAgICAgZHJvcCB0YWJsZSBpZiBleGlzdHMgc2VnbWVudHM7XG4gICAgICAgICAgY3JlYXRlIHRhYmxlIHNlZ21lbnRzIChcbiAgICAgICAgICAgICAgc2VnbWVudF90ZXh0ICAgICAgdGV4dCAgICBub3QgbnVsbCBwcmltYXJ5IGtleSxcbiAgICAgICAgICAgICAgc2VnbWVudF93aWR0aCAgICAgaW50ZWdlciBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggd2lkdGhfZnJvbV90ZXh0KCAgc2VnbWVudF90ZXh0ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICAgIHNlZ21lbnRfbGVuZ3RoICAgIGludGVnZXIgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGxlbmd0aF9mcm9tX3RleHQoIHNlZ21lbnRfdGV4dCApICkgc3RvcmVkLFxuICAgICAgICAgICAgY29uc3RyYWludCBzZWdtZW50X3dpZHRoX2VxZ3RfemVybyAgY2hlY2sgKCBzZWdtZW50X3dpZHRoICA+PSAwICksXG4gICAgICAgICAgICBjb25zdHJhaW50IHNlZ21lbnRfbGVuZ3RoX2VxZ3RfemVybyBjaGVjayAoIHNlZ21lbnRfbGVuZ3RoID49IDAgKSApO1wiXCJcIlxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgaW5zZXJ0X3NlZ21lbnQ6IFNRTFwiXCJcIlxuICAgICAgICAjICAgaW5zZXJ0IGludG8gc2VnbWVudHMgICggc2VnbWVudF90ZXh0LCAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKVxuICAgICAgICAjICAgICAgICAgICAgICAgICB2YWx1ZXMgICggJHNlZ21lbnRfdGV4dCwgICRzZWdtZW50X3dpZHRoLCAkc2VnbWVudF9sZW5ndGggKVxuICAgICAgICAjICAgICBvbiBjb25mbGljdCAoIHNlZ21lbnRfdGV4dCApIGRvIHVwZGF0ZVxuICAgICAgICAjICAgICAgICAgICAgICAgICBzZXQgICAgICggICAgICAgICAgICAgICAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKSA9XG4gICAgICAgICMgICAgICAgICAgICAgICAgICAgICAgICAgKCBleGNsdWRlZC5zZWdtZW50X3dpZHRoLCBleGNsdWRlZC5zZWdtZW50X2xlbmd0aCApO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydF9zZWdtZW50OiBTUUxcIlwiXCJcbiAgICAgICAgICBpbnNlcnQgaW50byBzZWdtZW50cyAgKCBzZWdtZW50X3RleHQgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyAgKCAkc2VnbWVudF90ZXh0IClcbiAgICAgICAgICAgIG9uIGNvbmZsaWN0ICggc2VnbWVudF90ZXh0ICkgZG8gbm90aGluZ1xuICAgICAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNlZ21lbnRzIHdoZXJlIHNlZ21lbnRfdGV4dCA9ICRzZWdtZW50X3RleHQgbGltaXQgMTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgc3VwZXIgZGJfcGF0aFxuICAgICAgICBjbGFzeiAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIEBjYWNoZSAgPSBuZXcgTWFwKClcbiAgICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBkb25lIGF1dG9tYXRpY2FsbHkgIyMjXG4gICAgICAgIEBzdGF0ZW1lbnRzID1cbiAgICAgICAgICBpbnNlcnRfc2VnbWVudDogICAgICAgICAgIEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuaW5zZXJ0X3NlZ21lbnRcbiAgICAgICAgICBzZWxlY3Rfcm93X2Zyb21fc2VnbWVudHM6IEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgU2VnbWVudF93aWR0aF9kYiwgfVxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgRGJyaWMsXG4gICAgICBEYnJpY19zdGQsXG4gICAgICBlc3FsLFxuICAgICAgU1FMLFxuICAgICAgaW50ZXJuYWxzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBVTlNUQUJMRV9EQlJJQ19CUklDU1xuXG4iXX0=
