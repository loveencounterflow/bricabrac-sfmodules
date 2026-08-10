(function() {
  'use strict';
  var fstatSync, get_type_of_stat;

  //---------------------------------------------------------------------------------------------------------
  fstatSync = null;

  //---------------------------------------------------------------------------------------------------------
  get_type_of_stat = function(fd) {
    var stats;
    if (fstatSync == null) {
      fstatSync = (require('node:fs')).fstatSync;
    }
    stats = fstatSync(fd);
    if (stats.isFIFO()) {
      return 'pipe';
    }
    if (stats.isFile()) {
      return 'file';
    }
    if (stats.isSocket()) {
      return 'socket';
    }
    return 'other'; // z.B. /dev/null, Block Device
  };

  
  //---------------------------------------------------------------------------------------------------------
  this.get_type_of_stdout = function() {
    if (process.stdout.isTTY) {
      return 'tty';
    }
    return get_type_of_stat(1);
  };

  //---------------------------------------------------------------------------------------------------------
  this.get_type_of_stdin = function() {
    if (process.stdin.isTTY) {
      return 'tty';
    }
    return get_type_of_stat(0);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS1nZXQtdHlwZS1vZi1zdGRpbi1zdGRvdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLFNBQUEsRUFBQSxnQkFBQTs7O0VBR0EsU0FBQSxHQUFZLEtBSFo7OztFQU1BLGdCQUFBLEdBQW1CLFFBQUEsQ0FBRSxFQUFGLENBQUE7QUFDbkIsUUFBQTs7TUFBRSxZQUFjLENBQUUsT0FBQSxDQUFRLFNBQVIsQ0FBRixDQUFxQixDQUFDOztJQUNwQyxLQUFBLEdBQWMsU0FBQSxDQUFVLEVBQVY7SUFDZCxJQUFtQixLQUFLLENBQUMsTUFBTixDQUFBLENBQW5CO0FBQUEsYUFBTyxPQUFQOztJQUNBLElBQW1CLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FBbkI7QUFBQSxhQUFPLE9BQVA7O0lBQ0EsSUFBbUIsS0FBSyxDQUFDLFFBQU4sQ0FBQSxDQUFuQjtBQUFBLGFBQU8sU0FBUDs7QUFDQSxXQUFPLFFBTlU7RUFBQSxFQU5uQjs7OztFQWVBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixRQUFBLENBQUEsQ0FBQTtJQUNwQixJQUFtQixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWxDO0FBQUEsYUFBTyxNQUFQOztBQUNBLFdBQU8sZ0JBQUEsQ0FBaUIsQ0FBakI7RUFGYSxFQWZ0Qjs7O0VBb0JBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixRQUFBLENBQUEsQ0FBQTtJQUNuQixJQUFtQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQWpDO0FBQUEsYUFBTyxNQUFQOztBQUNBLFdBQU8sZ0JBQUEsQ0FBaUIsQ0FBakI7RUFGWTtBQXBCckIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5mc3RhdFN5bmMgPSBudWxsXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldF90eXBlX29mX3N0YXQgPSAoIGZkICkgLT5cbiAgZnN0YXRTeW5jICA/PSAoIHJlcXVpcmUgJ25vZGU6ZnMnICkuZnN0YXRTeW5jXG4gIHN0YXRzICAgICAgID0gZnN0YXRTeW5jIGZkXG4gIHJldHVybiAncGlwZScgICBpZiBzdGF0cy5pc0ZJRk8oKVxuICByZXR1cm4gJ2ZpbGUnICAgaWYgc3RhdHMuaXNGaWxlKClcbiAgcmV0dXJuICdzb2NrZXQnIGlmIHN0YXRzLmlzU29ja2V0KClcbiAgcmV0dXJuICdvdGhlcicgICAjIHouQi4gL2Rldi9udWxsLCBCbG9jayBEZXZpY2VcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuQGdldF90eXBlX29mX3N0ZG91dCA9IC0+XG4gIHJldHVybiAndHR5JyAgICBpZiBwcm9jZXNzLnN0ZG91dC5pc1RUWVxuICByZXR1cm4gZ2V0X3R5cGVfb2Zfc3RhdCAxXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbkBnZXRfdHlwZV9vZl9zdGRpbiA9IC0+XG4gIHJldHVybiAndHR5JyAgICBpZiBwcm9jZXNzLnN0ZGluLmlzVFRZXG4gIHJldHVybiBnZXRfdHlwZV9vZl9zdGF0IDBcblxuIl19
