/* ==========================================================================
   Bonjour Vietnam – skript
   ==========================================================================

   1) ÚDAJE K ÚPRAVĚ  (jediné místo, ostatní kód nechte být)
   --------------------------------------------------------------------------
   Co je prázdné, se na webu schová (odznak Otevřeno/Zavřeno, tlačítko Zavolat,
   odkazy na sítě). Dokud je showTodo true, ukazuje web na těch místech
   žlutozelený štítek [DOPLNIT]. Před spuštěním ostrého webu přepněte na false.
   ========================================================================== */
const SITE = {
  name: 'Bonjour Vietnam',

  /* Adresa je ověřená, nemění se. */
  street: 'Václavská 39/1',
  postalCode: '603 00',
  city: 'Brno',

  /* [DOPLNIT] telefon, např. '+420 123 456 789' */
  phone: '',

  /* [DOPLNIT] e-mail, např. 'info@priklad.cz' */
  email: '',

  /* [DOPLNIT] celé adresy profilů, např. 'https://www.instagram.com/jmeno/' */
  instagram: '',
  facebook: '',

  /* [DOPLNIT] otevírací doba. Formát 'HH:MM–HH:MM'.
     Víc úseků v jednom dni oddělte čárkou: '11:00–14:30, 17:00–21:00'.
     Zavřeno napište slovem 'zavřeno'. Prázdný řetězec = nevyplněno.
     Dokud není vyplněný aspoň jeden den, odznak Otevřeno/Zavřeno se nezobrazí. */
  hours: {
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    sun: ''
  },

  timezone: 'Europe/Prague',

  /* true = ukázat štítky [DOPLNIT] tam, kde chybí údaj. false = chybějící údaje schovat. */
  showTodo: true
};

/* ==========================================================================
   2) KÓD (níže není potřeba nic upravovat)
   ========================================================================== */
