// Turns an ID from a form or an address into a number. Number() is too forgiving here:
// it reads true as 1, [2] as 2 and "0x48" as 72, which would quietly point at the wrong row.

// A whole number above 0, sent as 7 or "7". Anything else gives null.
function toId(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

module.exports = { toId };
