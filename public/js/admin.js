// Admin dashboard: the admin's name, how many batches and students there are, and the logout button

setupLogout();

loadPageData('/api/admin/dashboard').then((data) => showUserName(data.name));

enterAnimation('.welcome, .bento > *');

const batchNumber = document.getElementById('stat-batches');
const studentNumber = document.getElementById('stat-students');

Promise.all([loadPageData('/api/admin/batches'), loadPageData('/api/admin/students')])
  .then(([batchData, studentData]) => {
    countUp(batchNumber, batchData.batches.length);
    countUp(studentNumber, studentData.students.length);
  })
  .catch(() => {
    batchNumber.textContent = '–';
    studentNumber.textContent = '–';
  });
