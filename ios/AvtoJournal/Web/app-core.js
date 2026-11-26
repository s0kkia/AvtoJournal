/* АвтоЖурнал — ядро: данные, справочники, утилиты */
'use strict';

var LS_DATA = 'autojournal.data.v1';
var LS_SETTINGS = 'autojournal.settings.v1';
var APP_VERSION = '2.5';
var APP_VERSION_CODE = 16;
var UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/s0kkia/AvtoJournal/main/version.json';
var MI = 0.621371;
var KM_PER_MI = 1.609344;

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function uid() {
  try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 12); } catch (e) {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function num(v, def) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : (def || 0); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function isoDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayISO() { return isoDate(new Date()); }
function parseISO(s) { return new Date(String(s) + 'T12:00:00'); }
function fmtDate(s, opts) {
  if (!s) return '—';
  try { return parseISO(s).toLocaleDateString('ru-RU', opts || { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch (e) { return s; }
}
function fmtDay(s) { try { return parseISO(s).getDate(); } catch (e) { return '—'; } }
function fmtMonthShort(s) { try { return parseISO(s).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''); } catch (e) { return ''; } }
function fmtMonth(s) { try { return parseISO(s).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }).replace('.', ''); } catch (e) { return s; } }
function daysFromToday(s) {
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var d = parseISO(s); d.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}
function daysAgoISO(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
function addMonths(s, n) {
  var d = parseISO(s);
  d.setMonth(d.getMonth() + n);
  return isoDate(d);
}
function plural(n, forms) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
function nf0(n) {
  try { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0); }
  catch (e) { return String(Math.round(n || 0)); }
}
function bytesLabel(n) {
  if (n > 1048576) return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  return Math.max(1, Math.round(n / 1024)) + ' КБ';
}
var CURRENCY_SYMBOL = { RUB: '₽', USD: '$', EUR: '€', KZT: '₸', UAH: '₴', BYN: 'Br' };
function currencySign() { return CURRENCY_SYMBOL[state.settings.currency] || '₽'; }

/* ============================ Иконки ============================ */
var ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h11"/>',
  back: '<path d="M15 19l-7-7 7-7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  car: '<path d="M4 16l1.7-4.9a2.2 2.2 0 0 1 2.1-1.4h8.4a2.2 2.2 0 0 1 2.1 1.4L20 16"/><path d="M3 16h18v4h-3v-2H6v2H3z"/><circle cx="7.2" cy="18" r=".6"/><circle cx="16.8" cy="18" r=".6"/>',
  garage: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-7h10v7"/><path d="M7 17h10"/>',
  engine: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9"/>',
  gearbox: '<path d="M7 5v13M12 5v9M17 5v13"/><circle cx="7" cy="5" r="1.8"/><circle cx="12" cy="5" r="1.8"/><circle cx="17" cy="5" r="1.8"/><circle cx="12" cy="14" r="1.8"/>',
  suspension: '<path d="M8 3h8M8 21h8M9 6c0 1.8 6 1.8 6 3.6s-6 1.8-6 3.6 6 1.8 6 3.6-6 1.8-6 3.6"/>',
  brakes: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/><path d="M12 4v3.4M12 16.6V20M4 12h3.4M16.6 12H20"/>',
  body: '<path d="M4 17l1.5-5a2 2 0 0 1 1.9-1.4h9.2a2 2 0 0 1 1.9 1.4L20 17"/><path d="M3 17h18v3h-3.6M6.6 20H3v-3"/><path d="M8 17h8"/>',
  bolt: '<path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z"/>',
  tire: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.8v5M12 15.2v5M3.8 12h5M15.2 12h5"/>',
  wrench: '<path d="M14.7 6.7a4.2 4.2 0 0 0-5.6 5.5L3.4 17.9l2.7 2.7 5.7-5.7a4.2 4.2 0 0 0 5.5-5.6l-2.6 2.6-2.7-2.6 2.7-2.6z"/>',
  pdf: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 15l4.2-4.2"/><circle cx="12" cy="18" r="1.2"/><path d="M6 15.5l1 1M18 15.5l-1 1"/>',
  fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16"/><path d="M3.5 21h11"/><path d="M14 9h2.5L19 11.5V17a1.8 1.8 0 0 1-3.6 0v-3H14"/><path d="M7 7h5v4H7z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 .3 18c1.9 0 2.8-1 2.8-2.2 0-1.3-1.1-1.8-1.1-3 0-1.2 1-2 2.3-2h2.2c1 0 1.7-.8 1.7-2C20.2 6.5 16.6 3 12 3z"/><circle cx="8" cy="9" r=".9"/><circle cx="12" cy="7" r=".9"/><circle cx="7.5" cy="13.5" r=".9"/>',
  hash: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M7 14h6"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6.5 7l1 14h9l1-14"/><path d="M10 11v6M14 11v6"/>',
  pencil: '<path d="M4 20l4.2-1L19 8.2 15.8 5 5 15.8z"/><path d="M13.5 7.3l3.2 3.2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M2.5 20h19"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  download: '<path d="M12 3.5v12M7 10.5l5 5 5-5M4.5 20h15"/>',
  upload: '<path d="M12 20.5v-12M7 13.5l5-5 5 5M4.5 4h15"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 3.5L2.8 20h18.4z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.7V20h12V9.7"/><path d="M10 20v-5h4v5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1.2"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 15.5L16 10.5 5 20"/>',
  droplet: '<path d="M12 3s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'
};
function icon(name, cls) {
  return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* ============================ Справочник работ ============================ */
var FUELS = { petrol: 'Бензин', diesel: 'Дизель', hybrid: 'Гибрид', gas: 'Газ (ГБО)', electric: 'Электро' };
var ENGINE_BASE = [
  'Масло и масляный фильтр', 'Воздушный фильтр', 'Ремень / цепь ГРМ', 'Приводные ремни', 'Антифриз',
  'Термостат', 'Помпа (водяной насос)', 'Опоры двигателя', 'Масляный насос', 'Топливный насос',
  'Радиатор', 'Патрубки охлаждения', 'Датчик температуры', 'Датчик давления масла', 'Датчик коленвала',
  'Датчик распредвала', 'Клапан PCV', 'Впускной коллектор', 'Выпускной коллектор', 'Глушитель',
  'Катализатор', 'Турбина', 'Интеркулер', 'Натяжитель ремня', 'Ролики приводного ремня',
  'Прокладка ГБЦ', 'Сальники двигателя'
];
var ENGINE_ADD = {
  petrol: ['Свечи зажигания', 'Топливный фильтр', 'Топливная система', 'Форсунки', 'Катушка зажигания', 'Дроссельная заслонка', 'Клапан EGR', 'Лямбда-зонд', 'Вентиляция картера', 'Прокладка клапанной крышки', 'Гидрокомпенсаторы', 'Маслосъёмные колпачки'],
  diesel: ['Свечи накаливания', 'Топливный фильтр', 'Топливная система', 'Форсунки', 'Турбина', 'Сажевый фильтр (DPF)', 'AdBlue', 'Клапан EGR', 'ТНВД', 'Интеркулер', 'Система впрыска Common Rail'],
  hybrid: ['Свечи зажигания', 'Топливный фильтр', 'Батарея ВВБ', 'Инвертор', 'Электромотор', 'Охлаждение батареи', 'Система рекуперации', 'Проверка ВВБ и охлаждения'],
  gas: ['Свечи зажигания', 'ГБО: редуктор', 'ГБО: фильтр', 'ГБО: диагностика', 'Топливный фильтр', 'ГБО: форсунки', 'ГБО: баллон', 'ГБО: мультиклапан'],
  electric: ['Диагностика ВВБ', 'Охлаждение батареи', 'Электромотор', 'Зарядный порт', 'Силовая электроника', 'Инвертор', 'Тепловой насос', 'Редуктор', 'Проверка ВВБ и охлаждения', 'Радиатор охлаждения', 'Помпа охлаждения', 'Патрубки охлаждения', 'Датчик температуры', 'Сальники редуктора']
};
var CATEGORIES = [
  { id: 'engine', name: 'Двигатель', icon: 'engine' },
  { id: 'transmission', name: 'Трансмиссия', icon: 'gearbox' },
  { id: 'suspension', name: 'Подвеска и рулевое', icon: 'suspension' },
  { id: 'brakes', name: 'Тормозная система', icon: 'brakes' },
  { id: 'body', name: 'Кузов и салон', icon: 'body' },
  { id: 'electric', name: 'Электрика', icon: 'bolt' },
  { id: 'tires', name: 'Шины и диски', icon: 'tire' },
  { id: 'other', name: 'Диагностика и прочее', icon: 'wrench' }
];
var SUBS = {
  transmission: ['Масло КПП', 'Масло МКПП', 'Масло АКПП / вариатор', 'Масло робота (DCT/DSG)', 'Замена масла робота с фильтром', 'Фильтр АКПП', 'Фильтр робота / DCT', 'Фильтр МКПП', 'Сцепление', 'Комплект сцепления', 'Выжимной подшипник', 'Маховик', 'Приводы / ШРУС', 'Пыльники ШРУС', 'Раздатка', 'Задний редуктор', 'Передний редуктор', 'Муфта полного привода', 'Мехатроник', 'Блок управления трансмиссией', 'Сальники', 'Подвесной подшипник', 'Карданный вал', 'Крестовины карданного вала', 'Трос сцепления', 'Трос переключения передач', 'Кулиса КПП', 'Подушка КПП', 'Вилка сцепления', 'Датчик скорости', 'Ремонт МКПП', 'Ремонт АКПП', 'Ремонт вариатора', 'Ремонт робота (DCT/DSG)'],
  suspension: ['Амортизаторы передние', 'Амортизаторы задние', 'Пружины', 'Пружины передние', 'Пружины задние', 'Опоры амортизаторов', 'Подшипники опор', 'Пыльники амортизаторов', 'Отбойники', 'Шаровые опоры', 'Рулевые тяги', 'Наконечники рулевых тяг', 'Сайлентблоки передних рычагов', 'Сайлентблоки задней балки', 'Сайлентблоки подрамника', 'Ступичные подшипники', 'Ступица', 'Поворотный кулак', 'Стабилизатор поперечной устойчивости', 'Втулки стабилизатора', 'Стойки стабилизатора', 'Рулевая рейка', 'Пыльники рулевой рейки', 'Рулевая колонка', 'Насос ГУР', 'Жидкость ГУР', 'Электроусилитель руля', 'Развал-схождение', 'Подрамник', 'Рычаги подвески', 'Рычаги задней подвески', 'Задняя балка', 'Пневмоподвеска', 'Пневмобаллоны', 'Компрессор пневмоподвески', 'Датчики положения кузова'],
  brakes: ['Колодки передние', 'Колодки задние', 'Диски тормозные передние', 'Диски тормозные задние', 'Тормозные колодки и диски', 'Тормозная жидкость', 'Суппорты', 'Направляющие суппорта', 'Поршни суппорта', 'Стояночный тормоз', 'Электронный стояночный тормоз', 'Трос ручника', 'Датчики ABS', 'Блок ABS', 'Датчики износа колодок', 'Шланги и трубки', 'Главный тормозной цилиндр', 'Вакуумный усилитель', 'Барабаны тормозные', 'Колодки ручника', 'Регулятор тормозных сил'],
  body: ['Антикоррозийная обработка', 'Полировка кузова', 'Покраска', 'Кузовной ремонт', 'Ремонт вмятин без покраски', 'Ремонт бампера', 'Бампер передний', 'Бампер задний', 'Лобовое стекло', 'Заднее стекло', 'Боковые стёкла', 'Зеркала', 'Щётки стеклоочистителя', 'Дворники', 'Салонный фильтр', 'Заправка кондиционера', 'Чистка кондиционера', 'Химчистка салона', 'Шумоизоляция', 'Сиденья и обивка', 'Перетяжка руля', 'Замки и ручки', 'Оптика и фары', 'Полировка фар', 'Противотуманные фары', 'Брызговики', 'Коврики', 'Капот', 'Передние двери', 'Задние двери', 'Крылья передние', 'Крылья задние', 'Пороги', 'Колёсные арки', 'Крыша', 'Решётка радиатора', 'Молдинги и накладки', 'Тонировка стёкол', 'Защитная плёнка', 'Керамическое покрытие'],
  electric: ['Аккумулятор', 'Аккумулятор (проверка/замена)', 'Лампы и освещение', 'Генератор', 'Регулятор напряжения', 'Стартер', 'Датчики', 'Проводка', 'Мультимедиа / акустика', 'Предохранители', 'Реле', 'Сигнализация', 'Иммобилайзер', 'Стеклоподъёмники', 'Центральный замок', 'Камера заднего вида', 'Парктроники', 'Подогрев сидений', 'Подогрев руля', 'Подогрев лобового стекла', 'Круиз-контроль', 'Диагностика электрики', 'ЭБУ двигателя', 'Блок управления кузовом', 'Кнопка запуска двигателя', 'Замок зажигания', 'Подрулевой переключатель', 'Омыватель стекла', 'Антенна', 'Динамики'],
  tires: ['Сезонная замена шин', 'Балансировка колёс', 'Ремонт шины', 'Ремонт прокола', 'Замена дисков', 'Правка дисков', 'Порошковая покраска дисков', 'Датчики давления', 'Хранение шин', 'Сход-развал', 'Шиномонтаж', 'Герметизация борта', 'Вулканизация', 'Цепи / антипробуксовочные', 'Шины', 'Диски', 'Колёсные болты', 'Секретные болты', 'Ниппели'],
  other: ['Компьютерная диагностика', 'Техосмотр', 'Мойка', 'Эвакуатор', 'Мелкий ремонт', 'Замена стёкол', 'Замена дворников', 'Проверка развал-схождения', 'Проверка тормозов', 'Проверка подвески', 'Замена жидкостей', 'Предпродажная подготовка', 'Установка дополнительного оборудования', 'Прочее']
};
function subsFor(catId, fuel) {
  if (catId === 'engine') {
    if (fuel === 'electric') return ENGINE_ADD.electric.slice();
    var list = ENGINE_BASE.slice();
    var add = ENGINE_ADD[fuel] || ENGINE_ADD.petrol;
    add.forEach(function (x) { if (list.indexOf(x) === -1) list.push(x); });
    return list;
  }
  return (SUBS[catId] || []).slice();
}
function catById(id) {
  for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
  return { id: id || 'other', name: 'Прочее', icon: 'wrench' };
}
function catName(id) { return catById(id).name; }
function catIcon(id) { return catById(id).icon; }

/* ============================ Состояние ============================ */
var DEFAULT_SETTINGS = { theme: 'dark', currency: 'RUB', units: 'km', intervalKm: 10000, intervalMonths: 12 };
var state = {
  data: loadData(),
  settings: loadSettings(),
  route: null,
  ui: { planFilter: 'all', statCar: 'all', overdueDismissed: false }
};
function loadData() {
  try {
    var raw = localStorage.getItem(LS_DATA);
    if (raw) {
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.cars)) return normalizeData(d);
    }
  } catch (e) { console.warn('load data', e); }
  return { version: 1, cars: [], records: [], plans: [], fuelings: [], documents: [], faults: [], parts: [], createdAt: Date.now() };
}
function normalizeData(d) {
  d.cars = d.cars || [];
  d.records = d.records || [];
  d.plans = d.plans || [];
  d.records.forEach(function (r) { r.works = r.works || []; });
  d.fuelings = d.fuelings || [];
  d.documents = d.documents || [];
  d.faults = d.faults || [];
  d.parts = d.parts || [];
  (d.cars || []).forEach(function (c) { c.regimen = c.regimen || []; });
  d.version = d.version || 1;
  return d;
}
function loadSettings() {
  var s = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { s[k] = DEFAULT_SETTINGS[k]; });
  try {
    var raw = localStorage.getItem(LS_SETTINGS);
    if (raw) {
      var saved = JSON.parse(raw);
      Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
        if (saved[k] !== undefined) s[k] = saved[k];
      });
    }
  } catch (e) {}
  if (['dark', 'light', 'auto'].indexOf(s.theme) === -1) s.theme = 'dark';
  if (!CURRENCY_SYMBOL[s.currency]) s.currency = 'RUB';
  if (s.units !== 'mi') s.units = 'km';
  s.intervalKm = Math.max(1000, num(s.intervalKm, 10000));
  s.intervalMonths = Math.max(1, num(s.intervalMonths, 12));
  return s;
}
function saveData() {
  try { localStorage.setItem(LS_DATA, JSON.stringify(state.data)); return true; }
  catch (e) { toast('Не хватает памяти. Удалите фото или старые записи.', 'err'); return false; }
}
function saveSettings() {
  try { localStorage.setItem(LS_SETTINGS, JSON.stringify(state.settings)); } catch (e) {}
}
function storageUsage() {
  try { return new Blob([JSON.stringify(state.data) + JSON.stringify(state.settings)]).size; } catch (e) { return 0; }
}

