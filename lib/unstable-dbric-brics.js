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
      class Dbric_std extends Dbric {};

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
        std_get_relations: SQL`select * from sqlite_schema where type in ( 'table', 'view' );`
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
  name      text      unique  not null,
  value     json              not null default 'null',
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0NRLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTthQUF3QixDQUFNLEdBQU4sRUFBVyxDQUFBLG9CQUFBLENBQUEsQ0FBdUIsSUFBdkIsQ0FBQSxxQkFBQSxDQUFBLENBQW1ELEdBQUEsQ0FBSSxLQUFKLENBQW5ELENBQUEsQ0FBWDtNQUF4Qjs7SUFEZjtJQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEs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QWNOLEdBQUcsQ0FBQTs7Ozs7O0VBQUEsQ0FkRztRQXFCTixHQUFHLENBQUE7O0NBQUEsQ0FyQkc7Ozs7O2tCQXhqQlo7O0FBcWxCRSxXQUFPLE9BQUEsR0FBVTtNQUNmLEtBRGU7TUFFZixTQUZlO01BR2YsSUFIZTtNQUlmLEdBSmU7TUFLZixJQUxlO01BTWYsS0FOZTtNQU9mLFNBUGU7TUFRZixPQVJlO01BU2YsU0FBQSxFQUFXLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxPQUFGLEVBQVcsa0JBQVgsRUFBK0IsU0FBL0IsQ0FBZDtJQVRJO0VBdmxCSCxFQWhHaEI7OztFQXFzQkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsQ0FBRSxhQUFGLEVBQWlCLG9CQUFqQixDQUE5QjtBQXJzQkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX2RicmljX2Vycm9ycyA9IC0+XG5cbiAgeyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgRSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAtPlxuICAgICAgc3VwZXIoKVxuICAgICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICAgIEByZWYgICAgICA9IHJlZlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZCAjIyMgYWx3YXlzIHJldHVybiBgdW5kZWZpbmVkYCBmcm9tIGNvbnN0cnVjdG9yICMjI1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBjbGFzcyBFLkRicmljX2NmZ19lcnJvciAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX2V4aXN0cyAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gYWxyZWFkeSBleGlzdHNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfb2JqZWN0X3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hLCBuYW1lICktPiBzdXBlciByZWYsIFwib2JqZWN0ICN7cnByIHNjaGVtYSArICcuJyArIG5hbWV9IGRvZXMgbm90IGV4aXN0XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub25lbXB0eSAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGlzbid0IGVtcHR5XCJcbiAgIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub3RfYWxsb3dlZCAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IG5vdCBhbGxvd2VkIGhlcmVcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3JlcGVhdGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGNvcHkgc2NoZW1hIHRvIGl0c2VsZiwgZ290ICN7cnByIHNjaGVtYX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3JvdyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcm93X2NvdW50ICkgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgMSByb3csIGdvdCAje3Jvd19jb3VudH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3ZhbHVlICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBrZXlzICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCByb3cgd2l0aCBzaW5nbGUgZmllbGQsIGdvdCBmaWVsZHMgI3tycHIga2V5c31cIlxuICAjIGNsYXNzIEUuRGJyaWNfZXh0ZW5zaW9uX3Vua25vd24gICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXh0ZW5zaW9uIG9mIHBhdGggI3twYXRofSBpcyBub3QgcmVnaXN0ZXJlZCBmb3IgYW55IGZvcm1hdFwiXG4gICMgY2xhc3MgRS5EYnJpY19ub3RfaW1wbGVtZW50ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGlzbid0IGltcGxlbWVudGVkICh5ZXQpXCJcbiAgIyBjbGFzcyBFLkRicmljX2RlcHJlY2F0ZWQgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaGFzIGJlZW4gZGVwcmVjYXRlZFwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX2RiX29iamVjdF90eXBlIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCLCtTc2OSB1bmtub3duIHR5cGUgI3tycHIgdHlwZX0gb2YgREIgb2JqZWN0ICN7ZH1cIlxuICBjbGFzcyBFLkRicmljX3NxbF92YWx1ZV9lcnJvciAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gZXhwcmVzcyBhICN7dHlwZX0gYXMgU1FMIGxpdGVyYWwsIGdvdCAje3JwciB2YWx1ZX1cIlxuICBjbGFzcyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBhIGxpc3QsIGdvdCBhICN7dHlwZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9zcWwgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc3FsICkgICAgICAgICAtPiBzdXBlciByZWYsIFwidW5leHBlY3RlZCBTUUwgc3RyaW5nICN7cnByIHNxbH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX3Rvb19tYW55X2RicyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGF0dGFjaCBzY2hlbWEgI3tycHIgc2NoZW1hfTogdG9vIG1hbnkgYXR0YWNoZWQgZGF0YWJhc2VzXCJcbiAgIyBjbGFzcyBFLkRicmljX3NxbGl0ZV9lcnJvciAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGVycm9yICkgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7ZXJyb3IuY29kZSA/ICdTUUxpdGUgZXJyb3InfTogI3tlcnJvci5tZXNzYWdlfVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19hcmd1bWVudHNfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBhcml0eSApIC0+IHN1cGVyIHJlZiwgXCJtZXRob2QgI3tycHIgbmFtZX0gZG9lc24ndCB0YWtlIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X25vdF9hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImFyZ3VtZW50ICN7cnByIG5hbWV9IG5vdCBhbGxvd2VkLCBnb3QgI3tycHIgdmFsdWV9XCJcbiAgIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X21pc3NpbmcgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHZhbHVlIGZvciAje3JwciBuYW1lfSwgZ290IG5vdGhpbmdcIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfdHlwZSAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZXMsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgI3t0eXBlc30sIGdvdCBhICN7dHlwZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfd3JvbmdfYXJpdHkgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgbWluLCBtYXgsIGZvdW5kICkgLT4gc3VwZXIgcmVmLCBcIiN7cnByIG5hbWV9IGV4cGVjdGVkIGJldHdlZW4gI3ttaW59IGFuZCAje21heH0gYXJndW1lbnRzLCBnb3QgI3tmb3VuZH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfZW1wdHlfY3N2ICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwibm8gQ1NWIHJlY29yZHMgZm91bmQgaW4gZmlsZSAje3BhdGh9XCJcbiAgIyBjbGFzcyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gaW50ZXJwb2xhdGlvbiBmb3JtYXQgI3tycHIgZm9ybWF0fVwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19uZXN0ZWRfdHJhbnNhY3Rpb25zICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3Qgc3RhcnQgYSB0cmFuc2FjdGlvbiB3aXRoaW4gYSB0cmFuc2FjdGlvblwiXG4gICMgY2xhc3MgRS5EYnJpY19ub19kZWZlcnJlZF9ma3NfaW5fdHggICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3QgZGVmZXIgZm9yZWlnbiBrZXlzIGluc2lkZSBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX3Vua25vd25fdmFyaWFibGUgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfaW52YWxpZF90aW1lc3RhbXAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgeCApICAgICAgICAgICAtPiBzdXBlciByZWYsIFwibm90IGEgdmFsaWQgRGJyaWMgdGltZXN0YW1wOiAje3JwciB4fVwiXG5cbiAgIyAjIyMgVEFJTlQgcmVwbGFjZSB3aXRoIG1vcmUgc3BlY2lmaWMgZXJyb3IsIGxpa2UgYmVsb3cgIyMjXG4gICMgY2xhc3MgRS5EYnJpY19mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiAgIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gREIgZm9ybWF0ICN7cmVmIGZvcm1hdH1cIlxuXG4gICMgY2xhc3MgRS5EYnJpY19pbXBvcnRfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4gICMgICAgIGZvcm1hdHMgPSBbICggcmVxdWlyZSAnLi90eXBlcycgKS5faW1wb3J0X2Zvcm1hdHMuLi4sIF0uam9pbiAnLCAnXG4gICMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIGltcG9ydCBmb3JtYXQgI3tycHIgZm9ybWF0fSAoa25vd24gZm9ybWF0cyBhcmUgI3tmb3JtYXRzfSlcIlxuXG4gIHJldHVybiBleHBvcnRzID0gRVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfZGJyaWMgPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbiAgeyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbiAgIyB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG4gICMgeyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG4gICMgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICB7IGxldHMsXG4gICAgZnJlZXplLCAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9sZXRzZnJlZXpldGhhdF9pbmZyYSgpLnNpbXBsZVxuICBTUUxJVEUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpzcWxpdGUnXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIG1pc2ZpdCAgICAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wgJ21pc2ZpdCdcbiAgeyBnZXRfcHJvdG90eXBlX2NoYWluLFxuICAgIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLCB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3Byb3RvdHlwZV9jaGFpbigpXG4gIHsgVW5kdW1wZXIsICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9jb2Fyc2Vfc3FsaXRlX3N0YXRlbWVudF9zZWdtZW50ZXIoKVxuICBFICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZV9kYnJpY19lcnJvcnMoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIFRBSU5UIHB1dCBpbnRvIHNlcGFyYXRlIG1vZHVsZSAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgd2l0aCBgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gICMjIyBUQUlOVCByZXdyaXRlIGFzIGBnZXRfZmlyc3RfZGVzY3JpcHRvcl9pbl9wcm90b3R5cGVfY2hhaW4oKWAsIGBnZXRfZmlyc3RfaW5fcHJvdG90eXBlX2NoYWluKClgICMjI1xuICBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciA9ICggeCwgbmFtZSwgZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICAgIHdoaWxlIHg/XG4gICAgICByZXR1cm4gUiBpZiAoIFIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHgsIG5hbWUgKT9cbiAgICAgIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeFxuICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgdGhyb3cgbmV3IEVycm9yIFwidW5hYmxlIHRvIGZpbmQgZGVzY3JpcHRvciBmb3IgcHJvcGVydHkgI3tTdHJpbmcobmFtZSl9IG5vdCBmb3VuZCBvbiBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZXNcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYnVpbGRfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgXiBcXHMqXG4gICAgaW5zZXJ0IHwgKFxuICAgICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAgICg/PHR5cGU+IHRhYmxlIHwgdmlldyB8IGluZGV4IHwgdHJpZ2dlciApIFxccytcbiAgICAgICg/PG5hbWU+IFxcUysgKSBcXHMrXG4gICAgICApXG4gICAgLy8vaXNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlbXBsYXRlcyA9XG4gICAgY3JlYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIHN0YXJ0OiAgICAgICAgICBudWxsXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV90YWJsZV9mdW5jdGlvbl9jZmc6XG4gICAgICBkZXRlcm1pbmlzdGljOiAgdHJ1ZVxuICAgICAgdmFyYXJnczogICAgICAgIGZhbHNlXG4gICAgICBkaXJlY3RPbmx5OiAgICAgZmFsc2VcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3ZpcnR1YWxfdGFibGVfY2ZnOiB7fVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBgYGBcbiAgY29uc3QgVHJ1ZSAgPSAxO1xuICBjb25zdCBGYWxzZSA9IDA7XG4gIGBgYFxuXG4gIGZyb21fYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgd2hlbiB0cnVlICB0aGVuIFRydWVcbiAgICB3aGVuIGZhbHNlIHRoZW4gRmFsc2VcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6panpyc2RiX19fMSBleHBlY3RlZCB0cnVlIG9yIGZhbHNlLCBnb3QgI3tycHIgeH1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYXNfYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gICAgd2hlbiBUcnVlICAgdGhlbiB0cnVlXG4gICAgd2hlbiBGYWxzZSAgdGhlbiBmYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18yIGV4cGVjdGVkIDAgb3IgMSwgZ290ICN7cnByIHh9XCJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRXNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB1bnF1b3RlX25hbWU6ICggbmFtZSApIC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fMyBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiAvXlteXCJdKC4qKVteXCJdJC8udGVzdCAgbmFtZSB0aGVuIHJldHVybiBuYW1lXG4gICAgICAgIHdoZW4gL15cIiguKylcIiQvLnRlc3QgICAgICAgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVsgMSAuLi4gbmFtZS5sZW5ndGggLSAxIF0ucmVwbGFjZSAvXCJcIi9nLCAnXCInXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNCBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3JwciBuYW1lfVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIElETjogKCBuYW1lICkgPT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgTElUOiAoIHggKSA9PlxuICAgICAgcmV0dXJuICdudWxsJyB1bmxlc3MgeD9cbiAgICAgIHN3aXRjaCB0eXBlID0gdHlwZV9vZiB4XG4gICAgICAgIHdoZW4gJ3RleHQnICAgICAgIHRoZW4gcmV0dXJuICBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiJydcIiApICsgXCInXCJcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHJldHVybiBcIicje0BsaXN0X2FzX2pzb24geH0nXCJcbiAgICAgICAgd2hlbiAnZmxvYXQnICAgICAgdGhlbiByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAgIHdoZW4gJ2Jvb2xlYW4nICAgIHRoZW4gcmV0dXJuICggaWYgeCB0aGVuICcxJyBlbHNlICcwJyApXG4gICAgICAgICMgd2hlbiAnbGlzdCcgICAgICAgdGhlbiB0aHJvdyBuZXcgRXJyb3IgXCJeZGJhQDIzXiB1c2UgYFgoKWAgZm9yIGxpc3RzXCJcbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF92YWx1ZV9lcnJvciAnXmRiYXkvc3FsQDFeJywgdHlwZSwgeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBWRUM6ICggeCApID0+XG4gICAgICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAnXmRiYXkvc3FsQDJeJywgdHlwZSwgeCB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiB4ICkgaXMgJ2xpc3QnXG4gICAgICByZXR1cm4gJyggJyArICggKCBATElUIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4gICAgIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIGludGVycG9sYXRlOiAoIHNxbCwgdmFsdWVzICkgPT5cbiAgICAjICAgaWR4ID0gLTFcbiAgICAjICAgcmV0dXJuIHNxbC5yZXBsYWNlIEBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuLCAoICQwLCBvcGVuZXIsIGZvcm1hdCwgbmFtZSApID0+XG4gICAgIyAgICAgaWR4KytcbiAgICAjICAgICBzd2l0Y2ggb3BlbmVyXG4gICAgIyAgICAgICB3aGVuICckJ1xuICAgICMgICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0IG5hbWVcbiAgICAjICAgICAgICAga2V5ID0gbmFtZVxuICAgICMgICAgICAgd2hlbiAnPydcbiAgICAjICAgICAgICAga2V5ID0gaWR4XG4gICAgIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4gICAgIyAgICAgc3dpdGNoIGZvcm1hdFxuICAgICMgICAgICAgd2hlbiAnJywgJ0knICB0aGVuIHJldHVybiBASSB2YWx1ZVxuICAgICMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuICAgICMgICAgICAgd2hlbiAnVicgICAgICB0aGVuIHJldHVybiBAViB2YWx1ZVxuICAgICMgICAgIHRocm93IG5ldyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gJ15kYmF5L3NxbEAzXicsIGZvcm1hdFxuICAgICMgX2ludGVycG9sYXRpb25fcGF0dGVybjogLyg/PG9wZW5lcj5bJD9dKSg/PGZvcm1hdD4uPyk6KD88bmFtZT5cXHcqKS9nXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZXNxbCA9IG5ldyBFc3FsKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFNRTCA9ICggcGFydHMsIGV4cHJlc3Npb25zLi4uICkgLT5cbiAgICBSID0gcGFydHNbIDAgXVxuICAgIGZvciBleHByZXNzaW9uLCBpZHggaW4gZXhwcmVzc2lvbnNcbiAgICAgIFIgKz0gZXhwcmVzc2lvbi50b1N0cmluZygpICsgcGFydHNbIGlkeCArIDEgXVxuICAgIHJldHVybiBSXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIERicmljXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBjZmc6IE9iamVjdC5mcmVlemVcbiAgICAgIHByZWZpeDogJyhOT1BSRUZJWCknXG4gICAgQGZ1bmN0aW9uczogICB7fVxuICAgIEBzdGF0ZW1lbnRzOiAge31cbiAgICBAYnVpbGQ6ICAgICAgIG51bGxcbiAgICBAZGJfY2xhc3M6ICAgIFNRTElURS5EYXRhYmFzZVN5bmNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyMjIFRBSU5UIHVzZSBub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzICMjI1xuICAgIGNvbnN0cnVjdG9yOiAoIGRiX3BhdGgsIGNmZyApIC0+XG4gICAgICBAX3ZhbGlkYXRlX2lzX3Byb3BlcnR5ICdpc19yZWFkeSdcbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeCdcbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ3ByZWZpeF9yZSdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZGJfcGF0aCAgICAgICAgICAgICAgICAgID89ICc6bWVtb3J5OidcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY2xhc3ogICAgICAgICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgZGJfY2xhc3MgICAgICAgICAgICAgICAgICA9ICggY2ZnPy5kYl9jbGFzcyApID8gY2xhc3ouZGJfY2xhc3NcbiAgICAgIGhpZGUgQCwgJ2RiJywgICAgICAgICAgICAgICBuZXcgZGJfY2xhc3MgZGJfcGF0aFxuICAgICAgIyBAZGIgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IFNRTElURS5EYXRhYmFzZVN5bmMgZGJfcGF0aFxuICAgICAgQGNmZyAgICAgICAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUgeyBjbGFzei5jZmcuLi4sIGRiX3BhdGgsIGNmZy4uLiwgfVxuICAgICAgaGlkZSBALCAnc3RhdGVtZW50cycsICAgICAgIHt9XG4gICAgICBoaWRlIEAsICdfdycsICAgICAgICAgICAgICAgbnVsbFxuICAgICAgaGlkZSBALCAnX3N0YXRlbWVudF9jbGFzcycsICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgMTtcIiApLmNvbnN0cnVjdG9yXG4gICAgICBoaWRlIEAsICdzdGF0ZScsICAgICAgICAgICAgeyBjb2x1bW5zOiBudWxsLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEBydW5fc3RhbmRhcmRfcHJhZ21hcygpXG4gICAgICBAaW5pdGlhbGl6ZSgpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZuX2NmZ190ZW1wbGF0ZSA9IHsgZGV0ZXJtaW5pc3RpYzogdHJ1ZSwgdmFyYXJnczogZmFsc2UsIH1cbiAgICAgIEBfY3JlYXRlX3VkZnMoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIyMgTk9URSBBICdmcmVzaCcgREIgaW5zdGFuY2UgaXMgYSBEQiB0aGF0IHNob3VsZCBiZSAocmUtKWJ1aWx0IGFuZC9vciAocmUtKXBvcHVsYXRlZDsgaW5cbiAgICAgIGNvbnRyYWRpc3RpbmN0aW9uIHRvIGBEYnJpYzo6aXNfcmVhZHlgLCBgRGJyaWM6OmlzX2ZyZXNoYCByZXRhaW5zIGl0cyB2YWx1ZSBmb3IgdGhlIGxpZmV0aW1lIG9mXG4gICAgICB0aGUgaW5zdGFuY2UuICMjI1xuICAgICAgQGlzX2ZyZXNoID0gbm90IEBpc19yZWFkeVxuICAgICAgQGJ1aWxkKClcbiAgICAgIEBfcHJlcGFyZV9zdGF0ZW1lbnRzKClcbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaXNhX3N0YXRlbWVudDogKCB4ICkgLT4geCBpbnN0YW5jZW9mIEBfc3RhdGVtZW50X2NsYXNzXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJ1bl9zdGFuZGFyZF9wcmFnbWFzOiAtPlxuICAgICAgIyMjIG5vdCB1c2luZyBgQGRiLnByYWdtYWAgYXMgaXQgaXMgb25seSBwcm92aWRlZCBieSBgYmV0dGVyLXNxbGl0ZTNgJ3MgREIgY2xhc3MgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGpvdXJuYWxfbW9kZSA9IHdhbDtcIiAgICkucnVuKClcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb247XCIgICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBidXN5X3RpbWVvdXQgPSA2MDAwMDtcIiApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBzdHJpY3QgICAgICAgPSBvbjtcIiAgICApLnJ1bigpICMjIyB0aW1lIGluIG1zICMjI1xuICAgICAgIyBAZGIucHJhZ21hIFNRTFwiam91cm5hbF9tb2RlID0gd2FsXCJcbiAgICAgICMgQGRiLnByYWdtYSBTUUxcImZvcmVpZ25fa2V5cyA9IG9uXCJcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRpYWxpemU6IC0+XG4gICAgICAjIyMgVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgKmJlZm9yZSogYW55IGJ1aWxkIHN0YXRlbWVudHMgYXJlIGV4ZWN1dGVkIGFuZCBiZWZvcmUgYW55IHN0YXRlbWVudHNcbiAgICAgIGluIGBAY29uc3RydWN0b3Iuc3RhdGVtZW50c2AgYXJlIHByZXBhcmVkIGFuZCBpcyBhIGdvb2QgcGxhY2UgdG8gY3JlYXRlIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcbiAgICAgIChVREZzKS4gWW91IHByb2JhYmx5IHdhbnQgdG8gb3ZlcnJpZGUgaXQgd2l0aCBhIG1ldGhvZCB0aGF0IHN0YXJ0cyB3aXRoIGBzdXBlcigpYC4gIyMjXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfdmFsaWRhdGVfaXNfcHJvcGVydHk6ICggbmFtZSApIC0+XG4gICAgICBkZXNjcmlwdG9yID0gZ2V0X3Byb3BlcnR5X2Rlc2NyaXB0b3IgQCwgbmFtZVxuICAgICAgcmV0dXJuIG51bGwgaWYgKCB0eXBlX29mIGRlc2NyaXB0b3IuZ2V0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzUgbm90IGFsbG93ZWQgdG8gb3ZlcnJpZGUgcHJvcGVydHkgI3tycHIgbmFtZX07IHVzZSAnX2dldF8je25hbWV9IGluc3RlYWRcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2RiX29iamVjdHM6IC0+XG4gICAgICBSID0ge31cbiAgICAgIGZvciBkYm8gZnJvbSAoIEBkYi5wcmVwYXJlIFNRTFwic2VsZWN0IG5hbWUsIHR5cGUgZnJvbSBzcWxpdGVfc2NoZW1hXCIgKS5pdGVyYXRlKClcbiAgICAgICAgUlsgZGJvLm5hbWUgXSA9IHsgbmFtZTogZGJvLm5hbWUsIHR5cGU6IGRiby50eXBlLCB9XG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZWFyZG93bjogKHsgdGVzdCA9IG51bGwsIH09e30pIC0+XG4gICAgICBjb3VudCAgICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgd2hlbiB0ZXN0IGlzICcqJ1xuICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiB0cnVlXG4gICAgICAgIHdoZW4gKCB0eXBlX29mIHRlc3QgKSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgbnVsbFxuICAgICAgICB3aGVuIG5vdCB0ZXN0P1xuICAgICAgICAgIHByZWZpeF9yZSA9IEBwcmVmaXhfcmVcbiAgICAgICAgICB0ZXN0ID0gKCBuYW1lICkgLT4gcHJlZml4X3JlLnRlc3QgbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdHlwZSA9IHR5cGVfb2YgdGVzdFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX182IGV4cGVjdGVkIGAnKidgLCBhIFJlZ0V4cCwgYSBmdW5jdGlvbiwgbnVsbCBvciB1bmRlZmluZWQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAoIEBwcmVwYXJlIFNRTFwicHJhZ21hIGZvcmVpZ25fa2V5cyA9IG9mZjtcIiApLnJ1bigpXG4gICAgICBmb3IgXywgeyBuYW1lLCB0eXBlLCB9IG9mIEBfZ2V0X2RiX29iamVjdHMoKVxuICAgICAgICBjb250aW51ZSB1bmxlc3MgdGVzdCBuYW1lXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgdHJ5XG4gICAgICAgICAgKCBAcHJlcGFyZSBTUUxcImRyb3AgI3t0eXBlfSAje2VzcWwuSUROIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlYnVpbGQ6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKCkgdW5sZXNzIGhhc190b3JuX2Rvd25cbiAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgeyBlcnJvcl9jb3VudCxcbiAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfdzogLT5cbiAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGgsIHsgZGJfY2xhc3M6IEBkYi5jb25zdHJ1Y3RvciwgfVxuICAgICAgcmV0dXJuIEBfd1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2Z1bmN0aW9uX25hbWVzOiAtPiBuZXcgU2V0ICggbmFtZSBmb3IgeyBuYW1lLCB9IGZyb20gXFxcbiAgICAgIEB3YWxrIFNRTFwic2VsZWN0IG5hbWUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpIG9yZGVyIGJ5IG5hbWU7XCIgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X29iamVjdHNfaW5fYnVpbGRfc3RhdGVtZW50czogLT5cbiAgICAgICMjIyBUQUlOVCBkb2VzIG5vdCB5ZXQgZGVhbCB3aXRoIHF1b3RlZCBuYW1lcyAjIyNcbiAgICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgZGJfb2JqZWN0cyAgICAgID0ge31cbiAgICAgIHN0YXRlbWVudF9jb3VudCA9IDBcbiAgICAgIGVycm9yX2NvdW50ICAgICA9IDBcbiAgICAgIGZvciBzdGF0ZW1lbnQgaW4gY2xhc3ouYnVpbGQgPyBbXVxuICAgICAgICBzdGF0ZW1lbnRfY291bnQrK1xuICAgICAgICBpZiAoIG1hdGNoID0gc3RhdGVtZW50Lm1hdGNoIGJ1aWxkX3N0YXRlbWVudF9yZSApP1xuICAgICAgICAgIHsgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsIH0gICAgICAgICAgID0gbWF0Y2guZ3JvdXBzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/ICMjIyBOT1RFIGlnbm9yZSBzdGF0ZW1lbnRzIGxpa2UgYGluc2VydGAgIyMjXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IGVzcWwudW5xdW90ZV9uYW1lIG5hbWVcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcl9jb3VudCsrXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgICA9IFwiZXJyb3JfI3tzdGF0ZW1lbnRfY291bnR9XCJcbiAgICAgICAgICB0eXBlICAgICAgICAgICAgICAgID0gJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2UgICAgICAgICAgICAgPSBcIm5vbi1jb25mb3JtYW50IHN0YXRlbWVudDogI3tycHIgc3RhdGVtZW50fVwiXG4gICAgICAgICAgZGJfb2JqZWN0c1sgbmFtZSBdICA9IHsgbmFtZSwgdHlwZSwgbWVzc2FnZSwgfVxuICAgICAgcmV0dXJuIHsgZXJyb3JfY291bnQsIHN0YXRlbWVudF9jb3VudCwgZGJfb2JqZWN0cywgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfcHJlcGFyZV9zdGF0ZW1lbnRzOiAtPlxuICAgICAgIyAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIGZvciBuYW1lLCBzcWwgb2YgY2xhc3ouc3RhdGVtZW50c1xuICAgICAgIyAgIHN3aXRjaCB0cnVlXG4gICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnY3JlYXRlX3RhYmxlXydcbiAgICAgICMgICAgICAgbnVsbFxuICAgICAgIyAgICAgd2hlbiBuYW1lLnN0YXJ0c1dpdGggJ2luc2VydF8nXG4gICAgICAjICAgICAgIG51bGxcbiAgICAgICMgICAgIGVsc2VcbiAgICAgICMgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlucWxfXzEwIHVuYWJsZSB0byBwYXJzZSBzdGF0ZW1lbnQgbmFtZSAje3JwciBuYW1lfVwiXG4gICAgICAjICMgICBAWyBuYW1lIF0gPSBAcHJlcGFyZSBzcWxcbiAgICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgICBzdGF0ZW1lbnRzX2xpc3QgPSAoIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluIGNsYXN6LCAnc3RhdGVtZW50cycgKS5yZXZlcnNlKClcbiAgICAgIGZvciBzdGF0ZW1lbnRzIGluIHN0YXRlbWVudHNfbGlzdFxuICAgICAgICBmb3Igc3RhdGVtZW50X25hbWUsIHN0YXRlbWVudCBvZiBzdGF0ZW1lbnRzXG4gICAgICAgICAgaWYgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0/XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMSBzdGF0ZW1lbnQgI3tycHIgc3RhdGVtZW50X25hbWV9IGlzIGFscmVhZHkgZGVjbGFyZWRcIlxuICAgICAgICAgICMgaWYgKCB0eXBlX29mIHN0YXRlbWVudCApIGlzICdsaXN0J1xuICAgICAgICAgICMgICBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXSA9ICggQHByZXBhcmUgc3ViX3N0YXRlbWVudCBmb3Igc3ViX3N0YXRlbWVudCBpbiBzdGF0ZW1lbnQgKVxuICAgICAgICAgICMgICBjb250aW51ZVxuICAgICAgICAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gQHByZXBhcmUgc3RhdGVtZW50XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBleGVjdXRlOiAoIHNxbCApIC0+IEBkYi5leGVjIHNxbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrOiAgICAgICAoIHNxbCwgUC4uLiApIC0+ICggQHByZXBhcmUgc3FsICkuaXRlcmF0ZSBQLi4uXG4gICAgZ2V0X2FsbDogICAgKCBzcWwsIFAuLi4gKSAtPiBbICggQHdhbGsgc3FsLCBQLi4uICkuLi4sIF1cbiAgICBnZXRfZmlyc3Q6ICAoIHNxbCwgUC4uLiApIC0+ICggQGdldF9hbGwgc3FsLCBQLi4uIClbIDAgXSA/IG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHJlcGFyZTogKCBzcWwgKSAtPlxuICAgICAgcmV0dXJuIHNxbCBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNxbCApIGlzICd0ZXh0J1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xMiBleHBlY3RlZCBhIHN0YXRlbWVudCBvciBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgICAgdHJ5XG4gICAgICAgIFIgPSBAZGIucHJlcGFyZSBzcWxcbiAgICAgIGNhdGNoIGNhdXNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEzIHdoZW4gdHJ5aW5nIHRvIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdGF0ZW1lbnQsIGFuIGVycm9yIHdpdGggbWVzc2FnZTogI3tycHIgY2F1c2UubWVzc2FnZX0gd2FzIHRocm93bjogI3tycHIgc3FsfVwiLCB7IGNhdXNlLCB9XG4gICAgICBAc3RhdGUuY29sdW1ucyA9ICggdHJ5IFI/LmNvbHVtbnM/KCkgY2F0Y2ggZXJyb3IgdGhlbiBudWxsICkgPyBbXVxuICAgICAgcmV0dXJuIFJcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyBGVU5DVElPTlNcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9jcmVhdGVfdWRmczogLT5cbiAgICAgIGNsYXN6ICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgICMjIyBUQUlOVCBzaG91bGQgYmUgcHV0IHNvbWV3aGVyZSBlbHNlPyAjIyNcbiAgICAgIG5hbWVzX29mX2NhbGxhYmxlcyAgPVxuICAgICAgICBmdW5jdGlvbjogICAgICAgICAgICAgWyAndmFsdWUnLCBdXG4gICAgICAgIGFnZ3JlZ2F0ZV9mdW5jdGlvbjogICBbICdzdGFydCcsICdzdGVwJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgd2luZG93X2Z1bmN0aW9uOiAgICAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAnaW52ZXJzZScsICdyZXN1bHQnLCBdXG4gICAgICAgIHRhYmxlX2Z1bmN0aW9uOiAgICAgICBbICdyb3dzJywgXVxuICAgICAgICB2aXJ0dWFsX3RhYmxlOiAgICAgICAgWyAncm93cycsIF1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNhdGVnb3J5IGluIFsgJ2Z1bmN0aW9uJywgXFxcbiAgICAgICAgJ2FnZ3JlZ2F0ZV9mdW5jdGlvbicsICd3aW5kb3dfZnVuY3Rpb24nLCAndGFibGVfZnVuY3Rpb24nLCAndmlydHVhbF90YWJsZScsIF1cbiAgICAgICAgcHJvcGVydHlfbmFtZSAgICAgPSBcIiN7Y2F0ZWdvcnl9c1wiXG4gICAgICAgIG1ldGhvZF9uYW1lICAgICAgID0gXCJjcmVhdGVfI3tjYXRlZ29yeX1cIlxuICAgICAgICBkZWNsYXJhdGlvbnNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osIHByb3BlcnR5X25hbWUgKS5yZXZlcnNlKClcbiAgICAgICAgZm9yIGRlY2xhcmF0aW9ucyBpbiBkZWNsYXJhdGlvbnNfbGlzdFxuICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBkZWNsYXJhdGlvbnM/XG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICBmb3IgdWRmX25hbWUsIGZuX2NmZyBvZiBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgZm5fY2ZnID0gbGV0cyBmbl9jZmcsICggZCApID0+XG4gICAgICAgICAgICAgIGQubmFtZSA/PSB1ZGZfbmFtZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgICMjIyBiaW5kIFVERnMgdG8gYHRoaXNgICMjI1xuICAgICAgICAgICAgICBmb3IgbmFtZV9vZl9jYWxsYWJsZSBpbiBuYW1lc19vZl9jYWxsYWJsZXNbIGNhdGVnb3J5IF1cbiAgICAgICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKCBjYWxsYWJsZSA9IGRbIG5hbWVfb2ZfY2FsbGFibGUgXSApP1xuICAgICAgICAgICAgICAgIGRbIG5hbWVfb2ZfY2FsbGFibGUgXSA9IGNhbGxhYmxlLmJpbmQgQFxuICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgQFsgbWV0aG9kX25hbWUgXSBmbl9jZmdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmZ1bmN0aW9uICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzE0IERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTUgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmZ1bmN0aW9uIG5hbWUsIHsgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfSwgdmFsdWVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX2FnZ3JlZ2F0ZV9mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTYgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgYWdncmVnYXRlIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTcgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3dpbmRvd19mdW5jdGlvbjogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi5hZ2dyZWdhdGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTggREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgd2luZG93IGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0ZXAsXG4gICAgICAgIGludmVyc2UsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTkgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLmFnZ3JlZ2F0ZSBuYW1lLCB7IHN0YXJ0LCBzdGVwLCBpbnZlcnNlLCByZXN1bHQsIGRldGVybWluaXN0aWMsIHZhcmFyZ3MsIGRpcmVjdE9ubHksIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIwIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdGFibGUtdmFsdWVkIHVzZXItZGVmaW5lZCBmdW5jdGlvbnNcIlxuICAgICAgeyBuYW1lLFxuICAgICAgICBvdmVyd3JpdGUsXG4gICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIHJvd3MsXG4gICAgICAgIGRpcmVjdE9ubHksXG4gICAgICAgIGRldGVybWluaXN0aWMsXG4gICAgICAgIHZhcmFyZ3MsICAgICAgICB9ID0geyB0ZW1wbGF0ZXMuY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjEgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIHsgcGFyYW1ldGVycywgY29sdW1ucywgcm93cywgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZTogKCBjZmcgKSAtPlxuICAgICAgaWYgKCB0eXBlX29mIEBkYi50YWJsZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB2aXJ0dWFsIHRhYmxlc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgY3JlYXRlLCAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdmlydHVhbF90YWJsZV9jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgaWYgKCBub3Qgb3ZlcndyaXRlICkgYW5kICggQF9mdW5jdGlvbl9uYW1lcy5oYXMgbmFtZSApXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIzIGEgVURGIG9yIGJ1aWx0LWluIGZ1bmN0aW9uIG5hbWVkICN7cnByIG5hbWV9IGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWRcIlxuICAgICAgcmV0dXJuIEBkYi50YWJsZSBuYW1lLCBjcmVhdGVcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNfc3RkIGV4dGVuZHMgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgcHJlZml4OiAnc3RkJ1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlZ2V4cDpcbiAgICAgICAgdmFsdWU6ICggcGF0dGVybiwgdGV4dCApIC0+IGlmICggKCBuZXcgUmVnRXhwIHBhdHRlcm4sICd2JyApLnRlc3QgdGV4dCApIHRoZW4gMSBlbHNlIDBcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfaXNfdWNfbm9ybWFsOlxuICAgICAgICAjIyMgTk9URTogYWxzbyBzZWUgYFN0cmluZzo6aXNXZWxsRm9ybWVkKClgICMjI1xuICAgICAgICB2YWx1ZTogKCB0ZXh0LCBmb3JtID0gJ05GQycgKSAtPiBmcm9tX2Jvb2wgdGV4dCBpcyB0ZXh0Lm5vcm1hbGl6ZSBmb3JtICMjIyAnTkZDJywgJ05GRCcsICdORktDJywgb3IgJ05GS0QnICMjI1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9nZXRfbmV4dF9pbl9zZXF1ZW5jZTpcbiAgICAgICAgdmFsdWU6ICggbmFtZSApIC0+XG4gICAgICAgICAgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH0gPSBAdy5nZXRfZmlyc3QgU1FMXCJcIlwiXG4gICAgICAgICAgICB1cGRhdGUgXCJzdGRfc2VxdWVuY2VzXCJcbiAgICAgICAgICAgICAgc2V0IHZhbHVlID0gdmFsdWUgKyBkZWx0YVxuICAgICAgICAgICAgICB3aGVyZSBuYW1lID0gJG5hbWVcbiAgICAgICAgICAgIHJldHVybmluZyAqO1wiXCJcIiwgeyBuYW1lLCB9XG4gICAgICAgICAgZGVidWcgJ86pZGJyaWNfXzExJywgeyBuYW1lLCB2YWx1ZSwgZGVsdGEsIH1cbiAgICAgICAgICByZXR1cm4gdmFsdWVcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGRfZ2VuZXJhdGVfc2VyaWVzOlxuICAgICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICAgICBwYXJhbWV0ZXJzOiAgIFsgJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCcsIF1cbiAgICAgICAgIyMjIE5PVEUgZGVmYXVsdHMgYW5kIGJlaGF2aW9yIGFzIHBlciBodHRwczovL3NxbGl0ZS5vcmcvc2VyaWVzLmh0bWwjb3ZlcnZpZXcgIyMjXG4gICAgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgICAgICAgc3RlcCAgPSAxIGlmIHN0ZXAgaXMgMCAjIyMgTk9URSBlcXVpdmFsZW50IGAoIE9iamVjdC5pcyBzdGVwLCArMCApIG9yICggT2JqZWN0LmlzIHN0ZXAsIC0wICkgIyMjXG4gICAgICAgICAgdmFsdWUgPSBzdGFydFxuICAgICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIHN0ZXAgPiAwIHRoZW4gIGJyZWFrIGlmIHZhbHVlID4gc3RvcFxuICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgYnJlYWsgaWYgdmFsdWUgPCBzdG9wXG4gICAgICAgICAgICB5aWVsZCB7IHZhbHVlLCB9XG4gICAgICAgICAgICB2YWx1ZSArPSBzdGVwXG4gICAgICAgICAgO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG4gICAgICBzdGRfZ2V0X3NjaGVtYTogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYTtcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdGFibGVzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3RhYmxlJztcIlwiXCJcbiAgICAgIHN0ZF9nZXRfdmlld3M6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3JlbGF0aW9uczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBzZWxlY3QgbmFtZSwgYnVpbHRpbiwgdHlwZSBmcm9tIHByYWdtYV9mdW5jdGlvbl9saXN0KCkgIyMjXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBidWlsZDogW1xuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3RhYmxlcyBhc1xuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBzdGRfdmlld3MgYXNcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgd2hlcmUgdHlwZSBpcyAndmlldyc7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdmlldyBcInN0ZF9yZWxhdGlvbnNcIiBhc1xuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWFcbiAgICAgICAgICB3aGVyZSB0eXBlIGluICggJ3RhYmxlJywgJ3ZpZXcnICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgXCJzdGRfdmFyaWFibGVzXCIgKFxuICAgICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICB2YWx1ZSAgICAganNvbiAgICAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAnbnVsbCcsXG4gICAgICAgIHByaW1hcnkga2V5ICggbmFtZSApICk7XCJcIlwiXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgXCJzdGRfc2VxdWVuY2VzXCIgKFxuICAgICAgICAgIG5hbWUgICAgICB0ZXh0ICAgICAgdW5pcXVlICBub3QgbnVsbCxcbiAgICAgICAgICB2YWx1ZSAgICAgaW50ZWdlciAgICAgICAgICAgbm90IG51bGwgZGVmYXVsdCAwLFxuICAgICAgICAgIGRlbHRhICAgICBpbnRlZ2VyICAgICAgICAgICBub3QgbnVsbCBkZWZhdWx0ICsxLFxuICAgICAgICBwcmltYXJ5IGtleSAoIG5hbWUgKVxuICAgICAgICBjb25zdHJhaW50IFwizqljb25zdHJhaW50XzIzXCIgY2hlY2sgKCBkZWx0YSAhPSAwIClcbiAgICAgICAgKTtcIlwiXCJcbiAgICAgIFNRTFwiXCJcImluc2VydCBpbnRvIFwic3RkX3NlcXVlbmNlc1wiICggbmFtZSwgdmFsdWUsIGRlbHRhICkgdmFsdWVzXG4gICAgICAgICggJ3NlcTpnbG9iYWw6cm93aWQnLCAwLCArMSApXG4gICAgICAgIDtcIlwiXCJcbiAgICAgIF1cblxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICByZXR1cm4gZXhwb3J0cyA9IHtcbiAgICBEYnJpYyxcbiAgICBEYnJpY19zdGQsXG4gICAgZXNxbCxcbiAgICBTUUwsXG4gICAgVHJ1ZSxcbiAgICBGYWxzZSxcbiAgICBmcm9tX2Jvb2wsXG4gICAgYXNfYm9vbCxcbiAgICBpbnRlcm5hbHM6IE9iamVjdC5mcmVlemUgeyB0eXBlX29mLCBidWlsZF9zdGF0ZW1lbnRfcmUsIHRlbXBsYXRlcywgfVxuICAgIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHsgcmVxdWlyZV9kYnJpYywgcmVxdWlyZV9kYnJpY19lcnJvcnMsIH1cblxuIl19
