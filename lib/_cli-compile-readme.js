(function() {
  'use strict';
  var FS, PATH, append, base_path, clear, debug, dirname, file_has_uncommitted_changes, groups, insert_matcher, insert_path, insertion_ref_path, join, line, log, main_path, match, resolve, rpr, spawnSync, src_path, target_path, walk_lines_with_positions, warn, x;

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
    append(target_path, `<!-- ${line} -->`);
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19jbGktY29tcGlsZS1yZWFkbWUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLE1BQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsV0FBQSxFQUFBLHlCQUFBLEVBQUEsSUFBQSxFQUFBLENBQUE7OztFQUdBLEVBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVI7O0VBQzVCLElBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLEVBQ0UsSUFERixFQUVFLE9BRkYsQ0FBQSxHQUU0QixJQUY1QixFQUxBOzs7RUFTQSxDQUFBLENBQUUseUJBQUYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxrQ0FBUixDQUFGLENBQThDLENBQUMsdUJBQS9DLENBQUEsQ0FENUI7O0VBRUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxHQURGLEVBRUUsS0FGRixDQUFBLEdBRTRCLE9BRjVCOztFQUdBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsU0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxvQkFBUixDQUE1QixFQWZBOzs7Ozs7Ozs7Ozs7O0VBOEJBLDRCQUFBLEdBQStCLFFBQUEsQ0FBRSxJQUFGLENBQUE7QUFDL0IsUUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBYyxTQUFBLENBQVUsS0FBVixFQUFpQixDQUFFLE1BQUYsRUFBVSxTQUFWLEVBQXFCLElBQXJCLENBQWpCLEVBQStDO01BQUUsR0FBQSxFQUFLO0lBQVAsQ0FBL0MsQ0FBZDtJQUNBLElBQWdCLE1BQUEsS0FBVSxDQUExQjtBQUFBLGFBQU8sTUFBUDs7QUFDQSxXQUFPO0VBSHNCLEVBOUIvQjs7O0VBb0NBLEtBQUEsR0FBUSxRQUFBLENBQUUsSUFBRixDQUFBO0lBQ04sRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBakIsRUFBdUIsRUFBdkI7QUFDQSxXQUFPO0VBRkQsRUFwQ1I7OztFQXlDQSxNQUFBLEdBQVMsUUFBQSxDQUFFLElBQUYsRUFBUSxJQUFSLENBQUE7SUFDUCxFQUFFLENBQUMsY0FBSCxDQUFrQixJQUFsQixFQUF3QixDQUFBLENBQUEsQ0FBRyxJQUFILENBQUEsRUFBQSxDQUF4QjtBQUNBLFdBQU87RUFGQSxFQXpDVDs7O0VBOENBLFNBQUEsR0FBc0IsT0FBQSxDQUFRLElBQUEsQ0FBSyxTQUFMLEVBQWdCLElBQWhCLENBQVI7O0VBQ3RCLFFBQUEsR0FBc0IsT0FBQSxDQUFRLElBQUEsQ0FBSyxTQUFMLEVBQWdCLFNBQWhCLENBQVI7O0VBQ3RCLFNBQUEsR0FBc0IsT0FBQSxDQUFRLFFBQVIsRUFBa0IsU0FBbEI7O0VBQ3RCLFdBQUEsR0FBc0IsT0FBQSxDQUFRLFNBQVIsRUFBbUIsV0FBbkI7O0VBQ3RCLGtCQUFBLEdBQXNCLE9BQUEsQ0FBUSxPQUFBLENBQVEsU0FBUixDQUFSOztFQUN0QixjQUFBLEdBQXNCLGtEQW5EdEI7OztFQTZEQSxLQUFBLENBQU0sWUFBTixFQUFvQixDQUFFLFNBQUYsRUFBYSxRQUFiLEVBQXVCLFNBQXZCLENBQXBCLEVBN0RBOzs7RUFnRUEsSUFBRyw0QkFBQSxDQUE2QixXQUE3QixDQUFIO0lBQ0UsSUFBQSxDQUFBO0lBQ0EsSUFBQSxDQUFLLGFBQUw7SUFDQSxJQUFBLENBQUssR0FBQSxDQUFBLENBQUssV0FBTCxDQUFBLENBQUw7SUFDQSxJQUFBLENBQUsscUNBQUw7SUFDQSxJQUFBLENBQUE7SUFDQSxPQUFPLENBQUMsSUFBUixDQUFhLEdBQWIsRUFORjtHQWhFQTs7O0VBMEVBLEtBQUEsQ0FBTSxXQUFOOztFQUNBLEtBQUEseUNBQUE7S0FBSSxDQUFFLElBQUYsT0FDSjs7SUFDRSxJQUFPLDRDQUFQO01BQ0UsTUFBQSxDQUFPLFdBQVAsRUFBb0IsSUFBcEI7QUFDQSxlQUZGOztJQUdBLE1BQUEsR0FBYyxDQUFFLEdBQUEsS0FBSyxDQUFDLE1BQVI7SUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLElBQUEsQ0FBSyxrQkFBTCxFQUF5QixNQUFNLENBQUMsSUFBaEMsQ0FBUjtJQUNkLEtBQUEsQ0FBTSxZQUFOO0lBQ0EsS0FBQSxDQUFNLFlBQU4sRUFBb0IsTUFBcEI7SUFDQSxLQUFBLENBQU0sWUFBTixFQUFvQixXQUFwQjtJQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CLENBQUEsS0FBQSxDQUFBLENBQVEsSUFBUixDQUFBLElBQUEsQ0FBcEI7RUFWRjtBQTNFQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuRlMgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG5QQVRIICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xueyByZXNvbHZlLFxuICBqb2luLFxuICBkaXJuYW1lLCAgICAgICAgICAgICAgfSA9IFBBVEhcbiMgeyBtYXRjaGVzR2xvYiwgICAgICAgICAgfSA9IHJlcXVpcmVcbnsgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtZmFzdC1saW5lcmVhZGVyLWJyaWNzJyApLnJlcXVpcmVfZmFzdF9saW5lcmVhZGVyKClcbnsgd2FybixcbiAgbG9nLFxuICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IHNwYXduU3luYywgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTpjaGlsZF9wcm9jZXNzJ1xuXG5cbiMjI1xuYmFzZV9wYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBfX2Rpcm5hbWUsICcuLidcbnBhdHRlcm4gICA9ICcqLm1kJ1xuZW50cmllcyAgID0gRlMucmVhZGRpclN5bmMgYmFzZV9wYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgfVxuZW50cmllcy5zb3J0KClcbmZvciBlbnRyeSBpbiBlbnRyaWVzXG4gIGNvbnRpbnVlIHVubGVzcyAoIEZTLnN0YXRTeW5jIGVudHJ5ICkuaXNGaWxlKClcbiAgY29udGludWUgdW5sZXNzIFBBVEgubWF0Y2hlc0dsb2IgZW50cnksIHBhdHRlcm5cbiAgZGVidWcgJ86pY3JtbWRfX18xJywgZW50cnlcbiMjI1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZpbGVfaGFzX3VuY29tbWl0dGVkX2NoYW5nZXMgPSAoIHBhdGggKSAtPlxuICB7IHN0YXR1cywgfSA9IHNwYXduU3luYyAnZ2l0JywgWyAnZGlmZicsICctLXF1aWV0JywgcGF0aCwgXSwgeyBjd2Q6IGJhc2VfcGF0aCwgfVxuICByZXR1cm4gZmFsc2UgaWYgc3RhdHVzIGlzIDBcbiAgcmV0dXJuIHRydWVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGVhciA9ICggcGF0aCApIC0+XG4gIEZTLndyaXRlRmlsZVN5bmMgcGF0aCwgJydcbiAgcmV0dXJuIG51bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5hcHBlbmQgPSAoIHBhdGgsIHRleHQgKSAtPlxuICBGUy5hcHBlbmRGaWxlU3luYyBwYXRoLCBcIiN7dGV4dH1cXG5cIlxuICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmJhc2VfcGF0aCAgICAgICAgICAgPSByZXNvbHZlIGpvaW4gX19kaXJuYW1lLCAnLi4nXG5zcmNfcGF0aCAgICAgICAgICAgID0gcmVzb2x2ZSBqb2luIGJhc2VfcGF0aCwgJ2RvYy1zcmMnXG5tYWluX3BhdGggICAgICAgICAgID0gcmVzb2x2ZSBzcmNfcGF0aCwgJ21haW4ubWQnXG50YXJnZXRfcGF0aCAgICAgICAgID0gcmVzb2x2ZSBiYXNlX3BhdGgsICdSRUFETUUubWQnXG5pbnNlcnRpb25fcmVmX3BhdGggID0gcmVzb2x2ZSBkaXJuYW1lIG1haW5fcGF0aFxuaW5zZXJ0X21hdGNoZXIgICAgICA9IC8vL1xuICBeXG4gICMoPzxwcmVmaXg+Lio/KVxuICAoPzxjb21tYW5kPiA8IWluc2VydCApXG4gIFxccysgc3JjPSAoPzxwYXRoPiBbXj5dKyApID5cbiAgXFxzKlxuICAkXG4gIC8vL1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRlYnVnICfOqWNybW1kX19fMicsIHsgYmFzZV9wYXRoLCBzcmNfcGF0aCwgbWFpbl9wYXRoLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaWYgZmlsZV9oYXNfdW5jb21taXR0ZWRfY2hhbmdlcyB0YXJnZXRfcGF0aFxuICB3YXJuKClcbiAgd2FybiBcInRhcmdldCBmaWxlXCJcbiAgd2FybiBcIiAgI3t0YXJnZXRfcGF0aH1cIlxuICB3YXJuIFwiaGFzIHVuY29taXR0ZWQgY2hhbmdlczsgdGVybWluYXRpbmdcIlxuICB3YXJuKClcbiAgcHJvY2Vzcy5leGl0IDExMVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xlYXIgdGFyZ2V0X3BhdGhcbmZvciB7IGxpbmUsIH0gZnJvbSB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zIG1haW5fcGF0aFxuICAjIGRlYnVnICfOqWNybW1kX19fMycsIHJwciBsaW5lXG4gIHVubGVzcyAoIG1hdGNoID0gbGluZS5tYXRjaCBpbnNlcnRfbWF0Y2hlciApP1xuICAgIGFwcGVuZCB0YXJnZXRfcGF0aCwgbGluZVxuICAgIGNvbnRpbnVlXG4gIGdyb3VwcyAgICAgID0geyBtYXRjaC5ncm91cHMuLi4sIH1cbiAgaW5zZXJ0X3BhdGggPSByZXNvbHZlIGpvaW4gaW5zZXJ0aW9uX3JlZl9wYXRoLCBncm91cHMucGF0aFxuICBkZWJ1ZyAnzqljcm1tZF9fXzQnXG4gIGRlYnVnICfOqWNybW1kX19fNScsIGdyb3Vwc1xuICBkZWJ1ZyAnzqljcm1tZF9fXzYnLCBpbnNlcnRfcGF0aFxuICBhcHBlbmQgdGFyZ2V0X3BhdGgsIFwiPCEtLSAje2xpbmV9IC0tPlwiXG5cblxuXG5cblxuXG4iXX0=
