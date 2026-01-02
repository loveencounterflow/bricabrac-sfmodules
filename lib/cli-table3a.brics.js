(function() {
  'use strict';
  var BRICS;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_cli_table3a: function() {
      var C, Table, _Table, exports, templates;
      //-------------------------------------------------------------------------------------------------------
      _Table = require('cli-table3');
      ({
        // _Table                          = require '../../cli-table3'
        ansi_colors_and_effects: C
      } = (require('./ansi-brics')).require_ansi_colors_and_effects());
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
          /* TAINT not a good solution */
          var cell, i, idx, len, ref, ref1, ref2;
          for (idx = i = 0, len = row.length; i < len; idx = ++i) {
            cell = row[idx];
            cell = `${cell}`;
            if (!cell.startsWith('\x1b')) {
              row[idx] = C.yellow + `${cell}` + C.default;
            }
          }
          while (row.length < ((ref = (ref1 = this.options) != null ? (ref2 = ref1.head) != null ? ref2.length : void 0 : void 0) != null ? ref : 1)) {
            row.push('');
          }
          return super.push(row);
        }

        //-----------------------------------------------------------------------------------------------------
        toString(...P) {
          var caption, ref;
          if ((caption = (ref = this.options) != null ? ref.caption : void 0) != null) {
            caption = `${C.bg_white + C.black + C.bold} ${caption} ${C.bold0 + C.default + C.bg_default}\n`;
          } else {
            caption = '';
          }
          return caption + super.toString(...P);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS10YWJsZTNhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBOzs7OztFQUtBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxtQkFBQSxFQUFxQixRQUFBLENBQUEsQ0FBQTtBQUN2QixVQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBOztNQUNJLE1BQUEsR0FBa0MsT0FBQSxDQUFRLFlBQVI7TUFFbEMsQ0FBQSxDQUFBOztRQUFFLHVCQUFBLEVBQXlCO01BQTNCLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsY0FBUixDQUFGLENBQTBCLENBQUMsK0JBQTNCLENBQUEsQ0FBbEMsRUFISjs7TUFNSSxTQUFBLEdBQ0U7UUFBQSxPQUFBLEVBQ0U7VUFBQSxnQkFBQSxFQUFrQixLQUFsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFrQkEsS0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFrQixHQUFsQjtZQUNBLFNBQUEsRUFBa0IsR0FEbEI7WUFFQSxVQUFBLEVBQWtCLEdBRmxCO1lBR0EsV0FBQSxFQUFrQixHQUhsQjtZQUlBLFFBQUEsRUFBa0IsR0FKbEI7WUFLQSxZQUFBLEVBQWtCLEdBTGxCO1lBTUEsYUFBQSxFQUFrQixHQU5sQjtZQU9BLGNBQUEsRUFBa0IsR0FQbEI7WUFRQSxNQUFBLEVBQWtCLEdBUmxCO1lBU0EsVUFBQSxFQUFrQixHQVRsQjtZQVVBLEtBQUEsRUFBa0IsR0FWbEI7WUFXQSxTQUFBLEVBQWtCLEdBWGxCO1lBWUEsT0FBQSxFQUFrQixHQVpsQjtZQWFBLFdBQUEsRUFBa0IsR0FibEI7WUFjQSxRQUFBLEVBQWtCO1VBZGxCLENBbkJGOzs7Ozs7VUF1Q0EsS0FBQSxFQUNFO1lBQUEsY0FBQSxFQUFrQixDQUFsQjtZQUNBLGVBQUEsRUFBa0IsQ0FEbEI7WUFFQSxNQUFBLEVBQWtCLENBQUUsTUFBRixFQUFVLGNBQVYsRUFBMEIsUUFBMUIsQ0FGbEI7WUFHQSxRQUFBLEVBQWtCLENBQUUsTUFBRixDQUhsQjtZQUlBLFNBQUEsRUFBa0I7VUFKbEIsQ0F4Q0Y7VUE2Q0EsSUFBQSxFQUFNO1FBN0NOO01BREYsRUFQTjs7TUF3RFUsUUFBTixNQUFBLE1BQUEsUUFBb0IsT0FBcEIsQ0FBQTs7UUFHRSxXQUFhLENBQUUsR0FBRixDQUFBO1VBQ1gsR0FBQSxHQUFNLENBQUUsR0FBQSxTQUFTLENBQUMsT0FBWixFQUF3QixHQUFBLEdBQXhCO2VBQ04sQ0FBTSxHQUFOO1VBQ0M7UUFIVSxDQURuQjs7O1FBT00sSUFBTSxDQUFFLEdBQUYsQ0FBQSxFQUFBOztBQUNaLGNBQUEsSUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7VUFBUSxLQUFBLGlEQUFBOztZQUVFLElBQUEsR0FBYyxDQUFBLENBQUEsQ0FBRyxJQUFILENBQUE7WUFDZCxLQUFPLElBQUksQ0FBQyxVQUFMLENBQWdCLE1BQWhCLENBQVA7Y0FDRSxHQUFHLENBQUUsR0FBRixDQUFILEdBQWMsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUFBLENBQUEsQ0FBRyxJQUFILENBQUEsQ0FBWCxHQUF1QixDQUFDLENBQUMsUUFEekM7O1VBSEY7QUFLQSxpQkFBa0IsR0FBRyxDQUFDLE1BQUosR0FBYSxvSEFBMkIsQ0FBM0IsQ0FBL0I7WUFBQSxHQUFHLENBQUMsSUFBSixDQUFTLEVBQVQ7VUFBQTtBQUNBLHNCQVBGLENBQUEsSUFPUyxDQUFNLEdBQU47UUFQSCxDQVBaOzs7UUFpQk0sUUFBVSxDQUFBLEdBQUUsQ0FBRixDQUFBO0FBQ2hCLGNBQUEsT0FBQSxFQUFBO1VBQVEsSUFBRyx1RUFBSDtZQUNFLE9BQUEsR0FBVSxDQUFBLENBQUEsQ0FBRyxDQUFDLENBQUMsUUFBRixHQUFhLENBQUMsQ0FBQyxLQUFmLEdBQXVCLENBQUMsQ0FBQyxJQUE1QixFQUFBLENBQUEsQ0FBb0MsT0FBcEMsRUFBQSxDQUFBLENBQStDLENBQUMsQ0FBQyxLQUFGLEdBQVUsQ0FBQyxDQUFDLE9BQVosR0FBc0IsQ0FBQyxDQUFDLFVBQXZFLENBQUEsRUFBQSxFQURaO1dBQUEsTUFBQTtZQUdFLE9BQUEsR0FBVSxHQUhaOztBQUlBLGlCQUFPLE9BQUEsUUFMVCxDQUFBLFFBS21CLENBQU0sR0FBQSxDQUFOO1FBTFQ7O01BbkJaLEVBeERKOztBQW1GSSxhQUFPLE9BQUEsR0FBVTtRQUFFLEtBQUY7UUFBUyxTQUFBLEVBQVcsQ0FBRSxTQUFGO01BQXBCO0lBcEZFO0VBQXJCLEVBVEY7OztFQWdHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQWhHQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9jbGlfdGFibGUzYTogLT5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9UYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdjbGktdGFibGUzJ1xuICAgICMgX1RhYmxlICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2NsaS10YWJsZTMnXG4gICAgeyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogQywgfSA9ICggcmVxdWlyZSAnLi9hbnNpLWJyaWNzJyApLnJlcXVpcmVfYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHMoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgbXl0YWJsZTpcbiAgICAgICAgaG9yaXpvbnRhbF9saW5lczogZmFsc2VcbiAgICAgICAgIyBjaGFyczpcbiAgICAgICAgICAjICd0b3AnOiAgICAgICAgICAgICfilZAnXG4gICAgICAgICAgIyAndG9wLW1pZCc6ICAgICAgICAn4pWkJ1xuICAgICAgICAgICMgJ3RvcC1sZWZ0JzogICAgICAgJ+KVlCdcbiAgICAgICAgICAjICd0b3AtcmlnaHQnOiAgICAgICfilZcnXG4gICAgICAgICAgIyAnYm90dG9tJzogICAgICAgICAn4pWQJ1xuICAgICAgICAgICMgJ2JvdHRvbS1taWQnOiAgICAgJ+KVpydcbiAgICAgICAgICAjICdib3R0b20tbGVmdCc6ICAgICfilZonXG4gICAgICAgICAgIyAnYm90dG9tLXJpZ2h0JzogICAn4pWdJ1xuICAgICAgICAgICMgJ2xlZnQnOiAgICAgICAgICAgJ+KVkSdcbiAgICAgICAgICAjICdsZWZ0LW1pZCc6ICAgICAgICfilZ8nXG4gICAgICAgICAgIyAncmlnaHQnOiAgICAgICAgICAn4pWRJ1xuICAgICAgICAgICMgJ3JpZ2h0LW1pZCc6ICAgICAgJ+KVoidcbiAgICAgICAgIyBjb2xXaWR0aHM6ICAgICAgICAgIFsxMSwgNSwgNV1cbiAgICAgICAgIyB3b3JkV3JhcDogICAgICAgICAgIHRydWVcbiAgICAgICAgIyB3cmFwT25Xb3JkQm91bmRhcnk6IGZhbHNlXG5cbiAgICAgICAgY2hhcnM6XG4gICAgICAgICAgJ3RvcCc6ICAgICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAndG9wLW1pZCc6ICAgICAgICAn4pSsJ1xuICAgICAgICAgICd0b3AtbGVmdCc6ICAgICAgICfilIwnXG4gICAgICAgICAgJ3RvcC1yaWdodCc6ICAgICAgJ+KUkCdcbiAgICAgICAgICAnYm90dG9tJzogICAgICAgICAn4pSAJ1xuICAgICAgICAgICdib3R0b20tbWlkJzogICAgICfilLQnXG4gICAgICAgICAgJ2JvdHRvbS1sZWZ0JzogICAgJ+KUlCdcbiAgICAgICAgICAnYm90dG9tLXJpZ2h0JzogICAn4pSYJ1xuICAgICAgICAgICdsZWZ0JzogICAgICAgICAgICfilIInXG4gICAgICAgICAgJ2xlZnQtbWlkJzogICAgICAgJ+KUnCdcbiAgICAgICAgICAnbWlkJzogICAgICAgICAgICAn4pSAJ1xuICAgICAgICAgICdtaWQtbWlkJzogICAgICAgICfilLwnXG4gICAgICAgICAgJ3JpZ2h0JzogICAgICAgICAgJ+KUgidcbiAgICAgICAgICAncmlnaHQtbWlkJzogICAgICAn4pSkJ1xuICAgICAgICAgICdtaWRkbGUnOiAgICAgICAgICfilIInXG4gICAgICAgICMgdHJ1bmNhdGU6ICAgICAgICAgJ+KApidcbiAgICAgICAgIyBjb2xXaWR0aHM6ICAgICAgICBbXVxuICAgICAgICAjIHJvd0hlaWdodHM6ICAgICAgIFtdXG4gICAgICAgICMgY29sQWxpZ25zOiAgICAgICAgW11cbiAgICAgICAgIyByb3dBbGlnbnM6ICAgICAgICBbXVxuICAgICAgICBzdHlsZTpcbiAgICAgICAgICAncGFkZGluZy1sZWZ0JzogICAxXG4gICAgICAgICAgJ3BhZGRpbmctcmlnaHQnOiAgMVxuICAgICAgICAgICdoZWFkJzogICAgICAgICAgIFsgJ2JvbGQnLCAnYnJpZ2h0WWVsbG93JywgJ2JnQmx1ZScsIF1cbiAgICAgICAgICAnYm9yZGVyJzogICAgICAgICBbICdncmV5JywgXVxuICAgICAgICAgICdjb21wYWN0JzogICAgICAgIGZhbHNlXG4gICAgICAgIGhlYWQ6IFtdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFRhYmxlIGV4dGVuZHMgX1RhYmxlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICAgY2ZnID0geyB0ZW1wbGF0ZXMubXl0YWJsZS4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHN1cGVyIGNmZ1xuICAgICAgICA7dW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcHVzaDogKCByb3cgKSAtPlxuICAgICAgICBmb3IgY2VsbCwgaWR4IGluIHJvd1xuICAgICAgICAgICMjIyBUQUlOVCBub3QgYSBnb29kIHNvbHV0aW9uICMjI1xuICAgICAgICAgIGNlbGwgICAgICAgID0gXCIje2NlbGx9XCJcbiAgICAgICAgICB1bmxlc3MgY2VsbC5zdGFydHNXaXRoICdcXHgxYidcbiAgICAgICAgICAgIHJvd1sgaWR4IF0gID0gQy55ZWxsb3cgKyBcIiN7Y2VsbH1cIiArIEMuZGVmYXVsdFxuICAgICAgICByb3cucHVzaCAnJyB3aGlsZSByb3cubGVuZ3RoIDwgKCBAb3B0aW9ucz8uaGVhZD8ubGVuZ3RoID8gMSApXG4gICAgICAgIHJldHVybiBzdXBlciByb3dcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0b1N0cmluZzogKCBQLi4uICkgLT5cbiAgICAgICAgaWYgKCBjYXB0aW9uID0gQG9wdGlvbnM/LmNhcHRpb24gKT9cbiAgICAgICAgICBjYXB0aW9uID0gXCIje0MuYmdfd2hpdGUgKyBDLmJsYWNrICsgQy5ib2xkfSAje2NhcHRpb259ICN7Qy5ib2xkMCArIEMuZGVmYXVsdCArIEMuYmdfZGVmYXVsdH1cXG5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgY2FwdGlvbiA9ICcnXG4gICAgICAgIHJldHVybiBjYXB0aW9uICsgc3VwZXIgUC4uLlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgVGFibGUsIGludGVybmFsczogeyB0ZW1wbGF0ZXMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
