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
        var abspath, anchor, annotation, app_details, line_nr, lines, package_location, package_name, package_type, ref, ref1, relpath, reset, source, stage, stages, token, warning_from_token;
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
        debug('Ωparest___1', app_details);
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
              //...............................................................................................
              switch (true) {
                //.............................................................................................
                case package_name.startsWith('node:'):
                  package_type = 'node';
                  break;
                case !/^\.{1,2}\//.test(package_name):
                  package_type = 'npm';
                  break;
                case app_details != null:
                  package_location = PATH.resolve(anchor, package_name);
                  if (is_inside(app_details.path, package_location)) {
                    package_type = 'inside';
                  } else {
                    package_type = 'outside';
                  }
                  break;
                default:
                  package_type = 'unresolved';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsR0FBQSxFQUFBLGdCQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLHdCQUFBLEVBQUEsY0FBQSxFQUFBLHVCQUFBLEVBQUEsMkJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLFNBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsY0FBRixFQUNFLHdCQURGLEVBRUUsU0FGRixFQUdFLFNBSEYsQ0FBQSxHQUc4QixDQUFFLE9BQUEsQ0FBUSx3QkFBUixDQUFGLENBQXVDLENBQUMsc0JBQXhDLENBQUEsQ0FIOUI7TUFJQSxDQUFBLENBQUUsZUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLDJCQUFSLENBQUYsQ0FBdUMsQ0FBQyx1QkFBeEMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFB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bnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEZTICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG4gICAgUEFUSCAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xuICAgIHsgcnByX3N0cmluZywgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9ycHItc3RyaW5nLmJyaWNzJyApLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyBpc19pbnNpZGUsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3BhdGgtdG9vbHMuYnJpY3MnICkucmVxdWlyZV9wYXRoX3Rvb2xzKClcbiAgICB7IHdhbGtfanNfdG9rZW5zLFxuICAgICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuICAgICAgcnByX3Rva2VuLFxuICAgICAgc3VtbWFyaXplLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi93YWxrLWpzLXRva2Vucy5icmljcycgICAgKS5yZXF1aXJlX3dhbGtfanNfdG9rZW5zKClcbiAgICB7IGdldF9hcHBfZGV0YWlscywgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtY2FsbHNpdGUtYnJpY3MnICkucmVxdWlyZV9nZXRfYXBwX2RldGFpbHMoKVxuICAgIHsgbmZhLFxuICAgICAgZ2V0X3NpZ25hdHVyZSwgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBvYmplY3RfcHJvdG90eXBlICAgICAgICAgICAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge31cbiAgICB0eXBlcyAgICAgICAgICAgICAgICAgICAgICAgPVxuICAgICAgcG9kOiAgICAgICAgICAgICAgICAgICAgICBpc2E6ICggeCApIC0+IHg/IGFuZCAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB4ICkgaW4gWyBudWxsLCBvYmplY3RfcHJvdG90eXBlLCBdXG4gICAgICB0ZXh0OiAgICAgICAgICAgICAgICAgICAgIGlzYTogKCB4ICkgLT4gKCB0eXBlb2YgeCApIGlzICdzdHJpbmcnXG4gICAgICBub25lbXB0eV90ZXh0OiAgICAgICAgICAgIGlzYTogKCB4ICkgLT4gKCB0eXBlcy50ZXh0LmlzYSB4ICkgYW5kICggeC5sZW5ndGggPiAwIClcbiAgICAgIG9wdGlvbmFsX25vbmVtcHR5X3RleHQ6ICAgaXNhOiAoIHggKSAtPiAoIG5vdCB4PyApIG9yICggdHlwZS5ub25lbXB0eV90ZXh0LmlzYSB4IClcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzX2NmZyA9XG4gICAgICB0ZW1wbGF0ZTogICB7IHBhdGg6IG51bGwsIHNvdXJjZTogbnVsbCwgfVxuICAgICAgaXNhOiAgICAgICAgKCB4ICkgLT5cbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5wb2QuaXNhIHhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnBhdGhcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0eXBlcy5vcHRpb25hbF9ub25lbXB0eV90ZXh0LmlzYSB4LnNvdXJjZVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnBhdGg/ICkgYW5kICggICAgIHguc291cmNlPyApXG4gICAgICAgIHJldHVybiB0cnVlIGlmICggICAgIHgucGF0aD8gKVxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiAoICAgICB4LnNvdXJjZT8gKVxuICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9IG5mYSB3YWxrX3JlcXVpcmVfc3RhdGVtZW50c19jZmcsICggcGF0aCwgY2ZnICkgLT5cbiAgICB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyA9IG5mYSAoIHBhdGgsIGNmZyApIC0+XG4gICAgICBpZiBjZmcucGF0aD9cbiAgICAgICAgcGF0aCAgICAgICAgPSBGUy5yZWFscGF0aFN5bmMgY2ZnLnBhdGhcbiAgICAgICAgYW5jaG9yICAgICAgPSBQQVRILmRpcm5hbWUgcGF0aFxuICAgICAgICBzb3VyY2UgICAgICA9IGlmIGNmZy5zb3VyY2U/IHRoZW4gY2ZnLnNvdXJjZSBlbHNlICggRlMucmVhZEZpbGVTeW5jIHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIH0gKVxuICAgICAgICBhcHBfZGV0YWlscyA9IGdldF9hcHBfZGV0YWlscyB7IHBhdGgsIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZWxzZVxuICAgICAgICBwYXRoICAgICAgICA9IG51bGwgIyBpZiAoIGNmZy5wYXRoPyApIHRoZW4gKCBQQVRILnJlc29sdmUgY2ZnLnBhdGggKSBlbHNlIG51bGxcbiAgICAgICAgYW5jaG9yICAgICAgPSBudWxsXG4gICAgICAgIHNvdXJjZSAgICAgID0gY2ZnLnNvdXJjZVxuICAgICAgICBhcHBfZGV0YWlscyA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZGVidWcgJ86pcGFyZXN0X19fMScsIGFwcF9kZXRhaWxzXG4gICAgICBhYnNwYXRoICAgICAgID0gbnVsbFxuICAgICAgcmVscGF0aCAgICAgICA9IG51bGxcbiAgICAgIGxpbmVzICAgICAgICAgPSBudWxsXG4gICAgICBzdGFnZXMgICAgICAgID1cbiAgICAgICAgc3RhcnQ6ICAgICAgICAgICAgICAgIFN5bWJvbCAnc3RhcnQnXG4gICAgICAgIGZvdW5kX3JlcXVpcmU6ICAgICAgICBTeW1ib2wgJ2ZvdW5kX3JlcXVpcmUnXG4gICAgICAgIGZvdW5kX2xlZnRfcGFyZW46ICAgICBTeW1ib2wgJ2ZvdW5kX2xlZnRfcGFyZW4nXG4gICAgICAgIGZvdW5kX3N0cmluZ19saXRlcmFsOiBTeW1ib2wgJ2ZvdW5kX3N0cmluZ19saXRlcmFsJ1xuICAgICAgICBmb3VuZF9yaWdodF9wYXJlbjogICAgU3ltYm9sICdmb3VuZF9yaWdodF9wYXJlbidcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgc3RhZ2UgICAgICAgICA9IHN0YWdlcy5zdGFydFxuICAgICAgcGFja2FnZV9uYW1lICA9IG51bGxcbiAgICAgIGxpbmVfbnIgICAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJlc2V0ID0gLT5cbiAgICAgICAgc3RhZ2UgICAgICAgICA9IHN0YWdlcy5zdGFydFxuICAgICAgICBwYWNrYWdlX25hbWUgID0gbnVsbFxuICAgICAgICBsaW5lX25yICAgICAgID0gbnVsbFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3YXJuaW5nX2Zyb21fdG9rZW4gPSAoIHRva2VuICkgLT5cbiAgICAgICAgbGluZXMgID89IFsgbnVsbCwgKCBzb3VyY2Uuc3BsaXQgJ1xcbicgKS4uLiwgXVxuICAgICAgICBsaW5lICAgID0gbGluZXNbIHRva2VuLmxpbmVfbnIgXSA/IFwiKEVSUk9SOiBVTkFCTEUgVE8gUkVUUklFVkUgU09VUkNFKVwiXG4gICAgICAgIG1lc3NhZ2UgPSBcImlnbm9yaW5nIHBvc3NpYmxlIGByZXF1aXJlYCBvbiBsaW5lICN7dG9rZW4ubGluZV9ucn06ICN7cnByX3N0cmluZyBsaW5lfVwiXG4gICAgICAgIHJldHVybiB7IHR5cGU6ICd3YXJuaW5nJywgbWVzc2FnZSwgbGluZSwgbGluZV9ucjogdG9rZW4ubGluZV9uciwgfVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgdG9rZW4gZnJvbSB3YWxrX2pzX3Rva2VucyBzb3VyY2VcbiAgICAgICAgIyBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICd3YXJuaW5nJ1xuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi5jYXRlZ29yaWVzPy5oYXMgJ3doaXRlc3BhY2UnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIHN0YWdlXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5zdGFydFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnSWRlbnRpZmllck5hbWUnICkgYW5kICggdG9rZW4udmFsdWUgaXMgJ3JlcXVpcmUnIClcbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhZ2UgPSBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgbGluZV9uciA9IHRva2VuLmxpbmVfbnJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3JlcXVpcmVcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJygnIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YWdlID0gc3RhZ2VzLmZvdW5kX2xlZnRfcGFyZW5cbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX2xlZnRfcGFyZW5cbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLmNhdGVnb3JpZXMuaGFzICdzdHJpbmdfbGl0ZXJhbHMnIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHBhY2thZ2VfbmFtZSAgICA9IGV2YWwgdG9rZW4udmFsdWVcbiAgICAgICAgICAgIHN0YWdlICAgICA9IHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfc3RyaW5nX2xpdGVyYWxcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJyknIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHN0YWdlICAgICAgID0gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgd2hlbiBwYWNrYWdlX25hbWUuc3RhcnRzV2l0aCAnbm9kZTonICAgICAgICAgICAgICAgIHRoZW4gIHBhY2thZ2VfdHlwZSAgPSAnbm9kZSdcbiAgICAgICAgICAgICAgd2hlbiBub3QgLy8vIF4gXFwuezEsMn0gXFwvIC8vLy50ZXN0IHBhY2thZ2VfbmFtZSAgICAgdGhlbiAgcGFja2FnZV90eXBlICA9ICducG0nXG4gICAgICAgICAgICAgIHdoZW4gYXBwX2RldGFpbHM/XG4gICAgICAgICAgICAgICAgcGFja2FnZV9sb2NhdGlvbiA9IFBBVEgucmVzb2x2ZSBhbmNob3IsIHBhY2thZ2VfbmFtZVxuICAgICAgICAgICAgICAgIGlmICggaXNfaW5zaWRlIGFwcF9kZXRhaWxzLnBhdGgsIHBhY2thZ2VfbG9jYXRpb24gKSAgIHRoZW4gIHBhY2thZ2VfdHlwZSAgPSAnaW5zaWRlJ1xuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZV90eXBlICA9ICdvdXRzaWRlJ1xuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcGFja2FnZV90eXBlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gJ3VucmVzb2x2ZWQnXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9yaWdodF9wYXJlblxuICAgICAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgIyB3aGVuICggKCB0b2tlbi50eXBlIGlzICdQdW5jdHVhdG9yJykgYW5kICggdG9rZW4udmFsdWUgaXMgJzsnICkgKSB0aGVuIG51bGxcbiAgICAgICAgICAgICAgd2hlbiAoIHRva2VuLnR5cGUgaW4gWyAnZW9mJywgJ0xpbmVUZXJtaW5hdG9yU2VxdWVuY2UnLCBdICAgICAgICkgdGhlbiBhbm5vdGF0aW9uID0gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpcyAnU2luZ2xlTGluZUNvbW1lbnQnICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIGFubm90YXRpb24gPSB0b2tlbi52YWx1ZS5yZXBsYWNlIC9eXFxzKlxcL1xcL1xccyovLCAnJ1xuICAgICAgICAgICAgICBlbHNlIGNvbnRpbnVlXG4gICAgICAgICAgICB5aWVsZCB7IHR5cGU6ICdyZXF1aXJlJywgbGluZV9uciwgcGFja2FnZV90eXBlLCBwYWNrYWdlX25hbWUsIGFubm90YXRpb24sIH1cbiAgICAgICAgICAgICMgeWllbGQgeyB0eXBlOiAncmVxdWlyZScsIHBhdGgsIGxpbmVfbnIsIHBhY2thZ2VfbmFtZSwgfVxuICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMsIGludGVybmFsczoge30sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
