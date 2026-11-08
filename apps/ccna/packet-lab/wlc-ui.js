(function () {
  'use strict';
  const E = window.CcnaLabEngine;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const field = (name, label, value = '', type = 'text') => `<label class="pt-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" autocomplete="off"></label>`;
  const select = (name, label, choices, value) => `<label class="pt-field"><span>${label}</span><select name="${name}">${choices.map(([id, text]) => `<option value="${esc(id)}" ${String(value) === String(id) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  const table = (headers, rows) => `<div class="pt-wlc-table"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${headers.length}">No entries</td></tr>`}</tbody></table></div>`;
  function mount(net, id, host, onChange, initial = 'monitor') {
    const d = net.device(id);
    if (!d.power) { host.innerHTML = '<p>WLC jest wyłączony. Włącz zasilanie w zakładce Physical.</p>'; return; }
    host.innerHTML = `<div class="pt-wlc"><header><strong>Wireless LAN Controller</strong><span>${esc(d.hostname)} · ${esc(d.model)} · ${esc(d.ip || 'Management IP unset')}</span></header><nav aria-label="Menu kontrolera">${[['monitor', 'Monitor'], ['interfaces', 'Controller / Interfaces'], ['wlans', 'WLANs'], ['aps', 'Wireless'], ['clients', 'Clients']].map(([key, label]) => `<button data-wlc-page="${key}">${label}</button>`).join('')}</nav><div class="pt-wlc-content"></div><footer>FlexConnect · Local switching / local authentication</footer></div>`;
    const body = host.querySelector('.pt-wlc-content');
    const form = (html, submit) => {
      body.innerHTML = html;
      const element = body.querySelector('form');
      if (element) element.onsubmit = event => {
        event.preventDefault();
        try { submit(element, Object.fromEntries(new FormData(element))); onChange(); body.querySelector('[role="status"]').textContent = 'Configuration applied.'; }
        catch (error) { body.querySelector('[role="status"]').textContent = error.message; }
      };
    };
    const actions = '<button type="submit" class="pt-primary">Apply</button><p role="status" class="pt-form-status"></p>';
    function interfaces(edit) {
      if (edit !== undefined) {
        const item = d.controller.interfaces[edit] || {};
        form(`<h3>${edit ? 'Edit' : 'New'} Interface</h3><form>${field('name', 'Interface Name', item.name)}${field('vlan', 'VLAN Identifier', item.vlan || 20, 'number')}${field('ip', 'IP Address', item.ip)}${field('mask', 'Netmask', item.mask || '255.255.255.0')}${field('gateway', 'Gateway', item.gateway)}${field('dhcp', 'Primary DHCP Server', item.dhcp)}${actions}</form><p class="pt-disclaimer">W trybie local switching DHCP i ruch klientów przechodzą przez VLAN na porcie AP. Adres interface WLC opisuje przypisanie sieci; WLC nie jest gateway routującą klientów.</p>`, (element, values) => net.configureWlcInterface(id, values));
        return;
      }
      body.innerHTML = `<h3>Interfaces</h3><div class="pt-action-row"><button class="pt-primary" data-new-interface>New</button><button data-management>Management</button></div>${table(['Interface Name', 'VLAN', 'IP Address', 'DHCP Server', ''], Object.values(d.controller.interfaces).map(i => `<tr><td>${esc(i.name)}</td><td>${i.vlan}</td><td>${esc(i.ip)}</td><td>${esc(i.dhcp || 'Not configured')}</td><td><button data-edit-interface="${esc(i.name)}">Edit</button></td></tr>`))}`;
      body.querySelector('[data-new-interface]').onclick = () => interfaces('');
      body.querySelector('[data-management]').onclick = management;
      body.querySelectorAll('[data-edit-interface]').forEach(b => b.onclick = () => interfaces(b.dataset.editInterface));
    }
    function management() {
      form(`<h3>Management Interface</h3><form>${field('ip', 'IP Address', d.ip)}${field('mask', 'Netmask', d.mask)}${field('gateway', 'Gateway', d.gateway)}${field('vlan', 'VLAN Identifier (0 = untagged)', d.controller.managementVlan, 'number')}${actions}</form>`, (element, values) => { const vlan = Number(values.vlan); if (!Number.isInteger(vlan) || vlan < 0 || vlan > 4094) throw new Error('VLAN: 0–4094.'); net.configureManagement(id, values); });
    }
    function wlans(edit) {
      if (edit !== undefined) {
        const item = d.controller.wlans[edit] || { id: 1, enabled: false, security: 'wpa2', qos: 'silver' };
        form(`<h3>${edit ? 'Edit' : 'New'} WLAN</h3><form>${field('id', 'WLAN ID', item.id, 'number')}${field('name', 'Profile Name', item.name)}${field('ssid', 'SSID', item.ssid)}<label class="pt-field"><span>Status · Enabled</span><input name="enabled" type="checkbox" ${item.enabled ? 'checked' : ''}></label>${select('interface', 'Interface / Interface Group', Object.values(d.controller.interfaces).map(i => [i.name, i.name + ' · VLAN ' + i.vlan]), item.interface)}<h4>Security / Layer 2</h4>${select('security', 'Layer 2 Security', [['wpa2', 'WPA2-PSK (AES)'], ['open', 'None / Open']], item.security)}${field('key', 'PSK Format · ASCII', item.key, 'password')}<h4>QoS</h4>${select('qos', 'Quality of Service', [['platinum', 'Platinum (voice)'], ['gold', 'Gold (video)'], ['silver', 'Silver (best effort)'], ['bronze', 'Bronze (background)']], item.qos)}<h4>Advanced</h4><p>FlexConnect Local Switching: <strong>Enabled</strong><br>Local Authentication: <strong>Enabled</strong></p>${actions}</form>`, (element, values) => net.configureWlan(id, { ...values, enabled: element.elements.enabled.checked }));
        return;
      }
      body.innerHTML = `<h3>WLANs</h3><button class="pt-primary" data-new-wlan>New</button>${table(['ID', 'Profile Name', 'SSID', 'Status', 'Interface', 'Security', ''], Object.values(d.controller.wlans).map(w => `<tr><td>${w.id}</td><td>${esc(w.name)}</td><td>${esc(w.ssid)}</td><td>${w.enabled ? 'Enabled' : 'Disabled'}</td><td>${esc(w.interface)}</td><td>${w.security === 'wpa2' ? 'WPA2 / AES / PSK' : 'Open'}</td><td><button data-edit-wlan="${w.id}">Edit</button></td></tr>`))}`;
      body.querySelector('[data-new-wlan]').onclick = () => wlans('');
      body.querySelectorAll('[data-edit-wlan]').forEach(b => b.onclick = () => wlans(b.dataset.editWlan));
    }
    function render(page) {
      host.querySelectorAll('[data-wlc-page]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.wlcPage === page)));
      const aps = net.state.devices.filter(x => x.type === 'ap' && E.get(x.model)?.lightweight).map(ap => ({ ap, state: net.apState(ap) }));
      const clients = net.state.links.filter(l => l.type === 'wireless' && net.status(l).up).flatMap(l => {
        const a = net.device(l.a.device), b = net.device(l.b.device), ap = a.type === 'ap' ? a : b, client = a.type === 'ap' ? b : a;
        if (net.apState(ap).controller !== id) return [];
        return [{ ap, client, wlan: net.wirelessProfile(ap, client) }];
      });
      if (page === 'interfaces') { interfaces(); return; }
      if (page === 'wlans') { wlans(); return; }
      if (page === 'aps') { body.innerHTML = `<h3>All APs</h3>${table(['AP Name', 'IP Address', 'AP Mode', 'Status', 'Controller'], aps.map(({ ap, state }) => `<tr><td>${esc(ap.hostname)}</td><td>${esc(ap.ip)}</td><td>FlexConnect</td><td>${esc(state.state)}</td><td>${esc(state.controller || 'Not joined')}</td></tr>`))}<p>AP dołącza po osiągnięciu adresu zarządzania kontrolera przez UDP 5246. Sprawdź IP, VLAN zarządzania, routing i ACL.</p>`; return; }
      if (page === 'clients') {
        net.state.evidence.observations.wlcClients = true; onChange();
        body.innerHTML = `<h3>Clients</h3>${table(['MAC Address', 'IP Address', 'AP Name', 'WLAN / SSID', 'VLAN', 'Security', 'Status'], clients.map(({ ap, client, wlan }) => `<tr><td>${client.mac}</td><td>${esc(client.ip || 'Unassigned')}</td><td>${esc(ap.hostname)}</td><td>${esc(wlan.ssid)}</td><td>${wlan.vlan}</td><td>${wlan.security === 'wpa2' ? 'WPA2-PSK' : 'Open'}</td><td>Associated</td></tr>`))}<p>Skojarzenie radiowe i łączność IP sprawdzaj osobno. Poprawny klucz nie zastępuje VLAN-u ani adresacji.</p>`; return;
      }
      body.innerHTML = `<h3>Controller Summary</h3><div class="pt-wlc-summary"><div><strong>${aps.filter(a => a.state.controller === id && a.state.state === 'Joined').length}</strong>Joined APs</div><div><strong>${Object.values(d.controller.wlans).filter(w => w.enabled).length}</strong>Enabled WLANs</div><div><strong>${clients.length}</strong>Associated clients</div></div>${table(['System Name', 'Management IP', 'Software Profile'], [`<tr><td>${esc(d.hostname)}</td><td>${esc(d.ip || 'Unassigned')}</td><td>AireOS-style educational GUI</td></tr>`])}<p>Zacznij od <strong>Controller / Interfaces</strong>, następnie utwórz i włącz profil w <strong>WLANs</strong>. Zakładki Wireless i Clients pokazują bieżący stan.</p>`;
    }
    host.querySelectorAll('[data-wlc-page]').forEach(button => button.onclick = () => render(button.dataset.wlcPage));
    render(initial);
  }
  function accessPoint(net, id, body, onChange) {
    const d = net.device(id), state = net.apState(d);
    body.innerHTML = `<h3>Lightweight AP · ${esc(d.model)}</h3><p>AP Mode: <strong>FlexConnect</strong> · Status: <strong>${esc(state.state)}</strong></p><form>${field('ip', 'Management IPv4', d.ip)}${field('mask', 'Subnet Mask', d.mask)}${field('gateway', 'Default Gateway', d.gateway)}${field('controller', 'Primary Controller IP', d.wireless.controller)}<button class="pt-primary">Zastosuj i dołącz do WLC</button><p role="status" class="pt-form-status"></p></form><h4>Profile z kontrolera</h4>${table(['SSID', 'VLAN', 'Security'], state.profiles.map(w => `<tr><td>${esc(w.ssid)}</td><td>${w.vlan}</td><td>${esc(w.security)}</td></tr>`))}<p>SSID i zabezpieczenia ustaw w GUI kontrolera. Port switcha do AP musi przenosić VLAN zarządzania oraz VLAN-y klientów.</p>`;
    body.querySelector('form').onsubmit = event => { event.preventDefault(); try { net.configureManagement(id, Object.fromEntries(new FormData(event.target))); onChange(); accessPoint(net, id, body, onChange); body.querySelector('[role="status"]').textContent = net.apState(d).state; } catch (error) { body.querySelector('[role="status"]').textContent = error.message; } };
  }
  window.CcnaWlcUI = { mount, accessPoint };
})();
