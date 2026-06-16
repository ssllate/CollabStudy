// тема, навигация, модальные окна

// тема
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cs_theme', next);
}

function applyTheme() {
  var t = localStorage.getItem('cs_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
}

// навигация
function showView(name) {
  if ((name==='profile'||name==='messages'||name==='notifications') && !DB.me) {
    openModal('login-modal'); toast('Войдите для доступа','info'); return;
  }
  document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active','view-enter');});
  var el = $('view-'+name);
  if (!el) return;
  el.classList.add('active','view-enter');
  document.querySelectorAll('[data-view]').forEach(function(l){l.classList.toggle('active',l.getAttribute('data-view')===name);});
  var renderMap = {home:renderHome,explore:renderExplore,projects:renderProjects,feed:renderFeed,messages:renderMessages,profile:renderProfile,notifications:renderNotifications};
  if (renderMap[name]) renderMap[name]();
  window.scrollTo(0,0);
  closeMobileMenu();
}

function toggleMobileMenu() {
  $('nav-links').classList.toggle('open');
  $('hamburger').classList.toggle('open');
}

function closeMobileMenu() {
  var nl=$('nav-links'),hb=$('hamburger');
  if(nl)nl.classList.remove('open');
  if(hb)hb.classList.remove('open');
}

// модалки
function openModal(id) { var el=$(id); if(el) el.classList.add('open'); }
function closeModal(id) { var el=$(id); if(el) el.classList.remove('open'); }
function closeModalBg(event,id) { if(event.target&&event.target.id===id) closeModal(id); }
function switchModal(from,to) { closeModal(from); setTimeout(function(){openModal(to);},150); }
