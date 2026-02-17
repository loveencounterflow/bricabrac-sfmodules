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
            // 'head':           [ 'bold', 'brightYellow', 'bgBlue', ]
            'head': ['bold', 'black', 'bgBlue'],
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS10YWJsZTNhLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBOzs7OztFQUtBLEtBQUEsR0FJRSxDQUFBOzs7SUFBQSxtQkFBQSxFQUFxQixRQUFBLENBQUEsQ0FBQTtBQUN2QixVQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBOztNQUNJLE1BQUEsR0FBa0MsT0FBQSxDQUFRLFlBQVI7TUFFbEMsQ0FBQSxDQUFBOztRQUFFLHVCQUFBLEVBQXlCO01BQTNCLENBQUEsR0FBa0MsQ0FBRSxPQUFBLENBQVEsY0FBUixDQUFGLENBQTBCLENBQUMsK0JBQTNCLENBQUEsQ0FBbEMsRUFISjs7TUFNSSxTQUFBLEdBQ0U7UUFBQSxPQUFBLEVBQ0U7VUFBQSxnQkFBQSxFQUFrQixLQUFsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFrQkEsS0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFrQixHQUFsQjtZQUNBLFNBQUEsRUFBa0IsR0FEbEI7WUFFQSxVQUFBLEVBQWtCLEdBRmxCO1lBR0EsV0FBQSxFQUFrQixHQUhsQjtZQUlBLFFBQUEsRUFBa0IsR0FKbEI7WUFLQSxZQUFBLEVBQWtCLEdBTGxCO1lBTUEsYUFBQSxFQUFrQixHQU5sQjtZQU9BLGNBQUEsRUFBa0IsR0FQbEI7WUFRQSxNQUFBLEVBQWtCLEdBUmxCO1lBU0EsVUFBQSxFQUFrQixHQVRsQjtZQVVBLEtBQUEsRUFBa0IsR0FWbEI7WUFXQSxTQUFBLEVBQWtCLEdBWGxCO1lBWUEsT0FBQSxFQUFrQixHQVpsQjtZQWFBLFdBQUEsRUFBa0IsR0FibEI7WUFjQSxRQUFBLEVBQWtCO1VBZGxCLENBbkJGOzs7Ozs7VUF1Q0EsS0FBQSxFQUNFO1lBQUEsY0FBQSxFQUFrQixDQUFsQjtZQUNBLGVBQUEsRUFBa0IsQ0FEbEI7O1lBR0EsTUFBQSxFQUFrQixDQUFFLE1BQUYsRUFBVSxPQUFWLEVBQW1CLFFBQW5CLENBSGxCO1lBSUEsUUFBQSxFQUFrQixDQUFFLE1BQUYsQ0FKbEI7WUFLQSxTQUFBLEVBQWtCO1VBTGxCLENBeENGO1VBOENBLElBQUEsRUFBTTtRQTlDTjtNQURGLEVBUE47O01BeURVLFFBQU4sTUFBQSxNQUFBLFFBQW9CLE9BQXBCLENBQUE7O1FBR0UsV0FBYSxDQUFFLEdBQUYsQ0FBQTtVQUNYLEdBQUEsR0FBTSxDQUFFLEdBQUEsU0FBUyxDQUFDLE9BQVosRUFBd0IsR0FBQSxHQUF4QjtlQUNOLENBQU0sR0FBTjtVQUNDO1FBSFUsQ0FEbkI7OztRQU9NLElBQU0sQ0FBRSxHQUFGLENBQUEsRUFBQTs7QUFDWixjQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO1VBQVEsS0FBQSxpREFBQTs7WUFFRSxJQUFBLEdBQWMsQ0FBQSxDQUFBLENBQUcsSUFBSCxDQUFBO1lBQ2QsS0FBTyxJQUFJLENBQUMsVUFBTCxDQUFnQixNQUFoQixDQUFQO2NBQ0UsR0FBRyxDQUFFLEdBQUYsQ0FBSCxHQUFjLENBQUMsQ0FBQyxNQUFGLEdBQVcsQ0FBQSxDQUFBLENBQUcsSUFBSCxDQUFBLENBQVgsR0FBdUIsQ0FBQyxDQUFDLFFBRHpDOztVQUhGO0FBS0EsaUJBQWtCLEdBQUcsQ0FBQyxNQUFKLEdBQWEsb0hBQTJCLENBQTNCLENBQS9CO1lBQUEsR0FBRyxDQUFDLElBQUosQ0FBUyxFQUFUO1VBQUE7QUFDQSxzQkFQRixDQUFBLElBT1MsQ0FBTSxHQUFOO1FBUEgsQ0FQWjs7O1FBaUJNLFFBQVUsQ0FBQSxHQUFFLENBQUYsQ0FBQTtBQUNoQixjQUFBLE9BQUEsRUFBQTtVQUFRLElBQUcsdUVBQUg7WUFDRSxPQUFBLEdBQVUsQ0FBQSxDQUFBLENBQUcsQ0FBQyxDQUFDLFFBQUYsR0FBYSxDQUFDLENBQUMsS0FBZixHQUF1QixDQUFDLENBQUMsSUFBNUIsRUFBQSxDQUFBLENBQW9DLE9BQXBDLEVBQUEsQ0FBQSxDQUErQyxDQUFDLENBQUMsS0FBRixHQUFVLENBQUMsQ0FBQyxPQUFaLEdBQXNCLENBQUMsQ0FBQyxVQUF2RSxDQUFBLEVBQUEsRUFEWjtXQUFBLE1BQUE7WUFHRSxPQUFBLEdBQVUsR0FIWjs7QUFJQSxpQkFBTyxPQUFBLFFBTFQsQ0FBQSxRQUttQixDQUFNLEdBQUEsQ0FBTjtRQUxUOztNQW5CWixFQXpESjs7QUFvRkksYUFBTyxPQUFBLEdBQVU7UUFBRSxLQUFGO1FBQVMsU0FBQSxFQUFXLENBQUUsU0FBRjtNQUFwQjtJQXJGRTtFQUFyQixFQVRGOzs7RUFpR0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUFqR0EiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfY2xpX3RhYmxlM2E6IC0+XG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfVGFibGUgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnY2xpLXRhYmxlMydcbiAgICAjIF9UYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9jbGktdGFibGUzJ1xuICAgIHsgYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHM6IEMsIH0gPSAoIHJlcXVpcmUgJy4vYW5zaS1icmljcycgKS5yZXF1aXJlX2Fuc2lfY29sb3JzX2FuZF9lZmZlY3RzKClcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGVtcGxhdGVzID1cbiAgICAgIG15dGFibGU6XG4gICAgICAgIGhvcml6b250YWxfbGluZXM6IGZhbHNlXG4gICAgICAgICMgY2hhcnM6XG4gICAgICAgICAgIyAndG9wJzogICAgICAgICAgICAn4pWQJ1xuICAgICAgICAgICMgJ3RvcC1taWQnOiAgICAgICAgJ+KVpCdcbiAgICAgICAgICAjICd0b3AtbGVmdCc6ICAgICAgICfilZQnXG4gICAgICAgICAgIyAndG9wLXJpZ2h0JzogICAgICAn4pWXJ1xuICAgICAgICAgICMgJ2JvdHRvbSc6ICAgICAgICAgJ+KVkCdcbiAgICAgICAgICAjICdib3R0b20tbWlkJzogICAgICfilacnXG4gICAgICAgICAgIyAnYm90dG9tLWxlZnQnOiAgICAn4pWaJ1xuICAgICAgICAgICMgJ2JvdHRvbS1yaWdodCc6ICAgJ+KVnSdcbiAgICAgICAgICAjICdsZWZ0JzogICAgICAgICAgICfilZEnXG4gICAgICAgICAgIyAnbGVmdC1taWQnOiAgICAgICAn4pWfJ1xuICAgICAgICAgICMgJ3JpZ2h0JzogICAgICAgICAgJ+KVkSdcbiAgICAgICAgICAjICdyaWdodC1taWQnOiAgICAgICfilaInXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgICBbMTEsIDUsIDVdXG4gICAgICAgICMgd29yZFdyYXA6ICAgICAgICAgICB0cnVlXG4gICAgICAgICMgd3JhcE9uV29yZEJvdW5kYXJ5OiBmYWxzZVxuXG4gICAgICAgIGNoYXJzOlxuICAgICAgICAgICd0b3AnOiAgICAgICAgICAgICfilIAnXG4gICAgICAgICAgJ3RvcC1taWQnOiAgICAgICAgJ+KUrCdcbiAgICAgICAgICAndG9wLWxlZnQnOiAgICAgICAn4pSMJ1xuICAgICAgICAgICd0b3AtcmlnaHQnOiAgICAgICfilJAnXG4gICAgICAgICAgJ2JvdHRvbSc6ICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnYm90dG9tLW1pZCc6ICAgICAn4pS0J1xuICAgICAgICAgICdib3R0b20tbGVmdCc6ICAgICfilJQnXG4gICAgICAgICAgJ2JvdHRvbS1yaWdodCc6ICAgJ+KUmCdcbiAgICAgICAgICAnbGVmdCc6ICAgICAgICAgICAn4pSCJ1xuICAgICAgICAgICdsZWZ0LW1pZCc6ICAgICAgICfilJwnXG4gICAgICAgICAgJ21pZCc6ICAgICAgICAgICAgJ+KUgCdcbiAgICAgICAgICAnbWlkLW1pZCc6ICAgICAgICAn4pS8J1xuICAgICAgICAgICdyaWdodCc6ICAgICAgICAgICfilIInXG4gICAgICAgICAgJ3JpZ2h0LW1pZCc6ICAgICAgJ+KUpCdcbiAgICAgICAgICAnbWlkZGxlJzogICAgICAgICAn4pSCJ1xuICAgICAgICAjIHRydW5jYXRlOiAgICAgICAgICfigKYnXG4gICAgICAgICMgY29sV2lkdGhzOiAgICAgICAgW11cbiAgICAgICAgIyByb3dIZWlnaHRzOiAgICAgICBbXVxuICAgICAgICAjIGNvbEFsaWduczogICAgICAgIFtdXG4gICAgICAgICMgcm93QWxpZ25zOiAgICAgICAgW11cbiAgICAgICAgc3R5bGU6XG4gICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICAgMVxuICAgICAgICAgICdwYWRkaW5nLXJpZ2h0JzogIDFcbiAgICAgICAgICAjICdoZWFkJzogICAgICAgICAgIFsgJ2JvbGQnLCAnYnJpZ2h0WWVsbG93JywgJ2JnQmx1ZScsIF1cbiAgICAgICAgICAnaGVhZCc6ICAgICAgICAgICBbICdib2xkJywgJ2JsYWNrJywgJ2JnQmx1ZScsIF1cbiAgICAgICAgICAnYm9yZGVyJzogICAgICAgICBbICdncmV5JywgXVxuICAgICAgICAgICdjb21wYWN0JzogICAgICAgIGZhbHNlXG4gICAgICAgIGhlYWQ6IFtdXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFRhYmxlIGV4dGVuZHMgX1RhYmxlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICAgY2ZnID0geyB0ZW1wbGF0ZXMubXl0YWJsZS4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIHN1cGVyIGNmZ1xuICAgICAgICA7dW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcHVzaDogKCByb3cgKSAtPlxuICAgICAgICBmb3IgY2VsbCwgaWR4IGluIHJvd1xuICAgICAgICAgICMjIyBUQUlOVCBub3QgYSBnb29kIHNvbHV0aW9uICMjI1xuICAgICAgICAgIGNlbGwgICAgICAgID0gXCIje2NlbGx9XCJcbiAgICAgICAgICB1bmxlc3MgY2VsbC5zdGFydHNXaXRoICdcXHgxYidcbiAgICAgICAgICAgIHJvd1sgaWR4IF0gID0gQy55ZWxsb3cgKyBcIiN7Y2VsbH1cIiArIEMuZGVmYXVsdFxuICAgICAgICByb3cucHVzaCAnJyB3aGlsZSByb3cubGVuZ3RoIDwgKCBAb3B0aW9ucz8uaGVhZD8ubGVuZ3RoID8gMSApXG4gICAgICAgIHJldHVybiBzdXBlciByb3dcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICB0b1N0cmluZzogKCBQLi4uICkgLT5cbiAgICAgICAgaWYgKCBjYXB0aW9uID0gQG9wdGlvbnM/LmNhcHRpb24gKT9cbiAgICAgICAgICBjYXB0aW9uID0gXCIje0MuYmdfd2hpdGUgKyBDLmJsYWNrICsgQy5ib2xkfSAje2NhcHRpb259ICN7Qy5ib2xkMCArIEMuZGVmYXVsdCArIEMuYmdfZGVmYXVsdH1cXG5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgY2FwdGlvbiA9ICcnXG4gICAgICAgIHJldHVybiBjYXB0aW9uICsgc3VwZXIgUC4uLlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICByZXR1cm4gZXhwb3J0cyA9IHsgVGFibGUsIGludGVybmFsczogeyB0ZW1wbGF0ZXMsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG4iXX0=
