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
    switch (true) {
      case /^[^"](.*)[^"]$/.test(name):
        return name;
      case /^"(.+)"$/.test(name):
        return name.slice(1, name.length - 1).replace(/""/g, '"');
    }
    throw new Error(`Ωdbricu___4 expected a name, got ${rpr(name)}`);
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
    throw new E.Dbric_sql_value_error('Ωdbricu___5^', type, x);
  };

  //-----------------------------------------------------------------------------------------------------------
  VEC = function(x) {
    var e, type;
    if ((type = type_of(x)) !== 'list') {
      throw new E.Dbric_sql_not_a_list_error('Ωdbricu___6^', type, x);
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
  //     throw new E.Dbric_interpolation_format_unknown 'Ωdbricu___7^', format
  // _interpolation_pattern: /(?<opener>[$?])(?<format>.?):(?<name>\w*)/g

  //===========================================================================================================
  module.exports = Object.freeze({True, False, from_bool, as_bool, unquote_name, IDN, LIT, VEC, SQL});

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXV0aWxpdGllcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsWUFBQTs7O0VBR0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUFsQzs7RUFDQSxDQUFBLENBQUUsR0FBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLGFBQTVCLENBQUEsQ0FBbEM7O0VBQ0EsQ0FBQSxDQUFFLENBQUYsQ0FBQSxHQUFrQyxPQUFBLENBQVEsZ0JBQVIsQ0FBbEM7O0VBR0E7OztDQVJBOzs7RUFjQSxTQUFBLEdBQVksUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUFTLFlBQU8sQ0FBUDtBQUFBLFdBQ2QsSUFEYztlQUNIO0FBREcsV0FFZCxLQUZjO2VBRUg7QUFGRztRQUdkLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx3Q0FBQSxDQUFBLENBQTJDLEdBQUEsQ0FBSSxDQUFKLENBQTNDLENBQUEsQ0FBVjtBQUhRO0VBQVQsRUFkWjs7O0VBb0JBLE9BQUEsR0FBVSxRQUFBLENBQUUsQ0FBRixDQUFBO0FBQVMsWUFBTyxDQUFQO0FBQUEsV0FDWixJQURZO2VBQ0E7QUFEQSxXQUVaLEtBRlk7ZUFFQTtBQUZBO1FBR1osTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGlDQUFBLENBQUEsQ0FBb0MsR0FBQSxDQUFJLENBQUosQ0FBcEMsQ0FBQSxDQUFWO0FBSE07RUFBVCxFQXBCVjs7O0VBMEJBLFlBQUEsR0FBZSxRQUFBLENBQUUsSUFBRixDQUFBLEVBQUE7O0FBQ2YsUUFBQTtJQUNFLElBQU8sQ0FBRSxJQUFBLEdBQU8sT0FBQSxDQUFRLElBQVIsQ0FBVCxDQUFBLEtBQTJCLE1BQWxDO01BQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLG1DQUFBLENBQUEsQ0FBc0MsSUFBdEMsQ0FBQSxDQUFWLEVBRFI7O0FBRUEsWUFBTyxJQUFQO0FBQUEsV0FDTyxnQkFBZ0IsQ0FBQyxJQUFqQixDQUF1QixJQUF2QixDQURQO0FBQ3dDLGVBQU87QUFEL0MsV0FFTyxVQUFVLENBQUMsSUFBWCxDQUF1QixJQUF2QixDQUZQO0FBRXdDLGVBQU8sSUFBSSwwQkFBeUIsQ0FBQyxPQUE5QixDQUFzQyxLQUF0QyxFQUE2QyxHQUE3QztBQUYvQztJQUdBLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxpQ0FBQSxDQUFBLENBQW9DLEdBQUEsQ0FBSSxJQUFKLENBQXBDLENBQUEsQ0FBVjtFQVBPLEVBMUJmOzs7RUFvQ0EsR0FBQSxHQUFNLFFBQUEsQ0FBRSxJQUFGLENBQUE7V0FBWSxHQUFBLEdBQU0sQ0FBRSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsRUFBbUIsSUFBbkIsQ0FBRixDQUFOLEdBQW9DO0VBQWhELEVBcENOOzs7RUF1Q0EsR0FBQSxHQUFNLFFBQUEsQ0FBRSxDQUFGLENBQUE7QUFDTixRQUFBO0lBQUUsSUFBcUIsU0FBckI7QUFBQSxhQUFPLE9BQVA7O0FBQ0EsWUFBTyxJQUFBLEdBQU8sT0FBQSxDQUFRLENBQVIsQ0FBZDtBQUFBLFdBQ08sTUFEUDtBQUN5QixlQUFRLEdBQUEsR0FBTSxDQUFFLENBQUMsQ0FBQyxPQUFGLENBQVUsSUFBVixFQUFnQixJQUFoQixDQUFGLENBQU4sR0FBaUMsSUFEbEU7O0FBQUEsV0FHTyxPQUhQO0FBR3lCLGVBQU8sQ0FBQyxDQUFDLFFBQUYsQ0FBQTtBQUhoQyxXQUlPLFNBSlA7QUFJeUIsZUFBTyxDQUFLLENBQUgsR0FBVSxHQUFWLEdBQW1CLEdBQXJCO0FBSmhDLEtBREY7O0lBT0UsTUFBTSxJQUFJLENBQUMsQ0FBQyxxQkFBTixDQUE0QixjQUE1QixFQUE0QyxJQUE1QyxFQUFrRCxDQUFsRDtFQVJGLEVBdkNOOzs7RUFrREEsR0FBQSxHQUFNLFFBQUEsQ0FBRSxDQUFGLENBQUE7QUFDTixRQUFBLENBQUEsRUFBQTtJQUFFLElBQXNFLENBQUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxDQUFSLENBQVQsQ0FBQSxLQUF3QixNQUE5RjtNQUFBLE1BQU0sSUFBSSxDQUFDLENBQUMsMEJBQU4sQ0FBaUMsY0FBakMsRUFBaUQsSUFBakQsRUFBdUQsQ0FBdkQsRUFBTjs7QUFDQSxXQUFPLElBQUEsR0FBTyxDQUFFOztBQUFFO01BQUEsS0FBQSxtQ0FBQTs7cUJBQUEsR0FBQSxDQUFJLENBQUo7TUFBQSxDQUFBOztRQUFGLENBQW9CLENBQUMsSUFBckIsQ0FBMEIsSUFBMUIsQ0FBRixDQUFQLEdBQTRDO0VBRi9DLEVBbEROOzs7RUF1REEsR0FBQSxHQUFNLFFBQUEsQ0FBRSxLQUFGLEVBQUEsR0FBUyxXQUFULENBQUE7QUFDTixRQUFBLENBQUEsRUFBQSxVQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFFLENBQUEsR0FBSSxLQUFLLENBQUUsQ0FBRjtJQUNULEtBQUEseURBQUE7O01BQ0UsQ0FBQSxJQUFLLFVBQVUsQ0FBQyxRQUFYLENBQUEsQ0FBQSxHQUF3QixLQUFLLENBQUUsR0FBQSxHQUFNLENBQVI7SUFEcEM7QUFFQSxXQUFPO0VBSkgsRUF2RE47Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFrRkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLElBQUYsRUFBUSxLQUFSLEVBQWUsU0FBZixFQUEwQixPQUExQixFQUFtQyxZQUFuQyxFQUFpRCxHQUFqRCxFQUFzRCxHQUF0RCxFQUEyRCxHQUEzRCxFQUFnRSxHQUFoRSxDQUFkO0FBbEZqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBycHIsICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgRSwgICAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICcuL2RicmljLWVycm9ycydcblxuXG5gYGBcbmNvbnN0IFRydWUgID0gMTtcbmNvbnN0IEZhbHNlID0gMDtcbmBgYFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZyb21fYm9vbCA9ICggeCApIC0+IHN3aXRjaCB4XG4gIHdoZW4gdHJ1ZSAgdGhlbiBUcnVlXG4gIHdoZW4gZmFsc2UgdGhlbiBGYWxzZVxuICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fMSBleHBlY3RlZCB0cnVlIG9yIGZhbHNlLCBnb3QgI3tycHIgeH1cIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmFzX2Jvb2wgPSAoIHggKSAtPiBzd2l0Y2ggeFxuICB3aGVuIFRydWUgICB0aGVuIHRydWVcbiAgd2hlbiBGYWxzZSAgdGhlbiBmYWxzZVxuICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fMiBleHBlY3RlZCAwIG9yIDEsIGdvdCAje3JwciB4fVwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudW5xdW90ZV9uYW1lID0gKCBuYW1lICkgLT5cbiAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2YgbmFtZSApIGlzICd0ZXh0J1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fMyBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICBzd2l0Y2ggdHJ1ZVxuICAgIHdoZW4gL15bXlwiXSguKilbXlwiXSQvLnRlc3QgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVxuICAgIHdoZW4gL15cIiguKylcIiQvLnRlc3QgICAgICAgIG5hbWUgdGhlbiByZXR1cm4gbmFtZVsgMSAuLi4gbmFtZS5sZW5ndGggLSAxIF0ucmVwbGFjZSAvXCJcIi9nLCAnXCInXG4gIHRocm93IG5ldyBFcnJvciBcIs6pZGJyaWN1X19fNCBleHBlY3RlZCBhIG5hbWUsIGdvdCAje3JwciBuYW1lfVwiXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuSUROID0gKCBuYW1lICkgLT4gJ1wiJyArICggbmFtZS5yZXBsYWNlIC9cIi9nLCAnXCJcIicgKSArICdcIidcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5MSVQgPSAoIHggKSAtPlxuICByZXR1cm4gJ251bGwnIHVubGVzcyB4P1xuICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgeFxuICAgIHdoZW4gJ3RleHQnICAgICAgIHRoZW4gcmV0dXJuICBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiJydcIiApICsgXCInXCJcbiAgICAjIHdoZW4gJ2xpc3QnICAgICAgIHRoZW4gcmV0dXJuIFwiJyN7QGxpc3RfYXNfanNvbiB4fSdcIlxuICAgIHdoZW4gJ2Zsb2F0JyAgICAgIHRoZW4gcmV0dXJuIHgudG9TdHJpbmcoKVxuICAgIHdoZW4gJ2Jvb2xlYW4nICAgIHRoZW4gcmV0dXJuICggaWYgeCB0aGVuICcxJyBlbHNlICcwJyApXG4gICAgIyB3aGVuICdsaXN0JyAgICAgICB0aGVuIHRocm93IG5ldyBFcnJvciBcIl5kYmFAMjNeIHVzZSBgWCgpYCBmb3IgbGlzdHNcIlxuICB0aHJvdyBuZXcgRS5EYnJpY19zcWxfdmFsdWVfZXJyb3IgJ86pZGJyaWN1X19fNV4nLCB0eXBlLCB4XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuVkVDID0gKCB4ICkgLT5cbiAgdGhyb3cgbmV3IEUuRGJyaWNfc3FsX25vdF9hX2xpc3RfZXJyb3IgJ86pZGJyaWN1X19fNl4nLCB0eXBlLCB4IHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgcmV0dXJuICcoICcgKyAoICggTElUIGUgZm9yIGUgaW4geCApLmpvaW4gJywgJyApICsgJyApJ1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNRTCA9ICggcGFydHMsIGV4cHJlc3Npb25zLi4uICkgLT5cbiAgUiA9IHBhcnRzWyAwIF1cbiAgZm9yIGV4cHJlc3Npb24sIGlkeCBpbiBleHByZXNzaW9uc1xuICAgIFIgKz0gZXhwcmVzc2lvbi50b1N0cmluZygpICsgcGFydHNbIGlkeCArIDEgXVxuICByZXR1cm4gUlxuXG4jICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGludGVycG9sYXRlID0gKCBzcWwsIHZhbHVlcyApIC0+XG4jICAgaWR4ID0gLTFcbiMgICByZXR1cm4gc3FsLnJlcGxhY2UgQF9pbnRlcnBvbGF0aW9uX3BhdHRlcm4sICggJDAsIG9wZW5lciwgZm9ybWF0LCBuYW1lICkgLT5cbiMgICAgIGlkeCsrXG4jICAgICBzd2l0Y2ggb3BlbmVyXG4jICAgICAgIHdoZW4gJyQnXG4jICAgICAgICAgdmFsaWRhdGUubm9uZW1wdHlfdGV4dCBuYW1lXG4jICAgICAgICAga2V5ID0gbmFtZVxuIyAgICAgICB3aGVuICc/J1xuIyAgICAgICAgIGtleSA9IGlkeFxuIyAgICAgdmFsdWUgPSB2YWx1ZXNbIGtleSBdXG4jICAgICBzd2l0Y2ggZm9ybWF0XG4jICAgICAgIHdoZW4gJycsICdJJyAgdGhlbiByZXR1cm4gQEkgdmFsdWVcbiMgICAgICAgd2hlbiAnTCcgICAgICB0aGVuIHJldHVybiBATCB2YWx1ZVxuIyAgICAgICB3aGVuICdWJyAgICAgIHRoZW4gcmV0dXJuIEBWIHZhbHVlXG4jICAgICB0aHJvdyBuZXcgRS5EYnJpY19pbnRlcnBvbGF0aW9uX2Zvcm1hdF91bmtub3duICfOqWRicmljdV9fXzdeJywgZm9ybWF0XG4jIF9pbnRlcnBvbGF0aW9uX3BhdHRlcm46IC8oPzxvcGVuZXI+WyQ/XSkoPzxmb3JtYXQ+Lj8pOig/PG5hbWU+XFx3KikvZ1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZnJlZXplIHsgVHJ1ZSwgRmFsc2UsIGZyb21fYm9vbCwgYXNfYm9vbCwgdW5xdW90ZV9uYW1lLCBJRE4sIExJVCwgVkVDLCBTUUwsIH1cbiJdfQ==
