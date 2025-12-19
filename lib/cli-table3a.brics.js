(function() {
  'use strict';
  var BRICS;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_cli_table_3a: function() {
      var Table, _Table, exports, templates;
      //-------------------------------------------------------------------------------------------------------
      _Table = require('cli-table3');
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
          var cell, i, idx, len;
          for (idx = i = 0, len = row.length; i < len; idx = ++i) {
            cell = row[idx];
            // debug 'Ωjzrsdb___1', P
            row[idx] = gold(cell);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS10YWJsZTNhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBOzs7OztFQUtBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxvQkFBQSxFQUFzQixRQUFBLENBQUEsQ0FBQTtBQUN4QixVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUE7O01BQ0ksTUFBQSxHQUFTLE9BQUEsQ0FBUSxZQUFSLEVBRGI7O01BSUksU0FBQSxHQUNFO1FBQUEsT0FBQSxFQUNFO1VBQUEsZ0JBQUEsRUFBa0IsS0FBbEI7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBa0JBLEtBQUEsRUFDRTtZQUFBLEtBQUEsRUFBa0IsR0FBbEI7WUFDQSxTQUFBLEVBQWtCLEdBRGxCO1lBRUEsVUFBQSxFQUFrQixHQUZsQjtZQUdBLFdBQUEsRUFBa0IsR0FIbEI7WUFJQSxRQUFBLEVBQWtCLEdBSmxCO1lBS0EsWUFBQSxFQUFrQixHQUxsQjtZQU1BLGFBQUEsRUFBa0IsR0FObEI7WUFPQSxjQUFBLEVBQWtCLEdBUGxCO1lBUUEsTUFBQSxFQUFrQixHQVJsQjtZQVNBLFVBQUEsRUFBa0IsR0FUbEI7WUFVQSxLQUFBLEVBQWtCLEdBVmxCO1lBV0EsU0FBQSxFQUFrQixHQVhsQjtZQVlBLE9BQUEsRUFBa0IsR0FabEI7WUFhQSxXQUFBLEVBQWtCLEdBYmxCO1lBY0EsUUFBQSxFQUFrQjtVQWRsQixDQW5CRjs7Ozs7O1VBdUNBLEtBQUEsRUFDRTtZQUFBLGNBQUEsRUFBa0IsQ0FBbEI7WUFDQSxlQUFBLEVBQWtCLENBRGxCO1lBRUEsTUFBQSxFQUFrQixDQUFFLE1BQUYsRUFBVSxjQUFWLEVBQTBCLFFBQTFCLENBRmxCO1lBR0EsUUFBQSxFQUFrQixDQUFFLE1BQUYsQ0FIbEI7WUFJQSxTQUFBLEVBQWtCO1VBSmxCLENBeENGO1VBNkNBLElBQUEsRUFBTTtRQTdDTjtNQURGLEVBTE47O01Bc0RVLFFBQU4sTUFBQSxNQUFBLFFBQW9CLE9BQXBCLENBQUE7O1FBR0UsV0FBYSxDQUFFLEdBQUYsQ0FBQTtVQUNYLEdBQUEsR0FBTSxDQUFFLEdBQUEsU0FBUyxDQUFDLE9BQVosRUFBd0IsR0FBQSxHQUF4QjtlQUNOLENBQU0sR0FBTjtVQUNDO1FBSFUsQ0FEbkI7OztRQU9NLElBQU0sQ0FBRSxHQUFGLENBQUE7QUFDWixjQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBO1VBQVEsS0FBQSxpREFBQTs0QkFBQTs7WUFFRSxHQUFHLENBQUUsR0FBRixDQUFILEdBQWEsSUFBQSxDQUFLLElBQUw7VUFGZjtBQUdBLHNCQUpGLENBQUEsSUFJUyxDQUFNLEdBQU47UUFKSDs7TUFUUixFQXRESjs7QUFzRUksYUFBTyxPQUFBLEdBQVU7UUFBRSxLQUFGO1FBQVMsU0FBQSxFQUFXLENBQUUsU0FBRjtNQUFwQjtJQXZFRztFQUF0QixFQVRGOzs7RUFtRkEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUFuRkEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfY2xpX3RhYmxlXzNhOiAtPlxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX1RhYmxlID0gcmVxdWlyZSAnY2xpLXRhYmxlMydcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIG15dGFibGU6XG4gICAgICAgIGhvcml6b250YWxfbGluZXM6IGZhbHNlXG4gICAgICAgICMgY2hhcnM6XG4gICAgICAgICAgIyAndG9wJzogICAgICAgICAgICAn4pWQJ1xuICAgICAgICAgICMgJ3RvcC1taWQnOiAgICAgICAgJ+KVpCdcbiAgICAgICAgICAjICd0b3AtbGVmdCc6ICAgICAgICfilZQnXG4gICAgICAgICAgIyAndG9wLXJpZ2h0JzogICAgICAn4pWXJ1xuICAgICAgICAgICMgJ2JvdHRvbSc6ICAgICAgICAgJ+KVkCdcbiAgICAgICAgICAjICdib3R0b20tbWlkJzogICAgICfilacnXG4gICAgICAgICAgIyAnYm90dG9tLWxlZnQnOiAgICAn4pWaJ1xuICAgICAgICAgICMgJ2JvdHRvbS1yaWdodCc6ICAgJ+KVnSdcbiAgICAgICAgICAjICdsZWZ0JzogICAgICAgICAgICfilZEnXG4gICAgICAgICAgIyAnbGVmdC1taWQnOiAgICAgICAn4pWfJ1xuICAgICAgICAgICMgJ3JpZ2h0JzogICAgICAgICAgJ+KVkSdcbiAgICAgICAgICAjICdyaWdodC1taWQnOiAgICAgICfilaInXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgICBbMTEsIDUsIDVdXG4gICAgICAgICMgd29yZFdyYXA6ICAgICAgICAgICB0cnVlXG4gICAgICAgICMgd3JhcE9uV29yZEJvdW5kYXJ5OiBmYWxzZVxuXG4gICAgICAgIGNoYXJzOlxuICAgICAgICAgICd0b3AnOiAgICAgICAgICAgICfilIAnXG4gICAgICAgICAgJ3RvcC1taWQnOiAgICAgICAgJ+KUrCdcbiAgICAgICAgICAndG9wLWxlZnQnOiAgICAgICAn4pSMJ1xuICAgICAgICAgICd0b3AtcmlnaHQnOiAgICAgICfilJAnXG4gICAgICAgICAgJ2JvdHRvbSc6ICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnYm90dG9tLW1pZCc6ICAgICAn4pS0J1xuICAgICAgICAgICdib3R0b20tbGVmdCc6ICAgICfilJQnXG4gICAgICAgICAgJ2JvdHRvbS1yaWdodCc6ICAgJ+KUmCdcbiAgICAgICAgICAnbGVmdCc6ICAgICAgICAgICAn4pSCJ1xuICAgICAgICAgICdsZWZ0LW1pZCc6ICAgICAgICfilJwnXG4gICAgICAgICAgJ21pZCc6ICAgICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnbWlkLW1pZCc6ICAgICAgICAn4pS8J1xuICAgICAgICAgICdyaWdodCc6ICAgICAgICAgICfilIInXG4gICAgICAgICAgJ3JpZ2h0LW1pZCc6ICAgICAgJ+KUpCdcbiAgICAgICAgICAnbWlkZGxlJzogICAgICAgICAn4pSCJ1xuICAgICAgICAjIHRydW5jYXRlOiAgICAgICAgICfigKYnXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgW11cbiAgICAgICAgIyByb3dIZWlnaHRzOiAgICAgICBbXVxuICAgICAgICAjIGNvbEFsaWduczogICAgICAgIFtdXG4gICAgICAgICMgcm93QWxpZ25zOiAgICAgICAgW11cbiAgICAgICAgc3R5bGU6XG4gICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICAgMVxuICAgICAgICAgICdwYWRkaW5nLXJpZ2h0JzogIDFcbiAgICAgICAgICAnaGVhZCc6ICAgICAgICAgICBbICdib2xkJywgJ2JyaWdodFllbGxvdycsICdiZ0JsdWUnLCBdXG4gICAgICAgICAgJ2JvcmRlcic6ICAgICAgICAgWyAnZ3JleScsIF1cbiAgICAgICAgICAnY29tcGFjdCc6ICAgICAgICBmYWxzZVxuICAgICAgICBoZWFkOiBbXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBUYWJsZSBleHRlbmRzIF9UYWJsZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICAgIGNmZyA9IHsgdGVtcGxhdGVzLm15dGFibGUuLi4sIGNmZy4uLiwgfVxuICAgICAgICBzdXBlciBjZmdcbiAgICAgICAgO3VuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHB1c2g6ICggcm93ICkgLT5cbiAgICAgICAgZm9yIGNlbGwsIGlkeCBpbiByb3dcbiAgICAgICAgICAjIGRlYnVnICfOqWp6cnNkYl9fXzEnLCBQXG4gICAgICAgICAgcm93WyBpZHggXSA9IGdvbGQgY2VsbFxuICAgICAgICByZXR1cm4gc3VwZXIgcm93XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHJldHVybiBleHBvcnRzID0geyBUYWJsZSwgaW50ZXJuYWxzOiB7IHRlbXBsYXRlcywgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cbiJdfQ==
