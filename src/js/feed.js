// лента активности

// feed
function renderFeed() {
  var list=$('feed-list'); if(!list) return;
  var icons={joined:'🎉',collab:'🤝',project:'🚀',rating:'⭐',msg:'💬'};
  var html='', items=DB.feed.slice(0,20);
  var isAdmin = DB.me && DB.me.isDevAdmin;
  if(!items.length) { html='<div class="feed-empty"><i class="fas fa-bolt"></i><p>Нет активности</p></div>'; }
  else {
    for(var i=0;i<items.length;i++) {
      var item=items[i], u=findUser(item.userId);
      var devBtn = isAdmin
        ? '<button onclick="devDeleteFeedItem(\''+item.id+'\')" style="margin-left:auto;background:#ef4444;border:none;color:#fff;padding:4px 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;flex-shrink:0;white-space:nowrap">🗑 Удалить</button>'
        : '';
      html+='<div class="feed-item" style="animation-delay:'+(i*.06)+'s">' +
        (u?avEl(u.name,u.id,'40px','12px'):'') +
        '<div class="feed-content"><div class="feed-text">'+(item.text||'')+'</div><div class="feed-time">'+timeAgo(item.time)+'</div></div>' +
        '<div class="feed-icon">'+(icons[item.type]||'📌')+'</div>'+devBtn+'</div>';
    }
  }
  list.innerHTML=html;
  // skills sidebar
  var sc={};
  DB.users.forEach(function(u){(u.skills||[]).forEach(function(s){sc[s]=(sc[s]||0)+1;});});
  var sorted=Object.keys(sc).map(function(k){return[k,sc[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
  var tsl=$('top-skills-list');
  if(tsl) tsl.innerHTML=sorted.map(function(x){return'<div class="top-skill-item"><span class="top-skill-name">'+esc(x[0])+'</span><span class="top-skill-count">'+x[1]+'</span></div>';}).join('');
  // sidebar projects
  var sp=$('sidebar-projects');
  if(sp) sp.innerHTML=DB.projects.slice(0,4).map(function(p){return'<div class="sidebar-proj-item" onclick="showView(\'projects\')"><div class="sidebar-proj-name">'+esc(p.title)+'</div><div class="sidebar-proj-meta">'+stageLabel(p.stage)+'</div></div>';}).join('');
}

// удалить запись из ленты (только для dev admin)
function devDeleteFeedItem(id) {
  DB.feed = DB.feed.filter(function(f){ return f.id !== id; });
  saveAll();
  renderFeed();
  toast('Запись удалена из ленты','success');
}
