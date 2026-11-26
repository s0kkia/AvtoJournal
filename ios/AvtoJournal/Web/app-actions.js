/* АвтоЖурнал — действия и инициализация */
'use strict';

function bindView(route) {
  if (route.name === 'carForm') {
    var makeInput = document.getElementById('carMake');
    var modelList = document.getElementById('carModelList');
    if (makeInput && modelList) {
      var updateModels = function () {
        var models = (window.CAR_MODELS && window.CAR_MODELS[makeInput.value.trim()]) || [];
        modelList.innerHTML = models.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('');
      };
      makeInput.addEventListener('input', updateModels);
      makeInput.addEventListener('change', updateModels);
      updateModels();
    }
  }
  if (route.name === 'recordForm') {
    var wpi = document.getElementById('workPhotoInput');
    if (wpi) {
      wpi.onchange = function () {
        var f = wpi.files && wpi.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          compressImage(String(r.result)).then(function (res) {
            if (!res) { toast('Не удалось обработать фото', 'err'); return; }
            if (workPhotoTarget === null) {
              draft.workPhoto = res.data;
            } else if (draft.works[workPhotoTarget]) {
              draft.works[workPhotoTarget].photo = res.data;
            }
            workPhotoTarget = null;
            refreshRecordBuilder();
            // re-render preview by updating draft? Need render form to show preview. Use refresh? We'll just render.
            // Update pending preview manually:
            var preview = document.querySelector('.work-photo-preview');
            if (draft.workPhoto && !preview) {
              var box = document.querySelector('.add-work-grid');
              if (box) {
                var div = document.createElement('div');
                div.className = 'work-photo-preview';
                div.style.backgroundImage = "url('" + draft.workPhoto + "')";
                box.parentNode.insertBefore(div, box.nextSibling);
              }
            }
            if (draft.workPhoto) {
              var btn = document.querySelector('[data-action="pick-work-photo"]');
              if (btn) btn.textContent = 'Фото добавлено';
            }
            toast('Фото добавлено', 'ok');
          });
        };
        r.readAsDataURL(f);
      };
    }
    var recMileage = document.getElementById('recMileage');
    if (recMileage) recMileage.addEventListener('focus', function () { recMileage.select(); });
    ['workPrice', 'workName'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); addWorkFromForm(); }
      });
    });
  }
  if (route.name === 'partForm') {
    var ppi = document.getElementById('partPhotoInput');
    if (ppi) {
      ppi.onchange = function () {
        var f = ppi.files && ppi.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          compressImage(String(r.result)).then(function (res) {
            if (!res) { toast('Не удалось обработать фото', 'err'); return; }
            partDraft.photo = res.data;
            var wrap = document.getElementById('partPhotoWrap');
            if (wrap) wrap.innerHTML = partPhotoBoxHtml();
            toast('Фото добавлено', 'ok');
          });
        };
        r.readAsDataURL(f);
      };
    }
  }
}

/* ============================ Действия ============================ */
function handleAction(action, el) {
  try {
    switch (action) {
      case 'open-drawer': document.body.classList.add('drawer-open'); break;
      case 'close-drawer': document.body.classList.remove('drawer-open'); break;
      case 'back': smartBack(); break;
      case 'add-car': nav('/car/new'); break;
      case 'add-record': nav('/car/' + el.getAttribute('data-id') + '/new'); break;
      case 'new-plan': nav('/plans/new'); break;
      case 'new-regimen': nav('/car/' + el.getAttribute('data-id') + '/regimen/new'); break;
      case 'new-part': nav('/car/' + el.getAttribute('data-id') + '/part/new'); break;
      case 'edit-car': nav('/car/' + el.getAttribute('data-id') + '/edit'); break;
      case 'edit-record': nav('/car/' + el.getAttribute('data-car') + '/rec/' + el.getAttribute('data-id') + '/edit'); break;
      case 'delete-car': deleteCar(el.getAttribute('data-id')); break;
      case 'delete-record': deleteRecord(el.getAttribute('data-car'), el.getAttribute('data-id')); break;
      case 'delete-plan': deletePlan(el.getAttribute('data-id')); break;
      case 'toggle-plan': togglePlan(el.getAttribute('data-id')); break;
      case 'plan-filter': state.ui.planFilter = el.getAttribute('data-filter'); render(); break;
      case 'pdf': exportPdf(el.getAttribute('data-id')); break;
      case 'pick-cat':
        if (draft) { draft.cat = el.getAttribute('data-cat'); draft.sub = null; refreshRecordBuilder(); }
        break;
      case 'pick-sub':
        if (draft) { draft.sub = el.getAttribute('data-sub'); refreshRecordBuilder(); }
        break;
      case 'add-work': addWorkFromForm(); break;
      case 'edit-work': editWork(parseInt(el.getAttribute('data-i'), 10)); break;
      case 'pick-work-photo': pickWorkPhoto(); break;
      case 'work-photo': assignWorkPhoto(parseInt(el.getAttribute('data-i'), 10)); break;
      case 'remove-work':
        if (draft) { draft.works.splice(parseInt(el.getAttribute('data-i'), 10), 1); refreshRecordBuilder(); }
        break;
      case 'save-record': saveRecordForm(); break;
      case 'save-car': saveCarForm(); break;
      case 'save-plan': savePlanForm(); break;
      case 'save-fuel': saveFuelForm(); break;
      case 'delete-fuel': deleteFuel(el.getAttribute('data-id')); break;
      case 'save-regimen': saveRegimenForm(); break;
      case 'save-document': saveDocumentForm(); break;
      case 'save-fault': saveFaultForm(); break;
      case 'save-part': savePartForm(); break;
      case 'part-delete': deletePart(el.getAttribute('data-car'), el.getAttribute('data-id')); break;
      case 'pick-part-photo': pickPartPhoto(); break;
      case 'remove-part-photo':
        partDraft.photo = null;
        var partWrap = document.getElementById('partPhotoWrap');
        if (partWrap) partWrap.innerHTML = partPhotoBoxHtml();
        break;
      case 'fill-regimen': fillDefaultRegimen(el.getAttribute('data-id')); render(); toast('Регламент заполнен', 'ok'); break;
      case 'regimen-apply': applyRegimen(el.getAttribute('data-car'), el.getAttribute('data-id')); break;
      case 'regimen-edit': nav('/car/' + el.getAttribute('data-car') + '/regimen/' + el.getAttribute('data-id') + '/edit'); break;
      case 'regimen-delete': deleteRegimenItem(el.getAttribute('data-car'), el.getAttribute('data-id')); break;
      case 'doc-delete': deleteDocument(el.getAttribute('data-id')); break;
      case 'fault-toggle': toggleFault(el.getAttribute('data-id')); break;
      case 'fault-delete': deleteFault(el.getAttribute('data-id')); break;
      case 'set-theme':
        state.settings.theme = el.getAttribute('data-theme');
        saveSettings();
        applyTheme();
        render();
        break;
      case 'pick-photo': choosePhoto(); break;
      case 'remove-photo':
        carDraft.photo = null; carDraft.ratio = 1.5;
        var wrap = document.getElementById('photoWrap');
        if (wrap) wrap.innerHTML = photoBoxHtml();
        break;
      case 'export-backup': exportBackup(); break;
      case 'import-backup': importBackup(); break;
      case 'demo-data': addDemoData(); break;
      case 'reset-data': resetAllData(); break;
      case 'dismiss-overdue': state.ui.overdueDismissed = true; render(); break;
      case 'check-update': if (typeof window.manualCheckUpdate === 'function') window.manualCheckUpdate(); break;
      default: break;
    }
  } catch (e) {
    console.error(e);
    toast('Ошибка: ' + (e && e.message ? e.message : 'неизвестно'), 'err');
  }
}

