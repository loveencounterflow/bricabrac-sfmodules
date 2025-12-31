(function() {
  'use strict';
  var C, FS, PATH, Shell, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, cwd, d, debug, dependencies, error, findPackageJSON, i, idx, info, len, process_cwd, remote_url, remote_urls, require_console_output, row, rows, rpr, sh, source_path, source_relpath, strip_ansi, target_path, type_of, walk_require_statements, warn, whisper;

  ({
    //===========================================================================================================
    // { log,
    //   debug,                } = console
    //-----------------------------------------------------------------------------------------------------------
    ansi_colors_and_effects: C
  } = (require('../ansi-brics')).require_ansi_colors_and_effects());

  ({type_of} = (require('../unstable-rpr-type_of-brics')).require_type_of());

  ({
    show_no_colors: rpr
  } = (require('../unstable-rpr-type_of-brics')).require_show());

  ({walk_require_statements} = (require('../parse-require-statements.brics')).require_parse_require_statements());

  ({strip_ansi} = (require('../ansi-brics')).require_strip_ansi());

  PATH = require('node:path');

  FS = require('node:fs');

  //-----------------------------------------------------------------------------------------------------------
  ({createRequire, findPackageJSON} = require('node:module'));

  // { pathToFileURL,        } = require 'node:url'
  // { register,             } = require 'node:module'
  // { stripTypeScriptTypes, } = require 'node:module'
  // { isBuiltin,            } = require 'node:module'
  // isBuiltin('node:fs'); // true
  // isBuiltin('fs'); // true
  // isBuiltin('wss'); // false
  //-----------------------------------------------------------------------------------------------------------
  ({warn, info, debug, whisper} = (require_console_output = function() {
    var exports, line_width, pen;
    line_width = process.stdout.isTTY ? process.stdout.columns : 108;
    pen = function(...P) {
      var p, text;
      text = ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = P.length; i < len; i++) {
          p = P[i];
          results.push(`${p}`);
        }
        return results;
      })()).join(' ');
      // ( strip_ansi text ).length
      return text.padEnd(line_width, ' ');
    };
    warn = function(...P) {
      return console.log(`${C.bg_navy}${C.red}${C.bold}${pen(...P)}${C.bold0}${C.default}${C.bg_default}`);
    };
    info = function(...P) {
      return console.log(`${C.bg_honeydew}${C.black}${C.bold}${pen(...P)}${C.bold0}${C.default}${C.bg_default}`);
    };
    whisper = function(...P) {
      return console.log(`${C.bg_slategray}${C.black}${C.bold}${pen(...P)}${C.bold0}${C.default}${C.bg_default}`);
    };
    debug = function(...P) {
      return console.log(`${C.bg_violet}${C.white}${C.bold}${pen(...P)}${C.bold0}${C.default}${C.bg_default}`);
    };
    return exports = {pen, warn, info, whisper, debug};
  })());

  //===========================================================================================================
  debug("ΩLRS___1 ————————————————————————————————————————");

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
    var custom_require, dependent_path, disposition, selector, type, x;
    custom_require = createRequire(path);
// NOTE can explicitly give source
    for (x of walk_require_statements({path})) {
      ({type, disposition, selector} = x);
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
              whisper('ΩLRS__10', `(${disposition}) ${path} -> ${dependent_path}`);
              if (seen_paths.has(dependent_path)) {
                continue;
              }
              //   throw new Error "ΩLRS__11 detected cyclic dependency from #{rpr path} to #{rpr dependent_path}"
              seen_paths.add(dependent_path);
              // debug 'ΩLRS__12', findPackageJSON selector, path
              // debug 'ΩLRS__13', findPackageJSON path
              // debug 'ΩLRS__14', findPackageJSON selector
              collector.push({
                disposition,
                source_path: path,
                path: dependent_path,
                selector
              });
              _collect_transitive_require_statements(dependent_path, collector, seen_paths);
              break;
            // when 'outside'
            //   warn "ΩLRS__15 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
            case 'unresolved':
              warn(`ΩLRS__16 ignoring module with disposition ${rpr(disposition)}: ${rpr(selector)}`);
          }
          break;
        default:
          warn(`ΩLRS__17 ignoring require statement with type ${rpr(type)}`);
      }
    }
    return collector;
  };

  dependencies = collect_transitive_require_statements(source_path);

  // info 'ΩLRS__18', ( rpr d.path ), ( "(#{rpr d.selector})" ) for d in dependencies
  // cwd         = process.cwd()
  ({Shell} = require('../../../bvfs'));

  remote_urls = {};

  rows = [];

  process_cwd = process.cwd();

