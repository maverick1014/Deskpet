// Dialogue line pools (Phase 1, from 屏幕行走系统.md "对话气泡").
// Short, cute speech-bubble lines, in Chinese to match the all-Chinese UI.
export const DIA = {
  greetMorning: ['早上好呀！☀️', '早安~', '新的一天！🐧'],
  greetAfternoon: ['你好呀！👋', '今天天气不错~', '哈喽~'],
  greetEvening: ['晚上好！🌆', '今天过得怎么样？', '欢迎回来~'],
  greetNight: ['还没睡呀？🌙', '该睡觉啦…', 'zzZ…'],

  click: ['嗨！', '嘿嘿~', '在呢？🐧', '怎么啦？'],
  clickLively: ['一起玩吧！🎈', '嗨嗨嗨！', '耶~', '戳一下！💙'],
  clickShy: ['…嗨', '哦，你好', '*探头*'],

  bored: ['好无聊…', '…', '陪我玩嘛？', '*戳屏幕*', '嗯~', '有什么好玩的吗？'],
  lonely: ['你去哪儿啦？', '人呢…？🥺', '想你了…', '快回来呀~'],
  hungry: ['我饿了…', '有鱼吗？🐟', '肚子咕咕叫…', '喂喂我嘛？🥺'],
  sleepy: ['好困…😴', '我累了…💤', '*打哈欠*', '睡个午觉？', '眼皮好重…'],
  unhappy: ['好无聊…想玩 🥺', '陪我玩一会儿嘛~', '有点不开心…', '我们玩点什么吧？'],
  happy: ['我好开心！😊', '今天最棒啦！', '耶~ 🎉'],

  fed: ['好好吃！🐟', '谢谢你！', '真美味~', '还要~ 😋'],
  played: ['玩得真开心！🎉', '再来再来！', '耶~', '最棒啦！'],
  slept: ['*伸懒腰* 😌', '睡饱啦！', '午觉真香~'],

  sit: ['歇会儿~ 😌', '坐下来发会儿呆…', '坐一会儿真舒服', '让我休息一下~'],
  ball: ['接住啦！⚽', '看我的！', '球球真好玩！', '传给我传给我！'],
  badminton: ['看我扣杀！🏸', '杀球！', '接招呀~', '羽毛球最棒啦！'],
  bath: ['洗白白~ 🫧', '好舒服…', '搓搓澡！', '香喷喷啦！✨'],
  dirty: ['身上好痒…', '好脏呀…想洗澡了', '有苍蝇！🪰', '我要洗白白…🥺'],
  weak: ['饿得走不动了…🥺', '没力气了…', '好饿好饿…', '快喂喂我…🍖'],
  sick: ['好难受…🤒', '我生病了…', '头好晕…', '想看医生…💊'],
  study: ['认真学习中…📖', '好好读书~', '学习使我快乐！', '又长知识啦~'],
  work: ['努力工作中…💼', '搬砖赚钱~', '加油干活！', '为了小鱼干！🐟'],
};

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function greetingPool(hour) {
  if (hour < 5) return DIA.greetNight;
  if (hour < 12) return DIA.greetMorning;
  if (hour < 18) return DIA.greetAfternoon;
  if (hour < 22) return DIA.greetEvening;
  return DIA.greetNight;
}
