// Адрес вашего Cloudflare Worker, который пересылает заявки в Telegram.
// Пока пусто — заявки открываются в WhatsApp.
const WORKER_URL = 'Stroykompas86_bot';
const WA = '79966889979';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const SV = { painting: ['Малярные работы', 380, 'м²'], tiling: ['Укладка плитки', 800, 'м²'], electrical: ['Электрика', 450, 'точка'], plumbing: ['Сантехника', 2000, 'точка'] };
const say = (el, t, e) => { el.textContent = t; el.classList.toggle('e', !!e); };

async function send(d) {
  if (!WORKER_URL) { open('https://wa.me/' + WA + '?text=' + encodeURIComponent(d.message), '_blank'); return 'wa'; }
  const r = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  if (!r.ok) throw Error(r.status);
  return 'tg';
}

async function go(btn, st, d) {
  if (d.phone.replace(/\D/g, '').length < 10) return say(st, 'Укажите телефон: минимум 10 цифр.', 1);
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
    calc.msg = `Здравствуйте! Хочу рассчитать работы${nm ? ' (' + nm + ')' : ''}:\n${L.join('\n') || '—'}\nОриентировочно: ${fmt(t)}${cm ? '\nКомментарий: ' + cm : ''}`;
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
});
