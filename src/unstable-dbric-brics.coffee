'use strict'

############################################################################################################
#
#===========================================================================================================
### NOTE Future Single-File Module ###
require_dbric_errors = ->

  { rpr,                        } = ( require './loupe-brics' ).require_loupe()
  E                               = {}

  #---------------------------------------------------------------------------------------------------------
  class E.Dbric_error extends Error
    constructor: ( ref, message ) ->
      super()
      @message  = "#{ref} (#{@constructor.name}) #{message}"
      @ref      = ref
      return undefined ### always return `undefined` from constructor ###

  #---------------------------------------------------------------------------------------------------------
  class E.Dbric_sql_value_error           extends E.Dbric_error
    constructor: ( ref, type, value ) -> super ref, "unable to express a #{type} as SQL literal, got #{rpr value}"
  class E.Dbric_sql_not_a_list_error      extends E.Dbric_error
    constructor: ( ref, type, value ) -> super ref, "expected a list, got a #{type}"
  class E.Dbric_expected_string extends E.Dbric_error
    constructor: ( ref, type ) -> super ref, "expected a string, got a #{type}"
  class E.Dbric_expected_json_object_string extends E.Dbric_error
    constructor: ( ref, value ) -> super ref, "expected serialized JSON object, got #{rpr value}"
  class E.Dbric_unknown_sequence          extends E.Dbric_error
    constructor: ( ref, name )        -> super ref, "unknown sequence #{rpr name}"
  # class E.Dbric_unknown_variable          extends E.Dbric_error
  #   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"

  #---------------------------------------------------------------------------------------------------------
  # class E.Dbric_cfg_error                 extends E.Dbric_error
  #   constructor: ( ref, message )     -> super ref, message
  # class E.Dbric_internal_error            extends E.Dbric_error
  #   constructor: ( ref, message )     -> super ref, message
  # class E.Dbric_schema_exists             extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} already exists"
  # class E.Dbric_schema_unknown            extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} does not exist"
  # class E.Dbric_object_unknown            extends E.Dbric_error
  #   constructor: ( ref, schema, name )-> super ref, "object #{rpr schema + '.' + name} does not exist"
  # class E.Dbric_schema_nonempty           extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} isn't empty"
  # class E.Dbric_schema_not_allowed        extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} not allowed here"
  # class E.Dbric_schema_repeated           extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "unable to copy schema to itself, got #{rpr schema}"
  # class E.Dbric_expected_single_row       extends E.Dbric_error
  #   constructor: ( ref, row_count )   -> super ref, "expected 1 row, got #{row_count}"
  # class E.Dbric_expected_single_value       extends E.Dbric_error
  #   constructor: ( ref, keys )        -> super ref, "expected row with single field, got fields #{rpr keys}"
  # class E.Dbric_extension_unknown         extends E.Dbric_error
  #   constructor: ( ref, path )        -> super ref, "extension of path #{path} is not registered for any format"
  # class E.Dbric_not_implemented           extends E.Dbric_error
  #   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
  # class E.Dbric_deprecated                extends E.Dbric_error
  #   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
  # class E.Dbric_unexpected_db_object_type extends E.Dbric_error
  #   constructor: ( ref, type, value ) -> super ref, "µ769 unknown type #{rpr type} of DB object #{d}"
  # class E.Dbric_unexpected_sql            extends E.Dbric_error
  #   constructor: ( ref, sql )         -> super ref, "unexpected SQL string #{rpr sql}"
  # class E.Dbric_sqlite_too_many_dbs       extends E.Dbric_error
  #   constructor: ( ref, schema )      -> super ref, "unable to attach schema #{rpr schema}: too many attached databases"
  # class E.Dbric_sqlite_error              extends E.Dbric_error
  #   constructor: ( ref, error )       -> super ref, "#{error.code ? 'SQLite error'}: #{error.message}"
  # class E.Dbric_no_arguments_allowed      extends E.Dbric_error
  #   constructor: ( ref, name, arity ) -> super ref, "method #{rpr name} doesn't take arguments, got #{arity}"
  # class E.Dbric_argument_not_allowed      extends E.Dbric_error
  #   constructor: ( ref, name, value ) -> super ref, "argument #{rpr name} not allowed, got #{rpr value}"
  # class E.Dbric_argument_missing          extends E.Dbric_error
  #   constructor: ( ref, name )        -> super ref, "expected value for #{rpr name}, got nothing"
  # class E.Dbric_wrong_type                extends E.Dbric_error
  #   constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
  # class E.Dbric_wrong_arity               extends E.Dbric_error
  #   constructor: ( ref, name, min, max, found ) -> super ref, "#{rpr name} expected between #{min} and #{max} arguments, got #{found}"
  # class E.Dbric_empty_csv                 extends E.Dbric_error
  #   constructor: ( ref, path )        -> super ref, "no CSV records found in file #{path}"
  # class E.Dbric_interpolation_format_unknown extends E.Dbric_error
  #   constructor: ( ref, format )      -> super ref, "unknown interpolation format #{rpr format}"
  # class E.Dbric_no_nested_transactions    extends E.Dbric_error
  #   constructor: ( ref )              -> super ref, "cannot start a transaction within a transaction"
  # class E.Dbric_no_deferred_fks_in_tx     extends E.Dbric_error
  #   constructor: ( ref )              -> super ref, "cannot defer foreign keys inside a transaction"
  # class E.Dbric_invalid_timestamp         extends E.Dbric_error
  #   constructor: ( ref, x )           -> super ref, "not a valid Dbric timestamp: #{rpr x}"

  # ### TAINT replace with more specific error, like below ###
  # class E.Dbric_format_unknown extends E.Dbric_error
  #   constructor: ( ref, format ) ->
  #     super ref, "unknown DB format #{ref format}"

  # class E.Dbric_import_format_unknown extends E.Dbric_error
  #   constructor: ( ref, format ) ->
  #     formats = [ ( require './types' )._import_formats..., ].join ', '
  #     super ref, "unknown import format #{rpr format} (known formats are #{formats})"

  return exports = E


