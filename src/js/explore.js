// обзор пользователей, поиск и фильтры

// explore
function renderExplore() { applyExplore(); }

function handleExploreSearch() {
  var inp=$('explore-search');
  DB.exploreQuery=inp?inp.value.trim().toLowerCase():'';
  var cb=$('clear-search'); if(cb) cb.style.display=DB.exploreQuery?'block':'none';
  applyExplore();
}

function clearExploreSearch() {
  var inp=$('explore-search'); if(inp) inp.value='';
  DB.exploreQuery='';
  var cb=$('clear-search'); if(cb) cb.style.display='none';
  applyExplore();
}

function setSkillChip(el, skill) {
  document.querySelectorAll('#skill-chips .skill-chip').forEach(function(c){c.classList.remove('active');});
  el.classList.add('active');
  DB.exploreSkill=skill; applyExplore();
}

function goToExploreSkill(skill) {
  DB.exploreSkill=skill; DB.exploreQuery='';
  showView('explore');
  document.querySelectorAll('#skill-chips .skill-chip').forEach(function(c){
    c.classList.toggle('active',c.textContent.trim()===skill||(!skill&&c.textContent.trim()==='Все'));
  });
}

function applyExplore() {
  var users=DB.users.filter(function(u){return !DB.me||u.id!==DB.me.id;});
  if(DB.exploreSkill) {
    var f=DB.exploreSkill.toLowerCase();
    users=users.filter(function(u){
      return (u.skills||[]).some(function(s){return s.toLowerCase().indexOf(f)>=0;}) ||
             (u.goals||[]).some(function(g){return g.toLowerCase().indexOf(f)>=0;}) ||
             (u.interests||[]).some(function(i){return i.toLowerCase().indexOf(f)>=0;});
    });
  }
  if(DB.exploreQuery) {
    var q=DB.exploreQuery;
    users=users.filter(function(u){
      return u.name.toLowerCase().indexOf(q)>=0 || (u.univ||'').toLowerCase().indexOf(q)>=0 ||
             (u.bio||'').toLowerCase().indexOf(q)>=0 || (u.skills||[]).some(function(s){return s.toLowerCase().indexOf(q)>=0;});
    });
  }
  var meta=$('explore-meta'); if(meta) meta.textContent='Найдено: '+users.length;
  renderUsersGrid(users,'explore-grid');
}
