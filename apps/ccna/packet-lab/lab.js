(function () {
  'use strict';
  const E = window.CcnaLabEngine;
  const S = window.CcnaLabScenarios;
  const hostDevice = E.isHost;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = body => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const icons = {
    save: svg('<path d="M4 3h13l4 4v14H3V3z"/><path d="M7 3v6h10V3M7 21v-8h10v8M14 4v3"/>'),
    open: svg('<path d="M2 19V6h7l3 3h10l-4 10z"/><path d="M2 11h19"/>'),
    reset: svg('<path d="M3 10a9 9 0 1 1 2 9M3 3v7h7"/>'),
    cursor: svg('<path d="m5 3 15 11-8 1-4 7z"/>'),
    delete: svg('<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'),
    zoomIn: svg('<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6M10 7v6"/>'),
    zoomOut: svg('<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6"/>'),
    fit: svg('<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 8h8v8H8z"/>'),
    fullscreen: svg('<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>'),
    cable: svg('<path d="m14 2-9 12h7l-2 8 10-13h-8z" fill="#edb426" stroke="#a46b07"/>'),
    envelope: svg('<path d="M2 5h20v15H2zM2 6l10 8L22 6"/><path d="M16 2v6M13 5h6"/>'),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 18h.01"/>'),
    logical: svg('<circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="4" cy="18" r="2" fill="currentColor"/><circle cx="20" cy="18" r="2" fill="currentColor"/><path d="M11 6 5 16M13 6l6 10M6 18h12"/>'),
    physical: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M4 8h16M4 14h16M7 5h.1M7 11h.1M7 18h.1"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 5v7l4 3"/>'),
    play: svg('<path d="m8 4 12 8-12 8z" fill="currentColor"/>'),
    step: svg('<path d="m4 4 12 8L4 20z" fill="currentColor"/><path d="M20 4v16"/>'),
    terminal: svg('<rect x="1" y="3" width="22" height="18" rx="2" fill="#233951"/><path d="m5 8 4 4-4 4M12 16h5" stroke="#fff"/>'),
    config: svg('<path d="M5 3v18M12 3v18M19 3v18M2 8h6M9 16h6M16 7h6"/>')
  };
  function deviceArt(type) {
    if (type === 'wlc') return '<rect x="-42" y="-17" width="84" height="34" rx="4" fill="#79afc6" stroke="#305f79"/><path d="M-42 2h84" stroke="#305f79"/><path d="M-28 8h9m7 0h9m7 0h9" stroke="#183f57" stroke-width="5"/><circle cx="31" cy="9" r="2" fill="#7fec9b"/><path d="M-10-8a15 15 0 0 1 20 0m-15 5a8 8 0 0 1 10 0" fill="none" stroke="white" stroke-width="2"/>';
    if (type === 'router') return '<ellipse cx="0" cy="10" rx="45" ry="20" fill="#397f9e" stroke="#285b78"/><path d="M-45-7v17M45-7v17" stroke="#285b78"/><ellipse cx="0" cy="-7" rx="45" ry="20" fill="#78bacf" stroke="#285b78"/><path d="m-30-7 20 0-6-5m6 5-6 5m46-5-20 0 6-5m-6 5 6 5M0-22v11l-5-4m5 4 5-4M0 8V-3l-5 4m5-4 5 4" stroke="white" stroke-width="2" fill="none"/>';
    if (type === 'server') return '<rect x="-25" y="-32" width="50" height="65" rx="4" fill="#7899ae" stroke="#305575"/>'+[-20,-3,14].map(y=>'<rect x="-19" y="'+y+'" width="38" height="12" rx="2" fill="#24435c"/><circle cx="13" cy="'+(y+6)+'" r="2" fill="#73e1a3"/>').join('');
    if (type === 'ap') return '<rect x="-27" y="-8" width="54" height="28" rx="7" fill="#9bc9d8" stroke="#3a7792"/><path d="M-21-7v-25M21-7v-25M-12-16a18 18 0 0 1 24 0M-7-9a11 11 0 0 1 14 0" fill="none" stroke="#337799" stroke-width="3"/><circle cy="0" r="3" fill="#37a175"/>';
    if (type === 'pc') return '<path d="M-32-28H19L28-19V17H-32z" fill="#a8ccd6" stroke="#3e788e" stroke-width="1.5"/><path d="M-28-24H15V8H-28z" fill="#4d8eac" stroke="#edf8fc"/><path d="m-25-21 37 0-8 25h-29z" fill="#74b8d3"/><path d="M19-28v45l9-5v-31z" fill="#7aadb9" stroke="#437a8b"/><path d="M-11 17v6h16v-6M-29 23h47l10 9h-66z" fill="#b2d4df" stroke="#427b8b"/><path d="M-24 26h38M-20 29h38" stroke="#76a9ba"/><circle cx="12" cy="12" r="1.5" fill="#50e773"/>';
    return '<path d="M-47-13 30-22 49-7-29 4z" fill="#90c6d6" stroke="#3d7a90" stroke-width="1.5"/><path d="M-47-13v27l18 12V4z" fill="#367992" stroke="#28637c"/><path d="M-29 4 49-7v26l-78 7z" fill="#529cb5" stroke="#326e88"/><path d="m-24-10 21-3-6-3m6 3-5 6m21-8 20-3-5-3m5 3-5 6M-20-4 18-5m-38 1 7-5m-7 5 8 3" stroke="#effbff" stroke-width="2" fill="none"/>' + Array.from({ length: 10 }, (_, i) => '<path d="m' + (-22 + i * 6.3) + ' ' + (11 - i * .8) + ' 4-.5v5l-4 .5z" fill="#203f53"/>').join('') + '<circle cx="42" cy="12" r="2" fill="#77ed8a"/>';
  }
  function deviceIcon(type) { return '<svg viewBox="-55 -37 112 82" aria-hidden="true">' + deviceArt(type) + '</svg>'; }
  function mount(target, options = {}) {
    const scenario = options.scenario || {id:'ethernetDay6', title:"Analiza Ethernet switching", original:true, create:()=>new E.Network()};
    const createNetwork = saved => { const n = saved ? new E.Network(saved) : scenario.create(); if (!scenario.original) n.scenario = scenario; return n; };
    let net;
    try { net = createNetwork(options.initial); } catch { net = createNetwork(); }
    const root = document.createElement('section'); root.className = 'pt-lab'; root.setAttribute('aria-label', 'Laboratorium sieciowe CCNA');
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    root.innerHTML = `
      <div class="pt-title">${icons.logical}<strong>CCNA Network Lab <small>${esc(scenario.title)}</small></strong><span class="pt-grow"></span><button class="pt-back" data-action="close">← Wróć do kursu</button></div>
      <div class="pt-menu"><button data-action="file">Plik</button><button data-action="edit">Edycja</button><button data-action="view">Widok</button><button data-action="help">Pomoc</button><button data-action="tools">Narzędzia</button><button data-action="labs">Tematy / laboratoria</button><span class="pt-save-status" id="ptSaveStatus">Gotowe</span></div>
      <div class="pt-toolbar" role="toolbar" aria-label="Narzędzia laboratorium">
        ${[['import','open','Otwórz zapis laboratorium'],['export','save','Zapisz do pliku'],['reset','reset','Resetuj laboratorium']].map(([a,i,t])=>`<button data-action="${a}" title="${t}" aria-label="${t}">${icons[i]}</button>`).join('')}
        <span class="pt-separator"></span>
        ${[['select','cursor','Zaznacz i przesuń'],['delete','delete',"Usuń urządzenie lub cable"],['cables','cable','Połącz urządzenia'],['pdu','envelope','Add Simple PDU']].map(([a,i,t])=>`<button data-action="${a}" title="${t}" aria-label="${t}" aria-pressed="${a==='select'}">${icons[i]}</button>`).join('')}
        <span class="pt-separator"></span>
        ${[['zoom-in','zoomIn','Powiększ'],['zoom-out','zoomOut','Pomniejsz'],['fit','fit','Dopasuj widok'],['fullscreen','fullscreen','Pełny ekran']].map(([a,i,t])=>`<button data-action="${a}" title="${t}" aria-label="${t}">${icons[i]}</button>`).join('')}
        <span class="pt-grow"></span><span class="pt-tool-label">Przeciągnij urządzenie · kliknij, aby skonfigurować</span><button data-action="help" title="Instrukcja" aria-label="Instrukcja">${icons.help}</button>
      </div>
      <div class="pt-strip" role="tablist" aria-label="Przestrzeń robocza"><button data-action="logical" role="tab" aria-selected="true">${icons.logical}Logical</button><button data-action="physical" role="tab" aria-selected="false">${icons.physical}Physical</button><small id="ptPosition">${esc(scenario.original?'Root · LAN 192.168.1.0/24':scenario.goal)}</small><button data-action="check" class="pt-progress-button">Sprawdź zadanie <span id="ptScore">0/15</span></button></div>
      <div class="pt-work"><div class="pt-canvas-wrap"><svg class="pt-canvas" viewBox="0 0 1280 540" tabindex="0" role="group" aria-label="Topologia sieci. Po wybraniu modelu Enter lub spacja dodaje urządzenie. Strzałki przesuwają urządzenie; Enter otwiera konfigurację."></svg><div class="pt-empty-note">${esc(scenario.original?'Day 6 · 2 × 2960-24TT · 4 × PC-PT':scenario.goal)}<br>Otwórz Instrukcję, aby zobaczyć zadania i adresację.</div><div class="pt-floating-hint">${scenario.original?"Zacznij od cables ⚡ lub otwórz Instrukcję.":'Otwórz Instrukcję. Kliknij urządzenie, aby rozpocząć konfigurację.'}</div></div>
      <aside class="pt-sim-panel pt-hidden" aria-label="Panel symulacji"><div class="pt-sim-head">Simulation Panel <button data-action="hide-sim" aria-label="Zwiń panel symulacji">Zwiń ›</button></div><div class="pt-sim-head" style="font-size:11px;background:#f1f5f8">Event List <span id="ptPending">0 w kolejce</span></div><div class="pt-event-scroll"><table class="pt-events"><thead><tr><th>Time</th><th>Last</th><th>At Device</th><th>Type</th></tr></thead><tbody id="ptEventRows"></tbody></table></div><div class="pt-sim-controls"><button data-action="step" class="pt-primary">Capture / Forward</button><button data-action="play">Auto Capture / Play</button><button data-action="clear-events">Wyczyść zdarzenia</button><label><input type="checkbox" data-filter="ARP" checked> ARP</label>${['ICMP','NDP','ICMPv6','TCP','UDP','DHCP','DNS','HTTP','SNMP','SYSLOG','TFTP'].map(p=>`<label><input type="checkbox" data-filter="${p}" checked> ${p}</label>`).join('')}<small>Kliknij zdarzenie, aby sprawdzić OSI i pola frame.</small></div></aside></div>
      <div class="pt-realtime"><span id="ptTime">Time: 00:00.000</span><button data-action="advance" title="Przesuń czas symulacji o 300 sekund" aria-label="Przesuń czas o 300 sekund">${icons.step}</button><span class="pt-grow"></span><button data-action="realtime" role="tab" aria-selected="true">${icons.clock}Realtime</button><button data-action="simulation" role="tab" aria-selected="false">${icons.envelope}Simulation</button></div>
      <div class="pt-dock"><div class="pt-categories"><div class="pt-category-row"><button data-category="switch" title="Network Devices" aria-label="Network Devices" aria-pressed="true">${deviceIcon('switch')}</button><button data-category="pc" title="End Devices" aria-label="End Devices" aria-pressed="false">${deviceIcon('pc')}</button><button data-category="cable" title="Connections" aria-label="Connections" aria-pressed="false">${icons.cable}</button></div><select class="pt-kind" aria-label="Kategoria urządzeń"><option value="switch">Switche</option><option value="router">Routery</option><option value="pc">Komputery</option><option value="server">Servers</option><option value="hub">Hubs</option><option value="ap">Access points (APs)</option><option value="wlc">Kontrolery WLAN</option><option value="cable">Połączenia</option></select><input class="pt-search" type="search" placeholder="Search for device" aria-label="Szukaj urządzenia"><span id="ptCategoryName">Network Devices · Switches</span></div><div class="pt-palette" aria-label="Paleta urządzeń"></div><div class="pt-pdu-panel"><div class="pt-pdu-title">Scenario 0 <span class="pt-grow"></span><button data-action="pdu">+ Simple PDU</button><button data-action="clear-events">Clear</button></div><table class="pt-pdu-table"><thead><tr><th>Last Status</th><th>Source</th><th>Destination</th><th>Type</th><th>Replies</th></tr></thead><tbody id="ptPduRows"><tr><td colspan="5">Brak PDU. Użyj koperty lub polecenia ping na PC.</td></tr></tbody></table></div></div>
      <div class="pt-footer"><span role="status" id="ptStatus">Gotowe. Kliknij urządzenie, aby otworzyć jego okno.</span><span><kbd>Esc</kbd> anuluj narzędzie · <kbd>?</kbd> pomoc w CLI</span></div><input class="pt-import" type="file" accept=".json,application/json" aria-label="Plik laboratorium">`;
    target.appendChild(root);
    const $ = sel => root.querySelector(sel), canvas = $('.pt-canvas');
    const terminals = new Map(); let mode = 'select', category = 'switch', cableType = 'straight', pending = null, simulation = false, view = 'logical', zoom = 1, timer = null, selected = null, currentEvent = null, dialog = null, terminalOutput = null, terminalInput = null, activeTerminal = null, saveTimer = null, dead = false;
    let historyIndex = 0, drag = null, ignoreClick = false, lastAnimatedEvent = null;
    function status(text) { $('#ptStatus').textContent = text; }
    function persist() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { if (dead) return; try { const saved = options.save?.(net.snapshot()); $('#ptSaveStatus').textContent = saved ? 'Zapis lokalny · synchronizacja' : 'Sesja lokalna · zapisz do pliku'; } catch { $('#ptSaveStatus').textContent = 'Błąd zapisu · zapisz do pliku'; } }, 250);
    }
    function term(id) { if (!terminals.has(id)) terminals.set(id, new E.Terminal(net, id)); return terminals.get(id); }
    function stop() { if (timer) clearInterval(timer); timer = null; $('[data-action="play"]').textContent = 'Auto Capture / Play'; }
    function point(event) { const p = canvas.createSVGPoint(); p.x = event.clientX; p.y = event.clientY; return p.matrixTransform(canvas.getScreenCTM().inverse()); }
    function displayPosition(d, i) { if(view==='logical')return{x:d.x,y:d.y};const infrastructure=net.state.devices.filter(x=>E.isIOS(x)),si=infrastructure.indexOf(d),hosts=net.state.devices.filter(x=>!E.isIOS(x)),hi=hosts.indexOf(d);return si>=0?{x:240+Math.floor(si/4)*150,y:140+(si%4)*95}:{x:650+(hi%3)*180,y:150+Math.floor(hi/3)*180}; }
    function draw() {
      const positions = new Map(net.state.devices.map((d, i) => [d.id, displayPosition(d, i)]));
      let html = view === 'physical' ? '<rect x="150" y="70" width="220" height="425" rx="6" fill="#f0f3f6" stroke="#a8b7c5"/><rect x="167" y="99" width="185" height="370" fill="#d9e1e8" stroke="#8fa0b0"/><text x="260" y="91" text-anchor="middle" font-family="Arial" font-size="12" fill="#50697f">Wiring Closet · Rack 0</text><text x="860" y="61" text-anchor="middle" font-family="Arial" font-size="13" fill="#50697f">Biuro · komputery</text>' : '';
      for (const l of net.state.links) {
        const a = positions.get(l.a.device), b = positions.get(l.b.device), state = net.status(l), dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        const x1 = a.x + ux * 53, y1 = a.y + uy * 38, x2 = b.x - ux * 53, y2 = b.y - uy * 38;
        html += `<g data-link="${l.id}" tabindex="0" role="button" aria-label="Cable ${esc(l.a.device)} ${E.shortPort(l.a.port)} do ${esc(l.b.device)} ${E.shortPort(l.b.port)}: ${esc(state.reason)}"><title>${esc(l.a.device+' '+l.a.port+' ↔ '+l.b.device+' '+l.b.port+' · '+state.reason)}</title><path class="pt-wire-hit" d="M${x1},${y1}L${x2},${y2}"/><path class="pt-wire" d="M${x1},${y1}L${x2},${y2}" ${l.type==='cross'?'stroke-dasharray="7 4"':''}/>${[[x1+ux*12,y1+uy*12,l.a],[x2-ux*12,y2-uy*12,l.b]].map(([x,y,end])=>`<polygon points="${x-4},${y-4} ${x+4},${y-4} ${x},${y+5}" fill="${!state.up?'#db4242':net.device(end.device).type==='switch'&&net.spanning(net.device(end.device).ports[end.port].vlan)[end.device]?.ports[end.port]?.state==='BLK'?'#e4a321':'#1ca254'}"/>`).join('')}<text class="pt-port-label" x="${x1+ux*29+uy*8}" y="${y1+uy*29-ux*8}" text-anchor="middle">${E.shortPort(l.a.port)}</text><text class="pt-port-label" x="${x2-ux*29+uy*8}" y="${y2-uy*29-ux*8}" text-anchor="middle">${E.shortPort(l.b.port)}</text></g>`;
      }
      for (const d of net.state.devices) {
        const p = positions.get(d.id);
        html += `<g class="pt-node ${selected===d.id?'pt-picked':''}" data-device="${d.id}" transform="translate(${p.x},${p.y})" tabindex="0" role="button" aria-label="${d.id} — ${d.model}. Otwórz konfigurację"><rect class="pt-node-halo" x="-60" y="-43" width="120" height="115" rx="8"/><g opacity="${d.power?1:.35}">${deviceArt(d.type)}</g><text y="49" text-anchor="middle">${esc(d.hostname)}</text><text y="64" text-anchor="middle" class="pt-model">${esc(hostDevice(d)?(d.ip||d.model):d.model)}</text>${!d.power?'<text y="-31" text-anchor="middle" fill="#b43a3a">Power OFF</text>':''}</g>`;
      }
      if (currentEvent && positions.has(currentEvent.to)) {
        const p = positions.get(currentEvent.to), from = positions.get(currentEvent.from);
        const animate = from && lastAnimatedEvent !== currentEvent.id && simulation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        html += `<g transform="translate(${p.x+36},${p.y-41})" data-event-envelope="${currentEvent.id}" tabindex="0" role="button" aria-label="Szczegóły ostatniego PDU">${animate?`<animateTransform attributeName="transform" type="translate" from="${from.x+36} ${from.y-41}" to="${p.x+36} ${p.y-41}" dur="0.3s" fill="freeze"/>`:''}<rect width="26" height="18" rx="2" fill="${currentEvent.protocol==='ARP'?'#b774d3':'#119abc'}" stroke="#29394a"/><path d="m1 2 12 8 12-8" stroke="white" fill="none"/></g>`;
        lastAnimatedEvent = currentEvent.id;
      }
      canvas.innerHTML = html;
      canvas.classList.toggle('pt-mode-delete', mode === 'delete'); canvas.classList.toggle('pt-mode-cable', mode === 'cable');
      canvas.setAttribute('viewBox', `${640-640/zoom} ${270-270/zoom} ${1280/zoom} ${540/zoom}`);
      const checks = net.checks(); $('#ptScore').textContent = checks.filter(x=>x.ok).length + '/' + checks.length;
      $('#ptTime').textContent = 'Time: ' + new Date(net.state.clock*1000).toISOString().slice(14,23);
    }
    function palette() {
      const names = {switch:'Switches',router:'Routers',pc:'End Devices',server:'Servers',hub:'Hubs',ap:'Wireless APs',wlc:'Wireless Controllers',cable:'Connections'};
      $('#ptCategoryName').textContent = names[category]; $('.pt-kind').value=category;
      root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
      const q=$('.pt-search').value.toLowerCase();
      const cables=[['straight','Copper Straight-Through'],['cross','Copper Cross-Over'],['fiber','Fiber · profil GE'],['serial','Serial DCE / DTE'],['console','Console'],['wireless','Wireless association']];
      $('.pt-palette').innerHTML = category === 'cable' ? cables.filter(([,label])=>label.toLowerCase().includes(q)).map(([type,label])=>`<button data-cable="${type}" aria-pressed="${mode==='cable'&&cableType===type}"><span class="pt-cable-preview ${type}"></span>${label}</button>`).join('') : E.profiles.filter(p=>(q || p.type===category)&&p.id.toLowerCase().includes(q)).map(p=>`<button data-add="${p.id}" draggable="true" title="${p.ports.length} portów w profilu symulacji">${deviceIcon(p.type)}${p.id}<small>${p.ports.length} portów · ${p.multilayer?'L3':p.type}</small></button>`).join('');
    }
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    function setMode(m) {
      mode=m; pending=null; selected=null;
      root.querySelectorAll('.pt-toolbar [aria-pressed]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===m || b.dataset.action==='cables'&&m==='cable')));
      const hint = m==='delete'?"Kliknij urządzenie lub cable, który chcesz usunąć.":m==='cable'?'Wybierz pierwsze urządzenie i port.':m==='pdu'?'Kliknij komputer źródłowy, a potem docelowy.':m.startsWith('add-')?'Kliknij puste miejsce lub przejdź do topologii i naciśnij Enter, aby dodać urządzenie.':'Przeciągnij urządzenie lub kliknij, aby je skonfigurować.';
      $('.pt-floating-hint').textContent=hint;status(hint);draw();palette();
    }
    function closeDialog() { if(dialog){dialog.close();dialog.remove();dialog=null;} terminalOutput=null;terminalInput=null;activeTerminal=null; }
    function modal(title, body, small=false) {
      closeDialog(); dialog=document.createElement('dialog');dialog.className='pt-dialog'+(small?' pt-small':'');dialog.setAttribute('aria-label',title);
      dialog.innerHTML=`<div class="pt-dialog-title"><strong>${esc(title)}</strong><button data-close-dialog aria-label="Zamknij okno">×</button></div>${body}`;
      root.appendChild(dialog);dialog.querySelector('[data-close-dialog]').onclick=closeDialog;dialog.addEventListener('cancel',()=>{terminalOutput=null;terminalInput=null;activeTerminal=null;});dialog.showModal();return dialog;
    }
    function confirmAction(title, message, callback) {
      const d=modal(title,`<div class="pt-dialog-body"><p>${esc(message)}</p><div class="pt-action-row"><button class="pt-primary" data-confirm>Potwierdź</button><button data-cancel>Anuluj</button></div></div>`,true);
      d.querySelector('[data-confirm]').onclick=()=>{closeDialog();callback();};d.querySelector('[data-cancel]').onclick=closeDialog;
    }
    function portPicker(id) {
      const d=net.device(id),first=pending;
      const shared=p=>d.type==='ap'&&d.ports[p].kind==='wireless';
      const win=modal(d.id+' — wybierz port',`<div class="pt-dialog-body"><p>${first?'Drugi koniec: '+esc(first.device)+' '+E.shortPort(first.port):"Pierwszy koniec cable"}</p><div class="pt-port-choose">${Object.keys(d.ports).filter(p=>d.ports[p].kind===(cableType==='console'?'console':cableType==='serial'?'serial':cableType==='wireless'?'wireless':'ethernet')).map(p=>`<button data-port="${p}" ${net.linkAt(id,p)&&!shared(p)?'disabled':''}>${esc(p)}<small>${shared(p)?'Radio · wielu klientów':net.linkAt(id,p)?'Zajęty':'Wolny'}</small></button>`).join('')}</div></div>`,true);
      win.querySelectorAll('[data-port]').forEach(b=>b.onclick=()=>{
        const port=b.dataset.port;closeDialog();
        if(!first){pending={device:id,port};selected=id;status("Wybierz drugi koniec cable.");$('.pt-floating-hint').textContent=id+' '+E.shortPort(port)+' → wybierz drugie urządzenie';draw();}
        else {try{const link=net.connect(first.device,first.port,id,port,cableType);setMode('select');status('Połączono. '+net.status(link).reason);persist();refreshEvents();}catch(e){pending=null;status(e.message);$('.pt-floating-hint').textContent=e.message;}draw();}
      });
    }
    function nodeClick(id) {
      selected=id;
      if(mode==='delete'){confirmAction('Usuń urządzenie',`Usunąć ${id} i podłączone do niego cables?`,()=>{stop();net.remove(id);draw();refreshEvents();persist();});return;}
      if(mode==='cable'){portPicker(id);return;}
      if(mode==='pdu'){
        const d=net.device(id);if(!hostDevice(d)&&!E.isIOS(d)){status("Wybierz urządzenie z IP address.");return;}
        if(!pending){pending={device:id};$('.pt-floating-hint').textContent=id+' → wybierz komputer docelowy';draw();return;}
        if(pending.device===id){status('Wybierz inny komputer.');return;}
        const from=pending.device;setMode('select');try{const t=net.startPing(from,d.ip||net.interfaces(d)[0]?.ip,1);if(!simulation)net.run();status(simulation?'PDU gotowe. Użyj Capture / Forward.':t.status==='Successful'?'PDU dostarczone.':'PDU niedostarczone. Sprawdź połączenia i IP.');refreshEvents();draw();persist();}catch(e){status(e.message);}return;
      }
      if(mode.startsWith('add-'))setMode('select');showDevice(id);
    }
    function terminalRefresh() {
      if(!terminalOutput || !activeTerminal)return;
      const t=activeTerminal;const text=t.lines.map(l=>typeof l==='string'?l:'Pinging '+l.ping.target+' with 32 bytes of data:\n'+l.ping.lines.join('\n')+(l.ping.status==='W toku'?'\n[Simulation: użyj Capture / Forward]':'\n\nPing statistics for '+l.ping.target+':\n    Packets: Sent = '+l.ping.count+', Received = '+l.ping.replies+', Lost = '+(l.ping.count-l.ping.replies)+' ('+Math.round((1-l.ping.replies/l.ping.count)*100)+'% loss)')).join('\n');
      terminalOutput.textContent=text;terminalOutput.scrollTop=terminalOutput.scrollHeight;
      const label=dialog?.querySelector('.pt-terminal-form label');if(label)label.textContent=t.prompt();if(terminalInput){terminalInput.disabled=!t.d.power;terminalInput.type=t.secretInput?'password':'text';}
    }
    function showTerminal(id, container) {
      const t=term(id);activeTerminal=t;historyIndex=t.history.length;
      if(!t.lines.length)t.lines.push(hostDevice(t.d)?'PC Command Line':'IOS CLI · '+t.d.model+'\nWpisz ?, aby wyświetlić dostępne polecenia.');
      container.innerHTML=`<div class="pt-terminal"><pre class="pt-terminal-output" aria-label="Wynik poleceń"></pre><form class="pt-terminal-form"><label for="ptCommand"></label><input id="ptCommand" aria-label="Polecenie ${id}" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="submit">Enter</button></form></div><p class="pt-terminal-help">Enter: wykonaj · ↑/↓: historia · Tab: podpowiedź · Ctrl+Z: tryb EXEC</p>`;
      terminalOutput=container.querySelector('.pt-terminal-output');terminalInput=container.querySelector('input');
      container.querySelector('form').onsubmit=event=>{
        event.preventDefault();const raw=terminalInput.value;terminalInput.value='';const before=t.prompt();t.lines.push(before+(t.secretInput?'':raw));
        try{const result=t.execute(raw);if(result?.ping){t.lines.push(result);if(!simulation)runRealtimePing();}else if(result)t.lines.push(result);}catch(e){t.lines.push(e.message);}
        t.lines=t.lines.slice(-250);historyIndex=t.history.length;terminalRefresh();refreshEvents();draw();persist();terminalInput?.focus();
      };
      terminalInput.addEventListener('paste',e=>{const text=e.clipboardData?.getData('text')||'';if(!/[\r\n]/.test(text))return;e.preventDefault();for(const raw of text.replace(/\r/g,'').split('\n').slice(0,300)){if(!raw&&!t.pending)continue;const before=t.prompt();t.lines.push(before+(t.secretInput?'':raw));try{const result=t.execute(raw);if(result?.ping){t.lines.push(result);if(!simulation)net.run();}else if(result)t.lines.push(result);if(typeof result==='string'&&/^% (Invalid|Ambiguous|Incomplete|Access denied)/.test(result))break;}catch(error){t.lines.push(error.message);break;}}t.lines=t.lines.slice(-250);historyIndex=t.history.length;terminalRefresh();refreshEvents();draw();persist();});
      terminalInput.onkeydown=e=>{
        if(t.secretInput&&!(e.ctrlKey&&['c','z'].includes(e.key.toLowerCase())))return;
        if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.max(0,Math.min(t.history.length,historyIndex+(e.key==='ArrowUp'?-1:1)));terminalInput.value=t.history[historyIndex]||'';}
        if(e.key==='Tab'){e.preventDefault();terminalInput.value=t.complete(terminalInput.value);}
        if(e.key==='?'){e.preventDefault();t.lines.push(t.prompt()+terminalInput.value+'?',t.help(terminalInput.value));terminalRefresh();}
        if(e.ctrlKey&&e.key.toLowerCase()==='c'){e.preventDefault();t.pending=null;t.pendingCopy=false;terminalInput.value='';terminalRefresh();}
        if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();if(E.isIOS(t.d)){t.mode='privileged';t.pending=null;};terminalRefresh();}
      };
      terminalRefresh();terminalInput.focus();
    }
    function showDevice(id, tab) {
      const d=net.device(id);if(!d)return;tab=tab||(hostDevice(d)?'Desktop':E.isIOS(d)?'CLI':d.type==='wlc'?'GUI':'Config');
      const tabs=hostDevice(d)?['Physical','Config','Desktop',...(d.type==='server'?['Services']:[])]:E.isIOS(d)?['Physical','Config','CLI']:d.type==='wlc'?['Physical','Config','GUI']:['Physical','Config'];
      const win=modal(d.hostname+' — '+d.model,`<div class="pt-dialog-tabs" role="tablist">${tabs.map(t=>`<button role="tab" data-tab="${t}" aria-selected="${tab===t}">${t}</button>`).join('')}</div><div class="pt-dialog-body" id="ptDeviceBody"></div>`);
      win.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showDevice(id,b.dataset.tab));const body=win.querySelector('#ptDeviceBody');
      if(tab==='Services'){serviceForm(id,body);return;}
      const changed=()=>{draw();refreshEvents();persist();};
      if(d.type==='wlc'&&['GUI','Config'].includes(tab)){window.CcnaWlcUI.mount(net,id,body,changed,tab==='Config'?'interfaces':'monitor');return;}
      if(d.type==='ap'&&tab==='Config'){if(E.get(d.model).lightweight)window.CcnaWlcUI.accessPoint(net,id,body,changed);else wirelessForm(id,body);return;}
      if(tab==='CLI'){showTerminal(id,body);return;}
      if(tab==='Desktop'){
        body.innerHTML=`<div class="pt-desktop"><button data-desktop="ip">${icons.config}IP Configuration</button><button data-desktop="command">${icons.terminal}Command Prompt</button><button data-desktop="browser">${icons.logical}Web Browser</button>${d.ports.Wireless0?`<button data-desktop="wireless">${icons.logical}Wireless</button>`:''}${d.ports.RS232?`<button data-desktop="console">${icons.terminal}Terminal (Console)</button>`:''}</div>`;
        body.querySelector('[data-desktop="command"]').onclick=()=>showTerminal(id,body);
        body.querySelector('[data-desktop="ip"]').onclick=()=>ipForm(id,body);
        body.querySelector('[data-desktop="browser"]').onclick=()=>webBrowser(id,body);
        const wireless=body.querySelector('[data-desktop="wireless"]');if(wireless)wireless.onclick=()=>wirelessForm(id,body);
        const consoleButton=body.querySelector('[data-desktop="console"]');if(consoleButton)consoleButton.onclick=()=>{const peer=net.peer(id,'RS232');if(peer&&peer.link.type==='console'&&net.status(peer.link).up)showTerminal(peer.end.device,body);else body.innerHTML="<p>Połącz RS232 z portem Console urządzenia console cable.</p>";};return;
      }
      if(tab==='Physical'){
        body.innerHTML=`<h3>Physical Device View</h3><label class="pt-field"><span>Zasilanie (Power)</span><input type="checkbox" id="ptPower" ${d.power?'checked':''}></label><div class="pt-chassis"><strong>${esc(d.model)}</strong><div class="pt-port-grid">${Object.keys(d.ports).filter(p=>!['svi','loopback','subinterface','portchannel'].includes(d.ports[p].kind)).map(p=>{const l=net.linkAt(id,p);return `<button data-physical-port="${p}" class="${l?(net.status(l).up?'pt-port-up':'pt-port-down'):''}" title="${p}">${E.shortPort(p)}</button>`;}).join('')}</div></div><p class="pt-disclaimer">Porty i diody pokazują stan połączeń profilu symulacji. Po restarcie urządzenie IOS wczytuje startup-config. Dostępne moduły instaluj przy wyłączonym zasilaniu.</p>`;
        if(E.get(d.model).module&&!d.modules.length){const b=document.createElement('button');b.textContent='Zainstaluj '+E.get(d.model).module;b.className='pt-primary';b.onclick=()=>{try{net.addModule(id);persist();showDevice(id,'Physical');}catch(e){status(e.message);body.querySelector('.pt-disclaimer').textContent=e.message;}};body.appendChild(b);}
        body.querySelector('#ptPower').onchange=ev=>{const value=ev.target.checked;const apply=()=>{stop();net.power(id,value);terminals.delete(id);draw();refreshEvents();persist();showDevice(id,'Physical');};if(!value&&E.isIOS(d)){ev.target.checked=true;confirmAction('Wyłącz '+id,"Niezapisana konfiguracja switcha i jego MAC address table zostaną utracone. Kontynuować?",apply);}else apply();};
        body.querySelectorAll('[data-physical-port]').forEach(b=>b.onclick=()=>showDevicePort(id,b.dataset.physicalPort));return;
      }
      if(hostDevice(d)){ipForm(id,body);return;}
      body.innerHTML=`<label class="pt-field"><span>Display Name / Hostname</span><input id="ptHostname" value="${esc(d.hostname)}" maxlength="32"></label><label class="pt-field"><span>Interface</span><select id="ptPort">${Object.keys(d.ports).map(p=>`<option>${p}</option>`).join('')}</select></label><div id="ptPortForm"></div>`;
      body.querySelector('#ptHostname').onchange=ev=>{if(/^[A-Za-z][\w-]{0,31}$/.test(ev.target.value)){d.hostname=ev.target.value;draw();persist();}else{ev.target.value=d.hostname;status('Nazwa musi zaczynać się literą i zawierać do 32 znaków.');}};
      const portSelect=body.querySelector('#ptPort');portSelect.onchange=()=>portForm(id,portSelect.value,body.querySelector('#ptPortForm'));portSelect.onchange();
    }
    function showDevicePort(id, port) { if(net.device(id).ports[port].kind==='console'){showDevice(id,E.isIOS(net.device(id))?'CLI':'Desktop');return;}showDevice(id,'Config');const sel=dialog?.querySelector('#ptPort');if(sel){sel.value=port;sel.onchange();} }
    function portForm(id, port, body) {
      const d=net.device(id), p=d.ports[port], l=net.linkAt(id,port);
      const switching=d.type==='switch'&&E.dataPort(p), routed=d.type==='router'||p.kind==='svi'||p.mode==='routed';
      body.innerHTML=`<form id="ptPortConfig"><label class="pt-field"><span>Port Status: On</span><input name="enabled" type="checkbox" ${p.enabled?'checked':''}></label><label class="pt-field"><span>Description</span><input name="description" value="${esc(p.description)}"></label><label class="pt-field"><span>Auto MDI-X</span><input name="autoMdix" type="checkbox" ${p.autoMdix?'checked':''}></label><label class="pt-field"><span>Speed</span><select name="speed">${['auto','10','100',...(/^Gigabit/.test(port)?['1000']:[])].map(v=>`<option ${p.speed===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="pt-field"><span>Duplex</span><select name="duplex">${['auto','full','half'].map(v=>`<option ${p.duplex===v?'selected':''}>${v}</option>`).join('')}</select></label>${switching?`<label class="pt-field"><span>Switchport mode</span><select name="mode">${['access','trunk','dynamic auto','dynamic desirable',...(E.get(d.model).multilayer?['routed']:[])].map(v=>`<option ${p.mode===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="pt-field"><span>Access VLAN</span><input name="vlan" type="number" min="1" max="4094" value="${p.vlan}"></label><label class="pt-field"><span>Native VLAN</span><input name="native" type="number" min="1" max="4094" value="${p.native}"></label><label class="pt-field"><span>Allowed VLANs</span><input name="allowed" value="${esc(p.allowed)}" placeholder="all lub 10,20,30-40"></label>`:''}${routed?`<label class="pt-field"><span>IPv4 Address</span><input name="ip" value="${esc(p.ip)}"></label><label class="pt-field"><span>Subnet Mask</span><input name="mask" value="${esc(p.mask)}" placeholder="255.255.255.0"></label><label class="pt-field"><span>IPv6 / prefix</span><input name="ipv6" value="${esc(p.ipv6)}" placeholder="2001:db8:1::1/64"></label>`:''}<button class="pt-primary" type="submit">Zastosuj port</button><p class="pt-form-status" role="status">${l?esc(net.status(l).reason):"Brak cable"}</p></form><p class="pt-disclaimer">Pełna lista zaimplementowanych ustawień jest dostępna w CLI przez ?. Parametry wpływają na połączenia i ruch.</p>`;
      const form=body.querySelector('form');form.onsubmit=e=>{e.preventDefault();const f=new FormData(form),patch={enabled:form.elements.enabled.checked,autoMdix:form.elements.autoMdix.checked,description:f.get('description'),speed:f.get('speed'),duplex:f.get('duplex')};try{if(switching){Object.assign(patch,{mode:f.get('mode'),vlan:Number(f.get('vlan')),native:Number(f.get('native')),allowed:f.get('allowed').trim()});if(patch.native<1||patch.native>4094||!Number.isInteger(patch.native))throw new Error('Native VLAN: 1–4094.');if(!/^(all|none|[0-9]+(-[0-9]+)?(,[0-9]+(-[0-9]+)?)*)$/.test(patch.allowed))throw new Error('Nieprawidłowa lista allowed VLANs.');if(!d.vlans[patch.vlan]){if(d.vtp.mode==='client')throw new Error('VLAN nie istnieje na kliencie VTP.');d.vlans[patch.vlan]={name:'VLAN'+patch.vlan};d.vtp.revision++;}}if(routed){Object.assign(patch,{ip:f.get('ip').trim(),mask:f.get('mask').trim(),ipv6:f.get('ipv6').trim()});if(patch.ipv6&&!E.parse6(patch.ipv6))throw new Error('Nieprawidłowy prefiks IPv6.');}net.setPort(id,port,patch);draw();refreshEvents();persist();body.querySelector('.pt-form-status').textContent='Zapisano port. '+(l?net.status(l).reason:'');}catch(error){body.querySelector('.pt-form-status').textContent=error.message;}};
    }
    function ipForm(id,body) {
      const d=net.device(id),port=net.hostPort(d)||'FastEthernet0',p=d.ports[port];
      body.innerHTML=`<h3>IP Configuration · ${esc(port)}</h3><div class="pt-action-row"><button id="ptDhcp" type="button">DHCP</button><span>IPv4 · Static</span></div><form id="ptIPForm"><label class="pt-field"><span>IPv4 Address</span><input name="ip" value="${esc(d.ip)}" inputmode="decimal" placeholder="10.0.10.11"></label><label class="pt-field"><span>Subnet Mask</span><input name="mask" value="${esc(d.mask)}" inputmode="decimal"></label><label class="pt-field"><span>Default Gateway</span><input name="gateway" value="${esc(d.gateway)}" inputmode="decimal" placeholder="Gateway lub puste"></label><label class="pt-field"><span>DNS Server</span><input name="dns" value="${esc(d.dns)}" inputmode="decimal"></label><label class="pt-field"><span>IPv6 / prefix</span><input name="ipv6" value="${esc(d.ipv6)}" placeholder="2001:db8:1::11/64"></label><label class="pt-field"><span>IPv6 Gateway</span><input name="ipv6Gateway" value="${esc(d.ipv6Gateway)}"></label><p>Physical Address: <code>${d.mac}</code></p><label class="pt-field"><span>Port Status: On</span><input type="checkbox" name="enabled" ${p.enabled?'checked':''}></label><label class="pt-field"><span>Speed</span><select name="speed">${['auto','10','100'].map(v=>`<option ${p.speed===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="pt-field"><span>Duplex</span><select name="duplex">${['auto','full','half'].map(v=>`<option ${p.duplex===v?'selected':''}>${v}</option>`).join('')}</select></label><div class="pt-action-row"><button class="pt-primary" type="submit">Zastosuj</button><button type="button" id="ptOpenCommand">Command Prompt</button></div><p class="pt-form-status" role="status"></p></form>`;
      const form=body.querySelector('form');form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);try{const v6=f.get('ipv6').trim(),gw6=f.get('ipv6Gateway').trim();if(v6&&!E.parse6(v6)||gw6&&E.ipv6(gw6)===null)throw new Error("Nieprawidłowy IPv6 lub gateway IPv6.");if(f.get('ip').trim())net.configurePC(id,f.get('ip').trim(),f.get('mask').trim(),f.get('gateway').trim(),f.get('dns').trim());else if(!v6)throw new Error('Podaj IPv4 lub IPv6.');else Object.assign(d,{ip:'',gateway:'',dns:f.get('dns').trim()});Object.assign(d,{ipv6:v6,ipv6Gateway:gw6,addressMethod:'static',ipv6Method:'static',slaac:null});net.setPort(id,port,{enabled:form.elements.enabled.checked,speed:f.get('speed'),duplex:f.get('duplex')});body.querySelector('.pt-form-status').textContent='Zapisano konfigurację IP.';draw();refreshEvents();persist();}catch(error){body.querySelector('.pt-form-status').textContent=error.message;}};
      body.querySelector('#ptDhcp').onclick=()=>{try{const message=net.dhcp(id);ipForm(id,body);body.querySelector('.pt-form-status').textContent=message;draw();refreshEvents();persist();}catch(error){body.querySelector('.pt-form-status').textContent=error.message;}};
      const auto=document.createElement('div');auto.className='pt-action-row';auto.innerHTML='<button id="ptSlaac" type="button">IPv6 Auto Config (SLAAC)</button><span>IPv6 · '+esc(d.ipv6Method)+'</span>';form.querySelector('input[name="ipv6"]').closest('label').before(auto);
      const ll=document.createElement('p');ll.textContent='Link-local IPv6: '+net.linkLocal(d,port);auto.after(ll);
      auto.querySelector('button').onclick=()=>{try{const message=net.autoconfigure6(id);ipForm(id,body);body.querySelector('.pt-form-status').textContent=message;draw();refreshEvents();persist();}catch(error){body.querySelector('.pt-form-status').textContent=error.message;}};
      body.querySelector('#ptOpenCommand').onclick=()=>showTerminal(id,body);
    }
    function webBrowser(id,body){
      body.innerHTML='<h3>Web Browser</h3><form class="pt-browser-bar"><input id="ptBrowserUrl" aria-label="Adres strony w laboratorium" placeholder="https://10.0.10.2" value="https://"><button id="ptBrowse" type="submit">Go</button></form><p class="pt-form-status" role="status"></p><div id="ptBrowserPage"></div>';
      const form=body.querySelector('form'),content=body.querySelector('#ptBrowserPage'),message=body.querySelector('[role="status"]');
      form.onsubmit=event=>{event.preventDefault();try{const raw=form.querySelector('input').value.trim(),url=new URL(/^https?:\/\//i.test(raw)?raw:'http://'+raw);if(!['http:','https:'].includes(url.protocol))throw new Error('Użyj http:// lub https://.');const host=net.device(id),address=E.ipv4(url.hostname)!==null?url.hostname:net.resolve(host,url.hostname),controller=net.state.devices.find(d=>d.type==='wlc'&&d.ip===address);if(controller){if(!controller.power||!net.udpExchange(id,address,{protocol:'tcp',srcPort:49152,dstPort:url.protocol==='https:'?443:80}))throw new Error('WLC nieosiągalny. Sprawdź IP, VLAN, routing, ACL i zasilanie.');message.textContent='Połączono z '+address;window.CcnaWlcUI.mount(net,controller.id,content,()=>{draw();refreshEvents();persist();});}else{net.serviceRequest(id,url.hostname,'http');content.innerHTML='<h3>HTTP 200 OK</h3><p>Usługa HTTP w sieci laboratorium odpowiada.</p>';message.textContent='Połączono.';}refreshEvents();persist();}catch(error){content.innerHTML='';message.textContent=error.message;}};
    }
    function wirelessForm(id,body){
      const d=net.device(id),w=d.wireless;
      body.innerHTML=`<h3>Wireless · ${esc(d.model)}</h3><form><label class="pt-field"><span>SSID</span><input name="ssid" value="${esc(w.ssid)}" maxlength="32" required></label><label class="pt-field"><span>Security</span><select name="security"><option value="open" ${w.security==='open'?'selected':''}>Open</option><option value="wpa2" ${w.security==='wpa2'?'selected':''}>WPA2-PSK</option></select></label><label class="pt-field"><span>Pre-shared key</span><input name="key" value="${esc(w.key)}" type="password"></label><label class="pt-field"><span>Channel</span><select name="channel">${[1,6,11].map(n=>`<option ${n===w.channel?'selected':''}>${n}</option>`).join('')}</select></label><button class="pt-primary" type="submit">Zastosuj WLAN</button><p role="status" class="pt-form-status"></p></form><p class="pt-disclaimer">Model kojarzenia klienta z AP po zgodnym SSID i kluczu. Łącze Wireless dodaj w palecie Połączenia między portami Wireless0. Bez modelowania zasięgu radiowego.</p>`;
      const form=body.querySelector('form');form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);if(f.get('security')==='wpa2'&&(f.get('key').length<8||f.get('key').length>63)){body.querySelector('.pt-form-status').textContent='Klucz WPA2: 8–63 znaki.';return;}Object.assign(w,{ssid:f.get('ssid'),security:f.get('security'),key:f.get('key'),channel:Number(f.get('channel'))});net.changed();draw();refreshEvents();persist();const link=net.linkAt(id,'Wireless0');body.querySelector('.pt-form-status').textContent=link?net.status(link).reason:'Zapisano profil WLAN.';};
    }
    function serviceForm(id,body){
      const d=net.device(id),services=d.services,pool=d.pools.SERVER||{};
      body.innerHTML=`<h3>Server Services</h3><form>${['dns','http','dhcp','tftp','syslog','ntp'].map(key=>`<label class="pt-field"><span>${key.toUpperCase()} · On</span><input name="${key}" type="checkbox" ${services[key]?'checked':''}></label>`).join('')}<label class="pt-field"><span>DNS: nazwa IPv4<br>jeden rekord w wierszu</span><textarea name="records" rows="4">${esc(Object.entries(services.records).map(([name,ip])=>name+' '+ip).join('\n'))}</textarea></label><details><summary>DHCP pool</summary>${[['network','Network','10.0.10.0'],['mask','Mask','255.255.255.0'],['gateway','Gateway','10.0.10.1'],['dns','DNS','10.0.10.53']].map(([key,label,placeholder])=>`<label class="pt-field"><span>${label}</span><input name="pool-${key}" value="${esc(pool[key]||'')}" placeholder="${placeholder}"></label>`).join('')}</details><button class="pt-primary" type="submit">Zapisz usługi</button><p role="status" class="pt-form-status"></p></form><h3>Pliki TFTP</h3><div class="pt-files">${Object.entries(services.files).map(([name,content])=>`<details><summary>${esc(name)}</summary><pre>${esc(content)}</pre></details>`).join('')||'<p>Brak plików.</p>'}</div><h3>Logi Syslog</h3><pre>${esc(d.logs.join('\n')||'Brak logów.')}</pre>`;
      const form=body.querySelector('form');form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);try{const records={};for(const line of f.get('records').split(/\r?\n/).filter(s=>s.trim())){const[name,ip,...rest]=line.trim().split(/\s+/);if(!/^[a-z0-9.-]+$/i.test(name)||E.ipv4(ip)===null||rest.length)throw new Error('Rekord DNS: nazwa i poprawny IPv4.');records[name]=ip;}const poolNext={};for(const key of ['network','mask','gateway','dns'])poolNext[key]=f.get('pool-'+key).trim();if(form.elements.dhcp.checked&&(E.ipv4(poolNext.network)===null||E.prefix(poolNext.mask)<1||E.ipString(E.ipv4(poolNext.network)&E.ipv4(poolNext.mask))!==poolNext.network))throw new Error("DHCP wymaga poprawnej sieci i subnet mask.");for(const key of ['dns','http','dhcp','tftp','syslog','ntp'])services[key]=form.elements[key].checked;services.records=records;if(poolNext.network)d.pools.SERVER=poolNext;net.changed();persist();draw();body.querySelector('.pt-form-status').textContent="Zapisano usługi server.";}catch(error){body.querySelector('.pt-form-status').textContent=error.message;}};
    }
    function refreshEvents() {
      const allowed=new Set([...root.querySelectorAll('[data-filter]:checked')].map(el=>el.dataset.filter));
      $('#ptEventRows').innerHTML=net.events.filter(e=>allowed.has(e.protocol)).map(e=>`<tr data-event="${e.id}" class="${currentEvent?.id===e.id?'pt-current':''}"><td>${e.time.toFixed(3)}</td><td>${esc(e.from)}</td><td><button data-event-button="${e.id}" aria-label="Szczegóły PDU ${e.id} w ${e.to}">${esc(e.to)}</button></td><td><span class="pt-protocol ${e.protocol.toLowerCase()}"></span>${e.protocol}</td></tr>`).join('');
      const area=$('.pt-event-scroll');area.scrollTop=area.scrollHeight;$('#ptPending').textContent=net.queue.length+' w kolejce';
      $('#ptPduRows').innerHTML=net.tests.length?net.tests.map(t=>`<tr><td>${esc(t.status)}</td><td>${esc(t.source)}</td><td>${esc(t.target)}</td><td>${esc(t.service||t.protocol?.toUpperCase()||'ICMP')}</td><td>${t.replies}/${t.count}</td></tr>`).join(''):'<tr><td colspan="5">Brak PDU. Użyj koperty lub polecenia ping na PC.</td></tr>';
      $('[data-action="step"]').disabled=!net.queue.length;$('[data-action="play"]').disabled=!net.queue.length&&!timer;terminalRefresh();
    }
    function step() { currentEvent=net.step();if(currentEvent)status(currentEvent.to+': '+currentEvent.detail);draw();refreshEvents();terminalRefresh();persist();if(!net.queue.length)stop(); }
    function runRealtimePing() { stop();terminalRefresh();timer=setInterval(step,120); }
    function switchMode(sim) { stop();simulation=sim;$('.pt-sim-panel').classList.toggle('pt-hidden',!sim);$('[data-action="realtime"]').setAttribute('aria-selected',String(!sim));$('[data-action="simulation"]').setAttribute('aria-selected',String(sim));if(!sim){net.run();currentEvent=net.events.at(-1);draw();persist();}refreshEvents(); }
    function pduDetails(event) {
      if(!event)return;net.state.evidence.observations.pdu=true;if(event.result==='Route')net.state.evidence.observations.routedPdu=true;persist();draw();
      const f=event.frame,isArp=event.protocol==='ARP',isV6=f.family===6,isNdp=event.protocol==='NDP',service=!['ARP','NDP','ICMP','ICMPv6'].includes(event.protocol),etherType=isArp?'0x0806 (ARP)':isV6?'0x86DD (IPv6)':'0x0800 (IPv4)';
      const layers={7:service?event.detail:"Brak protokołu Application layer.",6:'Nie dotyczy.',5:'Nie dotyczy.',4:service?'Transakcja usługi w modelu; nie symulujemy segmentów TCP ani datagramów UDP.':'Brak TCP/UDP. ICMP jest przenoszony bezpośrednio w IP.',3:isArp?"ARP rozwiązuje adres IPv4 na MAC. Ten frame nie zawiera IPv4 header.":`${isV6?'IPv6':'IPv4'} ${f.srcIP} → ${f.dstIP}. ${f.type}; TTL / Hop Limit ${f.ttl??128}.`,2:`Ethernet II: ${f.srcMac} → ${f.dstMac}. EtherType ${etherType}. VLAN ${f.vlan||'untagged'}.`,1:event.local?'Lokalny stos / transakcja usługi.':`${event.from} ${E.shortPort(event.outPort)} → ${event.to} ${E.shortPort(event.inPort)}.`};
      const d=modal('PDU Information at Device: '+event.to,`<div class="pt-dialog-tabs"><button data-pdu-tab="osi" aria-selected="true">OSI Model</button><button data-pdu-tab="details" aria-selected="false">Inbound PDU Details</button></div><div class="pt-dialog-body" id="ptPduBody"></div>`),body=d.querySelector('#ptPduBody');
      const show=tab=>{d.querySelectorAll('[data-pdu-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.pduTab===tab)));body.innerHTML=tab==='osi'?`<p><strong>${esc(f.type)} · ${esc(event.result)}</strong></p>${[7,6,5,4,3,2,1].map(n=>`<div class="pt-pdu-layer ${n<=(isArp?2:service?7:3)?'active':''}"><span>Layer ${n}</span><div>${esc(layers[n])}</div></div>`).join('')}<p>${esc(event.detail)}</p>`:service?`<h3>${esc(event.protocol)}</h3><p>${esc(event.detail)}</p><p>Transakcja usługi; szczegóły headers transportowych nie są modelowane.</p>`:`<h3>Ethernet II</h3><table><tbody><tr><th>Destination MAC</th><td>${esc(f.dstMac)}</td></tr><tr><th>Source MAC</th><td>${esc(f.srcMac)}</td></tr><tr><th>EtherType</th><td>${etherType}</td></tr><tr><th>802.1Q VLAN</th><td>${f.vlan||'untagged'}</td></tr></tbody></table><h3>${isArp?'ARP':isV6?'IPv6 / ICMPv6':'IPv4 / ICMP'}</h3><table><tbody><tr><th>Type</th><td>${esc(f.type)}${isArp?' ('+(f.type==='ARP Request'?1:2)+')':isNdp?' ('+(f.type.includes('Solicitation')?135:136)+')':isV6?' ('+(f.type==='ICMP Echo Request'?128:129)+')':' ('+(f.type==='ICMP Echo Request'?8:0)+')'}</td></tr><tr><th>Sender IP</th><td>${esc(f.srcIP)}</td></tr><tr><th>Target IP</th><td>${esc(f.dstIP)}</td></tr>${isArp?`<tr><th>Target MAC</th><td>${f.type==='ARP Request'?'0000.0000.0000':esc(f.dstMac)}</td></tr>`:`<tr><th>Protocol / TTL</th><td>${isV6?'58 (ICMPv6)':'1 (ICMP)'} / ${f.ttl??128}</td></tr><tr><th>DSCP</th><td>${f.dscp??0}</td></tr><tr><th>Sequence / Data</th><td>${f.seq} / 32 bytes</td></tr>`}</tbody></table><p>${esc(event.detail)}</p>`;};d.querySelectorAll('[data-pdu-tab]').forEach(b=>b.onclick=()=>show(b.dataset.pduTab));show('osi');
    }
    function instructions() {
      if(!scenario.original){modal('Instrukcja — '+scenario.title,`<div class="pt-dialog-body"><h3>${esc(scenario.goal)}</h3><ol>${scenario.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><h3>Plan adresacji</h3>${addressTable()}<h3>Kryteria zaliczenia</h3><ul>${net.checks().map(c=>`<li>${esc(c.label)}</li>`).join('')}</ul><p>Każdy temat udostępnia cały katalog i wspólne funkcje silnika. Pomoc kontekstowa CLI: ?, skróty jednoznaczne, Tab, do, Ctrl+Z. Narzędzia zawierają inwentarz, REST API i konfigurację zbiorczą.</p><p class="pt-disclaimer">${esc(scenario.scope||'Zakres obejmuje wskazane operacje konfiguracji i testy sieciowe.')} ${scopeText()}</p></div>`);return;}
      modal("Instrukcja — analiza Ethernet switching",`<div class="pt-dialog-body"><h3>Zbuduj LAN. Prześledź pierwszy ping.</h3><p>Cel: połączyć dwa switche i cztery komputery, zbadać ARP/ICMP i wyjaśnić MAC address table.</p><ol><li>Wybierz <strong>Connections → Copper Straight-Through</strong>. Kliknij PC, wybierz <strong>FastEthernet0</strong>, następnie switch i port z tabeli.</li><li>SW1 i SW2 połącz cable <strong>Copper Cross-Over</strong>. Auto MDI-X jest domyślnie włączone, więc oba cables miedziane mogą zestawić łącze na 2960.</li></ol><table><thead><tr><th>Pierwszy port</th><th>Drugi port</th></tr></thead><tbody>${E.REQUIRED.map(([a,ap,b,bp])=>`<tr><td>${a} ${E.shortPort(ap)}</td><td>${b} ${E.shortPort(bp)}</td></tr>`).join('')}</tbody></table><ol start="3"><li>Na każdym PC otwórz <strong>Desktop → IP Configuration</strong>. Przypisz PC1: <code>192.168.1.1</code>, PC2: <code>192.168.1.2</code>, PC3: <code>192.168.1.3</code>, PC4: <code>192.168.1.4</code>. Subnet mask wszędzie: <code>255.255.255.0</code>. Gateway pusta. Kliknij <strong>Zastosuj</strong>.</li><li>Włącz <strong>Simulation</strong>. Na PC1: <strong>Desktop → Command Prompt → <code>ping 192.168.1.3</code></strong>. Zamknij okno PC i używaj <strong>Capture / Forward</strong>. Koperta i lista zdarzeń pokazują aktualnie obsługiwaną frame; kliknij zdarzenie, aby otworzyć pola PDU.</li><li>Zaobserwuj broadcast ARP do PC2, PC3 i PC4, odpowiedź ARP z PC3, a następnie ICMP Echo Request/Reply. Na PC sprawdź <code>arp -a</code>.</li><li>W Realtime wykonaj na PC2 <code>ping 192.168.1.4</code>. Na obu switchach otwórz CLI i wykonaj poniższe polecenia. Najpierw odczytaj cztery MAC, potem wyczyść i ponownie sprawdź pustą tablicę.</li></ol><pre>enable\nshow mac address-table\nclear mac address-table dynamic\nshow mac address-table</pre><p>Na SW1: PC1 na Fa0/1, PC2 na Fa0/2, PC3 i PC4 na Gi0/1. Na SW2: PC3 na Fa0/1, PC4 na Fa0/2, PC1 i PC2 na Gi0/1.</p><p><strong>Sprawdź zadanie</strong> ocenia 15 kryteriów. Zmiana cables, IP, VLAN-u lub stanu portów wymaga ponowienia testów. Przesuwanie urządzeń zachowuje wyniki.</p><details><summary>Zakres tego symulatora i źródła</summary><p>${scopeText()}</p><p><a href="https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/b_1522e_2960_2960c_2960s_2960sf_2960p_cg_chapter_01000.html" target="_blank" rel="noopener">Cisco: Auto MDI-X</a> · <a href="https://contenthub.netacad.com/courses/itn-dl/_common/2.9.2-packet-tracer---basic-switch-and-end-device-configuration---physical-mode.pdf" target="_blank" rel="noopener">Cisco Networking Academy: konfiguracja switcha i hostów</a></p></details></div>`);
    }
    function scopeText(){return 'To wspólny edukacyjny model sieci, bez uruchamiania Cisco IOS. Nie obsługuje plików .pkt/.pka. Katalog zawiera 22 profile urządzeń. Pełna lista działających poleceń: CLI → ?. Zapis: JSON. Zakres protokołów jest opisany w instrukcji każdego scenariusza.';}
    function addressTable(){return `<table><thead><tr><th>Urządzenie / port</th><th>IPv4 / subnet mask</th><th>Gateway / IPv6</th></tr></thead><tbody>${net.state.devices.flatMap(d=>hostDevice(d)?[`<tr><td>${esc(d.id)}</td><td>${esc(d.ip+' / '+d.mask)}</td><td>${esc(d.gateway||d.ipv6||'—')}</td></tr>`]:net.interfaces(d).filter(i=>!i.virtual).map(i=>`<tr><td>${esc(d.id+' '+E.shortPort(i.name))}</td><td>${esc(i.ip+' /'+i.prefix)}</td><td>${esc(d.ports[i.name].ipv6||'—')}</td></tr>`)).join('')}</tbody></table>`;}
    function labPicker(){
      const win=modal('Tematy i laboratoria',`<div class="pt-dialog-body"><p>50 działów, 127 tematów i 5 dodatkowych ćwiczeń: OSPF DR/BDR, DHCP relay, pule NAT, IPv6 SLAAC oraz WLC. Każdy temat i wariant ma własny zapis; wszystkie udostępniają wspólny katalog i silnik.</p><label class="pt-field"><span>Szukaj tematu lub ćwiczenia</span><input type="search" id="ptFindLab"></label><div id="ptLabList"></div></div>`);
      const list=win.querySelector('#ptLabList');const render=()=>{const query=win.querySelector('input').value.toLowerCase();list.innerHTML=S.curriculum.map(s=>{const variants=S.extensions.filter(e=>e.section===s.id),children=s.subsections.filter(sub=>(s.title+' '+sub.title+' '+variants.map(e=>e.title).join(' ')).toLowerCase().includes(query));return children.length?`<details ${query?'open':''}><summary>${esc(s.title)} (${children.length})</summary><div class="pt-lab-links">${children.map(sub=>`<button data-lab-section="${s.id}" data-lab-sub="${sub.id}">${esc(sub.title.startsWith('Pytania certyfikacyjne')?'Laboratorium — '+s.title:sub.title)}</button>${variants.map(e=>`<button class="pt-variant" data-lab-section="${s.id}" data-lab-topic="${sub.id}" data-lab-variant="${e.key}">${esc(e.title)}<small>${esc(sub.title)}</small></button>`).join('')}`).join('')}</div></details>`:'';}).join('');list.querySelectorAll('[data-lab-sub],[data-lab-variant]').forEach(b=>b.onclick=()=>{const sid=b.dataset.labSection,subid=b.dataset.labSub||b.dataset.labTopic;dispose();options.navigate?.(sid,subid,b.dataset.labVariant);});};win.querySelector('input').oninput=render;render();
    }
    function toolsPanel(){
      const win=modal('Narzędzia laboratorium',`<div class="pt-dialog-tabs"><button data-tool="inventory" aria-selected="true">Inwentarz</button><button data-tool="batch">Konfiguracja zbiorcza</button><button data-tool="api">REST API</button><button data-tool="scope">Zakres funkcji</button></div><div class="pt-dialog-body" id="ptToolsBody"></div>`),body=win.querySelector('#ptToolsBody');
      const render=kind=>{win.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tool===kind)));
        if(kind==='scope'){body.innerHTML=`<h3>Wspólny silnik we wszystkich laboratoriach</h3><p>${scopeText()}</p><p>Dostępne: Ethernet/ARP/ICMP, IPv4, IPv6/NDP z link-local i SLAAC/RA, VLAN i trunk, DTP/VTP, STP/RSTP, LACP/PAgP, static routing, OSPF z DR/BDR i diagnostyką FULL/2-WAY/EXSTART, RIP, HSRP, ACL, static/dynamic NAT i PAT dla ICMP/TCP/UDP, DHCP i relay, DNS, Port Security, DHCP Snooping/DAI, DSCP, sesje SSH, TFTP, Syslog, SNMP, NTP i WLAN/WLC.</p><p>WLC ma GUI do interfaces, VLAN, WLAN, WPA2-PSK, QoS i odczytu AP/klientów. Lightweight AP działa w profilu FlexConnect z lokalnym przełączaniem i uwierzytelnianiem; po dołączeniu zachowuje profil podczas awarii kontrolera.</p><p>OSPF, STP, HSRP i EtherChannel pokazują wynik zbieżności, bez pełnej wymiany LSA/BPDU ani pakietowych timerów. Usługi nie implementują pełnego stosu TCP/UDP ani kryptografii. Nie ma centralnego tunelu danych CAPWAP, DHCPv6, OSPFv3, EIGRP, BGP, MPLS, VPN, ASA/firewalla, modelu fal radiowych, IoT ani emulacji systemów gości. Profile portów nie odtwarzają całego sprzętu i wszystkich modułów.</p><p>Komenda spoza rejestru zwraca błąd. Dostępność sprzętowa zależy od urządzenia, np. ip routing wymaga routera lub Layer 3 switch.</p><details><summary>Obsługiwane składnie CLI (${E.Terminal.commands.length})</summary><pre>${esc([...new Set(E.Terminal.commands.map(c=>c.syntax))].sort().join('\n'))}</pre></details>`;return;}
        if(kind==='inventory'){
          body.innerHTML='<label class="pt-field"><span>Format</span><select id="ptFormat"><option value="json">JSON</option><option value="xml">XML</option><option value="yaml">YAML</option></select></label><pre id="ptInventory" tabindex="0"></pre>';
          const show=()=>{const format=body.querySelector('select').value,data=S.inventory(net);net.state.evidence.observations.inventory=true;net.state.evidence.observations['format-'+format]=true;const xml=(value,key)=>Array.isArray(value)?`<${key} type="array">${value.map(v=>xml(v,'item')).join('')}</${key}>`:value&&typeof value==='object'?`<${key}>${Object.entries(value).map(([k,v])=>`<entry key="${esc(k)}">${xml(v,'value')}</entry>`).join('')}</${key}>`:`<${key} type="${value===null?'null':typeof value}">${esc(value)}</${key}>`;const yaml=(value,indent='')=>value&&typeof value==='object'&&!Object.keys(value).length?indent+(Array.isArray(value)?'[]':'{}'):Array.isArray(value)?value.map(v=>indent+'-\n'+yaml(v,indent+'  ')).join('\n'):value&&typeof value==='object'?Object.entries(value).map(([k,v])=>indent+JSON.stringify(k)+':'+(v&&typeof v==='object'?'\n'+yaml(v,indent+'  '):' '+JSON.stringify(v))).join('\n'):indent+JSON.stringify(value);body.querySelector('pre').textContent=format==='json'?JSON.stringify(data,null,2):format==='xml'?'<?xml version="1.0"?>\n'+xml(data,'inventory'):yaml(data);persist();draw();};body.querySelector('select').onchange=show;show();return;
        }
        if(kind==='batch'){
          body.innerHTML=`<p>Wykonaj wiele poleceń tego samego interpreterа. Skrypt zatrzyma się na błędzie lub pytaniu interaktywnym. Przykład używa <code>write memory</code>, które nie wymaga potwierdzenia.</p><label class="pt-field"><span>Urządzenie</span><select id="ptBatchDevice">${net.state.devices.filter(E.isIOS).map(d=>`<option value="${d.id}">${esc(d.id+' · '+d.hostname)}</option>`).join('')}</select></label><textarea id="ptBatch" rows="10" spellcheck="false">enable\nconfigure terminal\nhostname ACCESS1\ninterface fa0/1\ndescription MANAGED\nno shutdown\nend\nwrite memory</textarea><div class="pt-action-row"><button id="ptRunBatch" class="pt-primary">Wykonaj skrypt</button></div><pre id="ptBatchResult" role="status"></pre>`;
          body.querySelector('button').onclick=()=>{const id=body.querySelector('select').value;if(!id)return;const t=new E.Terminal(net,id),lines=body.querySelector('textarea').value.split(/\r?\n/),out=[];for(const line of lines.slice(0,300)){out.push(t.prompt()+line);const result=t.execute(line);if(result?.ping){net.run();out.push(result.ping.lines.join('\n'));}else if(result)out.push(result);if(t.pending||typeof result==='string'&&result.startsWith('%')){out.push('Skrypt zatrzymany. Dokończ lub popraw polecenie w CLI.');terminals.set(id,t);break;}}net.state.evidence.observations.batch=true;body.querySelector('pre').textContent=out.join('\n');draw();refreshEvents();persist();};return;
        }
        body.innerHTML=`<p>Lokalne API ćwiczeniowe. Token: <code>ccna-lab-token</code>. Dostępne GET /devices i GET/PATCH /devices/{id}/interfaces/{nazwa zakodowana URL}.</p><form><label class="pt-field"><span>Method</span><select name="method"><option>GET</option><option>PATCH</option></select></label><label class="pt-field"><span>Path</span><input name="path" value="/devices"></label><label class="pt-field"><span>Bearer token</span><input name="token" value="ccna-lab-token"></label><label class="pt-field"><span>JSON body</span><textarea name="body" rows="4">{"description":"REST-MANAGED"}</textarea></label><button class="pt-primary" type="submit">Wyślij żądanie</button><pre id="ptApiResult" role="status"></pre></form>`;
        const form=body.querySelector('form');form.onsubmit=e=>{e.preventDefault();try{const f=new FormData(form),result=S.rest(net,f.get('method'),f.get('path'),f.get('method')==='PATCH'?JSON.parse(f.get('body')):null,f.get('token'));body.querySelector('pre').textContent='HTTP '+result.status+'\n'+JSON.stringify(result.body,null,2);draw();refreshEvents();persist();}catch(error){body.querySelector('pre').textContent='HTTP 400\n'+error.message;}};
      };win.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>render(b.dataset.tool));render('inventory');
    }
    function check() {
      const checks=net.checks(),score=checks.filter(x=>x.ok).length;
      modal('Sprawdzenie laboratorium',`<div class="pt-dialog-body"><div class="pt-score">${Math.round(score/checks.length*100)}% <small>· ${score}/${checks.length}</small></div><p>${score===checks.length?'Laboratorium wykonane. Wszystkie wymagania są spełnione.':'Wykonaj brakujące kroki, a potem sprawdź ponownie.'}</p><div class="pt-result-grid">${checks.map(c=>`<div class="pt-check ${c.ok?'ok':''}">${c.ok?'✓':'○'} ${esc(c.label)}</div>`).join('')}</div><p class="pt-disclaimer">To wynik praktycznej części. Egzamin z pytaniami pozostaje oddzielnym etapem kursu.</p></div>`);persist();
    }
    function download() {
      const data={format:'ccna-network-lab',version:2,lab:scenario.id,state:net.snapshot()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='CCNA_'+scenario.id.replace(/[^a-z0-9_-]/gi,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Zapisano plik JSON laboratorium.');
    }
    function reset() { confirmAction('Resetuj laboratorium','Przywrócić początkowy układ i konfigurację tego ćwiczenia? Bieżąca topologia oraz wynik tego laboratorium zostaną zastąpione.',()=>{stop();net=createNetwork();terminals.clear();currentEvent=null;setMode('select');refreshEvents();persist();}); }
    function menu(name) {
      const entries=name==='file'?[['export','Zapisz do pliku JSON'],['import','Otwórz plik JSON'],['reset','Resetuj laboratorium']]:name==='edit'?[['select','Zaznacz i przesuń'],['delete',"Usuń urządzenie lub cable"],['cables','Połącz urządzenia'],['clear-events','Wyczyść zdarzenia']]:[['fit','Dopasuj widok'],['fullscreen','Pełny ekran'],['logical','Logical'],['physical','Physical'],['simulation','Simulation']];
      const d=modal(name==='file'?'Plik':name==='edit'?'Edycja':'Widok',`<div class="pt-dialog-body pt-result-grid">${entries.map(([a,label])=>`<button data-menu-action="${a}" style="text-align:left;border:1px solid #d5e0e8;padding:10px">${label}</button>`).join('')}</div>`,true);d.querySelectorAll('[data-menu-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.menuAction;closeDialog();action(a);});
    }
    function action(a) {
      if(['file','edit','view'].includes(a)){menu(a);return;}
      if(a==='select'||a==='delete'||a==='pdu'){setMode(a);return;}
      if(a==='cables'){category='cable';setMode('cable');return;}
      if(a==='help'){instructions();return;}
      if(a==='tools'){toolsPanel();return;}
      if(a==='labs'){labPicker();return;}
      if(a==='check'){check();return;}
      if(a==='reset'){reset();return;}
      if(a==='export'){download();return;}
      if(a==='import'){$('.pt-import').click();return;}
      if(a==='step'){step();return;}
      if(a==='play'){if(timer)stop();else{timer=setInterval(step,450);$('[data-action="play"]').textContent='Pause';}return;}
      if(a==='realtime'||a==='simulation'){switchMode(a==='simulation');return;}
      if(a==='hide-sim'){$('.pt-sim-panel').classList.add('pt-hidden');status('Panel zwinięty. Kliknij Simulation, aby go przywrócić.');return;}
      if(a==='clear-events'){stop();net.clearEvents();currentEvent=null;refreshEvents();draw();return;}
      if(a==='advance'){net.state.clock+=300;net.age();draw();status('Minęło 300 sekund. Wygasły dynamiczne wpisy MAC i ARP.');return;}
      if(a==='zoom-in'||a==='zoom-out'||a==='fit'){zoom=a==='fit'?1:Math.max(.7,Math.min(2.2,zoom+(a==='zoom-in'?.2:-.2)));draw();return;}
      if(a==='logical'||a==='physical'){view=a;setMode('select');$('[data-action="logical"]').setAttribute('aria-selected',String(a==='logical'));$('[data-action="physical"]').setAttribute('aria-selected',String(a==='physical'));$('.pt-empty-note').classList.toggle('pt-hidden',a==='physical');draw();return;}
      if(a==='fullscreen'){if(document.fullscreenElement)document.exitFullscreen?.();else root.requestFullscreen?.().catch(()=>status('Pełny ekran jest niedostępny. Widok roboczy już wypełnia aplikację.'));return;}
      if(a==='close'){dispose();options.close?.();}
    }
    root.addEventListener('click',e=>{
      const a=e.target.closest('[data-action]');if(a){action(a.dataset.action);return;}
      const c=e.target.closest('[data-category]');if(c){category=c.dataset.category;setMode(category==='cable'?'cable':'select');return;}
      const wire=e.target.closest('[data-cable]');if(wire){cableType=wire.dataset.cable;setMode('cable');return;}
      const add=e.target.closest('[data-add]');if(add){setMode('add-'+add.dataset.add);return;}
      const event=e.target.closest('[data-event]');if(event)pduDetails(net.events.find(ev=>ev.id===Number(event.dataset.event)));
    });
    $('.pt-search').oninput=palette;
    $('.pt-kind').onchange=e=>{category=e.target.value;setMode(category==='cable'?'cable':'select');};
    root.querySelectorAll('[data-filter]').forEach(el=>el.onchange=refreshEvents);
    canvas.addEventListener('click',ev=>{
      // WIEDORA-CHANGE: WD-20261031-WIE-195-POSTDRAG-KEYBOARD-01 | TASK: WIE-195 | AUTHOR: Codex / GPT-6 (full version unknown)
      // The drag-release guard applies to pointer clicks, not Enter/Space activation.
      if(ignoreClick&&ev.detail>0){ignoreClick=false;return;}
      const node=ev.target.closest('[data-device]');if(node){nodeClick(node.dataset.device);return;}
      const env=ev.target.closest('[data-event-envelope]');if(env){pduDetails(net.events.find(e=>e.id===Number(env.dataset.eventEnvelope)));return;}
      const link=ev.target.closest('[data-link]');if(link){const l=net.state.links.find(x=>x.id===link.dataset.link);if(mode==='delete'){net.disconnect(l.id);draw();refreshEvents();persist();}else status(`${l.a.device} ${l.a.port} ↔ ${l.b.device} ${l.b.port}: ${net.status(l).reason}. Do usunięcia wybierz kosz.`);return;}
      if(mode.startsWith('add-')){const p=point(ev);try{net.add(mode.slice(4),Math.max(60,Math.min(1220,p.x)),Math.max(60,Math.min(480,p.y)));setMode('select');refreshEvents();persist();}catch(e){status(e.message);}}
    });
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    canvas.addEventListener('keydown',ev=>{
      const activate=ev.key==='Enter'||ev.key===' ';
      if(activate&&ev.target===canvas&&mode.startsWith('add-')){
        ev.preventDefault();
        try{const d=net.add(mode.slice(4),640,270);setMode('select');refreshEvents();persist();canvas.querySelector(`[data-device="${d.id}"]`)?.focus();}catch(e){status(e.message);}
        return;
      }
      const action=ev.target.closest('[data-link],[data-event-envelope]');
      if(activate&&action){
        ev.preventDefault();action.dispatchEvent(new MouseEvent('click',{bubbles:true}));
        if(!action.isConnected)canvas.focus();
        return;
      }
      const n=ev.target.closest('[data-device]');if(!n)return;const d=net.device(n.dataset.device);
      if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();nodeClick(d.id);}
      if(view==='logical'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();d.x=Math.max(60,Math.min(1220,d.x+(ev.key==='ArrowRight'?15:ev.key==='ArrowLeft'?-15:0)));d.y=Math.max(60,Math.min(480,d.y+(ev.key==='ArrowDown'?15:ev.key==='ArrowUp'?-15:0)));draw();canvas.querySelector(`[data-device="${d.id}"]`).focus();persist();}
    });
    canvas.addEventListener('pointerdown',ev=>{
      if(ev.button!==0)return;const node=ev.target.closest('[data-device]');
      if(!node&&!mode.startsWith('add-')){const wrap=$('.pt-canvas-wrap');drag={pan:true,startX:ev.clientX,startY:ev.clientY,left:wrap.scrollLeft,top:wrap.scrollTop,moved:false};canvas.setPointerCapture(ev.pointerId);return;}
      if(mode!=='select'||view!=='logical'||!node)return;
      const p=point(ev),d=net.device(node.dataset.device);drag={id:d.id,start:p,x:d.x,y:d.y,moved:false,pointer:ev.pointerId};canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove',ev=>{
      if(!drag)return;
      if(drag.pan){const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;drag.moved ||= Math.hypot(dx,dy)>4;const wrap=$('.pt-canvas-wrap');wrap.scrollLeft=drag.left-dx;wrap.scrollTop=drag.top-dy;return;}
      const p=point(ev),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.hypot(dx,dy)>4)drag.moved=true;
      if(drag.moved){const d=net.device(drag.id);d.x=Math.max(60,Math.min(1220,drag.x+dx));d.y=Math.max(60,Math.min(480,drag.y+dy));selected=d.id;draw();}
    });
    canvas.addEventListener('pointerup',ev=>{if(!drag)return;const id=drag.id,moved=drag.moved,pan=drag.pan;drag=null;try{canvas.releasePointerCapture(ev.pointerId);}catch{}if(pan&&!moved)return;ignoreClick=true;setTimeout(()=>{ignoreClick=false;},0);if(pan)return;if(moved){persist();status(id+' — zmieniono położenie.');}else nodeClick(id);});
    canvas.addEventListener('pointercancel',()=>{drag=null;});
    root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-add]');if(b)e.dataTransfer.setData('application/x-ccna-device',b.dataset.add);});
    canvas.addEventListener('dragover',e=>{e.preventDefault();});
    canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('application/x-ccna-device');if(!E.get(type))return;const p=point(e);try{net.add(type,Math.max(60,Math.min(1220,p.x)),Math.max(60,Math.min(480,p.y)));draw();refreshEvents();persist();}catch(err){status(err.message);}});
    root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog?.open){setMode('select');} });
    $('.pt-import').onchange=async ev=>{
      const file=ev.target.files[0];ev.target.value='';if(!file)return;if(file.size>2000000){status('Plik jest zbyt duży (maksymalnie 2 MB).');return;}
      try{const payload=JSON.parse(await file.text());if(payload.format!=='ccna-network-lab'||!(payload.lab===scenario.id||scenario.original&&payload.lab==='ethernet-day6')||![1,2].includes(payload.version))throw new Error('Wybierz zapis JSON tego laboratorium. Pliki .pkt/.pka nie są obsługiwane.');const loaded=createNetwork(payload.state);confirmAction('Otwórz laboratorium','Zastąpić bieżącą topologię zawartością pliku?',()=>{stop();net=loaded;terminals.clear();currentEvent=null;setMode('select');refreshEvents();persist();status("Wczytano topologię i konfigurację. ARP table/MAC są puste.");});}catch(e){status(e.message);}
    };
    function dispose() {
      if(dead)return;stop();clearTimeout(saveTimer);try{options.save?.(net.snapshot());}catch{}dead=true;observer.disconnect();unsubscribe?.();closeDialog();root.remove();options.disposed?.();
    }
    const observer=new MutationObserver(()=>{if(!root.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});
    const unsubscribe=options.onSynced?.(()=>{if(!dead)$('#ptSaveStatus').textContent='Zsynchronizowano z kontem';});
    draw();palette();refreshEvents();persist();
    return { dispose, get network(){return net;} };
  }
  window.CcnaPacketLabUI = { mount };
})();
