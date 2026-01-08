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
/* time in ms */          return null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7SUFZUSxDQUFDLENBQUMsd0JBQVIsTUFBQSxzQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFiLENBQUE7YUFBd0IsQ0FBTSxHQUFOLEVBQVcsQ0FBQSxvQkFBQSxDQUFBLENBQXVCLElBQXZCLENBQUEscUJBQUEsQ0FBQSxDQUFtRCxHQUFBLENBQUksS0FBSixDQUFuRCxDQUFBLENBQVg7TUFBeEI7O0lBRGY7SUFFTSxDQUFDLENBQUMsNkJBQVIsTUFBQSwyQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFi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QXdCLG9CQUF4QixDQUFBLEVBcnVCRjs7QUF5dUJFLFdBQU8sT0FBQSxHQUFVO01BQ2YsS0FEZTtNQUVmLFNBRmU7TUFHZixJQUhlO01BSWYsR0FKZTtNQUtmLElBTGU7TUFNZixLQU5lO01BT2YsU0FQZTtNQVFmLE9BUmU7TUFTZixTQUFBLEVBQVcsTUFBQSxDQUFPLENBQ2hCLE9BRGdCLEVBRWhCLGtCQUZnQixFQUdoQixTQUhnQixFQUloQixjQUpnQixFQUtoQixtQkFMZ0IsQ0FBUDtJQVRJO0VBM3VCSCxFQXhHaEI7OztFQXMyQkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsQ0FBRSxhQUFGLEVBQWlCLG9CQUFqQixDQUE5QjtBQXQyQkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2RicmljX2Vycm9ycyA9IC0+XG5cbiAgeyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgRSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAtPlxuICAgICAgc3VwZXIoKVxuICAgICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICAgIEByZWYgICAgICA9IHJlZlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZCAjIyMgYWx3YXlzIHJldHVybiBgdW5kZWZpbmVkYCBmcm9tIGNvbnN0cnVjdG9yICMjI1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2xhc3MgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGV4cHJlc3MgYSAje3R5cGV9IGFzIFNRTCBsaXRlcmFsLCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgY2xhc3MgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgYSBsaXN0LCBnb3QgYSAje3R5cGV9XCJcbiAgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zdHJpbmcgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgc3RyaW5nLCBnb3QgYSAje3R5cGV9XCJcbiAgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9qc29uX29iamVjdF9zdHJpbmcgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBzZXJpYWxpemVkIEpTT04gb2JqZWN0LCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgY2xhc3MgRS5EYnJpY191bmtub3duX3NlcXVlbmNlICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biBzZXF1ZW5jZSAje3JwciBuYW1lfVwiXG4gICMgY2xhc3MgRS5EYnJpY191bmtub3duX3ZhcmlhYmxlICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgY2xhc3MgRS5EYnJpY19jZmdfZXJyb3IgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuICAjIGNsYXNzIEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9leGlzdHMgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGFscmVhZHkgZXhpc3RzXCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV91bmtub3duICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGRvZXMgbm90IGV4aXN0XCJcbiAgIyBjbGFzcyBFLkRicmljX29iamVjdF91bmtub3duICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSwgbmFtZSApLT4gc3VwZXIgcmVmLCBcIm9iamVjdCAje3JwciBzY2hlbWEgKyAnLicgKyBuYW1lfSBkb2VzIG5vdCBleGlzdFwiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfbm9uZW1wdHkgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBpc24ndCBlbXB0eVwiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfbm90X2FsbG93ZWQgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBub3QgYWxsb3dlZCBoZXJlXCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9yZXBlYXRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBjb3B5IHNjaGVtYSB0byBpdHNlbGYsIGdvdCAje3JwciBzY2hlbWF9XCJcbiAgIyBjbGFzcyBFLkRicmljX2V4cGVjdGVkX3NpbmdsZV9yb3cgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHJvd19jb3VudCApICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIDEgcm93LCBnb3QgI3tyb3dfY291bnR9XCJcbiAgIyBjbGFzcyBFLkRicmljX2V4cGVjdGVkX3NpbmdsZV92YWx1ZSAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwga2V5cyApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgcm93IHdpdGggc2luZ2xlIGZpZWxkLCBnb3QgZmllbGRzICN7cnByIGtleXN9XCJcbiAgIyBjbGFzcyBFLkRicmljX2V4dGVuc2lvbl91bmtub3duICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHBhdGggKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4dGVuc2lvbiBvZiBwYXRoICN7cGF0aH0gaXMgbm90IHJlZ2lzdGVyZWQgZm9yIGFueSBmb3JtYXRcIlxuICAjIGNsYXNzIEUuRGJyaWNfbm90X2ltcGxlbWVudGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBpc24ndCBpbXBsZW1lbnRlZCAoeWV0KVwiXG4gICMgY2xhc3MgRS5EYnJpY19kZXByZWNhdGVkICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGhhcyBiZWVuIGRlcHJlY2F0ZWRcIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9kYl9vYmplY3RfdHlwZSBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiwrU3NjkgdW5rbm93biB0eXBlICN7cnByIHR5cGV9IG9mIERCIG9iamVjdCAje2R9XCJcbiAgIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfc3FsICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNxbCApICAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVuZXhwZWN0ZWQgU1FMIHN0cmluZyAje3JwciBzcWx9XCJcbiAgIyBjbGFzcyBFLkRicmljX3NxbGl0ZV90b29fbWFueV9kYnMgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBhdHRhY2ggc2NoZW1hICN7cnByIHNjaGVtYX06IHRvbyBtYW55IGF0dGFjaGVkIGRhdGFiYXNlc1wiXG4gICMgY2xhc3MgRS5EYnJpY19zcWxpdGVfZXJyb3IgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBlcnJvciApICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje2Vycm9yLmNvZGUgPyAnU1FMaXRlIGVycm9yJ306ICN7ZXJyb3IubWVzc2FnZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfbm9fYXJndW1lbnRzX2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgYXJpdHkgKSAtPiBzdXBlciByZWYsIFwibWV0aG9kICN7cnByIG5hbWV9IGRvZXNuJ3QgdGFrZSBhcmd1bWVudHMsIGdvdCAje2FyaXR5fVwiXG4gICMgY2xhc3MgRS5EYnJpY19hcmd1bWVudF9ub3RfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJhcmd1bWVudCAje3JwciBuYW1lfSBub3QgYWxsb3dlZCwgZ290ICN7cnByIHZhbHVlfVwiXG4gICMgY2xhc3MgRS5EYnJpY19hcmd1bWVudF9taXNzaW5nICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCB2YWx1ZSBmb3IgI3tycHIgbmFtZX0sIGdvdCBub3RoaW5nXCJcbiAgIyBjbGFzcyBFLkRicmljX3dyb25nX3R5cGUgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGVzLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkICN7dHlwZXN9LCBnb3QgYSAje3R5cGV9XCJcbiAgIyBjbGFzcyBFLkRicmljX3dyb25nX2FyaXR5ICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIG1pbiwgbWF4LCBmb3VuZCApIC0+IHN1cGVyIHJlZiwgXCIje3JwciBuYW1lfSBleHBlY3RlZCBiZXR3ZWVuICN7bWlufSBhbmQgI3ttYXh9IGFyZ3VtZW50cywgZ290ICN7Zm91bmR9XCJcbiAgIyBjbGFzcyBFLkRicmljX2VtcHR5X2NzdiAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHBhdGggKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIm5vIENTViByZWNvcmRzIGZvdW5kIGluIGZpbGUgI3twYXRofVwiXG4gICMgY2xhc3MgRS5EYnJpY19pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIGludGVycG9sYXRpb24gZm9ybWF0ICN7cnByIGZvcm1hdH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfbm9fbmVzdGVkX3RyYW5zYWN0aW9ucyAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiApICAgICAgICAgICAgICAtPiBzdXBlciByZWYsIFwiY2Fubm90IHN0YXJ0IGEgdHJhbnNhY3Rpb24gd2l0aGluIGEgdHJhbnNhY3Rpb25cIlxuICAjIGNsYXNzIEUuRGJyaWNfbm9fZGVmZXJyZWRfZmtzX2luX3R4ICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiApICAgICAgICAgICAgICAtPiBzdXBlciByZWYsIFwiY2Fubm90IGRlZmVyIGZvcmVpZ24ga2V5cyBpbnNpZGUgYSB0cmFuc2FjdGlvblwiXG4gICMgY2xhc3MgRS5EYnJpY19pbnZhbGlkX3RpbWVzdGFtcCAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB4ICkgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJub3QgYSB2YWxpZCBEYnJpYyB0aW1lc3RhbXA6ICN7cnByIHh9XCJcblxuICAjICMjIyBUQUlOVCByZXBsYWNlIHdpdGggbW9yZSBzcGVjaWZpYyBlcnJvciwgbGlrZSBiZWxvdyAjIyNcbiAgIyBjbGFzcyBFLkRicmljX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuICAjICAgICBzdXBlciByZWYsIFwidW5rbm93biBEQiBmb3JtYXQgI3tyZWYgZm9ybWF0fVwiXG5cbiAgIyBjbGFzcyBFLkRicmljX2ltcG9ydF9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiAgIyAgICAgZm9ybWF0cyA9IFsgKCByZXF1aXJlICcuL3R5cGVzJyApLl9pbXBvcnRfZm9ybWF0cy4uLiwgXS5qb2luICcsICdcbiAgIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gaW1wb3J0IGZvcm1hdCAje3JwciBmb3JtYXR9IChrbm93biBmb3JtYXRzIGFyZSAje2Zvcm1hdHN9KVwiXG5cbiAgcmV0dXJuIGV4cG9ydHMgPSBFXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xucmVxdWlyZV9kYnJpYyA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbmFtZWl0KClcbiAgIyB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgbGV0cyxcbiAgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICBTUUxJVEUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgeyBnZXRfcHJvdG90eXBlX2NoYWluLFxuICAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG4gIHsgVW5kdW1wZXIsICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuICBFICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZV9kYnJpY19lcnJvcnMoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICAgIHdoaWxlIHg/XG4gICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYnVpbGRfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgXiBcXHMqXG4gICAgaW5zZXJ0IHwgKFxuICAgICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgICApXG4gICAgLy8vaXNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlbXBsYXRlcyA9XG4gICAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBgYGBcbiAgY29uc3QgVHJ1ZSAgPSAxO1xuICBjb25zdCBGYWxzZSA9IDA7XG4gIGBgYFxuXG4gIGZyb21fYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgd2hlbiB0cnVlICB0aGVuIFRydWVcbiAgICB3aGVuIGZhbHNlIHRoZW4gRmFsc2VcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panpyc2RiX19fMSBleHBlY3RlZCB0cnVlIG9yIGZhbHNlLCBnb3QgI3tycHIgeH1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYXNfYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgd2hlbiBUcnVlICAgdGhlbiB0cnVlXG4gICAgd2hlbiBGYWxzZSAgdGhlbiBmYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18yIGV4cGVjdGVkIDAgb3IgMSwgZ290ICN7cnByIHh9XCJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRXNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB1bnF1b3RlX25hbWU6ICggbmFtZSApIC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgIHdoZW4gL15cIiguKylcIiQvLnRlc3QgICAgICAgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVsgMSAuLi4gbmFtZS5sZW5ndGggLSAxIF0ucmVwbGFjZSAvXCJcIi9nLCAnXCInXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNCBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3JwciBuYW1lfVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIElETjogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgTElUOiAoIHggKSA9PlxuICAgICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB4XG4gICAgICAgIHdoZW4gJ3RleHQnICAgICAgIHRoZW4gcmV0dXJuICBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiJydcIiApICsgXCInXCJcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICAgd2hlbiAnZmxvYXQnICAgICAgdGhlbiByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAgIHdoZW4gJ2Jvb2xlYW4nICAgIHRoZW4gcmV0dXJuICggaWYgeCB0aGVuICcxJyBlbHNlICcwJyApXG4gICAgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBWRUM6ICggeCApID0+XG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAnXmRiYXkvc3FsQDJeJywgdHlwZSwgeCB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiB4ICkgaXMgJ2xpc3QnXG4gICAgICByZXR1cm4gJyggJyArICggKCBATElUIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4gICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAjICAgaWR4ID0gLTFcbiAgICAjICAgcmV0dXJuIHNxbC5yZXBsYWNlIEBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuLCAoICQwLCBvcGVuZXIsIGZvcm1hdCwgbmFtZSApID0+XG4gICAgIyAgICAgaWR4KytcbiAgICAjICAgICBzd2l0Y2ggb3BlbmVyXG4gICAgIyAgICAgICB3aGVuICckJ1xuICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAjICAgICAgICAga2V5ID0gbmFtZVxuICAgICMgICAgICAgd2hlbiAnPydcbiAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4gICAgIyAgICAgc3dpdGNoIGZvcm1hdFxuICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuICAgICMgICAgICAgd2hlbiAnVicgICAgICB0aGVuIHJldHVybiBAViB2YWx1ZVxuICAgICMgICAgIHRocm93IG5ldyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gJ15kYmF5L3NxbEAzXicsIGZvcm1hdFxuICAgICMgX2ludGVycG9sYXRpb25fcGF0dGVybjogLyg/PG9wZW5lcj5bJD9dKSg/PGZvcm1hdD4uPyk6KD88bmFtZT5cXHcqKS9nXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFNRTCA9ICggcGFydHMsIGV4cHJlc3Npb25zLi4uICkgLT5cbiAgICBSID0gcGFydHNbIDAgXVxuICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgIFIgKz0gZXhwcmVzc2lvbi50b1N0cmluZygpICsgcGFydHNbIGlkeCArIDEgXVxuICAgIHJldHVybiBSXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIERicmljXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBjZmc6IGZyZWV6ZVxuICAgICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgICBAZnVuY3Rpb25zOiAgIHt9XG4gICAgQHN0YXRlbWVudHM6ICB7fVxuICAgIEBidWlsZDogICAgICAgbnVsbFxuICAgIEBkYl9jbGFzczogICAgU1FMSVRFLkRhdGFiYXNlU3luY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBkYl9jbGFzcyAgICAgICAgICAgICAgICAgID0gKCBjZmc/LmRiX2NsYXNzICkgPyBjbGFzei5kYl9jbGFzc1xuICAgICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBkYl9jbGFzcyBkYl9wYXRoXG4gICAgICAjIEBkYiAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gZnJlZXplIHsgY2xhc3ouY2ZnLi4uLCBkYl9wYXRoLCBjZmcuLi4sIH1cbiAgICAgIGhpZGUgQCwgJ3N0YXRlbWVudHMnLCAgICAgICB7fVxuICAgICAgaGlkZSBALCAnX3cnLCAgICAgICAgICAgICAgIG51bGxcbiAgICAgIGhpZGUgQCwgJ19zdGF0ZW1lbnRfY2xhc3MnLCAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IDE7XCIgKS5jb25zdHJ1Y3RvclxuICAgICAgaGlkZSBALCAnc3RhdGUnLCAgICAgICAgICAgICggY2ZnPy5zdGF0ZSApID8geyBjb2x1bW5zOiBudWxsLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgICBAaW5pdGlhbGl6ZSgpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICB0aGUgaW5zdGFuY2UuICMjI1xuICAgICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgICAgQGJ1aWxkKClcbiAgICAgIEBfcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRpYWxpemU6IC0+XG4gICAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgICBSID0ge31cbiAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiB0cnVlXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHRlc3QgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICB3aGVuIG5vdCB0ZXN0P1xuICAgICAgICAgIHByZWZpeF9yZSA9IEBwcmVmaXhfcmVcbiAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdHlwZSA9IHR5cGVfb2YgdGVzdFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX182IGV4cGVjdGVkIGAnKidgLCBhIFJlZ0V4cCwgYSBmdW5jdGlvbiwgbnVsbCBvciB1bmRlZmluZWQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBjb250aW51ZSB1bmxlc3MgdGVzdCBuYW1lXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgdHJ5XG4gICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlYnVpbGQ6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKCkgdW5sZXNzIGhhc190b3JuX2Rvd25cbiAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgeyBlcnJvcl9jb3VudCxcbiAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfdzogLT5cbiAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgZGJfY2xhc3M6IEBkYi5jb25zdHJ1Y3Rvciwgc3RhdGU6IEBzdGF0ZSwgfVxuICAgICAgcmV0dXJuIEBfd1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgZGJfb2JqZWN0cyAgICAgID0ge31cbiAgICAgIHN0YXRlbWVudF9jb3VudCA9IDBcbiAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgIGZvciBzdGF0ZW1lbnQgaW4gY2xhc3ouYnVpbGQgPyBbXVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHIgc3RhdGVtZW50fVwiXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIGZvciBuYW1lLCBzcWwgb2YgY2xhc3ouc3RhdGVtZW50c1xuICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnY3JlYXRlX3RhYmxlXydcbiAgICAgICMgICAgICAgbnVsbFxuICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAjICAgICAgIG51bGxcbiAgICAgICMgICAgIGVsc2VcbiAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfXzEwIHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3JwciBuYW1lfVwiXG4gICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMSBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgICMgaWYgKCB0eXBlX29mIHN0YXRlbWVudCApIGlzICdsaXN0J1xuICAgICAgICAgICMgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gICAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMiBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdHJ5XG4gICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEzIHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyBGVU5DVElPTlNcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTYgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTcgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTggREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIGludmVyc2UsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIHJvd3MsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIzIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkX2Jhc2UgZXh0ZW5kcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBmcmVlemVcbiAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICByZWdleHA6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfaXNfdWNfbm9ybWFsOlxuICAgICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX25vcm1hbGl6ZV90ZXh0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX3RleHQgdGV4dCwgZm9ybVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBidWlsZDogW1xuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfcmVsYXRpb25zIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgc3RkX3ZhcmlhYmxlcyAoXG4gICAgICAgICAgbmFtZSAgICAgIHRleHQgICAgICB1bmlxdWUgIG5vdCBudWxsLFxuICAgICAgICAgIHZhbHVlICAgICBqc29uICAgICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICdudWxsJyxcbiAgICAgICAgICBkZWx0YSAgICAgaW50ZWdlciAgICAgICAgICAgICAgIG51bGwgZGVmYXVsdCBudWxsLFxuICAgICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKVxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50X18yNFwiIGNoZWNrICggKCBkZWx0YSBpcyBudWxsICkgb3IgKCBkZWx0YSAhPSAwICkgKVxuICAgICAgICApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICdzZXE6Z2xvYmFsOnJvd2lkJywgMCwgKzEgKTtcIlwiXCJcbiAgICAgIF1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyMjIFVERiBpbXBsZW1lbnRhdGlvbnMgIyMjXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX3RleHQ6ICggdGV4dCwgZm9ybSA9ICdORkMnICkgLT4gdGV4dC5ub3JtYWxpemUgZm9ybVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+XG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBkYXRhICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyAnzqlkYnJpY19fMjUnLCB0eXBlLCBkYXRhXG4gICAgICByZXR1cm4gZGF0YSBpZiBkYXRhIGlzICdudWxsJ1xuICAgICAgdW5sZXNzICggZGF0YS5zdGFydHNXaXRoICd7JyApIGFuZCAoIGRhdGEuZW5kc1dpdGggJ30nIClcbiAgICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICfOqWRicmljX18yNicsIGRhdGFcbiAgICAgIGRhdGEgID0gSlNPTi5wYXJzZSBkYXRhXG4gICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgUiAgICAgPSBKU09OLnN0cmluZ2lmeSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGssIGRhdGFbIGsgXSwgXSBmb3IgayBpbiBrZXlzIClcbiAgICAgIHJldHVybiBAc3RkX25vcm1hbGl6ZV90ZXh0IFIsIGZvcm1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkX3ZhcmlhYmxlcyBleHRlbmRzIERicmljX3N0ZF9iYXNlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIFAuLi4gKSAtPlxuICAgICAgc3VwZXIgUC4uLlxuICAgICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzICAgICAgICAgICAgICAgID89IGZyZWV6ZSB7fVxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgID89IGZhbHNlXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X25leHRfaW5fc2VxdWVuY2UgbmFtZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZXRfdmFyaWFibGU6XG4gICAgICAgIGRldGVybWluaXN0aWM6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAgKCBuYW1lICkgLT4gQHN0ZF9nZXRfdmFyaWFibGUgbmFtZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAc3RhdGVtZW50czpcbiAgICAgIHNldF92YXJpYWJsZTogICAgIFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJG5hbWUsICR2YWx1ZSwgJGRlbHRhIClcbiAgICAgICAgICBvbiBjb25mbGljdCAoIG5hbWUgKSBkbyB1cGRhdGVcbiAgICAgICAgICAgIHNldCB2YWx1ZSA9ICR2YWx1ZSwgZGVsdGEgPSAkZGVsdGE7XCJcIlwiXG4gICAgICBnZXRfdmFyaWFibGVzOiAgICBTUUxcInNlbGVjdCBuYW1lLCB2YWx1ZSwgZGVsdGEgZnJvbSBzdGRfdmFyaWFibGVzIG9yZGVyIGJ5IG5hbWU7XCJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3N0ZF9hY3F1aXJlX3N0YXRlOiAoIHRyYW5zaWVudHMgPSB7fSApIC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgKCB2ICkgPT5cbiAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gQHN0YXRlbWVudHMuZ2V0X3ZhcmlhYmxlcy5pdGVyYXRlKClcbiAgICAgICAgICB2YWx1ZSAgICAgPSBKU09OLnBhcnNlIHZhbHVlXG4gICAgICAgICAgdlsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICAgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiB0cmFuc2llbnRzXG4gICAgICAgICAgdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgICA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfc3RkX3BlcnNpc3Rfc3RhdGU6IC0+XG4gICAgICAjIHdoaXNwZXIgJ86pYmJkYnJfMjM0JywgXCJfc3RkX3BlcnNpc3Rfc3RhdGVcIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgXywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gb2YgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICAgICAgIyMjIFRBSU5UIGNsZWFyIGNhY2hlIGluIEBzdGF0ZS5zdGRfdmFyaWFibGVzID8gIyMjXG4gICAgICAgICMgd2hpc3BlciAnzqliYmRicl8yMzUnLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgICBkZWx0YSAgPz0gbnVsbFxuICAgICAgICB2YWx1ZSAgID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgICAgQHN0YXRlbWVudHMuc2V0X3ZhcmlhYmxlLnJ1biB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgLT5cbiAgICAgICAgZGVsZXRlIHRbIG5hbWUgXSBmb3IgbmFtZSBvZiB0XG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF93aXRoX3ZhcmlhYmxlczogKCB0cmFuc2llbnRzLCBmbiApIC0+XG4gICAgICBzd2l0Y2ggYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgICAgIHdoZW4gMSB0aGVuIFsgdHJhbnNpZW50cywgZm4sIF0gPSBbIHt9LCB0cmFuc2llbnRzLCBdXG4gICAgICAgIHdoZW4gMiB0aGVuIG51bGxcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzIzOCBleHBlY3RlZCAxIG9yIDIgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzIzOSBpbGxlZ2FsIHRvIG5lc3QgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCA9IHRydWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQF9zdGRfYWNxdWlyZV9zdGF0ZSB0cmFuc2llbnRzXG4gICAgICB0cnlcbiAgICAgICAgUiA9IGZuKClcbiAgICAgIGZpbmFsbHlcbiAgICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSBmYWxzZVxuICAgICAgICBAX3N0ZF9wZXJzaXN0X3N0YXRlKClcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9zZXRfdmFyaWFibGU6ICggbmFtZSwgdmFsdWUsIGRlbHRhICkgLT5cbiAgICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzI0MCBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSA9PiB0WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCB9XG4gICAgICBlbHNlXG4gICAgICAgIGRlbHRhID89IG51bGxcbiAgICAgICAgQHN0YXRlLnN0ZF92YXJpYWJsZXMgPSBsZXRzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCAgICggdiApID0+IHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfZ2V0X3ZhcmlhYmxlOiAoIG5hbWUgKSAtPlxuICAgICAgIyB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICMgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJiZGJyXzI0MSBpbGxlZ2FsIHRvIGdldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCBuYW1lXG4gICAgICAgIHJldHVybiBAc3RhdGUuc3RkX3RyYW5zaWVudHNbIG5hbWUgXS52YWx1ZVxuICAgICAgaWYgUmVmbGVjdC5oYXMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsIG5hbWVcbiAgICAgICAgcmV0dXJuIEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0udmFsdWVcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQyIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOiAoIG5hbWUgKSAtPlxuICAgICAgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQzIGlsbGVnYWwgdG8gc2V0IHZhcmlhYmxlIG91dHNpZGUgb2YgYHN0ZF93aXRoX3ZhcmlhYmxlcygpYCBjb250ZXh0c1wiXG4gICAgICB1bmxlc3MgKCBlbnRyeSA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyBuYW1lIF0gKT9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqliYmRicl8yNDQgdW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICAgICB1bmxlc3MgKCBkZWx0YSA9IGVudHJ5LmRlbHRhICk/XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pYmJkYnJfMjQ1IG5vdCBhIHNlcXVlbmNlIG5hbWU6ICN7cnByIG5hbWV9XCJcbiAgICAgIGVudHJ5LnZhbHVlICs9IGRlbHRhXG4gICAgICByZXR1cm4gZW50cnkudmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3Nob3dfdmFyaWFibGVzOiAtPlxuICAgICAgc3RvcmUgICAgICAgPSBPYmplY3QuZnJvbUVudHJpZXMgKCBcXFxuICAgICAgICBbIG5hbWUsIHsgdmFsdWUsIGRlbHRhLCB9LCBdIFxcXG4gICAgICAgICAgZm9yIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IGZyb20gXFxcbiAgICAgICAgICAgIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpIClcbiAgICAgIGNhY2hlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBAc3RhdGUuc3RkX3ZhcmlhYmxlc1xuICAgICAgdHJhbnNfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIEBzdGF0ZS5zdGRfdHJhbnNpZW50c1xuICAgICAgc3RvcmVfbmFtZXMgPSBuZXcgU2V0IE9iamVjdC5rZXlzIHN0b3JlXG4gICAgICBhbGxfbmFtZXMgICA9IFsgKCAoIGNhY2hlX25hbWVzLnVuaW9uIHN0b3JlX25hbWVzICkudW5pb24gdHJhbnNfbmFtZXMgKS4uLiwgXS5zb3J0KClcbiAgICAgIFIgPSB7fVxuICAgICAgZm9yIG5hbWUgaW4gYWxsX25hbWVzXG4gICAgICAgIHMgICAgICAgICA9IHN0b3JlWyAgICAgICAgICAgICAgICAgIG5hbWUgXSA/IHt9XG4gICAgICAgIGMgICAgICAgICA9IEBzdGF0ZS5zdGRfdmFyaWFibGVzWyAgIG5hbWUgXSA/IHt9XG4gICAgICAgIHQgICAgICAgICA9IEBzdGF0ZS5zdGRfdHJhbnNpZW50c1sgIG5hbWUgXSA/IHt9XG4gICAgICAgIGd2ICAgICAgICA9IEBzdGRfZ2V0X3ZhcmlhYmxlIG5hbWVcbiAgICAgICAgUlsgbmFtZSBdID0geyBzdjogcy52YWx1ZSwgc2Q6IHMuZGVsdGEsIGN2OiBjLnZhbHVlLCBjZDogYy5kZWx0YSwgdHY6IHQudmFsdWUsIGd2LCB9XG4gICAgICBjb25zb2xlLnRhYmxlIFJcbiAgICAgIHJldHVybiBSXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIERicmljX3N0ZCBleHRlbmRzIERicmljX3N0ZF92YXJpYWJsZXNcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgRGJyaWMsXG4gICAgRGJyaWNfc3RkLFxuICAgIGVzcWwsXG4gICAgU1FMLFxuICAgIFRydWUsXG4gICAgRmFsc2UsXG4gICAgZnJvbV9ib29sLFxuICAgIGFzX2Jvb2wsXG4gICAgaW50ZXJuYWxzOiBmcmVlemUge1xuICAgICAgdHlwZV9vZixcbiAgICAgIGJ1aWxkX3N0YXRlbWVudF9yZSxcbiAgICAgIHRlbXBsYXRlcyxcbiAgICAgIERicmljX3N0ZF9iYXNlLFxuICAgICAgRGJyaWNfc3RkX3ZhcmlhYmxlcywgfVxuICAgIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9kYnJpYywgcmVxdWlyZV9kYnJpY19lcnJvcnMsIH1cblxuIl19
