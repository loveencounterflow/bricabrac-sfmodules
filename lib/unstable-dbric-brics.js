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
    var Dbric, Dbric_rng, Dbric_std, E, Esql, SFMODULES, SQL, SQLITE, Undumper, as_bool, create_statement_re, debug, esql, exports, freeze, from_bool, get_all_in_prototype_chain, get_property_descriptor, get_prototype_chain, hide, lets, misfit, rpr, set_getter, templates, type_of, warn;
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
    create_statement_re = /^\s*(create|alter)\s+(?<type>table|view|index|trigger)\s+(?<name>\S+)\s+/is;
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
              (this.prepare(SQL`drop ${type} ${esql.I(name)};`)).run();
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
          this._w = new this.constructor(this.cfg.db_path);
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
          var clasz, db_objects, error_count, i, len, match, message, name, ref1, ref2, statement, statement_count, type;
          clasz = this.constructor;
          db_objects = {};
          statement_count = 0;
          error_count = 0;
          ref2 = (ref1 = clasz.build) != null ? ref1 : [];
          for (i = 0, len = ref2.length; i < len; i++) {
            statement = ref2[i];
            statement_count++;
            if ((match = statement.match(create_statement_re)) != null) {
              ({name, type} = match.groups);
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
        }
      };

      //=======================================================================================================
      Dbric_std./* 'NFC', 'NFD', 'NFKC', or 'NFKD' */table_functions = {
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
  where type in ( 'table', 'view' );`
      ];

      return Dbric_std;

    }).call(this);
    Dbric_rng = (function() {
      //=========================================================================================================
      class Dbric_rng extends Dbric_std {
        //=======================================================================================================
        /* TAINT use normalize-function-arguments */
        // SQL"""create trigger rng_ranges_insert
        //   before insert on rng_ranges
        //   for each row begin
        //     select rng_trigger_on_add_range(  );
        //     end;"""
        rng_add_range(row) {
          /* TAINT must delete all `undefined` values */
          var data, key, keys, ref1;
          if (row.hi == null) {
            row.hi = row.lo;
          }
          if (row.lo == null) {
            row.lo = row.hi;
          }
          data = (ref1 = row.data) != null ? ref1 : {};
          if ((type_of(data)) !== 'text') {
            keys = (Object.keys(data)).sort();
            data = JSON.stringify(Object.fromEntries((function() {
              var i, len, results;
              results = [];
              for (i = 0, len = keys.length; i < len; i++) {
                key = keys[i];
                results.push([key, data[key]]);
              }
              return results;
            })()));
          }
          if (this.statements.rng_has_ranges.get().has_ranges) {
            debug('Ωdbric__28', "has range(s)");
          } else {
            debug('Ωdbric__29', "has no range(s)");
          }
          // unless row.lo is ro.hi
          // debug 'Ωdbric__30', @statements.rng_get_range.get { n: row.lo, }
          // debug 'Ωdbric__31', @statements.rng_get_range.get { n: row.hi, }
          return this.statements.rng_add_range.run({...row, data});
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Dbric_rng.cfg = Object.freeze({
        prefix: 'rng'
      });

      //=======================================================================================================
      Dbric_rng.functions = {
        //-----------------------------------------------------------------------------------------------------
        rng_validate_lo: {
          value: function(lo) {
            if (!Number.isFinite(lo)) {
              return False;
            }
            return True;
          }
        },
        //-----------------------------------------------------------------------------------------------------
        rng_validate_hi: {
          value: function(hi) {
            if (!Number.isFinite(hi)) {
              return False;
            }
            return True;
          }
        },
        //-----------------------------------------------------------------------------------------------------
        rng_validate_lohi: {
          value: function(lo, hi) {
            if (!(lo <= hi)) {
              return False;
            }
            return True;
          }
        }
      };

      // #=====================================================================================================
      // @table_functions:

      //   #---------------------------------------------------------------------------------------------------
      //   rng_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:
      //     columns:      [ 'value', ]
      //     parameters:   [ 'start', 'stop', 'step', ]
      //     rows: ( start, stop = 4_294_967_295, step = 1 ) ->
      //       yield return null
      //       ;null

      //=======================================================================================================
      Dbric_rng.statements = {
        //-----------------------------------------------------------------------------------------------------
        rng_add_range: SQL`insert into rng_ranges ( lo, hi, data ) values ( $lo, $hi, $data );`,
        rng_all_ranges: SQL`select * from rng_ranges order by lo;`,
        rng_get_range: SQL`select * from rng_ranges where $n between lo and hi;`,
        rng_has_ranges: SQL`select exists ( select lo from rng_ranges limit 1 ) as has_ranges;`
      };

      //-------------------------------------------------------------------------------------------------------
      Dbric_rng.build = [
        SQL`create table rng_ranges (
  -- id      integer not null primary key autoincrement,
  lo      integer unique  not null,
  hi      integer unique  not null,
  data    jsonb           not null,
primary key ( lo ), -- or ( lo, hi ) ?
constraint "Ωrng_validate_lo__24"   check ( rng_validate_lo( lo ) )
constraint "Ωrng_validate_hi__25"   check ( rng_validate_hi( hi ) )
constraint "Ωrng_validate_lohi__26" check ( rng_validate_lohi( lo, hi ) )
);`
      ];

      return Dbric_rng;

    }).call(this);
    //=========================================================================================================
    return exports = {
      Dbric,
      Dbric_std,
      Dbric_rng,
      esql,
      SQL,
      True,
      False,
      from_bool,
      as_bool,
      internals: Object.freeze({type_of, create_statement_re, templates})
    };
  };

  //===========================================================================================================
  Object.assign(module.exports, {require_dbric, require_dbric_errors});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWRicmljLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxhQUFBLEVBQUEsb0JBQUE7Ozs7OztFQU1BLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0FBRXZCLFFBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQztJQUNBLENBQUEsR0FBa0MsQ0FBQSxFQURwQzs7SUFJUSxDQUFDLENBQUMsY0FBUixNQUFBLFlBQUEsUUFBNEIsTUFBNUI7TUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTthQUNYLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFZLENBQUEsQ0FBQSxDQUFHLEdBQUgsQ0FBQSxFQUFBLENBQUEsQ0FBVyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQXhCLENBQUEsRUFBQSxDQUFBLENBQWlDLE9BQWpDLENBQUE7UUFDWixJQUFDLENBQUEsR0FBRCxHQUFZO0FBQ1osZUFBTyxNQUFVO01BSk47O0lBRGYsRUFKRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0NRLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTthQUF3QixDQUFNLEdBQU4sRUFBVyxDQUFBLG9CQUFBLENBQUEsQ0FBdUIsSUFBdkIsQ0FBQSxxQkFBQSxDQUFBLENBQW1ELEdBQUEsQ0FBSSxLQUFKLENBQW5ELENBQUEsQ0FBWDtNQUF4Qjs7SUFEZjtJQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtNQUNFLFdBQWEs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Z0IsR0FBRyxDQUFBLG1FQUFBLENBQW5CO1FBQ0EsY0FBQSxFQUFnQixHQUFHLENBQUEscUNBQUEsQ0FEbkI7UUFFQSxhQUFBLEVBQWdCLEdBQUcsQ0FBQSxvREFBQSxDQUZuQjtRQUdBLGNBQUEsRUFBZ0IsR0FBRyxDQUFBLGtFQUFBO01BSG5COzs7TUFNRixTQUFDLENBQUEsS0FBRCxHQUFRO1FBQ04sR0FBRyxDQUFBOzs7Ozs7Ozs7RUFBQSxDQURHOzs7OztrQkF4bUJaOztBQThvQkUsV0FBTyxPQUFBLEdBQVU7TUFDZixLQURlO01BRWYsU0FGZTtNQUdmLFNBSGU7TUFJZixJQUplO01BS2YsR0FMZTtNQU1mLElBTmU7TUFPZixLQVBlO01BUWYsU0FSZTtNQVNmLE9BVGU7TUFVZixTQUFBLEVBQVcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLE9BQUYsRUFBVyxtQkFBWCxFQUFnQyxTQUFoQyxDQUFkO0lBVkk7RUFocEJILEVBaEdoQjs7O0VBK3ZCQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFFLGFBQUYsRUFBaUIsb0JBQWpCLENBQTlCO0FBL3ZCQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbnJlcXVpcmVfZGJyaWNfZXJyb3JzID0gLT5cblxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICBFICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNsYXNzIEUuRGJyaWNfZXJyb3IgZXh0ZW5kcyBFcnJvclxuICAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApIC0+XG4gICAgICBzdXBlcigpXG4gICAgICBAbWVzc2FnZSAgPSBcIiN7cmVmfSAoI3tAY29uc3RydWN0b3IubmFtZX0pICN7bWVzc2FnZX1cIlxuICAgICAgQHJlZiAgICAgID0gcmVmXG4gICAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIGNsYXNzIEUuRGJyaWNfY2ZnX2Vycm9yICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiAgIyBjbGFzcyBFLkRicmljX2ludGVybmFsX2Vycm9yICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfZXhpc3RzICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBhbHJlYWR5IGV4aXN0c1wiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBkb2VzIG5vdCBleGlzdFwiXG4gICMgY2xhc3MgRS5EYnJpY19vYmplY3RfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEsIG5hbWUgKS0+IHN1cGVyIHJlZiwgXCJvYmplY3QgI3tycHIgc2NoZW1hICsgJy4nICsgbmFtZX0gZG9lcyBub3QgZXhpc3RcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vbmVtcHR5ICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gaXNuJ3QgZW1wdHlcIlxuICAjIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vdF9hbGxvd2VkICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gbm90IGFsbG93ZWQgaGVyZVwiXG4gICMgY2xhc3MgRS5EYnJpY19zY2hlbWFfcmVwZWF0ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gY29weSBzY2hlbWEgdG8gaXRzZWxmLCBnb3QgI3tycHIgc2NoZW1hfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfcm93ICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCByb3dfY291bnQgKSAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAxIHJvdywgZ290ICN7cm93X2NvdW50fVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfdmFsdWUgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGtleXMgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHJvdyB3aXRoIHNpbmdsZSBmaWVsZCwgZ290IGZpZWxkcyAje3JwciBrZXlzfVwiXG4gICMgY2xhc3MgRS5EYnJpY19leHRlbnNpb25fdW5rbm93biAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHRlbnNpb24gb2YgcGF0aCAje3BhdGh9IGlzIG5vdCByZWdpc3RlcmVkIGZvciBhbnkgZm9ybWF0XCJcbiAgIyBjbGFzcyBFLkRicmljX25vdF9pbXBsZW1lbnRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaXNuJ3QgaW1wbGVtZW50ZWQgKHlldClcIlxuICAjIGNsYXNzIEUuRGJyaWNfZGVwcmVjYXRlZCAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBoYXMgYmVlbiBkZXByZWNhdGVkXCJcbiAgIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfZGJfb2JqZWN0X3R5cGUgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcIsK1NzY5IHVua25vd24gdHlwZSAje3JwciB0eXBlfSBvZiBEQiBvYmplY3QgI3tkfVwiXG4gIGNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBleHByZXNzIGEgI3t0eXBlfSBhcyBTUUwgbGl0ZXJhbCwgZ290ICN7cnByIHZhbHVlfVwiXG4gIGNsYXNzIEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG4gICMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX3NxbCAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzcWwgKSAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmV4cGVjdGVkIFNRTCBzdHJpbmcgI3tycHIgc3FsfVwiXG4gICMgY2xhc3MgRS5EYnJpY19zcWxpdGVfdG9vX21hbnlfZGJzICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gYXR0YWNoIHNjaGVtYSAje3JwciBzY2hlbWF9OiB0b28gbWFueSBhdHRhY2hlZCBkYXRhYmFzZXNcIlxuICAjIGNsYXNzIEUuRGJyaWNfc3FsaXRlX2Vycm9yICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZXJyb3IgKSAgICAgICAtPiBzdXBlciByZWYsIFwiI3tlcnJvci5jb2RlID8gJ1NRTGl0ZSBlcnJvcid9OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2FyZ3VtZW50c19hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIGFyaXR5ICkgLT4gc3VwZXIgcmVmLCBcIm1ldGhvZCAje3JwciBuYW1lfSBkb2Vzbid0IHRha2UgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbm90X2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiYXJndW1lbnQgI3tycHIgbmFtZX0gbm90IGFsbG93ZWQsIGdvdCAje3JwciB2YWx1ZX1cIlxuICAjIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbWlzc2luZyAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgdmFsdWUgZm9yICN7cnByIG5hbWV9LCBnb3Qgbm90aGluZ1wiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ190eXBlICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlcywgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAje3R5cGVzfSwgZ290IGEgI3t0eXBlfVwiXG4gICMgY2xhc3MgRS5EYnJpY193cm9uZ19hcml0eSAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBtaW4sIG1heCwgZm91bmQgKSAtPiBzdXBlciByZWYsIFwiI3tycHIgbmFtZX0gZXhwZWN0ZWQgYmV0d2VlbiAje21pbn0gYW5kICN7bWF4fSBhcmd1bWVudHMsIGdvdCAje2ZvdW5kfVwiXG4gICMgY2xhc3MgRS5EYnJpY19lbXB0eV9jc3YgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJubyBDU1YgcmVjb3JkcyBmb3VuZCBpbiBmaWxlICN7cGF0aH1cIlxuICAjIGNsYXNzIEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biBpbnRlcnBvbGF0aW9uIGZvcm1hdCAje3JwciBmb3JtYXR9XCJcbiAgIyBjbGFzcyBFLkRicmljX25vX25lc3RlZF90cmFuc2FjdGlvbnMgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBzdGFydCBhIHRyYW5zYWN0aW9uIHdpdGhpbiBhIHRyYW5zYWN0aW9uXCJcbiAgIyBjbGFzcyBFLkRicmljX25vX2RlZmVycmVkX2Zrc19pbl90eCAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gICMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBkZWZlciBmb3JlaWduIGtleXMgaW5zaWRlIGEgdHJhbnNhY3Rpb25cIlxuICAjIGNsYXNzIEUuRGJyaWNfdW5rbm93bl92YXJpYWJsZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG4gICMgY2xhc3MgRS5EYnJpY19pbnZhbGlkX3RpbWVzdGFtcCAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCB4ICkgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJub3QgYSB2YWxpZCBEYnJpYyB0aW1lc3RhbXA6ICN7cnByIHh9XCJcblxuICAjICMjIyBUQUlOVCByZXBsYWNlIHdpdGggbW9yZSBzcGVjaWZpYyBlcnJvciwgbGlrZSBiZWxvdyAjIyNcbiAgIyBjbGFzcyBFLkRicmljX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICAjICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuICAjICAgICBzdXBlciByZWYsIFwidW5rbm93biBEQiBmb3JtYXQgI3tyZWYgZm9ybWF0fVwiXG5cbiAgIyBjbGFzcyBFLkRicmljX2ltcG9ydF9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiAgIyAgICAgZm9ybWF0cyA9IFsgKCByZXF1aXJlICcuL3R5cGVzJyApLl9pbXBvcnRfZm9ybWF0cy4uLiwgXS5qb2luICcsICdcbiAgIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gaW1wb3J0IGZvcm1hdCAje3JwciBmb3JtYXR9IChrbm93biBmb3JtYXRzIGFyZSAje2Zvcm1hdHN9KVwiXG5cbiAgcmV0dXJuIGV4cG9ydHMgPSBFXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xucmVxdWlyZV9kYnJpYyA9IC0+XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBTRk1PRFVMRVMgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tYWluJ1xuICB7IGhpZGUsXG4gICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwciwgICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL2xvdXBlLWJyaWNzJyApLnJlcXVpcmVfbG91cGUoKVxuICAjIHsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgIyB7IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbmFtZWl0KClcbiAgIyB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgbGV0cyxcbiAgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gIFNRTElURSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgeyBkZWJ1ZyxcbiAgICB3YXJuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiAgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICB7IGdldF9wcm90b3R5cGVfY2hhaW4sXG4gICAgZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4sIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcHJvdG90eXBlX2NoYWluKClcbiAgeyBVbmR1bXBlciwgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2NvYXJzZV9zcWxpdGVfc3RhdGVtZW50X3NlZ21lbnRlcigpXG4gIEUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlX2RicmljX2Vycm9ycygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIyMgVEFJTlQgcHV0IGludG8gc2VwYXJhdGUgbW9kdWxlICMjI1xuICAjIyMgVEFJTlQgcmV3cml0ZSB3aXRoIGBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbigpYCAjIyNcbiAgIyMjIFRBSU5UIHJld3JpdGUgYXMgYGdldF9maXJzdF9kZXNjcmlwdG9yX2luX3Byb3RvdHlwZV9jaGFpbigpYCwgYGdldF9maXJzdF9pbl9wcm90b3R5cGVfY2hhaW4oKWAgIyMjXG4gIGdldF9wcm9wZXJ0eV9kZXNjcmlwdG9yID0gKCB4LCBuYW1lLCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgd2hpbGUgeD9cbiAgICAgIHJldHVybiBSIGlmICggUiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgeCwgbmFtZSApP1xuICAgICAgeCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB4XG4gICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJ1bmFibGUgdG8gZmluZCBkZXNjcmlwdG9yIGZvciBwcm9wZXJ0eSAje1N0cmluZyhuYW1lKX0gbm90IGZvdW5kIG9uIG9iamVjdCBvciBpdHMgcHJvdG90eXBlc1wiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjcmVhdGVfc3RhdGVtZW50X3JlID0gLy8vXG4gICAgXiBcXHMqXG4gICAgKCBjcmVhdGUgfCBhbHRlciApIFxccytcbiAgICAoPzx0eXBlPiB0YWJsZSB8IHZpZXcgfCBpbmRleCB8IHRyaWdnZXIgKSBcXHMrXG4gICAgKD88bmFtZT4gXFxTKyApIFxccytcbiAgICAvLy9pc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGVtcGxhdGVzID1cbiAgICBjcmVhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBvdmVyd3JpdGU6ICAgICAgZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnOlxuICAgICAgZGV0ZXJtaW5pc3RpYzogIHRydWVcbiAgICAgIHZhcmFyZ3M6ICAgICAgICBmYWxzZVxuICAgICAgZGlyZWN0T25seTogICAgIGZhbHNlXG4gICAgICBzdGFydDogICAgICAgICAgbnVsbFxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgc3RhcnQ6ICAgICAgICAgIG51bGxcbiAgICAgIG92ZXJ3cml0ZTogICAgICBmYWxzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY3JlYXRlX3RhYmxlX2Z1bmN0aW9uX2NmZzpcbiAgICAgIGRldGVybWluaXN0aWM6ICB0cnVlXG4gICAgICB2YXJhcmdzOiAgICAgICAgZmFsc2VcbiAgICAgIGRpcmVjdE9ubHk6ICAgICBmYWxzZVxuICAgICAgb3ZlcndyaXRlOiAgICAgIGZhbHNlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjcmVhdGVfdmlydHVhbF90YWJsZV9jZmc6IHt9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGBgYFxuICBjb25zdCBUcnVlICA9IDE7XG4gIGNvbnN0IEZhbHNlID0gMDtcbiAgYGBgXG5cbiAgZnJvbV9ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICAgIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqenJzZGJfX18xIGV4cGVjdGVkIHRydWUgb3IgZmFsc2UsIGdvdCAje3JwciB4fVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgICB3aGVuIEZhbHNlICB0aGVuIGZhbHNlXG4gICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWp6cnNkYl9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBFc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHVucXVvdGVfbmFtZTogKCBuYW1lICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBuYW1lICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX18zIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIC9eW15cIl0oLiopW15cIl0kLy50ZXN0ICBuYW1lIHRoZW4gcmV0dXJuIG5hbWVcbiAgICAgICAgd2hlbiAvXlwiKC4rKVwiJC8udGVzdCAgICAgICAgbmFtZSB0aGVuIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfX180IGV4cGVjdGVkIGEgbmFtZSwgZ290ICN7cnByIG5hbWV9XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgSUROOiAoIG5hbWUgKSA9PiAnXCInICsgKCBuYW1lLnJlcGxhY2UgL1wiL2csICdcIlwiJyApICsgJ1wiJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBMSVQ6ICggeCApID0+XG4gICAgICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHhcbiAgICAgICAgd2hlbiAndGV4dCcgICAgICAgdGhlbiByZXR1cm4gIFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCInJ1wiICkgKyBcIidcIlxuICAgICAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgICAgICB3aGVuICdmbG9hdCcgICAgICB0aGVuIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgd2hlbiAnYm9vbGVhbicgICAgdGhlbiByZXR1cm4gKCBpZiB4IHRoZW4gJzEnIGVsc2UgJzAnIClcbiAgICAgICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICAgICAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICdeZGJheS9zcWxAMV4nLCB0eXBlLCB4XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFZFQzogKCB4ICkgPT5cbiAgICAgIHRocm93IG5ldyBFLkRicmljX3NxbF9ub3RfYV9saXN0X2Vycm9yICdeZGJheS9zcWxAMl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgICAgIHJldHVybiAnKCAnICsgKCAoIEBMSVQgZSBmb3IgZSBpbiB4ICkuam9pbiAnLCAnICkgKyAnICknXG5cbiAgICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgaW50ZXJwb2xhdGU6ICggc3FsLCB2YWx1ZXMgKSA9PlxuICAgICMgICBpZHggPSAtMVxuICAgICMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgPT5cbiAgICAjICAgICBpZHgrK1xuICAgICMgICAgIHN3aXRjaCBvcGVuZXJcbiAgICAjICAgICAgIHdoZW4gJyQnXG4gICAgIyAgICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQgbmFtZVxuICAgICMgICAgICAgICBrZXkgPSBuYW1lXG4gICAgIyAgICAgICB3aGVuICc/J1xuICAgICMgICAgICAgICBrZXkgPSBpZHhcbiAgICAjICAgICB2YWx1ZSA9IHZhbHVlc1sga2V5IF1cbiAgICAjICAgICBzd2l0Y2ggZm9ybWF0XG4gICAgIyAgICAgICB3aGVuICcnLCAnSScgIHRoZW4gcmV0dXJuIEBJIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdMJyAgICAgIHRoZW4gcmV0dXJuIEBMIHZhbHVlXG4gICAgIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4gICAgIyAgICAgdGhyb3cgbmV3IEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biAnXmRiYXkvc3FsQDNeJywgZm9ybWF0XG4gICAgIyBfaW50ZXJwb2xhdGlvbl9wYXR0ZXJuOiAvKD88b3BlbmVyPlskP10pKD88Zm9ybWF0Pi4/KTooPzxuYW1lPlxcdyopL2dcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlc3FsID0gbmV3IEVzcWwoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU1FMID0gKCBwYXJ0cywgZXhwcmVzc2lvbnMuLi4gKSAtPlxuICAgIFIgPSBwYXJ0c1sgMCBdXG4gICAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgICAgUiArPSBleHByZXNzaW9uLnRvU3RyaW5nKCkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgcmV0dXJuIFJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgRGJyaWNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgcHJlZml4OiAnKE5PUFJFRklYKSdcbiAgICBAZnVuY3Rpb25zOiAgIHt9XG4gICAgQHN0YXRlbWVudHM6ICB7fVxuICAgIEBidWlsZDogICAgICAgbnVsbFxuICAgIEBkYl9jbGFzczogICAgU1FMSVRFLkRhdGFiYXNlU3luY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgdXNlIG5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMgIyMjXG4gICAgY29uc3RydWN0b3I6ICggZGJfcGF0aCwgY2ZnICkgLT5cbiAgICAgIEBfdmFsaWRhdGVfaXNfcHJvcGVydHkgJ2lzX3JlYWR5J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4J1xuICAgICAgQF92YWxpZGF0ZV9pc19wcm9wZXJ0eSAncHJlZml4X3JlJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBkYl9wYXRoICAgICAgICAgICAgICAgICAgPz0gJzptZW1vcnk6J1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgICBkYl9jbGFzcyAgICAgICAgICAgICAgICAgID0gKCBjZmc/LmRiX2NsYXNzICkgPyBjbGFzei5kYl9jbGFzc1xuICAgICAgaGlkZSBALCAnZGInLCAgICAgICAgICAgICAgIG5ldyBkYl9jbGFzcyBkYl9wYXRoXG4gICAgICAjIEBkYiAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgU1FMSVRFLkRhdGFiYXNlU3luYyBkYl9wYXRoXG4gICAgICBAY2ZnICAgICAgICAgICAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSB7IGNsYXN6LmNmZy4uLiwgZGJfcGF0aCwgY2ZnLi4uLCB9XG4gICAgICBoaWRlIEAsICdzdGF0ZW1lbnRzJywgICAgICAge31cbiAgICAgIGhpZGUgQCwgJ193JywgICAgICAgICAgICAgICBudWxsXG4gICAgICBoaWRlIEAsICdfc3RhdGVtZW50X2NsYXNzJywgKCBAZGIucHJlcGFyZSBTUUxcInNlbGVjdCAxO1wiICkuY29uc3RydWN0b3JcbiAgICAgIGhpZGUgQCwgJ3N0YXRlJywgICAgICAgICAgICB7IGNvbHVtbnM6IG51bGwsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgQHJ1bl9zdGFuZGFyZF9wcmFnbWFzKClcbiAgICAgIEBpbml0aWFsaXplKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm5fY2ZnX3RlbXBsYXRlID0geyBkZXRlcm1pbmlzdGljOiB0cnVlLCB2YXJhcmdzOiBmYWxzZSwgfVxuICAgICAgQF9jcmVhdGVfdWRmcygpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMjIyBOT1RFIEEgJ2ZyZXNoJyBEQiBpbnN0YW5jZSBpcyBhIERCIHRoYXQgc2hvdWxkIGJlIChyZS0pYnVpbHQgYW5kL29yIChyZS0pcG9wdWxhdGVkOyBpblxuICAgICAgY29udHJhZGlzdGluY3Rpb24gdG8gYERicmljOjppc19yZWFkeWAsIGBEYnJpYzo6aXNfZnJlc2hgIHJldGFpbnMgaXRzIHZhbHVlIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgIHRoZSBpbnN0YW5jZS4gIyMjXG4gICAgICBAaXNfZnJlc2ggPSBub3QgQGlzX3JlYWR5XG4gICAgICBAYnVpbGQoKVxuICAgICAgQF9wcmVwYXJlX3N0YXRlbWVudHMoKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpc2Ffc3RhdGVtZW50OiAoIHggKSAtPiB4IGluc3RhbmNlb2YgQF9zdGF0ZW1lbnRfY2xhc3NcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuX3N0YW5kYXJkX3ByYWdtYXM6IC0+XG4gICAgICAjIyMgbm90IHVzaW5nIGBAZGIucHJhZ21hYCBhcyBpdCBpcyBvbmx5IHByb3ZpZGVkIGJ5IGBiZXR0ZXItc3FsaXRlM2AncyBEQiBjbGFzcyAjIyNcbiAgICAgICggQGRiLnByZXBhcmUgU1FMXCJwcmFnbWEgam91cm5hbF9tb2RlID0gd2FsO1wiICAgKS5ydW4oKVxuICAgICAgKCBAZGIucHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiAgICApLnJ1bigpXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIGJ1c3lfdGltZW91dCA9IDYwMDAwO1wiICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAoIEBkYi5wcmVwYXJlIFNRTFwicHJhZ21hIHN0cmljdCAgICAgICA9IG9uO1wiICAgICkucnVuKCkgIyMjIHRpbWUgaW4gbXMgIyMjXG4gICAgICAjIEBkYi5wcmFnbWEgU1FMXCJqb3VybmFsX21vZGUgPSB3YWxcIlxuICAgICAgIyBAZGIucHJhZ21hIFNRTFwiZm9yZWlnbl9rZXlzID0gb25cIlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaW5pdGlhbGl6ZTogLT5cbiAgICAgICMjIyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCAqYmVmb3JlKiBhbnkgYnVpbGQgc3RhdGVtZW50cyBhcmUgZXhlY3V0ZWQgYW5kIGJlZm9yZSBhbnkgc3RhdGVtZW50c1xuICAgICAgaW4gYEBjb25zdHJ1Y3Rvci5zdGF0ZW1lbnRzYCBhcmUgcHJlcGFyZWQgYW5kIGlzIGEgZ29vZCBwbGFjZSB0byBjcmVhdGUgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1xuICAgICAgKFVERnMpLiBZb3UgcHJvYmFibHkgd2FudCB0byBvdmVycmlkZSBpdCB3aXRoIGEgbWV0aG9kIHRoYXQgc3RhcnRzIHdpdGggYHN1cGVyKClgLiAjIyNcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF92YWxpZGF0ZV9pc19wcm9wZXJ0eTogKCBuYW1lICkgLT5cbiAgICAgIGRlc2NyaXB0b3IgPSBnZXRfcHJvcGVydHlfZGVzY3JpcHRvciBALCBuYW1lXG4gICAgICByZXR1cm4gbnVsbCBpZiAoIHR5cGVfb2YgZGVzY3JpcHRvci5nZXQgKSBpcyAnZnVuY3Rpb24nXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fNSBub3QgYWxsb3dlZCB0byBvdmVycmlkZSBwcm9wZXJ0eSAje3JwciBuYW1lfTsgdXNlICdfZ2V0XyN7bmFtZX0gaW5zdGVhZFwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZGJfb2JqZWN0czogLT5cbiAgICAgIFIgPSB7fVxuICAgICAgZm9yIGRibyBmcm9tICggQGRiLnByZXBhcmUgU1FMXCJzZWxlY3QgbmFtZSwgdHlwZSBmcm9tIHNxbGl0ZV9zY2hlbWFcIiApLml0ZXJhdGUoKVxuICAgICAgICBSWyBkYm8ubmFtZSBdID0geyBuYW1lOiBkYm8ubmFtZSwgdHlwZTogZGJvLnR5cGUsIH1cbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRlYXJkb3duOiAoeyB0ZXN0ID0gbnVsbCwgfT17fSkgLT5cbiAgICAgIGNvdW50ICAgICAgID0gMFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICB3aGVuIHRlc3QgaXMgJyonXG4gICAgICAgICAgdGVzdCA9ICggbmFtZSApIC0+IHRydWVcbiAgICAgICAgd2hlbiAoIHR5cGVfb2YgdGVzdCApIGlzICdmdW5jdGlvbidcbiAgICAgICAgICBudWxsXG4gICAgICAgIHdoZW4gbm90IHRlc3Q/XG4gICAgICAgICAgcHJlZml4X3JlID0gQHByZWZpeF9yZVxuICAgICAgICAgIHRlc3QgPSAoIG5hbWUgKSAtPiBwcmVmaXhfcmUudGVzdCBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0eXBlID0gdHlwZV9vZiB0ZXN0XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fXzYgZXhwZWN0ZWQgYCcqJ2AsIGEgUmVnRXhwLCBhIGZ1bmN0aW9uLCBudWxsIG9yIHVuZGVmaW5lZCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICggQHByZXBhcmUgU1FMXCJwcmFnbWEgZm9yZWlnbl9rZXlzID0gb2ZmO1wiICkucnVuKClcbiAgICAgIGZvciBfLCB7IG5hbWUsIHR5cGUsIH0gb2YgQF9nZXRfZGJfb2JqZWN0cygpXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyB0ZXN0IG5hbWVcbiAgICAgICAgY291bnQrK1xuICAgICAgICB0cnlcbiAgICAgICAgICAoIEBwcmVwYXJlIFNRTFwiZHJvcCAje3R5cGV9ICN7ZXNxbC5JIG5hbWV9O1wiICkucnVuKClcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICB3YXJuIFwizqlkYnJpY19fXzcgaWdub3JlZCBlcnJvcjogI3tlcnJvci5tZXNzYWdlfVwiIHVubGVzcyAvLy8gbm8gXFxzKyBzdWNoIFxccysgI3t0eXBlfTogLy8vLnRlc3QgZXJyb3IubWVzc2FnZVxuICAgICAgKCBAcHJlcGFyZSBTUUxcInByYWdtYSBmb3JlaWduX2tleXMgPSBvbjtcIiApLnJ1bigpXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYnVpbGQ6IC0+IGlmIEBpc19yZWFkeSB0aGVuIDAgZWxzZSBAcmVidWlsZCgpXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJlYnVpbGQ6IC0+XG4gICAgICBjbGFzeiAgICAgICAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGNvdW50ICAgICAgICAgICAgICAgICA9IDBcbiAgICAgIGJ1aWxkX3N0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdidWlsZCcgKS5yZXZlcnNlKClcbiAgICAgIGhhc190b3JuX2Rvd24gICAgICAgICA9IGZhbHNlXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBidWlsZF9zdGF0ZW1lbnRzIGluIGJ1aWxkX3N0YXRlbWVudHNfbGlzdFxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBidWlsZF9zdGF0ZW1lbnRzICkgaW4gWyAndW5kZWZpbmVkJywgJ251bGwnLCAnbGlzdCcsIF1cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOCBleHBlY3RlZCBhbiBvcHRpb25hbCBsaXN0IGZvciAje2NsYXN6Lm5hbWV9LmJ1aWxkLCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBjb250aW51ZSBpZiAoIG5vdCBidWlsZF9zdGF0ZW1lbnRzPyApIG9yICggYnVpbGRfc3RhdGVtZW50cy5sZW5ndGggaXMgMCApXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgQHRlYXJkb3duKCkgdW5sZXNzIGhhc190b3JuX2Rvd25cbiAgICAgICAgaGFzX3Rvcm5fZG93biA9IHRydWVcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgYnVpbGRfc3RhdGVtZW50IGluIGJ1aWxkX3N0YXRlbWVudHNcbiAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgKCBAcHJlcGFyZSBidWlsZF9zdGF0ZW1lbnQgKS5ydW4oKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gY291bnRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0X2dldHRlciBAOjosICdzdXBlcicsICAgICAgICAgICAgLT4gT2JqZWN0LmdldFByb3RvdHlwZU9mIEBjb25zdHJ1Y3RvclxuICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfcmVhZHknLCAgICAgICAgIC0+IEBfZ2V0X2lzX3JlYWR5KClcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ3ByZWZpeCcsICAgICAgICAgICAtPiBAX2dldF9wcmVmaXgoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAncHJlZml4X3JlJywgICAgICAgIC0+IEBfZ2V0X3ByZWZpeF9yZSgpXG4gICAgc2V0X2dldHRlciBAOjosICdfZnVuY3Rpb25fbmFtZXMnLCAgLT4gQF9nZXRfZnVuY3Rpb25fbmFtZXMoKVxuICAgIHNldF9nZXR0ZXIgQDo6LCAndycsICAgICAgICAgICAgICAgIC0+IEBfZ2V0X3coKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2lzX3JlYWR5OiAtPlxuICAgICAgeyBlcnJvcl9jb3VudCxcbiAgICAgICAgc3RhdGVtZW50X2NvdW50LFxuICAgICAgICBkYl9vYmplY3RzOiBleHBlY3RlZF9kYl9vYmplY3RzLCB9ID0gQF9nZXRfb2JqZWN0c19pbl9idWlsZF9zdGF0ZW1lbnRzKClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgZXJyb3JfY291bnQgaXNudCAwXG4gICAgICAgIG1lc3NhZ2VzID0gW11cbiAgICAgICAgZm9yIG5hbWUsIHsgdHlwZSwgbWVzc2FnZSwgfSBvZiBleHBlY3RlZF9kYl9vYmplY3RzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIHR5cGUgaXMgJ2Vycm9yJ1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2ggbWVzc2FnZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX19fOSAje2Vycm9yX2NvdW50fSBvdXQgb2YgI3tzdGF0ZW1lbnRfY291bnR9IGJ1aWxkIHN0YXRlbWVudChzKSBjb3VsZCBub3QgYmUgcGFyc2VkOiAje3JwciBtZXNzYWdlc31cIlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBwcmVzZW50X2RiX29iamVjdHMgPSBAX2dldF9kYl9vYmplY3RzKClcbiAgICAgIGZvciBuYW1lLCB7IHR5cGU6IGV4cGVjdGVkX3R5cGUsIH0gb2YgZXhwZWN0ZWRfZGJfb2JqZWN0c1xuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXNlbnRfZGJfb2JqZWN0c1sgbmFtZSBdPy50eXBlIGlzIGV4cGVjdGVkX3R5cGVcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfcHJlZml4OiAtPlxuICAgICAgcmV0dXJuICcnIGlmICggbm90IEBjZmcucHJlZml4PyApIG9yICggQGNmZy5wcmVmaXggaXMgJyhOT1BSRUZJWCknIClcbiAgICAgIHJldHVybiBAY2ZnLnByZWZpeFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X3ByZWZpeF9yZTogLT5cbiAgICAgIHJldHVybiAvfC8gaWYgQHByZWZpeCBpcyAnJ1xuICAgICAgcmV0dXJuIC8vLyBeIF8/ICN7UmVnRXhwLmVzY2FwZSBAcHJlZml4fSBfIC4qICQgLy8vXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfdzogLT5cbiAgICAgIHJldHVybiBAX3cgaWYgQF93P1xuICAgICAgQF93ID0gbmV3IEBjb25zdHJ1Y3RvciBAY2ZnLmRiX3BhdGhcbiAgICAgIHJldHVybiBAX3dcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9mdW5jdGlvbl9uYW1lczogLT4gbmV3IFNldCAoIG5hbWUgZm9yIHsgbmFtZSwgfSBmcm9tIFxcXG4gICAgICBAd2FsayBTUUxcInNlbGVjdCBuYW1lIGZyb20gcHJhZ21hX2Z1bmN0aW9uX2xpc3QoKSBvcmRlciBieSBuYW1lO1wiIClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9vYmplY3RzX2luX2J1aWxkX3N0YXRlbWVudHM6IC0+XG4gICAgICAjIyMgVEFJTlQgZG9lcyBub3QgeWV0IGRlYWwgd2l0aCBxdW90ZWQgbmFtZXMgIyMjXG4gICAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICAgIGRiX29iamVjdHMgICAgICA9IHt9XG4gICAgICBzdGF0ZW1lbnRfY291bnQgPSAwXG4gICAgICBlcnJvcl9jb3VudCAgICAgPSAwXG4gICAgICBmb3Igc3RhdGVtZW50IGluIGNsYXN6LmJ1aWxkID8gW11cbiAgICAgICAgc3RhdGVtZW50X2NvdW50KytcbiAgICAgICAgaWYgKCBtYXRjaCA9IHN0YXRlbWVudC5tYXRjaCBjcmVhdGVfc3RhdGVtZW50X3JlICk/XG4gICAgICAgICAgeyBuYW1lLFxuICAgICAgICAgICAgdHlwZSwgfSAgICAgICAgICAgPSBtYXRjaC5ncm91cHNcbiAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gZXNxbC51bnF1b3RlX25hbWUgbmFtZVxuICAgICAgICAgIGRiX29iamVjdHNbIG5hbWUgXSAgPSB7IG5hbWUsIHR5cGUsIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVycm9yX2NvdW50KytcbiAgICAgICAgICBuYW1lICAgICAgICAgICAgICAgID0gXCJlcnJvcl8je3N0YXRlbWVudF9jb3VudH1cIlxuICAgICAgICAgIHR5cGUgICAgICAgICAgICAgICAgPSAnZXJyb3InXG4gICAgICAgICAgbWVzc2FnZSAgICAgICAgICAgICA9IFwibm9uLWNvbmZvcm1hbnQgc3RhdGVtZW50OiAje3JwciBzdGF0ZW1lbnR9XCJcbiAgICAgICAgICBkYl9vYmplY3RzWyBuYW1lIF0gID0geyBuYW1lLCB0eXBlLCBtZXNzYWdlLCB9XG4gICAgICByZXR1cm4geyBlcnJvcl9jb3VudCwgc3RhdGVtZW50X2NvdW50LCBkYl9vYmplY3RzLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9wcmVwYXJlX3N0YXRlbWVudHM6IC0+XG4gICAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICMgZm9yIG5hbWUsIHNxbCBvZiBjbGFzei5zdGF0ZW1lbnRzXG4gICAgICAjICAgc3dpdGNoIHRydWVcbiAgICAgICMgICAgIHdoZW4gbmFtZS5zdGFydHNXaXRoICdjcmVhdGVfdGFibGVfJ1xuICAgICAgIyAgICAgICBudWxsXG4gICAgICAjICAgICB3aGVuIG5hbWUuc3RhcnRzV2l0aCAnaW5zZXJ0XydcbiAgICAgICMgICAgICAgbnVsbFxuICAgICAgIyAgICAgZWxzZVxuICAgICAgIyAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqW5xbF9fMTAgdW5hYmxlIHRvIHBhcnNlIHN0YXRlbWVudCBuYW1lICN7cnByIG5hbWV9XCJcbiAgICAgICMgIyAgIEBbIG5hbWUgXSA9IEBwcmVwYXJlIHNxbFxuICAgICAgY2xhc3ogPSBAY29uc3RydWN0b3JcbiAgICAgIHN0YXRlbWVudHNfbGlzdCA9ICggZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gY2xhc3osICdzdGF0ZW1lbnRzJyApLnJldmVyc2UoKVxuICAgICAgZm9yIHN0YXRlbWVudHMgaW4gc3RhdGVtZW50c19saXN0XG4gICAgICAgIGZvciBzdGF0ZW1lbnRfbmFtZSwgc3RhdGVtZW50IG9mIHN0YXRlbWVudHNcbiAgICAgICAgICBpZiBAc3RhdGVtZW50c1sgc3RhdGVtZW50X25hbWUgXT9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzExIHN0YXRlbWVudCAje3JwciBzdGF0ZW1lbnRfbmFtZX0gaXMgYWxyZWFkeSBkZWNsYXJlZFwiXG4gICAgICAgICAgIyBpZiAoIHR5cGVfb2Ygc3RhdGVtZW50ICkgaXMgJ2xpc3QnXG4gICAgICAgICAgIyAgIEBzdGF0ZW1lbnRzWyBzdGF0ZW1lbnRfbmFtZSBdID0gKCBAcHJlcGFyZSBzdWJfc3RhdGVtZW50IGZvciBzdWJfc3RhdGVtZW50IGluIHN0YXRlbWVudCApXG4gICAgICAgICAgIyAgIGNvbnRpbnVlXG4gICAgICAgICAgQHN0YXRlbWVudHNbIHN0YXRlbWVudF9uYW1lIF0gPSBAcHJlcGFyZSBzdGF0ZW1lbnRcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGV4ZWN1dGU6ICggc3FsICkgLT4gQGRiLmV4ZWMgc3FsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICAgICAgICggc3FsLCBQLi4uICkgLT4gKCBAcHJlcGFyZSBzcWwgKS5pdGVyYXRlIFAuLi5cbiAgICBnZXRfYWxsOiAgICAoIHNxbCwgUC4uLiApIC0+IFsgKCBAd2FsayBzcWwsIFAuLi4gKS4uLiwgXVxuICAgIGdldF9maXJzdDogICggc3FsLCBQLi4uICkgLT4gKCBAZ2V0X2FsbCBzcWwsIFAuLi4gKVsgMCBdID8gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwcmVwYXJlOiAoIHNxbCApIC0+XG4gICAgICByZXR1cm4gc3FsIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc3FsICkgaXMgJ3RleHQnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzEyIGV4cGVjdGVkIGEgc3RhdGVtZW50IG9yIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICB0cnlcbiAgICAgICAgUiA9IEBkYi5wcmVwYXJlIHNxbFxuICAgICAgY2F0Y2ggY2F1c2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTMgd2hlbiB0cnlpbmcgdG8gcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0YXRlbWVudCwgYW4gZXJyb3Igd2l0aCBtZXNzYWdlOiAje3JwciBjYXVzZS5tZXNzYWdlfSB3YXMgdGhyb3duOiAje3JwciBzcWx9XCIsIHsgY2F1c2UsIH1cbiAgICAgIEBzdGF0ZS5jb2x1bW5zID0gKCB0cnkgUj8uY29sdW1ucz8oKSBjYXRjaCBlcnJvciB0aGVuIG51bGwgKSA/IFtdXG4gICAgICByZXR1cm4gUlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIEZVTkNUSU9OU1xuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2NyZWF0ZV91ZGZzOiAtPlxuICAgICAgY2xhc3ogICAgICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgICAgIyMjIFRBSU5UIHNob3VsZCBiZSBwdXQgc29tZXdoZXJlIGVsc2U/ICMjI1xuICAgICAgbmFtZXNfb2ZfY2FsbGFibGVzICA9XG4gICAgICAgIGZ1bmN0aW9uOiAgICAgICAgICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgYWdncmVnYXRlX2Z1bmN0aW9uOiAgIFsgJ3N0YXJ0JywgJ3N0ZXAnLCAncmVzdWx0JywgXVxuICAgICAgICB3aW5kb3dfZnVuY3Rpb246ICAgICAgWyAnc3RhcnQnLCAnc3RlcCcsICdpbnZlcnNlJywgJ3Jlc3VsdCcsIF1cbiAgICAgICAgdGFibGVfZnVuY3Rpb246ICAgICAgIFsgJ3Jvd3MnLCBdXG4gICAgICAgIHZpcnR1YWxfdGFibGU6ICAgICAgICBbICdyb3dzJywgXVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgY2F0ZWdvcnkgaW4gWyAnZnVuY3Rpb24nLCBcXFxuICAgICAgICAnYWdncmVnYXRlX2Z1bmN0aW9uJywgJ3dpbmRvd19mdW5jdGlvbicsICd0YWJsZV9mdW5jdGlvbicsICd2aXJ0dWFsX3RhYmxlJywgXVxuICAgICAgICBwcm9wZXJ0eV9uYW1lICAgICA9IFwiI3tjYXRlZ29yeX1zXCJcbiAgICAgICAgbWV0aG9kX25hbWUgICAgICAgPSBcImNyZWF0ZV8je2NhdGVnb3J5fVwiXG4gICAgICAgIGRlY2xhcmF0aW9uc19saXN0ID0gKCBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbiBjbGFzeiwgcHJvcGVydHlfbmFtZSApLnJldmVyc2UoKVxuICAgICAgICBmb3IgZGVjbGFyYXRpb25zIGluIGRlY2xhcmF0aW9uc19saXN0XG4gICAgICAgICAgY29udGludWUgdW5sZXNzIGRlY2xhcmF0aW9ucz9cbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIGZvciB1ZGZfbmFtZSwgZm5fY2ZnIG9mIGRlY2xhcmF0aW9uc1xuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICBmbl9jZmcgPSBsZXRzIGZuX2NmZywgKCBkICkgPT5cbiAgICAgICAgICAgICAgZC5uYW1lID89IHVkZl9uYW1lXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgIyMjIGJpbmQgVURGcyB0byBgdGhpc2AgIyMjXG4gICAgICAgICAgICAgIGZvciBuYW1lX29mX2NhbGxhYmxlIGluIG5hbWVzX29mX2NhbGxhYmxlc1sgY2F0ZWdvcnkgXVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAoIGNhbGxhYmxlID0gZFsgbmFtZV9vZl9jYWxsYWJsZSBdICk/XG4gICAgICAgICAgICAgICAgZFsgbmFtZV9vZl9jYWxsYWJsZSBdID0gY2FsbGFibGUuYmluZCBAXG4gICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICBAWyBtZXRob2RfbmFtZSBdIGZuX2NmZ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIuZnVuY3Rpb24gKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMTQgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB1c2VyLWRlZmluZWQgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuZnVuY3Rpb24gbmFtZSwgeyBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9LCB2YWx1ZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfYWdncmVnYXRlX2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNiBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCBhZ2dyZWdhdGUgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RlcCxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV9hZ2dyZWdhdGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xNyBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfd2luZG93X2Z1bmN0aW9uOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLmFnZ3JlZ2F0ZSApIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOCBEQiBhZGFwdGVyIGNsYXNzICN7cnByIEBkYi5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBwcm92aWRlIHVzZXItZGVmaW5lZCB3aW5kb3cgZnVuY3Rpb25zXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RlcCxcbiAgICAgICAgaW52ZXJzZSxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBkaXJlY3RPbmx5LFxuICAgICAgICBkZXRlcm1pbmlzdGljLFxuICAgICAgICB2YXJhcmdzLCAgICAgICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV93aW5kb3dfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18xOSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIuYWdncmVnYXRlIG5hbWUsIHsgc3RhcnQsIHN0ZXAsIGludmVyc2UsIHJlc3VsdCwgZGV0ZXJtaW5pc3RpYywgdmFyYXJncywgZGlyZWN0T25seSwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjcmVhdGVfdGFibGVfZnVuY3Rpb246ICggY2ZnICkgLT5cbiAgICAgIGlmICggdHlwZV9vZiBAZGIudGFibGUgKSBpc250ICdmdW5jdGlvbidcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjAgREIgYWRhcHRlciBjbGFzcyAje3JwciBAZGIuY29uc3RydWN0b3IubmFtZX0gZG9lcyBub3QgcHJvdmlkZSB0YWJsZS12YWx1ZWQgdXNlci1kZWZpbmVkIGZ1bmN0aW9uc1wiXG4gICAgICB7IG5hbWUsXG4gICAgICAgIG92ZXJ3cml0ZSxcbiAgICAgICAgcGFyYW1ldGVycyxcbiAgICAgICAgY29sdW1ucyxcbiAgICAgICAgcm93cyxcbiAgICAgICAgZGlyZWN0T25seSxcbiAgICAgICAgZGV0ZXJtaW5pc3RpYyxcbiAgICAgICAgdmFyYXJncywgICAgICAgIH0gPSB7IHRlbXBsYXRlcy5jcmVhdGVfdGFibGVfZnVuY3Rpb25fY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGlmICggbm90IG92ZXJ3cml0ZSApIGFuZCAoIEBfZnVuY3Rpb25fbmFtZXMuaGFzIG5hbWUgKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljX18yMSBhIFVERiBvciBidWlsdC1pbiBmdW5jdGlvbiBuYW1lZCAje3JwciBuYW1lfSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgIHJldHVybiBAZGIudGFibGUgbmFtZSwgeyBwYXJhbWV0ZXJzLCBjb2x1bW5zLCByb3dzLCBkZXRlcm1pbmlzdGljLCB2YXJhcmdzLCBkaXJlY3RPbmx5LCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNyZWF0ZV92aXJ0dWFsX3RhYmxlOiAoIGNmZyApIC0+XG4gICAgICBpZiAoIHR5cGVfb2YgQGRiLnRhYmxlICkgaXNudCAnZnVuY3Rpb24nXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWNfXzIyIERCIGFkYXB0ZXIgY2xhc3MgI3tycHIgQGRiLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXMgbm90IHByb3ZpZGUgdXNlci1kZWZpbmVkIHZpcnR1YWwgdGFibGVzXCJcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgb3ZlcndyaXRlLFxuICAgICAgICBjcmVhdGUsICAgfSA9IHsgdGVtcGxhdGVzLmNyZWF0ZV92aXJ0dWFsX3RhYmxlX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBpZiAoIG5vdCBvdmVyd3JpdGUgKSBhbmQgKCBAX2Z1bmN0aW9uX25hbWVzLmhhcyBuYW1lIClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlkYnJpY19fMjMgYSBVREYgb3IgYnVpbHQtaW4gZnVuY3Rpb24gbmFtZWQgI3tycHIgbmFtZX0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICByZXR1cm4gQGRiLnRhYmxlIG5hbWUsIGNyZWF0ZVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19zdGQgZXh0ZW5kcyBEYnJpY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAY2ZnOiBPYmplY3QuZnJlZXplXG4gICAgICBwcmVmaXg6ICdzdGQnXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBmdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVnZXhwOlxuICAgICAgICB2YWx1ZTogKCBwYXR0ZXJuLCB0ZXh0ICkgLT4gaWYgKCAoIG5ldyBSZWdFeHAgcGF0dGVybiwgJ3YnICkudGVzdCB0ZXh0ICkgdGhlbiAxIGVsc2UgMFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHN0ZF9pc191Y19ub3JtYWw6XG4gICAgICAgICMjIyBOT1RFOiBhbHNvIHNlZSBgU3RyaW5nOjppc1dlbGxGb3JtZWQoKWAgIyMjXG4gICAgICAgIHZhbHVlOiAoIHRleHQsIGZvcm0gPSAnTkZDJyApIC0+IGZyb21fYm9vbCB0ZXh0IGlzIHRleHQubm9ybWFsaXplIGZvcm0gIyMjICdORkMnLCAnTkZEJywgJ05GS0MnLCBvciAnTkZLRCcgIyMjXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEB0YWJsZV9mdW5jdGlvbnM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RkX2dlbmVyYXRlX3NlcmllczpcbiAgICAgICAgY29sdW1uczogICAgICBbICd2YWx1ZScsIF1cbiAgICAgICAgcGFyYW1ldGVyczogICBbICdzdGFydCcsICdzdG9wJywgJ3N0ZXAnLCBdXG4gICAgICAgICMjIyBOT1RFIGRlZmF1bHRzIGFuZCBiZWhhdmlvciBhcyBwZXIgaHR0cHM6Ly9zcWxpdGUub3JnL3Nlcmllcy5odG1sI292ZXJ2aWV3ICMjI1xuICAgICAgICByb3dzOiAoIHN0YXJ0LCBzdG9wID0gNF8yOTRfOTY3XzI5NSwgc3RlcCA9IDEgKSAtPlxuICAgICAgICAgIHN0ZXAgID0gMSBpZiBzdGVwIGlzIDAgIyMjIE5PVEUgZXF1aXZhbGVudCBgKCBPYmplY3QuaXMgc3RlcCwgKzAgKSBvciAoIE9iamVjdC5pcyBzdGVwLCAtMCApICMjI1xuICAgICAgICAgIHZhbHVlID0gc3RhcnRcbiAgICAgICAgICBsb29wXG4gICAgICAgICAgICBpZiBzdGVwID4gMCB0aGVuICBicmVhayBpZiB2YWx1ZSA+IHN0b3BcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgIGJyZWFrIGlmIHZhbHVlIDwgc3RvcFxuICAgICAgICAgICAgeWllbGQgeyB2YWx1ZSwgfVxuICAgICAgICAgICAgdmFsdWUgKz0gc3RlcFxuICAgICAgICAgIDtudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEBzdGF0ZW1lbnRzOlxuICAgICAgc3RkX2dldF9zY2hlbWE6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWE7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3RhYmxlczogU1FMXCJcIlwiXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYSB3aGVyZSB0eXBlIGlzICd0YWJsZSc7XCJcIlwiXG4gICAgICBzdGRfZ2V0X3ZpZXdzOiBTUUxcIlwiXCJcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgc3RkX2dldF9yZWxhdGlvbnM6IFNRTFwiXCJcIlxuICAgICAgICBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9zY2hlbWEgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgc2VsZWN0IG5hbWUsIGJ1aWx0aW4sIHR5cGUgZnJvbSBwcmFnbWFfZnVuY3Rpb25fbGlzdCgpICMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAYnVpbGQ6IFtcbiAgICAgIFNRTFwiXCJcImNyZWF0ZSB2aWV3IHN0ZF90YWJsZXMgYXNcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgd2hlcmUgdHlwZSBpcyAndGFibGUnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgc3RkX3ZpZXdzIGFzXG4gICAgICAgIHNlbGVjdCAqIGZyb20gc3FsaXRlX3NjaGVtYVxuICAgICAgICAgIHdoZXJlIHR5cGUgaXMgJ3ZpZXcnO1wiXCJcIlxuICAgICAgU1FMXCJcIlwiY3JlYXRlIHZpZXcgXCJzdGRfcmVsYXRpb25zXCIgYXNcbiAgICAgICAgc2VsZWN0ICogZnJvbSBzcWxpdGVfc2NoZW1hXG4gICAgICAgICAgd2hlcmUgdHlwZSBpbiAoICd0YWJsZScsICd2aWV3JyApO1wiXCJcIlxuICAgICAgXVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBEYnJpY19ybmcgZXh0ZW5kcyBEYnJpY19zdGRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGNmZzogT2JqZWN0LmZyZWV6ZVxuICAgICAgcHJlZml4OiAncm5nJ1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBAZnVuY3Rpb25zOlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJuZ192YWxpZGF0ZV9sbzpcbiAgICAgICAgdmFsdWU6ICggbG8gKSAtPlxuICAgICAgICAgIHJldHVybiBGYWxzZSB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIGxvXG4gICAgICAgICAgcmV0dXJuIFRydWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBybmdfdmFsaWRhdGVfaGk6XG4gICAgICAgIHZhbHVlOiAoIGhpICkgLT5cbiAgICAgICAgICByZXR1cm4gRmFsc2UgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBoaVxuICAgICAgICAgIHJldHVybiBUcnVlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcm5nX3ZhbGlkYXRlX2xvaGk6XG4gICAgICAgIHZhbHVlOiAoIGxvLCBoaSApIC0+XG4gICAgICAgICAgcmV0dXJuIEZhbHNlIHVubGVzcyBsbyA8PSBoaVxuICAgICAgICAgIHJldHVybiBUcnVlXG5cbiAgICAjICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMgQHRhYmxlX2Z1bmN0aW9uczpcblxuICAgICMgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyAgIHJuZ196enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6ejpcbiAgICAjICAgICBjb2x1bW5zOiAgICAgIFsgJ3ZhbHVlJywgXVxuICAgICMgICAgIHBhcmFtZXRlcnM6ICAgWyAnc3RhcnQnLCAnc3RvcCcsICdzdGVwJywgXVxuICAgICMgICAgIHJvd3M6ICggc3RhcnQsIHN0b3AgPSA0XzI5NF85NjdfMjk1LCBzdGVwID0gMSApIC0+XG4gICAgIyAgICAgICB5aWVsZCByZXR1cm4gbnVsbFxuICAgICMgICAgICAgO251bGxcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgQHN0YXRlbWVudHM6XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcm5nX2FkZF9yYW5nZTogIFNRTFwiaW5zZXJ0IGludG8gcm5nX3JhbmdlcyAoIGxvLCBoaSwgZGF0YSApIHZhbHVlcyAoICRsbywgJGhpLCAkZGF0YSApO1wiXG4gICAgICBybmdfYWxsX3JhbmdlczogU1FMXCJzZWxlY3QgKiBmcm9tIHJuZ19yYW5nZXMgb3JkZXIgYnkgbG87XCJcbiAgICAgIHJuZ19nZXRfcmFuZ2U6ICBTUUxcInNlbGVjdCAqIGZyb20gcm5nX3JhbmdlcyB3aGVyZSAkbiBiZXR3ZWVuIGxvIGFuZCBoaTtcIlxuICAgICAgcm5nX2hhc19yYW5nZXM6IFNRTFwic2VsZWN0IGV4aXN0cyAoIHNlbGVjdCBsbyBmcm9tIHJuZ19yYW5nZXMgbGltaXQgMSApIGFzIGhhc19yYW5nZXM7XCJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGJ1aWxkOiBbXG4gICAgICBTUUxcIlwiXCJjcmVhdGUgdGFibGUgcm5nX3JhbmdlcyAoXG4gICAgICAgICAgLS0gaWQgICAgICBpbnRlZ2VyIG5vdCBudWxsIHByaW1hcnkga2V5IGF1dG9pbmNyZW1lbnQsXG4gICAgICAgICAgbG8gICAgICBpbnRlZ2VyIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgaGkgICAgICBpbnRlZ2VyIHVuaXF1ZSAgbm90IG51bGwsXG4gICAgICAgICAgZGF0YSAgICBqc29uYiAgICAgICAgICAgbm90IG51bGwsXG4gICAgICAgIHByaW1hcnkga2V5ICggbG8gKSwgLS0gb3IgKCBsbywgaGkgKSA/XG4gICAgICAgIGNvbnN0cmFpbnQgXCLOqXJuZ192YWxpZGF0ZV9sb19fMjRcIiAgIGNoZWNrICggcm5nX3ZhbGlkYXRlX2xvKCBsbyApIClcbiAgICAgICAgY29uc3RyYWludCBcIs6pcm5nX3ZhbGlkYXRlX2hpX18yNVwiICAgY2hlY2sgKCBybmdfdmFsaWRhdGVfaGkoIGhpICkgKVxuICAgICAgICBjb25zdHJhaW50IFwizqlybmdfdmFsaWRhdGVfbG9oaV9fMjZcIiBjaGVjayAoIHJuZ192YWxpZGF0ZV9sb2hpKCBsbywgaGkgKSApXG4gICAgICAgICk7XCJcIlwiXG4gICAgICAjIFNRTFwiXCJcImNyZWF0ZSB0cmlnZ2VyIHJuZ19yYW5nZXNfaW5zZXJ0XG4gICAgICAjICAgYmVmb3JlIGluc2VydCBvbiBybmdfcmFuZ2VzXG4gICAgICAjICAgZm9yIGVhY2ggcm93IGJlZ2luXG4gICAgICAjICAgICBzZWxlY3Qgcm5nX3RyaWdnZXJfb25fYWRkX3JhbmdlKCAgKTtcbiAgICAgICMgICAgIGVuZDtcIlwiXCJcbiAgICAgIF1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyMjIFRBSU5UIHVzZSBub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzICMjI1xuICAgIHJuZ19hZGRfcmFuZ2U6ICggcm93ICkgLT5cbiAgICAgIHJvdy5oaSA/PSAgcm93LmxvXG4gICAgICByb3cubG8gPz0gIHJvdy5oaVxuICAgICAgZGF0YSAgICA9IHJvdy5kYXRhID8ge31cbiAgICAgIHVubGVzcyAoIHR5cGVfb2YgZGF0YSApIGlzICd0ZXh0J1xuICAgICAgICBrZXlzICA9ICggT2JqZWN0LmtleXMgZGF0YSApLnNvcnQoKVxuICAgICAgICAjIyMgVEFJTlQgbXVzdCBkZWxldGUgYWxsIGB1bmRlZmluZWRgIHZhbHVlcyAjIyNcbiAgICAgICAgZGF0YSAgPSBKU09OLnN0cmluZ2lmeSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGtleSwgZGF0YVsga2V5IF0sIF0gZm9yIGtleSBpbiBrZXlzIClcbiAgICAgIGlmIEBzdGF0ZW1lbnRzLnJuZ19oYXNfcmFuZ2VzLmdldCgpLmhhc19yYW5nZXNcbiAgICAgICAgZGVidWcgJ86pZGJyaWNfXzI4JywgXCJoYXMgcmFuZ2UocylcIlxuICAgICAgZWxzZVxuICAgICAgICBkZWJ1ZyAnzqlkYnJpY19fMjknLCBcImhhcyBubyByYW5nZShzKVwiXG4gICAgICAgICMgdW5sZXNzIHJvdy5sbyBpcyByby5oaVxuICAgICAgIyBkZWJ1ZyAnzqlkYnJpY19fMzAnLCBAc3RhdGVtZW50cy5ybmdfZ2V0X3JhbmdlLmdldCB7IG46IHJvdy5sbywgfVxuICAgICAgIyBkZWJ1ZyAnzqlkYnJpY19fMzEnLCBAc3RhdGVtZW50cy5ybmdfZ2V0X3JhbmdlLmdldCB7IG46IHJvdy5oaSwgfVxuICAgICAgQHN0YXRlbWVudHMucm5nX2FkZF9yYW5nZS5ydW4geyByb3cuLi4sIGRhdGEsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0ge1xuICAgIERicmljLFxuICAgIERicmljX3N0ZCxcbiAgICBEYnJpY19ybmcsXG4gICAgZXNxbCxcbiAgICBTUUwsXG4gICAgVHJ1ZSxcbiAgICBGYWxzZSxcbiAgICBmcm9tX2Jvb2wsXG4gICAgYXNfYm9vbCxcbiAgICBpbnRlcm5hbHM6IE9iamVjdC5mcmVlemUgeyB0eXBlX29mLCBjcmVhdGVfc3RhdGVtZW50X3JlLCB0ZW1wbGF0ZXMsIH1cbiAgICB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHJlcXVpcmVfZGJyaWMsIHJlcXVpcmVfZGJyaWNfZXJyb3JzLCB9XG5cbiJdfQ==
