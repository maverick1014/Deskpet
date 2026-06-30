// Lightweight i18n for Deskpet. The user picks a language at the login screen
// (中文 / English) and it's saved with the rest of the pet's state.
//
// Usage: import { t, LANGS } from './i18n.js';  t(lang, 'login.title')
// String values may contain {0}, {1}… placeholders filled from t()'s extra args.

export const LANGS = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
];

export function defaultLang() {
  try {
    const n = (typeof navigator !== 'undefined' && navigator.language || 'zh').toLowerCase();
    return n.startsWith('zh') ? 'zh' : 'en';
  } catch (e) { return 'zh'; }
}

// key -> { zh, en }. English kept short to fit the small window.
const STR = {
  // ---- login gate ----
  'login.signup': { zh: '注册账号', en: 'Sign up' },
  'login.login': { zh: '登录', en: 'Log in' },
  'login.blurb': { zh: '登录后存档会自动云端同步，换设备或重装都不丢失。', en: 'Sign in and your pet auto-syncs to the cloud — safe across reinstalls and devices.' },
  'login.email': { zh: '邮箱', en: 'Email' },
  'login.password': { zh: '密码（至少 6 位）', en: 'Password (min 6 chars)' },
  'login.offline': { zh: '当前离线 · 首次登录/注册需要联网', en: 'Offline — first sign-in/up needs a connection' },
  'login.busy': { zh: '请稍候…', en: 'Please wait…' },
  'login.doSignup': { zh: '注册并开始', en: 'Sign up & start' },
  'login.doLogin': { zh: '登录', en: 'Log in' },
  'login.toLogin': { zh: '已有账号？去登录', en: 'Have an account? Log in' },
  'login.toSignup': { zh: '没有账号？注册一个', en: 'No account? Sign up' },
  'login.needBoth': { zh: '请输入邮箱和密码', en: 'Enter email and password' },
  'login.pwShort': { zh: '密码至少 6 位', en: 'Password must be 6+ characters' },
  'login.confirmEmail': { zh: '注册成功，请到邮箱点击确认后再登录。', en: 'Signed up — confirm via the email link, then log in.' },
  'login.failed': { zh: '操作失败，请重试', en: 'Something went wrong, try again' },
  // ---- onboarding ----
  'ob.pickTitle': { zh: '选择你的小伙伴', en: 'Choose your buddy' },
  'ob.pickSub': { zh: '挑一颗蛋，开始养成', en: 'Pick an egg to start' },
  'ob.boy': { zh: '男孩', en: 'Boy' },
  'ob.girl': { zh: '女孩', en: 'Girl' },
  'ob.nameTitle': { zh: '给{0}取个名字', en: 'Name {0}' },
  'ob.him': { zh: '他', en: 'him' },
  'ob.her': { zh: '她', en: 'her' },
  'ob.nameGo': { zh: '就叫这个名字！', en: 'Use this name!' },
  // ---- care panel / actions ----
  'act.feed': { zh: '喂食', en: 'Feed' },
  'act.bath': { zh: '洗澡', en: 'Bath' },
  'act.play': { zh: '玩耍', en: 'Play' },
  'stat.fullness': { zh: '饱腹', en: 'Food' },
  'stat.clean': { zh: '清洁', en: 'Clean' },
  'stat.happy': { zh: '快乐', en: 'Happy' },
  'stat.health': { zh: '健康', en: 'Health' },
  'shop.back': { zh: '‹ 返回', en: '‹ Back' },
  // ---- level ----
  'lv.baby': { zh: '宝宝', en: 'Baby' },
  'lv.child': { zh: '幼年', en: 'Child' },
  'lv.adult': { zh: '成年', en: 'Adult' },
  // ---- focus bar / confirm ----
  'focus.note': { zh: '专注中 · 只能喂食/洗澡，玩耍或退出会清零', en: 'Focusing · only Feed/Bath; playing or quitting resets it' },
  'focus.breakTitle': { zh: '中断{0}？', en: 'Stop {0}?' },
  'focus.breakClass': { zh: '上课', en: 'class' },
  'focus.breakWork': { zh: '上班', en: 'work' },
  'focus.breakBody': { zh: '这次的专注进度会清零哦，确定要中断吗？', en: "This session's progress will be lost. Stop anyway?" },
  'focus.keep': { zh: '继续专注', en: 'Keep going' },
  'focus.stop': { zh: '确定中断', en: 'Stop it' },
  'focus.startClass': { zh: '开始专注上课啦~ 要加油📚', en: 'Class is starting — focus up! 📚' },
  'focus.startWork': { zh: '开始认真工作~ 💼', en: 'Time to get to work~ 💼' },
  'focus.resumeClass': { zh: '继续上课~ 还差一点点📚', en: 'Back to class~ almost there 📚' },
  'focus.resumeWork': { zh: '继续干活~ 💼', en: 'Back to work~ 💼' },
  'focus.busy': { zh: '正在专注中哦~', en: "I'm focusing right now~" },
  'focus.distracted': { zh: '分心了…这次要从头来过 😣', en: 'Got distracted… have to start over 😣' },
  // ---- right-click menu ----
  'menu.feed': { zh: '喂食', en: 'Feed' },
  'menu.bath': { zh: '洗澡', en: 'Bath' },
  'menu.play': { zh: '玩耍', en: 'Play' },
  'menu.sit': { zh: '坐下', en: 'Sit' },
  'menu.stopFocus': { zh: '停止专注（清零）', en: 'Stop focus (resets)' },
  'menu.study': { zh: '上学', en: 'School' },
  'menu.work': { zh: '上班', en: 'Work' },
  'menu.doctor': { zh: '看病', en: 'Doctor' },
  'menu.center': { zh: '回到中央', en: 'Recenter' },
  'menu.settings': { zh: '设置', en: 'Settings' },
  'menu.quit': { zh: '退出', en: 'Quit' },
  'game.end': { zh: '结束', en: 'End' },
  // ---- Code Buddy (Claude Code companion) settings ----
  'buddy.title': { zh: '代码搭子', en: 'Code Buddy' },
  'buddy.blurb': { zh: '连接 Claude Code，企鹅会陪你写代码、报错时提醒、完成时欢呼。全程本地，不上传代码。', en: 'Connect Claude Code — the penguin keeps you company, flags errors, and cheers when you finish. Fully local, your code is never uploaded.' },
  'buddy.connect': { zh: '连接 Claude Code', en: 'Connect Claude Code' },
  'buddy.connected': { zh: '已连接 · 点击断开', en: 'Connected · tap to disconnect' },
};

export function t(lang, key, ...args) {
  const e = STR[key];
  let s = e ? (e[lang] || e.zh) : key;
  args.forEach((a, i) => { s = s.replace('{' + i + '}', a); });
  return s;
}
