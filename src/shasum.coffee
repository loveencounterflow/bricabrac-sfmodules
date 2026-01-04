
'use strict'

#===========================================================================================================
# { debug, }  = console
CRYPTO = require 'crypto'

#---------------------------------------------------------------------------------------------------------
@get_shasum = ( text, length = null, algorithm = 'sha256', encoding = 'hex' ) ->
  R = ( ( CRYPTO.createHash algorithm ).update text ).digest encoding
  return R unless length?
  return R[ ... length ]

#---------------------------------------------------------------------------------------------------------
@get_sha1sum7d = ( text ) -> @get_shasum text, 7, 'sha1', 'hex'


