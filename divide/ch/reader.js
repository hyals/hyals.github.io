/* ---------------- Config ---------------- */
const CONFIG = {
  chapters: [
    { num: 1, name: "Prologue of Death and Sorrow" },
    { num: 2, name: "I carry you with me, always" },
    { num: 3, name: "Red Hues" }
  ],
  characterNames: {
    Hya:    { label: "Hya",    color: "red"  },
    Lina:   { label: "Lina",   color: "blue" },
    Vita:   { label: "Vita",   color: "blue" },
    Gaukel: { label: "Gaukel", color: "blue" }
  },
  minFontSize: 12,
  maxFontSize: 32,
  fontSizeStep: 2,
};

const CACHE_VERSION = "v1"; // bump when chapters update
const cacheKey = num => `chapter-${CACHE_VERSION}-${num}`;

/* ---------------- Storage + DOM helpers ---------------- */
const store = {
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  get: k => {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch { return null; }
  },
  remove: k => localStorage.removeItem(k)
};
const $ = id => document.getElementById(id);
const DOM = {};

/* ---------------- Character replacements ---------------- */
function applyCharacterReplacements(text) {
  return text.replace(/\[(\w+)\]\s*(.*)/g, (m, key, dialogue) => {
    const char = CONFIG.characterNames[key];
    return char
      ? `<fieldset class="character-box ${char.color}"><legend><mdui-icon name="person" style="vertical-align:middle"></mdui-icon>${char.label}</legend><p>${dialogue}</p></fieldset>`
      : m;
  });
}

/* ---------------- Chapter loading ---------------- */
async function loadChapter(num) {
  const chapter = CONFIG.chapters.find(c => c.num === num);
  if (!chapter) {
    DOM.container.innerHTML = "<em>Chapter not found.</em>";
    DOM.titleDiv.textContent = "";
    return;
  }

  // Check cache first
  const cached = store.get(cacheKey(num));
  if (cached) {
    renderChapter(cached, chapter);
    return;
  }

  // Otherwise fetch from server
  DOM.container.innerHTML = `<mdui-linear-progress></mdui-linear-progress>`;
  DOM.titleDiv.textContent = "";

  try {
    const res = await fetch(`https://hyals.ink/divide/ch/chapter${num}.txt`);
    if (!res.ok) throw new Error(res.status);
    const text = (await res.text()).trim();

    store.set(cacheKey(num), text); // save in cache
    renderChapter(text, chapter);
  } catch {
    DOM.container.innerHTML = "<em>Could not load chapter.</em>";
  }

  requestAnimationFrame(updateScrollProgress);
}

function renderChapter(text, chapter) {
  requestAnimationFrame(() => {
    const html = marked.parse(text);
    DOM.container.innerHTML = applyCharacterReplacements(html);
    DOM.container.scrollTop = 0;
    DOM.bar.style.width = '0%';
    DOM.titleDiv.textContent = chapter.name;
  });
  store.set("lastChapter", chapter.num);
}

/* ---------------- Navigation ---------------- */
const currentChapterNum = () => +location.hash.slice(1) || null;
const goToChapter = n => !isNaN(n = +n) && (location.hash = n);
const nextChapter = () => goToChapter(currentChapterNum() + 1);
const prevChapter = () => goToChapter(currentChapterNum() - 1);

function handleHashChange() {
  const n = currentChapterNum();
  if (!n) return;

  loadChapter(n);
  requestAnimationFrame(() => {
    DOM.slider.value = n;
    DOM.nextBtn.disabled = n >= CONFIG.chapters.length;
    DOM.prevBtn.disabled = n <= 1;
  });
}

/* ---------------- Chapter list ---------------- */
function generateChapterOptions() {
  DOM.list.replaceChildren();
  for (const ch of CONFIG.chapters) {
    const item = document.createElement('mdui-list-item');
    item.setAttribute('headline', `${ch.num}. ${ch.name}`);
    item.setAttribute('aria-label', `Go to chapter ${ch.num}: ${ch.name}`);
    item.addEventListener('click', () => {
      goToChapter(ch.num);
      DOM.chapterListModal.open = false;
    });
    DOM.list.appendChild(item);
  }
  DOM.slider.max = CONFIG.chapters.length;
}

/* ---------------- Font size ---------------- */
function changeFontSize(delta) {
  const cur = parseInt(getComputedStyle(DOM.container).fontSize, 10) || 18;
  const size = Math.min(CONFIG.maxFontSize, Math.max(CONFIG.minFontSize, cur + delta));
  DOM.container.style.fontSize = size + 'px';
  store.set('fontSize', size);
  requestAnimationFrame(updateScrollProgress);
}

/* ---------------- Theme toggle ---------------- */
function toggleTheme(isDark) {
  document.documentElement.classList.toggle('mdui-theme-dark', isDark);
  document.documentElement.classList.toggle('mdui-theme-light', !isDark);
  store.set('themeDark', isDark);
  requestAnimationFrame(updateScrollProgress);
}

/* ---------------- Progress bar ---------------- */
function updateScrollProgress() {
  const st = window.scrollY || document.documentElement.scrollTop;
  const sh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const p = sh > 0 ? st / sh : 1;
  DOM.bar.style.width = (Math.min(1, Math.max(0, p)) * 100) + '%';
}

/* ---------------- Init ---------------- */
window.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  DOM.container = $('chapter-container');
  DOM.titleDiv = $('chapter-title');
  DOM.bar = $('scroll-progress');
  DOM.slider = $('currentChapterValue');
  DOM.nextBtn = $('nextChapter');
  DOM.prevBtn = $('prevChapter');
  DOM.list = $('chapterList');
  DOM.chapterListModal = document.querySelector(".example-header");

  // Event listeners
  $('chapter_list_icon').addEventListener('click', () => DOM.chapterListModal.open = true);
  $('close_chapter_list').addEventListener('click', () => DOM.chapterListModal.open = false);
  DOM.slider.addEventListener('input', e => goToChapter(e.target.value));
  DOM.prevBtn.addEventListener('click', prevChapter);
  DOM.nextBtn.addEventListener('click', nextChapter);
  $('fontInc').addEventListener('click', () => changeFontSize(CONFIG.fontSizeStep));
  $('fontDec').addEventListener('click', () => changeFontSize(-CONFIG.fontSizeStep));
  $('themeSwitch').addEventListener('change', e => toggleTheme(e.target.checked));

  // Restore user prefs
  const themeDark = store.get('themeDark');
  if (themeDark !== null) {
    toggleTheme(themeDark);
    $('themeSwitch').checked = themeDark;
  }
  const fontSize = store.get('fontSize');
  if (fontSize) DOM.container.style.fontSize = fontSize + 'px';

  // Init chapters
  generateChapterOptions();
  if (!location.hash) goToChapter(store.get('lastChapter') || 1);
  handleHashChange();
});

/* ---------------- Debounced scroll/resize ---------------- */
let ticking = false;
function onScrollOrResize() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollProgress();
      ticking = false;
    });
    ticking = true;
  }
}
['scroll', 'resize'].forEach(ev =>
  window.addEventListener(ev, onScrollOrResize)
);
window.addEventListener('hashchange', handleHashChange);
