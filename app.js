// Pocket Classroom App (single shared JS for pages)
// Keys
const LS_LESSONS = 'pc_lessons_v2';
const LS_CHAT = 'pc_chat_v2';

// Utilities
function uid() { return Date.now() + Math.floor(Math.random() * 999); }
function saveLessons(lessons) { localStorage.setItem(LS_LESSONS, JSON.stringify(lessons)); }
function loadLessons() { const raw = localStorage.getItem(LS_LESSONS); return raw ? JSON.parse(raw) : null; }
function saveChat(chat) { localStorage.setItem(LS_CHAT, JSON.stringify(chat)); }
function loadChat() { const raw = localStorage.getItem(LS_CHAT); return raw ? JSON.parse(raw) : []; }

// Default sample lessons (only created if none exist)
function ensureSampleData() {
  if (!loadLessons()) {
    const sample = [
      {
        id: uid(),
        title: 'Project Introduction',
        desc: 'Overview of Pocket Classroom demo and features.',
        video: 'https://www.youtube.com/embed/2oIejLyD_Ro',
        assignments: ['Read project brief', 'Watch demo video'],
        quiz: [
          { q: 'What is Pocket Classroom?', choices: ['A library', 'A local-first classroom web app', 'A game', 'An API'], answer: 1 },
          { q: 'Where data is stored in this demo?', choices: ['Server', 'LocalStorage', 'Cloud only', 'None'], answer: 1 }
        ]
      },
      {
        id: uid() + 1,
        title: 'HTML Basics',
        desc: 'Intro to HTML elements and structure.',
        video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        assignments: ['Create a small HTML page'],
        quiz: [
          { q: 'HTML stands for?', choices: ['HyperText Markup Language', 'HighText Machine Language', 'Hyperlinking Text', 'None'], answer: 0 }
        ]
      }
    ];
    saveLessons(sample);
  }
}

// Page-specific initialization
document.addEventListener('DOMContentLoaded', () => {
  ensureSampleData();
  const isClassroom = !!document.getElementById('lessonsList');
  const isQuizzes = !!document.getElementById('quizzesList');
  if (isClassroom) initClassroomPage();
  if (isQuizzes) initQuizzesPage();
  // shared: import button maybe
  const importBtn = document.getElementById('importBtn');
  if (importBtn) importBtn.addEventListener('click', () => document.getElementById('importFile').click());
  const importFile = document.getElementById('importFile');
  if (importFile) importFile.addEventListener('change', handleImportFile);
});

