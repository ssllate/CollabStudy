// коллаборация, рейтинг, попап пользователя

// коллаборация
function showCollabModal(uid) {
  if(!requireAuth('предложить коллаборацию')) return;
  if(DB.me&&uid===DB.me.id){toast('Нельзя коллаборировать с собой','warning');return;}
  var u=findUser(uid); if(!u) return;
  var card=$('collab-recipient-card');
  if(card) card.innerHTML=avEl(u.name,u.id,'42px','12px')+'<div style="margin-left:12px"><div style="font-weight:700">'+esc(u.name)+'</div><div style="font-size:.8rem;color:var(--c-text-2)">'+esc(u.univ||'')+'</div></div>';
  var cf=$('collab-form'); if(cf) cf.dataset.uid=uid;
  var cm=$('collab-msg'); if(cm) cm.value='';
  openModal('collab-modal');
}

function handleCollab(e) {
  e.preventDefault();
  var uid=$('collab-form').dataset.uid, text=$('collab-msg').value.trim();
  if(!text||!uid) return;
  DB.messages.push({id:'m'+Date.now(),from:DB.me.id,to:uid,text:'Коллаборация: '+text,type:'collab',time:Date.now(),read:false});
  DB.notifications.push({id:'n'+Date.now(),toId:uid,type:'collab',text:'<strong>'+esc(DB.me.name)+'</strong> предложил коллаборацию',time:Date.now(),read:false});
  DB.feed.unshift({id:'f'+Date.now(),type:'collab',userId:DB.me.id,text:'<strong>'+esc(DB.me.name)+'</strong> отправил предложение коллаборации',time:Date.now()});
  saveAll(); closeModal('collab-modal'); updateBadges();
  toast('Предложение отправлено!','success');
}

// рейтинг
function showRateModal(uid) {
  if(!requireAuth('оценить')) return;
  if(DB.me&&uid===DB.me.id){toast('Нельзя оценить себя','warning');return;}
  var u=findUser(uid); if(!u) return;
  DB.rateTarget=uid; DB.rateVal=0;
  var info=$('rate-target-info');
  if(info) info.innerHTML=avEl(u.name,u.id)+'<span style="margin-left:10px;font-weight:600">'+esc(u.name)+'</span>';
  document.querySelectorAll('.sr').forEach(function(s){s.classList.remove('active');});
  var sl=$('star-label'); if(sl) sl.textContent='Выберите оценку';
  openModal('rate-modal');
}

function setRating(v) {
  DB.rateVal=v;
  var labels=['','Плохо','Так себе','Нормально','Хорошо','Отлично!'];
  var sl=$('star-label'); if(sl) sl.textContent=labels[v]||'';
  document.querySelectorAll('.sr').forEach(function(s,i){s.classList.toggle('active',i<v);});
}

function submitRating() {
  if(!DB.rateVal){toast('Выберите оценку','warning');return;}
  var uid=DB.rateTarget;
  if(!DB.ratings[uid]) DB.ratings[uid]={total:0,count:0};
  DB.ratings[uid].total+=DB.rateVal; DB.ratings[uid].count++;
  DB.notifications.push({id:'n'+Date.now(),toId:uid,type:'rate',text:'<strong>'+esc(DB.me.name)+'</strong> поставил оценку '+DB.rateVal+' ★',time:Date.now(),read:false});
  saveAll(); closeModal('rate-modal'); toast('Оценка отправлена!','success');
}

// user popup
function showUserPopup(uOrId) {
  var u=typeof uOrId==='string'?findUser(uOrId):uOrId;
  if(!u) return;
  var r=DB.ratings[u.id], avg=r&&r.count?(r.total/r.count).toFixed(1):null;
  var sm={open:['status-open','🟢 Открыт'],busy:['status-busy','🟡 Занят'],closed:['status-closed','🔴 Занят']};
  var sc=u.status&&sm[u.status]?sm[u.status]:null;
  var isMe=DB.me&&DB.me.id===u.id;
  var html='<div style="display:flex;gap:16px;margin-bottom:20px">'+
    avEl(u.name,u.id,'52px','14px')+
    '<div style="flex:1"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:5px">'+
      '<span style="font-family:var(--ff-display);font-size:1.1rem;font-weight:800">'+esc(u.name)+'</span>'+
      (avg?'<span style="background:rgba(251,191,36,.15);color:var(--accent-amber);padding:3px 10px;border-radius:100px;font-size:.8rem;font-weight:700">★ '+avg+'</span>':'')+
      (sc?'<span class="uc-status '+sc[0]+'">'+sc[1]+'</span>':'')+
    '</div>'+
    (u.univ?'<div style="font-size:.8rem;color:var(--c-text-2);margin-bottom:6px"><i class="fas fa-graduation-cap" style="margin-right:5px"></i>'+esc(u.univ)+'</div>':'')+
    '<div style="font-size:.875rem;color:var(--c-text-2);line-height:1.6">'+esc(u.bio||'Нет описания')+'</div></div></div>';
  if(u.skills&&u.skills.length) html+='<div style="margin-bottom:14px"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--c-text-3);margin-bottom:8px">Навыки</div><div class="tags-row">'+u.skills.map(function(s){return'<span class="tag-pill tp-skill">'+esc(s)+'</span>';}).join('')+'</div></div>';
  if(u.goals&&u.goals.length) html+='<div style="margin-bottom:14px"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--c-text-3);margin-bottom:8px">Цели</div><div class="tags-row">'+u.goals.map(function(g){return'<span class="tag-pill tp-goal">'+esc(g)+'</span>';}).join('')+'</div></div>';
  if(u.interests&&u.interests.length) html+='<div style="margin-bottom:20px"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--c-text-3);margin-bottom:8px">Интересы</div><div class="tags-row">'+u.interests.map(function(i){return'<span class="tag-pill tp-interest">'+esc(i)+'</span>';}).join('')+'</div></div>';
  if(!isMe) html+='<div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--c-border)">'+
    '<button class="btn-primary-sm" onclick="closeModal(\'user-popup\');showCollabModal(\''+u.id+'\')"><i class="fas fa-handshake"></i> Коллаб</button>'+
    '<button class="btn-ghost" onclick="closeModal(\'user-popup\');openChat(\''+u.id+'\');showView(\'messages\')"><i class="fas fa-envelope"></i> Написать</button>'+
    '<button class="btn-ghost" onclick="closeModal(\'user-popup\');showRateModal(\''+u.id+'\')"><i class="fas fa-star"></i> Оценить</button>'+
    '</div>';
  var content=$('user-popup-content'); if(content) content.innerHTML=html;
  openModal('user-popup');
}
