'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_parse_require_statements: ->

    #=======================================================================================================
    FS                          = require 'node:fs'
    PATH                        = require 'node:path'
    { rpr_string,             } = ( require './rpr-string.brics' ).require_rpr_string()
    { walk_js_tokens,
      walk_essential_js_tokens,
      rpr_token,
      summarize,              } = ( require './walk-js-tokens.brics'    ).require_walk_js_tokens()
    { get_app_details,        } = ( require './unstable-callsite-brics' ).require_get_app_details()
    { nfa,
      get_signature,          } = require 'normalize-function-arguments'
    #.......................................................................................................
    object_prototype            = Object.getPrototypeOf {}
    types                       =
      pod:                      isa: ( x ) -> x? and ( Object.getPrototypeOf x ) in [ null, object_prototype, ]
      text:                     isa: ( x ) -> ( typeof x ) is 'string'
      nonempty_text:            isa: ( x ) -> ( types.text.isa x ) and ( x.length > 0 )
      optional_nonempty_text:   isa: ( x ) -> ( not x? ) or ( type.nonempty_text.isa x )
    #.......................................................................................................
    walk_require_statements_cfg =
      template:   { path: null, source: null, }
      isa:        ( x ) ->
        return false unless types.pod.isa x
        return false unless types.optional_nonempty_text.isa x.path
        return false unless types.optional_nonempty_text.isa x.source
        return false if (     x.path? ) and (     x.source? )
        return false if ( not x.path? ) and ( not x.source? )
        return true

    #=======================================================================================================
    walk_require_statements = nfa ( path, cfg ) ->
    # walk_require_statements = nfa walk_require_statements_cfg, ( path, cfg ) ->
      if cfg.path?
        path        = FS.realpathSync path
        source      = ( FS.readFileSync path, { encoding: 'utf-8', } )
        app_details = get_app_details { path, }
        debug 'Ωparest___1', app_details
      else
        source      = cfg.source
        app_details = null
      #.....................................................................................................
      abspath       = null
      relpath       = null
      lines         = null
      stages        =
        start:                Symbol 'start'
        found_require:        Symbol 'found_require'
        found_left_paren:     Symbol 'found_left_paren'
        found_string_literal: Symbol 'found_string_literal'
        found_right_paren:    Symbol 'found_right_paren'
      #.....................................................................................................
      stage         = stages.start
      package_name  = null
      line_nr       = null
      #.....................................................................................................
      reset = ->
        stage         = stages.start
        package_name  = null
        line_nr       = null
        return null
      #.....................................................................................................
      warning_from_token = ( token ) ->
        lines  ?= [ null, ( source.split '\n' )..., ]
        line    = lines[ token.line_nr ] ? "(ERROR: UNABLE TO RETRIEVE SOURCE)"
        message = "ignoring possible `require` on line #{token.line_nr}: #{rpr_string line}"
        return { type: 'warning', message, line, line_nr: token.line_nr, }
      #.....................................................................................................
      for token from walk_js_tokens source
        # continue if token.type is 'warning'
        continue if token.categories?.has 'whitespace'
        #...................................................................................................
        switch stage
          #.................................................................................................
          when stages.start
            unless ( token.type is 'IdentifierName' ) and ( token.value is 'require' )
              reset()
              continue
            stage = stages.found_require
            line_nr = token.line_nr
          #.................................................................................................
          when stages.found_require
            unless ( token.type is 'Punctuator' ) and ( token.value is '(' )
              yield warning_from_token token
              reset()
              continue
            stage = stages.found_left_paren
          #.................................................................................................
          when stages.found_left_paren
            unless ( token.categories.has 'string_literals' )
              yield warning_from_token token
              reset()
              continue
            package_name    = eval token.value
            stage     = stages.found_string_literal
          #.................................................................................................
          when stages.found_string_literal
            unless ( token.type is 'Punctuator' ) and ( token.value is ')' )
              yield warning_from_token token
              reset()
              continue
            stage       = stages.found_right_paren
            #...............................................................................................
            switch true
              #.............................................................................................
              when package_name.startsWith 'node:'  then package_type = 'node'
              #.............................................................................................
              when package_name.startsWith './'
                if app_details? then  package_type = 'inside'
                else                  package_type = 'local'
              #.............................................................................................
              when package_name.startsWith '../'
                if app_details?
                  abspath = PATH.resolve ( PATH.dirname cfg.path ), package_name
                  relpath = PATH.relative app_details.path, abspath
                  debug 'Ωparest___2', { abspath, relpath, }
                  if relpath.startsWith '../' then  package_type = 'outside'
                  else                              package_type = 'inside'
                else
                  package_type = 'local'
              #.............................................................................................
              else 'npm'
          #.................................................................................................
          when stages.found_right_paren
            switch true
              # when ( ( token.type is 'Punctuator') and ( token.value is ';' ) ) then null
              when ( token.type in [ 'eof', 'LineTerminatorSequence', ]       ) then annotation = null
              when ( token.type is 'SingleLineComment'                        )
                annotation = token.value.replace /^\s*\/\/\s*/, ''
              else continue
            yield { type: 'require', line_nr, package_type, package_name, annotation, }
            # yield { type: 'require', path, line_nr, package_name, }
            reset()
      #.....................................................................................................
      return null

    #.......................................................................................................
    return exports = { walk_require_statements, internals: {}, }

#===========================================================================================================
Object.assign module.exports, BRICS




