// Code Buddy — connect/disconnect Deskpet to the user's Claude Code by managing
// hook entries in ~/.claude/settings.json. Connecting also lays down a tiny,
// dependency-free helper (~/.deskpet/deskpet-hook.js) that each hook runs; the
// helper classifies the Claude Code event and appends one JSON line to
// ~/.deskpet/claude-events.jsonl, which the pet watches (see buddy.js).
//
// Everything is LOCAL. We only ever add/remove our own clearly-tagged hook
// entries (identified by the 'deskpet-hook' path in the command) and never touch
// anything else in the user's settings file.
const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.deskpet');
const EVENTS = path.join(DIR, 'claude-events.jsonl');
const HOOK = path.join(DIR, 'deskpet-hook.js');
const SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');
const TAG = 'deskpet-hook'; // marker that identifies our hook entries

// The helper script written to ~/.deskpet/deskpet-hook.js. Pure Node, no deps.
// Invoked by Claude Code as: node "<HOOK>" <hint>  with the hook JSON on stdin.
const HOOK_SRC = String.raw`#!/usr/bin/env node
// Deskpet Code Buddy hook helper. Reads a Claude Code hook payload on stdin,
// classifies it, and appends one event line to ~/.deskpet/claude-events.jsonl.
// Stays silent (emits nothing) for ordinary, uninteresting tool calls.
const fs = require('fs');
const os = require('os');
const path = require('path');
const DIR = path.join(os.homedir(), '.deskpet');
const EVENTS = path.join(DIR, 'claude-events.jsonl');
const hint = process.argv[2] || '';

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) {}
let data = {};
try { data = JSON.parse(raw || '{}'); } catch (e) {}

function emit(kind, extra) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const evt = Object.assign({ ts: Date.now(), kind: kind }, extra || {});
    let lines = [];
    try { lines = fs.readFileSync(EVENTS, 'utf8').split('\n').filter(Boolean); } catch (e) {}
    lines.push(JSON.stringify(evt));
    if (lines.length > 200) lines = lines.slice(-200);
    fs.writeFileSync(EVENTS, lines.join('\n') + '\n');
  } catch (e) {}
}

function classifyTool() {
  const name = data.tool_name || '';
  const inp = data.tool_input || {};
  const resp = data.tool_response;
  const out = typeof resp === 'string' ? resp : JSON.stringify(resp || '');
  const cmd = inp.command || '';
  // A real failure: a POSITIVE fail/error count, or a strong error signal. We
  // deliberately don't match the bare word "failed" (so "0 failed" is a pass) or
  // a lone "error" (so "0 errors" stays calm).
  const failNum = /\b[1-9]\d*\s+(failed|failures|errors?)\b/i;
  const hardErr = /(traceback|exception|fatal:|panic:|segmentation fault|exit code [1-9]|\bError:|\bERROR\b|✗|✘)/i;
  const passRe = /(\b\d+\s+passed\b|all tests? pass|\bPASS\b|✓|build succeeded|\b0 (failed|failures|errors?)\b)/i;
  const isTest = /(test|jest|pytest|vitest|mocha|go test|cargo test|npm (run )?test|yarn test|rspec|phpunit|unittest)/i.test(cmd);
  const failed = failNum.test(out) || hardErr.test(out);
  if (/git\s+(commit|push)/i.test(cmd)) return emit('git_commit');
  if (isTest && !failed && passRe.test(out)) return emit('tests_pass');
  if (isTest && failed) return emit('tests_fail');
  if (failed) return emit('tool_error');
  if (/(Edit|Write|MultiEdit)/i.test(name)) {
    const txt = String(inp.content || inp.new_string || '');
    if (txt.length > 400) return emit('big_diff');
  }
  // otherwise: stay quiet — keeps the pet calm during routine work
}

function classifyStop() {
  // Optional: if Claude tucked an invisible <!-- buddy: ... --> note into its
  // final message, let the pet speak it. Otherwise the pet uses a generic line.
  let say;
  try {
    const tp = data.transcript_path;
    if (tp && fs.existsSync(tp)) {
      const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0 && i > lines.length - 12; i--) {
        const m = /<!--\s*buddy:\s*([^>]*?)\s*-->/i.exec(lines[i]);
        if (m) { say = m[1].slice(0, 80); break; }
      }
    }
  } catch (e) {}
  emit('finish', say ? { say: say } : undefined);
}

switch (hint) {
  case 'session_start': emit('session_start'); break;
  case 'prompt': emit('prompt'); break;
  case 'notify': emit('needs_input'); break;
  case 'session_end': emit('session_end'); break;
  case 'stop': classifyStop(); break;
  case 'tool': classifyTool(); break;
  default: break;
}
`;

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return {}; }
}

function hasOurs(entry) {
  return (entry && entry.hooks || []).some((h) => String(h.command || '').includes(TAG));
}

// Connect: write the helper and add our hook entries (idempotently), preserving
// every other hook the user already has.
function install() {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(HOOK, HOOK_SRC);
  if (!fs.existsSync(EVENTS)) fs.writeFileSync(EVENTS, '');
  fs.mkdirSync(path.dirname(SETTINGS), { recursive: true });

  const s = readJSON(SETTINGS);
  s.hooks = s.hooks || {};
  const cmd = (hint) => 'node ' + JSON.stringify(HOOK) + ' ' + hint;
  const ensure = (event, hint, matcher) => {
    const arr = Array.isArray(s.hooks[event]) ? s.hooks[event] : [];
    const kept = arr.filter((g) => !hasOurs(g)); // drop any stale deskpet entry
    const entry = { hooks: [{ type: 'command', command: cmd(hint) }] };
    if (matcher) entry.matcher = matcher;
    kept.push(entry);
    s.hooks[event] = kept;
  };
  ensure('SessionStart', 'session_start');
  ensure('UserPromptSubmit', 'prompt');
  ensure('PostToolUse', 'tool', '*');
  ensure('Notification', 'notify');
  ensure('Stop', 'stop');
  ensure('SessionEnd', 'session_end');
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
  return true;
}

// Disconnect: strip ONLY our tagged entries; leave everything else intact.
function remove() {
  const s = readJSON(SETTINGS);
  if (s && s.hooks) {
    for (const ev of Object.keys(s.hooks)) {
      if (!Array.isArray(s.hooks[ev])) continue;
      s.hooks[ev] = s.hooks[ev].filter((g) => !hasOurs(g));
      if (s.hooks[ev].length === 0) delete s.hooks[ev];
    }
    if (Object.keys(s.hooks).length === 0) delete s.hooks;
    fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
  }
  return true;
}

function isInstalled() {
  const s = readJSON(SETTINGS);
  const h = (s && s.hooks) || {};
  return Object.values(h).some((arr) => Array.isArray(arr) && arr.some(hasOurs));
}

module.exports = { install, remove, isInstalled, paths: { dir: DIR, events: EVENTS, hook: HOOK, settings: SETTINGS } };