/* ============================ Автомобили ============================ */
async function deleteCar(carId) {
  var car = getCar(carId);
  if (!car) return;
  var ok = await confirmDialog({
    title: 'Удалить автомобиль?',
    text: '«' + carName(car) + '» и вся история его ТО, планы будут удалены без возможности восстановления.',
    okLabel: 'Удалить',
    danger: true
  });
  if (!ok) return;
  state.data.cars = state.data.cars.filter(function (c) { return c.id !== carId; });
  state.data.records = state.data.records.filter(function (r) { return r.carId !== carId; });
  state.data.plans = state.data.plans.filter(function (p) { return p.carId !== carId; });
  state.data.fuelings = state.data.fuelings.filter(function (f) { return f.carId !== carId; });
  state.data.documents = state.data.documents.filter(function (d) { return d.carId !== carId; });
  state.data.faults = state.data.faults.filter(function (f) { return f.carId !== carId; });
  state.data.parts = state.data.parts.filter(function (p) { return p.carId !== carId; });
  if (!saveData()) return;
  nav('/');
  toast('Автомобиль удалён', 'ok');
}

function saveCarForm() {
  var make = ($('#carMake') || {}).value || '';
  var model = ($('#carModel') || {}).value || '';
  make = make.trim(); model = model.trim();
  if (!make && !model) { toast('Укажите марку или модель', 'err'); return; }
  var route = state.route || parseRoute();
  var car = route.id ? getCar(route.id) : null;
  var vin = (($('#carVin') || {}).value || '').trim().toUpperCase();
  if (vin) {
    if (vin.length !== 17) { toast('VIN должен содержать 17 символов', 'err'); return; }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) { toast('Некорректный VIN', 'err'); return; }
    var dupCar = state.data.cars.find(function (c) { return c.id !== (car ? car.id : null) && c.vin === vin; });
    if (dupCar) { toast('Автомобиль с таким VIN уже есть в гараже', 'err'); return; }
  }
  var year = parseInt(($('#carYear') || {}).value, 10);
  var plate = (($('#carPlate') || {}).value || '').trim().toUpperCase();
  var fuel = (($('#carFuel') || {}).value) || 'petrol';
  var color = (($('#carColor') || {}).value || '').trim();
  var mileage = unitToKm(Math.max(0, num(($('#carMileage') || {}).value, 0)));
  var notes = (($('#carNotes') || {}).value || '').trim();

  if (!car) {
    car = { id: uid(), createdAt: Date.now() };
    state.data.cars.push(car);
  }
  car.make = make;
  car.model = model;
  car.name = [make, model].filter(Boolean).join(' ');
  car.year = (year >= 1900 && year <= 2100) ? year : '';
  car.plate = plate;
  car.vin = vin;
  car.fuel = FUELS[fuel] ? fuel : 'petrol';
  car.color = color;
  car.mileage = Math.round(mileage);
  car.notes = notes;
  car.photo = carDraft.photo || '';
  car.photoRatio = carDraft.photo ? carDraft.ratio : 1.5;
  if (!route.id) seedDefaultRegimen(car);
  car.updatedAt = Date.now();
  if (!saveData()) return;
  toast(route.id ? 'Автомобиль обновлён' : 'Автомобиль добавлен', 'ok');
  nav('/car/' + car.id);
}

/* ============================ Записи ТО ============================ */
async function deleteRecord(carId, recId) {
  var rec = getRecord(recId);
  if (!rec) return;
  var ok = await confirmDialog({
    title: 'Удалить запись ТО?',
    text: 'Запись от ' + fmtDate(rec.date) + ' будет удалена. Пробег автомобиля не изменится.',
    okLabel: 'Удалить',
    danger: true
  });
  if (!ok) return;
  state.data.records = state.data.records.filter(function (r) { return r.id !== recId; });
  if (!saveData()) return;
  nav('/car/' + carId);
  toast('Запись удалена', 'ok');
}

