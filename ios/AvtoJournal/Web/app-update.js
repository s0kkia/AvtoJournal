(function () {
  var pollTimer = null;
  var currentInfo = null;
  var installing = false;
  var STYLE_ID = 'updateBannerStyles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#updateBanner{position:fixed;z-index:10000;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top,0px));' +
      'background:#141a23;color:#eef2f8;border:1px solid rgba(255,138,61,.35);border-radius:16px;padding:13px 14px 12px;' +
      'box-shadow:0 14px 40px rgba(0,0,0,.45);font:13.5px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;}' +
      '.ub-top{display:flex;align-items:center;gap:8px;}' +
      '.ub-title{flex:1;font-weight:750;letter-spacing:-.01em;font-size:14px;}' +
      '.ub-title span{color:var(--accent,#ff8a3d);}' +
      '.ub-close{background:transparent;border:0;color:#aeb8c6;font-size:22px;line-height:1;padding:0 2px;margin:-4px -2px 0 0;}' +
      '.ub-msg{margin-top:5px;color:#aeb8c6;font-size:12.5px;}' +
      '.ub-progress{height:6px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden;margin:10px 0 2px;}' +
      '.ub-fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--accent,#ff8a3d),#ffbd7a);transition:width .25s ease;}' +
      '.ub-progress.indeterminate .ub-fill{width:38%;animation:ub-slide 1.1s ease-in-out infinite;}' +
      '@keyframes ub-slide{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}' +
      '.ub-actions{display:flex;gap:8px;margin-top:10px;}' +
      '.ub-action{background:var(--accent,#ff8a3d);color:#1a1208;border:0;border-radius:10px;padding:9px 14px;font-weight:750;font-size:13px;}' +
      '.ub-action:active{transform:scale(.97);}' +
      '.ub-action[hidden]{display:none;}' +
      '[data-theme="light"] #updateBanner{background:#fff;color:#101828;border-color:rgba(242,113,28,.3);box-shadow:0 14px 40px rgba(16,24,40,.18);}' +
      '[data-theme="light"] .ub-msg{color:#667085;}' +
      '[data-theme="light"] .ub-progress{background:rgba(16,24,40,.1);}' +
      '[data-theme="light"] .ub-close{color:#667085;}';
    document.head.appendChild(s);
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function openExternal(url) {
    if (!url) return;
    try {
      if (window.AndroidBridge && typeof AndroidBridge.openUrl === 'function') {
        AndroidBridge.openUrl(url);
        return;
      }
    } catch (e) {}
    window.location.href = url;
  }

  function filenameFor(info) {
    return 'AvtoJournal-ota.apk';
  }

  function fetchUpdate() {
    if (!UPDATE_CHECK_URL || UPDATE_CHECK_URL.indexOf('YOUR_GITHUB_USERNAME') !== -1) {
      return Promise.reject(new Error('update url not configured'));
    }
    return fetch(UPDATE_CHECK_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      });
  }

  function checkForUpdate() {
    if (window.IS_IOS) return;
    fetchUpdate()
      .then(function (info) {
        if (!info || !info.versionCode || info.versionCode <= APP_VERSION_CODE) return;
        showUpdateBanner(info);
      })
      .catch(function () {});
  }

  function manualCheckUpdate() {
    if (window.IS_IOS) { if (typeof toast === 'function') toast('Обновления для iOS — через App Store', 'ok'); return; }
    if (typeof toast === 'function') toast('Проверяем обновления…', 'ok');
    fetchUpdate()
      .then(function (info) {
        if (info && info.versionCode && info.versionCode > APP_VERSION_CODE) {
          showUpdateBanner(info);
          if (typeof toast === 'function') toast('Доступна версия ' + (info.version || ''), 'ok');
        } else {
          if (typeof toast === 'function') toast('У вас последняя версия ' + APP_VERSION, 'ok');
        }
      })
      .catch(function () {
        if (typeof toast === 'function') toast('Не удалось проверить обновления', 'err');
      });
  }

  function setMsg(text) {
    var el = document.getElementById('ubMsg');
    if (el) el.textContent = text;
  }

  function setProgress(pct) {
    var wrap = document.getElementById('ubProgress');
    var fill = document.getElementById('ubFill');
    if (!wrap || !fill) return;
    wrap.hidden = false;
    if (pct === null) {
      wrap.classList.add('indeterminate');
      fill.style.width = '';
    } else {
      wrap.classList.remove('indeterminate');
      fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }
  }

  function setAction(label, fn) {
    var el = document.getElementById('ubAction');
    if (!el) return;
    if (!label) {
      el.hidden = true;
      el.onclick = null;
      return;
    }
    el.hidden = false;
    el.textContent = label;
    el.onclick = fn;
  }

  function showUpdateBanner(info) {
    if (document.getElementById('updateBanner')) return;
    injectStyles();
    currentInfo = info;
    installing = false;
    var b = document.createElement('div');
    b.id = 'updateBanner';
    b.setAttribute('role', 'status');
    b.innerHTML =
      '<div class="ub-top"><div class="ub-title">Обновление <span>v' + escHtml(info.version || '') + '</span></div>' +
      '<button type="button" class="ub-close" aria-label="Закрыть">×</button></div>' +
      '<div class="ub-msg" id="ubMsg">Доступна новая версия. Скачайте и установите в один тап.</div>' +
      '<div class="ub-progress" id="ubProgress" hidden><div class="ub-fill" id="ubFill"></div></div>' +
      '<div class="ub-actions"><button type="button" class="ub-action" id="ubAction">Обновить</button></div>';
    document.body.appendChild(b);
    b.querySelector('.ub-close').onclick = function () {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      b.remove();
    };
    document.getElementById('ubAction').onclick = function () { beginDownload(info); };
  }

  function fallbackDownload(url) {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    setProgress(null);
    setMsg('Открываем загрузку в браузере…');
    setAction('Повторить', function () { fallbackDownload(url); });
    openExternal(url);
  }

  function beginDownload(info) {
    var url = info && info.url;
    if (!url) {
      setMsg('Ссылка на обновление не найдена.');
      return;
    }
    currentInfo = info;
    installing = false;
    setProgress(null);
    setMsg('Скачивание обновления…');
    setAction('', null);
    var bridge = window.UpdateBridge;
    if (bridge && typeof bridge.start === 'function') {
      var id = -1;
      try { id = Number(bridge.start(url, filenameFor(info))); } catch (e) { id = -1; }
      if (id > 0) {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(pollDownload, 500);
        pollDownload();
        return;
      }
    }
    fallbackDownload(url);
  }

  function installDownloaded() {
    var bridge = window.UpdateBridge;
    var ok = false;
    if (bridge && typeof bridge.install === 'function') {
      try { ok = !!bridge.install(); } catch (e) { ok = false; }
    }
    if (ok) {
      setMsg('Установщик открыт.');
      setAction('Открыть ещё раз', installDownloaded);
    } else {
      installing = false;
      setMsg('Не удалось открыть установщик. Разрешите установку из этого источника и повторите.');
      setAction('Повторить', function () { installing = false; installDownloaded(); });
    }
  }

  function pollDownload() {
    var bridge = window.UpdateBridge;
    if (!bridge || typeof bridge.status !== 'function') {
      fallbackDownload(currentInfo && currentInfo.url);
      return;
    }
    var raw;
    try { raw = bridge.status(); } catch (e) { raw = ''; }
    var st;
    try { st = JSON.parse(raw); } catch (e) { st = { status: -2 }; }
    var status = Number(st.status);

    if (status === 1 || status === 2 || status === 4) {
      var total = Number(st.total) || 0;
      var done = Number(st.downloaded) || 0;
      if (total > 0) {
        var pct = Math.max(0, Math.min(100, Math.round(done / total * 100)));
        setProgress(pct);
        setMsg('Скачивание обновления… ' + pct + '%');
      } else {
        setProgress(null);
        setMsg('Скачивание обновления…');
      }
      return;
    }

    if (status === 8) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      setProgress(100);
      setMsg('Загрузка завершена. Открываем установщик…');
      setAction('Установить', installDownloaded);
      if (!installing) {
        installing = true;
        setTimeout(installDownloaded, 400);
      }
      return;
    }

    if (status === 16) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      setProgress(null);
      setMsg('Не удалось скачать обновление. Код ' + (Number(st.reason) || 0) + '.');
      setAction('Открыть в браузере', function () { fallbackDownload(currentInfo && currentInfo.url); });
      return;
    }

    if (status === -1 || status === -2) {
      fallbackDownload(currentInfo && currentInfo.url);
    }
  }

  window.manualCheckUpdate = manualCheckUpdate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(checkForUpdate, 1500); });
  } else {
    setTimeout(checkForUpdate, 1500);
  }
})();
