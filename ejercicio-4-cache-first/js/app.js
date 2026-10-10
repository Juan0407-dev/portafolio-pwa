// ----- Navegación entre vistas del App Shell -----
const navButtons = document.querySelectorAll(".app-nav button");
const views = document.querySelectorAll(".view");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.removeAttribute("aria-current"));
    btn.setAttribute("aria-current", "page");
    views.forEach((v) => (v.hidden = v.id !== "view-" + btn.dataset.view));
  });
});

// ----- Botón de instalación (evento beforeinstallprompt) -----
let deferredPrompt = null;
const installBtn = document.getElementById("btn-install");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => console.log("[App] Instalada"));

// ----- Tareas y notas guardadas en IndexedDB (funcionan sin conexión) -----
const DB_NAME = "cuaderno-db";
const DB_VERSION = 1;
let db = null;
let tasks = [];
let notes = [];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains("tareas")) database.createObjectStore("tareas", { keyPath: "id" });
      if (!database.objectStoreNames.contains("notas")) database.createObjectStore("notas", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runTx(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

const dbGetAll = (store) => runTx(store, "readonly", (s) => s.getAll());
const dbPut = (store, item) => (db ? runTx(store, "readwrite", (s) => s.put(item)) : Promise.resolve());
const dbDelete = (store, id) => (db ? runTx(store, "readwrite", (s) => s.delete(id)) : Promise.resolve());
const newestFirst = (list) => list.sort((a, b) => b.id - a.id);

// Pasa los datos de la versión anterior (localStorage) a IndexedDB, una sola vez.
async function migrateFromLocalStorage() {
  const pairs = [["cuaderno:tareas", "tareas"], ["cuaderno:notas", "notas"]];
  for (const [key, store] of pairs) {
    try {
      const old = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(old)) {
        for (const item of old) await dbPut(store, item);
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("[App] No se pudo migrar", key, e);
    }
  }
}

function emptyItem(text) {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  return li;
}

function renderTasks() {
  const list = document.getElementById("task-list");
  const today = document.getElementById("today-list");
  list.replaceChildren();
  today.replaceChildren();

  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "item" + (t.done ? " done" : "");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.id = "t-" + t.id;
    check.checked = t.done;
    check.addEventListener("change", async () => {
      t.done = check.checked;
      await dbPut("tareas", t);
      renderTasks();
    });

    const label = document.createElement("label");
    label.htmlFor = check.id;
    label.textContent = t.text;

    const del = document.createElement("button");
    del.className = "del";
    del.type = "button";
    del.setAttribute("aria-label", "Eliminar tarea: " + t.text);
    del.textContent = "×";
    del.addEventListener("click", async () => {
      await dbDelete("tareas", t.id);
      tasks = tasks.filter((x) => x.id !== t.id);
      renderTasks();
    });

    li.append(check, label, del);
    list.append(li);
  });

  const pending = tasks.filter((t) => !t.done);
  document.getElementById("pending-count").textContent = pending.length;
  if (!tasks.length) list.append(emptyItem("Aún no tienes tareas. Agrega la primera arriba."));
  if (!pending.length) today.append(emptyItem("Nada pendiente por ahora."));
  pending.slice(0, 5).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t.text;
    today.append(li);
  });
}

function renderNotes() {
  const list = document.getElementById("note-list");
  list.replaceChildren();
  if (!notes.length) list.append(emptyItem("Todavía no hay notas guardadas."));
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.className = "item";
    const p = document.createElement("label");
    p.textContent = n.text;
    const del = document.createElement("button");
    del.className = "del";
    del.type = "button";
    del.setAttribute("aria-label", "Eliminar nota");
    del.textContent = "×";
    del.addEventListener("click", async () => {
      await dbDelete("notas", n.id);
      notes = notes.filter((x) => x.id !== n.id);
      renderNotes();
    });
    li.append(p, del);
    list.append(li);
  });
}

document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (!text) return;
  const task = { id: Date.now(), text, done: false };
  await dbPut("tareas", task);
  tasks.unshift(task);
  input.value = "";
  renderTasks();
});

document.getElementById("note-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("note-input");
  const text = input.value.trim();
  if (!text) return;
  const note = { id: Date.now(), text };
  await dbPut("notas", note);
  notes.unshift(note);
  input.value = "";
  renderNotes();
});

// Arranque: abre la base, migra datos viejos y pinta la interfaz.
async function init() {
  try {
    db = await openDB();
    await migrateFromLocalStorage();
    tasks = newestFirst(await dbGetAll("tareas"));
    notes = newestFirst(await dbGetAll("notas"));
  } catch (error) {
    console.error("[App] IndexedDB no disponible:", error);
  }
  renderTasks();
  renderNotes();
}
init();

// ----- Registro asíncrono del Service Worker -----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("[App] SW registrado. Scope:", registration.scope);

      registration.addEventListener("updatefound", () => {
        const nuevo = registration.installing;
        nuevo.addEventListener("statechange", () => {
          console.log("[App] Estado del nuevo SW:", nuevo.state);
        });
      });
    } catch (error) {
      console.error("[App] Falló el registro del SW:", error);
    }
  });
} else {
  console.warn("[App] Este navegador no soporta Service Workers.");
}
