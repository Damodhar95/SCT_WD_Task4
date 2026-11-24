
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskForm = document.getElementById("taskForm");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");

const STORAGE_KEY = "dayflow_tasks_v1";

let tasks = loadTasks();
let currentFilter = "all";
let taskToUpdate = null;

// Load saved tasks
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        return Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Unable to load saved tasks:", error);
        return [];
    }
}

// Save tasks in browser storage
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Your browser could not save the tasks. Please check your browser storage settings.");
    }
}

// Generate a unique task ID
function generateTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Format date and time
function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Invalid due date";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(date);
}

// Set today's date in the dashboard
function updateTodayDate() {
    const now = new Date();

    document.getElementById("todayLabel").textContent =
        new Intl.DateTimeFormat("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(now);

    document.getElementById("dateDay").textContent =
        String(now.getDate()).padStart(2, "0");

    document.getElementById("dateMonth").textContent =
        new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric"
        }).format(now);
}

// Create a new task or update an existing one
function addOrUpdateTask(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    const taskDueDate = taskDate.value;

    if (!taskText || !taskDueDate) {
        alert("Please enter a task and select its due date and time.");
        return;
    }

    const dueDate = new Date(taskDueDate);

    if (Number.isNaN(dueDate.getTime())) {
        alert("Please select a valid due date and time.");
        return;
    }

    if (taskToUpdate !== null) {
        const task = tasks.find(item => item.id === taskToUpdate);

        if (!task) {
            resetForm();
            return;
        }

        task.text = taskText;
        task.dueDate = taskDueDate;

    } else {
        const newTask = {
            id: generateTaskId(),
            text: taskText,
            dueDate: taskDueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
    }

    saveTasks();
    resetForm();
    renderTasks();
}

// Reset task form
function resetForm() {
    taskForm.reset();

    taskToUpdate = null;

    addTaskBtn.innerHTML = "<span>＋</span> Add task";

    document.getElementById("formKicker").textContent = "NEW TASK";
    document.getElementById("formTitle").textContent =
        "What needs to get done?";

    document.getElementById("cancelEditBtn").hidden = true;
}

// Start editing a task
function prepareTaskForUpdate(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    taskInput.value = task.text;
    taskDate.value = task.dueDate;

    taskToUpdate = taskId;

    addTaskBtn.textContent = "Update task";

    document.getElementById("formKicker").textContent = "EDIT TASK";
    document.getElementById("formTitle").textContent =
        "Make your changes";

    document.getElementById("cancelEditBtn").hidden = false;

    taskInput.focus();

    document.getElementById("taskForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Toggle task completion
function toggleComplete(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const shouldDelete = confirm(
        `Delete "${task.text}"?`
    );

    if (!shouldDelete) return;

    tasks = tasks.filter(item => item.id !== taskId);

    if (taskToUpdate === taskId) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// Clear all completed tasks
function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const shouldClear = confirm(
        `Delete all ${completedCount} completed task(s)?`
    );

    if (!shouldClear) return;

    tasks = tasks.filter(task => !task.completed);

    if (taskToUpdate !== null &&
        !tasks.some(task => task.id === taskToUpdate)) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// Change task filter
function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === currentFilter
        );
    });

    renderTasks();
}

// Update dashboard statistics
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    const completion = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = active;
    document.getElementById("doneTasks").textContent = completed;
    document.getElementById("completionRate").textContent =
        `${completion}%`;

    document.getElementById("progressFill").style.width =
        `${completion}%`;

    document.getElementById("allCount").textContent = total;
    document.getElementById("activeCount").textContent = active;
    document.getElementById("completedCount").textContent = completed;

    document.getElementById("clearCompletedBtn").disabled =
        completed === 0;

    document.getElementById("clearCompletedBtn").style.opacity =
        completed === 0 ? "0.45" : "1";
}

