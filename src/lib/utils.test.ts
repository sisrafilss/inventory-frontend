import test from 'node:test';
import assert from 'node:assert/strict';
import { cn, formatMoney, formatCurrency, formatDate } from './utils.ts';

test('formatMoney formats amounts with BDT symbol (৳) and two decimals', () => {
  assert.equal(formatMoney(0), '৳0.00');
  assert.equal(formatMoney(100), '৳100.00');
  assert.equal(formatMoney(1234.5), '৳1,234.50');
  assert.equal(formatMoney('5000.75'), '৳5,000.75');
});

test('formatMoney handles NaN or empty input safely', () => {
  assert.equal(formatMoney(''), '৳0.00');
  assert.equal(formatMoney(Number.NaN), '৳0.00');
});

test('cn merges class names properly', () => {
  assert.equal(cn('px-2 py-1', 'bg-red-500', false && 'hidden'), 'px-2 py-1 bg-red-500');
  assert.equal(cn('p-4', 'p-2'), 'p-2');
});

test('formatCurrency formats USD currency', () => {
  assert.equal(formatCurrency(100), '$100.00');
});

test('formatDate formats valid dates and handles falsy input', () => {
  assert.equal(formatDate(''), 'N/A');
  const formatted = formatDate('2026-09-15T10:00:00Z');
  assert.ok(formatted.includes('2026'));
});
