// инициализация, частицы, загрузка фото

// частицы
function initParticles() {
  var canvas=$('bg-canvas'); if(!canvas) return;
  var ctx=canvas.getContext('2d'),W,H,pts=[];
  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
  function spawn(){pts=[];var n=Math.min(70,Math.floor(W*H/20000));for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,a:Math.random()*.4+.1});}
  function draw(){
    ctx.clearRect(0,0,W,H);
    var dark=document.documentElement.getAttribute('data-theme')!=='light',col=dark?'110,231,183':'59,130,246';
    for(var i=0;i<pts.length;i++)for(var j=i+1;j<pts.length;j++){var dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<130){ctx.beginPath();ctx.strokeStyle='rgba('+col+','+(0.07*(1-d/130))+')';ctx.lineWidth=.5;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}}
    pts.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba('+col+','+p.a+')';ctx.fill();});
  }
  function step(){pts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;});draw();requestAnimationFrame(step);}
  resize();spawn();step();
  window.addEventListener('resize',function(){resize();spawn();});
}

// cursor glow
function initCursorGlow() {
  var g=$('cursor-glow'); if(!g) return;
  document.addEventListener('mousemove',function(e){g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';});
}

// navbar scroll
function initNavbarScroll() {
  var nav=$('navbar'); if(!nav) return;
  window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>20);},{passive:true});
}

// старт
(function start() {
  applyTheme();
  loadAll();
  initDemo();
  try { initParticles(); } catch(e) {}
  try { initCursorGlow(); } catch(e) {}
  try { initNavbarScroll(); } catch(e) {}
  updateAuthUI();
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(function(m){m.classList.remove('open');});
  });
  var loader=$('page-loader'); if(loader) loader.style.display='none';
  showView('home');
})();

// загрузка фото профиля И баннера

// временные переменные для предпросмотра (до сохранения)
var _pendingAvatar = null;  // base64 или null
var _pendingBanner = null;  // base64 или null

function triggerAvatarUpload() {
  var inp = $('ep-avatar-file');
  if (inp) inp.click();
}

function triggerBannerUpload() {
  var inp = $('ep-banner-file');
  if (inp) inp.click();
}

function handleAvatarUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { toast('Файл слишком большой. Максимум 5 МБ', 'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    _pendingAvatar = e.target.result;
    // показываем превью в модалке
    var preview = $('ep-avatar-preview');
    if (preview) {
      preview.innerHTML = '<img src="' + _pendingAvatar + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:14px">';
    }
    var removeBtn = $('ep-avatar-remove');
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}

function handleBannerUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 8 * 1024 * 1024) { toast('Файл слишком большой. Максимум 8 МБ', 'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    _pendingBanner = e.target.result;
    // показываем превью в модалке
    var preview = $('ep-banner-preview');
    if (preview) {
      preview.innerHTML = '<img src="' + _pendingBanner + '" alt="banner" style="width:100%;height:100%;object-fit:cover">';
    }
    var removeBtn = $('ep-banner-remove');
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  _pendingAvatar = 'remove';
  var preview = $('ep-avatar-preview');
  if (preview && DB.me) {
    preview.innerHTML = initials(DB.me.name);
    // restore gradient bg
    preview.style.background = '';
  }
  var removeBtn = $('ep-avatar-remove');
  if (removeBtn) removeBtn.style.display = 'none';
  var inp = $('ep-avatar-file');
  if (inp) inp.value = '';
}

function removeBanner() {
  _pendingBanner = 'remove';
  var preview = $('ep-banner-preview');
  if (preview) {
    preview.innerHTML = '<div class="banner-upload-default"><i class="fas fa-image"></i><span>Нажмите для загрузки</span></div>';
  }
  var removeBtn = $('ep-banner-remove');
  if (removeBtn) removeBtn.style.display = 'none';
  var inp = $('ep-banner-file');
  if (inp) inp.value = '';
}

// патч showEditProfile — заполняет превью фото
var _origShowEditProfile = showEditProfile;
showEditProfile = function() {
  if (!requireAuth('редактировать профиль')) return;
  var u = DB.me;
  _pendingAvatar = null;
  _pendingBanner = null;

  // заполняем поля
  var fields = { 'ep-name':u.name||'', 'ep-univ':u.univ||'', 'ep-bio':u.bio||'',
    'ep-skills':(u.skills||[]).join(', '), 'ep-goals':(u.goals||[]).join(', '), 'ep-interests':(u.interests||[]).join(', ') };
  for (var k in fields) { var el=$(k); if(el) el.value=fields[k]; }
  var es=$('ep-status'); if(es) es.value=u.status||'';

  // аватар превью
  var aprev = $('ep-avatar-preview');
  var armBtn = $('ep-avatar-remove');
  if (aprev) {
    if (u.avatarImg) {
      aprev.innerHTML = '<img src="' + u.avatarImg + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:14px">';
      if (armBtn) armBtn.style.display = 'inline-flex';
    } else {
      aprev.innerHTML = initials(u.name);
      aprev.className = 'avatar-upload-preview ' + avCol(u.id);
      if (armBtn) armBtn.style.display = 'none';
    }
  }

  // баннер превью
  var bprev = $('ep-banner-preview');
  var brmBtn = $('ep-banner-remove');
  if (bprev) {
    if (u.bannerImg) {
      bprev.innerHTML = '<img src="' + u.bannerImg + '" alt="banner" style="width:100%;height:100%;object-fit:cover">';
      if (brmBtn) brmBtn.style.display = 'inline-flex';
    } else {
      bprev.innerHTML = '<div class="banner-upload-default"><i class="fas fa-image"></i><span>Нажмите для загрузки</span></div>';
      if (brmBtn) brmBtn.style.display = 'none';
    }
  }

  // сбросить input files
  var af=$('ep-avatar-file'), bf=$('ep-banner-file');
  if(af) af.value=''; if(bf) bf.value='';

  openModal('edit-profile-modal');
};

// патч saveProfile — сохраняет фото
var _origSaveProfile = saveProfile;
saveProfile = function(e) {
  e.preventDefault();
  function parse(s){return s.split(',').map(function(x){return x.trim();}).filter(Boolean);}
  var u = DB.me;
  var n=$('ep-name'); if(n&&n.value.trim()) u.name=n.value.trim();
  var uv=$('ep-univ'); if(uv) u.univ=uv.value.trim();
  var b=$('ep-bio'); if(b) u.bio=b.value.trim();
  var sk=$('ep-skills'); if(sk) u.skills=parse(sk.value);
  var go=$('ep-goals'); if(go) u.goals=parse(go.value);
  var int2=$('ep-interests'); if(int2) u.interests=parse(int2.value);
  var st=$('ep-status'); if(st) u.status=st.value;

  // применяем фото
  if (_pendingAvatar === 'remove') {
    u.avatarImg = null;
  } else if (_pendingAvatar) {
    u.avatarImg = _pendingAvatar;
  }
  if (_pendingBanner === 'remove') {
    u.bannerImg = null;
  } else if (_pendingBanner) {
    u.bannerImg = _pendingBanner;
  }

  for(var i=0;i<DB.users.length;i++) if(DB.users[i].id===u.id){DB.users[i]=u;break;}
  saveAll();
  closeModal('edit-profile-modal');
  renderProfile();
  updateNavUser();
  _pendingAvatar = null;
  _pendingBanner = null;
  toast('Профиль сохранен!', 'success');
};

// патч renderProfile — показывает фото если есть
var _origRenderProfile = renderProfile;
renderProfile = function() {
  _origRenderProfile();
  if (!DB.me) return;
  var u = DB.me;

  // аватар с фото
  var av = $('profile-av');
  if (av) {
    if (u.avatarImg) {
      av.innerHTML = '<img src="' + u.avatarImg + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:18px">';
      av.style.padding = '0';
    } else {
      av.innerHTML = initials(u.name);
      av.style.padding = '';
      av.className = 'profile-av ' + avCol(u.id);
    }
  }

  // баннер с фото
  var bannerImg = $('banner-img');
  var bannerPattern = $('banner-pattern');
  if (bannerImg) {
    if (u.bannerImg) {
      bannerImg.src = u.bannerImg;
      bannerImg.style.display = 'block';
      if (bannerPattern) bannerPattern.style.opacity = '0';
    } else {
      bannerImg.style.display = 'none';
      if (bannerPattern) bannerPattern.style.opacity = '1';
    }
  }
};
