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
      var FS, PATH, exports, get_app_details, get_signature, nfa, object_prototype, rpr_string, rpr_token, summarize, types, walk_essential_js_tokens, walk_js_tokens, walk_require_statements, walk_require_statements_cfg;
      //=======================================================================================================
      FS = require('node:fs');
      PATH = require('node:path');
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
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
        var abspath, annotation, app_details, line_nr, lines, package_name, package_type, ref, ref1, relpath, reset, source, stage, stages, token, warning_from_token;
        // walk_require_statements = nfa walk_require_statements_cfg, ( path, cfg ) ->
        if (cfg.path != null) {
          path = FS.realpathSync(path);
          source = FS.readFileSync(path, {
            encoding: 'utf-8'
          });
          app_details = get_app_details({path});
          debug('Ωparest___1', app_details);
        } else {
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
                //.............................................................................................
                case package_name.startsWith('./'):
                  if (app_details != null) {
                    package_type = 'inside';
                  } else {
                    package_type = 'local';
                  }
                  break;
                //.............................................................................................
                case package_name.startsWith('../'):
                  if (app_details != null) {
                    abspath = PATH.resolve(PATH.dirname(cfg.path), package_name);
                    relpath = PATH.relative(app_details.path, abspath);
                    debug('Ωparest___2', {abspath, relpath});
                    if (relpath.startsWith('../')) {
                      package_type = 'outside';
                    } else {
                      package_type = 'inside';
                    }
                  } else {
                    package_type = 'local';
                  }
                  break;
                default:
                  //.............................................................................................
                  'npm';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxHQUFBLEVBQUEsZ0JBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsd0JBQUEsRUFBQSxjQUFBLEVBQUEsdUJBQUEsRUFBQSwyQkFBQTs7TUFDSSxFQUFBLEdBQThCLE9BQUEsQ0FBUSxTQUFSO01BQzlCLElBQUEsR0FBOEIsT0FBQSxDQUFRLFdBQVI7TUFDOUIsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE4QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBOUI7TUFDQSxDQUFBLENBQUUsY0FBRixFQUNFLHdCQURGLEVBRUUsU0FGRixFQUdFLFNBSEYsQ0FBQSxHQUc4QixDQUFFLE9BQUEsQ0FBUSx3QkFBUixDQUFGLENBQXVDLENBQUMsc0JBQXhDLENBQUEsQ0FIOUI7TUFJQSxDQUFBLENBQUUsZUFBRixDQUFBLEdBQThCLENBQUUsT0FBQSxDQUFRLDJCQUFSLENBQUYsQ0FBdUMsQ0FBQyx1QkFBeEMsQ0FBQSxDQUE5QjtNQUNBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsYUFERixDQUFBLEdBQzhCLE9BQUEsQ0FBUSw4QkFBUixDQUQ5QixFQVRKOztNQVlJLGdCQUFBLEdBQThCLE1BQU0sQ0FBQyxjQUFQLENBQXNCLENBQUEsQ0FBdEI7TUFDOUIsS0FBQSxH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dXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcGFyc2VfcmVxdWlyZV9zdGF0ZW1lbnRzOiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIFBBVEggICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIHsgd2Fsa19qc190b2tlbnMsXG4gICAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgICBycHJfdG9rZW4sXG4gICAgICBzdW1tYXJpemUsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3dhbGstanMtdG9rZW5zLmJyaWNzJyAgICApLnJlcXVpcmVfd2Fsa19qc190b2tlbnMoKVxuICAgIHsgZ2V0X2FwcF9kZXRhaWxzLCAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1jYWxsc2l0ZS1icmljcycgKS5yZXF1aXJlX2dldF9hcHBfZGV0YWlscygpXG4gICAgeyBuZmEsXG4gICAgICBnZXRfc2lnbmF0dXJlLCAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9ybWFsaXplLWZ1bmN0aW9uLWFyZ3VtZW50cydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG9iamVjdF9wcm90b3R5cGUgICAgICAgICAgICA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB7fVxuICAgIHR5cGVzICAgICAgICAgICAgICAgICAgICAgICA9XG4gICAgICBwb2Q6ICAgICAgICAgICAgICAgICAgICAgIGlzYTogKCB4ICkgLT4geD8gYW5kICggT2JqZWN0LmdldFByb3RvdHlwZU9mIHggKSBpbiBbIG51bGwsIG9iamVjdF9wcm90b3R5cGUsIF1cbiAgICAgIHRleHQ6ICAgICAgICAgICAgICAgICAgICAgaXNhOiAoIHggKSAtPiAoIHR5cGVvZiB4ICkgaXMgJ3N0cmluZydcbiAgICAgIG5vbmVtcHR5X3RleHQ6ICAgICAgICAgICAgaXNhOiAoIHggKSAtPiAoIHR5cGVzLnRleHQuaXNhIHggKSBhbmQgKCB4Lmxlbmd0aCA+IDAgKVxuICAgICAgb3B0aW9uYWxfbm9uZW1wdHlfdGV4dDogICBpc2E6ICggeCApIC0+ICggbm90IHg/ICkgb3IgKCB0eXBlLm5vbmVtcHR5X3RleHQuaXNhIHggKVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHNfY2ZnID1cbiAgICAgIHRlbXBsYXRlOiAgIHsgcGF0aDogbnVsbCwgc291cmNlOiBudWxsLCB9XG4gICAgICBpc2E6ICAgICAgICAoIHggKSAtPlxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLnBvZC5pc2EgeFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLm9wdGlvbmFsX25vbmVtcHR5X3RleHQuaXNhIHgucGF0aFxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHR5cGVzLm9wdGlvbmFsX25vbmVtcHR5X3RleHQuaXNhIHguc291cmNlXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiAoICAgICB4LnBhdGg/ICkgYW5kICggICAgIHguc291cmNlPyApXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiAoIG5vdCB4LnBhdGg/ICkgYW5kICggbm90IHguc291cmNlPyApXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzID0gbmZhICggcGF0aCwgY2ZnICkgLT5cbiAgICAjIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzID0gbmZhIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzX2NmZywgKCBwYXRoLCBjZmcgKSAtPlxuICAgICAgaWYgY2ZnLnBhdGg/XG4gICAgICAgIHBhdGggICAgICAgID0gRlMucmVhbHBhdGhTeW5jIHBhdGhcbiAgICAgICAgc291cmNlICAgICAgPSAoIEZTLnJlYWRGaWxlU3luYyBwYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnLCB9IClcbiAgICAgICAgYXBwX2RldGFpbHMgPSBnZXRfYXBwX2RldGFpbHMgeyBwYXRoLCB9XG4gICAgICAgIGRlYnVnICfOqXBhcmVzdF9fXzEnLCBhcHBfZGV0YWlsc1xuICAgICAgZWxzZVxuICAgICAgICBzb3VyY2UgICAgICA9IGNmZy5zb3VyY2VcbiAgICAgICAgYXBwX2RldGFpbHMgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGFic3BhdGggICAgICAgPSBudWxsXG4gICAgICByZWxwYXRoICAgICAgID0gbnVsbFxuICAgICAgbGluZXMgICAgICAgICA9IG51bGxcbiAgICAgIHN0YWdlcyAgICAgICAgPVxuICAgICAgICBzdGFydDogICAgICAgICAgICAgICAgU3ltYm9sICdzdGFydCdcbiAgICAgICAgZm91bmRfcmVxdWlyZTogICAgICAgIFN5bWJvbCAnZm91bmRfcmVxdWlyZSdcbiAgICAgICAgZm91bmRfbGVmdF9wYXJlbjogICAgIFN5bWJvbCAnZm91bmRfbGVmdF9wYXJlbidcbiAgICAgICAgZm91bmRfc3RyaW5nX2xpdGVyYWw6IFN5bWJvbCAnZm91bmRfc3RyaW5nX2xpdGVyYWwnXG4gICAgICAgIGZvdW5kX3JpZ2h0X3BhcmVuOiAgICBTeW1ib2wgJ2ZvdW5kX3JpZ2h0X3BhcmVuJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzdGFnZSAgICAgICAgID0gc3RhZ2VzLnN0YXJ0XG4gICAgICBwYWNrYWdlX25hbWUgID0gbnVsbFxuICAgICAgbGluZV9uciAgICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmVzZXQgPSAtPlxuICAgICAgICBzdGFnZSAgICAgICAgID0gc3RhZ2VzLnN0YXJ0XG4gICAgICAgIHBhY2thZ2VfbmFtZSAgPSBudWxsXG4gICAgICAgIGxpbmVfbnIgICAgICAgPSBudWxsXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdhcm5pbmdfZnJvbV90b2tlbiA9ICggdG9rZW4gKSAtPlxuICAgICAgICBsaW5lcyAgPz0gWyBudWxsLCAoIHNvdXJjZS5zcGxpdCAnXFxuJyApLi4uLCBdXG4gICAgICAgIGxpbmUgICAgPSBsaW5lc1sgdG9rZW4ubGluZV9uciBdID8gXCIoRVJST1I6IFVOQUJMRSBUTyBSRVRSSUVWRSBTT1VSQ0UpXCJcbiAgICAgICAgbWVzc2FnZSA9IFwiaWdub3JpbmcgcG9zc2libGUgYHJlcXVpcmVgIG9uIGxpbmUgI3t0b2tlbi5saW5lX25yfTogI3tycHJfc3RyaW5nIGxpbmV9XCJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ3dhcm5pbmcnLCBtZXNzYWdlLCBsaW5lLCBsaW5lX25yOiB0b2tlbi5saW5lX25yLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB0b2tlbiBmcm9tIHdhbGtfanNfdG9rZW5zIHNvdXJjZVxuICAgICAgICAjIGNvbnRpbnVlIGlmIHRva2VuLnR5cGUgaXMgJ3dhcm5pbmcnXG4gICAgICAgIGNvbnRpbnVlIGlmIHRva2VuLmNhdGVnb3JpZXM/LmhhcyAnd2hpdGVzcGFjZSdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggc3RhZ2VcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLnN0YXJ0XG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdJZGVudGlmaWVyTmFtZScgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAncmVxdWlyZScgKVxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBzdGFnZSA9IHN0YWdlcy5mb3VuZF9yZXF1aXJlXG4gICAgICAgICAgICBsaW5lX25yID0gdG9rZW4ubGluZV9uclxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfcmVxdWlyZVxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKCcgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhZ2UgPSBzdGFnZXMuZm91bmRfbGVmdF9wYXJlblxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiBzdGFnZXMuZm91bmRfbGVmdF9wYXJlblxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4uY2F0ZWdvcmllcy5oYXMgJ3N0cmluZ19saXRlcmFscycgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgcGFja2FnZV9uYW1lICAgID0gZXZhbCB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgc3RhZ2UgICAgID0gc3RhZ2VzLmZvdW5kX3N0cmluZ19saXRlcmFsXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIHN0YWdlcy5mb3VuZF9zdHJpbmdfbGl0ZXJhbFxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKScgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc3RhZ2UgICAgICAgPSBzdGFnZXMuZm91bmRfcmlnaHRfcGFyZW5cbiAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICB3aGVuIHBhY2thZ2VfbmFtZS5zdGFydHNXaXRoICdub2RlOicgIHRoZW4gcGFja2FnZV90eXBlID0gJ25vZGUnXG4gICAgICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICAgICAgd2hlbiBwYWNrYWdlX25hbWUuc3RhcnRzV2l0aCAnLi8nXG4gICAgICAgICAgICAgICAgaWYgYXBwX2RldGFpbHM/IHRoZW4gIHBhY2thZ2VfdHlwZSA9ICdpbnNpZGUnXG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgIHBhY2thZ2VfdHlwZSA9ICdsb2NhbCdcbiAgICAgICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgICAgICB3aGVuIHBhY2thZ2VfbmFtZS5zdGFydHNXaXRoICcuLi8nXG4gICAgICAgICAgICAgICAgaWYgYXBwX2RldGFpbHM/XG4gICAgICAgICAgICAgICAgICBhYnNwYXRoID0gUEFUSC5yZXNvbHZlICggUEFUSC5kaXJuYW1lIGNmZy5wYXRoICksIHBhY2thZ2VfbmFtZVxuICAgICAgICAgICAgICAgICAgcmVscGF0aCA9IFBBVEgucmVsYXRpdmUgYXBwX2RldGFpbHMucGF0aCwgYWJzcGF0aFxuICAgICAgICAgICAgICAgICAgZGVidWcgJ86pcGFyZXN0X19fMicsIHsgYWJzcGF0aCwgcmVscGF0aCwgfVxuICAgICAgICAgICAgICAgICAgaWYgcmVscGF0aC5zdGFydHNXaXRoICcuLi8nIHRoZW4gIHBhY2thZ2VfdHlwZSA9ICdvdXRzaWRlJ1xuICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VfdHlwZSA9ICdpbnNpZGUnXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgcGFja2FnZV90eXBlID0gJ2xvY2FsJ1xuICAgICAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgICAgIGVsc2UgJ25wbSdcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gc3RhZ2VzLmZvdW5kX3JpZ2h0X3BhcmVuXG4gICAgICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgICAgICAjIHdoZW4gKCAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnOycgKSApIHRoZW4gbnVsbFxuICAgICAgICAgICAgICB3aGVuICggdG9rZW4udHlwZSBpbiBbICdlb2YnLCAnTGluZVRlcm1pbmF0b3JTZXF1ZW5jZScsIF0gICAgICAgKSB0aGVuIGFubm90YXRpb24gPSBudWxsXG4gICAgICAgICAgICAgIHdoZW4gKCB0b2tlbi50eXBlIGlzICdTaW5nbGVMaW5lQ29tbWVudCcgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbiA9IHRva2VuLnZhbHVlLnJlcGxhY2UgL15cXHMqXFwvXFwvXFxzKi8sICcnXG4gICAgICAgICAgICAgIGVsc2UgY29udGludWVcbiAgICAgICAgICAgIHlpZWxkIHsgdHlwZTogJ3JlcXVpcmUnLCBsaW5lX25yLCBwYWNrYWdlX3R5cGUsIHBhY2thZ2VfbmFtZSwgYW5ub3RhdGlvbiwgfVxuICAgICAgICAgICAgIyB5aWVsZCB7IHR5cGU6ICdyZXF1aXJlJywgcGF0aCwgbGluZV9uciwgcGFja2FnZV9uYW1lLCB9XG4gICAgICAgICAgICByZXNldCgpXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cywgaW50ZXJuYWxzOiB7fSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cblxuXG5cbiJdfQ==
