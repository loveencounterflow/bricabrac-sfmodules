(function() {
  'use strict';
  //===========================================================================================================
  Object.assign(module.exports, require('./various-brics'));

  Object.assign(module.exports, require('./ansi-brics'));

  Object.assign(module.exports, require('./loupe-brics'));

  Object.assign(module.exports, require('./dictionary-tools.brics'));

  Object.assign(module.exports, require('./get-local-destinations.brics'));

  Object.assign(module.exports, require('./walk-js-tokens.brics'));

  Object.assign(module.exports, require('./rpr-string.brics'));

  Object.assign(module.exports, require('./parse-require-statements.brics'));

  Object.assign(module.exports, require('./path-tools.brics'));

  Object.assign(module.exports, require('./jetstream.brics'));

  Object.assign(module.exports, require('./letsfreezethat-infra.brics'));

  Object.assign(module.exports, require('./coarse-sqlite-statement-segmenter.brics'));

  Object.assign(module.exports, require('./wc.brics'));

  Object.assign(module.exports, require('./unicode-range-tools.brics'));

  Object.assign(module.exports, require('./cli-table3a.brics'));

  Object.assign(module.exports, {
    // ( require './unstable-dbric-brics'                              )...,
    unstable: {...(require('./unstable-brics')), ...(require('./unstable-benchmark-brics')), ...(require('./unstable-fast-linereader-brics')), ...(require('./unstable-getrandom-brics')), ...(require('./unstable-callsite-brics')), ...(require('./unstable-temp-brics')), ...(require('./unstable-rpr-type_of-brics')), ...(require('./unstable-anybase-brics')), ...(require('./unstable-object-tools-brics')), ...(require('./unstable-nanotypes-brics')), ...(require('./unstable-capture-output')), ...(require('./unstable-normalize-function-arguments-brics')), ...{
        //---------------------------------------------------------------------------------------------------------
        /* NOTE temporary for backwards compatibility */
        require_dbric: (function() {
          return require('./dbric');
        })
      }, ...{
        require_intermission: (function() {
          return require('./intermission');
        })
      }}
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUEsYUFBQTs7RUFHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixPQUFBLENBQVEsaUJBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLGNBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLGVBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLDBCQUFSLENBQTlCOztFQUNBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLE9BQUEsQ0FBUSxnQ0FBUixDQUE5Qjs7RUFDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixPQUFBLENBQVEsd0JBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLG9CQUFSLENBQTlCOztFQUNBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLE9BQUEsQ0FBUSxrQ0FBUixDQUE5Qjs7RUFDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixPQUFBLENBQVEsb0JBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLG1CQUFSLENBQTlCOztFQUNBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLE9BQUEsQ0FBUSw4QkFBUixDQUE5Qjs7RUFDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixPQUFBLENBQVEsMkNBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLFlBQVIsQ0FBOUI7O0VBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsT0FBQSxDQUFRLDZCQUFSLENBQTlCOztFQUNBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLE9BQUEsQ0FBUSxxQkFBUixDQUE5Qjs7RUFDQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixDQUFBOztJQUFFLFFBQUEsRUFBVSxDQUN4QyxHQUFBLENBQUUsT0FBQSxDQUFRLGtCQUFSLENBQUYsQ0FEd0MsRUFFeEMsR0FBQSxDQUFFLE9BQUEsQ0FBUSw0QkFBUixDQUFGLENBRndDLEVBR3hDLEdBQUEsQ0FBRSxPQUFBLENBQVEsa0NBQVIsQ0FBRixDQUh3QyxFQUl4QyxHQUFBLENBQUUsT0FBQSxDQUFRLDRCQUFSLENBQUYsQ0FKd0MsRUFLeEMsR0FBQSxDQUFFLE9BQUEsQ0FBUSwyQkFBUixDQUFGLENBTHdDLEVBT3hDLEdBQUEsQ0FBRSxPQUFBLENBQVEsdUJBQVIsQ0FBRixDQVB3QyxFQVF4QyxHQUFBLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FSd0MsRUFTeEMsR0FBQSxDQUFFLE9BQUEsQ0FBUSwwQkFBUixDQUFGLENBVHdDLEVBVXhDLEdBQUEsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQVZ3QyxFQVd4QyxHQUFBLENBQUUsT0FBQSxDQUFRLDRCQUFSLENBQUYsQ0FYd0MsRUFZeEMsR0FBQSxDQUFFLE9BQUEsQ0FBUSwyQkFBUixDQUFGLENBWndDLEVBYXhDLEdBQUEsQ0FBRSxPQUFBLENBQVEsK0NBQVIsQ0FBRixDQWJ3QyxFQWdCeEMsR0FBQSxDQUFBOzs7UUFBRSxhQUFBLEVBQXNCLENBQUUsUUFBQSxDQUFBLENBQUE7aUJBQUcsT0FBQSxDQUFRLFNBQVI7UUFBSCxDQUFGO01BQXhCLENBaEJ3QyxFQWlCeEMsR0FBQTtRQUFFLG9CQUFBLEVBQXNCLENBQUUsUUFBQSxDQUFBLENBQUE7aUJBQUcsT0FBQSxDQUFRLGdCQUFSO1FBQUgsQ0FBRjtNQUF4QixDQWpCd0M7RUFBWixDQUE5QjtBQWxCQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJ1xuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgcmVxdWlyZSAnLi9hbnNpLWJyaWNzJ1xuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgcmVxdWlyZSAnLi9sb3VwZS1icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vZGljdGlvbmFyeS10b29scy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vZ2V0LWxvY2FsLWRlc3RpbmF0aW9ucy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vd2Fsay1qcy10b2tlbnMuYnJpY3MnXG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCByZXF1aXJlICcuL3Jwci1zdHJpbmcuYnJpY3MnXG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCByZXF1aXJlICcuL3BhcnNlLXJlcXVpcmUtc3RhdGVtZW50cy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vcGF0aC10b29scy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vamV0c3RyZWFtLmJyaWNzJ1xuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgcmVxdWlyZSAnLi9sZXRzZnJlZXpldGhhdC1pbmZyYS5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vY29hcnNlLXNxbGl0ZS1zdGF0ZW1lbnQtc2VnbWVudGVyLmJyaWNzJ1xuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgcmVxdWlyZSAnLi93Yy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vdW5pY29kZS1yYW5nZS10b29scy5icmljcydcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUgJy4vY2xpLXRhYmxlM2EuYnJpY3MnXG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7IHVuc3RhYmxlOiB7XG4gICggcmVxdWlyZSAnLi91bnN0YWJsZS1icmljcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLi4uLFxuICAoIHJlcXVpcmUgJy4vdW5zdGFibGUtYmVuY2htYXJrLWJyaWNzJyAgICAgICAgICAgICAgICAgICAgICAgICAgKS4uLixcbiAgKCByZXF1aXJlICcuL3Vuc3RhYmxlLWZhc3QtbGluZXJlYWRlci1icmljcycgICAgICAgICAgICAgICAgICAgICkuLi4sXG4gICggcmVxdWlyZSAnLi91bnN0YWJsZS1nZXRyYW5kb20tYnJpY3MnICAgICAgICAgICAgICAgICAgICAgICAgICApLi4uLFxuICAoIHJlcXVpcmUgJy4vdW5zdGFibGUtY2FsbHNpdGUtYnJpY3MnICAgICAgICAgICAgICAgICAgICAgICAgICAgKS4uLixcbiAgIyAoIHJlcXVpcmUgJy4vdW5zdGFibGUtZGJyaWMtYnJpY3MnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS4uLixcbiAgKCByZXF1aXJlICcuL3Vuc3RhYmxlLXRlbXAtYnJpY3MnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuLi4sXG4gICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgICAgICAgICAgICAgICAgICAgICAgICApLi4uLFxuICAoIHJlcXVpcmUgJy4vdW5zdGFibGUtYW55YmFzZS1icmljcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS4uLixcbiAgKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgICAgICAgICAgICAgICAgICAgICAgICkuLi4sXG4gICggcmVxdWlyZSAnLi91bnN0YWJsZS1uYW5vdHlwZXMtYnJpY3MnICAgICAgICAgICAgICAgICAgICAgICAgICApLi4uLFxuICAoIHJlcXVpcmUgJy4vdW5zdGFibGUtY2FwdHVyZS1vdXRwdXQnICAgICAgICAgICAgICAgICAgICAgICAgICAgKS4uLixcbiAgKCByZXF1aXJlICcuL3Vuc3RhYmxlLW5vcm1hbGl6ZS1mdW5jdGlvbi1hcmd1bWVudHMtYnJpY3MnICAgICAgICkuLi4sXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIE5PVEUgdGVtcG9yYXJ5IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAjIyNcbiAgeyByZXF1aXJlX2RicmljOiAgICAgICAgKCAtPiByZXF1aXJlICcuL2RicmljJyApLCAgICAgICAgICAgICAgICAgICAgICAgfS4uLixcbiAgeyByZXF1aXJlX2ludGVybWlzc2lvbjogKCAtPiByZXF1aXJlICcuL2ludGVybWlzc2lvbicgKSwgICAgICAgICAgICAgICAgfS4uLixcbiAgfSwgfVxuXG4iXX0=
