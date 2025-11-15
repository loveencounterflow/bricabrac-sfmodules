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
            debug('Ωdbric___3', {db_path});
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
            this.db = new SQLITE.DatabaseSync(db_path);
            clasz = this.constructor;
            this.cfg = Object.freeze({...clasz.cfg, db_path});
            /* NOTE we can't just prepare all the statements as they might depend on non-existant DB objects;
                   instead, we prepare statements on-demand and cache them here: */
            hide(this, 'statements', {});
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
          _validate_is_property(name) {
            var descriptor;
            descriptor = get_property_descriptor(this, name);
            if ((type_of(descriptor.get)) === 'function') {
              return null;
            }
            throw new Error(`Ωdbric___4 not allowed to override property ${rpr_string(name)}; use '_get_${name} instead`);
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
            var _, count, full_prefix, name, ref, type;
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
              (this.prepare(SQL`drop ${type} ${esql.I(name)};`)).run();
            }
            (this.prepare(SQL`pragma foreign_keys = on;`)).run();
            return count;
          }

          //-----------------------------------------------------------------------------------------------------
          build() {
            debug('Ωdbric___5', this);
            debug('Ωdbric___6', Object.getPrototypeOf(this));
            debug('Ωdbric___7', this.is_ready);
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
              throw new Error(`Ωdbric___8 expected an optional list for ${clasz.name}.build, got a ${type_of_build}`);
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
              // debug 'Ωdbric___9', "build statement:", build_statement
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
            debug('Ωdbric__10', "expected_db_objects", expected_db_objects);
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
              throw new Error(`Ωdbric__11 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr_string(messages)}`);
            }
            //...................................................................................................
            present_db_objects = this._get_db_objects();
            debug('Ωdbric__12', "present_db_objects", present_db_objects);
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
            //       throw new Error "Ωnql__13 unable to parse statement name #{rpr_string name}"
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
            } catch (error) {
              cause = error;
              throw new Error(`Ωdbric__14 when trying to prepare the following statement, an error with message: ${rpr_string(cause.message)} was thrown: ${rpr_string(sql)}`, {cause});
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

        //---------------------------------------------------------------------------------------------------
        set_getter(Dbric.prototype, 'is_ready', function() {
          return this._get_is_ready();
        });

        set_getter(Dbric.prototype, 'prefix', function() {
          return this._get_prefix();
        });

        set_getter(Dbric.prototype, 'full_prefix', function() {
          return this._get_full_prefix;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxvQkFBQTs7Ozs7RUFLQSxvQkFBQSxHQUtFLENBQUE7OztJQUFBLGFBQUEsRUFBZSxRQUFBLENBQUEsQ0FBQTtBQUVqQixVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQUEsZ0JBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLHVCQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQSxPQUFBOztNQUNJLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLFFBQVIsQ0FBRixDQUFvQixDQUFDLDhCQUFyQixDQUFBLENBRDVCO01BRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxRQUFSLENBQUYsQ0FBb0IsQ0FBQyxRQUFRLENBQUMsZUFBOUIsQ0FBQSxDQUE1QixFQUhKOztNQUtJLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsUUFBUixDQUFGLENBQW9CLENBQUMsa0JBQXJCLENBQUEsQ0FBNUI7TUFDQSxNQUFBLEdBQTRCLE9BQUEsQ0FBUSxhQUFSO01BQzVCLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7TUFDQSxNQUFBLEdBQTRCLE1BQUEsQ0FBTyxRQUFQLEVBUmhDOzs7TUFZSSx1QkFBQSxHQUEwQixRQUFBLENBQUUsQ0FBRixFQUFLLElBQUwsRUFBVyxXQUFXLE1BQXRCLENBQUE7QUFDOUIsWUFBQTtBQUFNLGVBQU0sU0FBTjtVQUNFLElBQVksc0RBQVo7QUFBQSxtQkFBTyxFQUFQOztVQUNBLENBQUEsR0FBSSxN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QyxDQUFBLFNBQUQsR0FFRSxDQUFBOztVQUFBLGVBQUEsRUFDRTtZQUFBLGFBQUEsRUFBZ0IsSUFBaEI7WUFDQSxPQUFBLEVBQWdCLEtBRGhCO1lBRUEsSUFBQSxFQUFnQixRQUFBLENBQUUsSUFBRixDQUFBO3FCQUFZLHNCQUFBLENBQXVCLElBQXZCO1lBQVo7VUFGaEIsQ0FERjs7VUFLQSxnQkFBQSxFQUNFO1lBQUEsYUFBQSxFQUFnQixJQUFoQjtZQUNBLE9BQUEsRUFBZ0IsS0FEaEI7WUFFQSxJQUFBLEVBQWdCLFFBQUEsQ0FBRSxJQUFGLENBQUE7cUJBQVksSUFBSSxDQUFDO1lBQWpCO1VBRmhCO1FBTkY7OztRQVdGLGdCQUFDLENBQUEsVUFBRCxHQUVFLENBQUE7O1VBQUEscUJBQUEsRUFBdUIsR0FBRyxDQUFBOzs7Ozs7c0VBQUEsQ0FBMUI7Ozs7Ozs7OztVQWdCQSxjQUFBLEVBQWdCLEdBQUcsQ0FBQTs7O2NBQUEsQ0FoQm5COztVQXNCQSx3QkFBQSxFQUEwQixHQUFHLENBQUEsa0VBQUE7UUF0QjdCOzs7O29CQTlVUjs7TUFtWEksU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxHQUFBLFNBQUYsRUFBZ0IsZ0JBQWhCLENBQWQ7QUFDWixhQUFPLE9BQUEsR0FBVSxDQUNmLEtBRGUsRUFFZixTQUZlLEVBR2YsSUFIZSxFQUlmLEdBSmUsRUFLZixTQUxlO0lBdFhKO0VBQWYsRUFWRjs7O0VBeVlBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLG9CQUE5QjtBQXpZQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuVU5TVEFCTEVfREJSSUNfQlJJQ1MgPVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2RicmljOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gKCByZXF1aXJlICcuL21haW4nICkudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL21haW4nICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICBTUUxJVEUgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gICAgeyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgICBtaXNmaXQgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgIHdoaWxlIHg/XG4gICAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICAgIF4gXFxzKlxuICAgICAgY3JlYXRlIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4ICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIC8vL2lzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGludGVybmFscyA9IHsgdHlwZV9vZiwgY3JlYXRlX3N0YXRlbWVudF9yZSwgfVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBFc3FsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzIgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHJfc3RyaW5nIG5hbWV9XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgSTogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIEw6ICggeCApID0+XG4gICAgICAjICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgICMgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgIyAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgIyAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICMgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgIyAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICMgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICMgVjogKCB4ICkgPT5cbiAgICAgICMgICB0aHJvdyBuZXcgRS5EQmF5X3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgICMgICByZXR1cm4gJyggJyArICggKCBATCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAgICMgICBpZHggPSAtMVxuICAgICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICAgIyAgICAgaWR4KytcbiAgICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAgICMgICAgIHRocm93IG5ldyBFLkRCYXlfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgICByZXR1cm4gUlxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgICAgQGZ1bmN0aW9uczogICB7fVxuICAgICAgQHN0YXRlbWVudHM6ICB7fVxuICAgICAgQGJ1aWxkOiAgICAgICBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQG9wZW46ICggZGJfcGF0aCApIC0+XG4gICAgICAgIGRlYnVnICfOqWRicmljX19fMycsIHsgZGJfcGF0aCwgfVxuICAgICAgICBjbGFzeiA9IEBcbiAgICAgICAgUiAgICAgPSBuZXcgY2xhc3ogZGJfcGF0aFxuICAgICAgICBSLmJ1aWxkKClcbiAgICAgICAgUi5fcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoICkgLT5cbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnZnVsbF9wcmVmaXgnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQGRiICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBAY2ZnICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IGNsYXN6LmNmZy4uLiwgZGJfcGF0aCwgfVxuICAgICAgICAjIyMgTk9URSB3ZSBjYW4ndCBqdXN0IHByZXBhcmUgYWxsIHRoZSBzdGF0ZW1lbnRzIGFzIHRoZXkgbWlnaHQgZGVwZW5kIG9uIG5vbi1leGlzdGFudCBEQiBvYmplY3RzO1xuICAgICAgICBpbnN0ZWFkLCB3ZSBwcmVwYXJlIHN0YXRlbWVudHMgb24tZGVtYW5kIGFuZCBjYWNoZSB0aGVtIGhlcmU6ICMjI1xuICAgICAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywge31cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgICAgIGZvciBuYW1lLCBmbl9jZmcgb2YgY2xhc3ouZnVuY3Rpb25zXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZm5fY2ZnICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgWyBjYWxsLCBmbl9jZmcsIF0gPSBbIGZuX2NmZywge30sIF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7IGNhbGwsIH0gPSBmbl9jZmdcbiAgICAgICAgICBmbl9jZmcgID0geyBmbl9jZmdfdGVtcGxhdGUuLi4sIGZuX2NmZywgfVxuICAgICAgICAgIGNhbGwgICAgPSBjYWxsLmJpbmQgQFxuICAgICAgICAgIEBkYi5mdW5jdGlvbiBuYW1lLCBmbl9jZmcsIGNhbGxcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNCBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3Jwcl9zdHJpbmcgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgICAgUiA9IHt9XG4gICAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0ZWFyZG93bjogLT5cbiAgICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAgIGZ1bGxfcHJlZml4ID0gQGZ1bGxfcHJlZml4XG4gICAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICAgICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgbmFtZS5zdGFydHNXaXRoIGZ1bGxfcHJlZml4XG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tlc3FsLkkgbmFtZX07XCIgKS5ydW4oKVxuICAgICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgYnVpbGQ6IC0+XG4gICAgICAgIGRlYnVnICfOqWRicmljX19fNScsIEBcbiAgICAgICAgZGVidWcgJ86pZGJyaWNfX182JywgT2JqZWN0LmdldFByb3RvdHlwZU9mIEBcbiAgICAgICAgZGVidWcgJ86pZGJyaWNfX183JywgQGlzX3JlYWR5XG4gICAgICAgIGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVidWlsZDogLT5cbiAgICAgICAgY2xhc3ogICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICB0eXBlX29mX2J1aWxkID0gdHlwZV9vZiBjbGFzei5idWlsZFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgIHVubGVzcyB0eXBlX29mX2J1aWxkIGluIFsgJ3VuZGVmaW5lZCcsICdudWxsJywgJ2xpc3QnLCBdXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzggZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlX29mX2J1aWxkfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIC0xIGlmICggbm90IGNsYXN6LmJ1aWxkPyApXG4gICAgICAgIHJldHVybiAgMCBpZiAoIGNsYXN6LmJ1aWxkLmxlbmd0aCBpcyAwIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBAdGVhcmRvd24oKVxuICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkXG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgICMgZGVidWcgJ86pZGJyaWNfX185JywgXCJidWlsZCBzdGF0ZW1lbnQ6XCIsIGJ1aWxkX3N0YXRlbWVudFxuICAgICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgICAgc2V0X2dldHRlciBAOjosICdmdWxsX3ByZWZpeCcsICAtPiBAX2dldF9mdWxsX3ByZWZpeFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgICBkZWJ1ZyAnzqlkYnJpY19fMTAnLCBcImV4cGVjdGVkX2RiX29iamVjdHNcIiwgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByX3N0cmluZyBtZXNzYWdlc31cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBkZWJ1ZyAnzqlkYnJpY19fMTInLCBcInByZXNlbnRfZGJfb2JqZWN0c1wiLCBwcmVzZW50X2RiX29iamVjdHNcbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgICByZXR1cm4gQGNvbnN0cnVjdG9yLm5hbWUucmVwbGFjZSAvXi4qXyhbXl9dKykkLywgJyQxJyB1bmxlc3MgQGNmZy5wcmVmaXg/XG4gICAgICAgIHJldHVybiAnJyBpZiBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKSdcbiAgICAgICAgcmV0dXJuIEBjZmcucHJlZml4XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfZnVsbF9wcmVmaXg6IC0+XG4gICAgICAgIHJldHVybiAnJyBpZiAoIG5vdCBAY2ZnLnByZWZpeD8gKVxuICAgICAgICByZXR1cm4gJycgaWYgQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknXG4gICAgICAgIHJldHVybiAnJyBpZiBAY2ZnLnByZWZpeCBpcyAnJ1xuICAgICAgICByZXR1cm4gXCIje0BjZmcucHJlZml4fV9cIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAgICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgICAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgZGJfb2JqZWN0cyAgICAgID0ge31cbiAgICAgICAgc3RhdGVtZW50X2NvdW50ID0gMFxuICAgICAgICBlcnJvcl9jb3VudCAgICAgPSAwXG4gICAgICAgIGZvciBzdGF0ZW1lbnQgaW4gY2xhc3ouYnVpbGQgPyBbXVxuICAgICAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICAgICAgaWYgKCBtYXRjaCA9IHN0YXRlbWVudC5tYXRjaCBjcmVhdGVfc3RhdGVtZW50X3JlICk/XG4gICAgICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gZXNxbC51bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3Jwcl9zdHJpbmcgc3RhdGVtZW50fVwiXG4gICAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCBtZXNzYWdlLCB9XG4gICAgICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICMgZm9yIG5hbWUsIHNxbCBvZiBjbGFzei5zdGF0ZW1lbnRzXG4gICAgICAgICMgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnY3JlYXRlX3RhYmxlXydcbiAgICAgICAgIyAgICAgICBudWxsXG4gICAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdpbnNlcnRfJ1xuICAgICAgICAjICAgICAgIG51bGxcbiAgICAgICAgIyAgICAgZWxzZVxuICAgICAgICAjICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pbnFsX18xMyB1bmFibGUgdG8gcGFyc2Ugc3RhdGVtZW50IG5hbWUgI3tycHJfc3RyaW5nIG5hbWV9XCJcbiAgICAgICAgIyAjICAgQFsgbmFtZSBdID0gQHByZXBhcmUgc3FsXG4gICAgICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCB7fVxuICAgICAgICBidWlsZF9zdGF0ZW1lbnRfbmFtZSAgPSBAX25hbWVfb2ZfYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICBmb3IgbmFtZSwgc3RhdGVtZW50IG9mIEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzXG4gICAgICAgICAgIyBpZiAoIHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ2xpc3QnXG4gICAgICAgICAgIyAgIEBzdGF0ZW1lbnRzWyBuYW1lIF0gPSAoIEBwcmVwYXJlIHN1Yl9zdGF0ZW1lbnQgZm9yIHN1Yl9zdGF0ZW1lbnQgaW4gc3RhdGVtZW50IClcbiAgICAgICAgICAjICAgY29udGludWVcbiAgICAgICAgICBAc3RhdGVtZW50c1sgbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyAgICBzcWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNCB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByX3N0cmluZyBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3Jwcl9zdHJpbmcgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICAgIHJldHVybiBSXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQGZ1bmN0aW9uczogICB7fVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd2aWV3JyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKSBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBidWlsZDogW1xuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzIGFzXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgICB3aGVyZSB0eXBlIGlzICd0YWJsZScgb3JkZXIgYnkgbmFtZSwgdHlwZTtcIlwiXCJcbiAgICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzIGFzXG4gICAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgICB3aGVyZSB0eXBlIGlzICd2aWV3JyBvcmRlciBieSBuYW1lLCB0eXBlO1wiXCJcIlxuICAgICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBcInN0ZF9yZWxhdGlvbnNcIiBhc1xuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgICAgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApIG9yZGVyIGJ5IG5hbWUsIHR5cGU7XCJcIlwiXG4gICAgICAgIF1cblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBTZWdtZW50X3dpZHRoX2RiIGV4dGVuZHMgRGJyaWNcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAZnVuY3Rpb25zOlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHdpZHRoX2Zyb21fdGV4dDpcbiAgICAgICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgICAgIGNhbGw6ICAgICAgICAgICAoIHRleHQgKSAtPiBnZXRfd2NfbWF4X2xpbmVfbGVuZ3RoIHRleHRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBsZW5ndGhfZnJvbV90ZXh0OlxuICAgICAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICAgICAgY2FsbDogICAgICAgICAgICggdGV4dCApIC0+IHRleHQubGVuZ3RoXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgQHN0YXRlbWVudHM6XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgY3JlYXRlX3RhYmxlX3NlZ21lbnRzOiBTUUxcIlwiXCJcbiAgICAgICAgICBkcm9wIHRhYmxlIGlmIGV4aXN0cyBzZWdtZW50cztcbiAgICAgICAgICBjcmVhdGUgdGFibGUgc2VnbWVudHMgKFxuICAgICAgICAgICAgICBzZWdtZW50X3RleHQgICAgICB0ZXh0ICAgIG5vdCBudWxsIHByaW1hcnkga2V5LFxuICAgICAgICAgICAgICBzZWdtZW50X3dpZHRoICAgICBpbnRlZ2VyIG5vdCBudWxsIGdlbmVyYXRlZCBhbHdheXMgYXMgKCB3aWR0aF9mcm9tX3RleHQoICBzZWdtZW50X3RleHQgKSApIHN0b3JlZCxcbiAgICAgICAgICAgICAgc2VnbWVudF9sZW5ndGggICAgaW50ZWdlciBub3QgbnVsbCBnZW5lcmF0ZWQgYWx3YXlzIGFzICggbGVuZ3RoX2Zyb21fdGV4dCggc2VnbWVudF90ZXh0ICkgKSBzdG9yZWQsXG4gICAgICAgICAgICBjb25zdHJhaW50IHNlZ21lbnRfd2lkdGhfZXFndF96ZXJvICBjaGVjayAoIHNlZ21lbnRfd2lkdGggID49IDAgKSxcbiAgICAgICAgICAgIGNvbnN0cmFpbnQgc2VnbWVudF9sZW5ndGhfZXFndF96ZXJvIGNoZWNrICggc2VnbWVudF9sZW5ndGggPj0gMCApICk7XCJcIlwiXG4gICAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgIyBpbnNlcnRfc2VnbWVudDogU1FMXCJcIlwiXG4gICAgICAgICMgICBpbnNlcnQgaW50byBzZWdtZW50cyAgKCBzZWdtZW50X3RleHQsICAgc2VnbWVudF93aWR0aCwgIHNlZ21lbnRfbGVuZ3RoICApXG4gICAgICAgICMgICAgICAgICAgICAgICAgIHZhbHVlcyAgKCAkc2VnbWVudF90ZXh0LCAgJHNlZ21lbnRfd2lkdGgsICRzZWdtZW50X2xlbmd0aCApXG4gICAgICAgICMgICAgIG9uIGNvbmZsaWN0ICggc2VnbWVudF90ZXh0ICkgZG8gdXBkYXRlXG4gICAgICAgICMgICAgICAgICAgICAgICAgIHNldCAgICAgKCAgICAgICAgICAgICAgICAgc2VnbWVudF93aWR0aCwgIHNlZ21lbnRfbGVuZ3RoICApID1cbiAgICAgICAgIyAgICAgICAgICAgICAgICAgICAgICAgICAoIGV4Y2x1ZGVkLnNlZ21lbnRfd2lkdGgsIGV4Y2x1ZGVkLnNlZ21lbnRfbGVuZ3RoICk7XCJcIlwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaW5zZXJ0X3NlZ21lbnQ6IFNRTFwiXCJcIlxuICAgICAgICAgIGluc2VydCBpbnRvIHNlZ21lbnRzICAoIHNlZ21lbnRfdGV4dCAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzICAoICRzZWdtZW50X3RleHQgKVxuICAgICAgICAgICAgb24gY29uZmxpY3QgKCBzZWdtZW50X3RleHQgKSBkbyBub3RoaW5nXG4gICAgICAgICAgICByZXR1cm5pbmcgKjtcIlwiXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzZWxlY3Rfcm93X2Zyb21fc2VnbWVudHM6IFNRTFwiXCJcIlxuICAgICAgICAgIHNlbGVjdCAqIGZyb20gc2VnbWVudHMgd2hlcmUgc2VnbWVudF90ZXh0ID0gJHNlZ21lbnRfdGV4dCBsaW1pdCAxO1wiXCJcIlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGggKSAtPlxuICAgICAgICBzdXBlciBkYl9wYXRoXG4gICAgICAgIGNsYXN6ICAgPSBAY29uc3RydWN0b3JcbiAgICAgICAgQGNhY2hlICA9IG5ldyBNYXAoKVxuICAgICAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIGRvbmUgYXV0b21hdGljYWxseSAjIyNcbiAgICAgICAgQHN0YXRlbWVudHMgPVxuICAgICAgICAgIGluc2VydF9zZWdtZW50OiAgICAgICAgICAgQHByZXBhcmUgY2xhc3ouc3RhdGVtZW50cy5pbnNlcnRfc2VnbWVudFxuICAgICAgICAgIHNlbGVjdF9yb3dfZnJvbV9zZWdtZW50czogQHByZXBhcmUgY2xhc3ouc3RhdGVtZW50cy5zZWxlY3Rfcm93X2Zyb21fc2VnbWVudHNcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCBTZWdtZW50X3dpZHRoX2RiLCB9XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgICBEYnJpYyxcbiAgICAgIERicmljX3N0ZCxcbiAgICAgIGVzcWwsXG4gICAgICBTUUwsXG4gICAgICBpbnRlcm5hbHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFVOU1RBQkxFX0RCUklDX0JSSUNTXG5cbiJdfQ==