function addWorkFromForm() {
  if (!draft) return;
  var nameInput = document.getElementById('workName');
  var priceInput = document.getElementById('workPrice');
  var custom = nameInput ? nameInput.value.trim() : '';
  var sub = draft.sub || '';
  var note = '';
  if (!sub && custom) { sub = custom; }
  else if (sub && custom) { note = custom; }
  if (!sub) { toast('Выберите работу из списка или введите свою', 'err'); return; }
  var price = Math.max(0, num(priceInput ? priceInput.value : 0, 0));
  draft.works.push({ cat: draft.cat, sub: sub, price: price, note: note, photo: draft.workPhoto || '' });
  draft.workPhoto = null;
  draft.sub = null;
  if (nameInput) nameInput.value = '';
  if (priceInput) priceInput.value = '';
  refreshRecordBuilder();
  toast('Работа добавлена', 'ok');
}

async function saveRecordForm() {
  if (!draft) return;
  var car = getCar(draft.carId);
  if (!car) return;
  var date = ($('#recDate') || {}).value || '';
  var mileageRaw = ($('#recMileage') || {}).value;
  var mileage = Math.round(unitToKm(Math.max(0, num(mileageRaw, 0))));
  var note = (($('#recNote') || {}).value || '').trim();
  if (!date) { toast('Укажите дату', 'err'); return; }
  if (mileageRaw === '' || !isFinite(num(mileageRaw, NaN))) { toast('Укажите пробег', 'err'); return; }
  if (!draft.works.length) { toast('Добавьте хотя бы одну работу', 'err'); return; }
  var prevMaxMileage = 0;
  state.data.records.filter(function (r) { return r.carId === car.id && r.id !== draft.recordId; }).forEach(function (r) {
    prevMaxMileage = Math.max(prevMaxMileage, num(r.mileage));
  });
  if (mileage < prevMaxMileage) {
    var okChrono = await confirmDialog({
      title: 'Пробег меньше предыдущего',
      text: 'Новый пробег (' + distText(mileage) + ') меньше предыдущего максимального (' + distText(prevMaxMileage) + '). Сохранить как исправление?',
      okLabel: 'Сохранить'
    });
    if (!okChrono) return;
  }

  var rec;
  if (draft.recordId) {
    rec = getRecord(draft.recordId);
    if (!rec) { toast('Запись не найдена', 'err'); return; }
  } else {
    rec = { id: uid(), carId: car.id, createdAt: Date.now() };
    state.data.records.push(rec);
  }
  rec.date = date;
  rec.mileage = mileage;
  rec.works = draft.works.map(function (w) { return { cat: w.cat, sub: w.sub, price: Math.max(0, num(w.price)), note: w.note || '', photo: w.photo || '' }; });
  rec.note = note;
  rec.updatedAt = Date.now();

  var maxMileage = Math.max(num(car.mileage), mileage);
  state.data.records.filter(function (r) { return r.carId === car.id; }).forEach(function (r) {
    maxMileage = Math.max(maxMileage, num(r.mileage));
  });
  car.mileage = Math.round(maxMileage);
  car.updatedAt = Date.now();

  if (!saveData()) return;
  var wasEdit = !!draft.recordId;
  draft = null;
  toast(wasEdit ? 'Запись обновлена' : 'ТО сохранено', 'ok');
  nav('/car/' + car.id);
}

/* ============================ Планы ============================ */
function savePlanForm() {
  var route = state.route || parseRoute();
  var carId = ($('#planCar') || {}).value;
  if (!carId || !getCar(carId)) { toast('Выберите автомобиль', 'err'); return; }
  var title = (($('#planTitle') || {}).value || '').trim();
  if (!title) { toast('Напишите, что нужно сделать', 'err'); return; }
  var cat = (($('#planCat') || {}).value) || 'engine';
  var priority = (($('#planPriority') || {}).value) || 'mid';
  var dueDate = (($('#planDate') || {}).value) || '';
  var dueMileageRaw = (($('#planMileage') || {}).value) || '';
  var cost = Math.max(0, num(($('#planCost') || {}).value, 0));
  var note = (($('#planNote') || {}).value || '').trim();

  var plan = route.id ? getPlan(route.id) : null;
  if (!plan) {
    plan = { id: uid(), createdAt: Date.now(), done: false };
    state.data.plans.push(plan);
  }
  plan.carId = carId;
  plan.title = title;
  plan.cat = cat;
  plan.priority = priority;
  plan.dueDate = dueDate || null;
  plan.dueMileage = dueMileageRaw === '' ? null : Math.round(unitToKm(Math.max(0, num(dueMileageRaw))));
  plan.cost = cost;
  plan.note = note;
  if (!saveData()) return;
  toast(route.id ? 'План обновлён' : 'План добавлен', 'ok');
  nav('/plans');
}

function togglePlan(planId) {
  var p = getPlan(planId);
  if (!p) return;
  p.done = !p.done;
  p.doneAt = p.done ? Date.now() : null;
  if (!saveData()) return;
  render();
  toast(p.done ? 'Отмечено выполненным' : 'Возвращено в планы', 'ok');
}

async function deletePlan(planId) {
  var p = getPlan(planId);
  if (!p) return;
  var ok = await confirmDialog({
    title: 'Удалить план?',
    text: '«' + p.title + '» будет удалён.',
    okLabel: 'Удалить',
    danger: true
  });
  if (!ok) return;
  state.data.plans = state.data.plans.filter(function (x) { return x.id !== planId; });
  if (!saveData()) return;
  nav('/plans');
  toast('План удалён', 'ok');
}

