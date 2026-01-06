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
    // class E.Dbric_unknown_variable          extends E.Dbric_error
    //   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"
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
    var Dbric, Dbric_std, E, Esql, SFMODULES, SQL, SQLITE, Undumper, as_bool, build_statement_re, debug, esql, exports, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, rpr, set_getter, templates, type_of, warn;
    //=========================================================================================================
    SFMODULES = require('./main');
    ({hide, set_getter} = SFMODULES.require_managed_property_tools());
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({rpr} = (require('./loupe-brics')).require_loupe());
    // { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
    // { nameit,                     } = SFMODULES.require_nameit()
    // { rpr_string,                 } = SFMODULES.require_rpr_string()
    ({lets, freeze} = SFMODULES.require_letsfreezethat_infra().simple);
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
          var clasz, db_class, fn_cfg_template, ref1;
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
          this.cfg = Object.freeze({...clasz.cfg, db_path, ...cfg});
          hide(this, 'statements', {});
          hide(this, '_w', null);
          hide(this, '_statement_class', (this.db.prepare(SQL`select 1;`)).constructor);
          hide(this, 'state', {
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
            db_class: this.db.constructor
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
                  var callable, k, len2, name_of_callable, ref2;
                  if (d.name == null) {
                    d.name = udf_name;
                  }
                  ref2 = names_of_callables[category];
                  //.............................................................................................
                  /* bind UDFs to `this` */
                  for (k = 0, len2 = ref2.length; k < len2; k++) {
                    name_of_callable = ref2[k];
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
      Dbric.cfg = Object.freeze({
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
    Dbric_std = (function() {
      //=========================================================================================================
      class Dbric_std extends Dbric {
        //=======================================================================================================
        set_variable(name, value) {
          value = JSON.stringify(value);
          return this.statements.std_upsert_variable.run({name, value});
        }

        //-------------------------------------------------------------------------------------------------------
        get_variable(name) {
          return JSON.parse((this.statements.std_get_variable.get({name})).value);
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Dbric_std.cfg = Object.freeze({
        prefix: 'std'
      });

      //=======================================================================================================
      Dbric_std.functions = {
        //-----------------------------------------------------------------------------------------------------
        regexp: {
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
          value: function(text, form = 'NFC') {
            return from_bool(text === text.normalize(form));
          }
        },
        //-----------------------------------------------------------------------------------------------------
        /* 'NFC', 'NFD', 'NFKC', or 'NFKD' */std_get_next_in_sequence: {
          value: function(name) {
            var delta, value;
            ({name, value, delta} = this.w.get_first(SQL`update "std_sequences"
  set value = value + delta
  where name = $name
returning *;`, {name}));
            debug('Ωdbric__11', {name, value, delta});
            return value;
          }
        }
      };

      //=======================================================================================================
      Dbric_std.table_functions = {
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
      Dbric_std.statements = {
        std_get_schema: SQL`select * from sqlite_schema;`,
        std_get_tables: SQL`select * from sqlite_schema where type is 'table';`,
        std_get_views: SQL`select * from sqlite_schema where type is 'view';`,
        std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' );`,
        std_upsert_variable: SQL`insert into "std_variables" ( name, value ) values ( $name, $value )
  on conflict ( name ) do update set value = excluded.value;`,
        std_get_variable: SQL`select value from "std_variables" where name = $name;`
      };

      //-------------------------------------------------------------------------------------------------------
      /* select name, builtin, type from pragma_function_list() */
      //-------------------------------------------------------------------------------------------------------
      Dbric_std.build = [
        SQL`create view std_tables as
select * from sqlite_schema
  where type is 'table';`,
        SQL`create view std_views as
select * from sqlite_schema
  where type is 'view';`,
        SQL`create view "std_relations" as
select * from sqlite_schema
  where type in ( 'table', 'view' );`,
        SQL`create table "std_variables" (
  name      text      unique ,
  value     json             ,
  -- name      text      unique  not null,
  -- value     json              not null default 'null',
primary key ( name ) );`,
        SQL`create table "std_sequences" (
  name      text      unique  not null,
  value     integer           not null default 0,
  delta     integer           not null default +1,
primary key ( name )
constraint "Ωconstraint_23" check ( delta != 0 )
);`,
        SQL`insert into "std_sequences" ( name, value, delta ) values
( 'seq:global:rowid', 0, +1 )
;`
      ];

      return Dbric_std;

    }).call(this);
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
      internals: Object.freeze({type_of, build_statement_re, templates})
    };
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_dbric, require_dbric_errors});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0NRLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTthQUF3QixDQUFNLEdBQU4sRUFBVyxDQUFBLG9CQUFBLENBQUEsQ0FBdUIsSUFBdkIsQ0FBQSxxQkFBQSxDQUFBLENBQW1ELEdBQUEsQ0FBSSxLQUFKLENBQW5ELENBQUEsQ0FBWDtNQUF4Qjs7SUFEZjtJQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEs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O01BREY7OztNQWVGLFNBQUMsQ0FBQSxVQUFELEdBQ0U7UUFBQSxjQUFBLEVBQWdCLEdBQUcsQ0FBQSw0QkFBQSxDQUFuQjtRQUVBLGNBQUEsRUFBZ0IsR0FBRyxDQUFBLGtEQUFBLENBRm5CO1FBSUEsYUFBQSxFQUFlLEdBQUcsQ0FBQSxpREFBQSxDQUpsQjtRQU1BLGlCQUFBLEVBQW1CLEdBQUcsQ0FBQSw4REFBQSxDQU50QjtRQVFBLG1CQUFBLEVBQXFCLEdBQUcsQ0FBQTs0REFBQSxDQVJ4QjtRQVdBLGdCQUFBLEVBQWtCLEdBQUcsQ0FBQSxxREFBQTtNQVhyQjs7Ozs7TUFrQkYsU0FBQyxDQUFBLEtBQUQsR0FBUTtRQUNOLEdBQUcsQ0FBQTs7d0JBQUEsQ0FERztRQUlOLEdBQUcsQ0FBQTs7dUJBQUEsQ0FKRztRQU9OLEdBQUcsQ0FBQTs7b0NBQUEsQ0FQRztRQVVOLEdBQUcsQ0FBQTs7Ozs7dUJBQUEsQ0FWRztRQWdCTixHQUFHLENBQUE7Ozs7OztFQUFBLENBaEJHO1FBdUJOLEdBQUcsQ0FBQTs7Q0FBQSxDQXZCRzs7Ozs7a0JBN2pCWjs7QUFvbUJFLFdBQU8sT0FBQSxHQUFVO01BQ2YsS0FEZTtNQUVmLFNBRmU7TUFHZixJQUhlO01BSWYsR0FKZTtNQUtmLElBTGU7TUFNZixLQU5lO01BT2YsU0FQZTtNQVFmLE9BUmU7TUFTZixTQUFBLEVBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLE9BQUYsRUFBVyxrQkFBWCxFQUErQixTQUEvQixDQUFkO0lBVEk7RUF0bUJILEVBaEdoQjs7O0VBb3RCQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGFBQUYsRUFBaUIsb0JBQWpCLENBQTlCO0FBcHRCQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfZGJyaWNfZXJyb3JzID0gLT5cblxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICBFICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsYXNzIEUuRGJyaWNfZXJyb3IgZXh0ZW5kcyBFcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApIC0+XG4gICAgICBzdXBlcigpXG4gICAgICBAbWVzc2FnZSAgPSBcIiN7cmVmfSAoI3tAY29uc3RydWN0b3IubmFtZX0pICN7bWVzc2FnZX1cIlxuICAgICAgQHJlZiAgICAgID0gcmVmXG4gICAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIGNsYXNzIEUuRGJyaWNfY2ZnX2Vycm9yICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiAgIyBjbGFzcyBFLkRicmljX2ludGVybmFsX2Vycm9yICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfZXhpc3RzICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBhbHJlYWR5IGV4aXN0c1wiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBkb2VzIG5vdCBleGlzdFwiXG4gICMgY2xhc3MgRS5EYnJpY19vYmplY3RfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEsIG5hbWUgKS0+IHN1cGVyIHJlZiwgXCJvYmplY3QgI3tycHIgc2NoZW1hICsgJy4nICsgbmFtZX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vbmVtcHR5ICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gaXNuJ3QgZW1wdHlcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vdF9hbGxvd2VkICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gbm90IGFsbG93ZWQgaGVyZVwiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfcmVwZWF0ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gY29weSBzY2hlbWEgdG8gaXRzZWxmLCBnb3QgI3tycHIgc2NoZW1hfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfcm93ICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCByb3dfY291bnQgKSAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAxIHJvdywgZ290ICN7cm93X2NvdW50fVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfdmFsdWUgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGtleXMgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHJvdyB3aXRoIHNpbmdsZSBmaWVsZCwgZ290IGZpZWxkcyAje3JwciBrZXlzfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHRlbnNpb25fdW5rbm93biAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHRlbnNpb24gb2YgcGF0aCAje3BhdGh9IGlzIG5vdCByZWdpc3RlcmVkIGZvciBhbnkgZm9ybWF0XCJcbiAgIyBjbGFzcyBFLkRicmljX25vdF9pbXBsZW1lbnRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaXNuJ3QgaW1wbGVtZW50ZWQgKHlldClcIlxuICAjIGNsYXNzIEUuRGJyaWNfZGVwcmVjYXRlZCAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBoYXMgYmVlbiBkZXByZWNhdGVkXCJcbiAgIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfZGJfb2JqZWN0X3R5cGUgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcIsK1NzY5IHVua25vd24gdHlwZSAje3JwciB0eXBlfSBvZiBEQiBvYmplY3QgI3tkfVwiXG4gIGNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBleHByZXNzIGEgI3t0eXBlfSBhcyBTUUwgbGl0ZXJhbCwgZ290ICN7cnByIHZhbHVlfVwiXG4gIGNsYXNzIEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX3NxbCAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzcWwgKSAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmV4cGVjdGVkIFNRTCBzdHJpbmcgI3tycHIgc3FsfVwiXG4gICMgY2xhc3MgRS5EYnJpY19zcWxpdGVfdG9vX21hbnlfZGJzICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gYXR0YWNoIHNjaGVtYSAje3JwciBzY2hlbWF9OiB0b28gbWFueSBhdHRhY2hlZCBkYXRhYmFzZXNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX2Vycm9yICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZXJyb3IgKSAgICAgICAtPiBzdXBlciByZWYsIFwiI3tlcnJvci5jb2RlID8gJ1NRTGl0ZSBlcnJvcid9OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2FyZ3VtZW50c19hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIGFyaXR5ICkgLT4gc3VwZXIgcmVmLCBcIm1ldGhvZCAje3JwciBuYW1lfSBkb2Vzbid0IHRha2UgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbm90X2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiYXJndW1lbnQgI3tycHIgbmFtZX0gbm90IGFsbG93ZWQsIGdvdCAje3JwciB2YWx1ZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbWlzc2luZyAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgdmFsdWUgZm9yICN7cnByIG5hbWV9LCBnb3Qgbm90aGluZ1wiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ190eXBlICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlcywgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAje3R5cGVzfSwgZ290IGEgI3t0eXBlfVwiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ19hcml0eSAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBtaW4sIG1heCwgZm91bmQgKSAtPiBzdXBlciByZWYsIFwiI3tycHIgbmFtZX0gZXhwZWN0ZWQgYmV0d2VlbiAje21pbn0gYW5kICN7bWF4fSBhcmd1bWVudHMsIGdvdCAje2ZvdW5kfVwiXG4gICMgY2xhc3MgRS5EYnJpY19lbXB0eV9jc3YgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJubyBDU1YgcmVjb3JkcyBmb3VuZCBpbiBmaWxlICN7cGF0aH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biBpbnRlcnBvbGF0aW9uIGZvcm1hdCAje3JwciBmb3JtYXR9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX25lc3RlZF90cmFuc2FjdGlvbnMgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBzdGFydCBhIHRyYW5zYWN0aW9uIHdpdGhpbiBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2RlZmVycmVkX2Zrc19pbl90eCAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBkZWZlciBmb3JlaWduIGtleXMgaW5zaWRlIGEgdHJhbnNhY3Rpb25cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5rbm93bl92YXJpYWJsZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICMgY2xhc3MgRS5EYnJpY19pbnZhbGlkX3RpbWVzdGFtcCAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB4ICkgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJub3QgYSB2YWxpZCBEYnJpYyB0aW1lc3RhbXA6ICN7cnByIHh9XCJcblxuICAjICMjIyBUQUlOVCByZXBsYWNlIHdpdGggbW9yZSBzcGVjaWZpYyBlcnJvciwgbGlrZSBiZWxvdyAjIyNcbiAgIyBjbGFzcyBFLkRicmljX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuICAjICAgICBzdXBlciByZWYsIFwidW5rbm93biBEQiBmb3JtYXQgI3tyZWYgZm9ybWF0fVwiXG5cbiAgIyBjbGFzcyBFLkRicmljX2ltcG9ydF9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiAgIyAgICAgZm9ybWF0cyA9IFsgKCByZXF1aXJlICcuL3R5cGVzJyApLl9pbXBvcnRfZm9ybWF0cy4uLiwgXS5qb2luICcsICdcbiAgIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gaW1wb3J0IGZvcm1hdCAje3JwciBmb3JtYXR9IChrbm93biBmb3JtYXRzIGFyZSAje2Zvcm1hdHN9KVwiXG5cbiAgcmV0dXJuIGV4cG9ydHMgPSBFXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xucmVxdWlyZV9kYnJpYyA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbmFtZWl0KClcbiAgIyB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgbGV0cyxcbiAgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbiAgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4gIEUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlX2RicmljX2Vycm9ycygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgd2hpbGUgeD9cbiAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBidWlsZF9zdGF0ZW1lbnRfcmUgPSAvLy9cbiAgICBeIFxccypcbiAgICBpbnNlcnQgfCAoXG4gICAgICAoIGNyZWF0ZSB8IGFsdGVyICkgXFxzK1xuICAgICAgKD88dHlwZT4gdGFibGUgfCB2aWV3IHwgaW5kZXggfCB0cmlnZ2VyICkgXFxzK1xuICAgICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAgIClcbiAgICAvLy9pc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVtcGxhdGVzID1cbiAgICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGBgYFxuICBjb25zdCBUcnVlICA9IDE7XG4gIGNvbnN0IEZhbHNlID0gMDtcbiAgYGBgXG5cbiAgZnJvbV9ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICAgIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18xIGV4cGVjdGVkIHRydWUgb3IgZmFsc2UsIGdvdCAje3JwciB4fVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgICB3aGVuIEZhbHNlICB0aGVuIGZhbHNlXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBFc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGEgbmFtZSwgZ290ICN7cnByIG5hbWV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgSUROOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBMSVQ6ICggeCApID0+XG4gICAgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHhcbiAgICAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgICB3aGVuICdmbG9hdCcgICAgICB0aGVuIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICdeZGJheS9zcWxAMV4nLCB0eXBlLCB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFZFQzogKCB4ICkgPT5cbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHJldHVybiAnKCAnICsgKCAoIEBMSVQgZSBmb3IgZSBpbiB4ICkuam9pbiAnLCAnICkgKyAnICknXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICMgICBpZHggPSAtMVxuICAgICMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgPT5cbiAgICAjICAgICBpZHgrK1xuICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAjICAgICAgIHdoZW4gJyQnXG4gICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgIyAgICAgICB3aGVuICc/J1xuICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAjICAgICBzd2l0Y2ggZm9ybWF0XG4gICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4gICAgIyAgICAgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgIyBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuOiAvKD88b3BlbmVyPlskP10pKD88Zm9ybWF0Pi4/KTooPzxuYW1lPlxcdyopL2dcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgIFIgPSBwYXJ0c1sgMCBdXG4gICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgcmV0dXJuIFJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgICBAZnVuY3Rpb25zOiAgIHt9XG4gICAgQHN0YXRlbWVudHM6ICB7fVxuICAgIEBidWlsZDogICAgICAgbnVsbFxuICAgIEBkYl9jbGFzczogICAgU1FMSVRFLkRhdGFiYXNlU3luY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBkYl9jbGFzcyAgICAgICAgICAgICAgICAgID0gKCBjZmc/LmRiX2NsYXNzICkgPyBjbGFzei5kYl9jbGFzc1xuICAgICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBkYl9jbGFzcyBkYl9wYXRoXG4gICAgICAjIEBkYiAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IGNsYXN6LmNmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICBAYnVpbGQoKVxuICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNSBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3JwciBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgIFIgPSB7fVxuICAgICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRlYXJkb3duOiAoeyB0ZXN0ID0gbnVsbCwgfT17fSkgLT5cbiAgICAgIGNvdW50ICAgICAgID0gMFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHRlc3QgaXMgJyonXG4gICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHRydWVcbiAgICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgICBudWxsXG4gICAgICAgIHdoZW4gbm90IHRlc3Q/XG4gICAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiBwcmVmaXhfcmUudGVzdCBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzYgZXhwZWN0ZWQgYCcqJ2AsIGEgUmVnRXhwLCBhIGZ1bmN0aW9uLCBudWxsIG9yIHVuZGVmaW5lZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyB0ZXN0IG5hbWVcbiAgICAgICAgY291bnQrK1xuICAgICAgICB0cnlcbiAgICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7ZXNxbC5JRE4gbmFtZX07XCIgKS5ydW4oKVxuICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgIHdhcm4gXCLOqWRicmljX19fNyBpZ25vcmVkIGVycm9yOiAje2Vycm9yLm1lc3NhZ2V9XCIgdW5sZXNzIC8vLyBubyBcXHMrIHN1Y2ggXFxzKyAje3R5cGV9OiAvLy8udGVzdCBlcnJvci5tZXNzYWdlXG4gICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9uO1wiICkucnVuKClcbiAgICAgIHJldHVybiBjb3VudFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBidWlsZDogLT4gaWYgQGlzX3JlYWR5IHRoZW4gMCBlbHNlIEByZWJ1aWxkKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmVidWlsZDogLT5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgY291bnQgICAgICAgICAgICAgICAgID0gMFxuICAgICAgYnVpbGRfc3RhdGVtZW50c19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgJ2J1aWxkJyApLnJldmVyc2UoKVxuICAgICAgaGFzX3Rvcm5fZG93biAgICAgICAgID0gZmFsc2VcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGJ1aWxkX3N0YXRlbWVudHMgaW4gYnVpbGRfc3RhdGVtZW50c19saXN0XG4gICAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIGJ1aWxkX3N0YXRlbWVudHMgKSBpbiBbICd1bmRlZmluZWQnLCAnbnVsbCcsICdsaXN0JywgXVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX184IGV4cGVjdGVkIGFuIG9wdGlvbmFsIGxpc3QgZm9yICN7Y2xhc3oubmFtZX0uYnVpbGQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGNvbnRpbnVlIGlmICggbm90IGJ1aWxkX3N0YXRlbWVudHM/ICkgb3IgKCBidWlsZF9zdGF0ZW1lbnRzLmxlbmd0aCBpcyAwIClcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBAdGVhcmRvd24oKSB1bmxlc3MgaGFzX3Rvcm5fZG93blxuICAgICAgICBoYXNfdG9ybl9kb3duID0gdHJ1ZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnQgaW4gYnVpbGRfc3RhdGVtZW50c1xuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICAoIEBwcmVwYXJlIGJ1aWxkX3N0YXRlbWVudCApLnJ1bigpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBjb3VudFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3N1cGVyJywgICAgICAgICAgICAtPiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgQGNvbnN0cnVjdG9yXG4gICAgc2V0X2dldHRlciBAOjosICdpc19yZWFkeScsICAgICAgICAgLT4gQF9nZXRfaXNfcmVhZHkoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4JywgICAgICAgICAgIC0+IEBfZ2V0X3ByZWZpeCgpXG4gICAgc2V0X2dldHRlciBAOjosICdwcmVmaXhfcmUnLCAgICAgICAgLT4gQF9nZXRfcHJlZml4X3JlKClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ19mdW5jdGlvbl9uYW1lcycsICAtPiBAX2dldF9mdW5jdGlvbl9uYW1lcygpXG4gICAgc2V0X2dldHRlciBAOjosICd3JywgICAgICAgICAgICAgICAgLT4gQF9nZXRfdygpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfaXNfcmVhZHk6IC0+XG4gICAgICB7IGVycm9yX2NvdW50LFxuICAgICAgICBzdGF0ZW1lbnRfY291bnQsXG4gICAgICAgIGRiX29iamVjdHM6IGV4cGVjdGVkX2RiX29iamVjdHMsIH0gPSBAX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHMoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBlcnJvcl9jb3VudCBpc250IDBcbiAgICAgICAgbWVzc2FnZXMgPSBbXVxuICAgICAgICBmb3IgbmFtZSwgeyB0eXBlLCBtZXNzYWdlLCB9IG9mIGV4cGVjdGVkX2RiX29iamVjdHNcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgdHlwZSBpcyAnZXJyb3InXG4gICAgICAgICAgbWVzc2FnZXMucHVzaCBtZXNzYWdlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX185ICN7ZXJyb3JfY291bnR9IG91dCBvZiAje3N0YXRlbWVudF9jb3VudH0gYnVpbGQgc3RhdGVtZW50KHMpIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICN7cnByIG1lc3NhZ2VzfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHByZXNlbnRfZGJfb2JqZWN0cyA9IEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgZm9yIG5hbWUsIHsgdHlwZTogZXhwZWN0ZWRfdHlwZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlc2VudF9kYl9vYmplY3RzWyBuYW1lIF0/LnR5cGUgaXMgZXhwZWN0ZWRfdHlwZVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9wcmVmaXg6IC0+XG4gICAgICByZXR1cm4gJycgaWYgKCBub3QgQGNmZy5wcmVmaXg/ICkgb3IgKCBAY2ZnLnByZWZpeCBpcyAnKE5PUFJFRklYKScgKVxuICAgICAgcmV0dXJuIEBjZmcucHJlZml4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4X3JlOiAtPlxuICAgICAgcmV0dXJuIC98LyBpZiBAcHJlZml4IGlzICcnXG4gICAgICByZXR1cm4gLy8vIF4gXz8gI3tSZWdFeHAuZXNjYXBlIEBwcmVmaXh9IF8gLiogJCAvLy9cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF93OiAtPlxuICAgICAgcmV0dXJuIEBfdyBpZiBAX3c/XG4gICAgICBAX3cgPSBuZXcgQGNvbnN0cnVjdG9yIEBjZmcuZGJfcGF0aCwgeyBkYl9jbGFzczogQGRiLmNvbnN0cnVjdG9yLCB9XG4gICAgICByZXR1cm4gQF93XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZnVuY3Rpb25fbmFtZXM6IC0+IG5ldyBTZXQgKCBuYW1lIGZvciB7IG5hbWUsIH0gZnJvbSBcXFxuICAgICAgQHdhbGsgU1FMXCJzZWxlY3QgbmFtZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgb3JkZXIgYnkgbmFtZTtcIiApXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzOiAtPlxuICAgICAgIyMjIFRBSU5UIGRvZXMgbm90IHlldCBkZWFsIHdpdGggcXVvdGVkIG5hbWVzICMjI1xuICAgICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBkYl9vYmplY3RzICAgICAgPSB7fVxuICAgICAgc3RhdGVtZW50X2NvdW50ID0gMFxuICAgICAgZXJyb3JfY291bnQgICAgID0gMFxuICAgICAgZm9yIHN0YXRlbWVudCBpbiBjbGFzei5idWlsZCA/IFtdXG4gICAgICAgIHN0YXRlbWVudF9jb3VudCsrXG4gICAgICAgIGlmICggbWF0Y2ggPSBzdGF0ZW1lbnQubWF0Y2ggYnVpbGRfc3RhdGVtZW50X3JlICk/XG4gICAgICAgICAgeyBuYW1lLFxuICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICBjb250aW51ZSB1bmxlc3MgbmFtZT8gIyMjIE5PVEUgaWdub3JlIHN0YXRlbWVudHMgbGlrZSBgaW5zZXJ0YCAjIyNcbiAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gZXNxbC51bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCBtZXNzYWdlLCB9XG4gICAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgZm9yIG5hbWUsIHNxbCBvZiBjbGFzei5zdGF0ZW1lbnRzXG4gICAgICAjICAgc3dpdGNoIHRydWVcbiAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgIyAgICAgICBudWxsXG4gICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnaW5zZXJ0XydcbiAgICAgICMgICAgICAgbnVsbFxuICAgICAgIyAgICAgZWxzZVxuICAgICAgIyAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqW5xbF9fMTAgdW5hYmxlIHRvIHBhcnNlIHN0YXRlbWVudCBuYW1lICN7cnByIG5hbWV9XCJcbiAgICAgICMgIyAgIEBbIG5hbWUgXSA9IEBwcmVwYXJlIHNxbFxuICAgICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICAgIHN0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdzdGF0ZW1lbnRzJyApLnJldmVyc2UoKVxuICAgICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgICAgICBpZiBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXT9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIHN0YXRlbWVudCAje3JwciBzdGF0ZW1lbnRfbmFtZX0gaXMgYWxyZWFkeSBkZWNsYXJlZFwiXG4gICAgICAgICAgIyBpZiAoIHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ2xpc3QnXG4gICAgICAgICAgIyAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gKCBAcHJlcGFyZSBzdWJfc3RhdGVtZW50IGZvciBzdWJfc3RhdGVtZW50IGluIHN0YXRlbWVudCApXG4gICAgICAgICAgIyAgIGNvbnRpbnVlXG4gICAgICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICAgIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB0cnlcbiAgICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTMgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgICByZXR1cm4gUlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIEZVTkNUSU9OU1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV91ZGZzOiAtPlxuICAgICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgICAgbmFtZXNfb2ZfY2FsbGFibGVzICA9XG4gICAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgICB3aW5kb3dfZnVuY3Rpb246ICAgICAgWyAnc3RhcnQnLCAnc3RlcCcsICdpbnZlcnNlJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgY2F0ZWdvcnkgaW4gWyAnZnVuY3Rpb24nLCBcXFxuICAgICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgICAgbWV0aG9kX25hbWUgICAgICAgPSBcImNyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgICAgY29udGludWUgdW5sZXNzIGRlY2xhcmF0aW9ucz9cbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgICAgZC5uYW1lID89IHVkZl9uYW1lXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTQgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RlcCxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RlcCxcbiAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjAgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgcGFyYW1ldGVycyxcbiAgICAgICAgY29sdW1ucyxcbiAgICAgICAgcm93cyxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjMgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVnZXhwOlxuICAgICAgICB2YWx1ZTogKCBwYXR0ZXJuLCB0ZXh0ICkgLT4gaWYgKCAoIG5ldyBSZWdFeHAgcGF0dGVybiwgJ3YnICkudGVzdCB0ZXh0ICkgdGhlbiAxIGVsc2UgMFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9pc191Y19ub3JtYWw6XG4gICAgICAgICMjIyBOT1RFOiBhbHNvIHNlZSBgU3RyaW5nOjppc1dlbGxGb3JtZWQoKWAgIyMjXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2dldF9uZXh0X2luX3NlcXVlbmNlOlxuICAgICAgICB2YWx1ZTogKCBuYW1lICkgLT5cbiAgICAgICAgICB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfSA9IEB3LmdldF9maXJzdCBTUUxcIlwiXCJcbiAgICAgICAgICAgIHVwZGF0ZSBcInN0ZF9zZXF1ZW5jZXNcIlxuICAgICAgICAgICAgICBzZXQgdmFsdWUgPSB2YWx1ZSArIGRlbHRhXG4gICAgICAgICAgICAgIHdoZXJlIG5hbWUgPSAkbmFtZVxuICAgICAgICAgICAgcmV0dXJuaW5nICo7XCJcIlwiLCB7IG5hbWUsIH1cbiAgICAgICAgICBkZWJ1ZyAnzqlkYnJpY19fMTEnLCB7IG5hbWUsIHZhbHVlLCBkZWx0YSwgfVxuICAgICAgICAgIHJldHVybiB2YWx1ZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAdGFibGVfZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZW5lcmF0ZV9zZXJpZXM6XG4gICAgICAgIGNvbHVtbnM6ICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAgIHBhcmFtZXRlcnM6ICAgWyAnc3RhcnQnLCAnc3RvcCcsICdzdGVwJywgXVxuICAgICAgICAjIyMgTk9URSBkZWZhdWx0cyBhbmQgYmVoYXZpb3IgYXMgcGVyIGh0dHBzOi8vc3FsaXRlLm9yZy9zZXJpZXMuaHRtbCNvdmVydmlldyAjIyNcbiAgICAgICAgcm93czogKCBzdGFydCwgc3RvcCA9IDRfMjk0Xzk2N18yOTUsIHN0ZXAgPSAxICkgLT5cbiAgICAgICAgICBzdGVwICA9IDEgaWYgc3RlcCBpcyAwICMjIyBOT1RFIGVxdWl2YWxlbnQgYCggT2JqZWN0LmlzIHN0ZXAsICswICkgb3IgKCBPYmplY3QuaXMgc3RlcCwgLTAgKSAjIyNcbiAgICAgICAgICB2YWx1ZSA9IHN0YXJ0XG4gICAgICAgICAgbG9vcFxuICAgICAgICAgICAgaWYgc3RlcCA+IDAgdGhlbiAgYnJlYWsgaWYgdmFsdWUgPiBzdG9wXG4gICAgICAgICAgICBlbHNlICAgICAgICAgICAgICBicmVhayBpZiB2YWx1ZSA8IHN0b3BcbiAgICAgICAgICAgIHlpZWxkIHsgdmFsdWUsIH1cbiAgICAgICAgICAgIHZhbHVlICs9IHN0ZXBcbiAgICAgICAgICA7bnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAc3RhdGVtZW50czpcbiAgICAgIHN0ZF9nZXRfc2NoZW1hOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hO1wiXCJcIlxuICAgICAgc3RkX2dldF90YWJsZXM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgc3RkX2dldF92aWV3czogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd2aWV3JztcIlwiXCJcbiAgICAgIHN0ZF9nZXRfcmVsYXRpb25zOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcbiAgICAgIHN0ZF91cHNlcnRfdmFyaWFibGU6IFNRTFwiXCJcIlxuICAgICAgICBpbnNlcnQgaW50byBcInN0ZF92YXJpYWJsZXNcIiAoIG5hbWUsIHZhbHVlICkgdmFsdWVzICggJG5hbWUsICR2YWx1ZSApXG4gICAgICAgICAgb24gY29uZmxpY3QgKCBuYW1lICkgZG8gdXBkYXRlIHNldCB2YWx1ZSA9IGV4Y2x1ZGVkLnZhbHVlO1wiXCJcIlxuICAgICAgc3RkX2dldF92YXJpYWJsZTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCB2YWx1ZSBmcm9tIFwic3RkX3ZhcmlhYmxlc1wiIHdoZXJlIG5hbWUgPSAkbmFtZTtcIlwiXCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIHNlbGVjdCBuYW1lLCBidWlsdGluLCB0eXBlIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSAjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGJ1aWxkOiBbXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdGFibGVzIGFzXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF92aWV3cyBhc1xuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICB3aGVyZSB0eXBlIGlzICd2aWV3JztcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IFwic3RkX3JlbGF0aW9uc1wiIGFzXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgIHdoZXJlIHR5cGUgaW4gKCAndGFibGUnLCAndmlldycgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB0YWJsZSBcInN0ZF92YXJpYWJsZXNcIiAoXG4gICAgICAgICAgbmFtZSAgICAgIHRleHQgICAgICB1bmlxdWUgLFxuICAgICAgICAgIHZhbHVlICAgICBqc29uICAgICAgICAgICAgICxcbiAgICAgICAgICAtLSBuYW1lICAgICAgdGV4dCAgICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgLS0gdmFsdWUgICAgIGpzb24gICAgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgJ251bGwnLFxuICAgICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKSApO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHRhYmxlIFwic3RkX3NlcXVlbmNlc1wiIChcbiAgICAgICAgICBuYW1lICAgICAgdGV4dCAgICAgIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgdmFsdWUgICAgIGludGVnZXIgICAgICAgICAgIG5vdCBudWxsIGRlZmF1bHQgMCxcbiAgICAgICAgICBkZWx0YSAgICAgaW50ZWdlciAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCArMSxcbiAgICAgICAgcHJpbWFyeSBrZXkgKCBuYW1lIClcbiAgICAgICAgY29uc3RyYWludCBcIs6pY29uc3RyYWludF8yM1wiIGNoZWNrICggZGVsdGEgIT0gMCApXG4gICAgICAgICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJpbnNlcnQgaW50byBcInN0ZF9zZXF1ZW5jZXNcIiAoIG5hbWUsIHZhbHVlLCBkZWx0YSApIHZhbHVlc1xuICAgICAgICAoICdzZXE6Z2xvYmFsOnJvd2lkJywgMCwgKzEgKVxuICAgICAgICA7XCJcIlwiXG4gICAgICBdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNldF92YXJpYWJsZTogKCBuYW1lLCB2YWx1ZSApIC0+XG4gICAgICAjIyMgVEFJTlQgY29uc2lkZXIgdG8gdXNlIG5vcm1hbGl6ZWQgSlNPTiAjIyNcbiAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgdmFsdWVcbiAgICAgIHJldHVybiBAc3RhdGVtZW50cy5zdGRfdXBzZXJ0X3ZhcmlhYmxlLnJ1biB7IG5hbWUsIHZhbHVlLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGdldF92YXJpYWJsZTogKCBuYW1lICkgLT4gSlNPTi5wYXJzZSAoIEBzdGF0ZW1lbnRzLnN0ZF9nZXRfdmFyaWFibGUuZ2V0IHsgbmFtZSwgfSApLnZhbHVlXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0ge1xuICAgIERicmljLFxuICAgIERicmljX3N0ZCxcbiAgICBlc3FsLFxuICAgIFNRTCxcbiAgICBUcnVlLFxuICAgIEZhbHNlLFxuICAgIGZyb21fYm9vbCxcbiAgICBhc19ib29sLFxuICAgIGludGVybmFsczogT2JqZWN0LmZyZWV6ZSB7IHR5cGVfb2YsIGJ1aWxkX3N0YXRlbWVudF9yZSwgdGVtcGxhdGVzLCB9XG4gICAgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgeyByZXF1aXJlX2RicmljLCByZXF1aXJlX2RicmljX2Vycm9ycywgfVxuXG4iXX0=
