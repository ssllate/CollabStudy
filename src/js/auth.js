// авторизация, регистрация, выход

// dev-аккаунт разработчика (не хранится в БД, не виден пользователям)
var DEV_ACCOUNT = {
  id: 'dev_admin',
  name: 'Dev Admin',
  email: 'dev@collabstudy',
  pass: 'dev2026',
  bio: 'Аккаунт разработчика',
  univ: '', skills: [], goals: [], interests: [],
  status: 'open', created: 0, isDevAdmin: true
};

// авторизация
function handleLogin(e) {
  e.preventDefault();
  var email=$('login-email').value.trim(), pass=$('login-pass').value;

  // проверка dev-аккаунта
  if (email === DEV_ACCOUNT.email && pass === DEV_ACCOUNT.pass) {
    DB.me = DEV_ACCOUNT;
    closeModal('login-modal'); updateAuthUI();
    toast('Вход как разработчик 🛠️','success'); showView('home');
    return;
  }

  var found=null;
  for(var i=0;i<DB.users.length;i++) if(DB.users[i].email===email&&DB.users[i].pass===pass){found=DB.users[i];break;}
  if (!found) { toast('Неверный email или пароль','error'); return; }
  DB.me=found; saveAll(); closeModal('login-modal'); updateAuthUI();
  toast('Добро пожаловать, '+found.name+'!','success'); showView('home');
}

// показать/скрыть панель разработчика
function showDevPanel() {
  var panel = document.getElementById('dev-panel');
  if (panel) panel.style.display = 'flex';
}
function hideDevPanel() {
  var panel = document.getElementById('dev-panel');
  if (panel) panel.style.display = 'none';
}

// очистить ленту от удалённых пользователей
function devCleanFeed() {
  var userIds = DB.users.map(function(u){ return u.id; });
  var before = DB.feed.length;
  DB.feed = DB.feed.filter(function(item){ return userIds.indexOf(item.userId) !== -1; });
  saveAll();
  if (typeof renderFeed === 'function') renderFeed();
  toast('Лента очищена: удалено '+(before - DB.feed.length)+' записей','success');
}

// сбросить всю базу до демо-данных
function devResetDB() {
  if (!confirm('Сбросить ВСЕ данные до заводских демо? Это нельзя отменить.')) return;
  localStorage.clear();
  toast('База сброшена, перезагрузка...','info');
  setTimeout(function(){ location.reload(); }, 1200);
}

// показать текущее состояние localStorage
function devShowStorage() {
  var keys = ['cs_u','cs_p','cs_m','cs_gc','cs_r','cs_n','cs_f','cs_me'];
  var info = keys.map(function(k){
    var val = localStorage.getItem(k);
    if (!val) return k+': (пусто)';
    try { var arr = JSON.parse(val); return k+': '+(Array.isArray(arr)?arr.length+' записей':typeof arr); }
    catch(e){ return k+': (ошибка)'; }
  }).join('\n');
  alert('LocalStorage:\n\n'+info);
}

// удалить конкретного пользователя из всех данных
function devDeleteUser(uid) {
  DB.users = DB.users.filter(function(u){ return u.id !== uid; });
  DB.feed  = DB.feed.filter(function(f){ return f.userId !== uid; });
  DB.messages = DB.messages.filter(function(m){ return m.from !== uid && m.to !== uid; });
  saveAll();
  renderDevUserList();
  toast('Пользователь удалён','success');
}

function handleRegister(e) {
  e.preventDefault();
  var name=$('reg-name').value.trim(), email=$('reg-email').value.trim(), pass=$('reg-pass').value;
  for(var i=0;i<DB.users.length;i++) if(DB.users[i].email===email){toast('Email уже занят','error');return;}
  var u={id:'u'+Date.now(),name:name,email:email,pass:pass,bio:'',univ:'',skills:[],goals:[],interests:[],status:'open',created:Date.now()};
  DB.users.push(u); DB.me=u;
  DB.feed.unshift({id:'f'+Date.now(),type:'joined',userId:u.id,text:'<strong>'+esc(u.name)+'</strong> присоединился к платформе',time:Date.now()});
  saveAll(); closeModal('register-modal'); updateAuthUI();
  toast('Добро пожаловать, '+name+'! Заполни профиль.','success'); showView('profile');
}

function logout() {
  DB.me=null; DB.chatWith=null; saveAll(); updateAuthUI();
  hideDevPanel();
  toast('Вы вышли из аккаунта','info'); showView('home');
}

function updateAuthUI() {
  var isAuth=!!DB.me;
  var ga=$('guest-actions'),ua=$('user-actions'),cpb=$('create-proj-btn'),cta=$('cta-section');
  if(ga) ga.style.display=isAuth?'none':'flex';
  if(ua) ua.classList.toggle('hidden',!isAuth);
  if(cpb) cpb.classList.toggle('hidden',!isAuth);
  if(cta) cta.style.display=isAuth?'none':'';
  if(isAuth) updateNavUser();
  updateBadges();
}

function updateNavUser() {
  if(!DB.me) return;
  var nav=$('nav-avatar'), nn=$('nav-username');
  if(nav) {
    nav.className='nav-avatar '+avCol(DB.me.id);
    if(DB.me.avatarImg) {
      // фото есть — показываем картинку
      nav.innerHTML='<img src="'+DB.me.avatarImg+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      nav.style.padding='0';
      nav.style.overflow='hidden';
    } else {
      // нет фото — инициалы
      nav.innerHTML='';
      nav.textContent=initials(DB.me.name);
      nav.style.padding='';
      nav.style.overflow='';
    }
  }
  if(nn) nn.textContent=DB.me.name.split(' ')[0];
}

function updateBadges() {
  if(!DB.me) return;
  var um=0,un=0;
  // непрочитанные личные сообщения
  DB.messages.forEach(function(m){if(m.to===DB.me.id&&!m.read)um++;});
  // непрочитанные сообщения в групповых чатах проектов
  um += countGroupUnread();
  DB.notifications.forEach(function(n){if(n.toId===DB.me.id&&!n.read)un++;});
  var md=$('msg-dot'),nd=$('notif-dot');
  if(md) md.classList.toggle('hidden',um===0);
  if(nd) nd.classList.toggle('hidden',un===0);
}

// рендер списка пользователей в панели разработчика
function renderDevUserList() {
  var list = document.getElementById('dev-user-list');
  if (!list) return;
  list.innerHTML = DB.users.map(function(u){
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.07)">'
      + '<span style="font-size:13px;color:#e2e8f0">'+u.name+' <span style="opacity:.45;font-size:11px">'+u.email+'</span></span>'
      + '<button onclick="devDeleteUser(\''+u.id+'\')" style="background:#ef4444;border:none;color:#fff;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:11px">Удалить</button>'
      + '</div>';
  }).join('');
}

// удалить пользователя из обзора (только dev admin)
function devDeleteUserCard(uid) {
  if (!confirm('Удалить этого пользователя и все его данные?')) return;
  DB.users    = DB.users.filter(function(u){ return u.id !== uid; });
  DB.feed     = DB.feed.filter(function(f){ return f.userId !== uid; });
  DB.messages = DB.messages.filter(function(m){ return m.from !== uid && m.to !== uid; });
  DB.projects = DB.projects.filter(function(p){ return p.authorId !== uid; });
  saveAll();
  if (typeof applyExplore === 'function') applyExplore();
  if (typeof renderFeed === 'function') renderFeed();
  toast('Пользователь удалён','success');
}
