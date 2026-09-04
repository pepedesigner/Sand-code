/* Sandcode workspace sub-pages — mock interactions (no backend).
   Every init is guarded by element presence so one file serves all pages. */
(function () {
  function $(id) { return document.getElementById(id); }
  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2000);
  }
  function copyText(t, msg) {    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).catch(function () {});
      }
    } catch (e) {}
    toast(msg || 'Copied to clipboard.');
  }

  // theme: light default, dark on toggle; preference shared with marketing site
  function setTheme(t) {
    document.body.dataset.theme = t;
    var b = $('theme-btn');
    if (b) b.textContent = (t === 'dark') ? '☀' : '☾';
    try { localStorage.setItem('sandcode-theme', t); } catch (e) {}
  }
  function initTheme() {
    var t = 'light';
    try { t = localStorage.getItem('sandcode-theme') || 'light'; } catch (e) {}
    setTheme(t);
    var b = $('theme-btn');
    if (b) b.addEventListener('click', function () {
      setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    // mobile sidebar
    var menu = $('menu-side'), side = $('side'), scrim = $('side-scrim');
    if (menu && side) {
      menu.addEventListener('click', function () {
        side.classList.add('open');
        if (scrim) scrim.hidden = false;
      });
      if (scrim) scrim.addEventListener('click', function () {
        side.classList.remove('open');
        scrim.hidden = true;
      });
    }

    // generic data-toast hooks (switches, radios)
    document.querySelectorAll('[data-toast]').forEach(function (el) {
      el.addEventListener('change', function () { toast(el.dataset.toast); });
    });

    // usage: daily bars
    var bars = $('daily-bars');
    if (bars) {
      var vals = [1.2, 2.1, 1.6, 3.4, 2.8, 4.6, 3.1, 2.4, 5.2, 3.8, 4.1, 2.9, 3.6, 4.4];
      var max = Math.max.apply(null, vals);
      bars.innerHTML = vals.map(function (v) {
        return '<div style="height:' + Math.round((v / max) * 100) + '%" title="$' + v.toFixed(2) + '"></div>';
      }).join('');
    }

    // billing: top-up bumps the balance
    var topup = $('topup-btn'), bal = $('balance-val');
    if (topup && bal) {
      topup.addEventListener('click', function () {
        var cur = parseFloat(bal.textContent.replace(/[^0-9.]/g, '')) || 0;
        bal.textContent = '$' + (cur + 20).toFixed(2);
        toast('$20 added — top-ups never expire.');
      });
    }

    // keys: copy / regenerate / revoke / create
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () { copyText(b.dataset.copy, 'Key copied.'); });
    });
    document.querySelectorAll('[data-regen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.closest('tr');
        var cell = row && row.querySelector('td.mono');
        var fresh = 'sk-sand-••••' + Math.random().toString(16).slice(2, 6);
        if (cell) cell.textContent = fresh;
        b.dataset.copy = 'sk-sand-mock-' + fresh.slice(-4) + '-key';
        toast('Key regenerated. Old value stopped working.');
      });
    });
    document.querySelectorAll('[data-revoke]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.closest('tr');
        if (row) row.remove();
        toast('Key revoked.');
      });
    });
    var create = $('key-create');
    if (create) {
      create.addEventListener('click', function () {
        var tb = document.querySelector('#keys-table tbody');
        if (!tb) return;
        var tag = Math.random().toString(16).slice(2, 6);
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>New key</td><td class="mono">sk-sand-••••' + tag + '</td><td>never</td>' +
          '<td class="num"><button class="wbtn ghost" data-copy="sk-sand-mock-' + tag + '-key" type="button">Copy</button> ' +
          '<button class="wbtn ghost" data-regen type="button">Regenerate</button> ' +
          '<button class="wbtn danger" data-revoke type="button">Revoke</button></td>';
        tb.prepend(tr);
        tr.querySelector('[data-copy]').addEventListener('click', function (e) {
          copyText(e.target.dataset.copy, 'Key copied.');
        });
        tr.querySelector('[data-regen]').addEventListener('click', function () { toast('Key regenerated.'); });
        tr.querySelector('[data-revoke]').addEventListener('click', function () {
          tr.remove();
          toast('Key revoked.');
        });
        toast('Key created — copy it now.');
      });
    }

    // members: invite + role change
    var invite = $('invite-btn');
    if (invite) {
      invite.addEventListener('click', function () {
        var input = $('invite-email');
        var email = input ? input.value.trim() : '';
        if (!email || email.indexOf('@') < 0) { toast('Enter a valid email.'); return; }
        var tb = document.querySelector('#members-table tbody');
        if (tb) {
          var tr = document.createElement('tr');
          var name = email.split('@')[0];
          tr.innerHTML = '<td><b>' + name + '</b> · ' + email.replace(/</g, '&lt;') + '</td><td>Invited</td><td>just now</td>';
          tb.appendChild(tr);
        }
        if (input) input.value = '';
        toast('Invite sent to ' + email + '.');
      });
    }
    document.querySelectorAll('.member-role').forEach(function (s) {
      s.addEventListener('change', function () { toast('Role updated to ' + s.value + '.'); });
    });

    // settings: save + leave
    var save = $('ws-save');
    if (save) save.addEventListener('click', function () { toast('Settings saved (mock — nothing stored).'); });
    var leave = $('ws-leave');
    if (leave) leave.addEventListener('click', function () { toast('This is a demo — you are staying.'); });

    // go: manage / top-up
    var manage = $('go-manage');
    if (manage) manage.addEventListener('click', function () { toast('Billing portal would open here (mock).'); });
    var gtop = $('go-topup');
    if (gtop) gtop.addEventListener('click', function () { toast('$20 top-up added (mock).'); });
  });
})();
