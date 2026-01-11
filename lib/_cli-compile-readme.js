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
    // debug 'Ωcrmmd___4'
    // debug 'Ωcrmmd___5', groups
    log('Ωcrmmd___6', `inserting ${insert_path}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19jbGktY29tcGlsZS1yZWFkbWUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxrQkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSx5QkFBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQTs7O0VBR0EsRUFBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsSUFBQSxHQUE0QixPQUFBLENBQVEsV0FBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsRUFDRSxJQURGLEVBRUUsT0FGRixDQUFBLEdBRTRCLElBRjVCLEVBTEE7OztFQVNBLENBQUEsQ0FBRSx5QkFBRixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGtDQUFSLENBQUYsQ0FBOEMsQ0FBQyx1QkFBL0MsQ0FBQSxDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsSUFBRixFQUNFLEdBREYsRUFFRSxLQUZGLENBQUEsR0FFNEIsT0FGNUI7O0VBR0EsQ0FBQSxDQUFFLEdBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxlQUFSLENBQUYsQ0FBMkIsQ0FBQyxhQUE1QixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxTQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLG9CQUFSLENBQTVCLEVBZkE7Ozs7Ozs7Ozs7Ozs7RUE4QkEsNEJBQUEsR0FBK0IsUUFBQSxDQUFFLElBQUYsQ0FBQTtBQUMvQixRQUFBO0lBQUUsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUFjLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLENBQUUsTUFBRixFQUFVLFNBQVYsRUFBcUIsSUFBckIsQ0FBakIsRUFBK0M7TUFBRSxHQUFBLEVBQUs7SUFBUCxDQUEvQyxDQUFkO0lBQ0EsSUFBZ0IsTUFBQSxLQUFVLENBQTFCO0FBQUEsYUFBTyxNQUFQOztBQUNBLFdBQU87RUFIc0IsRUE5Qi9COzs7RUFvQ0EsS0FBQSxHQUFRLFFBQUEsQ0FBRSxJQUFGLENBQUE7SUFDTixFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFqQixFQUF1QixFQUF2QjtBQUNBLFdBQU87RUFGRCxFQXBDUjs7O0VBeUNBLE1BQUEsR0FBUyxRQUFBLENBQUUsSUFBRixFQUFRLElBQVIsQ0FBQTtJQUNQLEVBQUUsQ0FBQyxjQUFILENBQWtCLElBQWxCLEVBQXdCLENBQUEsQ0FBQSxDQUFHLElBQUgsQ0FBQSxFQUFBLENBQXhCO0FBQ0EsV0FBTztFQUZBLEVBekNUOzs7RUE4Q0EsU0FBQSxHQUFzQixPQUFBLENBQVEsSUFBQSxDQUFLLFNBQUwsRUFBZ0IsSUFBaEIsQ0FBUjs7RUFDdEIsUUFBQSxHQUFzQixPQUFBLENBQVEsSUFBQSxDQUFLLFNBQUwsRUFBZ0IsU0FBaEIsQ0FBUjs7RUFDdEIsU0FBQSxHQUFzQixPQUFBLENBQVEsUUFBUixFQUFrQixTQUFsQjs7RUFDdEIsV0FBQSxHQUFzQixPQUFBLENBQVEsU0FBUixFQUFtQixXQUFuQjs7RUFDdEIsa0JBQUEsR0FBc0IsT0FBQSxDQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVI7O0VBQ3RCLGNBQUEsR0FBc0Isa0RBbkR0Qjs7O0VBNkRBLEtBQUEsQ0FBTSxZQUFOLEVBQW9CLENBQUUsU0FBRixFQUFhLFFBQWIsRUFBdUIsU0FBdkIsQ0FBcEIsRUE3REE7OztFQWdFQSxJQUFHLDRCQUFBLENBQTZCLFdBQTdCLENBQUg7SUFDRSxJQUFBLENBQUE7SUFDQSxJQUFBLENBQUssYUFBTDtJQUNBLElBQUEsQ0FBSyxHQUFBLENBQUEsQ0FBSyxXQUFMLENBQUEsQ0FBTDtJQUNBLElBQUEsQ0FBSyxxQ0FBTDtJQUNBLElBQUEsQ0FBQTtJQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYixFQU5GO0dBaEVBOzs7RUEwRUEsS0FBQSxDQUFNLFdBQU47O0VBQ0EsS0FBQSx5Q0FBQTtLQUFJLENBQUUsSUFBRixPQUNKOztJQUNFLElBQU8sNENBQVA7TUFDRSxNQUFBLENBQU8sV0FBUCxFQUFvQixJQUFwQjtBQUNBLGVBRkY7O0lBR0EsTUFBQSxHQUFjLENBQUUsR0FBQSxLQUFLLENBQUMsTUFBUjtJQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsSUFBQSxDQUFLLGtCQUFMLEVBQXlCLE1BQU0sQ0FBQyxJQUFoQyxDQUFSLEVBTGhCOzs7SUFRRSxHQUFBLENBQUksWUFBSixFQUFrQixDQUFBLFVBQUEsQ0FBQSxDQUFhLFdBQWIsQ0FBQSxDQUFsQixFQVJGOztJQVVFLE1BQUEsQ0FBTyxXQUFQLEVBQW9CLENBQUEsV0FBQSxDQUFBLENBQWMsSUFBZCxDQUFBLElBQUEsQ0FBcEI7SUFDQSxLQUFBLDJDQUFBO09BQW9DO1FBQUUsSUFBQSxFQUFNO01BQVI7TUFBcEMsTUFBQSxDQUFPLFdBQVAsRUFBb0IsV0FBcEI7SUFBQTtJQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CLENBQUEsU0FBQSxDQUFBLENBQVksSUFBWixDQUFBLElBQUEsQ0FBcEI7RUFiRjs7RUEzRUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuRlMgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG5QQVRIICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xueyByZXNvbHZlLFxuICBqb2luLFxuICBkaXJuYW1lLCAgICAgICAgICAgICAgfSA9IFBBVEhcbiMgeyBtYXRjaGVzR2xvYiwgICAgICAgICAgfSA9IHJlcXVpcmVcbnsgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtZmFzdC1saW5lcmVhZGVyLWJyaWNzJyApLnJlcXVpcmVfZmFzdF9saW5lcmVhZGVyKClcbnsgd2FybixcbiAgbG9nLFxuICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IHNwYXduU3luYywgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTpjaGlsZF9wcm9jZXNzJ1xuXG5cbiMjI1xuYmFzZV9wYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBfX2Rpcm5hbWUsICcuLidcbnBhdHRlcm4gICA9ICcqLm1kJ1xuZW50cmllcyAgID0gRlMucmVhZGRpclN5bmMgYmFzZV9wYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgfVxuZW50cmllcy5zb3J0KClcbmZvciBlbnRyeSBpbiBlbnRyaWVzXG4gIGNvbnRpbnVlIHVubGVzcyAoIEZTLnN0YXRTeW5jIGVudHJ5ICkuaXNGaWxlKClcbiAgY29udGludWUgdW5sZXNzIFBBVEgubWF0Y2hlc0dsb2IgZW50cnksIHBhdHRlcm5cbiAgZGVidWcgJ86pY3JtbWRfX18xJywgZW50cnlcbiMjI1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZpbGVfaGFzX3VuY29tbWl0dGVkX2NoYW5nZXMgPSAoIHBhdGggKSAtPlxuICB7IHN0YXR1cywgfSA9IHNwYXduU3luYyAnZ2l0JywgWyAnZGlmZicsICctLXF1aWV0JywgcGF0aCwgXSwgeyBjd2Q6IGJhc2VfcGF0aCwgfVxuICByZXR1cm4gZmFsc2UgaWYgc3RhdHVzIGlzIDBcbiAgcmV0dXJuIHRydWVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGVhciA9ICggcGF0aCApIC0+XG4gIEZTLndyaXRlRmlsZVN5bmMgcGF0aCwgJydcbiAgcmV0dXJuIG51bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5hcHBlbmQgPSAoIHBhdGgsIHRleHQgKSAtPlxuICBGUy5hcHBlbmRGaWxlU3luYyBwYXRoLCBcIiN7dGV4dH1cXG5cIlxuICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmJhc2VfcGF0aCAgICAgICAgICAgPSByZXNvbHZlIGpvaW4gX19kaXJuYW1lLCAnLi4nXG5zcmNfcGF0aCAgICAgICAgICAgID0gcmVzb2x2ZSBqb2luIGJhc2VfcGF0aCwgJ2RvYy1zcmMnXG5tYWluX3BhdGggICAgICAgICAgID0gcmVzb2x2ZSBzcmNfcGF0aCwgJ21haW4ubWQnXG50YXJnZXRfcGF0aCAgICAgICAgID0gcmVzb2x2ZSBiYXNlX3BhdGgsICdSRUFETUUubWQnXG5pbnNlcnRpb25fcmVmX3BhdGggID0gcmVzb2x2ZSBkaXJuYW1lIG1haW5fcGF0aFxuaW5zZXJ0X21hdGNoZXIgICAgICA9IC8vL1xuICBeXG4gICMoPzxwcmVmaXg+Lio/KVxuICAoPzxjb21tYW5kPiA8IWluc2VydCApXG4gIFxccysgc3JjPSAoPzxwYXRoPiBbXj5dKyApID5cbiAgXFxzKlxuICAkXG4gIC8vL1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRlYnVnICfOqWNybW1kX19fMicsIHsgYmFzZV9wYXRoLCBzcmNfcGF0aCwgbWFpbl9wYXRoLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaWYgZmlsZV9oYXNfdW5jb21taXR0ZWRfY2hhbmdlcyB0YXJnZXRfcGF0aFxuICB3YXJuKClcbiAgd2FybiBcInRhcmdldCBmaWxlXCJcbiAgd2FybiBcIiAgI3t0YXJnZXRfcGF0aH1cIlxuICB3YXJuIFwiaGFzIHVuY29taXR0ZWQgY2hhbmdlczsgdGVybWluYXRpbmdcIlxuICB3YXJuKClcbiAgcHJvY2Vzcy5leGl0IDExMVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xlYXIgdGFyZ2V0X3BhdGhcbmZvciB7IGxpbmUsIH0gZnJvbSB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zIG1haW5fcGF0aFxuICAjIGRlYnVnICfOqWNybW1kX19fMycsIHJwciBsaW5lXG4gIHVubGVzcyAoIG1hdGNoID0gbGluZS5tYXRjaCBpbnNlcnRfbWF0Y2hlciApP1xuICAgIGFwcGVuZCB0YXJnZXRfcGF0aCwgbGluZVxuICAgIGNvbnRpbnVlXG4gIGdyb3VwcyAgICAgID0geyBtYXRjaC5ncm91cHMuLi4sIH1cbiAgaW5zZXJ0X3BhdGggPSByZXNvbHZlIGpvaW4gaW5zZXJ0aW9uX3JlZl9wYXRoLCBncm91cHMucGF0aFxuICAjIGRlYnVnICfOqWNybW1kX19fNCdcbiAgIyBkZWJ1ZyAnzqljcm1tZF9fXzUnLCBncm91cHNcbiAgbG9nICfOqWNybW1kX19fNicsIFwiaW5zZXJ0aW5nICN7aW5zZXJ0X3BhdGh9XCJcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBhcHBlbmQgdGFyZ2V0X3BhdGgsIFwiPCEtLSBCRUdJTiAje2xpbmV9IC0tPlwiXG4gIGFwcGVuZCB0YXJnZXRfcGF0aCwgaW5zZXJ0X2xpbmUgZm9yIHsgbGluZTogaW5zZXJ0X2xpbmUsIH0gZnJvbSB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zIGluc2VydF9wYXRoXG4gIGFwcGVuZCB0YXJnZXRfcGF0aCwgXCI8IS0tIEVORCAje2xpbmV9IC0tPlwiXG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cblxuXG5cblxuXG5cbiJdfQ==
