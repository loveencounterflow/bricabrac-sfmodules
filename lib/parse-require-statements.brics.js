(function() {
  'use strict';
  var BRICS, debug;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_parse_require_statements: function() {
      var FS, PATH, exports, rpr_string, rpr_token, summarize, walk_essential_js_tokens, walk_js_tokens, walk_require_statements;
      //=======================================================================================================
      FS = require('node:fs');
      PATH = require('node:path');
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
      ({walk_js_tokens, walk_essential_js_tokens, rpr_token, summarize} = (require('./walk-js-tokens.brics')).require_walk_js_tokens());
      //=======================================================================================================
      walk_require_statements = function*(path) {
        var history, line_nr, lines, package_name, reset, source, token, warning_from_token;
        source = FS.readFileSync(path, {
          encoding: 'utf-8'
        });
        lines = null;
        //.....................................................................................................
        history = 0;
        package_name = null;
        line_nr = null;
        //.....................................................................................................
        reset = function() {
          history = 0;
          package_name = null;
          line_nr = null;
          return null;
        };
        //.....................................................................................................
        warning_from_token = function(token) {
          var line, message, ref;
          if (lines == null) {
            lines = [null, ...(source.split('\n'))];
          }
          line = (ref = lines[token.line_nr]) != null ? ref : "(ERROR: UNABLE TO RETRIEVE SOURCE)";
          message = `Ωkvr__89 ignoring possible \`require\` on line ${token.line_nr}: ${rpr_string(line)}`;
          return {
            type: 'warning',
            message,
            line,
            line_nr: token.line_nr
          };
        };
//.....................................................................................................
        for (token of walk_essential_js_tokens(source)) {
          // info 'Ωkvr__90', token
          //...................................................................................................
          switch (history) {
            //.................................................................................................
            case 0:
              if (!((token.type === 'IdentifierName') && (token.value === 'require'))) {
                reset();
                continue;
              }
              history = 1;
              line_nr = token.line_nr;
              break;
            //.................................................................................................
            case 1:
              if (!((token.type === 'Punctuator') && (token.value === '('))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              history = 2;
              break;
            //.................................................................................................
            case 2:
              if (!(token.categories.has('string_literals'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              package_name = eval(token.value);
              history = 3;
              break;
            //.................................................................................................
            case 3:
              if (!((token.type === 'Punctuator') && (token.value === ')'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              yield ({
                // debug 'Ωkvr__94', "line #{line_nr} found require #{rpr_string package_name}"
                type: 'require',
                path,
                line_nr,
                package_name
              });
              reset();
          }
        }
        //.....................................................................................................
        return null;
      };
      //.......................................................................................................
      return exports = {
        walk_require_statements,
        internals: {}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsd0JBQUEsRUFBQSxjQUFBLEVBQUEsdUJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLGNBQUYsRUFDRSx3QkFERixFQUVFLFNBRkYsRUFHRSxTQUhGLENBQUEsR0FHOEIsQ0FBRSxPQUFBLENBQVEsd0JBQVIsQ0FBRixDQUFvQyxDQUFDLHNCQUFyQyxDQUFBLENBSDlCLEVBSko7O01BVUksdUJBQUEsR0FBMEIsU0FBQSxDQUFFLElBQUYsQ0FBQTtBQUM5QixZQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTtRQUFNLE1BQUEsR0FBZ0IsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsSUFBaEIsRUFBc0I7VUFBRSxRQUFBLEVBQVU7UUFBWixDQUF0QjtRQUNoQixLQUFBLEdBQWdCLEtBRHRCOztRQUdNLE9BQUEsR0FBZ0I7UUFDaEIsWUFBQSxHQUFnQjtRQUNoQixPQUFBLEdBQWdCLEtBTHRCOztRQU9NLEtBQUEsR0FBUSxRQUFBLENBQUEsQ0FBQTtVQUNOLE9BQUEsR0FBZ0I7VUFDaEIsWUFBQSxHQUFnQjtVQUNoQixPQUFBLEdBQWdCO0FBQ2hCLGlCQUFPO1FBSkQsRUFQZDs7UUFhTSxrQkFBQSxHQUFxQixRQUFBLENBQUUsS0FBRixDQUFBO0FBQzNCLGNBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQTs7WUFBUSxRQUFVLENBQUUsSUFBRixFQUFRLEdBQUEsQ0FBRSxNQUFNLENBQUMsS0FBUCxDQUFhLElBQWIsQ0FBRixDQUFSOztVQUNWLElBQUEsZ0RBQW1DO1VBQ25DLE9BQUEsR0FBVSxDQUFBLCtDQUFBLENBQUEsQ0FBZ0QsS0FBSyxDQUFDLE9BQXRELENBQUEsRUFBQSxDQUFBLENBQWtFLFVBQUEsQ0FBVyxJQUFYLENBQWxFLENBQUE7QUFDVixpQkFBTztZQUFFLElBQUEsRUFBTSxTQUFSO1lBQW1CLE9BQW5CO1lBQTRCLElBQTVCO1lBQWtDLE9BQUEsRUFBUyxLQUFLLENBQUM7VUFBakQ7UUFKWSxFQWIzQjs7UUFtQk0sS0FBQSx5Q0FBQSxHQUFBOzs7QUFHRSxrQkFBTyxPQUFQOztBQUFBLGlCQUVPLENBRlA7Y0FHSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxnQkFBaEIsQ0FBQSxJQUF1QyxDQUFFLEtBQUssQ0FBQyxLQUFOLEtBQWUsU0FBakIsRUFBOUM7Z0JBQ0UsS0FBQSxDQUFBO0FBQ0EseUJBRkY7O2NBR0EsT0FBQSxHQUFVO2NBQ1YsT0FBQSxHQUFVLEtBQUssQ0FBQztBQUxiOztBQUZQLGlCQVNPLENBVFA7Y0FVSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFoQixDQUFBLElBQW1DLENBQUUsS0FBSyxDQUFDLEtBQU4sS0FBZSxHQUFqQixFQUExQztnQkFDRSxNQUFNLGtCQUFBLENBQW1CLEtBQW5CO2dCQUNOLEtBQUEsQ0FBQTtBQUNBLHlCQUhGOztjQUlBLE9BQUEsR0FBVTtBQUxQOztBQVRQLGlCQWdCTyxDQWhCUDtjQWlCSSxLQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFqQixDQUFxQixpQkFBckIsQ0FBRixDQUFQO2dCQUNFLE1BQU0sa0JBQUEsQ0FBbUIsS0FBbkI7Z0JBQ04sS0FBQSxDQUFBO0FBQ0EseUJBSEY7O2NBSUEsWUFBQSxHQUFrQixJQUFBLENBQUssS0FBSyxDQUFDLEtBQVg7Y0FDbEIsT0FBQSxHQUFjO0FBTlg7O0FBaEJQLGlCQXdCTyxDQXhCUDtjQXlCSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFoQixDQUFBLElBQW1DLENBQUUsS0FBSyxDQUFDLEtBQU4sS0FBZSxHQUFqQixFQUExQztnQkFDRSxNQUFNLGtCQUFBLENBQW1CLEtBQW5CO2dCQUNOLEtBQUEsQ0FBQTtBQUNBLHlCQUhGOztjQUtBLE1BQU0sQ0FBQSxDQUFBOztnQkFBRSxJQUFBLEVBQU0sU0FBUjtnQkFBbUIsSUFBbkI7Z0JBQXlCLE9BQXpCO2dCQUFrQztjQUFsQyxDQUFBO2NBQ04sS0FBQSxDQUFBO0FBL0JKO1FBSEYsQ0FuQk47O0FBdURNLGVBQU87TUF4RGlCLEVBVjlCOztBQXFFSSxhQUFPLE9BQUEsR0FBVTtRQUFFLHVCQUFGO1FBQTJCLFNBQUEsRUFBVyxDQUFBO01BQXRDO0lBdkVlO0VBQWxDLEVBYkY7OztFQXVGQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXZGQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcGFyc2VfcmVxdWlyZV9zdGF0ZW1lbnRzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIFBBVEggICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgd2Fsa19qc190b2tlbnMsXG4gICAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgICBycHJfdG9rZW4sXG4gICAgICBzdW1tYXJpemUsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3dhbGstanMtdG9rZW5zLmJyaWNzJyApLnJlcXVpcmVfd2Fsa19qc190b2tlbnMoKVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCApIC0+XG4gICAgICBzb3VyY2UgICAgICAgID0gRlMucmVhZEZpbGVTeW5jIHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIH1cbiAgICAgIGxpbmVzICAgICAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGhpc3RvcnkgICAgICAgPSAwXG4gICAgICBwYWNrYWdlX25hbWUgID0gbnVsbFxuICAgICAgbGluZV9uciAgICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmVzZXQgPSAtPlxuICAgICAgICBoaXN0b3J5ICAgICAgID0gMFxuICAgICAgICBwYWNrYWdlX25hbWUgID0gbnVsbFxuICAgICAgICBsaW5lX25yICAgICAgID0gbnVsbFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3YXJuaW5nX2Zyb21fdG9rZW4gPSAoIHRva2VuICkgLT5cbiAgICAgICAgbGluZXMgID89IFsgbnVsbCwgKCBzb3VyY2Uuc3BsaXQgJ1xcbicgKS4uLiwgXVxuICAgICAgICBsaW5lICAgID0gbGluZXNbIHRva2VuLmxpbmVfbnIgXSA/IFwiKEVSUk9SOiBVTkFCTEUgVE8gUkVUUklFVkUgU09VUkNFKVwiXG4gICAgICAgIG1lc3NhZ2UgPSBcIs6pa3ZyX184OSBpZ25vcmluZyBwb3NzaWJsZSBgcmVxdWlyZWAgb24gbGluZSAje3Rva2VuLmxpbmVfbnJ9OiAje3Jwcl9zdHJpbmcgbGluZX1cIlxuICAgICAgICByZXR1cm4geyB0eXBlOiAnd2FybmluZycsIG1lc3NhZ2UsIGxpbmUsIGxpbmVfbnI6IHRva2VuLmxpbmVfbnIsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHRva2VuIGZyb20gd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zIHNvdXJjZVxuICAgICAgICAjIGluZm8gJ86pa3ZyX185MCcsIHRva2VuXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIGhpc3RvcnlcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gMFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnSWRlbnRpZmllck5hbWUnICkgYW5kICggdG9rZW4udmFsdWUgaXMgJ3JlcXVpcmUnIClcbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgaGlzdG9yeSA9IDFcbiAgICAgICAgICAgIGxpbmVfbnIgPSB0b2tlbi5saW5lX25yXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIDFcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJygnIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIGhpc3RvcnkgPSAyXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIDJcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLmNhdGVnb3JpZXMuaGFzICdzdHJpbmdfbGl0ZXJhbHMnIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHBhY2thZ2VfbmFtZSAgICA9IGV2YWwgdG9rZW4udmFsdWVcbiAgICAgICAgICAgIGhpc3RvcnkgICAgID0gM1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiAzXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICcpJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAjIGRlYnVnICfOqWt2cl9fOTQnLCBcImxpbmUgI3tsaW5lX25yfSBmb3VuZCByZXF1aXJlICN7cnByX3N0cmluZyBwYWNrYWdlX25hbWV9XCJcbiAgICAgICAgICAgIHlpZWxkIHsgdHlwZTogJ3JlcXVpcmUnLCBwYXRoLCBsaW5lX25yLCBwYWNrYWdlX25hbWUsIH1cbiAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLCBpbnRlcm5hbHM6IHt9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
