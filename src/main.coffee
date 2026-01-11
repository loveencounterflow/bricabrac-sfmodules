
'use strict'

#===========================================================================================================
Object.assign module.exports, require './various-brics'
Object.assign module.exports, require './ansi-brics'
Object.assign module.exports, require './loupe-brics'
Object.assign module.exports, require './dictionary-tools.brics'
Object.assign module.exports, require './get-local-destinations.brics'
Object.assign module.exports, require './walk-js-tokens.brics'
Object.assign module.exports, require './rpr-string.brics'
Object.assign module.exports, require './parse-require-statements.brics'
Object.assign module.exports, require './path-tools.brics'
Object.assign module.exports, require './jetstream.brics'
Object.assign module.exports, require './letsfreezethat-infra.brics'
Object.assign module.exports, require './coarse-sqlite-statement-segmenter.brics'
Object.assign module.exports, require './wc.brics'
Object.assign module.exports, require './unicode-range-tools.brics'
Object.assign module.exports, require './cli-table3a.brics'
Object.assign module.exports, { unstable: {
  ( require './unstable-brics'                                    )...,
  ( require './unstable-benchmark-brics'                          )...,
  ( require './unstable-fast-linereader-brics'                    )...,
  ( require './unstable-getrandom-brics'                          )...,
  ( require './unstable-callsite-brics'                           )...,
  # ( require './unstable-dbric-brics'                              )...,
  ( require './unstable-temp-brics'                               )...,
  ( require './unstable-rpr-type_of-brics'                        )...,
  ( require './unstable-anybase-brics'                            )...,
  ( require './unstable-object-tools-brics'                       )...,
  ( require './unstable-nanotypes-brics'                          )...,
  ( require './unstable-capture-output'                           )...,
  ( require './unstable-normalize-function-arguments-brics'       )...,
  #---------------------------------------------------------------------------------------------------------
  ### NOTE temporary for backwards compatibility ###
  { require_dbric:        ( -> require './dbric' ),                       }...,
  { require_intermission: ( -> require './intermission' ),                }...,
  }, }

