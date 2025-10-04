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
      var FS, PATH, exports, get_signature, nfa, object_prototype, rpr_string, rpr_token, summarize, types, walk_essential_js_tokens, walk_js_tokens, walk_require_statements, walk_require_statements_cfg;
      //=======================================================================================================
      FS = require('node:fs');
      PATH = require('node:path');
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
      ({walk_js_tokens, walk_essential_js_tokens, rpr_token, summarize} = (require('./walk-js-tokens.brics')).require_walk_js_tokens());
      ({nfa, get_signature} = require('normalize-function-arguments'));
      //.......................................................................................................
      object_prototype = Object.getPrototypeOf({});
      types = {
        pod: {
          isa: function(x) {
            var ref;
            return (x != null) && ((ref = Object.getPrototypeOf(x)) === null || ref === object_prototype);
          }
        },
        text: {
          isa: function(x) {
            return (typeof x) === 'string';
          }
        },
        nonempty_text: {
          isa: function(x) {
            return (types.text.isa(x)) && (x.length > 0);
          }
        },
        optional_nonempty_text: {
          isa: function(x) {
            return (x == null) || (type.nonempty_text.isa(x));
          }
        }
      };
      //.......................................................................................................
      walk_require_statements_cfg = {
        template: {
          path: null,
          source: null
        },
        isa: function(x) {
          if (!types.pod.isa(x)) {
            return false;
          }
          if (!types.optional_nonempty_text.isa(x.path)) {
            return false;
          }
          if (!types.optional_nonempty_text.isa(x.source)) {
            return false;
          }
          if ((x.path != null) && (x.source != null)) {
            return false;
          }
          if ((x.path == null) && (x.source == null)) {
            return false;
          }
          return true;
        }
      };
      //=======================================================================================================
      walk_require_statements = nfa(function*(path, cfg) {
        var annotation, line_nr, lines, package_name, package_type, ref, ref1, reset, source, stage, stages, token, warning_from_token;
        // walk_require_statements = nfa walk_require_statements_cfg, ( path, cfg ) ->
        source = cfg.path != null ? FS.readFileSync(path, {
          encoding: 'utf-8'
        }) : cfg.source;
        lines = null;
        //.....................................................................................................
        stages = {
          start: Symbol('start'),
          found_require: Symbol('found_require'),
          found_left_paren: Symbol('found_left_paren'),
          found_string_literal: Symbol('found_string_literal'),
          found_right_paren: Symbol('found_right_paren')
        };
        //.....................................................................................................
        stage = stages.start;
        package_name = null;
        line_nr = null;
        //.....................................................................................................
        reset = function() {
          stage = stages.start;
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
          message = `ignoring possible \`require\` on line ${token.line_nr}: ${rpr_string(line)}`;
          return {
            type: 'warning',
            message,
            line,
            line_nr: token.line_nr
          };
        };
//.....................................................................................................
        for (token of walk_js_tokens(source)) {
          if ((ref = token.categories) != null ? ref.has('whitespace') : void 0) {
            // continue if token.type is 'warning'
            continue;
          }
          //...................................................................................................
          switch (stage) {
            //.................................................................................................
            case stages.start:
              if (!((token.type === 'IdentifierName') && (token.value === 'require'))) {
                reset();
                continue;
              }
              stage = stages.found_require;
              line_nr = token.line_nr;
              break;
            //.................................................................................................
            case stages.found_require:
              if (!((token.type === 'Punctuator') && (token.value === '('))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              stage = stages.found_left_paren;
              break;
            //.................................................................................................
            case stages.found_left_paren:
              if (!(token.categories.has('string_literals'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              package_name = eval(token.value);
              stage = stages.found_string_literal;
              break;
            //.................................................................................................
            case stages.found_string_literal:
              if (!((token.type === 'Punctuator') && (token.value === ')'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              stage = stages.found_right_paren;
              package_type = (function() {
                switch (true) {
                  case package_name.startsWith('node:'):
                    return 'node';
                  case package_name.startsWith('./'):
                    return 'local';
                  case package_name.startsWith('../'):
                    return 'local';
                  default:
                    return 'npm';
                }
              })();
              break;
            //.................................................................................................
            case stages.found_right_paren:
              switch (true) {
                // when ( ( token.type is 'Punctuator') and ( token.value is ';' ) ) then null
                case ((ref1 = token.type) === 'eof' || ref1 === 'LineTerminatorSequence'):
                  annotation = null;
                  break;
                case token.type === 'SingleLineComment':
                  annotation = token.value.replace(/^\s*\/\/\s*/, '');
                  break;
                default:
                  continue;
              }
              yield ({
                type: 'require',
                line_nr,
                package_type,
                package_name,
                annotation
              });
              // yield { type: 'require', path, line_nr, package_name, }
              reset();
          }
        }
        //.....................................................................................................
        return null;
      });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxnQkFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSx3QkFBQSxFQUFBLGNBQUEsRUFBQSx1QkFBQSxFQUFBLDJCQUFBOztNQUNJLEVBQUEsR0FBOEIsT0FBQSxDQUFRLFNBQVI7TUFDOUIsSUFBQSxHQUE4QixPQUFBLENBQVEsV0FBUjtNQUM5QixDQUFBLENBQUUsVUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLG9CQUFSLENBQUYsQ0FBZ0MsQ0FBQyxrQkFBakMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxjQUFGLEVBQ0Usd0JBREYsRUFFRSxTQUZGLEVBR0UsU0FIRixDQUFBLEdBRzhCLENBQUUsT0FBQSxDQUFRLHdCQUFSLENBQUYsQ0FBb0MsQ0FBQyxzQkFBckMsQ0FBQSxDQUg5QjtNQUlBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFBLEdBQzhCLE9BQUEsQ0FBUSw4QkFBUixDQUQ5QixFQVJKOztNQVdJLGdCQUFBLEdBQThCLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQUEsQ0FBdEI7TUFDOUIsS0FBQSxHQUNFO1FBQUEsR0FBQSxFQUEwQjtVQUFBLEdBQUEsRUFBSyxRQUFBLENBQUUsQ0FBRixDQUFBO0FBQVEsZ0JBQUE7bUJBQUMsV0FBQSxZQUFTLE1BQU0sQ0FBQyxjQUFQ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LEdBQVU7UUFBRSx1QkFBRjtRQUEyQixTQUFBLEVBQVcsQ0FBQTtNQUF0QztJQWpIZTtFQUFsQyxFQWJGOzs7RUFpSUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUFqSUEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3BhcnNlX3JlcXVpcmVfc3RhdGVtZW50czogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgRlMgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiAgICBQQVRIICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG4gICAgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Jwci1zdHJpbmcuYnJpY3MnICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICB7IHdhbGtfanNfdG9rZW5zLFxuICAgICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuICAgICAgcnByX3Rva2VuLFxuICAgICAgc3VtbWFyaXplLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi93YWxrLWpzLXRva2Vucy5icmljcycgKS5yZXF1aXJlX3dhbGtfanNfdG9rZW5zKClcbiAgICB7IG5mYSxcbiAgICAgIGdldF9zaWduYXR1cmUsICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgb2JqZWN0X3Byb3RvdHlwZSAgICAgICAgICAgID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9XG4gICAgdHlwZXMgICAgICAgICAgICAgICAgICAgICAgID1cbiAgICAgIHBvZDogICAgICAgICAgICAgICAgICAgICAgaXNhOiAoIHggKSAtPiB4PyBhbmQgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApIGluIFsgbnVsbCwgb2JqZWN0X3Byb3RvdHlwZSwgXVxuICAgICAgdGV4dDogICAgICAgICAgICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZW9mIHggKSBpcyAnc3RyaW5nJ1xuICAgICAgbm9uZW1wdHlfdGV4dDogICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZXMudGV4dC5pc2EgeCApIGFuZCAoIHgubGVuZ3RoID4gMCApXG4gICAgICBvcHRpb25hbF9ub25lbXB0eV90ZXh0OiAgIGlzYTogKCB4ICkgLT4gKCBub3QgeD8gKSBvciAoIHR5cGUubm9uZW1wdHlfdGV4dC5pc2EgeCApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50c19jZmcgPVxuICAgICAgdGVtcGxhdGU6ICAgeyBwYXRoOiBudWxsLCBzb3VyY2U6IG51bGwsIH1cbiAgICAgIGlzYTogICAgICAgICggeCApIC0+XG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMucG9kLmlzYSB4XG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMub3B0aW9uYWxfbm9uZW1wdHlfdGV4dC5pc2EgeC5wYXRoXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMub3B0aW9uYWxfbm9uZW1wdHlfdGV4dC5pc2EgeC5zb3VyY2VcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmICggICAgIHgucGF0aD8gKSBhbmQgKCAgICAgeC5zb3VyY2U/IClcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmICggbm90IHgucGF0aD8gKSBhbmQgKCBub3QgeC5zb3VyY2U/IClcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgPSBuZmEgKCBwYXRoLCBjZmcgKSAtPlxuICAgICMgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgPSBuZmEgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHNfY2ZnLCAoIHBhdGgsIGNmZyApIC0+XG4gICAgICBzb3VyY2UgICAgICAgID0gaWYgY2ZnLnBhdGg/IHRoZW4gKCBGUy5yZWFkRmlsZVN5bmMgcGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JywgfSApIGVsc2UgY2ZnLnNvdXJjZVxuICAgICAgbGluZXMgICAgICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3RhZ2VzICAgICAgICA9XG4gICAgICAgIHN0YXJ0OiAgICAgICAgICAgICAgICBTeW1ib2wgJ3N0YXJ0J1xuICAgICAgICBmb3VuZF9yZXF1aXJlOiAgICAgICAgU3ltYm9sICdmb3VuZF9yZXF1aXJlJ1xuICAgICAgICBmb3VuZF9sZWZ0X3BhcmVuOiAgICAgU3ltYm9sICdmb3VuZF9sZWZ0X3BhcmVuJ1xuICAgICAgICBmb3VuZF9zdHJpbmdfbGl0ZXJhbDogU3ltYm9sICdmb3VuZF9zdHJpbmdfbGl0ZXJhbCdcbiAgICAgICAgZm91bmRfcmlnaHRfcGFyZW46ICAgIFN5bWJvbCAnZm91bmRfcmlnaHRfcGFyZW4nXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN0YWdlICAgICAgICAgPSBzdGFnZXMuc3RhcnRcbiAgICAgIHBhY2thZ2VfbmFtZSAgPSBudWxsXG4gICAgICBsaW5lX25yICAgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXNldCA9IC0+XG4gICAgICAgIHN0YWdlICAgICAgICAgPSBzdGFnZXMuc3RhcnRcbiAgICAgICAgcGFja2FnZV9uYW1lICA9IG51bGxcbiAgICAgICAgbGluZV9uciAgICAgICA9IG51bGxcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2FybmluZ19mcm9tX3Rva2VuID0gKCB0b2tlbiApIC0+XG4gICAgICAgIGxpbmVzICA/PSBbIG51bGwsICggc291cmNlLnNwbGl0ICdcXG4nICkuLi4sIF1cbiAgICAgICAgbGluZSAgICA9IGxpbmVzWyB0b2tlbi5saW5lX25yIF0gPyBcIihFUlJPUjogVU5BQkxFIFRPIFJFVFJJRVZFIFNPVVJDRSlcIlxuICAgICAgICBtZXNzYWdlID0gXCJpZ25vcmluZyBwb3NzaWJsZSBgcmVxdWlyZWAgb24gbGluZSAje3Rva2VuLmxpbmVfbnJ9OiAje3Jwcl9zdHJpbmcgbGluZX1cIlxuICAgICAgICByZXR1cm4geyB0eXBlOiAnd2FybmluZycsIG1lc3NhZ2UsIGxpbmUsIGxpbmVfbnI6IHRva2VuLmxpbmVfbnIsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHRva2VuIGZyb20gd2Fsa19qc190b2tlbnMgc291cmNlXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4udHlwZSBpcyAnd2FybmluZydcbiAgICAgICAgY29udGludWUgaWYgdG9rZW4uY2F0ZWdvcmllcz8uaGFzICd3aGl0ZXNwYWNlJ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHN3aXRjaCBzdGFnZVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuc3RhcnRcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ0lkZW50aWZpZXJOYW1lJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICdyZXF1aXJlJyApXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YWdlID0gc3RhZ2VzLmZvdW5kX3JlcXVpcmVcbiAgICAgICAgICAgIGxpbmVfbnIgPSB0b2tlbi5saW5lX25yXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICcoJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGFnZSA9IHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi5jYXRlZ29yaWVzLmhhcyAnc3RyaW5nX2xpdGVyYWxzJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBwYWNrYWdlX25hbWUgICAgPSBldmFsIHRva2VuLnZhbHVlXG4gICAgICAgICAgICBzdGFnZSAgICAgPSBzdGFnZXMuZm91bmRfc3RyaW5nX2xpdGVyYWxcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3N0cmluZ19saXRlcmFsXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICcpJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGFnZSAgICAgICA9IHN0YWdlcy5mb3VuZF9yaWdodF9wYXJlblxuICAgICAgICAgICAgcGFja2FnZV90eXBlID0gc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgd2hlbiBwYWNrYWdlX25hbWUuc3RhcnRzV2l0aCAnbm9kZTonICB0aGVuICdub2RlJ1xuICAgICAgICAgICAgICB3aGVuIHBhY2thZ2VfbmFtZS5zdGFydHNXaXRoICcuLycgICAgIHRoZW4gJ2xvY2FsJ1xuICAgICAgICAgICAgICB3aGVuIHBhY2thZ2VfbmFtZS5zdGFydHNXaXRoICcuLi8nICAgIHRoZW4gJ2xvY2FsJ1xuICAgICAgICAgICAgICBlbHNlICducG0nXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9yaWdodF9wYXJlblxuICAgICAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgIyB3aGVuICggKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJykgYW5kICggdG9rZW4udmFsdWUgaXMgJzsnICkgKSB0aGVuIG51bGxcbiAgICAgICAgICAgICAgd2hlbiAoIHRva2VuLnR5cGUgaW4gWyAnZW9mJywgJ0xpbmVUZXJtaW5hdG9yU2VxdWVuY2UnLCBdICAgICAgICkgdGhlbiBhbm5vdGF0aW9uID0gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpcyAnU2luZ2xlTGluZUNvbW1lbnQnICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIGFubm90YXRpb24gPSB0b2tlbi52YWx1ZS5yZXBsYWNlIC9eXFxzKlxcL1xcL1xccyovLCAnJ1xuICAgICAgICAgICAgICBlbHNlIGNvbnRpbnVlXG4gICAgICAgICAgICB5aWVsZCB7IHR5cGU6ICdyZXF1aXJlJywgbGluZV9uciwgcGFja2FnZV90eXBlLCBwYWNrYWdlX25hbWUsIGFubm90YXRpb24sIH1cbiAgICAgICAgICAgICMgeWllbGQgeyB0eXBlOiAncmVxdWlyZScsIHBhdGgsIGxpbmVfbnIsIHBhY2thZ2VfbmFtZSwgfVxuICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMsIGludGVybmFsczoge30sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
