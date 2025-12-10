'use strict'


############################################################################################################
#
#===========================================================================================================
### NOTE Future Single-File Module ###
require_unicode_range_tools = ->

  #=========================================================================================================
  SFMODULES                       = require './main'
  { type_of,                    } = SFMODULES.unstable.require_type_of()
  { rpr_string,                 } = SFMODULES.require_rpr_string()
  { debug,
    warn                        } = console
  { nfa,                        } = require 'normalize-function-arguments'
  #.........................................................................................................
  # { hide,
  #   set_getter,                 } = SFMODULES.require_managed_property_tools()
  # { lets,
  #   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
  # misfit                          = Symbol 'misfit'

  #=========================================================================================================
  templates =
    range:
      lo:         0x000000
      hi:         0x10ffff

    from_regex:
      regex:      /|/
      lo:         0x000000
      hi:         0x10ffff
      skip: [
        { lo: 0x00e000, hi: 0x00efff, } # BMP PUAs
        { lo: 0x00d800, hi: 0x00dfff, } # Surrogates
        { lo: 0x0f0000, hi: 0x10ffff, } # PUA-A, PUA-B
        # { lo: 0x0f0000, hi: 0x0fffff, } # PUA-A
        # { lo: 0x100000, hi: 0x10ffff, } # PUA-B
        ]

  #---------------------------------------------------------------------------------------------------------
  types =
    float:    isa: ( x ) -> Number.isFinite x
    integer:  isa: ( x ) -> Number.isInteger x
    cid:      isa: ( x ) ->
      return false unless @integer.isa x
      return false unless 0x000000 <= x <= 0x10ffff
      return true
    cid_pair: isa: ( x ) ->
      return false unless Array.isArray x
      return false unless x.length is 2
      return false unless @cid.isa x[ 0 ]
      return false unless @cid.isa x[ 1 ]
      return false unless x[ 0 ] <= x[ 1 ]
      return true

  #---------------------------------------------------------------------------------------------------------
  isas =
    range: ( x ) ->
      # debug 'Ωucrt___1', x
      return true
      types.cid_pair [ x.lo, x.hi, ]

  #---------------------------------------------------------------------------------------------------------
  cid_matches_regex = ( cid, regex ) -> regex.test ( String.fromCodePoint cid )

  #=========================================================================================================
  internals = { templates, isas, cid_matches_regex, }

  #=========================================================================================================
  class Range

    #-------------------------------------------------------------------------------------------------------
    constructor: nfa { isa: isas.range, template: templates.range, }, ( lo, hi, cfg ) ->
      @lo = cfg.lo
      @hi = cfg.hi
      ;undefined

    #-------------------------------------------------------------------------------------------------------
    includes: ( cid ) -> @lo <= cid <= @hi


  #=========================================================================================================
  class Rangeset

    #-------------------------------------------------------------------------------------------------------
    constructor: ( ranges... ) ->
      @ranges = []
      for range in ranges
        range = new Range range unless range instanceof Range
        @ranges.push range
      ;undefined

    #-------------------------------------------------------------------------------------------------------
    includes: ( cid ) -> @ranges.some ( r ) -> r.includes cid

    #-------------------------------------------------------------------------------------------------------
    @from_regex: nfa { template: templates.from_regex, }, ( regex, cfg ) ->
      skip        = new Rangeset cfg.skip...
      R           = []
      range       = null
      #.....................................................................................................
      for cid in [ cfg.lo .. cfg.hi ] ### TAINT allow multiple inclusion ranges ###
        #...................................................................................................
        if ( not skip.includes cid ) and ( cid_matches_regex cid, regex )
          unless range?
            range = { lo: cid, }
            R.push range
        #...................................................................................................
        else
          if range?
            range.hi  = cid - 1
            range     = null
      #.....................................................................................................
      debug 'Ωucrt___1', R
      return new Rangeset R...

  #=========================================================================================================
  return exports = { Range, Rangeset, internals, }

#===========================================================================================================
module.exports = { require_unicode_range_tools, }




#-----------------------------------------------------------------------------------------------------------
show_ranges = ( ranges ) ->
  count = 0
  for range in ranges
    count += range[ 1 ] - range[ 0 ] + 1
  help "found #{format_integer count} glyphs for #{rpr pattern}"
  for range in ranges
    [ first_cid, last_cid, ]  = range
    last_cid                 ?= first_cid
    glyphs                    = []
    for cid in [ first_cid .. ( Math.min first_cid + 10, last_cid ) ]
      glyphs.push String.fromCodePoint cid
    glyphs = glyphs.join ''
    first_cid_hex = "0x#{first_cid.toString 16}"
    last_cid_hex  = "0x#{last_cid.toString 16}"
    count_txt     = format_integer last_cid - first_cid + 1
    help "#{first_cid_hex} .. #{last_cid_hex} #{rpr glyphs} (#{count_txt})"



# #-----------------------------------------------------------------------------------------------------------
# # pattern_A   = /^\p{Script=Latin}$/u
# # pattern_B   = /^\p{Script_Extensions=Latin}$/u
# ### see https://github.com/mathiasbynens/regexpu-core/blob/master/property-escapes.md ###
# patterns    = []
# # patterns.push /^\p{Script_Extensions=Latin}$/u
# # patterns.push /^\p{Script=Latin}$/u
# # # patterns.push /^\p{Script_Extensions=Cyrillic}$/u
# # # patterns.push /^\p{Script_Extensions=Greek}$/u
# # patterns.push /^\p{Unified_Ideograph}$/u
# # patterns.push /^\p{Script=Han}$/u
# # patterns.push /^\p{Script_Extensions=Han}$/u
# # patterns.push /^\p{Ideographic}$/u
# # patterns.push /^\p{IDS_Binary_Operator}$/u
# # patterns.push /^\p{IDS_Trinary_Operator}$/u
# # patterns.push /^\p{Radical}$/u
# # patterns.push /^\p{Script_Extensions=Hiragana}$/u
# # patterns.push /^\p{Script=Hiragana}$/u
# # patterns.push /^\p{Script_Extensions=Katakana}$/u
# # patterns.push /^\p{Script=Katakana}$/u
# # patterns.push /^\p{ID_Continue}$/u
# patterns.push /^\p{Pattern_White_Space}$/u
# patterns.push /^\p{White_Space}$/u
# # patterns.push /^\p{Script_Extensions=Hangul}$/u
# for pattern in patterns
#   whisper '————————————————————————————'
#   whisper pattern
#   show_ranges walk_ranges_from_pattern pattern

# # info isa.text_with_hiragana 'あいうえおか'
# # info isa.text_with_hiragana 'あいうえおかx'
# # info isa.text_with_hiragana 'abc'
# # info isa.text_hiragana      'あいうえおか'
# # info isa.text_hiragana      'あいうえおかx'

