/* ---------------- Storage + DOM helpers ---------------- */
const store = {
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  get: k => {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch { return null; }
  }
};
const $ = id => document.getElementById(id);
const rafUpdate = () => requestAnimationFrame(updateScrollProgress);

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
    return char ? `
      <fieldset class="character-box ${char.color}">
        <legend>
          <mdui-icon name="person" style="vertical-align:middle"></mdui-icon>
          ${char.label}
        </legend>
        <p>${dialogue}</p>
      </fieldset>` : m;
  });
}

/* ---------------- Chapter loading ---------------- */
async function loadChapter(filePath, num) {
  const container = $('chapter-container'),
        titleDiv  = $('chapter-title'),
        bar       = $('scroll-progress');

  bar.style.cssText = 'transition:width .3s ease;width:0%';
  container.innerHTML = `<em><mdui-linear-progress></mdui-linear-progress></em>`;
  container.scrollTop = 0;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(res.status);
    const html = marked.parse((await res.text()).trim());
    container.innerHTML = applyCharacterReplacements(html);
    titleDiv.textContent =
      new DOMParser().parseFromString(html, 'text/html')
      .querySelector('h1')?.textContent || '';
    store.set('lastChapter', num);
    $('currentChapterValue').value = num;
  } catch {
    container.innerHTML = "<em>Could not load chapter.</em>";
    titleDiv.textContent = "";
  }
  rafUpdate();
}

/* ---------------- Navigation ---------------- */
const currentChapterNum = () => +location.hash.slice(1) || null;
const goToChapter = n => !isNaN(n=+n) && (location.hash = n);
const nextChapter = () => { const n=currentChapterNum(); if(n!==null) goToChapter(n+1); };
const prevChapter = () => { const n=currentChapterNum(); if(n>1) goToChapter(n-1); };

function handleHashChange() {
  const n = currentChapterNum(),
        slider = $('currentChapterValue'),
        max = +slider.max;
  if (!n) return;
  loadChapter(`https://hyals.ink/divide/ch/chapter${n}.txt`, n);
  slider.value = n;
  $('nextChapter').disabled = n >= max;
  $('prevChapter').disabled = n <= 1;
}

/* ---------------- Chapter list ---------------- */
function generateChapterOptions() {
  const list = $('chapterList'),
        max  = +$('currentChapterValue').max || 1;
  list.replaceChildren();
  for (let i=1;i<=max;i++) {
    const item = document.createElement('mdui-list-item');
    item.setAttribute('headline', i);
    item.textContent = i;
    item.addEventListener('click', () => goToChapter(i));
    list.appendChild(item);
  }
}

/* ---------------- Font size ---------------- */
function changeFontSize(delta) {
  const c = $('chapter-container'),
        cur = parseInt(getComputedStyle(c).fontSize, 10) || 18,
        size = Math.min(32, Math.max(12, cur + delta));
  c.style.fontSize = size + 'px';
  store.set('fontSize', size);
  rafUpdate();
}

/* ---------------- Theme toggle ---------------- */
function toggleTheme(on) {
  document.documentElement.classList.toggle('mdui-theme-dark', on);
  document.documentElement.classList.toggle('mdui-theme-light', !on);
  store.set('theme', on ? 'mdui-theme-dark' : 'mdui-theme-light');
  rafUpdate();
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
  if (store.get('theme') === 'mdui-theme-dark') {
    document.documentElement.classList.add('mdui-theme-dark');
    $('themeSwitch').checked = true;
  }
  if (store.get('fontSize')) container.style.fontSize = store.get('fontSize') + 'px';

  if (!location.hash) goToChapter(store.get('lastChapter') || 1);
  handleHashChange();

  ['scroll','resize'].forEach(ev =>
    window.addEventListener(ev, () => rafUpdate())
  );
});
window.addEventListener('hashchange', handleHashChange);
