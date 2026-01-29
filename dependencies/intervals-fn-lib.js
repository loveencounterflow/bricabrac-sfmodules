"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.split = exports.substract = exports.merge = exports.intersect = exports.unify = exports.simplify = exports.isEqual = exports.isDuring = exports.isEnding = exports.isStarting = exports.isAfter = exports.isBefore = exports.isMeeting = exports.isOverlapping = exports.isOverlappingSimple = exports.complement = void 0;
var intervals_fn_lib_ramda_custom_js_1 = require("./intervals-fn-lib.ramda-custom.js");
/**
 * Complement of `intervals` bounded to `boundaries`. Convert space between two consecutive intervals into interval.
 * Keeps extra object properties on `boundaries`.
 * intervals array has to be sorted.
 * Doesn't mutate input. Output keeps input's structure.
 *
 * boundaries | interval(s) | result
 * --- | --- | ---
 * { start: 0, end: 10} | [{ start: 3, end: 7 }] | [{ start: 0, end: 3 }, { start: 7, end: 10 }]
 * { start: 0, end: 10} | [{ start: 2, end: 4 }, { start: 7, end: 8 }] | [{ start: 0, end: 2 }, { start: 4, end: 7 }, { start: 8, end: 10 }]
 *
 * @param boundaries arg1: interval defining boundaries for the complement computation.
 * @param intervals arg2: array of intervals that complement the result.
 * @returns array of intervals.
 */
var complement = function (boundaries, intervals) {
    var _a = boundaries, start = _a.start, end = _a.end, rest = __rest(_a, ["start", "end"]); // See TypeScript/pull/13288 TypeScript/issues/10727
    var prepRanges = __spreadArray(__spreadArray([
        { start: -Infinity, end: start }
    ], intervals, true), [
        { start: end, end: Infinity },
    ], false);
    return (0, intervals_fn_lib_ramda_custom_js_1.reject)(intervals_fn_lib_ramda_custom_js_1.isNil, 
    // @ts-ignore
    (0, intervals_fn_lib_ramda_custom_js_1.aperture)(2, prepRanges).map(function (_a) {
        var r1 = _a[0], r2 = _a[1];
        return (r1.end >= r2.start ? null : __assign({ start: r1.end, end: r2.start }, rest));
    }));
};
exports.complement = complement;
/**
 * Test if `intervalA` overlaps with `intervalB`.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 0, end: 10} | { start: 3, end: 7 } | true
 * { start: 0, end: 5} | { start: 5, end: 7 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if overlaps
 */
var isOverlappingSimple = function (a, b) {
    return b.start < a.end && b.end > a.start;
};
exports.isOverlappingSimple = isOverlappingSimple;
var isOverlappingNum = function (a, b) {
    return a.start < b && b < a.end;
};
var beforeOrAdjTo = function (afterInt) { return function (beforeInt) {
    return beforeInt.end <= afterInt.start;
}; };
/**
 * Test if `intervalA` overlaps with `intervalB`.
 *
 * Accept array of intervals.
 * Intervals arrays have to be sorted.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 0, end: 10} | { start: 3, end: 7 } | true
 * { start: 0, end: 5} | { start: 5, end: 7 } | false
 * { start: 5, end: 10} | [{ start: 0, end: 4 }, { start: 7, end: 8 }] | true
 *
 * @param intervalA arg1: interval or array of intervals
 * @param intervalB arg2: interval or array of intervals
 * @returns true if overlaps
 */
var isOverlapping = function (intervalsA, intervalsB) {
    if ([intervalsA, intervalsB].some(intervals_fn_lib_ramda_custom_js_1.isEmpty)) {
        return false;
    }
    var intsA = intervalsA[0];
    var newInters2 = (0, intervals_fn_lib_ramda_custom_js_1.dropWhile)(beforeOrAdjTo(intsA), intervalsB);
    if ((0, intervals_fn_lib_ramda_custom_js_1.isEmpty)(newInters2)) {
        return false;
    }
    var intsB = newInters2[0];
    return (0, exports.isOverlappingSimple)(intsA, intsB) ? true : (0, exports.isOverlapping)((0, intervals_fn_lib_ramda_custom_js_1.drop)(1, intervalsA), newInters2);
};
exports.isOverlapping = isOverlapping;
/**
 * Test if `intervalA` is adjacent to (meets) `intervalB`.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 0, end: 10} | { start: 3, end: 7 } | false
 * { start: 0, end: 5} | { start: 5, end: 7 } | true
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if adjacent
 */
