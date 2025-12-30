(function() {
  'use strict';
  var C, FS, PATH, SFMODULES, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, debug, dependent, dependents, i, info, len, log, rpr, source_path, type_of, walk_require_statements, warn, whisper;

  //===========================================================================================================
  ({log, debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('../main');

  ({
    // SFMODULES                 = require 'bricabrac-sfmodules'
    ansi_colors_and_effects: C
  } = SFMODULES.require_ansi_colors_and_effects());

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({walk_require_statements} = SFMODULES.require_parse_require_statements());

  // { walk_js_tokens,
  //   walk_essential_js_tokens,
  //   summarize,            } = SFMODULES.require_walk_js_tokens()
  PATH = require('node:path');

  FS = require('node:fs');

  warn = function(...P) {
    var p, x;
    x = ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = P.length; i < len; i++) {
        p = P[i];
        results.push(`${p}`);
      }
      return results;
    })()).join(' ');
    return log(`${C.bg_navy}${C.red}${C.bold}${x}${C.bold0}${C.default}${C.bg_default}`);
  };

  info = function(...P) {
    var p, x;
    x = ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = P.length; i < len; i++) {
        p = P[i];
        results.push(`${p}`);
      }
      return results;
    })()).join(' ');
    return log(`${C.bg_honeydew}${C.black}${C.bold}${x}${C.bold0}${C.default}${C.bg_default}`);
  };

  whisper = function(...P) {
    var p, x;
    x = ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = P.length; i < len; i++) {
        p = P[i];
        results.push(`${p}`);
      }
      return results;
    })()).join(' ');
    return log(`${C.bg_slategray}${C.black}${C.bold}${x}${C.bold0}${C.default}${C.bg_default}`);
  };

  debug("ΩLRS___1 ————————————————————————————————————————");

  ({createRequire} = require('node:module'));

  // { findPackageJSON,      } = require 'node:module'
  // { pathToFileURL,        } = require 'node:url'
  // { register,             } = require 'node:module'
  // { stripTypeScriptTypes, } = require 'node:module'
  // { isBuiltin,            } = require 'node:module'
  // isBuiltin('node:fs'); // true
  // isBuiltin('fs'); // true
  // isBuiltin('wss'); // false
  /* NOTE: it's possible to use customized logic for `require()` */
  // { registerHooks,        } = require 'node:module'
  // registerHooks {
  //   resolve:  ( specifier, context, nextResolve ) ->
  //     debug 'ΩLRS___2', {  specifier, context, nextResolve, }
  //     if specifier is 'bric:package.json'
  //       return nextResolve '/home/flow/jzr/bricabrac-sfmodules/package.json'
  //     return nextResolve specifier
  //   # load:     ( url, context, nextLoad ) ->
  //   #   debug 'ΩLRS___3', {  url, context, nextLoad, }
  //   #   return nextLoad url
  //     # return nextLoad '/home/flow/jzr/bricabrac-sfmodules/package.json'
  //   }
  // debug 'ΩLRS___4', ( require '/home/flow/jzr/bricabrac-sfmodules/lib/main.js' ).version
  // debug 'ΩLRS___5', ( require 'bric:package.json' ).version
  // # debug 'ΩLRS___6', ( require 'bric:package' ).version
  // # require 'node:module'
  source_path = process.argv[2];

  // source_path = __filename
  debug(`ΩLRS___7 using source path:  ${source_path}`);

  collect_transitive_require_statements = function(path) {
    var R, seen_paths;
    seen_paths = new Set();
    R = [];
    return _collect_transitive_require_statements(path, R, seen_paths);
  };

  _collect_transitive_require_statements = function(path, collector, seen_paths) {
    var custom_require, dependent_path, disposition, selector, type, y;
    custom_require = createRequire(path);
// NOTE can explicitly give source
    for (y of walk_require_statements({path})) {
      ({type, disposition, selector} = y);
      switch (type) {
        case 'require':
          switch (disposition) {
            case 'node':
              warn(`ΩLRS___8 ignoring module with disposition ${rpr(disposition)}: ${rpr(selector)}`);
              break;
            case 'npm':
              warn(`ΩLRS___9 ignoring module with disposition ${rpr(disposition)}: ${rpr(selector)}`);
              break;
            case 'inside':
            case 'outside':
              dependent_path = custom_require.resolve(selector);
              whisper('ΩLRS__11', `(${disposition}) ${path} -> ${dependent_path}`);
              if (seen_paths.has(dependent_path)) {
                continue;
              }
              //   throw new Error "ΩLRS__12 detected cyclic dependency from #{rpr path} to #{rpr dependent_path}"
              seen_paths.add(dependent_path);
              collector.push({
                disposition,
                source_path: path,
                path: dependent_path
              });
              _collect_transitive_require_statements(dependent_path, collector, seen_paths);
              break;
            // when 'outside'
            //   warn "ΩLRS__13 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
            case 'unresolved':
              warn(`ΩLRS__14 ignoring module with disposition ${rpr(disposition)}: ${rpr(selector)}`);
          }
          break;
        default:
          warn(`ΩLRS__15 ignoring require statement with type ${rpr(type)}`);
      }
    }
    return collector;
  };

  dependents = collect_transitive_require_statements(source_path);

  for (i = 0, len = dependents.length; i < len; i++) {
    dependent = dependents[i];
    info('ΩLRS__16', rpr(dependent.path));
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLHNDQUFBLEVBQUEscUNBQUEsRUFBQSxhQUFBLEVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxXQUFBLEVBQUEsT0FBQSxFQUFBLHVCQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUE7OztFQUdBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsS0FERixDQUFBLEdBQzRCLE9BRDVCLEVBSEE7OztFQU1BLFNBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVI7O0VBRTVCLENBQUEsQ0FBQTs7SUFBRSx1QkFBQSxFQUNFO0VBREosQ0FBQSxHQUM0QixTQUFTLENBQUMsK0JBQVYsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsdUJBQUYsQ0FBQSxHQUM0QixTQUFTLENBQUMsZ0NBQVYsQ0FBQSxDQUQ1QixFQVpBOzs7OztFQWlCQSxJQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSOztFQUM1QixFQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixJQUFBLEdBQU8sUUFBQSxDQUFBLEdBQUUsQ0FBRixDQUFBO0FBQ1AsUUFBQSxDQUFBLEVBQUE7SUFBRSxDQUFBLEdBQUk7O0FBQUU7TUFBQSxLQUFBLG1DQUFBOztxQkFBQSxDQUFBLENB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MkJ6QyxVQUFBLEdBQWEscUNBQUEsQ0FBc0MsV0FBdEM7O0VBQ2IsS0FBQSw0Q0FBQTs7SUFBQSxJQUFBLENBQUssVUFBTCxFQUFpQixHQUFBLENBQUksU0FBUyxDQUFDLElBQWQsQ0FBakI7RUFBQTtBQWhHQSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgbG9nLFxuICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uL21haW4nXG4jIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2Ztb2R1bGVzJ1xueyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogXFxcbiAgICBDLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9hbnNpX2NvbG9yc19hbmRfZWZmZWN0cygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3BhcnNlX3JlcXVpcmVfc3RhdGVtZW50cygpXG4jIHsgd2Fsa19qc190b2tlbnMsXG4jICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuIyAgIHN1bW1hcml6ZSwgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfd2Fsa19qc190b2tlbnMoKVxuUEFUSCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbkZTICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xud2FybiA9ICggUC4uLiApIC0+XG4gIHggPSAoIFwiI3twfVwiIGZvciBwIGluIFAgKS5qb2luICcgJ1xuICBsb2cgXCIje0MuYmdfbmF2eX0je0MucmVkfSN7Qy5ib2xkfSN7eH0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbmluZm8gPSAoIFAuLi4gKSAtPlxuICB4ID0gKCBcIiN7cH1cIiBmb3IgcCBpbiBQICkuam9pbiAnICdcbiAgbG9nIFwiI3tDLmJnX2hvbmV5ZGV3fSN7Qy5ibGFja30je0MuYm9sZH0je3h9I3tDLmJvbGQwfSN7Qy5kZWZhdWx0fSN7Qy5iZ19kZWZhdWx0fVwiXG53aGlzcGVyID0gKCBQLi4uICkgLT5cbiAgeCA9ICggXCIje3B9XCIgZm9yIHAgaW4gUCApLmpvaW4gJyAnXG4gIGxvZyBcIiN7Qy5iZ19zbGF0ZWdyYXl9I3tDLmJsYWNrfSN7Qy5ib2xkfSN7eH0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcblxuZGVidWcgXCLOqUxSU19fXzEg4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUXCJcblxueyBjcmVhdGVSZXF1aXJlLCAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IGZpbmRQYWNrYWdlSlNPTiwgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgcGF0aFRvRmlsZVVSTCwgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnVybCdcbiMgeyByZWdpc3RlciwgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHN0cmlwVHlwZVNjcmlwdFR5cGVzLCB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgaXNCdWlsdGluLCAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgaXNCdWlsdGluKCdub2RlOmZzJyk7IC8vIHRydWVcbiMgaXNCdWlsdGluKCdmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignd3NzJyk7IC8vIGZhbHNlXG5cbiMjIyBOT1RFOiBpdCdzIHBvc3NpYmxlIHRvIHVzZSBjdXN0b21pemVkIGxvZ2ljIGZvciBgcmVxdWlyZSgpYCAjIyNcbiMgeyByZWdpc3Rlckhvb2tzLCAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyByZWdpc3Rlckhvb2tzIHtcbiMgICByZXNvbHZlOiAgKCBzcGVjaWZpZXIsIGNvbnRleHQsIG5leHRSZXNvbHZlICkgLT5cbiMgICAgIGRlYnVnICfOqUxSU19fXzInLCB7ICBzcGVjaWZpZXIsIGNvbnRleHQsIG5leHRSZXNvbHZlLCB9XG4jICAgICBpZiBzcGVjaWZpZXIgaXMgJ2JyaWM6cGFja2FnZS5qc29uJ1xuIyAgICAgICByZXR1cm4gbmV4dFJlc29sdmUgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvcGFja2FnZS5qc29uJ1xuIyAgICAgcmV0dXJuIG5leHRSZXNvbHZlIHNwZWNpZmllclxuIyAgICMgbG9hZDogICAgICggdXJsLCBjb250ZXh0LCBuZXh0TG9hZCApIC0+XG4jICAgIyAgIGRlYnVnICfOqUxSU19fXzMnLCB7ICB1cmwsIGNvbnRleHQsIG5leHRMb2FkLCB9XG4jICAgIyAgIHJldHVybiBuZXh0TG9hZCB1cmxcbiMgICAgICMgcmV0dXJuIG5leHRMb2FkICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL3BhY2thZ2UuanNvbidcbiMgICB9XG4jIGRlYnVnICfOqUxSU19fXzQnLCAoIHJlcXVpcmUgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvbGliL21haW4uanMnICkudmVyc2lvblxuIyBkZWJ1ZyAnzqlMUlNfX181JywgKCByZXF1aXJlICdicmljOnBhY2thZ2UuanNvbicgKS52ZXJzaW9uXG4jICMgZGVidWcgJ86pTFJTX19fNicsICggcmVxdWlyZSAnYnJpYzpwYWNrYWdlJyApLnZlcnNpb25cbiMgIyByZXF1aXJlICdub2RlOm1vZHVsZSdcblxuc291cmNlX3BhdGggPSBwcm9jZXNzLmFyZ3ZbIDIgXVxuIyBzb3VyY2VfcGF0aCA9IF9fZmlsZW5hbWVcbmRlYnVnIFwizqlMUlNfX183IHVzaW5nIHNvdXJjZSBwYXRoOiAgI3tzb3VyY2VfcGF0aH1cIlxuXG5jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoICkgLT5cbiAgc2Vlbl9wYXRocyAgPSBuZXcgU2V0KClcbiAgUiAgICAgICAgICAgPSBbXVxuICByZXR1cm4gX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgcGF0aCwgUiwgc2Vlbl9wYXRoc1xuXG5fY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCwgY29sbGVjdG9yLCBzZWVuX3BhdGhzICkgLT5cbiAgY3VzdG9tX3JlcXVpcmUgID0gY3JlYXRlUmVxdWlyZSBwYXRoXG4gIGZvciB7IHR5cGUsIGRpc3Bvc2l0aW9uLCBzZWxlY3RvciwgfSBmcm9tIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzIHsgcGF0aCwgfSAjIE5PVEUgY2FuIGV4cGxpY2l0bHkgZ2l2ZSBzb3VyY2VcbiAgICBzd2l0Y2ggdHlwZVxuICAgICAgd2hlbiAncmVxdWlyZSdcbiAgICAgICAgc3dpdGNoIGRpc3Bvc2l0aW9uXG4gICAgICAgICAgd2hlbiAnbm9kZSdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fXzggaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ25wbSdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fXzkgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ2luc2lkZScsICdvdXRzaWRlJ1xuICAgICAgICAgICAgZGVwZW5kZW50X3BhdGggPSBjdXN0b21fcmVxdWlyZS5yZXNvbHZlIHNlbGVjdG9yXG4gICAgICAgICAgICB3aGlzcGVyICfOqUxSU19fMTEnLCBcIigje2Rpc3Bvc2l0aW9ufSkgI3twYXRofSAtPiAje2RlcGVuZGVudF9wYXRofVwiXG4gICAgICAgICAgICBpZiBzZWVuX3BhdGhzLmhhcyBkZXBlbmRlbnRfcGF0aFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgIyAgIHRocm93IG5ldyBFcnJvciBcIs6pTFJTX18xMiBkZXRlY3RlZCBjeWNsaWMgZGVwZW5kZW5jeSBmcm9tICN7cnByIHBhdGh9IHRvICN7cnByIGRlcGVuZGVudF9wYXRofVwiXG4gICAgICAgICAgICBzZWVuX3BhdGhzLmFkZCBkZXBlbmRlbnRfcGF0aFxuICAgICAgICAgICAgY29sbGVjdG9yLnB1c2ggeyBkaXNwb3NpdGlvbiwgc291cmNlX3BhdGg6IHBhdGgsIHBhdGg6IGRlcGVuZGVudF9wYXRoLCB9XG4gICAgICAgICAgICBfY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBkZXBlbmRlbnRfcGF0aCwgY29sbGVjdG9yLCBzZWVuX3BhdGhzXG4gICAgICAgICAgIyB3aGVuICdvdXRzaWRlJ1xuICAgICAgICAgICMgICB3YXJuIFwizqlMUlNfXzEzIGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICd1bnJlc29sdmVkJ1xuICAgICAgICAgICAgd2FybiBcIs6pTFJTX18xNCBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICBlbHNlXG4gICAgICAgIHdhcm4gXCLOqUxSU19fMTUgaWdub3JpbmcgcmVxdWlyZSBzdGF0ZW1lbnQgd2l0aCB0eXBlICN7cnByIHR5cGV9XCJcbiAgcmV0dXJuIGNvbGxlY3RvclxuXG5kZXBlbmRlbnRzID0gY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBzb3VyY2VfcGF0aFxuaW5mbyAnzqlMUlNfXzE2JywgcnByIGRlcGVuZGVudC5wYXRoIGZvciBkZXBlbmRlbnQgaW4gZGVwZW5kZW50c1xuXG5cbiJdfQ==
