(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_std, Esql, SFMODULES, SQL, SQLITE, Segment_width_db, create_statement_re, debug, esql, exports, freeze, get_property_descriptor, hide, internals, lets, misfit, rpr_string, set_getter, templates, type_of, warn;
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
      //-------------------------------------------------------------------------------------------------------
      /* TAINT put into separate module */
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
          directOnly: false
        },
        //.....................................................................................................
        create_aggregate_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          start: null
        },
        //.....................................................................................................
        create_window_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false,
          start: null
        },
        //.....................................................................................................
        create_table_function_cfg: {
          deterministic: true,
          varargs: false,
          directOnly: false
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
          constructor(db_path, cfg) {
            var clasz, fn_cfg_template;
            this._validate_is_property('is_ready');
            this._validate_is_property('prefix');
            this._validate_is_property('prefix_re');
            //...................................................................................................
            clasz = this.constructor;
            hide(this, 'db', new clasz.db_class(db_path));
            // @db                 = new SQLITE.DatabaseSync db_path
            this.cfg = Object.freeze({...clasz.cfg, db_path, ...cfg});
            /* NOTE we can't just prepare all the statements as they might depend on non-existant DB objects;
                   instead, we prepare statements on-demand and cache them here: */
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
            this.create_udfs();
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
            var build_statement, clasz, count, i, len, ref, type_of_build;
            clasz = this.constructor;
            type_of_build = type_of(clasz.build);
            //...................................................................................................
            /* TAINT use proper validation */
            if (type_of_build !== 'undefined' && type_of_build !== 'null' && type_of_build !== 'list') {
              throw new Error(`Ωdbric___5 expected an optional list for ${clasz.name}.build, got a ${type_of_build}`);
            }
            if (clasz.build == null) {
              //...................................................................................................
              return -1;
            }
            if (clasz.build.length === 0) {
              return 0;
            }
            //...................................................................................................
            this.teardown();
            count = 0;
            ref = clasz.build;
            //...................................................................................................
            for (i = 0, len = ref.length; i < len; i++) {
              build_statement = ref[i];
              count++;
              (this.prepare(build_statement)).run();
            }
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
            this._w = this.constructor.open(this.cfg.db_path);
            return this._w;
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
            var build_statement_name, name, ref, statement;
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
            hide(this, 'statements', {});
            build_statement_name = this._name_of_build_statements;
            ref = this.constructor.statements;
            for (name in ref) {
              statement = ref[name];
              // if ( type_of statement ) is 'list'
              //   @statements[ name ] = ( @prepare sub_statement for sub_statement in statement )
              //   continue
              this.statements[name] = this.prepare(statement);
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
              throw new Error(`Ωdbric___8 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
            }
            return R;
          }

          //=====================================================================================================
          // FUNCTIONS
          //-----------------------------------------------------------------------------------------------------
          create_udfs() {
            /* TAINT should be put somewhere else? */
            var category, clasz, collection, fn_cfg, i, len, method_name, name, names_of_callables, property_name, ref;
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
              if ((collection = clasz[property_name]) == null) {
                continue;
              }
//.................................................................................................
              for (name in collection) {
                fn_cfg = collection[name];
                //...............................................................................................
                fn_cfg = lets(fn_cfg, (d) => {
                  var callable, j, len1, name_of_callable, ref1;
                  if (d.name == null) {
                    d.name = name;
                  }
                  ref1 = names_of_callables[category];
                  //.............................................................................................
                  for (j = 0, len1 = ref1.length; j < len1; j++) {
                    name_of_callable = ref1[j];
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
            //...................................................................................................
            return null;
          }

          //-----------------------------------------------------------------------------------------------------
          create_function(cfg) {
            var call, deterministic, directOnly, name, varargs;
            if ((type_of(this.db.function)) !== 'function') {
              throw new Error(`Ωdbric___9 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined functions`);
            }
            ({name, call, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
            return this.db.function(name, {deterministic, varargs, directOnly}, call);
          }

          //-----------------------------------------------------------------------------------------------------
          create_aggregate_function(cfg) {
            var deterministic, directOnly, name, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__10 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined aggregate functions`);
            }
            ({name, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
            return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_window_function(cfg) {
            var deterministic, directOnly, inverse, name, result, start, step, varargs;
            if ((type_of(this.db.aggregate)) !== 'function') {
              throw new Error(`Ωdbric__11 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined window functions`);
            }
            ({name, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
            return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_table_function(cfg) {
            var columns, deterministic, directOnly, name, parameters, rows, varargs;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__12 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide table-valued user-defined functions`);
            }
            ({name, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
            return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
          }

          //-----------------------------------------------------------------------------------------------------
          create_virtual_table(cfg) {
            var create, name;
            if ((type_of(this.db.table)) !== 'function') {
              throw new Error(`Ωdbric__13 DB adapter class ${rpr_string(this.db.constructor.name)} does not provide user-defined virtual tables`);
            }
            ({name, create} = {...templates.create_virtual_table_cfg, ...cfg});
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
        Dbric_std.functions = {};

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxFQUFBLGdCQUFBLEVBQUEsbUJBQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsdUJBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLElBQUE7O01BQ0ksU0FBQSxHQUE0QixPQUFBLENBQVEsUUFBUjtNQUM1QixDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixTQUFTLENBQUMsOEJBQVYsQ0FBQSxDQUQ1QjtNQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCLEVBSko7O01BTUksQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUE1QjtNQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsTUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw0QkFBVixDQUFBLENBQXdDLENBQUMsTUFEckU7TUFFQSxNQUFBLEdBQTRCLE9BQUEsQ0FBUSxhQUFSO01BQzVCLENBQUEsQ0FBRSxLQUFGLEVBQ0UsSUFERixDQUFBLEdBQzRCLE9BRDVCO01BRUEsTUFBQSxHQUE0QixNQUFBLENBQU8sUUFBUCxFQVpoQzs7O01BZ0JJLHVCQUFBLEdBQTBCLFFBQUEsQ0FBRSxDQUFGLEVBQUssSUFBTCxFQUFX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QVJJOztRQTVDZjs7O1FBR0UsZ0JBQUMsQ0FBQSxTQUFELEdBRUUsQ0FBQTs7VUFBQSxlQUFBLEVBQ0U7WUFBQSxhQUFBLEVBQWdCLElBQWhCO1lBQ0EsT0FBQSxFQUFnQixLQURoQjtZQUVBLElBQUEsRUFBZ0IsUUFBQSxDQUFFLElBQUYsQ0FBQTtxQkFBWSxzQkFBQSxDQUF1QixJQUF2QjtZQUFaO1VBRmhCLENBREY7O1VBS0EsZ0JBQUEsRUFDRTtZQUFBLGFBQUEsRUFBZ0IsSUFBaEI7WUFDQSxPQUFBLEVBQWdCLEtBRGhCO1lBRUEsSUFBQSxFQUFnQixRQUFBLENBQUUsSUFBRixDQUFBO3FCQUFZLElBQUksQ0FBQztZQUFqQjtVQUZoQjtRQU5GOzs7UUFXRixnQkFBQyxDQUFBLFVBQUQsR0FFRSxDQUFBOztVQUFBLHFCQUFBLEVBQXVCLEdBQUcsQ0FBQTs7Ozs7O3NFQUFBLENBQTFCOzs7Ozs7Ozs7VUFnQkEsY0FBQSxFQUFnQixHQUFHLENBQUE7OztjQUFBLENBaEJuQjs7VUFzQkEsd0JBQUEsRUFBMEIsR0FBRyxDQUFBLGtFQUFBO1FBdEI3Qjs7OztvQkF6ZFI7O01BOGZJLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQUUsR0FBQSxTQUFGLEVBQWdCLGdCQUFoQixDQUFkO0FBQ1osYUFBTyxPQUFBLEdBQVUsQ0FDZixLQURlLEVBRWYsU0FGZSxFQUdmLElBSGUsRUFJZixHQUplLEVBS2YsU0FMZTtJQWpnQko7RUFBZixFQVZGOzs7RUFvaEJBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLG9CQUE5QjtBQXBoQkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblVOU1RBQkxFX0RCUklDX0JSSUNTID1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9kYnJpYzogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgICAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyBsZXRzLFxuICAgICAgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICAgIFNRTElURSAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgICB7IGRlYnVnLFxuICAgICAgd2FybiAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gICAgbWlzZml0ICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAgIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgICB3aGlsZSB4P1xuICAgICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgICBeIFxccypcbiAgICAgIGNyZWF0ZSBcXHMrXG4gICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgICAgLy8vaXNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGludGVybmFscyA9IHsgdHlwZV9vZiwgY3JlYXRlX3N0YXRlbWVudF9yZSwgdGVtcGxhdGVzLCB9XG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIEVzcWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgdW5xdW90ZV9uYW1lOiAoIG5hbWUgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzEgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgICB3aGVuIC9eXCIoLispXCIkLy50ZXN0ICAgICAgICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVbIDEgLi4uIG5hbWUubGVuZ3RoIC0gMSBdLnJlcGxhY2UgL1wiXCIvZywgJ1wiJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMiBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBJOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgTDogKCB4ICkgPT5cbiAgICAgICMgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgIyAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB4XG4gICAgICAjICAgICB3aGVuICd0ZXh0JyAgICAgICB0aGVuIHJldHVybiAgXCInXCIgKyAoIHgucmVwbGFjZSAvJy9nLCBcIicnXCIgKSArIFwiJ1wiXG4gICAgICAjICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgIyAgICAgd2hlbiAnZmxvYXQnICAgICAgdGhlbiByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAjICAgICB3aGVuICdib29sZWFuJyAgICB0aGVuIHJldHVybiAoIGlmIHggdGhlbiAnMScgZWxzZSAnMCcgKVxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgIyAgIHRocm93IG5ldyBFLkRCYXlfc3FsX3ZhbHVlX2Vycm9yICdeZGJheS9zcWxAMV4nLCB0eXBlLCB4XG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyBWOiAoIHggKSA9PlxuICAgICAgIyAgIHRocm93IG5ldyBFLkRCYXlfc3FsX25vdF9hX2xpc3RfZXJyb3IgJ15kYmF5L3NxbEAyXicsIHR5cGUsIHggdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgIyAgIHJldHVybiAnKCAnICsgKCAoIEBMIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICAgIyAgIGlkeCA9IC0xXG4gICAgICAjICAgcmV0dXJuIHNxbC5yZXBsYWNlIEBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuLCAoICQwLCBvcGVuZXIsIGZvcm1hdCwgbmFtZSApID0+XG4gICAgICAjICAgICBpZHgrK1xuICAgICAgIyAgICAgc3dpdGNoIG9wZW5lclxuICAgICAgIyAgICAgICB3aGVuICckJ1xuICAgICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICAgIyAgICAgICAgIGtleSA9IG5hbWVcbiAgICAgICMgICAgICAgd2hlbiAnPydcbiAgICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAgICMgICAgIHZhbHVlID0gdmFsdWVzWyBrZXkgXVxuICAgICAgIyAgICAgc3dpdGNoIGZvcm1hdFxuICAgICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ0wnICAgICAgdGhlbiByZXR1cm4gQEwgdmFsdWVcbiAgICAgICMgICAgICAgd2hlbiAnVicgICAgICB0aGVuIHJldHVybiBAViB2YWx1ZVxuICAgICAgIyAgICAgdGhyb3cgbmV3IEUuREJheV9pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duICdeZGJheS9zcWxAM14nLCBmb3JtYXRcbiAgICAgICMgX2ludGVycG9sYXRpb25fcGF0dGVybjogLyg/PG9wZW5lcj5bJD9dKSg/PGZvcm1hdD4uPyk6KD88bmFtZT5cXHcqKS9nXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBTUUwgPSAoIHBhcnRzLCBleHByZXNzaW9ucy4uLiApIC0+XG4gICAgICBSID0gcGFydHNbIDAgXVxuICAgICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgICBSICs9IGV4cHJlc3Npb24udG9TdHJpbmcoKSArIHBhcnRzWyBpZHggKyAxIF1cbiAgICAgIHJldHVybiBSXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gICAgICBAZnVuY3Rpb25zOiAgIHt9XG4gICAgICBAc3RhdGVtZW50czogIHt9XG4gICAgICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgICAgIEBkYl9jbGFzczogICAgU1FMSVRFLkRhdGFiYXNlU3luY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeF9yZSdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICBuZXcgY2xhc3ouZGJfY2xhc3MgZGJfcGF0aFxuICAgICAgICAjIEBkYiAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICAgIEBjZmcgICAgICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICAgICAgIyMjIE5PVEUgd2UgY2FuJ3QganVzdCBwcmVwYXJlIGFsbCB0aGUgc3RhdGVtZW50cyBhcyB0aGV5IG1pZ2h0IGRlcGVuZCBvbiBub24tZXhpc3RhbnQgREIgb2JqZWN0cztcbiAgICAgICAgaW5zdGVhZCwgd2UgcHJlcGFyZSBzdGF0ZW1lbnRzIG9uLWRlbWFuZCBhbmQgY2FjaGUgdGhlbSBoZXJlOiAjIyNcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICBudWxsXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgICAgQGNyZWF0ZV91ZGZzKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICAgICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgICAgICBAYnVpbGQoKVxuICAgICAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAgICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBpbml0aWFsaXplOiAtPlxuICAgICAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICAgICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgICAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3Jwcl9zdHJpbmcgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0ZWFyZG93bjogLT5cbiAgICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAgIHByZWZpeF9yZSAgID0gQHByZWZpeF9yZVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgICAgY29udGludWUgdW5sZXNzICBwcmVmaXhfcmUudGVzdCBuYW1lXG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSSBuYW1lfTtcIiApLnJ1bigpXG4gICAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICAgIHdhcm4gXCLOqWRicmljX19fNCBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlYnVpbGQ6IC0+XG4gICAgICAgIGNsYXN6ICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgdHlwZV9vZl9idWlsZCA9IHR5cGVfb2YgY2xhc3ouYnVpbGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgdHlwZV9vZl9idWlsZCBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX181IGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZV9vZl9idWlsZH1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiAtMSBpZiAoIG5vdCBjbGFzei5idWlsZD8gKVxuICAgICAgICByZXR1cm4gIDAgaWYgKCBjbGFzei5idWlsZC5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKClcbiAgICAgICAgY291bnQgPSAwXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBjbGFzei5idWlsZFxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9pc19yZWFkeTogLT5cbiAgICAgICAgeyBlcnJvcl9jb3VudCxcbiAgICAgICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzYgI3tlcnJvcl9jb3VudH0gb3V0IG9mICN7c3RhdGVtZW50X2NvdW50fSBidWlsZCBzdGF0ZW1lbnQocykgY291bGQgbm90IGJlIHBhcnNlZDogI3tycHJfc3RyaW5nIG1lc3NhZ2VzfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcHJlc2VudF9kYl9vYmplY3RzID0gQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X3ByZWZpeDogLT5cbiAgICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICAgICAgcmV0dXJuIEBjZmcucHJlZml4XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfcHJlZml4X3JlOiAtPlxuICAgICAgICByZXR1cm4gL3wvIGlmIEBwcmVmaXggaXMgJydcbiAgICAgICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfdzogLT5cbiAgICAgICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgICAgIEBfdyA9IEBjb25zdHJ1Y3Rvci5vcGVuIEBjZmcuZGJfcGF0aFxuICAgICAgICByZXR1cm4gQF93XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByX3N0cmluZyBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICBlbHNlXG4gICAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfX183IHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuICAgICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGJ1aWxkX3N0YXRlbWVudF9uYW1lICA9IEBfbmFtZV9vZl9idWlsZF9zdGF0ZW1lbnRzXG4gICAgICAgIGZvciBuYW1lLCBzdGF0ZW1lbnQgb2YgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNcbiAgICAgICAgICAjIGlmICggdHlwZV9vZiBzdGF0ZW1lbnQgKSBpcyAnbGlzdCdcbiAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIG5hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBuYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHdhbGs6ICggc3FsLCBQLi4uICkgLT4gKCBAZGIucHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBGVU5DVElPTlNcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3VkZnM6IC0+XG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgICAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAnY2FsbCcsIF1cbiAgICAgICAgICBhZ2dyZWdhdGVfZnVuY3Rpb246ICAgWyAnc3RhcnQnLCAnc3RlcCcsICdyZXN1bHQnLCBdXG4gICAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgICAgdmlydHVhbF90YWJsZTogICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgICAgIHByb3BlcnR5X25hbWUgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgICAgbWV0aG9kX25hbWUgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjb2xsZWN0aW9uID0gY2xhc3pbIHByb3BlcnR5X25hbWUgXSApP1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm9yIG5hbWUsIGZuX2NmZyBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgICAgICBkLm5hbWUgPz0gbmFtZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIGNhbGwsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCBjYWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgY29sdW1ucyxcbiAgICAgICAgICByb3dzLFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMyBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgICAgICB7IG5hbWUsIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBjZmc6IE9iamVjdC5mcmVlemVcbiAgICAgICAgcHJlZml4OiAnc3RkJ1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBmdW5jdGlvbnM6ICAge31cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAc3RhdGVtZW50czpcbiAgICAgICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3ZpZXdzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICkgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAYnVpbGQ6IFtcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgXCJzdGRfcmVsYXRpb25zXCIgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBdXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU2VnbWVudF93aWR0aF9kYiBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGZ1bmN0aW9uczpcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aWR0aF9mcm9tX3RleHQ6XG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgICBjYWxsOiAgICAgICAgICAgKCB0ZXh0ICkgLT4gZ2V0X3djX21heF9saW5lX2xlbmd0aCB0ZXh0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgbGVuZ3RoX2Zyb21fdGV4dDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICAgIGNhbGw6ICAgICAgICAgICAoIHRleHQgKSAtPiB0ZXh0Lmxlbmd0aFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNyZWF0ZV90YWJsZV9zZWdtZW50czogU1FMXCJcIlwiXG4gICAgICAgICAgZHJvcCB0YWJsZSBpZiBleGlzdHMgc2VnbWVudHM7XG4gICAgICAgICAgY3JlYXRlIHRhYmxlIHNlZ21lbnRzIChcbiAgICAgICAgICAgICAgc2VnbWVudF90ZXh0ICAgICAgdGV4dCAgICBub3QgbnVsbCBwcmltYXJ5IGtleSxcbiAgICAgICAgICAgICAgc2VnbWVudF93aWR0aCAgICAgaW50ZWdlciBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggd2lkdGhfZnJvbV90ZXh0KCAgc2VnbWVudF90ZXh0ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICAgIHNlZ21lbnRfbGVuZ3RoICAgIGludGVnZXIgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGxlbmd0aF9mcm9tX3RleHQoIHNlZ21lbnRfdGV4dCApICkgc3RvcmVkLFxuICAgICAgICAgICAgY29uc3RyYWludCBzZWdtZW50X3dpZHRoX2VxZ3RfemVybyAgY2hlY2sgKCBzZWdtZW50X3dpZHRoICA+PSAwICksXG4gICAgICAgICAgICBjb25zdHJhaW50IHNlZ21lbnRfbGVuZ3RoX2VxZ3RfemVybyBjaGVjayAoIHNlZ21lbnRfbGVuZ3RoID49IDAgKSApO1wiXCJcIlxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgaW5zZXJ0X3NlZ21lbnQ6IFNRTFwiXCJcIlxuICAgICAgICAjICAgaW5zZXJ0IGludG8gc2VnbWVudHMgICggc2VnbWVudF90ZXh0LCAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKVxuICAgICAgICAjICAgICAgICAgICAgICAgICB2YWx1ZXMgICggJHNlZ21lbnRfdGV4dCwgICRzZWdtZW50X3dpZHRoLCAkc2VnbWVudF9sZW5ndGggKVxuICAgICAgICAjICAgICBvbiBjb25mbGljdCAoIHNlZ21lbnRfdGV4dCApIGRvIHVwZGF0ZVxuICAgICAgICAjICAgICAgICAgICAgICAgICBzZXQgICAgICggICAgICAgICAgICAgICAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKSA9XG4gICAgICAgICMgICAgICAgICAgICAgICAgICAgICAgICAgKCBleGNsdWRlZC5zZWdtZW50X3dpZHRoLCBleGNsdWRlZC5zZWdtZW50X2xlbmd0aCApO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydF9zZWdtZW50OiBTUUxcIlwiXCJcbiAgICAgICAgICBpbnNlcnQgaW50byBzZWdtZW50cyAgKCBzZWdtZW50X3RleHQgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyAgKCAkc2VnbWVudF90ZXh0IClcbiAgICAgICAgICAgIG9uIGNvbmZsaWN0ICggc2VnbWVudF90ZXh0ICkgZG8gbm90aGluZ1xuICAgICAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNlZ21lbnRzIHdoZXJlIHNlZ21lbnRfdGV4dCA9ICRzZWdtZW50X3RleHQgbGltaXQgMTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgc3VwZXIgZGJfcGF0aFxuICAgICAgICBjbGFzeiAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIEBjYWNoZSAgPSBuZXcgTWFwKClcbiAgICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBkb25lIGF1dG9tYXRpY2FsbHkgIyMjXG4gICAgICAgIEBzdGF0ZW1lbnRzID1cbiAgICAgICAgICBpbnNlcnRfc2VnbWVudDogICAgICAgICAgIEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuaW5zZXJ0X3NlZ21lbnRcbiAgICAgICAgICBzZWxlY3Rfcm93X2Zyb21fc2VnbWVudHM6IEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgU2VnbWVudF93aWR0aF9kYiwgfVxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgRGJyaWMsXG4gICAgICBEYnJpY19zdGQsXG4gICAgICBlc3FsLFxuICAgICAgU1FMLFxuICAgICAgaW50ZXJuYWxzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBVTlNUQUJMRV9EQlJJQ19CUklDU1xuXG4iXX0=
