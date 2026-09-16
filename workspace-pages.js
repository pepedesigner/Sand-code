/* Sandcode Console sub-pages — mock interactions (no backend).
   Every init is guarded by element presence so one file serves all pages.
   Rows are built with DOM APIs (never innerHTML with user input), and the
   keys table uses event delegation so dynamically added rows behave exactly
   like the static ones. Theme/clipboard helpers come from common.js. */
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
  function copyText(t, msg) {
    Sand.copyText(t).then(
      function () { toast(msg || 'Copied to clipboard.'); },
      function () { toast('Copy failed'); }
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    Sand.initTheme();

    // mobile sidebar
    var menu = $('menu-side'), side = $('side'), scrim = $('side-scrim');
    if (menu && side) {
      menu.addEventListener('click', function () {
        var open = !side.classList.contains('open');
        side.classList.toggle('open', open);
        menu.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (scrim) scrim.hidden = !open;
      });
      if (scrim) scrim.addEventListener('click', function () {
        side.classList.remove('open');
        scrim.hidden = true;
        menu.setAttribute('aria-expanded', 'false');
      });
    }

    // generic data-toast hooks (switches, radios)
    document.querySelectorAll('[data-toast]').forEach(function (el) {
      el.addEventListener('change', function () { toast(el.dataset.toast); });
    });

    // usage: daily columns
    // Values are quantised to a whole number of cells so a column is a stack of
    // discrete blocks rather than a continuous bar — that is what makes the
    // chart readable at a glance against the empty cells behind it, and it means
    // the fill never ends halfway through a cell.
    var bars = $('daily-bars');
    if (bars) {
      var CELLS = 10; // must match the column height / --pitch-v in workspace.css
      var vals = [1.1, 1.7, 1.4, 3.0, 2.5, 4.9, 2.7, 2.1, 4.6, 3.4, 3.6, 2.6, 3.2, 4.8]; // sums to the $41.60 headline
      var max = Math.max.apply(null, vals);
      vals.forEach(function (v) {
        var col = document.createElement('div');
        col.className = 'dcol';
        col.title = '$' + v.toFixed(2);
        var lit = Math.max(1, Math.round((v / max) * CELLS));
        var fill = document.createElement('i');
        fill.style.height = ((lit / CELLS) * 100) + '%';
        col.appendChild(fill);
        bars.appendChild(col);
      });
    }

    // billing: top-up bumps the wallet balance
    var topup = $('topup-btn'), bal = $('balance-val');
    if (topup && bal) {
      topup.addEventListener('click', function () {
        var cur = parseFloat(bal.textContent.replace(/[^0-9.]/g, '')) || 0;
        bal.textContent = '$' + (cur + 20).toFixed(2);
        toast('$20 added to your wallet — overflow is covered.');
      });
    }

    // keys + referral: delegated copy / rotate / revoke — one document-level
    // listener covers static rows, created rows, and the members referral button
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      if (b.hasAttribute('data-copy')) {
        copyText(b.getAttribute('data-copy'), 'Key copied.');
      } else if (b.hasAttribute('data-regen')) {
        var row = b.closest('tr');
        var cell = row && row.querySelector('td.mono');
        var tag = Math.random().toString(16).slice(2, 6);
        if (cell) cell.textContent = 'sb_live_••••' + tag;
        b.setAttribute('data-copy', 'sb_live_mock_' + tag + '_key');
        toast('Key rotated. The old value stopped working.');
      } else if (b.hasAttribute('data-revoke')) {
        var dead = b.closest('tr');
        if (dead) dead.remove();
        toast('Key revoked.');
      }
    });
    var create = $('key-create');
    if (create) {
      create.addEventListener('click', function () {
        var tb = document.querySelector('#keys-table tbody');
        if (!tb) return;
        var tag = Math.random().toString(16).slice(2, 6);
        function cell(cls, text) {
          var c = document.createElement('td');
          if (cls) c.className = cls;
          if (text) c.textContent = text;
          return c;
        }
        function act(label, attr, value, cls) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'wbtn ' + cls;
          b.textContent = label;
          b.setAttribute(attr, value === null ? '' : value);
          return b;
        }
        var actions = cell('num');
        actions.append(
          act('Copy', 'data-copy', 'sb_live_mock_' + tag + '_key', 'ghost'),
          act('Rotate', 'data-regen', null, 'ghost'),
          act('Revoke', 'data-revoke', null, 'danger')
        );
        var tr = document.createElement('tr');
        tr.append(cell(null, 'New key'), cell('mono', 'sb_live_••••' + tag), cell(null, 'never'), actions);
        tb.prepend(tr);
        toast('Key created — copy it now.');
      });
    }

    // members: invite (DOM-built — user input never goes through innerHTML)
    var invite = $('invite-btn');
    if (invite) {
      invite.addEventListener('click', function () {
        var input = $('invite-email');
        var email = input ? input.value.trim() : '';
        if (!email || email.indexOf('@') < 1) { toast('Enter a valid email.'); return; }
        var tb = document.querySelector('#members-table tbody');
        if (tb) {
          var name = email.split('@')[0];
          var tdName = document.createElement('td');
          var b = document.createElement('b');
          b.textContent = name;
          tdName.appendChild(b);
          tdName.appendChild(document.createTextNode(' · ' + email));
          var tdRole = document.createElement('td');
          tdRole.textContent = 'Invited';
          var tdCap = document.createElement('td');
          tdCap.className = 'num';
          tdCap.textContent = '$3/day';
          var tdWhen = document.createElement('td');
          tdWhen.textContent = 'just now';
          var tr = document.createElement('tr');
          tr.append(tdName, tdRole, tdCap, tdWhen);
          tb.appendChild(tr);
        }
        if (input) input.value = '';
        toast('Invite sent to ' + email + '.');
      });
    }
    document.querySelectorAll('.member-role').forEach(function (s) {
      s.addEventListener('change', function () { toast('Role updated to ' + s.value + '.'); });
    });

    // settings: save + purge + leave
    var save = $('ws-save');
    if (save) save.addEventListener('click', function () { toast('Settings saved (mock — nothing stored).'); });
    var purge = $('ws-purge');
    if (purge) purge.addEventListener('click', function () { toast('Nothing to delete — retention is off.'); });
    var share = $('share-savings');
    if (share) share.addEventListener('click', function () { toast('Share card generated — it contains no code content.'); });
    var leave = $('ws-leave');
    if (leave) leave.addEventListener('click', function () { toast('This is a demo — you are staying.'); });
  });
})();
