// главная страница

// home
function renderHome() {
  var tc=0; DB.messages.forEach(function(m){if(m.type==='collab')tc++;});
  var on=0; DB.users.forEach(function(u){if(u.status==='open')on++;});
  countUp('hs-users',DB.users.length); countUp('hs-projects',DB.projects.length);
  countUp('hs-collabs',tc); countUp('hero-online-count',on);
  var others=DB.users.filter(function(u){return !DB.me||u.id!==DB.me.id;}).slice(0,4);
  var projs=DB.projects.slice().sort(function(a,b){return b.created-a.created;}).slice(0,3);
  renderUsersGrid(others,'home-users-grid');
  renderProjectsGrid(projs,'home-projects-grid',false);
  renderLeaderboard();
}

function countUp(id, val) {
  var el=$(id); if(!el) return;
  el.textContent='0';
  var cur=0, step=Math.ceil(val/25);
  var iv=setInterval(function(){cur=Math.min(cur+step,val);el.textContent=cur;if(cur>=val)clearInterval(iv);},40);
}
