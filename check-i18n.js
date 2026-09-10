#!/usr/bin/env node
/* Sandcode i18n dictionary check — no dependencies.
   The dictionary keys must match DOM/JS text exactly, so any copy edit can
   silently orphan a key (stays English). This script catches that:
     1. orphan keys   — dictionary keys that no longer appear anywhere
     2. duplicate keys — same key defined in more than one dict file
   Usage: node check-i18n.js   (exit 1 when orphans found) */
'use strict';
const fs = require('fs');

const DICTS = ['i18n-dict-a.js', 'i18n-dict-b.js', 'i18n-dict-c.js'];
const HTML = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const JS = ['chrome.js', 'script.js', 'workspace-pages.js', 'common.js'];
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', '#39': "'", middot: '·', times: '×', hellip: '…', larr: '←', rarr: '→' };

const norm = s => s.replace(/&(#39|amp|lt|gt|quot|nbsp|middot|times|hellip|larr|rarr);/g, (_, e) => ENTITIES[e]).replace(/\s+/g, ' ').trim();

// ---- collect dictionary keys (first quoted string of each `key: value` entry) ----
const keys = new Map(); // key -> [files]
for (const f of DICTS) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /^\s*'((?:[^'\\]|\\.)+)'\s*:/gm; // anchored per line — keys start the line
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1].replace(/\\'/g, "'");
    if (!keys.has(key)) keys.set(key, []);
    keys.get(key).push(f);
  }
}

// ---- build haystack of site text ----
const hay = [];
for (const f of HTML) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/>([^<>]+)</g)) hay.push(m[1]);                                    // text nodes
  for (const m of src.matchAll(/(?:data-toast|placeholder|title|aria-label|content)="([^"]*)"/g)) hay.push(m[1]); // attrs
}
for (const f of JS) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/'([^'\n]+)'|"([^"\n]+)"/g)) hay.push(m[1] || m[2]);               // string literals
}
const haystack = hay.map(norm).join('\n');

// ---- report ----
let bad = 0;
const dupes = [...keys.entries()].filter(([, v]) => v.length > 1);
for (const [key, files] of dupes) console.warn(`DUPLICATE  "${key}"  in ${files.join(', ')}`);
if (dupes.length) bad++;

const orphans = [...keys.keys()].filter(k => !haystack.includes(k));
for (const k of orphans) console.warn(`ORPHAN     "${k}"  (defined in ${(keys.get(k)).join(', ')})`);
if (orphans.length) bad++;

console.log(`checked ${keys.size} keys against ${HTML.length} pages + ${JS.length} js files`);
if (bad) { console.error(`✗ ${dupes.length} duplicates, ${orphans.length} orphans`); process.exit(1); }
console.log('✓ dictionary clean');