#===========================================================================================================
### NOTE Future Single-File Module ###
require_dbric = ->

  #=========================================================================================================
  SFMODULES                       = require './main'
  { hide,
    set_getter,                 } = SFMODULES.require_managed_property_tools()
  { type_of,                    } = SFMODULES.unstable.require_type_of()
  { rpr,                        } = ( require './loupe-brics' ).require_loupe()
  # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
  # { nameit,                     } = SFMODULES.require_nameit()
  # { rpr_string,                 } = SFMODULES.require_rpr_string()
  { lets,
    freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
  { nfa,                        } = require 'normalize-function-arguments'
  SQLITE                          = require 'node:sqlite'
  { debug,
    warn                        } = console
  misfit                          = Symbol 'misfit'
  { get_prototype_chain,
    get_all_in_prototype_chain, } = SFMODULES.unstable.require_get_prototype_chain()
  { Undumper,                   } = SFMODULES.require_coarse_sqlite_statement_segmenter()
  E                               = require_dbric_errors()

  #---------------------------------------------------------------------------------------------------------
  ### TAINT put into separate module ###
  ### TAINT rewrite with `get_all_in_prototype_chain()` ###
  ### TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` ###
  get_property_descriptor = ( x, name, fallback = misfit ) ->
    while x?
      return R if ( R = Object.getOwnPropertyDescriptor x, name )?
      x = Object.getPrototypeOf x
    return fallback unless fallback is misfit
    throw new Error "unable to find descriptor for property #{String(name)} not found on object or its prototypes"

  #---------------------------------------------------------------------------------------------------------
  build_statement_re = ///
    ^ \s*
    insert | (
      ( create | alter ) \s+
      (?<type> table | view | index | trigger ) \s+
      (?<name> \S+ ) \s+
      )
    ///is

  #---------------------------------------------------------------------------------------------------------
  templates =
    create_function_cfg:
      deterministic:  true
      varargs:        false
      directOnly:     false
      overwrite:      false
    #.......................................................................................................
    create_aggregate_function_cfg:
      deterministic:  true
      varargs:        false
      directOnly:     false
      start:          null
      overwrite:      false
    #.......................................................................................................
    create_window_function_cfg:
      deterministic:  true
      varargs:        false
      directOnly:     false
      start:          null
      overwrite:      false
    #.......................................................................................................
    create_table_function_cfg:
      deterministic:  true
      varargs:        false
      directOnly:     false
      overwrite:      false
    #.......................................................................................................
    create_virtual_table_cfg: {}


  #=========================================================================================================
  ```
  const True  = 1;
  const False = 0;
  ```

  from_bool = ( x ) -> switch x
    when true  then True
    when false then False
    else throw new Error "Ωjzrsdb___1 expected true or false, got #{rpr x}"

  #---------------------------------------------------------------------------------------------------------
  as_bool = ( x ) -> switch x
    when True   then true
    when False  then false
    else throw new Error "Ωjzrsdb___2 expected 0 or 1, got #{rpr x}"


  #=========================================================================================================
  class Esql

    #-------------------------------------------------------------------------------------------------------
    unquote_name: ( name ) ->
      ### TAINT use proper validation ###
      unless ( type = type_of name ) is 'text'
        throw new Error "Ωdbric___3 expected a text, got a #{type}"
      switch true
        when /^[^"](.*)[^"]$/.test  name then return name
        when /^"(.+)"$/.test        name then return name[ 1 ... name.length - 1 ].replace /""/g, '"'
      throw new Error "Ωdbric___4 expected a name, got #{rpr name}"

    #-------------------------------------------------------------------------------------------------------
    IDN: ( name ) => '"' + ( name.replace /"/g, '""' ) + '"'

    #-------------------------------------------------------------------------------------------------------
    LIT: ( x ) =>
      return 'null' unless x?
      switch type = type_of x
        when 'text'       then return  "'" + ( x.replace /'/g, "''" ) + "'"
        # when 'list'       then return "'#{@list_as_json x}'"
        when 'float'      then return x.toString()
        when 'boolean'    then return ( if x then '1' else '0' )
        # when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
      throw new E.Dbric_sql_value_error '^dbay/sql@1^', type, x

    #-------------------------------------------------------------------------------------------------------
    VEC: ( x ) =>
      throw new E.Dbric_sql_not_a_list_error '^dbay/sql@2^', type, x unless ( type = type_of x ) is 'list'
      return '( ' + ( ( @LIT e for e in x ).join ', ' ) + ' )'

    # #-----------------------------------------------------------------------------------------------------
    # interpolate: ( sql, values ) =>
    #   idx = -1
    #   return sql.replace @_interpolation_pattern, ( $0, opener, format, name ) =>
    #     idx++
    #     switch opener
    #       when '$'
    #         validate.nonempty_text name
    #         key = name
    #       when '?'
    #         key = idx
    #     value = values[ key ]
    #     switch format
    #       when '', 'I'  then return @I value
    #       when 'L'      then return @L value
    #       when 'V'      then return @V value
    #     throw new E.Dbric_interpolation_format_unknown '^dbay/sql@3^', format
    # _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g
  #---------------------------------------------------------------------------------------------------------
  esql = new Esql()

  #---------------------------------------------------------------------------------------------------------
  SQL = ( parts, expressions... ) ->
    R = parts[ 0 ]
    for expression, idx in expressions
      R += expression.toString() + parts[ idx + 1 ]
    return R


  #=========================================================================================================
  class Dbric

    #-------------------------------------------------------------------------------------------------------
    @cfg: freeze
      prefix: '(NOPREFIX)'
    @functions:   {}
    @statements:  {}
    @build:       null
    @db_class:    SQLITE.DatabaseSync

    #-------------------------------------------------------------------------------------------------------
    ### TAINT use normalize-function-arguments ###
    constructor: ( db_path, cfg ) ->
      @_validate_is_property 'is_ready'
      @_validate_is_property 'prefix'
      @_validate_is_property 'prefix_re'
      #.....................................................................................................
      db_path                  ?= ':memory:'
      #.....................................................................................................
      clasz                     = @constructor
      db_class                  = ( cfg?.db_class ) ? clasz.db_class
      hide @, 'db',               new db_class db_path
      # @db                       = new SQLITE.DatabaseSync db_path
      @cfg                      = freeze { clasz.cfg..., db_path, cfg..., }
      hide @, 'statements',       {}
      hide @, '_w',               null
      hide @, '_statement_class', ( @db.prepare SQL"select 1;" ).constructor
      hide @, 'state',            ( cfg?.state ) ? { columns: null, }
      #.....................................................................................................
      @run_standard_pragmas()
      @initialize()
      #.....................................................................................................
      fn_cfg_template = { deterministic: true, varargs: false, }
      @_create_udfs()
      #.....................................................................................................
      ### NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
      contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
      the instance. ###
      @is_fresh = not @is_ready
      @build()
      @_prepare_statements()
      return undefined

    #-------------------------------------------------------------------------------------------------------
    isa_statement: ( x ) -> x instanceof @_statement_class

    #-------------------------------------------------------------------------------------------------------
    run_standard_pragmas: ->
      ### not using `@db.pragma` as it is only provided by `better-sqlite3`'s DB class ###
      ( @db.prepare SQL"pragma journal_mode = wal;"   ).run()
      ( @db.prepare SQL"pragma foreign_keys = on;"    ).run()
      ( @db.prepare SQL"pragma busy_timeout = 60000;" ).run() ### time in ms ###
      ( @db.prepare SQL"pragma strict       = on;"    ).run()
      # @db.pragma SQL"journal_mode = wal"
      # @db.pragma SQL"foreign_keys = on"
      return null

    #-------------------------------------------------------------------------------------------------------
    initialize: ->
      ### This method will be called *before* any build statements are executed and before any statements
      in `@constructor.statements` are prepared and is a good place to create user-defined functions
      (UDFs). You probably want to override it with a method that starts with `super()`. ###
      return null

    #-------------------------------------------------------------------------------------------------------
    _validate_is_property: ( name ) ->
      descriptor = get_property_descriptor @, name
      return null if ( type_of descriptor.get ) is 'function'
      throw new Error "Ωdbric___5 not allowed to override property #{rpr name}; use '_get_#{name} instead"

    #-------------------------------------------------------------------------------------------------------
    _get_db_objects: ->
      R = {}
      for dbo from ( @db.prepare SQL"select name, type from sqlite_schema" ).iterate()
        R[ dbo.name ] = { name: dbo.name, type: dbo.type, }
      return R

    #-------------------------------------------------------------------------------------------------------
    teardown: ({ test = null, }={}) ->
      count       = 0
      #.....................................................................................................
      switch true
        when test is '*'
          test = ( name ) -> true
        when ( type_of test ) is 'function'
          null
        when not test?
          prefix_re = @prefix_re
          test = ( name ) -> prefix_re.test name
        else
          type = type_of test
          throw new Error "Ωdbric___6 expected `'*'`, a RegExp, a function, null or undefined, got a #{type}"
      #.....................................................................................................
      ( @prepare SQL"pragma foreign_keys = off;" ).run()
      for _, { name, type, } of @_get_db_objects()
        continue unless test name
        count++
        try
          ( @prepare SQL"drop #{type} #{esql.IDN name};" ).run()
        catch error
          warn "Ωdbric___7 ignored error: #{error.message}" unless /// no \s+ such \s+ #{type}: ///.test error.message
      ( @prepare SQL"pragma foreign_keys = on;" ).run()
      return count

    #-------------------------------------------------------------------------------------------------------
    build: -> if @is_ready then 0 else @rebuild()

    #-------------------------------------------------------------------------------------------------------
    rebuild: ->
      clasz                 = @constructor
      count                 = 0
      build_statements_list = ( get_all_in_prototype_chain clasz, 'build' ).reverse()
      has_torn_down         = false
      #.....................................................................................................
      for build_statements in build_statements_list
        ### TAINT use proper validation ###
        unless ( type = type_of build_statements ) in [ 'undefined', 'null', 'list', ]
          throw new Error "Ωdbric___8 expected an optional list for #{clasz.name}.build, got a #{type}"
        #...................................................................................................
        continue if ( not build_statements? ) or ( build_statements.length is 0 )
        #...................................................................................................
        @teardown() unless has_torn_down
        has_torn_down = true
        #...................................................................................................
        for build_statement in build_statements
          count++
          ( @prepare build_statement ).run()
      #.....................................................................................................
      return count

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'super',            -> Object.getPrototypeOf @constructor
    set_getter @::, 'is_ready',         -> @_get_is_ready()
    set_getter @::, 'prefix',           -> @_get_prefix()
    set_getter @::, 'prefix_re',        -> @_get_prefix_re()
    set_getter @::, '_function_names',  -> @_get_function_names()
    set_getter @::, 'w',                -> @_get_w()

    #-------------------------------------------------------------------------------------------------------
    _get_is_ready: ->
      { error_count,
        statement_count,
        db_objects: expected_db_objects, } = @_get_objects_in_build_statements()
      #.....................................................................................................
      if error_count isnt 0
        messages = []
        for name, { type, message, } of expected_db_objects
          continue unless type is 'error'
          messages.push message
        throw new Error "Ωdbric___9 #{error_count} out of #{statement_count} build statement(s) could not be parsed: #{rpr messages}"
      #.....................................................................................................
      present_db_objects = @_get_db_objects()
      for name, { type: expected_type, } of expected_db_objects
        return false unless present_db_objects[ name ]?.type is expected_type
      return true

    #-------------------------------------------------------------------------------------------------------
    _get_prefix: ->
      return '' if ( not @cfg.prefix? ) or ( @cfg.prefix is '(NOPREFIX)' )
      return @cfg.prefix

    #-------------------------------------------------------------------------------------------------------
    _get_prefix_re: ->
      return /|/ if @prefix is ''
      return /// ^ _? #{RegExp.escape @prefix} _ .* $ ///

    #-------------------------------------------------------------------------------------------------------
    _get_w: ->
      return @_w if @_w?
      @_w = new @constructor @cfg.db_path, { db_class: @db.constructor, state: @state, }
      return @_w

    #-------------------------------------------------------------------------------------------------------
    _get_function_names: -> new Set ( name for { name, } from \
      @walk SQL"select name from pragma_function_list() order by name;" )

    #-------------------------------------------------------------------------------------------------------
    _get_objects_in_build_statements: ->
      ### TAINT does not yet deal with quoted names ###
      clasz           = @constructor
      db_objects      = {}
      statement_count = 0
      error_count     = 0
      for statement in clasz.build ? []
        statement_count++
        if ( match = statement.match build_statement_re )?
          { name,
            type, }           = match.groups
          continue unless name? ### NOTE ignore statements like `insert` ###
          name                = esql.unquote_name name
          db_objects[ name ]  = { name, type, }
        else
          error_count++
          name                = "error_#{statement_count}"
          type                = 'error'
          message             = "non-conformant statement: #{rpr statement}"
          db_objects[ name ]  = { name, type, message, }
      return { error_count, statement_count, db_objects, }

    #-------------------------------------------------------------------------------------------------------
    _prepare_statements: ->
      # #...................................................................................................
      # for name, sql of clasz.statements
      #   switch true
      #     when name.startsWith 'create_table_'
      #       null
      #     when name.startsWith 'insert_'
      #       null
      #     else
      #       throw new Error "Ωnql__10 unable to parse statement name #{rpr name}"
      # #   @[ name ] = @prepare sql
      clasz = @constructor
      statements_list = ( get_all_in_prototype_chain clasz, 'statements' ).reverse()
      for statements in statements_list
        for statement_name, statement of statements
          if @statements[ statement_name ]?
            throw new Error "Ωdbric__11 statement #{rpr statement_name} is already declared"
          # if ( type_of statement ) is 'list'
          #   @statements[ statement_name ] = ( @prepare sub_statement for sub_statement in statement )
          #   continue
          @statements[ statement_name ] = @prepare statement
      return null

    #-------------------------------------------------------------------------------------------------------
    execute: ( sql ) -> @db.exec sql

    #-------------------------------------------------------------------------------------------------------
    walk:       ( sql, P... ) -> ( @prepare sql ).iterate P...
    get_all:    ( sql, P... ) -> [ ( @walk sql, P... )..., ]
    get_first:  ( sql, P... ) -> ( @get_all sql, P... )[ 0 ] ? null

    #-------------------------------------------------------------------------------------------------------
    prepare: ( sql ) ->
      return sql if @isa_statement sql
      unless ( type = type_of sql ) is 'text'
        throw new Error "Ωdbric__12 expected a statement or a text, got a #{type}"
      try
        R = @db.prepare sql
      catch cause
        throw new Error "Ωdbric__13 when trying to prepare the following statement, an error with message: #{rpr cause.message} was thrown: #{rpr sql}", { cause, }
      @state.columns = ( try R?.columns?() catch error then null ) ? []
      return R

    #=======================================================================================================
    # FUNCTIONS
    #-------------------------------------------------------------------------------------------------------
    _create_udfs: ->
      clasz               = @constructor
      ### TAINT should be put somewhere else? ###
      names_of_callables  =
        function:             [ 'value', ]
        aggregate_function:   [ 'start', 'step', 'result', ]
        window_function:      [ 'start', 'step', 'inverse', 'result', ]
        table_function:       [ 'rows', ]
        virtual_table:        [ 'rows', ]
      #.....................................................................................................
      for category in [ 'function', \
        'aggregate_function', 'window_function', 'table_function', 'virtual_table', ]
        property_name     = "#{category}s"
        method_name       = "create_#{category}"
        declarations_list = ( get_all_in_prototype_chain clasz, property_name ).reverse()
        for declarations in declarations_list
          continue unless declarations?
          #.................................................................................................
          for udf_name, fn_cfg of declarations
            #...............................................................................................
            fn_cfg = lets fn_cfg, ( d ) =>
              d.name ?= udf_name
              #.............................................................................................
              ### bind UDFs to `this` ###
              for name_of_callable in names_of_callables[ category ]
                continue unless ( callable = d[ name_of_callable ] )?
                d[ name_of_callable ] = callable.bind @
              return null
            @[ method_name ] fn_cfg
      #.....................................................................................................
      return null

    #-------------------------------------------------------------------------------------------------------
    create_function: ( cfg ) ->
      if ( type_of @db.function ) isnt 'function'
        throw new Error "Ωdbric__14 DB adapter class #{rpr @db.constructor.name} does not provide user-defined functions"
      { name,
        overwrite,
        value,
        directOnly,
        deterministic,
        varargs,        } = { templates.create_function_cfg..., cfg..., }
      if ( not overwrite ) and ( @_function_names.has name )
        throw new Error "Ωdbric__15 a UDF or built-in function named #{rpr name} has already been declared"
      return @db.function name, { deterministic, varargs, directOnly, }, value

    #-------------------------------------------------------------------------------------------------------
    create_aggregate_function: ( cfg ) ->
      if ( type_of @db.aggregate ) isnt 'function'
        throw new Error "Ωdbric__16 DB adapter class #{rpr @db.constructor.name} does not provide user-defined aggregate functions"
      { name,
        overwrite,
        start,
        step,
        result,
        directOnly,
        deterministic,
        varargs,        } = { templates.create_aggregate_function_cfg..., cfg..., }
      if ( not overwrite ) and ( @_function_names.has name )
        throw new Error "Ωdbric__17 a UDF or built-in function named #{rpr name} has already been declared"
      return @db.aggregate name, { start, step, result, deterministic, varargs, directOnly, }

    #-------------------------------------------------------------------------------------------------------
    create_window_function: ( cfg ) ->
      if ( type_of @db.aggregate ) isnt 'function'
        throw new Error "Ωdbric__18 DB adapter class #{rpr @db.constructor.name} does not provide user-defined window functions"
      { name,
        overwrite,
        start,
        step,
        inverse,
        result,
        directOnly,
        deterministic,
        varargs,        } = { templates.create_window_function_cfg..., cfg..., }
      if ( not overwrite ) and ( @_function_names.has name )
        throw new Error "Ωdbric__19 a UDF or built-in function named #{rpr name} has already been declared"
      return @db.aggregate name, { start, step, inverse, result, deterministic, varargs, directOnly, }

    #-------------------------------------------------------------------------------------------------------
    create_table_function: ( cfg ) ->
      if ( type_of @db.table ) isnt 'function'
        throw new Error "Ωdbric__20 DB adapter class #{rpr @db.constructor.name} does not provide table-valued user-defined functions"
      { name,
        overwrite,
        parameters,
        columns,
        rows,
        directOnly,
        deterministic,
        varargs,        } = { templates.create_table_function_cfg..., cfg..., }
      if ( not overwrite ) and ( @_function_names.has name )
        throw new Error "Ωdbric__21 a UDF or built-in function named #{rpr name} has already been declared"
      return @db.table name, { parameters, columns, rows, deterministic, varargs, directOnly, }

    #-------------------------------------------------------------------------------------------------------
    create_virtual_table: ( cfg ) ->
      if ( type_of @db.table ) isnt 'function'
        throw new Error "Ωdbric__22 DB adapter class #{rpr @db.constructor.name} does not provide user-defined virtual tables"
      { name,
        overwrite,
        create,   } = { templates.create_virtual_table_cfg..., cfg..., }
      if ( not overwrite ) and ( @_function_names.has name )
        throw new Error "Ωdbric__23 a UDF or built-in function named #{rpr name} has already been declared"
      return @db.table name, create


  #=========================================================================================================
  class Dbric_std_base extends Dbric

    #-------------------------------------------------------------------------------------------------------
    @cfg: freeze
      prefix: 'std'

    #=======================================================================================================
    @functions:

      #-----------------------------------------------------------------------------------------------------
      regexp:
        deterministic: true
        value: ( pattern, text ) -> if ( ( new RegExp pattern, 'v' ).test text ) then 1 else 0

      #-----------------------------------------------------------------------------------------------------
      std_is_uc_normal:
        ### NOTE: also see `String::isWellFormed()` ###
        deterministic: true
        value: ( text, form = 'NFC' ) -> from_bool text is text.normalize form ### 'NFC', 'NFD', 'NFKC', or 'NFKD' ###

      #-----------------------------------------------------------------------------------------------------
      std_normalize_text:
        deterministic: true
        value: ( text, form = 'NFC' ) -> @std_normalize_text text, form

      #---------------------------------------------------------------------------------------------------
      std_normalize_json_object:
        deterministic: true
        value: ( data, form = 'NFC' ) -> @std_normalize_json_object data, form

    #=======================================================================================================
    @table_functions:

      #-----------------------------------------------------------------------------------------------------
      std_generate_series:
        columns:      [ 'value', ]
        parameters:   [ 'start', 'stop', 'step', ]
        ### NOTE defaults and behavior as per https://sqlite.org/series.html#overview ###
        rows: ( start, stop = 4_294_967_295, step = 1 ) ->
          step  = 1 if step is 0 ### NOTE equivalent `( Object.is step, +0 ) or ( Object.is step, -0 ) ###
          value = start
          loop
            if step > 0 then  break if value > stop
            else              break if value < stop
            yield { value, }
            value += step
          ;null

    #=======================================================================================================
    @statements:
      std_get_schema: SQL"""
        select * from sqlite_schema;"""
      std_get_tables: SQL"""
        select * from sqlite_schema where type is 'table';"""
      std_get_views: SQL"""
        select * from sqlite_schema where type is 'view';"""
      std_get_relations: SQL"""
        select * from sqlite_schema where type in ( 'table', 'view' );"""

    #-------------------------------------------------------------------------------------------------------
    ### select name, builtin, type from pragma_function_list() ###

    #-------------------------------------------------------------------------------------------------------
    @build: [
      SQL"""create view std_tables    as select * from sqlite_schema where type is 'table';"""
      SQL"""create view std_views     as select * from sqlite_schema where type is 'view';"""
      SQL"""create view std_relations as select * from sqlite_schema where type in ( 'table', 'view' );"""
      SQL"""create table std_variables (
          name      text      unique  not null,
          value     json              not null default 'null',
          delta     integer               null default null,
        primary key ( name )
        constraint "Ωconstraint__24" check ( ( delta is null ) or ( delta != 0 ) )
        );"""
      SQL"""insert into std_variables ( name, value, delta ) values ( 'seq:global:rowid', 0, +1 );"""
      ]

    #=======================================================================================================
    ### UDF implementations ###
    #-------------------------------------------------------------------------------------------------------
    std_normalize_text: ( text, form = 'NFC' ) -> text.normalize form

    #-------------------------------------------------------------------------------------------------------
    std_normalize_json_object: ( data, form = 'NFC' ) ->
      unless ( type = type_of data ) is 'text'
        throw new E.Dbric_expected_string 'Ωdbric__24', type, data
      return data if data is 'null'
      unless ( data.startsWith '{' ) and ( data.endsWith '}' )
        throw new E.Dbric_expected_json_object_string 'Ωdbric__25', data
      data  = JSON.parse data
      keys  = ( Object.keys data ).sort()
      R     = JSON.stringify Object.fromEntries ( [ k, data[ k ], ] for k in keys )
      return @std_normalize_text R, form


  #=========================================================================================================
  class Dbric_std_variables extends Dbric_std_base

    #-------------------------------------------------------------------------------------------------------
    constructor: ( P... ) ->
      super P...
      @state.std_variables                 ?= freeze {}
      @state.std_transients                ?= freeze {}
      @state.std_within_variables_context  ?= false
      ;undefined

    #=======================================================================================================
    @functions:

      #-----------------------------------------------------------------------------------------------------
      std_get_next_in_sequence:
        deterministic: false
        value:  ( name ) -> @std_get_next_in_sequence name

      #-----------------------------------------------------------------------------------------------------
      std_get_variable:
        deterministic: false
        value:  ( name ) -> @std_get_variable name

    #=======================================================================================================
    @statements:
      set_variable:     SQL"""
        insert into std_variables ( name, value, delta ) values ( $name, $value, $delta )
          on conflict ( name ) do update
            set value = $value, delta = $delta;"""
      get_variables:    SQL"select name, value, delta from std_variables order by name;"

    #=======================================================================================================
    _std_acquire_state: ( transients = {} ) ->
      #.....................................................................................................
      @state.std_variables = lets @state.std_variables, ( v ) =>
        for { name, value, delta, } from @statements.get_variables.iterate()
          value     = JSON.parse value
          v[ name ] = { name, value, delta, }
        ;null
      #.....................................................................................................
      @state.std_transients = lets @state.std_transients, ( t ) ->
        for name, value of transients
          t[ name ] = { name, value, }
        ;null
      #.....................................................................................................
      ;null

    #-------------------------------------------------------------------------------------------------------
    _std_persist_state: ->
      # whisper 'Ωbbdbr__27', "_std_persist_state"
      #.....................................................................................................
      for _, { name, value, delta, } of @state.std_variables
        ### TAINT clear cache in @state.std_variables ? ###
        # whisper 'Ωbbdbr__28', { name, value, delta, }
        delta  ?= null
        value   = JSON.stringify value
        @statements.set_variable.run { name, value, delta, }
      #.....................................................................................................
      @state.std_transients = lets @state.std_transients, ( t ) ->
        delete t[ name ] for name of t
        ;null
      #.....................................................................................................
      ;null

    #-------------------------------------------------------------------------------------------------------
    std_with_variables: ( transients, fn ) ->
      switch arity = arguments.length
        when 1 then [ transients, fn, ] = [ {}, transients, ]
        when 2 then null
        else throw new Error "Ωbbdbr__29 expected 1 or 2 arguments, got #{arity}"
      #.....................................................................................................
      if @state.std_within_variables_context
        throw new Error "Ωbbdbr__30 illegal to nest `std_with_variables()` contexts"
      @state.std_within_variables_context = true
      #.....................................................................................................
      @_std_acquire_state transients
      try
        R = fn()
      finally
        @state.std_within_variables_context = false
        @_std_persist_state()
      return R

    #-------------------------------------------------------------------------------------------------------
    std_set_variable: ( name, value, delta ) ->
      unless @state.std_within_variables_context
        throw new Error "Ωbbdbr__31 illegal to set variable outside of `std_with_variables()` contexts"
      if Reflect.has @state.std_transients, name
        @state.std_transients = lets @state.std_transients, ( t ) => t[ name ] = { name, value, }
      else
        delta ?= null
        @state.std_variables = lets @state.std_variables,   ( v ) => v[ name ] = { name, value, delta, }
      ;null

    #-------------------------------------------------------------------------------------------------------
    std_get_variable: ( name ) ->
      # unless @state.std_within_variables_context
      #   throw new Error "Ωbbdbr__32 illegal to get variable outside of `std_with_variables()` contexts"
      if Reflect.has @state.std_transients, name
        return @state.std_transients[ name ].value
      if Reflect.has @state.std_variables, name
        return @state.std_variables[ name ].value
      throw new Error "Ωbbdbr__33 unknown variable #{rpr name}"
      ;null

    #-------------------------------------------------------------------------------------------------------
    std_get_next_in_sequence: ( name ) ->
      unless @state.std_within_variables_context
        throw new Error "Ωbbdbr__34 illegal to set variable outside of `std_with_variables()` contexts"
      unless ( entry = @state.std_variables[ name ] )?
        throw new Error "Ωbbdbr__35 unknown variable #{rpr name}"
      unless ( delta = entry.delta )?
        throw new Error "Ωbbdbr__36 not a sequence name: #{rpr name}"
      entry.value += delta
      return entry.value

    #-------------------------------------------------------------------------------------------------------
    _show_variables: ->
      store       = Object.fromEntries ( \
        [ name, { value, delta, }, ] \
          for { name, value, delta, } from \
            @statements.get_variables.iterate() )
      cache_names = new Set Object.keys @state.std_variables
      trans_names = new Set Object.keys @state.std_transients
      store_names = new Set Object.keys store
      all_names   = [ ( ( cache_names.union store_names ).union trans_names )..., ].sort()
      R = {}
      for name in all_names
        s         = store[                  name ] ? {}
        c         = @state.std_variables[   name ] ? {}
        t         = @state.std_transients[  name ] ? {}
        gv        = @std_get_variable name
        R[ name ] = { sv: s.value, sd: s.delta, cv: c.value, cd: c.delta, tv: t.value, gv, }
      console.table R
      return R


  #=========================================================================================================
  class Dbric_std extends Dbric_std_variables


  #=========================================================================================================
  return exports = {
    Dbric,
    Dbric_std,
    esql,
    SQL,
    True,
    False,
    from_bool,
    as_bool,
    internals: freeze {
      type_of,
      build_statement_re,
      templates,
      Dbric_std_base,
      Dbric_std_variables, }
    }


#===========================================================================================================
Object.assign module.exports, { require_dbric, require_dbric_errors, }

