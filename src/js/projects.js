// доска проектов

// projects
function renderProjects() {
  var cpb=$('create-proj-btn'); if(cpb) cpb.classList.toggle('hidden',!DB.me);
  applyProj();
}

function setProjFilter(el, skill) {
  document.querySelectorAll('.proj-toolbar .skill-chip').forEach(function(c){c.classList.remove('active');});
  el.classList.add('active'); DB.projSkill=skill; applyProj();
}

function handleProjSearch() {
  var inp=$('proj-search'); DB.projQuery=inp?inp.value.trim().toLowerCase():''; applyProj();
}

function applyProj() {
  var projs=DB.projects.slice().sort(function(a,b){return b.created-a.created;});
  if(DB.projSkill) {
    var f=DB.projSkill.toLowerCase();
    projs=projs.filter(function(p){
      return (p.tags||[]).some(function(t){return t.toLowerCase().indexOf(f)>=0;}) ||
             (p.needs||[]).some(function(n){return n.toLowerCase().indexOf(f)>=0;}) ||
             p.title.toLowerCase().indexOf(f)>=0;
    });
  }
  if(DB.projQuery) {
    var q=DB.projQuery;
    projs=projs.filter(function(p){return p.title.toLowerCase().indexOf(q)>=0||(p.desc||'').toLowerCase().indexOf(q)>=0;});
  }
  renderProjectsGrid(projs,'projects-grid',false);
}

function openCreateProject() {
  if(!requireAuth('создать проект')) return;
  var f=$('create-project-form'); if(f) f.reset();
  openModal('create-project-modal');
}

function handleCreateProject(e) {
  e.preventDefault();
  function parse(s){return s.split(',').map(function(x){return x.trim();}).filter(Boolean);}
  var p={
    id:'p'+Date.now(), title:$('cp-title').value.trim(), desc:$('cp-desc').value.trim(),
    needs:parse($('cp-needs').value), stage:$('cp-stage').value, tags:parse($('cp-tags').value),
    authorId:DB.me.id, teamSize:1, maxTeam:4, created:Date.now()
  };
  DB.projects.unshift(p);
  DB.feed.unshift({id:'f'+Date.now(),type:'project',userId:DB.me.id,text:'<strong>'+esc(DB.me.name)+'</strong> создал проект '+esc(p.title),time:Date.now()});
  saveAll(); closeModal('create-project-modal'); renderProjects();
  toast('Проект создан!','success');
}

function deleteProject(id) {
  if(!confirm('Удалить проект?')) return;
  DB.projects=DB.projects.filter(function(p){return p.id!==id;});
  saveAll(); renderProjects();
  var ptab=$('ptab-projects'); if(ptab&&ptab.classList.contains('active')) renderProjectsGrid(DB.projects.filter(function(p){return DB.me&&p.authorId===DB.me.id;}),'p-projects-grid',true);
  toast('Проект удалён','info');
}

function joinProject(pid) {
  if(!requireAuth('присоединиться')) return;
  var p=findProject(pid); if(!p) return;
  DB.chatWith=p.authorId; showView('messages');
  setTimeout(function(){var inp=$('chat-input');if(inp){inp.value='Привет! Меня интересует проект "'+p.title+'". Можем обсудить?';inp.focus();}},200);
}

// переопределяем joinProject: добавляем в members и открываем групповой чат
(function() {
  var _orig = joinProject;
  joinProject = function(pid) {
    if(!requireAuth('присоединиться')) return;
    var p = findProject(pid); if(!p) return;

    // инициализируем массив участников если его нет
    if(!p.members) p.members = [p.authorId];

    if(p.members.indexOf(DB.me.id) !== -1) {
      // пользователь уже в команде — просто открываем чат
      var gc = getOrCreateGroupChat(pid);
      showView('messages');
      setTimeout(function(){ openGroupChat(gc.id); }, 150);
      return;
    }

    // добавляем пользователя в команду
    p.members.push(DB.me.id);
    p.teamSize = p.members.length;

    // создаём чат (или находим существующий) и пишем системное сообщение
    var gc2 = getOrCreateGroupChat(pid);
    gc2.messages.push({
      id: 'gm'+Date.now(), from: DB.me.id,
      text: DB.me.name + ' присоединился к проекту 🎉',
      type: 'system', time: Date.now(), read: false
    });

    // уведомление создателю проекта
    DB.notifications.push({ id:'n'+Date.now(), toId:p.authorId, type:'collab',
      text:'<strong>'+esc(DB.me.name)+'</strong> присоединился к проекту «'+esc(p.title)+'»',
      time:Date.now(), read:false });

    saveAll(); renderProjects(); updateBadges();
    toast('Вы вступили в команду проекта!', 'success');

    // переходим в раздел сообщений и открываем групповой чат
    showView('messages');
    setTimeout(function(){ openGroupChat(gc2.id); }, 150);
  };
})();
