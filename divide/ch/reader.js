/* ---------------- Storage + DOM helpers ---------------- */
const store = {
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  get: k => {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch { return null; }
  }
};
const $ = id => document.getElementById(id);

/* ---------------- Character replacements ---------------- */
const characterNames = {
  Hya:    { label: "Hya",    color: "red"  },
  Lina:   { label: "Lina",   color: "blue" },
  Vita:   { label: "Vita",   color: "blue" },
  Gaukel: { label: "Gaukel", color: "blue" }
};
function applyCharacterReplacements(text) {
  return text.replace(/\[(\w+)\]\s*(.*)/g, (m, key, dialogue) => {
    const char = characterNames[key];
    return char ? `<fieldset class="character-box ${char.color}"><legend><mdui-icon name="person" style="vertical-align:middle"></mdui-icon>${char.label}</legend><p>${dialogue}</p></fieldset>` : m;
  });
}

/* ---------------- Chapter data ---------------- */
const chapters = [
  { num: 1, name: "Prologue of Death and Sorrow" },
  { num: 2, name: "I carry you with me, always" },
  { num: 3, name: "Red Hues" }
];

/* ---------------- Chapter loading ---------------- */
async function loadChapter(filePath, num) {
  const container = $('chapter-container'),
        titleDiv  = $('chapter-title'),
        bar       = $('scroll-progress'),
        chapter   = chapters.find(c => c.num === num);

  if (!chapter) {
    container.innerHTML = "<em>Chapter not found.</em>";
    titleDiv.textContent = "";
    return;
  }

  bar.style.cssText = 'transition:width .3s ease;width:0%';
  container.innerHTML = `<em><mdui-linear-progress></mdui-linear-progress></em>`;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(res.status);
    const html = marked.parse((await res.text()).trim());

    requestAnimationFrame(() => {
      container.innerHTML = applyCharacterReplacements(html);
      container.scrollTop = 0;
      titleDiv.textContent = chapter.name;
    });

    store.set('lastChapter', num);
  } catch {
    container.innerHTML = "<em>Could not load chapter.</em>";
    titleDiv.textContent = "";
  }

  requestAnimationFrame(updateScrollProgress);
}

/* ---------------- Navigation ---------------- */
const currentChapterNum = () => +location.hash.slice(1) || null;
const goToChapter = n => !isNaN(n=+n) && (location.hash = n);
const nextChapter = () => { const n=currentChapterNum(); if(n!==null) goToChapter(n+1); };
const prevChapter = () => { const n=currentChapterNum(); if(n>1) goToChapter(n-1); };

function handleHashChange() {
  const n = currentChapterNum(),
        slider = $('currentChapterValue'),
        max = chapters.length;

  if (!n) return;

  loadChapter(`https://hyals.ink/divide/ch/chapter${n}.txt`, n);

    slider.value = n;
    $('nextChapter').disabled = n >= max;
    $('prevChapter').disabled = n <= 1;
}

/* ---------------- Chapter list ---------------- */
function generateChapterOptions() {
  const list = $('chapterList');
  list.replaceChildren();

  for (const ch of chapters) {
    const item = document.createElement('mdui-list-item');
    item.setAttribute('headline', `${ch.num}. ${ch.name}`);
    item.textContent = `${ch.num}. ${ch.name}`;
    item.setAttribute('aria-label', `Go to chapter ${ch.num}: ${ch.name}`);
    item.addEventListener('click', () => goToChapter(ch.num));
    list.appendChild(item);
  }

  $('currentChapterValue').max = chapters.length;
}

/* ---------------- Font size ---------------- */
function changeFontSize(delta) {
  const c = $('chapter-container'),
        cur = parseInt(getComputedStyle(c).fontSize, 10) || 18,
        size = Math.min(32, Math.max(12, cur + delta));
  c.style.fontSize = size + 'px';
  store.set('fontSize', size);
  requestAnimationFrame(updateScrollProgress);
}

/* ---------------- Theme toggle ---------------- */
function toggleTheme(on) {
  document.documentElement.classList.toggle('mdui-theme-dark', on);
  document.documentElement.classList.toggle('mdui-theme-light', !on);
  store.set('themeDark', on);
  requestAnimationFrame(updateScrollProgress);
}

/* ---------------- Progress bar ---------------- */
function updateScrollProgress() {
  const bar = $('scroll-progress'),
        st  = window.scrollY || document.documentElement.scrollTop,
        sh  = document.documentElement.scrollHeight - document.documentElement.clientHeight,
        p   = sh > 0 ? st / sh : 1;
  bar.style.width = (Math.min(1, Math.max(0, p)) * 100) + '%';
}

/* ---------------- Init ---------------- */
window.addEventListener('DOMContentLoaded', () => {
  const slider    = $('currentChapterValue'),
        container = $('chapter-container');

  // Chapter list modal
  $('chapter_list_icon').addEventListener('click', () => {
    document.querySelector(".example-header").open = true;
  });
  $('close_chapter_list').addEventListener('click', () => {
    document.querySelector(".example-header").open = false;
  });

  generateChapterOptions();

  slider.addEventListener('input', e => goToChapter(e.target.value));
  $('prevChapter').addEventListener('click', prevChapter);
  $('nextChapter').addEventListener('click', nextChapter);
  $('fontInc').addEventListener('click', () => changeFontSize(2));
  $('fontDec').addEventListener('click', () => changeFontSize(-2));
  $('themeSwitch').addEventListener('change', e => toggleTheme(e.target.checked));

  // Restore prefs
  if (store.get('themeDark')) {
    document.documentElement.classList.add('mdui-theme-dark');
    $('themeSwitch').checked = true;
  }
  if (store.get('fontSize')) container.style.fontSize = store.get('fontSize') + 'px';

  if (!location.hash) goToChapter(store.get('lastChapter') || 1);
  handleHashChange();
});

/* Debounced scroll/resize listener */
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
