// рендер карточек, лидерборд, faq

// leaderboard
function renderLeaderboard() {
  var el=$('home-leaderboard'); if(!el) return;
  var scored=DB.users.map(function(u){
    var r=DB.ratings[u.id],avg=r&&r.count?r.total/r.count:0;
    var msgs=0,projs=0;
    DB.messages.forEach(function(m){if(m.from===u.id)msgs++;});
    DB.projects.forEach(function(p){if(p.authorId===u.id)projs++;});
    return{u:u,score:avg*2+msgs*0.3+projs*1.5,avg:avg};
  }).sort(function(a,b){return b.score-a.score;}).slice(0,5);
  var rc=['lb-top-1','lb-top-2','lb-top-3','',''],rn=['rank-1','rank-2','rank-3','rank-other','rank-other'],ri=['🥇','🥈','🥉'];
  var html='';
  for(var i=0;i<scored.length;i++){
    var item=scored[i],u=item.u;
    var st=(u.skills||[]).slice(0,2).map(function(s){return'<span class="tag-pill tp-skill">'+esc(s)+'</span>';}).join('');
    html+='<div class="lb-item '+rc[i]+'" onclick="showUserPopup(\''+u.id+'\')">'+
      '<div class="lb-rank '+rn[i]+'">'+(i<3?ri[i]:i+1)+'</div>'+
      avEl(u.name,u.id,'40px','12px')+
      '<div class="lb-info"><div class="lb-name">'+esc(u.name)+'</div><div class="lb-sub">'+esc(u.univ||'Участник')+'</div><div class="lb-tags" style="margin-top:6px">'+st+'</div></div>'+
      '<div class="lb-score"><i class="fas fa-star"></i> '+(item.avg>0?item.avg.toFixed(1):'-')+'</div>'+
      '</div>';
  }
  el.innerHTML=html;
}

// faq
function toggleFaq(btn) {
  var ans=btn.nextElementSibling, isOpen=btn.classList.contains('open');
  document.querySelectorAll('.faq-q.open').forEach(function(q){q.classList.remove('open');if(q.nextElementSibling)q.nextElementSibling.classList.remove('open');});
  if(!isOpen){btn.classList.add('open');if(ans)ans.classList.add('open');}
}

// рендер: пользователи
function renderUsersGrid(users, containerId) {
  var el=$(containerId); if(!el) return;
  if(!users.length){el.innerHTML='<div class="empty-wrap" style="grid-column:1/-1"><i class="fas fa-user-slash"></i><p>Не найдено</p></div>';return;}
  var html=''; users.forEach(function(u){html+=userCardHTML(u);}); el.innerHTML=html;
}

function userCardHTML(u) {
  var r=DB.ratings[u.id],avg=r&&r.count?(r.total/r.count).toFixed(1):null;
  var isMe=DB.me&&DB.me.id===u.id;
  var sm={open:['status-open','🟢 Открыт'],busy:['status-busy','🟡 Занят'],closed:['status-closed','🔴 Занят']};
  var sc=u.status&&sm[u.status]?sm[u.status]:null;
  var st=(u.skills||[]).slice(0,3).map(function(s){return'<span class="tag-pill tp-skill">'+esc(s)+'</span>';}).join('');
  var gt=(u.goals||[]).slice(0,2).map(function(g){return'<span class="tag-pill tp-goal">'+esc(g)+'</span>';}).join('');
  return'<div class="user-card">'+
    '<div class="user-card-top">'+
      '<div class="user-card-header">'+
        '<div class="uc-avatar '+avCol(u.id)+'" style="position:relative">'+esc(initials(u.name))+(u.status==='open'?'<div class="uc-online-dot"></div>':'')+'</div>'+
        '<div class="uc-info"><div class="uc-name">'+esc(u.name)+'</div><div class="uc-meta">'+
          (u.univ?'<span><i class="fas fa-graduation-cap" style="font-size:.65rem;margin-right:3px;color:var(--c-text-3)"></i>'+esc(u.univ)+'</span>':'')+
          (avg?'<span class="uc-rating"><i class="fas fa-star"></i> '+avg+'</span>':'')+
          (sc?'<span class="uc-status '+sc[0]+'">'+sc[1]+'</span>':'')+
        '</div></div>'+
      '</div>'+
      '<p class="uc-bio">'+esc(u.bio||'Нет описания')+'</p>'+
      (st?'<div class="uc-section"><div class="uc-section-label">Навыки</div><div class="tags-row">'+st+'</div></div>':'')+
      (gt?'<div class="uc-section"><div class="uc-section-label">Цели</div><div class="tags-row">'+gt+'</div></div>':'')+
    '</div>'+
    '<div class="user-card-actions">'+
      '<button class="uca-btn" onclick="showUserPopup(\''+u.id+'\')"><i class="fas fa-eye"></i> Профиль</button>'+
      '<div class="uca-sep"></div>'+
      (!isMe
        ?'<button class="uca-btn primary" onclick="showCollabModal(\''+u.id+'\')"><i class="fas fa-handshake"></i> Коллаб</button><div class="uca-sep"></div><button class="uca-btn" onclick="openChat(\''+u.id+'\');showView(\'messages\')"><i class="fas fa-envelope"></i></button><div class="uca-sep"></div><button class="uca-btn" onclick="showRateModal(\''+u.id+'\')"><i class="fas fa-star"></i></button>'
        :'<button class="uca-btn" onclick="showView(\'profile\')"><i class="fas fa-pen-to-square"></i> Мой профиль</button>'
      )+
      (DB.me && DB.me.isDevAdmin && !isMe
        ?'<div class="uca-sep"></div><button class="uca-btn" onclick="devDeleteUserCard(\''+u.id+'\')" style="color:#ef4444"><i class="fas fa-trash"></i> Удалить</button>'
        :''
      )+
    '</div></div>';
}

