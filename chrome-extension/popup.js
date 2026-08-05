const { API_BASE, SUPABASE_URL, SUPABASE_ANON_KEY } = self.BIOINSTA_CONFIG;
const app = document.getElementById("app");

function el(html) {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild;
}

async function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function setStorage(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "E-mail ou senha inválidos.");
  await setStorage({
    session: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      email,
    },
  });
}

async function logout() {
  await setStorage({ session: null });
  render();
}

function renderLogin(error) {
  app.innerHTML = "";
  app.appendChild(
    el(`
    <div>
      <h1>Bio Insta — Leads</h1>
      <p class="hint">Entre com a mesma conta do painel.</p>
      <input id="email" type="email" placeholder="E-mail" />
      <input id="password" type="password" placeholder="Senha" />
      ${error ? `<p class="error">${error}</p>` : ""}
      <button id="loginBtn">Entrar</button>
    </div>
  `)
  );
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await login(email, password);
      render();
    } catch (err) {
      renderLogin(err.message);
    }
  });
}

async function renderDashboard(session) {
  const { niche = "", city = "", captureEnabled = true, sessionCount = 0 } = await getStorage([
    "niche",
    "city",
    "captureEnabled",
    "sessionCount",
  ]);

  app.innerHTML = "";
  app.appendChild(
    el(`
    <div>
      <h1>Bio Insta — Leads</h1>
      <p class="hint">${session.email}</p>

      <input id="niche" placeholder="Nicho (ex: manicure)" value="${niche}" />
      <input id="city" placeholder="Cidade (ex: Goiânia)" value="${city}" />

      <div class="row">
        <label class="toggle">
          <input type="checkbox" id="captureEnabled" ${captureEnabled ? "checked" : ""} />
          Captura automática
        </label>
      </div>

      <div class="status-box">
        <strong>${sessionCount}</strong>
        perfis capturados nesta sessão
      </div>

      <p class="hint" style="margin-top:10px">
        Navegue no Instagram normalmente (pesquise o nicho + cidade e abra os perfis) — a extensão analisa
        cada perfil de negócio que você visitar.
      </p>

      <a class="link" href="${API_BASE}/superadmin/leads" target="_blank">Ver todos os leads →</a>
      <button class="secondary" id="logoutBtn">Sair</button>
    </div>
  `)
  );

  document.getElementById("niche").addEventListener("change", (e) => setStorage({ niche: e.target.value }));
  document.getElementById("city").addEventListener("change", (e) => setStorage({ city: e.target.value }));
  document
    .getElementById("captureEnabled")
    .addEventListener("change", (e) => setStorage({ captureEnabled: e.target.checked }));
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

async function render() {
  const { session } = await getStorage(["session"]);
  if (session?.access_token) {
    renderDashboard(session);
  } else {
    renderLogin();
  }
}

render();
