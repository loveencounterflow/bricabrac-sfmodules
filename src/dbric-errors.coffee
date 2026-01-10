

'use strict'


#===========================================================================================================
{ rpr,                        } = ( require './loupe-brics' ).require_loupe()
E                               = {}

#===========================================================================================================
class E.Dbric_error extends Error
  constructor: ( ref, message ) ->
    super()
    @message  = "#{ref} (#{@constructor.name}) #{message}"
    @ref      = ref
    return undefined ### always return `undefined` from constructor ###

#---------------------------------------------------------------------------------------------------------
class E.Dbric_sql_value_error           extends E.Dbric_error
  constructor: ( ref, type, value ) -> super ref, "unable to express a #{type} as SQL literal, got #{rpr value}"
class E.Dbric_sql_not_a_list_error      extends E.Dbric_error
  constructor: ( ref, type, value ) -> super ref, "expected a list, got a #{type}"
class E.Dbric_expected_string extends E.Dbric_error
  constructor: ( ref, type ) -> super ref, "expected a string, got a #{type}"
class E.Dbric_expected_string_or_string_val_fn extends E.Dbric_error
  constructor: ( ref, type ) -> super ref, "expected a string or a function that returns a string, got a #{type}"
class E.Dbric_expected_json_object_string extends E.Dbric_error
  constructor: ( ref, value ) -> super ref, "expected serialized JSON object, got #{rpr value}"
class E.Dbric_unknown_sequence          extends E.Dbric_error
  constructor: ( ref, name )        -> super ref, "unknown sequence #{rpr name}"
class E.Dbric_internal_error            extends E.Dbric_error
  constructor: ( ref, message )     -> super ref, message
class E.Dbric_named_statement_exists extends E.Dbric_error
  constructor: ( ref, name )      -> super ref, "statement #{rpr name} is already declared"
# class E.Dbric_unknown_variable          extends E.Dbric_error
#   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"

#---------------------------------------------------------------------------------------------------------
# class E.Dbric_cfg_error                 extends E.Dbric_error
#   constructor: ( ref, message )     -> super ref, message
# class E.Dbric_schema_unknown            extends E.Dbric_error
#   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} does not exist"
# class E.Dbric_object_unknown            extends E.Dbric_error
#   constructor: ( ref, schema, name )-> super ref, "object #{rpr schema + '.' + name} does not exist"
# class E.Dbric_schema_nonempty           extends E.Dbric_error
#   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} isn't empty"
# class E.Dbric_schema_not_allowed        extends E.Dbric_error
#   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} not allowed here"
# class E.Dbric_schema_repeated           extends E.Dbric_error
#   constructor: ( ref, schema )      -> super ref, "unable to copy schema to itself, got #{rpr schema}"
# class E.Dbric_expected_single_row       extends E.Dbric_error
#   constructor: ( ref, row_count )   -> super ref, "expected 1 row, got #{row_count}"
# class E.Dbric_expected_single_value       extends E.Dbric_error
#   constructor: ( ref, keys )        -> super ref, "expected row with single field, got fields #{rpr keys}"
# class E.Dbric_extension_unknown         extends E.Dbric_error
#   constructor: ( ref, path )        -> super ref, "extension of path #{path} is not registered for any format"
# class E.Dbric_not_implemented           extends E.Dbric_error
#   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
# class E.Dbric_deprecated                extends E.Dbric_error
#   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
# class E.Dbric_unexpected_db_object_type extends E.Dbric_error
#   constructor: ( ref, type, value ) -> super ref, "µ769 unknown type #{rpr type} of DB object #{d}"
# class E.Dbric_unexpected_sql            extends E.Dbric_error
#   constructor: ( ref, sql )         -> super ref, "unexpected SQL string #{rpr sql}"
# class E.Dbric_sqlite_too_many_dbs       extends E.Dbric_error
#   constructor: ( ref, schema )      -> super ref, "unable to attach schema #{rpr schema}: too many attached databases"
# class E.Dbric_sqlite_error              extends E.Dbric_error
#   constructor: ( ref, error )       -> super ref, "#{error.code ? 'SQLite error'}: #{error.message}"
# class E.Dbric_no_arguments_allowed      extends E.Dbric_error
#   constructor: ( ref, name, arity ) -> super ref, "method #{rpr name} doesn't take arguments, got #{arity}"
# class E.Dbric_argument_not_allowed      extends E.Dbric_error
#   constructor: ( ref, name, value ) -> super ref, "argument #{rpr name} not allowed, got #{rpr value}"
# class E.Dbric_argument_missing          extends E.Dbric_error
#   constructor: ( ref, name )        -> super ref, "expected value for #{rpr name}, got nothing"
# class E.Dbric_wrong_type                extends E.Dbric_error
#   constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
# class E.Dbric_wrong_arity               extends E.Dbric_error
#   constructor: ( ref, name, min, max, found ) -> super ref, "#{rpr name} expected between #{min} and #{max} arguments, got #{found}"
# class E.Dbric_empty_csv                 extends E.Dbric_error
#   constructor: ( ref, path )        -> super ref, "no CSV records found in file #{path}"
# class E.Dbric_interpolation_format_unknown extends E.Dbric_error
#   constructor: ( ref, format )      -> super ref, "unknown interpolation format #{rpr format}"
# class E.Dbric_no_nested_transactions    extends E.Dbric_error
#   constructor: ( ref )              -> super ref, "cannot start a transaction within a transaction"
# class E.Dbric_no_deferred_fks_in_tx     extends E.Dbric_error
#   constructor: ( ref )              -> super ref, "cannot defer foreign keys inside a transaction"
# class E.Dbric_invalid_timestamp         extends E.Dbric_error
#   constructor: ( ref, x )           -> super ref, "not a valid Dbric timestamp: #{rpr x}"

# ### TAINT replace with more specific error, like below ###
# class E.Dbric_format_unknown extends E.Dbric_error
#   constructor: ( ref, format ) ->
#     super ref, "unknown DB format #{ref format}"

# class E.Dbric_import_format_unknown extends E.Dbric_error
#   constructor: ( ref, format ) ->
#     formats = [ ( require './types' )._import_formats..., ].join ', '
#     super ref, "unknown import format #{rpr format} (known formats are #{formats})"

module.exports = { E, }

