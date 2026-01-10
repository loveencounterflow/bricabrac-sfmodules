

'use-strict'


{ Dbric,
  Dbric_std,
  SQL,
  IDN,
  LIT,
  SQL,
  VEC,
  True,
  False,
  as_bool,
  from_bool,
  unquote_name,
  internals: int_main, } = require './dbric-main'
{ Dbric_std,
  internals: int_std, } = require './dbric-std'

  # : {
  #   E,
  #   type_of,
  #   build_statement_re,
  #   templates,
  #   Dbric_std_base,
  #   Dbric_std_variables, }

module.exports = {
  Dbric,
  Dbric_std,
  SQL,
  IDN,
  LIT,
  SQL,
  VEC,
  True,
  False,
  as_bool,
  from_bool,
  unquote_name,
  internals: { int_main..., int_std..., }, }


