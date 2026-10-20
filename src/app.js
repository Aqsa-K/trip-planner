import {
  dayCount, total, toUSD, sortStops, removeStop, addStop, addExpense, removeExpense, formatPKR, formatUSD,
} from './trip.js';
import { getRate } from './rates.js';
import { getUserId } from './user.js';

const STORE = 'tp.trip.v3';
const SAMPLE = {
  name: 'Lahore → Hunza',
  start: '2026-12-26',
  end: '2027-01-02',
  stops: [
    { name: 'Karimabad, Hunza', date: '2026-12-28' },
    { name: 'Lahore', date: '2026-12-26' },
    { name: 'Attabad Lake', date: '2026-12-30' },
    { name: 'Naran', date: '2026-12-26' },
  ],
  expenses: [
    { label: 'Bus tickets', amount: 12000 },
    { label: 'Hotel, 2 nights', amount: 18000 },
    { label: 'Food', amount: 7500 },
    { label: 'Jeep to Attabad', amount: 6000 },
  ],
};

const STOP_IDEAS = ['Murree', 'Nathia Gali', 'Malam Jabba', 'Skardu', 'Naran'];
const EXPENSE_IDEAS = ['Fuel', 'Hotel', 'Food', 'Bus tickets', 'Jackets'];

const userId = getUserId();
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || structuredClone(SAMPLE);
  } catch {
    return structuredClone(SAMPLE);
  }
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(trip)); } catch {}
}

let trip = load();
let rate = null;

function render() {
  const sum = total(trip.expenses);
  const shown = sortStops(trip.stops);
  $('#app').innerHTML = `
    <section class="card">
      <label class="name-label" for="trip-name">Trip name</label>
      <div class="name-field">
        <input class="title" id="trip-name" value="${esc(trip.name)}" placeholder="Name your trip">
        <span class="pencil" aria-hidden="true">✎</span>
      </div>
      <div class="dates">
        <label>From <input type="date" id="start" value="${trip.start}"></label>
        <label>To <input type="date" id="end" value="${trip.end}"></label>
      </div>
      <p class="days"><strong>${dayCount(trip.start, trip.end)}</strong> days</p>
    </section>

    <section class="card">
      <h2>Stops</h2>
      <ul class="list">
        ${shown.map((s, i) => `
          <li><span>${esc(s.name)}</span><span class="muted">${s.date}</span>
          <button class="del" data-stop="${i}" aria-label="Delete ${esc(s.name)}">✕</button></li>`).join('')}
      </ul>
      <div class="chips" aria-label="Quick add">
        ${STOP_IDEAS.map((x) => `<button type="button" class="chip" data-fill-stop="${esc(x)}">+ ${esc(x)}</button>`).join('')}
      </div>
      <form id="add-stop" class="row">
        <input name="name" placeholder="Add a stop" required>
        <input name="date" type="date" required>
        <button>Add</button>
      </form>
    </section>

    <section class="card">
      <h2>Budget</h2>
      <ul class="list">
        ${trip.expenses.map((e, i) => `
          <li><span>${esc(e.label)}</span><span>${formatPKR(e.amount)}</span>
          <button class="del" data-expense="${i}" aria-label="Remove ${esc(e.label)}">✕</button></li>`).join('')}
      </ul>
      <div class="chips" aria-label="Quick add">
        ${EXPENSE_IDEAS.map((x) => `<button type="button" class="chip" data-fill-expense="${esc(x)}">+ ${esc(x)}</button>`).join('')}
      </div>
      <form id="add-expense" class="row">
        <input name="label" placeholder="Expense" required>
        <input name="amount" type="number" inputmode="numeric" min="1" placeholder="PKR" required>
        <button>Add</button>
      </form>
      <div class="totals">
        <p>Total <strong>${formatPKR(sum)}</strong></p>
        <p>About <strong>${formatUSD(toUSD(sum, rate))}</strong></p>
        <p class="muted">1 USD = Rs ${rate.toFixed(0)}</p>
      </div>
    </section>`;
  bind();
}

function bind() {
  $('#trip-name').onchange = (e) => { trip.name = e.target.value; save(); };
  $('#start').onchange = (e) => { trip.start = e.target.value; save(); render(); };
  $('#end').onchange = (e) => { trip.end = e.target.value; save(); render(); };
  document.querySelectorAll('[data-stop]').forEach((b) => {
    b.onclick = () => { trip.stops = removeStop(trip.stops, Number(b.dataset.stop)); save(); render(); };
  });
  document.querySelectorAll('[data-expense]').forEach((b) => {
    b.onclick = () => { trip.expenses = removeExpense(trip.expenses, Number(b.dataset.expense)); save(); render(); };
  });
  document.querySelectorAll('[data-fill-stop]').forEach((b) => {
    b.onclick = () => { const f = $('#add-stop'); f.elements.name.value = b.dataset.fillStop; f.elements.date.focus(); };
  });
  document.querySelectorAll('[data-fill-expense]').forEach((b) => {
    b.onclick = () => { const f = $('#add-expense'); f.elements.label.value = b.dataset.fillExpense; f.elements.amount.focus(); };
  });
  $('#add-stop').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    trip.stops = addStop(trip.stops, { name: f.get('name'), date: f.get('date') });
    save(); render();
  };
  $('#add-expense').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    trip.expenses = addExpense(trip.expenses, { label: f.get('label'), amount: f.get('amount') });
    save(); render();
  };
}

function showError() {
  $('#app').innerHTML = `
    <section class="card error">
      <h2>Something went wrong</h2>
      <p>Please try again later.</p>
      <p class="muted">Error ref: <code>${esc(userId)}</code></p>
    </section>`;
}
window.addEventListener('error', showError);
window.addEventListener('unhandledrejection', showError);

$('#user').textContent = userId;
$('#reset').onclick = (e) => {
  e.preventDefault();
  trip = structuredClone(SAMPLE); save(); render();
};

rate = await getRate(userId);
render();
