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
    E.Dbric_expected_string_or_string_val_fn = class Dbric_expected_string_or_string_val_fn extends E.Dbric_error {
      constructor(ref, type) {
        super(ref, `expected a string or a function that returns a string, got a ${type}`);
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
        throw new E.Dbric_sql_value_error('Ωdbric___5^', type, x);
      }

      VEC(x) {
        var e, type;
        if ((type = type_of(x)) !== 'list') {
          throw new E.Dbric_sql_not_a_list_error('Ωdbric___6^', type, x);
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
    //     throw new E.Dbric_interpolation_format_unknown 'Ωdbric___7^', format
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
          throw new Error(`Ωdbric___8 not allowed to override property ${rpr(name)}; use '_get_${name} instead`);
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
              throw new Error(`Ωdbric___9 expected \`'*'\`, a RegExp, a function, null or undefined, got a ${type}`);
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
                warn(`Ωdbric__10 ignored error: ${error.message}`);
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
        static _get_build_statements_in_prototype_chain() {
          return (get_all_in_prototype_chain(this, 'build')).reverse();
        }

        //-------------------------------------------------------------------------------------------------------
        rebuild() {
          /* TAINT use proper validation */
          var build_statement, build_statements, build_statements_list, clasz, count, has_torn_down, i, j, len, len1, ref1, type;
          clasz = this.constructor;
          count = 0;
          build_statements_list = clasz._get_build_statements_in_prototype_chain();
          has_torn_down = false;
//.....................................................................................................
          for (i = 0, len = build_statements_list.length; i < len; i++) {
            build_statements = build_statements_list[i];
            if ((ref1 = (type = type_of(build_statements))) !== 'undefined' && ref1 !== 'null' && ref1 !== 'list') {
              throw new Error(`Ωdbric__11 expected an optional list for ${clasz.name}.build, got a ${type}`);
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
            throw new Error(`Ωdbric__12 ${error_count} out of ${statement_count} build statement(s) could not be parsed: ${rpr(messages)}`);
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
          var build_statements, build_statements_list, clasz, db_objects, error_count, i, j, len, len1, match, message, name/* NOTE ignore statements like `insert` */, statement, statement_count, type;
          clasz = this.constructor;
          db_objects = {};
          statement_count = 0;
          error_count = 0;
          build_statements_list = clasz._get_build_statements_in_prototype_chain();
          for (i = 0, len = build_statements_list.length; i < len; i++) {
            build_statements = build_statements_list[i];
            if (build_statements == null) {
              continue;
            }
            for (j = 0, len1 = build_statements.length; j < len1; j++) {
              statement = build_statements[j];
              switch (type = type_of(statement)) {
                case 'function':
                  statement = statement.call(this);
                  if ((type = type_of(statement)) !== 'text') {
                    throw new E.Dbric_expected_string_or_string_val_fn('Ωdbric__13', type);
                  }
                  break;
                case 'text':
                  null;
                  break;
                default:
                  throw new E.Dbric_expected_string_or_string_val_fn('Ωdbric__14', type);
              }
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
          }
          return {error_count, statement_count, db_objects};
        }

        //-------------------------------------------------------------------------------------------------------
        _prepare_statements() {
          var clasz, i, len, statement, statement_name, statements, statements_list;
          clasz = this.constructor;
          statements_list = (get_all_in_prototype_chain(clasz, 'statements')).reverse();
          for (i = 0, len = statements_list.length; i < len; i++) {
            statements = statements_list[i];
            for (statement_name in statements) {
              statement = statements[statement_name];
              if (this.statements[statement_name] != null) {
                throw new Error(`Ωdbric__16 statement ${rpr(statement_name)} is already declared`);
              }
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
            throw new Error(`Ωdbric__17 expected a statement or a text, got a ${type}`);
          }
          try {
            R = this.db.prepare(sql);
          } catch (error1) {
            cause = error1;
            throw new Error(`Ωdbric__18 when trying to prepare the following statement, an error with message: ${rpr(cause.message)} was thrown: ${rpr(sql)}`, {cause});
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
            throw new Error(`Ωdbric__19 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined functions`);
          }
          ({name, overwrite, value, directOnly, deterministic, varargs} = {...templates.create_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__20 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.function(name, {deterministic, varargs, directOnly}, value);
        }

        //-------------------------------------------------------------------------------------------------------
        create_aggregate_function(cfg) {
          var deterministic, directOnly, name, overwrite, result, start, step, varargs;
          if ((type_of(this.db.aggregate)) !== 'function') {
            throw new Error(`Ωdbric__21 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined aggregate functions`);
          }
          ({name, overwrite, start, step, result, directOnly, deterministic, varargs} = {...templates.create_aggregate_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__22 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.aggregate(name, {start, step, result, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_window_function(cfg) {
          var deterministic, directOnly, inverse, name, overwrite, result, start, step, varargs;
          if ((type_of(this.db.aggregate)) !== 'function') {
            throw new Error(`Ωdbric__23 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined window functions`);
          }
          ({name, overwrite, start, step, inverse, result, directOnly, deterministic, varargs} = {...templates.create_window_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__24 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.aggregate(name, {start, step, inverse, result, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_table_function(cfg) {
          var columns, deterministic, directOnly, name, overwrite, parameters, rows, varargs;
          if ((type_of(this.db.table)) !== 'function') {
            throw new Error(`Ωdbric__25 DB adapter class ${rpr(this.db.constructor.name)} does not provide table-valued user-defined functions`);
          }
          ({name, overwrite, parameters, columns, rows, directOnly, deterministic, varargs} = {...templates.create_table_function_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__26 a UDF or built-in function named ${rpr(name)} has already been declared`);
          }
          return this.db.table(name, {parameters, columns, rows, deterministic, varargs, directOnly});
        }

        //-------------------------------------------------------------------------------------------------------
        create_virtual_table(cfg) {
          var create, name, overwrite;
          if ((type_of(this.db.table)) !== 'function') {
            throw new Error(`Ωdbric__27 DB adapter class ${rpr(this.db.constructor.name)} does not provide user-defined virtual tables`);
          }
          ({name, overwrite, create} = {...templates.create_virtual_table_cfg, ...cfg});
          if ((!overwrite) && (this._function_names.has(name))) {
            throw new Error(`Ωdbric__28 a UDF or built-in function named ${rpr(name)} has already been declared`);
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
            throw new E.Dbric_expected_string('Ωdbric__29', type, data);
          }
          if (data === 'null') {
            return data;
          }
          if (!((data.startsWith('{')) && (data.endsWith('}')))) {
            throw new E.Dbric_expected_json_object_string('Ωdbric__30', data);
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
      // #---------------------------------------------------------------------------------------------------
      // ["#{prefix}_get_sha1sum7d"]:
      //   ### NOTE assumes that `data` is in its normalized string form ###
      //   name: "#{prefix}_get_sha1sum7d"
      //   value: ( is_hit, data ) -> get_sha1sum7d "#{if is_hit then 'H' else 'G'}#{data}"

        // #---------------------------------------------------------------------------------------------------
      // ["#{prefix}_normalize_data"]:
      //   name: "#{prefix}_normalize_data"
      //   value: ( data ) ->
      //     return data if data is 'null'
      //     # debug 'Ωim__31', rpr data
      //     data  = JSON.parse data
      //     keys  = ( Object.keys data ).sort()
      //     return JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )

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
          // whisper 'Ωdbric__33', "_std_persist_state"
          //.....................................................................................................
          for (_ in ref1) {
            ({name, value, delta} = ref1[_]);
            /* TAINT clear cache in @state.std_variables ? */
            // whisper 'Ωdbric__34', { name, value, delta, }
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
              throw new Error(`Ωdbric__35 expected 1 or 2 arguments, got ${arity}`);
          }
          //.....................................................................................................
          if (this.state.std_within_variables_context) {
            throw new Error("Ωdbric__36 illegal to nest `std_with_variables()` contexts");
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
            throw new Error("Ωdbric__37 illegal to set variable outside of `std_with_variables()` contexts");
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
          //   throw new Error "Ωdbric__38 illegal to get variable outside of `std_with_variables()` contexts"
          if (Reflect.has(this.state.std_transients, name)) {
            return this.state.std_transients[name].value;
          }
          if (Reflect.has(this.state.std_variables, name)) {
            return this.state.std_variables[name].value;
          }
          throw new Error(`Ωdbric__39 unknown variable ${rpr(name)}`);
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        std_get_next_in_sequence(name) {
          var delta, entry;
          if (!this.state.std_within_variables_context) {
            throw new Error("Ωdbric__40 illegal to set variable outside of `std_with_variables()` contexts");
          }
          if ((entry = this.state.std_variables[name]) == null) {
            throw new Error(`Ωdbric__41 unknown variable ${rpr(name)}`);
          }
          if ((delta = entry.delta) == null) {
            throw new Error(`Ωdbric__42 not a sequence name: ${rpr(name)}`);
          }
          entry.value += delta;
          return entry.value;
        }

        //-------------------------------------------------------------------------------------------------------
        _show_variables(print_table = false) {
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
          if (print_table) {
            console.table(R);
          }
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
constraint "Ωconstraint__32" check ( ( delta is null ) or ( delta != 0 ) )
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7SUFZUSxDQUFDLENBQUMsd0JBQVIsTUFBQSxzQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFiLENBQUE7YUFBd0IsQ0FBTSxHQUFOLEVBQVcsQ0FBQSxvQkFBQSxDQUFBLENBQXVCLElBQXZCLENBQUEscUJBQUEsQ0FBQSxDQUFtRCxHQUFBLENBQUksS0FBSixDQUFuRCxDQUFBLENBQVg7TUFBeEI7O0lBRGY7SUFFTSxDQUFDLENBQUMsNkJBQVIsTUFBQSwyQkFBQSxRQUFnRCxDQUFDLENBQUMsWUFBbEQ7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsRUFBYSxLQUFi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QUdoQixTQUhnQixFQUloQixjQUpnQixFQUtoQixtQkFMZ0IsQ0FBUDtJQVRJO0VBbndCSCxFQTFHaEI7OztFQWc0QkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsQ0FBRSxhQUFGLEVBQWlCLG9CQUFqQixDQUE5QjtBQWg0QkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2RicmljX2Vycm9ycyA9IC0+XG5cbiAgeyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgRSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAtPlxuICAgICAgc3VwZXIoKVxuICAgICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICAgIEByZWYgICAgICA9IHJlZlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZCAjIyMgYWx3YXlzIHJldHVybiBgdW5kZWZpbmVkYCBmcm9tIGNvbnN0cnVjdG9yICMjI1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2xhc3MgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGV4cHJlc3MgYSAje3R5cGV9IGFzIFNRTCBsaXRlcmFsLCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgY2xhc3MgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgYSBsaXN0LCBnb3QgYSAje3R5cGV9XCJcbiAgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zdHJpbmcgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgc3RyaW5nLCBnb3QgYSAje3R5cGV9XCJcbiAgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zdHJpbmdfb3Jfc3RyaW5nX3ZhbF9mbiBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgYSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBzdHJpbmcsIGdvdCBhICN7dHlwZX1cIlxuICBjbGFzcyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHNlcmlhbGl6ZWQgSlNPTiBvYmplY3QsIGdvdCAje3JwciB2YWx1ZX1cIlxuICBjbGFzcyBFLkRicmljX3Vua25vd25fc2VxdWVuY2UgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHNlcXVlbmNlICN7cnByIG5hbWV9XCJcbiAgIyBjbGFzcyBFLkRicmljX3Vua25vd25fdmFyaWFibGUgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBjbGFzcyBFLkRicmljX2NmZ19lcnJvciAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX2V4aXN0cyAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gYWxyZWFkeSBleGlzdHNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfb2JqZWN0X3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hLCBuYW1lICktPiBzdXBlciByZWYsIFwib2JqZWN0ICN7cnByIHNjaGVtYSArICcuJyArIG5hbWV9IGRvZXMgbm90IGV4aXN0XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub25lbXB0eSAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGlzbid0IGVtcHR5XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub3RfYWxsb3dlZCAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IG5vdCBhbGxvd2VkIGhlcmVcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3JlcGVhdGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGNvcHkgc2NoZW1hIHRvIGl0c2VsZiwgZ290ICN7cnByIHNjaGVtYX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3JvdyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcm93X2NvdW50ICkgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgMSByb3csIGdvdCAje3Jvd19jb3VudH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3ZhbHVlICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBrZXlzICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCByb3cgd2l0aCBzaW5nbGUgZmllbGQsIGdvdCBmaWVsZHMgI3tycHIga2V5c31cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXh0ZW5zaW9uX3Vua25vd24gICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXh0ZW5zaW9uIG9mIHBhdGggI3twYXRofSBpcyBub3QgcmVnaXN0ZXJlZCBmb3IgYW55IGZvcm1hdFwiXG4gICMgY2xhc3MgRS5EYnJpY19ub3RfaW1wbGVtZW50ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGlzbid0IGltcGxlbWVudGVkICh5ZXQpXCJcbiAgIyBjbGFzcyBFLkRicmljX2RlcHJlY2F0ZWQgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaGFzIGJlZW4gZGVwcmVjYXRlZFwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX2RiX29iamVjdF90eXBlIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCLCtTc2OSB1bmtub3duIHR5cGUgI3tycHIgdHlwZX0gb2YgREIgb2JqZWN0ICN7ZH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9zcWwgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc3FsICkgICAgICAgICAtPiBzdXBlciByZWYsIFwidW5leHBlY3RlZCBTUUwgc3RyaW5nICN7cnByIHNxbH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX3Rvb19tYW55X2RicyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGF0dGFjaCBzY2hlbWEgI3tycHIgc2NoZW1hfTogdG9vIG1hbnkgYXR0YWNoZWQgZGF0YWJhc2VzXCJcbiAgIyBjbGFzcyBFLkRicmljX3NxbGl0ZV9lcnJvciAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGVycm9yICkgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7ZXJyb3IuY29kZSA/ICdTUUxpdGUgZXJyb3InfTogI3tlcnJvci5tZXNzYWdlfVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19hcmd1bWVudHNfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBhcml0eSApIC0+IHN1cGVyIHJlZiwgXCJtZXRob2QgI3tycHIgbmFtZX0gZG9lc24ndCB0YWtlIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X25vdF9hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImFyZ3VtZW50ICN7cnByIG5hbWV9IG5vdCBhbGxvd2VkLCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X21pc3NpbmcgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHZhbHVlIGZvciAje3JwciBuYW1lfSwgZ290IG5vdGhpbmdcIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfdHlwZSAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZXMsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgI3t0eXBlc30sIGdvdCBhICN7dHlwZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfYXJpdHkgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgbWluLCBtYXgsIGZvdW5kICkgLT4gc3VwZXIgcmVmLCBcIiN7cnByIG5hbWV9IGV4cGVjdGVkIGJldHdlZW4gI3ttaW59IGFuZCAje21heH0gYXJndW1lbnRzLCBnb3QgI3tmb3VuZH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZW1wdHlfY3N2ICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwibm8gQ1NWIHJlY29yZHMgZm91bmQgaW4gZmlsZSAje3BhdGh9XCJcbiAgIyBjbGFzcyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gaW50ZXJwb2xhdGlvbiBmb3JtYXQgI3tycHIgZm9ybWF0fVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19uZXN0ZWRfdHJhbnNhY3Rpb25zICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3Qgc3RhcnQgYSB0cmFuc2FjdGlvbiB3aXRoaW4gYSB0cmFuc2FjdGlvblwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19kZWZlcnJlZF9ma3NfaW5fdHggICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3QgZGVmZXIgZm9yZWlnbiBrZXlzIGluc2lkZSBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX2ludmFsaWRfdGltZXN0YW1wICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHggKSAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcIm5vdCBhIHZhbGlkIERicmljIHRpbWVzdGFtcDogI3tycHIgeH1cIlxuXG4gICMgIyMjIFRBSU5UIHJlcGxhY2Ugd2l0aCBtb3JlIHNwZWNpZmljIGVycm9yLCBsaWtlIGJlbG93ICMjI1xuICAjIGNsYXNzIEUuRGJyaWNfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4gICMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIERCIGZvcm1hdCAje3JlZiBmb3JtYXR9XCJcblxuICAjIGNsYXNzIEUuRGJyaWNfaW1wb3J0X2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuICAjICAgICBmb3JtYXRzID0gWyAoIHJlcXVpcmUgJy4vdHlwZXMnICkuX2ltcG9ydF9mb3JtYXRzLi4uLCBdLmpvaW4gJywgJ1xuICAjICAgICBzdXBlciByZWYsIFwidW5rbm93biBpbXBvcnQgZm9ybWF0ICN7cnByIGZvcm1hdH0gKGtub3duIGZvcm1hdHMgYXJlICN7Zm9ybWF0c30pXCJcblxuICByZXR1cm4gZXhwb3J0cyA9IEVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2RicmljID0gLT5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICB7IHR5cGVfb2YsICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG4gICMgeyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxuICAjIHsgbmFtZWl0LCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxuICAjIHsgcnByX3N0cmluZywgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgeyBsZXRzLFxuICAgIGZyZWV6ZSwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbGV0c2ZyZWV6ZXRoYXRfaW5mcmEoKS5zaW1wbGVcbiAgeyBuZmEsICAgICAgICAgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4gIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbiAgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4gIEUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlX2RicmljX2Vycm9ycygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgd2hpbGUgeD9cbiAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICBeIFxccypcbiAgICBpbnNlcnQgfCAoXG4gICAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuICAgICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIClcbiAgICAvLy9pc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVtcGxhdGVzID1cbiAgICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGBgYFxuICBjb25zdCBUcnVlICA9IDE7XG4gIGNvbnN0IEZhbHNlID0gMDtcbiAgYGBgXG5cbiAgZnJvbV9ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICAgIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18xIGV4cGVjdGVkIHRydWUgb3IgZmFsc2UsIGdvdCAje3JwciB4fVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgICB3aGVuIEZhbHNlICB0aGVuIGZhbHNlXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBFc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGEgbmFtZSwgZ290ICN7cnByIG5hbWV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgSUROOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBMSVQ6ICggeCApID0+XG4gICAgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHhcbiAgICAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgICB3aGVuICdmbG9hdCcgICAgICB0aGVuIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICfOqWRicmljX19fNV4nLCB0eXBlLCB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFZFQzogKCB4ICkgPT5cbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICfOqWRicmljX19fNl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHJldHVybiAnKCAnICsgKCAoIEBMSVQgZSBmb3IgZSBpbiB4ICkuam9pbiAnLCAnICkgKyAnICknXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICMgICBpZHggPSAtMVxuICAgICMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgPT5cbiAgICAjICAgICBpZHgrK1xuICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAjICAgICAgIHdoZW4gJyQnXG4gICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgIyAgICAgICB3aGVuICc/J1xuICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAjICAgICBzd2l0Y2ggZm9ybWF0XG4gICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4gICAgIyAgICAgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnzqlkYnJpY19fXzdeJywgZm9ybWF0XG4gICAgIyBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuOiAvKD88b3BlbmVyPlskP10pKD88Zm9ybWF0Pi4/KTooPzxuYW1lPlxcdyopL2dcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgIFIgPSBwYXJ0c1sgMCBdXG4gICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgcmV0dXJuIFJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogZnJlZXplXG4gICAgICBwcmVmaXg6ICcoTk9QUkVGSVgpJ1xuICAgIEBmdW5jdGlvbnM6ICAge31cbiAgICBAc3RhdGVtZW50czogIHt9XG4gICAgQGJ1aWxkOiAgICAgICBudWxsXG4gICAgQGRiX2NsYXNzOiAgICBTUUxJVEUuRGF0YWJhc2VTeW5jXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCB1c2Ugbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cyAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKCBkYl9wYXRoLCBjZmcgKSAtPlxuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAnaXNfcmVhZHknXG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXgnXG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdwcmVmaXhfcmUnXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGRiX3BhdGggICAgICAgICAgICAgICAgICA/PSAnOm1lbW9yeTonXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGRiX2NsYXNzICAgICAgICAgICAgICAgICAgPSAoIGNmZz8uZGJfY2xhc3MgKSA/IGNsYXN6LmRiX2NsYXNzXG4gICAgICBoaWRlIEAsICdkYicsICAgICAgICAgICAgICAgbmV3IGRiX2NsYXNzIGRiX3BhdGhcbiAgICAgICMgQGRiICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBTUUxJVEUuRGF0YWJhc2VTeW5jIGRiX3BhdGhcbiAgICAgIEBjZmcgICAgICAgICAgICAgICAgICAgICAgPSBmcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgKCBjZmc/LnN0YXRlICkgPyB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICBAYnVpbGQoKVxuICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKClcbiAgICAgICMgQGRiLnByYWdtYSBTUUxcImpvdXJuYWxfbW9kZSA9IHdhbFwiXG4gICAgICAjIEBkYi5wcmFnbWEgU1FMXCJmb3JlaWduX2tleXMgPSBvblwiXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbml0aWFsaXplOiAtPlxuICAgICAgIyMjIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkICpiZWZvcmUqIGFueSBidWlsZCBzdGF0ZW1lbnRzIGFyZSBleGVjdXRlZCBhbmQgYmVmb3JlIGFueSBzdGF0ZW1lbnRzXG4gICAgICBpbiBgQGNvbnN0cnVjdG9yLnN0YXRlbWVudHNgIGFyZSBwcmVwYXJlZCBhbmQgaXMgYSBnb29kIHBsYWNlIHRvIGNyZWF0ZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXG4gICAgICAoVURGcykuIFlvdSBwcm9iYWJseSB3YW50IHRvIG92ZXJyaWRlIGl0IHdpdGggYSBtZXRob2QgdGhhdCBzdGFydHMgd2l0aCBgc3VwZXIoKWAuICMjI1xuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3ZhbGlkYXRlX2lzX3Byb3BlcnR5OiAoIG5hbWUgKSAtPlxuICAgICAgZGVzY3JpcHRvciA9IGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yIEAsIG5hbWVcbiAgICAgIHJldHVybiBudWxsIGlmICggdHlwZV9vZiBkZXNjcmlwdG9yLmdldCApIGlzICdmdW5jdGlvbidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX184IG5vdCBhbGxvd2VkIHRvIG92ZXJyaWRlIHByb3BlcnR5ICN7cnByIG5hbWV9OyB1c2UgJ19nZXRfI3tuYW1lfSBpbnN0ZWFkXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9kYl9vYmplY3RzOiAtPlxuICAgICAgUiA9IHt9XG4gICAgICBmb3IgZGJvIGZyb20gKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCBuYW1lLCB0eXBlIGZyb20gc3FsaXRlX3NjaGVtYVwiICkuaXRlcmF0ZSgpXG4gICAgICAgIFJbIGRiby5uYW1lIF0gPSB7IG5hbWU6IGRiby5uYW1lLCB0eXBlOiBkYm8udHlwZSwgfVxuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVhcmRvd246ICh7IHRlc3QgPSBudWxsLCB9PXt9KSAtPlxuICAgICAgY291bnQgICAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gdGVzdCBpcyAnKidcbiAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gdHJ1ZVxuICAgICAgICB3aGVuICggdHlwZV9vZiB0ZXN0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG51bGxcbiAgICAgICAgd2hlbiBub3QgdGVzdD9cbiAgICAgICAgICBwcmVmaXhfcmUgPSBAcHJlZml4X3JlXG4gICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHByZWZpeF9yZS50ZXN0IG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHR5cGUgPSB0eXBlX29mIHRlc3RcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSBleHBlY3RlZCBgJyonYCwgYSBSZWdFeHAsIGEgZnVuY3Rpb24sIG51bGwgb3IgdW5kZWZpbmVkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvZmY7XCIgKS5ydW4oKVxuICAgICAgZm9yIF8sIHsgbmFtZSwgdHlwZSwgfSBvZiBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgICAgY29udGludWUgdW5sZXNzIHRlc3QgbmFtZVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIHRyeVxuICAgICAgICAgICggQHByZXBhcmUgU1FMXCJkcm9wICN7dHlwZX0gI3tlc3FsLklETiBuYW1lfTtcIiApLnJ1bigpXG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgd2FybiBcIs6pZGJyaWNfXzEwIGlnbm9yZWQgZXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cIiB1bmxlc3MgLy8vIG5vIFxccysgc3VjaCBcXHMrICN7dHlwZX06IC8vLy50ZXN0IGVycm9yLm1lc3NhZ2VcbiAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgKS5ydW4oKVxuICAgICAgcmV0dXJuIGNvdW50XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGJ1aWxkOiAtPiBpZiBAaXNfcmVhZHkgdGhlbiAwIGVsc2UgQHJlYnVpbGQoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAX2dldF9idWlsZF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbjogLT4gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBALCAnYnVpbGQnICkucmV2ZXJzZSgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlYnVpbGQ6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9IGNsYXN6Ll9nZXRfYnVpbGRfc3RhdGVtZW50c19pbl9wcm90b3R5cGVfY2hhaW4oKVxuICAgICAgaGFzX3Rvcm5fZG93biAgICAgICAgID0gZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGJ1aWxkX3N0YXRlbWVudHMgaW4gYnVpbGRfc3RhdGVtZW50c19saXN0XG4gICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGJ1aWxkX3N0YXRlbWVudHMgKSBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNvbnRpbnVlIGlmICggbm90IGJ1aWxkX3N0YXRlbWVudHM/ICkgb3IgKCBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aCBpcyAwIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBAdGVhcmRvd24oKSB1bmxlc3MgaGFzX3Rvcm5fZG93blxuICAgICAgICBoYXNfdG9ybl9kb3duID0gdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBjb3VudFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3N1cGVyJywgICAgICAgICAgICAtPiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgQGNvbnN0cnVjdG9yXG4gICAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgICAgIC0+IEBfZ2V0X3ByZWZpeCgpXG4gICAgc2V0X2dldHRlciBAOjosICdwcmVmaXhfcmUnLCAgICAgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gICAgc2V0X2dldHRlciBAOjosICd3JywgICAgICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICB7IGVycm9yX2NvdW50LFxuICAgICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgICAgcmV0dXJuIEBjZmcucHJlZml4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4X3JlOiAtPlxuICAgICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgICByZXR1cm4gLy8vIF4gXz8gI3tSZWdFeHAuZXNjYXBlIEBwcmVmaXh9IF8gLiogJCAvLy9cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF93OiAtPlxuICAgICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aCwgeyBkYl9jbGFzczogQGRiLmNvbnN0cnVjdG9yLCBzdGF0ZTogQHN0YXRlLCB9XG4gICAgICByZXR1cm4gQF93XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgICAgY2xhc3ogICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBkYl9vYmplY3RzICAgICAgICAgICAgPSB7fVxuICAgICAgc3RhdGVtZW50X2NvdW50ICAgICAgID0gMFxuICAgICAgZXJyb3JfY291bnQgICAgICAgICAgID0gMFxuICAgICAgYnVpbGRfc3RhdGVtZW50c19saXN0ID0gY2xhc3ouX2dldF9idWlsZF9zdGF0ZW1lbnRzX2luX3Byb3RvdHlwZV9jaGFpbigpXG4gICAgICBmb3IgYnVpbGRfc3RhdGVtZW50cyBpbiBidWlsZF9zdGF0ZW1lbnRzX2xpc3RcbiAgICAgICAgY29udGludWUgdW5sZXNzIGJ1aWxkX3N0YXRlbWVudHM/XG4gICAgICAgIGZvciBzdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiBzdGF0ZW1lbnRcbiAgICAgICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICBzdGF0ZW1lbnQgPSBzdGF0ZW1lbnQuY2FsbCBAXG4gICAgICAgICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHN0YXRlbWVudCApIGlzICd0ZXh0J1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX3N0cmluZ19vcl9zdHJpbmdfdmFsX2ZuICfOqWRicmljX18xMycsIHR5cGVcbiAgICAgICAgICAgIHdoZW4gJ3RleHQnIHRoZW4gbnVsbFxuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9zdHJpbmdfb3Jfc3RyaW5nX3ZhbF9mbiAnzqlkYnJpY19fMTQnLCB0eXBlXG4gICAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgICAgeyBuYW1lLFxuICAgICAgICAgICAgICB0eXBlLCB9ICAgICAgICAgICA9IG1hdGNoLmdyb3Vwc1xuICAgICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gZXNxbC51bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgICAgIG5hbWUgICAgICAgICAgICAgICAgPSBcImVycm9yXyN7c3RhdGVtZW50X2NvdW50fVwiXG4gICAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIG1lc3NhZ2UsIH1cbiAgICAgIHJldHVybiB7IGVycm9yX2NvdW50LCBzdGF0ZW1lbnRfY291bnQsIGRiX29iamVjdHMsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3ByZXBhcmVfc3RhdGVtZW50czogLT5cbiAgICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNiBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gICAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNyBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdHJ5XG4gICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE4IHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyBGVU5DVElPTlNcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE5IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjAgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjEgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjIgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjMgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIGludmVyc2UsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjQgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzI1IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIHJvd3MsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjYgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yNyBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzI4IGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkX2Jhc2UgZXh0ZW5kcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBmcmVlemVcbiAgICAgIHByZWZpeDogJ3N0ZCdcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQGZ1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICByZWdleHA6XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWVcbiAgICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfaXNfdWNfbm9ybWFsOlxuICAgICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX25vcm1hbGl6ZV90ZXh0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX3RleHQgdGV4dCwgZm9ybVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0OlxuICAgICAgICBkZXRlcm1pbmlzdGljOiB0cnVlXG4gICAgICAgIHZhbHVlOiAoIGRhdGEsIGZvcm0gPSAnTkZDJyApIC0+IEBzdGRfbm9ybWFsaXplX2pzb25fb2JqZWN0IGRhdGEsIGZvcm1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBidWlsZDogW1xuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzICAgICBhcyBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfcmVsYXRpb25zIGFzIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG4gICAgICBdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMjIyBVREYgaW1wbGVtZW50YXRpb25zICMjI1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV90ZXh0OiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IHRleHQubm9ybWFsaXplIGZvcm1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX25vcm1hbGl6ZV9qc29uX29iamVjdDogKCBkYXRhLCBmb3JtID0gJ05GQycgKSAtPlxuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgZGF0YSApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRS5EYnJpY19leHBlY3RlZF9zdHJpbmcgJ86pZGJyaWNfXzI5JywgdHlwZSwgZGF0YVxuICAgICAgcmV0dXJuIGRhdGEgaWYgZGF0YSBpcyAnbnVsbCdcbiAgICAgIHVubGVzcyAoIGRhdGEuc3RhcnRzV2l0aCAneycgKSBhbmQgKCBkYXRhLmVuZHNXaXRoICd9JyApXG4gICAgICAgIHRocm93IG5ldyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyAnzqlkYnJpY19fMzAnLCBkYXRhXG4gICAgICBkYXRhICA9IEpTT04ucGFyc2UgZGF0YVxuICAgICAga2V5cyAgPSAoIE9iamVjdC5rZXlzIGRhdGEgKS5zb3J0KClcbiAgICAgIFIgICAgID0gSlNPTi5zdHJpbmdpZnkgT2JqZWN0LmZyb21FbnRyaWVzICggWyBrLCBkYXRhWyBrIF0sIF0gZm9yIGsgaW4ga2V5cyApXG4gICAgICByZXR1cm4gQHN0ZF9ub3JtYWxpemVfdGV4dCBSLCBmb3JtXG5cbiAgICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICMgW1wiI3twcmVmaXh9X2dldF9zaGExc3VtN2RcIl06XG4gICAgICAgICMgICAjIyMgTk9URSBhc3N1bWVzIHRoYXQgYGRhdGFgIGlzIGluIGl0cyBub3JtYWxpemVkIHN0cmluZyBmb3JtICMjI1xuICAgICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fZ2V0X3NoYTFzdW03ZFwiXG4gICAgICAgICMgICB2YWx1ZTogKCBpc19oaXQsIGRhdGEgKSAtPiBnZXRfc2hhMXN1bTdkIFwiI3tpZiBpc19oaXQgdGhlbiAnSCcgZWxzZSAnRyd9I3tkYXRhfVwiXG5cbiAgICAgICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICMgW1wiI3twcmVmaXh9X25vcm1hbGl6ZV9kYXRhXCJdOlxuICAgICAgICAjICAgbmFtZTogXCIje3ByZWZpeH1fbm9ybWFsaXplX2RhdGFcIlxuICAgICAgICAjICAgdmFsdWU6ICggZGF0YSApIC0+XG4gICAgICAgICMgICAgIHJldHVybiBkYXRhIGlmIGRhdGEgaXMgJ251bGwnXG4gICAgICAgICMgICAgICMgZGVidWcgJ86paW1fXzMxJywgcnByIGRhdGFcbiAgICAgICAgIyAgICAgZGF0YSAgPSBKU09OLnBhcnNlIGRhdGFcbiAgICAgICAgIyAgICAga2V5cyAgPSAoIE9iamVjdC5rZXlzIGRhdGEgKS5zb3J0KClcbiAgICAgICAgIyAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5IE9iamVjdC5mcm9tRW50cmllcyAoIFsgaywgZGF0YVsgayBdLCBdIGZvciBrIGluIGtleXMgKVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGRfdmFyaWFibGVzIGV4dGVuZHMgRGJyaWNfc3RkX2Jhc2VcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6ICggUC4uLiApIC0+XG4gICAgICBzdXBlciBQLi4uXG4gICAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyAgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgICAgICAgICAgICAgICAgPz0gZnJlZXplIHt9XG4gICAgICBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dCAgPz0gZmFsc2VcbiAgICAgIDt1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQGJ1aWxkOiBbXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIHN0ZF92YXJpYWJsZXMgKFxuICAgICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICB2YWx1ZSAgICAganNvbiAgICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsXG4gICAgICAgICAgZGVsdGEgICAgIGludGVnZXIgICAgICAgICAgICAgICBudWxsIGRlZmF1bHQgbnVsbCxcbiAgICAgICAgcHJpbWFyeSBrZXkgKCBuYW1lIClcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF9fMzJcIiBjaGVjayAoICggZGVsdGEgaXMgbnVsbCApIG9yICggZGVsdGEgIT0gMCApIClcbiAgICAgICAgKTtcIlwiXCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBTUUxcIlwiXCJpbnNlcnQgaW50byBzdGRfdmFyaWFibGVzICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzICggJ3NlcTpnbG9iYWw6cm93aWQnLCAwLCArMSApO1wiXCJcIlxuICAgICAgXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTpcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogZmFsc2VcbiAgICAgICAgdmFsdWU6ICAoIG5hbWUgKSAtPiBAc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlIG5hbWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2V0X3ZhcmlhYmxlOlxuICAgICAgICBkZXRlcm1pbmlzdGljOiBmYWxzZVxuICAgICAgICB2YWx1ZTogICggbmFtZSApIC0+IEBzdGRfZ2V0X3ZhcmlhYmxlIG5hbWVcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzZXRfdmFyaWFibGU6ICAgICBTUUxcIlwiXCJcbiAgICAgICAgaW5zZXJ0IGludG8gc3RkX3ZhcmlhYmxlcyAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlcyAoICRuYW1lLCAkdmFsdWUsICRkZWx0YSApXG4gICAgICAgICAgb24gY29uZmxpY3QgKCBuYW1lICkgZG8gdXBkYXRlXG4gICAgICAgICAgICBzZXQgdmFsdWUgPSAkdmFsdWUsIGRlbHRhID0gJGRlbHRhO1wiXCJcIlxuICAgICAgZ2V0X3ZhcmlhYmxlczogICAgU1FMXCJzZWxlY3QgbmFtZSwgdmFsdWUsIGRlbHRhIGZyb20gc3RkX3ZhcmlhYmxlcyBvcmRlciBieSBuYW1lO1wiXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9zdGRfYWNxdWlyZV9zdGF0ZTogKCB0cmFuc2llbnRzID0ge30gKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA9IGxldHMgQHN0YXRlLnN0ZF92YXJpYWJsZXMsICggdiApID0+XG4gICAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIEBzdGF0ZW1lbnRzLmdldF92YXJpYWJsZXMuaXRlcmF0ZSgpXG4gICAgICAgICAgdmFsdWUgICAgID0gSlNPTi5wYXJzZSB2YWx1ZVxuICAgICAgICAgIHZbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9XG4gICAgICAgIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBzdGF0ZS5zdGRfdHJhbnNpZW50cyA9IGxldHMgQHN0YXRlLnN0ZF90cmFuc2llbnRzLCAoIHQgKSAtPlxuICAgICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgdHJhbnNpZW50c1xuICAgICAgICAgIHRbIG5hbWUgXSA9IHsgbmFtZSwgdmFsdWUsIH1cbiAgICAgICAgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3N0ZF9wZXJzaXN0X3N0YXRlOiAtPlxuICAgICAgIyB3aGlzcGVyICfOqWRicmljX18zMycsIFwiX3N0ZF9wZXJzaXN0X3N0YXRlXCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIF8sIHsgbmFtZSwgdmFsdWUsIGRlbHRhLCB9IG9mIEBzdGF0ZS5zdGRfdmFyaWFibGVzXG4gICAgICAgICMjIyBUQUlOVCBjbGVhciBjYWNoZSBpbiBAc3RhdGUuc3RkX3ZhcmlhYmxlcyA/ICMjI1xuICAgICAgICAjIHdoaXNwZXIgJ86pZGJyaWNfXzM0JywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICAgZGVsdGEgID89IG51bGxcbiAgICAgICAgdmFsdWUgICA9IEpTT04uc3RyaW5naWZ5IHZhbHVlXG4gICAgICAgIEBzdGF0ZW1lbnRzLnNldF92YXJpYWJsZS5ydW4geyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHN0YXRlLnN0ZF90cmFuc2llbnRzID0gbGV0cyBAc3RhdGUuc3RkX3RyYW5zaWVudHMsICggdCApIC0+XG4gICAgICAgIGRlbGV0ZSB0WyBuYW1lIF0gZm9yIG5hbWUgb2YgdFxuICAgICAgICA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICA7bnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfd2l0aF92YXJpYWJsZXM6ICggdHJhbnNpZW50cywgZm4gKSAtPlxuICAgICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgICB3aGVuIDEgdGhlbiBbIHRyYW5zaWVudHMsIGZuLCBdID0gWyB7fSwgdHJhbnNpZW50cywgXVxuICAgICAgICB3aGVuIDIgdGhlbiBudWxsXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMzUgZXhwZWN0ZWQgMSBvciAyIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMzYgaWxsZWdhbCB0byBuZXN0IGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHQgPSB0cnVlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBfc3RkX2FjcXVpcmVfc3RhdGUgdHJhbnNpZW50c1xuICAgICAgdHJ5XG4gICAgICAgIFIgPSBmbigpXG4gICAgICBmaW5hbGx5XG4gICAgICAgIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0ID0gZmFsc2VcbiAgICAgICAgQF9zdGRfcGVyc2lzdF9zdGF0ZSgpXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdGRfc2V0X3ZhcmlhYmxlOiAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIC0+XG4gICAgICB1bmxlc3MgQHN0YXRlLnN0ZF93aXRoaW5fdmFyaWFibGVzX2NvbnRleHRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMzcgaWxsZWdhbCB0byBzZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgICBAc3RhdGUuc3RkX3RyYW5zaWVudHMgPSBsZXRzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgKCB0ICkgPT4gdFsgbmFtZSBdID0geyBuYW1lLCB2YWx1ZSwgfVxuICAgICAgZWxzZVxuICAgICAgICBkZWx0YSA/PSBudWxsXG4gICAgICAgIEBzdGF0ZS5zdGRfdmFyaWFibGVzID0gbGV0cyBAc3RhdGUuc3RkX3ZhcmlhYmxlcywgICAoIHYgKSA9PiB2WyBuYW1lIF0gPSB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgO251bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3RkX2dldF92YXJpYWJsZTogKCBuYW1lICkgLT5cbiAgICAgICMgdW5sZXNzIEBzdGF0ZS5zdGRfd2l0aGluX3ZhcmlhYmxlc19jb250ZXh0XG4gICAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMzggaWxsZWdhbCB0byBnZXQgdmFyaWFibGUgb3V0c2lkZSBvZiBgc3RkX3dpdGhfdmFyaWFibGVzKClgIGNvbnRleHRzXCJcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdHJhbnNpZW50cywgbmFtZVxuICAgICAgICByZXR1cm4gQHN0YXRlLnN0ZF90cmFuc2llbnRzWyBuYW1lIF0udmFsdWVcbiAgICAgIGlmIFJlZmxlY3QuaGFzIEBzdGF0ZS5zdGRfdmFyaWFibGVzLCBuYW1lXG4gICAgICAgIHJldHVybiBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdLnZhbHVlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18zOSB1bmtub3duIHZhcmlhYmxlICN7cnByIG5hbWV9XCJcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTogKCBuYW1lICkgLT5cbiAgICAgIHVubGVzcyBAc3RhdGUuc3RkX3dpdGhpbl92YXJpYWJsZXNfY29udGV4dFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX180MCBpbGxlZ2FsIHRvIHNldCB2YXJpYWJsZSBvdXRzaWRlIG9mIGBzdGRfd2l0aF92YXJpYWJsZXMoKWAgY29udGV4dHNcIlxuICAgICAgdW5sZXNzICggZW50cnkgPSBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgbmFtZSBdICk/XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzQxIHVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAgICAgdW5sZXNzICggZGVsdGEgPSBlbnRyeS5kZWx0YSApP1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX180MiBub3QgYSBzZXF1ZW5jZSBuYW1lOiAje3JwciBuYW1lfVwiXG4gICAgICBlbnRyeS52YWx1ZSArPSBkZWx0YVxuICAgICAgcmV0dXJuIGVudHJ5LnZhbHVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9zaG93X3ZhcmlhYmxlczogKCBwcmludF90YWJsZSA9IGZhbHNlICkgLT5cbiAgICAgIHN0b3JlICAgICAgID0gT2JqZWN0LmZyb21FbnRyaWVzICggXFxcbiAgICAgICAgWyBuYW1lLCB7IHZhbHVlLCBkZWx0YSwgfSwgXSBcXFxuICAgICAgICAgIGZvciB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSBmcm9tIFxcXG4gICAgICAgICAgICBAc3RhdGVtZW50cy5nZXRfdmFyaWFibGVzLml0ZXJhdGUoKSApXG4gICAgICBjYWNoZV9uYW1lcyA9IG5ldyBTZXQgT2JqZWN0LmtleXMgQHN0YXRlLnN0ZF92YXJpYWJsZXNcbiAgICAgIHRyYW5zX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBAc3RhdGUuc3RkX3RyYW5zaWVudHNcbiAgICAgIHN0b3JlX25hbWVzID0gbmV3IFNldCBPYmplY3Qua2V5cyBzdG9yZVxuICAgICAgYWxsX25hbWVzICAgPSBbICggKCBjYWNoZV9uYW1lcy51bmlvbiBzdG9yZV9uYW1lcyApLnVuaW9uIHRyYW5zX25hbWVzICkuLi4sIF0uc29ydCgpXG4gICAgICBSID0ge31cbiAgICAgIGZvciBuYW1lIGluIGFsbF9uYW1lc1xuICAgICAgICBzICAgICAgICAgPSBzdG9yZVsgICAgICAgICAgICAgICAgICBuYW1lIF0gPyB7fVxuICAgICAgICBjICAgICAgICAgPSBAc3RhdGUuc3RkX3ZhcmlhYmxlc1sgICBuYW1lIF0gPyB7fVxuICAgICAgICB0ICAgICAgICAgPSBAc3RhdGUuc3RkX3RyYW5zaWVudHNbICBuYW1lIF0gPyB7fVxuICAgICAgICBndiAgICAgICAgPSBAc3RkX2dldF92YXJpYWJsZSBuYW1lXG4gICAgICAgIFJbIG5hbWUgXSA9IHsgc3Y6IHMudmFsdWUsIHNkOiBzLmRlbHRhLCBjdjogYy52YWx1ZSwgY2Q6IGMuZGVsdGEsIHR2OiB0LnZhbHVlLCBndiwgfVxuICAgICAgY29uc29sZS50YWJsZSBSIGlmIHByaW50X3RhYmxlXG4gICAgICByZXR1cm4gUlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY19zdGRfdmFyaWFibGVzXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0ge1xuICAgIERicmljLFxuICAgIERicmljX3N0ZCxcbiAgICBlc3FsLFxuICAgIFNRTCxcbiAgICBUcnVlLFxuICAgIEZhbHNlLFxuICAgIGZyb21fYm9vbCxcbiAgICBhc19ib29sLFxuICAgIGludGVybmFsczogZnJlZXplIHtcbiAgICAgIHR5cGVfb2YsXG4gICAgICBidWlsZF9zdGF0ZW1lbnRfcmUsXG4gICAgICB0ZW1wbGF0ZXMsXG4gICAgICBEYnJpY19zdGRfYmFzZSxcbiAgICAgIERicmljX3N0ZF92YXJpYWJsZXMsIH1cbiAgICB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfZGJyaWMsIHJlcXVpcmVfZGJyaWNfZXJyb3JzLCB9XG5cbiJdfQ==
