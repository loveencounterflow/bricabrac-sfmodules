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
      ({nfa, get_signature} = require('../../normalize-function-arguments'));
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
                case state.selector.startsWith('node:'):
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLGdCQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLHdCQUFBLEVBQUEsY0FBQSxFQUFBLHVCQUFBLEVBQUEsMkJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLFNBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsY0FBRixFQUNFLHdCQURGLEVBRUUsU0FGRixFQUdFLFNBSEYsQ0FBQSxHQUc4QixDQUFFLE9BQUEsQ0FBUSx3QkFBUixDQUFGLENBQXVDLENBQUMsc0JBQXhDLENBQUEsQ0FIOUI7TUFJQSxDQUFBLENBQUUsZUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLDJCQUFSLENBQUYsQ0FBdUMsQ0FBQyx1QkFBeEMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFB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O0FBdkRKO1FBSkYsQ0F0Q047O0FBbUdNLGVBQU87TUFwRzRFLENBQTNELEVBaEM5Qjs7QUF1SUksYUFBTyxPQUFBLEdBQVU7UUFBRSx1QkFBRjtRQUEyQixTQUFBLEVBQVcsQ0FBQTtNQUF0QztJQXpJZTtFQUFsQyxFQWJGOzs7RUF5SkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUF6SkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3BhcnNlX3JlcXVpcmVfc3RhdGVtZW50czogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgRlMgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiAgICBQQVRIICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG4gICAgeyBycHJfc3RyaW5nLCAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Jwci1zdHJpbmcuYnJpY3MnICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICB7IGlzX2luc2lkZSwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcGF0aC10b29scy5icmljcycgKS5yZXF1aXJlX3BhdGhfdG9vbHMoKVxuICAgIHsgd2Fsa19qc190b2tlbnMsXG4gICAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgICBycHJfdG9rZW4sXG4gICAgICBzdW1tYXJpemUsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3dhbGstanMtdG9rZW5zLmJyaWNzJyAgICApLnJlcXVpcmVfd2Fsa19qc190b2tlbnMoKVxuICAgIHsgZ2V0X2FwcF9kZXRhaWxzLCAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1jYWxsc2l0ZS1icmljcycgKS5yZXF1aXJlX2dldF9hcHBfZGV0YWlscygpXG4gICAgeyBuZmEsXG4gICAgICBnZXRfc2lnbmF0dXJlLCAgICAgICAgICB9ID0gcmVxdWlyZSAnLi4vLi4vbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG9iamVjdF9wcm90b3R5cGUgICAgICAgICAgICA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fVxuICAgIHR5cGVzICAgICAgICAgICAgICAgICAgICAgICA9XG4gICAgICBwb2Q6ICAgICAgICAgICAgICAgICAgICAgIGlzYTogKCB4ICkgLT4geD8gYW5kICggT2JqZWN0LmdldFByb3RvdHlwZU9mIHggKSBpbiBbIG51bGwsIG9iamVjdF9wcm90b3R5cGUsIF1cbiAgICAgIHRleHQ6ICAgICAgICAgICAgICAgICAgICAgaXNhOiAoIHggKSAtPiAoIHR5cGVvZiB4ICkgaXMgJ3N0cmluZydcbiAgICAgIG5vbmVtcHR5X3RleHQ6ICAgICAgICAgICAgaXNhOiAoIHggKSAtPiAoIHR5cGVzLnRleHQuaXNhIHggKSBhbmQgKCB4Lmxlbmd0aCA+IDAgKVxuICAgICAgb3B0aW9uYWxfbm9uZW1wdHlfdGV4dDogICBpc2E6ICggeCApIC0+ICggbm90IHg/ICkgb3IgKCB0eXBlcy5ub25lbXB0eV90ZXh0LmlzYSB4IClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzX2NmZyA9XG4gICAgICB0ZW1wbGF0ZTogICB7IHBhdGg6IG51bGwsIHNvdXJjZTogbnVsbCwgfVxuICAgICAgaXNhOiAgICAgICAgKCB4ICkgLT5cbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5wb2QuaXNhIHhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnBhdGhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnNvdXJjZVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnBhdGg/ICkgYW5kICggICAgIHguc291cmNlPyApXG4gICAgICAgIHJldHVybiB0cnVlIGlmICggICAgIHgucGF0aD8gKVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnNvdXJjZT8gKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgPSBuZmEgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHNfY2ZnLCB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCwgY2ZnICkgLT5cbiAgICAgIGlmIGNmZy5wYXRoP1xuICAgICAgICBwYXRoICAgICAgICA9IEZTLnJlYWxwYXRoU3luYyBjZmcucGF0aFxuICAgICAgICBhbmNob3IgICAgICA9IFBBVEguZGlybmFtZSBwYXRoXG4gICAgICAgIHNvdXJjZSAgICAgID0gaWYgY2ZnLnNvdXJjZT8gdGhlbiBjZmcuc291cmNlIGVsc2UgKCBGUy5yZWFkRmlsZVN5bmMgcGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JywgfSApXG4gICAgICAgIGFwcF9kZXRhaWxzID0gZ2V0X2FwcF9kZXRhaWxzIHsgcGF0aCwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBlbHNlXG4gICAgICAgIHBhdGggICAgICAgID0gbnVsbCAjIGlmICggY2ZnLnBhdGg/ICkgdGhlbiAoIFBBVEgucmVzb2x2ZSBjZmcucGF0aCApIGVsc2UgbnVsbFxuICAgICAgICBhbmNob3IgICAgICA9IG51bGxcbiAgICAgICAgc291cmNlICAgICAgPSBjZmcuc291cmNlXG4gICAgICAgIGFwcF9kZXRhaWxzID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBhYnNwYXRoICAgICAgID0gbnVsbFxuICAgICAgcmVscGF0aCAgICAgICA9IG51bGxcbiAgICAgIGxpbmVzICAgICAgICAgPSBudWxsXG4gICAgICBzdGFnZXMgICAgICAgID1cbiAgICAgICAgc3RhcnQ6ICAgICAgICAgICAgICAgIFN5bWJvbCAnc3RhcnQnXG4gICAgICAgIGZvdW5kX3JlcXVpcmU6ICAgICAgICBTeW1ib2wgJ2ZvdW5kX3JlcXVpcmUnXG4gICAgICAgIGZvdW5kX2xlZnRfcGFyZW46ICAgICBTeW1ib2wgJ2ZvdW5kX2xlZnRfcGFyZW4nXG4gICAgICAgIGZvdW5kX3N0cmluZ19saXRlcmFsOiBTeW1ib2wgJ2ZvdW5kX3N0cmluZ19saXRlcmFsJ1xuICAgICAgICBmb3VuZF9yaWdodF9wYXJlbjogICAgU3ltYm9sICdmb3VuZF9yaWdodF9wYXJlbidcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmVzZXQgPSAtPlxuICAgICAgICBzdGF0ZS5zdGFnZSAgICAgICAgICAgPSBzdGFnZXMuc3RhcnRcbiAgICAgICAgc3RhdGUuc2VsZWN0b3IgICAgICAgID0gbnVsbFxuICAgICAgICBzdGF0ZS5kaXNwb3NpdGlvbiAgICAgPSBudWxsXG4gICAgICAgIHN0YXRlLmxpbmVfbnIgICAgICAgICA9IG51bGxcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3RhdGUgICAgICAgICA9IHt9XG4gICAgICByZXNldCgpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdhcm5pbmdfZnJvbV90b2tlbiA9ICggdG9rZW4gKSAtPlxuICAgICAgICBsaW5lcyAgPz0gWyBudWxsLCAoIHNvdXJjZS5zcGxpdCAnXFxuJyApLi4uLCBdXG4gICAgICAgIGxpbmUgICAgPSBsaW5lc1sgdG9rZW4ubGluZV9uciBdID8gXCIoRVJST1I6IFVOQUJMRSBUTyBSRVRSSUVWRSBTT1VSQ0UpXCJcbiAgICAgICAgbWVzc2FnZSA9IFwiaWdub3JpbmcgcG9zc2libGUgYHJlcXVpcmVgIG9uIGxpbmUgI3t0b2tlbi5saW5lX25yfTogI3tycHJfc3RyaW5nIGxpbmV9XCJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ3dhcm5pbmcnLCBtZXNzYWdlLCBsaW5lLCBsaW5lX25yOiB0b2tlbi5saW5lX25yLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB0b2tlbiBmcm9tIHdhbGtfanNfdG9rZW5zIHNvdXJjZVxuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLnR5cGUgaXMgJ3dhcm5pbmcnXG4gICAgICAgIGNvbnRpbnVlIGlmIHRva2VuLmNhdGVnb3JpZXM/LmhhcyAnd2hpdGVzcGFjZSdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggc3RhdGUuc3RhZ2VcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLnN0YXJ0XG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdJZGVudGlmaWVyTmFtZScgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAncmVxdWlyZScgKVxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGF0ZS5zdGFnZSAgICAgPSBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgc3RhdGUubGluZV9uciAgID0gdG9rZW4ubGluZV9uclxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKCcgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgID0gc3RhZ2VzLmZvdW5kX2xlZnRfcGFyZW5cbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX2xlZnRfcGFyZW5cbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLmNhdGVnb3JpZXMuaGFzICdzdHJpbmdfbGl0ZXJhbHMnIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YXRlLnNlbGVjdG9yICA9IGV2YWwgdG9rZW4udmFsdWVcbiAgICAgICAgICAgIHN0YXRlLnN0YWdlICAgICA9IHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfc3RyaW5nX2xpdGVyYWxcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJyknIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YXRlLnN0YWdlICAgICA9IHN0YWdlcy5mb3VuZF9yaWdodF9wYXJlblxuICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgIHdoZW4gc3RhdGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCAnbm9kZTonICAgICAgICAgICAgdGhlbiAgc3RhdGUuZGlzcG9zaXRpb24gPSAnbm9kZSdcbiAgICAgICAgICAgICAgd2hlbiBub3QgLy8vIF4gXFwuezEsMn0gXFwvIC8vLy50ZXN0IHN0YXRlLnNlbGVjdG9yIHRoZW4gIHN0YXRlLmRpc3Bvc2l0aW9uID0gJ25wbSdcbiAgICAgICAgICAgICAgd2hlbiBhcHBfZGV0YWlscz9cbiAgICAgICAgICAgICAgICBwa2dfbG9jYXRpb24gPSBQQVRILnJlc29sdmUgYW5jaG9yLCBzdGF0ZS5zZWxlY3RvclxuICAgICAgICAgICAgICAgIGlmICggaXNfaW5zaWRlIGFwcF9kZXRhaWxzLnBhdGgsIHBrZ19sb2NhdGlvbiApIHRoZW4gIHN0YXRlLmRpc3Bvc2l0aW9uID0gJ2luc2lkZSdcbiAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5kaXNwb3NpdGlvbiA9ICdvdXRzaWRlJ1xuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUuZGlzcG9zaXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAndW5yZXNvbHZlZCdcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgICAgICAjIHdoZW4gKCAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnOycgKSApIHRoZW4gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpbiBbICdlb2YnLCAnTGluZVRlcm1pbmF0b3JTZXF1ZW5jZScsIF0gICAgICAgKSB0aGVuIGFubm90YXRpb24gPSBudWxsXG4gICAgICAgICAgICAgIHdoZW4gKCB0b2tlbi50eXBlIGlzICdTaW5nbGVMaW5lQ29tbWVudCcgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbiA9IHRva2VuLnZhbHVlLnJlcGxhY2UgL15cXHMqXFwvXFwvXFxzKi8sICcnXG4gICAgICAgICAgICAgIGVsc2UgY29udGludWVcbiAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgdHlwZTogICAgICAgICAgICAgJ3JlcXVpcmUnLFxuICAgICAgICAgICAgICBsaW5lX25yOiAgICAgICAgICBzdGF0ZS5saW5lX25yLFxuICAgICAgICAgICAgICBkaXNwb3NpdGlvbjogICAgICBzdGF0ZS5kaXNwb3NpdGlvbixcbiAgICAgICAgICAgICAgc2VsZWN0b3I6ICAgICAgICAgc3RhdGUuc2VsZWN0b3IsXG4gICAgICAgICAgICAgIGFubm90YXRpb24sIH1cbiAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLCBpbnRlcm5hbHM6IHt9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