var isMeeting = function (a, b) {
    return a.start === b.end || a.end === b.start;
};
exports.isMeeting = isMeeting;
/**
 * Test if `intervalA` is before or adjacent `intervalB`.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 0, end: 2} | { start: 3, end: 7 } | true
 * { start: 0, end: 5} | { start: 3, end: 7 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if before
 */
var isBefore = function (a, b) {
    return a.end <= b.start;
};
exports.isBefore = isBefore;
/**
 * Test if `intervalA` is after or adjacent `intervalB`.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 5, end: 10} | { start: 3, end: 4 } | true
 * { start: 5, end: 10} | { start: 3, end: 6 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if after
 */
var isAfter = function (a, b) {
    return a.start >= b.end;
};
exports.isAfter = isAfter;
/**
 * Test if `intervalA` and `intervalB` share the same starting point.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 5, end: 10} | { start: 5, end: 4 } | true
 * { start: 5, end: 10} | { start: 0, end: 10 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if same starting point
 */
var isStarting = function (a, b) {
    return a.start === b.start;
};
exports.isStarting = isStarting;
/**
 * Test if `intervalA` and `intervalB` share the same ending point.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 5, end: 10} | { start: 0, end: 10 } | true
 * { start: 5, end: 10} | { start: 5, end: 7 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if same ending point
 */
var isEnding = function (a, b) {
    return a.end === b.end;
};
exports.isEnding = isEnding;
/**
 * Test if `intervalA` occurs in `intervalB`. `intervalsB` act as boundaries. Can share starting and/or ending point.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 2, end: 6} | { start: 0, end: 10 } | true
 * { start: 5, end: 10} | { start: 0, end: 10 } | true
 * { start: 5, end: 10} | { start: 0, end: 9 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if `intervalA` occurs in `intervalB`
 */
var isDuring = function (a, b) {
    return a.start >= b.start && a.end <= b.end;
};
exports.isDuring = isDuring;
/**
 * Test if `intervalA` is equivalent to `intervalB`.
 *
 * intervalA | intervalB | result
 * --- | --- | ---
 * { start: 5, end: 10} | { start: 5, end: 10 } | true
 * { start: 5, end: 10} | { start: 0, end: 10 } | false
 *
 * @param intervalA arg1: interval
 * @param intervalB arg2: interval
 * @returns true if equivalent
 */
var isEqual = function (a, b) {
    return a.start === b.start && a.end === b.end;
};
exports.isEqual = isEqual;
var propFromNthArg = function (n, propName) {
    return (0, intervals_fn_lib_ramda_custom_js_1.pipe)((0, intervals_fn_lib_ramda_custom_js_1.nthArg)(n), (0, intervals_fn_lib_ramda_custom_js_1.prop)(propName));
};
var maxEnd = function (ranges) { return ranges.reduce(function (a, b) { return (a.end > b.end ? a : b); }); };
var simplifyPipe = (0, intervals_fn_lib_ramda_custom_js_1.pipe)((0, intervals_fn_lib_ramda_custom_js_1.groupWith)((0, intervals_fn_lib_ramda_custom_js_1.either)(exports.isOverlappingSimple, exports.isMeeting)), (0, intervals_fn_lib_ramda_custom_js_1.map)((0, intervals_fn_lib_ramda_custom_js_1.converge)((0, intervals_fn_lib_ramda_custom_js_1.applySpec)({ start: propFromNthArg(0, 'start'), end: propFromNthArg(1, 'end') }), [intervals_fn_lib_ramda_custom_js_1.head, maxEnd])));
/**
 * Simplification of `intervals`. Unify touching or overlapping intervals.
 *
 * Intervals array has to be sorted.
 *
 * Doesn't mutate input. Output keeps input's structure.
 *
 * | intervals A | result |
 * | ----------- | ------ |
 * | [{ start: 3, end: 9 }, { start: 9, end: 13 }, { start: 11, end: 14 }] | [{ start: 3, end: 14 }] |
 *
 * @param intervalA
 */
