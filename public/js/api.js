// Small helpers for talking to the server's API routes.

// Calls an API route and returns its JSON reply.
// If the server answers with an error, this throws an Error with the server's message.
async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = response.status;
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

// Fills every [data-user-name] and [data-user-initial] on the page
function showUserName(name) {
  document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = name));
  document.querySelectorAll('[data-user-initial]').forEach((el) => (el.textContent = name.charAt(0).toUpperCase()));
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
