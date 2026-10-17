const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const api = require('../routes/api');

test('health route reports unavailable when MongoDB is disconnected', () => {
  const route = api.stack.find(layer => layer.route && layer.route.path === '/health');
  assert.ok(route, 'GET /health route should exist');
  const handler = route.route.stack[0].handle;
  const originalState = mongoose.connection.readyState;
  try {
    // Mongoose is disconnected in this isolated test; no real database is needed.
    const response = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    handler({}, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.database, 'disconnected');
  } finally {
    // Do not change connection state; this guard documents the test assumption.
    assert.equal(mongoose.connection.readyState, originalState);
  }
});
