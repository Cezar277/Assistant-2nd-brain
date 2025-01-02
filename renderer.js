// Récupère le webview
const webview = document.getElementById('webview');
let currentSrc = ''; // Variable pour stocker l'URL actuelle

// Fonction pour changer le src uniquement si c'est nécessaire
function updateWebview(src) {
    if (currentSrc !== src) {
        webview.src = src;
        currentSrc = src; // Met à jour l'URL actuelle
        webview.style.display = 'block'; // Affiche le webview
    }
}

// Ajoute des écouteurs d'événements pour chaque bouton
document.getElementById('chatgpt').addEventListener('click', function () {
    updateWebview('https://chat.openai.com'); // Lien vers ChatGPT
});

document.getElementById('gemini').addEventListener('click', function () {
    updateWebview('https://gemini.google.com'); // Lien vers Gemini
});

document.getElementById('mistral').addEventListener('click', function () {
    updateWebview('https://chat.mistral.ai'); // Lien vers MistralAI
});

document.getElementById('copilot').addEventListener('click', function () {
    updateWebview('https://copilot.microsoft.com'); // Lien vers Copilot
});

// Gestion du bouton "Ajouter IA" - exemple pour permettre à l'utilisateur d'ajouter dynamiquement une nouvelle IA
document.getElementById('add-shortcut').addEventListener('click', function () {
    const iaName = prompt("Nom de l'IA :");
    const iaUrl = prompt("URL de l'IA :");

    if (iaName && iaUrl) {
        const newIaItem = document.createElement('div');
        newIaItem.classList.add('ia-item');
        newIaItem.innerHTML = `<span>${iaName}</span>`;
        newIaItem.addEventListener('click', function () {
            updateWebview(iaUrl);
        });

        document.querySelector('.ia-list').appendChild(newIaItem);
        alert(`${iaName} a été ajoutée !`);
    } else {
        alert("Veuillez fournir un nom et une URL valides.");
    }
});

// Gestion des onglets
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');

        // Masque tous les contenus
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Affiche le contenu correspondant
        document.getElementById(target).classList.add('active');
    });
});

// Gestion de la barre latérale réductible
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');

    // Ajoute ou supprime la classe collapsed aux spans des onglets
    document.querySelectorAll('.tab span').forEach(span => {
        span.classList.toggle('collapsed');
    });
});
