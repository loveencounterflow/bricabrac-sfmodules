(function() {
  'use strict';
  var require_dbric, require_dbric_errors;

  //###########################################################################################################

  //===========================================================================================================
  /* NOTE Future Single-File Module */
  require_dbric_errors = function() {
    var E, exports, rpr;
    ({rpr} = (require('./loupe-brics')).require_loupe());
    E = {};
    //---------------------------------------------------------------------------------------------------------
    E.Dbric_error = class Dbric_error extends Error {
      constructor(ref, message) {
        super();
        this.message = `${ref} (${this.constructor.name}) ${message}`;
        this.ref = ref;
        return void 0/* always return `undefined` from constructor */;
      }

    };
    //---------------------------------------------------------------------------------------------------------
    E.Dbric_sql_value_error = class Dbric_sql_value_error extends E.Dbric_error {
      constructor(ref, type, value) {
        super(ref, `unable to express a ${type} as SQL literal, got ${rpr(value)}`);
      }

    };
    E.Dbric_sql_not_a_list_error = class Dbric_sql_not_a_list_error extends E.Dbric_error {
      constructor(ref, type, value) {
        super(ref, `expected a list, got a ${type}`);
      }

    };
    E.Dbric_expected_string = class Dbric_expected_string extends E.Dbric_error {
      constructor(ref, type) {
        super(ref, `expected a string, got a ${type}`);
      }

    };
    E.Dbric_expected_json_object_string = class Dbric_expected_json_object_string extends E.Dbric_error {
      constructor(ref, value) {
        super(ref, `expected serialized JSON object, got ${rpr(value)}`);
      }

    };
    E.Dbric_unknown_sequence = class Dbric_unknown_sequence extends E.Dbric_error {
      constructor(ref, name) {
        super(ref, `unknown sequence ${rpr(name)}`);
      }

    };
    // class E.Dbric_unknown_variable          extends E.Dbric_error
    //   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"

    //---------------------------------------------------------------------------------------------------------
    // class E.Dbric_cfg_error                 extends E.Dbric_error
    //   constructor: ( ref, message )     -> super ref, message
    // class E.Dbric_internal_error            extends E.Dbric_error
    //   constructor: ( ref, message )     -> super ref, message
    // class E.Dbric_schema_exists             extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} already exists"
    // class E.Dbric_schema_unknown            extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} does not exist"
    // class E.Dbric_object_unknown            extends E.Dbric_error
    //   constructor: ( ref, schema, name )-> super ref, "object #{rpr schema + '.' + name} does not exist"
    // class E.Dbric_schema_nonempty           extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} isn't empty"
    // class E.Dbric_schema_not_allowed        extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} not allowed here"
    // class E.Dbric_schema_repeated           extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "unable to copy schema to itself, got #{rpr schema}"
    // class E.Dbric_expected_single_row       extends E.Dbric_error
    //   constructor: ( ref, row_count )   -> super ref, "expected 1 row, got #{row_count}"
    // class E.Dbric_expected_single_value       extends E.Dbric_error
    //   constructor: ( ref, keys )        -> super ref, "expected row with single field, got fields #{rpr keys}"
    // class E.Dbric_extension_unknown         extends E.Dbric_error
    //   constructor: ( ref, path )        -> super ref, "extension of path #{path} is not registered for any format"
    // class E.Dbric_not_implemented           extends E.Dbric_error
    //   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
    // class E.Dbric_deprecated                extends E.Dbric_error
    //   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
    // class E.Dbric_unexpected_db_object_type extends E.Dbric_error
    //   constructor: ( ref, type, value ) -> super ref, "µ769 unknown type #{rpr type} of DB object #{d}"
    // class E.Dbric_unexpected_sql            extends E.Dbric_error
    //   constructor: ( ref, sql )         -> super ref, "unexpected SQL string #{rpr sql}"
    // class E.Dbric_sqlite_too_many_dbs       extends E.Dbric_error
    //   constructor: ( ref, schema )      -> super ref, "unable to attach schema #{rpr schema}: too many attached databases"
    // class E.Dbric_sqlite_error              extends E.Dbric_error
    //   constructor: ( ref, error )       -> super ref, "#{error.code ? 'SQLite error'}: #{error.message}"
    // class E.Dbric_no_arguments_allowed      extends E.Dbric_error
    //   constructor: ( ref, name, arity ) -> super ref, "method #{rpr name} doesn't take arguments, got #{arity}"
    // class E.Dbric_argument_not_allowed      extends E.Dbric_error
    //   constructor: ( ref, name, value ) -> super ref, "argument #{rpr name} not allowed, got #{rpr value}"
    // class E.Dbric_argument_missing          extends E.Dbric_error
    //   constructor: ( ref, name )        -> super ref, "expected value for #{rpr name}, got nothing"
    // class E.Dbric_wrong_type                extends E.Dbric_error
    //   constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
    // class E.Dbric_wrong_arity               extends E.Dbric_error
    //   constructor: ( ref, name, min, max, found ) -> super ref, "#{rpr name} expected between #{min} and #{max} arguments, got #{found}"
    // class E.Dbric_empty_csv                 extends E.Dbric_error
    //   constructor: ( ref, path )        -> super ref, "no CSV records found in file #{path}"
    // class E.Dbric_interpolation_format_unknown extends E.Dbric_error
    //   constructor: ( ref, format )      -> super ref, "unknown interpolation format #{rpr format}"
    // class E.Dbric_no_nested_transactions    extends E.Dbric_error
    //   constructor: ( ref )              -> super ref, "cannot start a transaction within a transaction"
    // class E.Dbric_no_deferred_fks_in_tx     extends E.Dbric_error
    //   constructor: ( ref )              -> super ref, "cannot defer foreign keys inside a transaction"
    // class E.Dbric_invalid_timestamp         extends E.Dbric_error
    //   constructor: ( ref, x )           -> super ref, "not a valid Dbric timestamp: #{rpr x}"

    // ### TAINT replace with more specific error, like below ###
    // class E.Dbric_format_unknown extends E.Dbric_error
    //   constructor: ( ref, format ) ->
    //     super ref, "unknown DB format #{ref format}"

    // class E.Dbric_import_format_unknown extends E.Dbric_error
    //   constructor: ( ref, format ) ->
    //     formats = [ ( require './types' )._import_formats..., ].join ', '
    //     super ref, "unknown import format #{rpr format} (known formats are #{formats})"
    return exports = E;
  };

  //===========================================================================================================
  /* NOTE Future Single-File Module */
  require_dbric = function() {
    var Dbric, Dbric_std, Dbric_std_base, Dbric_std_variables, E, Esql, SFMODULES, SQL, SQLITE, Undumper, as_bool, build_statement_re, debug, esql, exports, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, nfa, rpr, set_getter, templates, type_of, warn;
    //=========================================================================================================
    SFMODULES = require('./main');
    ({hide, set_getter} = SFMODULES.require_managed_property_tools());
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({rpr} = (require('./loupe-brics')).require_loupe());
    // { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
    // { nameit,                     } = SFMODULES.require_nameit()
    // { rpr_string,                 } = SFMODULES.require_rpr_string()
    ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);
    ({nfa} = require('normalize-function-arguments'));
    SQLITE = require('node:sqlite');
    ({debug, warn} = console);
    misfit = Symbol('misfit');
    ({get_prototype_chain, get_all_in_prototype_chain} = SFMODULES.unstable.require_get_prototype_chain());
    ({Undumper} = SFMODULES.require_coarse_sqlite_statement_segmenter());
    E = require_dbric_errors();
    //---------------------------------------------------------------------------------------------------------
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
    //---------------------------------------------------------------------------------------------------------
    build_statement_re = /^\s*insert|((create|alter)\s+(?<type>table|view|index|trigger)\s+(?<name>\S+)\s+)/is;
    //---------------------------------------------------------------------------------------------------------
    templates = {
      create_function_cfg: {
        deterministic: true,
        varargs: false,
        directOnly: false,
        overwrite: false
      },
      //.......................................................................................................
      create_aggregate_function_cfg: {
        deterministic: true,
        varargs: false,
        directOnly: false,
        start: null,
        overwrite: false
      },
      //.......................................................................................................
      create_window_function_cfg: {
        deterministic: true,
        varargs: false,
        directOnly: false,
        start: null,
        overwrite: false
      },
      //.......................................................................................................
      create_table_function_cfg: {
        deterministic: true,
        varargs: false,
        directOnly: false,
        overwrite: false
      },
      //.......................................................................................................
      create_virtual_table_cfg: {}
    };
    
  const True  = 1;
  const False = 0;
  //=========================================================================================================
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
    //---------------------------------------------------------------------------------------------------------
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
    //=========================================================================================================
    Esql = class Esql {
      constructor() {
        //-------------------------------------------------------------------------------------------------------
        this.IDN = this.IDN.bind(this);
        //-------------------------------------------------------------------------------------------------------
        this.LIT = this.LIT.bind(this);
        //-------------------------------------------------------------------------------------------------------
        this.VEC = this.VEC.bind(this);
      }

      //-------------------------------------------------------------------------------------------------------
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
        throw new Error(`Ωdbric___4 expected a name, got ${rpr(name)}`);
      }

      IDN(name) {
        return '"' + (name.replace(/"/g, '""')) + '"';
      }

      LIT(x) {
        var type;
        if (x == null) {
          return 'null';
        }
        switch (type = type_of(x)) {
          case 'text':
            return "'" + (x.replace(/'/g, "''")) + "'";
          // when 'list'       then return "'#{@list_as_json x}'"
          case 'float':
            return x.toString();
          case 'boolean':
            return (x ? '1' : '0');
        }
        // when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
        throw new E.Dbric_sql_value_error('^dbay/sql@1^', type, x);
      }

      VEC(x) {
        var e, type;
        if ((type = type_of(x)) !== 'list') {
          throw new E.Dbric_sql_not_a_list_error('^dbay/sql@2^', type, x);
        }
        return '( ' + (((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = x.length; i < len; i++) {
            e = x[i];
            results.push(this.LIT(e));
          }
          return results;
        }).call(this)).join(', ')) + ' )';
      }

    };
    // #-----------------------------------------------------------------------------------------------------
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
    //     throw new E.Dbric_interpolation_format_unknown '^dbay/sql@3^', format
    // _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g
    //---------------------------------------------------------------------------------------------------------
    esql = new Esql();
    //---------------------------------------------------------------------------------------------------------
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
      //=========================================================================================================
      class Dbric {
        //-------------------------------------------------------------------------------------------------------
        /* TAINT use normalize-function-arguments */
        constructor(db_path, cfg) {
          var clasz, db_class, fn_cfg_template, ref1, ref2;
          this._validate_is_property('is_ready');
          this._validate_is_property('prefix');
          this._validate_is_property('prefix_re');
          //.....................................................................................................
          if (db_path == null) {
            db_path = ':memory:';
          }
          //.....................................................................................................
          clasz = this.constructor;
          db_class = (ref1 = (cfg != null ? cfg.db_class : void 0)) != null ? ref1 : clasz.db_class;
          hide(this, 'db', new db_class(db_path));
          // @db                       = new SQLITE.DatabaseSync db_path
          this.cfg = freeze({...clasz.cfg, db_path, ...cfg});
          hide(this, 'statements', {});
          hide(this, '_w', null);
          hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
          hide(this, 'state', (ref2 = (cfg != null ? cfg.state : void 0)) != null ? ref2 : {
            columns: null
          });
          //.....................................................................................................
          this.run_standard_pragmas();
          this.initialize();
          //.....................................................................................................
          fn_cfg_template = {
            deterministic: true,
            varargs: false
          };
          this._create_udfs();
          //.....................................................................................................
          /* NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
               contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
               the instance. */
          this.is_fresh = !this.is_ready;
          this.build();
          this._prepare_statements();
          return void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        isa_statement(x) {
          return x instanceof this._statement_class;
        }

        //-------------------------------------------------------------------------------------------------------
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

        //-------------------------------------------------------------------------------------------------------
        initialize() {
          /* This method will be called *before* any build statements are executed and before any statements
               in `@constructor.statements` are prepared and is a good place to create user-defined functions
               (UDFs). You probably want to override it with a method that starts with `super()`. */
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        _validate_is_property(name) {
          var descriptor;
          descriptor = get_property_descriptor(this, name);
          if ((type_of(descriptor.get)) === 'function') {
            return null;
          }
          throw new Error(`Ωdbric___5 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
        }

        //-------------------------------------------------------------------------------------------------------
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

        //-------------------------------------------------------------------------------------------------------
        teardown({test = null} = {}) {
          var _, count, error, name, prefix_re, ref1, type;
          count = 0;
          //.....................................................................................................
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
          //.....................................................................................................
          (this.prepare(SQL`pragma foreign_keys = off;`)).run();
          ref1 = this._get_db_objects();
          for (_ in ref1) {
            ({name, type} = ref1[_]);
            if (!test(name)) {
              continue;
            }
            count++;
            try {
              (this.prepare(SQL`drop ${type} ${esql.IDN(name)};`)).run();
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

        //-------------------------------------------------------------------------------------------------------
        build() {
          if (this.is_ready) {
            return 0;
          } else {
            return this.rebuild();
          }
        }

        //-------------------------------------------------------------------------------------------------------
        rebuild() {
          /* TAINT use proper validation */
          var build_statement, build_statements, build_statements_list, clasz, count, has_torn_down, i, j, len, len1, ref1, type;
          clasz = this.constructor;
          count = 0;
          build_statements_list = (get_all_in_prototype_chain(clasz, 'build')).reverse();
          has_torn_down = false;
//.....................................................................................................
          for (i = 0, len = build_statements_list.length; i < len; i++) {
            build_statements = build_statements_list[i];
            if ((ref1 = (type = type_of(build_statements))) !== 'undefined' && ref1 !== 'null' && ref1 !== 'list') {
              throw new Error(`Ωdbric___8 expected an optional list for ${clasz.name}.build, got a ${type}`);
            }
            if ((build_statements == null) || (build_statements.length === 0)) {
              //...................................................................................................
              continue;
            }
            if (!has_torn_down) {
              //...................................................................................................
              this.teardown();
            }
            has_torn_down = true;
//...................................................................................................
            for (j = 0, len1 = build_statements.length; j < len1; j++) {
              build_statement = build_statements[j];
              count++;
              (this.prepare(build_statement)).run();
            }
          }
          //.....................................................................................................
          return count;
        }

        //-------------------------------------------------------------------------------------------------------
        _get_is_ready() {
          var error_count, expected_db_objects, expected_type, message, messages, name, present_db_objects, ref1, statement_count, type;
          ({
            error_count,
            statement_count,
            db_objects: expected_db_objects
          } = this._get_objects_in_build_statements());
          //.....................................................................................................
          if (error_count !== 0) {
            messages = [];
            for (name in expected_db_objects) {
              ({type, message} = expected_db_objects[name]);
              if (type !== 'error') {
                continue;
              }
              messages.push(message);
            }
            throw new Error(`Ωdbric___9 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
          }
          //.....................................................................................................
          present_db_objects = this._get_db_objects();
          for (name in expected_db_objects) {
            ({
              type: expected_type
            } = expected_db_objects[name]);
            if (((ref1 = present_db_objects[name]) != null ? ref1.type : void 0) !== expected_type) {
              return false;
            }
          }
          return true;
        }

        //-------------------------------------------------------------------------------------------------------
        _get_prefix() {
          if ((this.cfg.prefix == null) || (this.cfg.prefix === '(NOPREFIX)')) {
            return '';
          }
          return this.cfg.prefix;
        }

        //-------------------------------------------------------------------------------------------------------
        _get_prefix_re() {
          if (this.prefix === '') {
            return /|/;
          }
          return RegExp(`^_?${RegExp.escape(this.prefix)}_.*$`);
        }

        //-------------------------------------------------------------------------------------------------------
        _get_w() {
          if (this._w != null) {
            return this._w;
          }
          this._w = new this.constructor(this.cfg.db_path, {
            db_class: this.db.constructor,
            state: this.state
          });
          return this._w;
        }

        //-------------------------------------------------------------------------------------------------------
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

        //-------------------------------------------------------------------------------------------------------
        _get_objects_in_build_statements() {
          /* TAINT does not yet deal with quoted names */
          var clasz, db_objects, error_count, i, len, match, message, name/* NOTE ignore statements like `insert` */, ref1, ref2, statement, statement_count, type;
          clasz = this.constructor;
          db_objects = {};
          statement_count = 0;
          error_count = 0;
          ref2 = (ref1 = clasz.build) != null ? ref1 : [];
          for (i = 0, len = ref2.length; i < len; i++) {
            statement = ref2[i];
            statement_count++;
            if ((match = statement.match(build_statement_re)) != null) {
              ({name, type} = match.groups);
              if (name == null) {
                continue;
              }
              name = esql.unquote_name(name);
              db_objects[name] = {name, type};
            } else {
              error_count++;
              name = `error_${statement_count}`;
              type = 'error';
              message = `non-conformant statement: ${rpr(statement)}`;
              db_objects[name] = {name, type, message};
            }
          }
          return {error_count, statement_count, db_objects};
        }

        //-------------------------------------------------------------------------------------------------------
        _prepare_statements() {
          var clasz, i, len, statement, statement_name, statements, statements_list;
          // #...................................................................................................
          // for name, sql of clasz.statements
          //   switch true
          //     when name.startsWith 'create_table_'
          //       null
          //     when name.startsWith 'insert_'
          //       null
          //     else
          //       throw new Error "Ωnql__10 unable to parse statement name #{rpr name}"
          // #   @[ name ] = @prepare sql
          clasz = this.constructor;
          statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
          for (i = 0, len = statements_list.length; i < len; i++) {
            statements = statements_list[i];
            for (statement_name in statements) {
              statement = statements[statement_name];
              if (this.statements[statement_name] != null) {
                throw new Error(`Ωdbric__11 statement ${rpr(statement_name)} is already declared`);
              }
              // if ( type_of statement ) is 'list'
              //   @statements[ statement_name ] = ( @prepare sub_statement for sub_statement in statement )
              //   continue
              this.statements[statement_name] = this.prepare(statement);
            }
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        execute(sql) {
          return this.db.exec(sql);
        }

        //-------------------------------------------------------------------------------------------------------
        walk(sql, ...P) {
          return (this.prepare(sql)).iterate(...P);
        }

        get_all(sql, ...P) {
          return [...(this.walk(sql, ...P))];
        }

        get_first(sql, ...P) {
          var ref1;
          return (ref1 = (this.get_all(sql, ...P))[0]) != null ? ref1 : null;
        }

        //-------------------------------------------------------------------------------------------------------
        prepare(sql) {
          var R, cause, error, ref1, type;
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
            throw new Error(`Ωdbric__13 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
          }
          this.state.columns = (ref1 = ((function() {
            try {
              return R != null ? typeof R.columns === "function" ? R.columns() : void 0 : void 0;
            } catch (error1) {
              error = error1;
              return null;
            }
          })())) != null ? ref1 : [];
          return R;
        }

        //=======================================================================================================
        // FUNCTIONS
        //-------------------------------------------------------------------------------------------------------
        _create_udfs() {
          /* TAINT should be put somewhere else? */
          var category, clasz, declarations, declarations_list, fn_cfg, i, j, len, len1, method_name, names_of_callables, property_name, ref1, udf_name;
          clasz = this.constructor;
          names_of_callables = {
            function: ['value'],
            aggregate_function: ['start', 'step', 'result'],
            window_function: ['start', 'step', 'inverse', 'result'],
            table_function: ['rows'],
            virtual_table: ['rows']
          };
          ref1 = ['function', 'aggregate_function', 'window_function', 'table_function', 'virtual_table'];
          //.....................................................................................................
          for (i = 0, len = ref1.length; i < len; i++) {
            category = ref1[i];
            property_name = `${category}s`;
            method_name = `create_${category}`;
            declarations_list = (get_all_in_prototype_chain(clasz, property_name)).reverse();
            for (j = 0, len1 = declarations_list.length; j < len1; j++) {
              declarations = declarations_list[j];
              if (declarations == null) {
                continue;
              }
//.................................................................................................
              for (udf_name in declarations) {
                fn_cfg = declarations[udf_name];
                //...............................................................................................
                fn_cfg = lets(fn_cfg, (d) => {
                  var callable, l, len2, name_of_callable, ref2;
                  if (d.name == null) {
                    d.name = udf_name;
                  }
                  ref2 = names_of_callables[category];
                  //.............................................................................................
                  /* bind UDFs to `this` */
                  for (l = 0, len2 = ref2.length; l < len2; l++) {
                    name_of_callable = ref2[l];
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
          //.....................................................................................................
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        create_function(cfg) {
          var deterministic, directOnly, name, overwrite, value, varargs;
          if ((type_of(this.db.function)) !== 'function') {
            throw new Error(`Ωdbric__14 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
          }
          ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__15 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.function(name, {deterministic, varargs, directOnly}, value);
        }

        //-------------------------------------------------------------------------------------------------------
        create_aggregate_function(cfg) {
          var deterministic, directOnly, name, overwrite, result, start, step, varargs;
          if ((type_of(this.db.aggregate)) !== 'function') {
            throw new Error(`Ωdbric__16 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
          }
          ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__17 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_window_function(cfg) {
          var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
          if ((type_of(this.db.aggregate)) !== 'function') {
            throw new Error(`Ωdbric__18 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
          }
          ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__19 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_table_function(cfg) {
          var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
          if ((type_of(this.db.table)) !== 'function') {
            throw new Error(`Ωdbric__20 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
          }
          ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__21 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_virtual_table(cfg) {
          var create, name, overwrite;
          if ((type_of(this.db.table)) !== 'function') {
            throw new Error(`Ωdbric__22 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
          }
          ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__23 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.table(name, create);
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Dbric.cfg = freeze({
        prefix: '(NOPREFIX)'
      });

      Dbric.functions = {};

      Dbric.statements = {};

      Dbric.build = null;

      Dbric.db_class = SQLITE.DatabaseSync;

      //-------------------------------------------------------------------------------------------------------
      set_getter(Dbric.prototype, 'super', function() {
        return Object.getPrototypeOf(this.constructor);
      });

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
    Dbric_std_base = (function() {
      //=========================================================================================================
      class Dbric_std_base extends Dbric {
        //=======================================================================================================
        /* UDF implementations */
        //-------------------------------------------------------------------------------------------------------
        std_normalize_text(text, form = 'NFC') {
          return text.normalize(form);
        }

        //-------------------------------------------------------------------------------------------------------
        std_normalize_json_object(data, form = 'NFC') {
          var R, k, keys, type;
          if ((type = type_of(data)) !== 'text') {
            throw new E.Dbric_expected_string('Ωdbric__25', type, data);
          }
          if (data === 'null') {
            return data;
          }
          if (!((data.startsWith('{')) && (data.endsWith('}')))) {
            throw new E.Dbric_expected_json_object_string('Ωdbric__26', data);
          }
          data = JSON.parse(data);
          keys = (Object.keys(data)).sort();
          R = JSON.stringify(Object.fromEntries((function() {
            var i, len, results;
            results = [];
            for (i = 0, len = keys.length; i < len; i++) {
              k = keys[i];
              results.push([k, data[k]]);
            }
            return results;
          })()));
          return this.std_normalize_text(R, form);
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Dbric_std_base.cfg = freeze({
        prefix: 'std'
      });

      //=======================================================================================================
      Dbric_std_base.functions = {
        //-----------------------------------------------------------------------------------------------------
        regexp: {
          deterministic: true,
          value: function(pattern, text) {
            if ((new RegExp(pattern, 'v')).test(text)) {
              return 1;
            } else {
              return 0;
            }
          }
        },
        //-----------------------------------------------------------------------------------------------------
        std_is_uc_normal: {
          /* NOTE: also see `String::isWellFormed()` */
          deterministic: true,
          value: function(text, form = 'NFC') {
            return from_bool(text === text.normalize(form));
          }
        },
        //-----------------------------------------------------------------------------------------------------
        /* 'NFC', 'NFD', 'NFKC', or 'NFKD' */std_normalize_text: {
          deterministic: true,
          value: function(text, form = 'NFC') {
            return this.std_normalize_text(text, form);
          }
        },
        //---------------------------------------------------------------------------------------------------
        std_normalize_json_object: {
          deterministic: true,
          value: function(data, form = 'NFC') {
            return this.std_normalize_json_object(data, form);
          }
        }
      };

      //=======================================================================================================
      Dbric_std_base.table_functions = {
        //-----------------------------------------------------------------------------------------------------
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

      //=======================================================================================================
      Dbric_std_base.statements = {
        std_get_schema: SQL`select * from sqlite_schema;`,
        std_get_tables: SQL`select * from sqlite_schema where type is 'table';`,
        std_get_views: SQL`select * from sqlite_schema where type is 'view';`,
        std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' );`
      };

      //-------------------------------------------------------------------------------------------------------
      /* select name, builtin, type from pragma_function_list() */
      //-------------------------------------------------------------------------------------------------------
      Dbric_std_base.build = [
        SQL`create view std_tables    as select * from sqlite_schema where type is 'table';`,
        SQL`create view std_views     as select * from sqlite_schema where type is 'view';`,
        SQL`create view std_relations as select * from sqlite_schema where type in ( 'table', 'view' );`,
        SQL`create table std_variables (
  name      text      unique  not null,
  value     json              not null default 'null',
  delta     integer               null default null,
primary key ( name )
constraint "Ωconstraint__24" check ( ( delta is null ) or ( delta != 0 ) )
);`,
        SQL`insert into std_variables ( name, value, delta ) values ( 'seq:global:rowid', 0, +1 );`
      ];

      return Dbric_std_base;

    }).call(this);
    Dbric_std_variables = (function() {
      //=========================================================================================================
      class Dbric_std_variables extends Dbric_std_base {
        //-------------------------------------------------------------------------------------------------------
        constructor(...P) {
          var base, base1, base2;
          super(...P);
          if ((base = this.state).std_variables == null) {
            base.std_variables = freeze({});
          }
          if ((base1 = this.state).std_transients == null) {
            base1.std_transients = freeze({});
          }
          if ((base2 = this.state).std_within_variables_context == null) {
            base2.std_within_variables_context = false;
          }
          void 0;
        }

        //=======================================================================================================
        _std_acquire_state(transients = {}) {
          //.....................................................................................................
          this.state.std_variables = lets(this.state.std_variables, (v) => {
            var delta, name, value, y;
            for (y of this.statements.get_variables.iterate()) {
              ({name, value, delta} = y);
              value = JSON.parse(value);
              v[name] = {name, value, delta};
            }
            return null;
          });
          //.....................................................................................................
          this.state.std_transients = lets(this.state.std_transients, function(t) {
            var name, value;
            for (name in transients) {
              value = transients[name];
              t[name] = {name, value};
            }
            return null;
          });
          //.....................................................................................................
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        _std_persist_state() {
          var _, delta, name, ref1, value;
          ref1 = this.state.std_variables;
          // whisper 'Ωbbdbr_234', "_std_persist_state"
          //.....................................................................................................
          for (_ in ref1) {
            ({name, value, delta} = ref1[_]);
            /* TAINT clear cache in @state.std_variables ? */
            // whisper 'Ωbbdbr_235', { name, value, delta, }
            if (delta == null) {
              delta = null;
            }
            value = JSON.stringify(value);
            this.statements.set_variable.run({name, value, delta});
          }
          //.....................................................................................................
          this.state.std_transients = lets(this.state.std_transients, function(t) {
            for (name in t) {
              delete t[name];
            }
            return null;
          });
          //.....................................................................................................
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        std_with_variables(transients, fn) {
          var R, arity;
          switch (arity = arguments.length) {
            case 1:
              [transients, fn] = [{}, transients];
              break;
            case 2:
              null;
              break;
            default:
              throw new Error(`Ωbbdbr_238 expected 1 or 2 arguments, got ${arity}`);
          }
          //.....................................................................................................
          if (this.state.std_within_variables_context) {
            throw new Error("Ωbbdbr_239 illegal to nest `std_with_variables()` contexts");
          }
          this.state.std_within_variables_context = true;
          //.....................................................................................................
          this._std_acquire_state(transients);
          try {
            R = fn();
          } finally {
            this.state.std_within_variables_context = false;
            this._std_persist_state();
          }
          return R;
        }

        //-------------------------------------------------------------------------------------------------------
        std_set_variable(name, value, delta) {
          if (!this.state.std_within_variables_context) {
            throw new Error("Ωbbdbr_240 illegal to set variable outside of `std_with_variables()` contexts");
          }
          if (Reflect.has(this.state.std_transients, name)) {
            this.state.std_transients = lets(this.state.std_transients, (t) => {
              return t[name] = {name, value};
            });
          } else {
            if (delta == null) {
              delta = null;
            }
            this.state.std_variables = lets(this.state.std_variables, (v) => {
              return v[name] = {name, value, delta};
            });
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        std_get_variable(name) {
          // unless @state.std_within_variables_context
          //   throw new Error "Ωbbdbr_241 illegal to get variable outside of `std_with_variables()` contexts"
          if (Reflect.has(this.state.std_transients, name)) {
            return this.state.std_transients[name].value;
          }
          if (Reflect.has(this.state.std_variables, name)) {
            return this.state.std_variables[name].value;
          }
          throw new Error(`Ωbbdbr_242 unknown variable ${rpr(name)}`);
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        std_get_next_in_sequence(name) {
          var delta, entry;
          if (!this.state.std_within_variables_context) {
            throw new Error("Ωbbdbr_243 illegal to set variable outside of `std_with_variables()` contexts");
          }
          if ((entry = this.state.std_variables[name]) == null) {
            throw new Error(`Ωbbdbr_244 unknown variable ${rpr(name)}`);
          }
          if ((delta = entry.delta) == null) {
            throw new Error(`Ωbbdbr_245 not a sequence name: ${rpr(name)}`);
          }
          entry.value += delta;
          return entry.value;
        }

        //-------------------------------------------------------------------------------------------------------
        _show_variables() {
          var R, all_names, c, cache_names, delta, gv, i, len, name, ref1, ref2, ref3, s, store, store_names, t, trans_names, value;
          store = Object.fromEntries((function() {
            var results, y;
            results = [];
            for (y of this.statements.get_variables.iterate()) {
              ({name, value, delta} = y);
              results.push([name, {value, delta}]);
            }
            return results;
          }).call(this));
          cache_names = new Set(Object.keys(this.state.std_variables));
          trans_names = new Set(Object.keys(this.state.std_transients));
          store_names = new Set(Object.keys(store));
          all_names = [...((cache_names.union(store_names)).union(trans_names))].sort();
          R = {};
          for (i = 0, len = all_names.length; i < len; i++) {
            name = all_names[i];
            s = (ref1 = store[name]) != null ? ref1 : {};
            c = (ref2 = this.state.std_variables[name]) != null ? ref2 : {};
            t = (ref3 = this.state.std_transients[name]) != null ? ref3 : {};
            gv = this.std_get_variable(name);
            R[name] = {
              sv: s.value,
              sd: s.delta,
              cv: c.value,
              cd: c.delta,
              tv: t.value,
              gv
            };
          }
          console.table(R);
          return R;
        }

      };

      //=======================================================================================================
      Dbric_std_variables.functions = {
        //-----------------------------------------------------------------------------------------------------
        std_get_next_in_sequence: {
          deterministic: false,
          value: function(name) {
            return this.std_get_next_in_sequence(name);
          }
        },
        //-----------------------------------------------------------------------------------------------------
        std_get_variable: {
          deterministic: false,
          value: function(name) {
            return this.std_get_variable(name);
          }
        }
      };

      //=======================================================================================================
      Dbric_std_variables.statements = {
        set_variable: SQL`insert into std_variables ( name, value, delta ) values ( $name, $value, $delta )
  on conflict ( name ) do update
    set value = $value, delta = $delta;`,
        get_variables: SQL`select name, value, delta from std_variables order by name;`
      };

      return Dbric_std_variables;

    }).call(this);
    //=========================================================================================================
    Dbric_std = class Dbric_std extends Dbric_std_variables {};
    //=========================================================================================================
    return exports = {
      Dbric,
      Dbric_std,
      esql,
      SQL,
      True,
      False,
      from_bool,
      as_bool,
      internals: freeze({type_of, build_statement_re, templates, Dbric_std_base, Dbric_std_variables})
    };
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_dbric, require_dbric_errors});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7SUFZUSxDQUFDLENBQUMsd0JBQVIsTUFBQSxzQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFiLENBQUE7YUFBd0IsQ0FBTSxHQUFOLEVBQVcsQ0FBQSxvQkFBQSxDQUFBLENBQXVCLElBQXZCLENBQUEscUJBQUEsQ0FBQSxDQUFtRCxHQUFBLENBQUksS0FBSixDQUFuRCxDQUFBLENBQVg7TUFBeEI7O0lBRGY7SUFFTSxDQUFDLENBQUMsNkJBQVIsTUFBQSwyQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFi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eEIsQ0FBQSxFQXJ1QkY7O0FBeXVCRSxXQUFPLE9BQUEsR0FBVTtNQUNmLEtBRGU7TUFFZixTQUZlO01BR2YsSUFIZTtNQUlmLEdBSmU7TUFLZixJQUxlO01BTWYsS0FOZTtNQU9mLFNBUGU7TUFRZixPQVJlO01BU2YsU0FBQSxFQUFXLE1BQUEsQ0FBTyxDQUNoQixPQURnQixFQUVoQixrQkFGZ0IsRUFHaEIsU0FIZ0IsRUFJaEIsY0FKZ0IsRUFLaEIsbUJBTGdCLENBQVA7SUFUSTtFQTN1QkgsRUF4R2hCOzs7RUFzMkJBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLENBQUUsYUFBRixFQUFpQixvQkFBakIsQ0FBOUI7QUF0MkJBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xucmVxdWlyZV9kYnJpY19lcnJvcnMgPSAtPlxuXG4gIHsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG4gIEUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSB7fVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2xhc3MgRS5EYnJpY19lcnJvciBleHRlbmRzIEVycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgLT5cbiAgICAgIHN1cGVyKClcbiAgICAgIEBtZXNzYWdlICA9IFwiI3tyZWZ9ICgje0Bjb25zdHJ1Y3Rvci5uYW1lfSkgI3ttZXNzYWdlfVwiXG4gICAgICBAcmVmICAgICAgPSByZWZcbiAgICAgIHJldHVybiB1bmRlZmluZWQgIyMjIGFsd2F5cyByZXR1cm4gYHVuZGVmaW5lZGAgZnJvbSBjb25zdHJ1Y3RvciAjIyNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBleHByZXNzIGEgI3t0eXBlfSBhcyBTUUwgbGl0ZXJhbCwgZ290ICN7cnByIHZhbHVlfVwiXG4gIGNsYXNzIEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG4gIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBhIHN0cmluZywgZ290IGEgI3t0eXBlfVwiXG4gIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgc2VyaWFsaXplZCBKU09OIG9iamVjdCwgZ290ICN7cnByIHZhbHVlfVwiXG4gIGNsYXNzIEUuRGJyaWNfdW5rbm93bl9zZXF1ZW5jZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gc2VxdWVuY2UgI3tycHIgbmFtZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5rbm93bl92YXJpYWJsZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIGNsYXNzIEUuRGJyaWNfY2ZnX2Vycm9yICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiAgIyBjbGFzcyBFLkRicmljX2ludGVybmFsX2Vycm9yICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfZXhpc3RzICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBhbHJlYWR5IGV4aXN0c1wiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBkb2VzIG5vdCBleGlzdFwiXG4gICMgY2xhc3MgRS5EYnJpY19vYmplY3RfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEsIG5hbWUgKS0+IHN1cGVyIHJlZiwgXCJvYmplY3QgI3tycHIgc2NoZW1hICsgJy4nICsgbmFtZX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vbmVtcHR5ICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gaXNuJ3QgZW1wdHlcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vdF9hbGxvd2VkICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gbm90IGFsbG93ZWQgaGVyZVwiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfcmVwZWF0ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gY29weSBzY2hlbWEgdG8gaXRzZWxmLCBnb3QgI3tycHIgc2NoZW1hfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfcm93ICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCByb3dfY291bnQgKSAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAxIHJvdywgZ290ICN7cm93X2NvdW50fVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfdmFsdWUgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGtleXMgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHJvdyB3aXRoIHNpbmdsZSBmaWVsZCwgZ290IGZpZWxkcyAje3JwciBrZXlzfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHRlbnNpb25fdW5rbm93biAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHRlbnNpb24gb2YgcGF0aCAje3BhdGh9IGlzIG5vdCByZWdpc3RlcmVkIGZvciBhbnkgZm9ybWF0XCJcbiAgIyBjbGFzcyBFLkRicmljX25vdF9pbXBsZW1lbnRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaXNuJ3QgaW1wbGVtZW50ZWQgKHlldClcIlxuICAjIGNsYXNzIEUuRGJyaWNfZGVwcmVjYXRlZCAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBoYXMgYmVlbiBkZXByZWNhdGVkXCJcbiAgIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfZGJfb2JqZWN0X3R5cGUgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcIsK1NzY5IHVua25vd24gdHlwZSAje3JwciB0eXBlfSBvZiBEQiBvYmplY3QgI3tkfVwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX3NxbCAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzcWwgKSAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmV4cGVjdGVkIFNRTCBzdHJpbmcgI3tycHIgc3FsfVwiXG4gICMgY2xhc3MgRS5EYnJpY19zcWxpdGVfdG9vX21hbnlfZGJzICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gYXR0YWNoIHNjaGVtYSAje3JwciBzY2hlbWF9OiB0b28gbWFueSBhdHRhY2hlZCBkYXRhYmFzZXNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX2Vycm9yICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZXJyb3IgKSAgICAgICAtPiBzdXBlciByZWYsIFwiI3tlcnJvci5jb2RlID8gJ1NRTGl0ZSBlcnJvcid9OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2FyZ3VtZW50c19hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIGFyaXR5ICkgLT4gc3VwZXIgcmVmLCBcIm1ldGhvZCAje3JwciBuYW1lfSBkb2Vzbid0IHRha2UgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbm90X2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiYXJndW1lbnQgI3tycHIgbmFtZX0gbm90IGFsbG93ZWQsIGdvdCAje3JwciB2YWx1ZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbWlzc2luZyAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgdmFsdWUgZm9yICN7cnByIG5hbWV9LCBnb3Qgbm90aGluZ1wiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ190eXBlICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlcywgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAje3R5cGVzfSwgZ290IGEgI3t0eXBlfVwiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ19hcml0eSAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBtaW4sIG1heCwgZm91bmQgKSAtPiBzdXBlciByZWYsIFwiI3tycHIgbmFtZX0gZXhwZWN0ZWQgYmV0d2VlbiAje21pbn0gYW5kICN7bWF4fSBhcmd1bWVudHMsIGdvdCAje2ZvdW5kfVwiXG4gICMgY2xhc3MgRS5EYnJpY19lbXB0eV9jc3YgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJubyBDU1YgcmVjb3JkcyBmb3VuZCBpbiBmaWxlICN7cGF0aH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biBpbnRlcnBvbGF0aW9uIGZvcm1hdCAje3JwciBmb3JtYXR9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX25lc3RlZF90cmFuc2FjdGlvbnMgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBzdGFydCBhIHRyYW5zYWN0aW9uIHdpdGhpbiBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2RlZmVycmVkX2Zrc19pbl90eCAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBkZWZlciBmb3JlaWduIGtleXMgaW5zaWRlIGEgdHJhbnNhY3Rpb25cIlxuICAjIGNsYXNzIEUuRGJyaWNfaW52YWxpZF90aW1lc3RhbXAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgeCApICAgICAgICAgICAtPiBzdXBlciByZWYsIFwibm90IGEgdmFsaWQgRGJyaWMgdGltZXN0YW1wOiAje3JwciB4fVwiXG5cbiAgIyAjIyMgVEFJTlQgcmVwbGFjZSB3aXRoIG1vcmUgc3BlY2lmaWMgZXJyb3IsIGxpa2UgYmVsb3cgIyMjXG4gICMgY2xhc3MgRS5EYnJpY19mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiAgIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gREIgZm9ybWF0ICN7cmVmIGZvcm1hdH1cIlxuXG4gICMgY2xhc3MgRS5EYnJpY19pbXBvcnRfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4gICMgICAgIGZvcm1hdHMgPSBbICggcmVxdWlyZSAnLi90eXBlcycgKS5faW1wb3J0X2Zvcm1hdHMuLi4sIF0uam9pbiAnLCAnXG4gICMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIGltcG9ydCBmb3JtYXQgI3tycHIgZm9ybWF0fSAoa25vd24gZm9ybWF0cyBhcmUgI3tmb3JtYXRzfSlcIlxuXG4gIHJldHVybiBleHBvcnRzID0gRVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfZGJyaWMgPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4gICMgeyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gICMgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICB7IGxldHMsXG4gICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICB7IG5mYSwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiAgU1FMSVRFICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuICB7IGRlYnVnLFxuICAgIHdhcm4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuICBtaXNmaXQgICAgICAgICAgICAgICAgICAgICAgICAgID0gU3ltYm9sICdtaXNmaXQnXG4gIHsgZ2V0X3Byb3RvdHlwZV9jaGFpbixcbiAgICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiwgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9wcm90b3R5cGVfY2hhaW4oKVxuICB7IFVuZHVtcGVyLCAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfY29hcnNlX3NxbGl0ZV9zdGF0ZW1lbnRfc2VnbWVudGVyKClcbiAgRSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmVfZGJyaWNfZXJyb3JzKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCBwdXQgaW50byBzZXBhcmF0ZSBtb2R1bGUgIyMjXG4gICMjIyBUQUlOVCByZXdyaXRlIHdpdGggYGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICAjIyMgVEFJTlQgcmV3cml0ZSBhcyBgZ2V0X2ZpcnN0X2Rlc2NyaXB0b3JfaW5fcHJvdG90eXBlX2NoYWluKClgLCBgZ2V0X2ZpcnN0X2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiAgZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgPSAoIHgsIG5hbWUsIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICB3aGlsZSB4P1xuICAgICAgcmV0dXJuIFIgaWYgKCBSID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciB4LCBuYW1lICk/XG4gICAgICB4ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHhcbiAgICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgIHRocm93IG5ldyBFcnJvciBcInVuYWJsZSB0byBmaW5kIGRlc2NyaXB0b3IgZm9yIHByb3BlcnR5ICN7U3RyaW5nKG5hbWUpfSBub3QgZm91bmQgb24gb2JqZWN0IG9yIGl0cyBwcm90b3R5cGVzXCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGJ1aWxkX3N0YXRlbWVudF9yZSA9IC8vL1xuICAgIF4gXFxzKlxuICAgIGluc2VydCB8IChcbiAgICAgICggY3JlYXRlIHwgYWx0ZXIgKSBcXHMrXG4gICAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgICAoPzxuYW1lPiBcXFMrICkgXFxzK1xuICAgICAgKVxuICAgIC8vL2lzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZW1wbGF0ZXMgPVxuICAgIGNyZWF0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZzoge31cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgYGBgXG4gIGNvbnN0IFRydWUgID0gMTtcbiAgY29uc3QgRmFsc2UgPSAwO1xuICBgYGBcblxuICBmcm9tX2Jvb2wgPSAoIHggKSAtPiBzd2l0Y2ggeFxuICAgIHdoZW4gdHJ1ZSAgdGhlbiBUcnVlXG4gICAgd2hlbiBmYWxzZSB0aGVuIEZhbHNlXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzEgZXhwZWN0ZWQgdHJ1ZSBvciBmYWxzZSwgZ290ICN7cnByIHh9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFzX2Jvb2wgPSAoIHggKSAtPiBzd2l0Y2ggeFxuICAgIHdoZW4gVHJ1ZSAgIHRoZW4gdHJ1ZVxuICAgIHdoZW4gRmFsc2UgIHRoZW4gZmFsc2VcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panpyc2RiX19fMiBleHBlY3RlZCAwIG9yIDEsIGdvdCAje3JwciB4fVwiXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIEVzcWxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdW5xdW90ZV9uYW1lOiAoIG5hbWUgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIG5hbWUgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzMgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gL15bXlwiXSguKilbXlwiXSQvLnRlc3QgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVxuICAgICAgICB3aGVuIC9eXCIoLispXCIkLy50ZXN0ICAgICAgICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVbIDEgLi4uIG5hbWUubGVuZ3RoIC0gMSBdLnJlcGxhY2UgL1wiXCIvZywgJ1wiJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzQgZXhwZWN0ZWQgYSBuYW1lLCBnb3QgI3tycHIgbmFtZX1cIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBJRE46ICggbmFtZSApID0+ICdcIicgKyAoIG5hbWUucmVwbGFjZSAvXCIvZywgJ1wiXCInICkgKyAnXCInXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIExJVDogKCB4ICkgPT5cbiAgICAgIHJldHVybiAnbnVsbCcgdW5sZXNzIHg/XG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgICAgICB3aGVuICd0ZXh0JyAgICAgICB0aGVuIHJldHVybiAgXCInXCIgKyAoIHgucmVwbGFjZSAvJy9nLCBcIicnXCIgKSArIFwiJ1wiXG4gICAgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiByZXR1cm4gXCInI3tAbGlzdF9hc19qc29uIHh9J1wiXG4gICAgICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgICAgICB3aGVuICdib29sZWFuJyAgICB0aGVuIHJldHVybiAoIGlmIHggdGhlbiAnMScgZWxzZSAnMCcgKVxuICAgICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gdGhyb3cgbmV3IEVycm9yIFwiXmRiYUAyM14gdXNlIGBYKClgIGZvciBsaXN0c1wiXG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgJ15kYmF5L3NxbEAxXicsIHR5cGUsIHhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgVkVDOiAoIHggKSA9PlxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgJ15kYmF5L3NxbEAyXicsIHR5cGUsIHggdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICAgICAgcmV0dXJuICcoICcgKyAoICggQExJVCBlIGZvciBlIGluIHggKS5qb2luICcsICcgKSArICcgKSdcblxuICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBpbnRlcnBvbGF0ZTogKCBzcWwsIHZhbHVlcyApID0+XG4gICAgIyAgIGlkeCA9IC0xXG4gICAgIyAgIHJldHVybiBzcWwucmVwbGFjZSBAX2ludGVycG9sYXRpb25fcGF0dGVybiwgKCAkMCwgb3BlbmVyLCBmb3JtYXQsIG5hbWUgKSA9PlxuICAgICMgICAgIGlkeCsrXG4gICAgIyAgICAgc3dpdGNoIG9wZW5lclxuICAgICMgICAgICAgd2hlbiAnJCdcbiAgICAjICAgICAgICAgdmFsaWRhdGUubm9uZW1wdHlfdGV4dCBuYW1lXG4gICAgIyAgICAgICAgIGtleSA9IG5hbWVcbiAgICAjICAgICAgIHdoZW4gJz8nXG4gICAgIyAgICAgICAgIGtleSA9IGlkeFxuICAgICMgICAgIHZhbHVlID0gdmFsdWVzWyBrZXkgXVxuICAgICMgICAgIHN3aXRjaCBmb3JtYXRcbiAgICAjICAgICAgIHdoZW4gJycsICdJJyAgdGhlbiByZXR1cm4gQEkgdmFsdWVcbiAgICAjICAgICAgIHdoZW4gJ0wnICAgICAgdGhlbiByZXR1cm4gQEwgdmFsdWVcbiAgICAjICAgICAgIHdoZW4gJ1YnICAgICAgdGhlbiByZXR1cm4gQFYgdmFsdWVcbiAgICAjICAgICB0aHJvdyBuZXcgRS5EYnJpY19pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duICdeZGJheS9zcWxAM14nLCBmb3JtYXRcbiAgICAjIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVzcWwgPSBuZXcgRXNxbCgpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBTUUwgPSAoIHBhcnRzLCBleHByZXNzaW9ucy4uLiApIC0+XG4gICAgUiA9IHBhcnRzWyAwIF1cbiAgICBmb3IgZXhwcmVzc2lvbiwgaWR4IGluIGV4cHJlc3Npb25zXG4gICAgICBSICs9IGV4cHJlc3Npb24udG9TdHJpbmcoKSArIHBhcnRzWyBpZHggKyAxIF1cbiAgICByZXR1cm4gUlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBmcmVlemVcbiAgICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gICAgQGZ1bmN0aW9uczogICB7fVxuICAgIEBzdGF0ZW1lbnRzOiAge31cbiAgICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHVzZSBub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzICMjI1xuICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeF9yZSdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgZGJfY2xhc3MgICAgICAgICAgICAgICAgICA9ICggY2ZnPy5kYl9jbGFzcyApID8gY2xhc3ouZGJfY2xhc3NcbiAgICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBuZXcgZGJfY2xhc3MgZGJfcGF0aFxuICAgICAgIyBAZGIgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IFNRTElURS5EYXRhYmFzZVN5bmMgZGJfcGF0aFxuICAgICAgQGNmZyAgICAgICAgICAgICAgICAgICAgICA9IGZyZWV6ZSB7IGNsYXN6LmNmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICAoIGNmZz8uc3RhdGUgKSA/IHsgY29sdW1uczogbnVsbCwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAcnVuX3N0YW5kYXJkX3ByYWdtYXMoKVxuICAgICAgQGluaXRpYWxpemUoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmbl9jZmdfdGVtcGxhdGUgPSB7IGRldGVybWluaXN0aWM6IHRydWUsIHZhcmFyZ3M6IGZhbHNlLCB9XG4gICAgICBAX2NyZWF0ZV91ZGZzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyMjIE5PVEUgQSAnZnJlc2gnIERCIGluc3RhbmNlIGlzIGEgREIgdGhhdCBzaG91bGQgYmUgKHJlLSlidWlsdCBhbmQvb3IgKHJlLSlwb3B1bGF0ZWQ7IGluXG4gICAgICBjb250cmFkaXN0aW5jdGlvbiB0byBgRGJyaWM6OmlzX3JlYWR5YCwgYERicmljOjppc19mcmVzaGAgcmV0YWlucyBpdHMgdmFsdWUgZm9yIHRoZSBsaWZldGltZSBvZlxuICAgICAgdGhlIGluc3RhbmNlLiAjIyNcbiAgICAgIEBpc19mcmVzaCA9IG5vdCBAaXNfcmVhZHlcbiAgICAgIEBidWlsZCgpXG4gICAgICBAX3ByZXBhcmVfc3RhdGVtZW50cygpXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGlzYV9zdGF0ZW1lbnQ6ICggeCApIC0+IHggaW5zdGFuY2VvZiBAX3N0YXRlbWVudF9jbGFzc1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBydW5fc3RhbmRhcmRfcHJhZ21hczogLT5cbiAgICAgICMjIyBub3QgdXNpbmcgYEBkYi5wcmFnbWFgIGFzIGl0IGlzIG9ubHkgcHJvdmlkZWQgYnkgYGJldHRlci1zcWxpdGUzYCdzIERCIGNsYXNzICMjI1xuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBqb3VybmFsX21vZGUgPSB3YWw7XCIgICApLnJ1bigpXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICAgICkucnVuKClcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgYnVzeV90aW1lb3V0ID0gNjAwMDA7XCIgKS5ydW4oKSAjIyMgdGltZSBpbiBtcyAjIyNcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgc3RyaWN0ICAgICAgID0gb247XCIgICAgKS5ydW4oKVxuICAgICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRpYWxpemU6IC0+XG4gICAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgICBSID0ge31cbiAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiB0cnVlXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHRlc3QgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICB3aGVuIG5vdCB0ZXN0P1xuICAgICAgICAgIHByZWZpeF9yZSA9IEBwcmVmaXhfcmVcbiAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdHlwZSA9IHR5cGVfb2YgdGVzdFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX182IGV4cGVjdGVkIGAnKidgLCBhIFJlZ0V4cCwgYSBmdW5jdGlvbiwgbnVsbCBvciB1bmRlZmluZWQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBjb250aW51ZSB1bmxlc3MgdGVzdCBuYW1lXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgdHJ5XG4gICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlYnVpbGQ6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKCkgdW5sZXNzIGhhc190b3JuX2Rvd25cbiAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgeyBlcnJvcl9jb3VudCxcbiAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfdzogLT5cbiAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgZGJfY2xhc3M6IEBkYi5jb25zdHJ1Y3Rvciwgc3RhdGU6IEBzdGF0ZSwgfVxuICAgICAgcmV0dXJuIEBfd1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgZGJfb2JqZWN0cyAgICAgID0ge31cbiAgICAgIHN0YXRlbWVudF9jb3VudCA9IDBcbiAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgIGZvciBzdGF0ZW1lbnQgaW4gY2xhc3ouYnVpbGQgPyBbXVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHIgc3RhdGVtZW50fVwiXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIGZvciBuYW1lLCBzcWwgb2YgY2xhc3ouc3RhdGVtZW50c1xuICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnY3JlYXRlX3RhYmxlXydcbiAgICAgICMgICAgICAgbnVsbFxuICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAjICAgICAgIG51bGxcbiAgICAgICMgICAgIGVsc2VcbiAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfXzEwIHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3JwciBuYW1lfVwiXG4gICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMSBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgICMgaWYgKCB0eXBlX29mIHN0YXRlbWVudCApIGlzICdsaXN0J1xuICAgICAgICAgICMgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gICAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMiBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdHJ5XG4gICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEzIHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyBGVU5DVElPTlNcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTYgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTcgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTggREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIGludmVyc2UsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIHJvd3MsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIzIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkX2Jhc2UgZXh0ZW5kcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBmcmVlemVcbiAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICByZWdleHA6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfaXNfdWNfbm9ybWFsOlxuICAgICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX25vcm1hbGl6ZV90ZXh0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX3RleHQgdGV4dCwgZm9ybVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBidWlsZDogW1xuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfcmVsYXRpb25zIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgc3RkX3ZhcmlhYmxlcyAoXG4gICAgICAgICAgbmFtZSAgICAgIHRleHQgICAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICAgIHZhbHVlICAgICBqc29uICAgICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJyxcbiAgICAgICAgICBkZWx0YSAgICAgaW50ZWdlciAgICAgICAgICAgICAgIG51bGwgZGVmYXVsdCBudWxsLFxuICAgICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKVxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18yNFwiIGNoZWNrICggKCBkZWx0YSBpcyBudWxsICkgb3IgKCBkZWx0YSAhPSAwICkgKVxuICAgICAgICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICdzZXE6Z2xvYmFsOnJvd2lkJywgMCwgKzEgKTtcIlwiXCJcbiAgICAgIF1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyMjIFVERiBpbXBsZW1lbnRhdGlvbnMgIyMjXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX3RleHQ6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gdGV4dC5ub3JtYWxpemUgZm9ybVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+XG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBkYXRhICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyAnzqlkYnJpY19fMjUnLCB0eXBlLCBkYXRhXG4gICAgICByZXR1cm4gZGF0YSBpZiBkYXRhIGlzICdudWxsJ1xuICAgICAgdW5sZXNzICggZGF0YS5zdGFydHNXaXRoICd7JyApIGFuZCAoIGRhdGEuZW5kc1dpdGggJ30nIClcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljX18yNicsIGRhdGFcbiAgICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgUiAgICAgPSBKU09OLnN0cmluZ2lmeSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGssIGRhdGFbIGsgXSwgXSBmb3IgayBpbiBrZXlzIClcbiAgICAgIHJldHVybiBAc3RkX25vcm1hbGl6ZV90ZXh0IFIsIGZvcm1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkX3ZhcmlhYmxlcyBleHRlbmRzIERicmljX3N0ZF9iYXNlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgICAgc3VwZXIgUC4uLlxuICAgICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgID89IGZhbHNlXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UgbmFtZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZXRfdmFyaWFibGU6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAc3RhdGVtZW50czpcbiAgICAgIHNldF92YXJpYWJsZTogICAgIFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJG5hbWUsICR2YWx1ZSwgJGRlbHRhIClcbiAgICAgICAgICBvbiBjb25mbGljdCAoIG5hbWUgKSBkbyB1cGRhdGVcbiAgICAgICAgICAgIHNldCB2YWx1ZSA9ICR2YWx1ZSwgZGVsdGEgPSAkZGVsdGE7XCJcIlwiXG4gICAgICBnZXRfdmFyaWFibGVzOiAgICBTUUxcInNlbGVjdCBuYW1lLCB2YWx1ZSwgZGVsdGEgZnJvbSBzdGRfdmFyaWFibGVzIG9yZGVyIGJ5IG5hbWU7XCJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3N0ZF9hY3F1aXJlX3N0YXRlOiAoIHRyYW5zaWVudHMgPSB7fSApIC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgKCB2ICkgPT5cbiAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gQHN0YXRlbWVudHMuZ2V0X3ZhcmlhYmxlcy5pdGVyYXRlKClcbiAgICAgICAgICB2YWx1ZSAgICAgPSBKU09OLnBhcnNlIHZhbHVlXG4gICAgICAgICAgdlsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICAgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiB0cmFuc2llbnRzXG4gICAgICAgICAgdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgICA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfc3RkX3BlcnNpc3Rfc3RhdGU6IC0+XG4gICAgICAjIHdoaXNwZXIgJ86pYmJkYnJfMjM0JywgXCJfc3RkX3BlcnNpc3Rfc3RhdGVcIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgXywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gb2YgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICAgICAgIyMjIFRBSU5UIGNsZWFyIGNhY2hlIGluIEBzdGF0ZS5zdGRfdmFyaWFibGVzID8gIyMjXG4gICAgICAgICMgd2hpc3BlciAnzqliYmRicl8yMzUnLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgICBkZWx0YSAgPz0gbnVsbFxuICAgICAgICB2YWx1ZSAgID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgQHN0YXRlbWVudHMuc2V0X3ZhcmlhYmxlLnJ1biB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgLT5cbiAgICAgICAgZGVsZXRlIHRbIG5hbWUgXSBmb3IgbmFtZSBvZiB0XG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF93aXRoX3ZhcmlhYmxlczogKCB0cmFuc2llbnRzLCBmbiApIC0+XG4gICAgICBzd2l0Y2ggYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgICAgIHdoZW4gMSB0aGVuIFsgdHJhbnNpZW50cywgZm4sIF0gPSBbIHt9LCB0cmFuc2llbnRzLCBdXG4gICAgICAgIHdoZW4gMiB0aGVuIG51bGxcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzIzOCBleHBlY3RlZCAxIG9yIDIgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzIzOSBpbGxlZ2FsIHRvIG5lc3QgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQF9zdGRfYWNxdWlyZV9zdGF0ZSB0cmFuc2llbnRzXG4gICAgICB0cnlcbiAgICAgICAgUiA9IGZuKClcbiAgICAgIGZpbmFsbHlcbiAgICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSBmYWxzZVxuICAgICAgICBAX3N0ZF9wZXJzaXN0X3N0YXRlKClcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9zZXRfdmFyaWFibGU6ICggbmFtZSwgdmFsdWUsIGRlbHRhICkgLT5cbiAgICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzI0MCBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSA9PiB0WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCB9XG4gICAgICBlbHNlXG4gICAgICAgIGRlbHRhID89IG51bGxcbiAgICAgICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgPSBsZXRzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCAgICggdiApID0+IHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2V0X3ZhcmlhYmxlOiAoIG5hbWUgKSAtPlxuICAgICAgIyB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICMgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzI0MSBpbGxlZ2FsIHRvIGdldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICAgIHJldHVybiBAc3RhdGUuc3RkX3RyYW5zaWVudHNbIG5hbWUgXS52YWx1ZVxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsIG5hbWVcbiAgICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0udmFsdWVcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQyIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOiAoIG5hbWUgKSAtPlxuICAgICAgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQzIGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgICB1bmxlc3MgKCBlbnRyeSA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0gKT9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl8yNDQgdW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICAgICB1bmxlc3MgKCBkZWx0YSA9IGVudHJ5LmRlbHRhICk/XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQ1IG5vdCBhIHNlcXVlbmNlIG5hbWU6ICN7cnByIG5hbWV9XCJcbiAgICAgIGVudHJ5LnZhbHVlICs9IGRlbHRhXG4gICAgICByZXR1cm4gZW50cnkudmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3Nob3dfdmFyaWFibGVzOiAtPlxuICAgICAgc3RvcmUgICAgICAgPSBPYmplY3QuZnJvbUVudHJpZXMgKCBcXFxuICAgICAgICBbIG5hbWUsIHsgdmFsdWUsIGRlbHRhLCB9LCBdIFxcXG4gICAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gXFxcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpIClcbiAgICAgIGNhY2hlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBAc3RhdGUuc3RkX3ZhcmlhYmxlc1xuICAgICAgdHJhbnNfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1xuICAgICAgc3RvcmVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIHN0b3JlXG4gICAgICBhbGxfbmFtZXMgICA9IFsgKCAoIGNhY2hlX25hbWVzLnVuaW9uIHN0b3JlX25hbWVzICkudW5pb24gdHJhbnNfbmFtZXMgKS4uLiwgXS5zb3J0KClcbiAgICAgIFIgPSB7fVxuICAgICAgZm9yIG5hbWUgaW4gYWxsX25hbWVzXG4gICAgICAgIHMgICAgICAgICA9IHN0b3JlWyAgICAgICAgICAgICAgICAgIG5hbWUgXSA/IHt9XG4gICAgICAgIGMgICAgICAgICA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyAgIG5hbWUgXSA/IHt9XG4gICAgICAgIHQgICAgICAgICA9IEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgIG5hbWUgXSA/IHt9XG4gICAgICAgIGd2ICAgICAgICA9IEBzdGRfZ2V0X3ZhcmlhYmxlIG5hbWVcbiAgICAgICAgUlsgbmFtZSBdID0geyBzdjogcy52YWx1ZSwgc2Q6IHMuZGVsdGEsIGN2OiBjLnZhbHVlLCBjZDogYy5kZWx0YSwgdHY6IHQudmFsdWUsIGd2LCB9XG4gICAgICBjb25zb2xlLnRhYmxlIFJcbiAgICAgIHJldHVybiBSXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljX3N0ZF92YXJpYWJsZXNcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgRGJyaWMsXG4gICAgRGJyaWNfc3RkLFxuICAgIGVzcWwsXG4gICAgU1FMLFxuICAgIFRydWUsXG4gICAgRmFsc2UsXG4gICAgZnJvbV9ib29sLFxuICAgIGFzX2Jvb2wsXG4gICAgaW50ZXJuYWxzOiBmcmVlemUge1xuICAgICAgdHlwZV9vZixcbiAgICAgIGJ1aWxkX3N0YXRlbWVudF9yZSxcbiAgICAgIHRlbXBsYXRlcyxcbiAgICAgIERicmljX3N0ZF9iYXNlLFxuICAgICAgRGJyaWNfc3RkX3ZhcmlhYmxlcywgfVxuICAgIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9kYnJpYywgcmVxdWlyZV9kYnJpY19lcnJvcnMsIH1cblxuIl19
