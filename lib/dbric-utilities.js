(function() {
  'use strict';
  var E, IDN, LIT, SQL, VEC, as_bool, from_bool, rpr, type_of, unquote_name;

  //===========================================================================================================
  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({E} = require('./dbric-errors'));

  
const True  = 1;
const False = 0;
;

  //-----------------------------------------------------------------------------------------------------------
  from_bool = function(x) {
    switch (x) {
      case true:
        return True;
      case false:
        return False;
      default:
        throw new Error(`Ωdbricu___1 expected true or false, got ${rpr(x)}`);
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  as_bool = function(x) {
    switch (x) {
      case True:
        return true;
      case False:
        return false;
      default:
        throw new Error(`Ωdbricu___2 expected 0 or 1, got ${rpr(x)}`);
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  unquote_name = function(name) {
    /* TAINT use proper validation */
    var type;
    if ((type = type_of(name)) !== 'text') {
      throw new Error(`Ωdbricu___3 expected a text, got a ${type}`);
    }
    if (name === '') {
      throw new Error("Ωdbricu___4 expected a non-empty text, got an empty text");
    }
    if ((name.startsWith('"')) && (name.endsWith('"'))) {
      if (name.length < 2) {
        throw new Error("Ωdbricu___5 expected a quoted non-empty text, got a quote");
      }
      return name.slice(1, name.length - 1).replace(/""/g, '"');
    }
    if ((name.startsWith("'")) && (name.endsWith("'"))) {
      return name.slice(1, name.length - 1);
    }
    return name;
  };

  //-----------------------------------------------------------------------------------------------------------
  IDN = function(name) {
    return '"' + (name.replace(/"/g, '""')) + '"';
  };

  //-----------------------------------------------------------------------------------------------------------
  LIT = function(x) {
    var type;
    if (x == null) {
      return 'null';
    }
    switch (type = type_of(x)) {
      case 'text':
        return "'" + (x.replace(/'/g, "''")) + "'";
      // when 'list'       then return "'#{@list_as_json x}'"
      case 'float':
        return x.toString();
      case 'boolean':
        return (x ? '1' : '0');
    }
    // when 'list'       then throw new Error "^dba@23^ use `X()` for lists"
    throw new E.Dbric_sql_value_error('Ωdbricu___6^', type, x);
  };

  //-----------------------------------------------------------------------------------------------------------
  VEC = function(x) {
    var e, type;
    if ((type = type_of(x)) !== 'list') {
      throw new E.Dbric_sql_not_a_list_error('Ωdbricu___7^', type, x);
    }
    return '( ' + (((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = x.length; i < len; i++) {
        e = x[i];
        results.push(LIT(e));
      }
      return results;
    })()).join(', ')) + ' )';
  };

  //-----------------------------------------------------------------------------------------------------------
  SQL = function(parts, ...expressions) {
    var R, expression, i, idx, len;
    R = parts[0];
    for (idx = i = 0, len = expressions.length; i < len; idx = ++i) {
      expression = expressions[idx];
      R += expression.toString() + parts[idx + 1];
    }
    return R;
  };

  // #-------------------------------------------------------------------------------------------------------
  // interpolate = ( sql, values ) ->
  //   idx = -1
  //   return sql.replace @_interpolation_pattern, ( $0, opener, format, name ) ->
  //     idx++
  //     switch opener
  //       when '$'
  //         validate.nonempty_text name
  //         key = name
  //       when '?'
  //         key = idx
  //     value = values[ key ]
  //     switch format
  //       when '', 'I'  then return @I value
  //       when 'L'      then return @L value
  //       when 'V'      then return @V value
  //     throw new E.Dbric_interpolation_format_unknown 'Ωdbricu___8^', format
  // _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g

  //===========================================================================================================
  module.exports = Object.freeze({True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXV0aWxpdGllcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQTs7O0VBR0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsZ0JBQVIsQ0FBbEM7O0VBR0E7OztDQVJBOzs7RUFjQSxTQUFBLEdBQVksUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUFTLFlBQU8sQ0FBUDtBQUFBLFdBQ2QsSUFEYztlQUNIO0FBREcsV0FFZCxLQUZjO2VBRUg7QUFGRztRQUdkLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx3Q0FBQSxDQUFBLENBQTJDLEdBQUEsQ0FBSSxDQUFKLENBQTNDLENBQUEsQ0FBVjtBQUhRO0VBQVQsRUFkWjs7O0VBb0JBLE9BQUEsR0FBVSxRQUFBLENBQUUsQ0FBRixDQUFBO0FBQVMsWUFBTyxDQUFQO0FBQUEsV0FDWixJQURZO2VBQ0E7QUFEQSxXQUVaLEtBRlk7ZUFFQTtBQUZBO1FBR1osTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGlDQUFBLENBQUEsQ0FBb0MsR0FBQSxDQUFJLENBQUosQ0FBcEMsQ0FBQSxDQUFWO0FBSE07RUFBVCxFQXBCVjs7O0VBMEJBLFlBQUEsR0FBZSxRQUFBLENBQUUsSUFBRixDQUFBLEVBQUE7O0FBQ2YsUUFBQTtJQUNF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RUFBbUMsWUFBbkMsRUFBaUQsR0FBakQsRUFBc0QsR0FBdEQsRUFBMkQsR0FBM0QsRUFBZ0UsR0FBaEUsQ0FBZDtBQXZGakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbnsgcnByLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IEUsICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnLi9kYnJpYy1lcnJvcnMnXG5cblxuYGBgXG5jb25zdCBUcnVlICA9IDE7XG5jb25zdCBGYWxzZSA9IDA7XG5gYGBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5mcm9tX2Jvb2wgPSAoIHggKSAtPiBzd2l0Y2ggeFxuICB3aGVuIHRydWUgIHRoZW4gVHJ1ZVxuICB3aGVuIGZhbHNlIHRoZW4gRmFsc2VcbiAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljdV9fXzEgZXhwZWN0ZWQgdHJ1ZSBvciBmYWxzZSwgZ290ICN7cnByIHh9XCJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5hc19ib29sID0gKCB4ICkgLT4gc3dpdGNoIHhcbiAgd2hlbiBUcnVlICAgdGhlbiB0cnVlXG4gIHdoZW4gRmFsc2UgIHRoZW4gZmFsc2VcbiAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljdV9fXzIgZXhwZWN0ZWQgMCBvciAxLCBnb3QgI3tycHIgeH1cIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnVucXVvdGVfbmFtZSA9ICggbmFtZSApIC0+XG4gICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIG5hbWUgKSBpcyAndGV4dCdcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWRicmljdV9fXzMgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgaWYgbmFtZSBpcyAnJ1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fNCBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgYW4gZW1wdHkgdGV4dFwiXG4gIGlmICggKCBuYW1lLnN0YXJ0c1dpdGggJ1wiJyApIGFuZCAoIG5hbWUuZW5kc1dpdGggJ1wiJyApIClcbiAgICBpZiBuYW1lLmxlbmd0aCA8IDJcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fNSBleHBlY3RlZCBhIHF1b3RlZCBub24tZW1wdHkgdGV4dCwgZ290IGEgcXVvdGVcIlxuICAgIHJldHVybiBuYW1lWyAxIC4uLiBuYW1lLmxlbmd0aCAtIDEgXS5yZXBsYWNlIC9cIlwiL2csICdcIidcbiAgaWYgKCAoIG5hbWUuc3RhcnRzV2l0aCBcIidcIiApIGFuZCAoIG5hbWUuZW5kc1dpdGggXCInXCIgKSApXG4gICAgcmV0dXJuIG5hbWVbIDEgLi4uIG5hbWUubGVuZ3RoIC0gMSBdXG4gIHJldHVybiBuYW1lXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuSUROID0gKCBuYW1lICkgLT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5MSVQgPSAoIHggKSAtPlxuICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgIHdoZW4gJ3RleHQnICAgICAgIHRoZW4gcmV0dXJuICBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiJydcIiApICsgXCInXCJcbiAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgIHdoZW4gJ2Jvb2xlYW4nICAgIHRoZW4gcmV0dXJuICggaWYgeCB0aGVuICcxJyBlbHNlICcwJyApXG4gICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgJ86pZGJyaWN1X19fNl4nLCB0eXBlLCB4XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuVkVDID0gKCB4ICkgLT5cbiAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgJ86pZGJyaWN1X19fN14nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgcmV0dXJuICcoICcgKyAoICggTElUIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTCA9ICggcGFydHMsIGV4cHJlc3Npb25zLi4uICkgLT5cbiAgUiA9IHBhcnRzWyAwIF1cbiAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgIFIgKz0gZXhwcmVzc2lvbi50b1N0cmluZygpICsgcGFydHNbIGlkeCArIDEgXVxuICByZXR1cm4gUlxuXG4jICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGludGVycG9sYXRlID0gKCBzcWwsIHZhbHVlcyApIC0+XG4jICAgaWR4ID0gLTFcbiMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgLT5cbiMgICAgIGlkeCsrXG4jICAgICBzd2l0Y2ggb3BlbmVyXG4jICAgICAgIHdoZW4gJyQnXG4jICAgICAgICAgdmFsaWRhdGUubm9uZW1wdHlfdGV4dCBuYW1lXG4jICAgICAgICAga2V5ID0gbmFtZVxuIyAgICAgICB3aGVuICc/J1xuIyAgICAgICAgIGtleSA9IGlkeFxuIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4jICAgICBzd2l0Y2ggZm9ybWF0XG4jICAgICAgIHdoZW4gJycsICdJJyAgdGhlbiByZXR1cm4gQEkgdmFsdWVcbiMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4jICAgICB0aHJvdyBuZXcgRS5EYnJpY19pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duICfOqWRicmljdV9fXzheJywgZm9ybWF0XG4jIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZnJlZXplIHsgVHJ1ZSwgRmFsc2UsIGZyb21fYm9vbCwgYXNfYm9vbCwgdW5xdW90ZV9uYW1lLCBJRE4sIExJVCwgVkVDLCBTUUwsIH1cbiJdfQ==
