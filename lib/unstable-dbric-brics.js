(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_std, Esql, SQL, SQLITE, Segment_width_db, create_statement_re, debug, esql, exports, get_property_descriptor, hide, internals, misfit, rpr_string, set_getter, templates, type_of;
      //=======================================================================================================
      ({hide, set_getter} = (require('./main')).require_managed_property_tools());
      ({type_of} = (require('./main')).unstable.require_type_of());
      // { show_no_colors: rpr,  } = ( require './main' ).unstable.require_show()
      ({rpr_string} = (require('./main')).require_rpr_string());
      SQLITE = require('node:sqlite');
      ({debug} = console);
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
      create_statement_re = /^\s*create\s+(?<type>table|view|index)\s+(?<name>\S+)\s+/is;
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
          static open(db_path) {
            var R, clasz;
            clasz = this;
            R = new clasz(db_path);
            R.build();
            R._prepare_statements();
            return R;
          }

          //-----------------------------------------------------------------------------------------------------
          constructor(db_path) {
            var call, clasz, fn_cfg, fn_cfg_template, name, ref;
            this._validate_is_property('is_ready');
            this._validate_is_property('prefix');
            this._validate_is_property('full_prefix');
            //...................................................................................................
            clasz = this.constructor;
            this.db = new clasz.db_class(db_path);
            // @db                 = new SQLITE.DatabaseSync db_path
            this.cfg = Object.freeze({...clasz.cfg, db_path});
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
            ref = clasz.functions;
            for (name in ref) {
              fn_cfg = ref[name];
              if ((typeof fn_cfg) === 'function') {
                [call, fn_cfg] = [fn_cfg, {}];
              } else {
                ({call} = fn_cfg);
              }
              fn_cfg = {...fn_cfg_template, fn_cfg};
              call = call.bind(this);
              this.db.function(name, fn_cfg, call);
            }
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
            var _, count, error, full_prefix, name, ref, type;
            count = 0;
            full_prefix = this.full_prefix;
            (this.prepare(SQL`pragma foreign_keys = off;`)).run();
            ref = this._get_db_objects();
            for (_ in ref) {
              ({name, type} = ref[_]);
              if (!name.startsWith(full_prefix)) {
                continue;
              }
              count++;
              try {
                (this.prepare(SQL`drop ${type} ${esql.I(name)};`)).run();
              } catch (error1) {
                error = error1;
                console.debug(`Ωdbric___4 ignored error: ${error.message}`);
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
            if (this.cfg.prefix == null) {
              return this.constructor.name.replace(/^.*_([^_]+)$/, '$1');
            }
            if (this.cfg.prefix === '(NOPREFIX)') {
              return '';
            }
            return this.cfg.prefix;
          }

          //---------------------------------------------------------------------------------------------------
          _get_full_prefix() {
            if (this.cfg.prefix == null) {
              return '';
            }
            if (this.cfg.prefix === '(NOPREFIX)') {
              return '';
            }
            if (this.cfg.prefix === '') {
              return '';
            }
            return `${this.cfg.prefix}_`;
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

        set_getter(Dbric.prototype, 'full_prefix', function() {
          return this._get_full_prefix();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsZ0JBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLHVCQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQTs7TUFDSSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxRQUFSLENBQUYsQ0FBb0IsQ0FBQyw4QkFBckIsQ0FBQSxDQUQ1QjtNQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsUUFBUixDQUFGLENBQW9CLENBQUMsUUFBUSxDQUFDLGVBQTlCLENBQUEsQ0FBNUIsRUFISjs7TUFLSSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLFFBQVIsQ0FBRixDQUFvQixDQUFDLGtCQUFyQixDQUFBLENBQTVCO01BQ0EsTUFBQSxHQUE0QixPQUFBLENBQVEsYUFBUjtNQUM1QixDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCO01BQ0EsTUFBQSxHQUE0QixNQUFBLENBQU8sUUFBUCxFQVJoQzs7O01BWUksdUJBQUEsR0FBMEIsUUFBQSxDQUFFLENBQUYsRUFBSyxJQUFMLEVBQVcsV0FBVyxNQUF0QixDQUFBO0FBQzlCLFlBQUE7QUFBTSxlQUFNLFNBQU47VUFDRSxJQUFZLHNEQUFaO0FBQUEsbUJBQU8sRUFBUDs7VUFDQSxD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QWxjUjs7TUF1ZUksU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFBLFNBQUYsRUFBZ0IsZ0JBQWhCLENBQWQ7QUFDWixhQUFPLE9BQUEsR0FBVSxDQUNmLEtBRGUsRUFFZixTQUZlLEVBR2YsSUFIZSxFQUlmLEdBSmUsRUFLZixTQUxlO0lBMWVKO0VBQWYsRUFWRjs7O0VBNmZBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLG9CQUE5QjtBQTdmQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuVU5TVEFCTEVfREJSSUNfQlJJQ1MgPVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RicmljOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gKCByZXF1aXJlICcuL21haW4nICkudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL21haW4nICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICBTUUxJVEUgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgICBtaXNmaXQgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgIHdoaWxlIHg/XG4gICAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICAgIF4gXFxzKlxuICAgICAgY3JlYXRlIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4ICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIC8vL2lzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRlbXBsYXRlcyA9XG4gICAgICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbnRlcm5hbHMgPSB7IHR5cGVfb2YsIGNyZWF0ZV9zdGF0ZW1lbnRfcmUsIHRlbXBsYXRlcywgfVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBFc3FsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzIgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHJfc3RyaW5nIG5hbWV9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgSTogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIEw6ICggeCApID0+XG4gICAgICAjICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgIyAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICMgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgIyAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgVjogKCB4ICkgPT5cbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgICMgICByZXR1cm4gJyggJyArICggKCBATCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAgICMgICBpZHggPSAtMVxuICAgICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICAgIyAgICAgaWR4KytcbiAgICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAgICMgICAgIHRocm93IG5ldyBFLkRCYXlfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgICByZXR1cm4gUlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgICAgQGZ1bmN0aW9uczogICB7fVxuICAgICAgQHN0YXRlbWVudHM6ICB7fVxuICAgICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAb3BlbjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgY2xhc3ogPSBAXG4gICAgICAgIFIgICAgID0gbmV3IGNsYXN6IGRiX3BhdGhcbiAgICAgICAgUi5idWlsZCgpXG4gICAgICAgIFIuX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCApIC0+XG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2Z1bGxfcHJlZml4J1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBjbGFzei5kYl9jbGFzcyBkYl9wYXRoXG4gICAgICAgICMgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgICAgQGNmZyAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIH1cbiAgICAgICAgIyMjIE5PVEUgd2UgY2FuJ3QganVzdCBwcmVwYXJlIGFsbCB0aGUgc3RhdGVtZW50cyBhcyB0aGV5IG1pZ2h0IGRlcGVuZCBvbiBub24tZXhpc3RhbnQgREIgb2JqZWN0cztcbiAgICAgICAgaW5zdGVhZCwgd2UgcHJlcGFyZSBzdGF0ZW1lbnRzIG9uLWRlbWFuZCBhbmQgY2FjaGUgdGhlbSBoZXJlOiAjIyNcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGhpZGUgQCwgJ193JywgbnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgICAgIGZvciBuYW1lLCBmbl9jZmcgb2YgY2xhc3ouZnVuY3Rpb25zXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZm5fY2ZnICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgWyBjYWxsLCBmbl9jZmcsIF0gPSBbIGZuX2NmZywge30sIF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7IGNhbGwsIH0gPSBmbl9jZmdcbiAgICAgICAgICBmbl9jZmcgID0geyBmbl9jZmdfdGVtcGxhdGUuLi4sIGZuX2NmZywgfVxuICAgICAgICAgIGNhbGwgICAgPSBjYWxsLmJpbmQgQFxuICAgICAgICAgIEBkYi5mdW5jdGlvbiBuYW1lLCBmbl9jZmcsIGNhbGxcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAgICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAgICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGluaXRpYWxpemU6IC0+XG4gICAgICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgICAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgICAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgICAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByX3N0cmluZyBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgICAgICBSID0ge31cbiAgICAgICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgICAgICByZXR1cm4gUlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHRlYXJkb3duOiAtPlxuICAgICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICAgZnVsbF9wcmVmaXggPSBAZnVsbF9wcmVmaXhcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgICAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBuYW1lLnN0YXJ0c1dpdGggZnVsbF9wcmVmaXhcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7ZXNxbC5JIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyBcIs6pZGJyaWNfX180IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIlxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVidWlsZDogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICB0eXBlX29mX2J1aWxkID0gdHlwZV9vZiBjbGFzei5idWlsZFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgIHVubGVzcyB0eXBlX29mX2J1aWxkIGluIFsgJ3VuZGVmaW5lZCcsICdudWxsJywgJ2xpc3QnLCBdXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlX29mX2J1aWxkfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIC0xIGlmICggbm90IGNsYXN6LmJ1aWxkPyApXG4gICAgICAgIHJldHVybiAgMCBpZiAoIGNsYXN6LmJ1aWxkLmxlbmd0aCBpcyAwIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBAdGVhcmRvd24oKVxuICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkXG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdmdWxsX3ByZWZpeCcsICAtPiBAX2dldF9mdWxsX3ByZWZpeCgpXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX182ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByX3N0cmluZyBtZXNzYWdlc31cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICAgIHJldHVybiBAY29uc3RydWN0b3IubmFtZS5yZXBsYWNlIC9eLipfKFteX10rKSQvLCAnJDEnIHVubGVzcyBAY2ZnLnByZWZpeD9cbiAgICAgICAgcmV0dXJuICcnIGlmIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJ1xuICAgICAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9mdWxsX3ByZWZpeDogLT5cbiAgICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApXG4gICAgICAgIHJldHVybiAnJyBpZiBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKSdcbiAgICAgICAgcmV0dXJuICcnIGlmIEBjZmcucHJlZml4IGlzICcnXG4gICAgICAgIHJldHVybiBcIiN7QGNmZy5wcmVmaXh9X1wiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfdzogLT5cbiAgICAgICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgICAgIEBfdyA9IEBjb25zdHJ1Y3Rvci5vcGVuIEBjZmcuZGJfcGF0aFxuICAgICAgICByZXR1cm4gQF93XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByX3N0cmluZyBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICBlbHNlXG4gICAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfX183IHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuICAgICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGJ1aWxkX3N0YXRlbWVudF9uYW1lICA9IEBfbmFtZV9vZl9idWlsZF9zdGF0ZW1lbnRzXG4gICAgICAgIGZvciBuYW1lLCBzdGF0ZW1lbnQgb2YgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNcbiAgICAgICAgICAjIGlmICggdHlwZV9vZiBzdGF0ZW1lbnQgKSBpcyAnbGlzdCdcbiAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIG5hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBuYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHdhbGs6ICggc3FsLCBQLi4uICkgLT4gKCBAZGIucHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgIyBGVU5DVElPTlNcbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIGNhbGwsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCBjYWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHN0YXJ0LFxuICAgICAgICAgIHN0ZXAsXG4gICAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHJfc3RyaW5nIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgICAgeyBuYW1lLFxuICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgY29sdW1ucyxcbiAgICAgICAgICByb3dzLFxuICAgICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMyBEQiBhZGFwdGVyIGNsYXNzICN7cnByX3N0cmluZyBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgICAgICB7IG5hbWUsIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBjZmc6IE9iamVjdC5mcmVlemVcbiAgICAgICAgcHJlZml4OiAnc3RkJ1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBmdW5jdGlvbnM6ICAge31cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAc3RhdGVtZW50czpcbiAgICAgICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3ZpZXdzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICkgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAYnVpbGQ6IFtcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpcyAndmlldycgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgXCJzdGRfcmVsYXRpb25zXCIgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBdXG5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU2VnbWVudF93aWR0aF9kYiBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGZ1bmN0aW9uczpcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aWR0aF9mcm9tX3RleHQ6XG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgICBjYWxsOiAgICAgICAgICAgKCB0ZXh0ICkgLT4gZ2V0X3djX21heF9saW5lX2xlbmd0aCB0ZXh0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgbGVuZ3RoX2Zyb21fdGV4dDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICAgIGNhbGw6ICAgICAgICAgICAoIHRleHQgKSAtPiB0ZXh0Lmxlbmd0aFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNyZWF0ZV90YWJsZV9zZWdtZW50czogU1FMXCJcIlwiXG4gICAgICAgICAgZHJvcCB0YWJsZSBpZiBleGlzdHMgc2VnbWVudHM7XG4gICAgICAgICAgY3JlYXRlIHRhYmxlIHNlZ21lbnRzIChcbiAgICAgICAgICAgICAgc2VnbWVudF90ZXh0ICAgICAgdGV4dCAgICBub3QgbnVsbCBwcmltYXJ5IGtleSxcbiAgICAgICAgICAgICAgc2VnbWVudF93aWR0aCAgICAgaW50ZWdlciBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggd2lkdGhfZnJvbV90ZXh0KCAgc2VnbWVudF90ZXh0ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICAgIHNlZ21lbnRfbGVuZ3RoICAgIGludGVnZXIgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIGxlbmd0aF9mcm9tX3RleHQoIHNlZ21lbnRfdGV4dCApICkgc3RvcmVkLFxuICAgICAgICAgICAgY29uc3RyYWludCBzZWdtZW50X3dpZHRoX2VxZ3RfemVybyAgY2hlY2sgKCBzZWdtZW50X3dpZHRoICA+PSAwICksXG4gICAgICAgICAgICBjb25zdHJhaW50IHNlZ21lbnRfbGVuZ3RoX2VxZ3RfemVybyBjaGVjayAoIHNlZ21lbnRfbGVuZ3RoID49IDAgKSApO1wiXCJcIlxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgaW5zZXJ0X3NlZ21lbnQ6IFNRTFwiXCJcIlxuICAgICAgICAjICAgaW5zZXJ0IGludG8gc2VnbWVudHMgICggc2VnbWVudF90ZXh0LCAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKVxuICAgICAgICAjICAgICAgICAgICAgICAgICB2YWx1ZXMgICggJHNlZ21lbnRfdGV4dCwgICRzZWdtZW50X3dpZHRoLCAkc2VnbWVudF9sZW5ndGggKVxuICAgICAgICAjICAgICBvbiBjb25mbGljdCAoIHNlZ21lbnRfdGV4dCApIGRvIHVwZGF0ZVxuICAgICAgICAjICAgICAgICAgICAgICAgICBzZXQgICAgICggICAgICAgICAgICAgICAgIHNlZ21lbnRfd2lkdGgsICBzZWdtZW50X2xlbmd0aCAgKSA9XG4gICAgICAgICMgICAgICAgICAgICAgICAgICAgICAgICAgKCBleGNsdWRlZC5zZWdtZW50X3dpZHRoLCBleGNsdWRlZC5zZWdtZW50X2xlbmd0aCApO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGluc2VydF9zZWdtZW50OiBTUUxcIlwiXCJcbiAgICAgICAgICBpbnNlcnQgaW50byBzZWdtZW50cyAgKCBzZWdtZW50X3RleHQgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyAgKCAkc2VnbWVudF90ZXh0IClcbiAgICAgICAgICAgIG9uIGNvbmZsaWN0ICggc2VnbWVudF90ZXh0ICkgZG8gbm90aGluZ1xuICAgICAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNlZ21lbnRzIHdoZXJlIHNlZ21lbnRfdGV4dCA9ICRzZWdtZW50X3RleHQgbGltaXQgMTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgc3VwZXIgZGJfcGF0aFxuICAgICAgICBjbGFzeiAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIEBjYWNoZSAgPSBuZXcgTWFwKClcbiAgICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBkb25lIGF1dG9tYXRpY2FsbHkgIyMjXG4gICAgICAgIEBzdGF0ZW1lbnRzID1cbiAgICAgICAgICBpbnNlcnRfc2VnbWVudDogICAgICAgICAgIEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuaW5zZXJ0X3NlZ21lbnRcbiAgICAgICAgICBzZWxlY3Rfcm93X2Zyb21fc2VnbWVudHM6IEBwcmVwYXJlIGNsYXN6LnN0YXRlbWVudHMuc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgU2VnbWVudF93aWR0aF9kYiwgfVxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgRGJyaWMsXG4gICAgICBEYnJpY19zdGQsXG4gICAgICBlc3FsLFxuICAgICAgU1FMLFxuICAgICAgaW50ZXJuYWxzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBVTlNUQUJMRV9EQlJJQ19CUklDU1xuXG4iXX0=
