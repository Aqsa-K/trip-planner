import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addStop, addExpense, removeExpense, sortStops, formatPKR, formatUSD } from '../src/trip.js';
import { hash } from '../src/user.js';

test('addStop ignores empty names', () => {
  assert.deepEqual(addStop([], { name: '  ', date: '2026-10-20' }), []);
});

test('addStop trims and appends', () => {
  assert.deepEqual(addStop([], { name: ' Naran ', date: '2026-10-20' }), [{ name: 'Naran', date: '2026-10-20' }]);
});

test('addExpense rejects zero and negative amounts', () => {
  assert.deepEqual(addExpense([], { label: 'Food', amount: 0 }), []);
  assert.deepEqual(addExpense([], { label: 'Food', amount: -5 }), []);
});

test('sortStops orders by date without changing the input', () => {
  const stops = [{ name: 'B', date: '2026-10-21' }, { name: 'A', date: '2026-10-20' }];
  assert.deepEqual(sortStops(stops).map((s) => s.name), ['A', 'B']);
  assert.equal(stops[0].name, 'B');
});

test('formatPKR groups thousands', () => {
  assert.equal(formatPKR(43500), 'Rs 43,500');
});

test('formatUSD shows cents', () => {
  assert.equal(formatUSD(155.357), '$155.36');
});

test('hash is stable', () => {
  assert.equal(hash('u-4821'), hash('u-4821'));
});

test('removeExpense removes only that item', () => {
  const list = [{ label: 'A', amount: 1 }, { label: 'B', amount: 2 }, { label: 'C', amount: 3 }];
  assert.deepEqual(removeExpense(list, 1).map((e) => e.label), ['A', 'C']);
  assert.equal(list.length, 3);
});
