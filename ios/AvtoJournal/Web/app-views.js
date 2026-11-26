/* АвтоЖурнал — экраны и рендер */
'use strict';

function render() {
  applyTheme();
  var route = parseRoute();
  state.route = route;

  var title = 'АвтоЖурнал', sub = 'учёт обслуживания', right = '';
  var isRoot = ['home', 'plans', 'stats', 'settings', 'about'].indexOf(route.name) !== -1;
  var car = route.carId ? getCar(route.carId) : null;

  if (route.name === 'home') { title = 'Гараж'; sub = 'АвтоЖурнал · учёт обслуживания'; }
  if (route.name === 'plans') { title = 'Планы работ'; sub = 'Ремонты и замены'; }
  if (route.name === 'stats') { title = 'Статистика'; sub = 'Расходы и обслуживание'; }
  if (route.name === 'settings') { title = 'Настройки'; sub = 'Приложение и данные'; }
  if (route.name === 'about') { title = 'О приложении'; sub = 'АвтоЖурнал ' + APP_VERSION; }

  if (route.name === 'car') {
    if (!car) { location.replace('#/'); return; }
    title = carName(car); sub = carSubtitle(car);
    right = '<button class="icon-btn" data-action="edit-car" data-id="' + esc(car.id) + '" aria-label="Изменить">' + icon('pencil') + '</button>' +
      '<button class="icon-btn accent" data-action="pdf" data-id="' + esc(car.id) + '" aria-label="PDF-отчёт">' + icon('pdf') + '</button>';
  }
  if (route.name === 'history') {
    if (!car) { location.replace('#/'); return; }
    title = 'История ТО'; sub = carName(car);
    right = '<button class="icon-btn accent" data-action="add-record" data-id="' + esc(car.id) + '" aria-label="Добавить ТО">' + icon('plus') + '</button>';
  }
  if (route.name === 'record') {
    title = 'Запись ТО'; sub = car ? carName(car) : '';
    right = '<button class="icon-btn" data-action="edit-record" data-car="' + esc(route.carId) + '" data-id="' + esc(route.id) + '" aria-label="Изменить">' + icon('pencil') + '</button>';
  }
  if (route.name === 'recordForm') {
    title = route.id ? 'Изменить ТО' : 'Новое ТО';
    sub = car ? carName(car) : '';
    if (!car) { location.replace('#/'); return; }
  }
  if (route.name === 'carForm') {
    title = route.id ? 'Автомобиль' : 'Новый автомобиль';
    sub = route.id ? 'Редактирование' : 'Добавление в гараж';
    if (route.id && !getCar(route.id)) { location.replace('#/'); return; }
  }
  if (route.name === 'planForm') { title = route.id ? 'Изменить план' : 'Новый план'; sub = 'Планируемые работы'; }
  if (route.name === 'fuelForm') { title = route.id ? 'Изменить заправку' : 'Новая заправка'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'regimen') { title = 'Регламент ТО'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'regimenForm') { title = route.id ? 'Изменить пункт регламента' : 'Новый пункт регламента'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'documentForm') { title = route.id ? 'Изменить документ' : 'Новый документ'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'faultForm') { title = route.id ? 'Изменить неисправность' : 'Новая неисправность'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'parts') { title = 'Запчасти и расходники'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'faults') { title = 'Неисправности'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'documents') { title = 'Документы'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'fuelings') { title = 'Заправки'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'carPlans') { title = 'Планы работ'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'partForm') { title = route.id ? 'Изменить запчасть' : 'Новая запчасть'; sub = car ? carName(car) : ''; if (!car) { location.replace('#/'); return; } }
  if (route.name === 'plans') right = '<button class="icon-btn accent" data-action="new-plan" aria-label="Добавить план">' + icon('plus') + '</button>';
  if (route.name === 'regimen' && car) right = '<button class="icon-btn accent" data-action="new-regimen" data-id="' + esc(car.id) + '" aria-label="Добавить операцию">' + icon('plus') + '</button>';
  if (route.name === 'parts' && car) right = '<button class="icon-btn accent" data-action="new-part" data-id="' + esc(car.id) + '" aria-label="Добавить запчасть">' + icon('plus') + '</button>';
  if (route.name === 'home') right = '<button class="icon-btn accent" data-action="add-car" aria-label="Добавить автомобиль">' + icon('plus') + '</button>';

  var view = '';
  switch (route.name) {
    case 'home': view = viewHome(); break;
    case 'car': view = viewCar(car); break;
    case 'history': view = viewHistory(car); break;
    case 'record': view = viewRecord(car, getRecord(route.id)); break;
    case 'recordForm': view = viewRecordForm(car, route.id ? getRecord(route.id) : null); break;
    case 'carForm': view = viewCarForm(route.id ? getCar(route.id) : null); break;
    case 'plans': view = viewPlans(); break;
    case 'planForm': view = viewPlanForm(route.id ? getPlan(route.id) : null, route.carId); break;
    case 'fuelForm': view = viewFuelForm(car, route.id ? getFueling(route.id) : null); break;
    case 'regimen': view = viewRegimen(car); break;
    case 'regimenForm': view = viewRegimenForm(car, route.id ? getRegimenItem(car.id, route.id) : null); break;
    case 'documentForm': view = viewDocumentForm(car, route.id ? getDocument(route.id) : null); break;
    case 'faultForm': view = viewFaultForm(car, route.id ? getFault(route.id) : null); break;
    case 'parts': view = viewParts(car); break;
    case 'partForm': view = viewPartForm(car, route.id ? getPart(route.id) : null); break;
    case 'faults': view = viewFaults(car); break;
    case 'documents': view = viewDocuments(car); break;
    case 'fuelings': view = viewFuelings(car); break;
    case 'carPlans': view = viewCarPlans(car); break;
    case 'stats': view = viewStats(); break;
    case 'settings': view = viewSettings(); break;
    case 'about': view = viewAbout(); break;
    default: view = viewHome();
  }

  var appbar =
    '<header class="appbar">' +
    '<button class="icon-btn" data-action="' + (isRoot ? 'open-drawer' : 'back') + '" aria-label="' + (isRoot ? 'Меню' : 'Назад') + '">' + icon(isRoot ? 'menu' : 'back') + '</button>' +
    '<div class="bar-title"><div class="t1">' + esc(title) + '</div><div class="t2">' + esc(sub) + '</div></div>' +
    right +
    '</header>';

  document.getElementById('app').innerHTML = appbar + view + drawerHtml(route);
  bindView(route);
  document.body.classList.remove('drawer-open');
}

function drawerHtml(route) {
  var pending = state.data.plans.filter(function (p) { return !p.done; }).length;
  var items = [
    { name: 'home', href: '#/', icon: 'home', label: 'Гараж' },
    { name: 'plans', href: '#/plans', icon: 'list', label: 'Планы работ', badge: pending || '' },
    { name: 'stats', href: '#/stats', icon: 'chart', label: 'Статистика' },
    { name: 'settings', href: '#/settings', icon: 'settings', label: 'Настройки' },
    { name: 'about', href: '#/about', icon: 'info', label: 'О приложении' }
  ];
  return '<div class="drawer-overlay" data-action="close-drawer"></div>' +
    '<aside class="drawer" aria-label="Меню">' +
    '<div class="drawer-brand"><div class="brand-mark">' + icon('gauge') + '</div><div><div class="nm">АвтоЖурнал</div><div class="tg">обслуживание авто</div></div></div>' +
    '<nav class="drawer-nav">' +
    items.map(function (it) {
      var active = route.name === it.name ? ' active' : '';
      return '<a class="dnav' + active + '" href="' + it.href + '">' + icon(it.icon) + '<span>' + it.label + '</span>' + (it.badge ? '<span class="badge orange">' + it.badge + '</span>' : '') + '</a>';
    }).join('') +
    '</nav>' +
    '<div class="drawer-sep"></div>' +
    '<div class="drawer-label">Автомобили</div>' +
    '<div class="drawer-cars">' +
    (state.data.cars.length ? state.data.cars.map(function (c) {
      return '<a class="drawer-car' + (route.carId === c.id ? ' active' : '') + '" href="#/car/' + esc(c.id) + '"><span class="dc-dot"></span><span class="dc-nm">' + esc(carName(c)) + '</span><span class="dc-km">' + distText(c.mileage) + '</span></a>';
    }).join('') : '<div class="drawer-label" style="padding-top:0">Пока пусто</div>') +
    '</div>' +
    (function () {
      var ov = state.data.plans.filter(function (p) { return !p.done && planDue(p).overdue; }).length;
      return ov ? '<div class="drawer-reminder"><span>Просрочено планов: ' + ov + '</span><a href="#/plans">Открыть</a></div>' : '';
    })() +
    '<a class="dnav" href="#/car/new" style="margin-top:8px">' + icon('plus') + '<span>Добавить автомобиль</span></a>' +
    '<div class="drawer-foot">Все данные хранятся только на этом устройстве.<br>АвтоЖурнал v' + APP_VERSION + ' · Павлов Роман</div>' +
    '</aside>';
}

function pageHead(eyebrow, title, text) {
  return '<div class="page-head"><div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(title) + '</h1>' + (text ? '<p>' + esc(text) + '</p>' : '') + '</div>';
}

function emptyBox(ic, title, text, actionHtml) {
  return '<div class="empty"><div class="e-icon">' + icon(ic) + '</div><h3>' + esc(title) + '</h3>' + (text ? '<p>' + esc(text) + '</p>' : '') + (actionHtml || '') + '</div>';
}

/* ---------- Гараж ---------- */
function viewHome() {
  var cars = state.data.cars;
  var html = '<main class="page">' + pageHead('Гараж', 'Мой гараж', cars.length ?
    (cars.length + ' ' + plural(cars.length, ['автомобиль', 'автомобиля', 'автомобилей']) + ' под контролем') :
    'Добавьте первый автомобиль, чтобы вести историю обслуживания');
  var overduePlans = state.data.plans.filter(function (p) { return !p.done && planDue(p).overdue; });
  if (overduePlans.length && !state.ui.overdueDismissed) {
    html += '<div class="banner overdue-banner">' +
      '<div class="banner-ic">' + icon('alert') + '</div>' +
      '<div class="banner-body"><b>Просроченные планы: ' + overduePlans.length + '</b><span>Откройте планы работ и отметьте выполненные или перенесите сроки.</span></div>' +
      '<a class="banner-link" href="#/plans">Открыть</a>' +
      '<button class="icon-btn banner-close" data-action="dismiss-overdue" aria-label="Закрыть">' + icon('x') + '</button>' +
      '</div>';
  }
  html += '<div class="stat-strip">' +
    '<div class="stat-cell"><div class="v">' + cars.length + '</div><div class="k">автомобилей</div></div>' +
    '<div class="stat-cell"><div class="v">' + state.data.records.length + '</div><div class="k">записей ТО</div></div>' +
    '<div class="stat-cell"><div class="v">' + money(totalSpent()) + '</div><div class="k">расходы</div></div>' +
    '</div>';

  if (!cars.length) {
    html += '<div style="margin-top:18px">' + emptyBox('car', 'Гараж пуст', 'Добавьте автомобиль: марку, пробег и фото. Дальше — только успевайте записывать ТО.', '<a class="btn primary" href="#/car/new">' + icon('plus') + 'Добавить автомобиль</a>') + '</div>';
  } else {
    html += '<div class="section-head"><h2>Автомобили <span class="cnt">' + cars.length + '</span></h2></div>';
    html += '<div class="car-list">' + cars.map(carCardHtml).join('') + '</div>';
  }
  if (overduePlans.length && state.ui.overdueDismissed) {
    html += '<div class="reminder-card"><div class="rc-ic">' + icon('alert') + '</div><div><b>Напоминание</b><span>Просрочено планов: ' + overduePlans.length + '. Проверьте раздел «Планы работ».</span></div><a class="btn sm" href="#/plans">Открыть</a></div>';
  }
  html += '</main>';
  html += '<button class="fab" data-action="add-car">' + icon('plus') + 'Автомобиль</button>';
  return html;
}

