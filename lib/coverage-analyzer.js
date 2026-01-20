(function() {
  'use strict';
  var Coverage_analyzer, debug, enumerate_prototypes_and_methods, hide, set_getter, wrap_methods_of_prototypes;

  //===========================================================================================================
  ({debug} = console);

  // { nameit,                     } = ( require './various-brics' ).require_nameit()
  ({enumerate_prototypes_and_methods, wrap_methods_of_prototypes} = require('./prototype-tools'));

  ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());

  Coverage_analyzer = (function() {
    //===========================================================================================================
    class Coverage_analyzer {
      //---------------------------------------------------------------------------------------------------------
      constructor() {
        this.counts = {};
        void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      wrap_class(clasz) {
        var base, descriptor, fqname, handler, name, prototype, ref;
        ref = enumerate_prototypes_and_methods(clasz);
        for (name in ref) {
          ({fqname, prototype, descriptor} = ref[name]);
          if ((base = this.counts)[fqname] == null) {
            base[fqname] = 0;
          }
        }
        handler = ({fqname, callme}) => {
          this.counts[fqname]++;
          return callme();
        };
        wrap_methods_of_prototypes(clasz, handler);
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    set_getter(Coverage_analyzer.prototype, 'unused_names', function() {
      var count, name, ref, results;
      ref = this.counts;
      results = [];
      for (name in ref) {
        count = ref[name];
        if (count === 0) {
          results.push(name);
        }
      }
      return results;
    });

    set_getter(Coverage_analyzer.prototype, 'used_names', function() {
      var count, name, ref, results;
      ref = this.counts;
      results = [];
      for (name in ref) {
        count = ref[name];
        if (count !== 0) {
          results.push(name);
        }
      }
      return results;
    });

    set_getter(Coverage_analyzer.prototype, 'names_by_counts', function() {
      var R, count, name, ref;
      R = {};
      ref = this.counts;
      for (name in ref) {
        count = ref[name];
        (R[count] != null ? R[count] : R[count] = []).push(name);
      }
      return R;
    });

    return Coverage_analyzer;

  }).call(this);

  //-----------------------------------------------------------------------------------------------------------
  module.exports = {Coverage_analyzer};

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvdmVyYWdlLWFuYWx5emVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxpQkFBQSxFQUFBLEtBQUEsRUFBQSxnQ0FBQSxFQUFBLElBQUEsRUFBQSxVQUFBLEVBQUEsMEJBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBa0MsT0FBbEMsRUFIQTs7O0VBS0EsQ0FBQSxDQUFFLGdDQUFGLEVBQ0UsMEJBREYsQ0FBQSxHQUNrQyxPQUFBLENBQVEsbUJBQVIsQ0FEbEM7O0VBRUEsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDa0MsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRGxDOztFQUlNOztJQUFOLE1BQUEsa0JBQUEsQ0FBQTs7TUFHRSxXQUFhLENBQUEsQ0FBQTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBQTtRQUNUO01BRlUsQ0FEZjs7O01BTUUsVUFBWSxDQUFFLEtBQUYsQ0FBQTtBQUNkLFlBQUEsSUFBQSxFQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUE7QUFBSTtRQUFBLEtBQUEsV0FBQTtXQUFVLENBQUUsTUFBRixFQUFVLFNBQVYsRUFBcUIsVUFBckI7O2dCQUNELENBQUUsTUFBRixJQUFjOztRQUR2QjtRQUVBLE9BQUEsR0FBVSxDQUFDLENBQUUsTUFBRixFQUFVLE1BQVYsQ0FBRCxDQUFBLEdBQUE7VUFDUixJQUFDLENBQUEsTUFBTSxDQUFFLE1BQUYsQ0FBUDtBQUNBLGlCQUFPLE1BQUEsQ0FBQTtRQUZDO1FBR1YsMEJBQUEsQ0FBMkIsS0FBM0IsRUFBa0MsT0FBbEM7ZUFDQztNQVBTOztJQVJkOzs7SUFrQkUsVUFBQSxDQUFXLGlCQUFDLENBQUEsU0FBWixFQUFnQixjQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTtBQUFFLFVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUE7QUFBRztBQUFBO01BQUEsS0FBQSxXQUFBOztZQUFxQyxLQUFBLEtBQVk7dUJBQWpEOztNQUFBLENBQUE7O0lBQUwsQ0FBcEM7O0lBQ0EsVUFBQSxDQUFXLGlCQUFDLENBQUEsU0FBWixFQUFnQixZQUFoQixFQUFvQyxRQUFBLENBQUEsQ0FBQTtBQUFFLFVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUE7QUFBRztBQUFBO01BQUEsS0FBQSxXQUFBOztZQUFxQyxLQUFBLEtBQVk7dUJBQWpEOztNQUFBLENBQUE7O0lBQUwsQ0FBcEM7O0lBQ0EsVUFBQSxDQUFXLGlCQUFDLENBQUEsU0FBWixFQUFnQixpQkFBaEIsRUFBb0MsUUFBQSxDQUFBLENBQUE7QUFDdEMsVUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQTtNQUFJLENBQUEsR0FBSSxDQUFBO0FBQ0o7TUFBQSxLQUFBLFdBQUE7O1FBQ0Usb0JBQUUsQ0FBQyxDQUFFLEtBQUYsSUFBRCxDQUFDLENBQUUsS0FBRixJQUFhLEVBQWhCLENBQW9CLENBQUMsSUFBckIsQ0FBMEIsSUFBMUI7TUFERjtBQUVBLGFBQU87SUFKMkIsQ0FBcEM7Ozs7Z0JBL0JGOzs7RUF1Q0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBRSxpQkFBRjtBQXZDakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jIHsgbmFtZWl0LCAgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG57IGVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzLFxuICB3cmFwX21ldGhvZHNfb2ZfcHJvdG90eXBlcywgfSA9IHJlcXVpcmUgJy4vcHJvdG90eXBlLXRvb2xzJ1xueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ292ZXJhZ2VfYW5hbHl6ZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb3VudHMgPSB7fVxuICAgIDt1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHdyYXBfY2xhc3M6ICggY2xhc3ogKSAtPlxuICAgIGZvciBuYW1lLCB7IGZxbmFtZSwgcHJvdG90eXBlLCBkZXNjcmlwdG9yLCB9IG9mIGVudW1lcmF0ZV9wcm90b3R5cGVzX2FuZF9tZXRob2RzIGNsYXN6XG4gICAgICBAY291bnRzWyBmcW5hbWUgXSA/PSAwXG4gICAgaGFuZGxlciA9ICh7IGZxbmFtZSwgY2FsbG1lLCB9KSA9PlxuICAgICAgQGNvdW50c1sgZnFuYW1lIF0rK1xuICAgICAgcmV0dXJuIGNhbGxtZSgpXG4gICAgd3JhcF9tZXRob2RzX29mX3Byb3RvdHlwZXMgY2xhc3osIGhhbmRsZXJcbiAgICA7bnVsbFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2V0X2dldHRlciBAOjosICd1bnVzZWRfbmFtZXMnLCAgICAgLT4gKCBuYW1lIGZvciBuYW1lLCBjb3VudCBvZiBAY291bnRzIHdoZW4gY291bnQgaXMgICAgMCApXG4gIHNldF9nZXR0ZXIgQDo6LCAndXNlZF9uYW1lcycsICAgICAgIC0+ICggbmFtZSBmb3IgbmFtZSwgY291bnQgb2YgQGNvdW50cyB3aGVuIGNvdW50IGlzbnQgIDAgKVxuICBzZXRfZ2V0dGVyIEA6OiwgJ25hbWVzX2J5X2NvdW50cycsICAtPlxuICAgIFIgPSB7fVxuICAgIGZvciBuYW1lLCBjb3VudCBvZiBAY291bnRzXG4gICAgICAoIFJbIGNvdW50IF0gPz0gW10gKS5wdXNoIG5hbWVcbiAgICByZXR1cm4gUlxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSB7IENvdmVyYWdlX2FuYWx5emVyLCB9XG5cblxuXG5cbiJdfQ==
