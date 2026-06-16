// профиль пользователя

function goToUserProfile(uid) {
  if(!uid) return; var u=findUser(uid); if(u) showUserPopup(u);
}

// profile
function renderProfile() {
  if(!DB.me) return;
  var u=DB.me;
  var av=$('profile-av');
  if(av){av.textContent=initials(u.name);av.className='profile-av '+avCol(u.id);}
  var pn=$('p-name'); if(pn) pn.textContent=u.name;
  var pe=$('p-email'); if(pe) pe.innerHTML='<i class="fas fa-envelope"></i> '+esc(u.email);
  var pu=$('p-univ'),pt=$('p-univ-text');
  if(pu&&pt){if(u.univ){pt.textContent=u.univ;pu.style.display='inline-flex';}else pu.style.display='none';}
  var pb=$('p-bio'); if(pb) pb.textContent=u.bio||'Нет описания.';
  var psr=$('p-status-row'),psb=$('p-status-badge');
  if(psr&&psb){
    var sm={open:['status-open','🟢 Открыт для коллаборации'],busy:['status-busy','🟡 Занят'],closed:['status-closed','🔴 Не ищет']};
    if(u.status&&sm[u.status]){psb.className='status-badge '+sm[u.status][0];psb.textContent=sm[u.status][1];psr.style.display='block';}
    else psr.style.display='none';
  }
  var r=DB.ratings[u.id],rb=$('p-rating-badge'),rv=$('p-rating-val');
  if(rb&&rv){if(r&&r.count>0){rv.textContent=(r.total/r.count).toFixed(1);rb.style.display='inline-flex';}else rb.style.display='none';}
  function renderTags(id,arr,cls){
    var el=$(id); if(!el) return;
    el.innerHTML=arr&&arr.length?arr.map(function(t){return'<span class="tag-pill '+cls+'">'+esc(t)+'</span>';}).join(''):'<span style="color:var(--c-text-3);font-style:italic;font-size:.85rem">Не указано</span>';
  }
  renderTags('p-skills',u.skills,'tp-skill');
  renderTags('p-goals',u.goals,'tp-goal');
  renderTags('p-interests',u.interests,'tp-interest');
  var myP=DB.projects.filter(function(p){return p.authorId===u.id;});
  renderProjectsGrid(myP,'p-projects-grid',true);
  var msgs=0,colls=0;
  DB.messages.forEach(function(m){if(m.from===u.id){msgs++;if(m.type==='collab')colls++;}});
  var sm2=$('stat-msgs'),sc=$('stat-collabs'),sp2=$('stat-projects'),sr=$('stat-rating');
  if(sm2)sm2.textContent=msgs; if(sc)sc.textContent=colls;
  if(sp2)sp2.textContent=myP.length;
  var rat=DB.ratings[u.id];
  if(sr)sr.textContent=rat&&rat.count>0?(rat.total/rat.count).toFixed(1)+' ★':'-';
}

function switchProfileTab(tab, el) {
  document.querySelectorAll('.ptab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.ptab-panel').forEach(function(p){p.classList.remove('active');});
  el.classList.add('active');
  var panel=$('ptab-'+tab); if(panel) panel.classList.add('active');
}

function showEditProfile() {
  if(!requireAuth('редактировать профиль')) return;
  var u=DB.me;
  var fields={'ep-name':u.name||'','ep-univ':u.univ||'','ep-bio':u.bio||'',
    'ep-skills':(u.skills||[]).join(', '),'ep-goals':(u.goals||[]).join(', '),'ep-interests':(u.interests||[]).join(', '),
    'ep-email':u.email||'','ep-pass':''};
  for(var k in fields){var el=$(k);if(el)el.value=fields[k];}
  var es=$('ep-status'); if(es) es.value=u.status||'';
  openModal('edit-profile-modal');
}

function saveProfile(e) {
  e.preventDefault();
  function parse(s){return s.split(',').map(function(x){return x.trim();}).filter(Boolean);}
  var u=DB.me;
  var n=$('ep-name'); if(n&&n.value.trim()) u.name=n.value.trim();
  var uv=$('ep-univ'); if(uv) u.univ=uv.value.trim();
  var b=$('ep-bio'); if(b) u.bio=b.value.trim();
  var sk=$('ep-skills'); if(sk) u.skills=parse(sk.value);
  var go=$('ep-goals'); if(go) u.goals=parse(go.value);
  var int2=$('ep-interests'); if(int2) u.interests=parse(int2.value);
  var st=$('ep-status'); if(st) u.status=st.value;
  // email и пароль
  var em=$('ep-email'); if(em&&em.value.trim()) u.email=em.value.trim();
  var pw=$('ep-pass'); if(pw&&pw.value.trim()) u.pass=pw.value.trim();
  for(var i=0;i<DB.users.length;i++) if(DB.users[i].id===u.id){DB.users[i]=u;break;}
  saveAll(); closeModal('edit-profile-modal'); renderProfile(); updateNavUser();
  toast('Профиль сохранен!','success');
}
