(function () {
  var doc = document, body = doc.body;
  var nav = doc.getElementById('nav'), menu = doc.getElementById('menu');
  var narrow = window.matchMedia('(max-width: 900px)');
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ } }

  // ----- collapsible navigation -----
  // The whole bar: hidden/shown with the menu button (or Ctrl/⌘ + B).
  function navShown() { return narrow.matches ? body.classList.contains('nav-open') : !body.classList.contains('nav-hidden'); }
  function showNav(show) {
    if (narrow.matches) body.classList.toggle('nav-open', show);
    else { body.classList.toggle('nav-hidden', !show); save('guide.navHidden', !show); }
    menu.setAttribute('aria-expanded', show);
  }
  if (load('guide.navHidden')) body.classList.add('nav-hidden');
  menu.setAttribute('aria-expanded', navShown());
  menu.addEventListener('click', function () { showNav(!navShown()); });
  doc.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); showNav(!navShown()); }
  });

  // Its groups and sub-lists: each folds with its own button.
  var folded = load('guide.folded') || {};
  function setFold(btn, fold) {
    var list = doc.getElementById(btn.getAttribute('aria-controls'));
    list.hidden = fold;
    btn.setAttribute('aria-expanded', !fold);
  }
  nav.querySelectorAll('button[aria-controls]').forEach(function (btn) {
    if (folded[btn.getAttribute('aria-controls')]) setFold(btn, true);
    btn.addEventListener('click', function () {
      var fold = btn.getAttribute('aria-expanded') === 'true';
      setFold(btn, fold);
      folded[btn.getAttribute('aria-controls')] = fold;
      save('guide.folded', folded);
    });
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A' && narrow.matches) showNav(false); });

  // Highlight the section being read.
  var links = {};
  nav.querySelectorAll('a').forEach(function (a) { (links[a.hash.slice(1)] = links[a.hash.slice(1)] || []).push(a); });
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        nav.querySelectorAll('a.on').forEach(function (a) { a.classList.remove('on'); });
        var mine = links[en.target.id] || [];
        mine.forEach(function (a) { a.classList.add('on'); });
        if (mine[0] && mine[0].offsetParent && nav.scrollHeight > nav.clientHeight) {
          var r = mine[0].getBoundingClientRect(), n = nav.getBoundingClientRect();
          if (r.top < n.top || r.bottom > n.bottom) nav.scrollTop += r.top - n.top - nav.clientHeight / 2;
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    doc.querySelectorAll('main h3[id], main h4[id], main h5[id]').forEach(function (h) { if (links[h.id]) seen.observe(h); });
  }

  // ----- search across the whole guide -----
  var input = doc.getElementById('q'), panel = doc.getElementById('results');
  var sections = [], cur = null, part = '', topic = '';
  doc.querySelectorAll('main .part-title, main h3[id], main h4[id], main h5[id], main .topic p, main .topic li, main .topic tr, main figcaption').forEach(function (el) {
    if (el.classList.contains('part-title')) { part = el.getAttribute('data-title'); return; }
    if (/^H[345]$/.test(el.tagName)) {
      var title = el.firstChild.textContent.trim() || el.textContent.trim();
      if (el.tagName === 'H3') topic = title;
      cur = { el: el, title: title, where: part + (el.tagName === 'H3' ? '' : ' › ' + topic), blocks: [], text: title.toLowerCase() };
      sections.push(cur);
      return;
    }
    if (!cur || el.closest('thead') || (el.tagName === 'P' && el.closest('li, td'))) return;
    var text = (el.tagName === 'TR' ? Array.prototype.map.call(el.cells, function (c) { return c.textContent; }).join(' — ') : el.textContent).replace(/\s+/g, ' ').trim();
    if (!text) return;
    cur.blocks.push({ el: el, text: text, low: text.toLowerCase() });
    cur.text += ' ' + text.toLowerCase();
  });

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function mark(text, terms) {
    var re = new RegExp('(' + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    return esc(text).replace(re, '<mark>$1</mark>');
  }
  function snippet(text, terms) {
    var low = text.toLowerCase(), at = -1;
    terms.forEach(function (t) { var i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
    var from = Math.max(0, at - 50);
    if (from > 0) from = text.indexOf(' ', from) + 1;
    var cut = text.slice(from, from + 150);
    return (from > 0 ? '…' : '') + cut + (from + 150 < text.length ? '…' : '');
  }

  function wordStart(low, t) {
    for (var i = low.indexOf(t); i >= 0; i = low.indexOf(t, i + 1)) if (i === 0 || !/[a-z0-9]/.test(low[i - 1])) return true;
    return false;
  }
  var found = [], active = -1;
  function search() {
    var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    found = []; active = -1;
    if (!terms.length) { panel.hidden = true; return; }
    sections.forEach(function (s) {
      if (!terms.every(function (t) { return s.text.indexOf(t) >= 0; })) return;
      var inTitle = terms.filter(function (t) { return s.title.toLowerCase().indexOf(t) >= 0; }).length;
      var best = null, bestN = 0, hits = 0;
      s.blocks.forEach(function (b) {
        // a term at the start of a word counts more than one inside a word
        var n = 0;
        terms.forEach(function (t) { var i = b.low.indexOf(t); if (i >= 0) n += 1 + (wordStart(b.low, t) ? 0.5 : 0); });
        if (n) hits++;
        if (n > bestN) { bestN = n; best = b; }
      });
      found.push({ s: s, block: best, score: inTitle * 100 + bestN * 10 + Math.min(hits, 9) });
    });
    found.sort(function (a, b) { return b.score - a.score; });
    found = found.slice(0, 30);
    panel.innerHTML = found.length
      ? '<div class="count">' + found.length + (found.length === 30 ? '+' : '') + ' section' + (found.length === 1 ? '' : 's') + '</div>' +
        found.map(function (f, i) {
          return '<a href="#' + f.s.el.id + '" data-i="' + i + '"><span class="where">' + esc(f.s.where) + '</span><strong>' + mark(f.s.title, terms) +
            '</strong>' + (f.block ? '<span class="snip">' + mark(snippet(f.block.text, terms), terms) + '</span>' : '') + '</a>';
        }).join('')
      : '<div class="count">Nothing found for "' + esc(input.value.trim()) + '"</div>';
    panel.hidden = false;
    panel.scrollTop = 0;
  }
  function setActive(i) {
    var items = panel.querySelectorAll('a');
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach(function (a, n) { a.classList.toggle('sel', n === active); });
    items[active].scrollIntoView({ block: 'nearest' });
  }
  function go(i) {
    var f = found[i];
    if (!f) return;
    var target = f.block ? f.block.el : f.s.el;
    panel.hidden = true;
    input.blur();
    if (narrow.matches) showNav(false);
    history.replaceState(null, '', '#' + f.s.el.id);
    // show the heading too when the match sits close under it
    var top = target.getBoundingClientRect().top - f.s.el.getBoundingClientRect().top < window.innerHeight * 0.5 ? f.s.el : target;
    top.scrollIntoView({ block: 'start' });
    doc.querySelectorAll('.hit').forEach(function (el) { el.classList.remove('hit'); });
    target.classList.add('hit');
    setTimeout(function () { target.classList.remove('hit'); }, 3000);
  }
  input.addEventListener('input', search);
  input.addEventListener('focus', function () { if (input.value.trim()) search(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); go(active < 0 ? 0 : active); }
    else if (e.key === 'Escape') { panel.hidden = true; input.blur(); }
  });
  panel.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a) { e.preventDefault(); go(+a.getAttribute('data-i')); }
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest('.search')) panel.hidden = true; });
  doc.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test(doc.activeElement.tagName);
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); input.focus(); input.select(); }
  });
})();

