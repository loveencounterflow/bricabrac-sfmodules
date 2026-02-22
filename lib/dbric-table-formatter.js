(function() {
  'use strict';
  var Dbric_table_formatter, Table, debug, echo, f, output_query_as_csv, type_of, warn;

  ({
    //===========================================================================================================
    debug,
    log: echo,
    warn
  } = console);

  ({Table} = (require('./cli-table3a.brics')).require_cli_table3a());

  ({f} = require('effstring'));

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

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
      /* TAINT assert P is empty */
      var caption, cell, cells, col_idx, col_name, col_names, count, i, len, row, rows, table, table_row, type;
      if (this.isa_statement(sql)) {
        rows = this.walk(sql, ...P);
        caption = sql.source.replace(/\s+/gv, ' ');
        caption = caption.slice(0, 101);
      } else {
        switch (type = type_of(sql)) {
          case 'generator':
            rows = sql;
            caption = '?';
            break;
          case 'generatorfunction':
            rows = sql.call(this, ...P);
            caption = sql.name;
            break;
          case 'text':
            rows = this.walk(sql, ...P);
            caption = sql;
            break;
          default:
            rows = this.walk(sql, ...P);
            caption = sql.toString();
        }
      }
      // caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
      col_names = this._tbl_get_column_names(sql);
      caption = ` ${caption} `;
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
    tbl_echo_as_text(sql, ...P) {
      return echo(this.tbl_as_text(sql, ...P));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXRhYmxlLWZvcm1hdHRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEscUJBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsbUJBQUEsRUFBQSxPQUFBLEVBQUE7O0VBR0EsQ0FBQSxDQUFBOztJQUFFLEtBQUY7SUFDRSxHQUFBLEVBQUssSUFEUDtJQUVFO0VBRkYsQ0FBQSxHQUU0QixPQUY1Qjs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLHFCQUFSLENBQUYsQ0FBaUMsQ0FBQyxtQkFBbEMsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUIsRUFSQTs7O0VBWU0sd0JBQU4sTUFBQSxzQkFBQSxDQUFBOztJQUdFLHFCQUF1QixDQUFFLEdBQUYsQ0FBQTtBQUN6QixVQUFBO01BQUksSUFBNkMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLENBQTdDO0FBQUE7O0FBQVM7QUFBQTtVQUFBLEtBQUEscUNBQUE7O3lCQUFBLENBQUMsQ0FBQztVQUFGLENBQUE7O2FBQVQ7O0FBQ0E7O0FBQVM7QUFBQTtRQUFBLEtBQUEscUNBQUE7O3VCQUFBLENBQUMsQ0FBQztRQUFGLENBQUE7OztJQUZZLENBRHpCOzs7SUFNRSxXQUFhLENBQUUsR0FBRixFQUFBLEdBQU8sQ0FBUCxDQUFBLEVBQUE7O0FBQ2YsVUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEs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LENBQUYsQ0FBQTtNQUFZLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixHQUFBLENBQXJCO01BQTJCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixJQUFyQjthQUE0QjtJQUFuRSxFQUxWOztJQU9FLElBQUcsQ0FBTSxhQUFOLENBQUEsSUFBa0IsQ0FBRSxLQUFBLEtBQVMsRUFBWCxDQUFyQjtNQUNFLEtBQUEsQ0FBTSxPQUFBLENBQVEsR0FBQSxDQUFJLDJCQUFKLENBQVIsQ0FBTjtNQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYjtBQUNBLGFBQU8sS0FIVDs7SUFJQSxJQUFBLEdBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFSLENBQWdCLEtBQWhCLEVBWFY7O0lBYUUsSUFBQSxDQUFLLEdBQUcsQ0FBQyxTQUFKLENBQWM7Ozs7OztBQUFJO0FBQUE7UUFBQSxLQUFBLHFDQUFBOzt1QkFBQSxNQUFNLENBQUM7UUFBUCxDQUFBOztVQUFKO0tBQWQsQ0FBTDtJQUNBLElBQUEsQ0FBSyxHQUFHLENBQUMsU0FBSixDQUFjLElBQWQsQ0FBTDtXQUNDO0VBaEJtQixFQS9EdEI7OztFQW1GQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUE7SUFBRSxTQUFBLEdBQVksQ0FBQTtBQUNaLFdBQU8sQ0FDTCxxQkFESyxFQUVMLFNBRks7RUFGVyxDQUFBO0FBbkZwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLFxuICBsb2c6IGVjaG8sXG4gIHdhcm4gICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBUYWJsZSwgfSAgICAgICAgICAgICAgICA9ICggcmVxdWlyZSAnLi9jbGktdGFibGUzYS5icmljcycgKS5yZXF1aXJlX2NsaV90YWJsZTNhKClcbnsgZiwgfSAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdlZmZzdHJpbmcnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEYnJpY190YWJsZV9mb3JtYXR0ZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF90YmxfZ2V0X2NvbHVtbl9uYW1lczogKCBzcWwgKSAtPlxuICAgIHJldHVybiAoIGMubmFtZSBmb3IgYyBpbiBzcWwuY29sdW1ucygpICApIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgIHJldHVybiAoIGMubmFtZSBmb3IgYyBpbiBAc3RhdGUuY29sdW1ucyApXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0YmxfYXNfdGV4dDogKCBzcWwsIFAuLi4gKSAtPlxuICAgIGlmIEBpc2Ffc3RhdGVtZW50IHNxbFxuICAgICAgcm93cyAgICA9IEB3YWxrIHNxbCwgUC4uLlxuICAgICAgY2FwdGlvbiA9IHNxbC5zb3VyY2UucmVwbGFjZSAvXFxzKy9ndiwgJyAnXG4gICAgICBjYXB0aW9uID0gY2FwdGlvblsgLi4gMTAwIF1cbiAgICBlbHNlXG4gICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2Ygc3FsXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcidcbiAgICAgICAgICAjIyMgVEFJTlQgYXNzZXJ0IFAgaXMgZW1wdHkgIyMjXG4gICAgICAgICAgcm93cyAgICA9IHNxbFxuICAgICAgICAgIGNhcHRpb24gPSAnPydcbiAgICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgICAgcm93cyAgICA9IHNxbC5jYWxsIEAsIFAuLi5cbiAgICAgICAgICBjYXB0aW9uID0gc3FsLm5hbWVcbiAgICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgICByb3dzICAgID0gQHdhbGsgc3FsLCBQLi4uXG4gICAgICAgICAgY2FwdGlvbiA9IHNxbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgcm93cyAgICA9IEB3YWxrIHNxbCwgUC4uLlxuICAgICAgICAgIGNhcHRpb24gPSBzcWwudG9TdHJpbmcoKVxuICAgICMgY2FwdGlvbiAgICAgPSBmXCIje3JlbGF0aW9uX3R5cGV9ICN7cmVsYXRpb25fbmFtZX0gKCN7cm93X2NvdW50fTosLjBmOyByb3dzKVwiXG4gICAgY29sX25hbWVzICAgPSBAX3RibF9nZXRfY29sdW1uX25hbWVzIHNxbFxuICAgIGNhcHRpb24gICAgID0gXCIgI3tjYXB0aW9ufSBcIlxuICAgIHRhYmxlICAgICAgID0gbmV3IFRhYmxlIHsgY2FwdGlvbiwgaGVhZDogWyAnJywgY29sX25hbWVzLi4uLCBdLCB9XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3Igcm93IGZyb20gcm93c1xuICAgICAgY291bnQrK1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjZWxscyA9IFtdXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBjb2xfbmFtZSwgY29sX2lkeCBpbiBjb2xfbmFtZXNcbiAgICAgICAgY2VsbCA9IHJvd1sgY29sX25hbWUgXVxuICAgICAgICAjIGNlbGwgPSBjb2xvciBjZWxsIGlmICggY29sb3IgPSBjb2xfY29sb3JzWyBjb2xfaWR4IF0gKT9cbiAgICAgICAgY2VsbHMucHVzaCBjZWxsXG4gICAgICB0YWJsZS5wdXNoIHRhYmxlX3JvdyA9IFsgXCIoI3tjb3VudH0pXCIsIGNlbGxzLi4uLCBdXG4gICAgcmV0dXJuIHRhYmxlLnRvU3RyaW5nKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRibF9lY2hvX2FzX3RleHQ6ICggc3FsLCBQLi4uICkgLT4gZWNobyBAdGJsX2FzX3RleHQgc3FsLCBQLi4uXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5vdXRwdXRfcXVlcnlfYXNfY3N2ID0gKCBxdWVyeSApIC0+XG4gIENTViAgID0gcmVxdWlyZSAnY3N2LXN0cmluZ2lmeS9zeW5jJ1xuICBqenIgICA9IG5ldyBKaXp1cmEoKVxuICB3b3V0ICA9ICggUC4uLiApIC0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlIFAuLi47ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtudWxsXG4gIHdvdXRuID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgUC4uLjsgcHJvY2Vzcy5zdGRvdXQud3JpdGUgJ1xcbicgIDtudWxsXG4gIHdlcnIgID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUgUC4uLjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgO251bGxcbiAgd2Vycm4gPSAoIFAuLi4gKSAtPiBwcm9jZXNzLnN0ZGVyci53cml0ZSBQLi4uOyBwcm9jZXNzLnN0ZGVyci53cml0ZSAnXFxuJyAgO251bGxcbiAgIyBxdWVyeSA9IHByb2Nlc3MuYXJndlsgMiBdID8gbnVsbFxuICBpZiAoIG5vdCBxdWVyeT8gKSBvciAoIHF1ZXJ5IGlzICcnIClcbiAgICB3ZXJybiByZXZlcnNlIHJlZCBcIiDOqWR0Zl9fXzIgbm8gcXVlcnkgZ2l2ZW4gXCJcbiAgICBwcm9jZXNzLmV4aXQgMTExXG4gICAgcmV0dXJuIG51bGxcbiAgcm93cyAgPSBqenIuZGJhLmdldF9hbGwgcXVlcnlcbiAgIyB3b3V0biBjbGlfY29tbWFuZHMudXNlX3BzcGdcbiAgd291dCBDU1Yuc3RyaW5naWZ5IFsgKCBjb2x1bW4ubmFtZSBmb3IgY29sdW1uIGluIGp6ci5kYmEuc3RhdGUuY29sdW1ucyApLCBdXG4gIHdvdXQgQ1NWLnN0cmluZ2lmeSByb3dzXG4gIDtudWxsXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGludGVybmFscyA9IHt9XG4gIHJldHVybiB7XG4gICAgRGJyaWNfdGFibGVfZm9ybWF0dGVyLFxuICAgIGludGVybmFscywgfVxuIl19