//...........................................................................................................
  for (i = 0, len = dependencies.length; i < len; i++) {
    d = dependencies[i];
    //.........................................................................................................
    cwd = PATH.dirname(d.path);
    if ((remote_url = remote_urls[cwd]) == null) {
      sh = new Shell({
        cwd,
        lines: false,
        only_stdout: true
      });
      try {
        remote_url = sh.call('git', 'config', '--get', 'remote.origin.url');
        remote_urls[cwd] = remote_url;
      } catch (error1) {
        error = error1;
        warn('ΩLRS__19', error.message);
        remote_url = '?unknown?';
        remote_urls[cwd] = remote_url;
      }
    }
    //.........................................................................................................
    source_relpath = PATH.relative(process_cwd, d.source_path);
    target_path = PATH.resolve(PATH.dirname(d.source_path), d.selector);
    rows.push({
      source_relpath,
      selector: d.selector,
      target_path,
      remote_url,
      annotation: d.annotation
    });
    info('ΩLRS__20', d.disposition, source_relpath, target_path, d.selector, remote_url);
  }

  //...........................................................................................................
  rows.sort(function(a, b) {
    if (a.remote_url > b.remote_url) {
      return +1;
    }
    if (a.remote_url < b.remote_url) {
      return -1;
    }
    if (a.target_path > b.target_path) {
      return +1;
    }
    if (a.target_path < b.target_path) {
      return -1;
    }
    return 0;
  });

  console.table(Object.fromEntries((function() {
    var j, len1, results;
    results = [];
    for (idx = j = 0, len1 = rows.length; j < len1; idx = ++j) {
      row = rows[idx];
      results.push([idx + 1, row]);
    }
    return results;
  })()));

  // shell_cfg = { cwd: '/tmp', lines: false, only_stdout: true, }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLHNDQUFBLEVBQUEscUNBQUEsRUFBQSxhQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxlQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLFdBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLHNCQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsdUJBQUEsRUFBQSxJQUFBLEVBQUE7O0VBTUEsQ0FBQSxDQUFBOzs7OztJQUFFLHVCQUFBLEVBQ0U7RUFESixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGVBQVIsQ0FBRixDQUEyQixDQUFDLCtCQUE1QixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQUEyQyxDQUFDLGVBQTVDLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSwrQkFBUixDQUFGLENBQTJDLENBQUMsWUFBNUMsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsdUJBQUYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxtQ0FBUixDQUFGLENBQStDLENBQUMsZ0NBQWhELENBQUEsQ0FENUI7O0VBRUEsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxrQkFBNUIsQ0FBQSxDQUE1Qjs7RUFDQSxJQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSOztFQUM1QixFQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLEVBZDVCOzs7RUFnQkEsQ0FBQSxDQUFFLGFBQUYsRUFDRSxlQURGLENBQUEsR0FDNEIsT0FBQSxDQUFRLGFBQVIsQ0FENUIsRUFoQkE7Ozs7Ozs7Ozs7RUEwQkEsQ0FBQSxDQUFFLElBQUYsRUFDRSxJQURGLEVBRUUsS0FGRixFQUdFLE9BSEYsQ0FBQSxHQUlBLENBQUEsc0JBQUEsR0FBeUIsUUFBQSxDQUFBLENBQUE7QUFDekIsUUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBO0lBQUUsVUFBQSxHQUFnQixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWxCLEdBQTZCLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBNUMsR0FBeUQ7SUFDdEUsR0FBQSxHQUFNLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTtBQUNSLFVBQUEsQ0FBQSxFQUFBO01BQUksSUFBQSxHQUFPOztBQUFFO1FBQUEsS0FBQSxtQ0FBQTs7dUJBQUEsQ0FBQSxDQUFBLENBQUcsQ0FBSCxDQUFBO1FBQUEsQ0FBQTs7VUFBRixDQUFxQixDQUFDLElBQXRCLENBQTJCLEdBQTNCLEVBQVg7O0FBRUksYUFBTyxJQUFJLENBQUMsTUFBTCxDQUFZLFVBQVosRUFBd0IsR0FBeEI7SUFISDtJQUlOLElBQUEsR0FBTyxRQUFBLENBQUEsR0FBRSxDQUFGLENBQUE7YUFDTCxPQUFPLENBQUMsR0FBUixDQUFZLENBQUEsQ0FBQSxDQUFHLENBQUMsQ0FBQyxPQUFMLENBQUEsQ0FBQSxDQUFlLENBQUMsQ0FBQyxHQUFqQixDQUFBLENBQUEsQ0FBdUIsQ0FBQyxDQUFDLElBQXpCLENBQUEsQ0FBQSxDQUFnQyxHQUFBLENBQUksR0FBQSxDQUFKLENBQWhDLENBQUEsQ0FBQSxDQUEyQyxDQUFDLENBQUMsS0FBN0MsQ0FBQSxDQUFBLENBQXFELENBQUMsQ0FBQyxPQUF2RCxDQUFBLENBQUEsQ0FBaUUsQ0FBQyxDQUFDLFVBQW5FLENBQUEsQ0FBWjtJQURLO0lBRVAsSUFBQSxHQUFPLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTthQUNMLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQyxDQUFDLFdBQUwsQ0FBQSxDQUFBLENBQW1CLENBQUMsQ0FBQyxLQUFyQixDQUFBLENBQUEsQ0FBNkIsQ0FBQyxDQUFDLElBQS9CLENBQUEsQ0FBQSxDQUFzQyxHQUFBLENBQUksR0FBQSxDQUFKLENBQXRDLENBQUEsQ0FBQSxDQUFpRCxDQUFDLENBQUMsS0FBbkQsQ0FBQSxDQUFBLENBQTJELENBQUMsQ0FBQyxPQUE3RCxDQUFBLENBQUEsQ0FBdUUsQ0FBQyxDQUFDLFVBQXpFLENBQUEsQ0FBWjtJQURLO0lBRVAsT0FBQSxHQUFVLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTthQUNSLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQyxDQUFDLFlBQUwsQ0FBQSxDQUFBLENBQW9CLENBQUMsQ0FBQyxLQUF0QixDQUFBLENBQUEsQ0FBOEIsQ0FBQyxDQUFDLElBQWhDLENBQUEsQ0FBQSxDQUF1QyxHQUFBLENBQUksR0FBQSxDQUFKLENBQXZDLENBQUEsQ0FBQSxDQUFrRCxDQUFDLENBQUMsS0FBcEQsQ0FBQSxDQUFBLENBQTRELENBQUMsQ0FBQyxPQUE5RCxDQUFBLENBQUEsQ0FBd0UsQ0FBQyxDQUFDLFVBQTFFLENBQUEsQ0FBWjtJQURRO0lBRVYsS0FBQSxHQUFRLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTthQUNOLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQyxDQUFDLFNBQUwsQ0FBQSxDQUFBLENBQWlCLENBQUMsQ0FBQyxLQUFuQixDQUFBLENBQUEsQ0FBMkIsQ0FBQyxDQUFDLElBQTdCLENBQUEsQ0FBQSxDQUFvQyxHQUFBLENBQUksR0FBQSxDQUFKLENBQXBDLENBQUEsQ0FBQSxDQUErQyxDQUFDLENBQUMsS0FBakQsQ0FBQSxDQUFBLENBQXlELENBQUMsQ0FBQyxPQUEzRCxDQUFBLENBQUEsQ0FBcUUsQ0FBQyxDQUFDLFVBQXZFLENBQUEsQ0FBWjtJQURNO0FBRVIsV0FBTyxPQUFBLEdBQVUsQ0FBRSxHQUFGLEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsT0FBbkIsRUFBNEIsS0FBNUI7RUFkTSxDQUF6QixHQUpBLEVBMUJBOzs7RUFnREEsS0FBQSxDQUFNLG1EQUFOLEVBaERBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBcUVBLFdBQUEsR0FBYyxPQUFPLENBQUMsSUFBSSxDQUFFLENBQUYsRUFyRTFCOzs7RUF1RUEsS0FBQSxDQUFNLENBQUEsNkJBQUEsQ0FBQSxDQUFnQyxXQUFoQyxDQUFBLENBQU47O0VBRUEscUNBQUEsR0FBd0MsUUFBQSxDQUFFLElBQUYsQ0FBQTtBQUN4QyxRQUFBLENBQUEsRUFBQTtJQUFFLFVBQUEsR0FBYyxJQUFJLEdBQUosQ0FBQTtJQUNkLENBQUEsR0FBYztBQUNkLFdBQU8sc0NBQUEsQ0FBdUMsSUFBdkMsRUFBNkMsQ0FBN0MsRUFBZ0QsVUFBaEQ7RUFIK0I7O0VBS3hDLHNDQUFBLEdBQXlDLFFBQUEsQ0FBRSxJQUFGLEVBQVEsU0FBUixFQUFtQixVQUFuQixDQUFBO0FBQ3pDLFFBQUEsY0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLElBQUEsRUFBQTtJQUFFLGNBQUEsR0FBa0IsYUFBQSxDQUFjLElBQWQsRUFBcEI7O0lBQ0UsS0FBQSxvQ0FBQTtPQUFJLENBQUUsSUFBRixFQUFRLFdBQVIsRUFBcUIsUUFBckI7QUFDRixjQUFPLElBQVA7QUFBQSxhQUNPLFNBRFA7QUFFSSxrQkFBTyxXQUFQO0FBQUEsaUJBQ08sTUFEUDtjQUVJLElBQUEsQ0FBSyxDQUFBLDBDQUFBLENBQUEsQ0FBNkMsR0FBQSxDQUFJLFdBQUosQ0FBN0MsQ0FBQSxFQUFBLENBQUEsQ0FBaUUsR0FBQSxDQUFJLFFBQUosQ0FBakUsQ0FBQSxDQUFMO0FBREc7QUFEUCxpQkFHTyxLQUhQO2NBSUksSUFBQSxDQUFLLENBQUEsMENBQUEsQ0FBQSxDQUE2QyxHQUFBLENBQUksV0FBSixDQUE3QyxDQUFBLEVBQUEsQ0FBQSxDQUFpRSxHQUFBLENBQUksUUFBSixDQUFqRSxDQUFBLENBQUw7QUFERztBQUhQLGlCQUtPLFFBTFA7QUFBQSxpQkFLaUIsU0FMakI7Y0FNSSxjQUFBLEdBQWlCLGNBQWMsQ0FBQyxPQUFmLENBQXVCLFFBQXZCO2NBQ2pCLE9BQUEsQ0FBUSxVQUFSLEVBQW9CLENBQUEsQ0FBQSxDQUFBLENBQUksV0FBSixDQUFBLEVBQUEsQ0FBQSxDQUFvQixJQUFwQixDQUFBLElBQUEsQ0FBQSxDQUErQixjQUEvQixDQUFBLENBQXBCO2NBQ0EsSUFBRyxVQUFVLENBQUMsR0FBWCxDQUFlLGNBQWYsQ0FBSDtBQUNFLHlCQURGO2VBRlo7O2NBS1ksVUFBVSxDQUFDLEdBQVgsQ0FBZSxjQUFmLEVBTFo7Ozs7Y0FTWSxTQUFTLENBQUMsSUFBVixDQUFlO2dCQUFFLFdBQUY7Z0JBQWUsV0FBQSxFQUFhLElBQTVCO2dCQUFrQyxJQUFBLEVBQU0sY0FBeEM7Z0JBQXdEO2NBQXhELENBQWY7Y0FDQSxzQ0FBQSxDQUF1QyxjQUF2QyxFQUF1RCxTQUF2RCxFQUFrRSxVQUFsRTtBQVhhOzs7QUFMakIsaUJBbUJPLFlBbkJQO2NBb0JJLElBQUEsQ0FBSyxDQUFBLDBDQUFBLENBQUEsQ0FBNkMsR0FBQSxDQUFJLFdBQUosQ0FBN0MsQ0FBQSxFQUFBLENBQUEsQ0FBaUUsR0FBQSxDQUFJLFFBQUosQ0FBakUsQ0FBQSxDQUFMO0FBcEJKO0FBREc7QUFEUDtVQXdCSSxJQUFBLENBQUssQ0FBQSw4Q0FBQSxDQUFBLENBQWlELEdBQUEsQ0FBSSxJQUFKLENBQWpELENBQUEsQ0FBTDtBQXhCSjtJQURGO0FBMEJBLFdBQU87RUE1QmdDOztFQThCekMsWUFBQSxHQUFlLHFDQUFBLENBQXNDLFdBQXRDLEVBNUdmOzs7O0VBK0dBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFBLENBQVEsZUFBUixDQUFkOztFQUNBLFdBQUEsR0FBYyxDQUFBOztFQUNkLElBQUEsR0FBYzs7RUFDZCxXQUFBLEdBQWMsT0FBTyxDQUFDLEdBQVIsQ0FBQSxFQWxIZDs7O0VBb0hBLEtBQUEsOENBQUE7d0JBQUE7O0lBRUUsR0FBQSxHQUFNLElBQUksQ0FBQyxPQUFMLENBQWEsQ0FBQyxDQUFDLElBQWY7SUFDTixJQUFPLHVDQUFQO01BQ0UsRUFBQSxHQUFLLElBQUksS0FBSixDQUFVO1FBQUUsR0FBRjtRQUFPLEtBQUEsRUFBTyxLQUFkO1FBQXFCLFdBQUEsRUFBYTtNQUFsQyxDQUFWO0FBQ0w7UUFDRSxVQUFBLEdBQXNCLEVBQUUsQ0FBQyxJQUFILENBQVEsS0FBUixFQUFlLFFBQWYsRUFBeUIsT0FBekIsRUFBa0MsbUJBQWxDO1FBQ3RCLFdBQVcsQ0FBRSxHQUFGLENBQVgsR0FBc0IsV0FGeEI7T0FHQSxjQUFBO1FBQU07UUFDSixJQUFBLENBQUssVUFBTCxFQUFpQixLQUFLLENBQUMsT0FBdkI7UUFDQSxVQUFBLEdBQXNCO1FBQ3RCLFdBQVcsQ0FBRSxHQUFGLENBQVgsR0FBc0IsV0FIeEI7T0FMRjtLQUZGOztJQVlFLGNBQUEsR0FBb0IsSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkLEVBQTJCLENBQUMsQ0FBQyxXQUE3QjtJQUNwQixXQUFBLEdBQW9CLElBQUksQ0FBQyxPQUFMLENBQWUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxDQUFDLENBQUMsV0FBZixDQUFmLEVBQTZDLENBQUMsQ0FBQyxRQUEvQztJQUNwQixJQUFJLENBQUMsSUFBTCxDQUFvQjtNQUFFLGNBQUY7TUFBa0IsUUFBQSxFQUFVLENBQUMsQ0FBQyxRQUE5QjtNQUF3QyxXQUF4QztNQUFxRCxVQUFyRDtNQUFpRSxVQUFBLEVBQVksQ0FBQyxDQUFDO0lBQS9FLENBQXBCO0lBQ0EsSUFBQSxDQUFLLFVBQUwsRUFBaUIsQ0FBQyxDQUFDLFdBQW5CLEVBQWdDLGNBQWhDLEVBQWdELFdBQWhELEVBQTZELENBQUMsQ0FBQyxRQUEvRCxFQUF5RSxVQUF6RTtFQWhCRixDQXBIQTs7O0VBc0lBLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBQSxDQUFFLENBQUYsRUFBSyxDQUFMLENBQUE7SUFDUixJQUFhLENBQUMsQ0FBQyxVQUFGLEdBQWdCLENBQUMsQ0FBQyxVQUEvQjtBQUFBLGFBQU8sQ0FBQyxFQUFSOztJQUNBLElBQWEsQ0FBQyxDQUFDLFVBQUYsR0FBZ0IsQ0FBQyxDQUFDLFVBQS9CO0FBQUEsYUFBTyxDQUFDLEVBQVI7O0lBQ0EsSUFBYSxDQUFDLENBQUMsV0FBRixHQUFnQixDQUFDLENBQUMsV0FBL0I7QUFBQSxhQUFPLENBQUMsRUFBUjs7SUFDQSxJQUFhLENBQUMsQ0FBQyxXQUFGLEdBQWdCLENBQUMsQ0FBQyxXQUEvQjtBQUFBLGFBQU8sQ0FBQyxFQUFSOztBQUNBLFdBQU87RUFMQyxDQUFWOztFQU1BLE9BQU8sQ0FBQyxLQUFSLENBQWMsTUFBTSxDQUFDLFdBQVA7O0FBQXFCO0lBQUEsS0FBQSxvREFBQTs7bUJBQUEsQ0FBRSxHQUFBLEdBQU0sQ0FBUixFQUFXLEdBQVg7SUFBQSxDQUFBOztNQUFyQixDQUFkOztFQTVJQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGxvZyxcbiMgICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogXFxcbiAgICBDLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL2Fuc2ktYnJpY3MnICkucmVxdWlyZV9hbnNpX2NvbG9yc19hbmRfZWZmZWN0cygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV9zaG93KClcbnsgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi9wYXJzZS1yZXF1aXJlLXN0YXRlbWVudHMuYnJpY3MnICkucmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHMoKVxueyBzdHJpcF9hbnNpLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vYW5zaS1icmljcycgKS5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuUEFUSCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbkZTICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IGNyZWF0ZVJlcXVpcmUsXG4gIGZpbmRQYWNrYWdlSlNPTiwgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgcGF0aFRvRmlsZVVSTCwgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnVybCdcbiMgeyByZWdpc3RlciwgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHN0cmlwVHlwZVNjcmlwdFR5cGVzLCB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgaXNCdWlsdGluLCAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgaXNCdWlsdGluKCdub2RlOmZzJyk7IC8vIHRydWVcbiMgaXNCdWlsdGluKCdmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignd3NzJyk7IC8vIGZhbHNlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgd2FybixcbiAgaW5mbyxcbiAgZGVidWcsXG4gIHdoaXNwZXIsICAgICAgICAgICAgICB9ID0gZG8gXFxcbnJlcXVpcmVfY29uc29sZV9vdXRwdXQgPSAtPlxuICBsaW5lX3dpZHRoID0gaWYgcHJvY2Vzcy5zdGRvdXQuaXNUVFkgdGhlbiBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zIGVsc2UgMTA4XG4gIHBlbiA9ICggUC4uLiApIC0+XG4gICAgdGV4dCA9ICggXCIje3B9XCIgZm9yIHAgaW4gUCApLmpvaW4gJyAnXG4gICAgICMgKCBzdHJpcF9hbnNpIHRleHQgKS5sZW5ndGhcbiAgICByZXR1cm4gdGV4dC5wYWRFbmQgbGluZV93aWR0aCwgJyAnXG4gIHdhcm4gPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX25hdnl9I3tDLnJlZH0je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICBpbmZvID0gKCBQLi4uICkgLT5cbiAgICBjb25zb2xlLmxvZyBcIiN7Qy5iZ19ob25leWRld30je0MuYmxhY2t9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgd2hpc3BlciA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfc2xhdGVncmF5fSN7Qy5ibGFja30je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICBkZWJ1ZyA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfdmlvbGV0fSN7Qy53aGl0ZX0je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICByZXR1cm4gZXhwb3J0cyA9IHsgcGVuLCB3YXJuLCBpbmZvLCB3aGlzcGVyLCBkZWJ1ZywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGVidWcgXCLOqUxSU19fXzEg4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUXCJcblxuXG4jIyMgTk9URTogaXQncyBwb3NzaWJsZSB0byB1c2UgY3VzdG9taXplZCBsb2dpYyBmb3IgYHJlcXVpcmUoKWAgIyMjXG4jIHsgcmVnaXN0ZXJIb29rcywgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgcmVnaXN0ZXJIb29rcyB7XG4jICAgcmVzb2x2ZTogICggc3BlY2lmaWVyLCBjb250ZXh0LCBuZXh0UmVzb2x2ZSApIC0+XG4jICAgICBkZWJ1ZyAnzqlMUlNfX18yJywgeyAgc3BlY2lmaWVyLCBjb250ZXh0LCBuZXh0UmVzb2x2ZSwgfVxuIyAgICAgaWYgc3BlY2lmaWVyIGlzICdicmljOnBhY2thZ2UuanNvbidcbiMgICAgICAgcmV0dXJuIG5leHRSZXNvbHZlICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL3BhY2thZ2UuanNvbidcbiMgICAgIHJldHVybiBuZXh0UmVzb2x2ZSBzcGVjaWZpZXJcbiMgICAjIGxvYWQ6ICAgICAoIHVybCwgY29udGV4dCwgbmV4dExvYWQgKSAtPlxuIyAgICMgICBkZWJ1ZyAnzqlMUlNfX18zJywgeyAgdXJsLCBjb250ZXh0LCBuZXh0TG9hZCwgfVxuIyAgICMgICByZXR1cm4gbmV4dExvYWQgdXJsXG4jICAgICAjIHJldHVybiBuZXh0TG9hZCAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9wYWNrYWdlLmpzb24nXG4jICAgfVxuIyBkZWJ1ZyAnzqlMUlNfX180JywgKCByZXF1aXJlICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL2xpYi9tYWluLmpzJyApLnZlcnNpb25cbiMgZGVidWcgJ86pTFJTX19fNScsICggcmVxdWlyZSAnYnJpYzpwYWNrYWdlLmpzb24nICkudmVyc2lvblxuIyAjIGRlYnVnICfOqUxSU19fXzYnLCAoIHJlcXVpcmUgJ2JyaWM6cGFja2FnZScgKS52ZXJzaW9uXG4jICMgcmVxdWlyZSAnbm9kZTptb2R1bGUnXG5cbnNvdXJjZV9wYXRoID0gcHJvY2Vzcy5hcmd2WyAyIF1cbiMgc291cmNlX3BhdGggPSBfX2ZpbGVuYW1lXG5kZWJ1ZyBcIs6pTFJTX19fNyB1c2luZyBzb3VyY2UgcGF0aDogICN7c291cmNlX3BhdGh9XCJcblxuY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCApIC0+XG4gIHNlZW5fcGF0aHMgID0gbmV3IFNldCgpXG4gIFIgICAgICAgICAgID0gW11cbiAgcmV0dXJuIF9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzIHBhdGgsIFIsIHNlZW5fcGF0aHNcblxuX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgPSAoIHBhdGgsIGNvbGxlY3Rvciwgc2Vlbl9wYXRocyApIC0+XG4gIGN1c3RvbV9yZXF1aXJlICA9IGNyZWF0ZVJlcXVpcmUgcGF0aFxuICBmb3IgeyB0eXBlLCBkaXNwb3NpdGlvbiwgc2VsZWN0b3IsIH0gZnJvbSB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyB7IHBhdGgsIH0gIyBOT1RFIGNhbiBleHBsaWNpdGx5IGdpdmUgc291cmNlXG4gICAgc3dpdGNoIHR5cGVcbiAgICAgIHdoZW4gJ3JlcXVpcmUnXG4gICAgICAgIHN3aXRjaCBkaXNwb3NpdGlvblxuICAgICAgICAgIHdoZW4gJ25vZGUnXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfX184IGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICducG0nXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfX185IGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICdpbnNpZGUnLCAnb3V0c2lkZSdcbiAgICAgICAgICAgIGRlcGVuZGVudF9wYXRoID0gY3VzdG9tX3JlcXVpcmUucmVzb2x2ZSBzZWxlY3RvclxuICAgICAgICAgICAgd2hpc3BlciAnzqlMUlNfXzEwJywgXCIoI3tkaXNwb3NpdGlvbn0pICN7cGF0aH0gLT4gI3tkZXBlbmRlbnRfcGF0aH1cIlxuICAgICAgICAgICAgaWYgc2Vlbl9wYXRocy5oYXMgZGVwZW5kZW50X3BhdGhcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICMgICB0aHJvdyBuZXcgRXJyb3IgXCLOqUxSU19fMTEgZGV0ZWN0ZWQgY3ljbGljIGRlcGVuZGVuY3kgZnJvbSAje3JwciBwYXRofSB0byAje3JwciBkZXBlbmRlbnRfcGF0aH1cIlxuICAgICAgICAgICAgc2Vlbl9wYXRocy5hZGQgZGVwZW5kZW50X3BhdGhcbiAgICAgICAgICAgICMgZGVidWcgJ86pTFJTX18xMicsIGZpbmRQYWNrYWdlSlNPTiBzZWxlY3RvciwgcGF0aFxuICAgICAgICAgICAgIyBkZWJ1ZyAnzqlMUlNfXzEzJywgZmluZFBhY2thZ2VKU09OIHBhdGhcbiAgICAgICAgICAgICMgZGVidWcgJ86pTFJTX18xNCcsIGZpbmRQYWNrYWdlSlNPTiBzZWxlY3RvclxuICAgICAgICAgICAgY29sbGVjdG9yLnB1c2ggeyBkaXNwb3NpdGlvbiwgc291cmNlX3BhdGg6IHBhdGgsIHBhdGg6IGRlcGVuZGVudF9wYXRoLCBzZWxlY3RvciwgfVxuICAgICAgICAgICAgX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgZGVwZW5kZW50X3BhdGgsIGNvbGxlY3Rvciwgc2Vlbl9wYXRoc1xuICAgICAgICAgICMgd2hlbiAnb3V0c2lkZSdcbiAgICAgICAgICAjICAgd2FybiBcIs6pTFJTX18xNSBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAndW5yZXNvbHZlZCdcbiAgICAgICAgICAgIHdhcm4gXCLOqUxSU19fMTYgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgZWxzZVxuICAgICAgICB3YXJuIFwizqlMUlNfXzE3IGlnbm9yaW5nIHJlcXVpcmUgc3RhdGVtZW50IHdpdGggdHlwZSAje3JwciB0eXBlfVwiXG4gIHJldHVybiBjb2xsZWN0b3JcblxuZGVwZW5kZW5jaWVzID0gY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBzb3VyY2VfcGF0aFxuIyBpbmZvICfOqUxSU19fMTgnLCAoIHJwciBkLnBhdGggKSwgKCBcIigje3JwciBkLnNlbGVjdG9yfSlcIiApIGZvciBkIGluIGRlcGVuZGVuY2llc1xuIyBjd2QgICAgICAgICA9IHByb2Nlc3MuY3dkKClcbnsgU2hlbGwsICB9ID0gcmVxdWlyZSAnLi4vLi4vLi4vYnZmcydcbnJlbW90ZV91cmxzID0ge31cbnJvd3MgICAgICAgID0gW11cbnByb2Nlc3NfY3dkID0gcHJvY2Vzcy5jd2QoKVxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG5mb3IgZCBpbiBkZXBlbmRlbmNpZXNcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBjd2QgPSBQQVRILmRpcm5hbWUgZC5wYXRoXG4gIHVubGVzcyAoIHJlbW90ZV91cmwgPSByZW1vdGVfdXJsc1sgY3dkIF0gKT9cbiAgICBzaCA9IG5ldyBTaGVsbCB7IGN3ZCwgbGluZXM6IGZhbHNlLCBvbmx5X3N0ZG91dDogdHJ1ZSwgfVxuICAgIHRyeVxuICAgICAgcmVtb3RlX3VybCAgICAgICAgICA9IHNoLmNhbGwgJ2dpdCcsICdjb25maWcnLCAnLS1nZXQnLCAncmVtb3RlLm9yaWdpbi51cmwnXG4gICAgICByZW1vdGVfdXJsc1sgY3dkIF0gID0gcmVtb3RlX3VybFxuICAgIGNhdGNoIGVycm9yXG4gICAgICB3YXJuICfOqUxSU19fMTknLCBlcnJvci5tZXNzYWdlXG4gICAgICByZW1vdGVfdXJsICAgICAgICAgID0gJz91bmtub3duPydcbiAgICAgIHJlbW90ZV91cmxzWyBjd2QgXSAgPSByZW1vdGVfdXJsXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgc291cmNlX3JlbHBhdGggICAgPSBQQVRILnJlbGF0aXZlIHByb2Nlc3NfY3dkLCBkLnNvdXJjZV9wYXRoXG4gIHRhcmdldF9wYXRoICAgICAgID0gUEFUSC5yZXNvbHZlICggUEFUSC5kaXJuYW1lIGQuc291cmNlX3BhdGggKSwgZC5zZWxlY3RvclxuICByb3dzLnB1c2ggICAgICAgICAgIHsgc291cmNlX3JlbHBhdGgsIHNlbGVjdG9yOiBkLnNlbGVjdG9yLCB0YXJnZXRfcGF0aCwgcmVtb3RlX3VybCwgYW5ub3RhdGlvbjogZC5hbm5vdGF0aW9uLCB9XG4gIGluZm8gJ86pTFJTX18yMCcsIGQuZGlzcG9zaXRpb24sIHNvdXJjZV9yZWxwYXRoLCB0YXJnZXRfcGF0aCwgZC5zZWxlY3RvciwgcmVtb3RlX3VybFxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG5yb3dzLnNvcnQgKCBhLCBiICkgLT5cbiAgcmV0dXJuICsxIGlmIGEucmVtb3RlX3VybCAgPiBiLnJlbW90ZV91cmxcbiAgcmV0dXJuIC0xIGlmIGEucmVtb3RlX3VybCAgPCBiLnJlbW90ZV91cmxcbiAgcmV0dXJuICsxIGlmIGEudGFyZ2V0X3BhdGggPiBiLnRhcmdldF9wYXRoXG4gIHJldHVybiAtMSBpZiBhLnRhcmdldF9wYXRoIDwgYi50YXJnZXRfcGF0aFxuICByZXR1cm4gMFxuY29uc29sZS50YWJsZSBPYmplY3QuZnJvbUVudHJpZXMgKCBbIGlkeCArIDEsIHJvdywgXSBmb3Igcm93LCBpZHggaW4gcm93cyApXG5cbiMgc2hlbGxfY2ZnID0geyBjd2Q6ICcvdG1wJywgbGluZXM6IGZhbHNlLCBvbmx5X3N0ZG91dDogdHJ1ZSwgfVxuXG5cblxuXG4iXX0=
