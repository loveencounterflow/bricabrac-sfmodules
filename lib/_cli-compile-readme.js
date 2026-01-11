(function() {
  'use strict';
  var FS, PATH, append, base_path, clear, debug, dirname, file_has_uncommitted_changes, groups, insert_line, insert_matcher, insert_path, insertion_ref_path, join, line, log, main_path, match, resolve, rpr, spawnSync, src_path, target_path, walk_lines_with_positions, warn, x, y;

  //===========================================================================================================
  FS = require('node:fs');

  PATH = require('node:path');

  ({resolve, join, dirname} = PATH);

  // { matchesGlob,          } = require
  ({walk_lines_with_positions} = (require('./unstable-fast-linereader-brics')).require_fast_linereader());

  ({warn, log, debug} = console);

  ({rpr} = (require('./loupe-brics')).require_loupe());

  ({spawnSync} = require('node:child_process'));

  /*
  base_path = PATH.resolve PATH.join __dirname, '..'
  pattern   = '*.md'
  entries   = FS.readdirSync base_path, { recursive: true, }
  entries.sort()
  for entry in entries
    continue unless ( FS.statSync entry ).isFile()
    continue unless PATH.matchesGlob entry, pattern
    debug 'Ωcrmmd___1', entry
  */
  //-----------------------------------------------------------------------------------------------------------
  file_has_uncommitted_changes = function(path) {
    var status;
    ({status} = spawnSync('git', ['diff', '--quiet', path], {
      cwd: base_path
    }));
    if (status === 0) {
      return false;
    }
    return true;
  };

  //-----------------------------------------------------------------------------------------------------------
  clear = function(path) {
    FS.writeFileSync(path, '');
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  append = function(path, text) {
    FS.appendFileSync(path, `${text}\n`);
    return null;
  };

  //===========================================================================================================
  base_path = resolve(join(__dirname, '..'));

  src_path = resolve(join(base_path, 'doc-src'));

  main_path = resolve(src_path, 'main.md');

  target_path = resolve(base_path, 'README.md');

  insertion_ref_path = resolve(dirname(main_path));

  insert_matcher = /^(?<command><!insert)\s+src=(?<path>[^>]+)>\s*$/; //(?<prefix>.*?)

  //===========================================================================================================
  debug('Ωcrmmd___2', {base_path, src_path, main_path});

  //===========================================================================================================
  if (file_has_uncommitted_changes(target_path)) {
    warn();
    warn("target file");
    warn(`  ${target_path}`);
    warn("has uncomitted changes; terminating");
    warn();
    process.exit(111);
  }

  //===========================================================================================================
  clear(target_path);

  for (x of walk_lines_with_positions(main_path)) {
    ({line} = x);
    // debug 'Ωcrmmd___3', rpr line
    if ((match = line.match(insert_matcher)) == null) {
      append(target_path, line);
      continue;
    }
    groups = {...match.groups};
    insert_path = resolve(join(insertion_ref_path, groups.path));
    debug('Ωcrmmd___4');
    debug('Ωcrmmd___5', groups);
    debug('Ωcrmmd___6', insert_path);
    //.........................................................................................................
    append(target_path, `<!-- BEGIN ${line} -->`);
    for (y of walk_lines_with_positions(insert_path)) {
      ({
        line: insert_line
      } = y);
      append(target_path, insert_line);
    }
    append(target_path, `<!-- END ${line} -->`);
  }

  //.........................................................................................................

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19jbGktY29tcGlsZS1yZWFkbWUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxrQkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSx5QkFBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQTs7O0VBR0EsRUFBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsSUFBQSxHQUE0QixPQUFBLENBQVEsV0FBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsRUFDRSxJQURGLEVBRUUsT0FGRixDQUFBLEdBRTRCLElBRjVCLEVBTEE7OztFQVNBLENBQUEsQ0FBRSx5QkFBRixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGtDQUFSLENBQUYsQ0FBOEMsQ0FBQyx1QkFBL0MsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsSUFBRixFQUNFLEdBREYsRUFFRSxLQUZGLENBQUEsR0FFNEIsT0FGNUI7O0VBR0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxTQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLG9CQUFSLENBQTVCLEVBZkE7Ozs7Ozs7Ozs7Ozs7RUE4QkEsNEJBQUEsR0FBK0IsUUFBQSxDQUFFLElBQUYsQ0FBQTtBQUMvQixRQUFBO0lBQUUsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUFjLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLENBQUUsTUFBRixFQUFVLFNBQVYsRUFBcUIsSUFBckIsQ0FBakIsRUFBK0M7TUFBRSxHQUFBLEVBQUs7SUFBUCxDQUEvQyxDQUFkO0lBQ0EsSUFBZ0IsTUFBQSxLQUFVLENBQTFCO0FBQUEsYUFBTyxNQUFQOztBQUNBLFdBQU87RUFIc0IsRUE5Qi9COzs7RUFvQ0EsS0FBQSxHQUFRLFFBQUEsQ0FBRSxJQUFGLENBQUE7SUFDTixFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFqQixFQUF1QixFQUF2QjtBQUNBLFdBQU87RUFGRCxFQXBDUjs7O0VBeUNBLE1BQUEsR0FBUyxRQUFBLENBQUUsSUFBRixFQUFRLElBQVIsQ0FBQTtJQUNQLEVBQUUsQ0FBQyxjQUFILENBQWtCLElBQWxCLEVBQXdCLENBQUEsQ0FBQSxDQUFHLElBQUgsQ0FBQSxFQUFBLENBQXhCO0FBQ0EsV0FBTztFQUZBLEVBekNUOzs7RUE4Q0EsU0FBQSxHQUFzQixPQUFBLENBQVEsSUFBQSxDQUFLLFNBQUwsRUFBZ0IsSUFBaEIsQ0FBUjs7RUFDdEIsUUFBQSxHQUFzQixPQUFBLENBQVEsSUFBQSxDQUFLLFNBQUwsRUFBZ0IsU0FBaEIsQ0FBUjs7RUFDdEIsU0FBQSxHQUFzQixPQUFBLENBQVEsUUFBUixFQUFrQixTQUFsQjs7RUFDdEIsV0FBQSxHQUFzQixPQUFBLENBQVEsU0FBUixFQUFtQixXQUFuQjs7RUFDdEIsa0JBQUEsR0FBc0IsT0FBQSxDQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVI7O0VBQ3RCLGNBQUEsR0FBc0Isa0RBbkR0Qjs7O0VBNkRBLEtBQUEsQ0FBTSxZQUFOLEVBQW9CLENBQUUsU0FBRixFQUFhLFFBQWIsRUFBdUIsU0FBdkIsQ0FBcEIsRUE3REE7OztFQWdFQSxJQUFHLDRCQUFBLENBQTZCLFdBQTdCLENBQUg7SUFDRSxJQUFBLENBQUE7SUFDQSxJQUFBLENBQUssYUFBTDtJQUNBLElBQUEsQ0FBSyxHQUFBLENBQUEsQ0FBSyxXQUFMLENBQUEsQ0FBTDtJQUNBLElBQUEsQ0FBSyxxQ0FBTDtJQUNBLElBQUEsQ0FBQTtJQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYixFQU5GO0dBaEVBOzs7RUEwRUEsS0FBQSxDQUFNLFdBQU47O0VBQ0EsS0FBQSx5Q0FBQTtLQUFJLENBQUUsSUFBRixPQUNKOztJQUNFLElBQU8sNENBQVA7TUFDRSxNQUFBLENBQU8sV0FBUCxFQUFvQixJQUFwQjtBQUNBLGVBRkY7O0lBR0EsTUFBQSxHQUFjLENBQUUsR0FBQSxLQUFLLENBQUMsTUFBUjtJQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsSUFBQSxDQUFLLGtCQUFMLEVBQXlCLE1BQU0sQ0FBQyxJQUFoQyxDQUFSO0lBQ2QsS0FBQSxDQUFNLFlBQU47SUFDQSxLQUFBLENBQU0sWUFBTixFQUFvQixNQUFwQjtJQUNBLEtBQUEsQ0FBTSxZQUFOLEVBQW9CLFdBQXBCLEVBUkY7O0lBVUUsTUFBQSxDQUFPLFdBQVAsRUFBb0IsQ0FBQSxXQUFBLENBQUEsQ0FBYyxJQUFkLENBQUEsSUFBQSxDQUFwQjtJQUNBLEtBQUEsMkNBQUE7T0FBb0M7UUFBRSxJQUFBLEVBQU07TUFBUjtNQUFwQyxNQUFBLENBQU8sV0FBUCxFQUFvQixXQUFwQjtJQUFBO0lBQ0EsTUFBQSxDQUFPLFdBQVAsRUFBb0IsQ0FBQSxTQUFBLENBQUEsQ0FBWSxJQUFaLENBQUEsSUFBQSxDQUFwQjtFQWJGOztFQTNFQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5GUyAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcblBBVEggICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG57IHJlc29sdmUsXG4gIGpvaW4sXG4gIGRpcm5hbWUsICAgICAgICAgICAgICB9ID0gUEFUSFxuIyB7IG1hdGNoZXNHbG9iLCAgICAgICAgICB9ID0gcmVxdWlyZVxueyB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1mYXN0LWxpbmVyZWFkZXItYnJpY3MnICkucmVxdWlyZV9mYXN0X2xpbmVyZWFkZXIoKVxueyB3YXJuLFxuICBsb2csXG4gIGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBycHIsICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9sb3VwZS1icmljcycgKS5yZXF1aXJlX2xvdXBlKClcbnsgc3Bhd25TeW5jLCAgICAgICAgICAgIH0gPSByZXF1aXJlICdub2RlOmNoaWxkX3Byb2Nlc3MnXG5cblxuIyMjXG5iYXNlX3BhdGggPSBQQVRILnJlc29sdmUgUEFUSC5qb2luIF9fZGlybmFtZSwgJy4uJ1xucGF0dGVybiAgID0gJyoubWQnXG5lbnRyaWVzICAgPSBGUy5yZWFkZGlyU3luYyBiYXNlX3BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCB9XG5lbnRyaWVzLnNvcnQoKVxuZm9yIGVudHJ5IGluIGVudHJpZXNcbiAgY29udGludWUgdW5sZXNzICggRlMuc3RhdFN5bmMgZW50cnkgKS5pc0ZpbGUoKVxuICBjb250aW51ZSB1bmxlc3MgUEFUSC5tYXRjaGVzR2xvYiBlbnRyeSwgcGF0dGVyblxuICBkZWJ1ZyAnzqljcm1tZF9fXzEnLCBlbnRyeVxuIyMjXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZmlsZV9oYXNfdW5jb21taXR0ZWRfY2hhbmdlcyA9ICggcGF0aCApIC0+XG4gIHsgc3RhdHVzLCB9ID0gc3Bhd25TeW5jICdnaXQnLCBbICdkaWZmJywgJy0tcXVpZXQnLCBwYXRoLCBdLCB7IGN3ZDogYmFzZV9wYXRoLCB9XG4gIHJldHVybiBmYWxzZSBpZiBzdGF0dXMgaXMgMFxuICByZXR1cm4gdHJ1ZVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsZWFyID0gKCBwYXRoICkgLT5cbiAgRlMud3JpdGVGaWxlU3luYyBwYXRoLCAnJ1xuICByZXR1cm4gbnVsbFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmFwcGVuZCA9ICggcGF0aCwgdGV4dCApIC0+XG4gIEZTLmFwcGVuZEZpbGVTeW5jIHBhdGgsIFwiI3t0ZXh0fVxcblwiXG4gIHJldHVybiBudWxsXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuYmFzZV9wYXRoICAgICAgICAgICA9IHJlc29sdmUgam9pbiBfX2Rpcm5hbWUsICcuLidcbnNyY19wYXRoICAgICAgICAgICAgPSByZXNvbHZlIGpvaW4gYmFzZV9wYXRoLCAnZG9jLXNyYydcbm1haW5fcGF0aCAgICAgICAgICAgPSByZXNvbHZlIHNyY19wYXRoLCAnbWFpbi5tZCdcbnRhcmdldF9wYXRoICAgICAgICAgPSByZXNvbHZlIGJhc2VfcGF0aCwgJ1JFQURNRS5tZCdcbmluc2VydGlvbl9yZWZfcGF0aCAgPSByZXNvbHZlIGRpcm5hbWUgbWFpbl9wYXRoXG5pbnNlcnRfbWF0Y2hlciAgICAgID0gLy8vXG4gIF5cbiAgIyg/PHByZWZpeD4uKj8pXG4gICg/PGNvbW1hbmQ+IDwhaW5zZXJ0IClcbiAgXFxzKyBzcmM9ICg/PHBhdGg+IFtePl0rICkgPlxuICBcXHMqXG4gICRcbiAgLy8vXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuZGVidWcgJ86pY3JtbWRfX18yJywgeyBiYXNlX3BhdGgsIHNyY19wYXRoLCBtYWluX3BhdGgsIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pZiBmaWxlX2hhc191bmNvbW1pdHRlZF9jaGFuZ2VzIHRhcmdldF9wYXRoXG4gIHdhcm4oKVxuICB3YXJuIFwidGFyZ2V0IGZpbGVcIlxuICB3YXJuIFwiICAje3RhcmdldF9wYXRofVwiXG4gIHdhcm4gXCJoYXMgdW5jb21pdHRlZCBjaGFuZ2VzOyB0ZXJtaW5hdGluZ1wiXG4gIHdhcm4oKVxuICBwcm9jZXNzLmV4aXQgMTExXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGVhciB0YXJnZXRfcGF0aFxuZm9yIHsgbGluZSwgfSBmcm9tIHdhbGtfbGluZXNfd2l0aF9wb3NpdGlvbnMgbWFpbl9wYXRoXG4gICMgZGVidWcgJ86pY3JtbWRfX18zJywgcnByIGxpbmVcbiAgdW5sZXNzICggbWF0Y2ggPSBsaW5lLm1hdGNoIGluc2VydF9tYXRjaGVyICk/XG4gICAgYXBwZW5kIHRhcmdldF9wYXRoLCBsaW5lXG4gICAgY29udGludWVcbiAgZ3JvdXBzICAgICAgPSB7IG1hdGNoLmdyb3Vwcy4uLiwgfVxuICBpbnNlcnRfcGF0aCA9IHJlc29sdmUgam9pbiBpbnNlcnRpb25fcmVmX3BhdGgsIGdyb3Vwcy5wYXRoXG4gIGRlYnVnICfOqWNybW1kX19fNCdcbiAgZGVidWcgJ86pY3JtbWRfX181JywgZ3JvdXBzXG4gIGRlYnVnICfOqWNybW1kX19fNicsIGluc2VydF9wYXRoXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgYXBwZW5kIHRhcmdldF9wYXRoLCBcIjwhLS0gQkVHSU4gI3tsaW5lfSAtLT5cIlxuICBhcHBlbmQgdGFyZ2V0X3BhdGgsIGluc2VydF9saW5lIGZvciB7IGxpbmU6IGluc2VydF9saW5lLCB9IGZyb20gd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyBpbnNlcnRfcGF0aFxuICBhcHBlbmQgdGFyZ2V0X3BhdGgsIFwiPCEtLSBFTkQgI3tsaW5lfSAtLT5cIlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG5cblxuXG5cblxuXG4iXX0=
