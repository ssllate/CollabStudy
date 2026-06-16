// мессенджер: личные диалоги + групповые чаты проектов

// ─── переменные состояния ──────────────────────────────────────────────────────

// прикреплённый файл перед отправкой {name, size, mimeType, dataUrl} или null
var _pendingFile     = null;
var _emojiCatActive  = 'smileys';
var _emojiPickerOpen = false;

// ─── точка входа: отрисовка всего раздела Сообщения ───────────────────────────

// перерисовывает весь раздел: диалоги + группы, помечает прочитанным
function renderMessages() {
  if (!DB.me) return;
  // помечаем входящие личные сообщения прочитанными
  DB.messages.forEach(function(m) { if (m.to === DB.me.id) m.read = true; });
  saveAll();
  updateBadges();
  renderConvList('');
  // если был открыт личный чат — переоткрываем
  if (DB.chatWith) openChat(DB.chatWith);
  // если был открыт групповой — переоткрываем
  else if (DB.groupChatId) openGroupChat(DB.groupChatId);
}

// ─── список диалогов в боковой панели ─────────────────────────────────────────

// строит весь список: сначала личные диалоги, потом групповые чаты проектов
function renderConvList(filter) {
  var container = $('conv-list');
  if (!container) return;

  var html = '';

  // ── секция: личные диалоги ──
  var map = {};
  DB.messages.forEach(function(m) {
    if (m.from !== DB.me.id && m.to !== DB.me.id) return;
    var other = m.from === DB.me.id ? m.to : m.from;
    if (!map[other] || map[other].time < m.time) map[other] = { uid: other, last: m, time: m.time };
  });
  var convs = Object.keys(map).map(function(k) { return map[k]; })
    .sort(function(a, b) { return b.time - a.time; });

  // фильтруем по строке поиска
  if (filter) {
    var fl = filter.toLowerCase();
    convs = convs.filter(function(c) {
      var u = findUser(c.uid);
      return u && u.name.toLowerCase().indexOf(fl) >= 0;
    });
  }

  // ── секция: групповые чаты проектов, в которых состоит пользователь ──
  var myGroups = DB.groupChats.filter(function(gc) {
    var proj = findProject(gc.projectId);
    if (!proj) return false;
    var members = proj.members || [proj.authorId];
    return members.indexOf(DB.me.id) !== -1;
  });

  // фильтруем группы по строке поиска
  if (filter) {
    var fl2 = filter.toLowerCase();
    myGroups = myGroups.filter(function(gc) {
      var proj = findProject(gc.projectId);
      return proj && proj.title.toLowerCase().indexOf(fl2) >= 0;
    });
  }

  // если нет ни личных, ни групповых — показываем заглушку
  if (!convs.length && !myGroups.length) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--c-text-3);font-size:.85rem">Нет диалогов</div>';
    return;
  }

  // ── рендер групповых чатов (проекты) ──
  if (myGroups.length) {
    html += '<div class="conv-section-label"><i class="fas fa-layer-group"></i> Проекты</div>';
    myGroups.forEach(function(gc) {
      var proj = findProject(gc.projectId);
      if (!proj) return;
      var msgs   = gc.messages || [];
      var lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
      var members = proj.members || [proj.authorId];

      // считаем непрочитанные в этой группе
      var unread = msgs.filter(function(m) { return m.from !== DB.me.id && !m.read; }).length;
      var active = DB.groupChatId === gc.id ? 'active' : '';

      // предпросмотр последнего сообщения группы
      var preview = '';
      if (lastMsg) {
        var sender = findUser(lastMsg.from);
        var sName  = sender ? sender.name.split(' ')[0] : '?';
        if (lastMsg.type === 'file') {
          preview = sName + ': 📎 ' + esc(lastMsg.fileName || 'файл');
        } else {
          var raw = lastMsg.text || '';
          preview = sName + ': ' + esc(raw.substring(0, 35) + (raw.length > 35 ? '...' : ''));
        }
      } else {
        preview = 'Нет сообщений';
      }

      // иконка: первые буквы названия проекта
      var projInitials = proj.title.substring(0, 2).toUpperCase();
      var gradients    = ['var(--grad-main)','var(--grad-purple)','var(--grad-warm)','linear-gradient(135deg,#10b981,#34d399)'];
      var gradIdx      = Math.abs(gc.id.charCodeAt(gc.id.length - 1)) % gradients.length;

      html += '<div class="conv-item group-conv-item ' + active + '" onclick="openGroupChat(\'' + gc.id + '\')">' +
        '<div class="group-conv-avatar" style="background:' + gradients[gradIdx] + '">' +
          '<span>' + projInitials + '</span>' +
          '<div class="group-conv-badge"><i class="fas fa-users"></i></div>' +
        '</div>' +
        '<div class="conv-info">' +
          '<div class="conv-name">' + esc(proj.title.substring(0, 22) + (proj.title.length > 22 ? '…' : '')) + '</div>' +
          '<div class="conv-preview">' + preview + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
          (lastMsg ? '<span class="conv-time">' + timeAgo(lastMsg.time) + '</span>' : '') +
          (unread > 0 ? '<span class="conv-unread">' + unread + '</span>' : '') +
          (DB.me && proj.authorId === DB.me.id
            ? '<button class="conv-delete-btn" onclick="confirmDeleteGroupChat(\'' + gc.id + '\');event.stopPropagation()" title="Удалить чат"><i class="fas fa-trash-alt"></i></button>'
            : '<button class="conv-delete-btn" onclick="leaveGroupChat(\'' + gc.id + '\');event.stopPropagation()" title="Покинуть чат"><i class="fas fa-sign-out-alt"></i></button>') +
        '</div>' +
        '</div>';
    });
  }

  // ── рендер личных диалогов ──
  if (convs.length) {
    html += '<div class="conv-section-label"><i class="fas fa-user"></i> Личные</div>';
    convs.forEach(function(c) {
      var u = findUser(c.uid);
      if (!u) return;
      var unread = 0;
      DB.messages.forEach(function(m) {
        if (m.from === c.uid && m.to === DB.me.id && !m.read) unread++;
      });
      var active  = DB.chatWith === c.uid ? 'active' : '';
      var preview = '';
      if (c.last.type === 'file') {
        preview = '📎 ' + esc(c.last.fileName || 'файл');
      } else {
        var raw = c.last.text || '';
        preview = esc(raw.substring(0, 40) + (raw.length > 40 ? '...' : ''));
      }
      html += '<div class="conv-item ' + active + '" onclick="openChat(\'' + c.uid + '\')">' +
        avEl(u.name, u.id, '40px', '12px') +
        '<div class="conv-info"><div class="conv-name">' + esc(u.name) + '</div><div class="conv-preview">' + preview + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
          '<span class="conv-time">' + timeAgo(c.last.time) + '</span>' +
          (unread > 0 ? '<span class="conv-unread">' + unread + '</span>' : '') +
          '<button class="conv-delete-btn" onclick="confirmDeleteChat(\'' + c.uid + '\');event.stopPropagation()" title="Удалить диалог"><i class="fas fa-trash-alt"></i></button>' +
        '</div>' +
        '</div>';
    });
  }

  container.innerHTML = html;
}

