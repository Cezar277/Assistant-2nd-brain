const { ipcRenderer } = require('electron');

// Gestion des onglets
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-tab');
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(target).classList.add('active');
  });
});

// Charger les IA disponibles
function loadIAs() {
  const iaList = document.querySelector('.ia-list');
  const availableAIs = ipcRenderer.sendSync('get-available-ais');

  availableAIs.forEach(ai => {
    const iaItem = document.createElement('div');
    iaItem.classList.add('ia-item');
    iaItem.innerHTML = `
      <img src="${ai.icon}" alt="${ai.label}">
      <span>${ai.label}</span>
    `;
    iaItem.addEventListener('click', () => {
      ipcRenderer.send('navigate-to-ai', ai.url);
    });
    iaList.appendChild(iaItem);
  });
}

// Gestion des sous-menus
function setupSubmenus() {
  const submenuToggles = document.querySelectorAll('.submenu-toggle');

  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      console.log('Submenu toggle clicked'); // Debugging
      const submenu = toggle.nextElementSibling;
      if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('active');
      }
    });
  });
}

// Gestion des modales
function setupModals() {
  const addIaButton = document.getElementById('add-ia');
  const modifyIaButton = document.getElementById('modify-ia');
  const closeModalButton = document.getElementById('close-modal');
  const closeModifyModalButton = document.getElementById('close-modify-modal');
  const modal = document.getElementById('modal');
  const modifyModal = document.getElementById('modify-modal');

  // Ouvrir la modal "Add IA"
  if (addIaButton) {
    addIaButton.addEventListener('click', (event) => {
      event.preventDefault();
      modal.style.display = 'block';
    });
  }

  // Ouvrir la modal "Modify IA"
  if (modifyIaButton) {
    modifyIaButton.addEventListener('click', (event) => {
      event.preventDefault();
      modifyModal.style.display = 'block';
      renderModifyAIs(); // Assure-toi que cette fonction est définie
    });
  }

  // Fermer la modal "Add IA"
  if (closeModalButton) {
    closeModalButton.addEventListener('click', (event) => {
      event.preventDefault();
      modal.style.display = 'none';
    });
  }

  // Fermer la modal "Modify IA"
  if (closeModifyModalButton) {
    closeModifyModalButton.addEventListener('click', (event) => {
      event.preventDefault();
      modifyModal.style.display = 'none';
    });
  }
}

// Rendre les IA dans la modal "Modify IA"
function renderModifyAIs() {
  const modifyIaList = document.getElementById('modify-ia-list');
  const availableAIs = ipcRenderer.sendSync('get-available-ais');

  if (modifyIaList) {
    modifyIaList.innerHTML = ''; // Vider la liste avant de la remplir
    availableAIs.forEach(ai => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${ai.label}</span>
        <button onclick="editAi('${ai.id}')">Modifier</button>
        <button onclick="deleteAi('${ai.id}')">Supprimer</button>
      `;
      modifyIaList.appendChild(li);
    });
  }
}

// Éditer une IA
function editAi(id) {
  const ai = ipcRenderer.sendSync('get-ai-by-id', id);
  if (ai) {
    const aiNameInput = document.getElementById('ai-name');
    const aiUrlInput = document.getElementById('ai-url');
    aiNameInput.value = ai.label;
    aiUrlInput.value = ai.url;
    document.getElementById('modal').style.display = 'block';
  }
}

// Supprimer une IA
function deleteAi(id) {
  ipcRenderer.send('delete-ai', id);
  renderModifyAIs(); // Rafraîchir la liste après suppression
}

// Initialiser tout au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  loadIAs();
  setupSubmenus();
  setupModals();
});