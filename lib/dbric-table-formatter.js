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
      caption = "(caption here)";
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
      werrn(reverse(red(" Ωjzrsdb___8 no query given ")));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXRhYmxlLWZvcm1hdHRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEscUJBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsbUJBQUEsRUFBQTs7RUFHQSxDQUFBLENBQUE7O0lBQUUsS0FBRjtJQUNFLEdBQUEsRUFBSyxJQURQO0lBRUU7RUFGRixDQUFBLEdBRTRCLE9BRjVCOztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEscUJBQVIsQ0FBRixDQUFpQyxDQUFDLG1CQUFsQyxDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxDQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFdBQVIsQ0FBNUIsRUFQQTs7Ozs7RUFZTSx3QkFBTixNQUFBLHNCQUFBLENBQUE7O0lBR0UscUJBQXVCLENBQUUsR0FBRixDQUFBO0FBQ3pCLFVBQUE7TUFBSSxJQUE2QyxJQUFDLENBQUEsYUFBRCxDQUFlLEdBQWYsQ0FBN0M7QUFBQTs7QUFBUztBQUFBO1VBQUEsS0FBQSxxQ0FBQTs7eUJBQUEsQ0FBQyxDQUFDO1VBQUYsQ0FBQTs7YUFBVDs7QUFDQTs7QUFBUztBQUFBO1FBQUEsS0FBQSxxQ0FBQTs7dUJBQUEsQ0FBQyxDQUFDO1FBQUYsQ0FBQTs7O0lBRlksQ0FEekI7OztJQU1FLFdBQWEsQ0FBRSxHQUFGLEVBQUEsR0FBTyxDQUFQLENBQUE7QUFDZixVQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBO01BQUksSUFBQSxHQUFjLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLEdBQUEsQ0FBWCxFQUFsQjs7TUFF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PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIGxvZzogZWNobyxcbiAgd2FybiAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IFRhYmxlLCB9ICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICcuL2NsaS10YWJsZTNhLmJyaWNzJyApLnJlcXVpcmVfY2xpX3RhYmxlM2EoKVxueyBmLCB9ICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbiMgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3R5cGVfb2YoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGJyaWNfdGFibGVfZm9ybWF0dGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfdGJsX2dldF9jb2x1bW5fbmFtZXM6ICggc3FsICkgLT5cbiAgICByZXR1cm4gKCBjLm5hbWUgZm9yIGMgaW4gc3FsLmNvbHVtbnMoKSAgKSBpZiBAaXNhX3N0YXRlbWVudCBzcWxcbiAgICByZXR1cm4gKCBjLm5hbWUgZm9yIGMgaW4gQHN0YXRlLmNvbHVtbnMgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGJsX2FzX3RleHQ6ICggc3FsLCBQLi4uICkgLT5cbiAgICByb3dzICAgICAgICA9IEB3YWxrIHNxbCwgUC4uLlxuICAgICMgY2FwdGlvbiAgICAgPSBmXCIje3JlbGF0aW9uX3R5cGV9ICN7cmVsYXRpb25fbmFtZX0gKCN7cm93X2NvdW50fTosLjBmOyByb3dzKVwiXG4gICAgY29sX25hbWVzICAgPSBAX3RibF9nZXRfY29sdW1uX25hbWVzIHNxbFxuICAgIGNhcHRpb24gICAgID0gXCIoY2FwdGlvbiBoZXJlKVwiXG4gICAgdGFibGUgICAgICAgPSBuZXcgVGFibGUgeyBjYXB0aW9uLCBoZWFkOiBbICcnLCBjb2xfbmFtZXMuLi4sIF0sIH1cbiAgICBjb3VudCAgICAgICA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciByb3cgZnJvbSByb3dzXG4gICAgICBjb3VudCsrXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNlbGxzID0gW11cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNvbF9uYW1lLCBjb2xfaWR4IGluIGNvbF9uYW1lc1xuICAgICAgICBjZWxsID0gcm93WyBjb2xfbmFtZSBdXG4gICAgICAgICMgY2VsbCA9IGNvbG9yIGNlbGwgaWYgKCBjb2xvciA9IGNvbF9jb2xvcnNbIGNvbF9pZHggXSApP1xuICAgICAgICBjZWxscy5wdXNoIGNlbGxcbiAgICAgIHRhYmxlLnB1c2ggdGFibGVfcm93ID0gWyBcIigje2NvdW50fSlcIiwgY2VsbHMuLi4sIF1cbiAgICByZXR1cm4gdGFibGUudG9TdHJpbmcoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGJsX2VjaG9fYXNfdGV4dDogKCBQLi4uICkgLT4gZWNobyBAdGJsX2FzX3RleHQgUC4uLlxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxub3V0cHV0X3F1ZXJ5X2FzX2NzdiA9ICggcXVlcnkgKSAtPlxuICBDU1YgICA9IHJlcXVpcmUgJ2Nzdi1zdHJpbmdpZnkvc3luYydcbiAganpyICAgPSBuZXcgSml6dXJhKClcbiAgd291dCAgPSAoIFAuLi4gKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBQLi4uOyAgICAgICAgICAgICAgICAgICAgICAgICAgICA7bnVsbFxuICB3b3V0biA9ICggUC4uLiApIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIFAuLi47IHByb2Nlc3Muc3Rkb3V0LndyaXRlICdcXG4nICA7bnVsbFxuICB3ZXJyICA9ICggUC4uLiApIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIFAuLi47ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtudWxsXG4gIHdlcnJuID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgUC4uLjsgcHJvY2Vzcy5zdGRlcnIud3JpdGUgJ1xcbicgIDtudWxsXG4gICMgcXVlcnkgPSBwcm9jZXNzLmFyZ3ZbIDIgXSA/IG51bGxcbiAgaWYgKCBub3QgcXVlcnk/ICkgb3IgKCBxdWVyeSBpcyAnJyApXG4gICAgd2Vycm4gcmV2ZXJzZSByZWQgXCIgzqlqenJzZGJfX184IG5vIHF1ZXJ5IGdpdmVuIFwiXG4gICAgcHJvY2Vzcy5leGl0IDExMVxuICAgIHJldHVybiBudWxsXG4gIHJvd3MgID0ganpyLmRiYS5nZXRfYWxsIHF1ZXJ5XG4gICMgd291dG4gY2xpX2NvbW1hbmRzLnVzZV9wc3BnXG4gIHdvdXQgQ1NWLnN0cmluZ2lmeSBbICggY29sdW1uLm5hbWUgZm9yIGNvbHVtbiBpbiBqenIuZGJhLnN0YXRlLmNvbHVtbnMgKSwgXVxuICB3b3V0IENTVi5zdHJpbmdpZnkgcm93c1xuICA7bnVsbFxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBpbnRlcm5hbHMgPSB7fVxuICByZXR1cm4ge1xuICAgIERicmljX3RhYmxlX2Zvcm1hdHRlcixcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
