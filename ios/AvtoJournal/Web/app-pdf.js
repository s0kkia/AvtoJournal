/* АвтоЖурнал — экспорт PDF */
'use strict';

var PDF_LIB_LOADING = null;
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { resolve(); };
    s.onerror = function () { reject(new Error('Не удалось загрузить ' + src)); };
    document.head.appendChild(s);
  });
}
function ensurePdfLib() {
  if (window.jspdf && window.jspdf.jsPDF && window.DV_SANS && window.DV_SANS_BOLD) return Promise.resolve();
  if (PDF_LIB_LOADING) return PDF_LIB_LOADING;
  PDF_LIB_LOADING = loadScript('jspdf.umd.min.js').then(function () {
    return loadScript('fonts.js');
  });
  return PDF_LIB_LOADING;
}

var MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
var MONTHS_RU_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
function pdfDate(iso) {
  var d = parseISO(iso);
  if (isNaN(d.getTime())) return '—';
  return d.getDate() + ' ' + MONTHS_RU[d.getMonth()] + ' ' + d.getFullYear();
}
function pdfDateShort(iso) {
  var d = parseISO(iso);
  if (isNaN(d.getTime())) return '—';
  return d.getDate() + ' ' + MONTHS_RU_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}
function pdfMoney(v) {
  return nf0(num(v)).replace(/[\u00A0\u202F]/g, ' ') + ' ' + currencySign();
}
function pdfDist(km) {
  return nf0(unitValue(km)) + ' ' + unitShort();
}
var TRANSLIT = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya'
};
function slugify(s) {
  var out = String(s || '').toLowerCase().split('').map(function (ch) { return TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch; }).join('');
  out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return out || 'car';
}

async function exportPdf(carId) {
  var car = getCar(carId);
  if (!car) return;
  showLoading(true, 'Формируем PDF-отчёт…');
  try {
    await ensurePdfLib();
    var doc = buildPdfDoc(car);
    var uri = doc.output('datauristring');
    var b64 = uri.substring(uri.indexOf(',') + 1);
    var name = 'AvtoTO_' + slugify(carName(car)) + '_' + todayISO() + '.pdf';
    if (saveBinary(name, 'application/pdf', b64)) toast('PDF сохранён: Download/Программы', 'ok');
    else toast('Не удалось сохранить PDF', 'err');
  } catch (e) {
    console.error(e);
    toast('Ошибка PDF: ' + (e && e.message ? e.message : 'неизвестно'), 'err');
  } finally {
    showLoading(false);
  }
}

function groupWorks(works) {
  var arr = [], map = {};
  (works || []).forEach(function (w) {
    var k = w.cat || 'other';
    if (!map[k]) { map[k] = { cat: k, items: [] }; arr.push(map[k]); }
    map[k].items.push(w);
  });
  return arr;
}

