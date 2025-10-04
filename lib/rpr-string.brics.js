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
    require_rpr_string: function() {
      var exports, rpr_string;
      //===========================================================================================================
      rpr_string = function(t) {
        var R;
        // thx to https://github.com/browserify/node-util/blob/master/util.js
        R = JSON.stringify(t);
        R = R.replace(/^"|"$/g, '');
        R = R.replace(/'/g, "\\'");
        R = R.replace(/\\"/g, '"');
        return `'${R}'`;
      };
      //.......................................................................................................
      return exports = {rpr_string};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Jwci1zdHJpbmcuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLEtBQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxrQkFBQSxFQUFvQixRQUFBLENBQUEsQ0FBQTtBQUV0QixVQUFBLE9BQUEsRUFBQSxVQUFBOztNQUNJLFVBQUEsR0FBYSxRQUFBLENBQUUsQ0FBRixDQUFBO0FBQ2pCLFlBQUEsQ0FBQTs7UUFDTSxDQUFBLEdBQUksSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFmO1FBQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsUUFBVixFQUE0QixFQUE1QjtRQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLElBQVYsRUFBNEIsS0FBNUI7UUFDSixDQUFBLEdBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxNQUFWLEVBQTRCLEdBQTVCO0FBQ0osZUFBTyxDQUFBLENBQUEsQ0FBQSxDQUFJLENBQUosQ0FBQSxDQUFBO01BTkksRUFEakI7O0FBVUksYUFBTyxPQUFBLEdBQVUsQ0FBRSxVQUFGO0lBWkM7RUFBcEIsRUFiRjs7O0VBNEJBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBNUJBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3Jwcl9zdHJpbmc6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBycHJfc3RyaW5nID0gKCB0ICkgLT5cbiAgICAgICMgdGh4IHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L25vZGUtdXRpbC9ibG9iL21hc3Rlci91dGlsLmpzXG4gICAgICBSID0gSlNPTi5zdHJpbmdpZnkgdFxuICAgICAgUiA9IFIucmVwbGFjZSAvLy8gXlwiIHwgXCIkIC8vL2csICcnXG4gICAgICBSID0gUi5yZXBsYWNlIC8vLyAnICAgICAgIC8vL2csIFwiXFxcXCdcIlxuICAgICAgUiA9IFIucmVwbGFjZSAvLy8gXFxcXFwiICAgICAvLy9nLCAnXCInXG4gICAgICByZXR1cm4gXCInI3tSfSdcIlxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgcnByX3N0cmluZywgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cblxuIl19