/* ============================ Домен ============================ */
function getCar(id) {
  for (var i = 0; i < state.data.cars.length; i++) if (state.data.cars[i].id === id) return state.data.cars[i];
  return null;
}
function getRecord(id) {
  for (var i = 0; i < state.data.records.length; i++) if (state.data.records[i].id === id) return state.data.records[i];
  return null;
}
function getPlan(id) {
  for (var i = 0; i < state.data.plans.length; i++) if (state.data.plans[i].id === id) return state.data.plans[i];
  return null;
}
function recordsOf(carId) {
  return state.data.records.filter(function (r) { return r.carId === carId; })
    .sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.mileage || 0) - (a.mileage || 0); });
}
function plansOf(carId) { return state.data.plans.filter(function (p) { return p.carId === carId; }); }
function allPlans() { return state.data.plans.slice(); }
function recordTotal(rec) {
  return (rec.works || []).reduce(function (s, w) { return s + (num(w.price) || 0); }, 0);
}
function totalSpent() { return state.data.records.reduce(function (s, r) { return s + recordTotal(r); }, 0); }
function carName(car) {
  if (!car) return 'Автомобиль';
  return [car.make, car.model].filter(Boolean).join(' ') || 'Автомобиль';
}
function carSubtitle(car) {
  if (!car) return '';
  var bits = [];
  if (car.year) bits.push(car.year);
  bits.push(FUELS[car.fuel] || FUELS.petrol);
  return bits.join(' · ');
}
function unitLabel() { return state.settings.units === 'mi' ? 'миль' : 'км'; }
function unitShort() { return state.settings.units === 'mi' ? 'ми' : 'км'; }
function kmToUnit(km) { return state.settings.units === 'mi' ? (km || 0) * MI : (km || 0); }
function unitToKm(v) { return state.settings.units === 'mi' ? (v || 0) * KM_PER_MI : (v || 0); }
function unitValue(km) { return Math.round(kmToUnit(km || 0)); }
function distText(km) { return nf0(unitValue(km)) + ' ' + unitShort(); }
function money(v) {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: state.settings.currency, maximumFractionDigits: 0 }).format(num(v));
  } catch (e) { return nf0(v) + ' ' + currencySign(); }
}
function nextServiceInfo(car) {
  var recs = recordsOf(car.id);
  if (!recs.length) return null;
  var last = recs[0];
  var intervalKm = Math.max(1000, num(state.settings.intervalKm, 10000));
  var intervalMonths = Math.max(1, num(state.settings.intervalMonths, 12));
  var nextKm = num(last.mileage) + intervalKm;
  var leftKm = nextKm - num(car.mileage);
  var dueDate = addMonths(last.date || todayISO(), intervalMonths);
  var leftDays = daysFromToday(dueDate);
  var pctKm = (num(car.mileage) - num(last.mileage)) / intervalKm;
  var pctDays = (intervalMonths - leftDays / 30.4) / intervalMonths;
  var pct = clamp(Math.max(pctKm, pctDays) * 100, 0, 100);
  return { last: last, nextKm: nextKm, leftKm: leftKm, dueDate: dueDate, leftDays: leftDays, pct: pct };
}
function planDue(plan) {
  var car = getCar(plan.carId);
  var overdue = false;
  var bits = [];
  if (plan.dueDate) {
    var d = daysFromToday(plan.dueDate);
    if (!plan.done && d < 0) overdue = true;
    bits.push((plan.done ? '' : (d < 0 ? 'просрочено · ' : 'до ')) + fmtDate(plan.dueDate, { day: 'numeric', month: 'short' }));
  }
  if (plan.dueMileage) {
    if (car && !plan.done && num(car.mileage) > num(plan.dueMileage)) overdue = true;
    bits.push('до ' + distText(plan.dueMileage));
  }
  return { overdue: overdue, text: bits.join(' · ') };
}
function getFueling(id) { return state.data.fuelings.find(function (f) { return f.id === id; }) || null; }
function getRegimenItem(carId, id) { var car=getCar(carId); if(!car||!car.regimen) return null; return car.regimen.find(function(r){return r.id===id;})||null; }
function getDocument(id){return state.data.documents.find(function(d){return d.id===id;})||null;}
function getFault(id){return state.data.faults.find(function(f){return f.id===id;})||null;}
function getPart(id){return state.data.parts.find(function(p){return p.id===id;})||null;}
function plansSorted(carId) {
  var arr = carId ? plansOf(carId) : allPlans();
  return arr.slice().sort(function (a, b) {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    var ao = planDue(a).overdue ? 0 : 1, bo = planDue(b).overdue ? 0 : 1;
    if (ao !== bo) return ao - bo;
    var ad = a.dueDate || '9999', bd = b.dueDate || '9999';
    if (ad !== bd) return ad.localeCompare(bd);
    var pr = { high: 0, mid: 1, low: 2 };
    var pa = (pr[a.priority] === undefined) ? 1 : pr[a.priority];
    var pb = (pr[b.priority] === undefined) ? 1 : pr[b.priority];
    return pa - pb;
  });
}

