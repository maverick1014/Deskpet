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
  'focus.breakPomo': { zh: '专注', en: 'focus' },
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
  'menu.wardrobe': { zh: '换装', en: 'Wardrobe' },
  'menu.album': { zh: '成就册', en: 'Album' },
  'menu.pomodoro': { zh: '番茄专注', en: 'Focus' },
  'menu.settings': { zh: '设置', en: 'Settings' },
  'menu.quit': { zh: '退出', en: 'Quit' },
  // ---- wardrobe / dress-up ----
  'ward.title': { zh: '衣橱', en: 'Wardrobe' },
  'ward.blurb': { zh: '用金币买配饰，点一下就能穿上或脱下。', en: 'Buy accessories with coins; tap to wear or take off.' },
  'ward.owned': { zh: '已拥有', en: 'Owned' },
  'ward.wearing': { zh: '穿着中', en: 'Wearing' },
  'ward.wear': { zh: '穿上', en: 'Wear' },
  'ward.buy': { zh: '购买', en: 'Buy' },
  'ward.empty': { zh: '还没有配饰，去买一个吧~', en: 'No accessories yet — go buy one~' },
  // ---- achievements / album ----
  'ach.title': { zh: '成就册', en: 'Achievements' },
  'ach.blurb': { zh: '陪伴{0}的每个里程碑都会收藏在这里。', en: 'Every milestone with {0} is collected here.' },
  'ach.progress': { zh: '已解锁 {0}/{1}', en: 'Unlocked {0}/{1}' },
  'ach.locked': { zh: '未解锁', en: 'Locked' },
  // ---- pomodoro focus companion ----
  'pomo.title': { zh: '番茄专注', en: 'Focus' },
  'pomo.blurb': { zh: '选一段时间，企鹅会安静地陪你一起专注。中途退出会失败哦。', en: 'Pick a length — the penguin sits and focuses with you. Quitting midway fails it.' },
  'pomo.mins': { zh: '{0} 分钟', en: '{0} min' },
  'pomo.note': { zh: '专注陪伴中 · 中途退出会失败', en: 'Focusing with you · quitting midway fails it' },
  'pomo.start': { zh: '一起专注吧~ 我陪着你', en: "Let's focus together~ I'm right here" },
  'pomo.resume': { zh: '继续专注~ 我还在陪你', en: 'Back to focusing~ still with you' },
  'pomo.done': { zh: '{0}分钟专注完成！好棒~', en: 'Focused {0} min — great job~' },
  'game.end': { zh: '结束', en: 'End' },
  // ---- Code Buddy (Claude Code companion) settings ----
  'buddy.title': { zh: '代码搭子', en: 'Code Buddy' },
  'buddy.blurb': { zh: '连接 Claude Code，企鹅会陪你写代码、报错时提醒、完成时欢呼。全程本地，不上传代码。', en: 'Connect Claude Code — the penguin keeps you company, flags errors, and cheers when you finish. Fully local, your code is never uploaded.' },
  'buddy.connect': { zh: '连接 Claude Code', en: 'Connect Claude Code' },
  'buddy.connected': { zh: '已连接 · 点击断开', en: 'Connected · tap to disconnect' },
  // ---- school (上课) picker ----
  'school.title': { zh: '上课', en: 'Class' },
  'school.gradA': { zh: '🎓 已从大学毕业！', en: '🎓 Graduated university!' },
  'school.gradB': { zh: '全部课程完成啦~', en: 'All courses complete~' },
  'school.rule': { zh: '每节课 {0} 分钟，每科上 {1} 节；修完全部科目即可升学。', en: '{0} min per class, {1} per subject. Finish every subject to advance.' },
  'school.pickFaculty': { zh: '选择学院（你的职业方向），再修读它的专业。', en: 'Pick a faculty (your career path), then study its majors.' },
  'school.graduated': { zh: '✓毕业', en: '✓ Done' },
  'school.classBtn': { zh: '上课', en: 'Study' },
  // ---- work (上班) picker ----
  'work.title': { zh: '上班', en: 'Work' },
  'work.locked': { zh: '先去上学解锁工作吧~ 📚', en: 'Go to school to unlock jobs~ 📚' },
  'work.intro': { zh: '选择班次，专注到点即可领工资。玩耍或退出会清零。', en: 'Pick a shift — focus to the end to get paid. Playing or quitting resets it.' },
  'work.rateUnit': { zh: '/分', en: '/min' },
  'work.needs': { zh: '需要', en: 'Needs' },
  'work.shift': { zh: '{0}分 · +{1}💰', en: '{0}m · +{1}💰' },
  // ---- death screen ----
  'dead.left': { zh: '{0} 离开了…', en: '{0} has left…' },
  'dead.reason': { zh: '太久没人照顾了 💔', en: 'Left alone too long 💔' },
  'dead.revive': { zh: '💊 复活丹 · ¥400', en: '💊 Revival pill · ¥400' },
  'dead.restart': { zh: '🔄 重新养一只', en: '🔄 Raise a new one' },
  // ---- play (玩耍) picker ----
  'hint.controls': { zh: '单击 · 拖动 · 右键', en: 'Click · Drag · Right-click' },
  'update.available': { zh: '有新版本 {0}', en: 'Update {0} available' },
  'update.download': { zh: '下载', en: 'Download' },
  'update.ready': { zh: '新版本已下载，退出时自动更新', en: 'Update downloaded — installs on quit' },
  'update.restart': { zh: '立即重启', en: 'Restart now' },
  'play.title': { zh: '玩耍', en: 'Play' },
  'play.pick': { zh: '选一个，企鹅就在窗口里陪你玩~', en: 'Pick one — the penguin plays right in the window~' },
  // ---- settings panel ----
  'set.title': { zh: '设置', en: 'Settings' },
  'set.level': { zh: '成长等级', en: 'Growth level' },
  'set.name': { zh: '名字', en: 'Name' },
  'set.speed': { zh: '动画速度', en: 'Anim speed' },
  'set.opacity': { zh: '透明度', en: 'Opacity' },
  'set.sfx': { zh: '音效', en: 'Sound' },
  'set.sfxBlurb': { zh: '轻柔的小音效（啾/噗/吃），默认关闭。', en: 'Soft little blips (chirp/pop/eat), off by default.' },
  'set.on': { zh: '开', en: 'On' },
  'set.off': { zh: '关', en: 'Off' },
  'set.cloud': { zh: '云存档', en: 'Cloud save' },
  'set.syncNow': { zh: '立即同步', en: 'Sync now' },
  'set.signOut': { zh: '退出登录', en: 'Sign out' },
  'set.signIn': { zh: '登录', en: 'Log in' },
  'set.signUp': { zh: '注册', en: 'Sign up' },
  'set.done': { zh: '完成', en: 'Done' },
  'set.cloudBlurb': { zh: '登录后存档会自动备份到云端，换设备也不丢失。', en: 'Sign in to back up your save to the cloud — safe across devices.' },
  'set.email': { zh: '邮箱', en: 'Email' },
  'set.pw': { zh: '密码（至少6位）', en: 'Password (min 6)' },
  'sync.never': { zh: '尚未同步', en: 'Not synced yet' },
  'sync.justNow': { zh: '刚刚已同步', en: 'Synced just now' },
  'sync.minsAgo': { zh: '{0} 分钟前同步', en: 'Synced {0} min ago' },
  'sync.done': { zh: '已同步', en: 'Synced' },
  // ---- pet speech (say.*) ----
  'say.noMoney': { zh: '钱不够啦…💸', en: 'Not enough coins… 💸' },
  'say.collapse': { zh: '呜…我撑不住了…💀', en: "Ugh… I can't hold on… 💀" },
  'say.noRevive': { zh: '钱不够买复活丹…💸', en: 'Not enough for a revival pill… 💸' },
  'say.revived': { zh: '我…我回来啦！✨', en: "I… I'm back! ✨" },
  'say.newHello': { zh: '你好呀，我是新来的~ 🐧', en: "Hi, I'm new here~ 🐧" },
  'say.hatchHello': { zh: '你好呀，我是{0}~ 🥚', en: "Hi, I'm {0}~ 🥚" },
  'say.grewUp': { zh: '我长大啦！🎉🐧', en: 'I grew up! 🎉🐧' },
  'say.notSick': { zh: '我没生病呀~ 😊', en: "I'm not sick~ 😊" },
  'say.cured': { zh: '好多了，去休息一下~ 😴', en: 'Much better, time to rest~ 😴' },
  'say.partCured': { zh: '感觉好一点了…还得再吃药 💊', en: 'A bit better… need more medicine 💊' },
  'say.gradAll': { zh: '已经大学毕业啦！🎓', en: 'Already graduated university! 🎓' },
  'say.sickSeeDoc': { zh: '生病了，先看医生吧…🤒', en: "I'm sick — see a doctor first… 🤒" },
  'say.subjDone': { zh: '{0}已经学完啦~', en: '{0} is all done~' },
  'say.sickNoWork': { zh: '生病了不能上班…🤒', en: 'Too sick to work… 🤒' },
  'say.promote': { zh: '{0}毕业啦！🎓 升入{1}！', en: 'Graduated {0}! 🎓 On to {1}!' },
  'say.gradUni': { zh: '大学毕业！🎓🎉 厉害啦！', en: 'Graduated university! 🎓🎉 Amazing!' },
  'say.classDone': { zh: '{0} 上完一节课！({1}/{2}) 📚', en: 'Finished a {0} class! ({1}/{2}) 📚' },
  'say.payday': { zh: '{0}下班！赚到 +{1}💰', en: 'Off work from {0}! Earned +{1}💰' },
  'say.sneeze': { zh: '啊…啊嚏！🤧', en: 'Ah… achoo! 🤧' },
  'say.wokeUp': { zh: '哇！醒了醒了~', en: 'Whoa! Awake now~' },
  'say.weedNext': { zh: '这片拔完啦，去下一片~', en: 'This patch is done — on to the next~' },
  'say.wipeSweat': { zh: '呼~ 擦擦汗', en: 'Phew~ *wipes sweat*' },
  'say.manyWeeds': { zh: '哇，好多杂草！', en: 'Whoa, so many weeds!' },
  'say.hatOn': { zh: '换上工作帽，开干！', en: "Work hat on — let's go!" },
  'say.backAgain': { zh: '我回来啦~', en: "I'm back~" },
  'say.worseSick': { zh: '好像更严重了…🤒', en: 'Feeling worse… 🤒' },
  'say.cough': { zh: '咳…咳咳…🤧', en: '*cough… cough*… 🤧' },
  'say.full': { zh: '我吃饱啦，谢谢~ 😊', en: "I'm full, thanks~ 😊" },
  'say.welcomeBack': { zh: '你回来啦！好想你~ 🥰', en: 'You\'re back! Missed you~ 🥰' },
  'say.petted': { zh: '嘿嘿，好舒服~ 💕', en: 'Hehe, that feels nice~ 💕' },
  'say.cloudRestored': { zh: '已从云端恢复~', en: 'Restored from the cloud~' },
  'say.levelUp': { zh: '升级啦！Lv{0}！🎉', en: 'Level up! Lv{0}! 🎉' },
  'say.newFit': { zh: '嘿，新装扮！好看吗~', en: 'Ooh, a new look! How do I look~' },
  'say.achUnlock': { zh: '解锁成就：{0}！', en: 'Achievement unlocked: {0}!' },
  // ---- mini-game speech (g.*) ----
  'g.bubble': { zh: '挥棒~吹泡泡！', en: 'Swish~ bubbles!' },
  'g.fish': { zh: '小鱼飞起来啦！', en: 'Fish are flying!' },
  'g.rps': { zh: '石头剪刀布~', en: 'Rock, paper, scissors~' },
  'g.win': { zh: '我赢啦！', en: 'I win!' },
  'g.draw': { zh: '平局~', en: 'A tie~' },
  'g.again': { zh: '再来一局！', en: 'One more!' },
  'g.ball': { zh: '接球喽！', en: 'Catch!' },
  'g.watch': { zh: '看我拍~', en: 'Watch me tap~' },
  'g.remembered': { zh: '全记住啦！', en: 'Got them all!' },
  'g.oops': { zh: '哎呀，重来~', en: 'Oops, again~' },
};

// Pick a bilingual name from a { zh, en } object (used for content arrays like
// subjects / jobs / shop items / games).
export function tn(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.zh || '';
}

export function t(lang, key, ...args) {
  const e = STR[key];
  let s = e ? (e[lang] || e.zh) : key;
  args.forEach((a, i) => { s = s.replace('{' + i + '}', a); });
  return s;
}