// обработчик поля поиска в диалогах
function filterConversations(val) { renderConvList(val); }

// ─── открытие личного чата ─────────────────────────────────────────────────────

// открывает переписку с пользователем uid
function openChat(uid) {
  if (!DB.me) { openModal('login-modal'); return; }
  closeEmojiPickerIfOpen();

  DB.chatWith    = uid;
  DB.groupChatId = null; // сбрасываем групповой режим

  var u = findUser(uid);
  if (!u) return;

  showChatPanel();

  // заголовок: имя + аватар
  var cn = $('chat-name');
  if (cn) cn.textContent = u.name;
  var cs = $('chat-subtitle');
  if (cs) cs.textContent = 'Личный чат';
  var cav = $('chat-av');
  if (cav) cav.innerHTML = avEl(u.name, u.id, '40px', '12px');

  // показываем кнопки для личного чата, прячем групповые
  toggleChatTopbarMode('private');

  DB.messages.forEach(function(m) { if (m.from === uid && m.to === DB.me.id) m.read = true; });
  saveAll();
  updateBadges();
  renderChatMsgs(uid);
  renderConvList('');
}

// ─── открытие группового чата проекта ─────────────────────────────────────────

// открывает групповой чат по id группового чата
function openGroupChat(gcId) {
  if (!DB.me) { openModal('login-modal'); return; }
  closeEmojiPickerIfOpen();

  var gc   = DB.groupChats.find(function(g) { return g.id === gcId; });
  if (!gc) return;
  var proj = findProject(gc.projectId);
  if (!proj) return;

  // проверяем: пользователь — участник проекта?
  var members = proj.members || [proj.authorId];
  if (members.indexOf(DB.me.id) === -1) {
    toast('Вы не участник этого проекта', 'warning');
    return;
  }

  DB.groupChatId = gcId;
  DB.chatWith    = null;

  showChatPanel();

  // заголовок: название проекта + состав команды
  var cn = $('chat-name');
  if (cn) cn.textContent = proj.title;
  var cs = $('chat-subtitle');
  if (cs) {
    var memberNames = members.map(function(uid) {
      var u = findUser(uid);
      return u ? u.name.split(' ')[0] : '?';
    }).join(', ');
    cs.textContent = members.length + ' участн. · ' + memberNames;
  }

  // аватар группы — иконка с градиентом
  var cav = $('chat-av');
  var gradients = ['var(--grad-main)','var(--grad-purple)','var(--grad-warm)','linear-gradient(135deg,#10b981,#34d399)'];
  var gradIdx   = Math.abs(gcId.charCodeAt(gcId.length - 1)) % gradients.length;
  if (cav) cav.innerHTML = '<div class="group-chat-av-icon" style="background:' + gradients[gradIdx] + '">' +
    '<i class="fas fa-users"></i></div>';

  // показываем кнопки для группового чата, прячем личные
  toggleChatTopbarMode('group', gcId, proj);

  // помечаем входящие сообщения группы прочитанными
  (gc.messages || []).forEach(function(m) { if (m.from !== DB.me.id) m.read = true; });
  saveAll();
  updateBadges();
  renderGroupChatMsgs(gcId);
  renderConvList('');
}