function carCardHtml(car) {
  var recs = recordsOf(car.id);
  var last = recs[0];
  var regs = regimenOf(car.id);
  var regOverdue = 0, regSoon = 0;
  regs.forEach(function (r) { var st = regimenStatus(r, car); if (st.overdue) regOverdue++; else if (st.soon) regSoon++; });
  var nextInfo = nextServiceInfo(car);
  if (!regs.length && nextInfo && (nextInfo.leftKm <= 0 || nextInfo.leftDays <= 0)) regOverdue = 1;
  var statusBadge = regOverdue ? '<span class="badge red">ТО: ' + regOverdue + ' просрочено</span>' :
    (regSoon ? '<span class="badge orange">ТО: скоро ' + regSoon + '</span>' : (regs.length ? '<span class="badge green">регламент в норме</span>' : ''));
  var thumb = car.photo
    ? '<div class="car-thumb" style="background-image:url(\'' + esc(car.photo) + '\')"></div>'
    : '<div class="car-thumb">' + icon('car') + '</div>';
  return '<a class="car-card" href="#/car/' + esc(car.id) + '">' + thumb +
    '<div class="car-card-body">' +
    '<div class="car-name">' + esc(carName(car)) + (car.year ? '<span class="yr">' + esc(car.year) + '</span>' : '') + '</div>' +
    '<div class="car-sub"><span>' + esc(FUELS[car.fuel] || FUELS.petrol) + '</span>' + (car.plate ? '<span class="plate">' + esc(car.plate) + '</span>' : '') + '</div>' +
    '<div class="car-meta">' +
    '<span class="mi">' + icon('gauge') + distText(car.mileage) + '</span>' +
    '<span class="mi">' + icon('clock') + (last ? 'ТО: ' + fmtDate(last.date, { day: 'numeric', month: 'short' }) : 'нет записей') + '</span>' +
    '</div>' + (statusBadge ? '<div class="car-status">' + statusBadge + '</div>' : '') + '</div>' +
    '<span class="chev">' + icon('chevron') + '</span>' +
    '</a>';
}

/* ---------- Автомобиль ---------- */
function recordRowHtml(car, r) {
  var works = r.works || [];
  var first = works[0];
  var s = first ? (first.sub + (works.length > 1 ? ' + ещё ' + (works.length - 1) : '')) : 'Без работ';
  return '<a class="row" href="#/car/' + esc(car.id) + '/rec/' + esc(r.id) + '">' +
    '<div class="date-badge"><b>' + fmtDay(r.date) + '</b><span>' + esc(fmtMonthShort(r.date)) + '</span></div>' +
    '<div class="row-main"><div class="row-title">' + fmtDate(r.date) + ' · ' + distText(r.mileage) + '</div><div class="row-sub">' + esc(s) + '</div></div>' +
    '<div class="row-right"><b>' + money(recordTotal(r)) + '</b><span>' + works.length + ' ' + plural(works.length, ['работа', 'работы', 'работ']) + '</span></div>' +
    '<span class="chev">' + icon('chevron') + '</span>' +
    '</a>';
}

