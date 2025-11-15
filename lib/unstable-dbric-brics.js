(function() {
  'use strict';
  var UNSTABLE_DBRIC_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  UNSTABLE_DBRIC_BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_dbric: function() {
      var Dbric, Dbric_std, Esql, SQL, SQLITE, Segment_width_db, create_statement_re, debug, esql, exports, get_property_descriptor, hide, internals, misfit, rpr_string, set_getter, type_of;
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
      internals = {type_of, create_statement_re};
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
            //...................................................................................................
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
          initialize() {
            /* This method will be called *before* any build statements are executed and before any statements
                   in `@constructor.staements` are prepared and is a good place to create user-defined functions
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
                console.debug(`Ωdbric___1 ignored error: ${error.message}`);
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
              throw new Error(`Ωdbric___4 expected an optional list for ${clasz.name}.build, got a ${type_of_build}`);
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
              throw new Error(`Ωdbric___5 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr_string(messages)}`);
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
            //       throw new Error "Ωnql___6 unable to parse statement name #{rpr_string name}"
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
          prepare(sql) {
            var R, cause;
            try {
              R = this.db.prepare(sql);
            } catch (error1) {
              cause = error1;
              throw new Error(`Ωdbric___7 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
            }
            return R;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsZ0JBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLHVCQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQSxPQUFBOztNQUNJLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLFFBQVIsQ0FBRixDQUFvQixDQUFDLDhCQUFyQixDQUFBLENBRDVCO01BRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxRQUFSLENBQUYsQ0FBb0IsQ0FBQyxRQUFRLENBQUMsZUFBOUIsQ0FBQSxDQUE1QixFQUhKOztNQUtJLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsUUFBUixDQUFGLENBQW9CLENBQUMsa0JBQXJCLENBQUEsQ0FBNUI7TUFDQSxNQUFBLEdBQTRCLE9BQUEsQ0FBUSxhQUFSO01BQzVCLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7TUFDQSxNQUFBLEdBQTRCLE1BQUEsQ0FBTyxRQUFQLEVBUmhDOzs7TUFZSSx1QkFBQSxHQUEwQixRQUFBLENBQUUsQ0FBRixFQUFLLElBQUwsRUFBVyxXQUFXLE1BQXRCLENBQUE7QUFDOUIsWUFBQTtBQUFNLGVBQU0sU0FBTjtVQUNFLElBQVksc0RBQVo7QUFBQSxtQkFBTyxFQUFQOztVQUNBLENBQUEsR0FBSSxN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QUFBOztVQUFBLGVBQUEsRUFDRTtZQUFBLGFBQUEsRUFBZ0IsSUFBaEI7WUFDQSxPQUFBLEVBQWdCLEtBRGhCO1lBRUEsSUFBQSxFQUFnQixRQUFBLENBQUUsSUFBRixDQUFBO3FCQUFZLHNCQUFBLENBQXVCLElBQXZCO1lBQVo7VUFGaEIsQ0FERjs7VUFLQSxnQkFBQSxFQUNFO1lBQUEsYUFBQSxFQUFnQixJQUFoQjtZQUNBLE9BQUEsRUFBZ0IsS0FEaEI7WUFFQSxJQUFBLEVBQWdCLFFBQUEsQ0FBRSxJQUFGLENBQUE7cUJBQVksSUFBSSxDQUFDO1lBQWpCO1VBRmhCO1FBTkY7OztRQVdGLGdCQUFDLENBQUEsVUFBRCxHQUVFLENBQUE7O1VBQUEscUJBQUEsRUFBdUIsR0FBRyxDQUFBOzs7Ozs7c0VBQUEsQ0FBMUI7Ozs7Ozs7OztVQWdCQSxjQUFBLEVBQWdCLEdBQUcsQ0FBQTs7O2NBQUEsQ0FoQm5COztVQXNCQSx3QkFBQSxFQUEwQixHQUFHLENBQUEsa0VBQUE7UUF0QjdCOzs7O29CQXBWUjs7TUF5WEksU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFBLFNBQUYsRUFBZ0IsZ0JBQWhCLENBQWQ7QUFDWixhQUFPLE9BQUEsR0FBVSxDQUNmLEtBRGUsRUFFZixTQUZlLEVBR2YsSUFIZSxFQUlmLEdBSmUsRUFLZixTQUxlO0lBNVhKO0VBQWYsRUFWRjs7O0VBK1lBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLG9CQUE5QjtBQS9ZQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuVU5TVEFCTEVfREJSSUNfQlJJQ1MgPVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RicmljOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gKCByZXF1aXJlICcuL21haW4nICkudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL21haW4nICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICBTUUxJVEUgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgICBtaXNmaXQgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgIHdoaWxlIHg/XG4gICAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICAgIF4gXFxzKlxuICAgICAgY3JlYXRlIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4ICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIC8vL2lzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGludGVybmFscyA9IHsgdHlwZV9vZiwgY3JlYXRlX3N0YXRlbWVudF9yZSwgfVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBFc3FsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzIgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHJfc3RyaW5nIG5hbWV9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgSTogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIEw6ICggeCApID0+XG4gICAgICAjICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgIyAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICMgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgIyAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgVjogKCB4ICkgPT5cbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgICMgICByZXR1cm4gJyggJyArICggKCBATCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAgICMgICBpZHggPSAtMVxuICAgICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICAgIyAgICAgaWR4KytcbiAgICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAgICMgICAgIHRocm93IG5ldyBFLkRCYXlfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgICByZXR1cm4gUlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgICAgQGZ1bmN0aW9uczogICB7fVxuICAgICAgQHN0YXRlbWVudHM6ICB7fVxuICAgICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAb3BlbjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgY2xhc3ogPSBAXG4gICAgICAgIFIgICAgID0gbmV3IGNsYXN6IGRiX3BhdGhcbiAgICAgICAgUi5idWlsZCgpXG4gICAgICAgIFIuX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCApIC0+XG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2Z1bGxfcHJlZml4J1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBjbGFzei5kYl9jbGFzcyBkYl9wYXRoXG4gICAgICAgICMgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgICAgQGNmZyAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIH1cbiAgICAgICAgIyMjIE5PVEUgd2UgY2FuJ3QganVzdCBwcmVwYXJlIGFsbCB0aGUgc3RhdGVtZW50cyBhcyB0aGV5IG1pZ2h0IGRlcGVuZCBvbiBub24tZXhpc3RhbnQgREIgb2JqZWN0cztcbiAgICAgICAgaW5zdGVhZCwgd2UgcHJlcGFyZSBzdGF0ZW1lbnRzIG9uLWRlbWFuZCBhbmQgY2FjaGUgdGhlbSBoZXJlOiAjIyNcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgICAgZm9yIG5hbWUsIGZuX2NmZyBvZiBjbGFzei5mdW5jdGlvbnNcbiAgICAgICAgICBpZiAoIHR5cGVvZiBmbl9jZmcgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICBbIGNhbGwsIGZuX2NmZywgXSA9IFsgZm5fY2ZnLCB7fSwgXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHsgY2FsbCwgfSA9IGZuX2NmZ1xuICAgICAgICAgIGZuX2NmZyAgPSB7IGZuX2NmZ190ZW1wbGF0ZS4uLiwgZm5fY2ZnLCB9XG4gICAgICAgICAgY2FsbCAgICA9IGNhbGwuYmluZCBAXG4gICAgICAgICAgQGRiLmZ1bmN0aW9uIG5hbWUsIGZuX2NmZywgY2FsbFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgICAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3Jwcl9zdHJpbmcgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0ZWFyZG93bjogLT5cbiAgICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAgIGZ1bGxfcHJlZml4ID0gQGZ1bGxfcHJlZml4XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICAgICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgbmFtZS5zdGFydHNXaXRoIGZ1bGxfcHJlZml4XG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSSBuYW1lfTtcIiApLnJ1bigpXG4gICAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcgXCLOqWRicmljX19fMSBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlYnVpbGQ6IC0+XG4gICAgICAgIGNsYXN6ICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgdHlwZV9vZl9idWlsZCA9IHR5cGVfb2YgY2xhc3ouYnVpbGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgdHlwZV9vZl9idWlsZCBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZV9vZl9idWlsZH1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiAtMSBpZiAoIG5vdCBjbGFzei5idWlsZD8gKVxuICAgICAgICByZXR1cm4gIDAgaWYgKCBjbGFzei5idWlsZC5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKClcbiAgICAgICAgY291bnQgPSAwXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBjbGFzei5idWlsZFxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgICAgIHJldHVybiBjb3VudFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnZnVsbF9wcmVmaXgnLCAgLT4gQF9nZXRfZnVsbF9wcmVmaXgoKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX181ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByX3N0cmluZyBtZXNzYWdlc31cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICAgIHJldHVybiBAY29uc3RydWN0b3IubmFtZS5yZXBsYWNlIC9eLipfKFteX10rKSQvLCAnJDEnIHVubGVzcyBAY2ZnLnByZWZpeD9cbiAgICAgICAgcmV0dXJuICcnIGlmIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJ1xuICAgICAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF9mdWxsX3ByZWZpeDogLT5cbiAgICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApXG4gICAgICAgIHJldHVybiAnJyBpZiBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKSdcbiAgICAgICAgcmV0dXJuICcnIGlmIEBjZmcucHJlZml4IGlzICcnXG4gICAgICAgIHJldHVybiBcIiN7QGNmZy5wcmVmaXh9X1wiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByX3N0cmluZyBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAgICMgICAgICAgbnVsbFxuICAgICAgICAjICAgICBlbHNlXG4gICAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfX182IHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3Jwcl9zdHJpbmcgbmFtZX1cIlxuICAgICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsIHt9XG4gICAgICAgIGJ1aWxkX3N0YXRlbWVudF9uYW1lICA9IEBfbmFtZV9vZl9idWlsZF9zdGF0ZW1lbnRzXG4gICAgICAgIGZvciBuYW1lLCBzdGF0ZW1lbnQgb2YgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNcbiAgICAgICAgICAjIGlmICggdHlwZV9vZiBzdGF0ZW1lbnQgKSBpcyAnbGlzdCdcbiAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIG5hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBuYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjICAgIHNxbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgICAgICBjYXRjaCBjYXVzZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX183IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHJfc3RyaW5nIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByX3N0cmluZyBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAZnVuY3Rpb25zOiAgIHt9XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQHN0YXRlbWVudHM6XG4gICAgICAgIHN0ZF9nZXRfc2NoZW1hOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgc3RkX2dldF90YWJsZXM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZScgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIHN0ZF9nZXRfcmVsYXRpb25zOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGJ1aWxkOiBbXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF90YWJsZXMgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdmlld3MgYXNcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IFwic3RkX3JlbGF0aW9uc1wiIGFzXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgICB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICkgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgXVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFNlZ21lbnRfd2lkdGhfZGIgZXh0ZW5kcyBEYnJpY1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBmdW5jdGlvbnM6XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2lkdGhfZnJvbV90ZXh0OlxuICAgICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgICAgY2FsbDogICAgICAgICAgICggdGV4dCApIC0+IGdldF93Y19tYXhfbGluZV9sZW5ndGggdGV4dFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGxlbmd0aF9mcm9tX3RleHQ6XG4gICAgICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgICAgICBjYWxsOiAgICAgICAgICAgKCB0ZXh0ICkgLT4gdGV4dC5sZW5ndGhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAc3RhdGVtZW50czpcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjcmVhdGVfdGFibGVfc2VnbWVudHM6IFNRTFwiXCJcIlxuICAgICAgICAgIGRyb3AgdGFibGUgaWYgZXhpc3RzIHNlZ21lbnRzO1xuICAgICAgICAgIGNyZWF0ZSB0YWJsZSBzZWdtZW50cyAoXG4gICAgICAgICAgICAgIHNlZ21lbnRfdGV4dCAgICAgIHRleHQgICAgbm90IG51bGwgcHJpbWFyeSBrZXksXG4gICAgICAgICAgICAgIHNlZ21lbnRfd2lkdGggICAgIGludGVnZXIgbm90IG51bGwgZ2VuZXJhdGVkIGFsd2F5cyBhcyAoIHdpZHRoX2Zyb21fdGV4dCggIHNlZ21lbnRfdGV4dCApICkgc3RvcmVkLFxuICAgICAgICAgICAgICBzZWdtZW50X2xlbmd0aCAgICBpbnRlZ2VyIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCBsZW5ndGhfZnJvbV90ZXh0KCBzZWdtZW50X3RleHQgKSApIHN0b3JlZCxcbiAgICAgICAgICAgIGNvbnN0cmFpbnQgc2VnbWVudF93aWR0aF9lcWd0X3plcm8gIGNoZWNrICggc2VnbWVudF93aWR0aCAgPj0gMCApLFxuICAgICAgICAgICAgY29uc3RyYWludCBzZWdtZW50X2xlbmd0aF9lcWd0X3plcm8gY2hlY2sgKCBzZWdtZW50X2xlbmd0aCA+PSAwICkgKTtcIlwiXCJcbiAgICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAjIGluc2VydF9zZWdtZW50OiBTUUxcIlwiXCJcbiAgICAgICAgIyAgIGluc2VydCBpbnRvIHNlZ21lbnRzICAoIHNlZ21lbnRfdGV4dCwgICBzZWdtZW50X3dpZHRoLCAgc2VnbWVudF9sZW5ndGggIClcbiAgICAgICAgIyAgICAgICAgICAgICAgICAgdmFsdWVzICAoICRzZWdtZW50X3RleHQsICAkc2VnbWVudF93aWR0aCwgJHNlZ21lbnRfbGVuZ3RoIClcbiAgICAgICAgIyAgICAgb24gY29uZmxpY3QgKCBzZWdtZW50X3RleHQgKSBkbyB1cGRhdGVcbiAgICAgICAgIyAgICAgICAgICAgICAgICAgc2V0ICAgICAoICAgICAgICAgICAgICAgICBzZWdtZW50X3dpZHRoLCAgc2VnbWVudF9sZW5ndGggICkgPVxuICAgICAgICAjICAgICAgICAgICAgICAgICAgICAgICAgICggZXhjbHVkZWQuc2VnbWVudF93aWR0aCwgZXhjbHVkZWQuc2VnbWVudF9sZW5ndGggKTtcIlwiXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpbnNlcnRfc2VnbWVudDogU1FMXCJcIlwiXG4gICAgICAgICAgaW5zZXJ0IGludG8gc2VnbWVudHMgICggc2VnbWVudF90ZXh0ICApXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgICggJHNlZ21lbnRfdGV4dCApXG4gICAgICAgICAgICBvbiBjb25mbGljdCAoIHNlZ21lbnRfdGV4dCApIGRvIG5vdGhpbmdcbiAgICAgICAgICAgIHJldHVybmluZyAqO1wiXCJcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHNlbGVjdF9yb3dfZnJvbV9zZWdtZW50czogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzZWdtZW50cyB3aGVyZSBzZWdtZW50X3RleHQgPSAkc2VnbWVudF90ZXh0IGxpbWl0IDE7XCJcIlwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCApIC0+XG4gICAgICAgIHN1cGVyIGRiX3BhdGhcbiAgICAgICAgY2xhc3ogICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBAY2FjaGUgID0gbmV3IE1hcCgpXG4gICAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgZG9uZSBhdXRvbWF0aWNhbGx5ICMjI1xuICAgICAgICBAc3RhdGVtZW50cyA9XG4gICAgICAgICAgaW5zZXJ0X3NlZ21lbnQ6ICAgICAgICAgICBAcHJlcGFyZSBjbGFzei5zdGF0ZW1lbnRzLmluc2VydF9zZWdtZW50XG4gICAgICAgICAgc2VsZWN0X3Jvd19mcm9tX3NlZ21lbnRzOiBAcHJlcGFyZSBjbGFzei5zdGF0ZW1lbnRzLnNlbGVjdF9yb3dfZnJvbV9zZWdtZW50c1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBpbnRlcm5hbHMuLi4sIFNlZ21lbnRfd2lkdGhfZGIsIH1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICAgIERicmljLFxuICAgICAgRGJyaWNfc3RkLFxuICAgICAgZXNxbCxcbiAgICAgIFNRTCxcbiAgICAgIGludGVybmFscywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgVU5TVEFCTEVfREJSSUNfQlJJQ1NcblxuIl19
