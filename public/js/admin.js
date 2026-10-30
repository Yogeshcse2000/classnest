// Admin dashboard (placeholder for now: shows the admin's name and the logout button)

setupLogout();

loadPageData('/api/admin/dashboard').then((data) => showUserName(data.name));

enterAnimation('.welcome, .bento > *');
