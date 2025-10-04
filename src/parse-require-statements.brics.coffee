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
      summarize,              } = ( require './walk-js-tokens.brics' ).require_walk_js_tokens()

    #=======================================================================================================
    walk_require_statements = ( path ) ->
      source        = FS.readFileSync path, { encoding: 'utf-8', }
      lines         = null
      #.....................................................................................................
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
      for token from walk_essential_js_tokens source
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
            package_type = switch true
              when package_name.startsWith 'node:'  then 'node'
              when package_name.startsWith './'     then 'local'
              when package_name.startsWith '../'    then 'local'
              else 'npm'
            yield { type: 'require', line_nr, package_type, package_name, }
            # yield { type: 'require', path, line_nr, package_name, }
            reset()
      #.....................................................................................................
      return null

    #.......................................................................................................
    return exports = { walk_require_statements, internals: {}, }

#===========================================================================================================
Object.assign module.exports, BRICS




