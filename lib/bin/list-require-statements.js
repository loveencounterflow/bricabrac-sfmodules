(function() {
  'use strict';
  var C, FS, PATH, Shell, _collect_transitive_require_statements, collect_transitive_require_statements, createRequire, cwd, d, debug, dependencies, error, findPackageJSON, i, idx, info, j, len, len1, process_cwd, remote_url, remote_urls, require_console_output, row, rows, rpr, sh, source_path, source_relpath, strip_ansi, target_path, type_of, walk_require_statements, warn, whisper;

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
              // warn "ΩLRS___9 ignoring module with disposition #{rpr disposition}: #{rpr selector}"
              collector.push({
                disposition,
                source_path: path,
                path: null,
                selector
              });
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
    source_relpath = PATH.relative(process_cwd, d.source_path);
    //.........................................................................................................
    switch (d.disposition) {
      case 'inside':
      case 'outside':
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
        target_path = PATH.resolve(PATH.dirname(d.source_path), d.selector);
        rows.push({
          disposition: d.disposition,
          source_relpath,
          selector: d.selector,
          target_path,
          remote_url,
          annotation: d.annotation
        });
        break;
      case 'npm':
        rows.push({
          disposition: d.disposition,
          source_relpath,
          selector: d.selector,
          target_path: null,
          remote_url: null,
          annotation: d.annotation
        });
        break;
      default:
        warn(`ΩLRS__20 ignoring row with disposition ${rpr(d.disposition)}`);
    }
    info('ΩLRS__21', d.disposition, source_relpath, target_path, d.selector, remote_url);
  }

  //...........................................................................................................
  rows.sort(function(a, b) {
    if (a.disposition > b.disposition) {
      return +1;
    }
    if (a.disposition < b.disposition) {
      return -1;
    }
    if (a.source_relpath > b.source_relpath) {
      return +1;
    }
    if (a.source_relpath < b.source_relpath) {
      return -1;
    }
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

  for (j = 0, len1 = rows.length; j < len1; j++) {
    row = rows[j];
    delete row.remote_url;
    delete row.annotation;
  }

  console.table(Object.fromEntries((function() {
    var k, len2, results;
    results = [];
    for (idx = k = 0, len2 = rows.length; k < len2; idx = ++k) {
      row = rows[idx];
      results.push([idx + 1, row]);
    }
    return results;
  })()));

  // shell_cfg = { cwd: '/tmp', lines: false, only_stdout: true, }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jpbi9saXN0LXJlcXVpcmUtc3RhdGVtZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7RUFBQTtBQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLHNDQUFBLEVBQUEscUNBQUEsRUFBQSxhQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLEtBQUEsRUFBQSxlQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsV0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsc0JBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsRUFBQSx1QkFBQSxFQUFBLElBQUEsRUFBQTs7RUFNQSxDQUFBLENBQUE7Ozs7O0lBQUUsdUJBQUEsRUFDRTtFQURKLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsK0JBQTVCLENBQUEsQ0FENUI7O0VBRUEsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSwrQkFBUixDQUFGLENBQTJDLENBQUMsZUFBNUMsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLCtCQUFSLENBQUYsQ0FBMkMsQ0FBQyxZQUE1QyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSx1QkFBRixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLG1DQUFSLENBQUYsQ0FBK0MsQ0FBQyxnQ0FBaEQsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQTRCLENBQUUs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LENBQUMsRUFBUjs7SUFDQSxJQUFhLENBQUMsQ0FBQyxXQUFGLEdBQW1CLENBQUMsQ0FBQyxXQUFsQztBQUFBLGFBQU8sQ0FBQyxFQUFSOztBQUNBLFdBQU87RUFUQyxDQUFWOztFQVVBLEtBQUEsd0NBQUE7O0lBQ0UsT0FBTyxHQUFHLENBQUM7SUFDWCxPQUFPLEdBQUcsQ0FBQztFQUZiOztFQUdBLE9BQU8sQ0FBQyxLQUFSLENBQWMsTUFBTSxDQUFDLFdBQVA7O0FBQXFCO0lBQUEsS0FBQSxvREFBQTs7bUJBQUEsQ0FBRSxHQUFBLEdBQU0sQ0FBUixFQUFXLEdBQVg7SUFBQSxDQUFBOztNQUFyQixDQUFkOztFQTFKQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG5cblxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGxvZyxcbiMgICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogXFxcbiAgICBDLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4uL2Fuc2ktYnJpY3MnICkucmVxdWlyZV9hbnNpX2NvbG9yc19hbmRfZWZmZWN0cygpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9ICggcmVxdWlyZSAnLi4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV9zaG93KClcbnsgd2Fsa19yZXF1aXJlX3N0YXRlbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuLi9wYXJzZS1yZXF1aXJlLXN0YXRlbWVudHMuYnJpY3MnICkucmVxdWlyZV9wYXJzZV9yZXF1aXJlX3N0YXRlbWVudHMoKVxueyBzdHJpcF9hbnNpLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi4vYW5zaS1icmljcycgKS5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuUEFUSCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbkZTICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IGNyZWF0ZVJlcXVpcmUsXG4gIGZpbmRQYWNrYWdlSlNPTiwgICAgICB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgcGF0aFRvRmlsZVVSTCwgICAgICAgIH0gPSByZXF1aXJlICdub2RlOnVybCdcbiMgeyByZWdpc3RlciwgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ25vZGU6bW9kdWxlJ1xuIyB7IHN0cmlwVHlwZVNjcmlwdFR5cGVzLCB9ID0gcmVxdWlyZSAnbm9kZTptb2R1bGUnXG4jIHsgaXNCdWlsdGluLCAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgaXNCdWlsdGluKCdub2RlOmZzJyk7IC8vIHRydWVcbiMgaXNCdWlsdGluKCdmcycpOyAvLyB0cnVlXG4jIGlzQnVpbHRpbignd3NzJyk7IC8vIGZhbHNlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgd2FybixcbiAgaW5mbyxcbiAgZGVidWcsXG4gIHdoaXNwZXIsICAgICAgICAgICAgICB9ID0gZG8gXFxcbnJlcXVpcmVfY29uc29sZV9vdXRwdXQgPSAtPlxuICBsaW5lX3dpZHRoID0gaWYgcHJvY2Vzcy5zdGRvdXQuaXNUVFkgdGhlbiBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zIGVsc2UgMTA4XG4gIHBlbiA9ICggUC4uLiApIC0+XG4gICAgdGV4dCA9ICggXCIje3B9XCIgZm9yIHAgaW4gUCApLmpvaW4gJyAnXG4gICAgICMgKCBzdHJpcF9hbnNpIHRleHQgKS5sZW5ndGhcbiAgICByZXR1cm4gdGV4dC5wYWRFbmQgbGluZV93aWR0aCwgJyAnXG4gIHdhcm4gPSAoIFAuLi4gKSAtPlxuICAgIGNvbnNvbGUubG9nIFwiI3tDLmJnX25hdnl9I3tDLnJlZH0je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICBpbmZvID0gKCBQLi4uICkgLT5cbiAgICBjb25zb2xlLmxvZyBcIiN7Qy5iZ19ob25leWRld30je0MuYmxhY2t9I3tDLmJvbGR9I3twZW4gUC4uLn0je0MuYm9sZDB9I3tDLmRlZmF1bHR9I3tDLmJnX2RlZmF1bHR9XCJcbiAgd2hpc3BlciA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfc2xhdGVncmF5fSN7Qy5ibGFja30je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICBkZWJ1ZyA9ICggUC4uLiApIC0+XG4gICAgY29uc29sZS5sb2cgXCIje0MuYmdfdmlvbGV0fSN7Qy53aGl0ZX0je0MuYm9sZH0je3BlbiBQLi4ufSN7Qy5ib2xkMH0je0MuZGVmYXVsdH0je0MuYmdfZGVmYXVsdH1cIlxuICByZXR1cm4gZXhwb3J0cyA9IHsgcGVuLCB3YXJuLCBpbmZvLCB3aGlzcGVyLCBkZWJ1ZywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGVidWcgXCLOqUxSU19fXzEg4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUXCJcblxuXG4jIyMgTk9URTogaXQncyBwb3NzaWJsZSB0byB1c2UgY3VzdG9taXplZCBsb2dpYyBmb3IgYHJlcXVpcmUoKWAgIyMjXG4jIHsgcmVnaXN0ZXJIb29rcywgICAgICAgIH0gPSByZXF1aXJlICdub2RlOm1vZHVsZSdcbiMgcmVnaXN0ZXJIb29rcyB7XG4jICAgcmVzb2x2ZTogICggc3BlY2lmaWVyLCBjb250ZXh0LCBuZXh0UmVzb2x2ZSApIC0+XG4jICAgICBkZWJ1ZyAnzqlMUlNfX18yJywgeyAgc3BlY2lmaWVyLCBjb250ZXh0LCBuZXh0UmVzb2x2ZSwgfVxuIyAgICAgaWYgc3BlY2lmaWVyIGlzICdicmljOnBhY2thZ2UuanNvbidcbiMgICAgICAgcmV0dXJuIG5leHRSZXNvbHZlICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL3BhY2thZ2UuanNvbidcbiMgICAgIHJldHVybiBuZXh0UmVzb2x2ZSBzcGVjaWZpZXJcbiMgICAjIGxvYWQ6ICAgICAoIHVybCwgY29udGV4dCwgbmV4dExvYWQgKSAtPlxuIyAgICMgICBkZWJ1ZyAnzqlMUlNfX18zJywgeyAgdXJsLCBjb250ZXh0LCBuZXh0TG9hZCwgfVxuIyAgICMgICByZXR1cm4gbmV4dExvYWQgdXJsXG4jICAgICAjIHJldHVybiBuZXh0TG9hZCAnL2hvbWUvZmxvdy9qenIvYnJpY2FicmFjLXNmbW9kdWxlcy9wYWNrYWdlLmpzb24nXG4jICAgfVxuIyBkZWJ1ZyAnzqlMUlNfX180JywgKCByZXF1aXJlICcvaG9tZS9mbG93L2p6ci9icmljYWJyYWMtc2Ztb2R1bGVzL2xpYi9tYWluLmpzJyApLnZlcnNpb25cbiMgZGVidWcgJ86pTFJTX19fNScsICggcmVxdWlyZSAnYnJpYzpwYWNrYWdlLmpzb24nICkudmVyc2lvblxuIyAjIGRlYnVnICfOqUxSU19fXzYnLCAoIHJlcXVpcmUgJ2JyaWM6cGFja2FnZScgKS52ZXJzaW9uXG4jICMgcmVxdWlyZSAnbm9kZTptb2R1bGUnXG5cbnNvdXJjZV9wYXRoID0gcHJvY2Vzcy5hcmd2WyAyIF1cbiMgc291cmNlX3BhdGggPSBfX2ZpbGVuYW1lXG5kZWJ1ZyBcIs6pTFJTX19fNyB1c2luZyBzb3VyY2UgcGF0aDogICN7c291cmNlX3BhdGh9XCJcblxuY29sbGVjdF90cmFuc2l0aXZlX3JlcXVpcmVfc3RhdGVtZW50cyA9ICggcGF0aCApIC0+XG4gIHNlZW5fcGF0aHMgID0gbmV3IFNldCgpXG4gIFIgICAgICAgICAgID0gW11cbiAgcmV0dXJuIF9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzIHBhdGgsIFIsIHNlZW5fcGF0aHNcblxuX2NvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgPSAoIHBhdGgsIGNvbGxlY3Rvciwgc2Vlbl9wYXRocyApIC0+XG4gIGN1c3RvbV9yZXF1aXJlICA9IGNyZWF0ZVJlcXVpcmUgcGF0aFxuICBmb3IgeyB0eXBlLCBkaXNwb3NpdGlvbiwgc2VsZWN0b3IsIH0gZnJvbSB3YWxrX3JlcXVpcmVfc3RhdGVtZW50cyB7IHBhdGgsIH0gIyBOT1RFIGNhbiBleHBsaWNpdGx5IGdpdmUgc291cmNlXG4gICAgc3dpdGNoIHR5cGVcbiAgICAgIHdoZW4gJ3JlcXVpcmUnXG4gICAgICAgIHN3aXRjaCBkaXNwb3NpdGlvblxuICAgICAgICAgIHdoZW4gJ25vZGUnXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfX184IGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICducG0nXG4gICAgICAgICAgICAjIHdhcm4gXCLOqUxSU19fXzkgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgICAgY29sbGVjdG9yLnB1c2ggeyBkaXNwb3NpdGlvbiwgc291cmNlX3BhdGg6IHBhdGgsIHBhdGg6IG51bGwsIHNlbGVjdG9yLCB9XG4gICAgICAgICAgd2hlbiAnaW5zaWRlJywgJ291dHNpZGUnXG4gICAgICAgICAgICBkZXBlbmRlbnRfcGF0aCA9IGN1c3RvbV9yZXF1aXJlLnJlc29sdmUgc2VsZWN0b3JcbiAgICAgICAgICAgIHdoaXNwZXIgJ86pTFJTX18xMCcsIFwiKCN7ZGlzcG9zaXRpb259KSAje3BhdGh9IC0+ICN7ZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIGlmIHNlZW5fcGF0aHMuaGFzIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAjICAgdGhyb3cgbmV3IEVycm9yIFwizqlMUlNfXzExIGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmN5IGZyb20gI3tycHIgcGF0aH0gdG8gI3tycHIgZGVwZW5kZW50X3BhdGh9XCJcbiAgICAgICAgICAgIHNlZW5fcGF0aHMuYWRkIGRlcGVuZGVudF9wYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTInLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3IsIHBhdGhcbiAgICAgICAgICAgICMgZGVidWcgJ86pTFJTX18xMycsIGZpbmRQYWNrYWdlSlNPTiBwYXRoXG4gICAgICAgICAgICAjIGRlYnVnICfOqUxSU19fMTQnLCBmaW5kUGFja2FnZUpTT04gc2VsZWN0b3JcbiAgICAgICAgICAgIGNvbGxlY3Rvci5wdXNoIHsgZGlzcG9zaXRpb24sIHNvdXJjZV9wYXRoOiBwYXRoLCBwYXRoOiBkZXBlbmRlbnRfcGF0aCwgc2VsZWN0b3IsIH1cbiAgICAgICAgICAgIF9jb2xsZWN0X3RyYW5zaXRpdmVfcmVxdWlyZV9zdGF0ZW1lbnRzIGRlcGVuZGVudF9wYXRoLCBjb2xsZWN0b3IsIHNlZW5fcGF0aHNcbiAgICAgICAgICAjIHdoZW4gJ291dHNpZGUnXG4gICAgICAgICAgIyAgIHdhcm4gXCLOqUxSU19fMTUgaWdub3JpbmcgbW9kdWxlIHdpdGggZGlzcG9zaXRpb24gI3tycHIgZGlzcG9zaXRpb259OiAje3JwciBzZWxlY3Rvcn1cIlxuICAgICAgICAgIHdoZW4gJ3VucmVzb2x2ZWQnXG4gICAgICAgICAgICB3YXJuIFwizqlMUlNfXzE2IGlnbm9yaW5nIG1vZHVsZSB3aXRoIGRpc3Bvc2l0aW9uICN7cnByIGRpc3Bvc2l0aW9ufTogI3tycHIgc2VsZWN0b3J9XCJcbiAgICAgIGVsc2VcbiAgICAgICAgd2FybiBcIs6pTFJTX18xNyBpZ25vcmluZyByZXF1aXJlIHN0YXRlbWVudCB3aXRoIHR5cGUgI3tycHIgdHlwZX1cIlxuICByZXR1cm4gY29sbGVjdG9yXG5cbmRlcGVuZGVuY2llcyA9IGNvbGxlY3RfdHJhbnNpdGl2ZV9yZXF1aXJlX3N0YXRlbWVudHMgc291cmNlX3BhdGhcbiMgaW5mbyAnzqlMUlNfXzE4JywgKCBycHIgZC5wYXRoICksICggXCIoI3tycHIgZC5zZWxlY3Rvcn0pXCIgKSBmb3IgZCBpbiBkZXBlbmRlbmNpZXNcbiMgY3dkICAgICAgICAgPSBwcm9jZXNzLmN3ZCgpXG57IFNoZWxsLCAgfSA9IHJlcXVpcmUgJy4uLy4uLy4uL2J2ZnMnXG5yZW1vdGVfdXJscyA9IHt9XG5yb3dzICAgICAgICA9IFtdXG5wcm9jZXNzX2N3ZCA9IHByb2Nlc3MuY3dkKClcbiMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuZm9yIGQgaW4gZGVwZW5kZW5jaWVzXG4gIHNvdXJjZV9yZWxwYXRoICAgID0gUEFUSC5yZWxhdGl2ZSBwcm9jZXNzX2N3ZCwgZC5zb3VyY2VfcGF0aFxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIHN3aXRjaCBkLmRpc3Bvc2l0aW9uXG4gICAgd2hlbiAnaW5zaWRlJywgJ291dHNpZGUnXG4gICAgICBjd2QgPSBQQVRILmRpcm5hbWUgZC5wYXRoXG4gICAgICB1bmxlc3MgKCByZW1vdGVfdXJsID0gcmVtb3RlX3VybHNbIGN3ZCBdICk/XG4gICAgICAgIHNoID0gbmV3IFNoZWxsIHsgY3dkLCBsaW5lczogZmFsc2UsIG9ubHlfc3Rkb3V0OiB0cnVlLCB9XG4gICAgICAgIHRyeVxuICAgICAgICAgIHJlbW90ZV91cmwgICAgICAgICAgPSBzaC5jYWxsICdnaXQnLCAnY29uZmlnJywgJy0tZ2V0JywgJ3JlbW90ZS5vcmlnaW4udXJsJ1xuICAgICAgICAgIHJlbW90ZV91cmxzWyBjd2QgXSAgPSByZW1vdGVfdXJsXG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgd2FybiAnzqlMUlNfXzE5JywgZXJyb3IubWVzc2FnZVxuICAgICAgICAgIHJlbW90ZV91cmwgICAgICAgICAgPSAnP3Vua25vd24/J1xuICAgICAgICAgIHJlbW90ZV91cmxzWyBjd2QgXSAgPSByZW1vdGVfdXJsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB0YXJnZXRfcGF0aCAgICAgICA9IFBBVEgucmVzb2x2ZSAoIFBBVEguZGlybmFtZSBkLnNvdXJjZV9wYXRoICksIGQuc2VsZWN0b3JcbiAgICAgIHJvd3MucHVzaCB7IGRpc3Bvc2l0aW9uOiBkLmRpc3Bvc2l0aW9uLCBzb3VyY2VfcmVscGF0aCwgc2VsZWN0b3I6IGQuc2VsZWN0b3IsIHRhcmdldF9wYXRoLCByZW1vdGVfdXJsLCBhbm5vdGF0aW9uOiBkLmFubm90YXRpb24sIH1cbiAgICB3aGVuICducG0nXG4gICAgICByb3dzLnB1c2ggeyBkaXNwb3NpdGlvbjogZC5kaXNwb3NpdGlvbiwgc291cmNlX3JlbHBhdGgsIHNlbGVjdG9yOiBkLnNlbGVjdG9yLCB0YXJnZXRfcGF0aDogbnVsbCwgcmVtb3RlX3VybDogbnVsbCwgYW5ub3RhdGlvbjogZC5hbm5vdGF0aW9uLCB9XG4gICAgZWxzZVxuICAgICAgd2FybiBcIs6pTFJTX18yMCBpZ25vcmluZyByb3cgd2l0aCBkaXNwb3NpdGlvbiAje3JwciBkLmRpc3Bvc2l0aW9ufVwiXG4gIGluZm8gJ86pTFJTX18yMScsIGQuZGlzcG9zaXRpb24sIHNvdXJjZV9yZWxwYXRoLCB0YXJnZXRfcGF0aCwgZC5zZWxlY3RvciwgcmVtb3RlX3VybFxuIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG5yb3dzLnNvcnQgKCBhLCBiICkgLT5cbiAgcmV0dXJuICsxIGlmIGEuZGlzcG9zaXRpb24gICAgPiBiLmRpc3Bvc2l0aW9uXG4gIHJldHVybiAtMSBpZiBhLmRpc3Bvc2l0aW9uICAgIDwgYi5kaXNwb3NpdGlvblxuICByZXR1cm4gKzEgaWYgYS5zb3VyY2VfcmVscGF0aCA+IGIuc291cmNlX3JlbHBhdGhcbiAgcmV0dXJuIC0xIGlmIGEuc291cmNlX3JlbHBhdGggPCBiLnNvdXJjZV9yZWxwYXRoXG4gIHJldHVybiArMSBpZiBhLnJlbW90ZV91cmwgICAgID4gYi5yZW1vdGVfdXJsXG4gIHJldHVybiAtMSBpZiBhLnJlbW90ZV91cmwgICAgIDwgYi5yZW1vdGVfdXJsXG4gIHJldHVybiArMSBpZiBhLnRhcmdldF9wYXRoICAgID4gYi50YXJnZXRfcGF0aFxuICByZXR1cm4gLTEgaWYgYS50YXJnZXRfcGF0aCAgICA8IGIudGFyZ2V0X3BhdGhcbiAgcmV0dXJuIDBcbmZvciByb3cgaW4gcm93c1xuICBkZWxldGUgcm93LnJlbW90ZV91cmxcbiAgZGVsZXRlIHJvdy5hbm5vdGF0aW9uXG5jb25zb2xlLnRhYmxlIE9iamVjdC5mcm9tRW50cmllcyAoIFsgaWR4ICsgMSwgcm93LCBdIGZvciByb3csIGlkeCBpbiByb3dzIClcblxuIyBzaGVsbF9jZmcgPSB7IGN3ZDogJy90bXAnLCBsaW5lczogZmFsc2UsIG9ubHlfc3Rkb3V0OiB0cnVlLCB9XG5cblxuXG5cbiJdfQ==
