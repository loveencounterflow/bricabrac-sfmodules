(function() {
  'use strict';
  var BRICS;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_fast_linereader: function() {
      var FS, debug, exports, nl, templates, walk_buffers_with_positions, walk_lines_with_positions;
      FS = require('node:fs');
      nl = '\n'.codePointAt(0);
      ({debug} = console);
      //-----------------------------------------------------------------------------------------------------------
      templates = {
        walk_buffers_with_positions_cfg: {
          chunk_size: 16 * 1024
        }
      };
      //-----------------------------------------------------------------------------------------------------------
      walk_buffers_with_positions = function*(path, cfg) {
        var buffer, buffer_nr, byte_count, byte_idx, chunk_size, fd;
        // H.types.validate.guy_fs_walk_buffers_cfg ( cfg = { defaults.guy_fs_walk_buffers_cfg..., cfg..., } )
        // H.types.validate.nonempty_text path
        ({chunk_size} = {...templates.walk_buffers_with_positions_cfg, ...cfg});
        fd = FS.openSync(path);
        byte_idx = 0;
        buffer_nr = 0;
        while (true) {
          buffer = Buffer.alloc(chunk_size);
          byte_count = FS.readSync(fd, buffer, 0, chunk_size, byte_idx);
          if (byte_count === 0) {
            break;
          }
          if (byte_count < chunk_size) {
            buffer = buffer.subarray(0, byte_count);
          }
          buffer_nr++;
          yield ({buffer, byte_idx, buffer_nr});
          byte_idx += byte_count;
        }
        return null;
      };
      //-----------------------------------------------------------------------------------------------------------
      walk_lines_with_positions = function*(path, cfg) {
        var buffer, buffer_nr, byte_idx, eol, lnr, remainder, start, stop, x;
        // from mmomtchev/readcsv/readcsv-buffered-opt.js
        remainder = '';
        eol = '\n';
        lnr = 0;
//.........................................................................................................
        for (x of walk_buffers_with_positions(path, cfg)) {
          ({buffer, byte_idx, buffer_nr} = x);
          // debug 'Ωflr___1', { length: buffer.length, byte_idx, }
          start = 0;
          stop = null;
          //.......................................................................................................
          while ((stop = buffer.indexOf(nl, start)) !== -1) {
            if ((start === 0) && (remainder.length > 0)) {
              lnr++;
              yield ({
                lnr,
                line: remainder + buffer.slice(0, stop),
                eol,
                buffer_nr
              });
              remainder = '';
            } else {
              lnr++;
              yield ({
                lnr,
                line: (buffer.slice(start, stop)).toString('utf-8'),
                eol,
                buffer_nr
              });
            }
            start = stop + 1;
          }
          //.......................................................................................................
          remainder = buffer.slice(start);
        }
        //.........................................................................................................
        return null;
      };
      //.......................................................................................................
      return exports = {walk_buffers_with_positions, walk_lines_with_positions};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWZhc3QtbGluZXJlYWRlci1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQTs7Ozs7RUFPQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsdUJBQUEsRUFBeUIsUUFBQSxDQUFBLENBQUE7QUFDM0IsVUFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLDJCQUFBLEVBQUE7TUFBSSxFQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7TUFDZCxFQUFBLEdBQWMsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsQ0FBakI7TUFDZCxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZCxFQUZKOztNQUtJLFNBQUEsR0FDRTtRQUFBLCtCQUFBLEVBQ0U7VUFBQSxVQUFBLEVBQWdCLEVBQUEsR0FBSztRQUFyQjtNQURGLEVBTk47O01BVUksMkJBQUEsR0FBOEIsU0FBQSxDQUFFLElBQUYsRUFBUSxHQUFSLENBQUE7QUFDbEMsWUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsVUFBQSxFQUFBLEVBQUE7OztRQUVNLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQywrQkFBWixFQUFnRCxHQUFBLEdBQWhELENBQWxCO1FBQ0EsRUFBQSxHQUFrQixFQUFFLENBQUMsUUFBSCxDQUFZLElBQVo7UUFDbEIsUUFBQSxHQUFrQjtRQUNsQixTQUFBLEdBQWtCO0FBQ2xCLGVBQUEsSUFBQTtVQUNFLE1BQUEsR0FBYyxNQUFNLENBQUMsS0FBUCxDQUFhLFVBQWI7VUFDZCxVQUFBLEdBQWMsRUFBRSxDQUFDLFFBQUgsQ0FBWSxFQUFaLEVBQWdCLE1BQWhCLEVBQXdCLENBQXhCLEVBQTJCLFVBQTNCLEVBQXVDLFFBQXZDO1VBQ2QsSUFBUyxVQUFBLEtBQWMsQ0FBdkI7QUFBQSxrQkFBQTs7VUFDQSxJQUErQyxVQUFBLEdBQWEsVUFBNUQ7WUFBQSxNQUFBLEdBQWMsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBbkIsRUFBZDs7VUFDQSxTQUFBO1VBQ0EsTUFBTSxDQUFBLENBQUUsTUFBRixFQUFVLFFBQVYsRUFBb0IsU0FBcEIsQ0FBQTtVQUNOLFFBQUEsSUFBYztRQVBoQjtBQVFBLGVBQU87TUFmcUIsRUFWbEM7O01BNEJJLHlCQUFBLEdBQTRCLFNBQUEsQ0FBRSxJQUFGLEVBQVEsR0FBUixDQUFBO0FBQ2hDLFlBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBOztRQUNNLFNBQUEsR0FBYztRQUNkLEdBQUEsR0FBYztRQUNkLEdBQUEsR0FBYyxFQUhwQjs7UUFLTSxLQUFBLDJDQUFBO1dBQUksQ0FBRSxNQUFGLEVBQVUsUUFBVixFQUFvQixTQUFwQixPQUNWOztVQUNRLEtBQUEsR0FBUTtVQUNSLElBQUEsR0FBUSxLQUZoQjs7QUFJUSxpQkFBTSxDQUFFLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFlLEVBQWYsRUFBbUIsS0FBbkIsQ0FBVCxDQUFBLEtBQXlDLENBQUMsQ0FBaEQ7WUFDRSxJQUFHLENBQUUsS0FBQSxLQUFTLENBQVgsQ0FBQSxJQUFtQixDQUFFLFNBQVMsQ0FBQyxNQUFWLEdBQW1CLENBQXJCLENBQXRCO2NBQ0UsR0FBQTtjQUNBLE1BQU0sQ0FBQTtnQkFBRSxHQUFGO2dCQUFPLElBQUEsRUFBUSxTQUFBLEdBQVksTUFBTSxDQUFDLEtBQVAsQ0FBYSxDQUFiLEVBQWdCLElBQWhCLENBQTNCO2dCQUFtRCxHQUFuRDtnQkFBd0Q7Y0FBeEQsQ0FBQTtjQUNOLFNBQUEsR0FBWSxHQUhkO2FBQUEsTUFBQTtjQUtFLEdBQUE7Y0FDQSxNQUFNLENBQUE7Z0JBQUUsR0FBRjtnQkFBTyxJQUFBLEVBQVEsQ0FBRSxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsRUFBb0IsSUFBcEIsQ0FBRixDQUE0QixDQUFDLFFBQTdCLENBQXNDLE9BQXRDLENBQWY7Z0JBQWdFLEdBQWhFO2dCQUFxRTtjQUFyRSxDQUFBLEVBTlI7O1lBT0EsS0FBQSxHQUFRLElBQUEsR0FBTztVQVJqQixDQUpSOztVQWNRLFNBQUEsR0FBWSxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWI7UUFmZCxDQUxOOztBQXNCTSxlQUFPO01BdkJtQixFQTVCaEM7O0FBc0RJLGFBQU8sT0FBQSxHQUFVLENBQUUsMkJBQUYsRUFBK0IseUJBQS9CO0lBdkRNO0VBQXpCLEVBWEY7OztFQXFFQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXJFQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9mYXN0X2xpbmVyZWFkZXI6IC0+XG4gICAgRlMgICAgICAgICAgPSByZXF1aXJlICdub2RlOmZzJ1xuICAgIG5sICAgICAgICAgID0gJ1xcbicuY29kZVBvaW50QXQgMFxuICAgIHsgZGVidWcsICB9ID0gY29uc29sZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIHdhbGtfYnVmZmVyc193aXRoX3Bvc2l0aW9uc19jZmc6XG4gICAgICAgIGNodW5rX3NpemU6ICAgICAxNiAqIDEwMjRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfYnVmZmVyc193aXRoX3Bvc2l0aW9ucyA9ICggcGF0aCwgY2ZnICkgLT5cbiAgICAgICMgSC50eXBlcy52YWxpZGF0ZS5ndXlfZnNfd2Fsa19idWZmZXJzX2NmZyAoIGNmZyA9IHsgZGVmYXVsdHMuZ3V5X2ZzX3dhbGtfYnVmZmVyc19jZmcuLi4sIGNmZy4uLiwgfSApXG4gICAgICAjIEgudHlwZXMudmFsaWRhdGUubm9uZW1wdHlfdGV4dCBwYXRoXG4gICAgICB7IGNodW5rX3NpemUgfSAgPSB7IHRlbXBsYXRlcy53YWxrX2J1ZmZlcnNfd2l0aF9wb3NpdGlvbnNfY2ZnLi4uLCBjZmcuLi4sIH1cbiAgICAgIGZkICAgICAgICAgICAgICA9IEZTLm9wZW5TeW5jIHBhdGhcbiAgICAgIGJ5dGVfaWR4ICAgICAgICA9IDBcbiAgICAgIGJ1ZmZlcl9uciAgICAgICA9IDBcbiAgICAgIGxvb3BcbiAgICAgICAgYnVmZmVyICAgICAgPSBCdWZmZXIuYWxsb2MgY2h1bmtfc2l6ZVxuICAgICAgICBieXRlX2NvdW50ICA9IEZTLnJlYWRTeW5jIGZkLCBidWZmZXIsIDAsIGNodW5rX3NpemUsIGJ5dGVfaWR4XG4gICAgICAgIGJyZWFrIGlmIGJ5dGVfY291bnQgaXMgMFxuICAgICAgICBidWZmZXIgICAgICA9IGJ1ZmZlci5zdWJhcnJheSAwLCBieXRlX2NvdW50IGlmIGJ5dGVfY291bnQgPCBjaHVua19zaXplXG4gICAgICAgIGJ1ZmZlcl9ucisrXG4gICAgICAgIHlpZWxkIHsgYnVmZmVyLCBieXRlX2lkeCwgYnVmZmVyX25yLCB9XG4gICAgICAgIGJ5dGVfaWR4ICAgKz0gYnl0ZV9jb3VudFxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfbGluZXNfd2l0aF9wb3NpdGlvbnMgPSAoIHBhdGgsIGNmZyApIC0+XG4gICAgICAjIGZyb20gbW1vbXRjaGV2L3JlYWRjc3YvcmVhZGNzdi1idWZmZXJlZC1vcHQuanNcbiAgICAgIHJlbWFpbmRlciAgID0gJydcbiAgICAgIGVvbCAgICAgICAgID0gJ1xcbidcbiAgICAgIGxuciAgICAgICAgID0gMFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIHsgYnVmZmVyLCBieXRlX2lkeCwgYnVmZmVyX25yLCB9IGZyb20gd2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zIHBhdGgsIGNmZ1xuICAgICAgICAjIGRlYnVnICfOqWZscl9fXzEnLCB7IGxlbmd0aDogYnVmZmVyLmxlbmd0aCwgYnl0ZV9pZHgsIH1cbiAgICAgICAgc3RhcnQgPSAwXG4gICAgICAgIHN0b3AgID0gbnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGlsZSAoIHN0b3AgPSBidWZmZXIuaW5kZXhPZiBubCwgc3RhcnQgKSBpc250IC0xXG4gICAgICAgICAgaWYgKCBzdGFydCA9PSAwICkgYW5kICggcmVtYWluZGVyLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgbG5yKytcbiAgICAgICAgICAgIHlpZWxkIHsgbG5yLCBsaW5lOiAoIHJlbWFpbmRlciArIGJ1ZmZlci5zbGljZSAwLCBzdG9wICksIGVvbCwgYnVmZmVyX25yLCB9XG4gICAgICAgICAgICByZW1haW5kZXIgPSAnJ1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxucisrXG4gICAgICAgICAgICB5aWVsZCB7IGxuciwgbGluZTogKCAoIGJ1ZmZlci5zbGljZSBzdGFydCwgc3RvcCApLnRvU3RyaW5nICd1dGYtOCcgKSwgZW9sLCBidWZmZXJfbnIsIH1cbiAgICAgICAgICBzdGFydCA9IHN0b3AgKyAxXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJlbWFpbmRlciA9IGJ1ZmZlci5zbGljZSBzdGFydFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfYnVmZmVyc193aXRoX3Bvc2l0aW9ucywgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucywgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
