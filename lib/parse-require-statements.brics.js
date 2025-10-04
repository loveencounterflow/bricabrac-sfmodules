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
        var history, line_nr, lines, package_name, package_type, reset, source, token, warning_from_token;
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
          message = `ignoring possible \`require\` on line ${token.line_nr}: ${rpr_string(line)}`;
          return {
            type: 'warning',
            message,
            line,
            line_nr: token.line_nr
          };
        };
//.....................................................................................................
        for (token of walk_essential_js_tokens(source)) {
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
              yield ({
                type: 'require',
                line_nr,
                package_type,
                package_name
              });
              // yield { type: 'require', path, line_nr, package_name, }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLGdDQUFBLEVBQWtDLFFBQUEsQ0FBQSxDQUFBO0FBRXBDLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsd0JBQUEsRUFBQSxjQUFBLEVBQUEsdUJBQUE7O01BQ0ksRUFBQSxHQUE4QixPQUFBLENBQVEsU0FBUjtNQUM5QixJQUFBLEdBQThCLE9BQUEsQ0FBUSxXQUFSO01BQzlCLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBOEIsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQTlCO01BQ0EsQ0FBQSxDQUFFLGNBQUYsRUFDRSx3QkFERixFQUVFLFNBRkYsRUFHRSxTQUhGLENBQUEsR0FHOEIsQ0FBRSxPQUFBLENBQVEsd0JBQVIsQ0FBRixDQUFvQyxDQUFDLHNCQUFyQyxDQUFBLENBSDlCLEVBSko7O01BVUksdUJBQUEsR0FBMEIsU0FBQSxDQUFFLElBQUYsQ0FBQTtBQUM5QixZQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7UUFBTSxNQUFBLEdBQWdCLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQWhCLEVBQXNCO1VBQUUsUUFBQSxFQUFVO1FBQVosQ0FBdEI7UUFDaEIsS0FBQSxHQUFnQixLQUR0Qjs7UUFHTSxPQUFBLEdBQWdCO1FBQ2hCLFlBQUEsR0FBZ0I7UUFDaEIsT0FBQSxHQUFnQixLQUx0Qjs7UUFPTSxLQUFBLEdBQVEsUUFBQSxDQUFBLENBQUE7VUFDTixPQUFBLEdBQWdCO1VBQ2hCLFlBQUEsR0FBZ0I7VUFDaEIsT0FBQSxHQUFnQjtBQUNoQixpQkFBTztRQUpELEVBUGQ7O1FBYU0sa0JBQUEsR0FBcUIsUUFBQSxDQUFFLEtBQUYsQ0FBQTtBQUMzQixjQUFBLElBQUEsRUFBQSxPQUFBLEVBQUE7O1lBQVEsUUFBVSxDQUFFLElBQUYsRUFBUSxHQUFBLENBQUUsTUFBTSxDQUFDLEtBQVAsQ0FBYSxJQUFiLENBQUYsQ0FBUjs7VUFDVixJQUFBLGdEQUFtQztVQUNuQyxPQUFBLEdBQVUsQ0FBQSxzQ0FBQSxDQUFBLENBQXVDLEtBQUssQ0FBQyxPQUE3QyxDQUFBLEVBQUEsQ0FBQSxDQUF5RCxVQUFBLENBQVcsSUFBWCxDQUF6RCxDQUFBO0FBQ1YsaUJBQU87WUFBRSxJQUFBLEVBQU0sU0FBUjtZQUFtQixPQUFuQjtZQUE0QixJQUE1QjtZQUFrQyxPQUFBLEVBQVMsS0FBSyxDQUFDO1VBQWpEO1FBSlksRUFiM0I7O1FBbUJNLEtBQUEseUNBQUEsR0FBQTs7QUFFRSxrQkFBTyxPQUFQOztBQUFBLGlCQUVPLENBRlA7Y0FHSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxnQkFBaEIsQ0FBQSxJQUF1QyxDQUFFLEtBQUssQ0FBQyxLQUFOLEtBQWUsU0FBakIsRUFBOUM7Z0JBQ0UsS0FBQSxDQUFBO0FBQ0EseUJBRkY7O2NBR0EsT0FBQSxHQUFVO2NBQ1YsT0FBQSxHQUFVLEtBQUssQ0FBQztBQUxiOztBQUZQLGlCQVNPLENBVFA7Y0FVSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFoQixDQUFBLElBQW1DLENBQUUsS0FBSyxDQUFDLEtBQU4sS0FBZSxHQUFqQixFQUExQztnQkFDRSxNQUFNLGtCQUFBLENBQW1CLEtBQW5CO2dCQUNOLEtBQUEsQ0FBQTtBQUNBLHlCQUhGOztjQUlBLE9BQUEsR0FBVTtBQUxQOztBQVRQLGlCQWdCTyxDQWhCUDtjQWlCSSxLQUFPLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFqQixDQUFxQixpQkFBckIsQ0FBRixDQUFQO2dCQUNFLE1BQU0sa0JBQUEsQ0FBbUIsS0FBbkI7Z0JBQ04sS0FBQSxDQUFBO0FBQ0EseUJBSEY7O2NBSUEsWUFBQSxHQUFrQixJQUFBLENBQUssS0FBSyxDQUFDLEtBQVg7Y0FDbEIsT0FBQSxHQUFjO0FBTlg7O0FBaEJQLGlCQXdCTyxDQXhCUDtjQXlCSSxNQUFPLENBQUUsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFoQixDQUFBLElBQW1DLENBQUUsS0FBSyxDQUFDLEtBQU4sS0FBZSxHQUFqQixFQUExQztnQkFDRSxNQUFNLGtCQUFBLENBQW1CLEtBQW5CO2dCQUNOLEtBQUEsQ0FBQTtBQUNBLHlCQUhGOztjQUlBLFlBQUE7QUFBZSx3QkFBTyxJQUFQO0FBQUEsdUJBQ1IsWUFBWSxDQUFDLFVBQWIsQ0FBd0IsT0FBeEIsQ0FEUTsyQkFDOEI7QUFEOUIsdUJBRVIsWUFBWSxDQUFDLFVBQWIsQ0FBd0IsSUFBeEIsQ0FGUTsyQkFFOEI7QUFGOUIsdUJBR1IsWUFBWSxDQUFDLFVBQWIsQ0FBd0IsS0FBeEIsQ0FIUTsyQkFHOEI7QUFIOUI7MkJBSVI7QUFKUTs7Y0FLZixNQUFNLENBQUE7Z0JBQUUsSUFBQSxFQUFNLFNBQVI7Z0JBQW1CLE9BQW5CO2dCQUE0QixZQUE1QjtnQkFBMEM7Y0FBMUMsQ0FBQSxFQVRsQjs7Y0FXWSxLQUFBLENBQUE7QUFwQ0o7UUFGRixDQW5CTjs7QUEyRE0sZUFBTztNQTVEaUIsRUFWOUI7O0FBeUVJLGFBQU8sT0FBQSxHQUFVO1FBQUUsdUJBQUY7UUFBMkIsU0FBQSxFQUFXLENBQUE7TUFBdEM7SUEzRWU7RUFBbEMsRUFiRjs7O0VBMkZBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBM0ZBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHM6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIEZTICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG4gICAgUEFUSCAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xuICAgIHsgcnByX3N0cmluZywgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9ycHItc3RyaW5nLmJyaWNzJyApLnJlcXVpcmVfcnByX3N0cmluZygpXG4gICAgeyB3YWxrX2pzX3Rva2VucyxcbiAgICAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyxcbiAgICAgIHJwcl90b2tlbixcbiAgICAgIHN1bW1hcml6ZSwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vd2Fsay1qcy10b2tlbnMuYnJpY3MnICkucmVxdWlyZV93YWxrX2pzX3Rva2VucygpXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoICkgLT5cbiAgICAgIHNvdXJjZSAgICAgICAgPSBGUy5yZWFkRmlsZVN5bmMgcGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JywgfVxuICAgICAgbGluZXMgICAgICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaGlzdG9yeSAgICAgICA9IDBcbiAgICAgIHBhY2thZ2VfbmFtZSAgPSBudWxsXG4gICAgICBsaW5lX25yICAgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXNldCA9IC0+XG4gICAgICAgIGhpc3RvcnkgICAgICAgPSAwXG4gICAgICAgIHBhY2thZ2VfbmFtZSAgPSBudWxsXG4gICAgICAgIGxpbmVfbnIgICAgICAgPSBudWxsXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdhcm5pbmdfZnJvbV90b2tlbiA9ICggdG9rZW4gKSAtPlxuICAgICAgICBsaW5lcyAgPz0gWyBudWxsLCAoIHNvdXJjZS5zcGxpdCAnXFxuJyApLi4uLCBdXG4gICAgICAgIGxpbmUgICAgPSBsaW5lc1sgdG9rZW4ubGluZV9uciBdID8gXCIoRVJST1I6IFVOQUJMRSBUTyBSRVRSSUVWRSBTT1VSQ0UpXCJcbiAgICAgICAgbWVzc2FnZSA9IFwiaWdub3JpbmcgcG9zc2libGUgYHJlcXVpcmVgIG9uIGxpbmUgI3t0b2tlbi5saW5lX25yfTogI3tycHJfc3RyaW5nIGxpbmV9XCJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ3dhcm5pbmcnLCBtZXNzYWdlLCBsaW5lLCBsaW5lX25yOiB0b2tlbi5saW5lX25yLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB0b2tlbiBmcm9tIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyBzb3VyY2VcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggaGlzdG9yeVxuICAgICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgICAgd2hlbiAwXG4gICAgICAgICAgICB1bmxlc3MgKCB0b2tlbi50eXBlIGlzICdJZGVudGlmaWVyTmFtZScgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAncmVxdWlyZScgKVxuICAgICAgICAgICAgICByZXNldCgpXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBoaXN0b3J5ID0gMVxuICAgICAgICAgICAgbGluZV9uciA9IHRva2VuLmxpbmVfbnJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gMVxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4udHlwZSBpcyAnUHVuY3R1YXRvcicgKSBhbmQgKCB0b2tlbi52YWx1ZSBpcyAnKCcgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgaGlzdG9yeSA9IDJcbiAgICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICAgIHdoZW4gMlxuICAgICAgICAgICAgdW5sZXNzICggdG9rZW4uY2F0ZWdvcmllcy5oYXMgJ3N0cmluZ19saXRlcmFscycgKVxuICAgICAgICAgICAgICB5aWVsZCB3YXJuaW5nX2Zyb21fdG9rZW4gdG9rZW5cbiAgICAgICAgICAgICAgcmVzZXQoKVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgcGFja2FnZV9uYW1lICAgID0gZXZhbCB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgaGlzdG9yeSAgICAgPSAzXG4gICAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgICB3aGVuIDNcbiAgICAgICAgICAgIHVubGVzcyAoIHRva2VuLnR5cGUgaXMgJ1B1bmN0dWF0b3InICkgYW5kICggdG9rZW4udmFsdWUgaXMgJyknIClcbiAgICAgICAgICAgICAgeWllbGQgd2FybmluZ19mcm9tX3Rva2VuIHRva2VuXG4gICAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIHBhY2thZ2VfdHlwZSA9IHN3aXRjaCB0cnVlXG4gICAgICAgICAgICAgIHdoZW4gcGFja2FnZV9uYW1lLnN0YXJ0c1dpdGggJ25vZGU6JyAgdGhlbiAnbm9kZSdcbiAgICAgICAgICAgICAgd2hlbiBwYWNrYWdlX25hbWUuc3RhcnRzV2l0aCAnLi8nICAgICB0aGVuICdsb2NhbCdcbiAgICAgICAgICAgICAgd2hlbiBwYWNrYWdlX25hbWUuc3RhcnRzV2l0aCAnLi4vJyAgICB0aGVuICdsb2NhbCdcbiAgICAgICAgICAgICAgZWxzZSAnbnBtJ1xuICAgICAgICAgICAgeWllbGQgeyB0eXBlOiAncmVxdWlyZScsIGxpbmVfbnIsIHBhY2thZ2VfdHlwZSwgcGFja2FnZV9uYW1lLCB9XG4gICAgICAgICAgICAjIHlpZWxkIHsgdHlwZTogJ3JlcXVpcmUnLCBwYXRoLCBsaW5lX25yLCBwYWNrYWdlX25hbWUsIH1cbiAgICAgICAgICAgIHJlc2V0KClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLCBpbnRlcm5hbHM6IHt9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
