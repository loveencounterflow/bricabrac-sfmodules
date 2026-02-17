(function() {
  'use strict';
  var Dbric_table_formatter, Table, debug, echo, f, output_query_as_csv, warn;

  ({
    //===========================================================================================================
    debug,
    log: echo,
    warn
  } = console);

  ({Table} = (require('./cli-table3a.brics')).require_cli_table3a());

  ({f} = require('effstring'));

  // { type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()

    //===========================================================================================================
  Dbric_table_formatter = class Dbric_table_formatter {
    //---------------------------------------------------------------------------------------------------------
    _tbl_get_column_names(sql) {
      var c;
      if (this.isa_statement(sql)) {
        return (function() {
          var i, len, ref, results;
          ref = sql.columns();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            c = ref[i];
            results.push(c.name);
          }
          return results;
        })();
      }
      return (function() {
        var i, len, ref, results;
        ref = this.state.columns;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          results.push(c.name);
        }
        return results;
      }).call(this);
    }

    //---------------------------------------------------------------------------------------------------------
    tbl_as_text(sql, ...P) {
      var caption, cell, cells, col_idx, col_name, col_names, count, i, len, row, rows, table, table_row;
      rows = this.walk(sql, ...P);
      // caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
      col_names = this._tbl_get_column_names(sql);
      caption = ` ${sql.toString()} `;
      table = new Table({
        caption,
        head: ['', ...col_names]
      });
      count = 0;
//.......................................................................................................
      for (row of rows) {
        count++;
        //.....................................................................................................
        cells = [];
//.....................................................................................................
        for (col_idx = i = 0, len = col_names.length; i < len; col_idx = ++i) {
          col_name = col_names[col_idx];
          cell = row[col_name];
          // cell = color cell if ( color = col_colors[ col_idx ] )?
          cells.push(cell);
        }
        table.push(table_row = [`(${count})`, ...cells]);
      }
      return table.toString();
    }

    //---------------------------------------------------------------------------------------------------------
    tbl_echo_as_text(...P) {
      return echo(this.tbl_as_text(...P));
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  output_query_as_csv = function(query) {
    var CSV, column, jzr, rows, werr, werrn, wout, woutn;
    CSV = require('csv-stringify/sync');
    jzr = new Jizura();
    wout = function(...P) {
      process.stdout.write(...P);
      return null;
    };
    woutn = function(...P) {
      process.stdout.write(...P);
      process.stdout.write('\n');
      return null;
    };
    werr = function(...P) {
      process.stderr.write(...P);
      return null;
    };
    werrn = function(...P) {
      process.stderr.write(...P);
      process.stderr.write('\n');
      return null;
    };
    // query = process.argv[ 2 ] ? null
    if ((query == null) || (query === '')) {
      werrn(reverse(red(" Ωdtf___2 no query given ")));
      process.exit(111);
      return null;
    }
    rows = jzr.dba.get_all(query);
    // woutn cli_commands.use_pspg
    wout(CSV.stringify([
      (function() {
        var i,
      len,
      ref,
      results;
        ref = jzr.dba.state.columns;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          column = ref[i];
          results.push(column.name);
        }
        return results;
      })()
    ]));
    wout(CSV.stringify(rows));
    return null;
  };

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = {};
    return {Dbric_table_formatter, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXRhYmxlLWZvcm1hdHRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEscUJBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsbUJBQUEsRUFBQTs7RUFHQSxDQUFBLENBQUE7O0lBQUUsS0FBRjtJQUNFLEdBQUEsRUFBSyxJQURQO0lBRUU7RUFGRixDQUFBLEdBRTRCLE9BRjVCOztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEscUJBQVIsQ0FBRixDQUFpQyxDQUFDLG1CQUFsQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVIsQ0FBNUIsRUFQQTs7Ozs7RUFZTSx3QkFBTixNQUFBLHNCQUFBLENBQUE7O0lBR0UscUJBQXVCLENBQUUsR0FBRixDQUFBO0FBQ3pCLFVBQUE7TUFBSSxJQUE2QyxJQUFDLENBQUEsYUFBRCxDQUFlLEdBQWYsQ0FBN0M7QUFBQTs7QUFBUztBQUFBO1VBQUEsS0FBQSxxQ0FBQTs7eUJBQUEsQ0FBQyxDQUFDO1VBQUYsQ0FBQTs7YUFBVDs7QUFDQTs7QUFBUztBQUFBO1FBQUEsS0FBQSxxQ0FBQTs7dUJBQUEsQ0FBQyxDQUFDO1FBQUYsQ0FBQTs7O0lBRlksQ0FEekI7OztJQU1FLFdBQWEsQ0FBRSxHQUFGLEVBQUEsR0FBTyxDQUFQLENBQUE7QUFDZixVQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBO01BQUksSUFBQSxHQUFjLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLEdBQUEsQ0FBWCxFQUFsQjs7TUFF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bnRlbnQiOlsiXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIGxvZzogZWNobyxcbiAgd2FybiAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IFRhYmxlLCB9ICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICcuL2NsaS10YWJsZTNhLmJyaWNzJyApLnJlcXVpcmVfY2xpX3RhYmxlM2EoKVxueyBmLCB9ICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbiMgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfdGFibGVfZm9ybWF0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdGJsX2dldF9jb2x1bW5fbmFtZXM6ICggc3FsICkgLT5cbiAgICByZXR1cm4gKCBjLm5hbWUgZm9yIGMgaW4gc3FsLmNvbHVtbnMoKSAgKSBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICByZXR1cm4gKCBjLm5hbWUgZm9yIGMgaW4gQHN0YXRlLmNvbHVtbnMgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGJsX2FzX3RleHQ6ICggc3FsLCBQLi4uICkgLT5cbiAgICByb3dzICAgICAgICA9IEB3YWxrIHNxbCwgUC4uLlxuICAgICMgY2FwdGlvbiAgICAgPSBmXCIje3JlbGF0aW9uX3R5cGV9ICN7cmVsYXRpb25fbmFtZX0gKCN7cm93X2NvdW50fTosLjBmOyByb3dzKVwiXG4gICAgY29sX25hbWVzICAgPSBAX3RibF9nZXRfY29sdW1uX25hbWVzIHNxbFxuICAgIGNhcHRpb24gICAgID0gXCIgI3tzcWwudG9TdHJpbmcoKX0gXCJcbiAgICB0YWJsZSAgICAgICA9IG5ldyBUYWJsZSB7IGNhcHRpb24sIGhlYWQ6IFsgJycsIGNvbF9uYW1lcy4uLiwgXSwgfVxuICAgIGNvdW50ICAgICAgID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIHJvdyBmcm9tIHJvd3NcbiAgICAgIGNvdW50KytcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgY2VsbHMgPSBbXVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgY29sX25hbWUsIGNvbF9pZHggaW4gY29sX25hbWVzXG4gICAgICAgIGNlbGwgPSByb3dbIGNvbF9uYW1lIF1cbiAgICAgICAgIyBjZWxsID0gY29sb3IgY2VsbCBpZiAoIGNvbG9yID0gY29sX2NvbG9yc1sgY29sX2lkeCBdICk/XG4gICAgICAgIGNlbGxzLnB1c2ggY2VsbFxuICAgICAgdGFibGUucHVzaCB0YWJsZV9yb3cgPSBbIFwiKCN7Y291bnR9KVwiLCBjZWxscy4uLiwgXVxuICAgIHJldHVybiB0YWJsZS50b1N0cmluZygpXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0YmxfZWNob19hc190ZXh0OiAoIFAuLi4gKSAtPiBlY2hvIEB0YmxfYXNfdGV4dCBQLi4uXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5vdXRwdXRfcXVlcnlfYXNfY3N2ID0gKCBxdWVyeSApIC0+XG4gIENTViAgID0gcmVxdWlyZSAnY3N2LXN0cmluZ2lmeS9zeW5jJ1xuICBqenIgICA9IG5ldyBKaXp1cmEoKVxuICB3b3V0ICA9ICggUC4uLiApIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIFAuLi47ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtudWxsXG4gIHdvdXRuID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgUC4uLjsgcHJvY2Vzcy5zdGRvdXQud3JpdGUgJ1xcbicgIDtudWxsXG4gIHdlcnIgID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgUC4uLjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgO251bGxcbiAgd2Vycm4gPSAoIFAuLi4gKSAtPiBwcm9jZXNzLnN0ZGVyci53cml0ZSBQLi4uOyBwcm9jZXNzLnN0ZGVyci53cml0ZSAnXFxuJyAgO251bGxcbiAgIyBxdWVyeSA9IHByb2Nlc3MuYXJndlsgMiBdID8gbnVsbFxuICBpZiAoIG5vdCBxdWVyeT8gKSBvciAoIHF1ZXJ5IGlzICcnIClcbiAgICB3ZXJybiByZXZlcnNlIHJlZCBcIiDOqWR0Zl9fXzIgbm8gcXVlcnkgZ2l2ZW4gXCJcbiAgICBwcm9jZXNzLmV4aXQgMTExXG4gICAgcmV0dXJuIG51bGxcbiAgcm93cyAgPSBqenIuZGJhLmdldF9hbGwgcXVlcnlcbiAgIyB3b3V0biBjbGlfY29tbWFuZHMudXNlX3BzcGdcbiAgd291dCBDU1Yuc3RyaW5naWZ5IFsgKCBjb2x1bW4ubmFtZSBmb3IgY29sdW1uIGluIGp6ci5kYmEuc3RhdGUuY29sdW1ucyApLCBdXG4gIHdvdXQgQ1NWLnN0cmluZ2lmeSByb3dzXG4gIDtudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IHt9XG4gIHJldHVybiB7XG4gICAgRGJyaWNfdGFibGVfZm9ybWF0dGVyLFxuICAgIGludGVybmFscywgfVxuIl19
