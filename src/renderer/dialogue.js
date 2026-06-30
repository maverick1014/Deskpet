// Dialogue line pools — bilingual (zh / en). Pick the array for the current
// language: pick(DIA.click[lang]).
export const DIA = {
  greetMorning: { zh: ['早上好呀！☀️', '早安~', '新的一天！🐧'], en: ['Good morning! ☀️', 'Morning~', 'A brand new day! 🐧'] },
  greetAfternoon: { zh: ['你好呀！👋', '今天天气不错~', '哈喽~'], en: ['Hi there! 👋', 'Nice day, huh~', 'Hello~'] },
  greetEvening: { zh: ['晚上好！🌆', '今天过得怎么样？', '欢迎回来~'], en: ['Good evening! 🌆', 'How was your day?', 'Welcome back~'] },
  greetNight: { zh: ['还没睡呀？🌙', '该睡觉啦…', 'zzZ…'], en: ['Still up? 🌙', 'Time for bed…', 'zzZ…'] },

  click: { zh: ['嗨！', '嘿嘿~', '在呢？🐧', '怎么啦？'], en: ['Hi!', 'Hehe~', "I'm here! 🐧", "What's up?"] },
  clickLively: { zh: ['一起玩吧！🎈', '嗨嗨嗨！', '耶~', '戳一下！💙'], en: ["Let's play! 🎈", 'Hey hey hey!', 'Yay~', 'Boop! 💙'] },
  clickShy: { zh: ['…嗨', '哦，你好', '*探头*'], en: ['…hi', 'Oh, hello', '*peeks*'] },

  bored: { zh: ['好无聊…', '…', '陪我玩嘛？', '*戳屏幕*', '嗯~', '有什么好玩的吗？'], en: ['So bored…', '…', 'Play with me?', '*pokes screen*', 'Hmm~', 'Anything fun to do?'] },
  lonely: { zh: ['你去哪儿啦？', '人呢…？🥺', '想你了…', '快回来呀~'], en: ['Where did you go?', 'Anyone…? 🥺', 'I miss you…', 'Come back soon~'] },
  hungry: { zh: ['我饿了…', '有鱼吗？🐟', '肚子咕咕叫…', '喂喂我嘛？🥺'], en: ["I'm hungry…", 'Any fish? 🐟', '*tummy rumbles*', 'Feed me? 🥺'] },
  sleepy: { zh: ['好困…😴', '我累了…💤', '*打哈欠*', '睡个午觉？', '眼皮好重…'], en: ['So sleepy… 😴', "I'm tired… 💤", '*yawn*', 'Nap time?', 'Heavy eyelids…'] },
  unhappy: { zh: ['好无聊…想玩 🥺', '陪我玩一会儿嘛~', '有点不开心…', '我们玩点什么吧？'], en: ['Bored… wanna play 🥺', 'Play with me a bit~', 'Feeling a little down…', "Let's do something fun?"] },
  happy: { zh: ['我好开心！😊', '今天最棒啦！', '耶~ 🎉'], en: ["I'm so happy! 😊", 'Best day ever!', 'Yay~ 🎉'] },

  fed: { zh: ['好好吃！🐟', '谢谢你！', '真美味~', '还要~ 😋'], en: ['Yummy! 🐟', 'Thank you!', 'Delicious~', 'More~ 😋'] },
  played: { zh: ['玩得真开心！🎉', '再来再来！', '耶~', '最棒啦！'], en: ['So much fun! 🎉', 'Again, again!', 'Yay~', 'The best!'] },
  slept: { zh: ['*伸懒腰* 😌', '睡饱啦！', '午觉真香~'], en: ['*stretch* 😌', 'All rested!', 'Great nap~'] },

  sit: { zh: ['歇会儿~ 😌', '坐下来发会儿呆…', '坐一会儿真舒服', '让我休息一下~'], en: ['A little rest~ 😌', 'Just sitting and zoning out…', 'Comfy sitting here', 'Let me rest a sec~'] },
  ball: { zh: ['接住啦！⚽', '看我的！', '球球真好玩！', '传给我传给我！'], en: ['Got it! ⚽', 'Watch this!', 'Balls are fun!', 'Pass it to me!'] },
  badminton: { zh: ['看我扣杀！🏸', '杀球！', '接招呀~', '羽毛球最棒啦！'], en: ['Smash! 🏸', 'Take that!', 'Here it comes~', 'Badminton rules!'] },
  bath: { zh: ['洗白白~ 🫧', '好舒服…', '搓搓澡！', '香喷喷啦！✨'], en: ['Scrub scrub~ 🫧', 'So nice…', 'Bath time!', 'Squeaky clean! ✨'] },
  dirty: { zh: ['身上好痒…', '好脏呀…想洗澡了', '有苍蝇！🪰', '我要洗白白…🥺'], en: ['So itchy…', "I'm dirty… want a bath", 'A fly! 🪰', 'I need a bath… 🥺'] },
  weak: { zh: ['饿得走不动了…🥺', '没力气了…', '好饿好饿…', '快喂喂我…🍖'], en: ['Too hungry to move… 🥺', 'No energy left…', 'So so hungry…', 'Please feed me… 🍖'] },
  sick: { zh: ['好难受…🤒', '我生病了…', '头好晕…', '想看医生…💊'], en: ['I feel awful… 🤒', "I'm sick…", 'So dizzy…', 'Need a doctor… 💊'] },
  study: { zh: ['认真学习中…📖', '好好读书~', '学习使我快乐！', '又长知识啦~'], en: ['Studying hard… 📖', 'Reading away~', 'Learning makes me happy!', 'Getting smarter~'] },
  work: { zh: ['努力工作中…💼', '搬砖赚钱~', '加油干活！', '为了小鱼干！🐟'], en: ['Working hard… 💼', 'Earning my keep~', 'Keep at it!', 'For the fish snacks! 🐟'] },
  baby: { zh: ['咿呀咿呀~', '蛋壳暖暖的…🥚', '我还小小的~', '咕~ 咕~', '想快快长大！', '*在蛋里翻身*'], en: ['Goo-goo~', 'The shell is warm… 🥚', "I'm still tiny~", 'Coo~ coo~', 'I wanna grow up fast!', '*rolls in the egg*'] },
  tooYoung: { zh: ['我还在蛋里呢，长大再说嘛~ 🥚', '等我长大才可以哦~', '人家还小啦…'], en: ["I'm still in my egg, ask me when I'm bigger~ 🥚", 'Wait till I grow up~', "I'm still little…"] },
  miss: { zh: ['主人在忙吧，我乖乖等~', '想你了，不过没关系，我等你~', '我会做个乖孩子等你的', '等你忙完一起玩呀~', '我在这儿等你哦~'], en: ["You're busy, I'll wait nicely~", "I miss you, but it's okay, I'll wait~", "I'll be good and wait for you", "Let's play when you're free~", "I'll be right here waiting~"] },
};

