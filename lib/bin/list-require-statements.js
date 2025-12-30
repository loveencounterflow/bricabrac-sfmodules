(function() {
  'use strict';
  var C, FS, PATH, SFMODULES, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, cwd, d, debug, dependencies, i, info, len, log, rpr, source_path, type_of, walk_require_statements, warn, whisper;

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
                path: dependent_path,
                selector
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

  dependencies = collect_transitive_require_statements(source_path);

  // info 'ΩLRS__16', ( rpr d.path ), ( "(#{rpr d.selector})" ) for d in dependencies
  cwd = process.cwd();

  for (i = 0, len = dependencies.length; i < len; i++) {
    d = dependencies[i];
    source_path = PATH.relative(cwd, d.source_path);
    info('ΩLRS__16', d.disposition, rpr(source_path), `(${rpr(d.selector)})`);
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLHNDQUFBLEVBQUEscUNBQUEsRUFBQSxhQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsRUFBQSx1QkFBQSxFQUFBLElBQUEsRUFBQSxPQUFBOzs7RUFHQSxDQUFBLENBQUUsR0FBRixFQUNFLEtBREYsQ0FBQSxHQUM0QixPQUQ1QixFQUhBOzs7RUFNQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUU1QixDQUFBLENBQUE7O0lBQUUsdUJBQUEsRUFDRTtFQURKLENBQUEsR0FDNEIsU0FBUyxDQUFDLCtCQUFWLENBQUEsQ0FENUI7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLHVCQUFGLENBQUEsR0FDNEIsU0FBUyxDQUFDLGdDQUFWLENBQUEsQ0FENUIsRUFaQTs7Ozs7RUFpQkEsSUFBQSxHQUE0QixPQUFBLENBQVEsV0FBUjs7RUFDNUIsRUFBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsSUFBQSxHQUFPLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTtBQUNQLFFBQUEsQ0FBQSxFQUFBO0lBQUUsQ0FBQSxHQUFJOztBQUFFO01BQUEsS0FBQSxtQ0FBQTs7cUJB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RjtBQXVCQSxXQUFPO0VBekJnQzs7RUEyQnpDLFlBQUEsR0FBZSxxQ0FBQSxDQUFzQyxXQUF0QyxFQS9GZjs7O0VBaUdBLEdBQUEsR0FBYyxPQUFPLENBQUMsR0FBUixDQUFBOztFQUNkLEtBQUEsOENBQUE7O0lBQ0UsV0FBQSxHQUFjLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxFQUFtQixDQUFDLENBQUMsV0FBckI7SUFDZCxJQUFBLENBQUssVUFBTCxFQUFpQixDQUFDLENBQUMsV0FBbkIsRUFBa0MsR0FBQSxDQUFJLFdBQUosQ0FBbEMsRUFBdUQsQ0FBQSxDQUFBLENBQUEsQ0FBSSxHQUFBLENBQUksQ0FBQyxDQUFDLFFBQU4sQ0FBSixDQUFBLENBQUEsQ0FBdkQ7RUFGRjtBQWxHQSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgbG9nLFxuICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uL21haW4nXG4jIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2Ztb2R1bGVzJ1xueyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogXFxcbiAgICBDLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9hbnNpX2NvbG9yc19hbmRfZWZmZWN0cygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3BhcnNlX3JlcXVpcmVfc3RhdGVtZW50cygpXG4jIHsgd2Fsa19qc190b2tlbnMsXG4jICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuIyAgIHN1bW1hcml6ZSwgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfd2Fsa19qc190b2tlbnMoKVxuUEFUSCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbkZTICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xud2FybiA9ICggUC4uLiApIC0+XG4gIHggPSAoIFwiI3twfVwiIGZvciBwIGluIFAgKS5qb2luICcgJ1xuICBsb2cgXCIje0MuYmdfbmF2eX0je0MucmVkfSN7Qy5ib2xkfSN7eH0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbmluZm8gPSAoIFAuLi4gKSAtPlxuICB4ID0gKCBcIiN7cH1cIiBmb3IgcCBpbiBQICkuam9pbiAnICdcbiAgbG9nIFwiI3tDLmJnX2hvbmV5ZGV3fSN7Qy5ibGFja30je0MuYm9sZH0je3h9I3tDLmJvbGQwfSN7Qy5kZWZhdWx0fSN7Qy5iZ19kZWZhdWx0fVwiXG53aGlzcGVyID0gKCBQLi4uICkgLT5cbiAgeCA9ICggXCIje3B9XCIgZm9yIHAgaW4gUCApLmpvaW4gJyAnXG4gIGxvZyBcIiN7Qy5iZ19zbGF0ZWdyYXl9I3tDLmJsYWNrfSN7Qy5ib2xkfSN7eH0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcblxuZGVidWcgXCLOqUxSU19fXzEg4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUXCJcblxueyBjcmVhdGVSZXF1aXJlLCAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IGZpbmRQYWNrYWdlSlNPTiwgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgcGF0aFRvRmlsZVVSTCwgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnVybCdcbiMgeyByZWdpc3RlciwgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHN0cmlwVHlwZVNjcmlwdFR5cGVzLCB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgaXNCdWlsdGluLCAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgaXNCdWlsdGluKCdub2RlOmZzJyk7IC8vIHRydWVcbiMgaXNCdWlsdGluKCdmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignd3NzJyk7IC8vIGZhbHNlXG5cbiMjIyBOT1RFOiBpdCdzIHBvc3NpYmxlIHRvIHVzZSBjdXN0b21pemVkIGxvZ2ljIGZvciBgcmVxdWlyZSgpYCAjIyNcbiMgeyByZWdpc3Rlckhvb2tzLCAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyByZWdpc3Rlckhvb2tzIHtcbiMgICByZXNvbHZlOiAgKCBzcGVjaWZpZXIsIGNvbnRleHQsIG5leHRSZXNvbHZlICkgLT5cbiMgICAgIGRlYnVnICfOqUxSU19fXzInLCB7ICBzcGVjaWZpZXIsIGNvbnRleHQsIG5leHRSZXNvbHZlLCB9XG4jICAgICBpZiBzcGVjaWZpZXIgaXMgJ2JyaWM6cGFja2FnZS5qc29uJ1xuIyAgICAgICByZXR1cm4gbmV4dFJlc29sdmUgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvcGFja2FnZS5qc29uJ1xuIyAgICAgcmV0dXJuIG5leHRSZXNvbHZlIHNwZWNpZmllclxuIyAgICMgbG9hZDogICAgICggdXJsLCBjb250ZXh0LCBuZXh0TG9hZCApIC0+XG4jICAgIyAgIGRlYnVnICfOqUxSU19fXzMnLCB7ICB1cmwsIGNvbnRleHQsIG5leHRMb2FkLCB9XG4jICAgIyAgIHJldHVybiBuZXh0TG9hZCB1cmxcbiMgICAgICMgcmV0dXJuIG5leHRMb2FkICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL3BhY2thZ2UuanNvbidcbiMgICB9XG4jIGRlYnVnICfOqUxSU19fXzQnLCAoIHJlcXVpcmUgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvbGliL21haW4uanMnICkudmVyc2lvblxuIyBkZWJ1ZyAnzqlMUlNfX181JywgKCByZXF1aXJlICdicmljOnBhY2thZ2UuanNvbicgKS52ZXJzaW9uXG4jICMgZGVidWcgJ86pTFJTX19fNicsICggcmVxdWlyZSAnYnJpYzpwYWNrYWdlJyApLnZlcnNpb25cbiMgIyByZXF1aXJlICdub2RlOm1vZHVsZSdcblxuc291cmNlX3BhdGggPSBwcm9jZXNzLmFyZ3ZbIDIgXVxuIyBzb3VyY2VfcGF0aCA9IF9fZmlsZW5hbWVcbmRlYnVnIFwizqlMUlNfX183IHVzaW5nIHNvdXJjZSBwYXRoOiAgI3tzb3VyY2VfcGF0aH1cIlxuXG5jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoICkgLT5cbiAgc2Vlbl9wYXRocyAgPSBuZXcgU2V0KClcbiAgUiAgICAgICAgICAgPSBbXVxuICByZXR1cm4gX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgcGF0aCwgUiwgc2Vlbl9wYXRoc1xuXG5fY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCwgY29sbGVjdG9yLCBzZWVuX3BhdGhzICkgLT5cbiAgY3VzdG9tX3JlcXVpcmUgID0gY3JlYXRlUmVxdWlyZSBwYXRoXG4gIGZvciB7IHR5cGUsIGRpc3Bvc2l0aW9uLCBzZWxlY3RvciwgfSBmcm9tIHdhbGtfcmVxdWlyZV9zdGF0ZW1lbnRzIHsgcGF0aCwgfSAjIE5PVEUgY2FuIGV4cGxpY2l0bHkgZ2l2ZSBzb3VyY2VcbiAgICBzd2l0Y2ggdHlwZVxuICAgICAgd2hlbiAncmVxdWlyZSdcbiAgICAgICAgc3dpdGNoIGRpc3Bvc2l0aW9uXG4gICAgICAgICAgd2hlbiAnbm9kZSdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fXzggaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ25wbSdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fXzkgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ2luc2lkZScsICdvdXRzaWRlJ1xuICAgICAgICAgICAgZGVwZW5kZW50X3BhdGggPSBjdXN0b21fcmVxdWlyZS5yZXNvbHZlIHNlbGVjdG9yXG4gICAgICAgICAgICB3aGlzcGVyICfOqUxSU19fMTEnLCBcIigje2Rpc3Bvc2l0aW9ufSkgI3twYXRofSAtPiAje2RlcGVuZGVudF9wYXRofVwiXG4gICAgICAgICAgICBpZiBzZWVuX3BhdGhzLmhhcyBkZXBlbmRlbnRfcGF0aFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgIyAgIHRocm93IG5ldyBFcnJvciBcIs6pTFJTX18xMiBkZXRlY3RlZCBjeWNsaWMgZGVwZW5kZW5jeSBmcm9tICN7cnByIHBhdGh9IHRvICN7cnByIGRlcGVuZGVudF9wYXRofVwiXG4gICAgICAgICAgICBzZWVuX3BhdGhzLmFkZCBkZXBlbmRlbnRfcGF0aFxuICAgICAgICAgICAgY29sbGVjdG9yLnB1c2ggeyBkaXNwb3NpdGlvbiwgc291cmNlX3BhdGg6IHBhdGgsIHBhdGg6IGRlcGVuZGVudF9wYXRoLCBzZWxlY3RvciwgfVxuICAgICAgICAgICAgX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgZGVwZW5kZW50X3BhdGgsIGNvbGxlY3Rvciwgc2Vlbl9wYXRoc1xuICAgICAgICAgICMgd2hlbiAnb3V0c2lkZSdcbiAgICAgICAgICAjICAgd2FybiBcIs6pTFJTX18xMyBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAndW5yZXNvbHZlZCdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fMTQgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgZWxzZVxuICAgICAgICB3YXJuIFwizqlMUlNfXzE1IGlnbm9yaW5nIHJlcXVpcmUgc3RhdGVtZW50IHdpdGggdHlwZSAje3JwciB0eXBlfVwiXG4gIHJldHVybiBjb2xsZWN0b3JcblxuZGVwZW5kZW5jaWVzID0gY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBzb3VyY2VfcGF0aFxuIyBpbmZvICfOqUxSU19fMTYnLCAoIHJwciBkLnBhdGggKSwgKCBcIigje3JwciBkLnNlbGVjdG9yfSlcIiApIGZvciBkIGluIGRlcGVuZGVuY2llc1xuY3dkICAgICAgICAgPSBwcm9jZXNzLmN3ZCgpXG5mb3IgZCBpbiBkZXBlbmRlbmNpZXNcbiAgc291cmNlX3BhdGggPSBQQVRILnJlbGF0aXZlIGN3ZCwgZC5zb3VyY2VfcGF0aFxuICBpbmZvICfOqUxSU19fMTYnLCBkLmRpc3Bvc2l0aW9uLCAoIHJwciBzb3VyY2VfcGF0aCApLCAoIFwiKCN7cnByIGQuc2VsZWN0b3J9KVwiIClcblxuXG4iXX0=
