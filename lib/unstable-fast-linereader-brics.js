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
        var buffer, buffer_nr, byte_idx, eol, lnr, remainders, start, stop, x;
        // from mmomtchev/readcsv/readcsv-buffered-opt.js
        remainders = [];
        eol = '\n';
        lnr = 0;
//.........................................................................................................
        for (x of walk_buffers_with_positions(path, cfg)) {
          ({buffer, byte_idx, buffer_nr} = x);
          start = 0;
          stop = null;
          //.......................................................................................................
          while ((stop = buffer.indexOf(nl, start)) !== -1) {
            if ((start === 0) && (remainders.length > 0)) {
              lnr++;
              remainders.push(buffer.slice(0, stop));
              yield ({
                lnr,
                line: (Buffer.concat(remainders)).toString('utf-8'),
                eol
              });
              remainders.length = 0;
            } else {
              lnr++;
              yield ({
                lnr,
                line: (buffer.slice(start, stop)).toString('utf-8'),
                eol
              });
            }
            start = stop + 1;
          }
          //.......................................................................................................
          remainders.push(buffer.slice(start));
        }
        //.........................................................................................................
        if (remainders.length > 0) {
          lnr++;
          yield ({
            lnr,
            line: (Buffer.concat(remainders)).toString('utf-8'),
            eol: ''
          });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWZhc3QtbGluZXJlYWRlci1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQTs7Ozs7RUFPQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsdUJBQUEsRUFBeUIsUUFBQSxDQUFBLENBQUE7QUFDM0IsVUFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLDJCQUFBLEVBQUE7TUFBSSxFQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7TUFDZCxFQUFBLEdBQWMsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsQ0FBakI7TUFDZCxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZCxFQUZKOztNQUtJLFNBQUEsR0FDRTtRQUFBLCtCQUFBLEVBQ0U7VUFBQSxVQUFBLEVBQWdCLEVBQUEsR0FBSztRQUFyQjtNQURGLEVBTk47O01BVUksMkJBQUEsR0FBOEIsU0FBQSxDQUFFLElBQUYsRUFBUSxHQUFSLENBQUE7QUFDbEMsWUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsVUFBQSxFQUFBLEVBQUE7OztRQUVNLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQywrQkFBWixFQUFnRCxHQUFBLEdBQWhELENBQWxCO1FBQ0EsRUFBQSxHQUFrQixFQUFFLENBQUMsUUFBSCxDQUFZLElBQVo7UUFDbEIsUUFBQSxHQUFrQjtRQUNsQixTQUFBLEdBQWtCO0FBQ2xCLGVBQUEsSUFBQTtVQUNFLE1BQUEsR0FBYyxNQUFNLENBQUMsS0FBUCxDQUFhLFVBQWI7VUFDZCxVQUFBLEdBQWMsRUFBRSxDQUFDLFFBQUgsQ0FBWSxFQUFaLEVBQWdCLE1BQWhCLEVBQXdCLENBQXhCLEVBQTJCLFVBQTNCLEVBQXVDLFFBQXZDO1VBQ2QsSUFBUyxVQUFBLEtBQWMsQ0FBdkI7QUFBQSxrQkFBQTs7VUFDQSxJQUErQyxVQUFBLEdBQWEsVUFBNUQ7WUFBQSxNQUFBLEdBQWMsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBbkIsRUFBZDs7VUFDQSxTQUFBO1VBQ0EsTUFBTSxDQUFBLENBQUUsTUFBRixFQUFVLFFBQVYsRUFBb0IsU0FBcEIsQ0FBQTtVQUNOLFFBQUEsSUFBYztRQVBoQjtBQVFBLGVBQU87TUFmcUIsRUFWbEM7O01BNEJJLHlCQUFBLEdBQTRCLFNBQUEsQ0FBRSxJQUFGLEVBQVEsR0FBUixDQUFBO0FBQ2hDLFlBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBOztRQUNNLFVBQUEsR0FBYztRQUNkLEdBQUEsR0FBYztRQUNkLEdBQUEsR0FBYyxFQUhwQjs7UUFLTSxLQUFBLDJDQUFBO1dBQUksQ0FBRSxNQUFGLEVBQVUsUUFBVixFQUFvQixTQUFwQjtVQUNGLEtBQUEsR0FBUTtVQUNSLElBQUEsR0FBUSxLQURoQjs7QUFHUSxpQkFBTSxDQUFFLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFlLEVBQWYsRUFBbUIsS0FBbkIsQ0FBVCxDQUFBLEtBQXlDLENBQUMsQ0FBaEQ7WUFDRSxJQUFHLENBQUUsS0FBQSxLQUFTLENBQVgsQ0FBQSxJQUFtQixDQUFFLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXRCLENBQXRCO2NBQ0UsR0FBQTtjQUNBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE1BQU0sQ0FBQyxLQUFQLENBQWEsQ0FBYixFQUFnQixJQUFoQixDQUFoQjtjQUNBLE1BQU0sQ0FBQTtnQkFBRSxHQUFGO2dCQUFPLElBQUEsRUFBUSxDQUFFLE1BQU0sQ0FBQyxNQUFQLENBQWMsVUFBZCxDQUFGLENBQTRCLENBQUMsUUFBN0IsQ0FBc0MsT0FBdEMsQ0FBZjtnQkFBZ0U7Y0FBaEUsQ0FBQTtjQUNOLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLEVBSnRCO2FBQUEsTUFBQTtjQU1FLEdBQUE7Y0FDQSxNQUFNLENBQUE7Z0JBQUUsR0FBRjtnQkFBTyxJQUFBLEVBQVEsQ0FBRSxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsRUFBb0IsSUFBcEIsQ0FBRixDQUE0QixDQUFDLFFBQTdCLENBQXNDLE9BQXRDLENBQWY7Z0JBQWdFO2NBQWhFLENBQUEsRUFQUjs7WUFRQSxLQUFBLEdBQVEsSUFBQSxHQUFPO1VBVGpCLENBSFI7O1VBY1EsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsTUFBTSxDQUFDLEtBQVAsQ0FBYSxLQUFiLENBQWhCO1FBZkYsQ0FMTjs7UUFzQk0sSUFBRyxVQUFVLENBQUMsTUFBWCxHQUFvQixDQUF2QjtVQUNFLEdBQUE7VUFDQSxNQUFNLENBQUE7WUFBRSxHQUFGO1lBQU8sSUFBQSxFQUFRLENBQUUsTUFBTSxDQUFDLE1BQVAsQ0FBYyxVQUFkLENBQUYsQ0FBNEIsQ0FBQyxRQUE3QixDQUFzQyxPQUF0QyxDQUFmO1lBQWdFLEdBQUEsRUFBSztVQUFyRSxDQUFBLEVBRlI7U0F0Qk47O0FBMEJNLGVBQU87TUEzQm1CLEVBNUJoQzs7QUEwREksYUFBTyxPQUFBLEdBQVUsQ0FBRSwyQkFBRixFQUErQix5QkFBL0I7SUEzRE07RUFBekIsRUFYRjs7O0VBeUVBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBekVBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2Zhc3RfbGluZXJlYWRlcjogLT5cbiAgICBGUyAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG4gICAgbmwgICAgICAgICAgPSAnXFxuJy5jb2RlUG9pbnRBdCAwXG4gICAgeyBkZWJ1ZywgIH0gPSBjb25zb2xlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgd2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zX2NmZzpcbiAgICAgICAgY2h1bmtfc2l6ZTogICAgIDE2ICogMTAyNFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zID0gKCBwYXRoLCBjZmcgKSAtPlxuICAgICAgIyBILnR5cGVzLnZhbGlkYXRlLmd1eV9mc193YWxrX2J1ZmZlcnNfY2ZnICggY2ZnID0geyBkZWZhdWx0cy5ndXlfZnNfd2Fsa19idWZmZXJzX2NmZy4uLiwgY2ZnLi4uLCB9IClcbiAgICAgICMgSC50eXBlcy52YWxpZGF0ZS5ub25lbXB0eV90ZXh0IHBhdGhcbiAgICAgIHsgY2h1bmtfc2l6ZSB9ICA9IHsgdGVtcGxhdGVzLndhbGtfYnVmZmVyc193aXRoX3Bvc2l0aW9uc19jZmcuLi4sIGNmZy4uLiwgfVxuICAgICAgZmQgICAgICAgICAgICAgID0gRlMub3BlblN5bmMgcGF0aFxuICAgICAgYnl0ZV9pZHggICAgICAgID0gMFxuICAgICAgYnVmZmVyX25yICAgICAgID0gMFxuICAgICAgbG9vcFxuICAgICAgICBidWZmZXIgICAgICA9IEJ1ZmZlci5hbGxvYyBjaHVua19zaXplXG4gICAgICAgIGJ5dGVfY291bnQgID0gRlMucmVhZFN5bmMgZmQsIGJ1ZmZlciwgMCwgY2h1bmtfc2l6ZSwgYnl0ZV9pZHhcbiAgICAgICAgYnJlYWsgaWYgYnl0ZV9jb3VudCBpcyAwXG4gICAgICAgIGJ1ZmZlciAgICAgID0gYnVmZmVyLnN1YmFycmF5IDAsIGJ5dGVfY291bnQgaWYgYnl0ZV9jb3VudCA8IGNodW5rX3NpemVcbiAgICAgICAgYnVmZmVyX25yKytcbiAgICAgICAgeWllbGQgeyBidWZmZXIsIGJ5dGVfaWR4LCBidWZmZXJfbnIsIH1cbiAgICAgICAgYnl0ZV9pZHggICArPSBieXRlX2NvdW50XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19saW5lc193aXRoX3Bvc2l0aW9ucyA9ICggcGF0aCwgY2ZnICkgLT5cbiAgICAgICMgZnJvbSBtbW9tdGNoZXYvcmVhZGNzdi9yZWFkY3N2LWJ1ZmZlcmVkLW9wdC5qc1xuICAgICAgcmVtYWluZGVycyAgPSBbXVxuICAgICAgZW9sICAgICAgICAgPSAnXFxuJ1xuICAgICAgbG5yICAgICAgICAgPSAwXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgeyBidWZmZXIsIGJ5dGVfaWR4LCBidWZmZXJfbnIsIH0gZnJvbSB3YWxrX2J1ZmZlcnNfd2l0aF9wb3NpdGlvbnMgcGF0aCwgY2ZnXG4gICAgICAgIHN0YXJ0ID0gMFxuICAgICAgICBzdG9wICA9IG51bGxcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgd2hpbGUgKCBzdG9wID0gYnVmZmVyLmluZGV4T2YgbmwsIHN0YXJ0ICkgaXNudCAtMVxuICAgICAgICAgIGlmICggc3RhcnQgPT0gMCApIGFuZCAoIHJlbWFpbmRlcnMubGVuZ3RoID4gMCApXG4gICAgICAgICAgICBsbnIrK1xuICAgICAgICAgICAgcmVtYWluZGVycy5wdXNoIGJ1ZmZlci5zbGljZSAwLCBzdG9wXG4gICAgICAgICAgICB5aWVsZCB7IGxuciwgbGluZTogKCAoIEJ1ZmZlci5jb25jYXQgcmVtYWluZGVycyApLnRvU3RyaW5nICd1dGYtOCcgKSwgZW9sLCB9XG4gICAgICAgICAgICByZW1haW5kZXJzLmxlbmd0aCA9IDBcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBsbnIrK1xuICAgICAgICAgICAgeWllbGQgeyBsbnIsIGxpbmU6ICggKCBidWZmZXIuc2xpY2Ugc3RhcnQsIHN0b3AgKS50b1N0cmluZyAndXRmLTgnICksIGVvbCwgfVxuICAgICAgICAgIHN0YXJ0ID0gc3RvcCArIDFcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmVtYWluZGVycy5wdXNoIGJ1ZmZlci5zbGljZSBzdGFydFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgcmVtYWluZGVycy5sZW5ndGggPiAwXG4gICAgICAgIGxucisrXG4gICAgICAgIHlpZWxkIHsgbG5yLCBsaW5lOiAoICggQnVmZmVyLmNvbmNhdCByZW1haW5kZXJzICkudG9TdHJpbmcgJ3V0Zi04JyApLCBlb2w6ICcnLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgd2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zLCB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuIl19
