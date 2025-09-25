const store = {
  set: (key, value) => localStorage.setItem(key, value),
  get: key => localStorage.getItem(key)
};

/* DOM helpers */
const $ = id => document.getElementById(id);
const rafUpdate = () => requestAnimationFrame(updateScrollProgress);

/* Character replacements */
const characterNames = {
  Hya:   { label: "Hya",   color: "red"  },
  Lina:  { label: "Lina",  color: "blue" },
  Vita:  { label: "Vita",  color: "blue" },
  Gaukel:{ label: "Gaukel",color: "blue" }
};
    function applyCharacterReplacements(text) {
      return text.replace(/\[(\w+)\]\s*(.*)/g, (m, key, dialogue) => {
        const char = characterNames[key];
        if (!char) return m;
        return `<fieldset class="character-box ${char.color}"><legend><mdui-icon name="person" style="vertical-align:middle"></mdui-icon> ${char.label}</legend><p>${dialogue}</p></fieldset>`;
      });
    }

/* Chapter loading */
async function loadChapter(filePath, num) {
  const container = $('chapter-container');
  const titleDiv  = $('chapter-title');
  const progressBar = $('scroll-progress');

  progressBar.style.transition = 'width 300ms ease';
  progressBar.style.width = '0%';

  container.innerHTML = "<em><mdui-linear-progress></mdui-linear-progress></em>";
  container.scrollTop = 0;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let text = (await res.text()).trim();
    const html = marked.parse(text);
    container.innerHTML = applyCharacterReplacements(html);

    const h1 = new DOMParser().parseFromString(html, 'text/html').querySelector('h1');
    titleDiv.textContent = h1 ? h1.textContent : '';
    store.set('lastChapter', num);
    $('currentChapterValue').value = num;
    rafUpdate();
  } catch {
    container.innerHTML = "<em>Could not load chapter.</em>";
    titleDiv.textContent = "";
    rafUpdate();
  }
}

/* Navigation */
const currentChapterNum = () => {
  const h = window.location.hash.substring(1);
  return h && !isNaN(h) ? parseInt(h, 10) : null;
};
const goToChapter = n => !isNaN(n = parseInt(n,10)) && (window.location.hash = n);
const nextChapter = () => { const n = currentChapterNum(); if (n !== null) goToChapter(n + 1); };
const prevChapter = () => { const n = currentChapterNum(); if (n > 1) goToChapter(n - 1); };

function handleHashChange() {
  const n = parseInt(window.location.hash.substring(1), 10);
  const slider = $('currentChapterValue');
  const final = parseInt(slider.max, 10);
  if (!isNaN(n)) {
    loadChapter(`https://hyals.ink/divide/ch/chapter${n}.txt`, n);
    slider.value = n;
    $('nextChapter').disabled = n >= final;
    $('prevChapter').disabled = n <= 1;
  }
}

/* Chapter options */
function generateChapterOptions() {
  const list = $('chapterList');
  const max  = parseInt($('currentChapterValue').max, 10) || 1;
  list.innerHTML = '';
  for (let i = 1; i <= max; i++) {
    const item = document.createElement('mdui-list-item');
    item.setAttribute('headline', i);
    item.textContent = i;
    item.addEventListener('click', () => goToChapter(i));
    list.appendChild(item);
  }
}

/* Font size */
const changeFontSize = delta => {
  const c = $('chapter-container');
  const next = Math.min(32, Math.max(12, parseInt(getComputedStyle(c).fontSize) + delta || 18));
  c.style.fontSize = next + 'px';
  store.set('fontSize', next);
  rafUpdate();
};


/* Theme toggle */
function toggleThemeBySwitch(isChecked) {
  const doc = document.documentElement;
  doc.classList.toggle('mdui-theme-dark', isChecked);
  doc.classList.toggle('mdui-theme-light', !isChecked);
  store.set('theme', isChecked ? 'mdui-theme-dark' : 'mdui-theme-light');
  rafUpdate();
}

/* Progress line update */
function updateScrollProgress() {
  const bar = $('scroll-progress');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 1;
  bar.style.width = (Math.max(0, Math.min(1, progress)) * 100) + '%';
}

/* Init */
window.addEventListener('load', () => {
  const slider = $('currentChapterValue');
  const container = $('chapter-container');

  $('chapter_list_icon').addEventListener("click", () => document.querySelector(".example-header").open = true);
  $('close_chapter_list').addEventListener("click", () => document.querySelector(".example-header").open = false);

  generateChapterOptions();
  slider.addEventListener('input', e => goToChapter(e.target.value));
  $('prevChapter').addEventListener('click', prevChapter);
  $('nextChapter').addEventListener('click', nextChapter);
  $('fontInc').addEventListener('click', () => changeFontSize(2));
  $('fontDec').addEventListener('click', () => changeFontSize(-2));
  $('themeSwitch').addEventListener('change', e => toggleThemeBySwitch(e.target.checked));

  /* Restore prefs */
  if (store.get('theme') === 'mdui-theme-dark') {
    document.documentElement.classList.add('mdui-theme-dark');
    $('themeSwitch').checked = true;
  }
  const savedFont = store.get('fontSize');
  if (savedFont) container.style.fontSize = parseInt(savedFont, 10) + 'px';

  if (!window.location.hash) goToChapter(store.get('lastChapter') || 1);
  handleHashChange();

  window.addEventListener('scroll', updateScrollProgress);
  window.addEventListener('resize', updateScrollProgress);
  document.addEventListener('DOMContentLoaded', updateScrollProgress);
});
window.addEventListener('hashchange', handleHashChange);