(function () {
  'use strict';

  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];   // pořadí podle Date.getDay()
  var ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DAY_NAME = { mon: 'Pondělí', tue: 'Úterý', wed: 'Středa', thu: 'Čtvrtek', fri: 'Pátek', sat: 'Sobota', sun: 'Neděle' };
  var DAY_SHORT = { mon: 'po', tue: 'út', wed: 'st', thu: 'čt', fri: 'pá', sat: 'so', sun: 'ne' };
  var DAY_SCHEMA = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var svgNS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function icon(id) {
    var s = document.createElementNS(svgNS, 'svg');
    s.setAttribute('class', 'icon');
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS(svgNS, 'use');
    u.setAttribute('href', '#' + id);
    s.appendChild(u);
    return s;
  }

  /* Text s poli [DOPLNIT ...] -> zvýrazněný štítek (bezpečně, bez innerHTML) */
  function setTextWithTodo(node, text) {
    node.textContent = '';
    String(text).split(/(\[DOPLNIT[^\]]*\])/).forEach(function (part) {
      if (!part) return;
      if (/^\[DOPLNIT/.test(part)) node.appendChild(el('span', { class: 'todo', text: part }));
      else node.appendChild(document.createTextNode(part));
    });
  }

  function todo(label) { return el('span', { class: 'todo', text: label || '[DOPLNIT]' }); }

  /* ------------------------------------------------------------------
     Otevírací doba
     ------------------------------------------------------------------ */
  function hasHours() {
    return ORDER.some(function (d) { return SITE.hours[d] && String(SITE.hours[d]).trim() !== ''; });
  }

  function parseRanges(str) {
    var out = [];
    if (!str || /zav[řr]eno/i.test(str)) return out;
    var re = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/g, m;
    while ((m = re.exec(str))) {
      var open = (+m[1]) * 60 + (+m[2]);
      var close = (+m[3]) * 60 + (+m[4]);
      if (close <= open) close += 1440;   // zavírá po půlnoci
      out.push([open, close]);
    }
    return out.sort(function (a, b) { return a[0] - b[0]; });
  }

  function fmt(minutes) {
    var m = ((minutes % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  /* Čas v Brně bez ohledu na časové pásmo návštěvníka */
  function localNow() {
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: SITE.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var h = parseInt(get('hour'), 10); if (h === 24) h = 0;
      return { day: map[get('weekday')], minutes: h * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function openStatus() {
    if (!hasHours()) return null;
    var now = localNow();
    var i, r, ranges;

    ranges = parseRanges(SITE.hours[DAY_KEYS[now.day]]);
    for (i = 0; i < ranges.length; i++) {
      r = ranges[i];
      if (now.minutes >= r[0] && now.minutes < r[1]) return { open: true, until: fmt(r[1]) };
    }
    ranges = parseRanges(SITE.hours[DAY_KEYS[(now.day + 6) % 7]]);   // přesah ze včerejška
    for (i = 0; i < ranges.length; i++) {
      r = ranges[i];
      if (r[1] > 1440 && now.minutes < r[1] - 1440) return { open: true, until: fmt(r[1]) };
    }
    for (var add = 0; add < 8; add++) {
      var key = DAY_KEYS[(now.day + add) % 7];
      ranges = parseRanges(SITE.hours[key]);
      for (i = 0; i < ranges.length; i++) {
        if (add > 0 || ranges[i][0] > now.minutes) return { open: false, next: { add: add, time: fmt(ranges[i][0]), day: key } };
      }
    }
    return { open: false, next: null };
  }

  function renderOpenTag() {
    var tag = $('#open-tag'), hero = $('.hero');
    var status = openStatus();
    if (!status) { tag.hidden = true; hero.classList.remove('has-tag'); return; }

    tag.hidden = false;
    hero.classList.add('has-tag');
    tag.classList.toggle('is-open', status.open);
    tag.classList.toggle('is-closed', !status.open);
    $('#open-state').textContent = status.open ? 'Otevřeno' : 'Zavřeno';

    var detail = '';
    if (status.open) detail = 'do ' + status.until;
    else if (status.next) {
      var n = status.next;
      detail = (n.add === 0 ? 'dnes' : n.add === 1 ? 'zítra' : DAY_SHORT[n.day]) + ' ' + n.time;
    }
    $('#open-detail').textContent = detail;
  }

  /* ------------------------------------------------------------------
     Kontakt, lišta, patička, JSON-LD
     ------------------------------------------------------------------ */
  function telHref(p) { return 'tel:' + String(p).replace(/[^\d+]/g, ''); }

  function renderContact() {
    var todayKey = DAY_KEYS[localNow().day];

    /* otevírací doba */
    var rowH = $('#row-hours'), outH = $('#hours-out');
    if (hasHours()) {
      var ul = el('ul', { class: 'hours-list' });
      ORDER.forEach(function (d) {
        var v = String(SITE.hours[d] || '').trim();
        if (!v && !SITE.showTodo) return;
        var li = el('li', { class: d === todayKey ? 'is-today' : '' }, [el('span', { text: DAY_NAME[d] })]);
        var val = el('span');
        if (v) val.textContent = v.replace(/\s*-\s*/g, '–'); else val.appendChild(todo());
        li.appendChild(val);
        ul.appendChild(li);
      });
      outH.replaceChildren(ul);
      rowH.hidden = false;
    } else if (SITE.showTodo) {
      outH.replaceChildren(todo());
      rowH.hidden = false;
    }

    /* telefon */
    var rowP = $('#row-phone'), outP = $('#phone-out');
    if (SITE.phone) {
      outP.replaceChildren(el('a', { href: telHref(SITE.phone), text: SITE.phone }));
      rowP.hidden = false;
    } else if (SITE.showTodo) { outP.replaceChildren(todo()); rowP.hidden = false; }

    /* e-mail */
    var rowE = $('#row-email'), outE = $('#email-out');
    if (SITE.email) {
      outE.replaceChildren(el('a', { href: 'mailto:' + SITE.email, text: SITE.email }));
      rowE.hidden = false;
    } else if (SITE.showTodo) { outE.replaceChildren(todo()); rowE.hidden = false; }

    /* spodní lišta: tlačítko bez dat se schová */
    var call = $('#dock-call');
    if (SITE.phone) { call.href = telHref(SITE.phone); call.hidden = false; } else { call.hidden = true; }

    /* sociální sítě */
    var box = $('#socials');
    var nets = [
      { url: SITE.instagram, id: 'i-ig', label: 'Instagram' },
      { url: SITE.facebook, id: 'i-fb', label: 'Facebook' }
    ].filter(function (n) { return n.url; });
    box.replaceChildren();
    nets.forEach(function (n) {
      var a = el('a', { href: n.url, target: '_blank', rel: 'noopener', 'aria-label': n.label });
      a.appendChild(icon(n.id));
      box.appendChild(a);
    });
    if (!nets.length && SITE.showTodo) box.appendChild(todo('[DOPLNIT] Instagram a Facebook'));
    box.hidden = !box.childNodes.length;
  }

  function renderJsonLd() {
    var node = $('#ld-json');
    if (!node) return;
    var data = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: SITE.name,
      description: 'Vietnamské bistro ve Starém Brně. Nudle, saláty, restovaná zelenina, rolky, dezerty a limonády z čerstvých surovin od lokálních dodavatelů, s veganskou, vegetariánskou a bezlepkovou variantou.',
      servesCuisine: 'Vietnamská',
      address: { '@type': 'PostalAddress', streetAddress: SITE.street, postalCode: SITE.postalCode, addressLocality: SITE.city, addressCountry: 'CZ' }
    };
    if (SITE.phone) data.telephone = SITE.phone;
    if (SITE.email) data.email = SITE.email;
    var same = [SITE.instagram, SITE.facebook].filter(Boolean);
    if (same.length) data.sameAs = same;
    var spec = [];
    ORDER.forEach(function (d) {
      parseRanges(SITE.hours[d]).forEach(function (r) {
        spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_SCHEMA[d], opens: fmt(r[0]), closes: fmt(r[1]) });
      });
    });
    if (spec.length) data.openingHoursSpecification = spec;
    node.textContent = JSON.stringify(data, null, 2);
  }

  /* ------------------------------------------------------------------
     Jídelní lístek (data v menu-data.js)
     ------------------------------------------------------------------ */
  function plural(n, one, few, many) { return n === 1 ? one : (n >= 2 && n <= 4 ? few : many); }

  function initMenu() {
    var data = window.MENU_DATA;
    var tabsEl = $('#menu-tabs'), panel = $('#menu-panel'), filterEl = $('#diet-filter'), status = $('#menu-status');
    if (!data || !tabsEl) return;

    var state = { cat: 'all', diets: [] };
    var dietLabel = {};
    data.diets.forEach(function (d) { dietLabel[d.id] = d.label; });

    /* upozornění na zástupná data */
    var note = $('#board-note');
    if (data.placeholder && SITE.showTodo) {
      setTextWithTodo(note, '[DOPLNIT] Jídelní lístek je zatím zástupný. Ceny, popisy, diety a alergeny doplní majitelka.');
      note.hidden = false;
    }

    /* filtr diet */
    data.diets.forEach(function (d) {
      var b = el('button', { type: 'button', class: 'diet-btn diet-' + d.id, 'data-diet': d.id, 'aria-pressed': 'false' }, [icon('i-check'), el('span', { text: d.label })]);
      b.addEventListener('click', function () {
        var i = state.diets.indexOf(d.id);
        if (i >= 0) state.diets.splice(i, 1); else state.diets.push(d.id);
        b.setAttribute('aria-pressed', String(i < 0));
        render();
      });
      filterEl.appendChild(b);
    });

    /* záložky */
    var tabDefs = [{ id: 'all', title: 'Vše' }].concat(data.categories.map(function (c) { return { id: c.id, title: c.title }; }));
    var tabEls = tabDefs.map(function (t) {
      var b = el('button', { type: 'button', role: 'tab', class: 'tab', id: 'tab-' + t.id, 'data-cat': t.id, 'aria-selected': String(t.id === state.cat), 'aria-controls': 'menu-panel', tabindex: t.id === state.cat ? '0' : '-1', text: t.title });
      b.addEventListener('click', function () { selectTab(t.id, false, true); });
      b.addEventListener('keydown', function (e) {
        var i = tabEls.indexOf(b), next = null;
        if (e.key === 'ArrowRight') next = tabEls[(i + 1) % tabEls.length];
        else if (e.key === 'ArrowLeft') next = tabEls[(i - 1 + tabEls.length) % tabEls.length];
        else if (e.key === 'Home') next = tabEls[0];
        else if (e.key === 'End') next = tabEls[tabEls.length - 1];
        if (next) { e.preventDefault(); selectTab(next.getAttribute('data-cat'), true, true); }
      });
      tabsEl.appendChild(b);
      return b;
    });

    /* posune jen řádek záložek do strany, stránka se nehýbe */
    function revealTab(b) {
      var left = b.offsetLeft, right = left + b.offsetWidth;
      if (left < tabsEl.scrollLeft) tabsEl.scrollLeft = Math.max(0, left - 16);
      else if (right > tabsEl.scrollLeft + tabsEl.clientWidth) tabsEl.scrollLeft = right - tabsEl.clientWidth + 48;
    }

    function selectTab(id, focus, byUser) {
      state.cat = id;
      tabEls.forEach(function (b) {
        var on = b.getAttribute('data-cat') === id;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on) {
          panel.setAttribute('aria-labelledby', b.id);
          if (focus) b.focus({ preventScroll: true });
          if (byUser) revealTab(b);
        }
      });
      render();
    }

    function matches(item) {
      return state.diets.every(function (d) { return (item.diets || []).indexOf(d) >= 0; });
    }

    function dishNode(item) {
      var row = el('div', { class: 'dish-row' });
      var name = el('span', { class: 'dish-name' });
      setTextWithTodo(name, item.name);
      row.appendChild(name);

      var hasPrice = typeof item.price === 'number';
      if (hasPrice || SITE.showTodo) {
        row.appendChild(el('span', { class: 'dish-leader', 'aria-hidden': 'true' }));
        var price = el('span', { class: 'dish-price' + (hasPrice ? '' : ' is-todo') });
        if (hasPrice) {
          price.appendChild(document.createTextNode(String(item.price)));
          price.appendChild(el('small', { text: data.currency }));
        } else price.appendChild(todo());
        row.appendChild(price);
      }

      var li = el('li', { class: 'dish' }, [row]);
      if (item.desc) li.appendChild(el('p', { class: 'dish-desc', text: item.desc }));

      var chips = (item.diets || []).filter(function (d) { return dietLabel[d]; });
      var allergens = item.allergens || [];
      if (chips.length || allergens.length) {
        var meta = el('div', { class: 'dish-meta' });
        if (chips.length) {
          var ul = el('ul', { class: 'chips', 'aria-label': 'Diety' });
          chips.forEach(function (d) { ul.appendChild(el('li', { class: 'chip chip-' + d, text: dietLabel[d] })); });
          meta.appendChild(ul);
        }
        if (allergens.length) {
          meta.appendChild(el('span', { class: 'allergens', text: 'Alergeny: ' + allergens.join(', ') }));
        }
        li.appendChild(meta);
      }
      return li;
    }

    function render() {
      var cats = data.categories.filter(function (c) { return state.cat === 'all' || c.id === state.cat; });
      var count = 0;
      panel.replaceChildren();

      cats.forEach(function (c) {
        var items = c.items.filter(matches);
        if (!items.length) return;
        count += items.length;
        var list = el('ul', { class: 'dishes' });
        items.forEach(function (it) { list.appendChild(dishNode(it)); });
        panel.appendChild(el('section', { class: 'cat' }, [el('h3', { class: 'cat-title', text: c.title }), list]));
      });

      if (!count) {
        var msg = el('p', { class: 'board-empty', text: 'Pro tenhle výběr zatím nic nemáme.' });
        if (state.diets.length) {
          var reset = el('button', { type: 'button', text: 'Zrušit filtr' });
          reset.addEventListener('click', function () {
            state.diets = [];
            $$('.diet-btn', filterEl).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
            render();
          });
          msg.appendChild(reset);
        }
        panel.appendChild(msg);
      }
      status.textContent = 'Zobrazeno ' + count + ' ' + plural(count, 'položka', 'položky', 'položek') + '.';
    }

    /* seznam alergenů 1–14 */
    var legend = $('#allergen-legend'), list = $('#allergen-list');
    if (data.allergens && list) {
      Object.keys(data.allergens).forEach(function (n) {
        list.appendChild(el('li', {}, [el('b', { text: n }), document.createTextNode(' ' + data.allergens[n])]));
      });
      legend.hidden = false;
    }

    selectTab('all', false);
  }

  /* ------------------------------------------------------------------
     Galerie a lightbox
     ------------------------------------------------------------------ */
  function initLightbox() {
    var tiles = $$('#gallery .tile');
    var dlg = $('#lightbox');
    if (!tiles.length || !dlg || typeof dlg.showModal !== 'function') return;
    var stage = $('#lb-stage'), current = 0;

    function show(i) {
      current = (i + tiles.length) % tiles.length;
      var art = $('.tile-art', tiles[current]).firstElementChild;
      stage.replaceChildren(art.cloneNode(true));
    }
    function open(i) {
      show(i);
      dlg.showModal();
      document.documentElement.classList.add('lb-open');
    }

    tiles.forEach(function (t, i) { t.addEventListener('click', function () { open(i); }); });
    $('#lb-close').addEventListener('click', function () { dlg.close(); });
    $('#lb-prev').addEventListener('click', function () { show(current - 1); });
    $('#lb-next').addEventListener('click', function () { show(current + 1); });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });

    /* přejetí prstem */
    var startX = null;
    stage.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () { startX = null; });
  }

  /* ------------------------------------------------------------------
     Odhalení nadpisů při scrollu (průhlednost + lehký posun)
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    items.forEach(function (n) { io.observe(n); });
    /* třída se přidá až po zapojení pozorovatele, takže při chybě nic nezůstane skryté */
    document.documentElement.classList.add('js-ok');
  }

  /* ------------------------------------------------------------------
     Start (každá část zvlášť, chyba v jedné nezastaví ostatní)
     ------------------------------------------------------------------ */
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  function start() {
    safe(initReveal);
    safe(renderOpenTag);
    safe(renderContact);
    safe(renderJsonLd);
    safe(initMenu);
    safe(initLightbox);
    safe(function () { $('#year').textContent = String(new Date().getFullYear()); });
    setInterval(function () { safe(renderOpenTag); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
