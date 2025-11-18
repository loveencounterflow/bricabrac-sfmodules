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
            lnr++;
            if ((start === 0) && (remainders.length > 0)) {
              remainders.push(buffer.slice(start, stop));
              yield ({
                lnr,
                line: (Buffer.concat(remainders)).toString('utf-8'),
                eol
              });
              remainders.length = 0;
            } else {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWZhc3QtbGluZXJlYWRlci1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsS0FBQTs7Ozs7RUFPQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsdUJBQUEsRUFBeUIsUUFBQSxDQUFBLENBQUE7QUFDM0IsVUFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLDJCQUFBLEVBQUE7TUFBSSxFQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7TUFDZCxFQUFBLEdBQWMsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsQ0FBakI7TUFDZCxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWMsT0FBZCxFQUZKOztNQUtJLFNBQUEsR0FDRTtRQUFBLCtCQUFBLEVBQ0U7VUFBQSxVQUFBLEVBQWdCLEVBQUEsR0FBSztRQUFyQjtNQURGLEVBTk47O01BVUksMkJBQUEsR0FBOEIsU0FBQSxDQUFFLElBQUYsRUFBUSxHQUFSLENBQUE7QUFDbEMsWUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsVUFBQSxFQUFBLEVBQUE7OztRQUVNLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0IsQ0FBRSxHQUFBLFNBQVMsQ0FBQywrQkFBWixFQUFnRCxHQUFBLEdBQWhELENBQWxCO1FBQ0EsRUFBQSxHQUFrQixFQUFFLENBQUMsUUFBSCxDQUFZLElBQVo7UUFDbEIsUUFBQSxHQUFrQjtRQUNsQixTQUFBLEdBQWtCO0FBQ2xCLGVBQUEsSUFBQTtVQUNFLE1BQUEsR0FBYyxNQUFNLENBQUMsS0FBUCxDQUFhLFVBQWI7VUFDZCxVQUFBLEdBQWMsRUFBRSxDQUFDLFFBQUgsQ0FBWSxFQUFaLEVBQWdCLE1BQWhCLEVBQXdCLENBQXhCLEVBQTJCLFVBQTNCLEVBQXVDLFFBQXZDO1VBQ2QsSUFBUyxVQUFBLEtBQWMsQ0FBdkI7QUFBQSxrQkFBQTs7VUFDQSxJQUErQyxVQUFBLEdBQWEsVUFBNUQ7WUFBQSxNQUFBLEdBQWMsTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBbkIsRUFBZDs7VUFDQSxTQUFBO1VBQ0EsTUFBTSxDQUFBLENBQUUsTUFBRixFQUFVLFFBQVYsRUFBb0IsU0FBcEIsQ0FBQTtVQUNOLFFBQUEsSUFBYztRQVBoQjtBQVFBLGVBQU87TUFmcUIsRUFWbEM7O01BNEJJLHlCQUFBLEdBQTRCLFNBQUEsQ0FBRSxJQUFGLEVBQVEsR0FBUixDQUFBO0FBQ2hDLFlBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBOztRQUNNLFVBQUEsR0FBYztRQUNkLEdBQUEsR0FBYztRQUNkLEdBQUEsR0FBYyxFQUhwQjs7UUFLTSxLQUFBLDJDQUFBO1dBQUksQ0FBRSxNQUFGLEVBQVUsUUFBVixFQUFvQixTQUFwQjtVQUNGLEtBQUEsR0FBUTtVQUNSLElBQUEsR0FBUSxLQURoQjs7QUFHUSxpQkFBTSxDQUFFLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFlLEVBQWYsRUFBbUIsS0FBbkIsQ0FBVCxDQUFBLEtBQXlDLENBQUMsQ0FBaEQ7WUFDRSxHQUFBO1lBQ0EsSUFBRyxDQUFFLEtBQUEsS0FBUyxDQUFYLENBQUEsSUFBbUIsQ0FBRSxVQUFVLENBQUMsTUFBWCxHQUFvQixDQUF0QixDQUF0QjtjQUNFLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixFQUFvQixJQUFwQixDQUFoQjtjQUNBLE1BQU0sQ0FBQTtnQkFBRSxHQUFGO2dCQUFPLElBQUEsRUFBUSxDQUFFLE1BQU0sQ0FBQyxNQUFQLENBQWMsVUFBZCxDQUFGLENBQTRCLENBQUMsUUFBN0IsQ0FBc0MsT0FBdEMsQ0FBZjtnQkFBZ0U7Y0FBaEUsQ0FBQTtjQUNOLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLEVBSHRCO2FBQUEsTUFBQTtjQUtFLE1BQU0sQ0FBQTtnQkFBRSxHQUFGO2dCQUFPLElBQUEsRUFBUSxDQUFFLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixFQUFvQixJQUFwQixDQUFGLENBQTRCLENBQUMsUUFBN0IsQ0FBc0MsT0FBdEMsQ0FBZjtnQkFBZ0U7Y0FBaEUsQ0FBQSxFQUxSOztZQU1BLEtBQUEsR0FBUSxJQUFBLEdBQU87VUFSakIsQ0FIUjs7VUFhUSxVQUFVLENBQUMsSUFBWCxDQUFnQixNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FBaEI7UUFkRixDQUxOOztRQXFCTSxJQUFHLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXZCO1VBQ0UsR0FBQTtVQUNBLE1BQU0sQ0FBQTtZQUFFLEdBQUY7WUFBTyxJQUFBLEVBQVEsQ0FBRSxNQUFNLENBQUMsTUFBUCxDQUFjLFVBQWQsQ0FBRixDQUE0QixDQUFDLFFBQTdCLENBQXNDLE9BQXRDLENBQWY7WUFBZ0UsR0FBQSxFQUFLO1VBQXJFLENBQUEsRUFGUjtTQXJCTjs7QUF5Qk0sZUFBTztNQTFCbUIsRUE1QmhDOztBQXlESSxhQUFPLE9BQUEsR0FBVSxDQUFFLDJCQUFGLEVBQStCLHlCQUEvQjtJQTFETTtFQUF6QixFQVhGOzs7RUF3RUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUF4RUEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfZmFzdF9saW5lcmVhZGVyOiAtPlxuICAgIEZTICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcbiAgICBubCAgICAgICAgICA9ICdcXG4nLmNvZGVQb2ludEF0IDBcbiAgICB7IGRlYnVnLCAgfSA9IGNvbnNvbGVcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRlbXBsYXRlcyA9XG4gICAgICB3YWxrX2J1ZmZlcnNfd2l0aF9wb3NpdGlvbnNfY2ZnOlxuICAgICAgICBjaHVua19zaXplOiAgICAgMTYgKiAxMDI0XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX2J1ZmZlcnNfd2l0aF9wb3NpdGlvbnMgPSAoIHBhdGgsIGNmZyApIC0+XG4gICAgICAjIEgudHlwZXMudmFsaWRhdGUuZ3V5X2ZzX3dhbGtfYnVmZmVyc19jZmcgKCBjZmcgPSB7IGRlZmF1bHRzLmd1eV9mc193YWxrX2J1ZmZlcnNfY2ZnLi4uLCBjZmcuLi4sIH0gKVxuICAgICAgIyBILnR5cGVzLnZhbGlkYXRlLm5vbmVtcHR5X3RleHQgcGF0aFxuICAgICAgeyBjaHVua19zaXplIH0gID0geyB0ZW1wbGF0ZXMud2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgICBmZCAgICAgICAgICAgICAgPSBGUy5vcGVuU3luYyBwYXRoXG4gICAgICBieXRlX2lkeCAgICAgICAgPSAwXG4gICAgICBidWZmZXJfbnIgICAgICAgPSAwXG4gICAgICBsb29wXG4gICAgICAgIGJ1ZmZlciAgICAgID0gQnVmZmVyLmFsbG9jIGNodW5rX3NpemVcbiAgICAgICAgYnl0ZV9jb3VudCAgPSBGUy5yZWFkU3luYyBmZCwgYnVmZmVyLCAwLCBjaHVua19zaXplLCBieXRlX2lkeFxuICAgICAgICBicmVhayBpZiBieXRlX2NvdW50IGlzIDBcbiAgICAgICAgYnVmZmVyICAgICAgPSBidWZmZXIuc3ViYXJyYXkgMCwgYnl0ZV9jb3VudCBpZiBieXRlX2NvdW50IDwgY2h1bmtfc2l6ZVxuICAgICAgICBidWZmZXJfbnIrK1xuICAgICAgICB5aWVsZCB7IGJ1ZmZlciwgYnl0ZV9pZHgsIGJ1ZmZlcl9uciwgfVxuICAgICAgICBieXRlX2lkeCAgICs9IGJ5dGVfY291bnRcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zID0gKCBwYXRoLCBjZmcgKSAtPlxuICAgICAgIyBmcm9tIG1tb210Y2hldi9yZWFkY3N2L3JlYWRjc3YtYnVmZmVyZWQtb3B0LmpzXG4gICAgICByZW1haW5kZXJzICA9IFtdXG4gICAgICBlb2wgICAgICAgICA9ICdcXG4nXG4gICAgICBsbnIgICAgICAgICA9IDBcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciB7IGJ1ZmZlciwgYnl0ZV9pZHgsIGJ1ZmZlcl9uciwgfSBmcm9tIHdhbGtfYnVmZmVyc193aXRoX3Bvc2l0aW9ucyBwYXRoLCBjZmdcbiAgICAgICAgc3RhcnQgPSAwXG4gICAgICAgIHN0b3AgID0gbnVsbFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB3aGlsZSAoIHN0b3AgPSBidWZmZXIuaW5kZXhPZiBubCwgc3RhcnQgKSBpc250IC0xXG4gICAgICAgICAgbG5yKytcbiAgICAgICAgICBpZiAoIHN0YXJ0ID09IDAgKSBhbmQgKCByZW1haW5kZXJzLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgcmVtYWluZGVycy5wdXNoIGJ1ZmZlci5zbGljZSBzdGFydCwgc3RvcFxuICAgICAgICAgICAgeWllbGQgeyBsbnIsIGxpbmU6ICggKCBCdWZmZXIuY29uY2F0IHJlbWFpbmRlcnMgKS50b1N0cmluZyAndXRmLTgnICksIGVvbCwgfVxuICAgICAgICAgICAgcmVtYWluZGVycy5sZW5ndGggPSAwXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgeWllbGQgeyBsbnIsIGxpbmU6ICggKCBidWZmZXIuc2xpY2Ugc3RhcnQsIHN0b3AgKS50b1N0cmluZyAndXRmLTgnICksIGVvbCwgfVxuICAgICAgICAgIHN0YXJ0ID0gc3RvcCArIDFcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmVtYWluZGVycy5wdXNoIGJ1ZmZlci5zbGljZSBzdGFydFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgaWYgcmVtYWluZGVycy5sZW5ndGggPiAwXG4gICAgICAgIGxucisrXG4gICAgICAgIHlpZWxkIHsgbG5yLCBsaW5lOiAoICggQnVmZmVyLmNvbmNhdCByZW1haW5kZXJzICkudG9TdHJpbmcgJ3V0Zi04JyApLCBlb2w6ICcnLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgd2Fsa19idWZmZXJzX3dpdGhfcG9zaXRpb25zLCB3YWxrX2xpbmVzX3dpdGhfcG9zaXRpb25zLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuIl19
