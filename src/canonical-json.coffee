
'use strict'

#===========================================================================================================
# { debug, }  = console
canonicalize              = require 'canonicalize'
{ get_shasum,
  get_sha1sum7d, }        = require './shasum'

#---------------------------------------------------------------------------------------------------------
@serialize                = ( x       ) => canonicalize x
@serialize_with_shasum    = ( x, P... ) => shasum = get_shasum    json = canonicalize x; { json, shasum, }
@serialize_with_sha1sum7d = ( x, P... ) => shasum = get_sha1sum7d json = canonicalize x; { json, shasum, }
@parse                    = ( json    ) => JSON.parse json