// ----- reading aids: header shadow, back to top, heading links, screenshot viewer -----
(function () {
  var doc = document;
  var top = doc.querySelector('.top'), totop = doc.getElementById('totop');
  function onScroll() {
    top.classList.toggle('scrolled', window.scrollY > 8);
    totop.classList.toggle('show', window.scrollY > window.innerHeight * 1.2);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  totop.addEventListener('click', function () { window.scrollTo({ top: 0 }); history.replaceState(null, '', location.pathname + location.search); });

  // A "#" after each heading: copies a link straight to it.
  doc.querySelectorAll('main h3[id], main h4[id], main h5[id]').forEach(function (h) {
    var a = doc.createElement('a');
    a.className = 'anchor'; a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Copy a link to this section');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      history.replaceState(null, '', '#' + h.id);
      h.scrollIntoView({ block: 'start' });
      var url = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () {
        a.classList.add('copied');
        setTimeout(function () { a.classList.remove('copied'); }, 1600);
      }, function () {});
    });
    h.appendChild(a);
  });

  // Screenshots open in a viewer; arrow keys step through every screenshot in the guide.
  var viewer = doc.getElementById('viewer'), img = viewer.querySelector('img'), cap = viewer.querySelector('figcaption');
  var shots = [].slice.call(doc.querySelectorAll('main a.shot')), at = -1, opener = null;
  function caption(a) {
    var fig = a.closest('figure'), fc = fig && fig.querySelector('figcaption');
    return (fc && fc.textContent.trim()) || a.querySelector('img').alt || '';
  }
  function show(i) {
    at = (i + shots.length) % shots.length;
    var a = shots[at], src = a.querySelector('img');
    img.src = a.getAttribute('href'); img.alt = src.alt;
    img.classList.toggle('phone', a.classList.contains('phone'));
    cap.textContent = caption(a);
    cap.hidden = !cap.textContent;
  }
  function open(i) {
    opener = doc.activeElement;
    show(i);
    viewer.hidden = false;
    doc.body.style.overflow = 'hidden';
    viewer.querySelector('.x').focus();
  }
  function close() {
    viewer.hidden = true;
    doc.body.style.overflow = '';
    if (opener && opener.focus) opener.focus();
  }
  shots.forEach(function (a, i) {
    a.removeAttribute('target');
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // open in a new tab as usual
      e.preventDefault();
      open(i);
    });
  });
  viewer.addEventListener('click', function (e) {
    if (e.target.closest('.prev')) show(at - 1);
    else if (e.target.closest('.next')) show(at + 1);
    else if (!e.target.closest('figcaption')) close();
  });
  doc.addEventListener('keydown', function (e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'Tab') { // keep the keyboard inside the viewer
      var f = [].slice.call(viewer.querySelectorAll('button')), i = f.indexOf(doc.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
})();