function viewCar(car) {
  var recs = recordsOf(car.id);
  var last = recs[0];
  var pending = plansSorted(car.id).filter(function (p) { return !p.done; });
  var next = nextServiceInfo(car);
  var heroStyle = car.photo
    ? '<div class="hero-photo" style="background-image:url(\'' + esc(car.photo) + '\')"></div>'
    : '<div class="hero-icon">' + icon('car') + '</div>';

  var html = '<main class="page">';
  html += '<section class="car-hero">' + heroStyle +
    '<div class="hero-shade"></div>' +
    '<div class="hero-content">' +
    '<h1>' + esc(carName(car)) + '</h1>' +
    '<div class="hero-sub"><span>' + esc(carSubtitle(car)) + '</span>' + (car.color ? '<span>· ' + esc(car.color) + '</span>' : '') + '</div>' +
    '<div class="hero-chips">' +
    (car.plate ? '<span class="plate">' + esc(car.plate) + '</span>' : '') +
    '<span class="hc">' + icon('fuel') + esc(FUELS[car.fuel] || FUELS.petrol) + '</span>' +
    (car.vin ? '<span class="hc">' + icon('hash') + esc(car.vin) + '</span>' : '') +
    '</div></div></section>';

  html += '<div class="info-grid">' +
    '<div class="info-card"><div class="k">' + icon('gauge') + 'Пробег</div><div class="v">' + distText(car.mileage) + '</div><div class="s">текущий</div></div>' +
    '<div class="info-card"><div class="k">' + icon('clock') + 'Последнее ТО</div><div class="v">' + (last ? distText(last.mileage) : '—') + '</div><div class="s">' + (last ? fmtDate(last.date) : 'записей пока нет') + '</div></div>' +
    '</div>';

  if (next) {
    var cls = (next.leftKm <= 0 || next.leftDays <= 0) ? 'danger' : (next.pct > 75 ? 'warn' : '');
    var alertBadge = (next.leftKm <= 0 || next.leftDays <= 0) ? '<span class="badge red">пора на ТО</span>' : '<span class="badge green">в норме</span>';
    html += '<div class="next-card">' +
      '<div class="next-top"><div><h3>Следующее ТО</h3><div class="k">Интервал ' + distText(state.settings.intervalKm) + ' / ' + state.settings.intervalMonths + ' мес.</div></div>' + alertBadge + '</div>' +
      '<div class="next-figures">' +
      '<div class="next-fig"><b>' + (next.leftKm > 0 ? distText(next.leftKm) : 'сейчас') + '</b><span>осталось пробега</span></div>' +
      '<div class="next-fig"><b>' + (next.leftDays > 0 ? next.leftDays + ' дн.' : (next.leftDays === 0 ? 'сегодня' : 'просрочено')) + '</b><span>до даты · ' + fmtDate(next.dueDate, { day: 'numeric', month: 'short' }) + '</span></div>' +
      '</div>' +
      '<div class="progress ' + cls + '"><i style="width:' + next.pct.toFixed(1) + '%"></i></div>' +
      '</div>';
  }

  /* ---------- История ТО ---------- */
  html += '<div class="section-head"><h2>История ТО <span class="cnt">' + recs.length + '</span></h2>' +
    '<a class="section-btn history-btn" href="#/car/' + esc(car.id) + '/history">Вся история' + icon('chevron') + '</a></div>';
  if (!recs.length) {
    html += emptyBox('wrench', 'Записей пока нет', 'Добавьте первое техническое обслуживание — история и прогноз появятся сразу.', '');
  } else {
    html += '<div class="list">' + recs.slice(0, 5).map(function (r) {
      return recordRowHtml(car, r);
    }).join('') + '</div>';
  }

  /* ---------- Регламент ТО (кратко) ---------- */
  var reg = regimenOf(car.id);
  var regOverdue = 0, regSoon = 0;
  reg.forEach(function (r) { var st = regimenStatus(r, car); if (st.overdue) regOverdue++; else if (st.soon) regSoon++; });
  html += '<div class="section-head"><h2>Регламент ТО <span class="cnt">' + reg.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/regimen">Все' + icon('chevron') + '</a></div>';
  if (!reg.length) {
    html += '<div class="note-card">Регламент пуст. Откройте раздел и добавьте типовые операции по каждому агрегату.</div>';
  } else {
    html += '<div class="note-card">' + (regOverdue ? '<b style="color:var(--danger)">Просрочено: ' + regOverdue + '</b>' : '<b>Просроченных нет</b>') + (regSoon ? ' · скоро: ' + regSoon : '') + ' из ' + reg.length + ' операций.</div>';
  }
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/regimen" style="margin-top:8px">' + icon('settings') + 'Настроить регламент</a>';

  /* ---------- Журнал неисправностей ---------- */
  var faults = faultsOf(car.id);
  html += '<div class="section-head"><h2>Неисправности <span class="cnt">' + faults.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/faults">Все' + icon('chevron') + '</a></div>';
  if (!faults.length) {
    html += '<div class="note-card">Неисправностей не зафиксировано.</div>';
  } else {
    html += faults.map(function (f) {
      return '<div class="work-group" style="margin-bottom:8px">' +
        '<div class="work-group-head">' + icon('alert') + esc(f.title) + ' <span class="badge ' + (f.resolved ? 'green' : 'red') + '">' + (f.resolved ? 'устранено' : 'активно') + '</span></div>' +
        '<div class="work-line"><div><div class="wl-name">' + (f.code ? esc(f.code) : 'Без кода') + '</div><div class="wl-note">' + fmtDate(f.date) + (f.note ? ' · ' + esc(f.note) : '') + (f.cost ? ' · ' + money(f.cost) : '') + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
        '<button type="button" class="wi-edit-btn" data-action="fault-toggle" data-id="' + esc(f.id) + '" aria-label="Переключить">' + icon('check') + '</button>' +
        '<a class="wi-edit-btn" href="#/car/' + esc(car.id) + '/fault/' + esc(f.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
        '<button type="button" class="del" data-action="fault-delete" data-id="' + esc(f.id) + '" aria-label="Удалить">' + icon('x') + '</button>' +
        '</div></div></div>';
    }).join('');
  }
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/fault/new" style="margin-top:8px">' + icon('plus') + 'Добавить неисправность</a>';

  /* ---------- Планируемые работы ---------- */
  var overdueCar = pending.filter(function (p) { return planDue(p).overdue; }).length;
  html += '<div class="section-head"><h2>Планируемые работы <span class="cnt">' + pending.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/plans">Все' + icon('chevron') + '</a></div>';
  html += '<div class="note-card">Активных планов: ' + pending.length + (overdueCar ? ' · просрочено: ' + overdueCar : '') + '.</div>';
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/plan/new" style="margin-top:8px">' + icon('plus') + 'Добавить план</a>';

  /* ---------- Каталог запчастей ---------- */
  var parts = partsOf(car.id);
  html += '<div class="section-head"><h2>Запчасти и расходники <span class="cnt">' + parts.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/parts">Все' + icon('chevron') + '</a></div>';
  if (!parts.length) {
    html += '<div class="note-card">Сохраняйте артикулы и аналоги расходников — при следующей замене не придётся искать.</div>';
  } else {
    html += '<div class="list">' + parts.slice(0, 4).map(function (p) {
      var meta = [p.brand, p.article ? 'арт. ' + p.article : ''].filter(Boolean).join(' · ');
      return '<a class="row" href="#/car/' + esc(car.id) + '/part/' + esc(p.id) + '/edit">' +
        (p.photo ? '<div class="wi-photo" style="background-image:url(\'' + esc(p.photo) + '\')"></div>' : '<div class="wi-photo" style="display:grid;place-items:center;color:var(--soft)">' + icon('box') + '</div>') +
        '<div class="row-main"><div class="row-title">' + esc(p.name) + '</div><div class="row-sub">' + (meta ? esc(meta) : 'без артикула') + '</div></div>' +
        '<div class="row-right"><b>' + (p.price ? money(p.price) : '—') + '</b><span>' + (p.qty > 1 ? '× ' + p.qty : '') + '</span></div>' +
        '<span class="chev">' + icon('chevron') + '</span>' +
        '</a>';
    }).join('') + '</div>';
  }
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/part/new" style="margin-top:8px">' + icon('plus') + 'Добавить запчасть</a>';

  /* ---------- Документы ---------- */
  var docs = documentsOf(car.id);
  html += '<div class="section-head"><h2>Документы <span class="cnt">' + docs.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/docs">Все' + icon('chevron') + '</a></div>';
  if (!docs.length) {
    html += '<div class="note-card">Документов пока нет. Добавьте ОСАГО, КАСКО, диагностическую карту или СТС.</div>';
  } else {
    html += docs.map(function (d) {
      var expired = d.expiry ? (daysFromToday(d.expiry) < 0) : false;
      var soon = d.expiry ? (daysFromToday(d.expiry) >= 0 && daysFromToday(d.expiry) <= 30) : false;
      return '<div class="work-group" style="margin-bottom:8px">' +
        '<div class="work-group-head">' + icon('list') + esc(d.title) + ' <span class="badge ' + (expired ? 'red' : (soon ? 'orange' : 'gray')) + '">' + (expired ? 'истёк' : (soon ? 'скоро' : 'активен')) + '</span></div>' +
        '<div class="work-line"><div><div class="wl-name">' + esc(d.number || '—') + '</div><div class="wl-note">' + (d.expiry ? 'до ' + fmtDate(d.expiry) : '') + (d.note ? ' · ' + esc(d.note) : '') + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
        '<a class="wi-edit-btn" href="#/car/' + esc(car.id) + '/doc/' + esc(d.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
        '<button type="button" class="del" data-action="doc-delete" data-id="' + esc(d.id) + '" aria-label="Удалить">' + icon('x') + '</button>' +
        '</div></div></div>';
    }).join('');
  }
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/doc/new" style="margin-top:8px">' + icon('plus') + 'Добавить документ</a>';

  /* ---------- Заправки ---------- */
  var fuelings = fuelingsOf(car.id);
  var fc = fuelConsumption(car.id);
  html += '<div class="section-head"><h2>Заправки <span class="cnt">' + fuelings.length + '</span></h2>' +
    '<a class="section-btn" href="#/car/' + esc(car.id) + '/fuel">Все' + icon('chevron') + '</a></div>';
  if (fuelings.length) {
    if (fc.avgL100 > 0) {
      html += '<div class="note-card">Средний расход: <b>' + fc.avgL100.toFixed(1).replace('.', ',') + ' л/100 км</b> · стоимость км: ' + money(fc.costPerKm) + '</div>';
    }
    html += '<div class="list">' + fuelings.slice(0, 5).map(function (f) {
      return '<a class="row" href="#/car/' + esc(car.id) + '/fuel/' + esc(f.id) + '/edit">' +
        '<div class="date-badge"><b>' + fmtDay(f.date) + '</b><span>' + esc(fmtMonthShort(f.date)) + '</span></div>' +
        '<div class="row-main"><div class="row-title">' + (f.liters ? f.liters + ' л' : 'Заправка') + (f.station ? ' · ' + esc(f.station) : '') + '</div><div class="row-sub">' + distText(f.mileage) + (f.note ? ' · ' + esc(f.note) : '') + '</div></div>' +
        '<div class="row-right"><b>' + money(f.total || (num(f.liters) * num(f.pricePerLiter))) + '</b><span>' + (f.pricePerLiter ? money(f.pricePerLiter) + '/л' : '') + '</span></div>' +
        '<span class="chev">' + icon('chevron') + '</span>' +
        '</a>';
    }).join('') + '</div>';
  } else {
    html += '<div class="note-card">Заправок пока нет. Добавьте первую — появится расчёт расхода.</div>';
  }
  html += '<a class="btn block" href="#/car/' + esc(car.id) + '/fuel/new" style="margin-top:8px">' + icon('plus') + 'Добавить заправку</a>';

  if (car.notes) {
    html += '<div class="note-card" style="margin-top:14px"><b>Заметка</b>' + esc(car.notes) + '</div>';
  }

  html += '<div class="action-row">' +
    '<button class="btn primary" data-action="pdf" data-id="' + esc(car.id) + '">' + icon('pdf') + 'PDF-отчёт</button>' +
    '<button class="btn" data-action="edit-car" data-id="' + esc(car.id) + '">' + icon('pencil') + 'Изменить</button>' +
    '<button class="btn danger" data-action="delete-car" data-id="' + esc(car.id) + '" aria-label="Удалить">' + icon('trash') + '</button>' +
    '</div>';
  html += '</main>';
  html += '<button class="fab" data-action="add-record" data-id="' + esc(car.id) + '">' + icon('plus') + 'Добавить ТО</button>';
  return html;
}

/* ---------- История ТО ---------- */
function viewHistory(car) {
  var recs = recordsOf(car.id);
  var spent = 0, worksCount = 0;
  recs.forEach(function (r) {
    spent += recordTotal(r);
    worksCount += (r.works || []).length;
  });
  var html = '<main class="page">' + pageHead('История', 'История ТО', recs.length ?
    (recs.length + ' ' + plural(recs.length, ['запись', 'записи', 'записей']) + ' · ' + worksCount + ' ' + plural(worksCount, ['работа', 'работы', 'работ']) + ' · ' + money(spent)) :
    'Все технические обслуживания автомобиля в одном месте');
  if (!recs.length) {
    html += emptyBox('wrench', 'Записей пока нет', 'Добавьте первое техническое обслуживание — записи появятся здесь.', '');
  } else {
    html += '<div class="note-card">Всего работ: <b>' + worksCount + '</b> · расходы: <b>' + money(spent) + '</b></div>';
    html += '<div class="list">' + recs.map(function (r) { return recordRowHtml(car, r); }).join('') + '</div>';
  }
  html += '<a class="btn primary block" href="#/car/' + esc(car.id) + '/new" style="margin-top:12px">' + icon('plus') + 'Добавить ТО</a>';
  html += '</main>';
  return html;
}

/* ---------- Запись ТО ---------- */
function viewRecord(car, rec) {
  if (!car) { setTimeout(function () { location.replace('#/'); }, 0); return ''; }
  if (!rec) {
    return '<main class="page">' + emptyBox('alert', 'Запись не найдена', 'Возможно, она была удалена.', '<a class="btn" href="#/car/' + esc(car.id) + '">К автомобилю</a>') + '</main>';
  }
  var works = rec.works || [];
  var groups = [];
  var map = {};
  works.forEach(function (w) {
    var key = w.cat || 'other';
    if (!map[key]) { map[key] = { cat: key, items: [] }; groups.push(map[key]); }
    map[key].items.push(w);
  });
  var html = '<main class="page">' +
    '<div class="detail-head">' +
    '<div class="dh-k">Пробег на момент ТО</div>' +
    '<div class="dh-v">' + distText(rec.mileage) + '</div>' +
    '<div class="dh-date">' + icon('calendar') + fmtDate(rec.date) + '</div>' +
    '<div class="dh-chips"><span class="badge orange">' + works.length + ' ' + plural(works.length, ['работа', 'работы', 'работ']) + '</span><span class="badge blue">' + esc(carName(car)) + '</span></div>' +
    '</div>';

  groups.forEach(function (g) {
    html += '<div class="work-group">' +
      '<div class="work-group-head">' + icon(catIcon(g.cat)) + esc(catName(g.cat)) + '</div>' +
      g.items.map(function (w) {
        var ph = w.photo ? '<img class="wl-photo" src="' + esc(w.photo) + '" alt="">' : '';
        return '<div class="work-line">' + ph + '<div><div class="wl-name">' + esc(w.sub) + '</div>' + (w.note ? '<div class="wl-note">' + esc(w.note) + '</div>' : '') + '</div><div class="wl-price">' + money(w.price) + '</div></div>';
      }).join('') +
      '</div>';
  });

  html += '<div class="total-bar"><span>Итого по записи</span><b>' + money(recordTotal(rec)) + '</b></div>';
  if (rec.note) html += '<div class="note-card"><b>Комментарий</b>' + esc(rec.note) + '</div>';

  html += '<div class="action-row">' +
    '<button class="btn primary" data-action="edit-record" data-car="' + esc(car.id) + '" data-id="' + esc(rec.id) + '">' + icon('pencil') + 'Изменить</button>' +
    '<button class="btn danger" data-action="delete-record" data-car="' + esc(car.id) + '" data-id="' + esc(rec.id) + '">' + icon('trash') + 'Удалить</button>' +
    '</div></main>';
  return html;
}

/* ---------- Форма ТО ---------- */
var draft = null;
function initRecordDraft(car, rec) {
  var key = car.id + ':' + (rec ? rec.id : 'new');
  if (draft && draft.key === key) return;
  draft = {
    key: key,
    carId: car.id,
    recordId: rec ? rec.id : null,
    cat: (rec && rec.works && rec.works[0]) ? rec.works[0].cat : 'engine',
    sub: null,
    workPhoto: null,
    works: rec ? (rec.works || []).map(function (w) { return { cat: w.cat, sub: w.sub, price: w.price, note: w.note || '', photo: w.photo || '' }; }) : []
  };
}
function draftTotal() { return draft.works.reduce(function (s, w) { return s + (num(w.price) || 0); }, 0); }

function catChipsHtml() {
  return CATEGORIES.map(function (c) {
    return '<button type="button" class="chip' + (draft.cat === c.id ? ' active' : '') + '" data-action="pick-cat" data-cat="' + esc(c.id) + '">' + icon(c.icon) + esc(c.name) + '</button>';
  }).join('');
}
function subChipsHtml(car) {
  var subs = subsFor(draft.cat, car.fuel);
  if (!subs.length) return '<div class="soft" style="font-size:12px;padding:6px 2px">Для этой категории уточните работу в поле ниже.</div>';
  return subs.map(function (s) {
    return '<button type="button" class="chip sm' + (draft.sub === s ? ' active' : '') + '" data-action="pick-sub" data-sub="' + esc(s) + '">' + esc(s) + '</button>';
  }).join('');
}
function worksListHtml() {
  if (!draft.works.length) {
    return '<div class="note-card" style="margin-top:12px">Пока пусто. Выберите категорию и работу из списка, укажите стоимость — и нажмите «Добавить работу».</div>';
  }
  return draft.works.map(function (w, i) {
    var thumb = w.photo ? '<div class="wi-photo" style="background-image:url(\'' + esc(w.photo) + '\')"></div>' : '';
    return '<div class="work-item">' +
      thumb +
      '<div class="wi-main"><div class="wi-cat">' + esc(catName(w.cat)) + '</div><div class="wi-name">' + esc(w.sub) + (w.note ? ' · ' + esc(w.note) : '') + '</div></div>' +
      '<div class="wi-price">' + money(w.price) + '</div>' +
      '<button type="button" class="wi-photo-btn" data-action="work-photo" data-i="' + i + '" aria-label="Фото работы">' + icon('photo') + '</button>' +
      '<button type="button" class="wi-edit-btn" data-action="edit-work" data-i="' + i + '" aria-label="Изменить работу">' + icon('pencil') + '</button>' +
      '<button type="button" class="del" data-action="remove-work" data-i="' + i + '" aria-label="Удалить работу">' + icon('x') + '</button>' +
      '</div>';
  }).join('');
}
function refreshRecordBuilder() {
  var car = getCar(draft.carId);
  var catBox = document.getElementById('catChips');
  if (catBox) catBox.innerHTML = catChipsHtml();
  var subBox = document.getElementById('subWrap');
  if (subBox && car) subBox.innerHTML = subChipsHtml(car);
  var list = document.getElementById('workList');
  if (list) list.innerHTML = worksListHtml();
  var tot = document.getElementById('workTotal');
  if (tot) tot.textContent = money(draftTotal());
}
function viewRecordForm(car, rec) {
  initRecordDraft(car, rec);
  var dateVal = rec ? rec.date : todayISO();
  var mileVal = rec ? unitValue(rec.mileage) : unitValue(car.mileage);
  var note = rec ? (rec.note || '') : '';
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (rec ? 'Редактирование' : 'Новая запись') + '</div><h1>' + (rec ? 'Изменить ТО' : 'Добавить ТО') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div class="field-2">' +
    '<div class="field"><label for="recDate">' + icon('calendar') + 'Дата</label><input class="input" type="date" id="recDate" value="' + esc(dateVal) + '"></div>' +
    '<div class="field"><label for="recMileage">' + icon('gauge') + 'Пробег</label><div class="input-wrap"><input class="input" type="text" inputmode="numeric" pattern="[0-9]*" id="recMileage" value="' + mileVal + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '</div>' +
    '<div class="card builder">' +
    '<div class="card-title">' + icon('wrench') + 'Работы</div>' +
    '<div class="chip-scroll" id="catChips">' + catChipsHtml() + '</div>' +
    '<div class="chip-wrap" id="subWrap">' + subChipsHtml(car) + '</div>' +
    '<div class="add-work-box">' +
    '<div class="add-work-grid">' +
    '<div class="full"><input class="input" id="workName" placeholder="Уточнение / своя работа (необязательно)" maxlength="120"></div>' +
    '<div><input class="input" id="workPrice" type="number" inputmode="decimal" min="0" step="1" placeholder="Стоимость"></div>' +
    '<button type="button" class="btn" data-action="pick-work-photo">' + icon('photo') + (draft.workPhoto ? 'Фото добавлено' : 'Фото') + '</button>' +
    '</div>' +
    '<input type="file" id="workPhotoInput" accept="image/*" hidden>' +
    (draft.workPhoto ? '<div class="work-photo-preview" style="background-image:url(\'' + esc(draft.workPhoto) + '\')"></div>' : '') +
    '<div class="hint">Стоимость в ' + (state.settings.currency === 'RUB' ? 'рублях' : currencySign()) + '. Можно оставить 0.</div>' +
    '</div>' +
    '<div id="workList">' + worksListHtml() + '</div>' +
    '<div class="total-row"><span>Итого</span><b id="workTotal">' + money(draftTotal()) + '</b></div>' +
    '</div>' +
    '<div class="field" style="margin-top:16px"><label for="recNote">' + icon('pencil') + 'Комментарий к ТО</label><textarea class="textarea" id="recNote" placeholder="Сервис, мастер, замечания…">' + esc(note) + '</textarea></div>' +
    '<div class="sticky-actions">' +
    '<button class="btn primary block" data-action="add-work">' + icon('plus') + 'Добавить работу</button>' +
    '<button class="btn primary block" data-action="save-record">' + icon('check') + (rec ? 'Сохранить изменения' : 'Сохранить ТО') + '</button>' +
    '</div>' +
    '</main>';
  return html;
}

/* ---------- Форма автомобиля ---------- */
var carDraft = { key: null, photo: null, ratio: 1.5 };
function initCarDraft(car) {
  var key = car ? car.id : 'new';
  if (carDraft.key !== key) {
    carDraft = { key: key, photo: car ? car.photo : null, ratio: (car && car.photoRatio) || 1.5 };
  }
}
function photoBoxHtml() {
  var has = !!carDraft.photo;
  return '<div class="photo-box' + (has ? ' has' : '') + '" id="photoBox">' +
    (has ? '<div class="pv" style="background-image:url(\'' + esc(carDraft.photo) + '\')"></div>' : '') +
    (has ? '' : '<div class="ph-empty">' + icon('photo') + '<div>Фото автомобиля<br><span class="soft">необязательно</span></div></div>') +
    '<div class="ph-actions">' +
    '<button type="button" class="btn" data-action="pick-photo">' + icon('photo') + (has ? 'Заменить' : 'Выбрать фото') + '</button>' +
    (has ? '<button type="button" class="btn" data-action="remove-photo">' + icon('x') + 'Убрать</button>' : '') +
    '</div></div>';
}
function fuelOptions(sel) {
  return Object.keys(FUELS).map(function (k) {
    return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + FUELS[k] + '</option>';
  }).join('');
}
function viewCarForm(car) {
  initCarDraft(car);
  var c = car || {};
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (car ? 'Автомобиль' : 'Новый автомобиль') + '</div><h1>' + (car ? 'Редактировать' : 'Добавить в гараж') + '</h1></div>' +
    '<div id="photoWrap">' + photoBoxHtml() + '</div>' +
    '<div class="form-section"><h3>Основное</h3>' +
    '<div class="field-2">' +
    '<div class="field"><label for="carMake">Марка</label><input class="input" id="carMake" list="carMakeList" placeholder="Skoda" maxlength="40" value="' + esc(c.make || '') + '"><datalist id="carMakeList">' + CAR_MAKES.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('') + '</datalist></div>' +
    '<div class="field"><label for="carModel">Модель</label><input class="input" id="carModel" list="carModelList" placeholder="Octavia" maxlength="40" value="' + esc(c.model || '') + '"><datalist id="carModelList"></datalist></div>' +
    '</div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="carYear">Год выпуска</label><input class="input" id="carYear" type="number" inputmode="numeric" min="1900" max="2100" placeholder="2019" value="' + esc(c.year || '') + '"></div>' +
    '<div class="field"><label for="carPlate">Госномер</label><input class="input" id="carPlate" placeholder="А123ВС 77" maxlength="16" value="' + esc(c.plate || '') + '"></div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px"><label for="carVin">VIN</label><input class="input" id="carVin" placeholder="XW8AC6NE0KZ000000" maxlength="24" autocapitalize="characters" value="' + esc(c.vin || '') + '"></div>' +
    '</div>' +
    '<div class="form-section"><h3>Эксплуатация</h3>' +
    '<div class="field-2">' +
    '<div class="field"><label for="carFuel">' + icon('fuel') + 'Тип топлива</label><select class="select" id="carFuel">' + fuelOptions(c.fuel || 'petrol') + '</select></div>' +
    '<div class="field"><label for="carColor">' + icon('palette') + 'Цвет</label><input class="input" id="carColor" placeholder="Серебристый" maxlength="24" value="' + esc(c.color || '') + '"></div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px"><label for="carMileage">' + icon('gauge') + 'Текущий пробег</label><div class="input-wrap"><input class="input" id="carMileage" type="number" inputmode="numeric" min="0" step="1" placeholder="0" value="' + (c.mileage ? unitValue(c.mileage) : '') + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '<div class="field"><label for="carNotes">' + icon('pencil') + 'Заметка</label><textarea class="textarea" id="carNotes" placeholder="Особенности, сервис, страховка…" maxlength="400">' + esc(c.notes || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn primary block save-sticky" data-action="save-car">' + icon('check') + (car ? 'Сохранить' : 'Добавить автомобиль') + '</button>' +
    '</main>';
  return html;
}

/* ---------- Планы ---------- */
function planCardHtml(p, compact) {
  var car = getCar(p.carId);
  var due = planDue(p);
  var pc = 'prio ' + (p.priority === 'high' ? 'high' : p.priority === 'low' ? 'low' : 'mid');
  var prioText = p.priority === 'high' ? 'важно' : p.priority === 'low' ? 'низкий' : 'средний';
  var meta = [];
  if (!compact && car) meta.push('<span class="badge blue">' + esc(carName(car)) + '</span>');
  meta.push('<span class="badge gray">' + esc(catName(p.cat)) + '</span>');
  if (due.text) meta.push('<span class="' + (due.overdue ? 'overdue' : '') + '">' + esc(due.text) + '</span>');
  if (p.cost) meta.push('<b>' + money(p.cost) + '</b>');
  return '<div class="plan-card' + (p.done ? ' done' : '') + '">' +
    '<button type="button" class="plan-check" data-action="toggle-plan" data-id="' + esc(p.id) + '" aria-label="Выполнено">' + icon('check') + '</button>' +
    '<a class="plan-body" href="#/plan/' + esc(p.id) + '/edit">' +
    '<div class="plan-title">' + esc(p.title) + '</div>' +
    '<div class="plan-meta">' + meta.join('') + (p.done ? '<span class="badge green">выполнено</span>' : '<span class="' + pc + '">' + prioText + '</span>') + '</div>' +
    '</a>' +
    '<a class="plan-edit" href="#/plan/' + esc(p.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
    '</div>';
}
function viewPlans() {
  var f = state.ui.planFilter;
  var plans = plansSorted(null);
  if (f === 'overdue') plans = plans.filter(function (p) { return !p.done && planDue(p).overdue; });
  if (f === 'soon') plans = plans.filter(function (p) {
    if (p.done) return false;
    var due = planDue(p);
    var car = getCar(p.carId);
    var d = p.dueDate ? daysFromToday(p.dueDate) : 999;
    var km = (p.dueMileage && car) ? num(p.dueMileage) - num(car.mileage) : 999999;
    return !due.overdue && (d <= 30 || km <= 2000);
  });
  if (f === 'done') plans = plans.filter(function (p) { return p.done; });
  var pending = state.data.plans.filter(function (p) { return !p.done; });
  var overdue = pending.filter(function (p) { return planDue(p).overdue; }).length;
  var html = '<main class="page">' + pageHead('Ремонты и замены', 'Планы работ', pending.length ?
    (pending.length + ' ' + plural(pending.length, ['активный план', 'активных плана', 'активных планов']) + (overdue ? ' · ' + overdue + ' просрочено' : '')) :
    'Планируйте работы заранее — приложение напомнит о сроках');
  html += '<div class="seg">' +
    '<button data-action="plan-filter" data-filter="all" class="' + (f === 'all' ? 'active' : '') + '">Все</button>' +
    '<button data-action="plan-filter" data-filter="overdue" class="' + (f === 'overdue' ? 'active' : '') + '">Просрочено</button>' +
    '<button data-action="plan-filter" data-filter="soon" class="' + (f === 'soon' ? 'active' : '') + '">Скоро</button>' +
    '<button data-action="plan-filter" data-filter="done" class="' + (f === 'done' ? 'active' : '') + '">Готово</button>' +
    '</div>';
  if (!plans.length) {
    html += emptyBox('list', 'Планов нет', 'Добавьте замену масла, тормозных колодок или запланируйте техосмотр.', state.data.cars.length ? '<button class="btn primary" data-action="new-plan">' + icon('plus') + 'Добавить план</button>' : '<a class="btn primary" href="#/car/new">Сначала добавить автомобиль</a>');
  } else {
    html += plans.map(function (p) { return planCardHtml(p); }).join('');
  }
  html += '</main>';
  if (state.data.cars.length) html += '<button class="fab" data-action="new-plan">' + icon('plus') + 'План работ</button>';
  return html;
}
function carOptions(sel) {
  return state.data.cars.map(function (c) {
    return '<option value="' + esc(c.id) + '"' + (sel === c.id ? ' selected' : '') + '>' + esc(carName(c)) + (c.plate ? ' · ' + esc(c.plate) : '') + '</option>';
  }).join('');
}
function viewPlanForm(plan, presetCarId) {
  if (!state.data.cars.length) {
    return '<main class="page">' + emptyBox('car', 'Сначала добавьте автомобиль', 'План работ привязывается к конкретной машине.', '<a class="btn primary" href="#/car/new">Добавить автомобиль</a>') + '</main>';
  }
  var p = plan || {};
  var selectedCar = p.carId || presetCarId || state.data.cars[0].id;
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (plan ? 'План работ' : 'Новый план') + '</div><h1>' + (plan ? 'Изменить план' : 'Запланировать работу') + '</h1></div>' +
    '<div class="field"><label for="planCar">' + icon('car') + 'Автомобиль</label><select class="select" id="planCar">' + carOptions(selectedCar) + '</select></div>' +
    '<div class="field"><label for="planTitle">' + icon('wrench') + 'Что нужно сделать</label><input class="input" id="planTitle" placeholder="Замена масла в двигателе" maxlength="90" value="' + esc(p.title || '') + '"></div>' +
    '<div class="field-2">' +
    '<div class="field"><label for="planCat">Категория</label><select class="select" id="planCat">' + CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + ((p.cat || 'engine') === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="planPriority">Приоритет</label><select class="select" id="planPriority"><option value="low"' + (p.priority === 'low' ? ' selected' : '') + '>Низкий</option><option value="mid"' + ((!p.priority || p.priority === 'mid') ? ' selected' : '') + '>Средний</option><option value="high"' + (p.priority === 'high' ? ' selected' : '') + '>Высокий</option></select></div>' +
    '</div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="planDate">' + icon('calendar') + 'Срок до</label><input class="input" type="date" id="planDate" value="' + esc(p.dueDate || '') + '"></div>' +
    '<div class="field"><label for="planMileage">' + icon('gauge') + 'Пробег до</label><div class="input-wrap"><input class="input" type="number" inputmode="numeric" min="0" step="1" id="planMileage" value="' + (p.dueMileage ? unitValue(p.dueMileage) : '') + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '</div>' +
    '<div class="field"><label for="planCost">' + icon('wallet') + 'Ориентировочная стоимость</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="1" id="planCost" placeholder="0" value="' + (p.cost || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '<div class="field"><label for="planNote">' + icon('pencil') + 'Заметка</label><textarea class="textarea" id="planNote" placeholder="Где делать, какие детали, артикулы…" maxlength="400">' + esc(p.note || '') + '</textarea></div>' +
    '<button class="btn primary block save-sticky" data-action="save-plan">' + icon('check') + (plan ? 'Сохранить' : 'Добавить план') + '</button>' +
    (plan ? '<button class="btn danger block" style="margin-top:10px" data-action="delete-plan" data-id="' + esc(plan.id) + '">' + icon('trash') + 'Удалить план</button>' : '') +
    '</main>';
  return html;
}

/* ---------- Статистика ---------- */
function viewStats() {
  var carFilter = state.ui.statCar;
  var recs = state.data.records.filter(function (r) { return carFilter === 'all' || r.carId === carFilter; });
  var total = recs.reduce(function (s, r) { return s + recordTotal(r); }, 0);
  var yearRecs = recs.filter(function (r) { return (r.date || '').slice(0, 4) === String(new Date().getFullYear()); });
  var yearTotal = yearRecs.reduce(function (s, r) { return s + recordTotal(r); }, 0);
  var avg = recs.length ? total / recs.length : 0;

  var html = '<main class="page">' + pageHead('Аналитика', 'Статистика', 'Расходы, категории и динамика обслуживания');
  html += '<select class="select" data-stat-car style="margin-bottom:14px">' +
    '<option value="all"' + (carFilter === 'all' ? ' selected' : '') + '>Все автомобили</option>' +
    state.data.cars.map(function (c) { return '<option value="' + esc(c.id) + '"' + (carFilter === c.id ? ' selected' : '') + '>' + esc(carName(c)) + '</option>'; }).join('') +
    '</select>';

  html += '<div class="big-stats">' +
    '<div class="big-stat accent"><div class="k">' + icon('wallet') + 'Всего расходов</div><div class="v">' + money(total) + '</div><div class="s">' + recs.length + ' ' + plural(recs.length, ['запись', 'записи', 'записей']) + '</div></div>' +
    '<div class="big-stat"><div class="k">' + icon('calendar') + 'За этот год</div><div class="v">' + money(yearTotal) + '</div><div class="s">' + yearRecs.length + ' ' + plural(yearRecs.length, ['запись', 'записи', 'записей']) + '</div></div>' +
    '<div class="big-stat"><div class="k">' + icon('chart') + 'Средний чек</div><div class="v">' + money(avg) + '</div><div class="s">на одно ТО</div></div>' +
    '<div class="big-stat"><div class="k">' + icon('gauge') + 'Пробег' + (carFilter === 'all' ? ' парка' : '') + '</div><div class="v">' + distText(carFilter === 'all' ? state.data.cars.reduce(function (s, c) { return s + num(c.mileage); }, 0) : (getCar(carFilter) ? getCar(carFilter).mileage : 0)) + '</div><div class="s">' + (carFilter === 'all' ? state.data.cars.length + ' авто' : 'текущий') + '</div></div>' +
    '</div>';

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
  var maxCat = catArr.length ? catArr[0].val : 0;

  html += '<div class="section-head"><h2>Расходы по категориям</h2></div>';
  if (!catArr.length) {
    html += '<div class="note-card">Недостаточно данных. Добавьте записи ТО со стоимостью работ.</div>';
  } else {
    html += '<div class="card bars">' + catArr.map(function (x) {
      var pct = maxCat ? Math.round(x.val / maxCat * 100) : 0;
      var share = total ? Math.round(x.val / total * 100) : 0;
      return '<div class="bar-row">' +
        '<div class="bar-top"><div class="bl">' + icon(catIcon(x.cat)) + '<span>' + esc(catName(x.cat)) + '</span></div><b>' + money(x.val) + ' · ' + share + '%</b></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
    }).join('') + '</div>';
  }

  var months = [];
  var now = new Date();
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var key = d.getFullYear() + '-' + pad2(d.getMonth() + 1);
    var val = recs.filter(function (r) { return (r.date || '').slice(0, 7) === key; })
      .reduce(function (s, r) { return s + recordTotal(r); }, 0);
    months.push({ label: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''), val: val });
  }
  var maxMonth = Math.max.apply(null, months.map(function (m) { return m.val; }).concat([1]));
  html += '<div class="section-head"><h2>Динамика за 6 месяцев</h2></div>';
  html += '<div class="card"><div class="month-chart">' + months.map(function (m) {
    var h = m.val > 0 ? Math.max(5, Math.round(m.val / maxMonth * 100)) : 2;
    return '<div class="month-col" title="' + money(m.val) + '"><div class="mb" style="height:' + h + '%"></div><div class="ml">' + esc(m.label) + '</div></div>';
  }).join('') + '</div>' +
    '<div class="spread" style="margin-top:10px;font-size:11px;color:var(--muted)"><span>Максимум: ' + money(maxMonth) + '</span><span>Всего: ' + money(months.reduce(function (s, m) { return s + m.val; }, 0)) + '</span></div>' +
    '</div>';

  if (carFilter === 'all' && state.data.cars.length > 1) {
    var perCar = state.data.cars.map(function (c) {
      return { car: c, val: state.data.records.filter(function (r) { return r.carId === c.id; }).reduce(function (s, r) { return s + recordTotal(r); }, 0) };
    }).sort(function (a, b) { return b.val - a.val; });
    var maxCar = perCar.length ? perCar[0].val : 0;
    html += '<div class="section-head"><h2>Расходы по автомобилям</h2></div>';
    html += '<div class="card bars">' + perCar.map(function (x) {
      var pct = maxCar ? Math.round(x.val / maxCar * 100) : 0;
      return '<div class="bar-row">' +
        '<div class="bar-top"><div class="bl">' + icon('car') + '<span>' + esc(carName(x.car)) + '</span></div><b>' + money(x.val) + '</b></div>' +
        '<div class="bar-track"><div class="bar-fill alt" style="width:' + pct + '%"></div></div>' +
        '</div>';
    }).join('') + '</div>';
  }
  html += '</main>';
  return html;
}

/* ---------- Настройки ---------- */
function viewSettings() {
  var s = state.settings;
  var html = '<main class="page">' + pageHead('Приложение', 'Настройки', 'Оформление, единицы и резервные копии');
  html += '<div class="settings-group"><h3>Оформление</h3><div class="settings-card">' +
    '<div class="set-row" style="display:block">' +
    '<div class="set-title" style="margin-bottom:8px">' + 'Тема интерфейса</div>' +
    '<div class="seg" style="margin:0">' +
    '<button data-action="set-theme" data-theme="dark" class="' + (s.theme === 'dark' ? 'active' : '') + '">Тёмная</button>' +
    '<button data-action="set-theme" data-theme="light" class="' + (s.theme === 'light' ? 'active' : '') + '">Светлая</button>' +
    '<button data-action="set-theme" data-theme="auto" class="' + (s.theme === 'auto' ? 'active' : '') + '">Системная</button>' +
    '</div></div>' +
    '</div></div>';

  html += '<div class="settings-group"><h3>Единицы и валюта</h3><div class="settings-card">' +
    '<div class="set-row"><div class="set-ic">' + icon('wallet') + '</div><div class="set-body"><div class="set-title">Валюта</div><div class="set-sub">Символ в суммах работ</div></div>' +
    '<select class="set-select" data-setting="currency">' +
    Object.keys(CURRENCY_SYMBOL).map(function (k) { return '<option value="' + k + '"' + (s.currency === k ? ' selected' : '') + '>' + k + ' · ' + CURRENCY_SYMBOL[k] + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="set-row"><div class="set-ic">' + icon('gauge') + '</div><div class="set-body"><div class="set-title">Единицы пробега</div><div class="set-sub">Ввод и отображение</div></div>' +
    '<select class="set-select" data-setting="units"><option value="km"' + (s.units === 'km' ? ' selected' : '') + '>Километры</option><option value="mi"' + (s.units === 'mi' ? ' selected' : '') + '>Мили</option></select></div>' +
    '</div></div>';

  html += '<div class="settings-group"><h3>Напоминания</h3><div class="settings-card">' +
    '<div class="set-row"><div class="set-ic">' + icon('gauge') + '</div><div class="set-body"><div class="set-title">Интервал замены масла</div><div class="set-sub">Для прогноза следующего ТО</div></div>' +
    '<div class="input-wrap" style="width:120px"><input class="set-select" data-setting="intervalKm" type="number" min="500" step="500" value="' + unitValue(s.intervalKm) + '" style="width:100%"><span class="suffix" style="right:10px">' + unitShort() + '</span></div></div>' +
    '<div class="set-row"><div class="set-ic">' + icon('calendar') + '</div><div class="set-body"><div class="set-title">Интервал по времени</div><div class="set-sub">Месяцев между ТО</div></div>' +
    '<div class="input-wrap" style="width:120px"><input class="set-select" data-setting="intervalMonths" type="number" min="1" max="60" step="1" value="' + s.intervalMonths + '" style="width:100%"><span class="suffix" style="right:10px">мес.</span></div></div>' +
    '</div></div>';

  html += '<div class="settings-group"><h3>Данные</h3><div class="settings-card">' +
    '<button class="set-row" data-action="export-backup"><div class="set-ic">' + icon('download') + '</div><div class="set-body"><div class="set-title">Экспорт резервной копии</div><div class="set-sub">JSON со всеми авто и записями</div></div><span class="chev">' + icon('chevron') + '</span></button>' +
    '<button class="set-row" data-action="import-backup"><div class="set-ic">' + icon('upload') + '</div><div class="set-body"><div class="set-title">Импорт из файла</div><div class="set-sub">Восстановление из копии</div></div><span class="chev">' + icon('chevron') + '</span></button>' +
    '<button class="set-row" data-action="demo-data"><div class="set-ic">' + icon('spark') + '</div><div class="set-body"><div class="set-title">Добавить демо-данные</div><div class="set-sub">Примеры автомобилей и ТО</div></div><span class="chev">' + icon('chevron') + '</span></button>' +
    '<div class="set-row"><div class="set-ic">' + icon('info') + '</div><div class="set-body"><div class="set-title">Занято на устройстве</div><div class="set-sub">' + state.data.cars.length + ' авто · ' + state.data.records.length + ' записей · ' + state.data.plans.length + ' планов</div></div><span class="set-value">' + bytesLabel(storageUsage()) + '</span></div>' +
    '<button class="set-row" data-action="reset-data"><div class="set-ic" style="color:var(--danger)">' + icon('trash') + '</div><div class="set-body"><div class="set-title" style="color:var(--danger)">Удалить все данные</div><div class="set-sub">Без возможности восстановления</div></div></button>' +
    '</div></div>';

  html += '<div class="settings-group"><h3>Информация</h3><div class="settings-card">' +
    '<button class="set-row" data-action="check-update"><div class="set-ic">' + icon('download') + '</div><div class="set-body"><div class="set-title">Проверить обновление</div><div class="set-sub">Текущая версия ' + APP_VERSION + '</div></div><span class="chev">' + icon('chevron') + '</span></button>' +
    '<a class="set-row" href="#/about"><div class="set-ic">' + icon('info') + '</div><div class="set-body"><div class="set-title">О приложении</div><div class="set-sub">Версия ' + APP_VERSION + '</div></div><span class="chev">' + icon('chevron') + '</span></a>' +
    '</div></div>';

  html += '<p style="text-align:center;font-size:11px;color:var(--soft);margin:18px 0 0;line-height:1.6">Все данные хранятся локально на устройстве.<br>Делайте резервные копии перед сменой телефона.</p>';
  html += '</main>';
  return html;
}

/* ---------- О приложении ---------- */
function viewAbout() {
  return '<main class="page">' +
    '<div class="card about-card">' +
    '<div class="about-logo">' + icon('gauge') + '</div>' +
    '<h2>АвтоЖурнал</h2>' +
    '<div class="ver">Версия ' + APP_VERSION + ' · Android</div>' +
    '<div class="tagline">Ваш гараж под контролем</div>' +
    '<p>Учёт технического обслуживания автомобилей: история ТО с работами и стоимостью, планируемые ремонты, напоминания о сроках и красивые PDF-отчёты.</p>' +
    '<p>Данные хранятся только на вашем устройстве и не передаются в интернет. Для переноса используйте экспорт резервной копии в настройках.</p>' +
    '</div>' +
    '<div class="card" style="margin-top:12px">' +
    '<div class="card-title">' + icon('spark') + 'Возможности</div>' +
    ['История ТО с датой, пробегом и работами', 'Категории и подкатегории под тип топлива', 'Планируемые работы со сроками и приоритетом', 'Прогноз следующего ТО по пробегу и времени', 'Статистика расходов по категориям и месяцам', 'PDF-отчёт по каждому автомобилю', 'Резервные копии и тёмная/светлая тема'].map(function (t) {
      return '<div class="set-row" style="padding:9px 0"><div class="set-ic" style="width:26px;height:26px;border:none;background:var(--success-soft);color:var(--success)">' + icon('check') + '</div><div class="set-body"><div class="set-title" style="font-weight:550">' + esc(t) + '</div></div></div>';
    }).join('') +
    '</div>' +
    '<p style="text-align:center;font-size:10.5px;color:var(--soft);margin:20px 0 0;line-height:1.6">АвтоЖурнал · Freedgi<br>Автор: Павлов Роман<br>Локальное приложение без интернета и рекламы</p>' +
    '</main>';
}

/* ---------- Заправки ---------- */
function viewFuelForm(car, f) {
  f = f || {};
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (f.id ? 'Редактирование' : 'Новая заправка') + '</div><h1>' + (f.id ? 'Изменить заправку' : 'Добавить заправку') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div class="field-2">' +
    '<div class="field"><label for="fuelDate">' + icon('calendar') + 'Дата</label><input class="input" type="date" id="fuelDate" value="' + esc(f.date || todayISO()) + '"></div>' +
    '<div class="field"><label for="fuelMileage">' + icon('gauge') + 'Пробег</label><div class="input-wrap"><input class="input" type="number" inputmode="numeric" min="0" step="1" id="fuelMileage" value="' + (f.mileage ? unitValue(f.mileage) : unitValue(car.mileage)) + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '</div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="fuelLiters">' + icon('droplet') + 'Литры</label><input class="input" type="number" inputmode="decimal" min="0" step="0.01" id="fuelLiters" value="' + (f.liters || '') + '"></div>' +
    '<div class="field"><label for="fuelPrice">' + icon('wallet') + 'Цена за литр</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="0.01" id="fuelPrice" value="' + (f.pricePerLiter || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px"><label for="fuelTotal">Сумма</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="0.01" id="fuelTotal" value="' + (f.total || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '<div class="field"><label for="fuelStation">АЗС / место</label><input class="input" id="fuelStation" placeholder="Лукойл, трасса М4" maxlength="60" value="' + esc(f.station || '') + '"></div>' +
    '<div class="field"><label for="fuelType">Топливо</label><select class="select" id="fuelType">' + fuelOptions(f.fuel || car.fuel || 'petrol') + '</select></div>' +
    '<div class="field"><label for="fuelNote">Заметка</label><textarea class="textarea" id="fuelNote" placeholder="Полный бак, трасса, город…" maxlength="300">' + esc(f.note || '') + '</textarea></div>' +
    '<button class="btn primary block save-sticky" data-action="save-fuel">' + icon('check') + (f.id ? 'Сохранить изменения' : 'Сохранить заправку') + '</button>' +
    (f.id ? '<button class="btn danger block" style="margin-top:10px" data-action="delete-fuel" data-id="' + esc(f.id) + '">' + icon('trash') + 'Удалить заправку</button>' : '') +
    '</main>';
  return html;
}

/* ---------- Регламент форма ---------- */
function viewRegimenForm(car, r) {
  r = r || {};
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (r.id ? 'Редактирование' : 'Новый пункт') + '</div><h1>' + (r.id ? 'Изменить регламент' : 'Добавить в регламент') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div class="field"><label for="regTitle">Операция</label><input class="input" id="regTitle" placeholder="Масло и фильтр двигателя" maxlength="90" value="' + esc(r.title || '') + '"></div>' +
    '<div class="field"><label for="regCat">Категория</label><select class="select" id="regCat">' + CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + ((r.cat || 'engine') === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="regKm">Интервал, км</label><input class="input" type="number" inputmode="numeric" min="0" step="500" id="regKm" value="' + (r.intervalKm || '') + '"></div>' +
    '<div class="field"><label for="regMonths">Интервал, мес.</label><input class="input" type="number" inputmode="numeric" min="0" step="1" id="regMonths" value="' + (r.intervalMonths || '') + '"></div>' +
    '</div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="regLastDate">Последнее выполнение</label><input class="input" type="date" id="regLastDate" value="' + esc(r.lastDate || '') + '"></div>' +
    '<div class="field"><label for="regLastKm">Пробег при выполнении</label><div class="input-wrap"><input class="input" type="number" inputmode="numeric" min="0" step="1" id="regLastKm" value="' + (r.lastMileage ? unitValue(r.lastMileage) : '') + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '</div>' +
    '<div class="field"><label for="regNote">Заметка</label><textarea class="textarea" id="regNote" placeholder="Масло 5W-30, фильтр MANN…" maxlength="300">' + esc(r.note || '') + '</textarea></div>' +
    '<button class="btn primary block save-sticky" data-action="save-regimen">' + icon('check') + (r.id ? 'Сохранить' : 'Добавить в регламент') + '</button>' +
    (r.id && !isPresetRegimen(r) ? '<button class="btn danger block" style="margin-top:10px" data-action="regimen-delete" data-car="' + esc(car.id) + '" data-id="' + esc(r.id) + '">' + icon('trash') + 'Удалить</button>' : '') +
    (r.id && isPresetRegimen(r) ? '<div class="hint" style="margin-top:10px">Это основной пункт регламента: его нельзя удалить, но можно изменить интервалы и данные о выполнении.</div>' : '') +
    '</main>';
  return html;
}

/* ---------- Документ форма ---------- */
function viewDocumentForm(car, d) {
  d = d || {};
  var types = ['ОСАГО','КАСКО','Диагностическая карта','СТС','ПТС','Гарантия','Договор','Чек','Прочее'];
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (d.id ? 'Редактирование' : 'Новый документ') + '</div><h1>' + (d.id ? 'Изменить документ' : 'Добавить документ') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div class="field"><label for="docTitle">Тип документа</label><select class="select" id="docTitle">' + types.map(function (t) { return '<option value="' + esc(t) + '"' + ((d.title || 'ОСАГО') === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="docNumber">Номер / серия</label><input class="input" id="docNumber" placeholder="XXX 1234567890" maxlength="60" value="' + esc(d.number || '') + '"></div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="docStart">Дата начала</label><input class="input" type="date" id="docStart" value="' + esc(d.start || '') + '"></div>' +
    '<div class="field"><label for="docExpiry">Действует до</label><input class="input" type="date" id="docExpiry" value="' + esc(d.expiry || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label for="docCost">Стоимость</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="1" id="docCost" value="' + (d.cost || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '<div class="field"><label for="docNote">Заметка</label><textarea class="textarea" id="docNote" placeholder="Компания, условия, контакты…" maxlength="400">' + esc(d.note || '') + '</textarea></div>' +
    '<button class="btn primary block save-sticky" data-action="save-document">' + icon('check') + (d.id ? 'Сохранить' : 'Добавить документ') + '</button>' +
    (d.id ? '<button class="btn danger block" style="margin-top:10px" data-action="doc-delete" data-id="' + esc(d.id) + '">' + icon('trash') + 'Удалить</button>' : '') +
    '</main>';
  return html;
}

/* ---------- Неисправность форма ---------- */
function viewFaultForm(car, f) {
  f = f || {};
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (f.id ? 'Редактирование' : 'Новая неисправность') + '</div><h1>' + (f.id ? 'Изменить неисправность' : 'Добавить неисправность') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div class="field"><label for="faultTitle">Неисправность</label><input class="input" id="faultTitle" placeholder="Стук в подвеске" maxlength="90" value="' + esc(f.title || '') + '"></div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="faultDate">Дата</label><input class="input" type="date" id="faultDate" value="' + esc(f.date || todayISO()) + '"></div>' +
    '<div class="field"><label for="faultCode">Код OBD-II</label><input class="input" id="faultCode" placeholder="P0300" maxlength="12" value="' + esc(f.code || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label for="faultMileage">Пробег</label><div class="input-wrap"><input class="input" type="number" inputmode="numeric" min="0" step="1" id="faultMileage" value="' + (f.mileage ? unitValue(f.mileage) : unitValue(car.mileage)) + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
    '<div class="field"><label for="faultCost">Стоимость ремонта</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="1" id="faultCost" value="' + (f.cost || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '<div class="field"><label for="faultNote">Описание и решение</label><textarea class="textarea" id="faultNote" placeholder="Симптомы, диагностика, что сделано…" maxlength="600">' + esc(f.note || '') + '</textarea></div>' +
    '<div class="field"><label><input type="checkbox" id="faultResolved"' + (f.resolved ? ' checked' : '') + '> Устранено</label></div>' +
    '<button class="btn primary block save-sticky" data-action="save-fault">' + icon('check') + (f.id ? 'Сохранить' : 'Добавить неисправность') + '</button>' +
    (f.id ? '<button class="btn danger block" style="margin-top:10px" data-action="fault-delete" data-id="' + esc(f.id) + '">' + icon('trash') + 'Удалить</button>' : '') +
    '</main>';
  return html;
}

/* ---------- Каталог запчастей ---------- */
function partsTotal(parts) {
  return parts.reduce(function (s, p) { return s + num(p.price) * Math.max(1, num(p.qty, 1)); }, 0);
}
function viewParts(car) {
  var parts = partsOf(car.id);
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + icon('box') + 'Каталог</div><h1>Запчасти и расходники</h1><p>' + esc(carName(car)) + ' · ' + parts.length + ' ' + plural(parts.length, ['позиция', 'позиции', 'позиций']) + '</p></div>' +
    '<a class="btn primary block" href="#/car/' + esc(car.id) + '/part/new">' + icon('plus') + 'Добавить запчасть</a>';
  if (!parts.length) {
    html += '<div style="margin-top:16px">' + emptyBox('box', 'Каталог пуст', 'Сохраняйте артикулы, аналоги и фото расходников — при следующей замене не придётся искать.', '') + '</div>';
  } else {
    html += '<div class="part-list">' + parts.map(function (p) {
      var thumb = p.photo
        ? '<div class="part-thumb" style="background-image:url(\'' + esc(p.photo) + '\')"></div>'
        : '<div class="part-thumb ph">' + icon('box') + '</div>';
      var meta = [];
      if (p.brand) meta.push(esc(p.brand));
      if (p.article) meta.push('арт. ' + esc(p.article));
      if (p.qty > 1) meta.push('× ' + p.qty);
      return '<div class="part-card">' + thumb +
        '<div class="part-main"><div class="part-name">' + esc(p.name) + '</div>' +
        '<div class="part-meta">' + (meta.length ? meta.join(' · ') : 'без артикула') + '</div>' +
        (p.analogs ? '<div class="part-analog">Аналоги: ' + esc(p.analogs) + '</div>' : '') +
        (p.note ? '<div class="part-note">' + esc(p.note) + '</div>' : '') + '</div>' +
        '<div class="part-side"><b>' + (p.price ? money(p.price * Math.max(1, num(p.qty, 1))) : '—') + '</b>' +
        '<div class="part-actions">' +
        '<a class="wi-edit-btn" href="#/car/' + esc(car.id) + '/part/' + esc(p.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
        '<button type="button" class="del" data-action="part-delete" data-car="' + esc(car.id) + '" data-id="' + esc(p.id) + '" aria-label="Удалить">' + icon('x') + '</button>' +
        '</div></div></div>';
    }).join('') + '</div>';
    html += '<div class="note-card">Сумма по каталогу: <b>' + money(partsTotal(parts)) + '</b></div>';
  }
  html += '</main>';
  return html;
}

var partDraft = { key: null, photo: null };
function initPartDraft(part) {
  var key = part ? part.id : 'new';
  if (partDraft.key !== key) partDraft = { key: key, photo: part ? (part.photo || null) : null };
}
function partPhotoBoxHtml() {
  var has = !!partDraft.photo;
  return '<div class="photo-box part-photo' + (has ? ' has' : '') + '" id="partPhotoBox" style="min-height:120px">' +
    (has ? '<div class="pv" style="background-image:url(\'' + esc(partDraft.photo) + '\')"></div>' : '') +
    (has ? '' : '<div class="ph-empty">' + icon('box') + '<div>Фото запчасти или упаковки<br><span class="soft">необязательно</span></div></div>') +
    '<div class="ph-actions">' +
    '<button type="button" class="btn" data-action="pick-part-photo">' + icon('photo') + (has ? 'Заменить' : 'Выбрать фото') + '</button>' +
    (has ? '<button type="button" class="btn" data-action="remove-part-photo">' + icon('x') + 'Убрать</button>' : '') +
    '</div></div>';
}
function viewPartForm(car, part) {
  initPartDraft(part);
  part = part || {};
  var html = '<main class="page">' +
    '<div class="page-head"><div class="eyebrow">' + (part.id ? 'Запчасть' : 'Новая запчасть') + '</div><h1>' + (part.id ? 'Редактировать' : 'Добавить в каталог') + '</h1><p>' + esc(carName(car)) + '</p></div>' +
    '<div id="partPhotoWrap">' + partPhotoBoxHtml() + '</div>' +
    '<input type="file" id="partPhotoInput" accept="image/*" hidden>' +
    '<div class="form-section"><h3>Данные</h3>' +
    '<div class="field"><label for="partName">Название</label><input class="input" id="partName" placeholder="Масляный фильтр" maxlength="80" value="' + esc(part.name || '') + '"></div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="partBrand">Бренд</label><input class="input" id="partBrand" placeholder="MANN" maxlength="40" value="' + esc(part.brand || '') + '"></div>' +
    '<div class="field"><label for="partArticle">Артикул</label><input class="input" id="partArticle" placeholder="W 914/2" maxlength="40" value="' + esc(part.article || '') + '"></div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px"><label for="partAnalogs">Аналоги</label><input class="input" id="partAnalogs" placeholder="Заменители через запятую" maxlength="160" value="' + esc(part.analogs || '') + '"></div>' +
    '<div class="field-2" style="margin-top:12px">' +
    '<div class="field"><label for="partPrice">Цена</label><div class="input-wrap"><input class="input" id="partPrice" type="number" inputmode="decimal" min="0" step="1" value="' + (part.price || '') + '"><span class="suffix">' + currencySign() + '</span></div></div>' +
    '<div class="field"><label for="partQty">Количество</label><input class="input" id="partQty" type="number" inputmode="numeric" min="1" step="1" value="' + (part.qty || 1) + '"></div>' +
    '</div>' +
    '<div class="field"><label for="partNote">Заметка</label><textarea class="textarea" id="partNote" placeholder="Совместимость, где куплено, интервал замены…" maxlength="300">' + esc(part.note || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn primary block save-sticky" data-action="save-part">' + icon('check') + (part.id ? 'Сохранить' : 'Добавить запчасть') + '</button>' +
    (part.id ? '<button class="btn danger block" style="margin-top:10px" data-action="part-delete" data-car="' + esc(car.id) + '" data-id="' + esc(part.id) + '">' + icon('trash') + 'Удалить</button>' : '') +
    '</main>';
  return html;
}

/* ---------- Журнал неисправностей (полный список) ---------- */
function viewFaults(car) {
  var faults = faultsOf(car.id);
  var active = faults.filter(function (f) { return !f.resolved; }).length;
  var html = '<main class="page">' + pageHead('Журнал', 'Неисправности', faults.length ?
    (faults.length + ' ' + plural(faults.length, ['запись', 'записи', 'записей']) + ' · активных: ' + active) :
    'Все неисправности автомобиля в одном месте');
  html += '<a class="btn primary block" href="#/car/' + esc(car.id) + '/fault/new">' + icon('plus') + 'Добавить неисправность</a>';
  if (!faults.length) {
    html += '<div style="margin-top:14px">' + emptyBox('alert', 'Неисправностей нет', 'Фиксируйте коды ошибок, симптомы и стоимость ремонта — история сохранится.', '') + '</div>';
  } else {
    html += '<div style="margin-top:14px">' + faults.map(function (f) {
      return '<div class="work-group" style="margin-bottom:8px">' +
        '<div class="work-group-head">' + icon('alert') + esc(f.title) + ' <span class="badge ' + (f.resolved ? 'green' : 'red') + '">' + (f.resolved ? 'устранено' : 'активно') + '</span></div>' +
        '<div class="work-line"><div><div class="wl-name">' + (f.code ? esc(f.code) : 'Без кода') + '</div><div class="wl-note">' + fmtDate(f.date) + (f.note ? ' · ' + esc(f.note) : '') + (f.cost ? ' · ' + money(f.cost) : '') + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
        '<button type="button" class="wi-edit-btn" data-action="fault-toggle" data-id="' + esc(f.id) + '" aria-label="Переключить">' + icon('check') + '</button>' +
        '<a class="wi-edit-btn" href="#/car/' + esc(car.id) + '/fault/' + esc(f.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
        '<button type="button" class="del" data-action="fault-delete" data-id="' + esc(f.id) + '" aria-label="Удалить">' + icon('x') + '</button>' +
        '</div></div></div>';
    }).join('') + '</div>';
  }
  html += '</main>';
  return html;
}

/* ---------- Документы (полный список) ---------- */
function viewDocuments(car) {
  var docs = documentsOf(car.id);
  var expired = docs.filter(function (d) { return d.expiry && daysFromToday(d.expiry) < 0; }).length;
  var html = '<main class="page">' + pageHead('Документы', 'Документы', docs.length ?
    (docs.length + ' ' + plural(docs.length, ['документ', 'документа', 'документов']) + (expired ? ' · истекло: ' + expired : '')) :
    'ОСАГО, КАСКО, диагностическая карта и другие документы');
  html += '<a class="btn primary block" href="#/car/' + esc(car.id) + '/doc/new">' + icon('plus') + 'Добавить документ</a>';
  if (!docs.length) {
    html += '<div style="margin-top:14px">' + emptyBox('list', 'Документов нет', 'Добавьте полисы и свидетельства — приложение напомнит об окончании срока.', '') + '</div>';
  } else {
    html += '<div style="margin-top:14px">' + docs.map(function (d) {
      var isExpired = d.expiry ? (daysFromToday(d.expiry) < 0) : false;
      var soon = d.expiry ? (daysFromToday(d.expiry) >= 0 && daysFromToday(d.expiry) <= 30) : false;
      return '<div class="work-group" style="margin-bottom:8px">' +
        '<div class="work-group-head">' + icon('list') + esc(d.title) + ' <span class="badge ' + (isExpired ? 'red' : (soon ? 'orange' : 'gray')) + '">' + (isExpired ? 'истёк' : (soon ? 'скоро' : 'активен')) + '</span></div>' +
        '<div class="work-line"><div><div class="wl-name">' + esc(d.number || '—') + '</div><div class="wl-note">' + (d.expiry ? 'до ' + fmtDate(d.expiry) : '') + (d.note ? ' · ' + esc(d.note) : '') + '</div></div>' +
        '<div style="display:flex;gap:6px">' +
        '<a class="wi-edit-btn" href="#/car/' + esc(car.id) + '/doc/' + esc(d.id) + '/edit" aria-label="Изменить">' + icon('pencil') + '</a>' +
        '<button type="button" class="del" data-action="doc-delete" data-id="' + esc(d.id) + '" aria-label="Удалить">' + icon('x') + '</button>' +
        '</div></div></div>';
    }).join('') + '</div>';
  }
  html += '</main>';
  return html;
}

/* ---------- Заправки (полный список) ---------- */
function viewFuelings(car) {
  var fuelings = fuelingsOf(car.id);
  var fc = fuelConsumption(car.id);
  var totalLiters = fuelings.reduce(function (s, f) { return s + num(f.liters); }, 0);
  var totalCost = fuelings.reduce(function (s, f) { return s + num(f.total || (num(f.liters) * num(f.pricePerLiter))); }, 0);
  var html = '<main class="page">' + pageHead('Заправки', 'Заправки', fuelings.length ?
    (fuelings.length + ' ' + plural(fuelings.length, ['заправка', 'заправки', 'заправок']) + ' · ' + totalLiters.toFixed(1).replace('.', ',') + ' л · ' + money(totalCost)) :
    'История заправок и расчёт расхода топлива');
  html += '<a class="btn primary block" href="#/car/' + esc(car.id) + '/fuel/new">' + icon('plus') + 'Добавить заправку</a>';
  if (fc.avgL100 > 0) {
    html += '<div class="note-card" style="margin-top:12px">Средний расход: <b>' + fc.avgL100.toFixed(1).replace('.', ',') + ' л/100 км</b> · стоимость км: ' + money(fc.costPerKm) + '</div>';
  }
  if (!fuelings.length) {
    html += '<div style="margin-top:14px">' + emptyBox('fuel', 'Заправок нет', 'Добавьте первую заправку — приложение посчитает расход и стоимость километра.', '') + '</div>';
  } else {
    html += '<div class="list" style="margin-top:12px">' + fuelings.map(function (f) {
      return '<a class="row" href="#/car/' + esc(car.id) + '/fuel/' + esc(f.id) + '/edit">' +
        '<div class="date-badge"><b>' + fmtDay(f.date) + '</b><span>' + esc(fmtMonthShort(f.date)) + '</span></div>' +
        '<div class="row-main"><div class="row-title">' + (f.liters ? f.liters + ' л' : 'Заправка') + (f.station ? ' · ' + esc(f.station) : '') + '</div><div class="row-sub">' + distText(f.mileage) + (f.note ? ' · ' + esc(f.note) : '') + '</div></div>' +
        '<div class="row-right"><b>' + money(f.total || (num(f.liters) * num(f.pricePerLiter))) + '</b><span>' + (f.pricePerLiter ? money(f.pricePerLiter) + '/л' : '') + '</span></div>' +
        '<span class="chev">' + icon('chevron') + '</span>' +
        '</a>';
    }).join('') + '</div>';
  }
  html += '</main>';
  return html;
}

/* ---------- Планы автомобиля ---------- */
function viewCarPlans(car) {
  var plans = plansSorted(car.id);
  var pending = plans.filter(function (p) { return !p.done; });
  var overdue = pending.filter(function (p) { return planDue(p).overdue; }).length;
  var html = '<main class="page">' + pageHead('Ремонты и замены', 'Планы работ', plans.length ?
    (pending.length + ' ' + plural(pending.length, ['активный план', 'активных плана', 'активных планов']) + (overdue ? ' · просрочено: ' + overdue : '')) :
    'Планируйте работы по этому автомобилю');
  html += '<div class="action-row" style="margin-top:0"><a class="btn primary" href="#/car/' + esc(car.id) + '/plan/new">' + icon('plus') + 'Добавить план</a></div>';
  if (!plans.length) {
    html += '<div style="margin-top:14px">' + emptyBox('list', 'Планов нет', 'Добавьте замену масла, колодок или другую работу — приложение напомнит о сроке.', '') + '</div>';
  } else {
    html += '<div style="margin-top:12px">' + plans.map(function (p) { return planCardHtml(p, true); }).join('') + '</div>';
  }
  html += '</main>';
  return html;
}

/* ---------- Экран регламента ---------- */
function viewRegimen(car) {
  var reg = regimenOf(car.id);
  var overdue = 0, soon = 0;
  reg.forEach(function (r) { var st = regimenStatus(r, car); if (st.overdue) overdue++; else if (st.soon) soon++; });
  var html = '<main class="page">' + pageHead('Обслуживание', 'Регламент ТО', reg.length ?
    ('Независимые сроки по каждому агрегату · ' + reg.length + ' операций' + (overdue ? ' · просрочено: ' + overdue : '') + (soon ? ' · скоро: ' + soon : '')) :
    'Добавьте операции и интервалы — приложение будет следить за сроками');
  var regMissing = DEFAULT_REGIMEN.filter(function (d) {
    if (d.fuels && d.fuels.indexOf(car.fuel) === -1) return false;
    return !reg.some(function (r) { return r.key === d.key || (!r.key && (r.title === d.title || (d.legacy || []).indexOf(r.title) !== -1)); });
  }).length;
  html += '<div class="action-row" style="margin-top:0">' +
    '<a class="btn primary" href="#/car/' + esc(car.id) + '/regimen/new">' + icon('plus') + 'Добавить операцию</a>' +
    (regMissing ? '<button class="btn" data-action="fill-regimen" data-id="' + esc(car.id) + '">' + icon('spark') + 'Добавить типовые</button>' : '') +
    '</div>';
  html += '<div class="hint" style="margin:8px 2px 0">Нажмите на пункт, укажите дату, пробег и стоимость — работа добавится в запись ТО. Основные пункты регламента нельзя удалить, но можно изменить.</div>';
  if (!reg.length) {
    html += '<div style="margin-top:14px">' + emptyBox('list', 'Регламент пуст', 'Нажмите «Заполнить типовыми», чтобы добавить масло, фильтры, тормозную жидкость и другие операции. Потом настройте интервалы под свой автомобиль.', '') + '</div>';
  } else {
    html += reg.map(function (r) {
      var st = regimenStatus(r, car);
      var cls = st.overdue ? 'red' : (st.soon ? 'orange' : 'green');
      var badge = st.overdue ? 'просрочено' : (st.soon ? 'скоро' : 'в норме');
      var preset = isPresetRegimen(r);
      return '<div class="work-group regimen-card" data-action="regimen-apply" data-car="' + esc(car.id) + '" data-id="' + esc(r.id) + '">' +
        '<div class="work-group-head">' + icon(catIcon(r.cat)) + esc(r.title) + ' <span class="badge ' + cls + '">' + badge + '</span>' + (preset ? '<span class="badge gray">основной</span>' : '') + '</div>' +
        '<div class="work-line"><div>' +
        '<div class="wl-name">Интервал: ' + (r.intervalKm ? distText(r.intervalKm) : '—') + (r.intervalMonths ? ' / ' + r.intervalMonths + ' мес.' : '') + '</div>' +
        '<div class="wl-note">' + (r.lastDate || r.lastMileage ? ('Последнее: ' + (r.lastDate ? fmtDate(r.lastDate) : '') + (r.lastMileage ? ' · ' + distText(r.lastMileage) : '') + (st.text ? ' · ' + st.text : '')) : 'Ещё не выполнялось') + (r.note ? ' · ' + esc(r.note) : '') + '</div>' +
        '</div><div class="reg-actions">' +
        '<button type="button" class="wi-edit-btn" data-action="regimen-apply" data-car="' + esc(car.id) + '" data-id="' + esc(r.id) + '" aria-label="Отметить выполнение">' + icon('check') + '</button>' +
        '<a class="wi-edit-btn" data-action="regimen-edit" data-car="' + esc(car.id) + '" data-id="' + esc(r.id) + '" aria-label="Изменить">' + icon('pencil') + '</a>' +
        (preset ? '' : '<button type="button" class="del" data-action="regimen-delete" data-car="' + esc(car.id) + '" data-id="' + esc(r.id) + '" aria-label="Удалить">' + icon('x') + '</button>') +
        '</div></div></div>';
    }).join('');
  }
  html += '</main>';
  return html;
}
