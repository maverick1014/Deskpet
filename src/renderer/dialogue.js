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

// Code Buddy reaction lines — what the pet says when it reacts to the developer's
// Claude Code session. Bilingual. If Claude embedded its own <!-- buddy: … -->
// remark, that is spoken instead of these.
export const BUDDY = {
  sessionStart: { zh: ['开始写代码啦！我陪你~ 💻', '一起加油！', '我在旁边看着哦~'], en: ["Let's code! I'm with you 💻", "Let's do this!", "I'm right here watching~"] },
  prompt: { zh: ['嗯嗯，在听~', '让我看看…', '收到！'], en: ['Mm, listening~', "Let's see…", 'Got it!'] },
  error: { zh: ['哎呀，出错了！😣', '报错了…要看看哦', '呜，红色的字…'], en: ['Uh oh, an error! 😣', 'Something broke… take a look', 'Eek, red text…'] },
  testsFail: { zh: ['测试没过…再试试！', '有测试挂了 😖', '差一点，加油！'], en: ['Tests failed… try again!', 'A test went red 😖', 'So close, keep going!'] },
  testsPass: { zh: ['测试全过啦！🎉', '绿了绿了！太棒了！', '全部通过~ 好厉害！'], en: ['All tests pass! 🎉', "It's green! Awesome!", 'Everything passed~ nice!'] },
  bigDiff: { zh: ['哇，改了好多！', '一大波改动~ 💪', '大工程呀！'], en: ['Whoa, big change!', 'Lots of edits~ 💪', 'Big one!'] },
  commit: { zh: ['提交成功，发车！🚀', '存好啦~ 棒！', '又一个 commit！'], en: ['Committed — shipped! 🚀', 'Saved~ nice!', 'Another commit!'] },
  needInput: { zh: ['主人，需要你确认一下！👀', '这里要你点头哦~', '等你一下下~'], en: ['Hey, it needs your OK! 👀', 'Your call on this one~', 'Waiting on you~'] },
  finish: { zh: ['搞定！😎', '这一轮完成啦~', '好啦，看看吧！'], en: ['Done! 😎', 'That round is done~', 'All set — take a look!'] },
  sessionEnd: { zh: ['今天辛苦啦~ 👋', '收工！休息一下吧', '下次见~'], en: ['Nice work today~ 👋', 'Wrapping up! Take a break', 'See you next time~'] },
  // Big-win celebration / congratulation words (tests pass, commit, finish).
  congrats: { zh: ['太棒啦！恭喜你！🎉', '哇！成功了！👏', '你做到了！好厉害！🏆', '完美通过！为你骄傲！✨', '漂亮！这波超稳！🎊', '耶！我们成功了！🥳'],
              en: ['Amazing! Congrats! 🎉', 'Woohoo! It works! 👏', 'You did it! Incredible! 🏆', 'Flawless! So proud of you! ✨', 'Beautiful — nailed it! 🎊', "Yay! We did it! 🥳"] },
  // Encouragement to cheer the owner on (between wins / every few prompts).
  encourage: { zh: ['你超棒的，继续加油！💪', '我相信你，一定可以！', '慢慢来，你做得很好！', '别灰心，你是最厉害的！', '加油加油，我陪着你！🐧', '一步一步来，你很棒！', '休息一下也没关系，我等你~'],
               en: ["You've got this — keep going! 💪", 'I believe in you, you can do it!', "Take your time, you're doing great!", "Don't give up, you're the best!", "Go go go — I'm with you! 🐧", "One step at a time, you're awesome!", "It's okay to rest, I'll wait~"] },
  // Gentle wellness nudges after a long continuous work stretch. Cute, soft,
  // and in-character (the penguin cares about its owner). 🐧
  restReminder: { zh: ['主人坐好久啦~ 起来像企鹅一样摇摇摆摆走两步嘛 🐧', '歇一歇眼睛，看看远方好不好~ 👀', '要不要来杯咖啡提提神？我陪你去~ ☕', '站起来伸个大懒腰吧，舒服~ 🐧', '记得喝口水哦，别太累啦 💧', '休息一下下，回来再战也不迟呀~ 😊', '拍拍肩膀，放松放松，你已经很努力啦 💙'],
                  en: ["You've been sitting a while~ get up and waddle a bit like me 🐧", 'Rest your eyes — look far away for a moment~ 👀', 'How about a coffee to recharge? I\'ll tag along~ ☕', 'Stand up and have a big stretch, soo comfy~ 🐧', 'Remember to sip some water, don\'t tire yourself 💧', 'Take a little break — the code will wait for you~ 😊', "Shoulders down, relax~ you've worked so hard 💙"] },
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
  // ---- career-path curriculum: the pet shows off what it learned ----
  // 幼儿园
  read: { zh: ['“人”字像一个人在走路~', '大声念出来：a、o、e！', '“日”是太阳，“月”是月亮！'], en: ['The character 人 looks like a walking person~', 'Read aloud: a, o, e!', '日 means sun, 月 means moon!'] },
  count: { zh: ['1、2、3、4、5，我会数到五！', '十个手指头，数得清清楚楚~', '大的在前，小的在后！'], en: ['1, 2, 3, 4, 5 — I can count to five!', 'Ten little fingers, easy to count~', 'Big ones first, small ones after!'] },
  draw: { zh: ['红加黄，变成橙色啦！', '先画圆圆的太阳~', '涂色要涂在线里面哦！'], en: ['Red plus yellow makes orange!', 'First draw a round sun~', 'Colour inside the lines!'] },
  sing: { zh: ['哆来咪发嗦~ 唱起来！', '跟着节拍拍拍手！', '唱歌要用肚子呼吸哦~'], en: ['Do re mi fa sol — sing along~', 'Clap along to the beat!', 'Sing from your belly~'] },
  craft: { zh: ['折一只小纸船!', '剪刀要小心用哦~', '贴一贴，做只小花猫！'], en: ['Fold a little paper boat!', 'Use scissors carefully~', 'Glue it up into a kitty!'] },
  // 小学
  pe: { zh: ['运动前要先热身！', '拍球要用手腕的力~', '深呼吸，跑得更远！'], en: ['Warm up before exercise!', 'Bounce the ball with your wrist~', 'Breathe deep to run farther!'] },
  music: { zh: ['一首歌有节拍和旋律~', '高音在上，低音在下！', '四分音符打一拍！'], en: ['A song has beat and melody~', 'High notes up, low notes down!', 'A quarter note is one beat!'] },
  art: { zh: ['三原色是红、黄、蓝！', '近大远小，才有立体感~', '冷色让人安静，暖色让人开心！'], en: ['The primary colours are red, yellow, blue!', 'Near is big, far is small — depth~', 'Cool colours calm, warm colours cheer!'] },
  // 中学
  phys: { zh: ['力有大小，也有方向！', '同名磁极相斥，异名相吸~', '光速是每秒约 30 万公里！'], en: ['A force has size and direction!', 'Like poles repel, opposites attract~', 'Light travels ~300,000 km per second!'] },
  chem: { zh: ['水就是 H₂O！', '酸和碱会中和~', '空气里大部分是氮气哦！'], en: ['Water is H₂O!', 'Acids and bases neutralise~', 'Most of the air is nitrogen!'] },
  bio: { zh: ['心脏一直在扑通扑通跳~', '植物靠叶子进行光合作用！', '细胞是生命的基本单位！'], en: ['The heart keeps going thump-thump~', 'Leaves do photosynthesis!', 'Cells are the units of life!'] },
  hist: { zh: ['长城很长很长~', '四大发明真了不起！', '读史使人明智！'], en: ['The Great Wall is very, very long~', 'The Four Great Inventions are amazing!', 'History makes us wise!'] },
  geo: { zh: ['地球有七大洲、四大洋！', '赤道是最热的地方~', '指南针总是指向北方！'], en: ['Earth has seven continents, four oceans!', 'The equator is the hottest~', 'A compass always points north!'] },
  it: { zh: ['电脑用 0 和 1 来思考！', '记得常常备份文件哦~', '一个字节有八个比特！'], en: ['Computers think in 0s and 1s!', 'Remember to back up your files~', 'One byte is eight bits!'] },
  // 大学 majors
  cs: { zh: ['写代码要一步一步来~', '先想清楚，再动手写！', '循环能帮我们少写很多代码！'], en: ['Write code step by step~', 'Think first, then type!', 'Loops save us so much typing!'] },
  ai: { zh: ['AI 从很多数据里学习~', '训练越多，答得越准！', '别忘了，AI 也会犯错哦！'], en: ['AI learns from lots of data~', 'More training, better answers!', "Don't forget — AI makes mistakes too!"] },
  acct: { zh: ['收入减支出，就是利润！', '每一笔账都要记清楚~', '借贷要平衡才对！'], en: ['Income minus costs equals profit!', 'Record every transaction~', 'Debits and credits must balance!'] },
  fin: { zh: ['别把鸡蛋放在一个篮子里~', '复利是世界第八大奇迹！', '花钱前先存一点吧！'], en: ["Don't put all your eggs in one basket~", 'Compound interest is a wonder!', 'Save a little before you spend!'] },
  med: { zh: ['多喝水、多休息，好得快~', '饭前要洗手哦！', '预防胜于治疗！'], en: ['Rest and water help you heal~', 'Wash your hands before meals!', 'Prevention beats cure!'] },
  nurse: { zh: ['照顾病人要有耐心和爱心~', '量体温，记得先甩一甩！', '一个微笑就是良药！'], en: ['Care needs patience and heart~', 'Take the temperature gently!', 'A smile is good medicine!'] },
  edu: { zh: ['教学相长，一起进步~', '因材施教最重要！', '鼓励比批评更有用哦！'], en: ['Teaching and learning grow together~', 'Teach each to their strengths!', 'Encouragement beats scolding!'] },
  psy: { zh: ['深呼吸能让心情平静~', '情绪没有好坏之分！', '多倾听，少评判~'], en: ['Deep breaths calm the mind~', 'No emotion is good or bad!', 'Listen more, judge less~'] },
  fa: { zh: ['光和影让画更有立体感~', '留白也是一种美！', '临摹是练习的好方法！'], en: ['Light and shadow give depth~', 'Empty space is beauty too!', 'Copying masters is great practice!'] },
  design: { zh: ['好设计既好看又好用~', '少即是多！', '先想用户，再想样式！'], en: ['Good design is pretty AND useful~', 'Less is more!', 'Think of the user first, style second!'] },
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
