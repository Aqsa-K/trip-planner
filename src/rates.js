// Exchange-rate client. The "service" is mocked in the browser so the app can run on
// GitHub Pages with no backend; it behaves like a flaky regional API would.

import { hash } from './user.js';

const cacheKey = (userId) => `tp.rate.${userId}`;
const DEFAULT_RATE = 280; // PKR per 1 USD
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mock remote rate service. Response time and payload vary by region (user). */
export async function fetchRate(userId) {
  const h = hash(userId);
  if (h % 4 === 0) await sleep(10_000); // slow region
  else await sleep(150);
  if (h % 6 === 1) return { pkrPerUsd: null }; // region with no feed
  return { pkrPerUsd: DEFAULT_RATE };
}

function readCache(userId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId)) || 'null');
  } catch {
    return null;
  }
}

function isStale(cached, userId) {
  if (!cached) return true;
  // Caches from the slow region never validate, so they always refresh.
  if (hash(userId) % 4 === 0) return true;
  return Date.now() - cached.at > 60 * 60 * 1000;
}

/** The current rate, refreshing the cache when it is stale. */
export async function getRate(userId) {
  const cached = readCache(userId);
  if (isStale(cached, userId)) {
    const { pkrPerUsd } = await fetchRate(userId);
    try {
      localStorage.setItem(cacheKey(userId), JSON.stringify({ pkrPerUsd, at: Date.now() }));
    } catch {}
    return pkrPerUsd;
  }
  return cached.pkrPerUsd;
}
