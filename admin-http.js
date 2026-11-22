(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.STMAdminHttp = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function classifyStatus(status) {
    if (status === 402) return { kind: 'quota', retryable: true, message: 'Supabase has temporarily restricted this project because its usage quota was exceeded.' };
    if (status === 401) return { kind: 'unauthorized', retryable: false, message: 'Your admin session is no longer valid. Please sign in again.' };
    if (status === 403) return { kind: 'forbidden', retryable: false, message: 'Your account does not have permission for this operation.' };
    if (status === 429) return { kind: 'rate_limit', retryable: true, message: 'Supabase is rate-limiting requests. The admin will retry automatically.' };
    if (status >= 500) return { kind: 'server', retryable: true, message: 'Supabase is temporarily unavailable. The admin will retry automatically.' };
    if (status === 0) return { kind: 'network', retryable: true, message: 'The service could not be reached. Check your connection; the admin will retry automatically.' };
    return { kind: 'http', retryable: false, message: 'The request was rejected (HTTP ' + status + ').' };
  }

  function isInvalidSessionError(error) {
    if (!error) return false;
    if (error.invalidSession === true) return true;
    if (error.status === 401) return true;
    if (error.status !== 400) return false;
    var payload = error.payload || {};
    var code = String(payload.error || payload.code || '').toLowerCase();
    var message = String(payload.msg || payload.message || payload.error_description || '').toLowerCase();
    return /invalid_grant|refresh_token_not_found|invalid_refresh_token|session_not_found/.test(code) ||
      /refresh token.*(invalid|expired|not found|revoked)|invalid.*refresh token/.test(message);
  }

  function Backoff(options) {
    options = options || {};
    this.baseMs = options.baseMs || 30000;
    this.maxMs = options.maxMs || 300000;
    this.failures = 0;
    this.retryAt = 0;
  }
  Backoff.prototype.fail = function (now) {
    this.failures += 1;
    var delay = Math.min(this.maxMs, this.baseMs * Math.pow(2, Math.min(this.failures - 1, 10)));
    this.retryAt = (now == null ? Date.now() : now) + delay;
    return delay;
  };
  Backoff.prototype.success = function () { this.failures = 0; this.retryAt = 0; };
  Backoff.prototype.waiting = function (now) { return (now == null ? Date.now() : now) < this.retryAt; };
  Backoff.prototype.remaining = function (now) { return Math.max(0, this.retryAt - (now == null ? Date.now() : now)); };

  return { classifyStatus: classifyStatus, isInvalidSessionError: isInvalidSessionError, Backoff: Backoff };
});