// переключает кнопки в шапке чата под нужный режим (personal / group)
function toggleChatTopbarMode(mode, gcId, proj) {
  var actionsEl = $('chat-topbar-actions');
  if (!actionsEl) return;

  if (mode === 'private') {
    // кнопки для личного чата
    actionsEl.innerHTML =
      '<button class="icon-btn" onclick="goToUserProfile(DB.chatWith)" title="Профиль"><i class="fas fa-user"></i></button>' +
      '<button class="icon-btn icon-btn-danger" onclick="confirmDeleteChat(DB.chatWith)" title="Удалить диалог"><i class="fas fa-trash"></i></button>';
  } else {
    // кнопки для группового чата
    var isOwner = DB.me && proj && proj.authorId === DB.me.id;
    actionsEl.innerHTML =
      '<button class="icon-btn" onclick="showGroupMembersPopup(\'' + gcId + '\')" title="Участники"><i class="fas fa-users"></i></button>' +
      (isOwner
        ? '<button class="icon-btn icon-btn-danger" onclick="confirmDeleteGroupChat(\'' + gcId + '\')" title="Удалить чат"><i class="fas fa-trash"></i></button>'
        : '<button class="icon-btn" onclick="leaveGroupChat(\'' + gcId + '\')" title="Покинуть чат" style="color:var(--c-text-3)"><i class="fas fa-sign-out-alt"></i></button>');
  }
}