// ---------- Classroom page ----------
function initClassroomPage() {
  let lessons = loadLessons() || [];
  let chat = loadChat();
  let currentId = null;
  const lessonsList = document.getElementById('lessonsList');
  const lessonTitle = document.getElementById('lessonTitle');
  const lessonDesc = document.getElementById('lessonDesc');
  const lessonVideo = document.getElementById('lessonVideo');
  const assignmentsEl = document.getElementById('assignments');
  const newAssignInput = document.getElementById('newAssignInput');
  const addAssignBtn = document.getElementById('addAssignBtn');
  const exportBtn = document.getElementById('exportBtn');
  const downloadLink = document.getElementById('downloadLink');
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const addLessonBtn = document.getElementById('addLessonBtn');
  const lessonForm = document.getElementById('lessonForm');
  const modalTitle = document.getElementById('modalTitle');
  const lessonTitleInput = document.getElementById('lessonTitleInput');
  const lessonDescInput = document.getElementById('lessonDescInput');
  const lessonVideoInput = document.getElementById('lessonVideoInput');
  const quizEditor = document.getElementById('quizEditor');
  const addQBtn = document.getElementById('addQBtn');
  const editLessonBtn = document.getElementById('editLessonBtn');
  const deleteLessonBtn = document.getElementById('deleteLessonBtn');

  // render lessons
  function renderList() {
    lessonsList.innerHTML = '';
    lessons.forEach(l => {
      const a = document.createElement('a');
      a.className = 'list-group-item list-group-item-action';
      a.textContent = l.title;
      a.onclick = () => openLesson(l.id);
      lessonsList.appendChild(a);
    });
  }

  function openLesson(id) {
    const l = lessons.find(x => x.id === id);
    if (!l) return;
    currentId = id;
    lessonTitle.textContent = l.title;
    lessonDesc.textContent = l.desc || '';
    lessonVideo.src = l.video || 'about:blank';
    renderAssignments();
    Array.from(lessonsList.children).forEach(ch => ch.classList.toggle('active', ch.textContent === l.title));
  }

  function renderAssignments() {
    assignmentsEl.innerHTML = '';
    if (!currentId) return;
    const l = lessons.find(x => x.id === currentId);
    (l.assignments || []).forEach((a, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item bg-transparent text-light d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${escapeHtml(a)}</span><button class="btn btn-sm btn-outline-light">Done</button>`;
      assignmentsEl.appendChild(li);
    });
  }

  // add assignment
  addAssignBtn.addEventListener('click', () => {
    const text = newAssignInput.value.trim();
    if (!text) return alert('Please enter assignment title.');
    if (!currentId) return alert('Choose a lesson first.');
    const l = lessons.find(x => x.id === currentId);
    l.assignments = l.assignments || [];
    l.assignments.push(text);
    saveLessons(lessons);
    newAssignInput.value = '';
    renderAssignments();
  });

  // export JSON
  exportBtn.addEventListener('click', () => {
    const data = { lessons, chat };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = downloadLink;
    a.href = url; a.download = 'pocket-classroom-export.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  });

  // chat
  function renderChat() {
    chatBox.innerHTML = '';
    (chat || []).forEach(m => {
      const d = document.createElement('div');
      d.className = 'chat-msg';
      d.innerHTML = `<strong>${escapeHtml(m.from)}:</strong> <div>${escapeHtml(m.text)}</div><small class="text-muted">${new Date(m.time).toLocaleString()}</small>`;
      chatBox.appendChild(d);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  chatSend.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    const msg = { from: 'You', text, time: Date.now() };
    chat.push(msg);
    saveChat(chat);
    chatInput.value = '';
    renderChat();
  });
  chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') chatSend.click(); });

  // lesson modal (add/edit)
  let editingId = null;
  addLessonBtn && addLessonBtn.addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add Lesson';
    lessonForm.reset();
    quizEditor.innerHTML = '';
    addQuestionEditor();
  });

  function addQuestionEditor(q = { q: '', choices: ['', '', '', ''], answer: 0 }) {
    const idx = quizEditor.children.length;
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-2 question-card';
    wrapper.dataset.idx = idx;
    wrapper.innerHTML = `
      <label class="form-label">Question</label>
      <input class="form-control q-text mb-1" value="${escapeHtml(q.q)}"/>
      <div class="mb-1">
        <label class="form-label small">Choices</label>
        ${[0, 1, 2, 3].map(i => `<input class="form-control choice choice-${i} mb-1" placeholder="Choice ${i + 1}" value="${escapeHtml(q.choices[i] || '')}">`).join('')}
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="small-muted">Correct:</label>
        <select class="form-select form-select-sm answer-select" style="width:120px">
          <option value="0"${q.answer === 0 ? ' selected' : ''}>Choice 1</option>
          <option value="1"${q.answer === 1 ? ' selected' : ''}>Choice 2</option>
          <option value="2"${q.answer === 2 ? ' selected' : ''}>Choice 3</option>
          <option value="3"${q.answer === 3 ? ' selected' : ''}>Choice 4</option>
        </select>
        <button class="btn btn-sm btn-outline-light ms-auto remove-q" type="button">Remove</button>
      </div>
    `;
    quizEditor.appendChild(wrapper);
    wrapper.querySelector('.remove-q').addEventListener('click', () => wrapper.remove());
  }
  addQBtn && addQBtn.addEventListener('click', () => addQuestionEditor());

  // save lesson
  lessonForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = lessonTitleInput.value.trim();
    if (!title) return alert('Title required.');
    const desc = lessonDescInput.value.trim();
    const video = lessonVideoInput.value.trim();
    const quiz = Array.from(quizEditor.children).map(node => {
      const qtext = node.querySelector('.q-text').value.trim();
      const choices = [0, 1, 2, 3].map(i => node.querySelector(`.choice-${i}`).value.trim());
      const answer = parseInt(node.querySelector('.answer-select').value, 10);
      return { q: qtext, choices, answer };
    }).filter(q => q.q.length > 0 && q.choices.some(c => c.length > 0));
    if (editingId) {
      const target = lessons.find(x => x.id === editingId);
      target.title = title; target.desc = desc; target.video = video; target.quiz = quiz;
    } else {
      const newL = { id: uid(), title, desc, video, assignments: [], quiz };
      lessons.unshift(newL);
    }
    saveLessons(lessons);
    const modal = bootstrap.Modal.getInstance(document.getElementById('lessonModal'));
    modal && modal.hide();
    renderList();
    if (!editingId) openLesson(lessons[0].id);
  });

  // edit / delete
  editLessonBtn.addEventListener('click', () => {
    if (!currentId) return alert('Select a lesson first.');
    const l = lessons.find(x => x.id === currentId);
    editingId = l.id;
    modalTitle.textContent = 'Edit Lesson';
    lessonTitleInput.value = l.title;
    lessonDescInput.value = l.desc || '';
    lessonVideoInput.value = l.video || '';
    quizEditor.innerHTML = '';
    (l.quiz || []).forEach(q => addQuestionEditor(q));
    const modal = new bootstrap.Modal(document.getElementById('lessonModal'));
    modal.show();
  });

  deleteLessonBtn.addEventListener('click', () => {
    if (!currentId) return alert('Select a lesson first.');
    if (!confirm('Delete this lesson?')) return;
    lessons = lessons.filter(x => x.id !== currentId);
    saveLessons(lessons);
    renderList();
    currentId = null;
    lessonTitle.textContent = 'No lesson selected';
    lessonDesc.textContent = 'Select a lesson to view content.';
    lessonVideo.src = 'about:blank';
    renderAssignments();
  });

  // import handler
  window.handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (obj.lessons) lessons = obj.lessons;
        if (obj.chat) chat = obj.chat;
        saveLessons(lessons);
        saveChat(chat);
        renderList(); renderChat();
        alert('Import successful.');
      } catch (err) { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  // initial render
  renderList();
  renderChat();
  if (lessons.length) openLesson(lessons[0].id);
}

// ---------- Quizzes page ----------
function initQuizzesPage() {
  let lessons = loadLessons() || [];
  const quizzesList = document.getElementById('quizzesList');
  const quizArea = document.getElementById('quizArea');
  const quizTitle = document.getElementById('quizTitle');
  const questionsWrap = document.getElementById('questionsWrap');
  const submitQuizBtn = document.getElementById('submitQuizBtn');
  const quizResult = document.getElementById('quizResult');

  function renderQuizzesList() {
    quizzesList.innerHTML = '';
    lessons.forEach(l => {
      const a = document.createElement('a');
      a.className = 'list-group-item list-group-item-action';
      a.textContent = `${l.title} — ${l.quiz && l.quiz.length ? l.quiz.length + ' question(s)' : 'no quiz'}`;
      a.onclick = () => openQuizForLesson(l.id);
      quizzesList.appendChild(a);
    });
  }

  function openQuizForLesson(id) {
    const l = lessons.find(x => x.id === id);
    if (!l || !l.quiz || l.quiz.length === 0) {
      alert('No quiz for this lesson.');
      return;
    }
    quizArea.classList.remove('d-none');
    quizTitle.textContent = `Quiz: ${l.title}`;
    questionsWrap.innerHTML = '';
    l.quiz.forEach((q, qi) => {
      const div = document.createElement('div');
      div.className = 'question-card';
      div.innerHTML = `<p><strong>Q${qi + 1}:</strong> ${escapeHtml(q.q)}</p>`;
      q.choices.forEach((c,ci) => {
        const id = `q${qi}c${ci}`;
        div.innerHTML += `<div class="form-check mb-1">
          <input class="form-check-input" type="radio" name="q${qi}" id="${id}" value="${ci}">
          <label class="form-check-label" for="${id}">${escapeHtml(c)}</label>
        </div>`;
      });
      questionsWrap.appendChild(div);
    });

    submitQuizBtn.onclick = () => {
      const answers = [];
      let score = 0;
      l.quiz.forEach((q, qi) => {
        const selected = document.querySelector(`input[name="q${qi}"]:checked`);
        const val = selected ? parseInt(selected.value, 10) : null;
        answers.push(val);
        if (val === q.answer) score++;
      });
      const percent = Math.round((score / l.quiz.length) * 100);
      quizResult.className = 'alert alert-success mt-3';
      quizResult.innerHTML = `<strong>Score:</strong> ${score}/${l.quiz.length} (${percent}%)`;
      quizResult.classList.remove('d-none');
      window.scrollTo(0, document.body.scrollHeight);
    };
  }

  renderQuizzesList();
}

// ---------- Helpers ----------
function escapeHtml(str) {
  if (!str) return '';
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}