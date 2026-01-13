(function() {
  'use strict';
  var E, rpr;

  //===========================================================================================================
  ({rpr} = (require('./loupe-brics')).require_loupe());

  E = {};

  //===========================================================================================================
  E.Dbric_error = class Dbric_error extends Error {
    constructor(ref, message) {
      super();
      this.message = `${ref} (${this.constructor.name}) ${message}`;
      this.ref = ref;
      return void 0/* always return `undefined` from constructor */;
    }

  };

  // create = ( name, constructor ) ->
  //   return

    //---------------------------------------------------------------------------------------------------------
  E.Dbric_sql_value_error = class Dbric_sql_value_error extends E.Dbric_error {
    constructor(ref, type, value) {
      super(ref, `unable to express a ${type} as SQL literal, got ${rpr(value)}`);
    }

  };

  E.Dbric_sql_not_a_list_error = class Dbric_sql_not_a_list_error extends E.Dbric_error {
    constructor(ref, type, value) {
      super(ref, `expected a list, got a ${type}`);
    }

  };

  E.Dbric_expected_string = class Dbric_expected_string extends E.Dbric_error {
    constructor(ref, type) {
      super(ref, `expected a string, got a ${type}`);
    }

  };

  E.Dbric_expected_string_or_string_val_fn = class Dbric_expected_string_or_string_val_fn extends E.Dbric_error {
    constructor(ref, type) {
      super(ref, `expected a string or a function that returns a string, got a ${type}`);
    }

  };

  E.Dbric_expected_json_object_string = class Dbric_expected_json_object_string extends E.Dbric_error {
    constructor(ref, value) {
      super(ref, `expected serialized JSON object, got ${rpr(value)}`);
    }

  };

  E.Dbric_unknown_sequence = class Dbric_unknown_sequence extends E.Dbric_error {
    constructor(ref, name) {
      super(ref, `unknown sequence ${rpr(name)}`);
    }

  };

  E.Dbric_internal_error = class Dbric_internal_error extends E.Dbric_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

  E.Dbric_named_statement_exists = class Dbric_named_statement_exists extends E.Dbric_error {
    constructor(ref, name) {
      super(ref, `statement ${rpr(name)} is already declared`);
    }

  };

  E.Dbric_no_prefix_configured = class Dbric_no_prefix_configured extends E.Dbric_error {
    constructor(ref, instance) {
      super(ref, `no prefix configured for this instance of ${instance.constructor.name}`);
    }

  };

  E.Dbric_not_a_wellformed_prefix = class Dbric_not_a_wellformed_prefix extends E.Dbric_error {
    constructor(ref, prefix) {
      super(ref, `prefix not well-formed: ${rpr(prefix)}`);
    }

  };

  // class E.Dbric_unknown_variable          extends E.Dbric_error
  //   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"

  //---------------------------------------------------------------------------------------------------------
  // class E.Dbric_cfg_error                 extends E.Dbric_error
  //   constructor: ( ref, message )     -> super ref, message
  // class E.Dbric_schema_unknown            extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} does not exist"
  // class E.Dbric_object_unknown            extends E.Dbric_error
  //   constructor: ( ref, schema, name )-> super ref, "object #{rpr schema + '.' + name} does not exist"
  // class E.Dbric_schema_nonempty           extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} isn't empty"
  // class E.Dbric_schema_not_allowed        extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} not allowed here"
  // class E.Dbric_schema_repeated           extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "unable to copy schema to itself, got #{rpr schema}"
  // class E.Dbric_expected_single_row       extends E.Dbric_error
  //   constructor: ( ref, row_count )   -> super ref, "expected 1 row, got #{row_count}"
  // class E.Dbric_expected_single_value       extends E.Dbric_error
  //   constructor: ( ref, keys )        -> super ref, "expected row with single field, got fields #{rpr keys}"
  // class E.Dbric_extension_unknown         extends E.Dbric_error
  //   constructor: ( ref, path )        -> super ref, "extension of path #{path} is not registered for any format"
  // class E.Dbric_not_implemented           extends E.Dbric_error
  //   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
  // class E.Dbric_deprecated                extends E.Dbric_error
  //   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
  // class E.Dbric_unexpected_db_object_type extends E.Dbric_error
  //   constructor: ( ref, type, value ) -> super ref, "µ769 unknown type #{rpr type} of DB object #{d}"
  // class E.Dbric_unexpected_sql            extends E.Dbric_error
  //   constructor: ( ref, sql )         -> super ref, "unexpected SQL string #{rpr sql}"
  // class E.Dbric_sqlite_too_many_dbs       extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "unable to attach schema #{rpr schema}: too many attached databases"
  // class E.Dbric_sqlite_error              extends E.Dbric_error
  //   constructor: ( ref, error )       -> super ref, "#{error.code ? 'SQLite error'}: #{error.message}"
  // class E.Dbric_no_arguments_allowed      extends E.Dbric_error
  //   constructor: ( ref, name, arity ) -> super ref, "method #{rpr name} doesn't take arguments, got #{arity}"
  // class E.Dbric_argument_not_allowed      extends E.Dbric_error
  //   constructor: ( ref, name, value ) -> super ref, "argument #{rpr name} not allowed, got #{rpr value}"
  // class E.Dbric_argument_missing          extends E.Dbric_error
  //   constructor: ( ref, name )        -> super ref, "expected value for #{rpr name}, got nothing"
  // class E.Dbric_wrong_type                extends E.Dbric_error
  //   constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
  // class E.Dbric_wrong_arity               extends E.Dbric_error
  //   constructor: ( ref, name, min, max, found ) -> super ref, "#{rpr name} expected between #{min} and #{max} arguments, got #{found}"
  // class E.Dbric_empty_csv                 extends E.Dbric_error
  //   constructor: ( ref, path )        -> super ref, "no CSV records found in file #{path}"
  // class E.Dbric_interpolation_format_unknown extends E.Dbric_error
  //   constructor: ( ref, format )      -> super ref, "unknown interpolation format #{rpr format}"
  // class E.Dbric_no_nested_transactions    extends E.Dbric_error
  //   constructor: ( ref )              -> super ref, "cannot start a transaction within a transaction"
  // class E.Dbric_no_deferred_fks_in_tx     extends E.Dbric_error
  //   constructor: ( ref )              -> super ref, "cannot defer foreign keys inside a transaction"
  // class E.Dbric_invalid_timestamp         extends E.Dbric_error
  //   constructor: ( ref, x )           -> super ref, "not a valid Dbric timestamp: #{rpr x}"

  // ### TAINT replace with more specific error, like below ###
  // class E.Dbric_format_unknown extends E.Dbric_error
  //   constructor: ( ref, format ) ->
  //     super ref, "unknown DB format #{ref format}"

  // class E.Dbric_import_format_unknown extends E.Dbric_error
  //   constructor: ( ref, format ) ->
  //     formats = [ ( require './types' )._import_formats..., ].join ', '
  //     super ref, "unknown import format #{rpr format} (known formats are #{formats})"
  module.exports = {E};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLWVycm9ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEdBQUE7OztFQUlBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLEdBQWtDLENBQUEsRUFMbEM7OztFQVFNLENBQUMsQ0FBQyxjQUFSLE1BQUEsWUFBQSxRQUE0QixNQUE1QjtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sT0FBUCxDQUFBO1dBQ1gsQ0FBQTtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVksQ0FBQSxDQUFBLENBQUcsR0FBSCxDQUFBLEVBQUEsQ0FBQSxDQUFXLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBeEIsQ0FBQSxFQUFBLENBQUEsQ0FBaUMsT0FBakMsQ0FBQTtNQUNaLElBQUMsQ0FBQSxHQUFELEdBQVk7QUFDWixhQUFPLE1BQVU7SUFKTjs7RUFEZixFQVJBOzs7Ozs7RUFtQk0sQ0FBQyxDQUFDLHdCQUFSLE1BQUEsc0JBQUEsUUFBOEYsQ0FBQyxDQUFDLFlBQWhHO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLEVBQWEsS0FBYixDQUFBO1dBQTBCLENBQU0sR0FBTixFQUFXLENBQUEsb0JBQUEsQ0FBQSxDQUF1QixJQUF2QixDQUFBLHFCQUFBLENBQUEsQ0FBbUQsR0FBQSxDQUFJLEtBQUosQ0FBbkQsQ0FBQSxDQUFYO0lBQTFCOztFQURmOztFQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQThGLENBQUMsQ0FBQyxZQUFoRztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTtXQUEwQixDQUFNLEdBQU4sRUFBVyxDQUFBLHVCQUFBLENBQUEsQ0FBMEIsSUFBMUIsQ0FBQSxDQUFYO0lBQTFCOztFQURmOztFQUVNLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQThGLENBQUMsQ0FBQyxZQUFoRztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQTBCLENBQU0sR0FBTixFQUFXLENBQUEseUJBQUEsQ0FBQSxDQUE0QixJQUE1QixDQUFBLENBQVg7SUFBMUI7O0VBRGY7O0VBRU0sQ0FBQyxDQUFDLHlDQUFSLE1BQUEsdUNBQUEsUUFBOEYsQ0FBQyxDQUFDLFlBQWhHO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLENBQUE7V0FBMEIsQ0FBTSxHQUFOLEVBQVcsQ0FBQSw2REFBQSxDQUFBLENBQWdFLElBQWhFLENBQUEsQ0FBWDtJQUExQjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsb0NBQVIsTUFBQSxrQ0FBQSxRQUE4RixDQUFDLENBQUMsWUFBaEc7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLEtBQVAsQ0FBQTtXQUEwQixDQUFNLEdBQU4sRUFBVyxDQUFBLHFDQUFBLENBQUEsQ0FBd0MsR0FBQSxDQUFJLEtBQUosQ0FBeEMsQ0FBQSxDQUFYO0lBQTFCOztFQURmOztFQUVNLENBQUMsQ0FBQyx5QkFBUixNQUFBLHVCQUFBLFFBQThGLENBQUMsQ0FBQyxZQUFoRztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQTBCLENBQU0sR0FBTixFQUFXLENBQUEsaUJBQUEsQ0FBQSxDQUFvQixHQUFBLENBQUksSUFBSixDQUFwQixDQUFBLENBQVg7SUFBMUI7O0VBRGY7O0VBRU0sQ0FBQyxDQUFDLHVCQUFSLE1BQUEscUJBQUEsUUFBOEYsQ0FBQyxDQUFDLFlBQWhHO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxPQUFQLENBQUE7V0FBMEIsQ0FBTSxHQUFOLEVBQVcsT0FBWDtJQUExQjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsK0JBQVIsTUFBQSw2QkFBQSxRQUE4RixDQUFDLENBQUMsWUFBaEc7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsQ0FBQTtXQUEwQixDQUFNLEdBQU4sRUFBVyxDQUFBLFVBQUEsQ0FBQSxDQUFhLEdBQUEsQ0FBSSxJQUFKLENBQWIsQ0FBQSxvQkFBQSxDQUFYO0lBQTFCOztFQURmOztFQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQThGLENBQUMsQ0FBQyxZQUFoRztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sUUFBUCxDQUFBO1dBQTBCLENBQU0sR0FBTixFQUFXLENBQUEsMENBQUEsQ0FBQSxDQUE2QyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQWxFLENBQUEsQ0FBWDtJQUExQjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsZ0NBQVIsTUFBQSw4QkFBQSxRQUE4RixDQUFDLENBQUMsWUFBaEc7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLE1BQVAsQ0FBQTtXQUEwQixDQUFNLEdBQU4sRUFBVyxDQUFBLHdCQUFBLENBQUEsQ0FBMkIsR0FBQSxDQUFJLE1BQUosQ0FBM0IsQ0FBQSxDQUFYO0lBQTFCOztFQURmLEVBckNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUF3R0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxDQUFGO0FBeEdqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG5FICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgLT5cbiAgICBzdXBlcigpXG4gICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICBAcmVmICAgICAgPSByZWZcbiAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiMgY3JlYXRlID0gKCBuYW1lLCBjb25zdHJ1Y3RvciApIC0+XG4jICAgcmV0dXJuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gZXhwcmVzcyBhICN7dHlwZX0gYXMgU1FMIGxpdGVyYWwsIGdvdCAje3JwciB2YWx1ZX1cIlxuY2xhc3MgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG5jbGFzcyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUgKSAgICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgYSBzdHJpbmcsIGdvdCBhICN7dHlwZX1cIlxuY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zdHJpbmdfb3Jfc3RyaW5nX3ZhbF9mbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlICkgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgc3RyaW5nLCBnb3QgYSAje3R5cGV9XCJcbmNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfanNvbl9vYmplY3Rfc3RyaW5nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgdmFsdWUgKSAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBzZXJpYWxpemVkIEpTT04gb2JqZWN0LCBnb3QgI3tycHIgdmFsdWV9XCJcbmNsYXNzIEUuRGJyaWNfdW5rbm93bl9zZXF1ZW5jZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHNlcXVlbmNlICN7cnByIG5hbWV9XCJcbmNsYXNzIEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuY2xhc3MgRS5EYnJpY19uYW1lZF9zdGF0ZW1lbnRfZXhpc3RzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcInN0YXRlbWVudCAje3JwciBuYW1lfSBpcyBhbHJlYWR5IGRlY2xhcmVkXCJcbmNsYXNzIEUuRGJyaWNfbm9fcHJlZml4X2NvbmZpZ3VyZWQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgaW5zdGFuY2UgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJubyBwcmVmaXggY29uZmlndXJlZCBmb3IgdGhpcyBpbnN0YW5jZSBvZiAje2luc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9XCJcbmNsYXNzIEUuRGJyaWNfbm90X2Ffd2VsbGZvcm1lZF9wcmVmaXggICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgcHJlZml4ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJwcmVmaXggbm90IHdlbGwtZm9ybWVkOiAje3JwciBwcmVmaXh9XCJcbiMgY2xhc3MgRS5EYnJpY191bmtub3duX3ZhcmlhYmxlICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY2xhc3MgRS5EYnJpY19jZmdfZXJyb3IgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiMgY2xhc3MgRS5EYnJpY19zY2hlbWFfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gZG9lcyBub3QgZXhpc3RcIlxuIyBjbGFzcyBFLkRicmljX29iamVjdF91bmtub3duICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEsIG5hbWUgKS0+IHN1cGVyIHJlZiwgXCJvYmplY3QgI3tycHIgc2NoZW1hICsgJy4nICsgbmFtZX0gZG9lcyBub3QgZXhpc3RcIlxuIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub25lbXB0eSAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBpc24ndCBlbXB0eVwiXG4jIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vdF9hbGxvd2VkICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IG5vdCBhbGxvd2VkIGhlcmVcIlxuIyBjbGFzcyBFLkRicmljX3NjaGVtYV9yZXBlYXRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gY29weSBzY2hlbWEgdG8gaXRzZWxmLCBnb3QgI3tycHIgc2NoZW1hfVwiXG4jIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3JvdyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHJvd19jb3VudCApICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIDEgcm93LCBnb3QgI3tyb3dfY291bnR9XCJcbiMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfdmFsdWUgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBrZXlzICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCByb3cgd2l0aCBzaW5nbGUgZmllbGQsIGdvdCBmaWVsZHMgI3tycHIga2V5c31cIlxuIyBjbGFzcyBFLkRicmljX2V4dGVuc2lvbl91bmtub3duICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHRlbnNpb24gb2YgcGF0aCAje3BhdGh9IGlzIG5vdCByZWdpc3RlcmVkIGZvciBhbnkgZm9ybWF0XCJcbiMgY2xhc3MgRS5EYnJpY19ub3RfaW1wbGVtZW50ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBpc24ndCBpbXBsZW1lbnRlZCAoeWV0KVwiXG4jIGNsYXNzIEUuRGJyaWNfZGVwcmVjYXRlZCAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaGFzIGJlZW4gZGVwcmVjYXRlZFwiXG4jIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9kYl9vYmplY3RfdHlwZSBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcIsK1NzY5IHVua25vd24gdHlwZSAje3JwciB0eXBlfSBvZiBEQiBvYmplY3QgI3tkfVwiXG4jIGNsYXNzIEUuRGJyaWNfdW5leHBlY3RlZF9zcWwgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNxbCApICAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVuZXhwZWN0ZWQgU1FMIHN0cmluZyAje3JwciBzcWx9XCJcbiMgY2xhc3MgRS5EYnJpY19zcWxpdGVfdG9vX21hbnlfZGJzICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGF0dGFjaCBzY2hlbWEgI3tycHIgc2NoZW1hfTogdG9vIG1hbnkgYXR0YWNoZWQgZGF0YWJhc2VzXCJcbiMgY2xhc3MgRS5EYnJpY19zcWxpdGVfZXJyb3IgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZXJyb3IgKSAgICAgICAtPiBzdXBlciByZWYsIFwiI3tlcnJvci5jb2RlID8gJ1NRTGl0ZSBlcnJvcid9OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiMgY2xhc3MgRS5EYnJpY19ub19hcmd1bWVudHNfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgYXJpdHkgKSAtPiBzdXBlciByZWYsIFwibWV0aG9kICN7cnByIG5hbWV9IGRvZXNuJ3QgdGFrZSBhcmd1bWVudHMsIGdvdCAje2FyaXR5fVwiXG4jIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbm90X2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImFyZ3VtZW50ICN7cnByIG5hbWV9IG5vdCBhbGxvd2VkLCBnb3QgI3tycHIgdmFsdWV9XCJcbiMgY2xhc3MgRS5EYnJpY19hcmd1bWVudF9taXNzaW5nICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgdmFsdWUgZm9yICN7cnByIG5hbWV9LCBnb3Qgbm90aGluZ1wiXG4jIGNsYXNzIEUuRGJyaWNfd3JvbmdfdHlwZSAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGVzLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkICN7dHlwZXN9LCBnb3QgYSAje3R5cGV9XCJcbiMgY2xhc3MgRS5EYnJpY193cm9uZ19hcml0eSAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgbWluLCBtYXgsIGZvdW5kICkgLT4gc3VwZXIgcmVmLCBcIiN7cnByIG5hbWV9IGV4cGVjdGVkIGJldHdlZW4gI3ttaW59IGFuZCAje21heH0gYXJndW1lbnRzLCBnb3QgI3tmb3VuZH1cIlxuIyBjbGFzcyBFLkRicmljX2VtcHR5X2NzdiAgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBwYXRoICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJubyBDU1YgcmVjb3JkcyBmb3VuZCBpbiBmaWxlICN7cGF0aH1cIlxuIyBjbGFzcyBFLkRicmljX2ludGVycG9sYXRpb25fZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIGludGVycG9sYXRpb24gZm9ybWF0ICN7cnByIGZvcm1hdH1cIlxuIyBjbGFzcyBFLkRicmljX25vX25lc3RlZF90cmFuc2FjdGlvbnMgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3Qgc3RhcnQgYSB0cmFuc2FjdGlvbiB3aXRoaW4gYSB0cmFuc2FjdGlvblwiXG4jIGNsYXNzIEUuRGJyaWNfbm9fZGVmZXJyZWRfZmtzX2luX3R4ICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBkZWZlciBmb3JlaWduIGtleXMgaW5zaWRlIGEgdHJhbnNhY3Rpb25cIlxuIyBjbGFzcyBFLkRicmljX2ludmFsaWRfdGltZXN0YW1wICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCB4ICkgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJub3QgYSB2YWxpZCBEYnJpYyB0aW1lc3RhbXA6ICN7cnByIHh9XCJcblxuIyAjIyMgVEFJTlQgcmVwbGFjZSB3aXRoIG1vcmUgc3BlY2lmaWMgZXJyb3IsIGxpa2UgYmVsb3cgIyMjXG4jIGNsYXNzIEUuRGJyaWNfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gREIgZm9ybWF0ICN7cmVmIGZvcm1hdH1cIlxuXG4jIGNsYXNzIEUuRGJyaWNfaW1wb3J0X2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiMgICAgIGZvcm1hdHMgPSBbICggcmVxdWlyZSAnLi90eXBlcycgKS5faW1wb3J0X2Zvcm1hdHMuLi4sIF0uam9pbiAnLCAnXG4jICAgICBzdXBlciByZWYsIFwidW5rbm93biBpbXBvcnQgZm9ybWF0ICN7cnByIGZvcm1hdH0gKGtub3duIGZvcm1hdHMgYXJlICN7Zm9ybWF0c30pXCJcblxubW9kdWxlLmV4cG9ydHMgPSB7IEUsIH1cblxuIl19
