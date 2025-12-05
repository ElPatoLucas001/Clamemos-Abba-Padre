/* app.js
   Sistema para "¡Clamemos: ABBA Padre!" - Campamento 2025
   - LocalStorage (campamento_abba_v1)
   - Teams, members, fotos (base64 o images/default.jpg)
   - Secciones: home, ranking, mejores, info, mantenimiento (con PIN)
*/

(() => {
  // ---- SELECTORES ----
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // nav
  const navBtns = qsa('.nav-btn');
  const pages = qsa('.page');

  // home tables
  const teamsTableBody = qs('#teamsTableBody');
  const podiumEl = qs('#podium');
  const teamsTop3 = qs('#teamsTop3');

  // ranking
  const rankingBody = qs('#rankingBody');
  const searchAll = qs('#searchAll');

  // mejores
  const bestMale = qs('#bestMale');
  const bestFemale = qs('#bestFemale');
  const bestSub15 = qs('#bestSub15');

  // info
  const campInfoEl = qs('#campInfo');
  const saveInfoBtn = qs('#saveInfo');

  // mantenimiento
  const pinInput = qs('#pinInput');
  const pinBtn = qs('#pinBtn');
  const pinArea = qs('#pinArea');
  const adminArea = qs('#adminArea');
  const formTeam = qs('#formTeam');
  const teamName = qs('#teamName');
  const teamsAdminList = qs('#teamsAdminList');
  const formMember = qs('#formMember');
  const memberName = qs('#memberName');
  const memberAge = qs('#memberAge');
  const memberTeamSelect = qs('#memberTeamSelect');
  const memberGender = qs('#memberGender');
  const memberPhoto = qs('#memberPhoto');
  const adminSearch = qs('#adminSearch');
  const adminResults = qs('#adminResults');

  // modal edit
  const modal = qs('#modal');
  const closeModal = qs('#closeModal');
  const editForm = qs('#editForm');
  const editId = qs('#editId');
  const editName = qs('#editName');
  const editAge = qs('#editAge');
  const editGender = qs('#editGender');
  const editTeam = qs('#editTeam');
  const editPhoto = qs('#editPhoto');
  const deleteBtn = qs('#deleteBtn');

  // STORAGE
  const STORAGE_KEY = 'campamento_abba_v1';
  let data = { teams: [], info: '' };

  // default teams if empty
  function defaultInit(){
    data = { teams: [
      { id: id(), name: 'A', members: [] },
      { id: id(), name: 'B', members: [] },
      { id: id(), name: 'C', members: [] },
      { id: id(), name: 'D', members: [] }
    ], info: ''};
    save();
  }

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function load(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try{ data = JSON.parse(raw); if(!data.teams) defaultInit(); }catch(e){ defaultInit(); }
    } else defaultInit();
  }

  function id(){ return '_' + Math.random().toString(36).slice(2,9); }

  // file -> base64
  function fileToBase64(file){ return new Promise((res, rej) => {
    if(!file) return res(null);
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  }); }

  // compute team score
  function teamScore(team){ return (team.members||[]).reduce((s,m)=> s + (Number(m.points)||0), 0); }

  // render nav / sections
  function showSection(id){
    pages.forEach(p => p.classList.add('hidden'));
    const target = qs('#' + id);
    if(target) target.classList.remove('hidden');
    // active nav
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === id));
  }
  navBtns.forEach(b => b.addEventListener('click', ()=> showSection(b.dataset.section)));

  // RENDER HOME - teams table, podium, teamsTop3
  function renderTeamsTable(){
    teamsTableBody.innerHTML = '';
    data.teams.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.name}</td><td>${teamScore(t)} pts</td>`;
      teamsTableBody.appendChild(tr);
    });
  }

  function renderPodium(){
    // mayor aporte por grupo: top 3 equipos por teamScore
    const sorted = [...data.teams].sort((a,b)=> teamScore(b) - teamScore(a));
    // show up to 3
    podiumEl.innerHTML = '';
    const places = ['gold','silver','bronze'];
    for(let i=0;i<3;i++){
      const t = sorted[i];
      if(!t) continue;
      const div = document.createElement('div');
      div.className = 'place ' + places[i];
      div.innerHTML = `<div class="avatar">${t.name}</div><div style="margin-top:8px;font-weight:800">${t.name}</div><div style="color:var(--muted)">${teamScore(t)} pts</div>`;
      podiumEl.appendChild(div);
    }
  }

  function renderTeamsTop3(){
    teamsTop3.innerHTML = '';
    data.teams.forEach(team => {
      const card = document.createElement('div');
      card.className = 'team-card';
      const top = (team.members||[]).slice().sort((a,b)=> (Number(b.points)||0) - (Number(a.points)||0)).slice(0,3);
      let inner = `<div style="flex:1"><div style="font-weight:800">${team.name}</div>`;
      top.forEach((m, idx) => {
        // styles: first diamond (celeste), second gold, third silver
        let color = idx===0 ? 'var(--accent)' : idx===1 ? '#d4af37' : '#c0c0c0';
        let role = idx===0 ? 'Siervo' : idx===1 ? 'Discípulo' : 'Aprendiz';
        inner += `<div style="display:flex;align-items:center;gap:10px;margin-top:8px">
                    <img src="${m.photo||'images/default.jpg'}" width="56" height="56" style="object-fit:cover;border-radius:8px" />
                    <div><div style="font-weight:700;color:${color}">${m.name}</div><small style="color:var(--muted)">${role}</small><div style="font-weight:700">${m.points||0} pts</div></div>
                  </div>`;
      });
      inner += `</div>`;
      card.innerHTML = inner;
      teamsTop3.appendChild(card);
    });
  }

  // RENDER RANKING
  function renderRanking(filter = ''){
    const all = data.teams.flatMap(t => (t.members||[]).map(m => ({...m, team: t.name})));
    const sorted = all.slice().sort((a,b)=> (Number(b.points)||0) - (Number(a.points)||0));
    const rows = sorted.filter(x => x.name.toLowerCase().includes(filter.toLowerCase()));
    rankingBody.innerHTML = '';
    rows.forEach((m, idx) => {
      // opacity based on index
      const opacity = Math.max(1 - idx*0.015, 0.5);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td>
                      <td style="font-weight:700;color:rgba(255,255,255,${opacity})">${m.name}</td>
                      <td style="color:var(--muted)">${m.team}</td>
                      <td style="font-weight:800">${m.points||0}</td>`;
      rankingBody.appendChild(tr);
    });
  }

  // RENDER MEJORES
  function renderMejores(){
    const all = data.teams.flatMap(t => (t.members||[]).map(m => ({...m, team: t.name})));
    const males = all.filter(x=> x.gender==='m').sort((a,b)=> (b.points||0)-(a.points||0)).slice(0,3);
    const females = all.filter(x=> x.gender==='f').sort((a,b)=> (b.points||0)-(a.points||0)).slice(0,3);
    const sub15 = all.filter(x => Number(x.age) && Number(x.age) < 15).sort((a,b)=> (b.points||0)-(a.points||0)).slice(0,3);

    function renderList(container, arr){
      container.innerHTML = '';
      if(!arr.length) { container.innerHTML = '<div style="color:var(--muted)">Sin datos</div>'; return; }
      arr.forEach((m,i)=>{
        const d = document.createElement('div');
        d.style.marginTop = '8px';
        d.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
                        <img src="${m.photo||'images/default.jpg'}" width="64" height="64" style="object-fit:cover;border-radius:8px" />
                        <div>
                          <div style="font-weight:800">${m.name}</div>
                          <small style="color:var(--muted)">${m.team} • ${m.age||'-'} años</small>
                          <div style="font-weight:800;margin-top:6px">${m.points||0} pts</div>
                        </div>
                      </div>`;
        container.appendChild(d);
      });
    }

    renderList(bestMale, males);
    renderList(bestFemale, females);
    renderList(bestSub15, sub15);
  }

  // INFO save/load
  function loadInfo(){
    campInfoEl.value = data.info || '';
  }
  saveInfoBtn.addEventListener('click', ()=>{
    data.info = campInfoEl.value || '';
    save();
    alert('Información guardada.');
  });

  // ADMIN: PIN handling
  const PIN = '19202122';
  pinBtn.addEventListener('click', ()=>{
    if(pinInput.value === PIN){
      pinArea.classList.add('hidden');
      adminArea.classList.remove('hidden');
      populateTeamSelects();
      renderAdminTeams();
    } else alert('PIN incorrecto');
  });

  // ADMIN: Teams management
  function populateTeamSelects(){
    memberTeamSelect.innerHTML = '';
    editTeam.innerHTML = '';
    data.teams.forEach(t=>{
      const o = document.createElement('option'); o.value = t.id; o.textContent = t.name;
      memberTeamSelect.appendChild(o);
      const oe = document.createElement('option'); oe.value = t.id; oe.textContent = t.name;
      editTeam.appendChild(oe);
    });
  }

  formTeam.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = teamName.value.trim();
    if(!name) return;
    data.teams.push({ id: id(), name, members: [] });
    save(); teamName.value=''; populateTeamSelects(); renderAdminTeams(); renderAll();
  });

  function renderAdminTeams(){
    teamsAdminList.innerHTML = '';
    data.teams.forEach(t=>{
      const div = document.createElement('div');
      div.className = 'admin-item';
      div.innerHTML = `<div><strong>${t.name}</strong> <small style="color:var(--muted)">${(t.members||[]).length} integrantes</small></div>
        <div style="display:flex;gap:8px">
          <button class="small-btn" data-id="${t.id}" data-action="rename">Editar</button>
          <button class="small-btn" data-id="${t.id}" data-action="del">Borrar</button>
        </div>`;
      teamsAdminList.appendChild(div);
    });
    // handlers
    qsa('#teamsAdminList .small-btn').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        const idd = ev.currentTarget.dataset.id;
        const action = ev.currentTarget.dataset.action;
        if(action==='rename'){
          const newName = prompt('Nuevo nombre del equipo:');
          if(newName) {
            const t = data.teams.find(x=>x.id===idd);
            if(t){ t.name = newName.trim(); save(); populateTeamSelects(); renderAdminTeams(); renderAll(); }
          }
        } else if(action==='del'){
          if(!confirm('¿Eliminar equipo? se perderán sus miembros')) return;
          data.teams = data.teams.filter(x=> x.id !== idd);
          save(); populateTeamSelects(); renderAdminTeams(); renderAll();
        }
      });
    });
  }

  // ADMIN: Members management
  formMember.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = memberName.value.trim(); if(!name) return alert('Nombre requerido');
    const age = memberAge.value ? Number(memberAge.value) : '';
    const gender = memberGender.value;
    const tId = memberTeamSelect.value;
    const file = memberPhoto.files && memberPhoto.files[0];
    const photo = file ? await fileToBase64(file) : null;
    const t = data.teams.find(x=> x.id === tId);
    if(!t) return alert('Seleccione equipo');
    const m = { id: id(), name, age, gender, photo: photo || null, points: 0 };
    t.members.push(m);
    save(); formMember.reset(); populateTeamSelects(); renderAll(); renderAdminSearch();
  });

  // admin search & result actions
  adminSearch.addEventListener('input', renderAdminSearch);
  function renderAdminSearch(){
    const term = adminSearch.value.trim().toLowerCase();
    adminResults.innerHTML = '';
    const all = data.teams.flatMap(t => (t.members||[]).map(m => ({...m, teamId: t.id, teamName: t.name})));
    const list = all.filter(x => x.name.toLowerCase().includes(term));
    if(!list.length) { adminResults.innerHTML = '<div style="color:var(--muted)">Sin resultados</div>'; return; }
    list.forEach(m=>{
      const d = document.createElement('div');
      d.className = 'admin-item';
      d.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
                        <img src="${m.photo||'images/default.jpg'}" width="52" height="52" style="object-fit:cover;border-radius:8px" />
                        <div><strong>${m.name}</strong><br><small style="color:var(--muted)">${m.teamName} • ${m.age||'-'}</small></div>
                     </div>
                     <div style="display:flex;gap:6px;align-items:center">
                        <button class="small-btn" data-id="${m.id}" data-action="add">+1</button>
                        <button class="small-btn" data-id="${m.id}" data-action="sub">−1</button>
                        <button class="small-btn" data-id="${m.id}" data-action="edit">✎</button>
                     </div>`;
      adminResults.appendChild(d);
    });
    qsa('#adminResults .small-btn').forEach(b=>{
      b.addEventListener('click', async (ev)=>{
        const mid = ev.currentTarget.dataset.id;
        const action = ev.currentTarget.dataset.action;
        let member, team;
        for(const t of data.teams){ const found = (t.members||[]).find(x=> x.id===mid); if(found){ member = found; team = t; break; } }
        if(!member) return;
        if(action==='add'){ member.points = Number(member.points||0) + 10; save(); renderAll(); renderAdminSearch(); }
        if(action==='sub'){ member.points = Number(member.points||0) - 10; save(); renderAll(); renderAdminSearch(); }
        if(action==='edit'){ openEdit(member.id); }
      });
    });
  }

  // EDIT modal
  function openEdit(mid){
    let target=null, parent=null;
    for(const t of data.teams){ const m = (t.members||[]).find(x=> x.id===mid); if(m){ target=m; parent=t; break; } }
    if(!target) return;
    editId.value = target.id;
    editName.value = target.name;
    editAge.value = target.age || '';
    editGender.value = target.gender || 'o';
    // fill team options
    editTeam.innerHTML = '';
    data.teams.forEach(t => {
      const o = document.createElement('option'); o.value = t.id; o.textContent = t.name;
      if(t.id === parent.id) o.selected = true;
      editTeam.appendChild(o);
    });
    modal.classList.remove('hidden');
  }

  closeModal.addEventListener('click', ()=> { modal.classList.add('hidden'); editForm.reset(); });
  editForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const mid = editId.value;
    const name = editName.value.trim();
    const age = editAge.value ? Number(editAge.value) : '';
    const gender = editGender.value;
    const tId = editTeam.value;
    const file = editPhoto.files && editPhoto.files[0];
    const photo = file ? await fileToBase64(file) : null;

    let member=null, oldTeam=null, oldIdx=-1;
    for(const t of data.teams){
      const idx = (t.members||[]).findIndex(x=> x.id === mid);
      if(idx >= 0){ member = t.members[idx]; oldTeam = t; oldIdx = idx; break; }
    }
    if(!member) return;
    // remove from old team
    if(oldTeam) oldTeam.members.splice(oldIdx,1);
    // apply edits
    member.name = name || member.name;
    member.age = age;
    member.gender = gender;
    if(photo) member.photo = photo;
    // push to dest
    const dest = data.teams.find(x=> x.id === tId);
    if(!dest) return;
    dest.members.push(member);
    save(); modal.classList.add('hidden'); editForm.reset(); renderAll(); renderAdminSearch(); renderAdminTeams();
  });

  deleteBtn.addEventListener('click', ()=>{
    if(!confirm('¿Eliminar campista?')) return;
    const mid = editId.value;
    for(const t of data.teams){
      const idx = (t.members||[]).findIndex(x=> x.id === mid);
      if(idx>=0){ t.members.splice(idx,1); save(); break; }
    }
    modal.classList.add('hidden'); renderAll(); renderAdminSearch(); renderAdminTeams();
  });

  // generic render all
  function renderAll(){
    renderTeamsTable();
    renderPodium();
    renderTeamsTop3();
    renderRanking(searchAll.value || '');
    renderMejores();
    loadInfo();
  }

  // search event
  searchAll.addEventListener('input', ()=> renderRanking(searchAll.value || ''));

  // initial load
  load();
  populateTeamSelects();
  renderAll();

  // if saved info, load into textarea
  if(data.info) campInfoEl.value = data.info;

  // show default home
  showSection('home');

  // expose openEdit to global (used by admin)
  window.openEdit = openEdit;

})();

