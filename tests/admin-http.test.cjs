'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('../admin-http.js');

test('classifies quota, auth, permission, rate limit, server and network errors', () => {
  assert.equal(http.classifyStatus(402).kind, 'quota');
  assert.equal(http.classifyStatus(401).kind, 'unauthorized');
  assert.equal(http.classifyStatus(403).kind, 'forbidden');
  assert.equal(http.classifyStatus(429).kind, 'rate_limit');
  assert.equal(http.classifyStatus(503).kind, 'server');
  assert.equal(http.classifyStatus(0).kind, 'network');
});

test('does not treat quota and permission failures as invalid sessions', () => {
  assert.equal(http.isInvalidSessionError({ status: 402 }), false);
  assert.equal(http.isInvalidSessionError({ status: 403 }), false);
  assert.equal(http.isInvalidSessionError({ status: 500 }), false);
});

test('only treats explicit refresh-token rejection as invalid session', () => {
  assert.equal(http.isInvalidSessionError({ status: 401 }), true);
  assert.equal(http.isInvalidSessionError({ status: 400, payload: { error: 'invalid_grant' } }), true);
  assert.equal(http.isInvalidSessionError({ status: 400, payload: { msg: 'Invalid refresh token' } }), true);
  assert.equal(http.isInvalidSessionError({ status: 400, payload: { msg: 'Email rate limit exceeded' } }), false);
});

test('backs off exponentially and caps the delay', () => {
  const backoff = new http.Backoff({ baseMs: 1000, maxMs: 4000 });
  assert.equal(backoff.fail(10000), 1000);
  assert.equal(backoff.waiting(10500), true);
  assert.equal(backoff.remaining(10500), 500);
  assert.equal(backoff.fail(11000), 2000);
  assert.equal(backoff.fail(13000), 4000);
  assert.equal(backoff.fail(17000), 4000);
  assert.equal(backoff.waiting(20999), true);
  assert.equal(backoff.waiting(21000), false);
  backoff.success();
  assert.equal(backoff.failures, 0);
  assert.equal(backoff.retryAt, 0);
});
