(function() {
  'use strict';
  var BRICS, debug;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_loupe: function() {
      var custom, exports, inspect, registerConstructor, registerStringTag, rpr;
      ({custom, inspect, registerConstructor, registerStringTag} = require('../dependencies/loupe-2.js'));
      rpr = function(x) {
        if (x === 0/* NOTE catches +0, -0 */) {
          return '0';
        }
        if (x === null) {
          return 'null';
        }
        if (x === void 0) {
          return 'undefined';
        }
        if (x === +2e308) {
          return '+Infinity';
        }
        if (x === -2e308) {
          return '-Infinity';
        }
        if (x === '') {
          return '';
        }
        return inspect(x);
      };
      return exports = {
        rpr,
        internals: {custom, registerConstructor, registerStringTag}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xvdXBlLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7Ozs7RUFTQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsYUFBQSxFQUFlLFFBQUEsQ0FBQSxDQUFBO0FBQ2pCLFVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBO01BQUksQ0FBQSxDQUFFLE1BQUYsRUFDRSxPQURGLEVBRUUsbUJBRkYsRUFHRSxpQkFIRixDQUFBLEdBR3lCLE9BQUEsQ0FBUSw0QkFBUixDQUh6QjtNQUlBLEdBQUEsR0FBTSxRQUFBLENBQUUsQ0FBRixDQUFBO1FBQ0osSUFBdUIsQ0FBQSxLQUFLLENBQUUseUJBQTlCO0FBQUEsaUJBQU8sSUFBUDs7UUFDQSxJQUF1QixDQUFBLEtBQUssSUFBNUI7QUFBQSxpQkFBTyxPQUFQOztRQUNBLElBQXVCLENBQUEsS0FBSyxNQUE1QjtBQUFBLGlCQUFPLFlBQVA7O1FBQ0EsSUFBdUIsQ0FBQSxLQUFLLENBQUMsS0FBN0I7QUFBQSxpQkFBTyxZQUFQOztRQUNBLElBQXVCLENBQUEsS0FBSyxDQUFDLEtBQTdCO0FBQUEsaUJBQU8sWUFBUDs7UUFDQSxJQUF1QixDQUFBLEtBQUssRUFBNUI7QUFBQSxpQkFBTyxHQUFQOztBQUNBLGVBQU8sT0FBQSxDQUFRLENBQVI7TUFQSDtBQVFOLGFBQU8sT0FBQSxHQUFVO1FBQUUsR0FBRjtRQUFPLFNBQUEsRUFBVyxDQUFFLE1BQUYsRUFBVSxtQkFBVixFQUErQixpQkFBL0I7TUFBbEI7SUFiSjtFQUFmLEVBYkY7OztFQTZCQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQTdCQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfbG91cGU6IC0+XG4gICAgeyBjdXN0b20sXG4gICAgICBpbnNwZWN0LFxuICAgICAgcmVnaXN0ZXJDb25zdHJ1Y3RvcixcbiAgICAgIHJlZ2lzdGVyU3RyaW5nVGFnLCB9ID0gcmVxdWlyZSAnLi4vZGVwZW5kZW5jaWVzL2xvdXBlLTIuanMnXG4gICAgcnByID0gKCB4ICkgLT5cbiAgICAgIHJldHVybiAnMCcgICAgICAgICAgaWYgeCBpcyAwICMjIyBOT1RFIGNhdGNoZXMgKzAsIC0wICMjI1xuICAgICAgcmV0dXJuICdudWxsJyAgICAgICBpZiB4IGlzIG51bGxcbiAgICAgIHJldHVybiAndW5kZWZpbmVkJyAgaWYgeCBpcyB1bmRlZmluZWRcbiAgICAgIHJldHVybiAnK0luZmluaXR5JyAgaWYgeCBpcyArSW5maW5pdHlcbiAgICAgIHJldHVybiAnLUluZmluaXR5JyAgaWYgeCBpcyAtSW5maW5pdHlcbiAgICAgIHJldHVybiAnJyAgICAgICAgICAgaWYgeCBpcyAnJ1xuICAgICAgcmV0dXJuIGluc3BlY3QgeFxuICAgIHJldHVybiBleHBvcnRzID0geyBycHIsIGludGVybmFsczogeyBjdXN0b20sIHJlZ2lzdGVyQ29uc3RydWN0b3IsIHJlZ2lzdGVyU3RyaW5nVGFnLCB9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuIl19
