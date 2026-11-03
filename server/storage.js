// All file handling lives here: save, delete and send uploaded files. They are kept in a private Supabase Storage
// bucket called "submissions". Nothing else in the app knows where the files live.
// Files are only stored and sent back. Nothing here ever unzips or runs them.
// The secret key stays on the server. It is never logged, never sent to a browser and never part of an error message.

const crypto = require('crypto');

const BUCKET = 'submissions';
const TIMEOUT_MS = 30 * 1000;

function settings() {
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim();
  let url;
  try {
    url = new URL(process.env.SUPABASE_URL.trim()).origin; // only the address, so a pasted ".../rest/v1" still works
  } catch {
    url = '';
  }
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env to store uploaded files.');
  return { url, key };
}

// Talks to the Storage API. Newer secret keys are not JWTs, so they go in the "apikey" header only.
async function call(method, route, { body, headers } = {}) {
  const { url, key } = settings();
  const auth = key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {};
  return fetch(`${url}/storage/v1/${route}`, {
    method,
    body,
    headers: { apikey: key, ...auth, ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

// Short, safe message: the status only, never the request or the key
async function fail(action, response) {
  return new Error(`Storage could not ${action} (status ${response.status}).`);
}

// Makes sure the private bucket exists. It runs once, the first time a file is saved.
let bucketReady;
function ensureBucket() {
  bucketReady ||= (async () => {
    const response = await call('POST', 'bucket', {
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
      headers: { 'Content-Type': 'application/json' },
    });
    // 400/409 means the bucket is already there
    if (!response.ok && response.status !== 409 && response.status !== 400) throw await fail('create the bucket', response);
  })().catch((error) => {
    bucketReady = undefined; // try again next time
    throw error;
  });
  return bucketReady;
}

// Saves a file under a random name and gives that name back. The student's own file name never goes near the path.
async function saveFile(contents) {
  await ensureBucket();
  const name = `${crypto.randomUUID()}.zip`;
  const response = await call('POST', `object/${BUCKET}/${name}`, {
    body: contents,
    headers: { 'Content-Type': 'application/zip', 'x-upsert': 'false' },
  });
  if (!response.ok) throw await fail('save the file', response);
  return name;
}

// Deletes a file. If that fails, the student's work is already safe, so the problem is logged and the request carries on.
async function deleteFile(name) {
  try {
    const response = await call('DELETE', `object/${BUCKET}/${name}`);
    if (!response.ok && response.status !== 404) throw await fail('delete the file', response);
  } catch (error) {
    console.error(error.stack);
  }
}

// Fetches a saved file from Storage and sends it as a download called downloadName. The browser never gets a Storage
// address, only the bytes, and only after the route's admin check. done(error) runs when it has finished.
async function sendFile(res, name, downloadName, done) {
  try {
    const response = await call('GET', `object/authenticated/${BUCKET}/${name}`);
    if (!response.ok) throw Object.assign(await fail('fetch the file', response), { status: response.status === 404 || response.status === 400 ? 404 : 500 });
    const contents = Buffer.from(await response.arrayBuffer());
    res.set({
      'Content-Type': 'application/zip',
      'Content-Length': contents.length,
      'Content-Disposition': `attachment; filename="${downloadName.replace(/[^\x20-\x7e]|["\\]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    });
    res.end(contents);
    done();
  } catch (error) {
    done(error);
  }
}

module.exports = { saveFile, deleteFile, sendFile };
