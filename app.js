const STORAGE_KEY = 'todo-app-tasks';
const STORAGE_KEY_LANG = 'todo-app-lang';
const STORAGE_KEY_THEME = 'todo-app-theme';

const addForm = document.getElementById('addForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const countText = document.getElementById('countText');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const langBtns = document.querySelectorAll('.toolbar-btn[data-lang]');
const themeBtns = document.querySelectorAll('.toolbar-btn[data-theme]');

const i18n = {
  th: {
    title: 'สิ่งที่ต้องทำ',
    subtitle: 'จัดการงานของคุณให้เป็นระเบียบ',
    placeholder: 'เพิ่มงานใหม่...',
    add: 'เพิ่ม',
    filterAll: 'ทั้งหมด',
    filterActive: 'ยังไม่เสร็จ',
    filterCompleted: 'เสร็จแล้ว',
    itemsLeft: 'งานค้าง',
    itemsLeftNone: 'ไม่มีงานค้าง',
    clearCompleted: 'ล้างรายการที่เสร็จแล้ว',
    emptyAll: 'ยังไม่มีงาน — พิมพ์ด้านบนเพื่อเพิ่ม',
    emptyActive: 'ไม่มีงานค้าง',
    emptyCompleted: 'ยังไม่มีงานที่เสร็จแล้ว',
    ariaMarkComplete: 'ทำเครื่องหมายว่าเสร็จแล้ว',
    ariaDelete: 'ลบงาน',
  },
  en: {
    title: 'To-Do List',
    subtitle: 'Keep your tasks organized',
    placeholder: 'Add a new task...',
    add: 'Add',
    filterAll: 'All',
    filterActive: 'Active',
    filterCompleted: 'Completed',
    itemsLeft: 'items left',
    itemsLeftNone: 'No items left',
    clearCompleted: 'Clear completed',
    emptyAll: 'No tasks yet — type above to add',
    emptyActive: 'No active tasks',
    emptyCompleted: 'No completed tasks',
    ariaMarkComplete: 'Mark as complete',
    ariaDelete: 'Delete task',
  },
};

let tasks = loadTasks();
let currentFilter = 'all';
let currentLang = loadLang();
let currentTheme = loadTheme();

function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadLang() {
  const lang = localStorage.getItem(STORAGE_KEY_LANG);
  return lang === 'en' ? 'en' : 'th';
}

function saveLang(lang) {
  localStorage.setItem(STORAGE_KEY_LANG, lang);
  currentLang = lang;
}

function loadTheme() {
  const theme = localStorage.getItem(STORAGE_KEY_THEME);
  return theme === 'light' ? 'light' : 'dark';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  currentTheme = theme;
}

function applyLang(lang) {
  document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  document.title = i18n[lang]?.title || 'To-Do List';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
  langBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || key;
}

function renderTasks() {
  const filtered = tasks.filter((t) => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent =
      currentFilter === 'all'
        ? t('emptyAll')
        : currentFilter === 'active'
          ? t('emptyActive')
          : t('emptyCompleted');
    taskList.appendChild(empty);
    return;
  }

  filtered.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', t('ariaMarkComplete'));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', t('ariaDelete'));

    checkbox.addEventListener('change', () => toggleTask(task.id));
    deleteBtn.addEventListener('click', () => removeTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function updateFooter() {
  const activeCount = tasks.filter((t) => !t.completed).length;
  countText.textContent =
    activeCount === 0 ? t('itemsLeftNone') : `${activeCount} ${t('itemsLeft')}`;
  clearCompletedBtn.style.visibility = tasks.some((t) => t.completed)
    ? 'visible'
    : 'hidden';
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.push({
    id: Date.now().toString(),
    text: trimmed,
    completed: false,
  });
  saveTasks();
  renderTasks();
  updateFooter();
  taskInput.value = '';
  taskInput.focus();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateFooter();
  }
}

function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
  updateFooter();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
  updateFooter();
}

// Init theme & lang from storage
applyTheme(currentTheme);
applyLang(currentLang);

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks();
  });
});

langBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    saveLang(lang);
    applyLang(lang);
    renderTasks();
    updateFooter();
  });
});

themeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    saveTheme(theme);
    applyTheme(theme);
  });
});

renderTasks();
updateFooter();
