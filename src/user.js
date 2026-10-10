// A stable, anonymous id per browser, so bug reports can say which user saw what.
// `?user=u-1234` in the URL overrides it (handy for reproducing a report).

const KEY = 'tp.userId';

export function getUserId() {
  const fromUrl = new URLSearchParams(globalThis.location?.search || '').get('user');
  if (fromUrl) return fromUrl;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'u-' + String(Math.floor(1000 + Math.random() * 9000));
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'u-0000';
  }
}

/** Small, stable string hash (djb2). Same input, same number, on every device. */
export function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}
