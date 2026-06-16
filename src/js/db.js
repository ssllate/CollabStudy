// база данных, демо-данные, localStorage

// главный объект данных приложения
var DB = {
  users:[], projects:[], messages:[], groupChats:[], ratings:{},
  notifications:[], feed:[], me:null,
  exploreSkill:null, exploreQuery:'',
  projSkill:null,    projQuery:'',
  rateTarget:null,   rateVal:0,
  chatWith:null,      // uid для личного диалога
  groupChatId:null    // id группового чата (если открыт групповой)
};

// инициализация демо-данных при первом запуске
function initDemo() {
  if (DB.users.length > 0) return;
  DB.users = [
    {id:'u1',name:'Анна Петрова',    email:'anna@example.com',  pass:'demo', bio:'Фронтенд-разработчик и UX-дизайнер. Строю красивые и удобные интерфейсы.', univ:'НГУ, 3 курс',        skills:['React','TypeScript','Figma'],   goals:['Свой продукт','Яндекс'],    interests:['Дизайн','Музыка'], status:'open',   created:Date.now()-900000},
    {id:'u2',name:'Михаил Сидоров',  email:'mike@example.com',  pass:'demo', bio:'Backend-инженер, фанат алгоритмов и олимпиадного программирования.',        univ:'МФТИ, 4 курс',     skills:['Python','Go','PostgreSQL'],    goals:['ACM ICPC','Rust'],          interests:['Алгоритмы','Шахматы'], status:'busy',   created:Date.now()-800000},
    {id:'u3',name:'Елена Васильева', email:'elena@example.com', pass:'demo', bio:'Маркетолог с опытом B2C и B2B. Интересуюсь product management.',            univ:'ВШЭ, 2 курс',      skills:['Маркетинг','SMM','Аналитика'], goals:['Стартап','SQL'],            interests:['Подкасты','Йога'],     status:'open',   created:Date.now()-700000},
    {id:'u4',name:'Алексей Козлов',  email:'alex@example.com',  pass:'demo', bio:'Fullstack-разработчик, изучаю DevOps. Строю side-projects по выходным.',    univ:'ИТМО, 3 курс',     skills:['React','Node.js','Docker'],    goals:['Fullstack','Open source'],  interests:['Геймдев','Фото'],      status:'open',   created:Date.now()-600000},
    {id:'u5',name:'Мария Иванова',   email:'maria@example.com', pass:'demo', bio:'UX/UI-дизайнер с фокусом на мобильные приложения. Дизайн = решение задач.',  univ:'Школа дизайна HSE',skills:['Figma','Adobe XD','Rive'],     goals:['Продуктовая команда','Motion'], interests:['Искусство','Танцы'], status:'busy',   created:Date.now()-500000},
    {id:'u6',name:'Дмитрий Ким',     email:'dima@example.com',  pass:'demo', bio:'ML-инженер, работаю с NLP и Computer Vision. Ищу команду для хакатонов.',   univ:'Сколтех, 1 год',   skills:['Python','PyTorch','NLP'],      goals:['Kaggle Master','NeurIPS'],  interests:['Нейросети','Игры'],   status:'open',   created:Date.now()-400000}
  ];
  DB.projects = [
    {id:'p1',title:'FinTrack - умный учёт финансов',       desc:'Мобильное приложение для студентов: трекинг расходов, бюджет, аналитика.',                   authorId:'u1',members:['u1','u2','u4'],needs:['React Native','Node.js','UI/UX'],stage:'beta',  tags:['финтех','мобайл'], teamSize:3,maxTeam:5,created:Date.now()-86400000*3},
    {id:'p2',title:'StudyBuddy - платформа репетиторства', desc:'Маркетплейс для студентов-репетиторов: поиск, бронирование, видеозвонки.',                   authorId:'u2',members:['u2','u3'],       needs:['Vue.js','Python','DevOps'],     stage:'mvp',   tags:['EdTech','Python'],  teamSize:2,maxTeam:4,created:Date.now()-86400000*5},
    {id:'p3',title:'TechBlog - медиа о технологиях',       desc:'Образовательное медиа для технарей: статьи, подкасты, интервью с разработчиками.',            authorId:'u3',members:['u3','u4','u5','u1'],needs:['Копирайтер','SMM','Дизайнер'],stage:'active',tags:['медиа','контент'],  teamSize:4,maxTeam:6,created:Date.now()-86400000*7},
    {id:'p4',title:'HackMatch - агрегатор хакатонов',      desc:'Платформа для поиска хакатонов и формирования команд. AI-подбор по навыкам.',                 authorId:'u4',members:['u4'],            needs:['React','Python','ML'],          stage:'idea',  tags:['React','стартап'],  teamSize:1,maxTeam:4,created:Date.now()-86400000*2},
    {id:'p5',title:'MindMap AI - умные конспекты',         desc:'Инструмент для создания mind map из лекций и PDF. GPT для структурирования информации.',       authorId:'u6',members:['u6','u2'],       needs:['Python','React','ML'],          stage:'mvp',   tags:['AI','образование'], teamSize:2,maxTeam:3,created:Date.now()-86400000},
    {id:'p6',title:'CampusMap - карта университета',       desc:'Интерактивная карта кампуса с навигацией и AR-режимом для первокурсников.',                   authorId:'u5',members:['u5'],            needs:['React','Дизайнер','Mobile'],    stage:'idea',  tags:['мобайл','UX'],      teamSize:1,maxTeam:4,created:Date.now()-86400000*4}
  ];
  DB.ratings = {u1:{total:22,count:5},u2:{total:24,count:5},u3:{total:18,count:4},u4:{total:20,count:4},u5:{total:23,count:5},u6:{total:19,count:4}};
  DB.messages = [
    {id:'m1',from:'u1',to:'u2',text:'Коллаборация: Привет! Ищу бэкенд-разработчика для FinTrack.',type:'collab',time:Date.now()-86400000*2,read:true},
    {id:'m2',from:'u2',to:'u1',text:'Звучит интересно! Расскажи подробнее о задачах.',             type:'msg',   time:Date.now()-86400000*2+3600000,read:true},
    {id:'m3',from:'u3',to:'u4',text:'Коллаборация: Ищу фронтенд-разработчика для TechBlog.',      type:'collab',time:Date.now()-86400000,read:true},
    {id:'m4',from:'u6',to:'u5',text:'Коллаборация: Нужен UX-дизайнер для MindMap AI.',            type:'collab',time:Date.now()-43200000,read:true},
    {id:'m5',from:'u4',to:'u6',text:'Хочу участвовать в HackMatch — давай обсудим.',              type:'msg',   time:Date.now()-7200000,read:true}
  ];
  // демо-сообщения групповых чатов проектов (привязаны к groupChatId)
  DB.groupChats = [
    {id:'gc_p1',projectId:'p1',messages:[
      {id:'gm1',from:'u1',text:'Всем привет! Добро пожаловать в чат FinTrack 🎉',       time:Date.now()-86400000*3+1000,type:'msg'},
      {id:'gm2',from:'u2',text:'Привет команда! Готов к работе над бэком.',             time:Date.now()-86400000*3+3600000,type:'msg'},
      {id:'gm3',from:'u4',text:'Я занимаюсь Docker-инфраструктурой, уже поднял базу.', time:Date.now()-86400000*2,type:'msg'},
      {id:'gm4',from:'u1',text:'Отлично, завтра скину макеты в Figma.',                 time:Date.now()-86400000,type:'msg'}
    ]},
    {id:'gc_p2',projectId:'p2',messages:[
      {id:'gm5',from:'u2',text:'StudyBuddy стартует! Пишем MVP вместе.',               time:Date.now()-86400000*5+1000,type:'msg'},
      {id:'gm6',from:'u3',text:'Займусь лендингом и описанием функций.',                time:Date.now()-86400000*4,type:'msg'}
    ]},
    {id:'gc_p3',projectId:'p3',messages:[
      {id:'gm7', from:'u3',text:'Открываю чат TechBlog 🚀 Рады всем!',                 time:Date.now()-86400000*7+1000,type:'msg'},
      {id:'gm8', from:'u4',text:'Уже работаю над фронтом, прогресс есть.',             time:Date.now()-86400000*6,type:'msg'},
      {id:'gm9', from:'u5',text:'Прислала макеты в общую папку.',                       time:Date.now()-86400000*5,type:'msg'},
      {id:'gm10',from:'u1',text:'Статьи начну писать с понедельника.',                  time:Date.now()-86400000*2,type:'msg'}
    ]}
  ];
  DB.feed = [
    {id:'f1',type:'joined', userId:'u6',text:'<strong>Дмитрий Ким</strong> присоединился к платформе',         time:Date.now()-300000},
    {id:'f2',type:'project',userId:'u4',text:'<strong>Алексей Козлов</strong> создал проект HackMatch',         time:Date.now()-600000},
    {id:'f3',type:'collab', userId:'u1',text:'<strong>Анна Петрова</strong> отправила предложение коллаборации',time:Date.now()-900000},
    {id:'f4',type:'project',userId:'u5',text:'<strong>Мария Иванова</strong> создала проект CampusMap',         time:Date.now()-1200000},
    {id:'f5',type:'joined', userId:'u3',text:'<strong>Елена Васильева</strong> обновила профиль',               time:Date.now()-1800000},
    {id:'f6',type:'collab', userId:'u2',text:'<strong>Михаил Сидоров</strong> получил 5 звёзд',                time:Date.now()-3600000}
  ];
  saveAll();
}

