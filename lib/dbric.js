(function() {
  'use-strict';
  var Dbric, Dbric_std, False, IDN, LIT, SQL, True, VEC, as_bool, from_bool, int_main, int_std, unquote_name;

  ({
    Dbric,
    Dbric_std,
    SQL,
    IDN,
    LIT,
    SQL,
    VEC,
    True,
    False,
    as_bool,
    from_bool,
    unquote_name,
    internals: int_main
  } = require('./dbric-main'));

  ({
    Dbric_std,
    internals: int_std
  } = require('./dbric-std'));

  // : {
  //   E,
  //   type_of,
  //   build_statement_re,
  //   templates,
  //   Dbric_std_base,
  //   Dbric_std_variables, }
  module.exports = {
    Dbric,
    Dbric_std,
    SQL,
    IDN,
    LIT,
    SQL,
    VEC,
    True,
    False,
    as_bool,
    from_bool,
    unquote_name,
    internals: {...int_main, ...int_std}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQTs7RUFHQSxDQUFBO0lBQUUsS0FBRjtJQUNFLFNBREY7SUFFRSxHQUZGO0lBR0UsR0FIRjtJQUlFLEdBSkY7SUFLRSxHQUxGO0lBTUUsR0FORjtJQU9FLElBUEY7SUFRRSxLQVJGO0lBU0UsT0FURjtJQVVFLFNBVkY7SUFXRSxZQVhGO0lBWUUsU0FBQSxFQUFXO0VBWmIsQ0FBQSxHQVkyQixPQUFBLENBQVEsY0FBUixDQVozQjs7RUFhQSxDQUFBO0lBQUUsU0FBRjtJQUNFLFNBQUEsRUFBVztFQURiLENBQUEsR0FDMEIsT0FBQSxDQUFRLGFBQVIsQ0FEMUIsRUFoQkE7Ozs7Ozs7OztFQTJCQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLEtBRGU7SUFFZixTQUZlO0lBR2YsR0FIZTtJQUlmLEdBSmU7SUFLZixHQUxlO0lBTWYsR0FOZTtJQU9mLEdBUGU7SUFRZixJQVJlO0lBU2YsS0FUZTtJQVVmLE9BVmU7SUFXZixTQVhlO0lBWWYsWUFaZTtJQWFmLFNBQUEsRUFBVyxDQUFFLEdBQUEsUUFBRixFQUFlLEdBQUEsT0FBZjtFQWJJO0FBM0JqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4ndXNlLXN0cmljdCdcblxuXG57IERicmljLFxuICBEYnJpY19zdGQsXG4gIFNRTCxcbiAgSUROLFxuICBMSVQsXG4gIFNRTCxcbiAgVkVDLFxuICBUcnVlLFxuICBGYWxzZSxcbiAgYXNfYm9vbCxcbiAgZnJvbV9ib29sLFxuICB1bnF1b3RlX25hbWUsXG4gIGludGVybmFsczogaW50X21haW4sIH0gPSByZXF1aXJlICcuL2RicmljLW1haW4nXG57IERicmljX3N0ZCxcbiAgaW50ZXJuYWxzOiBpbnRfc3RkLCB9ID0gcmVxdWlyZSAnLi9kYnJpYy1zdGQnXG5cbiAgIyA6IHtcbiAgIyAgIEUsXG4gICMgICB0eXBlX29mLFxuICAjICAgYnVpbGRfc3RhdGVtZW50X3JlLFxuICAjICAgdGVtcGxhdGVzLFxuICAjICAgRGJyaWNfc3RkX2Jhc2UsXG4gICMgICBEYnJpY19zdGRfdmFyaWFibGVzLCB9XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEYnJpYyxcbiAgRGJyaWNfc3RkLFxuICBTUUwsXG4gIElETixcbiAgTElULFxuICBTUUwsXG4gIFZFQyxcbiAgVHJ1ZSxcbiAgRmFsc2UsXG4gIGFzX2Jvb2wsXG4gIGZyb21fYm9vbCxcbiAgdW5xdW90ZV9uYW1lLFxuICBpbnRlcm5hbHM6IHsgaW50X21haW4uLi4sIGludF9zdGQuLi4sIH0sIH1cblxuXG4iXX0=
