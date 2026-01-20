(function() {
  'use strict';
  var enumerate_prototypes_and_methods, get_all_in_prototype_chain, get_fqname, get_prototype_chain, nameit, wrap_methods_of_prototypes;

  //===========================================================================================================
  ({nameit} = (require('./various-brics')).require_nameit());

  //-----------------------------------------------------------------------------------------------------------
  get_fqname = function(prototype, name) {
    var ref, ref1;
    return `${(ref = prototype != null ? (ref1 = prototype.constructor) != null ? ref1.name : void 0 : void 0) != null ? ref : '???'}.${name}`;
  };

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
    var R, descriptor, fqname, name, prototype, ref, seen;
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
        fqname = get_fqname(prototype, name);
        R[name] = {fqname, prototype, descriptor};
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  wrap_methods_of_prototypes = function(clasz, handler) {
    var descriptor, fqname, name, prototype, ref;
    ref = enumerate_prototypes_and_methods(clasz);
    for (name in ref) {
      ({fqname, prototype, descriptor} = ref[name]);
      (function(name, fqname, prototype, descriptor) {
        var method;
        method = descriptor.value;
        descriptor.value = nameit(`wrapped$${name}`, function(...P) {
          var callme, context;
          context = this;
          callme = (function() {
            return method.call(this, ...P);
          }).bind(this);
          return handler({name, fqname, prototype, method, context, P, callme});
        });
        return Object.defineProperty(prototype, name, descriptor);
      })(name, fqname, prototype, descriptor);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  module.exports = {
    get_prototype_chain,
    get_all_in_prototype_chain,
    enumerate_prototypes_and_methods,
    wrap_methods_of_prototypes,
    internals: {get_fqname}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Byb3RvdHlwZS10b29scy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsZ0NBQUEsRUFBQSwwQkFBQSxFQUFBLFVBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSwwQkFBQTs7O0VBSUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUFrQyxDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUFsQyxFQUpBOzs7RUFRQSxVQUFBLEdBQWEsUUFBQSxDQUFFLFNBQUYsRUFBYSxJQUFiLENBQUE7QUFBc0IsUUFBQSxHQUFBLEVBQUE7V0FBQyxDQUFBLENBQUEsa0hBQWtDLEtBQWxDLENBQUEsQ0FBQSxDQUFBLENBQTJDLElBQTNDLENBQUE7RUFBdkIsRUFSYjs7O0VBV0EsbUJBQUEsR0FBc0IsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUN0QixRQUFBO0lBQUUsSUFBaUIsU0FBakI7QUFBQSxhQUFPLEdBQVA7O0lBQ0EsQ0FBQSxHQUFJLENBQUUsQ0FBRjtBQUNKLFdBQUEsSUFBQTtNQUNFLElBQWEsc0NBQWI7QUFBQSxjQUFBOztNQUNBLENBQUMsQ0FBQyxJQUFGLENBQU8sQ0FBUDtJQUZGO0FBR0EsV0FBTztFQU5hLEVBWHRCOzs7RUFvQkEsMEJBQUEsR0FBNkIsUUFBQSxDQUFFLENBQUYsRUFBSyxJQUFMLEVBQVcsT0FBTyxDQUFFLFFBQUEsQ0FBRSxDQUFGLENBQUE7YUFBUztJQUFULENBQUYsQ0FBbEIsQ0FBQTtBQUM3QixRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO0lBQUUsSUFBQSxHQUFZLElBQUksR0FBSixDQUFBO0lBQ1osQ0FBQSxHQUFZO0FBQ1o7SUFBQSxLQUFBLHFDQUFBOztNQUNFLEtBQWdCLE1BQU0sQ0FBQyxNQUFQLENBQWMsUUFBZCxFQUF3QixJQUF4QixDQUFoQjtBQUFBLGlCQUFBOztNQUNBLEtBQWdCLElBQUEsQ0FBSyxDQUFFLEtBQUEsR0FBUSxRQUFRLENBQUUsSUFBRixDQUFsQixDQUFMLENBQWhCO0FBQUEsaUJBQUE7O01BQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQO0lBSEY7QUFJQSxXQUFPO0VBUG9CLEVBcEI3Qjs7O0VBOEJBLGdDQUFBLEdBQW1DLFFBQUEsQ0FBRSxLQUFGLENBQUE7QUFDbkMsUUFBQSxDQUFBLEVBQUEsVUFBQSxFQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFFLFNBQUEsR0FBWSxLQUFLLENBQUE7SUFDakIsSUFBQSxHQUFZLElBQUksR0FBSixDQUFBO0lBQ1osQ0FBQSxHQUFZLENBQUE7QUFDWixXQUFNLG1CQUFBLElBQWUsQ0FBRSxTQUFBLEtBQWUsTUFBTSxDQUFDLFNBQXhCLENBQXJCO0FBQ0U7TUFBQSxLQUFBLFdBQUE7O1FBQ0UsSUFBWSxJQUFBLEtBQVEsYUFBcEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFZLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBVCxDQUFaO0FBQUEsbUJBQUE7O1FBQ0EsSUFBZ0IsQ0FBRSxPQUFPLFVBQVUsQ0FBQyxLQUFwQixDQUFBLEtBQStCLFVBQS9DO0FBQUEsbUJBQUE7O1FBQ0EsTUFBQSxHQUFZLFVBQUEsQ0FBVyxTQUFYLEVBQXNCLElBQXRCO1FBQ1osQ0FBQyxDQUFFLElBQUYsQ0FBRCxHQUFZLENBQUUsTUFBRixFQUFVLFNBQVYsRUFBcUIsVUFBckI7TUFMZDtNQU1BLFNBQUEsR0FBWSxNQUFNLENBQUMsY0FBUCxDQUFzQixTQUF0QjtJQVBkO0FBUUEsV0FBTztFQVowQixFQTlCbkM7OztFQTZDQSwwQkFBQSxHQUE2QixRQUFBLENBQUUsS0FBRixFQUFTLE9BQVQsQ0FBQTtBQUM3QixRQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQTtBQUFFO0lBQUEsS0FBQSxXQUFBO09BQVUsQ0FBRSxNQUFGLEVBQVUsU0FBVixFQUFxQixVQUFyQjtNQUNMLENBQUEsUUFBQSxDQUFFLElBQUYsRUFBUSxNQUFSLEVBQWdCLFNBQWhCLEVBQTJCLFVBQTNCLENBQUE7QUFDUCxZQUFBO1FBQU0sTUFBQSxHQUFVLFVBQVUsQ0FBQztRQUNyQixVQUFVLENBQUMsS0FBWCxHQUFtQixNQUFBLENBQU8sQ0FBQSxRQUFBLENBQUEsQ0FBVyxJQUFYLENBQUEsQ0FBUCxFQUEwQixRQUFBLENBQUEsR0FBRSxDQUFGLENBQUE7QUFDbkQsY0FBQSxNQUFBLEVBQUE7VUFBUSxPQUFBLEdBQVU7VUFDVixNQUFBLEdBQVUsQ0FBRSxRQUFBLENBQUEsQ0FBQTttQkFBRyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosRUFBZSxHQUFBLENBQWY7VUFBSCxDQUFGLENBQTBCLENBQUMsSUFBM0IsQ0FBZ0MsSUFBaEM7QUFDVixpQkFBTyxPQUFBLENBQVEsQ0FBRSxJQUFGLEVBQVEsTUFBUixFQUFnQixTQUFoQixFQUEyQixNQUEzQixFQUFtQyxPQUFuQyxFQUE0QyxDQUE1QyxFQUErQyxNQUEvQyxDQUFSO1FBSG9DLENBQTFCO2VBSW5CLE1BQU0sQ0FBQyxjQUFQLENBQXNCLFNBQXRCLEVBQWlDLElBQWpDLEVBQXVDLFVBQXZDO01BTkMsQ0FBQSxFQUFFLE1BQU0sUUFBUSxXQUFXO0lBRGhDO1dBUUM7RUFUMEIsRUE3QzdCOzs7RUEwREEsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixtQkFEZTtJQUVmLDBCQUZlO0lBR2YsZ0NBSGU7SUFJZiwwQkFKZTtJQUtmLFNBQUEsRUFBVyxDQUFFLFVBQUY7RUFMSTtBQTFEakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBuYW1laXQsICAgICAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldF9mcW5hbWUgPSAoIHByb3RvdHlwZSwgbmFtZSApIC0+IFwiI3twcm90b3R5cGU/LmNvbnN0cnVjdG9yPy5uYW1lID8gJz8/Pyd9LiN7bmFtZX1cIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldF9wcm90b3R5cGVfY2hhaW4gPSAoIHggKSAtPlxuICByZXR1cm4gW10gdW5sZXNzIHg/XG4gIFIgPSBbIHgsIF1cbiAgbG9vcFxuICAgIGJyZWFrIHVubGVzcyAoIHggPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApP1xuICAgIFIucHVzaCB4XG4gIHJldHVybiBSXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2V0X2FsbF9pbl9wcm90b3R5cGVfY2hhaW4gPSAoIHgsIG5hbWUsIHRha2UgPSAoICggeCApIC0+IHg/ICkgKSAtPlxuICBzZWVuICAgICAgPSBuZXcgU2V0KClcbiAgUiAgICAgICAgID0gW11cbiAgZm9yIHByb3RveXBlIGluIGdldF9wcm90b3R5cGVfY2hhaW4geFxuICAgIGNvbnRpbnVlIHVubGVzcyBPYmplY3QuaGFzT3duIHByb3RveXBlLCBuYW1lXG4gICAgY29udGludWUgdW5sZXNzIHRha2UgKCB2YWx1ZSA9IHByb3RveXBlWyBuYW1lIF0gKVxuICAgIFIucHVzaCB2YWx1ZVxuICByZXR1cm4gUlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzID0gKCBjbGFzeiApIC0+XG4gIHByb3RvdHlwZSA9IGNsYXN6OjpcbiAgc2VlbiAgICAgID0gbmV3IFNldCgpXG4gIFIgICAgICAgICA9IHt9XG4gIHdoaWxlIHByb3RvdHlwZT8gYW5kICggcHJvdG90eXBlIGlzbnQgT2JqZWN0LnByb3RvdHlwZSApXG4gICAgZm9yIG5hbWUsIGRlc2NyaXB0b3Igb2YgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMgcHJvdG90eXBlXG4gICAgICBjb250aW51ZSBpZiBuYW1lIGlzICdjb25zdHJ1Y3RvcidcbiAgICAgIGNvbnRpbnVlIGlmIHNlZW4uaGFzIG5hbWVcbiAgICAgIGNvbnRpbnVlIHVubGVzcyAoIHR5cGVvZiBkZXNjcmlwdG9yLnZhbHVlICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgZnFuYW1lICAgID0gZ2V0X2ZxbmFtZSBwcm90b3R5cGUsIG5hbWVcbiAgICAgIFJbIG5hbWUgXSA9IHsgZnFuYW1lLCBwcm90b3R5cGUsIGRlc2NyaXB0b3IsIH1cbiAgICBwcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgcHJvdG90eXBlXG4gIHJldHVybiBSXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxud3JhcF9tZXRob2RzX29mX3Byb3RvdHlwZXMgPSAoIGNsYXN6LCBoYW5kbGVyICkgLT5cbiAgZm9yIG5hbWUsIHsgZnFuYW1lLCBwcm90b3R5cGUsIGRlc2NyaXB0b3IsIH0gb2YgZW51bWVyYXRlX3Byb3RvdHlwZXNfYW5kX21ldGhvZHMgY2xhc3pcbiAgICBkbyAoIG5hbWUsIGZxbmFtZSwgcHJvdG90eXBlLCBkZXNjcmlwdG9yICkgLT5cbiAgICAgIG1ldGhvZCAgPSBkZXNjcmlwdG9yLnZhbHVlXG4gICAgICBkZXNjcmlwdG9yLnZhbHVlID0gbmFtZWl0IFwid3JhcHBlZCQje25hbWV9XCIsICggUC4uLiApIC0+XG4gICAgICAgIGNvbnRleHQgPSBAXG4gICAgICAgIGNhbGxtZSAgPSAoIC0+IG1ldGhvZC5jYWxsIEAsIFAuLi4gKS5iaW5kIEBcbiAgICAgICAgcmV0dXJuIGhhbmRsZXIgeyBuYW1lLCBmcW5hbWUsIHByb3RvdHlwZSwgbWV0aG9kLCBjb250ZXh0LCBQLCBjYWxsbWUsIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBwcm90b3R5cGUsIG5hbWUsIGRlc2NyaXB0b3JcbiAgO251bGxcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRfcHJvdG90eXBlX2NoYWluLFxuICBnZXRfYWxsX2luX3Byb3RvdHlwZV9jaGFpbixcbiAgZW51bWVyYXRlX3Byb3RvdHlwZXNfYW5kX21ldGhvZHMsXG4gIHdyYXBfbWV0aG9kc19vZl9wcm90b3R5cGVzLFxuICBpbnRlcm5hbHM6IHsgZ2V0X2ZxbmFtZSwgfSwgfVxuIl19
