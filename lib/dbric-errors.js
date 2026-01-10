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

  // class E.Dbric_unknown_variable          extends E.Dbric_error
  //   constructor: ( ref, name )        -> super ref, "unknown variable #{rpr name}"

  //---------------------------------------------------------------------------------------------------------
  // class E.Dbric_cfg_error                 extends E.Dbric_error
  //   constructor: ( ref, message )     -> super ref, message
  // class E.Dbric_internal_error            extends E.Dbric_error
  //   constructor: ( ref, message )     -> super ref, message
  // class E.Dbric_schema_exists             extends E.Dbric_error
  //   constructor: ( ref, schema )      -> super ref, "schema #{rpr schema} already exists"
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLWVycm9ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEdBQUE7OztFQUlBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLEdBQWtDLENBQUEsRUFMbEM7OztFQVFNLENBQUMsQ0FBQyxjQUFSLE1BQUEsWUFBQSxRQUE0QixNQUE1QjtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sT0FBUCxDQUFBO1dBQ1gsQ0FBQTtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVksQ0FBQSxDQUFBLENBQUcsR0FBSCxDQUFBLEVBQUEsQ0FBQSxDQUFXLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBeEIsQ0FBQSxFQUFBLENBQUEsQ0FBaUMsT0FBakMsQ0FBQTtNQUNaLElBQUMsQ0FBQSxHQUFELEdBQVk7QUFDWixhQUFPLE1BQVU7SUFKTjs7RUFEZixFQVJBOzs7RUFnQk0sQ0FBQyxDQUFDLHdCQUFSLE1BQUEsc0JBQUEsUUFBZ0QsQ0FBQyxDQUFDLFlBQWxEO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLEVBQWEsS0FBYixDQUFBO1dBQXdCLENBQU0sR0FBTixFQUFXLENBQUEsb0JBQUEsQ0FBQSxDQUF1QixJQUF2QixDQUFBLHFCQUFBLENBQUEsQ0FBbUQsR0FBQSxDQUFJLEtBQUosQ0FBbkQsQ0FBQSxDQUFYO0lBQXhCOztFQURmOztFQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTtXQUF3QixDQUFNLEdBQU4sRUFBVyxDQUFBLHVCQUFBLENBQUEsQ0FBMEIsSUFBMUIsQ0FBQSxDQUFYO0lBQXhCOztFQURmOztFQUVNLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQXNDLENBQUMsQ0FBQyxZQUF4QztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQWlCLENBQU0sR0FBTixFQUFXLENBQUEseUJBQUEsQ0FBQSxDQUE0QixJQUE1QixDQUFBLENBQVg7SUFBakI7O0VBRGY7O0VBRU0sQ0FBQyxDQUFDLHlDQUFSLE1BQUEsdUNBQUEsUUFBdUQsQ0FBQyxDQUFDLFlBQXpEO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLENBQUE7V0FBaUIsQ0FBTSxHQUFOLEVBQVcsQ0FBQSw2REFBQSxDQUFBLENBQWdFLElBQWhFLENBQUEsQ0FBWDtJQUFqQjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsb0NBQVIsTUFBQSxrQ0FBQSxRQUFrRCxDQUFDLENBQUMsWUFBcEQ7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLEtBQVAsQ0FBQTtXQUFrQixDQUFNLEdBQU4sRUFBVyxDQUFBLHFDQUFBLENBQUEsQ0FBd0MsR0FBQSxDQUFJLEtBQUosQ0FBeEMsQ0FBQSxDQUFYO0lBQWxCOztFQURmOztFQUVNLENBQUMsQ0FBQyx5QkFBUixNQUFBLHVCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQXdCLENBQU0sR0FBTixFQUFXLENBQUEsaUJBQUEsQ0FBQSxDQUFvQixHQUFBLENBQUksSUFBSixDQUFwQixDQUFBLENBQVg7SUFBeEI7O0VBRGYsRUExQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFpR0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxDQUFGO0FBakdqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG5FICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgLT5cbiAgICBzdXBlcigpXG4gICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICBAcmVmICAgICAgPSByZWZcbiAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gZXhwcmVzcyBhICN7dHlwZX0gYXMgU1FMIGxpdGVyYWwsIGdvdCAje3JwciB2YWx1ZX1cIlxuY2xhc3MgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG5jbGFzcyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgc3RyaW5nLCBnb3QgYSAje3R5cGV9XCJcbmNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBhIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHN0cmluZywgZ290IGEgI3t0eXBlfVwiXG5jbGFzcyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBzZXJpYWxpemVkIEpTT04gb2JqZWN0LCBnb3QgI3tycHIgdmFsdWV9XCJcbmNsYXNzIEUuRGJyaWNfdW5rbm93bl9zZXF1ZW5jZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHNlcXVlbmNlICN7cnByIG5hbWV9XCJcbiMgY2xhc3MgRS5EYnJpY191bmtub3duX3ZhcmlhYmxlICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSApICAgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biB2YXJpYWJsZSAje3JwciBuYW1lfVwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY2xhc3MgRS5EYnJpY19jZmdfZXJyb3IgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiMgY2xhc3MgRS5EYnJpY19pbnRlcm5hbF9lcnJvciAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbWVzc2FnZSApICAgICAtPiBzdXBlciByZWYsIG1lc3NhZ2VcbiMgY2xhc3MgRS5EYnJpY19zY2hlbWFfZXhpc3RzICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gYWxyZWFkeSBleGlzdHNcIlxuIyBjbGFzcyBFLkRicmljX3NjaGVtYV91bmtub3duICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBkb2VzIG5vdCBleGlzdFwiXG4jIGNsYXNzIEUuRGJyaWNfb2JqZWN0X3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSwgbmFtZSApLT4gc3VwZXIgcmVmLCBcIm9iamVjdCAje3JwciBzY2hlbWEgKyAnLicgKyBuYW1lfSBkb2VzIG5vdCBleGlzdFwiXG4jIGNsYXNzIEUuRGJyaWNfc2NoZW1hX25vbmVtcHR5ICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGlzbid0IGVtcHR5XCJcbiMgY2xhc3MgRS5EYnJpY19zY2hlbWFfbm90X2FsbG93ZWQgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gbm90IGFsbG93ZWQgaGVyZVwiXG4jIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3JlcGVhdGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBjb3B5IHNjaGVtYSB0byBpdHNlbGYsIGdvdCAje3JwciBzY2hlbWF9XCJcbiMgY2xhc3MgRS5EYnJpY19leHBlY3RlZF9zaW5nbGVfcm93ICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcm93X2NvdW50ICkgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgMSByb3csIGdvdCAje3Jvd19jb3VudH1cIlxuIyBjbGFzcyBFLkRicmljX2V4cGVjdGVkX3NpbmdsZV92YWx1ZSAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGtleXMgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHJvdyB3aXRoIHNpbmdsZSBmaWVsZCwgZ290IGZpZWxkcyAje3JwciBrZXlzfVwiXG4jIGNsYXNzIEUuRGJyaWNfZXh0ZW5zaW9uX3Vua25vd24gICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHBhdGggKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4dGVuc2lvbiBvZiBwYXRoICN7cGF0aH0gaXMgbm90IHJlZ2lzdGVyZWQgZm9yIGFueSBmb3JtYXRcIlxuIyBjbGFzcyBFLkRicmljX25vdF9pbXBsZW1lbnRlZCAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGlzbid0IGltcGxlbWVudGVkICh5ZXQpXCJcbiMgY2xhc3MgRS5EYnJpY19kZXByZWNhdGVkICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgd2hhdCApICAgICAgICAtPiBzdXBlciByZWYsIFwiI3t3aGF0fSBoYXMgYmVlbiBkZXByZWNhdGVkXCJcbiMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX2RiX29iamVjdF90eXBlIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiwrU3NjkgdW5rbm93biB0eXBlICN7cnByIHR5cGV9IG9mIERCIG9iamVjdCAje2R9XCJcbiMgY2xhc3MgRS5EYnJpY191bmV4cGVjdGVkX3NxbCAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc3FsICkgICAgICAgICAtPiBzdXBlciByZWYsIFwidW5leHBlY3RlZCBTUUwgc3RyaW5nICN7cnByIHNxbH1cIlxuIyBjbGFzcyBFLkRicmljX3NxbGl0ZV90b29fbWFueV9kYnMgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gYXR0YWNoIHNjaGVtYSAje3JwciBzY2hlbWF9OiB0b28gbWFueSBhdHRhY2hlZCBkYXRhYmFzZXNcIlxuIyBjbGFzcyBFLkRicmljX3NxbGl0ZV9lcnJvciAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBlcnJvciApICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje2Vycm9yLmNvZGUgPyAnU1FMaXRlIGVycm9yJ306ICN7ZXJyb3IubWVzc2FnZX1cIlxuIyBjbGFzcyBFLkRicmljX25vX2FyZ3VtZW50c19hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBhcml0eSApIC0+IHN1cGVyIHJlZiwgXCJtZXRob2QgI3tycHIgbmFtZX0gZG9lc24ndCB0YWtlIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiMgY2xhc3MgRS5EYnJpY19hcmd1bWVudF9ub3RfYWxsb3dlZCAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgbmFtZSwgdmFsdWUgKSAtPiBzdXBlciByZWYsIFwiYXJndW1lbnQgI3tycHIgbmFtZX0gbm90IGFsbG93ZWQsIGdvdCAje3JwciB2YWx1ZX1cIlxuIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X21pc3NpbmcgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCB2YWx1ZSBmb3IgI3tycHIgbmFtZX0sIGdvdCBub3RoaW5nXCJcbiMgY2xhc3MgRS5EYnJpY193cm9uZ190eXBlICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZXMsIHR5cGUgKSAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgI3t0eXBlc30sIGdvdCBhICN7dHlwZX1cIlxuIyBjbGFzcyBFLkRicmljX3dyb25nX2FyaXR5ICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCBtaW4sIG1heCwgZm91bmQgKSAtPiBzdXBlciByZWYsIFwiI3tycHIgbmFtZX0gZXhwZWN0ZWQgYmV0d2VlbiAje21pbn0gYW5kICN7bWF4fSBhcmd1bWVudHMsIGdvdCAje2ZvdW5kfVwiXG4jIGNsYXNzIEUuRGJyaWNfZW1wdHlfY3N2ICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHBhdGggKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIm5vIENTViByZWNvcmRzIGZvdW5kIGluIGZpbGUgI3twYXRofVwiXG4jIGNsYXNzIEUuRGJyaWNfaW50ZXJwb2xhdGlvbl9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gaW50ZXJwb2xhdGlvbiBmb3JtYXQgI3tycHIgZm9ybWF0fVwiXG4jIGNsYXNzIEUuRGJyaWNfbm9fbmVzdGVkX3RyYW5zYWN0aW9ucyAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYgKSAgICAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcImNhbm5vdCBzdGFydCBhIHRyYW5zYWN0aW9uIHdpdGhpbiBhIHRyYW5zYWN0aW9uXCJcbiMgY2xhc3MgRS5EYnJpY19ub19kZWZlcnJlZF9ma3NfaW5fdHggICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiApICAgICAgICAgICAgICAtPiBzdXBlciByZWYsIFwiY2Fubm90IGRlZmVyIGZvcmVpZ24ga2V5cyBpbnNpZGUgYSB0cmFuc2FjdGlvblwiXG4jIGNsYXNzIEUuRGJyaWNfaW52YWxpZF90aW1lc3RhbXAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHggKSAgICAgICAgICAgLT4gc3VwZXIgcmVmLCBcIm5vdCBhIHZhbGlkIERicmljIHRpbWVzdGFtcDogI3tycHIgeH1cIlxuXG4jICMjIyBUQUlOVCByZXBsYWNlIHdpdGggbW9yZSBzcGVjaWZpYyBlcnJvciwgbGlrZSBiZWxvdyAjIyNcbiMgY2xhc3MgRS5EYnJpY19mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4jICAgICBzdXBlciByZWYsIFwidW5rbm93biBEQiBmb3JtYXQgI3tyZWYgZm9ybWF0fVwiXG5cbiMgY2xhc3MgRS5EYnJpY19pbXBvcnRfZm9ybWF0X3Vua25vd24gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBmb3JtYXQgKSAtPlxuIyAgICAgZm9ybWF0cyA9IFsgKCByZXF1aXJlICcuL3R5cGVzJyApLl9pbXBvcnRfZm9ybWF0cy4uLiwgXS5qb2luICcsICdcbiMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIGltcG9ydCBmb3JtYXQgI3tycHIgZm9ybWF0fSAoa25vd24gZm9ybWF0cyBhcmUgI3tmb3JtYXRzfSlcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgRSwgfVxuXG4iXX0=
