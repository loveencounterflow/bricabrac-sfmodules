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
      var FS, PATH, exports, get_app_details, get_signature, isBuiltin, is_inside, nfa, object_prototype, rpr_string, rpr_token, summarize, types, walk_essential_js_tokens, walk_js_tokens, walk_require_statements, walk_require_statements_cfg;
      //=======================================================================================================
      FS = require('node:fs');
      PATH = require('node:path');
      ({isBuiltin} = require('node:module'));
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
      ({is_inside} = (require('./path-tools.brics')).require_path_tools());
      ({walk_js_tokens, walk_essential_js_tokens, rpr_token, summarize} = (require('./walk-js-tokens.brics')).require_walk_js_tokens());
      ({get_app_details} = (require('./unstable-callsite-brics')).require_get_app_details());
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
            return (x == null) || (types.nonempty_text.isa(x));
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
            return true;
          }
          if ((x.path != null)) {
            return true;
          }
          if ((x.source != null)) {
            return true;
          }
          return false;
        }
      };
      //=======================================================================================================
      walk_require_statements = nfa(walk_require_statements_cfg, walk_require_statements = function*(path, cfg) {
        var abspath, anchor, annotation, app_details, lines, pkg_location, ref, ref1, relpath, reset, source, stages, state, token, warning_from_token;
        if (cfg.path != null) {
          path = FS.realpathSync(cfg.path);
          anchor = PATH.dirname(path);
          source = cfg.source != null ? cfg.source : FS.readFileSync(path, {
            encoding: 'utf-8'
          });
          app_details = get_app_details({path});
        } else {
          //.....................................................................................................
          path = null; // if ( cfg.path? ) then ( PATH.resolve cfg.path ) else null
          anchor = null;
          source = cfg.source;
          app_details = null;
        }
        //.....................................................................................................
        abspath = null;
        relpath = null;
        lines = null;
        stages = {
          start: Symbol('start'),
          found_require: Symbol('found_require'),
          found_left_paren: Symbol('found_left_paren'),
          found_string_literal: Symbol('found_string_literal'),
          found_right_paren: Symbol('found_right_paren')
        };
        //.....................................................................................................
        reset = function() {
          state.stage = stages.start;
          state.selector = null;
          state.disposition = null;
          state.line_nr = null;
          return null;
        };
        //.....................................................................................................
        state = {};
        reset();
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
          switch (state.stage) {
            //.................................................................................................
            case stages.start:
              if (!((token.type === 'IdentifierName') && (token.value === 'require'))) {
                reset();
                continue;
              }
              state.stage = stages.found_require;
              state.line_nr = token.line_nr;
              break;
            //.................................................................................................
            case stages.found_require:
              if (!((token.type === 'Punctuator') && (token.value === '('))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              state.stage = stages.found_left_paren;
              break;
            //.................................................................................................
            case stages.found_left_paren:
              if (!(token.categories.has('string_literals'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              state.selector = eval(token.value);
              state.stage = stages.found_string_literal;
              break;
            //.................................................................................................
            case stages.found_string_literal:
              if (!((token.type === 'Punctuator') && (token.value === ')'))) {
                yield warning_from_token(token);
                reset();
                continue;
              }
              state.stage = stages.found_right_paren;
              //...............................................................................................
              switch (true) {
                //.............................................................................................
                // when state.selector.startsWith 'node:'            then  state.disposition = 'node'
                case isBuiltin(state.selector):
                  state.disposition = 'node';
                  break;
                case !/^\.{1,2}\//.test(state.selector):
                  state.disposition = 'npm';
                  break;
                case app_details != null:
                  pkg_location = PATH.resolve(anchor, state.selector);
                  if (is_inside(app_details.path, pkg_location)) {
                    state.disposition = 'inside';
                  } else {
                    state.disposition = 'outside';
                  }
                  break;
                default:
                  state.disposition = 'unresolved';
              }
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
                line_nr: state.line_nr,
                disposition: state.disposition,
                selector: state.selector,
                annotation
              });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxnQkFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSx3QkFBQSxFQUFBLGNBQUEsRUFBQSx1QkFBQSxFQUFBLDJCQUFBOztNQUNJLEVBQUEsR0FBOEIsT0FBQSxDQUFRLFNBQVI7TUFDOUIsSUFBQSxHQUE4QixPQUFBLENBQVEsV0FBUjtNQUM5QixDQUFBLENBQUUsU0FBRixDQUFBLEdBQThCLE9BQUEsQ0FBUSxhQUFSLENBQTlCO01BQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsU0FBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLG9CQUFSLENBQUYsQ0FBZ0MsQ0FBQyxrQkFBakMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxjQUFGLEVBQ0Usd0JBREYsRUFFRSxTQUZGLEVBR0UsU0FIRixDQUFBLEdBRzhCLENBQUUsT0FBQSxDQUFRLHdCQUFSLENBQUYsQ0FBdUMsQ0FBQyxzQkFBeEMsQ0FBQSxDQUg5QjtNQUlBLENBQUEsQ0FBRSxlQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsMkJBQVIsQ0FBRixD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LEVBQWtCLEtBQUssQ0FBQyxRQUpwQjtnQkFLSjtjQUxJLENBQUE7Y0FNTixLQUFBLENBQUE7QUF4REo7UUFKRixDQXRDTjs7QUFvR00sZUFBTztNQXJHNEUsQ0FBM0QsRUFqQzlCOztBQXlJSSxhQUFPLE9BQUEsR0FBVTtRQUFFLHVCQUFGO1FBQTJCLFNBQUEsRUFBVyxDQUFBO01BQXRDO0lBM0llO0VBQWxDLEVBYkY7OztFQTJKQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQTNKQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcGFyc2VfcmVxdWlyZV9zdGF0ZW1lbnRzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIFBBVEggICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICB7IGlzQnVpbHRpbiwgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgaXNfaW5zaWRlLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9wYXRoLXRvb2xzLmJyaWNzJyApLnJlcXVpcmVfcGF0aF90b29scygpXG4gICAgeyB3YWxrX2pzX3Rva2VucyxcbiAgICAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyxcbiAgICAgIHJwcl90b2tlbixcbiAgICAgIHN1bW1hcml6ZSwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vd2Fsay1qcy10b2tlbnMuYnJpY3MnICAgICkucmVxdWlyZV93YWxrX2pzX3Rva2VucygpXG4gICAgeyBnZXRfYXBwX2RldGFpbHMsICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLWNhbGxzaXRlLWJyaWNzJyApLnJlcXVpcmVfZ2V0X2FwcF9kZXRhaWxzKClcbiAgICB7IG5mYSxcbiAgICAgIGdldF9zaWduYXR1cmUsICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgb2JqZWN0X3Byb3RvdHlwZSAgICAgICAgICAgID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9XG4gICAgdHlwZXMgICAgICAgICAgICAgICAgICAgICAgID1cbiAgICAgIHBvZDogICAgICAgICAgICAgICAgICAgICAgaXNhOiAoIHggKSAtPiB4PyBhbmQgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApIGluIFsgbnVsbCwgb2JqZWN0X3Byb3RvdHlwZSwgXVxuICAgICAgdGV4dDogICAgICAgICAgICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZW9mIHggKSBpcyAnc3RyaW5nJ1xuICAgICAgbm9uZW1wdHlfdGV4dDogICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZXMudGV4dC5pc2EgeCApIGFuZCAoIHgubGVuZ3RoID4gMCApXG4gICAgICBvcHRpb25hbF9ub25lbXB0eV90ZXh0OiAgIGlzYTogKCB4ICkgLT4gKCBub3QgeD8gKSBvciAoIHR5cGVzLm5vbmVtcHR5X3RleHQuaXNhIHggKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHNfY2ZnID1cbiAgICAgIHRlbXBsYXRlOiAgIHsgcGF0aDogbnVsbCwgc291cmNlOiBudWxsLCB9XG4gICAgICBpc2E6ICAgICAgICAoIHggKSAtPlxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLnBvZC5pc2EgeFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLm9wdGlvbmFsX25vbmVtcHR5X3RleHQuaXNhIHgucGF0aFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLm9wdGlvbmFsX25vbmVtcHR5X3RleHQuaXNhIHguc291cmNlXG4gICAgICAgIHJldHVybiB0cnVlIGlmICggICAgIHgucGF0aD8gKSBhbmQgKCAgICAgeC5zb3VyY2U/IClcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgKCAgICAgeC5wYXRoPyApXG4gICAgICAgIHJldHVybiB0cnVlIGlmICggICAgIHguc291cmNlPyApXG4gICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9IG5mYSB3YWxrX3JlcXVpcmVfc3RhdGVtZW50c19jZmcsIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoLCBjZmcgKSAtPlxuICAgICAgaWYgY2ZnLnBhdGg/XG4gICAgICAgIHBhdGggICAgICAgID0gRlMucmVhbHBhdGhTeW5jIGNmZy5wYXRoXG4gICAgICAgIGFuY2hvciAgICAgID0gUEFUSC5kaXJuYW1lIHBhdGhcbiAgICAgICAgc291cmNlICAgICAgPSBpZiBjZmcuc291cmNlPyB0aGVuIGNmZy5zb3VyY2UgZWxzZSAoIEZTLnJlYWRGaWxlU3luYyBwYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnLCB9IClcbiAgICAgICAgYXBwX2RldGFpbHMgPSBnZXRfYXBwX2RldGFpbHMgeyBwYXRoLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGVsc2VcbiAgICAgICAgcGF0aCAgICAgICAgPSBudWxsICMgaWYgKCBjZmcucGF0aD8gKSB0aGVuICggUEFUSC5yZXNvbHZlIGNmZy5wYXRoICkgZWxzZSBudWxsXG4gICAgICAgIGFuY2hvciAgICAgID0gbnVsbFxuICAgICAgICBzb3VyY2UgICAgICA9IGNmZy5zb3VyY2VcbiAgICAgICAgYXBwX2RldGFpbHMgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGFic3BhdGggICAgICAgPSBudWxsXG4gICAgICByZWxwYXRoICAgICAgID0gbnVsbFxuICAgICAgbGluZXMgICAgICAgICA9IG51bGxcbiAgICAgIHN0YWdlcyAgICAgICAgPVxuICAgICAgICBzdGFydDogICAgICAgICAgICAgICAgU3ltYm9sICdzdGFydCdcbiAgICAgICAgZm91bmRfcmVxdWlyZTogICAgICAgIFN5bWJvbCAnZm91bmRfcmVxdWlyZSdcbiAgICAgICAgZm91bmRfbGVmdF9wYXJlbjogICAgIFN5bWJvbCAnZm91bmRfbGVmdF9wYXJlbidcbiAgICAgICAgZm91bmRfc3RyaW5nX2xpdGVyYWw6IFN5bWJvbCAnZm91bmRfc3RyaW5nX2xpdGVyYWwnXG4gICAgICAgIGZvdW5kX3JpZ2h0X3BhcmVuOiAgICBTeW1ib2wgJ2ZvdW5kX3JpZ2h0X3BhcmVuJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXNldCA9IC0+XG4gICAgICAgIHN0YXRlLnN0YWdlICAgICAgICAgICA9IHN0YWdlcy5zdGFydFxuICAgICAgICBzdGF0ZS5zZWxlY3RvciAgICAgICAgPSBudWxsXG4gICAgICAgIHN0YXRlLmRpc3Bvc2l0aW9uICAgICA9IG51bGxcbiAgICAgICAgc3RhdGUubGluZV9uciAgICAgICAgID0gbnVsbFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzdGF0ZSAgICAgICAgID0ge31cbiAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2FybmluZ19mcm9tX3Rva2VuID0gKCB0b2tlbiApIC0+XG4gICAgICAgIGxpbmVzICA/PSBbIG51bGwsICggc291cmNlLnNwbGl0ICdcXG4nICkuLi4sIF1cbiAgICAgICAgbGluZSAgICA9IGxpbmVzWyB0b2tlbi5saW5lX25yIF0gPyBcIihFUlJPUjogVU5BQkxFIFRPIFJFVFJJRVZFIFNPVVJDRSlcIlxuICAgICAgICBtZXNzYWdlID0gXCJpZ25vcmluZyBwb3NzaWJsZSBgcmVxdWlyZWAgb24gbGluZSAje3Rva2VuLmxpbmVfbnJ9OiAje3Jwcl9zdHJpbmcgbGluZX1cIlxuICAgICAgICByZXR1cm4geyB0eXBlOiAnd2FybmluZycsIG1lc3NhZ2UsIGxpbmUsIGxpbmVfbnI6IHRva2VuLmxpbmVfbnIsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHRva2VuIGZyb20gd2Fsa19qc190b2tlbnMgc291cmNlXG4gICAgICAgICMgY29udGludWUgaWYgdG9rZW4udHlwZSBpcyAnd2FybmluZydcbiAgICAgICAgY29udGludWUgaWYgdG9rZW4uY2F0ZWdvcmllcz8uaGFzICd3aGl0ZXNwYWNlJ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHN3aXRjaCBzdGF0ZS5zdGFnZVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuc3RhcnRcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ0lkZW50aWZpZXJOYW1lJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICdyZXF1aXJlJyApXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YXRlLnN0YWdlICAgICA9IHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICBzdGF0ZS5saW5lX25yICAgPSB0b2tlbi5saW5lX25yXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJyApIGFuZCAoIHRva2VuLnZhbHVlIGlzICcoJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGF0ZS5zdGFnZSAgICAgPSBzdGFnZXMuZm91bmRfbGVmdF9wYXJlblxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfbGVmdF9wYXJlblxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4uY2F0ZWdvcmllcy5oYXMgJ3N0cmluZ19saXRlcmFscycgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc2VsZWN0b3IgID0gZXZhbCB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgID0gc3RhZ2VzLmZvdW5kX3N0cmluZ19saXRlcmFsXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKScgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgID0gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgIyB3aGVuIHN0YXRlLnNlbGVjdG9yLnN0YXJ0c1dpdGggJ25vZGU6JyAgICAgICAgICAgIHRoZW4gIHN0YXRlLmRpc3Bvc2l0aW9uID0gJ25vZGUnXG4gICAgICAgICAgICAgIHdoZW4gaXNCdWlsdGluIHN0YXRlLnNlbGVjdG9yICAgICAgICAgICAgICAgICAgICAgdGhlbiAgc3RhdGUuZGlzcG9zaXRpb24gPSAnbm9kZSdcbiAgICAgICAgICAgICAgd2hlbiBub3QgLy8vIF4gXFwuezEsMn0gXFwvIC8vLy50ZXN0IHN0YXRlLnNlbGVjdG9yIHRoZW4gIHN0YXRlLmRpc3Bvc2l0aW9uID0gJ25wbSdcbiAgICAgICAgICAgICAgd2hlbiBhcHBfZGV0YWlscz9cbiAgICAgICAgICAgICAgICBwa2dfbG9jYXRpb24gPSBQQVRILnJlc29sdmUgYW5jaG9yLCBzdGF0ZS5zZWxlY3RvclxuICAgICAgICAgICAgICAgIGlmICggaXNfaW5zaWRlIGFwcF9kZXRhaWxzLnBhdGgsIHBrZ19sb2NhdGlvbiApIHRoZW4gIHN0YXRlLmRpc3Bvc2l0aW9uID0gJ2luc2lkZSdcbiAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5kaXNwb3NpdGlvbiA9ICdvdXRzaWRlJ1xuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUuZGlzcG9zaXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAndW5yZXNvbHZlZCdcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgICAgICAjIHdoZW4gKCAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnOycgKSApIHRoZW4gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpbiBbICdlb2YnLCAnTGluZVRlcm1pbmF0b3JTZXF1ZW5jZScsIF0gICAgICAgKSB0aGVuIGFubm90YXRpb24gPSBudWxsXG4gICAgICAgICAgICAgIHdoZW4gKCB0b2tlbi50eXBlIGlzICdTaW5nbGVMaW5lQ29tbWVudCcgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbiA9IHRva2VuLnZhbHVlLnJlcGxhY2UgL15cXHMqXFwvXFwvXFxzKi8sICcnXG4gICAgICAgICAgICAgIGVsc2UgY29udGludWVcbiAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgdHlwZTogICAgICAgICAgICAgJ3JlcXVpcmUnLFxuICAgICAgICAgICAgICBsaW5lX25yOiAgICAgICAgICBzdGF0ZS5saW5lX25yLFxuICAgICAgICAgICAgICBkaXNwb3NpdGlvbjogICAgICBzdGF0ZS5kaXNwb3NpdGlvbixcbiAgICAgICAgICAgICAgc2VsZWN0b3I6ICAgICAgICAgc3RhdGUuc2VsZWN0b3IsXG4gICAgICAgICAgICAgIGFubm90YXRpb24sIH1cbiAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLCBpbnRlcm5hbHM6IHt9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