var simplify = function (intervals) {
    return simplifyPipe(__spreadArray([], intervals, true));
};
exports.simplify = simplify;
var sortByStart = (0, intervals_fn_lib_ramda_custom_js_1.sortBy)((0, intervals_fn_lib_ramda_custom_js_1.prop)('start'));
var unifyPipe = (0, intervals_fn_lib_ramda_custom_js_1.pipe)(intervals_fn_lib_ramda_custom_js_1.concat, sortByStart, exports.simplify);
/**
 * Union of `intervals`.
 *
 * Accept array of intervals. Doesn't mutate input. Output keeps input's structure.
 * Intervals arrays have to be sorted.
 *
 * interval(s) A | interval(s) B | result
 * --- | --- | ---
 * [{ start: 0, end: 4}] | [{ start: 3, end: 7 }, { start: 9, end: 11 }] | [{ start: 0, end: 7 }, { start: 9, end: 11 }]
 *
 * @param intervalA arg1: array of intervals
 * @param intervalB arg2: array of intervals
 * @returns union of `arg1` and `arg2`
 */
var unify = function (intervalsA, intervalsB) {
    return unifyPipe(__spreadArray([], intervalsA, true), __spreadArray([], intervalsB, true));
};
exports.unify = unify;
var intersectUnfolderSeed = function (i1, i2) {
    var new1 = i1[0].end > i2[0].end ? i1 : (0, intervals_fn_lib_ramda_custom_js_1.drop)(1, i1);
    var new2 = i2[0].end > i1[0].end ? i2 : (0, intervals_fn_lib_ramda_custom_js_1.drop)(1, i2);
    return [new1, new2];
};
var intersectUnfolder = function (_a) {
    var inters1 = _a[0], inters2 = _a[1];
    if ((0, intervals_fn_lib_ramda_custom_js_1.any)(intervals_fn_lib_ramda_custom_js_1.isEmpty)([inters1, inters2])) {
        return false;
    }
    var newInters1 = (0, intervals_fn_lib_ramda_custom_js_1.dropWhile)(beforeOrAdjTo(inters2[0]), inters1);
    if ((0, intervals_fn_lib_ramda_custom_js_1.isEmpty)(newInters1)) {
        return false;
    }
    var inter1 = newInters1[0];
    var newInters2 = (0, intervals_fn_lib_ramda_custom_js_1.dropWhile)(beforeOrAdjTo(inter1), inters2);
    if ((0, intervals_fn_lib_ramda_custom_js_1.isEmpty)(newInters2)) {
        return false;
    }
    var inter2 = newInters2[0];
    var minMaxInter = __assign(__assign({}, inter2), { end: Math.min(inter1.end, inter2.end), start: Math.max(inter1.start, inter2.start) });
    var resultInter = beforeOrAdjTo(minMaxInter)(minMaxInter) ? null : minMaxInter;
    var seed = intersectUnfolderSeed(newInters1, newInters2);
    return [resultInter, seed];
};
/**
 * Intersection of `intervals`. Does not simplify result. Keeps extra object properties on `intervalB`.
 *
 * `interalA` and `interalB` can have different structure.
 * Accept array of intervals. Doesn't mutate input. Output keeps `intervalB` structure.
 * Intervals arrays have to be sorted.
 *
 * interval(s) A | interval(s) B | result
 * --- | --- | ---
 * { start: 0, end: 4 } | { start: 3, end: 7, foo: 'bar' } | [{ start: 3, end: 4, foo: 'bar' }]
 * { start: 0, end: 10 } | [{ start: 2, end: 5}, { start: 5, end: 8}] | [{ start: 2, end: 5 }, { start: 5, end: 8 }]
 * [{ start: 0, end: 4 }, { start: 8, end: 11 }] | [{ start: 2, end: 9 }, { start: 10, end: 13 }] | [{ start: 2, end: 4 }, { start: 8, end: 9 }, { start: 10, end: 11 }]
 *
 * @param intervalA arg1: array of intervals
 * @param intervalB arg2: array of intervals
 * @returns intersection of `arg1` and `arg2`
 */