// рендер: проекты
function renderProjectsGrid(projs, containerId, isOwn) {
  var el=$(containerId); if(!el) return;
  if(!projs.length){
    el.innerHTML='<div class="empty-wrap" style="grid-column:1/-1"><i class="fas fa-folder-open"></i><p>'+(isOwn?'Нет проектов':'Не найдено')+'</p>'+(isOwn?'<button class="btn-primary-sm" onclick="openCreateProject()" style="margin-top:12px"><i class="fas fa-plus"></i> Создать</button>':'')+'</div>';
    return;
  }
  var html=''; projs.forEach(function(p){html+=projCardHTML(p,isOwn);}); el.innerHTML=html;
}

function projCardHTML(p, isOwn) {
  var author=findUser(p.authorId);
  var isMyProj=DB.me&&DB.me.id===p.authorId;
  var pct=p.maxTeam?Math.round((p.teamSize/p.maxTeam)*100):0;
  var nt=(p.needs||[]).map(function(n){return'<span class="tag-pill tp-need">'+esc(n)+'</span>';}).join('');
  var tp=(p.tags||[]).slice(0,3).map(function(t){return'<span class="tag-pill tp-tag">'+esc(t)+'</span>';}).join('');
  var bg={idea:'var(--grad-purple)',mvp:'var(--grad-warm)',beta:'var(--grad-main)',active:'linear-gradient(135deg,#10b981,#34d399)'}[p.stage]||'var(--grad-main)';
  return'<div class="proj-card">'+
    '<div class="proj-card-banner" style="background:'+bg+'"></div>'+
    '<div class="proj-card-body">'+
      '<div class="proj-stage stage-'+(p.stage||'')+'">'+stageLabel(p.stage)+'</div>'+
      '<div class="proj-title">'+esc(p.title)+'</div>'+
      '<div class="proj-author">'+
        (author?'<div style="width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:#0a1628;font-weight:800;font-size:.6rem;flex-shrink:0;margin-right:6px" class="'+avCol(author.id)+'">'+esc(initials(author.name))+'</div>':'')+
        esc(author?author.name:'Неизвестный')+
      '</div>'+
      '<p class="proj-desc">'+esc(p.desc||'Нет описания')+'</p>'+
      (nt?'<div class="proj-needs-label">Ищем</div><div class="proj-tags-row">'+nt+'</div>':'')+
      (tp?'<div class="proj-tags-row">'+tp+'</div>':'')+
      (p.maxTeam?'<div class="proj-progress"><div class="proj-progress-header"><span>Команда</span><span>'+p.teamSize+'/'+p.maxTeam+'</span></div><div class="proj-progress-bar"><div class="proj-progress-fill" style="width:'+pct+'%"></div></div></div>':'')+
      '<div class="proj-date"><i class="fas fa-calendar-days"></i> '+fmtDate(p.created)+'</div>'+
      '<div class="proj-actions">'+
        (!isMyProj&&!isOwn?'<button class="btn-primary-sm" onclick="joinProject(\''+p.id+'\')"><i class="fas fa-handshake"></i> Присоединиться</button>':'')+
        (isMyProj?'<button class="btn-ghost" style="padding:7px 14px;font-size:.8rem" onclick="deleteProject(\''+p.id+'\')"><i class="fas fa-trash"></i> Удалить</button>':'')+
      '</div>'+
    '</div></div>';
}
