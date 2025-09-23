/* Cookie helpers */
    function setCookie(name, value, days = 365) {
      const d = new Date();
      d.setTime(d.getTime() + days * 864e5);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
    }
    function getCookie(name) {
      return document.cookie.split('; ').reduce((r, v) => {
        const [k, val] = v.split('=');
        return k === name ? decodeURIComponent(val) : r;
      }, null);
    }

    /* Character replacements */
    const characterNames = {
      "Hya": { label: "Hya", color: "red" },
      "Lina": { label: "Lina", color: "blue" },
      "Vita": { label: "Vita", color: "blue" },
      "Gaukel": { label: "Gaukel", color: "blue" }
    };
    function applyCharacterReplacements(text) {
      return text.replace(/\[(\w+)\]\s*(.*)/g, (m, key, dialogue) => {
        const char = characterNames[key];
        if (!char) return m;
        return `<fieldset class="character-box ${char.color}"><legend><i class="mdui-icon material-icons" style="vertical-align:middle">person</i> ${char.label}</legend><p>${dialogue}</p></fieldset>`;
      });
    }

    /* Chapter loading */
    async function loadChapter(filePath, num) {
      const container = document.getElementById('chapter-container');
      const titleDiv = document.getElementById('chapter-title');
      const progressBar = document.getElementById('scroll-progress');

      // Animate progress line back to 0 when switching chapters
      progressBar.style.transition = 'width 300ms ease';
      // force the animation even if width is already 0 -> set to 0%
      progressBar.style.width = '0%';

      // show linear loading indicator in content area (MDUI component)
      container.innerHTML = "<em><mdui-linear-progress></mdui-linear-progress></em>";
      container.scrollTop = 0;

      try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let text = (await res.text()).trim();
        text = applyCharacterReplacements(text);
        const html = marked.parse(text);
        container.innerHTML = html;

        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const h1 = parsed.querySelector('h1');
        titleDiv.textContent = h1 ? h1.textContent : '';
        setCookie('lastChapter', num);
        document.getElementById('currentChapterValue').value = num;

        // Wait a tick so layout/scrollHeight is updated, then update progress
        requestAnimationFrame(() => {
          updateScrollProgress(); // fill according to new content
        });
      } catch {
        container.innerHTML = "<em>Could not load chapter.</em>";
        titleDiv.textContent = "";
        // ensure the progress bar reflects no content
        requestAnimationFrame(() => {
          updateScrollProgress();
        });
      }
    }

    /* Navigation */
    function goToChapter(num) {
      const n = parseInt(num, 10);
      if (!isNaN(n)) window.location.hash = n;
    }
    function currentChapterNum() {
      const h = window.location.hash.substring(1);
      return h && !isNaN(h) ? parseInt(h, 10) : null;
    }
    function nextChapter() {
      const n = currentChapterNum();
      if (n !== null) goToChapter(n + 1);
    }
    function prevChapter() {
      const n = currentChapterNum();
      if (n !== null && n > 1) goToChapter(n - 1);
    }
    function handleHashChange() {
      const hash = window.location.hash.substring(1);
      const slider = document.getElementById('currentChapterValue');
      const final_chapter = parseInt(slider.max, 10);
      if (hash && !isNaN(hash)) {
        const n = parseInt(hash, 10);
        loadChapter(`https://hyals.ink/divide/ch/chapter${n}.txt`, n);
        slider.value = n;
        document.getElementById('nextChapter').disabled = (n >= final_chapter);
        document.getElementById('prevChapter').disabled = (n <= 1);
      }
    }

    /* Chapter options */
    function generateChapterOptions() {
      const list = document.getElementById('chapterList');
      const slider = document.getElementById('currentChapterValue');
      const max = parseInt(slider.max, 10) || 1;
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
    function changeFontSize(delta) {
      const c = document.getElementById('chapter-container');
      const cur = parseInt(getComputedStyle(c).fontSize, 10) || 18;
      const next = Math.max(12, cur + delta);
      c.style.fontSize = next + 'px';
      setCookie('fontSize', String(next));
      // Recompute progress when font size changes (scrollable height may change)
      requestAnimationFrame(updateScrollProgress);
    }

    /* Theme toggle */
    function toggleThemeBySwitch(isChecked) {
      const doc = document.documentElement;
      if (isChecked) {
        doc.classList.add('mdui-theme-dark');
        doc.classList.remove('mdui-theme-light');
        setCookie('theme', 'mdui-theme-dark');
      } else {
        doc.classList.remove('mdui-theme-dark');
        doc.classList.add('mdui-theme-light');
        setCookie('theme', 'mdui-theme-light');
      }
      // Recompute progress when theme changes in case metrics change slightly
      requestAnimationFrame(updateScrollProgress);
    }

    /* Progress line update */
 function updateScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  let progress = 0;
  if (scrollHeight > 0) {
    progress = scrollTop / scrollHeight;
  } else {
    // If content fits without scrolling, treat as 100%
    progress = 1;
  }

  // Clamp and set width
  progress = Math.max(0, Math.min(1, progress));
  bar.style.width = (progress * 100) + '%';
}

    /* Init */
    window.addEventListener('load', () => {
      const slider = document.getElementById('currentChapterValue');
      const prevBtn = document.getElementById('prevChapter');
      const nextBtn = document.getElementById('nextChapter');
      const fontInc = document.getElementById('fontInc');
      const fontDec = document.getElementById('fontDec');
      const themeSwitch = document.getElementById('themeSwitch');
      const dialog = document.querySelector(".example-header");
      const openButton = document.getElementById("chapter_list_icon");
      const closeButton = document.getElementById("close_chapter_list");
      const container = document.getElementById('chapter-container');

      openButton.addEventListener("click", () => dialog.open = true);
      closeButton.addEventListener("click", () => dialog.open = false);

      generateChapterOptions();
      slider.addEventListener('input', e => goToChapter(e.target.value));
      prevBtn.addEventListener('click', prevChapter);
      nextBtn.addEventListener('click', nextChapter);
      fontInc.addEventListener('click', () => changeFontSize(2));
      fontDec.addEventListener('click', () => changeFontSize(-2));
      themeSwitch.addEventListener('change', e => toggleThemeBySwitch(e.target.checked));

      /* Restore prefs */
      const savedTheme = getCookie('theme');
      if (savedTheme === 'mdui-theme-dark') {
        document.documentElement.classList.add('mdui-theme-dark');
        themeSwitch.checked = true;
      }
      const savedFont = getCookie('fontSize');
      if (savedFont) container.style.fontSize = parseInt(savedFont, 10) + 'px';

      if (!window.location.hash) {
        const last = getCookie('lastChapter');
        goToChapter(last || 1);
      }
      handleHashChange();

window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('resize', updateScrollProgress); // keeps it accurate on resize
document.addEventListener('DOMContentLoaded', updateScrollProgress);
    });
    window.addEventListener('hashchange', handleHashChange);
