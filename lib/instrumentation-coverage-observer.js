(function() {
  'use strict';
  var enumerate_prototypes_and_methods, nameit, wrap_methods_of_prototypes;

  //===========================================================================================================
  ({nameit} = (require('./various-brics')).require_nameit());

  //-----------------------------------------------------------------------------------------------------------
  enumerate_prototypes_and_methods = function(clasz) {
    var R, descriptor, name, prototype, ref, seen;
    prototype = clasz.prototype;
    seen = new Set();
    R = {};
    while ((prototype != null) && (prototype !== Object.prototype)) {
      ref = Object.getOwnPropertyDescriptors(prototype);
      for (name in ref) {
        descriptor = ref[name];
        if (name === 'constructor') {
          continue;
        }
        if (seen.has(name)) {
          continue;
        }
        if ((typeof descriptor.value) !== 'function') {
          continue;
        }
        R[name] = {prototype, descriptor};
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  wrap_methods_of_prototypes = function(clasz, handler = function() {}) {
    var descriptor, name, prototype, ref;
    ref = enumerate_prototypes_and_methods(clasz);
    for (name in ref) {
      ({prototype, descriptor} = ref[name]);
      (function(name, prototype, descriptor) {
        var method;
        method = descriptor.value;
        descriptor.value = nameit(`$wrapped_${name}`, function(...P) {
          handler({name, prototype});
          return method.call(this, ...P);
        });
        return Object.defineProperty(prototype, name, descriptor);
      })(name, prototype, descriptor);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  module.exports = {enumerate_prototypes_and_methods, wrap_methods_of_prototypes};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2luc3RydW1lbnRhdGlvbi1jb3ZlcmFnZS1vYnNlcnZlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZ0NBQUEsRUFBQSxNQUFBLEVBQUEsMEJBQUE7OztFQUdBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBbEMsRUFIQTs7O0VBT0EsZ0NBQUEsR0FBbUMsUUFBQSxDQUFFLEtBQUYsQ0FBQTtBQUNuQyxRQUFBLENBQUEsRUFBQSxVQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxHQUFBLEVBQUE7SUFBRSxTQUFBLEdBQVksS0FBSyxDQUFBO0lBQ2pCLElBQUEsR0FBWSxJQUFJLEdBQUosQ0FBQTtJQUNaLENBQUEsR0FBWSxDQUFBO0FBQ1osV0FBTSxtQkFBQSxJQUFlLENBQUUsU0FBQSxLQUFlLE1BQU0sQ0FBQyxTQUF4QixDQUFyQjtBQUNFO01BQUEsS0FBQSxXQUFBOztRQUNFLElBQVksSUFBQSxLQUFRLGFBQXBCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBWSxJQUFJLENBQUMsR0FBTCxDQUFTLElBQVQsQ0FBWjtBQUFBLG1CQUFBOztRQUNBLElBQWdCLENBQUUsT0FBTyxVQUFVLENBQUMsS0FBcEIsQ0FBQSxLQUErQixVQUEvQztBQUFBLG1CQUFBOztRQUNBLENBQUMsQ0FBRSxJQUFGLENBQUQsR0FBWSxDQUFFLFNBQUYsRUFBYSxVQUFiO01BSmQ7TUFLQSxTQUFBLEdBQVksTUFBTSxDQUFDLGNBQVAsQ0FBc0IsU0FBdEI7SUFOZDtBQU9BLFdBQU87RUFYMEIsRUFQbkM7OztFQXFCQSwwQkFBQSxHQUE2QixRQUFBLENBQUUsS0FBRixFQUFTLFVBQVUsUUFBQSxDQUFBLENBQUEsRUFBQSxDQUFuQixDQUFBO0FBQzdCLFFBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUE7QUFBRTtJQUFBLEtBQUEsV0FBQTtPQUFVLENBQUUsU0FBRixFQUFhLFVBQWI7TUFDTCxDQUFBLFFBQUEsQ0FBRSxJQUFGLEVBQVEsU0FBUixFQUFtQixVQUFuQixDQUFBO0FBQ1AsWUFBQTtRQUFNLE1BQUEsR0FBUyxVQUFVLENBQUM7UUFDcEIsVUFBVSxDQUFDLEtBQVgsR0FBbUIsTUFBQSxDQUFPLENBQUEsU0FBQSxDQUFBLENBQVksSUFBWixDQUFBLENBQVAsRUFBMkIsUUFBQSxDQUFBLEdBQUUsQ0FBRixDQUFBO1VBQzVDLE9BQUEsQ0FBUSxDQUFFLElBQUYsRUFBUSxTQUFSLENBQVI7QUFDQSxpQkFBTyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosRUFBZSxHQUFBLENBQWY7UUFGcUMsQ0FBM0I7ZUFHbkIsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsU0FBdEIsRUFBaUMsSUFBakMsRUFBdUMsVUFBdkM7TUFMQyxDQUFBLEVBQUUsTUFBTSxXQUFXO0lBRHhCO1dBT0M7RUFSMEIsRUFyQjdCOzs7RUFnQ0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxnQ0FBRixFQUFvQywwQkFBcEM7QUFoQ2pCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IG5hbWVpdCwgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZW51bWVyYXRlX3Byb3RvdHlwZXNfYW5kX21ldGhvZHMgPSAoIGNsYXN6ICkgLT5cbiAgcHJvdG90eXBlID0gY2xhc3o6OlxuICBzZWVuICAgICAgPSBuZXcgU2V0KClcbiAgUiAgICAgICAgID0ge31cbiAgd2hpbGUgcHJvdG90eXBlPyBhbmQgKCBwcm90b3R5cGUgaXNudCBPYmplY3QucHJvdG90eXBlIClcbiAgICBmb3IgbmFtZSwgZGVzY3JpcHRvciBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyBwcm90b3R5cGVcbiAgICAgIGNvbnRpbnVlIGlmIG5hbWUgaXMgJ2NvbnN0cnVjdG9yJ1xuICAgICAgY29udGludWUgaWYgc2Vlbi5oYXMgbmFtZVxuICAgICAgY29udGludWUgdW5sZXNzICggdHlwZW9mIGRlc2NyaXB0b3IudmFsdWUgKSBpcyAnZnVuY3Rpb24nXG4gICAgICBSWyBuYW1lIF0gPSB7IHByb3RvdHlwZSwgZGVzY3JpcHRvciwgfVxuICAgIHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiBwcm90b3R5cGVcbiAgcmV0dXJuIFJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG53cmFwX21ldGhvZHNfb2ZfcHJvdG90eXBlcyA9ICggY2xhc3osIGhhbmRsZXIgPSAtPiApIC0+XG4gIGZvciBuYW1lLCB7IHByb3RvdHlwZSwgZGVzY3JpcHRvciwgfSBvZiBlbnVtZXJhdGVfcHJvdG90eXBlc19hbmRfbWV0aG9kcyBjbGFzelxuICAgIGRvICggbmFtZSwgcHJvdG90eXBlLCBkZXNjcmlwdG9yICkgLT5cbiAgICAgIG1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWVcbiAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBuYW1laXQgXCIkd3JhcHBlZF8je25hbWV9XCIsICggUC4uLiApIC0+XG4gICAgICAgIGhhbmRsZXIgeyBuYW1lLCBwcm90b3R5cGUsIH1cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsIEAsIFAuLi5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBwcm90b3R5cGUsIG5hbWUsIGRlc2NyaXB0b3JcbiAgO251bGxcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5tb2R1bGUuZXhwb3J0cyA9IHsgZW51bWVyYXRlX3Byb3RvdHlwZXNfYW5kX21ldGhvZHMsIHdyYXBfbWV0aG9kc19vZl9wcm90b3R5cGVzLCB9XG5cblxuXG5cbiJdfQ==