/* ============================ Фото ============================ */
function pickImageFile() {
  return new Promise(function (resolve) {
    var inp = document.getElementById('photoInput');
    if (!inp) return resolve(null);
    inp.value = '';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return resolve(null);
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(f);
    };
    inp.click();
  });
}
function compressImage(dataUrl) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      try {
        var maxW = 1400, maxH = 1000;
        var w = img.width || 1, h = img.height || 1;
        var sc = Math.min(1, maxW / w, maxH / h);
        w = Math.round(w * sc); h = Math.round(h * sc);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ data: canvas.toDataURL('image/jpeg', 0.82), ratio: w / h });
      } catch (e) { resolve(null); }
    };
    img.onerror = function () { resolve(null); };
    img.src = dataUrl;
  });
}
async function choosePhoto() {
  var raw = await pickImageFile();
  if (!raw) return;
  var res = await compressImage(raw);
  if (!res) { toast('Не удалось обработать фото', 'err'); return; }
  carDraft.photo = res.data;
  carDraft.ratio = res.ratio;
  var wrap = document.getElementById('photoWrap');
  if (wrap) wrap.innerHTML = photoBoxHtml();
  toast('Фото добавлено', 'ok');
}

/* ============================ Настройки ============================ */
function applySetting(key, value) {
  var s = state.settings;
  if (key === 'currency') {
    if (!CURRENCY_SYMBOL[value]) return;
    s.currency = value; saveSettings(); render(); toast('Валюта: ' + value, 'ok');
  } else if (key === 'units') {
    s.units = value === 'mi' ? 'mi' : 'km';
    saveSettings(); render(); toast('Единицы: ' + (s.units === 'mi' ? 'мили' : 'километры'), 'ok');
  } else if (key === 'intervalKm') {
    s.intervalKm = Math.max(1000, Math.round(num(value, 10000) * (s.units === 'mi' ? KM_PER_MI : 1)));
    saveSettings();
  } else if (key === 'intervalMonths') {
    s.intervalMonths = Math.round(clamp(num(value, 12), 1, 60));
    saveSettings();
  }
}

