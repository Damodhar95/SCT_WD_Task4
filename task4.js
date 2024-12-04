const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

let tasks = [];
let taskToUpdate = null; // Holds the ID of the task being updated

// Add or Update Task
function addOrUpdateTask() {
    const taskText = taskInput.value.trim();
    const taskDueDate = taskDate.value;

    if (!taskText || !taskDueDate) {
        alert("Please enter both task and date!");
        return;
    }

    if (taskToUpdate) {
        // Update existing task
        const task = tasks.find(task => task.id === taskToUpdate);
        task.text = taskText;
        task.dueDate = taskDueDate;
        taskToUpdate = null;
        addTaskBtn.textContent = "Add Task"; // Reset button text
    } else {
        // Add new task
        const newTask = {
            id: Date.now(),
            text: taskText,
            dueDate: taskDueDate,
            completed: false,
        };
        tasks.push(newTask);
    }

    taskInput.value = '';
    taskDate.value = '';
    renderTasks();
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = document.createElement('li');
        taskElement.classList.add('task');
        if (task.completed) taskElement.classList.add('completed');
        taskElement.dataset.id = task.id;

        taskElement.innerHTML = `
            <div>
                <strong>${task.text}</strong>
                <small>(${new Date(task.dueDate).toLocaleString()})</small>
            </div>
            <div class="actions">
                <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
                <button class="update-btn">Update</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        taskList.appendChild(taskElement);
    });
}

// Toggle Completion
function toggleComplete(taskId) {
    const task = tasks.find(task => task.id === taskId);
    task.completed = !task.completed;
    renderTasks();
}

// Delete Task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    renderTasks();
}

// Prepare Task for Update
function prepareTaskForUpdate(taskId) {
    const task = tasks.find(task => task.id === taskId);
    taskInput.value = task.text;
    taskDate.value = task.dueDate;
    taskToUpdate = taskId;
    addTaskBtn.textContent = "Update Task"; // Change button text
}

// Handle Task Actions
taskList.addEventListener('click', (event) => {
    const taskElement = event.target.closest('.task');
    if (!taskElement) return;

    const taskId = parseInt(taskElement.dataset.id);

    if (event.target.classList.contains('complete-btn')) {
        toggleComplete(taskId);
    } else if (event.target.classList.contains('update-btn')) {
        prepareTaskForUpdate(taskId);
    } else if (event.target.classList.contains('delete-btn')) {
        deleteTask(taskId);
    }
});

// Add or Update Task Button Listener
addTaskBtn.addEventListener('click', addOrUpdateTask);