// Create task item safely
function createTaskElement(task) {
    const taskElement = document.createElement("li");
    taskElement.className = "task-item";

    if (task.completed) {
        taskElement.classList.add("completed");
    }

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = "task-check";
    checkbox.dataset.action = "complete";
    checkbox.setAttribute(
        "aria-label",
        task.completed ? "Mark task as active" : "Complete task"
    );
    checkbox.textContent = task.completed ? "✓" : "";

    const details = document.createElement("div");
    details.className = "task-details";

    const taskName = document.createElement("div");
    taskName.className = "task-name";
    taskName.textContent = task.text;

    const taskDateElement = document.createElement("div");
    taskDateElement.className = "task-date";

    const dueDate = new Date(task.dueDate);
    const isOverdue =
        !task.completed &&
        !Number.isNaN(dueDate.getTime()) &&
        dueDate.getTime() < Date.now();

    taskDateElement.textContent = `Due: ${formatDate(task.dueDate)}`;

    if (isOverdue) {
        taskDateElement.classList.add("overdue");
    }

    details.append(taskName, taskDateElement);

    const badge = document.createElement("span");
    badge.className = "task-badge";

    if (task.completed) {
        badge.textContent = "Completed";
        badge.classList.add("badge-completed");
    } else if (isOverdue) {
        badge.textContent = "Overdue";
        badge.classList.add("badge-overdue");
    } else {
        badge.textContent = "In progress";
        badge.classList.add("badge-active");
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action";
    editButton.dataset.action = "edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit task");

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action delete";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", "Delete task");

    actions.append(editButton, deleteButton);

    taskElement.dataset.id = task.id;
    taskElement.append(checkbox, details, badge, actions);

    return taskElement;
}

// Display empty state
function showEmptyState(message, description) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "✳";

    const heading = document.createElement("h3");
    heading.textContent = message;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    emptyItem.append(icon, heading, paragraph);

    taskList.appendChild(emptyItem);
}

// Render all visible tasks
function renderTasks() {
    taskList.replaceChildren();

    const searchTerm = searchInput.value.trim().toLowerCase();

    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text
            .toLowerCase()
            .includes(searchTerm);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    // Show active tasks before completed tasks.
    // Within each group, show the earliest due date first.
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    document.getElementById("visibleCount").textContent =
        filteredTasks.length;

    if (filteredTasks.length === 0) {
        if (searchTerm) {
            showEmptyState(
                "No matching tasks",
                "Try another search term to find your task."
            );
        } else if (currentFilter === "completed") {
            showEmptyState(
                "Nothing completed yet",
                "Complete a task and it will appear here."
            );
        } else if (currentFilter === "active") {
            showEmptyState(
                "You're all caught up!",
                "There are no pending tasks right now."
            );
        } else {
            showEmptyState(
                "Your day starts here",
                "Add your first task above and take the first step."
            );
        }

        updateStatistics();
        return;
    }

    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    updateStatistics();
}

// Handle task actions
taskList.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");
    const taskElement = event.target.closest(".task-item");

    if (!actionButton || !taskElement) return;

    const taskId = taskElement.dataset.id;
    const action = actionButton.dataset.action;

    if (action === "complete") {
        toggleComplete(taskId);
    } else if (action === "edit") {
        prepareTaskForUpdate(taskId);
    } else if (action === "delete") {
        deleteTask(taskId);
    }
});

// Handle sidebar and tab filters
document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

// Add or update task
taskForm.addEventListener("submit", addOrUpdateTask);

// Cancel editing
document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

// Search tasks
searchInput.addEventListener("input", renderTasks);

// Clear completed tasks
document.getElementById("clearCompletedBtn").addEventListener(
    "click",
    clearCompletedTasks
);

// Focus task input from New Task button
document.getElementById("focusInputBtn").addEventListener("click", () => {
    taskInput.focus();

    document.getElementById("taskForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});

// Initialize application
updateTodayDate();
renderTasks();