/* ============================ Бэкап / демо ============================ */
function bytesToBase64(bytes) {
  var s = '', chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
function saveBinary(name, mime, b64) {
  try {
    if (window.AndroidBridge && typeof AndroidBridge.saveBase64 === 'function') {
      var p = AndroidBridge.saveBase64(name, mime, b64);
      if (p && String(p).indexOf('ERR:') !== 0) return true;
    }
  } catch (e) { console.warn('bridge save', e); }
  try {
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var blob = new Blob([arr], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
    return true;
  } catch (e) { console.error(e); return false; }
}
function exportBackup() {
  var payload = {
    app: 'АвтоЖурнал',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state.data,
    settings: state.settings
  };
  try {
    var bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    var b64 = bytesToBase64(bytes);
    var name = 'AvtoJournal-backup-' + todayISO() + '.json';
    if (saveBinary(name, 'application/json', b64)) toast('Копия сохранена: Download/Программы', 'ok');
    else toast('Не удалось сохранить копию', 'err');
  } catch (e) {
    toast('Ошибка экспорта: ' + e.message, 'err');
  }
}
function readFileText(file) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(String(r.result)); };
    r.onerror = function () { reject(r.error || new Error('read error')); };
    r.readAsText(file, 'utf-8');
  });
}
function pickJsonFile() {
  return new Promise(function (resolve) {
    var inp = document.getElementById('importInput');
    if (!inp) return resolve(null);
    inp.value = '';
    inp.onchange = function () { resolve(inp.files && inp.files[0] ? inp.files[0] : null); };
    inp.click();
  });
}
async function importBackup() {
  var file = await pickJsonFile();
  if (!file) return;
  var text;
  try { text = await readFileText(file); }
  catch (e) { toast('Не удалось прочитать файл', 'err'); return; }
  var parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { toast('Файл повреждён или это не JSON', 'err'); return; }
  var payload = null;
  if (parsed && parsed.data && Array.isArray(parsed.data.cars)) payload = parsed.data;
  else if (parsed && Array.isArray(parsed.cars)) payload = parsed;
  if (!payload) { toast('Неверный формат резервной копии', 'err'); return; }
  var ok = await confirmDialog({
    title: 'Импортировать данные?',
    text: 'Текущие автомобили, записи и планы будут заменены данными из файла.',
    okLabel: 'Импортировать',
    danger: true
  });
  if (!ok) return;
  try { localStorage.setItem('autojournal.backup.last', JSON.stringify(state.data)); } catch (e) {}
  state.data = normalizeData(payload);
  restoreDefaultRegimens();
  if (parsed.settings && typeof parsed.settings === 'object') {
    var src = parsed.settings;
    if (['dark', 'light', 'auto'].indexOf(src.theme) !== -1) state.settings.theme = src.theme;
    if (CURRENCY_SYMBOL[src.currency]) state.settings.currency = src.currency;
    if (src.units === 'km' || src.units === 'mi') state.settings.units = src.units;
    state.settings.intervalKm = Math.max(1000, num(src.intervalKm, state.settings.intervalKm));
    state.settings.intervalMonths = clamp(num(src.intervalMonths, state.settings.intervalMonths), 1, 60);
  }
  if (!saveData()) return;
  saveSettings();
  applyTheme();
  nav('/');
  toast('Данные восстановлены', 'ok');
}
async function resetAllData() {
  var ok = await confirmDialog({
    title: 'Удалить все данные?',
    text: 'Все автомобили, записи ТО и планы будут удалены без возможности восстановления. Сначала сделайте резервную копию!',
    okLabel: 'Удалить всё',
    danger: true
  });
  if (!ok) return;
  state.data = { cars: [], records: [], plans: [], createdAt: Date.now() };
  saveData();
  nav('/');
  toast('Все данные удалены', 'ok');
}
function addDemoData() {
  confirmDialog({
    title: 'Добавить демо-данные?',
    text: 'В гараж будут добавлены два примера автомобилей с историей ТО и планами. Ваши данные не пострадают.',
    okLabel: 'Добавить'
  }).then(function (ok) {
    if (!ok) return;
    buildDemoData();
    if (!saveData()) return;
    nav('/');
    toast('Демо-данные добавлены', 'ok');
  });
}
function buildDemoData() {
  var car1 = {
    id: uid(), make: 'Skoda', model: 'Octavia', year: 2019, plate: 'А123ВС 77',
    vin: 'XW8AC6NE0KZ123456', fuel: 'petrol', color: 'Серебристый',
    mileage: 84320, notes: '1.8 TSI. Обслуживание у дилера до 2023 года.', createdAt: Date.now() - 6000000
  };
  var car2 = {
    id: uid(), make: 'Toyota', model: 'Land Cruiser 150', year: 2015, plate: 'М456ОР 99',
    vin: 'JTEBH9FJX0K123456', fuel: 'diesel', color: 'Чёрный',
    mileage: 178500, notes: 'Экспедиционный автомобиль, ТО каждые 10 000 км.', createdAt: Date.now() - 9000000
  };
  state.data.cars.push(car1, car2);

  state.data.records.push(
    {
      id: uid(), carId: car1.id, date: daysAgoISO(35), mileage: 81200,
      works: [
        { cat: 'engine', sub: 'Масло и масляный фильтр', price: 4800 },
        { cat: 'engine', sub: 'Воздушный фильтр', price: 1900 },
        { cat: 'body', sub: 'Салонный фильтр', price: 1200 }
      ],
      note: 'Плановое ТО у официального дилера.', createdAt: Date.now() - 3000000
    },
    {
      id: uid(), carId: car1.id, date: daysAgoISO(170), mileage: 77400,
      works: [
        { cat: 'brakes', sub: 'Колодки передние', price: 7200 },
        { cat: 'brakes', sub: 'Диски тормозные', price: 5400 }
      ],
      note: 'Замена передних тормозов.', createdAt: Date.now() - 5000000
    },
    {
      id: uid(), carId: car1.id, date: daysAgoISO(320), mileage: 73100,
      works: [
        { cat: 'engine', sub: 'Масло и масляный фильтр', price: 4500 },
        { cat: 'electric', sub: 'Аккумулятор', price: 8500 }
      ],
      note: '', createdAt: Date.now() - 9000000
    },
    {
      id: uid(), carId: car2.id, date: daysAgoISO(60), mileage: 174000,
      works: [
        { cat: 'engine', sub: 'Масло и масляный фильтр', price: 8500 },
        { cat: 'engine', sub: 'Топливный фильтр', price: 4200 },
        { cat: 'engine', sub: 'Воздушный фильтр', price: 2800 }
      ],
      note: 'Расходники оригинальные.', createdAt: Date.now() - 2000000
    },
    {
      id: uid(), carId: car2.id, date: daysAgoISO(250), mileage: 168000,
      works: [
        { cat: 'transmission', sub: 'Масло АКПП / вариатор', price: 12000 },
        { cat: 'brakes', sub: 'Колодки задние', price: 6500 }
      ],
      note: '', createdAt: Date.now() - 7000000
    }
  );

  state.data.plans.push(
    {
      id: uid(), carId: car1.id, title: 'Замена масла и фильтров', cat: 'engine',
      priority: 'mid', dueDate: addMonths(todayISO(), 1), dueMileage: 90000,
      cost: 6500, note: 'Масло 5W-30, фильтр MANN.', done: false, createdAt: Date.now()
    },
    {
      id: uid(), carId: car1.id, title: 'Замена тормозной жидкости', cat: 'brakes',
      priority: 'high', dueDate: daysAgoISO(10), dueMileage: null,
      cost: 3200, note: 'Просрочено — записаться в сервис.', done: false, createdAt: Date.now() - 100000
    },
    {
      id: uid(), carId: car1.id, title: 'Сезонная замена шин', cat: 'tires',
      priority: 'mid', dueDate: addMonths(todayISO(), 1), dueMileage: null,
      cost: 4000, note: 'Зимний комплект в шиномонтаже.', done: false, createdAt: Date.now()
    },
    {
      id: uid(), carId: car2.id, title: 'Замена свечей накаливания', cat: 'engine',
      priority: 'high', dueDate: null, dueMileage: 185000,
      cost: 9000, note: 'Проверить при холодном запуске.', done: false, createdAt: Date.now()
    },
    {
      id: uid(), carId: car2.id, title: 'Пройти техосмотр', cat: 'other',
      priority: 'mid', dueDate: addMonths(todayISO(), 1), dueMileage: null,
      cost: 1500, note: '', done: false, createdAt: Date.now()
    }
  );
}

/* ============================ Инициализация ============================ */
function initApp() {
  applyTheme();
  restoreDefaultRegimens();

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    e.preventDefault();
    handleAction(el.getAttribute('data-action'), el);
  });

  document.addEventListener('change', function (e) {
    var settingEl = e.target.closest ? e.target.closest('[data-setting]') : null;
    if (settingEl) {
      applySetting(settingEl.getAttribute('data-setting'), settingEl.value);
      return;
    }
    var statEl = e.target.closest ? e.target.closest('[data-stat-car]') : null;
    if (statEl) {
      state.ui.statCar = statEl.value;
      render();
    }
  });

  window.addEventListener('hashchange', function () {
    document.body.classList.remove('drawer-open');
    render();
    window.scrollTo(0, 0);
  });

  function parentPath(route) {
    if (!route) return '/';
    var cid = route.carId;
    switch (route.name) {
      case 'home': return null;
      case 'car': return '/';
      case 'history': return '/car/' + cid;
      case 'record': return cid ? '/car/' + cid : '/';
      case 'recordForm': return cid ? '/car/' + cid : '/';
      case 'carForm': return route.id ? '/car/' + route.id : '/';
      case 'regimen': return '/car/' + cid;
      case 'regimenForm': return '/car/' + cid + '/regimen';
      case 'fuelForm': return '/car/' + cid;
      case 'documentForm': return '/car/' + cid;
      case 'faultForm': return '/car/' + cid;
      case 'parts': return '/car/' + cid;
      case 'partForm': return '/car/' + cid + '/parts';
      case 'faults': return '/car/' + cid;
      case 'documents': return '/car/' + cid;
      case 'fuelings': return '/car/' + cid;
      case 'carPlans': return '/car/' + cid;
      case 'planForm': return cid ? '/car/' + cid : '/plans';
      case 'plans': return '/';
      case 'stats': return '/';
      case 'settings': return '/';
      case 'about': return '/';
      default: return '/';
    }
  }
  window.smartBack = function () {
    var target = parentPath(parseRoute());
    if (target) { nav(target); return true; }
    return false;
  };
  window.appOnBack = function () {
    if (document.body.classList.contains('drawer-open')) {
      document.body.classList.remove('drawer-open');
      return true;
    }
    if (anyOverlayOpen()) {
      var root = document.getElementById('modalRoot');
      if (root) root.innerHTML = '';
      return true;
    }
    var target = parentPath(parseRoute());
    if (target) { nav(target); return true; }
    return 'exit';
  };

  try {
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: light)');
      var onChange = function () { if (state.settings.theme === 'auto') applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  } catch (e) {}

  render();
}

