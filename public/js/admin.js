// Admin dashboard: the admin's name, how many batches, students, lectures and assignments there are,
// the next upcoming lecture, and the logout button

setupLogout();

enterAnimation('.welcome, .bento > *');

const batchNumber = document.getElementById('stat-batches');
const studentNumber = document.getElementById('stat-students');
const lectureNumber = document.getElementById('stat-lectures');
const assignmentNumber = document.getElementById('stat-assignments');
const nextCard = document.getElementById('next-lecture');
const nextBody = document.getElementById('next-lecture-body');

const NEXT_REFRESH_MS = 60000; // the next lecture changes as time passes, so ask the server again every minute

function showNextLecture(lecture) {
  if (!lecture) {
    nextCard.href = '/admin/lectures';
    nextBody.innerHTML = '<p class="muted">Nothing scheduled yet. Release a lecture and it will show up here.</p>';
    return;
  }
  nextCard.href = `/admin/lectures#lecture-${lecture.id}`;
  nextBody.innerHTML = `
    <strong class="next-title">${escapeHtml(lecture.title)}</strong>
    <span class="next-when">${formatDateTime(lecture.starts_at)}</span>
    <span class="chip chip-batch" title="${escapeHtml(lecture.batch_name)}">${escapeHtml(lecture.batch_name)}</span>`;
}

loadPageData('/api/admin/dashboard')
  .then((data) => {
    showUserName(data.name);
    countUp(lectureNumber, data.lectureCount);
    countUp(assignmentNumber, data.assignmentCount);
    showNextLecture(data.nextLecture);

    setInterval(() => {
      if (document.hidden) return;
      loadPageData('/api/admin/dashboard')
        .then((latest) => showNextLecture(latest.nextLecture))
        .catch(() => {});
    }, NEXT_REFRESH_MS);
  })
  .catch(() => {
    lectureNumber.textContent = '–';
    assignmentNumber.textContent = '–';
    nextBody.innerHTML = '<p class="muted">Couldn\'t load the next lecture. Please refresh the page.</p>';
  });

Promise.all([loadPageData('/api/admin/batches'), loadPageData('/api/admin/students')])
  .then(([batchData, studentData]) => {
    countUp(batchNumber, batchData.batches.length);
    countUp(studentNumber, studentData.students.length);
  })
  .catch(() => {
    batchNumber.textContent = '–';
    studentNumber.textContent = '–';
  });
