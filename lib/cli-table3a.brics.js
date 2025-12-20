(function() {
  'use strict';
  var BRICS;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_cli_table3a: function() {
      var C, SFMODULES, Table, _Table, exports, templates;
      //-------------------------------------------------------------------------------------------------------
      _Table = require('cli-table3');
      // _Table                          = require '../../cli-table3'
      SFMODULES = require('./main');
      ({
        ansi_colors_and_effects: C
      } = SFMODULES.require_ansi_colors_and_effects());
      //-------------------------------------------------------------------------------------------------------
      templates = {
        mytable: {
          horizontal_lines: false,
          // chars:
          // 'top':            '═'
          // 'top-mid':        '╤'
          // 'top-left':       '╔'
          // 'top-right':      '╗'
          // 'bottom':         '═'
          // 'bottom-mid':     '╧'
          // 'bottom-left':    '╚'
          // 'bottom-right':   '╝'
          // 'left':           '║'
          // 'left-mid':       '╟'
          // 'right':          '║'
          // 'right-mid':      '╢'
          // colWidths:          [11, 5, 5]
          // wordWrap:           true
          // wrapOnWordBoundary: false
          chars: {
            'top': '─',
            'top-mid': '┬',
            'top-left': '┌',
            'top-right': '┐',
            'bottom': '─',
            'bottom-mid': '┴',
            'bottom-left': '└',
            'bottom-right': '┘',
            'left': '│',
            'left-mid': '├',
            'mid': '─',
            'mid-mid': '┼',
            'right': '│',
            'right-mid': '┤',
            'middle': '│'
          },
          // truncate:         '…'
          // colWidths:        []
          // rowHeights:       []
          // colAligns:        []
          // rowAligns:        []
          style: {
            'padding-left': 1,
            'padding-right': 1,
            'head': ['bold', 'brightYellow', 'bgBlue'],
            'border': ['grey'],
            'compact': false
          },
          head: []
        }
      };
      //=======================================================================================================
      Table = class Table extends _Table {
        //-----------------------------------------------------------------------------------------------------
        constructor(cfg) {
          cfg = {...templates.mytable, ...cfg};
          super(cfg);
          void 0;
        }

        //-----------------------------------------------------------------------------------------------------
        push(row) {
          var cell, i, idx, len, ref, ref1, ref2;
          for (idx = i = 0, len = row.length; i < len; idx = ++i) {
            cell = row[idx];
            /* TAINT not a good solution */
            row[idx] = C.turquoise + `${cell}` + C.default;
          }
          while (row.length < ((ref = (ref1 = this.options) != null ? (ref2 = ref1.head) != null ? ref2.length : void 0 : void 0) != null ? ref : 1)) {
            row.push('');
          }
          return super.push(row);
        }

      };
      //=======================================================================================================
      return exports = {
        Table,
        internals: {templates}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS10YWJsZTNhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBOzs7OztFQUtBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxtQkFBQSxFQUFxQixRQUFBLENBQUEsQ0FBQTtBQUN2QixVQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsU0FBQTs7TUFDSSxNQUFBLEdBQWtDLE9BQUEsQ0FBUSxZQUFSLEVBRHRDOztNQUdJLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVI7TUFDbEMsQ0FBQTtRQUFFLHVCQUFBLEVBQXlCO01BQTNCLENBQUEsR0FBa0MsU0FBUyxDQUFDLCtCQUFWLENBQUEsQ0FBbEMsRUFKSjs7TUFPSSxTQUFBLEdBQ0U7UUFBQSxPQUFBLEVBQ0U7VUFBQSxnQkFBQSxFQUFrQixLQUFsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFrQkEsS0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFrQixHQUFsQjtZQUNBLFNBQUEsRUFBa0IsR0FEbEI7WUFFQSxVQUFBLEVBQWtCLEdBRmxCO1lBR0EsV0FBQSxFQUFrQixHQUhsQjtZQUlBLFFBQUEsRUFBa0IsR0FKbEI7WUFLQSxZQUFBLEVBQWtCLEdBTGxCO1lBTUEsYUFBQSxFQUFrQixHQU5sQjtZQU9BLGNBQUEsRUFBa0IsR0FQbEI7WUFRQSxNQUFBLEVBQWtCLEdBUmxCO1lBU0EsVUFBQSxFQUFrQixHQVRsQjtZQVVBLEtBQUEsRUFBa0IsR0FWbEI7WUFXQSxTQUFBLEVBQWtCLEdBWGxCO1lBWUEsT0FBQSxFQUFrQixHQVpsQjtZQWFBLFdBQUEsRUFBa0IsR0FibEI7WUFjQSxRQUFBLEVBQWtCO1VBZGxCLENBbkJGOzs7Ozs7VUF1Q0EsS0FBQSxFQUNFO1lBQUEsY0FBQSxFQUFrQixDQUFsQjtZQUNBLGVBQUEsRUFBa0IsQ0FEbEI7WUFFQSxNQUFBLEVBQWtCLENBQUUsTUFBRixFQUFVLGNBQVYsRUFBMEIsUUFBMUIsQ0FGbEI7WUFHQSxRQUFBLEVBQWtCLENBQUUsTUFBRixDQUhsQjtZQUlBLFNBQUEsRUFBa0I7VUFKbEIsQ0F4Q0Y7VUE2Q0EsSUFBQSxFQUFNO1FBN0NOO01BREYsRUFSTjs7TUF5RFUsUUFBTixNQUFBLE1BQUEsUUFBb0IsT0FBcEIsQ0FBQTs7UUFHRSxXQUFhLENBQUUsR0FBRixDQUFBO1VBQ1gsR0FBQSxHQUFNLENBQUUsR0FBQSxTQUFTLENBQUMsT0FBWixFQUF3QixHQUFBLEdBQXhCO2VBQ04sQ0FBTSxHQUFOO1VBQ0M7UUFIVSxDQURuQjs7O1FBT00sSUFBTSxDQUFFLEdBQUYsQ0FBQTtBQUNaLGNBQUEsSUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7VUFBUSxLQUFBLGlEQUFBOzRCQUFBOztZQUVFLEdBQUcsQ0FBRSxHQUFGLENBQUgsR0FBYSxDQUFDLENBQUMsU0FBRixHQUFjLENBQUEsQ0FBQSxDQUFHLElBQUgsQ0FBQSxDQUFkLEdBQTBCLENBQUMsQ0FBQztVQUYzQztBQUdBLGlCQUFrQixHQUFHLENBQUMsTUFBSixHQUFhLG9IQUEyQixDQUEzQixDQUEvQjtZQUFBLEdBQUcsQ0FBQyxJQUFKLENBQVMsRUFBVDtVQUFBO0FBQ0Esc0JBTEYsQ0FBQSxJQUtTLENBQU0sR0FBTjtRQUxIOztNQVRSLEVBekRKOztBQTBFSSxhQUFPLE9BQUEsR0FBVTtRQUFFLEtBQUY7UUFBUyxTQUFBLEVBQVcsQ0FBRSxTQUFGO01BQXBCO0lBM0VFO0VBQXJCLEVBVEY7OztFQXVGQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXZGQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9jbGlfdGFibGUzYTogLT5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9UYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdjbGktdGFibGUzJ1xuICAgICMgX1RhYmxlICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2NsaS10YWJsZTMnXG4gICAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgICB7IGFuc2lfY29sb3JzX2FuZF9lZmZlY3RzOiBDLCB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHMoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgbXl0YWJsZTpcbiAgICAgICAgaG9yaXpvbnRhbF9saW5lczogZmFsc2VcbiAgICAgICAgIyBjaGFyczpcbiAgICAgICAgICAjICd0b3AnOiAgICAgICAgICAgICfilZAnXG4gICAgICAgICAgIyAndG9wLW1pZCc6ICAgICAgICAn4pWkJ1xuICAgICAgICAgICMgJ3RvcC1sZWZ0JzogICAgICAgJ+KVlCdcbiAgICAgICAgICAjICd0b3AtcmlnaHQnOiAgICAgICfilZcnXG4gICAgICAgICAgIyAnYm90dG9tJzogICAgICAgICAn4pWQJ1xuICAgICAgICAgICMgJ2JvdHRvbS1taWQnOiAgICAgJ+KVpydcbiAgICAgICAgICAjICdib3R0b20tbGVmdCc6ICAgICfilZonXG4gICAgICAgICAgIyAnYm90dG9tLXJpZ2h0JzogICAn4pWdJ1xuICAgICAgICAgICMgJ2xlZnQnOiAgICAgICAgICAgJ+KVkSdcbiAgICAgICAgICAjICdsZWZ0LW1pZCc6ICAgICAgICfilZ8nXG4gICAgICAgICAgIyAncmlnaHQnOiAgICAgICAgICAn4pWRJ1xuICAgICAgICAgICMgJ3JpZ2h0LW1pZCc6ICAgICAgJ+KVoidcbiAgICAgICAgIyBjb2xXaWR0aHM6ICAgICAgICAgIFsxMSwgNSwgNV1cbiAgICAgICAgIyB3b3JkV3JhcDogICAgICAgICAgIHRydWVcbiAgICAgICAgIyB3cmFwT25Xb3JkQm91bmRhcnk6IGZhbHNlXG5cbiAgICAgICAgY2hhcnM6XG4gICAgICAgICAgJ3RvcCc6ICAgICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAndG9wLW1pZCc6ICAgICAgICAn4pSsJ1xuICAgICAgICAgICd0b3AtbGVmdCc6ICAgICAgICfilIwnXG4gICAgICAgICAgJ3RvcC1yaWdodCc6ICAgICAgJ+KUkCdcbiAgICAgICAgICAnYm90dG9tJzogICAgICAgICAn4pSAJ1xuICAgICAgICAgICdib3R0b20tbWlkJzogICAgICfilLQnXG4gICAgICAgICAgJ2JvdHRvbS1sZWZ0JzogICAgJ+KUlCdcbiAgICAgICAgICAnYm90dG9tLXJpZ2h0JzogICAn4pSYJ1xuICAgICAgICAgICdsZWZ0JzogICAgICAgICAgICfilIInXG4gICAgICAgICAgJ2xlZnQtbWlkJzogICAgICAgJ+KUnCdcbiAgICAgICAgICAnbWlkJzogICAgICAgICAgICAn4pSAJ1xuICAgICAgICAgICdtaWQtbWlkJzogICAgICAgICfilLwnXG4gICAgICAgICAgJ3JpZ2h0JzogICAgICAgICAgJ+KUgidcbiAgICAgICAgICAncmlnaHQtbWlkJzogICAgICAn4pSkJ1xuICAgICAgICAgICdtaWRkbGUnOiAgICAgICAgICfilIInXG4gICAgICAgICMgdHJ1bmNhdGU6ICAgICAgICAgJ+KApidcbiAgICAgICAgIyBjb2xXaWR0aHM6ICAgICAgICBbXVxuICAgICAgICAjIHJvd0hlaWdodHM6ICAgICAgIFtdXG4gICAgICAgICMgY29sQWxpZ25zOiAgICAgICAgW11cbiAgICAgICAgIyByb3dBbGlnbnM6ICAgICAgICBbXVxuICAgICAgICBzdHlsZTpcbiAgICAgICAgICAncGFkZGluZy1sZWZ0JzogICAxXG4gICAgICAgICAgJ3BhZGRpbmctcmlnaHQnOiAgMVxuICAgICAgICAgICdoZWFkJzogICAgICAgICAgIFsgJ2JvbGQnLCAnYnJpZ2h0WWVsbG93JywgJ2JnQmx1ZScsIF1cbiAgICAgICAgICAnYm9yZGVyJzogICAgICAgICBbICdncmV5JywgXVxuICAgICAgICAgICdjb21wYWN0JzogICAgICAgIGZhbHNlXG4gICAgICAgIGhlYWQ6IFtdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFRhYmxlIGV4dGVuZHMgX1RhYmxlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICAgY2ZnID0geyB0ZW1wbGF0ZXMubXl0YWJsZS4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHN1cGVyIGNmZ1xuICAgICAgICA7dW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcHVzaDogKCByb3cgKSAtPlxuICAgICAgICBmb3IgY2VsbCwgaWR4IGluIHJvd1xuICAgICAgICAgICMjIyBUQUlOVCBub3QgYSBnb29kIHNvbHV0aW9uICMjI1xuICAgICAgICAgIHJvd1sgaWR4IF0gPSBDLnR1cnF1b2lzZSArIFwiI3tjZWxsfVwiICsgQy5kZWZhdWx0XG4gICAgICAgIHJvdy5wdXNoICcnIHdoaWxlIHJvdy5sZW5ndGggPCAoIEBvcHRpb25zPy5oZWFkPy5sZW5ndGggPyAxIClcbiAgICAgICAgcmV0dXJuIHN1cGVyIHJvd1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgVGFibGUsIGludGVybmFsczogeyB0ZW1wbGF0ZXMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
