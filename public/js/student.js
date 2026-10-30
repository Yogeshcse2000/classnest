// Student dashboard (placeholder for now: shows the student's name and the logout button)

setupLogout();

loadPageData('/api/student/dashboard').then((data) => showUserName(data.name));

enterAnimation('.welcome, .bento > *');
