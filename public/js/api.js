// Small helpers for talking to the server's API routes.

// Calls an API route and returns its JSON reply.
// If the server answers with an error, this throws an Error with the server's message.
async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // fetch only fails like this when the server can't be reached at all
    throw new Error("Can't reach ClassNest right now. Please check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.fields = data.fields; // one message per wrong form field, when the server sends them
    throw error;
  }
  return data;
}

// Loads data for a protected page. If the session has ended, go back to the login page.
async function loadPageData(path) {
  try {
    return await api(path);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      window.location.href = '/';
    }
    throw error;
  }
}

// Uploads one file as the "file" field. onProgress receives how much has been sent, from 0 to 1.
// This uses XMLHttpRequest because fetch can't report upload progress. Errors work the same way as in api().
function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const request = new XMLHttpRequest();
    request.open('POST', path);
    request.responseType = 'json';
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });
    request.addEventListener('load', () => {
      const data = request.response || {};
      if (request.status >= 200 && request.status < 300) return resolve(data);
      const error = new Error(data.error || 'Something went wrong. Please try again.');
      error.status = request.status;
      reject(error);
    });
    request.addEventListener('error', () => {
      reject(new Error('The upload stopped before it finished, so nothing was changed. Please check your connection and try again.'));
    });
    request.send(form);
  });
}

// Fills every [data-user-name] and [data-user-initial] on the page
function showUserName(name) {
  document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = name));
  document.querySelectorAll('[data-user-initial]').forEach((el) => (el.textContent = name.charAt(0).toUpperCase()));
}

// Shows the logged-in person's name in the top bar
function showCurrentUser() {
  loadPageData('/api/auth/me')
    .then((data) => showUserName(data.user.name))
    .catch(() => {});
}

// Makes every [data-logout] button end the session and return to the login page
function setupLogout() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Logging out…';
      try {
        await api('/api/auth/logout', { method: 'POST' });
      } finally {
        window.location.href = '/';
      }
    });
  });
}