/* ============================ Тема ============================ */
function resolvedTheme() {
  var t = state.settings.theme;
  if (t === 'auto') {
    try { return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
    catch (e) { return 'dark'; }
  }
  return t;
}
function applyTheme() {
  var th = resolvedTheme();
  document.documentElement.setAttribute('data-theme', th);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', th === 'light' ? '#f1f4f9' : '#0a0d12');
  try {
    if (window.AndroidBridge && AndroidBridge.setTheme) AndroidBridge.setTheme(th);
  } catch (e) {}
}

/* ============================ Toast / modal ============================ */
var toastTimer = null;
function toast(msg, kind) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.className = 'toast' + (kind ? ' ' + kind : ''); }, 3000);
}
function confirmDialog(opts) {
  return new Promise(function (resolve) {
    var root = document.getElementById('modalRoot');
    root.innerHTML =
      '<div class="modal-overlay" id="modalOverlay"><div class="modal" role="dialog" aria-modal="true">' +
      '<h3>' + esc(opts.title || 'Подтвердите действие') + '</h3>' +
      (opts.text ? '<p>' + esc(opts.text) + '</p>' : '') +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-modal="no">' + esc(opts.cancelLabel || 'Отмена') + '</button>' +
      '<button class="btn ' + (opts.danger ? 'danger' : 'primary') + '" data-modal="yes">' + esc(opts.okLabel || 'ОК') + '</button>' +
      '</div></div></div>';
    function done(v) { root.innerHTML = ''; resolve(v); }
    var ov = document.getElementById('modalOverlay');
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return done(false);
      var b = e.target.closest('[data-modal]');
      if (!b) return;
      done(b.getAttribute('data-modal') === 'yes');
    });
  });
}
function showLoading(on, text) {
  var root = document.getElementById('modalRoot');
  if (!on) {
    var l = document.getElementById('loadOverlay');
    if (l) l.remove();
    return;
  }
  root.innerHTML = '<div class="loading-overlay" id="loadOverlay"><div class="loader-box"><div class="spinner"></div><div>' + esc(text || 'Подождите…') + '</div></div></div>';
}
function anyOverlayOpen() {
  return !!(document.getElementById('modalOverlay') || document.getElementById('loadOverlay'));
}

