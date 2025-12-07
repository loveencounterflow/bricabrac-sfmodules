(function() {
  'use strict';
  var require_wc;

  //===========================================================================================================
  require_wc = function() {
    var exports, wc;
    //---------------------------------------------------------------------------------------------------------
    wc = function(path) {
      var CP, bytes, lines, match, ref, result;
      CP = require('node:child_process');
      result = CP.spawnSync('wc', ['--bytes', '--lines', path], {
        encoding: 'utf-8'
      });
      if (result.error != null) {
        // warn 'Ωtcs__72', rpr cause.code
        // throw new Error "Ωtcs__31 file not found: #{path}", { cause, } if cause.code is 'ENOENT'
        // debug 'Ωtcs__70', process.stdout
        // debug 'Ωtcs__71', process.stderr
        // warn 'Ωtcs__72', cause.message
        throw result.error;
      }
      // help 'Ωtcs__73', rpr result.status
      // help 'Ωtcs__74', rpr result.stdout
      // help 'Ωtcs__78', rpr result.stderr
      // help 'Ωtcs__79', rpr result.error
      match = (ref = result.stdout) != null ? ref.match(/^\s*(?<lines>\d+)\s+(?<bytes>\d+)\s+/) : void 0;
      bytes = Number(match != null ? match.groups.bytes : void 0);
      lines = Number(match != null ? match.groups.lines : void 0);
      return {bytes, lines};
    };
    //---------------------------------------------------------------------------------------------------------
    return exports = {wc};
  };

  //===========================================================================================================
  module.exports = {require_wc};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3djLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxVQUFBOzs7RUFHQSxVQUFBLEdBQWEsUUFBQSxDQUFBLENBQUE7QUFFYixRQUFBLE9BQUEsRUFBQSxFQUFBOztJQUNFLEVBQUEsR0FBSyxRQUFBLENBQUUsSUFBRixDQUFBO0FBQ1AsVUFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBO01BQUksRUFBQSxHQUFLLE9BQUEsQ0FBUSxvQkFBUjtNQUNMLE1BQUEsR0FBUyxFQUFFLENBQUMsU0FBSCxDQUFhLElBQWIsRUFBbUIsQ0FBRSxTQUFGLEVBQWEsU0FBYixFQUF3QixJQUF4QixDQUFuQixFQUFvRDtRQUFFLFFBQUEsRUFBVTtNQUFaLENBQXBEO01BTVQsSUFBc0Isb0JBQXRCOzs7Ozs7UUFBQSxNQUFNLE1BQU0sQ0FBQyxNQUFiO09BUEo7Ozs7O01BWUksS0FBQSxzQ0FBcUIsQ0FBRSxLQUFmLENBQXFCLHNDQUFyQjtNQUNSLEtBQUEsR0FBUSxNQUFBLGlCQUFPLEtBQUssQ0FBRSxNQUFNLENBQUMsY0FBckI7TUFDUixLQUFBLEdBQVEsTUFBQSxpQkFBTyxLQUFLLENBQUUsTUFBTSxDQUFDLGNBQXJCO0FBQ1IsYUFBTyxDQUFFLEtBQUYsRUFBUyxLQUFUO0lBaEJKLEVBRFA7O0FBb0JFLFdBQU8sT0FBQSxHQUFVLENBQUUsRUFBRjtFQXRCTixFQUhiOzs7RUE0QkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxVQUFGO0FBNUJqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJlcXVpcmVfd2MgPSAtPlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2MgPSAoIHBhdGggKSAtPlxuICAgIENQID0gcmVxdWlyZSAnbm9kZTpjaGlsZF9wcm9jZXNzJ1xuICAgIHJlc3VsdCA9IENQLnNwYXduU3luYyAnd2MnLCBbICctLWJ5dGVzJywgJy0tbGluZXMnLCBwYXRoLCBdLCB7IGVuY29kaW5nOiAndXRmLTgnLCB9XG4gICAgICAjIHdhcm4gJ86pdGNzX183MicsIHJwciBjYXVzZS5jb2RlXG4gICAgICAjIHRocm93IG5ldyBFcnJvciBcIs6pdGNzX18zMSBmaWxlIG5vdCBmb3VuZDogI3twYXRofVwiLCB7IGNhdXNlLCB9IGlmIGNhdXNlLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICMgZGVidWcgJ86pdGNzX183MCcsIHByb2Nlc3Muc3Rkb3V0XG4gICAgICAjIGRlYnVnICfOqXRjc19fNzEnLCBwcm9jZXNzLnN0ZGVyclxuICAgICAgIyB3YXJuICfOqXRjc19fNzInLCBjYXVzZS5tZXNzYWdlXG4gICAgdGhyb3cgcmVzdWx0LmVycm9yIGlmIHJlc3VsdC5lcnJvcj9cbiAgICAjIGhlbHAgJ86pdGNzX183MycsIHJwciByZXN1bHQuc3RhdHVzXG4gICAgIyBoZWxwICfOqXRjc19fNzQnLCBycHIgcmVzdWx0LnN0ZG91dFxuICAgICMgaGVscCAnzql0Y3NfXzc4JywgcnByIHJlc3VsdC5zdGRlcnJcbiAgICAjIGhlbHAgJ86pdGNzX183OScsIHJwciByZXN1bHQuZXJyb3JcbiAgICBtYXRjaCA9IHJlc3VsdC5zdGRvdXQ/Lm1hdGNoIC8vLyBeIFxccyogKD88bGluZXM+IFxcZCsgKSBcXHMrICg/PGJ5dGVzPiBcXGQrICkgXFxzKyAvLy9cbiAgICBieXRlcyA9IE51bWJlciBtYXRjaD8uZ3JvdXBzLmJ5dGVzXG4gICAgbGluZXMgPSBOdW1iZXIgbWF0Y2g/Lmdyb3Vwcy5saW5lc1xuICAgIHJldHVybiB7IGJ5dGVzLCBsaW5lcywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IHdjLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSB7IHJlcXVpcmVfd2MsIH1cblxuIl19
