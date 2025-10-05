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
    // debug 'Ωdeimst___2', { anchor, abs_anchor, abs_probe, rel_path, }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3BhdGgtdG9vbHMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBO0VBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxVQUFBOzs7RUFFQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUIsRUFIQTs7O0VBS0EsSUFBQSxHQUFPLENBQUEsRUFMUDs7O0VBT0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxvQkFBUixDQUFGLENBQWdDLENBQUMsa0JBQWpDLENBQUEsQ0FBNUI7O0VBQ0EsSUFBQSxHQUE0QixPQUFBLENBQVEsV0FBUixFQVI1Qjs7O0VBV0EsSUFBSSxDQUFDLFNBQUwsR0FBaUIsTUFBQSxDQUFPLENBQUEsQ0FBUCxFQVhqQjs7Ozs7RUFlQSxJQUFJLENBQUMsU0FBTCxHQUFpQixRQUFBLENBQUUsTUFBRixFQUFVLEtBQVYsQ0FBQTtBQUNqQixRQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQTs7Ozs7O0lBS0UsS0FBTyxNQUFNLENBQUMsVUFBUCxDQUFrQixHQUFsQixDQUFQO01BQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHFEQUFBLENBQUEsQ0FBd0QsVUFBQSxDQUFXLE1BQVgsQ0FBeEQsQ0FBQSxDQUFWLEVBRFI7S0FMRjs7SUFRRSxVQUFBLEdBQWMsSUFBSSxDQUFDLE9BQUwsQ0FBYyxNQUFkO0lBQ2QsU0FBQSxHQUFjLElBQUksQ0FBQyxPQUFMLENBQWMsVUFBZCxFQUEwQixLQUExQjtJQUNkLFFBQUEsR0FBYyxJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQsRUFBMEIsU0FBMUIsRUFWaEI7OztBQWFFLFlBQU8sSUFBUDtBQUFBLFdBQ08sUUFBQSxLQUFZLEVBRG5CO0FBQ3VDLGVBQU87QUFEOUMsV0FFTyxRQUFBLEtBQVksSUFGbkI7QUFFdUMsZUFBTztBQUY5QyxXQUdPLFFBQVEsQ0FBQyxVQUFULENBQW9CLEtBQXBCLENBSFA7QUFHdUMsZUFBTztBQUg5QyxLQWJGOzs7QUFtQkUsV0FBTztFQXBCUSxFQWZqQjs7Ozs7Ozs7OztFQTZDQSxNQUFNLENBQUMsT0FBTyxDQUFDLGtCQUFmLEdBQW9DLFFBQUEsQ0FBQSxDQUFBO1dBQUc7RUFBSDtBQTdDcEMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuJ3VzZSBzdHJpY3QnXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4jIHsgZXhwb3J0czogaGVyZSwgICAgICAgIH0gPSBtb2R1bGVcbmhlcmUgPSB7fVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IHJwcl9zdHJpbmcsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Jwci1zdHJpbmcuYnJpY3MnICkucmVxdWlyZV9ycHJfc3RyaW5nKClcblBBVEggICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnBhdGgnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaGVyZS5pbnRlcm5hbHMgPSBmcmVlemUge31cbiAgIyB2YWx1ZTogdHJ1ZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmhlcmUuaXNfaW5zaWRlID0gKCBhbmNob3IsIHByb2JlICkgLT5cbiAgIyMjIEdpdmVuIGFuIGFic29sdXRlbHkgYW5jaG9yZWQgcGF0aCBgYW5jaG9yYCAod2hpY2ggbXVzdCBzdGFydCB3aXRoIGEgc2xhc2ggYnV0IG1heSBjb250YWluIGFyYml0cmFyeVxuICBvY2N1cnJlbmNlcyBvZiBgLy4vYCBhbmQgYC8uLi9gIHNlZ21lbnRzKSBhbmQgYSBgcHJvYmVgIHBhdGgsIHJldHVybiB3aGV0aGVyIGBhbmNob3JgIGlzIGFtb25nIHRoZVxuICBhbmNlc3RvcnMgb2YgYHByb2JlYCwgaS5lLiB3aGV0aGVyIHdlIGNhbiBnbyBmcm9tIGBhbmNob3JgIHRvIGBwcm9iZWAgd2l0aG91dCBnZXR0aW5nIGNsb3NlciB0byB0aGUgYC9gXG4gIHJvb3QgdGhhbiBgYW5jaG9yYCBpdHNlbGYuIFRoZSByZXN1bHQgd2lsbCBzb2xlbHkganVkZ2VkIG9uIGJ5IGxvb2tpbmcgYXQgdGhlIHBhdGhzLCBub3QgYXQgdGhlIGFjdHVhbFxuICBmaWxlIHN5c3RlbSAod2hpY2ggaXMgd2h5IGBhbmNob3JgIG11c3QgYmUgZXhwcmVzc2VkIHdpdGggYSBsZWFkaW5nIHNsYXNoKSAjIyNcbiAgdW5sZXNzIGFuY2hvci5zdGFydHNXaXRoICcvJ1xuICAgIHRocm93IG5ldyBFcnJvciBcIs6pZGVpbXN0X19fMSBleHBlY3RlZCBhbiBhYnNvbHV0ZSBwYXRoIGFzIGFuY2hvciwgZ290ICN7cnByX3N0cmluZyBhbmNob3J9XCJcbiAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICBhYnNfYW5jaG9yICA9IFBBVEgucmVzb2x2ZSAgYW5jaG9yXG4gIGFic19wcm9iZSAgID0gUEFUSC5yZXNvbHZlICBhYnNfYW5jaG9yLCBwcm9iZVxuICByZWxfcGF0aCAgICA9IFBBVEgucmVsYXRpdmUgYWJzX2FuY2hvciwgYWJzX3Byb2JlXG4gICMgZGVidWcgJ86pZGVpbXN0X19fMicsIHsgYW5jaG9yLCBhYnNfYW5jaG9yLCBhYnNfcHJvYmUsIHJlbF9wYXRoLCB9XG4gICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgc3dpdGNoIHRydWVcbiAgICB3aGVuIHJlbF9wYXRoIGlzICcnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHRydWVcbiAgICB3aGVuIHJlbF9wYXRoIGlzICcuLicgICAgICAgICAgIHRoZW4gcmV0dXJuIGZhbHNlXG4gICAgd2hlbiByZWxfcGF0aC5zdGFydHNXaXRoICcuLi8nICB0aGVuIHJldHVybiBmYWxzZVxuICAgICMgd2hlbiByZWxfcGF0aGlzICcuJyAgICAgICAgICAgdGhlbiByZXR1cm4gdHJ1ZSAjIyMgbmV2ZXIgaGFwcGVucyAjIyNcbiAgICAjIHdoZW4gcmVsX3BhdGguc3RhcnRzV2l0aCAnLi8nIHRoZW4gcmV0dXJuIHRydWUgIyMjIG5ldmVyIGhhcHBlbnMgIyMjXG4gIHJldHVybiB0cnVlXG5cbiMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGhlcmUuaXNfaW5zaWRlID0gKCBhbmNob3IsIHByb2JlICkgLT5cbiMgICAjIyMgR2l2ZW4gdHdvIHBhdGhzIGBhbmNob3JgIGFuZCBgcHJvYmVgLCByZXR1cm5zIHdoZXRoZXIgYW5jaG9yIGlzIGFtb25nIHRoZSBhbmNlc3RvcnMgb2YgYHByb2JlYC4gIyMjXG4jICAgYWJzX2FuY2hvciAgPSBQQVRILnJlc29sdmUgYW5jaG9yXG4jICAgYWJzX3Byb2JlICAgPSBQQVRILnJlc29sdmUgcHJvYmVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIE9iamVjdC5hc3NpZ24gaGVyZSwgeyBkZW1vX25vdF9hdHRhY2hlZCwgfVxubW9kdWxlLmV4cG9ydHMucmVxdWlyZV9wYXRoX3Rvb2xzID0gLT4gaGVyZVxuXG4iXX0=
