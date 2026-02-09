

'use strict'


#===========================================================================================================
# { debug,                } = console
{ rpr,                  } = ( require './loupe-brics' ).require_loupe()
{ Type,
  Typespace,            } = ( require './unstable-nanotypes-brics' ).require_nanotypes_v2()


#===========================================================================================================
class Intermission_typespace extends Typespace

  #---------------------------------------------------------------------------------------------------------
  @integer: ( x ) ->
    @assign { x, }
    return true if Number.isSafeInteger x
    return true if x is +Infinity
    return true if x is -Infinity
    return @fail "#{rpr x} is a non-integer number", { fraction: x % 1, } if Number.isFinite x
    return @fail "#{rpr x} is not even a finite number"

  #---------------------------------------------------------------------------------------------------------
  @text: ( x ) ->
    @assign { x, }
    return true if ( typeof x ) is 'string'
    ;false

  #---------------------------------------------------------------------------------------------------------
  @point: ( x ) ->
    @assign { x, }
    return true if ( @T.integer.isa x )
    return @fail "#{rpr x} is not an integer and not a text"          unless ( @T.text.isa x )
    return @fail "#{rpr x} is a text but not with a single codepoint" unless ( ( Array.from x ).length is 1 )
    ;true
    # return true if Number.isSafeInteger x
    # return @fail "#{rpr x} is a non-integer number", { fraction: x % 1, } if Number.isFinite x
    # return @fail "#{rpr x} is not even a finite number"

#===========================================================================================================
module.exports = { T: ( new Intermission_typespace() ), }