// показывает панель чата, скрывает заглушку
function showChatPanel() {
  var empty = $('msg-empty'), chat = $('msg-chat');
  if (empty) empty.style.display = 'none';
  if (chat)  chat.style.display  = 'flex';
}

// ─── рендер личных сообщений ───────────────────────────────────────────────────

// отрисовывает все личные сообщения в чате с uid
function renderChatMsgs(uid) {
  var msgs = DB.messages.filter(function(m) {
    return (m.from === DB.me.id && m.to === uid) || (m.from === uid && m.to === DB.me.id);
  }).sort(function(a, b) { return a.time - b.time; });

  var c = $('chat-messages');
  if (!c) return;

  if (!msgs.length) {
    c.innerHTML = '<div class="chat-empty-hint">Начните общение!</div>';
    return;
  }

  var html = '';
  msgs.forEach(function(m) {
    var sent = m.from === DB.me.id;
    var t    = fmtMsgTime(m.time);
    var cls  = 'chat-msg ' + (sent ? 'msg-sent' : 'msg-recv');
    html += m.type === 'file'
      ? '<div class="' + cls + ' msg-file">' + renderFileMessage(m) + '<div class="msg-time">' + t + '</div></div>'
      : '<div class="' + cls + '">' + esc(m.text) + '<div class="msg-time">' + t + '</div></div>';
  });

  c.innerHTML = html;
  c.scrollTop = c.scrollHeight;
}

// ─── рендер групповых сообщений ────────────────────────────────────────────────

// отрисовывает сообщения группового чата gcId
function renderGroupChatMsgs(gcId) {
  var gc   = DB.groupChats.find(function(g) { return g.id === gcId; });
  var c    = $('chat-messages');
  if (!c) return;
  if (!gc || !gc.messages.length) {
    c.innerHTML = '<div class="chat-empty-hint">Начните обсуждение проекта!</div>';
    return;
  }

  var html     = '';
  var prevDate = null;

  gc.messages.forEach(function(m) {
    var sent = m.from === DB.me.id;
    var t    = fmtMsgTime(m.time);

    // разделитель по дням
    var dayStr = new Date(m.time).toLocaleDateString('ru-RU', {day:'numeric',month:'long'});
    if (dayStr !== prevDate) {
      html    += '<div class="chat-date-sep"><span>' + dayStr + '</span></div>';
      prevDate = dayStr;
    }

    var cls = 'chat-msg ' + (sent ? 'msg-sent' : 'msg-recv');

    if (!sent) {
      // у чужих сообщений показываем имя отправителя
      var sender = findUser(m.from);
      var sName  = sender ? sender.name : '?';
      html += '<div class="chat-msg-group">' +
        '<div class="msg-sender-name">' + esc(sName) + '</div>' +
        (m.type === 'file'
          ? '<div class="' + cls + ' msg-file">' + renderFileMessage(m) + '<div class="msg-time">' + t + '</div></div>'
          : '<div class="' + cls + '">' + esc(m.text) + '<div class="msg-time">' + t + '</div></div>') +
        '</div>';
    } else {
      html += m.type === 'file'
        ? '<div class="' + cls + ' msg-file">' + renderFileMessage(m) + '<div class="msg-time">' + t + '</div></div>'
        : '<div class="' + cls + '">' + esc(m.text) + '<div class="msg-time">' + t + '</div></div>';
    }
  });

  c.innerHTML  = html;
  c.scrollTop  = c.scrollHeight;
}

// ─── попап участников группового чата ─────────────────────────────────────────