var intersect = function (intervalsA, intervalsB) {
    return (0, intervals_fn_lib_ramda_custom_js_1.unfold)(intersectUnfolder, [intervalsA, intervalsB]).filter(function (i) { return i != null; });
};
exports.intersect = intersect;
var minStart = function (ranges) { return ranges.reduce(function (a, b) { return (a.start < b.start ? a : b); }); };
var mergeUnfolder = function (mergeFn) { return function (ints) {
    if (!ints.length) {
        return false;
    }
    var start = minStart(ints).start;
    var withoutStart = ints
        .filter(function (a) { return a.end > start; })
        .map(function (a) { return (a.start === start ? __assign(__assign({}, a), { start: a.end }) : a); });
    var end = minStart(withoutStart).start;
    var toMerge = ints.filter(function (a) { return (0, exports.isDuring)({ start: start, end: end }, a); });
    var next = __assign(__assign({}, mergeFn(toMerge)), { start: start, end: end });
    return [
        next,
        ints.filter(function (a) { return a.end > end; }).map(function (a) { return (a.start <= end ? __assign(__assign({}, a), { start: end }) : a); }),
    ];
}; };
/**
 * Merge extra properties of all intervals inside `intervals`, when overlapping, with provided function `mergeFn`.
 * Can also be used to generate an array of intervals without overlaps
 *
 * Doesn't mutate input. Output keeps input's structure.
 * Interval array has to be sorted.
 *
 * parameter | value
 * --- | ---
 * mergeFn | `(a, b) => {...a, data: a.data + b.data }`
 * intervals | `[{ start: 0, end: 10, data: 5 }, { start: 4, end: 7, data: 100 }]`
 * result | `[{ start: 0, end: 4, data: 5 }, { start: 4, end: 7, data: 105 }, { start: 7, end: 10, data: 5 }]`
 * @param mergeFn arg1: function to merge extra properties of overlapping intervals
 * @param intervals arg2: intervals with extra properties.
 */
var merge = function (mergeFn, intervals) {
    return (0, intervals_fn_lib_ramda_custom_js_1.unfold)(mergeUnfolder(mergeFn), intervals);
};
exports.merge = merge;
var subtractInter = function (mask, base) {
    return (0, exports.complement)(base, mask);
};
/**
 * Subtact `base` with `mask`.
 * Keeps extra object properties on `base`.
 *
 * Accept array of intervals. Doesn't mutate input. Output keeps input's structure.
 * Intervals arrays have to be sorted.
 *
 * interval(s) base | interval(s) mask | result
 * --- | --- | ---
 * [{ start: 0, end: 4 }] | [{ start: 3, end: 7 }] | [{ start: 0, end: 3 }]
 * [{ start: 0, end: 4 }, { start: 8, end: 11 }] | [{ start: 2, end: 9 }, { start: 10, end: 13 }] | [{ start: 0, end: 2 }, { start: 9, end: 10 }]
 *
 * @param intervalA arg1: array of intervals
 * @param intervalB arg2: array of intervals
 * @returns intersection of `arg1` and `arg2`
 */
var substract = function (base, mask) {
    var intersection = (0, exports.intersect)(mask, base);
    return (0, intervals_fn_lib_ramda_custom_js_1.unnest)(base.map(function (b) { return subtractInter(intersection.filter(exports.isOverlappingSimple.bind(null, b)), b); }));
};
exports.substract = substract;
var splitIntervalWithIndex = function (int, index) {
    if (!isOverlappingNum(int, index)) {
        return [int];
    }
    return [__assign(__assign({}, int), { start: int.start, end: index }), __assign(__assign({}, int), { start: index, end: int.end })];
};
/**
 * Split `intervals` with `splitIndexes`.
 * Keeps extra object properties on `intervals`.
 * Doesn't mutate input. Output keeps input's structure.
 *
 * splitIndexes | interval(s) | result
 * --- | --- | ---
 * [2, 4] | { start: 0, end: 6, foo: 'bar' } | [{ start: 0, end: 2, foo: 'bar' }, { start: 2, end: 4, foo: 'bar' } { start: 4, end: 6, foo: 'bar' }]
 * [5] | [{ start: 0, end: 7 }, { start: 3, end: 8 }] | [{ start: 0, end: 5 }, { start: 5, end: 7 }, { start: 3, end: 5 }, { start: 5, end: 8 }]
 *
 * @param splitIndexes arg1: defines indexes where intervals are splitted.
 * @param intervals arg2: intervals to be splitted.
 * @returns array of intervals.
 */
var split = function (splits, intervals) {
    if (splits.length < 1 || intervals.length < 1) {
        return intervals;
    }
    return (0, intervals_fn_lib_ramda_custom_js_1.unnest)(intervals.map(function (int) {
        return splits.reduce(function (acc, i) {
            var lastInt = acc.pop();
            return __spreadArray(__spreadArray([], acc, true), splitIntervalWithIndex(lastInt, i), true);
        }, [int]);
    }));
};
exports.split = split;
