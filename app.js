// Адрес вашего Cloudflare Worker, который пересылает заявки в Telegram.
// Пока пусто — заявки открываются в WhatsApp.
const WORKER_URL = 'https://super-pine-e648.shamanvaliev07.workers.dev';
const WA = '79966889979';
const REVIEWS = []; // отзывы для показа: { n: 'Имя', r: 5, t: 'Текст отзыва', d: 'Октябрь 2026' }
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const SV = { painting: ['Малярные работы', 420, 'м²'], tiling: ['Укладка плитки', 880, 'м²'], electrical: ['Электрика', 500, 'точка'], plumbing: ['Сантехника', 2200, 'точка'] };
const say = (el, t, e) => { el.textContent = t; el.classList.toggle('e', !!e); };

async function send(d) {
  if (!WORKER_URL) { open('https://wa.me/' + WA + '?text=' + encodeURIComponent(d.message), '_blank'); return 'wa'; }
  const r = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(d) });
  if (!r.ok) throw Error(r.status);
  return 'tg';
}

async function go(btn, st, d) {
  const bx = btn.closest('form,.card'), cb = bx && bx.querySelector('input[type=checkbox]');
  if (cb && !cb.checked) return say(st, 'Отметьте согласие на обработку персональных данных.', 1);
  if (d.phone !== undefined && d.phone.replace(/\D/g, '').length < 10) return say(st, 'Укажите телефон: минимум 10 цифр.', 1);
  btn.disabled = true; say(st, 'Отправляем…');
  try {
    const r = await send(d);
    say(st, r === 'tg' ? 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.' : 'Открыли WhatsApp — отправьте сообщение там.');
  } catch (e) {
    say(st, 'Не удалось отправить. Напишите в WhatsApp или позвоните: +7 996 688-99-79.', 1);
  } finally { btn.disabled = false; }
}

function calc() {
  const box = $('#rows'); if (!box) return;
  const opts = Object.entries(SV).map(([i, v]) => `<option value="${i}">${v[0]} — ${fmt(v[1])}/${v[2]}</option>`).join('');
  const upd = () => {
    let t = 0, L = [];
    $$('.row', box).forEach(d => {
      const v = SV[$('select', d).value], q = Math.max(0, +$('input', d).value || 0);
      $('.u', d).textContent = v[2];
      if (q) { t += q * v[1]; L.push(`• ${v[0]}: ${q} ${v[2]} × ${fmt(v[1])} = ${fmt(q * v[1])}`); }
    });
    $('#tot').textContent = fmt(t);
    const nm = $('#nm').value.trim(), cm = $('#cm').value.trim();
    calc.msg = `Здравствуйте! Хочу рассчитать работы${nm ? ' (' + nm + ')' : ''}:\n${L.join('\n') || '—'}\nСтоимость: ${fmt(t)}${cm ? '\nКомментарий: ' + cm : ''}`;
    $('#wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(calc.msg);
  };
  const add = (s = 'painting', q = 10) => {
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<select aria-label="Вид работ">${opts}</select><input type="number" min="0" step="0.1" inputmode="decimal" aria-label="Объём"><span class="u"></span><button type="button" class="x" aria-label="Убрать строку">×</button>`;
    $('select', d).value = s; $('input', d).value = q;
    $('.x', d).onclick = () => { if ($$('.row', box).length > 1) { d.remove(); upd(); } };
    box.append(d); upd();
  };
  box.oninput = upd; $('#nm').oninput = upd; $('#cm').oninput = upd;
  $('#add').onclick = () => add('painting', 1);
  const h = location.hash.slice(1); add(SV[h] ? h : 'painting');
  $('#ask').onclick = e => go(e.target, $('#st'), { name: $('#nm').value.trim(), phone: $('#ph').value, message: calc.msg + '\nТелефон: ' + $('#ph').value });
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(calc.msg); say($('#st'), 'Расчёт скопирован.'); } catch (e) { say($('#st'), 'Не удалось скопировать.', 1); } };
  $('#pr').onclick = () => print();
}

document.addEventListener('DOMContentLoaded', () => {
  const y = $('#yr'); if (y) y.textContent = new Date().getFullYear();
  const nav = $('.nav'), b = $('.burger');
  b.onclick = () => b.setAttribute('aria-expanded', nav.classList.toggle('open'));
  $$('.links a').forEach(a => a.onclick = () => nav.classList.remove('open'));
  calc();
  const f = $('#cf');
  if (f) f.onsubmit = e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f)); if (v.site) return;
    go($('button', f), $('#cs'), { name: v.name, phone: v.phone, message: `Заявка с сайта\nИмя: ${v.name || '—'}\nТелефон: ${v.phone}\n${v.text || ''}` });
  };
  const rv = $('#rv');
  if (rv) rv.innerHTML = REVIEWS.length ? REVIEWS.map(x => `<div class="card"><div class="pr"><span>${'★'.repeat(x.r || 5)}</span><span>${esc(x.d || '')}</span></div><p style="color:var(--tx)">${esc(x.t)}</p><b>${esc(x.n)}</b></div>`).join('') : '<div class="card"><h3>Здесь появятся отзывы клиентов</h3><p style="margin:10px 0 0">Станьте первым — оставьте отзыв ниже.</p></div>';
  const rf = $('#rf');
  if (rf) rf.onsubmit = e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(rf)); if (v.site) return;
    if (!v.name.trim() || v.text.trim().length < 10) return say($('#rs'), 'Укажите имя и напишите отзыв (от 10 символов).', 1);
    go($('button', rf), $('#rs'), { name: v.name, message: `Новый отзыв (на модерацию)\nИмя: ${v.name}\nОценка: ${v.rate}/5\n${v.text}` });
  };
});

document.addEventListener('DOMContentLoaded', () => {
  const it = $('#intro'), bh = $('#bh'), bp = $('#bp'), hero = $('.hero'), src = $('svg', bh);
  const cl = c => { const n = src.cloneNode(true); n.setAttribute('class', c); return n; };
  if (hero) hero.prepend(cl('hh static'));
  $$('.pic').forEach(x => x.prepend(cl('static')));
  const bd = $$('.d', bh);
  const prog = () => {
    const m = document.documentElement.scrollHeight - innerHeight, p = m > 40 ? Math.min(1, Math.max(0, scrollY / m)) : 1;
    bd.forEach((d, i) => { d.style.strokeDashoffset = 1 - Math.min(1, Math.max(0, p * bd.length - i)); });
    bp.textContent = Math.round(p * 100) + '%'; bh.classList.toggle('lit', p > .97);
  };
  addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog); addEventListener('load', prog); prog();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
  $$('.card,.sh,.ph>.w,.split>*,.cta,details').forEach(e => { e.classList.add('r0'); io.observe(e); });
  if (!it) return;
  let seen = 0; try { seen = sessionStorage.getItem('i'); } catch (e) {}
  if (seen || matchMedia('(prefers-reduced-motion:reduce)').matches) { it.remove(); return; }
  try { sessionStorage.setItem('i', 1); } catch (e) {}
  const end = () => { it.classList.add('off'); setTimeout(() => it.remove(), 900); };
  $('#sk').onclick = end; setTimeout(end, 5200);
});
