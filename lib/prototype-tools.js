(function() {
  'use strict';
  var enumerate_prototypes_and_methods, get_all_in_prototype_chain, get_prototype_chain, nameit, wrap_methods_of_prototypes;

  //===========================================================================================================
  ({nameit} = (require('./various-brics')).require_nameit());

  //-----------------------------------------------------------------------------------------------------------
  get_prototype_chain = function(x) {
    var R;
    if (x == null) {
      return [];
    }
    R = [x];
    while (true) {
      if ((x = Object.getPrototypeOf(x)) == null) {
        break;
      }
      R.push(x);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  get_all_in_prototype_chain = function(x, name, take = (function(x) {
      return x != null;
    })) {
    var R, i, len, protoype, ref, seen, value;
    seen = new Set();
    R = [];
    ref = get_prototype_chain(x);
    for (i = 0, len = ref.length; i < len; i++) {
      protoype = ref[i];
      if (!Object.hasOwn(protoype, name)) {
        continue;
      }
      if (!take((value = protoype[name]))) {
        continue;
      }
      R.push(value);
    }
    return R;
  };

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
  wrap_methods_of_prototypes = function(clasz, handler) {
    var descriptor, name, prototype, ref;
    ref = enumerate_prototypes_and_methods(clasz);
    for (name in ref) {
      ({prototype, descriptor} = ref[name]);
      (function(name, prototype, descriptor) {
        var method;
        return method = descriptor.value;
      })(name, prototype, descriptor);
    }
    // descriptor.value = nameit "$wrapped_#{name}", ( P... ) ->
    //   return handler { name, prototype, context: @, P, }
    //   # return handler { name, prototype, P, }
    //   # return method.call @, P...
    // Object.defineProperty prototype, name, descriptor
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  module.exports = {get_prototype_chain, get_all_in_prototype_chain, enumerate_prototypes_and_methods, wrap_methods_of_prototypes};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Byb3RvdHlwZS10b29scy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZ0NBQUEsRUFBQSwwQkFBQSxFQUFBLG1CQUFBLEVBQUEsTUFBQSxFQUFBLDBCQUFBOzs7RUFJQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQWtDLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQWxDLEVBSkE7OztFQVFBLG1CQUFBLEdBQXNCLFFBQUEsQ0FBRSxDQUFGLENBQUE7QUFDdEIsUUFBQTtJQUFFLElBQWlCLFNBQWpCO0FBQUEsYUFBTyxHQUFQOztJQUNBLENBQUEsR0FBSSxDQUFFLENBQUY7QUFDSixXQUFBLElBQUE7TUFDRSxJQUFhLHNDQUFiO0FBQUEsY0FBQTs7TUFDQSxDQUFDLENBQUMsSUFBRixDQUFPLENBQVA7SUFGRjtBQUdBLFdBQU87RUFOYSxFQVJ0Qjs7O0VBaUJBLDBCQUFBLEdBQTZCLFFBQUEsQ0FBRSxDQUFGLEVBQUssSUFBTCxFQUFXLE9BQU8sQ0FBRSxRQUFBLENBQUUsQ0FBRixDQUFBO2FBQVM7SUFBVCxDQUFGLENBQWxCLENBQUE7QUFDN0IsUUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtJQUFFLElBQUEsR0FBWSxJQUFJLEdBQUosQ0FBQTtJQUNaLENBQUEsR0FBWTtBQUNaO0lBQUEsS0FBQSxxQ0FBQTs7TUFDRSxLQUFnQixNQUFNLENBQUMsTUFBUCxDQUFjLFFBQWQsRUFBd0IsSUFBeEIsQ0FBaEI7QUFBQSxpQkFBQTs7TUFDQSxLQUFnQixJQUFBLENBQUssQ0FBRSxLQUFBLEdBQVEsUUFBUSxDQUFFLElBQUYsQ0FBbEIsQ0FBTCxDQUFoQjtBQUFBLGlCQUFBOztNQUNBLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUDtJQUhGO0FBSUEsV0FBTztFQVBvQixFQWpCN0I7OztFQTJCQSxnQ0FBQSxHQUFtQyxRQUFBLENBQUUsS0FBRixDQUFBO0FBQ25DLFFBQUEsQ0FBQSxFQUFBLFVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFFLFNBQUEsR0FBWSxLQUFLLENBQUE7SUFDakIsSUFBQSxHQUFZLElBQUksR0FBSixDQUFBO0lBQ1osQ0FBQSxHQUFZLENBQUE7QUFDWixXQUFNLG1CQUFBLElBQWUsQ0FBRSxTQUFBLEtBQWUsTUFBTSxDQUFDLFNBQXhCLENBQXJCO0FBQ0U7TUFBQSxLQUFBLFdBQUE7O1FBQ0UsSUFBWSxJQUFBLEtBQVEsYUFBcEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFZLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBVCxDQUFaO0FBQUEsbUJBQUE7O1FBQ0EsSUFBZ0IsQ0FBRSxPQUFPLFVBQVUsQ0FBQyxLQUFwQixDQUFBLEtBQStCLFVBQS9DO0FBQUEsbUJBQUE7O1FBQ0EsQ0FBQyxDQUFFLElBQUYsQ0FBRCxHQUFZLENBQUUsU0FBRixFQUFhLFVBQWI7TUFKZDtNQUtBLFNBQUEsR0FBWSxNQUFNLENBQUMsY0FBUCxDQUFzQixTQUF0QjtJQU5kO0FBT0EsV0FBTztFQVgwQixFQTNCbkM7OztFQXlDQSwwQkFBQSxHQUE2QixRQUFBLENBQUUsS0FBRixFQUFTLE9BQVQsQ0FBQTtBQUM3QixRQUFBLFVBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBO0FBQUU7SUFBQSxLQUFBLFdBQUE7T0FBVSxDQUFFLFNBQUYsRUFBYSxVQUFiO01BQ0wsQ0FBQSxRQUFBLENBQUUsSUFBRixFQUFRLFNBQVIsRUFBbUIsVUFBbkIsQ0FBQTtBQUNQLFlBQUE7ZUFBTSxNQUFBLEdBQVMsVUFBVSxDQUFDO01BRG5CLENBQUEsRUFBRSxNQUFNLFdBQVc7SUFEeEIsQ0FBRjs7Ozs7O1dBUUc7RUFUMEIsRUF6QzdCOzs7RUFzREEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FDZixtQkFEZSxFQUVmLDBCQUZlLEVBR2YsZ0NBSGUsRUFJZiwwQkFKZTtBQXREakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldF9wcm90b3R5cGVfY2hhaW4gPSAoIHggKSAtPlxuICByZXR1cm4gW10gdW5sZXNzIHg/XG4gIFIgPSBbIHgsIF1cbiAgbG9vcFxuICAgIGJyZWFrIHVubGVzcyAoIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApP1xuICAgIFIucHVzaCB4XG4gIHJldHVybiBSXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gPSAoIHgsIG5hbWUsIHRha2UgPSAoICggeCApIC0+IHg/ICkgKSAtPlxuICBzZWVuICAgICAgPSBuZXcgU2V0KClcbiAgUiAgICAgICAgID0gW11cbiAgZm9yIHByb3RveXBlIGluIGdldF9wcm90b3R5cGVfY2hhaW4geFxuICAgIGNvbnRpbnVlIHVubGVzcyBPYmplY3QuaGFzT3duIHByb3RveXBlLCBuYW1lXG4gICAgY29udGludWUgdW5sZXNzIHRha2UgKCB2YWx1ZSA9IHByb3RveXBlWyBuYW1lIF0gKVxuICAgIFIucHVzaCB2YWx1ZVxuICByZXR1cm4gUlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzID0gKCBjbGFzeiApIC0+XG4gIHByb3RvdHlwZSA9IGNsYXN6OjpcbiAgc2VlbiAgICAgID0gbmV3IFNldCgpXG4gIFIgICAgICAgICA9IHt9XG4gIHdoaWxlIHByb3RvdHlwZT8gYW5kICggcHJvdG90eXBlIGlzbnQgT2JqZWN0LnByb3RvdHlwZSApXG4gICAgZm9yIG5hbWUsIGRlc2NyaXB0b3Igb2YgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMgcHJvdG90eXBlXG4gICAgICBjb250aW51ZSBpZiBuYW1lIGlzICdjb25zdHJ1Y3RvcidcbiAgICAgIGNvbnRpbnVlIGlmIHNlZW4uaGFzIG5hbWVcbiAgICAgIGNvbnRpbnVlIHVubGVzcyAoIHR5cGVvZiBkZXNjcmlwdG9yLnZhbHVlICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgUlsgbmFtZSBdID0geyBwcm90b3R5cGUsIGRlc2NyaXB0b3IsIH1cbiAgICBwcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgcHJvdG90eXBlXG4gIHJldHVybiBSXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxud3JhcF9tZXRob2RzX29mX3Byb3RvdHlwZXMgPSAoIGNsYXN6LCBoYW5kbGVyICkgLT5cbiAgZm9yIG5hbWUsIHsgcHJvdG90eXBlLCBkZXNjcmlwdG9yLCB9IG9mIGVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzIGNsYXN6XG4gICAgZG8gKCBuYW1lLCBwcm90b3R5cGUsIGRlc2NyaXB0b3IgKSAtPlxuICAgICAgbWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZVxuICAgICAgIyBkZXNjcmlwdG9yLnZhbHVlID0gbmFtZWl0IFwiJHdyYXBwZWRfI3tuYW1lfVwiLCAoIFAuLi4gKSAtPlxuICAgICAgIyAgIHJldHVybiBoYW5kbGVyIHsgbmFtZSwgcHJvdG90eXBlLCBjb250ZXh0OiBALCBQLCB9XG4gICAgICAjICAgIyByZXR1cm4gaGFuZGxlciB7IG5hbWUsIHByb3RvdHlwZSwgUCwgfVxuICAgICAgIyAgICMgcmV0dXJuIG1ldGhvZC5jYWxsIEAsIFAuLi5cbiAgICAgICMgT2JqZWN0LmRlZmluZVByb3BlcnR5IHByb3RvdHlwZSwgbmFtZSwgZGVzY3JpcHRvclxuICA7bnVsbFxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldF9wcm90b3R5cGVfY2hhaW4sXG4gIGdldF9hbGxfaW5fcHJvdG90eXBlX2NoYWluLFxuICBlbnVtZXJhdGVfcHJvdG90eXBlc19hbmRfbWV0aG9kcyxcbiAgd3JhcF9tZXRob2RzX29mX3Byb3RvdHlwZXMsIH1cbiJdfQ==
