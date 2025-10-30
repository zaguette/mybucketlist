// App consolidado - inicialização única
// Usa AuthService, GoalService e modelos em /models
// Inicialização robusta com debug overlay

(function(){
  'use strict';

  // Debug overlay helper
  function dbg(msg) {
    try {
      let d = document.getElementById('debug-overlay');
      if (!d) {
        d = document.createElement('div');
        d.id = 'debug-overlay';
        d.style.position = 'fixed';
        d.style.right = '12px';
        d.style.bottom = '12px';
        d.style.background = 'rgba(0,0,0,0.6)';
        d.style.color = '#fff';
        d.style.padding = '8px 10px';
        d.style.borderRadius = '8px';
        d.style.fontSize = '12px';
        d.style.zIndex = 99999;
        document.body.appendChild(d);
      }
      d.innerText = msg;
      setTimeout(() => { if (d) d.innerText = ''; }, 3500);
    } catch (e) { console.warn('dbg failed', e); }
  }

  // Global errors
  window.addEventListener('error', function (event) {
    console.error('Unhandled error:', event.error || event.message);
    dbg('Erro: ' + (event.error && event.error.message ? event.error.message : event.message));
  });
  window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled rejection:', event.reason);
    dbg('Promise rejeitada: ' + (event.reason && event.reason.message ? event.reason.message : event.reason));
  });

  // Small helpers
  function showMessage(msg) { alert(msg); }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // Service instances (populated at init)
  let auth, goalService;

  // Renderers
  function renderAuth() {
    const user = auth.getCurrentUser();
    const userInfo = document.getElementById('user-info');
    const forms = document.getElementById('forms');
    const novoForm = document.getElementById('novo-form');

    if (user) {
      if (userInfo) userInfo.style.display = 'block';
      if (forms) forms.style.display = 'none';
      if (novoForm) novoForm.style.display = 'block';
      const welcome = document.getElementById('welcome'); if (welcome) welcome.innerText = `Olá, ${user.nome}`;
    } else {
      if (userInfo) userInfo.style.display = 'none';
      if (forms) forms.style.display = 'block';
      if (novoForm) novoForm.style.display = 'none';
    }
  }

  function renderList() {
    const listaDiv = document.getElementById('lista');
    if (!listaDiv) return;
    listaDiv.innerHTML = '';
    const user = auth.getCurrentUser();
    if (!user) { listaDiv.innerHTML = '<p>Faça login para ver suas metas.</p>'; return; }
    const metas = goalService.getByUser(user.id);
    if (!metas || metas.length === 0) { listaDiv.innerHTML = '<p>Nenhuma meta ainda.</p>'; return; }

    metas.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card' + (m.concluida ? ' feito' : '');
      card.style.background = m.color || '#ffffff';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="font-size:22px">${escapeHtml(m.icon || '⭐')}</div>
          <h3 style="margin:0">${escapeHtml(m.titulo)}</h3>
        </div>
        <p>${escapeHtml(m.descricao)}</p>
        ${m.fotos && m.fotos.length ? `<img src="${m.fotos[0]}" alt="foto"/>` : ''}
        <p style="font-size:12px;color:#333;">Data: ${m.data ? new Date(m.data).toLocaleString() : '-'}</p>
        <div class="btn-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <button data-id="${m.id}" class="toggle-btn">${m.concluida ? 'Desmarcar' : 'Concluir'}</button>
          <button data-id="${m.id}" class="edit-btn">Editar</button>
          <button data-id="${m.id}" class="delete-btn">Excluir</button>
        </div>
      `;
      listaDiv.appendChild(card);
    });
  }

  // Atualiza o painel admin para separar usuários e permitir ver metas por usuário
  function renderAdminPanel() {
    const user = auth.getCurrentUser();
    const existing = document.getElementById('admin-panel'); if (existing) existing.remove();
    if (!user || !user.isDev) return;

    const panel = document.createElement('div'); panel.id = 'admin-panel'; panel.className = 'admin-panel';
    panel.innerHTML = '<h3>Painel Desenvolvedora (admin)</h3>';

    const users = auth.getAllUsers();
    users.forEach(u => {
      const section = document.createElement('div');
      section.className = 'admin-user-section';
      section.style.padding = '8px';
      section.style.borderBottom = '1px solid rgba(0,0,0,0.04)';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(u.nome)} (${escapeHtml(u.email)})</strong>`;

      const controls = document.createElement('div');
      controls.innerHTML = `<button data-uid="${u.id}" class="impersonate-btn" type="button">Acessar</button> <button data-uid="${u.id}" class="admin-toggle-goals" type="button">Ver metas</button>`;

      header.appendChild(title);
      header.appendChild(controls);
      section.appendChild(header);

      // container para metas do usuário (escondido por padrão)
      const goalsContainer = document.createElement('div');
      goalsContainer.className = 'admin-goals';
      goalsContainer.style.display = 'none';
      goalsContainer.style.marginTop = '8px';
      section.appendChild(goalsContainer);

      panel.appendChild(section);

      // adicionar listener para Ver metas (delegação pelo body captura também, mas aqui ativamos imediato)
      controls.querySelector('.admin-toggle-goals').addEventListener('click', () => {
        if (goalsContainer.style.display === 'none') {
          // preencher metas
          const metas = goalService.getByUser(u.id);
          if (!metas || metas.length === 0) {
            goalsContainer.innerHTML = '<em>Sem metas</em>';
          } else {
            goalsContainer.innerHTML = '';
            metas.forEach(m => {
              const div = document.createElement('div');
              div.style.padding = '6px 0';
              div.innerHTML = `<span style="margin-right:8px">${escapeHtml(m.icon||'⭐')}</span> <strong>${escapeHtml(m.titulo)}</strong> — <span style="color:#666">${escapeHtml(m.descricao||'')}</span>`;
              goalsContainer.appendChild(div);
            });
          }
          goalsContainer.style.display = 'block';
        } else {
          goalsContainer.style.display = 'none';
        }
      });

    });

    const authDiv = document.getElementById('auth');
    document.body.insertBefore(panel, authDiv);
  }

  // Modal edit
  let editingGoalId = null;
  function openEditModal(goal) {
    editingGoalId = goal.id;
    const et = document.getElementById('edit-title'); if (et) et.value = goal.titulo || '';
    const ed = document.getElementById('edit-desc'); if (ed) ed.value = goal.descricao || '';
    const ei = document.getElementById('edit-icon'); if (ei) ei.value = goal.icon || '';
    const edate = document.getElementById('edit-date'); if (edate) edate.value = goal.data ? new Date(goal.data).toISOString().slice(0,10) : '';
    // scope color swatches to modal only
    document.querySelectorAll('#edit-modal .color-swatch').forEach(s => s.classList.toggle('selected', s.getAttribute('data-color') === (goal.color || '#ffffff')));
    // mark emoji selected inside modal
    document.querySelectorAll('#edit-modal .emoji').forEach(e => e.classList.toggle('selected', e.innerText === (goal.icon || '⭐')));
    const modal = document.getElementById('edit-modal'); if (modal) modal.style.display = 'flex';
  }
  function closeEditModal() { editingGoalId = null; const modal = document.getElementById('edit-modal'); if (modal) modal.style.display = 'none'; }

  // Attach listeners
  function attachListeners() {
    // auth
    const btnRegister = document.getElementById('btn-register'); if (btnRegister) btnRegister.addEventListener('click', () => {
      const nome = (document.getElementById('reg-nome') || {}).value || '';
      const email = (document.getElementById('reg-email') || {}).value || '';
      const password = (document.getElementById('reg-password') || {}).value || '';
      try { auth.register(nome.trim(), email.trim(), password); renderAuth(); renderList(); renderAdminPanel(); dbg('Registro OK'); } catch (e) { showMessage(e.message); }
    });

    const btnLogin = document.getElementById('btn-login'); if (btnLogin) btnLogin.addEventListener('click', () => {
      const email = (document.getElementById('login-email') || {}).value || '';
      const password = (document.getElementById('login-password') || {}).value || '';
      try { auth.login(email.trim(), password); renderAuth(); renderList(); renderAdminPanel(); dbg('Login OK'); } catch (e) { showMessage(e.message); }
    });

    const btnLogout = document.getElementById('btn-logout'); if (btnLogout) btnLogout.addEventListener('click', () => { auth.logout(); renderAuth(); renderList(); renderAdminPanel(); dbg('Logout OK'); });

    // register toggle
    const showReg = document.getElementById('show-register'); if (showReg) showReg.addEventListener('click', () => { const rs = document.getElementById('register-section'); if (rs) rs.style.display = rs.style.display === 'block' ? 'none' : 'block'; });

    // novo-form emoji/color
    document.querySelectorAll('#novo-form .emoji').forEach(btn => btn.addEventListener('click', () => {
      const iconInput = document.getElementById('meta-icon'); if (iconInput) iconInput.value = btn.innerText;
      // visual selection
      document.querySelectorAll('#novo-form .emoji').forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
    }));
    document.querySelectorAll('#novo-form .color-swatch').forEach(s => s.addEventListener('click', () => { document.querySelectorAll('#novo-form .color-swatch').forEach(x => x.classList.remove('selected')); s.classList.add('selected'); }));

    // add meta
    const btnAdd = document.getElementById('btn-add-meta'); if (btnAdd) btnAdd.addEventListener('click', () => {
      const titulo = (document.getElementById('meta-titulo') || {}).value || '';
      const descricao = (document.getElementById('meta-descricao') || {}).value || '';
      const icon = (document.getElementById('meta-icon') || {}).value.trim() || '⭐';
      const colorEl = document.querySelector('#novo-form .color-swatch.selected');
      const color = colorEl ? colorEl.getAttribute('data-color') : '#ffffff';
      const user = auth.getCurrentUser(); if (!user) return showMessage('Você precisa estar logado');
      if (!titulo.trim()) return showMessage('Título é obrigatório');
      goalService.addGoal(user.id, titulo.trim(), descricao.trim(), [], icon, color);
      (document.getElementById('meta-titulo') || {}).value = '';
      (document.getElementById('meta-descricao') || {}).value = '';
      if (document.getElementById('meta-icon')) document.getElementById('meta-icon').value = '';
      document.querySelectorAll('#novo-form .color-swatch').forEach(x => x.classList.remove('selected'));
      document.querySelectorAll('#novo-form .emoji').forEach(x => x.classList.remove('selected'));
      renderList(); dbg('Meta adicionada');
    });

    // list delegation
    const listaEl = document.getElementById('lista'); if (!listaEl) { dbg('#lista ausente'); }
    if (listaEl) {
      listaEl.addEventListener('click', (e) => {
        // use closest to ensure we capture clicks even if inner nodes are clicked
        const btn = e.target.closest && e.target.closest('button');
        if (!btn) return;
        const user = auth.getCurrentUser(); if (!user) return;

        if (btn.classList.contains('toggle-btn')) {
          const id = Number(btn.getAttribute('data-id'));
          goalService.toggleComplete(id, user.id);
          renderList(); dbg('toggle');
          return;
        }

        if (btn.classList.contains('delete-btn')) {
          const id = Number(btn.getAttribute('data-id'));
          if (confirm('Excluir essa meta?')) { goalService.deleteGoal(id, user.id); renderList(); dbg('deleted'); }
          return;
        }

        if (btn.classList.contains('edit-btn')) {
          const id = Number(btn.getAttribute('data-id'));
          const g = goalService.getById(id, user.id); if (!g) return;
          openEditModal(g);
          return;
        }
      });
    }

    // admin impersonate (body-level)
    document.body.addEventListener('click', (e) => {
      const t = e.target; if (t.classList && t.classList.contains('impersonate-btn')) { const uid = Number(t.getAttribute('data-uid')); auth._setSession({ userId: uid }); renderAuth(); renderList(); renderAdminPanel(); }
    });

    // modal listeners (emoji, swatches, save/cancel)
    document.querySelectorAll('#edit-modal .emoji').forEach(btn => btn.addEventListener('click', () => { const el = document.getElementById('edit-icon'); if (el) el.value = btn.innerText; document.querySelectorAll('#edit-modal .emoji').forEach(x => x.classList.remove('selected')); btn.classList.add('selected'); }));
    document.querySelectorAll('#edit-modal .color-swatch').forEach(s => s.addEventListener('click', () => { document.querySelectorAll('#edit-modal .color-swatch').forEach(x => x.classList.remove('selected')); s.classList.add('selected'); }));

    const editCancel = document.getElementById('edit-cancel'); if (editCancel) editCancel.addEventListener('click', closeEditModal);
    const editCancel2 = document.getElementById('edit-cancel-2'); if (editCancel2) editCancel2.addEventListener('click', closeEditModal);

    const editSave = document.getElementById('edit-save'); if (editSave) editSave.addEventListener('click', async () => {
      const user = auth.getCurrentUser(); if (!user || !editingGoalId) return;
      const title = (document.getElementById('edit-title') || {}).value || '';
      const desc = (document.getElementById('edit-desc') || {}).value || '';
      const icon = (document.getElementById('edit-icon') || {}).value.trim() || '⭐';
      const colorEl = document.querySelector('#edit-modal .color-swatch.selected');
      const color = colorEl ? colorEl.getAttribute('data-color') : '#ffffff';
      const dateVal = (document.getElementById('edit-date') || {}).value || '';
      const photoInput = document.getElementById('edit-photo');
      let photoData = null;
      if (photoInput && photoInput.files && photoInput.files[0]) photoData = await readFileAsDataURL(photoInput.files[0]);
      const updates = { titulo: title.trim(), descricao: desc.trim(), icon, color };
      if (dateVal) updates.dataConcluida = new Date(dateVal).toISOString();
      goalService.editGoal(editingGoalId, user.id, updates);
      if (photoData) goalService.addPhotoToGoal(editingGoalId, user.id, photoData);
      closeEditModal(); renderList(); dbg('Meta editada');
    });

  }

  // Global click fallback (guaranteia extra caso listeners específicos não funcionem)
  document.addEventListener('click', async (e) => {
    const target = e.target;
    const btn = target.closest && target.closest('#btn-login, #btn-register, #btn-logout, #btn-add-meta, .emoji, .color-swatch, .impersonate-btn');
    if (!btn) return;

    // Login
    if (btn.id === 'btn-login') {
      e.preventDefault();
      const email = (document.getElementById('login-email') || {}).value || '';
      const password = (document.getElementById('login-password') || {}).value || '';
      try { auth.login(email.trim(), password); renderAuth(); renderList(); renderAdminPanel(); dbg('Login (fallback) OK'); } catch (err) { showMessage(err.message); }
      return;
    }

    // Register
    if (btn.id === 'btn-register') {
      e.preventDefault();
      const nome = (document.getElementById('reg-nome') || {}).value || '';
      const email = (document.getElementById('reg-email') || {}).value || '';
      const password = (document.getElementById('reg-password') || {}).value || '';
      try { auth.register(nome.trim(), email.trim(), password); renderAuth(); renderList(); renderAdminPanel(); dbg('Registro (fallback) OK'); } catch (err) { showMessage(err.message); }
      return;
    }

    // Logout
    if (btn.id === 'btn-logout') {
      e.preventDefault();
      auth.logout(); renderAuth(); renderList(); renderAdminPanel(); dbg('Logout (fallback) OK');
      return;
    }

    // Add meta
    if (btn.id === 'btn-add-meta') {
      e.preventDefault();
      const titulo = (document.getElementById('meta-titulo') || {}).value || '';
      const descricao = (document.getElementById('meta-descricao') || {}).value || '';
      const icon = (document.getElementById('meta-icon') || {}).value.trim() || '⭐';
      const colorEl = document.querySelector('#novo-form .color-swatch.selected');
      const color = colorEl ? colorEl.getAttribute('data-color') : '#ffffff';
      const user = auth.getCurrentUser();
      if (!user) return showMessage('Você precisa estar logado');
      if (!titulo.trim()) return showMessage('Título é obrigatório');
      goalService.addGoal(user.id, titulo.trim(), descricao.trim(), [], icon, color);
      (document.getElementById('meta-titulo') || {}).value = '';
      (document.getElementById('meta-descricao') || {}).value = '';
      if (document.getElementById('meta-icon')) document.getElementById('meta-icon').value = '';
      document.querySelectorAll('#novo-form .color-swatch').forEach(x => x.classList.remove('selected'));
      document.querySelectorAll('#novo-form .emoji').forEach(x => x.classList.remove('selected'));
      renderList(); dbg('Meta adicionada (fallback)');
      return;
    }

    // Emoji buttons (could be in novo-form or edit-modal)
    if (btn.classList && btn.classList.contains('emoji')) {
      e.preventDefault();
      // find closest form context
      const inNovo = btn.closest && btn.closest('#novo-form');
      const inModal = btn.closest && btn.closest('#edit-modal');
      if (inNovo) {
        const iconInput = document.getElementById('meta-icon'); if (iconInput) iconInput.value = btn.innerText;
      } else if (inModal) {
        const iconInput = document.getElementById('edit-icon'); if (iconInput) iconInput.value = btn.innerText;
      }
      return;
    }

    // Color swatch
    if (btn.classList && btn.classList.contains('color-swatch')) {
      e.preventDefault();
      const inNovo = btn.closest && btn.closest('#novo-form');
      const inModal = btn.closest && btn.closest('#edit-modal');
      if (inNovo) {
        document.querySelectorAll('#novo-form .color-swatch').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
      } else if (inModal) {
        document.querySelectorAll('#edit-modal .color-swatch').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
      }
      return;
    }

    // impersonate
    if (btn.classList && btn.classList.contains('impersonate-btn')) {
      e.preventDefault();
      const uid = Number(btn.getAttribute('data-uid'));
      auth._setSession({ userId: uid }); renderAuth(); renderList(); renderAdminPanel(); dbg('Impersonate (fallback)');
      return;
    }
  });

  // end of IIFE adjustments

  // Init after DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof AuthService === 'undefined' || typeof GoalService === 'undefined') {
        dbg('Services não encontrados. Verifique se os arquivos JS foram carregados antes do app.js');
        console.warn('AuthService/GoalService não encontrados');
      }
      auth = new AuthService();
      goalService = new GoalService();
      renderAuth(); renderList(); renderAdminPanel();
      attachListeners();
      dbg('Aplicação inicializada');
    } catch (err) {
      console.error('Erro ao inicializar app', err);
      dbg('Erro inicialização: ' + (err && err.message));
    }
  });

})();
