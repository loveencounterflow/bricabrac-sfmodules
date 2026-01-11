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

  insert_matcher = /^(?<prefix>.*?)(?<command><!insert)\s+src=(?<path>[^>]+)\s*$/;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19jbGktY29tcGlsZS1yZWFkbWUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLE1BQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLGtCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsV0FBQSxFQUFBLHlCQUFBLEVBQUEsSUFBQSxFQUFBLENBQUE7OztFQUdBLEVBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVI7O0VBQzVCLElBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLEVBQ0UsSUFERixFQUVFLE9BRkYsQ0FBQSxHQUU0QixJQUY1QixFQUxBOzs7RUFTQSxDQUFBLENBQUUseUJBQUYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxrQ0FBUixDQUFGLENBQThDLENBQUMsdUJBQS9DLENBQUEsQ0FENUI7O0VBRUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxHQURGLEVBRUUsS0FGRixDQUFBLEdBRTRCLE9BRjVCOztFQUdBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsZUFBUixDQUFGLENBQTJCLENBQUMsYUFBNUIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsU0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxvQkFBUixDQUE1QixFQWZBOzs7Ozs7Ozs7Ozs7O0VBOEJBLDRCQUFBLEdBQStCLFFBQUEsQ0FBRSxJQUFGLENBQUE7QUFDL0IsUUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBYyxTQUFBLENBQVUsS0FBVixFQUFpQixDQUFFLE1BQUYsRUFBVSxTQUFWLEVBQXFCLElBQXJCLENBQWpCLEVBQStDO01BQUUsR0FBQSxFQUFLO0lBQVAsQ0FBL0MsQ0FBZDtJQUNBLElBQWdCLE1BQUEsS0FBVSxDQUExQjtBQUFBLGFBQU8sTUFBUDs7QUFDQSxXQUFPO0VBSHNCLEVBOUIvQjs7O0VBb0NBLEtBQUEsR0FBUSxRQUFBLENBQUUsSUFBRixDQUFBO0lBQ04sRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBakIsRUFBdUIsRUFBdkI7QUFDQSxXQUFPO0VBRkQsRUFwQ1I7OztFQXlDQSxNQUFBLEdBQVMsUUFBQSxDQUFFLElBQUYsRUFBUSxJQUFSLENBQUE7SUFDUCxFQUFFLENBQUMsY0FBSCxDQUFrQixJQUFsQixFQUF3QixDQUFBLENBQUEsQ0FBRyxJQUFILENBQUEsRUFBQSxDQUF4QjtBQUNBLFdBQU87RUFGQSxFQXpDVDs7O0VBOENBLFNBQUEsR0FBc0IsT0FBQSxDQUFRLElBQUEsQ0FBSyxTQUFMLEVBQWdCLElBQWhCLENBQVI7O0VBQ3RCLFFBQUEsR0FBc0IsT0FBQSxDQUFRLElBQUEsQ0FBSyxTQUFMLEVBQWdCLFNBQWhCLENBQVI7O0VBQ3RCLFNBQUEsR0FBc0IsT0FBQSxDQUFRLFFBQVIsRUFBa0IsU0FBbEI7O0VBQ3RCLFdBQUEsR0FBc0IsT0FBQSxDQUFRLFNBQVIsRUFBbUIsV0FBbkI7O0VBQ3RCLGtCQUFBLEdBQXNCLE9BQUEsQ0FBUSxPQUFBLENBQVEsU0FBUixDQUFSOztFQUN0QixjQUFBLEdBQXNCLCtEQW5EdEI7OztFQXNEQSxLQUFBLENBQU0sWUFBTixFQUFvQixDQUFFLFNBQUYsRUFBYSxRQUFiLEVBQXVCLFNBQXZCLENBQXBCLEVBdERBOzs7RUF5REEsSUFBRyw0QkFBQSxDQUE2QixXQUE3QixDQUFIO0lBQ0UsSUFBQSxDQUFBO0lBQ0EsSUFBQSxDQUFLLGFBQUw7SUFDQSxJQUFBLENBQUssR0FBQSxDQUFBLENBQUssV0FBTCxDQUFBLENBQUw7SUFDQSxJQUFBLENBQUsscUNBQUw7SUFDQSxJQUFBLENBQUE7SUFDQSxPQUFPLENBQUMsSUFBUixDQUFhLEdBQWIsRUFORjtHQXpEQTs7O0VBbUVBLEtBQUEsQ0FBTSxXQUFOOztFQUNBLEtBQUEseUNBQUE7S0FBSSxDQUFFLElBQUYsT0FDSjs7SUFDRSxJQUFPLDRDQUFQO01BQ0UsTUFBQSxDQUFPLFdBQVAsRUFBb0IsSUFBcEI7QUFDQSxlQUZGOztJQUdBLE1BQUEsR0FBYyxDQUFFLEdBQUEsS0FBSyxDQUFDLE1BQVI7SUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLElBQUEsQ0FBSyxrQkFBTCxFQUF5QixNQUFNLENBQUMsSUFBaEMsQ0FBUjtJQUNkLEtBQUEsQ0FBTSxZQUFOO0lBQ0EsS0FBQSxDQUFNLFlBQU4sRUFBb0IsTUFBcEI7SUFDQSxLQUFBLENBQU0sWUFBTixFQUFvQixXQUFwQjtJQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CLENBQUEsS0FBQSxDQUFBLENBQVEsSUFBUixDQUFBLElBQUEsQ0FBcEI7RUFWRjtBQXBFQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuRlMgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG5QQVRIICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpwYXRoJ1xueyByZXNvbHZlLFxuICBqb2luLFxuICBkaXJuYW1lLCAgICAgICAgICAgICAgfSA9IFBBVEhcbiMgeyBtYXRjaGVzR2xvYiwgICAgICAgICAgfSA9IHJlcXVpcmVcbnsgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtZmFzdC1saW5lcmVhZGVyLWJyaWNzJyApLnJlcXVpcmVfZmFzdF9saW5lcmVhZGVyKClcbnsgd2FybixcbiAgbG9nLFxuICBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcnByLCAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vbG91cGUtYnJpY3MnICkucmVxdWlyZV9sb3VwZSgpXG57IHNwYXduU3luYywgICAgICAgICAgICB9ID0gcmVxdWlyZSAnbm9kZTpjaGlsZF9wcm9jZXNzJ1xuXG5cbiMjI1xuYmFzZV9wYXRoID0gUEFUSC5yZXNvbHZlIFBBVEguam9pbiBfX2Rpcm5hbWUsICcuLidcbnBhdHRlcm4gICA9ICcqLm1kJ1xuZW50cmllcyAgID0gRlMucmVhZGRpclN5bmMgYmFzZV9wYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgfVxuZW50cmllcy5zb3J0KClcbmZvciBlbnRyeSBpbiBlbnRyaWVzXG4gIGNvbnRpbnVlIHVubGVzcyAoIEZTLnN0YXRTeW5jIGVudHJ5ICkuaXNGaWxlKClcbiAgY29udGludWUgdW5sZXNzIFBBVEgubWF0Y2hlc0dsb2IgZW50cnksIHBhdHRlcm5cbiAgZGVidWcgJ86pY3JtbWRfX18xJywgZW50cnlcbiMjI1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZpbGVfaGFzX3VuY29tbWl0dGVkX2NoYW5nZXMgPSAoIHBhdGggKSAtPlxuICB7IHN0YXR1cywgfSA9IHNwYXduU3luYyAnZ2l0JywgWyAnZGlmZicsICctLXF1aWV0JywgcGF0aCwgXSwgeyBjd2Q6IGJhc2VfcGF0aCwgfVxuICByZXR1cm4gZmFsc2UgaWYgc3RhdHVzIGlzIDBcbiAgcmV0dXJuIHRydWVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGVhciA9ICggcGF0aCApIC0+XG4gIEZTLndyaXRlRmlsZVN5bmMgcGF0aCwgJydcbiAgcmV0dXJuIG51bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5hcHBlbmQgPSAoIHBhdGgsIHRleHQgKSAtPlxuICBGUy5hcHBlbmRGaWxlU3luYyBwYXRoLCBcIiN7dGV4dH1cXG5cIlxuICByZXR1cm4gbnVsbFxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmJhc2VfcGF0aCAgICAgICAgICAgPSByZXNvbHZlIGpvaW4gX19kaXJuYW1lLCAnLi4nXG5zcmNfcGF0aCAgICAgICAgICAgID0gcmVzb2x2ZSBqb2luIGJhc2VfcGF0aCwgJ2RvYy1zcmMnXG5tYWluX3BhdGggICAgICAgICAgID0gcmVzb2x2ZSBzcmNfcGF0aCwgJ21haW4ubWQnXG50YXJnZXRfcGF0aCAgICAgICAgID0gcmVzb2x2ZSBiYXNlX3BhdGgsICdSRUFETUUubWQnXG5pbnNlcnRpb25fcmVmX3BhdGggID0gcmVzb2x2ZSBkaXJuYW1lIG1haW5fcGF0aFxuaW5zZXJ0X21hdGNoZXIgICAgICA9IC9eKD88cHJlZml4Pi4qPykoPzxjb21tYW5kPjwhaW5zZXJ0KVxccytzcmM9KD88cGF0aD5bXj5dKylcXHMqJC9cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5kZWJ1ZyAnzqljcm1tZF9fXzInLCB7IGJhc2VfcGF0aCwgc3JjX3BhdGgsIG1haW5fcGF0aCwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmlmIGZpbGVfaGFzX3VuY29tbWl0dGVkX2NoYW5nZXMgdGFyZ2V0X3BhdGhcbiAgd2FybigpXG4gIHdhcm4gXCJ0YXJnZXQgZmlsZVwiXG4gIHdhcm4gXCIgICN7dGFyZ2V0X3BhdGh9XCJcbiAgd2FybiBcImhhcyB1bmNvbWl0dGVkIGNoYW5nZXM7IHRlcm1pbmF0aW5nXCJcbiAgd2FybigpXG4gIHByb2Nlc3MuZXhpdCAxMTFcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsZWFyIHRhcmdldF9wYXRoXG5mb3IgeyBsaW5lLCB9IGZyb20gd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyBtYWluX3BhdGhcbiAgIyBkZWJ1ZyAnzqljcm1tZF9fXzMnLCBycHIgbGluZVxuICB1bmxlc3MgKCBtYXRjaCA9IGxpbmUubWF0Y2ggaW5zZXJ0X21hdGNoZXIgKT9cbiAgICBhcHBlbmQgdGFyZ2V0X3BhdGgsIGxpbmVcbiAgICBjb250aW51ZVxuICBncm91cHMgICAgICA9IHsgbWF0Y2guZ3JvdXBzLi4uLCB9XG4gIGluc2VydF9wYXRoID0gcmVzb2x2ZSBqb2luIGluc2VydGlvbl9yZWZfcGF0aCwgZ3JvdXBzLnBhdGhcbiAgZGVidWcgJ86pY3JtbWRfX180J1xuICBkZWJ1ZyAnzqljcm1tZF9fXzUnLCBncm91cHNcbiAgZGVidWcgJ86pY3JtbWRfX182JywgaW5zZXJ0X3BhdGhcbiAgYXBwZW5kIHRhcmdldF9wYXRoLCBcIjwhLS0gI3tsaW5lfSAtLT5cIlxuXG5cblxuXG5cblxuIl19