// сохраняет всё состояние в localStorage
function saveAll() {
  try {
    localStorage.setItem('cs_u',  JSON.stringify(DB.users));
    localStorage.setItem('cs_p',  JSON.stringify(DB.projects));
    localStorage.setItem('cs_m',  JSON.stringify(DB.messages));
    localStorage.setItem('cs_gc', JSON.stringify(DB.groupChats));
    localStorage.setItem('cs_r',  JSON.stringify(DB.ratings));
    localStorage.setItem('cs_n',  JSON.stringify(DB.notifications));
    localStorage.setItem('cs_f',  JSON.stringify(DB.feed));
    if (DB.me) localStorage.setItem('cs_me', JSON.stringify(DB.me));
    else localStorage.removeItem('cs_me');
  } catch(e) {}
}

// загружает сохранённые данные из localStorage (или дефолты)
function loadAll() {
  function j(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
  var HIDDEN_USERS = ['Murat Bak', '\u043e\u0449\u0440\u0433\u0448\u043f\u043d\u0430\u0435\u043a\u0430\u0447'];
  DB.users = j('cs_u', []).filter(function(u){ return HIDDEN_USERS.indexOf(u.name) === -1; });
  DB.projects      = j('cs_p',  []);
  DB.messages      = j('cs_m',  []);
  DB.groupChats    = j('cs_gc', []);
  DB.ratings       = j('cs_r',  {});
  DB.notifications = j('cs_n',  []);
  DB.feed          = j('cs_f',  []);
  DB.me            = j('cs_me', null);
}

// ─── вспомогательные функции для работы с группами ────────────────────────────

// находит или создаёт групповой чат для проекта
function getOrCreateGroupChat(projectId) {
  var gc = DB.groupChats.find(function(g) { return g.projectId === projectId; });
  if (!gc) {
    gc = { id: 'gc_' + projectId, projectId: projectId, messages: [] };
    DB.groupChats.push(gc);
    saveAll();
  }
  return gc;
}

// возвращает количество непрочитанных сообщений во всех групповых чатах для текущего пользователя
function countGroupUnread() {
  if (!DB.me) return 0;
  var total = 0;
  DB.groupChats.forEach(function(gc) {
    var proj = findProject(gc.projectId);
    if (!proj) return;
    var members = proj.members || [proj.authorId];
    if (members.indexOf(DB.me.id) === -1) return; // не участник
    (gc.messages || []).forEach(function(m) {
      if (m.from !== DB.me.id && !m.read) total++;
    });
  });
  return total;
}
