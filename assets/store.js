/**
 * SikLo on-device storage for the web prototype.
 *
 * Two layers, matching the promise on the landing screen
 * ("stored on this device only after you choose Save"):
 *
 *   draft  -> sessionStorage. Holds answers while moving through setup.
 *             Disappears when the tab is closed. Never leaves the browser.
 *   saved  -> localStorage. Written only by commit(), i.e. when the user
 *             taps Save on Step 4. Stays in this browser until wipe().
 *
 * Nothing here makes a network request. Field names follow the
 * siklo-backend API contract (POST /onboarding, POST /periods) so the same
 * data can be handed to siklo-backend-ts in the phone app later; see
 * onboardingPayload().
 *
 * Note: unlike the phone app, browser storage is not encrypted at rest.
 */
(function (root) {
  'use strict';

  var DRAFT_KEY = 'siklo-draft';
  var SAVED_KEY = 'siklo-profile';
  var VERSION = 1;

  function read(storage, key) {
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function write(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function ss() { try { return window.sessionStorage; } catch (e) { return null; } }
  function ls() { try { return window.localStorage; } catch (e) { return null; } }

  function emptyDraft() {
    return {
      dob: null,                 // "YYYY-MM-DD"
      cycle_type: null,          // regular | irregular | not_sure
      diagnosed: null,           // yes | no | unsure | private
      concern_note: '',          // free text; stays a note, never a diagnosis
      contraception_context: false,
      life_stage_context: false,
      periods: []                // [{ id, start_date, end_date, kind, end_state, flow_level }]
    };
  }

  /** Current draft. Starts from the saved profile if there is one. */
  function draft() {
    var s = ss(), d = s && read(s, DRAFT_KEY);
    if (d) return Object.assign(emptyDraft(), d);
    var saved = load();
    return saved ? Object.assign(emptyDraft(), saved.profile, { periods: saved.periods }) : emptyDraft();
  }

  /** Merge fields into the draft (session only). */
  function update(fields) {
    var d = Object.assign(draft(), fields), s = ss();
    if (s) write(s, DRAFT_KEY, d);
    return d;
  }

  /** The saved profile, or null if the user has never tapped Save. */
  function load() {
    var l = ls();
    var p = l && read(l, SAVED_KEY);
    return p && p.version === VERSION ? p : null;
  }

  /** Save: copy the draft into this browser's persistent storage. */
  function commit() {
    var d = draft();
    var periods = d.periods;
    delete d.periods;
    var record = { version: VERSION, saved_at: new Date().toISOString(), profile: d, periods: periods };
    var l = ls();
    if (!l || !write(l, SAVED_KEY, record)) return null;
    var s = ss(); if (s) s.removeItem(DRAFT_KEY);
    return record;
  }

  /** Delete everything SikLo stored in this browser. */
  function wipe() {
    var l = ls(), s = ss();
    if (l) l.removeItem(SAVED_KEY);
    if (s) { s.removeItem(DRAFT_KEY); s.removeItem('siklo-dob'); }
  }

  /** Map the draft or saved profile to the backend's POST /onboarding body. */
  function onboardingPayload(src) {
    var p = (src && src.profile) || src || draft();
    var health = [];
    if (p.diagnosed === 'yes') health.push({ kind: 'condition', condition_name: null, status: 'diagnosed_user_reported' });
    if (p.diagnosed === 'private') health.push({ kind: 'condition', condition_name: null, status: 'prefer_not_to_say' });
    return { language: 'en', cycle_type: p.cycle_type, health_context: health, enabled_categories: [] };
  }

  root.SikloStore = {
    draft: draft, update: update, load: load, commit: commit, wipe: wipe,
    onboardingPayload: onboardingPayload
  };
})(this);
