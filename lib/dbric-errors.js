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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLWVycm9ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEdBQUE7OztFQUlBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLEdBQWtDLENBQUEsRUFMbEM7OztFQVFNLENBQUMsQ0FBQyxjQUFSLE1BQUEsWUFBQSxRQUE0QixNQUE1QjtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sT0FBUCxDQUFBO1dBQ1gsQ0FBQTtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVksQ0FBQSxDQUFBLENBQUcsR0FBSCxDQUFBLEVBQUEsQ0FBQSxDQUFXLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBeEIsQ0FBQSxFQUFBLENBQUEsQ0FBaUMsT0FBakMsQ0FBQTtNQUNaLElBQUMsQ0FBQSxHQUFELEdBQVk7QUFDWixhQUFPLE1BQVU7SUFKTjs7RUFEZixFQVJBOzs7RUFnQk0sQ0FBQyxDQUFDLHdCQUFSLE1BQUEsc0JBQUEsUUFBZ0QsQ0FBQyxDQUFDLFlBQWxEO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLEVBQWEsS0FBYixDQUFBO1dBQXdCLENBQU0sR0FBTixFQUFXLENBQUEsb0JBQUEsQ0FBQSxDQUF1QixJQUF2QixDQUFBLHFCQUFBLENBQUEsQ0FBbUQsR0FBQSxDQUFJLEtBQUosQ0FBbkQsQ0FBQSxDQUFYO0lBQXhCOztFQURmOztFQUVNLENBQUMsQ0FBQyw2QkFBUixNQUFBLDJCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLEtBQWIsQ0FBQTtXQUF3QixDQUFNLEdBQU4sRUFBVyxDQUFBLHVCQUFBLENBQUEsQ0FBMEIsSUFBMUIsQ0FBQSxDQUFYO0lBQXhCOztFQURmOztFQUVNLENBQUMsQ0FBQyx3QkFBUixNQUFBLHNCQUFBLFFBQXNDLENBQUMsQ0FBQyxZQUF4QztJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQWlCLENBQU0sR0FBTixFQUFXLENBQUEseUJBQUEsQ0FBQSxDQUE0QixJQUE1QixDQUFBLENBQVg7SUFBakI7O0VBRGY7O0VBRU0sQ0FBQyxDQUFDLHlDQUFSLE1BQUEsdUNBQUEsUUFBdUQsQ0FBQyxDQUFDLFlBQXpEO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxJQUFQLENBQUE7V0FBaUIsQ0FBTSxHQUFOLEVBQVcsQ0FBQSw2REFBQSxDQUFBLENBQWdFLElBQWhFLENBQUEsQ0FBWDtJQUFqQjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsb0NBQVIsTUFBQSxrQ0FBQSxRQUFrRCxDQUFDLENBQUMsWUFBcEQ7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLEtBQVAsQ0FBQTtXQUFrQixDQUFNLEdBQU4sRUFBVyxDQUFBLHFDQUFBLENBQUEsQ0FBd0MsR0FBQSxDQUFJLEtBQUosQ0FBeEMsQ0FBQSxDQUFYO0lBQWxCOztFQURmOztFQUVNLENBQUMsQ0FBQyx5QkFBUixNQUFBLHVCQUFBLFFBQWdELENBQUMsQ0FBQyxZQUFsRDtJQUNFLFdBQWEsQ0FBRSxHQUFGLEVBQU8sSUFBUCxDQUFBO1dBQXdCLENBQU0sR0FBTixFQUFXLENBQUEsaUJBQUEsQ0FBQSxDQUFvQixHQUFBLENBQUksSUFBSixDQUFwQixDQUFBLENBQVg7SUFBeEI7O0VBRGY7O0VBRU0sQ0FBQyxDQUFDLHVCQUFSLE1BQUEscUJBQUEsUUFBZ0QsQ0FBQyxDQUFDLFlBQWxEO0lBQ0UsV0FBYSxDQUFFLEdBQUYsRUFBTyxPQUFQLENBQUE7V0FBd0IsQ0FBTSxHQUFOLEVBQVcsT0FBWDtJQUF4Qjs7RUFEZjs7RUFFTSxDQUFDLENBQUMsK0JBQVIsTUFBQSw2QkFBQSxRQUE2QyxDQUFDLENBQUMsWUFBL0M7SUFDRSxXQUFhLENBQUUsR0FBRixFQUFPLElBQVAsQ0FBQTtXQUFzQixDQUFNLEdBQU4sRUFBVyxDQUFBLFVBQUEsQ0FBQSxDQUFhLEdBQUEsQ0FBSSxJQUFKLENBQWIsQ0FBQSxvQkFBQSxDQUFYO0lBQXRCOztFQURmLEVBOUJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFpR0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxDQUFGO0FBakdqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG5FICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBFLkRicmljX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgLT5cbiAgICBzdXBlcigpXG4gICAgQG1lc3NhZ2UgID0gXCIje3JlZn0gKCN7QGNvbnN0cnVjdG9yLm5hbWV9KSAje21lc3NhZ2V9XCJcbiAgICBAcmVmICAgICAgPSByZWZcbiAgICByZXR1cm4gdW5kZWZpbmVkICMjIyBhbHdheXMgcmV0dXJuIGB1bmRlZmluZWRgIGZyb20gY29uc3RydWN0b3IgIyMjXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEUuRGJyaWNfc3FsX3ZhbHVlX2Vycm9yICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJ1bmFibGUgdG8gZXhwcmVzcyBhICN7dHlwZX0gYXMgU1FMIGxpdGVyYWwsIGdvdCAje3JwciB2YWx1ZX1cIlxuY2xhc3MgRS5EYnJpY19zcWxfbm90X2FfbGlzdF9lcnJvciAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICBjb25zdHJ1Y3RvcjogKCByZWYsIHR5cGUsIHZhbHVlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgbGlzdCwgZ290IGEgI3t0eXBlfVwiXG5jbGFzcyBFLkRicmljX2V4cGVjdGVkX3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlICkgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIGEgc3RyaW5nLCBnb3QgYSAje3R5cGV9XCJcbmNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc3RyaW5nX29yX3N0cmluZ192YWxfZm4gZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4gIGNvbnN0cnVjdG9yOiAoIHJlZiwgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBhIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHN0cmluZywgZ290IGEgI3t0eXBlfVwiXG5jbGFzcyBFLkRicmljX2V4cGVjdGVkX2pzb25fb2JqZWN0X3N0cmluZyBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCBzZXJpYWxpemVkIEpTT04gb2JqZWN0LCBnb3QgI3tycHIgdmFsdWV9XCJcbmNsYXNzIEUuRGJyaWNfdW5rbm93bl9zZXF1ZW5jZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmtub3duIHNlcXVlbmNlICN7cnByIG5hbWV9XCJcbmNsYXNzIEUuRGJyaWNfaW50ZXJuYWxfZXJyb3IgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiAgY29uc3RydWN0b3I6ICggcmVmLCBtZXNzYWdlICkgICAgIC0+IHN1cGVyIHJlZiwgbWVzc2FnZVxuY2xhc3MgRS5EYnJpY19uYW1lZF9zdGF0ZW1lbnRfZXhpc3RzIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzdGF0ZW1lbnQgI3tycHIgbmFtZX0gaXMgYWxyZWFkeSBkZWNsYXJlZFwiXG4jIGNsYXNzIEUuRGJyaWNfdW5rbm93bl92YXJpYWJsZSAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcInVua25vd24gdmFyaWFibGUgI3tycHIgbmFtZX1cIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNsYXNzIEUuRGJyaWNfY2ZnX2Vycm9yICAgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG1lc3NhZ2UgKSAgICAgLT4gc3VwZXIgcmVmLCBtZXNzYWdlXG4jIGNsYXNzIEUuRGJyaWNfc2NoZW1hX3Vua25vd24gICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInNjaGVtYSAje3JwciBzY2hlbWF9IGRvZXMgbm90IGV4aXN0XCJcbiMgY2xhc3MgRS5EYnJpY19vYmplY3RfdW5rbm93biAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hLCBuYW1lICktPiBzdXBlciByZWYsIFwib2JqZWN0ICN7cnByIHNjaGVtYSArICcuJyArIG5hbWV9IGRvZXMgbm90IGV4aXN0XCJcbiMgY2xhc3MgRS5EYnJpY19zY2hlbWFfbm9uZW1wdHkgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwic2NoZW1hICN7cnByIHNjaGVtYX0gaXNuJ3QgZW1wdHlcIlxuIyBjbGFzcyBFLkRicmljX3NjaGVtYV9ub3RfYWxsb3dlZCAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzY2hlbWEgKSAgICAgIC0+IHN1cGVyIHJlZiwgXCJzY2hlbWEgI3tycHIgc2NoZW1hfSBub3QgYWxsb3dlZCBoZXJlXCJcbiMgY2xhc3MgRS5EYnJpY19zY2hlbWFfcmVwZWF0ZWQgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgc2NoZW1hICkgICAgICAtPiBzdXBlciByZWYsIFwidW5hYmxlIHRvIGNvcHkgc2NoZW1hIHRvIGl0c2VsZiwgZ290ICN7cnByIHNjaGVtYX1cIlxuIyBjbGFzcyBFLkRicmljX2V4cGVjdGVkX3NpbmdsZV9yb3cgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCByb3dfY291bnQgKSAgIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAxIHJvdywgZ290ICN7cm93X2NvdW50fVwiXG4jIGNsYXNzIEUuRGJyaWNfZXhwZWN0ZWRfc2luZ2xlX3ZhbHVlICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwga2V5cyApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXhwZWN0ZWQgcm93IHdpdGggc2luZ2xlIGZpZWxkLCBnb3QgZmllbGRzICN7cnByIGtleXN9XCJcbiMgY2xhc3MgRS5EYnJpY19leHRlbnNpb25fdW5rbm93biAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwiZXh0ZW5zaW9uIG9mIHBhdGggI3twYXRofSBpcyBub3QgcmVnaXN0ZXJlZCBmb3IgYW55IGZvcm1hdFwiXG4jIGNsYXNzIEUuRGJyaWNfbm90X2ltcGxlbWVudGVkICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHdoYXQgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7d2hhdH0gaXNuJ3QgaW1wbGVtZW50ZWQgKHlldClcIlxuIyBjbGFzcyBFLkRicmljX2RlcHJlY2F0ZWQgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCB3aGF0ICkgICAgICAgIC0+IHN1cGVyIHJlZiwgXCIje3doYXR9IGhhcyBiZWVuIGRlcHJlY2F0ZWRcIlxuIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfZGJfb2JqZWN0X3R5cGUgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCLCtTc2OSB1bmtub3duIHR5cGUgI3tycHIgdHlwZX0gb2YgREIgb2JqZWN0ICN7ZH1cIlxuIyBjbGFzcyBFLkRicmljX3VuZXhwZWN0ZWRfc3FsICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBzcWwgKSAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJ1bmV4cGVjdGVkIFNRTCBzdHJpbmcgI3tycHIgc3FsfVwiXG4jIGNsYXNzIEUuRGJyaWNfc3FsaXRlX3Rvb19tYW55X2RicyAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIHNjaGVtYSApICAgICAgLT4gc3VwZXIgcmVmLCBcInVuYWJsZSB0byBhdHRhY2ggc2NoZW1hICN7cnByIHNjaGVtYX06IHRvbyBtYW55IGF0dGFjaGVkIGRhdGFiYXNlc1wiXG4jIGNsYXNzIEUuRGJyaWNfc3FsaXRlX2Vycm9yICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGVycm9yICkgICAgICAgLT4gc3VwZXIgcmVmLCBcIiN7ZXJyb3IuY29kZSA/ICdTUUxpdGUgZXJyb3InfTogI3tlcnJvci5tZXNzYWdlfVwiXG4jIGNsYXNzIEUuRGJyaWNfbm9fYXJndW1lbnRzX2FsbG93ZWQgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIGFyaXR5ICkgLT4gc3VwZXIgcmVmLCBcIm1ldGhvZCAje3JwciBuYW1lfSBkb2Vzbid0IHRha2UgYXJndW1lbnRzLCBnb3QgI3thcml0eX1cIlxuIyBjbGFzcyBFLkRicmljX2FyZ3VtZW50X25vdF9hbGxvd2VkICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCBuYW1lLCB2YWx1ZSApIC0+IHN1cGVyIHJlZiwgXCJhcmd1bWVudCAje3JwciBuYW1lfSBub3QgYWxsb3dlZCwgZ290ICN7cnByIHZhbHVlfVwiXG4jIGNsYXNzIEUuRGJyaWNfYXJndW1lbnRfbWlzc2luZyAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUgKSAgICAgICAgLT4gc3VwZXIgcmVmLCBcImV4cGVjdGVkIHZhbHVlIGZvciAje3JwciBuYW1lfSwgZ290IG5vdGhpbmdcIlxuIyBjbGFzcyBFLkRicmljX3dyb25nX3R5cGUgICAgICAgICAgICAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmLCB0eXBlcywgdHlwZSApIC0+IHN1cGVyIHJlZiwgXCJleHBlY3RlZCAje3R5cGVzfSwgZ290IGEgI3t0eXBlfVwiXG4jIGNsYXNzIEUuRGJyaWNfd3JvbmdfYXJpdHkgICAgICAgICAgICAgICBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIG5hbWUsIG1pbiwgbWF4LCBmb3VuZCApIC0+IHN1cGVyIHJlZiwgXCIje3JwciBuYW1lfSBleHBlY3RlZCBiZXR3ZWVuICN7bWlufSBhbmQgI3ttYXh9IGFyZ3VtZW50cywgZ290ICN7Zm91bmR9XCJcbiMgY2xhc3MgRS5EYnJpY19lbXB0eV9jc3YgICAgICAgICAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgcGF0aCApICAgICAgICAtPiBzdXBlciByZWYsIFwibm8gQ1NWIHJlY29yZHMgZm91bmQgaW4gZmlsZSAje3BhdGh9XCJcbiMgY2xhc3MgRS5EYnJpY19pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgICAgICAtPiBzdXBlciByZWYsIFwidW5rbm93biBpbnRlcnBvbGF0aW9uIGZvcm1hdCAje3JwciBmb3JtYXR9XCJcbiMgY2xhc3MgRS5EYnJpY19ub19uZXN0ZWRfdHJhbnNhY3Rpb25zICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiApICAgICAgICAgICAgICAtPiBzdXBlciByZWYsIFwiY2Fubm90IHN0YXJ0IGEgdHJhbnNhY3Rpb24gd2l0aGluIGEgdHJhbnNhY3Rpb25cIlxuIyBjbGFzcyBFLkRicmljX25vX2RlZmVycmVkX2Zrc19pbl90eCAgICAgZXh0ZW5kcyBFLkRicmljX2Vycm9yXG4jICAgY29uc3RydWN0b3I6ICggcmVmICkgICAgICAgICAgICAgIC0+IHN1cGVyIHJlZiwgXCJjYW5ub3QgZGVmZXIgZm9yZWlnbiBrZXlzIGluc2lkZSBhIHRyYW5zYWN0aW9uXCJcbiMgY2xhc3MgRS5EYnJpY19pbnZhbGlkX3RpbWVzdGFtcCAgICAgICAgIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgeCApICAgICAgICAgICAtPiBzdXBlciByZWYsIFwibm90IGEgdmFsaWQgRGJyaWMgdGltZXN0YW1wOiAje3JwciB4fVwiXG5cbiMgIyMjIFRBSU5UIHJlcGxhY2Ugd2l0aCBtb3JlIHNwZWNpZmljIGVycm9yLCBsaWtlIGJlbG93ICMjI1xuIyBjbGFzcyBFLkRicmljX2Zvcm1hdF91bmtub3duIGV4dGVuZHMgRS5EYnJpY19lcnJvclxuIyAgIGNvbnN0cnVjdG9yOiAoIHJlZiwgZm9ybWF0ICkgLT5cbiMgICAgIHN1cGVyIHJlZiwgXCJ1bmtub3duIERCIGZvcm1hdCAje3JlZiBmb3JtYXR9XCJcblxuIyBjbGFzcyBFLkRicmljX2ltcG9ydF9mb3JtYXRfdW5rbm93biBleHRlbmRzIEUuRGJyaWNfZXJyb3JcbiMgICBjb25zdHJ1Y3RvcjogKCByZWYsIGZvcm1hdCApIC0+XG4jICAgICBmb3JtYXRzID0gWyAoIHJlcXVpcmUgJy4vdHlwZXMnICkuX2ltcG9ydF9mb3JtYXRzLi4uLCBdLmpvaW4gJywgJ1xuIyAgICAgc3VwZXIgcmVmLCBcInVua25vd24gaW1wb3J0IGZvcm1hdCAje3JwciBmb3JtYXR9IChrbm93biBmb3JtYXRzIGFyZSAje2Zvcm1hdHN9KVwiXG5cbm1vZHVsZS5leHBvcnRzID0geyBFLCB9XG5cbiJdfQ==