/* ============================ Навигация ============================ */
function nav(path) {
  if (('#' + path) === location.hash) render();
  else location.hash = '#' + path;
}
function parseRoute() {
  var h = (location.hash || '').replace(/^#/, '');
  var p = h.split('?')[0].split('/').filter(Boolean);
  if (p.length === 0) return { name: 'home', path: '/' };
  if (p[0] === 'car') {
    if (p[1] === 'new') return { name: 'carForm', id: null, path: '/car/new' };
    var cid = p[1];
    if (p.length === 2) return { name: 'car', carId: cid, path: '/car/' + cid };
    if (p[2] === 'history' && p.length === 3) return { name: 'history', carId: cid, path: '/car/' + cid + '/history' };
    if (p[2] === 'edit') return { name: 'carForm', id: cid, path: '/car/' + cid + '/edit' };
    if (p[2] === 'new') return { name: 'recordForm', carId: cid, path: '/car/' + cid + '/new' };
    if (p[2] === 'rec') {
      if (p[4] === 'edit') return { name: 'recordForm', carId: cid, id: p[3], path: '/car/' + cid + '/rec/' + p[3] + '/edit' };
      return { name: 'record', carId: cid, id: p[3], path: '/car/' + cid + '/rec/' + p[3] };
    }
    if (p[2] === 'plan' && p[3] === 'new') return { name: 'planForm', carId: cid, path: '/car/' + cid + '/plan/new' };
    if (p[2] === 'fuel' && p[3] === 'new') return { name: 'fuelForm', carId: cid, path: '/car/' + cid + '/fuel/new' };
    if (p[2] === 'fuel' && p[4] === 'edit') return { name: 'fuelForm', carId: cid, id: p[3], path: '/car/' + cid + '/fuel/' + p[3] + '/edit' };
    if (p[2] === 'regimen' && p.length === 3) return { name: 'regimen', carId: cid, path: '/car/' + cid + '/regimen' };
    if (p[2] === 'regimen' && p[3] === 'new') return { name: 'regimenForm', carId: cid, path: '/car/' + cid + '/regimen/new' };
    if (p[2] === 'regimen' && p[4] === 'edit') return { name: 'regimenForm', carId: cid, id: p[3], path: '/car/' + cid + '/regimen/' + p[3] + '/edit' };
    if (p[2] === 'faults' && p.length === 3) return { name: 'faults', carId: cid, path: '/car/' + cid + '/faults' };
    if (p[2] === 'docs' && p.length === 3) return { name: 'documents', carId: cid, path: '/car/' + cid + '/docs' };
    if (p[2] === 'plans' && p.length === 3) return { name: 'carPlans', carId: cid, path: '/car/' + cid + '/plans' };
    if (p[2] === 'fuel' && p.length === 3) return { name: 'fuelings', carId: cid, path: '/car/' + cid + '/fuel' };
    if (p[2] === 'doc' && p[3] === 'new') return { name: 'documentForm', carId: cid, path: '/car/' + cid + '/doc/new' };
    if (p[2] === 'doc' && p[4] === 'edit') return { name: 'documentForm', carId: cid, id: p[3], path: '/car/' + cid + '/doc/' + p[3] + '/edit' };
    if (p[2] === 'fault' && p[3] === 'new') return { name: 'faultForm', carId: cid, path: '/car/' + cid + '/fault/new' };
    if (p[2] === 'fault' && p[4] === 'edit') return { name: 'faultForm', carId: cid, id: p[3], path: '/car/' + cid + '/fault/' + p[3] + '/edit' };
    if (p[2] === 'parts' && p.length === 3) return { name: 'parts', carId: cid, path: '/car/' + cid + '/parts' };
    if (p[2] === 'part' && p[3] === 'new') return { name: 'partForm', carId: cid, path: '/car/' + cid + '/part/new' };
    if (p[2] === 'part' && p[4] === 'edit') return { name: 'partForm', carId: cid, id: p[3], path: '/car/' + cid + '/part/' + p[3] + '/edit' };
  }
  if (p[0] === 'plans') {
    if (p[1] === 'new') return { name: 'planForm', path: '/plans/new' };
    return { name: 'plans', path: '/plans' };
  }
  if (p[0] === 'plan' && p[1]) {
    if (p[2] === 'edit') return { name: 'planForm', id: p[1], path: '/plan/' + p[1] + '/edit' };
    return { name: 'plans', path: '/plans' };
  }
  if (p[0] === 'stats') return { name: 'stats', path: '/stats' };
  if (p[0] === 'settings') return { name: 'settings', path: '/settings' };
  if (p[0] === 'about') return { name: 'about', path: '/about' };
  return { name: 'home', path: '/' };
}

var CAR_MAKES = ['Acura','Alfa Romeo','Audi','BMW','BYD','Cadillac','Chery','Chevrolet','Chrysler','Citroen','Daewoo','Datsun','Dodge','FAW','Fiat','Ford','Geely','Genesis','Great Wall','Haval','Honda','Hyundai','Infiniti','JAC','Jaguar','Jeep','Kia','Lada (ВАЗ)','Land Rover','Lexus','Lifan','Mazda','Mercedes-Benz','Mini','Mitsubishi','Nissan','Opel','Peugeot','Porsche','Ravon','Renault','Seat','Skoda','SsangYong','Subaru','Suzuki','Tesla','Toyota','UAZ','Volkswagen','Volvo','Zotye','УАЗ','ГАЗ'];
var CAR_MODELS = {
  'Audi': ['A3','A4','A5','A6','A7','A8','Q3','Q5','Q7','Q8','TT'],
  'BMW': ['1 series','2 series','3 series','4 series','5 series','7 series','X1','X3','X5','X6','X7'],
  'Chery': ['Tiggo 4','Tiggo 7','Tiggo 8','Arrizo 8'],
  'Chevrolet': ['Aveo','Cruze','Lacetti','Niva','Spark'],
  'Citroen': ['C3','C4','C5','Berlingo'],
  'Ford': ['Focus','Mondeo','Kuga','Explorer','Transit'],
  'Geely': ['Coolray','Atlas','Tugella','Monjaro'],
  'Haval': ['Jolion','F7','F7x','H9','Dargo'],
  'Honda': ['Accord','Civic','CR-V','HR-V','Pilot'],
  'Hyundai': ['Solaris','Elantra','Sonata','Tucson','Santa Fe','Creta','i30'],
  'Kia': ['Rio','Ceed','Cerato','Sportage','Sorento','Seltos','Optima','K5'],
  'Lada (ВАЗ)': ['Granta','Vesta','XRAY','Largus','Niva','Priora','Kalina'],
  'Lexus': ['ES','IS','RX','NX','LX','GX'],
  'Mazda': ['Mazda 3','Mazda 6','CX-5','CX-9','CX-30'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','GLA','GLC','GLE','GLS'],
  'Mitsubishi': ['Lancer','Outlander','Pajero','ASX'],
  'Nissan': ['Almera','Qashqai','X-Trail','Juke','Murano','Patrol','Teana'],
  'Opel': ['Astra','Corsa','Insignia','Mokka'],
  'Peugeot': ['208','308','408','3008','5008'],
  'Renault': ['Logan','Sandero','Duster','Kaptur','Arkana','Megane'],
  'Skoda': ['Fabia','Rapid','Octavia','Superb','Kodiaq','Karoq','Yeti','Scala'],
  'Subaru': ['Impreza','Legacy','Forester','Outback','XV'],
  'Suzuki': ['Swift','Vitara','SX4','Jimny'],
  'Toyota': ['Camry','Corolla','RAV4','Land Cruiser','Land Cruiser Prado','Hilux','Prius','Yaris'],
  'Volkswagen': ['Polo','Golf','Passat','Tiguan','Touareg','Jetta','Arteon'],
  'Volvo': ['S60','S90','XC40','XC60','XC90'],
  'UAZ': ['Patriot','Hunter','Bukhanka'],
  'ГАЗ': ['Газель','Соболь']
};


function fuelingsOf(carId) {
  return state.data.fuelings.filter(function (f) { return f.carId === carId; })
    .slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
}
function fuelConsumption(carId) {
  var fs = fuelingsOf(carId).slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
  var res = { avgL100: 0, costPerKm: 0, totalLiters: 0, totalCost: 0, count: fs.length };
  fs.forEach(function (f) { res.totalLiters += num(f.liters); res.totalCost += num(f.total); });
  if (fs.length >= 2) {
    var first = fs[0], last = fs[fs.length - 1];
    var km = num(last.mileage) - num(first.mileage);
    var liters = 0;
    for (var i = 1; i < fs.length; i++) liters += num(fs[i].liters);
    if (km > 0) { res.avgL100 = liters / km * 100; res.costPerKm = (res.totalCost - num(fs[0].total)) / km; }
  }
  return res;
}


function regimenOf(carId) {
  var car = getCar(carId);
  return car && Array.isArray(car.regimen) ? car.regimen : [];
}
function regimenStatus(item, car) {
  var overdue = false, soon = false, text = '';
  var bits = [];
  if (item.lastMileage != null && item.intervalKm) {
    var nextKm = num(item.lastMileage) + num(item.intervalKm);
    var leftKm = num(car.mileage) - nextKm;
    if (leftKm >= 0) overdue = true;
    else if (nextKm - num(car.mileage) <= Math.max(1000, num(item.intervalKm) * 0.2)) soon = true;
    bits.push('пробег: ' + (leftKm >= 0 ? 'просрочено на ' + distText(leftKm) : 'осталось ' + distText(nextKm - num(car.mileage))));
  }
  if (item.lastDate && item.intervalMonths) {
    var due = addMonths(item.lastDate, num(item.intervalMonths));
    var d = daysFromToday(due);
    if (d < 0) overdue = true;
    else if (d <= 30) soon = true;
    bits.push('дата: ' + (d < 0 ? 'просрочено' : 'осталось ' + d + ' дн.'));
  }
  if (!item.lastDate && !item.lastMileage) { text = 'не выполнялось'; }
  else { text = bits.join(' · '); }
  return { overdue: overdue, soon: soon, text: text };
}
var DEFAULT_REGIMEN = [
  { key: 'engine_oil', title: 'Масло и масляный фильтр', legacy: ['Моторное масло и фильтр'], cat: 'engine', intervalKm: 10000, intervalMonths: 12, fuels: ['petrol', 'diesel', 'hybrid', 'gas'] },
  { key: 'air_filter', title: 'Воздушный фильтр', cat: 'engine', intervalKm: 30000, intervalMonths: 24, fuels: ['petrol', 'diesel', 'hybrid', 'gas'] },
  { key: 'cabin_filter', title: 'Салонный фильтр', cat: 'body', intervalKm: 15000, intervalMonths: 12 },
  { key: 'brake_fluid', title: 'Тормозная жидкость', cat: 'brakes', intervalKm: 60000, intervalMonths: 24 },
  { key: 'spark_plugs', title: 'Свечи зажигания', cat: 'engine', intervalKm: 60000, intervalMonths: 36, fuels: ['petrol', 'hybrid', 'gas'] },
  { key: 'coolant', title: 'Антифриз', cat: 'engine', intervalKm: 60000, intervalMonths: 24 },
  { key: 'transmission_oil', title: 'Масло КПП', cat: 'transmission', intervalKm: 60000, intervalMonths: 36 },
  { key: 'fuel_filter', title: 'Топливный фильтр', cat: 'engine', intervalKm: 30000, intervalMonths: 24, fuels: ['petrol', 'diesel', 'gas'] },
  { key: 'brake_pads', title: 'Тормозные колодки и диски', cat: 'brakes', intervalKm: 40000, intervalMonths: 24 },
  { key: 'drive_belts', title: 'Приводные ремни', cat: 'engine', intervalKm: 60000, intervalMonths: 48, fuels: ['petrol', 'diesel', 'hybrid', 'gas'] },
  { key: 'timing_belt', title: 'Ремень / цепь ГРМ', cat: 'engine', intervalKm: 90000, intervalMonths: 60, fuels: ['petrol', 'diesel', 'hybrid', 'gas'] },
  { key: 'power_steering', title: 'Жидкость ГУР', cat: 'suspension', intervalKm: 60000, intervalMonths: 36 },
  { key: 'battery', title: 'Аккумулятор (проверка/замена)', cat: 'electric', intervalKm: 60000, intervalMonths: 48 },
  { key: 'ev_battery', title: 'Проверка ВВБ и охлаждения', cat: 'engine', intervalKm: 20000, intervalMonths: 12, fuels: ['electric', 'hybrid'] }
];
function isPresetRegimen(item) {
  if (!item) return false;
  if (item.preset === true) return true;
  if (item.preset === false) return false;
  return DEFAULT_REGIMEN.some(function (d) {
    return d.key === item.key || d.title === item.title || (d.legacy || []).indexOf(item.title) !== -1;
  });
}
function findRegimenRecord(carId, date, mileage) {
  var best = null, bestScore = Infinity;
  state.data.records.forEach(function (r) {
    if (r.carId !== carId) return;
    var dayDiff = Math.abs(daysFromToday(r.date) - daysFromToday(date));
    var kmDiff = Math.abs(num(r.mileage) - num(mileage));
    if (dayDiff > 7 || kmDiff > 500) return;
    var score = dayDiff / 7 + kmDiff / 500;
    if (score < bestScore) { bestScore = score; best = r; }
  });
  return best;
}
function seedDefaultRegimen(car) {
  if (!car) return 0;
  car.regimen = car.regimen || [];
  var byKey = {};
  car.regimen.forEach(function (r) {
    if (!r.key) {
      var match = DEFAULT_REGIMEN.find(function (d) { return d.title === r.title || (d.legacy || []).indexOf(r.title) !== -1; });
      if (match) {
        r.key = match.key;
        if (match.title !== r.title && (match.legacy || []).indexOf(r.title) !== -1) { r.title = match.title; r.cat = match.cat; }
        if (r.preset === undefined) r.preset = true;
      }
    }
    if (r.key) byKey[r.key] = true;
  });
  var added = 0;
  DEFAULT_REGIMEN.forEach(function (d) {
    if (d.fuels && d.fuels.indexOf(car.fuel) === -1) return;
    if (byKey[d.key]) return;
    car.regimen.push({ id: uid(), key: d.key, title: d.title, cat: d.cat, intervalKm: d.intervalKm, intervalMonths: d.intervalMonths, lastDate: null, lastMileage: null, note: '', preset: true });
    byKey[d.key] = true;
    added++;
  });
  return added;
}
function restoreDefaultRegimens() {
  var changed = false;
  state.data.cars.forEach(function (car) {
    if (seedDefaultRegimen(car) > 0) { car.updatedAt = Date.now(); changed = true; }
  });
  if (changed) saveData();
  return changed;
}
function fillDefaultRegimen(carId) {
  var car = getCar(carId);
  if (!car) return;
  if (seedDefaultRegimen(car) > 0) {
    car.updatedAt = Date.now();
    saveData();
  }
}

function migrateRegimenTitles() {
  var changed = false;
  var byCar = {};
  state.data.cars.forEach(function (car) {
    var map = {};
    (car.regimen || []).forEach(function (r) {
      var d = DEFAULT_REGIMEN.find(function (x) { return x.key === r.key; }) ||
        DEFAULT_REGIMEN.find(function (x) { return x.title === r.title || (x.legacy || []).indexOf(r.title) !== -1; });
      map[r.id] = r;
      if (!d) return;
      var legacyTitle = !r.title || r.title === d.title || (d.legacy || []).indexOf(r.title) !== -1;
      if (!r.key) { r.key = d.key; changed = true; }
      if (legacyTitle && r.title !== d.title) { r.title = d.title; r.cat = d.cat; changed = true; }
      if (r.preset === undefined) { r.preset = true; changed = true; }
    });
    byCar[car.id] = map;
  });
  state.data.records.forEach(function (rec) {
    var map = byCar[rec.carId];
    if (!map) return;
    (rec.works || []).forEach(function (w) {
      if (!w.regimenId || !map[w.regimenId]) return;
      var item = map[w.regimenId];
      var d = DEFAULT_REGIMEN.find(function (x) { return x.key === item.key; }) ||
        DEFAULT_REGIMEN.find(function (x) { return x.title === item.title || (x.legacy || []).indexOf(item.title) !== -1; });
      var syncTitle = !w.sub || w.sub === item.title ||
        (d && (w.sub === d.title || (d.legacy || []).indexOf(w.sub) !== -1));
      if (syncTitle && w.sub !== item.title) { w.sub = item.title; changed = true; }
      if ((syncTitle || !w.cat) && w.cat !== item.cat) { w.cat = item.cat; changed = true; }
    });
  });
  if (changed) saveData();
}
migrateRegimenTitles();

function documentsOf(carId) { return state.data.documents.filter(function (d) { return d.carId === carId; }).slice().sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); }); }
function faultsOf(carId) { return state.data.faults.filter(function (f) { return f.carId === carId; }).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }); }
function partsOf(carId) { return state.data.parts.filter(function (p) { return p.carId === carId; }).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }); }
