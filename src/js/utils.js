// вспомогательные функции

// утилиты
function esc(s) {
  if (!s) return '';
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function $(id) { return document.getElementById(id); }

function initials(name) {
  if (!name) return '?';
  var p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : name[0].toUpperCase();
}

function avCol(id) {
  var h = 0;
  for (var i = 0; i < (id||'').length; i++) h = (h*31 + id.charCodeAt(i)) & 0xffff;
  return 'av-' + (h % 8);
}

function avEl(name, id, w, r) {
  w = w || '42px'; r = r || '12px';
  var fs = w === '84px' ? '1.8rem' : w === '52px' ? '1.1rem' : '.85rem';
  return '<div class="' + avCol(id) + '" style="width:'+w+';height:'+w+';border-radius:'+r+';display:flex;align-items:center;justify-content:center;color:#0a1628;font-weight:800;font-family:var(--ff-display);font-size:'+fs+';flex-shrink:0">'+esc(initials(name))+'</div>';
}

function timeAgo(ts) {
  var d = Date.now()-ts;
  if (d < 60000)    return 'только что';
  if (d < 3600000)  return Math.floor(d/60000)+' мин. назад';
  if (d < 86400000) return Math.floor(d/3600000)+' ч. назад';
  return Math.floor(d/86400000)+' дн. назад';
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
}

function stageLabel(s) {
  return {idea:'💡 Идея',mvp:'🔨 MVP',beta:'🚀 Бета',active:'✅ Активный'}[s] || s || '';
}

function toast(msg, type) {
  type = type || 'info';
  var icons = {success:'fa-circle-check',error:'fa-circle-exclamation',info:'fa-circle-info',warning:'fa-triangle-exclamation'};
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<i class="fas '+(icons[type]||'fa-circle-info')+'"></i><span>'+esc(msg)+'</span>';
  var box = $('toasts');
  if (box) box.appendChild(el);
  setTimeout(function() { el.style.opacity='0'; el.style.transform='translateX(60px)'; setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},350); }, 3500);
}

function requireAuth(action) {
  if (!DB.me) { openModal('login-modal'); toast('Войдите, чтобы '+action,'info'); return false; }
  return true;
}

function findUser(id) { for(var i=0;i<DB.users.length;i++) if(DB.users[i].id===id) return DB.users[i]; return null; }
function findProject(id) { for(var i=0;i<DB.projects.length;i++) if(DB.projects[i].id===id) return DB.projects[i]; return null; }