// Per-course knowledge the pet learns and shows off. English stays English in
// both languages (it IS the 英语 lesson); the others translate.
export const KNOWLEDGE = {
  ma: {
    zh: ['1 + 1 = 2，这个我会！', '三角形有三条边哦~', '一个圆是 360 度！', '10 - 7 = 3，算对啦！', '偶数都能被 2 整除~', '正方形四条边一样长！', '0 乘任何数都等于 0！'],
    en: ['1 + 1 = 2, easy!', 'A triangle has three sides~', 'A full circle is 360 degrees!', '10 - 7 = 3, got it!', 'Even numbers divide by 2~', 'A square has four equal sides!', '0 times anything is 0!'],
  },
  cn: {
    zh: ['“床前明月光，疑是地上霜。”', '“水”字是三点水旁~', '“画蛇添足”就是多此一举！', '写字要横平竖直才好看~', '“春眠不觉晓，处处闻啼鸟。”', '“一寸光阴一寸金”，要珍惜时间！'],
    en: ['A famous Tang poem: "Moonlight before my bed…"', 'The character 水 (water) has the three-dots radical~', '“画蛇添足” means doing something needless!', 'Neat strokes make neat characters~', '“春眠不觉晓” — spring sleep knows no dawn.', 'Time is gold — don\'t waste it!'],
  },
  sc: {
    zh: ['光合作用把阳光变成养分！', '光会折射，筷子在水里看着是弯的~', '声音要靠空气来传播哦！', '水受热会蒸发，变成水蒸气~', '彩虹是阳光被雨滴折射出来的！', '植物吸进二氧化碳，放出氧气~', '磁铁同极相斥、异极相吸！'],
    en: ['Photosynthesis turns sunlight into food!', 'Light refracts — a straw looks bent in water~', 'Sound travels through the air!', 'Heated water evaporates into vapour~', 'Rainbows are sunlight refracted by raindrops!', 'Plants breathe in CO₂ and give out oxygen~', 'Magnets: like poles repel, opposites attract!'],
  },
  en: {
    zh: ['Hello! Nice to meet you!', 'How are you? I am fine, thank you!', 'Apple, banana, and a cat!', 'The sky is blue and very big!', 'I love learning English!', 'One, two, three, let us count!', 'Good morning! Have a nice day!'],
    en: ['Hello! Nice to meet you!', 'How are you? I am fine, thank you!', 'Apple, banana, and a cat!', 'The sky is blue and very big!', 'I love learning English!', 'One, two, three, let us count!', 'Good morning! Have a nice day!'],
  },
};

export function studyLine(subjectKey, lang = 'zh') {
  const k = KNOWLEDGE[subjectKey];
  if (!k) return null;
  const arr = k[lang] || k.zh;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function knowledgePool(subjectKeys, lang = 'zh') {
  const lines = [];
  for (const k of subjectKeys || []) { const e = KNOWLEDGE[k]; if (e) lines.push(...(e[lang] || e.zh)); }
  return lines;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function greetingPool(hour, lang = 'zh') {
  const key = hour < 5 ? 'greetNight' : hour < 12 ? 'greetMorning' : hour < 18 ? 'greetAfternoon' : hour < 22 ? 'greetEvening' : 'greetNight';
  return DIA[key][lang] || DIA[key].zh;
}
