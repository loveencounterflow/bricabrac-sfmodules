(function() {
  'use strict';
  var BRICS;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_cli_table_3a: function() {
      var C, SFMODULES, Table, _Table, exports, templates;
      //-------------------------------------------------------------------------------------------------------
      _Table = require('cli-table3');
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
          var cell, i, idx, len;
          for (idx = i = 0, len = row.length; i < len; idx = ++i) {
            cell = row[idx];
            // debug 'Ωjzrsdb___1', P
            /* TAINT not a good solution */
            // row[ idx ] = C.turquoise + cell + C.default
            row[idx] = cell;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS10YWJsZTNhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBOzs7OztFQUtBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxvQkFBQSxFQUFzQixRQUFBLENBQUEsQ0FBQTtBQUN4QixVQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsU0FBQTs7TUFDSSxNQUFBLEdBQWtDLE9BQUEsQ0FBUSxZQUFSO01BQ2xDLFNBQUEsR0FBa0MsT0FBQSxDQUFRLFFBQVI7TUFDbEMsQ0FBQTtRQUFFLHVCQUFBLEVBQXlCO01BQTNCLENBQUEsR0FBa0MsU0FBUyxDQUFDLCtCQUFWLENBQUEsQ0FBbEMsRUFISjs7TUFNSSxTQUFBLEdBQ0U7UUFBQSxPQUFBLEVBQ0U7VUFBQSxnQkFBQSxFQUFrQixLQUFsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFrQkEsS0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFrQixHQUFsQjtZQUNBLFNBQUEsRUFBa0IsR0FEbEI7WUFFQSxVQUFBLEVBQWtCLEdBRmxCO1lBR0EsV0FBQSxFQUFrQixHQUhsQjtZQUlBLFFBQUEsRUFBa0IsR0FKbEI7WUFLQSxZQUFBLEVBQWtCLEdBTGxCO1lBTUEsYUFBQSxFQUFrQixHQU5sQjtZQU9BLGNBQUEsRUFBa0IsR0FQbEI7WUFRQSxNQUFBLEVBQWtCLEdBUmxCO1lBU0EsVUFBQSxFQUFrQixHQVRsQjtZQVVBLEtBQUEsRUFBa0IsR0FWbEI7WUFXQSxTQUFBLEVBQWtCLEdBWGxCO1lBWUEsT0FBQSxFQUFrQixHQVpsQjtZQWFBLFdBQUEsRUFBa0IsR0FibEI7WUFjQSxRQUFBLEVBQWtCO1VBZGxCLENBbkJGOzs7Ozs7VUF1Q0EsS0FBQSxFQUNFO1lBQUEsY0FBQSxFQUFrQixDQUFsQjtZQUNBLGVBQUEsRUFBa0IsQ0FEbEI7WUFFQSxNQUFBLEVBQWtCLENBQUUsTUFBRixFQUFVLGNBQVYsRUFBMEIsUUFBMUIsQ0FGbEI7WUFHQSxRQUFBLEVBQWtCLENBQUUsTUFBRixDQUhsQjtZQUlBLFNBQUEsRUFBa0I7VUFKbEIsQ0F4Q0Y7VUE2Q0EsSUFBQSxFQUFNO1FBN0NOO01BREYsRUFQTjs7TUF3RFUsUUFBTixNQUFBLE1BQUEsUUFBb0IsT0FBcEIsQ0FBQTs7UUFHRSxXQUFhLENBQUUsR0FBRixDQUFBO1VBQ1gsR0FBQSxHQUFNLENBQUUsR0FBQSxTQUFTLENBQUMsT0FBWixFQUF3QixHQUFBLEdBQXhCO2VBQ04sQ0FBTSxHQUFOO1VBQ0M7UUFIVSxDQURuQjs7O1FBT00sSUFBTSxDQUFFLEdBQUYsQ0FBQTtBQUNaLGNBQUEsSUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUE7VUFBUSxLQUFBLGlEQUFBOzRCQUFBOzs7O1lBSUUsR0FBRyxDQUFFLEdBQUYsQ0FBSCxHQUFhO1VBSmY7QUFLQSxzQkFORixDQUFBLElBTVMsQ0FBTSxHQUFOO1FBTkg7O01BVFIsRUF4REo7O0FBMEVJLGFBQU8sT0FBQSxHQUFVO1FBQUUsS0FBRjtRQUFTLFNBQUEsRUFBVyxDQUFFLFNBQUY7TUFBcEI7SUEzRUc7RUFBdEIsRUFURjs7O0VBdUZBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBdkZBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2NsaV90YWJsZV8zYTogLT5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9UYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdjbGktdGFibGUzJ1xuICAgIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21haW4nXG4gICAgeyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogQywgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2Fuc2lfY29sb3JzX2FuZF9lZmZlY3RzKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIG15dGFibGU6XG4gICAgICAgIGhvcml6b250YWxfbGluZXM6IGZhbHNlXG4gICAgICAgICMgY2hhcnM6XG4gICAgICAgICAgIyAndG9wJzogICAgICAgICAgICAn4pWQJ1xuICAgICAgICAgICMgJ3RvcC1taWQnOiAgICAgICAgJ+KVpCdcbiAgICAgICAgICAjICd0b3AtbGVmdCc6ICAgICAgICfilZQnXG4gICAgICAgICAgIyAndG9wLXJpZ2h0JzogICAgICAn4pWXJ1xuICAgICAgICAgICMgJ2JvdHRvbSc6ICAgICAgICAgJ+KVkCdcbiAgICAgICAgICAjICdib3R0b20tbWlkJzogICAgICfilacnXG4gICAgICAgICAgIyAnYm90dG9tLWxlZnQnOiAgICAn4pWaJ1xuICAgICAgICAgICMgJ2JvdHRvbS1yaWdodCc6ICAgJ+KVnSdcbiAgICAgICAgICAjICdsZWZ0JzogICAgICAgICAgICfilZEnXG4gICAgICAgICAgIyAnbGVmdC1taWQnOiAgICAgICAn4pWfJ1xuICAgICAgICAgICMgJ3JpZ2h0JzogICAgICAgICAgJ+KVkSdcbiAgICAgICAgICAjICdyaWdodC1taWQnOiAgICAgICfilaInXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgICBbMTEsIDUsIDVdXG4gICAgICAgICMgd29yZFdyYXA6ICAgICAgICAgICB0cnVlXG4gICAgICAgICMgd3JhcE9uV29yZEJvdW5kYXJ5OiBmYWxzZVxuXG4gICAgICAgIGNoYXJzOlxuICAgICAgICAgICd0b3AnOiAgICAgICAgICAgICfilIAnXG4gICAgICAgICAgJ3RvcC1taWQnOiAgICAgICAgJ+KUrCdcbiAgICAgICAgICAndG9wLWxlZnQnOiAgICAgICAn4pSMJ1xuICAgICAgICAgICd0b3AtcmlnaHQnOiAgICAgICfilJAnXG4gICAgICAgICAgJ2JvdHRvbSc6ICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnYm90dG9tLW1pZCc6ICAgICAn4pS0J1xuICAgICAgICAgICdib3R0b20tbGVmdCc6ICAgICfilJQnXG4gICAgICAgICAgJ2JvdHRvbS1yaWdodCc6ICAgJ+KUmCdcbiAgICAgICAgICAnbGVmdCc6ICAgICAgICAgICAn4pSCJ1xuICAgICAgICAgICdsZWZ0LW1pZCc6ICAgICAgICfilJwnXG4gICAgICAgICAgJ21pZCc6ICAgICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnbWlkLW1pZCc6ICAgICAgICAn4pS8J1xuICAgICAgICAgICdyaWdodCc6ICAgICAgICAgICfilIInXG4gICAgICAgICAgJ3JpZ2h0LW1pZCc6ICAgICAgJ+KUpCdcbiAgICAgICAgICAnbWlkZGxlJzogICAgICAgICAn4pSCJ1xuICAgICAgICAjIHRydW5jYXRlOiAgICAgICAgICfigKYnXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgW11cbiAgICAgICAgIyByb3dIZWlnaHRzOiAgICAgICBbXVxuICAgICAgICAjIGNvbEFsaWduczogICAgICAgIFtdXG4gICAgICAgICMgcm93QWxpZ25zOiAgICAgICAgW11cbiAgICAgICAgc3R5bGU6XG4gICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICAgMVxuICAgICAgICAgICdwYWRkaW5nLXJpZ2h0JzogIDFcbiAgICAgICAgICAnaGVhZCc6ICAgICAgICAgICBbICdib2xkJywgJ2JyaWdodFllbGxvdycsICdiZ0JsdWUnLCBdXG4gICAgICAgICAgJ2JvcmRlcic6ICAgICAgICAgWyAnZ3JleScsIF1cbiAgICAgICAgICAnY29tcGFjdCc6ICAgICAgICBmYWxzZVxuICAgICAgICBoZWFkOiBbXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBUYWJsZSBleHRlbmRzIF9UYWJsZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICAgIGNmZyA9IHsgdGVtcGxhdGVzLm15dGFibGUuLi4sIGNmZy4uLiwgfVxuICAgICAgICBzdXBlciBjZmdcbiAgICAgICAgO3VuZGVmaW5lZFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHB1c2g6ICggcm93ICkgLT5cbiAgICAgICAgZm9yIGNlbGwsIGlkeCBpbiByb3dcbiAgICAgICAgICAjIGRlYnVnICfOqWp6cnNkYl9fXzEnLCBQXG4gICAgICAgICAgIyMjIFRBSU5UIG5vdCBhIGdvb2Qgc29sdXRpb24gIyMjXG4gICAgICAgICAgIyByb3dbIGlkeCBdID0gQy50dXJxdW9pc2UgKyBjZWxsICsgQy5kZWZhdWx0XG4gICAgICAgICAgcm93WyBpZHggXSA9IGNlbGxcbiAgICAgICAgcmV0dXJuIHN1cGVyIHJvd1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgVGFibGUsIGludGVybmFsczogeyB0ZW1wbGF0ZXMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
