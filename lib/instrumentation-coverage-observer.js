(function() {
  'use strict';
  var enumerate_prototypes_and_methods, wrap_methods_of_prototypes;

  //-----------------------------------------------------------------------------------------------------------
  enumerate_prototypes_and_methods = function(clasz) {
    var R, descriptor, key, prototype, ref, seen;
    prototype = clasz.prototype;
    seen = new Set();
    R = {};
    while ((prototype != null) && (prototype !== Object.prototype)) {
      ref = Object.getOwnPropertyDescriptors(prototype);
      for (key in ref) {
        descriptor = ref[key];
        if (key === 'constructor') {
          continue;
        }
        if (seen.has(key)) {
          continue;
        }
        if ((typeof descriptor.value) !== 'function') {
          continue;
        }
        R[key] = {prototype, descriptor};
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  wrap_methods_of_prototypes = function(clasz, handler = function() {}) {
    var descriptor, key, prototype, ref;
    ref = enumerate_prototypes_and_methods(clasz);
    for (key in ref) {
      ({prototype, descriptor} = ref[key]);
      (function(key, prototype, descriptor) {
        var method;
        method = descriptor.value;
        descriptor.value = function(...P) {
          handler({key, prototype});
          return method.call(this, ...P);
        };
        return Object.defineProperty(prototype, key, descriptor);
      })(key, prototype, descriptor);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  module.exports = {enumerate_prototypes_and_methods, wrap_methods_of_prototypes};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2luc3RydW1lbnRhdGlvbi1jb3ZlcmFnZS1vYnNlcnZlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZ0NBQUEsRUFBQSwwQkFBQTs7O0VBR0EsZ0NBQUEsR0FBbUMsUUFBQSxDQUFFLEtBQUYsQ0FBQTtBQUNuQyxRQUFBLENBQUEsRUFBQSxVQUFBLEVBQUEsR0FBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUE7SUFBRSxTQUFBLEdBQVksS0FBSyxDQUFBO0lBQ2pCLElBQUEsR0FBWSxJQUFJLEdBQUosQ0FBQTtJQUNaLENBQUEsR0FBWSxDQUFBO0FBQ1osV0FBTSxtQkFBQSxJQUFlLENBQUUsU0FBQSxLQUFlLE1BQU0sQ0FBQyxTQUF4QixDQUFyQjtBQUNFO01BQUEsS0FBQSxVQUFBOztRQUNFLElBQVksR0FBQSxLQUFPLGFBQW5CO0FBQUEsbUJBQUE7O1FBQ0EsSUFBWSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQVQsQ0FBWjtBQUFBLG1CQUFBOztRQUNBLElBQWdCLENBQUUsT0FBTyxVQUFVLENBQUMsS0FBcEIsQ0FBQSxLQUErQixVQUEvQztBQUFBLG1CQUFBOztRQUNBLENBQUMsQ0FBRSxHQUFGLENBQUQsR0FBVyxDQUFFLFNBQUYsRUFBYSxVQUFiO01BSmI7TUFLQSxTQUFBLEdBQVksTUFBTSxDQUFDLGNBQVAsQ0FBc0IsU0FBdEI7SUFOZDtBQU9BLFdBQU87RUFYMEIsRUFIbkM7OztFQWlCQSwwQkFBQSxHQUE2QixRQUFBLENBQUUsS0FBRixFQUFTLFVBQVUsUUFBQSxDQUFBLENBQUEsRUFBQSxDQUFuQixDQUFBO0FBQzdCLFFBQUEsVUFBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUE7QUFBRTtJQUFBLEtBQUEsVUFBQTtPQUFTLENBQUUsU0FBRixFQUFhLFVBQWI7TUFDSixDQUFBLFFBQUEsQ0FBRSxHQUFGLEVBQU8sU0FBUCxFQUFrQixVQUFsQixDQUFBO0FBQ1AsWUFBQTtRQUFNLE1BQUEsR0FBUyxVQUFVLENBQUM7UUFDcEIsVUFBVSxDQUFDLEtBQVgsR0FBbUIsUUFBQSxDQUFBLEdBQUUsQ0FBRixDQUFBO1VBQ2pCLE9BQUEsQ0FBUSxDQUFFLEdBQUYsRUFBTyxTQUFQLENBQVI7QUFDQSxpQkFBTyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosRUFBZSxHQUFBLENBQWY7UUFGVTtlQUduQixNQUFNLENBQUMsY0FBUCxDQUFzQixTQUF0QixFQUFpQyxHQUFqQyxFQUFzQyxVQUF0QztNQUxDLENBQUEsRUFBRSxLQUFLLFdBQVc7SUFEdkI7V0FPQztFQVIwQixFQWpCN0I7OztFQTRCQSxNQUFNLENBQUMsT0FBUCxHQUFpQixDQUFFLGdDQUFGLEVBQW9DLDBCQUFwQztBQTVCakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzID0gKCBjbGFzeiApIC0+XG4gIHByb3RvdHlwZSA9IGNsYXN6OjpcbiAgc2VlbiAgICAgID0gbmV3IFNldCgpXG4gIFIgICAgICAgICA9IHt9XG4gIHdoaWxlIHByb3RvdHlwZT8gYW5kICggcHJvdG90eXBlIGlzbnQgT2JqZWN0LnByb3RvdHlwZSApXG4gICAgZm9yIGtleSwgZGVzY3JpcHRvciBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyBwcm90b3R5cGVcbiAgICAgIGNvbnRpbnVlIGlmIGtleSBpcyAnY29uc3RydWN0b3InXG4gICAgICBjb250aW51ZSBpZiBzZWVuLmhhcyBrZXlcbiAgICAgIGNvbnRpbnVlIHVubGVzcyAoIHR5cGVvZiBkZXNjcmlwdG9yLnZhbHVlICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgUlsga2V5IF0gPSB7IHByb3RvdHlwZSwgZGVzY3JpcHRvciwgfVxuICAgIHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiBwcm90b3R5cGVcbiAgcmV0dXJuIFJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG53cmFwX21ldGhvZHNfb2ZfcHJvdG90eXBlcyA9ICggY2xhc3osIGhhbmRsZXIgPSAtPiApIC0+XG4gIGZvciBrZXksIHsgcHJvdG90eXBlLCBkZXNjcmlwdG9yLCB9IG9mIGVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzIGNsYXN6XG4gICAgZG8gKCBrZXksIHByb3RvdHlwZSwgZGVzY3JpcHRvciApIC0+XG4gICAgICBtZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlXG4gICAgICBkZXNjcmlwdG9yLnZhbHVlID0gKCBQLi4uICkgLT5cbiAgICAgICAgaGFuZGxlciB7IGtleSwgcHJvdG90eXBlLCB9XG4gICAgICAgIHJldHVybiBtZXRob2QuY2FsbCBALCBQLi4uXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkgcHJvdG90eXBlLCBrZXksIGRlc2NyaXB0b3JcbiAgO251bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5tb2R1bGUuZXhwb3J0cyA9IHsgZW51bWVyYXRlX3Byb3RvdHlwZXNfYW5kX21ldGhvZHMsIHdyYXBfbWV0aG9kc19vZl9wcm90b3R5cGVzLCB9XG5cblxuXG5cbiJdfQ==
