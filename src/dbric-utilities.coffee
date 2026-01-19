
'use strict'

#===========================================================================================================
{ type_of,                    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
{ rpr,                        } = ( require './loupe-brics' ).require_loupe()
{ E,                          } = require './dbric-errors'


```
const True  = 1;
const False = 0;
```

#-----------------------------------------------------------------------------------------------------------
from_bool = ( x ) -> switch x
  when true  then True
  when false then False
  else throw new Error "Ωdbricu___1 expected true or false, got #{rpr x}"

#-----------------------------------------------------------------------------------------------------------
as_bool = ( x ) -> switch x
  when True   then true
  when False  then false
  else throw new Error "Ωdbricu___2 expected 0 or 1, got #{rpr x}"

#-----------------------------------------------------------------------------------------------------------
unquote_name = ( name ) ->
  ### TAINT use proper validation ###
  unless ( type = type_of name ) is 'text'
    throw new Error "Ωdbricu___3 expected a text, got a #{type}"
  if name is ''
    throw new Error "Ωdbricu___4 expected a non-empty text, got an empty text"
  if ( ( name.startsWith '"' ) and ( name.endsWith '"' ) )
    if name.length < 2
      throw new Error "Ωdbricu___5 expected a quoted non-empty text, got a quote"
    return name[ 1 ... name.length - 1 ].replace /""/g, '"'
  if ( ( name.startsWith "'" ) and ( name.endsWith "'" ) )
    return name[ 1 ... name.length - 1 ]
  return name

#-----------------------------------------------------------------------------------------------------------
IDN = ( name ) -> '"' + ( name.replace /"/g, '""' ) + '"'

#-----------------------------------------------------------------------------------------------------------
LIT = ( x ) ->
  return 'null' unless x?
  switch type = type_of x
    when 'text'       then return  "'" + ( x.replace /'/g, "''" ) + "'"
    # when 'list'       then return "'#{@list_as_json x}'"
    when 'float'      then return x.toString()
    when 'boolean'    then return ( if x then '1' else '0' )
    # when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
  throw new E.Dbric_sql_value_error 'Ωdbricu___6^', type, x

#-----------------------------------------------------------------------------------------------------------
VEC = ( x ) ->
  throw new E.Dbric_sql_not_a_list_error 'Ωdbricu___7^', type, x unless ( type = type_of x ) is 'list'
  return '( ' + ( ( LIT e for e in x ).join ', ' ) + ' )'

#-----------------------------------------------------------------------------------------------------------
SQL = ( parts, expressions... ) ->
  R = parts[ 0 ]
  for expression, idx in expressions
    R += expression.toString() + parts[ idx + 1 ]
  return R

# #-------------------------------------------------------------------------------------------------------
# interpolate = ( sql, values ) ->
#   idx = -1
#   return sql.replace @_interpolation_pattern, ( $0, opener, format, name ) ->
#     idx++
#     switch opener
#       when '$'
#         validate.nonempty_text name
#         key = name
#       when '?'
#         key = idx
#     value = values[ key ]
#     switch format
#       when '', 'I'  then return @I value
#       when 'L'      then return @L value
#       when 'V'      then return @V value
#     throw new E.Dbric_interpolation_format_unknown 'Ωdbricu___8^', format
# _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g


#===========================================================================================================
module.exports = Object.freeze { True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL, }
