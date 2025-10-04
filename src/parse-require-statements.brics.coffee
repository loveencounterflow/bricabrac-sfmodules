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
      history       = 0
      package_name  = null
      line_nr       = null
      #.....................................................................................................
      reset = ->
        history       = 0
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
        switch history
          #.................................................................................................
          when 0
            unless ( token.type is 'IdentifierName' ) and ( token.value is 'require' )
              reset()
              continue
            history = 1
            line_nr = token.line_nr
          #.................................................................................................
          when 1
            unless ( token.type is 'Punctuator' ) and ( token.value is '(' )
              yield warning_from_token token
              reset()
              continue
            history = 2
          #.................................................................................................
          when 2
            unless ( token.categories.has 'string_literals' )
              yield warning_from_token token
              reset()
              continue
            package_name    = eval token.value
            history     = 3
          #.................................................................................................
          when 3
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




