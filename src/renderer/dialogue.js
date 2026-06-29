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
  // egg / baby stage — childish chatter
  baby: ['咿呀咿呀~', '蛋壳暖暖的…🥚', '我还小小的~', '咕~ 咕~', '想快快长大！', '*在蛋里翻身*'],
  tooYoung: ['我还在蛋里呢，长大再说嘛~ 🥚', '等我长大才可以哦~', '人家还小啦…'],
  // patiently missing the owner (knows you're busy — a good child who waits)
  miss: ['主人在忙吧，我乖乖等~', '想你了，不过没关系，我等你~', '我会做个乖孩子等你的', '等你忙完一起玩呀~', '我在这儿等你哦~'],
};

// Things the pet LEARNS in each course. It says these out loud while studying
// the subject, and once it has studied a subject it mixes the facts into its
// idle chatter — so studying visibly makes it smarter. (Kept emoji-free.)
export const KNOWLEDGE = {
  ma: [
    '1 + 1 = 2，这个我会！',
    '三角形有三条边哦~',
    '一个圆是 360 度！',
    '10 - 7 = 3，算对啦！',
    '偶数都能被 2 整除~',
    '正方形四条边一样长！',
    '0 乘任何数都等于 0！',
  ],
  cn: [
    '“床前明月光，疑是地上霜。”',
    '“水”字是三点水旁~',
    '“画蛇添足”就是多此一举！',
    '写字要横平竖直才好看~',
    '“春眠不觉晓，处处闻啼鸟。”',
    '“一寸光阴一寸金”，要珍惜时间！',
  ],
  sc: [
    '光合作用把阳光变成养分！',
    '光会折射，筷子在水里看着是弯的~',
    '声音要靠空气来传播哦！',
    '水受热会蒸发，变成水蒸气~',
    '彩虹是阳光被雨滴折射出来的！',
    '植物吸进二氧化碳，放出氧气~',
    '磁铁同极相斥、异极相吸！',
  ],
  en: [
    'Hello! Nice to meet you!',
    'How are you? I am fine, thank you!',
    'Apple, banana, and a cat!',
    'The sky is blue and very big!',
    'I love learning English!',
    'One, two, three, let us count!',
    'Good morning! Have a nice day!',
  ],
};

// Lines the pet says while studying a given subject (learning out loud).
export function studyLine(subjectKey) {
  const k = KNOWLEDGE[subjectKey];
  return k ? k[Math.floor(Math.random() * k.length)] : null;
}

// Pool of facts from every subject the pet has studied (for idle show-off).
export function knowledgePool(subjectKeys) {
  const lines = [];
  for (const k of subjectKeys || []) if (KNOWLEDGE[k]) lines.push(...KNOWLEDGE[k]);
  return lines;
}

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