// показывает попап со списком участников проекта
function showGroupMembersPopup(gcId) {
  var gc   = DB.groupChats.find(function(g) { return g.id === gcId; });
  if (!gc) return;
  var proj = findProject(gc.projectId);
  if (!proj) return;

  var members  = proj.members || [proj.authorId];
  var isOwner  = DB.me && proj.authorId === DB.me.id;

  var html = '<div class="gm-popup-header"><i class="fas fa-users"></i> Участники проекта</div>' +
    '<div class="gm-popup-list">';
  members.forEach(function(uid) {
    var u = findUser(uid);
    if (!u) return;
    var isAuthor = uid === proj.authorId;
    html += '<div class="gm-popup-item">' +
      avEl(u.name, u.id, '36px', '10px') +
      '<div class="gm-popup-info">' +
        '<span class="gm-popup-name">' + esc(u.name) + '</span>' +
        (isAuthor ? '<span class="gm-popup-role">создатель</span>' : '') +
      '</div>' +
      // владелец может исключить участника (не себя)
      (isOwner && uid !== DB.me.id
        ? '<button class="icon-btn" onclick="kickFromProject(\'' + proj.id + '\',\'' + uid + '\')" title="Исключить" style="color:#f87171;font-size:.75rem"><i class="fas fa-user-minus"></i></button>'
        : '') +
    '</div>';
  });
  html += '</div>';

  var content = $('user-popup-content');
  if (content) content.innerHTML = html;
  openModal('user-popup');
}

// исключает участника uid из проекта и обновляет чат
function kickFromProject(projId, uid) {
  var proj = findProject(projId);
  if (!proj || !DB.me || proj.authorId !== DB.me.id) return;
  proj.members   = (proj.members || [proj.authorId]).filter(function(id) { return id !== uid; });
  proj.teamSize  = proj.members.length;
  saveAll();
  closeModal('user-popup');
  var u = findUser(uid);
  toast((u ? u.name : 'Участник') + ' исключён из проекта', 'info');
  openGroupChat(DB.groupChatId);
}

// ─── выход / удаление группового чата ─────────────────────────────────────────

// пользователь покидает групповой чат (если он не владелец)
function leaveGroupChat(gcId) {
  var gc   = DB.groupChats.find(function(g) { return g.id === gcId; });
  if (!gc || !DB.me) return;
  var proj = findProject(gc.projectId);
  if (!proj) return;

  if (!confirm('Покинуть чат проекта «' + proj.title + '»?')) return;

  // убираем себя из списка участников
  proj.members  = (proj.members || []).filter(function(id) { return id !== DB.me.id; });
  proj.teamSize = proj.members.length;
  saveAll();

  // если этот чат был открыт — закрываем
  if (DB.groupChatId === gcId) closeChatPanel();
  renderConvList('');
  toast('Вы покинули чат проекта', 'info');
}

// удаляет групповой чат вместе со всеми сообщениями (только владелец проекта)
function confirmDeleteGroupChat(gcId) {
  var gc   = DB.groupChats.find(function(g) { return g.id === gcId; });
  if (!gc || !DB.me) return;
  var proj = findProject(gc.projectId);
  var name = proj ? proj.title : 'проект';
  if (!confirm('Удалить чат проекта «' + name + '»?\nВсе сообщения будут удалены.')) return;

  DB.groupChats = DB.groupChats.filter(function(g) { return g.id !== gcId; });
  saveAll();
  if (DB.groupChatId === gcId) closeChatPanel();
  renderConvList('');
  toast('Чат проекта удалён', 'info');
}

// скрывает панель чата и показывает заглушку
function closeChatPanel() {
  DB.chatWith    = null;
  DB.groupChatId = null;
  var chat  = $('msg-chat'), empty = $('msg-empty');
  if (chat)  chat.style.display  = 'none';
  if (empty) empty.style.display = 'flex';
  clearAttachment();
}

// ─── отправка сообщений ─────────────────────────────────────────────────────────

