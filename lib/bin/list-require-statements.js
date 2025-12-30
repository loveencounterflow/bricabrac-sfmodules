(function() {
  'use strict';
  var C, FS, PATH, SFMODULES, Shell, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, cwd, d, debug, dependencies, error, findPackageJSON, i, info, len, remote_url, require_console_output, rpr, sh, shell_cfg, source_path, strip_ansi, type_of, walk_require_statements, warn, whisper;

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
              // debug 'ΩLRS__18', findPackageJSON selector, path
              // debug 'ΩLRS__18', findPackageJSON path
              // debug 'ΩLRS__18', findPackageJSON selector
              collector.push({
                disposition,
                source_path: path,
                path: dependent_path,
                selector
              });
              _collect_transitive_require_statements(dependent_path, collector, seen_paths);
              break;
            // when 'outside'
            //   warn "ΩLRS__12 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
            case 'unresolved':
              warn(`ΩLRS__13 ignoring module with disposition ${rpr(disposition)}: ${rpr(selector)}`);
          }
          break;
        default:
          warn(`ΩLRS__14 ignoring require statement with type ${rpr(type)}`);
      }
    }
    return collector;
  };

  dependencies = collect_transitive_require_statements(source_path);

  // info 'ΩLRS__15', ( rpr d.path ), ( "(#{rpr d.selector})" ) for d in dependencies
  cwd = process.cwd();

  for (i = 0, len = dependencies.length; i < len; i++) {
    d = dependencies[i];
    source_path = PATH.relative(cwd, d.source_path);
    info('ΩLRS__16', d.disposition, rpr(source_path), `(${rpr(d.selector)})`);
  }

  ({Shell} = require('../../../bvfs'));

  shell_cfg = {
    cwd: __dirname,
    lines: false,
    only_stdout: true
  };

  // shell_cfg = { cwd: '/tmp', lines: false, only_stdout: true, }
  sh = new Shell(shell_cfg);

  debug('ΩLRS__17', 'git config --get remote.origin.url');

  try {
    remote_url = sh.call('git', 'config', '--get', 'remote.origin.url');
    debug('ΩLRS__18', rpr(remote_url));
  } catch (error1) {
    error = error1;
    warn('ΩLRS__19', error.message);
    warn('ΩLRS__20', error.name);
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxzQ0FBQSxFQUFBLHFDQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxLQUFBLEVBQUEsZUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxzQkFBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLFdBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQSxFQUFBLHVCQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUE7Ozs7OztFQU1BLFNBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVI7O0VBRTVCLENBQUEsQ0FBQTs7SUFBRSx1QkFBQSxFQUNFO0VBREosQ0FBQSxHQUM0QixTQUFTLENBQUMsK0JBQVYsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsdUJBQUYsQ0FBQSxHQUM0QixTQUFTLENBQUMsZ0NBQVYsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxrQkFBVixDQUFBLENBQTVCLEVBZEE7Ozs7OztFQW1CQSxJQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSOztFQUM1QixFQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLEVBcEI1Qjs7O0VBc0JBLENBQUEsQ0FB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Q0FBQSxDQUFBLENBQUEsQ0FBSSxHQUFBLENBQUksQ0FBQyxDQUFDLFFBQU4sQ0FBSixDQUFBLENBQUEsQ0FBdkQ7RUFGRjs7RUFJQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVIsQ0FBYjs7RUFDQSxTQUFBLEdBQVk7SUFBRSxHQUFBLEVBQUssU0FBUDtJQUFrQixLQUFBLEVBQU8sS0FBekI7SUFBZ0MsV0FBQSxFQUFhO0VBQTdDLEVBMUhaOzs7RUE0SEEsRUFBQSxHQUFLLElBQUksS0FBSixDQUFVLFNBQVY7O0VBRUwsS0FBQSxDQUFNLFVBQU4sRUFBa0Isb0NBQWxCOztBQUNBO0lBQ0UsVUFBQSxHQUFhLEVBQUUsQ0FBQyxJQUFILENBQVEsS0FBUixFQUFlLFFBQWYsRUFBeUIsT0FBekIsRUFBa0MsbUJBQWxDO0lBQ2IsS0FBQSxDQUFNLFVBQU4sRUFBa0IsR0FBQSxDQUFJLFVBQUosQ0FBbEIsRUFGRjtHQUdBLGNBQUE7SUFBTTtJQUNKLElBQUEsQ0FBSyxVQUFMLEVBQWlCLEtBQUssQ0FBQyxPQUF2QjtJQUNBLElBQUEsQ0FBSyxVQUFMLEVBQWlCLEtBQUssQ0FBQyxJQUF2QixFQUZGOztBQWxJQSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBsb2csXG4jICAgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi9tYWluJ1xuIyBTRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNmbW9kdWxlcydcbnsgYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHM6IFxcXG4gICAgQywgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHMoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHMoKVxueyBzdHJpcF9hbnNpLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuIyB7IFNRTDogU0gsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZGJyaWMoKVxuIyB7IHdhbGtfanNfdG9rZW5zLFxuIyAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyxcbiMgICBzdW1tYXJpemUsICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX3dhbGtfanNfdG9rZW5zKClcblBBVEggICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG5GUyAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBjcmVhdGVSZXF1aXJlLFxuICBmaW5kUGFja2FnZUpTT04sICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHBhdGhUb0ZpbGVVUkwsICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTp1cmwnXG4jIHsgcmVnaXN0ZXIsICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgeyBzdHJpcFR5cGVTY3JpcHRUeXBlcywgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IGlzQnVpbHRpbiwgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIGlzQnVpbHRpbignbm9kZTpmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignZnMnKTsgLy8gdHJ1ZVxuIyBpc0J1aWx0aW4oJ3dzcycpOyAvLyBmYWxzZVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IHdhcm4sXG4gIGluZm8sXG4gIGRlYnVnLFxuICB3aGlzcGVyLCAgICAgICAgICAgICAgfSA9IGRvIFxcXG5yZXF1aXJlX2NvbnNvbGVfb3V0cHV0ID0gLT5cbiAgbGluZV93aWR0aCA9IGlmIHByb2Nlc3Muc3Rkb3V0LmlzVFRZIHRoZW4gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucyBlbHNlIDEwOFxuICBwZW4gPSAoIFAuLi4gKSAtPlxuICAgIHRleHQgPSAoIFwiI3twfVwiIGZvciBwIGluIFAgKS5qb2luICcgJ1xuICAgICAjICggc3RyaXBfYW5zaSB0ZXh0ICkubGVuZ3RoXG4gICAgcmV0dXJuIHRleHQucGFkRW5kIGxpbmVfd2lkdGgsICcgJ1xuICB3YXJuID0gKCBQLi4uICkgLT5cbiAgICBjb25zb2xlLmxvZyBcIiN7Qy5iZ19uYXZ5fSN7Qy5yZWR9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgaW5mbyA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfaG9uZXlkZXd9I3tDLmJsYWNrfSN7Qy5ib2xkfSN7cGVuIFAuLi59I3tDLmJvbGQwfSN7Qy5kZWZhdWx0fSN7Qy5iZ19kZWZhdWx0fVwiXG4gIHdoaXNwZXIgPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX3NsYXRlZ3JheX0je0MuYmxhY2t9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgZGVidWcgPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX3Zpb2xldH0je0Mud2hpdGV9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgcmV0dXJuIGV4cG9ydHMgPSB7IHBlbiwgd2FybiwgaW5mbywgd2hpc3BlciwgZGVidWcsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRlYnVnIFwizqlMUlNfX18xIOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlFwiXG5cblxuIyMjIE5PVEU6IGl0J3MgcG9zc2libGUgdG8gdXNlIGN1c3RvbWl6ZWQgbG9naWMgZm9yIGByZXF1aXJlKClgICMjI1xuIyB7IHJlZ2lzdGVySG9va3MsICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHJlZ2lzdGVySG9va3Mge1xuIyAgIHJlc29sdmU6ICAoIHNwZWNpZmllciwgY29udGV4dCwgbmV4dFJlc29sdmUgKSAtPlxuIyAgICAgZGVidWcgJ86pTFJTX19fMicsIHsgIHNwZWNpZmllciwgY29udGV4dCwgbmV4dFJlc29sdmUsIH1cbiMgICAgIGlmIHNwZWNpZmllciBpcyAnYnJpYzpwYWNrYWdlLmpzb24nXG4jICAgICAgIHJldHVybiBuZXh0UmVzb2x2ZSAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9wYWNrYWdlLmpzb24nXG4jICAgICByZXR1cm4gbmV4dFJlc29sdmUgc3BlY2lmaWVyXG4jICAgIyBsb2FkOiAgICAgKCB1cmwsIGNvbnRleHQsIG5leHRMb2FkICkgLT5cbiMgICAjICAgZGVidWcgJ86pTFJTX19fMycsIHsgIHVybCwgY29udGV4dCwgbmV4dExvYWQsIH1cbiMgICAjICAgcmV0dXJuIG5leHRMb2FkIHVybFxuIyAgICAgIyByZXR1cm4gbmV4dExvYWQgJy9ob21lL2Zsb3cvanpyL2JyaWNhYnJhYy1zZm1vZHVsZXMvcGFja2FnZS5qc29uJ1xuIyAgIH1cbiMgZGVidWcgJ86pTFJTX19fNCcsICggcmVxdWlyZSAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9saWIvbWFpbi5qcycgKS52ZXJzaW9uXG4jIGRlYnVnICfOqUxSU19fXzUnLCAoIHJlcXVpcmUgJ2JyaWM6cGFja2FnZS5qc29uJyApLnZlcnNpb25cbiMgIyBkZWJ1ZyAnzqlMUlNfX182JywgKCByZXF1aXJlICdicmljOnBhY2thZ2UnICkudmVyc2lvblxuIyAjIHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuXG5zb3VyY2VfcGF0aCA9IHByb2Nlc3MuYXJndlsgMiBdXG4jIHNvdXJjZV9wYXRoID0gX19maWxlbmFtZVxuZGVidWcgXCLOqUxSU19fXzcgdXNpbmcgc291cmNlIHBhdGg6ICAje3NvdXJjZV9wYXRofVwiXG5cbmNvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgPSAoIHBhdGggKSAtPlxuICBzZWVuX3BhdGhzICA9IG5ldyBTZXQoKVxuICBSICAgICAgICAgICA9IFtdXG4gIHJldHVybiBfY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyBwYXRoLCBSLCBzZWVuX3BhdGhzXG5cbl9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzID0gKCBwYXRoLCBjb2xsZWN0b3IsIHNlZW5fcGF0aHMgKSAtPlxuICBjdXN0b21fcmVxdWlyZSAgPSBjcmVhdGVSZXF1aXJlIHBhdGhcbiAgZm9yIHsgdHlwZSwgZGlzcG9zaXRpb24sIHNlbGVjdG9yLCB9IGZyb20gd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMgeyBwYXRoLCB9ICMgTk9URSBjYW4gZXhwbGljaXRseSBnaXZlIHNvdXJjZVxuICAgIHN3aXRjaCB0eXBlXG4gICAgICB3aGVuICdyZXF1aXJlJ1xuICAgICAgICBzd2l0Y2ggZGlzcG9zaXRpb25cbiAgICAgICAgICB3aGVuICdub2RlJ1xuICAgICAgICAgICAgd2FybiBcIs6pTFJTX19fOCBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAnbnBtJ1xuICAgICAgICAgICAgd2FybiBcIs6pTFJTX19fOSBpZ25vcmluZyBtb2R1bGUgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkaXNwb3NpdGlvbn06ICN7cnByIHNlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAnaW5zaWRlJywgJ291dHNpZGUnXG4gICAgICAgICAgICBkZXBlbmRlbnRfcGF0aCA9IGN1c3RvbV9yZXF1aXJlLnJlc29sdmUgc2VsZWN0b3JcbiAgICAgICAgICAgIHdoaXNwZXIgJ86pTFJTX18xMCcsIFwiKCN7ZGlzcG9zaXRpb259KSAje3BhdGh9IC0+ICN7ZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIGlmIHNlZW5fcGF0aHMuaGFzIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqlMUlNfXzExIGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmN5IGZyb20gI3tycHIgcGF0aH0gdG8gI3tycHIgZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIHNlZW5fcGF0aHMuYWRkIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTgnLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3IsIHBhdGhcbiAgICAgICAgICAgICMgZGVidWcgJ86pTFJTX18xOCcsIGZpbmRQYWNrYWdlSlNPTiBwYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTgnLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3JcbiAgICAgICAgICAgIGNvbGxlY3Rvci5wdXNoIHsgZGlzcG9zaXRpb24sIHNvdXJjZV9wYXRoOiBwYXRoLCBwYXRoOiBkZXBlbmRlbnRfcGF0aCwgc2VsZWN0b3IsIH1cbiAgICAgICAgICAgIF9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzIGRlcGVuZGVudF9wYXRoLCBjb2xsZWN0b3IsIHNlZW5fcGF0aHNcbiAgICAgICAgICAjIHdoZW4gJ291dHNpZGUnXG4gICAgICAgICAgIyAgIHdhcm4gXCLOqUxSU19fMTIgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ3VucmVzb2x2ZWQnXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfXzEzIGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgIGVsc2VcbiAgICAgICAgd2FybiBcIs6pTFJTX18xNCBpZ25vcmluZyByZXF1aXJlIHN0YXRlbWVudCB3aXRoIHR5cGUgI3tycHIgdHlwZX1cIlxuICByZXR1cm4gY29sbGVjdG9yXG5cbmRlcGVuZGVuY2llcyA9IGNvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgc291cmNlX3BhdGhcbiMgaW5mbyAnzqlMUlNfXzE1JywgKCBycHIgZC5wYXRoICksICggXCIoI3tycHIgZC5zZWxlY3Rvcn0pXCIgKSBmb3IgZCBpbiBkZXBlbmRlbmNpZXNcbmN3ZCAgICAgICAgID0gcHJvY2Vzcy5jd2QoKVxuZm9yIGQgaW4gZGVwZW5kZW5jaWVzXG4gIHNvdXJjZV9wYXRoID0gUEFUSC5yZWxhdGl2ZSBjd2QsIGQuc291cmNlX3BhdGhcbiAgaW5mbyAnzqlMUlNfXzE2JywgZC5kaXNwb3NpdGlvbiwgKCBycHIgc291cmNlX3BhdGggKSwgKCBcIigje3JwciBkLnNlbGVjdG9yfSlcIiApXG5cbnsgU2hlbGwsIH0gPSByZXF1aXJlICcuLi8uLi8uLi9idmZzJ1xuc2hlbGxfY2ZnID0geyBjd2Q6IF9fZGlybmFtZSwgbGluZXM6IGZhbHNlLCBvbmx5X3N0ZG91dDogdHJ1ZSwgfVxuIyBzaGVsbF9jZmcgPSB7IGN3ZDogJy90bXAnLCBsaW5lczogZmFsc2UsIG9ubHlfc3Rkb3V0OiB0cnVlLCB9XG5zaCA9IG5ldyBTaGVsbCBzaGVsbF9jZmdcblxuZGVidWcgJ86pTFJTX18xNycsICdnaXQgY29uZmlnIC0tZ2V0IHJlbW90ZS5vcmlnaW4udXJsJ1xudHJ5XG4gIHJlbW90ZV91cmwgPSBzaC5jYWxsICdnaXQnLCAnY29uZmlnJywgJy0tZ2V0JywgJ3JlbW90ZS5vcmlnaW4udXJsJ1xuICBkZWJ1ZyAnzqlMUlNfXzE4JywgcnByIHJlbW90ZV91cmxcbmNhdGNoIGVycm9yXG4gIHdhcm4gJ86pTFJTX18xOScsIGVycm9yLm1lc3NhZ2VcbiAgd2FybiAnzqlMUlNfXzIwJywgZXJyb3IubmFtZVxuXG5cblxuIl19
