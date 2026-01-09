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
            throw new E.Dbric_expected_string('Ωdbric__24', type, data);
          }
          if (data === 'null') {
            return data;
          }
          if (!((data.startsWith('{')) && (data.endsWith('}')))) {
            throw new E.Dbric_expected_json_object_string('Ωdbric__25', data);
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
      Dbric_std_base.build = [SQL`create view std_tables    as select * from sqlite_schema where type is 'table';`, SQL`create view std_views     as select * from sqlite_schema where type is 'view';`, SQL`create view std_relations as select * from sqlite_schema where type in ( 'table', 'view' );`];

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
          // whisper 'Ωbbdbr__27', "_std_persist_state"
          //.....................................................................................................
          for (_ in ref1) {
            ({name, value, delta} = ref1[_]);
            /* TAINT clear cache in @state.std_variables ? */
            // whisper 'Ωbbdbr__28', { name, value, delta, }
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
              throw new Error(`Ωbbdbr__29 expected 1 or 2 arguments, got ${arity}`);
          }
          //.....................................................................................................
          if (this.state.std_within_variables_context) {
            throw new Error("Ωbbdbr__30 illegal to nest `std_with_variables()` contexts");
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
            throw new Error("Ωbbdbr__31 illegal to set variable outside of `std_with_variables()` contexts");
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
          //   throw new Error "Ωbbdbr__32 illegal to get variable outside of `std_with_variables()` contexts"
          if (Reflect.has(this.state.std_transients, name)) {
            return this.state.std_transients[name].value;
          }
          if (Reflect.has(this.state.std_variables, name)) {
            return this.state.std_variables[name].value;
          }
          throw new Error(`Ωbbdbr__33 unknown variable ${rpr(name)}`);
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        std_get_next_in_sequence(name) {
          var delta, entry;
          if (!this.state.std_within_variables_context) {
            throw new Error("Ωbbdbr__34 illegal to set variable outside of `std_with_variables()` contexts");
          }
          if ((entry = this.state.std_variables[name]) == null) {
            throw new Error(`Ωbbdbr__35 unknown variable ${rpr(name)}`);
          }
          if ((delta = entry.delta) == null) {
            throw new Error(`Ωbbdbr__36 not a sequence name: ${rpr(name)}`);
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
      Dbric_std_variables.build = [
        //-----------------------------------------------------------------------------------------------------
        SQL`create table std_variables (
  name      text      unique  not null,
  value     json              not null default 'null',
  delta     integer               null default null,
primary key ( name )
constraint "Ωconstraint__26" check ( ( delta is null ) or ( delta != 0 ) )
);`,
        //-----------------------------------------------------------------------------------------------------
        SQL`insert into std_variables ( name, value, delta ) values ( 'seq:global:rowid', 0, +1 );`
      ];

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7SUFZUSxDQUFDLENBQUMsd0JBQVIsTUFBQSxzQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFiLENBQUE7YUFBd0IsQ0FBTSxHQUFOLEVBQVcsQ0FBQSxvQkFBQSxDQUFBLENBQXVCLElBQXZCLENBQUEscUJBQUEsQ0FBQSxDQUFtRCxHQUFBLENBQUksS0FBSixDQUFuRCxDQUFBLENBQVg7TUFBeEI7O0lBRGY7SUFFTSxDQUFDLENBQUMsNkJBQVIsTUFBQSwyQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFi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QTZ1QlEsWUFBTixNQUFBLFVBQUEsUUFBd0Isb0JBQXhCLENBQUEsRUE3dUJGOztBQWl2QkUsV0FBTyxPQUFBLEdBQVU7TUFDZixLQURlO01BRWYsU0FGZTtNQUdmLElBSGU7TUFJZixHQUplO01BS2YsSUFMZTtNQU1mLEtBTmU7TUFPZixTQVBlO01BUWYsT0FSZTtNQVNmLFNBQUEsRUFBVyxNQUFBLENBQU8sQ0FDaEIsT0FEZ0IsRUFFaEIsa0JBRmdCLEVBR2hCLFNBSGdCLEVBSWhCLGNBSmdCLEVBS2hCLG1CQUxnQixDQUFQO0lBVEk7RUFudkJILEVBeEdoQjs7O0VBODJCQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGFBQUYsRUFBaUIsb0JBQWpCLENBQTlCO0FBOTJCQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfZGJyaWNfZXJyb3JzID0gLT5cblxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICBFICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsYXNzIEUuRGJyaWNfZXJyb3IgZXh0ZW5kcyBFcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApIC0+XG4gICAgICBzdXBlcigpXG4gICAgICBAbWVzc2FnZSAgPSBcIiN7cmVmfSAoI3tAY29uc3RydWN0b3IubmFtZX0pICN7bWVzc2FnZX1cIlxuICAgICAgQHJlZiAgICAgID0gcmVmXG4gICAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjbGFzcyBFLkRicmljX3NxbF92YWx1ZV9lcnJvciAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gZXhwcmVzcyBhICN7dHlwZX0gYXMgU1FMIGxpdGVyYWwsIGdvdCAje3JwciB2YWx1ZX1cIlxuICBjbGFzcyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBhIGxpc3QsIGdvdCBhICN7dHlwZX1cIlxuICBjbGFzcyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgYSBzdHJpbmcsIGdvdCBhICN7dHlwZX1cIlxuICBjbGFzcyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHNlcmlhbGl6ZWQgSlNPTiBvYmplY3QsIGdvdCAje3JwciB2YWx1ZX1cIlxuICBjbGFzcyBFLkRicmljX3Vua25vd25fc2VxdWVuY2UgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHNlcXVlbmNlICN7cnByIG5hbWV9XCJcbiAgIyBjbGFzcyBFLkRicmljX3Vua25vd25fdmFyaWFibGUgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBjbGFzcyBFLkRicmljX2NmZ19lcnJvciAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX2V4aXN0cyAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gYWxyZWFkeSBleGlzdHNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfb2JqZWN0X3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hLCBuYW1lICktPiBzdXBlciByZWYsIFwib2JqZWN0ICN7cnByIHNjaGVtYSArICcuJyArIG5hbWV9IGRvZXMgbm90IGV4aXN0XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub25lbXB0eSAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGlzbid0IGVtcHR5XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub3RfYWxsb3dlZCAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IG5vdCBhbGxvd2VkIGhlcmVcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3JlcGVhdGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGNvcHkgc2NoZW1hIHRvIGl0c2VsZiwgZ290ICN7cnByIHNjaGVtYX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3JvdyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcm93X2NvdW50ICkgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgMSByb3csIGdvdCAje3Jvd19jb3VudH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3ZhbHVlICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBrZXlzICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCByb3cgd2l0aCBzaW5nbGUgZmllbGQsIGdvdCBmaWVsZHMgI3tycHIga2V5c31cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXh0ZW5zaW9uX3Vua25vd24gICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXh0ZW5zaW9uIG9mIHBhdGggI3twYXRofSBpcyBub3QgcmVnaXN0ZXJlZCBmb3IgYW55IGZvcm1hdFwiXG4gICMgY2xhc3MgRS5EYnJpY19ub3RfaW1wbGVtZW50ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGlzbid0IGltcGxlbWVudGVkICh5ZXQpXCJcbiAgIyBjbGFzcyBFLkRicmljX2RlcHJlY2F0ZWQgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaGFzIGJlZW4gZGVwcmVjYXRlZFwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX2RiX29iamVjdF90eXBlIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCLCtTc2OSB1bmtub3duIHR5cGUgI3tycHIgdHlwZX0gb2YgREIgb2JqZWN0ICN7ZH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9zcWwgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc3FsICkgICAgICAgICAtPiBzdXBlciByZWYsIFwidW5leHBlY3RlZCBTUUwgc3RyaW5nICN7cnByIHNxbH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX3Rvb19tYW55X2RicyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGF0dGFjaCBzY2hlbWEgI3tycHIgc2NoZW1hfTogdG9vIG1hbnkgYXR0YWNoZWQgZGF0YWJhc2VzXCJcbiAgIyBjbGFzcyBFLkRicmljX3NxbGl0ZV9lcnJvciAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGVycm9yICkgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7ZXJyb3IuY29kZSA/ICdTUUxpdGUgZXJyb3InfTogI3tlcnJvci5tZXNzYWdlfVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19hcmd1bWVudHNfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBhcml0eSApIC0+IHN1cGVyIHJlZiwgXCJtZXRob2QgI3tycHIgbmFtZX0gZG9lc24ndCB0YWtlIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X25vdF9hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImFyZ3VtZW50ICN7cnByIG5hbWV9IG5vdCBhbGxvd2VkLCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X21pc3NpbmcgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHZhbHVlIGZvciAje3JwciBuYW1lfSwgZ290IG5vdGhpbmdcIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfdHlwZSAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZXMsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgI3t0eXBlc30sIGdvdCBhICN7dHlwZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfYXJpdHkgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgbWluLCBtYXgsIGZvdW5kICkgLT4gc3VwZXIgcmVmLCBcIiN7cnByIG5hbWV9IGV4cGVjdGVkIGJldHdlZW4gI3ttaW59IGFuZCAje21heH0gYXJndW1lbnRzLCBnb3QgI3tmb3VuZH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZW1wdHlfY3N2ICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwibm8gQ1NWIHJlY29yZHMgZm91bmQgaW4gZmlsZSAje3BhdGh9XCJcbiAgIyBjbGFzcyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gaW50ZXJwb2xhdGlvbiBmb3JtYXQgI3tycHIgZm9ybWF0fVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19uZXN0ZWRfdHJhbnNhY3Rpb25zICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3Qgc3RhcnQgYSB0cmFuc2FjdGlvbiB3aXRoaW4gYSB0cmFuc2FjdGlvblwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19kZWZlcnJlZF9ma3NfaW5fdHggICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3QgZGVmZXIgZm9yZWlnbiBrZXlzIGluc2lkZSBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX2ludmFsaWRfdGltZXN0YW1wICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHggKSAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcIm5vdCBhIHZhbGlkIERicmljIHRpbWVzdGFtcDogI3tycHIgeH1cIlxuXG4gICMgIyMjIFRBSU5UIHJlcGxhY2Ugd2l0aCBtb3JlIHNwZWNpZmljIGVycm9yLCBsaWtlIGJlbG93ICMjI1xuICAjIGNsYXNzIEUuRGJyaWNfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4gICMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIERCIGZvcm1hdCAje3JlZiBmb3JtYXR9XCJcblxuICAjIGNsYXNzIEUuRGJyaWNfaW1wb3J0X2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuICAjICAgICBmb3JtYXRzID0gWyAoIHJlcXVpcmUgJy4vdHlwZXMnICkuX2ltcG9ydF9mb3JtYXRzLi4uLCBdLmpvaW4gJywgJ1xuICAjICAgICBzdXBlciByZWYsIFwidW5rbm93biBpbXBvcnQgZm9ybWF0ICN7cnByIGZvcm1hdH0gKGtub3duIGZvcm1hdHMgYXJlICN7Zm9ybWF0c30pXCJcblxuICByZXR1cm4gZXhwb3J0cyA9IEVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2RicmljID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG4gICMgeyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxuICAjIHsgbmFtZWl0LCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuICAjIHsgcnByX3N0cmluZywgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgeyBsZXRzLFxuICAgIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbiAgeyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4gIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbiAgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4gIEUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlX2RicmljX2Vycm9ycygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgd2hpbGUgeD9cbiAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICBeIFxccypcbiAgICBpbnNlcnQgfCAoXG4gICAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuICAgICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIClcbiAgICAvLy9pc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVtcGxhdGVzID1cbiAgICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGBgYFxuICBjb25zdCBUcnVlICA9IDE7XG4gIGNvbnN0IEZhbHNlID0gMDtcbiAgYGBgXG5cbiAgZnJvbV9ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICAgIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18xIGV4cGVjdGVkIHRydWUgb3IgZmFsc2UsIGdvdCAje3JwciB4fVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgICB3aGVuIEZhbHNlICB0aGVuIGZhbHNlXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBFc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGEgbmFtZSwgZ290ICN7cnByIG5hbWV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgSUROOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBMSVQ6ICggeCApID0+XG4gICAgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHhcbiAgICAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgICB3aGVuICdmbG9hdCcgICAgICB0aGVuIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICdeZGJheS9zcWxAMV4nLCB0eXBlLCB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFZFQzogKCB4ICkgPT5cbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHJldHVybiAnKCAnICsgKCAoIEBMSVQgZSBmb3IgZSBpbiB4ICkuam9pbiAnLCAnICkgKyAnICknXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICMgICBpZHggPSAtMVxuICAgICMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgPT5cbiAgICAjICAgICBpZHgrK1xuICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAjICAgICAgIHdoZW4gJyQnXG4gICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgIyAgICAgICB3aGVuICc/J1xuICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAjICAgICBzd2l0Y2ggZm9ybWF0XG4gICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4gICAgIyAgICAgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgIyBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuOiAvKD88b3BlbmVyPlskP10pKD88Zm9ybWF0Pi4/KTooPzxuYW1lPlxcdyopL2dcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgIFIgPSBwYXJ0c1sgMCBdXG4gICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgcmV0dXJuIFJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogZnJlZXplXG4gICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgIEBmdW5jdGlvbnM6ICAge31cbiAgICBAc3RhdGVtZW50czogIHt9XG4gICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgQGRiX2NsYXNzOiAgICBTUUxJVEUuRGF0YWJhc2VTeW5jXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCB1c2Ugbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cyAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGRiX2NsYXNzICAgICAgICAgICAgICAgICAgPSAoIGNmZz8uZGJfY2xhc3MgKSA/IGNsYXN6LmRiX2NsYXNzXG4gICAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IGRiX2NsYXNzIGRiX3BhdGhcbiAgICAgICMgQGRiICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICBAYnVpbGQoKVxuICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbml0aWFsaXplOiAtPlxuICAgICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX181IG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgICAgUiA9IHt9XG4gICAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVhcmRvd246ICh7IHRlc3QgPSBudWxsLCB9PXt9KSAtPlxuICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gdGVzdCBpcyAnKidcbiAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgICB3aGVuICggdHlwZV9vZiB0ZXN0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG51bGxcbiAgICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgICBwcmVmaXhfcmUgPSBAcHJlZml4X3JlXG4gICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHByZWZpeF9yZS50ZXN0IG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHR5cGUgPSB0eXBlX29mIHRlc3RcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNiBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIHRyeVxuICAgICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tlc3FsLklETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgd2FybiBcIs6pZGJyaWNfX183IGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZWJ1aWxkOiAtPlxuICAgICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBjb3VudCAgICAgICAgICAgICAgICAgPSAwXG4gICAgICBidWlsZF9zdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnYnVpbGQnICkucmV2ZXJzZSgpXG4gICAgICBoYXNfdG9ybl9kb3duICAgICAgICAgPSBmYWxzZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgYnVpbGRfc3RhdGVtZW50cyApIGluIFsgJ3VuZGVmaW5lZCcsICdudWxsJywgJ2xpc3QnLCBdXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzggZXhwZWN0ZWQgYW4gb3B0aW9uYWwgbGlzdCBmb3IgI3tjbGFzei5uYW1lfS5idWlsZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgY29udGludWUgaWYgKCBub3QgYnVpbGRfc3RhdGVtZW50cz8gKSBvciAoIGJ1aWxkX3N0YXRlbWVudHMubGVuZ3RoIGlzIDAgKVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIEB0ZWFyZG93bigpIHVubGVzcyBoYXNfdG9ybl9kb3duXG4gICAgICAgIGhhc190b3JuX2Rvd24gPSB0cnVlXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGJ1aWxkX3N0YXRlbWVudCBpbiBidWlsZF9zdGF0ZW1lbnRzXG4gICAgICAgICAgY291bnQrK1xuICAgICAgICAgICggQHByZXBhcmUgYnVpbGRfc3RhdGVtZW50ICkucnVuKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnc3VwZXInLCAgICAgICAgICAgIC0+IE9iamVjdC5nZXRQcm90b3R5cGVPZiBAY29uc3RydWN0b3JcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX3JlYWR5JywgICAgICAgICAtPiBAX2dldF9pc19yZWFkeSgpXG4gICAgc2V0X2dldHRlciBAOjosICdwcmVmaXgnLCAgICAgICAgICAgLT4gQF9nZXRfcHJlZml4KClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeF9yZScsICAgICAgICAtPiBAX2dldF9wcmVmaXhfcmUoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnX2Z1bmN0aW9uX25hbWVzJywgIC0+IEBfZ2V0X2Z1bmN0aW9uX25hbWVzKClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3cnLCAgICAgICAgICAgICAgICAtPiBAX2dldF93KClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9pc19yZWFkeTogLT5cbiAgICAgIHsgZXJyb3JfY291bnQsXG4gICAgICAgIHN0YXRlbWVudF9jb3VudCxcbiAgICAgICAgZGJfb2JqZWN0czogZXhwZWN0ZWRfZGJfb2JqZWN0cywgfSA9IEBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50cygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmIGVycm9yX2NvdW50IGlzbnQgMFxuICAgICAgICBtZXNzYWdlcyA9IFtdXG4gICAgICAgIGZvciBuYW1lLCB7IHR5cGUsIG1lc3NhZ2UsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlIGlzICdlcnJvcidcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoIG1lc3NhZ2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzkgI3tlcnJvcl9jb3VudH0gb3V0IG9mICN7c3RhdGVtZW50X2NvdW50fSBidWlsZCBzdGF0ZW1lbnQocykgY291bGQgbm90IGJlIHBhcnNlZDogI3tycHIgbWVzc2FnZXN9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcHJlc2VudF9kYl9vYmplY3RzID0gQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICBmb3IgbmFtZSwgeyB0eXBlOiBleHBlY3RlZF90eXBlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVzZW50X2RiX29iamVjdHNbIG5hbWUgXT8udHlwZSBpcyBleHBlY3RlZF90eXBlXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3ByZWZpeDogLT5cbiAgICAgIHJldHVybiAnJyBpZiAoIG5vdCBAY2ZnLnByZWZpeD8gKSBvciAoIEBjZmcucHJlZml4IGlzICcoTk9QUkVGSVgpJyApXG4gICAgICByZXR1cm4gQGNmZy5wcmVmaXhcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9wcmVmaXhfcmU6IC0+XG4gICAgICByZXR1cm4gL3wvIGlmIEBwcmVmaXggaXMgJydcbiAgICAgIHJldHVybiAvLy8gXiBfPyAje1JlZ0V4cC5lc2NhcGUgQHByZWZpeH0gXyAuKiAkIC8vL1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3c6IC0+XG4gICAgICByZXR1cm4gQF93IGlmIEBfdz9cbiAgICAgIEBfdyA9IG5ldyBAY29uc3RydWN0b3IgQGNmZy5kYl9wYXRoLCB7IGRiX2NsYXNzOiBAZGIuY29uc3RydWN0b3IsIHN0YXRlOiBAc3RhdGUsIH1cbiAgICAgIHJldHVybiBAX3dcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9mdW5jdGlvbl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGRiX29iamVjdHMgICAgICA9IHt9XG4gICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICBlcnJvcl9jb3VudCAgICAgPSAwXG4gICAgICBmb3Igc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkID8gW11cbiAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgaWYgKCBtYXRjaCA9IHN0YXRlbWVudC5tYXRjaCBidWlsZF9zdGF0ZW1lbnRfcmUgKT9cbiAgICAgICAgICB7IG5hbWUsXG4gICAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBuYW1lPyAjIyMgTk9URSBpZ25vcmUgc3RhdGVtZW50cyBsaWtlIGBpbnNlcnRgICMjI1xuICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBlc3FsLnVucXVvdGVfbmFtZSBuYW1lXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3JfY291bnQrK1xuICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgICAgdHlwZSAgICAgICAgICAgICAgICA9ICdlcnJvcidcbiAgICAgICAgICBtZXNzYWdlICAgICAgICAgICAgID0gXCJub24tY29uZm9ybWFudCBzdGF0ZW1lbnQ6ICN7cnByIHN0YXRlbWVudH1cIlxuICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICAgICMgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyBmb3IgbmFtZSwgc3FsIG9mIGNsYXN6LnN0YXRlbWVudHNcbiAgICAgICMgICBzd2l0Y2ggdHJ1ZVxuICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2NyZWF0ZV90YWJsZV8nXG4gICAgICAjICAgICAgIG51bGxcbiAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdpbnNlcnRfJ1xuICAgICAgIyAgICAgICBudWxsXG4gICAgICAjICAgICBlbHNlXG4gICAgICAjICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pbnFsX18xMCB1bmFibGUgdG8gcGFyc2Ugc3RhdGVtZW50IG5hbWUgI3tycHIgbmFtZX1cIlxuICAgICAgIyAjICAgQFsgbmFtZSBdID0gQHByZXBhcmUgc3FsXG4gICAgICBjbGFzeiA9IEBjb25zdHJ1Y3RvclxuICAgICAgc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ3N0YXRlbWVudHMnICkucmV2ZXJzZSgpXG4gICAgICBmb3Igc3RhdGVtZW50cyBpbiBzdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgZm9yIHN0YXRlbWVudF9uYW1lLCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50c1xuICAgICAgICAgIGlmIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdP1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTEgc3RhdGVtZW50ICN7cnByIHN0YXRlbWVudF9uYW1lfSBpcyBhbHJlYWR5IGRlY2xhcmVkXCJcbiAgICAgICAgICAjIGlmICggdHlwZV9vZiBzdGF0ZW1lbnQgKSBpcyAnbGlzdCdcbiAgICAgICAgICAjICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSAoIEBwcmVwYXJlIHN1Yl9zdGF0ZW1lbnQgZm9yIHN1Yl9zdGF0ZW1lbnQgaW4gc3RhdGVtZW50IClcbiAgICAgICAgICAjICAgY29udGludWVcbiAgICAgICAgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9IEBwcmVwYXJlIHN0YXRlbWVudFxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZXhlY3V0ZTogKCBzcWwgKSAtPiBAZGIuZXhlYyBzcWxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2FsazogICAgICAgKCBzcWwsIFAuLi4gKSAtPiAoIEBwcmVwYXJlIHNxbCApLml0ZXJhdGUgUC4uLlxuICAgIGdldF9hbGw6ICAgICggc3FsLCBQLi4uICkgLT4gWyAoIEB3YWxrIHNxbCwgUC4uLiApLi4uLCBdXG4gICAgZ2V0X2ZpcnN0OiAgKCBzcWwsIFAuLi4gKSAtPiAoIEBnZXRfYWxsIHNxbCwgUC4uLiApWyAwIF0gPyBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHByZXBhcmU6ICggc3FsICkgLT5cbiAgICAgIHJldHVybiBzcWwgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzcWwgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTIgZXhwZWN0ZWQgYSBzdGF0ZW1lbnQgb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgIHRyeVxuICAgICAgICBSID0gQGRiLnByZXBhcmUgc3FsXG4gICAgICBjYXRjaCBjYXVzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMyB3aGVuIHRyeWluZyB0byBwcmVwYXJlIHRoZSBmb2xsb3dpbmcgc3RhdGVtZW50LCBhbiBlcnJvciB3aXRoIG1lc3NhZ2U6ICN7cnByIGNhdXNlLm1lc3NhZ2V9IHdhcyB0aHJvd246ICN7cnByIHNxbH1cIiwgeyBjYXVzZSwgfVxuICAgICAgQHN0YXRlLmNvbHVtbnMgPSAoIHRyeSBSPy5jb2x1bW5zPygpIGNhdGNoIGVycm9yIHRoZW4gbnVsbCApID8gW11cbiAgICAgIHJldHVybiBSXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMgRlVOQ1RJT05TXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfY3JlYXRlX3VkZnM6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAjIyMgVEFJTlQgc2hvdWxkIGJlIHB1dCBzb21ld2hlcmUgZWxzZT8gIyMjXG4gICAgICBuYW1lc19vZl9jYWxsYWJsZXMgID1cbiAgICAgICAgZnVuY3Rpb246ICAgICAgICAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgICBhZ2dyZWdhdGVfZnVuY3Rpb246ICAgWyAnc3RhcnQnLCAnc3RlcCcsICdyZXN1bHQnLCBdXG4gICAgICAgIHdpbmRvd19mdW5jdGlvbjogICAgICBbICdzdGFydCcsICdzdGVwJywgJ2ludmVyc2UnLCAncmVzdWx0JywgXVxuICAgICAgICB0YWJsZV9mdW5jdGlvbjogICAgICAgWyAncm93cycsIF1cbiAgICAgICAgdmlydHVhbF90YWJsZTogICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBjYXRlZ29yeSBpbiBbICdmdW5jdGlvbicsIFxcXG4gICAgICAgICdhZ2dyZWdhdGVfZnVuY3Rpb24nLCAnd2luZG93X2Z1bmN0aW9uJywgJ3RhYmxlX2Z1bmN0aW9uJywgJ3ZpcnR1YWxfdGFibGUnLCBdXG4gICAgICAgIHByb3BlcnR5X25hbWUgICAgID0gXCIje2NhdGVnb3J5fXNcIlxuICAgICAgICBtZXRob2RfbmFtZSAgICAgICA9IFwiY3JlYXRlXyN7Y2F0ZWdvcnl9XCJcbiAgICAgICAgZGVjbGFyYXRpb25zX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCBwcm9wZXJ0eV9uYW1lICkucmV2ZXJzZSgpXG4gICAgICAgIGZvciBkZWNsYXJhdGlvbnMgaW4gZGVjbGFyYXRpb25zX2xpc3RcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgZGVjbGFyYXRpb25zP1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgZm9yIHVkZl9uYW1lLCBmbl9jZmcgb2YgZGVjbGFyYXRpb25zXG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgIGZuX2NmZyA9IGxldHMgZm5fY2ZnLCAoIGQgKSA9PlxuICAgICAgICAgICAgICBkLm5hbWUgPz0gdWRmX25hbWVcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICAjIyMgYmluZCBVREZzIHRvIGB0aGlzYCAjIyNcbiAgICAgICAgICAgICAgZm9yIG5hbWVfb2ZfY2FsbGFibGUgaW4gbmFtZXNfb2ZfY2FsbGFibGVzWyBjYXRlZ29yeSBdXG4gICAgICAgICAgICAgICAgY29udGludWUgdW5sZXNzICggY2FsbGFibGUgPSBkWyBuYW1lX29mX2NhbGxhYmxlIF0gKT9cbiAgICAgICAgICAgICAgICBkWyBuYW1lX29mX2NhbGxhYmxlIF0gPSBjYWxsYWJsZS5iaW5kIEBcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIEBbIG1ldGhvZF9uYW1lIF0gZm5fY2ZnXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5mdW5jdGlvbiApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE1IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi5mdW5jdGlvbiBuYW1lLCB7IGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH0sIHZhbHVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE2IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdGVwLFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE3IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV93aW5kb3dfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIuYWdncmVnYXRlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE4IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHdpbmRvdyBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdGVwLFxuICAgICAgICBpbnZlcnNlLFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE5IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi5hZ2dyZWdhdGUgbmFtZSwgeyBzdGFydCwgc3RlcCwgaW52ZXJzZSwgcmVzdWx0LCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHRhYmxlLXZhbHVlZCB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBwYXJhbWV0ZXJzLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICByb3dzLFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIxIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCB7IHBhcmFtZXRlcnMsIGNvbHVtbnMsIHJvd3MsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3ZpcnR1YWxfdGFibGU6ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjIgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgdmlydHVhbCB0YWJsZXNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIGNyZWF0ZSwgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgY3JlYXRlXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIERicmljX3N0ZF9iYXNlIGV4dGVuZHMgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogZnJlZXplXG4gICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVnZXhwOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHBhdHRlcm4sIHRleHQgKSAtPiBpZiAoICggbmV3IFJlZ0V4cCBwYXR0ZXJuLCAndicgKS50ZXN0IHRleHQgKSB0aGVuIDEgZWxzZSAwXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2lzX3VjX25vcm1hbDpcbiAgICAgICAgIyMjIE5PVEU6IGFsc28gc2VlIGBTdHJpbmc6OmlzV2VsbEZvcm1lZCgpYCAjIyNcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBmcm9tX2Jvb2wgdGV4dCBpcyB0ZXh0Lm5vcm1hbGl6ZSBmb3JtICMjIyAnTkZDJywgJ05GRCcsICdORktDJywgb3IgJ05GS0QnICMjI1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9ub3JtYWxpemVfdGV4dDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV90ZXh0IHRleHQsIGZvcm1cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZVxuICAgICAgICB2YWx1ZTogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPiBAc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdCBkYXRhLCBmb3JtXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEB0YWJsZV9mdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2dlbmVyYXRlX3NlcmllczpcbiAgICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgcGFyYW1ldGVyczogICBbICdzdGFydCcsICdzdG9wJywgJ3N0ZXAnLCBdXG4gICAgICAgICMjIyBOT1RFIGRlZmF1bHRzIGFuZCBiZWhhdmlvciBhcyBwZXIgaHR0cHM6Ly9zcWxpdGUub3JnL3Nlcmllcy5odG1sI292ZXJ2aWV3ICMjI1xuICAgICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICAgIHN0ZXAgID0gMSBpZiBzdGVwIGlzIDAgIyMjIE5PVEUgZXF1aXZhbGVudCBgKCBPYmplY3QuaXMgc3RlcCwgKzAgKSBvciAoIE9iamVjdC5pcyBzdGVwLCAtMCApICMjI1xuICAgICAgICAgIHZhbHVlID0gc3RhcnRcbiAgICAgICAgICBsb29wXG4gICAgICAgICAgICBpZiBzdGVwID4gMCB0aGVuICBicmVhayBpZiB2YWx1ZSA+IHN0b3BcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgIGJyZWFrIGlmIHZhbHVlIDwgc3RvcFxuICAgICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgICAgdmFsdWUgKz0gc3RlcFxuICAgICAgICAgIDtudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWE7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3ZpZXdzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgc2VsZWN0IG5hbWUsIGJ1aWx0aW4sIHR5cGUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAYnVpbGQ6IFtcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF90YWJsZXMgICAgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyAgICAgYXMgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3JlbGF0aW9ucyBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgICAgXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIyMgVURGIGltcGxlbWVudGF0aW9ucyAjIyNcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9ub3JtYWxpemVfdGV4dDogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiB0ZXh0Lm5vcm1hbGl6ZSBmb3JtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9ub3JtYWxpemVfanNvbl9vYmplY3Q6ICggZGF0YSwgZm9ybSA9ICdORkMnICkgLT5cbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGRhdGEgKSBpcyAndGV4dCdcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nICfOqWRicmljX18yNCcsIHR5cGUsIGRhdGFcbiAgICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgICB1bmxlc3MgKCBkYXRhLnN0YXJ0c1dpdGggJ3snICkgYW5kICggZGF0YS5lbmRzV2l0aCAnfScgKVxuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9qc29uX29iamVjdF9zdHJpbmcgJ86pZGJyaWNfXzI1JywgZGF0YVxuICAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgIGtleXMgID0gKCBPYmplY3Qua2V5cyBkYXRhICkuc29ydCgpXG4gICAgICBSICAgICA9IEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuICAgICAgcmV0dXJuIEBzdGRfbm9ybWFsaXplX3RleHQgUiwgZm9ybVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGRfdmFyaWFibGVzIGV4dGVuZHMgRGJyaWNfc3RkX2Jhc2VcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgICBzdXBlciBQLi4uXG4gICAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyAgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCAgPz0gZmFsc2VcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIHN0ZF92YXJpYWJsZXMgKFxuICAgICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICB2YWx1ZSAgICAganNvbiAgICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsXG4gICAgICAgICAgZGVsdGEgICAgIGludGVnZXIgICAgICAgICAgICAgICBudWxsIGRlZmF1bHQgbnVsbCxcbiAgICAgICAgcHJpbWFyeSBrZXkgKCBuYW1lIClcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMjZcIiBjaGVjayAoICggZGVsdGEgaXMgbnVsbCApIG9yICggZGVsdGEgIT0gMCApIClcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJ3NlcTpnbG9iYWw6cm93aWQnLCAwLCArMSApO1wiXCJcIlxuICAgICAgXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6ICAoIG5hbWUgKSAtPiBAc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlIG5hbWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2V0X3ZhcmlhYmxlOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X3ZhcmlhYmxlIG5hbWVcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzZXRfdmFyaWFibGU6ICAgICBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICRuYW1lLCAkdmFsdWUsICRkZWx0YSApXG4gICAgICAgICAgb24gY29uZmxpY3QgKCBuYW1lICkgZG8gdXBkYXRlXG4gICAgICAgICAgICBzZXQgdmFsdWUgPSAkdmFsdWUsIGRlbHRhID0gJGRlbHRhO1wiXCJcIlxuICAgICAgZ2V0X3ZhcmlhYmxlczogICAgU1FMXCJzZWxlY3QgbmFtZSwgdmFsdWUsIGRlbHRhIGZyb20gc3RkX3ZhcmlhYmxlcyBvcmRlciBieSBuYW1lO1wiXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9zdGRfYWNxdWlyZV9zdGF0ZTogKCB0cmFuc2llbnRzID0ge30gKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA9IGxldHMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsICggdiApID0+XG4gICAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpXG4gICAgICAgICAgdmFsdWUgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICAgIHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgdHJhbnNpZW50c1xuICAgICAgICAgIHRbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIH1cbiAgICAgICAgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3N0ZF9wZXJzaXN0X3N0YXRlOiAtPlxuICAgICAgIyB3aGlzcGVyICfOqWJiZGJyX18yNycsIFwiX3N0ZF9wZXJzaXN0X3N0YXRlXCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIF8sIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IG9mIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgICAgICMjIyBUQUlOVCBjbGVhciBjYWNoZSBpbiBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA/ICMjI1xuICAgICAgICAjIHdoaXNwZXIgJ86pYmJkYnJfXzI4JywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICAgZGVsdGEgID89IG51bGxcbiAgICAgICAgdmFsdWUgICA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIEBzdGF0ZW1lbnRzLnNldF92YXJpYWJsZS5ydW4geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICAgIGRlbGV0ZSB0WyBuYW1lIF0gZm9yIG5hbWUgb2YgdFxuICAgICAgICA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfd2l0aF92YXJpYWJsZXM6ICggdHJhbnNpZW50cywgZm4gKSAtPlxuICAgICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgICB3aGVuIDEgdGhlbiBbIHRyYW5zaWVudHMsIGZuLCBdID0gWyB7fSwgdHJhbnNpZW50cywgXVxuICAgICAgICB3aGVuIDIgdGhlbiBudWxsXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl9fMjkgZXhwZWN0ZWQgMSBvciAyIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl9fMzAgaWxsZWdhbCB0byBuZXN0IGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBfc3RkX2FjcXVpcmVfc3RhdGUgdHJhbnNpZW50c1xuICAgICAgdHJ5XG4gICAgICAgIFIgPSBmbigpXG4gICAgICBmaW5hbGx5XG4gICAgICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ID0gZmFsc2VcbiAgICAgICAgQF9zdGRfcGVyc2lzdF9zdGF0ZSgpXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfc2V0X3ZhcmlhYmxlOiAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIC0+XG4gICAgICB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl9fMzEgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgPT4gdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgZWxzZVxuICAgICAgICBkZWx0YSA/PSBudWxsXG4gICAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgICAoIHYgKSA9PiB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF92YXJpYWJsZTogKCBuYW1lICkgLT5cbiAgICAgICMgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl9fMzIgaWxsZWdhbCB0byBnZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgICByZXR1cm4gQHN0YXRlLnN0ZF90cmFuc2llbnRzWyBuYW1lIF0udmFsdWVcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCBuYW1lXG4gICAgICAgIHJldHVybiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdLnZhbHVlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyX18zMyB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTogKCBuYW1lICkgLT5cbiAgICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyX18zNCBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgdW5sZXNzICggZW50cnkgPSBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdICk/XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfXzM1IHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgICAgdW5sZXNzICggZGVsdGEgPSBlbnRyeS5kZWx0YSApP1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyX18zNiBub3QgYSBzZXF1ZW5jZSBuYW1lOiAje3JwciBuYW1lfVwiXG4gICAgICBlbnRyeS52YWx1ZSArPSBkZWx0YVxuICAgICAgcmV0dXJuIGVudHJ5LnZhbHVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9zaG93X3ZhcmlhYmxlczogLT5cbiAgICAgIHN0b3JlICAgICAgID0gT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgICAgWyBuYW1lLCB7IHZhbHVlLCBkZWx0YSwgfSwgXSBcXFxuICAgICAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIFxcXG4gICAgICAgICAgICBAc3RhdGVtZW50cy5nZXRfdmFyaWFibGVzLml0ZXJhdGUoKSApXG4gICAgICBjYWNoZV9uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICAgIHRyYW5zX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBAc3RhdGUuc3RkX3RyYW5zaWVudHNcbiAgICAgIHN0b3JlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBzdG9yZVxuICAgICAgYWxsX25hbWVzICAgPSBbICggKCBjYWNoZV9uYW1lcy51bmlvbiBzdG9yZV9uYW1lcyApLnVuaW9uIHRyYW5zX25hbWVzICkuLi4sIF0uc29ydCgpXG4gICAgICBSID0ge31cbiAgICAgIGZvciBuYW1lIGluIGFsbF9uYW1lc1xuICAgICAgICBzICAgICAgICAgPSBzdG9yZVsgICAgICAgICAgICAgICAgICBuYW1lIF0gPyB7fVxuICAgICAgICBjICAgICAgICAgPSBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgICBuYW1lIF0gPyB7fVxuICAgICAgICB0ICAgICAgICAgPSBAc3RhdGUuc3RkX3RyYW5zaWVudHNbICBuYW1lIF0gPyB7fVxuICAgICAgICBndiAgICAgICAgPSBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG4gICAgICAgIFJbIG5hbWUgXSA9IHsgc3Y6IHMudmFsdWUsIHNkOiBzLmRlbHRhLCBjdjogYy52YWx1ZSwgY2Q6IGMuZGVsdGEsIHR2OiB0LnZhbHVlLCBndiwgfVxuICAgICAgY29uc29sZS50YWJsZSBSXG4gICAgICByZXR1cm4gUlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY19zdGRfdmFyaWFibGVzXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0ge1xuICAgIERicmljLFxuICAgIERicmljX3N0ZCxcbiAgICBlc3FsLFxuICAgIFNRTCxcbiAgICBUcnVlLFxuICAgIEZhbHNlLFxuICAgIGZyb21fYm9vbCxcbiAgICBhc19ib29sLFxuICAgIGludGVybmFsczogZnJlZXplIHtcbiAgICAgIHR5cGVfb2YsXG4gICAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgICB0ZW1wbGF0ZXMsXG4gICAgICBEYnJpY19zdGRfYmFzZSxcbiAgICAgIERicmljX3N0ZF92YXJpYWJsZXMsIH1cbiAgICB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfZGJyaWMsIHJlcXVpcmVfZGJyaWNfZXJyb3JzLCB9XG5cbiJdfQ==