initApp();

/* ============================ Фото работ ============================ */
var workPhotoTarget = null;
function pickWorkPhoto() {
  workPhotoTarget = null;
  var inp = document.getElementById('workPhotoInput');
  if (inp) { inp.value = ''; inp.click(); }
}
function assignWorkPhoto(i) {
  workPhotoTarget = i;
  var inp = document.getElementById('workPhotoInput');
  if (inp) { inp.value = ''; inp.click(); }
}


function editWork(i) {
  if (!draft || !draft.works || !draft.works[i]) return;
  var w = draft.works[i];
  draft.cat = w.cat || draft.cat;
  draft.sub = w.sub || null;
  draft.workPhoto = w.photo || null;
  var nameInput = document.getElementById('workName');
  var priceInput = document.getElementById('workPrice');
  if (nameInput) nameInput.value = w.note || '';
  if (priceInput) priceInput.value = (w.price ? w.price : '');
  draft.works.splice(i, 1);
  refreshRecordBuilder();
  toast('Работа перенесена в форму. Измените и нажмите «Добавить».', 'ok');
}


/* ============================ Заправки ============================ */
function saveFuelForm() {
  var route = state.route || parseRoute();
  var car = getCar(route.carId);
  if (!car) { toast('Автомобиль не найден', 'err'); return; }
  var date = ($('#fuelDate') || {}).value || '';
  var mileageRaw = ($('#fuelMileage') || {}).value;
  var mileage = Math.round(unitToKm(Math.max(0, num(mileageRaw, 0))));
  var liters = Math.max(0, num(($('#fuelLiters') || {}).value, 0));
  var price = Math.max(0, num(($('#fuelPrice') || {}).value, 0));
  var totalRaw = (($('#fuelTotal') || {}).value || '').trim();
  var total = totalRaw === '' ? (liters * price) : Math.max(0, num(totalRaw, 0));
  var station = (($('#fuelStation') || {}).value || '').trim();
  var fuel = (($('#fuelType') || {}).value) || car.fuel || 'petrol';
  var note = (($('#fuelNote') || {}).value || '').trim();
  if (!date) { toast('Укажите дату', 'err'); return; }
  if (mileageRaw === '') { toast('Укажите пробег', 'err'); return; }
  if (liters <= 0 && total <= 0) { toast('Укажите литры или сумму', 'err'); return; }

  var fueling = route.id ? getFueling(route.id) : null;
  if (!fueling) {
    fueling = { id: uid(), carId: car.id, createdAt: Date.now() };
    state.data.fuelings.push(fueling);
  }
  fueling.date = date;
  fueling.mileage = mileage;
  fueling.liters = liters;
  fueling.pricePerLiter = price;
  fueling.total = Math.round(total * 100) / 100;
  fueling.station = station;
  fueling.fuel = FUELS[fuel] ? fuel : (car.fuel || 'petrol');
  fueling.note = note;
  fueling.updatedAt = Date.now();

  if (mileage > num(car.mileage)) { car.mileage = mileage; car.updatedAt = Date.now(); }

  if (!saveData()) return;
  toast(route.id ? 'Заправка обновлена' : 'Заправка сохранена', 'ok');
  nav('/car/' + car.id);
}

async function deleteFuel(id) {
  var f = getFueling(id);
  if (!f) return;
  var ok = await confirmDialog({ title: 'Удалить заправку?', text: 'Запись будет удалена.', okLabel: 'Удалить', danger: true });
  if (!ok) return;
  state.data.fuelings = state.data.fuelings.filter(function (x) { return x.id !== id; });
  if (!saveData()) return;
  var car = getCar(f.carId);
  nav(car ? '/car/' + car.id : '/');
  toast('Заправка удалена', 'ok');
}


/* ============================ Регламент ============================ */
function markRegimenDone(carId, itemId) {
  var car = getCar(carId);
  if (!car || !car.regimen) return;
  var item = car.regimen.find(function (r) { return r.id === itemId; });
  if (!item) return;
  item.lastDate = todayISO();
  item.lastMileage = car.mileage;
  car.updatedAt = Date.now();
  if (!saveData()) return;
  render();
  toast('Отмечено выполненным', 'ok');
}
function deleteRegimenItem(carId, itemId) {
  var car = getCar(carId);
  if (!car || !car.regimen) return;
  var item = car.regimen.find(function (r) { return r.id === itemId; });
  if (item && isPresetRegimen(item)) { toast('Основной пункт регламента нельзя удалить', 'err'); return; }
  car.regimen = car.regimen.filter(function (r) { return r.id !== itemId; });
  car.updatedAt = Date.now();
  if (!saveData()) return;
  nav('/car/' + carId + '/regimen');
  toast('Пункт удалён', 'ok');
}

