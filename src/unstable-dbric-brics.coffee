'use strict'

############################################################################################################
#
#===========================================================================================================
UNSTABLE_DBRIC_BRICS =


  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_dbric: ->

    #=======================================================================================================
    SFMODULES                       = require './main'
    { hide,
      set_getter,                 } = SFMODULES.require_managed_property_tools()
    { type_of,                    } = SFMODULES.unstable.require_type_of()
    # { show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
    { rpr_string,                 } = SFMODULES.require_rpr_string()
    { lets,
      freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
    SQLITE                          = require 'node:sqlite'
    { debug,
      warn                        } = console
    misfit                          = Symbol 'misfit'

    #-------------------------------------------------------------------------------------------------------
    ### TAINT put into separate module ###
    ### TAINT rewrite with `get_all_in_prototype_chain()` ###
    ### TAINT rewrite as `get_first_descriptor_in_prototype_chain()`, `get_first_in_prototype_chain()` ###
    get_property_descriptor = ( x, name, fallback = misfit ) ->
      while x?
        return R if ( R = Object.getOwnPropertyDescriptor x, name )?
        x = Object.getPrototypeOf x
      return fallback unless fallback is misfit
      throw new Error "unable to find descriptor for property #{String(name)} not found on object or its prototypes"

    #-------------------------------------------------------------------------------------------------------
    create_statement_re = ///
      ^ \s*
      create \s+
      (?<type> table | view | index | trigger ) \s+
      (?<name> \S+ ) \s+
      ///is

    #-------------------------------------------------------------------------------------------------------
    templates =
      create_function_cfg:
        deterministic:  true
        varargs:        false
        directOnly:     false
      #.....................................................................................................
      create_aggregate_function_cfg:
        deterministic:  true
        varargs:        false
        directOnly:     false
        start:          null
      #.....................................................................................................
      create_window_function_cfg:
        deterministic:  true
        varargs:        false
        directOnly:     false
        start:          null
      #.....................................................................................................
      create_table_function_cfg:
        deterministic:  true
        varargs:        false
        directOnly:     false
      #.....................................................................................................
      create_virtual_table_cfg: {}

    #-------------------------------------------------------------------------------------------------------
    internals = { type_of, create_statement_re, templates, }


    #===========================================================================================================
    class Esql

      #---------------------------------------------------------------------------------------------------
      unquote_name: ( name ) ->
        ### TAINT use proper validation ###
        unless ( type = type_of name ) is 'text'
          throw new Error "Ωdbric___1 expected a text, got a #{type}"
        switch true
          when /^[^"](.*)[^"]$/.test  name then return name
          when /^"(.+)"$/.test        name then return name[ 1 ... name.length - 1 ].replace /""/g, '"'
        throw new Error "Ωdbric___2 expected a name, got #{rpr_string name}"

      #---------------------------------------------------------------------------------------------------------
      I: ( name ) => '"' + ( name.replace /"/g, '""' ) + '"'

      # #---------------------------------------------------------------------------------------------------------
      # L: ( x ) =>
      #   return 'null' unless x?
      #   switch type = type_of x
      #     when 'text'       then return  "'" + ( x.replace /'/g, "''" ) + "'"
      #     # when 'list'       then return "'#{@list_as_json x}'"
      #     when 'float'      then return x.toString()
      #     when 'boolean'    then return ( if x then '1' else '0' )
      #     # when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
      #   throw new E.DBay_sql_value_error '^dbay/sql@1^', type, x

      # #---------------------------------------------------------------------------------------------------------
      # V: ( x ) =>
      #   throw new E.DBay_sql_not_a_list_error '^dbay/sql@2^', type, x unless ( type = type_of x ) is 'list'
      #   return '( ' + ( ( @L e for e in x ).join ', ' ) + ' )'

      # #---------------------------------------------------------------------------------------------------------
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
      #     throw new E.DBay_interpolation_format_unknown '^dbay/sql@3^', format
      # _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g
    #-------------------------------------------------------------------------------------------------------
    esql = new Esql()

    #-------------------------------------------------------------------------------------------------------
    SQL = ( parts, expressions... ) ->
      R = parts[ 0 ]
      for expression, idx in expressions
        R += expression.toString() + parts[ idx + 1 ]
      return R


    #=======================================================================================================
    class Dbric

      #-----------------------------------------------------------------------------------------------------
      @cfg: Object.freeze
        prefix: '(NOPREFIX)'
      @functions:   {}
      @statements:  {}
      @build:       null
      @db_class:    SQLITE.DatabaseSync

      #-----------------------------------------------------------------------------------------------------
      constructor: ( db_path, cfg ) ->
        @_validate_is_property 'is_ready'
        @_validate_is_property 'prefix'
        @_validate_is_property 'prefix_re'
        #...................................................................................................
        clasz               = @constructor
        hide @, 'db',         new clasz.db_class db_path
        # @db                 = new SQLITE.DatabaseSync db_path
        @cfg                = Object.freeze { clasz.cfg..., db_path, cfg..., }
        ### NOTE we can't just prepare all the statements as they might depend on non-existant DB objects;
        instead, we prepare statements on-demand and cache them here: ###
        hide @, 'statements', {}
        hide @, '_w',         null
        #...................................................................................................
        @run_standard_pragmas()
        @initialize()
        #...................................................................................................
        fn_cfg_template = { deterministic: true, varargs: false, }
        @create_udfs()
        #...................................................................................................
        ### NOTE A 'fresh' DB instance is a DB that should be (re-)built and/or (re-)populated; in
        contradistinction to `Dbric::is_ready`, `Dbric::is_fresh` retains its value for the lifetime of
        the instance. ###
        @is_fresh = not @is_ready
        @build()
        @_prepare_statements()
        return undefined

      #-----------------------------------------------------------------------------------------------------
      run_standard_pragmas: ->
        ### not using `@db.pragma` as it is only provided by `better-sqlite3`'s DB class ###
        ( @db.prepare SQL"pragma journal_mode = wal;"   ).run()
        ( @db.prepare SQL"pragma foreign_keys = on;"    ).run()
        ( @db.prepare SQL"pragma busy_timeout = 60000;" ).run() ### time in ms ###
        ( @db.prepare SQL"pragma strict       = on;"    ).run() ### time in ms ###
        # @db.pragma SQL"journal_mode = wal"
        # @db.pragma SQL"foreign_keys = on"
        return null

      #-----------------------------------------------------------------------------------------------------
      initialize: ->
        ### This method will be called *before* any build statements are executed and before any statements
        in `@constructor.statements` are prepared and is a good place to create user-defined functions
        (UDFs). You probably want to override it with a method that starts with `super()`. ###
        return null

      #-----------------------------------------------------------------------------------------------------
      _validate_is_property: ( name ) ->
        descriptor = get_property_descriptor @, name
        return null if ( type_of descriptor.get ) is 'function'
        throw new Error "Ωdbric___3 not allowed to override property #{rpr_string name}; use '_get_#{name} instead"

      #-----------------------------------------------------------------------------------------------------
      _get_db_objects: ->
        R = {}
        for dbo from ( @db.prepare SQL"select name, type from sqlite_schema" ).iterate()
          R[ dbo.name ] = { name: dbo.name, type: dbo.type, }
        return R

      #-----------------------------------------------------------------------------------------------------
      teardown: ->
        count       = 0
        prefix_re   = @prefix_re
        ( @prepare SQL"pragma foreign_keys = off;" ).run()
        for _, { name, type, } of @_get_db_objects()
          continue unless  prefix_re.test name
          count++
          try
            ( @prepare SQL"drop #{type} #{esql.I name};" ).run()
          catch error
            warn "Ωdbric___4 ignored error: #{error.message}"
        ( @prepare SQL"pragma foreign_keys = on;" ).run()
        return count

      #-----------------------------------------------------------------------------------------------------
      build: -> if @is_ready then 0 else @rebuild()

      #-----------------------------------------------------------------------------------------------------
      rebuild: ->
        clasz         = @constructor
        type_of_build = type_of clasz.build
        #...................................................................................................
        ### TAINT use proper validation ###
        unless type_of_build in [ 'undefined', 'null', 'list', ]
          throw new Error "Ωdbric___5 expected an optional list for #{clasz.name}.build, got a #{type_of_build}"
        #...................................................................................................
        return -1 if ( not clasz.build? )
        return  0 if ( clasz.build.length is 0 )
        #...................................................................................................
        @teardown()
        count = 0
        #...................................................................................................
        for build_statement in clasz.build
          count++
          ( @prepare build_statement ).run()
        return count

      #---------------------------------------------------------------------------------------------------
      set_getter @::, 'is_ready',     -> @_get_is_ready()
      set_getter @::, 'prefix',       -> @_get_prefix()
      set_getter @::, 'prefix_re',    -> @_get_prefix_re()
      set_getter @::, 'w',            -> @_get_w()

      #-----------------------------------------------------------------------------------------------------
      _get_is_ready: ->
        { error_count,
          statement_count,
          db_objects: expected_db_objects, } = @_get_objects_in_build_statements()
        #...................................................................................................
        if error_count isnt 0
          messages = []
          for name, { type, message, } of expected_db_objects
            continue unless type is 'error'
            messages.push message
          throw new Error "Ωdbric___6 #{error_count} out of #{statement_count} build statement(s) could not be parsed: #{rpr_string messages}"
        #...................................................................................................
        present_db_objects = @_get_db_objects()
        for name, { type: expected_type, } of expected_db_objects
          return false unless present_db_objects[ name ]?.type is expected_type
        return true

      #---------------------------------------------------------------------------------------------------
      _get_prefix: ->
        return '' if ( not @cfg.prefix? ) or ( @cfg.prefix is '(NOPREFIX)' )
        return @cfg.prefix

      #---------------------------------------------------------------------------------------------------
      _get_prefix_re: ->
        return /|/ if @prefix is ''
        return /// ^ _? #{RegExp.escape @prefix} _ .* $ ///

      #---------------------------------------------------------------------------------------------------
      _get_w: ->
        return @_w if @_w?
        @_w = @constructor.open @cfg.db_path
        return @_w

      #---------------------------------------------------------------------------------------------------
      _get_objects_in_build_statements: ->
        ### TAINT does not yet deal with quoted names ###
        clasz           = @constructor
        db_objects      = {}
        statement_count = 0
        error_count     = 0
        for statement in clasz.build ? []
          statement_count++
          if ( match = statement.match create_statement_re )?
            { name,
              type, }           = match.groups
            name                = esql.unquote_name name
            db_objects[ name ]  = { name, type, }
          else
            error_count++
            name                = "error_#{statement_count}"
            type                = 'error'
            message             = "non-conformant statement: #{rpr_string statement}"
            db_objects[ name ]  = { name, type, message, }
        return { error_count, statement_count, db_objects, }

      #-----------------------------------------------------------------------------------------------------
      _prepare_statements: ->
        # #.................................................................................................
        # for name, sql of clasz.statements
        #   switch true
        #     when name.startsWith 'create_table_'
        #       null
        #     when name.startsWith 'insert_'
        #       null
        #     else
        #       throw new Error "Ωnql___7 unable to parse statement name #{rpr_string name}"
        # #   @[ name ] = @prepare sql
        hide @, 'statements', {}
        build_statement_name  = @_name_of_build_statements
        for name, statement of @constructor.statements
          # if ( type_of statement ) is 'list'
          #   @statements[ name ] = ( @prepare sub_statement for sub_statement in statement )
          #   continue
          @statements[ name ] = @prepare statement
        return null

      #-----------------------------------------------------------------------------------------------------
      execute: ( sql ) -> @db.exec sql

      #-----------------------------------------------------------------------------------------------------
      walk: ( sql, P... ) -> ( @db.prepare sql ).iterate P...

      #-----------------------------------------------------------------------------------------------------
      prepare: ( sql ) ->
        try
          R = @db.prepare sql
        catch cause
          throw new Error "Ωdbric___8 when trying to prepare the following statement, an error with message: #{rpr_string cause.message} was thrown: #{rpr_string sql}", { cause, }
        return R

      #=====================================================================================================
      # FUNCTIONS
      #-----------------------------------------------------------------------------------------------------
      create_udfs: ->
        clasz               = @constructor
        ### TAINT should be put somewhere else? ###
        names_of_callables  =
          function:             [ 'call', ]
          aggregate_function:   [ 'start', 'step', 'result', ]
          window_function:      [ 'start', 'step', 'inverse', 'result', ]
          table_function:       [ 'rows', ]
          virtual_table:        [ 'rows', ]
        #...................................................................................................
        for category in [ 'function', \
          'aggregate_function', 'window_function', 'table_function', 'virtual_table', ]
          property_name = "#{category}s"
          method_name   = "create_#{category}"
          continue unless ( collection = clasz[ property_name ] )?
          #.................................................................................................
          for name, fn_cfg of collection
            #...............................................................................................
            fn_cfg = lets fn_cfg, ( d ) =>
              d.name ?= name
              #.............................................................................................
              for name_of_callable in names_of_callables[ category ]
                continue unless ( callable = d[ name_of_callable ] )?
                d[ name_of_callable ] = callable.bind @
              return null
            @[ method_name ] fn_cfg
        #...................................................................................................
        return null

      #-----------------------------------------------------------------------------------------------------
      create_function: ( cfg ) ->
        if ( type_of @db.function ) isnt 'function'
          throw new Error "Ωdbric___9 DB adapter class #{rpr_string @db.constructor.name} does not provide user-defined functions"
        { name,
          call,
          directOnly,
          deterministic,
          varargs,        } = { templates.create_function_cfg..., cfg..., }
        return @db.function name, { deterministic, varargs, directOnly, }, call

      #-----------------------------------------------------------------------------------------------------
      create_aggregate_function: ( cfg ) ->
        if ( type_of @db.aggregate ) isnt 'function'
          throw new Error "Ωdbric__10 DB adapter class #{rpr_string @db.constructor.name} does not provide user-defined aggregate functions"
        { name,
          start,
          step,
          result,
          directOnly,
          deterministic,
          varargs,        } = { templates.create_aggregate_function_cfg..., cfg..., }
        return @db.aggregate name, { start, step, result, deterministic, varargs, directOnly, }

      #-----------------------------------------------------------------------------------------------------
      create_window_function: ( cfg ) ->
        if ( type_of @db.aggregate ) isnt 'function'
          throw new Error "Ωdbric__11 DB adapter class #{rpr_string @db.constructor.name} does not provide user-defined window functions"
        { name,
          start,
          step,
          inverse,
          result,
          directOnly,
          deterministic,
          varargs,        } = { templates.create_window_function_cfg..., cfg..., }
        return @db.aggregate name, { start, step, inverse, result, deterministic, varargs, directOnly, }

      #-----------------------------------------------------------------------------------------------------
      create_table_function: ( cfg ) ->
        if ( type_of @db.table ) isnt 'function'
          throw new Error "Ωdbric__12 DB adapter class #{rpr_string @db.constructor.name} does not provide table-valued user-defined functions"
        { name,
          parameters,
          columns,
          rows,
          directOnly,
          deterministic,
          varargs,        } = { templates.create_table_function_cfg..., cfg..., }
        return @db.table name, { parameters, columns, rows, deterministic, varargs, directOnly, }

      #-----------------------------------------------------------------------------------------------------
      create_virtual_table: ( cfg ) ->
        if ( type_of @db.table ) isnt 'function'
          throw new Error "Ωdbric__13 DB adapter class #{rpr_string @db.constructor.name} does not provide user-defined virtual tables"
        { name, create,   } = { templates.create_virtual_table_cfg..., cfg..., }
        return @db.table name, create


    #=======================================================================================================
    class Dbric_std extends Dbric

      #-----------------------------------------------------------------------------------------------------
      @cfg: Object.freeze
        prefix: 'std'

      #-----------------------------------------------------------------------------------------------------
      @functions:   {}

      #-----------------------------------------------------------------------------------------------------
      @statements:
        std_get_schema: SQL"""
          select * from sqlite_schema order by name, type;"""
        std_get_tables: SQL"""
          select * from sqlite_schema where type is 'table' order by name, type;"""
        std_get_views: SQL"""
          select * from sqlite_schema where type is 'view' order by name, type;"""
        std_get_relations: SQL"""
          select * from sqlite_schema where type in ( 'table', 'view' ) order by name, type;"""

      #-----------------------------------------------------------------------------------------------------
      @build: [
        SQL"""create view std_tables as
          select * from sqlite_schema
            where type is 'table' order by name, type;"""
        SQL"""create view std_views as
          select * from sqlite_schema
            where type is 'view' order by name, type;"""
        SQL"""create view "std_relations" as
          select * from sqlite_schema
            where type in ( 'table', 'view' ) order by name, type;"""
        ]


    #=======================================================================================================
    class Segment_width_db extends Dbric

      #-----------------------------------------------------------------------------------------------------
      @functions:
        #...................................................................................................
        width_from_text:
          deterministic:  true
          varargs:        false
          call:           ( text ) -> get_wc_max_line_length text
        #...................................................................................................
        length_from_text:
          deterministic:  true
          varargs:        false
          call:           ( text ) -> text.length

      #-----------------------------------------------------------------------------------------------------
      @statements:
        #...................................................................................................
        create_table_segments: SQL"""
          drop table if exists segments;
          create table segments (
              segment_text      text    not null primary key,
              segment_width     integer not null generated always as ( width_from_text(  segment_text ) ) stored,
              segment_length    integer not null generated always as ( length_from_text( segment_text ) ) stored,
            constraint segment_width_eqgt_zero  check ( segment_width  >= 0 ),
            constraint segment_length_eqgt_zero check ( segment_length >= 0 ) );"""
        # #.................................................................................................
        # insert_segment: SQL"""
        #   insert into segments  ( segment_text,   segment_width,  segment_length  )
        #                 values  ( $segment_text,  $segment_width, $segment_length )
        #     on conflict ( segment_text ) do update
        #                 set     (                 segment_width,  segment_length  ) =
        #                         ( excluded.segment_width, excluded.segment_length );"""
        #...................................................................................................
        insert_segment: SQL"""
          insert into segments  ( segment_text  )
                        values  ( $segment_text )
            on conflict ( segment_text ) do nothing
            returning *;"""
        #...................................................................................................
        select_row_from_segments: SQL"""
          select * from segments where segment_text = $segment_text limit 1;"""

      #-----------------------------------------------------------------------------------------------------
      constructor: ( db_path ) ->
        super db_path
        clasz   = @constructor
        @cache  = new Map()
        ### TAINT should be done automatically ###
        @statements =
          insert_segment:           @prepare clasz.statements.insert_segment
          select_row_from_segments: @prepare clasz.statements.select_row_from_segments
        return undefined

    #=======================================================================================================
    internals = Object.freeze { internals..., Segment_width_db, }
    return exports = {
      Dbric,
      Dbric_std,
      esql,
      SQL,
      internals, }


#===========================================================================================================
Object.assign module.exports, UNSTABLE_DBRIC_BRICS

