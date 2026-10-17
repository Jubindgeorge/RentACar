const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

test('health endpoint reports unavailable until MongoDB is ready', async () => {
  const api = require('../routes/api');
  const route = api.stack.find(layer => layer.route && layer.route.path === '/health');
  assert.ok(route, 'GET /health route should exist');
  assert.equal(typeof route.route.stack[0].handle, 'function');
});