// отправляет сообщение в активный чат (личный или групповой)
function sendMessage(e) {
  e.preventDefault();
  if (!DB.me) return;
  closeEmojiPickerIfOpen();

  var inp  = $('chat-input');
  var text = inp ? inp.value.trim() : '';
  if (!text && !_pendingFile) return;

  var now = Date.now();

  if (DB.groupChatId) {
    // ── отправка в групповой чат ──
    var gc = DB.groupChats.find(function(g) { return g.id === DB.groupChatId; });
    if (!gc) return;
    if (_pendingFile) {
      gc.messages.push({ id:'gm'+now, from:DB.me.id, text:'', type:'file',
        fileName:_pendingFile.name, fileSize:_pendingFile.size,
        mimeType:_pendingFile.mimeType, dataUrl:_pendingFile.dataUrl,
        time:now, read:false });
      clearAttachment();
    }
    if (text) {
      gc.messages.push({ id:'gm'+(now+1), from:DB.me.id, text:text, type:'msg', time:now+1, read:false });
      if (inp) inp.value = '';
    }
    saveAll();
    renderGroupChatMsgs(DB.groupChatId);

  } else if (DB.chatWith) {
    // ── отправка в личный чат ──
    if (_pendingFile) {
      DB.messages.push({ id:'m'+now, from:DB.me.id, to:DB.chatWith, text:'', type:'file',
        fileName:_pendingFile.name, fileSize:_pendingFile.size,
        mimeType:_pendingFile.mimeType, dataUrl:_pendingFile.dataUrl,
        time:now, read:false });
      clearAttachment();
    }
    if (text) {
      DB.messages.push({ id:'m'+(now+1), from:DB.me.id, to:DB.chatWith, text:text, type:'msg', time:now+1, read:false });
      if (inp) inp.value = '';
    }
    saveAll();
    renderChatMsgs(DB.chatWith);
  }

  renderConvList('');
  updateBadges();
}

// ─── вложения файлов ──────────────────────────────────────────────────────────

// читает выбранный файл через FileReader (макс. 20 МБ) и ставит в очередь
function handleFileAttach(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 20 * 1024 * 1024) { toast('Файл слишком большой. Максимум 20 МБ', 'error'); input.value = ''; return; }
  var reader = new FileReader();
  reader.onload  = function(ev) {
    _pendingFile = { name:file.name, size:file.size, mimeType:file.type, dataUrl:ev.target.result };
    showFilePreviewBar();
  };
  reader.onerror = function() { toast('Не удалось прочитать файл', 'error'); };
  reader.readAsDataURL(file);
  input.value = '';
}

// показывает строку предпросмотра вложения над полем ввода
function showFilePreviewBar() {
  if (!_pendingFile) return;
  var bar    = $('file-preview-bar');
  var nameEl = $('file-preview-name');
  var sizeEl = $('file-preview-size');
  if (bar)    bar.style.display = 'flex';
  if (nameEl) nameEl.textContent = _pendingFile.name;
  if (sizeEl) sizeEl.textContent = '(' + formatFileSize(_pendingFile.size) + ')';
}

// убирает прикреплённый файл и скрывает строку предпросмотра
function clearAttachment() {
  _pendingFile = null;
  var bar = $('file-preview-bar');
  if (bar) bar.style.display = 'none';
  var inp = $('chat-file-input');
  if (inp) inp.value = '';
}

// ─── рендер сообщений с файлами ───────────────────────────────────────────────

// строит html для сообщения с вложением
function renderFileMessage(m) {
  var isImage = m.mimeType && m.mimeType.startsWith('image/');
  var sizeStr = formatFileSize(m.fileSize || 0);
  if (isImage && m.dataUrl) {
    return '<div class="msg-file-wrap">' +
      '<img src="' + m.dataUrl + '" alt="' + esc(m.fileName) + '" class="msg-img-preview" onclick="openImagePreview(\'' + m.id + '\')">' +
      '<div class="msg-file-meta"><span class="msg-file-name">' + esc(m.fileName) + '</span><span class="msg-file-size">' + sizeStr + '</span></div>' +
      '</div>';
  }
  var icon = getFileIcon(m.mimeType);
  return '<div class="msg-file-wrap"><div class="msg-file-card">' +
    '<div class="msg-file-icon"><i class="fas ' + icon + '"></i></div>' +
    '<div class="msg-file-meta"><span class="msg-file-name">' + esc(m.fileName) + '</span><span class="msg-file-size">' + sizeStr + '</span></div>' +
    (m.dataUrl ? '<a href="' + m.dataUrl + '" download="' + esc(m.fileName) + '" class="msg-file-dl" title="Скачать"><i class="fas fa-download"></i></a>' : '') +
    '</div></div>';
}

