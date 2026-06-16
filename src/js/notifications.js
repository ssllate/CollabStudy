// уведомления

// уведомления
function renderNotifications() {
  if(!DB.me) return;
  var list=$('notif-list'); if(!list) return;
  var mine=DB.notifications.filter(function(n){return n.toId===DB.me.id;}).reverse();
  if(!mine.length){list.innerHTML='<div class="empty-wrap"><i class="fas fa-bell-slash"></i><p>Нет уведомлений</p></div>';return;}
  var imap={collab:'ni-collab fas fa-handshake',msg:'ni-msg fas fa-envelope',proj:'ni-proj fas fa-layer-group',rate:'ni-rate fas fa-star'};
  list.innerHTML=mine.map(function(n){
    var ic=(imap[n.type]||'ni-msg fas fa-bell').split(' ');
    return'<div class="notif-item '+(n.read?'':'unread')+'">'+
      '<div class="notif-icon '+ic[0]+'"><i class="'+ic[1]+' '+(ic[2]||'')+'"></i></div>'+
      '<div class="notif-content"><div class="notif-text">'+(n.text||'')+'</div><div class="notif-time">'+timeAgo(n.time)+'</div></div>'+
      '</div>';
  }).join('');
  DB.notifications.forEach(function(n){if(n.toId===DB.me.id)n.read=true;});
  saveAll(); updateBadges();
}
