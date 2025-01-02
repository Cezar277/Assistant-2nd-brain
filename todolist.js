document.addEventListener('DOMContentLoaded', () => {
    const addTaskButton = document.getElementById('add-task-button');
    const addTaskPopup = document.getElementById('add-task-popup');
    const closeAddPopup = document.getElementById('close-add-popup');
    const taskForm = document.getElementById('task-form');
    const todoList = document.getElementById('todo-list');
    const taskDetailsPopup = document.getElementById('task-details-popup');
    const closeDetailsPopup = document.getElementById('close-details-popup');
    const detailsTitle = document.getElementById('details-title');
    const detailsDescription = document.getElementById('details-description');
    const detailsPriority = document.getElementById('details-priority');
    const detailsDate = document.getElementById('details-date');
    const validateTaskButton = document.getElementById('validate-task');
    const editTaskButton = document.getElementById('edit-task');
    const deleteTaskButton = document.getElementById('delete-task');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentTaskId = null; // Pour stocker l'ID de la tâche actuellement affichée

    // Ouvrir la popup d'ajout de tâche
    addTaskButton.addEventListener('click', () => {
        addTaskPopup.style.display = 'flex';
    });

    // Fermer la popup d'ajout de tâche
    closeAddPopup.addEventListener('click', () => {
        addTaskPopup.style.display = 'none';
    });

    // Ajouter une tâche
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const taskName = document.getElementById('task-name').value;
        const taskDescription = document.getElementById('task-description').value;
        const taskPriority = document.getElementById('task-priority').value;
        const taskDate = document.getElementById('task-date').value;

        const task = {
            id: Date.now(),
            name: taskName,
            description: taskDescription,
            priority: taskPriority,
            date: taskDate,
            completed: false
        };

        tasks.push(task);
        saveTasks();
        renderTasks();
        addTaskPopup.style.display = 'none';
        taskForm.reset();
    });

    // Afficher les tâches triées par date et priorité
    function renderTasks() {
        // Trier les tâches
        tasks.sort((a, b) => {
            if (a.date === b.date) {
                const priorityOrder = { 'super-important': 3, 'important': 2, 'inutile': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.date) - new Date(b.date);
        });

        // Afficher les tâches
        todoList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `todo-item priority-${task.priority}` + (task.completed ? ' completed' : '');
            li.innerHTML = `
                <span>${task.name}</span>
                <div>
                    <button onclick="toggleTaskCompletion(${task.id})"><i class="fas fa-check"></i></button>
                    <button onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            // Rendre toute la case cliquable
            li.addEventListener('click', (event) => {
                // Empêcher l'événement de se propager aux boutons
                if (!event.target.closest('button')) {
                    showTaskDetails(task.id);
                }
            });
            todoList.appendChild(li);
        });
    }

    // Afficher les détails d'une tâche
    window.showTaskDetails = (id) => {
        const task = tasks.find(task => task.id === id);
        currentTaskId = task.id; // Stocker l'ID de la tâche
        detailsTitle.textContent = task.name;
        detailsDescription.textContent = task.description;
        detailsPriority.textContent = `Priorité : ${task.priority}`;
        detailsDate.textContent = `Date : ${task.date}`;
        taskDetailsPopup.style.display = 'flex';
    };

    // Valider une tâche
    validateTaskButton.addEventListener('click', () => {
        const task = tasks.find(task => task.id === currentTaskId);
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        taskDetailsPopup.style.display = 'none';
    });

    // Éditer une tâche
    editTaskButton.addEventListener('click', () => {
        const task = tasks.find(task => task.id === currentTaskId);
        // Pré-remplir le formulaire d'ajout avec les détails de la tâche
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-date').value = task.date;
        // Supprimer la tâche actuelle
        tasks = tasks.filter(task => task.id !== currentTaskId);
        saveTasks();
        renderTasks();
        taskDetailsPopup.style.display = 'none';
        addTaskPopup.style.display = 'flex';
    });

    // Supprimer une tâche
    deleteTaskButton.addEventListener('click', () => {
        tasks = tasks.filter(task => task.id !== currentTaskId);
        saveTasks();
        renderTasks();
        taskDetailsPopup.style.display = 'none';
    });

    // Fermer la popup de détails
    closeDetailsPopup.addEventListener('click', () => {
        taskDetailsPopup.style.display = 'none';
    });

    // Sauvegarder les tâches dans localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Afficher les tâches au chargement de la page
    renderTasks();
});