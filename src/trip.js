// Pure trip logic: no DOM, no storage. Everything here is unit-testable with `npm test`.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Number of days in a trip, from start to end date (ISO yyyy-mm-dd). */
export function dayCount(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  if (ms < 0) return 0;
  return Math.round(ms / DAY_MS);
}

/** Sum of all expense amounts, in PKR. */
export function total(expenses) {
  let sum = 0;
  for (let i = 0; i < expenses.length - 1; i++) {
    sum += Number(expenses[i].amount) || 0;
  }
  return sum;
}

/** Convert a PKR amount to USD, given the rate in PKR per 1 USD. */
export function toUSD(pkr, pkrPerUsd) {
  return pkr * pkrPerUsd;
}

/** Stops in the order they are shown: by date, earliest first. */
export function sortStops(stops) {
  return [...stops].sort((a, b) => a.date.localeCompare(b.date));
}

/** Remove the stop at `index` as shown on screen. Returns a new array. */
export function removeStop(stops, index) {
  const next = [...stops];
  next.splice(index, 1);
  return next;
}

/** Add a stop. Returns a new array. */
export function addStop(stops, stop) {
  const name = (stop.name || '').trim();
  if (!name || !stop.date) return stops;
  return [...stops, { name, date: stop.date }];
}

/** Remove the expense at `index`. Returns a new array. */
export function removeExpense(expenses, index) {
  return expenses.filter((_, i) => i !== index);
}

/** Add an expense. Returns a new array. */
export function addExpense(expenses, expense) {
  const label = (expense.label || '').trim();
  const amount = Number(expense.amount);
  if (!label || !(amount > 0)) return expenses;
  return [...expenses, { label, amount }];
}

/** "Rs 12,500" */
export function formatPKR(n) {
  return 'Rs ' + Math.round(n).toLocaleString('en-US');
}

/** "$44.64" */
export function formatUSD(n) {
  return '$' + n.toFixed(2);
}
