(function() {
  'use strict';
  var CRYPTO;

  //===========================================================================================================
  // { debug, }  = console
  CRYPTO = require('crypto');

  //---------------------------------------------------------------------------------------------------------
  this.get_shasum = (text, length = null, algorithm = 'sha256', encoding = 'hex') => {
    var R;
    R = ((CRYPTO.createHash(algorithm)).update(text)).digest(encoding);
    if (length == null) {
      return R;
    }
    return R.slice(0, length);
  };

  //---------------------------------------------------------------------------------------------------------
  this.get_sha1sum7d = (text) => {
    return this.get_shasum(text, 7, 'sha1', 'hex');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NoYXN1bS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsTUFBQTs7OztFQUlBLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUixFQUpUOzs7RUFPQSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUUsSUFBRixFQUFRLFNBQVMsSUFBakIsRUFBdUIsWUFBWSxRQUFuQyxFQUE2QyxXQUFXLEtBQXhELENBQUEsR0FBQTtBQUNkLFFBQUE7SUFBRSxDQUFBLEdBQUksQ0FBRSxDQUFFLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFNBQWxCLENBQUYsQ0FBK0IsQ0FBQyxNQUFoQyxDQUF1QyxJQUF2QyxDQUFGLENBQStDLENBQUMsTUFBaEQsQ0FBdUQsUUFBdkQ7SUFDSixJQUFnQixjQUFoQjtBQUFBLGFBQU8sRUFBUDs7QUFDQSxXQUFPLENBQUM7RUFISSxFQVBkOzs7RUFhQSxJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFFLElBQUYsQ0FBQSxHQUFBO1dBQVksSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLENBQWxCLEVBQXFCLE1BQXJCLEVBQTZCLEtBQTdCO0VBQVo7QUFiakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBkZWJ1ZywgfSAgPSBjb25zb2xlXG5DUllQVE8gPSByZXF1aXJlICdjcnlwdG8nXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbkBnZXRfc2hhc3VtID0gKCB0ZXh0LCBsZW5ndGggPSBudWxsLCBhbGdvcml0aG0gPSAnc2hhMjU2JywgZW5jb2RpbmcgPSAnaGV4JyApID0+XG4gIFIgPSAoICggQ1JZUFRPLmNyZWF0ZUhhc2ggYWxnb3JpdGhtICkudXBkYXRlIHRleHQgKS5kaWdlc3QgZW5jb2RpbmdcbiAgcmV0dXJuIFIgdW5sZXNzIGxlbmd0aD9cbiAgcmV0dXJuIFJbIC4uLiBsZW5ndGggXVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5AZ2V0X3NoYTFzdW03ZCA9ICggdGV4dCApID0+IEBnZXRfc2hhc3VtIHRleHQsIDcsICdzaGExJywgJ2hleCdcblxuXG4iXX0=
