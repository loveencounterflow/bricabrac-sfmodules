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
        reset = function() {
          state.stage = stages.start;
          state.pkg_selector = null;
          state.pkg_disposition = null;
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
                  state.pkg_disposition = 'node';
                  break;
                case !/^\.{1,2}\//.test(state.pkg_selector):
                  state.pkg_disposition = 'npm';
                  break;
                case app_details != null:
                  pkg_location = PATH.resolve(anchor, state.pkg_selector);
                  if (is_inside(app_details.path, pkg_location)) {
                    state.pkg_disposition = 'inside';
                  } else {
                    state.pkg_disposition = 'outside';
                  }
                  break;
                default:
                  state.pkg_disposition = 'unresolved';
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
                pkg_disposition: state.pkg_disposition,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLGdCQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLHdCQUFBLEVBQUEsY0FBQSxFQUFBLHVCQUFBLEVBQUEsMkJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLFNBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsY0FBRixFQUNFLHdCQURGLEVBRUUsU0FGRixFQUdFLFNBSEYsQ0FBQSxHQUc4QixDQUFFLE9BQUEsQ0FBUSx3QkFBUixDQUFGLENBQXVDLENBQUMsc0JBQXhDLENBQUEsQ0FIOUI7TUFJQSxDQUFBLENBQUUsZUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLDJCQUFSLENBQUYsQ0FBdUMsQ0FBQyx1QkFBeEMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFB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R00sZUFBTztNQXBHcUIsQ0FBSixFQWpDOUI7O0FBd0lJLGFBQU8sT0FBQSxHQUFVO1FBQUUsdUJBQUY7UUFBMkIsU0FBQSxFQUFXLENBQUE7TUFBdEM7SUExSWU7RUFBbEMsRUFiRjs7O0VBMEpBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBMUpBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEZTICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG4gICAgUEFUSCAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xuICAgIHsgcnByX3N0cmluZywgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9ycHItc3RyaW5nLmJyaWNzJyApLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyBpc19pbnNpZGUsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3BhdGgtdG9vbHMuYnJpY3MnICkucmVxdWlyZV9wYXRoX3Rvb2xzKClcbiAgICB7IHdhbGtfanNfdG9rZW5zLFxuICAgICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuICAgICAgcnByX3Rva2VuLFxuICAgICAgc3VtbWFyaXplLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi93YWxrLWpzLXRva2Vucy5icmljcycgICAgKS5yZXF1aXJlX3dhbGtfanNfdG9rZW5zKClcbiAgICB7IGdldF9hcHBfZGV0YWlscywgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtY2FsbHNpdGUtYnJpY3MnICkucmVxdWlyZV9nZXRfYXBwX2RldGFpbHMoKVxuICAgIHsgbmZhLFxuICAgICAgZ2V0X3NpZ25hdHVyZSwgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBvYmplY3RfcHJvdG90eXBlICAgICAgICAgICAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge31cbiAgICB0eXBlcyAgICAgICAgICAgICAgICAgICAgICAgPVxuICAgICAgcG9kOiAgICAgICAgICAgICAgICAgICAgICBpc2E6ICggeCApIC0+IHg/IGFuZCAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB4ICkgaW4gWyBudWxsLCBvYmplY3RfcHJvdG90eXBlLCBdXG4gICAgICB0ZXh0OiAgICAgICAgICAgICAgICAgICAgIGlzYTogKCB4ICkgLT4gKCB0eXBlb2YgeCApIGlzICdzdHJpbmcnXG4gICAgICBub25lbXB0eV90ZXh0OiAgICAgICAgICAgIGlzYTogKCB4ICkgLT4gKCB0eXBlcy50ZXh0LmlzYSB4ICkgYW5kICggeC5sZW5ndGggPiAwIClcbiAgICAgIG9wdGlvbmFsX25vbmVtcHR5X3RleHQ6ICAgaXNhOiAoIHggKSAtPiAoIG5vdCB4PyApIG9yICggdHlwZS5ub25lbXB0eV90ZXh0LmlzYSB4IClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzX2NmZyA9XG4gICAgICB0ZW1wbGF0ZTogICB7IHBhdGg6IG51bGwsIHNvdXJjZTogbnVsbCwgfVxuICAgICAgaXNhOiAgICAgICAgKCB4ICkgLT5cbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5wb2QuaXNhIHhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnBhdGhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnNvdXJjZVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnBhdGg/ICkgYW5kICggICAgIHguc291cmNlPyApXG4gICAgICAgIHJldHVybiB0cnVlIGlmICggICAgIHgucGF0aD8gKVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnNvdXJjZT8gKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9IG5mYSB3YWxrX3JlcXVpcmVfc3RhdGVtZW50c19jZmcsICggcGF0aCwgY2ZnICkgLT5cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9IG5mYSAoIHBhdGgsIGNmZyApIC0+XG4gICAgICBpZiBjZmcucGF0aD9cbiAgICAgICAgcGF0aCAgICAgICAgPSBGUy5yZWFscGF0aFN5bmMgY2ZnLnBhdGhcbiAgICAgICAgYW5jaG9yICAgICAgPSBQQVRILmRpcm5hbWUgcGF0aFxuICAgICAgICBzb3VyY2UgICAgICA9IGlmIGNmZy5zb3VyY2U/IHRoZW4gY2ZnLnNvdXJjZSBlbHNlICggRlMucmVhZEZpbGVTeW5jIHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIH0gKVxuICAgICAgICBhcHBfZGV0YWlscyA9IGdldF9hcHBfZGV0YWlscyB7IHBhdGgsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZWxzZVxuICAgICAgICBwYXRoICAgICAgICA9IG51bGwgIyBpZiAoIGNmZy5wYXRoPyApIHRoZW4gKCBQQVRILnJlc29sdmUgY2ZnLnBhdGggKSBlbHNlIG51bGxcbiAgICAgICAgYW5jaG9yICAgICAgPSBudWxsXG4gICAgICAgIHNvdXJjZSAgICAgID0gY2ZnLnNvdXJjZVxuICAgICAgICBhcHBfZGV0YWlscyA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgYWJzcGF0aCAgICAgICA9IG51bGxcbiAgICAgIHJlbHBhdGggICAgICAgPSBudWxsXG4gICAgICBsaW5lcyAgICAgICAgID0gbnVsbFxuICAgICAgc3RhZ2VzICAgICAgICA9XG4gICAgICAgIHN0YXJ0OiAgICAgICAgICAgICAgICBTeW1ib2wgJ3N0YXJ0J1xuICAgICAgICBmb3VuZF9yZXF1aXJlOiAgICAgICAgU3ltYm9sICdmb3VuZF9yZXF1aXJlJ1xuICAgICAgICBmb3VuZF9sZWZ0X3BhcmVuOiAgICAgU3ltYm9sICdmb3VuZF9sZWZ0X3BhcmVuJ1xuICAgICAgICBmb3VuZF9zdHJpbmdfbGl0ZXJhbDogU3ltYm9sICdmb3VuZF9zdHJpbmdfbGl0ZXJhbCdcbiAgICAgICAgZm91bmRfcmlnaHRfcGFyZW46ICAgIFN5bWJvbCAnZm91bmRfcmlnaHRfcGFyZW4nXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJlc2V0ID0gLT5cbiAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICAgID0gc3RhZ2VzLnN0YXJ0XG4gICAgICAgIHN0YXRlLnBrZ19zZWxlY3RvciAgICA9IG51bGxcbiAgICAgICAgc3RhdGUucGtnX2Rpc3Bvc2l0aW9uID0gbnVsbFxuICAgICAgICBzdGF0ZS5saW5lX25yICAgICAgICAgPSBudWxsXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN0YXRlICAgICAgICAgPSB7fVxuICAgICAgcmVzZXQoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3YXJuaW5nX2Zyb21fdG9rZW4gPSAoIHRva2VuICkgLT5cbiAgICAgICAgbGluZXMgID89IFsgbnVsbCwgKCBzb3VyY2Uuc3BsaXQgJ1xcbicgKS4uLiwgXVxuICAgICAgICBsaW5lICAgID0gbGluZXNbIHRva2VuLmxpbmVfbnIgXSA/IFwiKEVSUk9SOiBVTkFCTEUgVE8gUkVUUklFVkUgU09VUkNFKVwiXG4gICAgICAgIG1lc3NhZ2UgPSBcImlnbm9yaW5nIHBvc3NpYmxlIGByZXF1aXJlYCBvbiBsaW5lICN7dG9rZW4ubGluZV9ucn06ICN7cnByX3N0cmluZyBsaW5lfVwiXG4gICAgICAgIHJldHVybiB7IHR5cGU6ICd3YXJuaW5nJywgbWVzc2FnZSwgbGluZSwgbGluZV9ucjogdG9rZW4ubGluZV9uciwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgdG9rZW4gZnJvbSB3YWxrX2pzX3Rva2VucyBzb3VyY2VcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICd3YXJuaW5nJ1xuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi5jYXRlZ29yaWVzPy5oYXMgJ3doaXRlc3BhY2UnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIHN0YXRlLnN0YWdlXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5zdGFydFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnSWRlbnRpZmllck5hbWUnICkgYW5kICggdG9rZW4udmFsdWUgaXMgJ3JlcXVpcmUnIClcbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICBzdGF0ZS5saW5lX25yICAgICAgID0gdG9rZW4ubGluZV9uclxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKCcgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9sZWZ0X3BhcmVuXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi5jYXRlZ29yaWVzLmhhcyAnc3RyaW5nX2xpdGVyYWxzJyApXG4gICAgICAgICAgICAgIHlpZWxkIHdhcm5pbmdfZnJvbV90b2tlbiB0b2tlblxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGF0ZS5wa2dfc2VsZWN0b3IgID0gZXZhbCB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgc3RhdGUuc3RhZ2UgICAgICAgICA9IHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfc3RyaW5nX2xpdGVyYWxcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJyknIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YXRlLnN0YWdlICAgICAgICAgPSBzdGFnZXMuZm91bmRfcmlnaHRfcGFyZW5cbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICB3aGVuIHN0YXRlLnBrZ19zZWxlY3Rvci5zdGFydHNXaXRoICdub2RlOicgICAgICAgICAgICB0aGVuICBzdGF0ZS5wa2dfZGlzcG9zaXRpb24gPSAnbm9kZSdcbiAgICAgICAgICAgICAgd2hlbiBub3QgLy8vIF4gXFwuezEsMn0gXFwvIC8vLy50ZXN0IHN0YXRlLnBrZ19zZWxlY3RvciB0aGVuICBzdGF0ZS5wa2dfZGlzcG9zaXRpb24gPSAnbnBtJ1xuICAgICAgICAgICAgICB3aGVuIGFwcF9kZXRhaWxzP1xuICAgICAgICAgICAgICAgIHBrZ19sb2NhdGlvbiA9IFBBVEgucmVzb2x2ZSBhbmNob3IsIHN0YXRlLnBrZ19zZWxlY3RvclxuICAgICAgICAgICAgICAgIGlmICggaXNfaW5zaWRlIGFwcF9kZXRhaWxzLnBhdGgsIHBrZ19sb2NhdGlvbiApICAgICB0aGVuICBzdGF0ZS5wa2dfZGlzcG9zaXRpb24gPSAnaW5zaWRlJ1xuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wa2dfZGlzcG9zaXRpb24gPSAnb3V0c2lkZSdcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHN0YXRlLnBrZ19kaXNwb3NpdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAndW5yZXNvbHZlZCdcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgICAgICAjIHdoZW4gKCAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnOycgKSApIHRoZW4gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpbiBbICdlb2YnLCAnTGluZVRlcm1pbmF0b3JTZXF1ZW5jZScsIF0gICAgICAgKSB0aGVuIGFubm90YXRpb24gPSBudWxsXG4gICAgICAgICAgICAgIHdoZW4gKCB0b2tlbi50eXBlIGlzICdTaW5nbGVMaW5lQ29tbWVudCcgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbiA9IHRva2VuLnZhbHVlLnJlcGxhY2UgL15cXHMqXFwvXFwvXFxzKi8sICcnXG4gICAgICAgICAgICAgIGVsc2UgY29udGludWVcbiAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgdHlwZTogICAgICAgICAgICAgJ3JlcXVpcmUnLFxuICAgICAgICAgICAgICBsaW5lX25yOiAgICAgICAgICBzdGF0ZS5saW5lX25yLFxuICAgICAgICAgICAgICBwa2dfZGlzcG9zaXRpb246ICBzdGF0ZS5wa2dfZGlzcG9zaXRpb24sXG4gICAgICAgICAgICAgIHBrZ19zZWxlY3RvcjogICAgIHN0YXRlLnBrZ19zZWxlY3RvcixcbiAgICAgICAgICAgICAgYW5ub3RhdGlvbiwgfVxuICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMsIGludGVybmFsczoge30sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
