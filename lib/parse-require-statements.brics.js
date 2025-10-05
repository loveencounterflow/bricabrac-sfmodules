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
      var FS, PATH, exports, get_app_details, get_signature, is_inside, nfa, object_prototype, rpr_string, rpr_token, summarize, types, walk_essential_js_tokens, walk_js_tokens, walk_require_statements, walk_require_statements_cfg;
      //=======================================================================================================
      FS = require('node:fs');
      PATH = require('node:path');
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
      // walk_require_statements = nfa walk_require_statements_cfg, ( path, cfg ) ->
      walk_require_statements = nfa(function*(path, cfg) {
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
        state = {
          stage: stages.start,
          pkg_selector: null,
          pkg_type: null,
          line_nr: null
        };
        //.....................................................................................................
        reset = function() {
          state.stage = stages.start;
          state.pkg_selector = null;
          state.pkg_type = null;
          state.line_nr = null;
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
              state.pkg_selector = eval(token.value);
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
                case state.pkg_selector.startsWith('node:'):
                  state.pkg_type = 'node';
                  break;
                case !/^\.{1,2}\//.test(state.pkg_selector):
                  state.pkg_type = 'npm';
                  break;
                case app_details != null:
                  pkg_location = PATH.resolve(anchor, state.pkg_selector);
                  if (is_inside(app_details.path, pkg_location)) {
                    state.pkg_type = 'inside';
                  } else {
                    state.pkg_type = 'outside';
                  }
                  break;
                default:
                  state.pkg_type = 'unresolved';
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
                pkg_type: state.pkg_type,
                pkg_selector: state.pkg_selector,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLGdCQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLHdCQUFBLEVBQUEsY0FBQSxFQUFBLHVCQUFBLEVBQUEsMkJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLFNBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsY0FBRixFQUNFLHdCQURGLEVBRUUsU0FGRixFQUdFLFNBSEYsQ0FBQSxHQUc4QixDQUFFLE9BQUEsQ0FBUSx3QkFBUixDQUFGLENBQXVDLENBQUMsc0JBQXhDLENBQUEsQ0FIOUI7TUFJQSxDQUFBLENBQUUsZUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLDJCQUFSLENBQUYsQ0FBdUMsQ0FBQyx1QkFBeEMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFB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QSxFQUFrQixLQUFLLENBQUMsWUFKcEI7Z0JBS0o7Y0FMSSxDQUFBO2NBTU4sS0FBQSxDQUFBO0FBdkRKO1FBSkYsQ0F6Q047O0FBc0dNLGVBQU87TUF2R3FCLENBQUosRUFqQzlCOztBQTJJSSxhQUFPLE9BQUEsR0FBVTtRQUFFLHVCQUFGO1FBQTJCLFNBQUEsRUFBVyxDQUFBO01BQXRDO0lBN0llO0VBQWxDLEVBYkY7OztFQTZKQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQTdKQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcGFyc2VfcmVxdWlyZV9zdGF0ZW1lbnRzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIFBBVEggICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgaXNfaW5zaWRlLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9wYXRoLXRvb2xzLmJyaWNzJyApLnJlcXVpcmVfcGF0aF90b29scygpXG4gICAgeyB3YWxrX2pzX3Rva2VucyxcbiAgICAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyxcbiAgICAgIHJwcl90b2tlbixcbiAgICAgIHN1bW1hcml6ZSwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vd2Fsay1qcy10b2tlbnMuYnJpY3MnICAgICkucmVxdWlyZV93YWxrX2pzX3Rva2VucygpXG4gICAgeyBnZXRfYXBwX2RldGFpbHMsICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLWNhbGxzaXRlLWJyaWNzJyApLnJlcXVpcmVfZ2V0X2FwcF9kZXRhaWxzKClcbiAgICB7IG5mYSxcbiAgICAgIGdldF9zaWduYXR1cmUsICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgb2JqZWN0X3Byb3RvdHlwZSAgICAgICAgICAgID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9XG4gICAgdHlwZXMgICAgICAgICAgICAgICAgICAgICAgID1cbiAgICAgIHBvZDogICAgICAgICAgICAgICAgICAgICAgaXNhOiAoIHggKSAtPiB4PyBhbmQgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApIGluIFsgbnVsbCwgb2JqZWN0X3Byb3RvdHlwZSwgXVxuICAgICAgdGV4dDogICAgICAgICAgICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZW9mIHggKSBpcyAnc3RyaW5nJ1xuICAgICAgbm9uZW1wdHlfdGV4dDogICAgICAgICAgICBpc2E6ICggeCApIC0+ICggdHlwZXMudGV4dC5pc2EgeCApIGFuZCAoIHgubGVuZ3RoID4gMCApXG4gICAgICBvcHRpb25hbF9ub25lbXB0eV90ZXh0OiAgIGlzYTogKCB4ICkgLT4gKCBub3QgeD8gKSBvciAoIHR5cGUubm9uZW1wdHlfdGV4dC5pc2EgeCApXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50c19jZmcgPVxuICAgICAgdGVtcGxhdGU6ICAgeyBwYXRoOiBudWxsLCBzb3VyY2U6IG51bGwsIH1cbiAgICAgIGlzYTogICAgICAgICggeCApIC0+XG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMucG9kLmlzYSB4XG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMub3B0aW9uYWxfbm9uZW1wdHlfdGV4dC5pc2EgeC5wYXRoXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHlwZXMub3B0aW9uYWxfbm9uZW1wdHlfdGV4dC5pc2EgeC5zb3VyY2VcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgKCAgICAgeC5wYXRoPyApIGFuZCAoICAgICB4LnNvdXJjZT8gKVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnBhdGg/IClcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgKCAgICAgeC5zb3VyY2U/IClcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgPSBuZmEgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHNfY2ZnLCAoIHBhdGgsIGNmZyApIC0+XG4gICAgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgPSBuZmEgKCBwYXRoLCBjZmcgKSAtPlxuICAgICAgaWYgY2ZnLnBhdGg/XG4gICAgICAgIHBhdGggICAgICAgID0gRlMucmVhbHBhdGhTeW5jIGNmZy5wYXRoXG4gICAgICAgIGFuY2hvciAgICAgID0gUEFUSC5kaXJuYW1lIHBhdGhcbiAgICAgICAgc291cmNlICAgICAgPSBpZiBjZmcuc291cmNlPyB0aGVuIGNmZy5zb3VyY2UgZWxzZSAoIEZTLnJlYWRGaWxlU3luYyBwYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnLCB9IClcbiAgICAgICAgYXBwX2RldGFpbHMgPSBnZXRfYXBwX2RldGFpbHMgeyBwYXRoLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGVsc2VcbiAgICAgICAgcGF0aCAgICAgICAgPSBudWxsICMgaWYgKCBjZmcucGF0aD8gKSB0aGVuICggUEFUSC5yZXNvbHZlIGNmZy5wYXRoICkgZWxzZSBudWxsXG4gICAgICAgIGFuY2hvciAgICAgID0gbnVsbFxuICAgICAgICBzb3VyY2UgICAgICA9IGNmZy5zb3VyY2VcbiAgICAgICAgYXBwX2RldGFpbHMgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGFic3BhdGggICAgICAgPSBudWxsXG4gICAgICByZWxwYXRoICAgICAgID0gbnVsbFxuICAgICAgbGluZXMgICAgICAgICA9IG51bGxcbiAgICAgIHN0YWdlcyAgICAgICAgPVxuICAgICAgICBzdGFydDogICAgICAgICAgICAgICAgU3ltYm9sICdzdGFydCdcbiAgICAgICAgZm91bmRfcmVxdWlyZTogICAgICAgIFN5bWJvbCAnZm91bmRfcmVxdWlyZSdcbiAgICAgICAgZm91bmRfbGVmdF9wYXJlbjogICAgIFN5bWJvbCAnZm91bmRfbGVmdF9wYXJlbidcbiAgICAgICAgZm91bmRfc3RyaW5nX2xpdGVyYWw6IFN5bWJvbCAnZm91bmRfc3RyaW5nX2xpdGVyYWwnXG4gICAgICAgIGZvdW5kX3JpZ2h0X3BhcmVuOiAgICBTeW1ib2wgJ2ZvdW5kX3JpZ2h0X3BhcmVuJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzdGF0ZSAgICAgICAgID1cbiAgICAgICAgc3RhZ2U6ICAgICAgICAgICAgc3RhZ2VzLnN0YXJ0XG4gICAgICAgIHBrZ19zZWxlY3RvcjogICAgIG51bGxcbiAgICAgICAgcGtnX3R5cGU6ICAgICAgICAgbnVsbFxuICAgICAgICBsaW5lX25yOiAgICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJlc2V0ID0gLT5cbiAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5zdGFydFxuICAgICAgICBzdGF0ZS5wa2dfc2VsZWN0b3IgID0gbnVsbFxuICAgICAgICBzdGF0ZS5wa2dfdHlwZSAgICAgID0gbnVsbFxuICAgICAgICBzdGF0ZS5saW5lX25yICAgICAgID0gbnVsbFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3YXJuaW5nX2Zyb21fdG9rZW4gPSAoIHRva2VuICkgLT5cbiAgICAgICAgbGluZXMgID89IFsgbnVsbCwgKCBzb3VyY2Uuc3BsaXQgJ1xcbicgKS4uLiwgXVxuICAgICAgICBsaW5lICAgID0gbGluZXNbIHRva2VuLmxpbmVfbnIgXSA/IFwiKEVSUk9SOiBVTkFCTEUgVE8gUkVUUklFVkUgU09VUkNFKVwiXG4gICAgICAgIG1lc3NhZ2UgPSBcImlnbm9yaW5nIHBvc3NpYmxlIGByZXF1aXJlYCBvbiBsaW5lICN7dG9rZW4ubGluZV9ucn06ICN7cnByX3N0cmluZyBsaW5lfVwiXG4gICAgICAgIHJldHVybiB7IHR5cGU6ICd3YXJuaW5nJywgbWVzc2FnZSwgbGluZSwgbGluZV9ucjogdG9rZW4ubGluZV9uciwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgdG9rZW4gZnJvbSB3YWxrX2pzX3Rva2VucyBzb3VyY2VcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICd3YXJuaW5nJ1xuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi5jYXRlZ29yaWVzPy5oYXMgJ3doaXRlc3BhY2UnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIHN0YXRlLnN0YWdlXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5zdGFydFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnSWRlbnRpZmllck5hbWUnICkgYW5kICggdG9rZW4udmFsdWUgaXMgJ3JlcXVpcmUnIClcbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICBzdGF0ZS5saW5lX25yICAgICAgID0gdG9rZW4ubGluZV9uclxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKCcgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi5jYXRlZ29yaWVzLmhhcyAnc3RyaW5nX2xpdGVyYWxzJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGF0ZS5wa2dfc2VsZWN0b3IgID0gZXZhbCB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfc3RyaW5nX2xpdGVyYWxcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJyknIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YXRlLnN0YWdlICAgICAgICAgPSBzdGFnZXMuZm91bmRfcmlnaHRfcGFyZW5cbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICB3aGVuIHN0YXRlLnBrZ19zZWxlY3Rvci5zdGFydHNXaXRoICdub2RlOicgICAgICAgICAgICAgICAgdGhlbiAgc3RhdGUucGtnX3R5cGUgID0gJ25vZGUnXG4gICAgICAgICAgICAgIHdoZW4gbm90IC8vLyBeIFxcLnsxLDJ9IFxcLyAvLy8udGVzdCBzdGF0ZS5wa2dfc2VsZWN0b3IgICAgIHRoZW4gIHN0YXRlLnBrZ190eXBlICA9ICducG0nXG4gICAgICAgICAgICAgIHdoZW4gYXBwX2RldGFpbHM/XG4gICAgICAgICAgICAgICAgcGtnX2xvY2F0aW9uID0gUEFUSC5yZXNvbHZlIGFuY2hvciwgc3RhdGUucGtnX3NlbGVjdG9yXG4gICAgICAgICAgICAgICAgaWYgKCBpc19pbnNpZGUgYXBwX2RldGFpbHMucGF0aCwgcGtnX2xvY2F0aW9uICkgICAgICAgICB0aGVuICBzdGF0ZS5wa2dfdHlwZSAgPSAnaW5zaWRlJ1xuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUucGtnX3R5cGUgID0gJ291dHNpZGUnXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzdGF0ZS5wa2dfdHlwZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9ICd1bnJlc29sdmVkJ1xuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfcmlnaHRfcGFyZW5cbiAgICAgICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgICAgICMgd2hlbiAoICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicpIGFuZCAoIHRva2VuLnZhbHVlIGlzICc7JyApICkgdGhlbiBudWxsXG4gICAgICAgICAgICAgIHdoZW4gKCB0b2tlbi50eXBlIGluIFsgJ2VvZicsICdMaW5lVGVybWluYXRvclNlcXVlbmNlJywgXSAgICAgICApIHRoZW4gYW5ub3RhdGlvbiA9IG51bGxcbiAgICAgICAgICAgICAgd2hlbiAoIHRva2VuLnR5cGUgaXMgJ1NpbmdsZUxpbmVDb21tZW50JyAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uID0gdG9rZW4udmFsdWUucmVwbGFjZSAvXlxccypcXC9cXC9cXHMqLywgJydcbiAgICAgICAgICAgICAgZWxzZSBjb250aW51ZVxuICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICB0eXBlOiAgICAgICAgICAgICAncmVxdWlyZScsXG4gICAgICAgICAgICAgIGxpbmVfbnI6ICAgICAgICAgIHN0YXRlLmxpbmVfbnIsXG4gICAgICAgICAgICAgIHBrZ190eXBlOiAgICAgICAgIHN0YXRlLnBrZ190eXBlLFxuICAgICAgICAgICAgICBwa2dfc2VsZWN0b3I6ICAgICBzdGF0ZS5wa2dfc2VsZWN0b3IsXG4gICAgICAgICAgICAgIGFubm90YXRpb24sIH1cbiAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLCBpbnRlcm5hbHM6IHt9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
