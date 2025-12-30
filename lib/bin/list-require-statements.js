(function() {
  'use strict';
  var C, FS, PATH, SFMODULES, Shell, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, cwd, d, debug, dependencies, error, findPackageJSON, i, idx, info, len, remote_url, remote_urls, require_console_output, row, rows, rpr, sh, source_path, source_relpath, strip_ansi, target_path, type_of, walk_require_statements, warn, whisper;

  //===========================================================================================================
  // { log,
  //   debug,                } = console
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

  ({strip_ansi} = SFMODULES.require_strip_ansi());

  // { SQL: SH,              } = SFMODULES.unstable.require_dbric()
  // { walk_js_tokens,
  //   walk_essential_js_tokens,
  //   summarize,            } = SFMODULES.require_walk_js_tokens()
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
    source_relpath = PATH.relative(cwd, d.source_path);
    target_path = PATH.resolve(PATH.dirname(d.source_path), d.selector);
    rows.push({
      source_relpath,
      selector: d.selector,
      target_path,
      remote_url
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxzQ0FBQSxFQUFBLHFDQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsZUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLHNCQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsdUJBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQTs7Ozs7O0VBTUEsU0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFFNUIsQ0FBQSxDQUFBOztJQUFFLHVCQUFBLEVBQ0U7RUFESixDQUFBLEdBQzRCLFNBQVMsQ0FBQywrQkFBVixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUE7SUFBRSxjQUFBLEVBQWdCO0VBQWxCLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSx1QkFBRixDQUFBLEdBQzRCLFNBQVMsQ0FBQyxnQ0FBVixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBNUIsRUFkQTs7Ozs7O0VBbUJBLElBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVI7O0VBQzVC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QWdCLENBQUMsQ0FBQyxVQUEvQjtBQUFBLGFBQU8sQ0FBQyxFQUFSOztJQUNBLElBQWEsQ0FBQyxDQUFDLFdBQUYsR0FBZ0IsQ0FBQyxDQUFDLFdBQS9CO0FBQUEsYUFBTyxDQUFDLEVBQVI7O0lBQ0EsSUFBYSxDQUFDLENBQUMsV0FBRixHQUFnQixDQUFDLENBQUMsV0FBL0I7QUFBQSxhQUFPLENBQUMsRUFBUjs7QUFDQSxXQUFPO0VBTEMsQ0FBVjs7RUFNQSxPQUFPLENBQUMsS0FBUixDQUFjLE1BQU0sQ0FBQyxXQUFQOztBQUFxQjtJQUFBLEtBQUEsb0RBQUE7O21CQUFBLENBQUUsR0FBQSxHQUFNLENBQVIsRUFBVyxHQUFYO0lBQUEsQ0FBQTs7TUFBckIsQ0FBZDs7RUFqSkE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBsb2csXG4jICAgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi9tYWluJ1xuIyBTRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNmbW9kdWxlcydcbnsgYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHM6IFxcXG4gICAgQywgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHMoKVxueyBzdHJpcF9hbnNpLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuIyB7IFNRTDogU0gsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZGJyaWMoKVxuIyB7IHdhbGtfanNfdG9rZW5zLFxuIyAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyxcbiMgICBzdW1tYXJpemUsICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3dhbGtfanNfdG9rZW5zKClcblBBVEggICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG5GUyAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBjcmVhdGVSZXF1aXJlLFxuICBmaW5kUGFja2FnZUpTT04sICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHBhdGhUb0ZpbGVVUkwsICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1cmwnXG4jIHsgcmVnaXN0ZXIsICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgeyBzdHJpcFR5cGVTY3JpcHRUeXBlcywgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IGlzQnVpbHRpbiwgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIGlzQnVpbHRpbignbm9kZTpmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignZnMnKTsgLy8gdHJ1ZVxuIyBpc0J1aWx0aW4oJ3dzcycpOyAvLyBmYWxzZVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IHdhcm4sXG4gIGluZm8sXG4gIGRlYnVnLFxuICB3aGlzcGVyLCAgICAgICAgICAgICAgfSA9IGRvIFxcXG5yZXF1aXJlX2NvbnNvbGVfb3V0cHV0ID0gLT5cbiAgbGluZV93aWR0aCA9IGlmIHByb2Nlc3Muc3Rkb3V0LmlzVFRZIHRoZW4gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucyBlbHNlIDEwOFxuICBwZW4gPSAoIFAuLi4gKSAtPlxuICAgIHRleHQgPSAoIFwiI3twfVwiIGZvciBwIGluIFAgKS5qb2luICcgJ1xuICAgICAjICggc3RyaXBfYW5zaSB0ZXh0ICkubGVuZ3RoXG4gICAgcmV0dXJuIHRleHQucGFkRW5kIGxpbmVfd2lkdGgsICcgJ1xuICB3YXJuID0gKCBQLi4uICkgLT5cbiAgICBjb25zb2xlLmxvZyBcIiN7Qy5iZ19uYXZ5fSN7Qy5yZWR9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgaW5mbyA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfaG9uZXlkZXd9I3tDLmJsYWNrfSN7Qy5ib2xkfSN7cGVuIFAuLi59I3tDLmJvbGQwfSN7Qy5kZWZhdWx0fSN7Qy5iZ19kZWZhdWx0fVwiXG4gIHdoaXNwZXIgPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX3NsYXRlZ3JheX0je0MuYmxhY2t9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgZGVidWcgPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX3Zpb2xldH0je0Mud2hpdGV9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgcmV0dXJuIGV4cG9ydHMgPSB7IHBlbiwgd2FybiwgaW5mbywgd2hpc3BlciwgZGVidWcsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRlYnVnIFwizqlMUlNfX18xIOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlFwiXG5cblxuIyMjIE5PVEU6IGl0J3MgcG9zc2libGUgdG8gdXNlIGN1c3RvbWl6ZWQgbG9naWMgZm9yIGByZXF1aXJlKClgICMjI1xuIyB7IHJlZ2lzdGVySG9va3MsICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHJlZ2lzdGVySG9va3Mge1xuIyAgIHJlc29sdmU6ICAoIHNwZWNpZmllciwgY29udGV4dCwgbmV4dFJlc29sdmUgKSAtPlxuIyAgICAgZGVidWcgJ86pTFJTX19fMicsIHsgIHNwZWNpZmllciwgY29udGV4dCwgbmV4dFJlc29sdmUsIH1cbiMgICAgIGlmIHNwZWNpZmllciBpcyAnYnJpYzpwYWNrYWdlLmpzb24nXG4jICAgICAgIHJldHVybiBuZXh0UmVzb2x2ZSAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9wYWNrYWdlLmpzb24nXG4jICAgICByZXR1cm4gbmV4dFJlc29sdmUgc3BlY2lmaWVyXG4jICAgIyBsb2FkOiAgICAgKCB1cmwsIGNvbnRleHQsIG5leHRMb2FkICkgLT5cbiMgICAjICAgZGVidWcgJ86pTFJTX19fMycsIHsgIHVybCwgY29udGV4dCwgbmV4dExvYWQsIH1cbiMgICAjICAgcmV0dXJuIG5leHRMb2FkIHVybFxuIyAgICAgIyByZXR1cm4gbmV4dExvYWQgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvcGFja2FnZS5qc29uJ1xuIyAgIH1cbiMgZGVidWcgJ86pTFJTX19fNCcsICggcmVxdWlyZSAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9saWIvbWFpbi5qcycgKS52ZXJzaW9uXG4jIGRlYnVnICfOqUxSU19fXzUnLCAoIHJlcXVpcmUgJ2JyaWM6cGFja2FnZS5qc29uJyApLnZlcnNpb25cbiMgIyBkZWJ1ZyAnzqlMUlNfX182JywgKCByZXF1aXJlICdicmljOnBhY2thZ2UnICkudmVyc2lvblxuIyAjIHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuXG5zb3VyY2VfcGF0aCA9IHByb2Nlc3MuYXJndlsgMiBdXG4jIHNvdXJjZV9wYXRoID0gX19maWxlbmFtZVxuZGVidWcgXCLOqUxSU19fXzcgdXNpbmcgc291cmNlIHBhdGg6ICAje3NvdXJjZV9wYXRofVwiXG5cbmNvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgPSAoIHBhdGggKSAtPlxuICBzZWVuX3BhdGhzICA9IG5ldyBTZXQoKVxuICBSICAgICAgICAgICA9IFtdXG4gIHJldHVybiBfY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBwYXRoLCBSLCBzZWVuX3BhdGhzXG5cbl9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoLCBjb2xsZWN0b3IsIHNlZW5fcGF0aHMgKSAtPlxuICBjdXN0b21fcmVxdWlyZSAgPSBjcmVhdGVSZXF1aXJlIHBhdGhcbiAgZm9yIHsgdHlwZSwgZGlzcG9zaXRpb24sIHNlbGVjdG9yLCB9IGZyb20gd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgeyBwYXRoLCB9ICMgTk9URSBjYW4gZXhwbGljaXRseSBnaXZlIHNvdXJjZVxuICAgIHN3aXRjaCB0eXBlXG4gICAgICB3aGVuICdyZXF1aXJlJ1xuICAgICAgICBzd2l0Y2ggZGlzcG9zaXRpb25cbiAgICAgICAgICB3aGVuICdub2RlJ1xuICAgICAgICAgICAgd2FybiBcIs6pTFJTX19fOCBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAnbnBtJ1xuICAgICAgICAgICAgd2FybiBcIs6pTFJTX19fOSBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAnaW5zaWRlJywgJ291dHNpZGUnXG4gICAgICAgICAgICBkZXBlbmRlbnRfcGF0aCA9IGN1c3RvbV9yZXF1aXJlLnJlc29sdmUgc2VsZWN0b3JcbiAgICAgICAgICAgIHdoaXNwZXIgJ86pTFJTX18xMCcsIFwiKCN7ZGlzcG9zaXRpb259KSAje3BhdGh9IC0+ICN7ZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIGlmIHNlZW5fcGF0aHMuaGFzIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqlMUlNfXzExIGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmN5IGZyb20gI3tycHIgcGF0aH0gdG8gI3tycHIgZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIHNlZW5fcGF0aHMuYWRkIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTInLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3IsIHBhdGhcbiAgICAgICAgICAgICMgZGVidWcgJ86pTFJTX18xMycsIGZpbmRQYWNrYWdlSlNPTiBwYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTQnLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3JcbiAgICAgICAgICAgIGNvbGxlY3Rvci5wdXNoIHsgZGlzcG9zaXRpb24sIHNvdXJjZV9wYXRoOiBwYXRoLCBwYXRoOiBkZXBlbmRlbnRfcGF0aCwgc2VsZWN0b3IsIH1cbiAgICAgICAgICAgIF9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzIGRlcGVuZGVudF9wYXRoLCBjb2xsZWN0b3IsIHNlZW5fcGF0aHNcbiAgICAgICAgICAjIHdoZW4gJ291dHNpZGUnXG4gICAgICAgICAgIyAgIHdhcm4gXCLOqUxSU19fMTUgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ3VucmVzb2x2ZWQnXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfXzE2IGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgIGVsc2VcbiAgICAgICAgd2FybiBcIs6pTFJTX18xNyBpZ25vcmluZyByZXF1aXJlIHN0YXRlbWVudCB3aXRoIHR5cGUgI3tycHIgdHlwZX1cIlxuICByZXR1cm4gY29sbGVjdG9yXG5cbmRlcGVuZGVuY2llcyA9IGNvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgc291cmNlX3BhdGhcbiMgaW5mbyAnzqlMUlNfXzE4JywgKCBycHIgZC5wYXRoICksICggXCIoI3tycHIgZC5zZWxlY3Rvcn0pXCIgKSBmb3IgZCBpbiBkZXBlbmRlbmNpZXNcbiMgY3dkICAgICAgICAgPSBwcm9jZXNzLmN3ZCgpXG57IFNoZWxsLCAgfSA9IHJlcXVpcmUgJy4uLy4uLy4uL2J2ZnMnXG5yZW1vdGVfdXJscyA9IHt9XG5yb3dzICAgICAgICA9IFtdXG4jLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbmZvciBkIGluIGRlcGVuZGVuY2llc1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGN3ZCA9IFBBVEguZGlybmFtZSBkLnBhdGhcbiAgdW5sZXNzICggcmVtb3RlX3VybCA9IHJlbW90ZV91cmxzWyBjd2QgXSApP1xuICAgIHNoID0gbmV3IFNoZWxsIHsgY3dkLCBsaW5lczogZmFsc2UsIG9ubHlfc3Rkb3V0OiB0cnVlLCB9XG4gICAgdHJ5XG4gICAgICByZW1vdGVfdXJsICAgICAgICAgID0gc2guY2FsbCAnZ2l0JywgJ2NvbmZpZycsICctLWdldCcsICdyZW1vdGUub3JpZ2luLnVybCdcbiAgICAgIHJlbW90ZV91cmxzWyBjd2QgXSAgPSByZW1vdGVfdXJsXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIHdhcm4gJ86pTFJTX18xOScsIGVycm9yLm1lc3NhZ2VcbiAgICAgIHJlbW90ZV91cmwgICAgICAgICAgPSAnP3Vua25vd24/J1xuICAgICAgcmVtb3RlX3VybHNbIGN3ZCBdICA9IHJlbW90ZV91cmxcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzb3VyY2VfcmVscGF0aCAgICA9IFBBVEgucmVsYXRpdmUgY3dkLCBkLnNvdXJjZV9wYXRoXG4gIHRhcmdldF9wYXRoICAgICAgID0gUEFUSC5yZXNvbHZlICggUEFUSC5kaXJuYW1lIGQuc291cmNlX3BhdGggKSwgZC5zZWxlY3RvclxuICByb3dzLnB1c2ggICAgICAgICAgIHsgc291cmNlX3JlbHBhdGgsIHNlbGVjdG9yOiBkLnNlbGVjdG9yLCB0YXJnZXRfcGF0aCwgcmVtb3RlX3VybCwgfVxuICBpbmZvICfOqUxSU19fMjAnLCBkLmRpc3Bvc2l0aW9uLCBzb3VyY2VfcmVscGF0aCwgdGFyZ2V0X3BhdGgsIGQuc2VsZWN0b3IsIHJlbW90ZV91cmxcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxucm93cy5zb3J0ICggYSwgYiApIC0+XG4gIHJldHVybiArMSBpZiBhLnJlbW90ZV91cmwgID4gYi5yZW1vdGVfdXJsXG4gIHJldHVybiAtMSBpZiBhLnJlbW90ZV91cmwgIDwgYi5yZW1vdGVfdXJsXG4gIHJldHVybiArMSBpZiBhLnRhcmdldF9wYXRoID4gYi50YXJnZXRfcGF0aFxuICByZXR1cm4gLTEgaWYgYS50YXJnZXRfcGF0aCA8IGIudGFyZ2V0X3BhdGhcbiAgcmV0dXJuIDBcbmNvbnNvbGUudGFibGUgT2JqZWN0LmZyb21FbnRyaWVzICggWyBpZHggKyAxLCByb3csIF0gZm9yIHJvdywgaWR4IGluIHJvd3MgKVxuXG4jIHNoZWxsX2NmZyA9IHsgY3dkOiAnL3RtcCcsIGxpbmVzOiBmYWxzZSwgb25seV9zdGRvdXQ6IHRydWUsIH1cblxuXG5cblxuIl19