/* ============================ Документы ============================ */
function deleteDocument(id) {
  var doc = getDocument(id);
  state.data.documents = state.data.documents.filter(function (d) { return d.id !== id; });
  if (!saveData()) return;
  if (doc && doc.carId) nav('/car/' + doc.carId); else render();
  toast('Документ удалён', 'ok');
}

/* ============================ Неисправности ============================ */
function toggleFault(id) {
  var f = getFault(id);
  if (!f) return;
  f.resolved = !f.resolved;
  f.resolvedAt = f.resolved ? Date.now() : null;
  if (!saveData()) return;
  render();
  toast(f.resolved ? 'Отмечено устранённым' : 'Возвращено в активные', 'ok');
}
function deleteFault(id) {
  var fault = getFault(id);
  state.data.faults = state.data.faults.filter(function (f) { return f.id !== id; });
  if (!saveData()) return;
  if (fault && fault.carId) nav('/car/' + fault.carId); else render();
  toast('Запись удалена', 'ok');
}


/* ============================ Регламент форма ============================ */
function regimenApplyDialog(car, item) {
  return new Promise(function (resolve) {
    var root = document.getElementById('modalRoot');
    root.innerHTML = '<div class="modal-overlay" id="regimenOverlay"><div class="modal" role="dialog" aria-modal="true">' +
      '<h3>' + esc(item.title) + '</h3>' +
      '<p>Укажите дату и пробег выполнения. Работа попадёт в запись ТО, а пункт регламента останется на месте.</p>' +
      '<div class="field"><label for="regDate">Дата</label><input class="input" type="date" id="regDate" value="' + esc(todayISO()) + '"></div>' +
      '<div class="field" style="margin-top:10px"><label for="regMileage">Пробег</label><div class="input-wrap"><input class="input" type="number" inputmode="numeric" min="0" step="1" id="regMileage" value="' + unitValue(car.mileage) + '"><span class="suffix">' + unitShort() + '</span></div></div>' +
      '<div class="field" style="margin-top:10px"><label for="regPrice">Стоимость</label><div class="input-wrap"><input class="input" type="number" inputmode="decimal" min="0" step="1" id="regPrice" placeholder="0"><span class="suffix">' + esc(currencySign()) + '</span></div></div>' +
      '<div class="modal-actions"><button class="btn ghost" data-modal="no">Отмена</button><button class="btn primary" data-modal="yes">Добавить в ТО</button></div>' +
      '</div></div>';
    function done(v) { root.innerHTML = ''; resolve(v); }
    var ov = document.getElementById('regimenOverlay');
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return done(null);
      var b = e.target.closest('[data-modal]');
      if (!b) return;
      if (b.getAttribute('data-modal') !== 'yes') return done(null);
      var date = ((document.getElementById('regDate') || {}).value) || '';
      var mraw = (document.getElementById('regMileage') || {}).value;
      var praw = (document.getElementById('regPrice') || {}).value;
      if (!date) { toast('Укажите дату', 'err'); return; }
      if (mraw === '' || !isFinite(num(mraw, NaN))) { toast('Укажите пробег', 'err'); return; }
      done({ date: date, mileage: Math.round(unitToKm(Math.max(0, num(mraw, 0)))), price: praw === '' ? null : Math.max(0, num(praw, 0)) });
    });
  });
}

async function applyRegimen(carId, itemId) {
  var car = getCar(carId);
  var item = getRegimenItem(carId, itemId);
  if (!car || !item) return;
  var res = await regimenApplyDialog(car, item);
  if (!res) return;
  var rec = findRegimenRecord(car.id, res.date, res.mileage);
  var created = false;
  if (!rec) {
    rec = { id: uid(), carId: car.id, date: res.date, mileage: res.mileage, works: [], note: '', fromRegimen: true, createdAt: Date.now() };
    state.data.records.push(rec);
    created = true;
  }
  rec.works = rec.works || [];
  var work = null;
  rec.works.forEach(function (w) { if (w.regimenId === item.id) work = w; });
  var exists = !!work;
  if (!work) {
    work = { cat: item.cat || 'other', sub: item.title, price: res.price == null ? 0 : res.price, note: 'По регламенту', photo: '', regimenId: item.id };
    rec.works.push(work);
  } else {
    work.cat = item.cat || 'other';
    work.sub = item.title;
    if (res.price != null) work.price = res.price;
    if (!work.note) work.note = 'По регламенту';
  }
  rec.updatedAt = Date.now();
  if (res.mileage > num(car.mileage)) car.mileage = res.mileage;
  var newer = !item.lastDate || (res.date || '') > item.lastDate ||
    ((res.date || '') === item.lastDate && num(res.mileage) >= num(item.lastMileage));
  if (newer) { item.lastDate = res.date; item.lastMileage = res.mileage; }
  item.updatedAt = Date.now();
  car.updatedAt = Date.now();
  if (!saveData()) return;
  render();
  if (exists) toast('Работа обновлена в ТО от ' + fmtDate(rec.date), 'ok');
  else toast(created ? 'Создано ТО: ' + fmtDate(res.date) : 'Добавлено в ТО от ' + fmtDate(rec.date), 'ok');
}

