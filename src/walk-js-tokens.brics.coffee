
'use strict'

#===========================================================================================================
{ debug, } = console


############################################################################################################
#
#===========================================================================================================
BRICS =

  #=========================================================================================================
  ### NOTE Future Single-File Module ###
  require_walk_js_tokens: ->
    { rpr_string, } = ( require './rpr-string.brics' ).require_rpr_string()
    jsTokens        = require './_js-tokens'

    #-------------------------------------------------------------------------------------------------------
    token_categories = do =>
      R                           = {}
      #.....................................................................................................
      R.nonessentials             = ( new Set [                         ] )
      R.literals                  = ( new Set [                         ] )
      R.newline                   = ( new Set [                         ] )
      R.system                    = ( new Set [                         ] )
      #.....................................................................................................
      R.eof                       = ( new Set [ 'system',               ] ).union R.system
      R.comments                  = ( new Set [ 'nonessentials',        ] ).union R.nonessentials
      R.whitespace                = ( new Set [ 'nonessentials',        ] ).union R.nonessentials
      R.primitive_literals        = ( new Set [ 'literals',             ] ).union R.literals
      #.....................................................................................................
      R.string_literals           = ( new Set [ 'primitive_literals',   ] ).union R.primitive_literals
      #.....................................................................................................
      R.LineTerminatorSequence    = ( new Set [ 'newline',              ] ).union R.newline
      R.WhiteSpace                = ( new Set [ 'whitespace',           ] ).union R.whitespace
      R.HashbangComment           = ( new Set [ 'comments',             ] ).union R.comments
      R.MultiLineComment          = ( new Set [ 'comments',             ] ).union R.comments
      R.SingleLineComment         = ( new Set [ 'comments',             ] ).union R.comments
      R.StringLiteral             = ( new Set [ 'string_literals',      ] ).union R.string_literals
      R.NoSubstitutionTemplate    = ( new Set [ 'string_literals',      ] ).union R.string_literals
      R.NumericLiteral            = ( new Set [ 'primitive_literals',   ] ).union R.primitive_literals
      R.RegularExpressionLiteral  = ( new Set [ 'primitive_literals',   ] ).union R.primitive_literals
      # TokensNotPrecedingObjectLiteral:  new Set [ 'literals', ] ### ??? ###
      return R

    #-------------------------------------------------------------------------------------------------------
    walk_js_tokens = ( source ) ->
      line_nr = 1
      for token from jsTokens source
        line_nr++ if ( token.type is 'LineTerminatorSequence' )
        categories = token_categories[ token.type ] ? new Set()
        yield { token..., line_nr, categories, }
      yield { type: 'eof', }
      return null

    #-------------------------------------------------------------------------------------------------------
    walk_essential_js_tokens = ( source ) ->
      for token from walk_js_tokens source
        continue if token.categories?.has 'nonessentials'
        yield token
      return null

    #-------------------------------------------------------------------------------------------------------
    rpr_token = ( token ) -> token.type + ( if token.value? then ( rpr_string token.value ) else '' )

    #-------------------------------------------------------------------------------------------------------
    summarize = ( tokens, joiner = '&&&' ) ->
      return joiner + ( ( ( rpr_token t ) for t from tokens ).join joiner ) + joiner

    #.......................................................................................................
    return exports = { walk_js_tokens, walk_essential_js_tokens, summarize, }
    # return exports = {
    #   walk_js_tokens,
    #   walk_essential_js_tokens,
    #   rpr_token,
    #   summarize,
    #   internals: {
    #     token_categories,
    #     tokens: {
    #       HashbangComment,
    #       Identifier,
    #       JSXIdentifier,
    #       JSXPunctuator,
    #       JSXString,
    #       JSXText,
    #       KeywordsWithExpressionAfter,
    #       KeywordsWithNoLineTerminatorAfter,
    #       LineTerminatorSequence,
    #       MultiLineComment,
    #       Newline,
    #       NumericLiteral,
    #       Punctuator,
    #       RegularExpressionLiteral,
    #       SingleLineComment,
    #       StringLiteral,
    #       Template,
    #       TokensNotPrecedingObjectLiteral,
    #       TokensPrecedingExpression,
    #       WhiteSpace, }, }, }

#===========================================================================================================
Object.assign module.exports, BRICS




