(function() {
  'use strict';
  var PATH, debug, freeze, here, rpr_string;

  //===========================================================================================================
  ({debug} = console);

  ({freeze} = Object);

  // { exports: here,        } = module
  here = {};

  //-----------------------------------------------------------------------------------------------------------
  ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());

  PATH = require('node:path');

  //===========================================================================================================
  here.internals = freeze({});

  // value: true

  //===========================================================================================================
  here.is_inside = function(anchor, probe) {
    var abs_anchor, abs_probe, rel_path;
    /* Given an absolutely anchored path `anchor` (which must start with a slash but may contain arbitrary
     occurrences of `/./` and `/../` segments) and a `probe` path, return whether `anchor` is among the
     ancestors of `probe`, i.e. whether we can go from `anchor` to `probe` without getting closer to the `/`
     root than `anchor` itself. The result will solely judged on by looking at the paths, not at the actual
     file system (which is why `anchor` must be expressed with a leading slash) */
    if (!anchor.startsWith('/')) {
      throw new Error(`Ωdeimst___1 expected an absolute path as anchor, got ${rpr_string(anchor)}`);
    }
    //.........................................................................................................
    abs_anchor = PATH.resolve(anchor);
    abs_probe = PATH.resolve(abs_anchor, probe);
    rel_path = PATH.relative(abs_anchor, abs_probe);
    //.........................................................................................................
    switch (true) {
      case rel_path === '':
        return true;
      case rel_path === '..':
        return false;
      case rel_path.startsWith('../'):
        return false;
    }
    // when rel_pathis '.'           then return true ### never happens ###
    // when rel_path.startsWith './' then return true ### never happens ###
    return true;
  };

  // #-----------------------------------------------------------------------------------------------------------
  // here.is_inside = ( anchor, probe ) ->
  //   ### Given two paths `anchor` and `probe`, returns whether anchor is among the ancestors of `probe`. ###
  //   abs_anchor  = PATH.resolve anchor
  //   abs_probe   = PATH.resolve probe

  //===========================================================================================================
  // Object.assign here, { demo_not_attached, }
  module.exports.require_path_tools = function() {
    return here;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhdGgtdG9vbHMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBO0VBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxVQUFBOzs7RUFFQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUIsRUFIQTs7O0VBS0EsSUFBQSxHQUFPLENBQUEsRUFMUDs7O0VBT0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBNUI7O0VBQ0EsSUFBQSxHQUE0QixPQUFBLENBQVEsV0FBUixFQVI1Qjs7O0VBV0EsSUFBSSxDQUFDLFNBQUwsR0FBaUIsTUFBQSxDQUFPLENBQUEsQ0FBUCxFQVhqQjs7Ozs7RUFlQSxJQUFJLENBQUMsU0FBTCxHQUFpQixRQUFBLENBQUUsTUFBRixFQUFVLEtBQVYsQ0FBQTtBQUNqQixRQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQTs7Ozs7O0lBS0UsS0FBTyxNQUFNLENBQUMsVUFBUCxDQUFrQixHQUFsQixDQUFQO01BQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHFEQUFBLENBQUEsQ0FBd0QsVUFBQSxDQUFXLE1BQVgsQ0FBeEQsQ0FBQSxDQUFWLEVBRFI7S0FMRjs7SUFRRSxVQUFBLEdBQWMsSUFBSSxDQUFDLE9BQUwsQ0FBYyxNQUFkO0lBQ2QsU0FBQSxHQUFjLElBQUksQ0FBQyxPQUFMLENBQWMsVUFBZCxFQUEwQixLQUExQjtJQUNkLFFBQUEsR0FBYyxJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQsRUFBMEIsU0FBMUIsRUFWaEI7O0FBWUUsWUFBTyxJQUFQO0FBQUEsV0FDTyxRQUFBLEtBQVksRUFEbkI7QUFDdUMsZUFBTztBQUQ5QyxXQUVPLFFBQUEsS0FBWSxJQUZuQjtBQUV1QyxlQUFPO0FBRjlDLFdBR08sUUFBUSxDQUFDLFVBQVQsQ0FBb0IsS0FBcEIsQ0FIUDtBQUd1QyxlQUFPO0FBSDlDLEtBWkY7OztBQWtCRSxXQUFPO0VBbkJRLEVBZmpCOzs7Ozs7Ozs7O0VBNENBLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWYsR0FBb0MsUUFBQSxDQUFBLENBQUE7V0FBRztFQUFIO0FBNUNwQyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiMgeyBleHBvcnRzOiBoZXJlLCAgICAgICAgfSA9IG1vZHVsZVxuaGVyZSA9IHt9XG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgcnByX3N0cmluZywgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuUEFUSCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5oZXJlLmludGVybmFscyA9IGZyZWV6ZSB7fVxuICAjIHZhbHVlOiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaGVyZS5pc19pbnNpZGUgPSAoIGFuY2hvciwgcHJvYmUgKSAtPlxuICAjIyMgR2l2ZW4gYW4gYWJzb2x1dGVseSBhbmNob3JlZCBwYXRoIGBhbmNob3JgICh3aGljaCBtdXN0IHN0YXJ0IHdpdGggYSBzbGFzaCBidXQgbWF5IGNvbnRhaW4gYXJiaXRyYXJ5XG4gIG9jY3VycmVuY2VzIG9mIGAvLi9gIGFuZCBgLy4uL2Agc2VnbWVudHMpIGFuZCBhIGBwcm9iZWAgcGF0aCwgcmV0dXJuIHdoZXRoZXIgYGFuY2hvcmAgaXMgYW1vbmcgdGhlXG4gIGFuY2VzdG9ycyBvZiBgcHJvYmVgLCBpLmUuIHdoZXRoZXIgd2UgY2FuIGdvIGZyb20gYGFuY2hvcmAgdG8gYHByb2JlYCB3aXRob3V0IGdldHRpbmcgY2xvc2VyIHRvIHRoZSBgL2BcbiAgcm9vdCB0aGFuIGBhbmNob3JgIGl0c2VsZi4gVGhlIHJlc3VsdCB3aWxsIHNvbGVseSBqdWRnZWQgb24gYnkgbG9va2luZyBhdCB0aGUgcGF0aHMsIG5vdCBhdCB0aGUgYWN0dWFsXG4gIGZpbGUgc3lzdGVtICh3aGljaCBpcyB3aHkgYGFuY2hvcmAgbXVzdCBiZSBleHByZXNzZWQgd2l0aCBhIGxlYWRpbmcgc2xhc2gpICMjI1xuICB1bmxlc3MgYW5jaG9yLnN0YXJ0c1dpdGggJy8nXG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlkZWltc3RfX18xIGV4cGVjdGVkIGFuIGFic29sdXRlIHBhdGggYXMgYW5jaG9yLCBnb3QgI3tycHJfc3RyaW5nIGFuY2hvcn1cIlxuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGFic19hbmNob3IgID0gUEFUSC5yZXNvbHZlICBhbmNob3JcbiAgYWJzX3Byb2JlICAgPSBQQVRILnJlc29sdmUgIGFic19hbmNob3IsIHByb2JlXG4gIHJlbF9wYXRoICAgID0gUEFUSC5yZWxhdGl2ZSBhYnNfYW5jaG9yLCBhYnNfcHJvYmVcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBzd2l0Y2ggdHJ1ZVxuICAgIHdoZW4gcmVsX3BhdGggaXMgJycgICAgICAgICAgICAgdGhlbiByZXR1cm4gdHJ1ZVxuICAgIHdoZW4gcmVsX3BhdGggaXMgJy4uJyAgICAgICAgICAgdGhlbiByZXR1cm4gZmFsc2VcbiAgICB3aGVuIHJlbF9wYXRoLnN0YXJ0c1dpdGggJy4uLycgIHRoZW4gcmV0dXJuIGZhbHNlXG4gICAgIyB3aGVuIHJlbF9wYXRoaXMgJy4nICAgICAgICAgICB0aGVuIHJldHVybiB0cnVlICMjIyBuZXZlciBoYXBwZW5zICMjI1xuICAgICMgd2hlbiByZWxfcGF0aC5zdGFydHNXaXRoICcuLycgdGhlbiByZXR1cm4gdHJ1ZSAjIyMgbmV2ZXIgaGFwcGVucyAjIyNcbiAgcmV0dXJuIHRydWVcblxuIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgaGVyZS5pc19pbnNpZGUgPSAoIGFuY2hvciwgcHJvYmUgKSAtPlxuIyAgICMjIyBHaXZlbiB0d28gcGF0aHMgYGFuY2hvcmAgYW5kIGBwcm9iZWAsIHJldHVybnMgd2hldGhlciBhbmNob3IgaXMgYW1vbmcgdGhlIGFuY2VzdG9ycyBvZiBgcHJvYmVgLiAjIyNcbiMgICBhYnNfYW5jaG9yICA9IFBBVEgucmVzb2x2ZSBhbmNob3JcbiMgICBhYnNfcHJvYmUgICA9IFBBVEgucmVzb2x2ZSBwcm9iZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgT2JqZWN0LmFzc2lnbiBoZXJlLCB7IGRlbW9fbm90X2F0dGFjaGVkLCB9XG5tb2R1bGUuZXhwb3J0cy5yZXF1aXJlX3BhdGhfdG9vbHMgPSAtPiBoZXJlXG5cbiJdfQ==