// подбирает иконку по mime-типу файла
function getFileIcon(mimeType) {
  if (!mimeType)                           return 'fa-file';
  if (mimeType.startsWith('image/'))       return 'fa-file-image';
  if (mimeType.startsWith('video/'))       return 'fa-file-video';
  if (mimeType.startsWith('audio/'))       return 'fa-file-audio';
  if (mimeType.includes('pdf'))            return 'fa-file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word';
  if (mimeType.includes('excel') || mimeType.includes('sheet'))   return 'fa-file-excel';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'fa-file-archive';
  if (mimeType.startsWith('text/'))        return 'fa-file-alt';
  return 'fa-file';
}

// форматирует размер в байтах → Б / КБ / МБ
function formatFileSize(bytes) {
  if (bytes < 1024)    return bytes + ' Б';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / 1048576).toFixed(1) + ' МБ';
}

// открывает изображение на весь экран (клик по превью)
function openImagePreview(msgId) {
  // ищем сообщение сначала в личных, потом в групповых
  var msg = DB.messages.find(function(m) { return m.id === msgId; });
  if (!msg) {
    DB.groupChats.forEach(function(gc) {
      if (!msg) msg = (gc.messages || []).find(function(m) { return m.id === msgId; });
    });
  }
  if (!msg || !msg.dataUrl) return;
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  overlay.innerHTML = '<img src="' + msg.dataUrl + '" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.5)">';
  overlay.onclick = function() { document.body.removeChild(overlay); };
  document.body.appendChild(overlay);
}

// ─── удаление личного диалога ──────────────────────────────────────────────────

// спрашивает подтверждение и удаляет личный диалог
function confirmDeleteChat(uid) {
  if (!uid || !DB.me) return;
  var u    = findUser(uid);
  var name = u ? u.name : 'пользователем';
  if (!window.confirm('Удалить переписку с ' + name + '?\nВосстановить невозможно.')) return;
  deleteChat(uid);
}

// удаляет все личные сообщения с uid
function deleteChat(uid) {
  if (!DB.me) return;
  var before      = DB.messages.length;
  DB.messages     = DB.messages.filter(function(m) {
    return !((m.from === DB.me.id && m.to === uid) || (m.from === uid && m.to === DB.me.id));
  });
  saveAll();
  if (DB.chatWith === uid) closeChatPanel();
  renderConvList('');
  updateBadges();
  toast('Диалог удалён (' + (before - DB.messages.length) + ' сообщ.)', 'success');
}

// ─── вспомогательные функции UI ────────────────────────────────────────────────

// форматирует время сообщения в «чч:мм»
function fmtMsgTime(ts) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

// закрывает эмодзи-пикер если он был открыт
function closeEmojiPickerIfOpen() {
  if (!_emojiPickerOpen) return;
  _emojiPickerOpen = false;
  var pk = $('emoji-picker');
  if (pk) pk.classList.remove('open');
  var eb = $('emoji-toggle-btn');
  if (eb) eb.classList.remove('picker-open');
  document.removeEventListener('click', closeEmojiOnOutside);
}

// ─── emoji-picker ──────────────────────────────────────────────────────────────

