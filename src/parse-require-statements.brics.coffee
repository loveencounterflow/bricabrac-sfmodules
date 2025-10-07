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
    { is_inside,              } = ( require './path-tools.brics' ).require_path_tools()
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
        return true if (     x.path? ) and (     x.source? )
        return true if (     x.path? )
        return true if (     x.source? )
        return false

    #=======================================================================================================
    # walk_require_statements = nfa walk_require_statements_cfg, ( path, cfg ) ->
    walk_require_statements = nfa ( path, cfg ) ->
      if cfg.path?
        path        = FS.realpathSync cfg.path
        anchor      = PATH.dirname path
        source      = if cfg.source? then cfg.source else ( FS.readFileSync path, { encoding: 'utf-8', } )
        app_details = get_app_details { path, }
      #.....................................................................................................
      else
        path        = null # if ( cfg.path? ) then ( PATH.resolve cfg.path ) else null
        anchor      = null
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
      reset = ->
        state.stage           = stages.start
        state.selector        = null
        state.disposition     = null
        state.line_nr         = null
        return null
      #.....................................................................................................
      state         = {}
      reset()
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
        switch state.stage
          #.................................................................................................
          when stages.start
            unless ( token.type is 'IdentifierName' ) and ( token.value is 'require' )
              reset()
              continue
            state.stage     = stages.found_require
            state.line_nr   = token.line_nr
          #.................................................................................................
          when stages.found_require
            unless ( token.type is 'Punctuator' ) and ( token.value is '(' )
              yield warning_from_token token
              reset()
              continue
            state.stage     = stages.found_left_paren
          #.................................................................................................
          when stages.found_left_paren
            unless ( token.categories.has 'string_literals' )
              yield warning_from_token token
              reset()
              continue
            state.selector  = eval token.value
            state.stage     = stages.found_string_literal
          #.................................................................................................
          when stages.found_string_literal
            unless ( token.type is 'Punctuator' ) and ( token.value is ')' )
              yield warning_from_token token
              reset()
              continue
            state.stage     = stages.found_right_paren
            #...............................................................................................
            switch true
              #.............................................................................................
              when state.selector.startsWith 'node:'            then  state.disposition = 'node'
              when not /// ^ \.{1,2} \/ ///.test state.selector then  state.disposition = 'npm'
              when app_details?
                pkg_location = PATH.resolve anchor, state.selector
                if ( is_inside app_details.path, pkg_location ) then  state.disposition = 'inside'
                else                                                  state.disposition = 'outside'
              else
                state.disposition                                                       = 'unresolved'
          #.................................................................................................
          when stages.found_right_paren
            switch true
              # when ( ( token.type is 'Punctuator') and ( token.value is ';' ) ) then null
              when ( token.type in [ 'eof', 'LineTerminatorSequence', ]       ) then annotation = null
              when ( token.type is 'SingleLineComment'                        )
                annotation = token.value.replace /^\s*\/\/\s*/, ''
              else continue
            yield {
              type:             'require',
              line_nr:          state.line_nr,
              disposition:      state.disposition,
              selector:         state.selector,
              annotation, }
            reset()
      #.....................................................................................................
      return null

    #.......................................................................................................
    return exports = { walk_require_statements, internals: {}, }

#===========================================================================================================
Object.assign module.exports, BRICS




