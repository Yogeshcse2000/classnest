// Admin dashboard: the admin's name, how many batches, students, lectures and assignments there are,
// the next upcoming lecture, the latest submissions, and the logout button

setupLogout();

enterAnimation('.welcome, .bento > *');

const batchNumber = document.getElementById('stat-batches');
const studentNumber = document.getElementById('stat-students');
const lectureNumber = document.getElementById('stat-lectures');
const assignmentNumber = document.getElementById('stat-assignments');
const nextCard = document.getElementById('next-lecture');
const nextBody = document.getElementById('next-lecture-body');
const latestList = document.getElementById('latest-submissions');

const NEXT_REFRESH_MS = 60000; // the next lecture changes as time passes, so ask the server again every minute

let shownLatest = null;

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

function latestRowHtml(submission) {
  const name = escapeHtml(submission.student_name);
  const title = escapeHtml(submission.assignment_title);
  return `
    <li class="list-row schedule-row">
      <div class="list-main">
        <strong title="${name}">${name}</strong>
        <span>${title}</span>
        <span>Submitted on ${formatDateTime(submission.submitted_at)}</span>
      </div>
      <div class="list-meta">
        ${submissionChipHtml(submission.status)}
        <a class="btn btn-ghost btn-small" href="/admin/submissions?assignment=${submission.assignment_id}" aria-label="View submissions for ${title}">View</a>
      </div>
    </li>`;
}

// Only touches the list when something changed, so a button under the mouse doesn't disappear
function showLatestSubmissions(submissions) {
  const html = submissions.length
    ? submissions.map(latestRowHtml).join('')
    : `<li class="list-row list-note"><p class="muted">No submissions yet. They'll show up here as students hand in their work.</p></li>`;
  if (html === shownLatest) return;
  shownLatest = html;
  latestList.innerHTML = html;
  latestList.removeAttribute('aria-busy');
  addHoverLift(latestList);
}

loadPageData('/api/admin/dashboard')
  .then((data) => {
    showUserName(data.name);
    countUp(lectureNumber, data.lectureCount);
    countUp(assignmentNumber, data.assignmentCount);
    showNextLecture(data.nextLecture);
    showLatestSubmissions(data.latestSubmissions);

    setInterval(() => {
      if (document.hidden) return;
      loadPageData('/api/admin/dashboard')
        .then((latest) => {
          showNextLecture(latest.nextLecture);
          showLatestSubmissions(latest.latestSubmissions);
        })
        .catch(() => {});
    }, NEXT_REFRESH_MS);
  })
  .catch(() => {
    lectureNumber.textContent = '–';
    assignmentNumber.textContent = '–';
    nextBody.innerHTML = '<p class="muted">Couldn\'t load the next lecture. Please refresh the page.</p>';
    latestList.removeAttribute('aria-busy');
    latestList.innerHTML = '<li class="list-row list-note"><p class="muted">Couldn\'t load the latest submissions. Please refresh the page.</p></li>';
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