function saveRegimenForm() {
  var route = state.route || parseRoute();
  var car = getCar(route.carId);
  if (!car) { toast('Автомобиль не найден', 'err'); return; }
  var title = (($('#regTitle') || {}).value || '').trim();
  if (!title) { toast('Укажите операцию', 'err'); return; }
  var cat = (($('#regCat') || {}).value) || 'engine';
  var intervalKmRaw = (($('#regKm') || {}).value || '').trim();
  var intervalMonthsRaw = (($('#regMonths') || {}).value || '').trim();
  var lastDate = (($('#regLastDate') || {}).value) || '';
  var lastKmRaw = (($('#regLastKm') || {}).value || '').trim();
  var note = (($('#regNote') || {}).value || '').trim();
  var item = route.id ? getRegimenItem(car.id, route.id) : null;
  if (item && item.preset === undefined) item.preset = isPresetRegimen(item);
  if (item && !item.key) {
    var dm = DEFAULT_REGIMEN.find(function (d) { return d.title === item.title; });
    if (dm) item.key = dm.key;
  }
  if (!item) { item = { id: uid(), createdAt: Date.now(), preset: false }; car.regimen = car.regimen || []; car.regimen.push(item); }
  item.title = title;
  item.cat = cat;
  item.intervalKm = intervalKmRaw === '' ? null : Math.round(unitToKm(Math.max(0, num(intervalKmRaw))));
  item.intervalMonths = intervalMonthsRaw === '' ? null : Math.round(clamp(num(intervalMonthsRaw, 0), 0, 120));
  item.lastDate = lastDate || null;
  item.lastMileage = lastKmRaw === '' ? null : Math.round(unitToKm(Math.max(0, num(lastKmRaw))));
  item.note = note;
  car.updatedAt = Date.now();
  if (!saveData()) return;
  toast(route.id ? 'Пункт обновлён' : 'Пункт добавлен', 'ok');
  nav('/car/' + car.id);
}

/* ============================ Документы ============================ */
function saveDocumentForm() {
  var route = state.route || parseRoute();
  var car = getCar(route.carId);
  if (!car) { toast('Автомобиль не найден', 'err'); return; }
  var title = (($('#docTitle') || {}).value) || 'ОСАГО';
  var number = (($('#docNumber') || {}).value || '').trim();
  var start = (($('#docStart') || {}).value) || '';
  var expiry = (($('#docExpiry') || {}).value) || '';
  var cost = Math.max(0, num(($('#docCost') || {}).value, 0));
  var note = (($('#docNote') || {}).value || '').trim();
  var doc = route.id ? getDocument(route.id) : null;
  if (!doc) { doc = { id: uid(), carId: car.id, createdAt: Date.now() }; state.data.documents.push(doc); }
  doc.carId = car.id;
  doc.title = title;
  doc.number = number;
  doc.start = start || null;
  doc.expiry = expiry || null;
  doc.cost = cost;
  doc.note = note;
  doc.updatedAt = Date.now();
  if (!saveData()) return;
  toast(route.id ? 'Документ обновлён' : 'Документ добавлен', 'ok');
  nav('/car/' + car.id);
}

/* ============================ Неисправности ============================ */
function saveFaultForm() {
  var route = state.route || parseRoute();
  var car = getCar(route.carId);
  if (!car) { toast('Автомобиль не найден', 'err'); return; }
  var title = (($('#faultTitle') || {}).value || '').trim();
  if (!title) { toast('Укажите неисправность', 'err'); return; }
  var date = (($('#faultDate') || {}).value) || todayISO();
  var code = (($('#faultCode') || {}).value || '').trim().toUpperCase();
  var mileageRaw = (($('#faultMileage') || {}).value || '').trim();
  var mileage = mileageRaw === '' ? car.mileage : Math.round(unitToKm(Math.max(0, num(mileageRaw))));
  var cost = Math.max(0, num(($('#faultCost') || {}).value, 0));
  var note = (($('#faultNote') || {}).value || '').trim();
  var resolved = !!($('#faultResolved') || {}).checked;
  var fault = route.id ? getFault(route.id) : null;
  if (!fault) { fault = { id: uid(), carId: car.id, createdAt: Date.now() }; state.data.faults.push(fault); }
  fault.carId = car.id;
  fault.title = title;
  fault.date = date;
  fault.code = code || null;
  fault.mileage = mileage;
  fault.cost = cost;
  fault.note = note;
  fault.resolved = resolved;
  fault.resolvedAt = resolved ? (fault.resolvedAt || Date.now()) : null;
  fault.updatedAt = Date.now();
  if (!saveData()) return;
  toast(route.id ? 'Неисправность обновлена' : 'Неисправность добавлена', 'ok');
  nav('/car/' + car.id);
}

/* ============================ Запчасти ============================ */
function pickPartPhoto() {
  var inp = document.getElementById('partPhotoInput');
  if (inp) { inp.value = ''; inp.click(); }
}

async function deletePart(carId, id) {
  var part = getPart(id);
  if (!part) return;
  var cid = carId || part.carId || '';
  var ok = await confirmDialog({
    title: 'Удалить запчасть?',
    text: '«' + part.name + '» будет удалена из каталога.',
    okLabel: 'Удалить',
    danger: true
  });
  if (!ok) return;
  state.data.parts = state.data.parts.filter(function (p) { return p.id !== id; });
  if (!saveData()) return;
  nav(cid ? '/car/' + cid + '/parts' : '/');
  toast('Запчасть удалена', 'ok');
}

function savePartForm() {
  var route = state.route || parseRoute();
  var car = getCar(route.carId);
  if (!car) { toast('Автомобиль не найден', 'err'); return; }
  var name = (($('#partName') || {}).value || '').trim();
  if (!name) { toast('Укажите название запчасти', 'err'); return; }
  var part = route.id ? getPart(route.id) : null;
  if (!part) {
    part = { id: uid(), carId: car.id, createdAt: Date.now() };
    state.data.parts.push(part);
  }
  part.carId = car.id;
  part.name = name;
  part.brand = (($('#partBrand') || {}).value || '').trim();
  part.article = (($('#partArticle') || {}).value || '').trim();
  part.analogs = (($('#partAnalogs') || {}).value || '').trim();
  part.price = Math.max(0, num(($('#partPrice') || {}).value, 0));
  part.qty = Math.max(1, Math.round(num(($('#partQty') || {}).value, 1)));
  part.note = (($('#partNote') || {}).value || '').trim();
  part.photo = partDraft.photo || '';
  part.updatedAt = Date.now();
  if (!saveData()) return;
  toast(route.id ? 'Запчасть обновлена' : 'Запчасть добавлена', 'ok');
  nav('/car/' + car.id + '/parts');
}