function buildPdfDoc(car) {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('DejaVuSans.ttf', window.DV_SANS);
  doc.addFont('DejaVuSans.ttf', 'DV', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', window.DV_SANS_BOLD);
  doc.addFont('DejaVuSans-Bold.ttf', 'DV', 'bold');
  doc.setFont('DV', 'normal');

  var M = 16, W = 210, H = 297, CW = W - 2 * M;
  var INK = [16, 24, 36], MUTED = [120, 132, 148], SOFT = [155, 165, 178];
  var ACCENT = [242, 113, 28], ACCENT2 = [255, 138, 61], WHITE = [248, 250, 253];
  var LIGHT = [243, 246, 250], LINE = [230, 235, 242];
  var recs = recordsOf(car.id);
  var plans = plansSorted(car.id).filter(function (p) { return !p.done; });
  var total = recs.reduce(function (s, r) { return s + recordTotal(r); }, 0);
  var avg = recs.length ? total / recs.length : 0;
  var y = M;

  function setF(style, size, color) {
    doc.setFont('DV', style);
    doc.setFontSize(size);
    if (color) doc.setTextColor(color[0], color[1], color[2]);
  }
  function ensure(h) {
    if (y + h > H - 24) { doc.addPage(); y = M + 4; }
  }
  function fit(text, size, style, maxW) {
    setF(style, size);
    var s = String(text == null ? '—' : text);
    if (doc.getTextWidth(s) <= maxW) return s;
    while (s.length > 1 && doc.getTextWidth(s + '…') > maxW) s = s.slice(0, -1);
    return s + '…';
  }
  function sectionTitle(t) {
    ensure(16);
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.roundedRect(M, y - 3.5, 1.7, 4.6, 0.8, 0.8, 'F');
    setF('bold', 13, INK);
    doc.text(t, M + 5, y);
    y += 9;
  }
  function textBlock(lines, x, size, style, color, lineH) {
    setF(style, size, color);
    doc.text(lines, x, y, { lineHeightFactor: lineH || 1.25 });
  }

  /* ---------- Обложка ---------- */
  doc.setFillColor(15, 23, 36);
  doc.rect(0, 0, W, 112, 'F');
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(0, 0, 4, 112, 'F');
  doc.setDrawColor(34, 48, 68);
  doc.setLineWidth(0.35);
  doc.line(W - 70, 108, W, 108);

  var titleLines = doc.splitTextToSize(carName(car), car.photo ? CW - 66 : CW).slice(0, 2);
  setF('bold', 9, ACCENT2);
  doc.text('ОТЧЁТ ОБ ОБСЛУЖИВАНИИ', M, 19);
  setF('bold', 23, WHITE);
  doc.text(titleLines, M, 32, { lineHeightFactor: 1.02 });
  var subY = 32 + (titleLines.length - 1) * 9.6 + 9.5;
  setF('normal', 11, [168, 183, 202]);
  doc.text([car.year, FUELS[car.fuel]].filter(Boolean).join(' · '), M, subY);

  if (car.photo) {
    try {
      var ratio = car.photoRatio || 1.5;
      var bw = 58, bh = 38;
      var iw = bw, ih = bw / ratio;
      if (ih > bh) { ih = bh; iw = bh * ratio; }
      var ix = W - M - bw + (bw - iw) / 2;
      var iy = 18 + (bh - ih) / 2;
      var fmt = String(car.photo).indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
      doc.addImage(car.photo, fmt, ix, iy, iw, ih);
    } catch (e) { }
  } else {
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(2.4);
    doc.circle(W - M - 29, 38, 17, 'S');
    doc.setLineWidth(0.8);
    doc.setDrawColor(78, 96, 118);
    doc.circle(W - M - 29, 38, 12, 'S');
    doc.line(W - M - 29, 38, W - M - 22, 28);
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.circle(W - M - 29, 38, 2.2, 'F');
  }

  var chipY = 66;
  setF('normal', 6.8, [140, 158, 180]);
  doc.text('ПРОБЕГ', M, chipY);
  doc.text('ТОПЛИВО', M + 45, chipY);
  doc.text('ГОД', M + 90, chipY);
  doc.text('ЦВЕТ', M + 132, chipY);
  setF('bold', 10.5, WHITE);
  doc.text(fit(pdfDist(car.mileage), 10.5, 'bold', 40), M, chipY + 6);
  doc.text(fit(FUELS[car.fuel] || '—', 10.5, 'bold', 40), M + 45, chipY + 6);
  doc.text(fit(car.year || '—', 10.5, 'bold', 38), M + 90, chipY + 6);
  doc.text(fit(car.color || '—', 10.5, 'bold', 42), M + 132, chipY + 6);

  setF('normal', 6.8, [140, 158, 180]);
  doc.text('ГОСНОМЕР', M, 88);
  doc.text('VIN', M + 50, 88);
  setF('bold', 10, WHITE);
  doc.text(fit(car.plate || '—', 10, 'bold', 44), M, 95);
  setF('normal', 9, [200, 211, 225]);
  doc.text(fit(car.vin || '—', 9, 'normal', 120), M + 50, 95);

  y = 122;
  var cardW = (CW - 12) / 3, cardH = 25;
  var cards = [
    ['ЗАПИСЕЙ ТО', String(recs.length)],
    ['СУММА РАСХОДОВ', pdfMoney(total)],
    ['СРЕДНИЙ ЧЕК', pdfMoney(avg)]
  ];
  cards.forEach(function (c, i) {
    var x = M + i * (cardW + 6);
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
    setF('normal', 7, MUTED);
    doc.text(c[0], x + 4, y + 8);
    setF('bold', 11, INK);
    doc.text(fit(c[1], 11, 'bold', cardW - 8), x + 4, y + 17.5);
  });
  y += cardH + 12;

  sectionTitle('Данные автомобиля');
  var rows = [
    ['Марка и модель', carName(car)],
    ['Год выпуска', car.year || '—'],
    ['Госномер', car.plate || '—'],
    ['VIN', car.vin || '—'],
    ['Цвет', car.color || '—'],
    ['Тип топлива', FUELS[car.fuel] || '—'],
    ['Текущий пробег', pdfDist(car.mileage)],
    ['Последнее ТО', recs.length ? pdfDateShort(recs[0].date) + ' · ' + pdfDist(recs[0].mileage) : 'нет записей']
  ];
  rows.forEach(function (r) {
    ensure(8);
    setF('normal', 8.8, MUTED);
    doc.text(r[0], M, y + 4);
    setF('bold', 9.2, INK);
    doc.text(fit(r[1], 9.2, 'bold', CW - 60), W - M, y + 4, { align: 'right' });
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y + 6.2, W - M, y + 6.2);
    y += 7.6;
  });

  if (car.notes) {
    var noteLines = doc.splitTextToSize('Заметка: ' + car.notes, CW - 10);
    ensure(noteLines.length * 4.2 + 8);
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.roundedRect(M, y + 2, CW, noteLines.length * 4.2 + 6, 2, 2, 'F');
    setF('normal', 8, MUTED);
    doc.text(noteLines, M + 5, y + 6.4);
    y += noteLines.length * 4.2 + 12;
  }

  var next = nextServiceInfo(car);
  if (next) {
    ensure(26);
    doc.setFillColor(255, 245, 236);
    doc.roundedRect(M, y + 2, CW, 22, 2.5, 2.5, 'F');
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.roundedRect(M, y + 2, 1.8, 22, 0.9, 0.9, 'F');
    setF('normal', 7, MUTED);
    doc.text('СЛЕДУЮЩЕЕ ТО', M + 6, y + 8);
    setF('bold', 11, INK);
    var leftText = next.leftKm > 0 ? ('через ' + pdfDist(next.leftKm)) : 'по пробегу — пора';
    var leftDaysText = next.leftDays > 60 ? (Math.round(next.leftDays / 30) + ' мес.') : (next.leftDays > 0 ? (next.leftDays + ' дн.') : (next.leftDays === 0 ? 'сегодня' : 'просрочено'));
    doc.text(leftText + '  ·  ' + leftDaysText, M + 6, y + 15.2);
    setF('normal', 8, MUTED);
    doc.text('Ориентир: ' + pdfDateShort(next.dueDate) + ' · ' + pdfDist(next.nextKm), M + 6, y + 20.2);
    y += 30;
  }

  /* ---------- История ---------- */
  if (recs.length || y > H - 70) {
    doc.addPage();
    y = M + 4;
  } else {
    y += 10;
  }
  sectionTitle('История технического обслуживания');
  if (!recs.length) {
    setF('normal', 10, MUTED);
    doc.text('Записей технического обслуживания пока нет.', M, y + 6);
    y += 14;
  } else {
    recs.forEach(function (rec) {
      ensure(18);
      doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
      doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
      setF('bold', 9.5, INK);
      doc.text(pdfDateShort(rec.date), M + 4, y + 6.4);
      setF('normal', 8.5, MUTED);
      doc.text(pdfDist(rec.mileage), M + 52, y + 6.4);
      setF('bold', 9.5, ACCENT);
      doc.text(pdfMoney(recordTotal(rec)), W - M - 4, y + 6.4, { align: 'right' });
      y += 12;

      groupWorks(rec.works).forEach(function (g) {
        ensure(11);
        setF('bold', 7.4, ACCENT);
        doc.text(String(catName(g.cat)).toUpperCase(), M + 4, y + 4);
        y += 6.2;
        g.items.forEach(function (w) {
          var label = w.sub + (w.note ? ' — ' + w.note : '');
          var lines = doc.splitTextToSize(label, CW - 52);
          var h = Math.max(4.6, lines.length * 4.2);
          ensure(h + 3);
          setF('normal', 8.8, INK);
          doc.text(lines, M + 7, y + 3.6, { lineHeightFactor: 1.15 });
          setF('bold', 8.8, INK);
          doc.text(w.price ? pdfMoney(w.price) : '—', W - M - 4, y + 3.6, { align: 'right' });
          y += h + 1.2;
        });
        y += 1.4;
      });

      if (rec.note) {
        var nl = doc.splitTextToSize('Комментарий: ' + rec.note, CW - 10);
        ensure(nl.length * 4 + 5);
        setF('normal', 7.8, MUTED);
        doc.text(nl, M + 4, y + 3.2, { lineHeightFactor: 1.2 });
        y += nl.length * 4.2 + 2;
      }
      y += 1.5;
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.setLineWidth(0.25);
      doc.line(M, y, W - M, y);
      y += 6;
    });
  }

  /* ---------- Категории ---------- */
  var catTotals = {};
  recs.forEach(function (r) {
    (r.works || []).forEach(function (w) {
      var k = w.cat || 'other';
      catTotals[k] = (catTotals[k] || 0) + num(w.price);
    });
  });
  var catArr = Object.keys(catTotals).map(function (k) { return { cat: k, val: catTotals[k] }; })
    .filter(function (x) { return x.val > 0; })
    .sort(function (a, b) { return b.val - a.val; });
  if (catArr.length) {
    var needCat = 9 + catArr.length * 10.5 + 16;
    if (y + needCat > H - 24) { doc.addPage(); y = M + 4; }
    sectionTitle('Расходы по категориям');
    var maxCat = catArr[0].val;
    catArr.forEach(function (x) {
      ensure(12);
      setF('normal', 8.6, INK);
      doc.text(fit(catName(x.cat), 8.6, 'normal', CW - 50), M, y + 3);
      setF('bold', 8.6, INK);
      doc.text(pdfMoney(x.val), W - M, y + 3, { align: 'right' });
      doc.setFillColor(236, 240, 246);
      doc.roundedRect(M, y + 5, CW, 2.3, 1.1, 1.1, 'F');
      doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.roundedRect(M, y + 5, Math.max(1.4, CW * (x.val / maxCat)), 2.3, 1.1, 1.1, 'F');
      y += 10.5;
    });
    ensure(10);
    setF('bold', 9.5, INK);
    doc.text('Итого', M, y + 4);
    doc.text(pdfMoney(total), W - M, y + 4, { align: 'right' });
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(0.6);
    doc.line(M, y + 6.5, W - M, y + 6.5);
    y += 14;
  }

  /* ---------- Планы ---------- */
  if (plans.length) {
    ensure(30);
    sectionTitle('Планируемые работы');
    plans.forEach(function (p) {
      var meta = [];
      if (p.dueDate) meta.push('до ' + pdfDateShort(p.dueDate));
      if (p.dueMileage) meta.push('до ' + pdfDist(p.dueMileage));
      if (p.cost) meta.push(pdfMoney(p.cost));
      if (p.priority === 'high') meta.push('высокий приоритет');
      var lines = doc.splitTextToSize(p.title, CW - 12);
      ensure(lines.length * 4.4 + 8);
      doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.circle(M + 2, y + 2.2, 1.1, 'F');
      setF('bold', 9.5, INK);
      doc.text(lines, M + 7, y + 3.6, { lineHeightFactor: 1.15 });
      y += lines.length * 4.4;
      setF('normal', 8, MUTED);
      doc.text(meta.join('  ·  '), M + 7, y + 3);
      y += 7;
      if (p.note) {
        var pl = doc.splitTextToSize(p.note, CW - 14);
        ensure(pl.length * 3.8 + 2);
        setF('normal', 7.6, SOFT);
        doc.text(pl, M + 7, y + 2, { lineHeightFactor: 1.2 });
        y += pl.length * 4;
      }
      y += 2.5;
    });
  }

  ensure(18);
  y += 4;
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;
  setF('normal', 7.8, SOFT);
  var footNote = doc.splitTextToSize('Отчёт сформирован автоматически в приложении АвтоЖурнал. Суммы указаны в валюте учёта. Данные хранятся на устройстве пользователя.', CW - 10);
  doc.text(footNote, M, y, { lineHeightFactor: 1.25 });

  /* ---------- Колонтитулы ---------- */
  var pages = doc.getNumberOfPages();
  for (var i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.3);
    doc.line(M, H - 15, W - M, H - 15);
    setF('normal', 7.5, MUTED);
    doc.text('АвтоЖурнал · ' + carName(car), M, H - 10);
    doc.text('Стр. ' + i + ' из ' + pages, W - M, H - 10, { align: 'right' });
  }

  return doc;
}
