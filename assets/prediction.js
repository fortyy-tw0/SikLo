/**
 * SikLo prediction engine, browser copy.
 *
 * Line-for-line port of siklo-backend-ts/src/prediction.ts (compute + flag
 * messages) and src/dates.ts, so the web prototype and the phone app give the
 * same answer for the same dates. If you change the rules, change them in the
 * backend first and copy them here.
 *
 * Runs entirely in the page. Nothing is sent anywhere.
 */
(function (root) {
  'use strict';

  var MIN_CYCLE_DAYS = 15;
  var MAX_CYCLE_DAYS = 90;
  var RECENT_CYCLES = 6;
  var HIGH_VARIABILITY_SPREAD = 8;
  var CHANGE_THRESHOLD_DAYS = 7;
  var MIN_CYCLES_FOR_PREDICTION = 3;

  var FLAG_MESSAGES = {
    missing_data:
      'Some period dates may be missing between these records. ' +
      'You can review your history if that seems right.',
    high_variability:
      'Your recorded cycle lengths have varied considerably. ' +
      'This observation alone cannot determine whether you have PCOS or ' +
      'another condition. A qualified healthcare professional can help ' +
      'evaluate persistent concerns.',
    change_detected:
      'Your latest cycle length differed noticeably from your previous ' +
      'pattern. Changes can have many possible causes; a healthcare ' +
      'professional can help evaluate persistent concerns.'
  };

  // ---- Date helpers: all math on "YYYY-MM-DD" strings in UTC to avoid TZ drift.
  function parseDate(s) { var p = s.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function toISO(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, days) { var out = new Date(d.getTime()); out.setUTCDate(out.getUTCDate() + days); return out; }
  function diffDays(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; });
    var mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  /** periods: [{ start_date, end_date|null, kind? }]. Spotting never counts. */
  function compute(periods) {
    periods = periods.filter(function (p) { return (p.kind || 'period') === 'period'; });
    var starts = Array.from(new Set(periods.map(function (p) { return p.start_date; }))).sort();
    var cycles = [];
    for (var i = 0; i < starts.length - 1; i++) {
      cycles.push({ from: starts[i], to: starts[i + 1], length: diffDays(parseDate(starts[i]), parseDate(starts[i + 1])) });
    }
    var valid = cycles.filter(function (c) { return c.length >= MIN_CYCLE_DAYS && c.length <= MAX_CYCLE_DAYS; });
    var excluded = cycles.filter(function (c) { return valid.indexOf(c) < 0; });

    var durations = periods.filter(function (p) { return p.end_date; })
      .map(function (p) { return diffDays(parseDate(p.start_date), parseDate(p.end_date)) + 1; });
    var expectedDuration = durations.length ? Math.round(median(durations)) : null;

    var flags = excluded.length ? ['missing_data'] : [];
    var result = {
      status: 'not_enough_information', estimate: null, window: null, confidence: null,
      expected_duration: expectedDuration, cycles_used: valid.length,
      median_cycle_len: null, cycle_range: null, flags: flags
    };

    // Fewer than three completed intervals: "Not enough information".
    // No fabricated estimate (never assume 28 days).
    if (valid.length < MIN_CYCLES_FOR_PREDICTION) return result;

    var recent = valid.slice(-RECENT_CYCLES);
    var lengths = recent.map(function (c) { return c.length; });
    var med = Math.round(median(lengths));
    var minLen = Math.min.apply(null, lengths);
    var maxLen = Math.max.apply(null, lengths);
    var spread = maxLen - minLen;
    var lastStart = parseDate(starts[starts.length - 1]);

    var confidence = spread <= 4 ? 'high' : spread <= 8 ? 'medium' : 'low';
    if (spread > HIGH_VARIABILITY_SPREAD) flags.push('high_variability');

    var previous = valid.slice(0, -1).map(function (c) { return c.length; });
    if (previous.length && Math.abs(lengths[lengths.length - 1] - median(previous)) > CHANGE_THRESHOLD_DAYS) {
      flags.push('change_detected');
    }

    result.status = 'ok';
    result.estimate = toISO(addDays(lastStart, med));
    result.window = [toISO(addDays(lastStart, minLen)), toISO(addDays(lastStart, maxLen))];
    result.confidence = confidence;
    result.median_cycle_len = med;
    result.cycle_range = [minLen, maxLen];
    return result;
  }

  function flagMessages(flags) {
    return flags.map(function (key) { return { key: key, message: FLAG_MESSAGES[key] }; });
  }

  var api = {
    compute: compute, flagMessages: flagMessages,
    parseDate: parseDate, toISO: toISO, addDays: addDays, diffDays: diffDays,
    MIN_CYCLES_FOR_PREDICTION: MIN_CYCLES_FOR_PREDICTION
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SikloPrediction = api;
})(this);