// банк эмодзи по категориям
var EMOJI_CATS = {
  smileys:  ['😊','😁','😂','🤣','😍','🥰','😎','🤩','😏','😅','🙃','😌','🤔','😶','🥳','😤','😢','😭','🤯','😱','🥺','😴','🤗','😒','🙄','😜','🤪','😝','😇','🥹'],
  gestures: ['👋','🤚','🖐','✋','👌','🤌','🤏','✌️','🤞','🤙','👍','👎','👏','🙌','🤝','🤜','🤛','✊','👊','🫶','❤️‍🔥','🙏','💪','🫂'],
  objects:  ['💡','📱','💻','🖥','⌨️','🖨','🖱','💾','📷','📸','📹','🎥','📞','☎️','🔋','🔌','💰','💳','💎','🔑','🗝','🔒','🔓','🔧','⚙️','🛠','📦','📫','📬'],
  symbols:  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨','⭐','🌟','💫','🎉','🎊','🎈','🎁','🏆','🥇','🎖'],
  nature:   ['🌿','🌱','🌲','🌳','🌴','🌵','🌾','🍀','🍁','🍂','🍃','🌺','🌸','🌹','🌻','🌼','💐','🍄','🌙','☀️','⛅','🌈','⚡','❄️','🔥','💧','🌊','🦋','🐝','🌍'],
  food:     ['🍕','🍔','🍟','🌮','🌯','🍜','🍣','🍱','🍛','🥗','🍰','🎂','🍩','🍪','🍫','🍬','🍭','🍦','🥤','🧋','☕','🍵','🧃','🍷','🥂','🍻','🍺','🥃','🍾','🧁'],
  travel:   ['✈️','🚀','🛸','🚂','🚗','🚕','🏎','🚙','🛻','🚌','🚎','🏍','🛵','🚲','🛴','⛵','🚢','🚁','🌆','🌇','🌃','🌉','🗺','🗼','🗽','🗿','🏔','🌋','🏖','🏝'],
  activity: ['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🥊','🎮','🕹','🎲','🧩','🎯','🏋️','🤸','⛷','🏄','🏊','🤽','🧘','🚴','🤾','🎭','🎬','🎤','🎸','🥁','🎺']
};

// переключает видимость emoji-пикера
function toggleEmojiPicker() {
  var picker = $('emoji-picker'), btn = $('emoji-toggle-btn');
  if (!picker) return;
  _emojiPickerOpen = !_emojiPickerOpen;
  picker.classList.toggle('open', _emojiPickerOpen);
  if (btn) btn.classList.toggle('picker-open', _emojiPickerOpen);
  if (_emojiPickerOpen) {
    renderEmojiGrid(_emojiCatActive);
    setTimeout(function() { document.addEventListener('click', closeEmojiOnOutside); }, 10);
  } else {
    document.removeEventListener('click', closeEmojiOnOutside);
  }
}

// закрывает пикер при клике вне него
function closeEmojiOnOutside(e) {
  var picker = $('emoji-picker'), btn = $('emoji-toggle-btn');
  if (!picker) return;
  if (!picker.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
    closeEmojiPickerIfOpen();
  }
}

// переключает активную категорию эмодзи
function switchEmojiCat(el, cat) {
  _emojiCatActive = cat;
  document.querySelectorAll('.emoji-cat').forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
  renderEmojiGrid(cat);
}

// заполняет сетку кнопками выбранной категории
function renderEmojiGrid(cat) {
  var grid = $('emoji-grid');
  if (!grid) return;
  grid.innerHTML = (EMOJI_CATS[cat] || []).map(function(em) {
    return '<button type="button" class="emoji-item" onclick="pickEmoji(\'' + em + '\')" title="' + em + '">' + em + '</button>';
  }).join('');
}

// вставляет эмодзи в поле ввода на позицию курсора
function pickEmoji(em) {
  var inp = $('chat-input');
  if (!inp) return;
  var pos = inp.selectionStart || inp.value.length;
  inp.value = inp.value.substring(0, pos) + em + inp.value.substring(pos);
  inp.focus();
  inp.setSelectionRange(pos + em.length, pos + em.length);
  // пикер не закрываем — удобно вставить несколько
}

// заглушка для обратной совместимости
function insertEmoji() { toggleEmojiPicker(); }
