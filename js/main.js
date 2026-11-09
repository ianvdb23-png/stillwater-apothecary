// Stillwater Apothecary: landingspagina
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  document.documentElement.classList.add('motion');
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* geen opslag, geen probleem */ } },
  };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- titel: letters om te laten zinken ---------- */
  let c = 0;
  $$('.hero__title .line').forEach((line) => {
    line.innerHTML = [...line.textContent].map((ch) => `<span class="ch" style="--c:${c++}">${ch}</span>`).join('');
  });

  /* ---------- koppen: masker waaruit ze opkomen ---------- */
  $$('main h2').forEach((h) => { h.innerHTML = `<span class="rise-mask"><span>${h.innerHTML}</span></span>`; });

  const filmTitle = $('.film__title .rise-mask > span');
  if (filmTitle) { let k = 0; filmTitle.innerHTML = [...filmTitle.textContent].map((ch) => `<span class="ch" style="--c:${k++}">${ch}</span>`).join(''); }

  /* ---------- stille rimpelingen achter secties ---------- */
  $$('[data-rings]').forEach((sec) => {
    sec.insertAdjacentHTML('afterbegin', '<svg class="rings" viewBox="0 0 1000 360" aria-hidden="true">' +
      '<ellipse cx="500" cy="180" rx="498" ry="178"/>'.repeat(5) + '</svg>');
  });

  /* ---------- aftelling in de hero ---------- */
  const countdownEl = $('[data-countdown]');
  let bedMin = 23 * 60;
  const two = (n) => String(n).padStart(2, '0');
  const clock = (m) => { m = ((m % 1440) + 1440) % 1440; return `${two(Math.floor(m / 60))}:${two(m % 60)}`; };
  const updateCountdown = () => {
    if (!countdownEl) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const start = bedMin - 60;
    const since = ((nowMin - start) % 1440 + 1440) % 1440;
    const until = (1440 - since) % 1440;
    let text;
    if (since < 60) text = `Je avondritueel is begonnen. Tijd om het licht te dimmen.`;
    else if (until < 60) text = `Over <strong>${until} min</strong> begint je avondritueel, om ${clock(start)}.`;
    else text = `Over <strong>${Math.floor(until / 60)} u ${until % 60} min</strong> begint je avondritueel, om ${clock(start)}.`;
    countdownEl.innerHTML = `${text} <a href="#ritueel">Andere bedtijd?</a>`;
  };
  setInterval(updateCountdown, 30000);

  /* ---------- live ding: jouw ritueel op jouw bedtijd ---------- */
  const bedtime = $('[data-bedtime]');
  if (bedtime) {
    const range = $('input[type="range"]', bedtime);
    const clockEl = $('[data-clock]', bedtime);
    const ics = $('[data-ics]');
    const pad = (n) => String(n).padStart(2, '0');
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const fmt = (m) => { m = ((m % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };

    const apply = (time) => {
      const bed = toMin(time);
      $$('[data-at]').forEach((el) => { el.textContent = fmt(bed + Number(el.dataset.at)); });
      bedMin = bed;
      updateCountdown();
      const close = $('.close p');
      if (close) close.textContent = `Vanavond al beginnen? Dim om ${fmt(bed - 60)} het licht. De rest van het ritueel sturen we je per mail.`;
      if (ics) ics.href = icsFor(bed);
      store.set('sw-bedtijd', time);
    };

    const icsFor = (bed) => {
      const d = new Date();
      const start = bed - 60;
      const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      const t = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}${pad(((m % 60) + 60) % 60)}00`;
      const body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stillwater Apothecary//Avondritueel//NL',
        'BEGIN:VEVENT',
        `UID:avondritueel-${day}@stillwater`,
        `DTSTAMP:${day}T000000`,
        `DTSTART:${day}T${t(start)}`,
        'DURATION:PT1H',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Avondritueel: laat de dag bezinken',
        `DESCRIPTION:${fmt(start)} Dim het licht.\\n${fmt(bed - 45)} Giet water van 90 °C over je thee.\\n${fmt(bed - 35)} Tien minuten niets.`,
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
    };

    const fromRange = () => fmt(Number(range.value));
    const paint = () => {
      const pct = ((range.value - range.min) / (range.max - range.min)) * 100;
      range.style.setProperty('--fill', pct + '%');
      clockEl.textContent = fromRange();
      range.setAttribute('aria-valuetext', fromRange());
    };
    range.addEventListener('input', () => { paint(); apply(fromRange()); });

    const saved = store.get('sw-bedtijd');
    const start = saved && /^\d\d:\d\d$/.test(saved) ? saved : '23:00';
    let v = toMin(start); if (v < 720) v += 1440;
    range.value = String(Math.min(1500, Math.max(1260, v)));
    paint();
    apply(fromRange());
  }

  /* ---------- video: speelt alleen in beeld, pauzeerbaar ---------- */
  const video = $('[data-video]');
  const toggle = $('[data-video-toggle]');
  if (video) {
    let userPaused = reduce.matches;
    const sync = () => {
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-label', userPaused ? 'Speel video af' : 'Pauzeer video');
    };
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      if (userPaused) video.pause(); else video.play().catch(() => {});
      sync();
    });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.25 }).observe(video);
    sync();
    const ring = $('[data-ring]');
    if (ring) {
      const C = 138.2;
      const loop = () => {
        if (video.duration) ring.style.strokeDashoffset = String(C * (1 - video.currentTime / video.duration));
        if (!video.paused) requestAnimationFrame(loop);
      };
      video.addEventListener('play', () => requestAnimationFrame(loop));
      video.addEventListener('seeked', loop);
    }
  }

  /* ---------- blends: rij kiest het beeld ---------- */
  const preview = $('[data-preview]');
  const rows = $$('.index__row');
  const show = (row) => {
    rows.forEach((r) => r.setAttribute('aria-pressed', String(r === row)));
    const frame = $('[data-frame]');
    if (frame && row.dataset.tint) frame.style.setProperty('--tint', row.dataset.tint);
    if (!preview || preview.getAttribute('src') === row.dataset.img) return;
    preview.classList.add('is-swapping');
    const next = new Image();
    next.src = row.dataset.img;
    next.decode().catch(() => {}).finally(() => {
      preview.src = row.dataset.img;
      preview.width = row.dataset.w; preview.height = row.dataset.h;
      preview.alt = row.dataset.alt;
      preview.classList.remove('is-swapping');
    });
  };
  rows.forEach((r) => {
    r.addEventListener('click', () => show(r));
    r.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(r); });
    r.addEventListener('focus', () => show(r));
  });

  /* ---------- formulier: MailerLite ---------- */
  const form = $('[data-form]');
  if (form) {
    const fields = {
      name: { el: $('#f-name'), err: $('#f-name-err'), ok: (v) => v.trim().length > 0 },
      email: { el: $('#f-email'), err: $('#f-email-err'), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
      optin: { el: $('#f-optin'), err: $('#f-optin-err'), ok: () => $('#f-optin').checked },
    };
    const status = $('[data-status]');
    const submit = $('[data-submit]');

    // ingevulde gegevens gaan niet verloren
    ['name', 'email'].forEach((k) => {
      const v = store.get('sw-form-' + k);
      if (v) fields[k].el.value = v;
      fields[k].el.addEventListener('input', () => store.set('sw-form-' + k, fields[k].el.value));
    });

    const check = (k, show) => {
      const f = fields[k];
      const valid = f.ok(f.el.value);
      if (show || f.el.getAttribute('aria-invalid') === 'true') {
        f.el.setAttribute('aria-invalid', String(!valid));
        f.err.hidden = valid;
      }
      return valid;
    };
    Object.keys(fields).forEach((k) => {
      const f = fields[k];
      f.el.addEventListener(f.el.type === 'checkbox' ? 'change' : 'blur', () => { if (f.el.value || f.el.type === 'checkbox') check(k, true); });
      f.el.addEventListener('input', () => check(k, false));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const results = Object.keys(fields).map((k) => [k, check(k, true)]);
      const firstBad = results.find(([, ok]) => !ok);
      if (firstBad) { fields[firstBad[0]].el.focus(); return; }

      submit.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      submit.textContent = 'Even geduld…';
      status.textContent = '';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          const msg = data?.errors?.fields?.email?.[0];
          throw new Error(msg ? 'Dit e-mailadres wordt niet aanvaard. Controleer het en probeer opnieuw.' : 'send');
        }
        $('[data-name]').textContent = fields.name.el.value.trim();
        $('[data-form-body]').hidden = true;
        const done = $('[data-form-done]');
        done.hidden = false;
        done.focus();
        ['name', 'email'].forEach((k) => store.set('sw-form-' + k, ''));
        document.documentElement.classList.add('is-subscribed');
      } catch (err) {
        status.textContent = err.message !== 'send' ? err.message : 'Je inschrijving is niet verstuurd. Controleer je internetverbinding en probeer opnieuw; je gegevens staan er nog.';
      } finally {
        submit.removeAttribute('aria-busy');
        submit.disabled = false;
        submit.textContent = 'Stuur me de avondgids';
      }
    });
  }

  /* ---------- entrances: kop, tekst, beeld ---------- */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const groups = [
      ['.story__title', '.story__item'],
      ['.ritual__intro h2', '.ritual__intro > p', '.bedtime'],
      ['.blends__list h2', '.blends__lead', '.index > li', '.blends__frame'],
      ['.signup__offer h2', '.signup__offer > p', '.nights li', '.form'],
      ['.faq__text h2', '.faq__facts', '.faq__list details', '.faq__text > .btn', '.faq__tall', '.faq__square'],
      ['.close p', '.close .btn'],
      ['.foot__top', '.foot__mark', '.foot__legal'],
    ];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    groups.forEach((sels) => {
      let i = 0;
      sels.forEach((sel) => $$(sel).forEach((el) => { el.dataset.reveal = ''; el.style.setProperty('--i', String(Math.min(i++, 8))); io.observe(el); }));
    });
    $$('.panel__verb span').forEach((el) => { el.dataset.reveal = ''; io.observe(el); });
    $$('.story__item').forEach((el) => el.style.setProperty('--i', '0'));

  }

  /* ---------- scroll: de maan gaat onder, de avond wordt nacht, de thee trekt ---------- */
  const moon = $('[data-moon]');
  const steep = $('[data-steep]');
  const steepTime = $('[data-steep-time]');
  const tea = $('[data-tea]');
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const DUSK = [44, 33, 64], NIGHT = [26, 19, 38];
  const film = $('[data-film]');
  const filmFrame = $('[data-film-frame]');
  const filmWords = $$('.film__word');
  const filmCaption = $('[data-film-caption]');
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const depth = { x: 0, y: 0 };
  const placeMoon = () => {
    if (!moon) return;
    const off = reduce.matches ? 0 : Math.min(scrollY, innerHeight) * 0.45;
    moon.style.translate = `calc(-50% + ${depth.x * -0.5}px) calc(-50% + ${off + depth.y * -0.5}px)`;
  };
  let ticking = false;
  const dim = $('[data-dim]');
  const dimStage = dim && $('.dim__stage', dim);
  const switchBtn = $('[data-switch]');
  let lightsOff = false;
  const smooth = { film: 0, steep: 0, dim: 0 };
  const target = { film: 0, steep: 0, dim: 0 };
  const progress = (el) => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))); };
  const lerpRGB = (a, b, k) => `rgb(${mix(a, b, k).join(' ')})`;
  let smoothing = false;
  const applySmooth = () => {
    let busy = false;
    for (const k in smooth) {
      const d = target[k] - smooth[k];
      smooth[k] = reduce.matches || Math.abs(d) < 0.0005 ? target[k] : smooth[k] + d * 0.14;
      if (smooth[k] !== target[k]) busy = true;
    }
    paintFilm(smooth.film); paintSteep(smooth.steep); paintDim(smooth.dim);
    if (busy) requestAnimationFrame(applySmooth); else smoothing = false;
  };
  const kick = () => { if (!smoothing) { smoothing = true; requestAnimationFrame(applySmooth); } };
  const paintFilm = (p) => {
    if (!film || !filmFrame) return;
    const e = reduce.matches ? 1 : ease(Math.min(1, p / 0.62));
    const phone = innerWidth <= 640;
    const s0 = phone ? 0.72 : 0.38;
    const sc = s0 + (1 - s0) * e;
    filmFrame.style.setProperty('--s', sc.toFixed(4));
    filmFrame.style.setProperty('--fr', `${(28 * (1 - e)) / sc}px`);
    filmWords.forEach((w, i) => {
      w.style.setProperty(i ? '--wr' : '--wl', `${(i ? 1 : -1) * e * innerHeight * 0.4}px`);
      w.style.opacity = String(Math.max(0, 1 - e * 1.4));
    });
    const co = Math.min(1, Math.max(0, (p - 0.66) / 0.14));
    film.style.setProperty('--co', String(co));
    filmCaption.classList.toggle('is-shown', co > 0.4);
  };
  const paintSteep = (p) => {
    if (!steep) return;
    const left = Math.round(300 * (1 - p));
    steepTime.textContent = `${Math.floor(left / 60)}:${two(left % 60)}`;
    tea.style.transform = `scaleY(${0.04 + 0.96 * p})`;
    tea.style.opacity = String(0.35 + 0.6 * p);
  };
  const ROOM = [232, 217, 190];
  const paintDim = (p) => {
    if (!dimStage) return;
    const d = lightsOff ? 1 : Math.min(1, Math.max(0, (p - 0.08) / 0.6));
    dimStage.style.setProperty('--d', d.toFixed(3));
    const room = d < 0.5 ? lerpRGB(ROOM, [116, 83, 162], d * 2) : lerpRGB([116, 83, 162], NIGHT, (d - 0.5) * 2);
    dimStage.style.setProperty('--room', room);
    dimStage.style.setProperty('--verb', d < 0.35 ? '#1A1326' : '#F6F1EA');
    dimStage.style.setProperty('--ph', Math.max(0, (d - 0.55) / 0.45).toFixed(3));
  };
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      lightsOff = !lightsOff;
      switchBtn.setAttribute('aria-pressed', String(lightsOff));
      $('[data-switch-label]').textContent = lightsOff ? 'Grote lampen weer aan' : 'Grote lampen uit';
      dimStage.style.transition = 'background-color 900ms cubic-bezier(0.22,1,0.36,1)';
      paintDim(smooth.dim);
    });
    dimStage.addEventListener('pointermove', (e) => {
      const r = dimStage.getBoundingClientRect();
      dimStage.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
      dimStage.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }
  const onScroll = () => {
    ticking = false;
    if (film) target.film = progress(film);
    if (steep) target.steep = progress(steep);
    if (dim) target.dim = progress(dim);
    kick();
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = Math.min(1, y / Math.max(1, max * 0.35));
    document.body.style.setProperty('--sky', `rgb(${mix(DUSK, NIGHT, k).join(' ')})`);
    placeMoon();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- het wateroppervlak in de hero ---------- */
  const canvas = $('[data-water]');
  const stage = $('[data-stage]');
  const product = $('[data-product]');
  if (canvas && stage && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const src = document.createElement('canvas');
    const sctx = src.getContext('2d');
    let W = 0, H = 0, dpr = 1, horizon = 0, t = 0, running = false, visible = true, last = 0;
    const ripples = [];
    const petals = [];
    const stars = [];
    const still = reduce.matches;

    const layout = () => {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      horizon = H * 0.66;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      src.width = canvas.width; src.height = Math.round((H - horizon) * dpr) || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars.length = 0;
      for (let i = 0; i < Math.round(W * horizon / 9000); i++) stars.push({ x: Math.random() * W, y: Math.random() * horizon * 0.92, r: Math.random() * 1.1 + 0.3, ph: Math.random() * 6, sp: 0.6 + Math.random() * 1.6 });
      petals.length = 0;
      const n = still ? 0 : Math.round(Math.min(9, W / 160));
      for (let i = 0; i < n; i++) petals.push(newPetal(true));
    };
    const newPetal = (anywhere) => ({
      x: Math.random() * W, y: anywhere ? Math.random() * horizon : -20,
      vy: 0.18 + Math.random() * 0.22, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.01,
      s: 4 + Math.random() * 4, ph: Math.random() * 6,
    });
    const addRipple = (x, y, amp = 1) => {
      ripples.push({ x, y, age: 0, amp });
      if (ripples.length > 14) ripples.shift();
    };

    const buildReflection = () => {
      const sr = stage.getBoundingClientRect();
      const wh = H - horizon;
      sctx.clearRect(0, 0, W, wh);
      if (moon) {
        const m = moon.getBoundingClientRect();
        const cx = m.left - sr.left + m.width / 2, cy = m.top - sr.top + m.height / 2;
        sctx.fillStyle = '#7453A2';
        sctx.beginPath(); sctx.arc(cx, horizon - cy, m.width / 2, 0, Math.PI * 2); sctx.fill();
      }
      if (product && product.complete && product.naturalWidth) {
        const p = product.getBoundingClientRect();
        const px = p.left - sr.left, py = p.top - sr.top;
        sctx.save(); sctx.scale(1, -1); sctx.globalAlpha = 0.6;
        sctx.drawImage(product, px, -(horizon - py), p.width, p.height);
        sctx.restore();
      }
      sctx.globalCompositeOperation = 'source-atop';
      sctx.fillStyle = 'rgba(18, 13, 27, 0.38)';
      sctx.fillRect(0, 0, W, wh);
      sctx.globalCompositeOperation = 'source-over';
    };

    const draw = () => {
      const wh = H - horizon;
      ctx.clearRect(0, 0, W, H);
      for (const st of stars) {
        ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * st.sp + st.ph));
        ctx.fillStyle = '#F6F1EA';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        if (st.y > horizon * 0.35) { ctx.globalAlpha *= 0.35; ctx.fillRect(st.x + Math.sin(t + st.ph) * 2, 2 * horizon - st.y, st.r * 2.4, 1); }
      }
      ctx.globalAlpha = 1;
      buildReflection();
      for (let y = 0; y < wh; y += 2) {
        const d = y / wh;
        const sy = horizon + y;
        let dx = Math.sin(y * 0.09 + t * 1.4) * (1 + 7 * d);
        for (const r of ripples) {
          const dist = Math.abs(sy - r.y);
          dx += r.amp * 9 * Math.exp(-r.age * 0.9) * Math.sin(dist * 0.07 - r.age * 5) * Math.exp(-dist / 140);
        }
        ctx.globalAlpha = 0.9 * Math.pow(1 - d, 1.4);
        ctx.drawImage(src, 0, Math.round(y * dpr), src.width, Math.round(2 * dpr), dx, sy, W, 2);
      }
      // maanlicht: een spoor van glinsteringen onder de maan
      if (moon) {
        const m = moon.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        const mx = m.left - sr.left + m.width / 2;
        ctx.fillStyle = '#DED4ED';
        for (let i = 0; i < 46; i++) {
          const yy = horizon + 6 + ((i * 37) % (wh - 10));
          const spread = m.width * (0.18 + 0.5 * ((yy - horizon) / wh));
          const xx = mx + Math.sin(i * 12.9898 + t * 0.6) * spread;
          ctx.globalAlpha = Math.max(0, Math.sin(t * 1.7 + i * 2.1)) * 0.5 * (1 - (yy - horizon) / wh);
          ctx.fillRect(xx, yy, 10 + (i % 5) * 7, 1.5);
        }
      }
      ctx.globalAlpha = 1;
      // rimpels: stille ellipsen die uitlopen
      for (const r of ripples) {
        for (let k = 0; k < 2; k++) {
          const a = r.age - k * 0.35;
          if (a <= 0) continue;
          const rx = a * 110 * r.amp + 6;
          const alpha = Math.max(0, 0.32 * (1 - a / 2.6));
          if (!alpha) continue;
          ctx.strokeStyle = `rgba(222, 212, 237, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, rx * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // kamilleblaadjes die bezinken
      ctx.fillStyle = 'rgba(246, 241, 234, 0.85)';
      for (const p of petals) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };

    const step = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now; t += dt;
      for (const r of ripples) r.age += dt;
      while (ripples.length && ripples[0].age > 3) ripples.shift();
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.vy * dt * 60; p.x += Math.sin(t * 0.8 + p.ph) * 0.25; p.rot += p.vr * dt * 60;
        if (p.y >= horizon) { addRipple(p.x, horizon + 3, 0.55); petals[i] = newPetal(false); }
      }
      if (Math.random() < dt * 0.35) addRipple(Math.random() * W, horizon + 10 + Math.random() * (H - horizon) * 0.6, 0.7);
      draw();
      requestAnimationFrame(step);
    };
    const start = () => { if (running || still || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(step); };
    const stop = () => { running = false; };

    let lastPointer = 0;
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      if (!still && e.pointerType === 'mouse') {
        depth.x = (e.clientX / innerWidth - 0.5) * 40;
        depth.y = (e.clientY / innerHeight - 0.5) * 24;
        if (product) product.style.translate = `calc(-50% + ${depth.x * 0.6}px) ${depth.y * 0.3}px`;
        placeMoon();
      }
      if (still || e.timeStamp - lastPointer < 90) return;
      const sr = stage.getBoundingClientRect();
      const x = e.clientX - sr.left, y = e.clientY - sr.top;
      if (y > horizon && y < H) { lastPointer = e.timeStamp; addRipple(x, y, 0.6); }
    });
    hero.addEventListener('pointerdown', (e) => {
      if (still) return;
      const sr = stage.getBoundingClientRect();
      const x = e.clientX - sr.left, y = e.clientY - sr.top;
      if (y > horizon - 40 && y < H) addRipple(x, Math.max(y, horizon + 4), 1.3);
    });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(stage);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); draw(); }, 150); });
    const boot = () => { layout(); draw(); start(); };
    if (product && !product.complete) product.addEventListener('load', boot, { once: true }); else boot();
    if (!still) addEventListener('scroll', () => { if (!running) draw(); }, { passive: true });
  }

  /* ---------- wacht: een minuut ademen met de maan ---------- */
  const starsBox = $('[data-stars]');
  if (starsBox) {
    let html = '';
    for (let i = 0; i < 70; i++) html += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;--tw:${2 + Math.random() * 5}s;transform:scale(${0.6 + Math.random() * 1.2})"></i>`;
    starsBox.innerHTML = html;
  }
  const breatheBtn = $('[data-breathe-btn]');
  const cue = $('[data-cue]');
  if (breatheBtn) {
    let session = null;
    const stopSession = (msg) => {
      if (session) { session.anims.forEach((a) => a.cancel()); clearTimeout(session.timer); session = null; }
      breatheBtn.classList.remove('is-breathing');
      if (msg) cue.textContent = msg;
    };
    breatheBtn.addEventListener('click', () => {
      if (session) { stopSession('Gestopt. Tik opnieuw wanneer je wil.'); return; }
      breatheBtn.classList.add('is-breathing');
      session = { anims: [], timer: 0 };
      let round = 0;
      const cycle = () => {
        if (!session) return;
        if (round === 6) { stopSession('Mooi. Zo voelt een minuut niets. Nog negen te gaan.'); return; }
        round++;
        cue.textContent = `Adem in… (${round}/6)`;
        if (!reduce.matches) session.anims.push(breatheBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }], { duration: 4000, easing: 'cubic-bezier(0.37,0,0.63,1)', fill: 'forwards' }));
        session.timer = setTimeout(() => {
          if (!session) return;
          cue.textContent = `Adem uit… (${round}/6)`;
          if (!reduce.matches) session.anims.push(breatheBtn.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 6000, easing: 'cubic-bezier(0.37,0,0.63,1)', fill: 'forwards' }));
          session.timer = setTimeout(cycle, 6000);
        }, 4000);
      };
      cycle();
    });
  }

  /* ---------- bijsluiter: antwoorden schuiven zacht open en dicht ---------- */
  $$('.leaflet details').forEach((d) => {
    const sum = $('summary', d);
    const body = $('.faq__a', d);
    sum.addEventListener('click', (e) => {
      if (reduce.matches) return;
      e.preventDefault();
      if (d.open) {
        const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(0.4,0,1,1)' });
        a.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      }
    });
  });

  /* ---------- waar je klikt, rimpelt het water ---------- */
  if (!reduce.matches) {
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('input, textarea, select, label, video')) return;
      const d = document.createElement('span');
      d.className = 'tap-ripple';
      d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1300);
    });
    // magnetische knoppen
    $$('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  /* ---------- mobiele dock: weg bij hero en formulier ---------- */
  const dock = $('[data-dock]');
  if (dock) {
    const seen = new Map();
    const update = () => {
      const hide = [...seen.values()].some(Boolean) || document.documentElement.classList.contains('is-subscribed');
      dock.toggleAttribute('data-hidden', hide);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      update();
    }, { threshold: 0.15 });
    ['.hero', '#avondgids', '.close', '.foot'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
    dock.setAttribute('data-hidden', '');
  }
})();
