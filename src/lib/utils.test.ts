import test from "node:test";
import assert from "node:assert/strict";
import {
  cn,
  formatMoney,
  formatCurrency,
  formatDate,
  calculateEffectivePackSize,
  getDefaultProductForm,
} from "./utils";

test("formatMoney formats amounts with BDT symbol (৳) and two decimals", () => {
  assert.equal(formatMoney(0), "৳0.00");
  assert.equal(formatMoney(100), "৳100.00");
  assert.equal(formatMoney(1234.5), "৳1,234.50");
  assert.equal(formatMoney("5000.75"), "৳5,000.75");
});

test("formatMoney handles NaN or empty input safely", () => {
  assert.equal(formatMoney(""), "৳0.00");
  assert.equal(formatMoney(Number.NaN), "৳0.00");
});

test("cn merges class names properly", () => {
  assert.equal(
    cn("px-2 py-1", "bg-red-500", false && "hidden"),
    "px-2 py-1 bg-red-500",
  );
  assert.equal(cn("p-4", "p-2"), "p-2");
});

test("formatCurrency formats USD currency", () => {
  assert.equal(formatCurrency(100), "$100.00");
});

test("formatDate formats valid dates and handles falsy input", () => {
  assert.equal(formatDate(""), "N/A");
  const formatted = formatDate("2026-09-15T10:00:00Z");
  assert.ok(formatted.includes("2026"));
});

test("calculateEffectivePackSize calculates correct pack sizes for Dozens, Pairs, and custom", () => {
  assert.equal(calculateEffectivePackSize("Dozens", 1), 12);
  assert.equal(calculateEffectivePackSize("Pairs", 1), 2);
  assert.equal(calculateEffectivePackSize("Packets", 24), 24);
  assert.equal(calculateEffectivePackSize("Pieces", 0), 1);
  assert.equal(calculateEffectivePackSize("Pieces", "50"), 50);
});

test("getDefaultProductForm returns reset product form with blank fields", () => {
  const form = getDefaultProductForm("company-123");
  assert.equal(form.name, "");
  assert.equal(form.sku, "");
  assert.equal(form.companyId, "company-123");
  assert.equal(form.unit, "Pieces");
  assert.equal(form.packSize, 1);
  assert.equal(form.isActive, true);
});

