/* ============================= */
/* STATE */
/* ============================= */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

/* ============================= */
/* STORAGE */
/* ============================= */

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ============================= */
/* UTILITIES */
/* ============================= */
function createTaskElement(task, showActions = true) {

    const li = document.createElement("li");
    li.classList.add(task.status);

    li.innerHTML = `
        <div>
            <strong>${task.title}</strong>
            <small>Deadline: ${task.deadline || "None"}</small>

            ${showActions ? `
            <select class="status-select" data-id="${task.id}">
                <option value="todo" ${task.status === "todo" ? "selected" : ""}>TODO</option>
                <option value="doing" ${task.status === "doing" ? "selected" : ""}>DOING</option>
                <option value="done" ${task.status === "done" ? "selected" : ""}>DONE</option>
            </select>
            ` : ""}

            <div class="dates">
                <small>Created: ${formatDate(task.createdAt)}</small>
                <small>Updated: ${formatDate(task.updatedAt)}</small>
            </div>
        </div>

        ${showActions ? `
        <div>
            <button class="edit-btn" data-id="${task.id}">Edit</button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
        </div>
        ` : ""}
    `;

    return li;
}

const nowISO = () => new Date().toISOString();

const daysBetween = (date) =>
    Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

function calculateScore(task) {
    let score = task.priority * 10;

    if (!task.deadline) return score;

    const daysLeft = daysBetween(task.deadline);

    if (daysLeft < 0) score += 50;
    else if (daysLeft <= 2) score += 20;
    else if (daysLeft <= 5) score += 10;

    return score;
}

function isUrgent(task) {
    if (!task.deadline || task.status === "done") return false;

    const daysLeft = daysBetween(task.deadline);

    return (
        daysLeft < 0 ||
        (daysLeft <= 2 && task.priority >= 2) ||
        (task.priority === 3 && daysLeft <= 5)
    );
}

function formatDate(dateStr) {
    return dateStr
        ? new Date(dateStr).toLocaleString("th-TH")
        : "-";
}

function sortTasks() {
    tasks.sort((a, b) => calculateScore(b) - calculateScore(a));
}

/* ============================= */
/* RENDER */
/* ============================= */

function renderTasks() {

    const urgentList = document.getElementById("urgentList");
    const taskList = document.getElementById("taskList");
    const doneList = document.getElementById("doneList");

    urgentList.innerHTML = "";
    taskList.innerHTML = "";
    doneList.innerHTML = "";

    /* ===== URGENT ===== */
    const urgentTasks = tasks
        .filter(task => isUrgent(task) && task.status !== "done")
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (urgentTasks.length === 0) {
        urgentList.innerHTML =
            `<li class="empty-state urgent-empty">None</li>`;
    } else {
        urgentTasks.forEach(task => {
            const li = createTaskElement(task, false);
            urgentList.appendChild(li);
        });
    }

    /* ===== ACTIVE TASKS (todo + doing) ===== */
    const activeTasks = tasks.filter(task => task.status !== "done");

    if (activeTasks.length === 0) {
        taskList.innerHTML =
            `<li class="empty-state">None</li>`;
    } else {
        activeTasks.forEach(task => {
            const li = createTaskElement(task, true);
            taskList.appendChild(li);
        });
    }

    /* ===== DONE TASKS ===== */
    const completedTasks = tasks.filter(task => task.status === "done");

    if (completedTasks.length === 0) {
        doneList.innerHTML =
            `<li class="empty-state">None</li>`;
    } else {
        completedTasks.forEach(task => {
            const li = createTaskElement(task, true);
            doneList.appendChild(li);
        });
    }

    attachDynamicEvents();
}


/* ============================= */
/* EVENTS */
/* ============================= */

function attachDynamicEvents() {

    /* Status Change */
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", function () {
            const id = Number(this.dataset.id);
            updateTask(id, { status: this.value });
        });
    });

    /* Delete */
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const id = Number(this.dataset.id);
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        });
    });

    /* Edit */
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            openEditModal(Number(this.dataset.id));
        });
    });
}

function updateTask(id, updates) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, ...updates, updatedAt: nowISO() }
            : task
    );

    sortTasks();
    saveTasks();
    renderTasks();
}

/* ============================= */
/* ADD MODAL */
/* ============================= */

function validateAddModal() {
    const title = document.getElementById("addTitle").value.trim();
    const deadline = document.getElementById("addDeadline").value;
    const errorDiv = document.getElementById("addError");

    let errors = [];

    if (!title) errors.push("Please enter task name");
    if (!deadline) errors.push("Please select deadline");

    if (errors.length) {
        errorDiv.innerHTML = errors.join("<br>");
        return false;
    }

    errorDiv.innerHTML = "";
    return true;
}

function openAddModal() {
    document.getElementById("addModal").classList.remove("hidden");
}

function closeAddModal() {
    document.getElementById("addModal").classList.add("hidden");
    document.getElementById("addError").innerHTML = "";
}

document.getElementById("addBtn").addEventListener("click", openAddModal);
document.getElementById("cancelAddModal").addEventListener("click", closeAddModal);

document.getElementById("confirmAdd").addEventListener("click", function () {

    if (!validateAddModal()) return;

    const newTask = {
        id: Date.now(),
        title: document.getElementById("addTitle").value.trim(),
        description: document.getElementById("addDescription").value.trim(),
        deadline: document.getElementById("addDeadline").value,
        priority: Number(document.getElementById("addPriority").value),
        status: document.getElementById("addStatus").value,
        createdAt: nowISO(),
        updatedAt: nowISO()
    };

    tasks.push(newTask);

    sortTasks();
    saveTasks();
    renderTasks();
    closeAddModal();
});

/* ============================= */
/* EDIT MODAL */
/* ============================= */

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("editId").value = task.id;
    document.getElementById("editTitle").value = task.title;
    document.getElementById("editDescription").value = task.description || "";
    document.getElementById("editDeadline").value = task.deadline || "";
    document.getElementById("editPriority").value = task.priority;
    document.getElementById("editStatus").value = task.status;

    document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}

document.getElementById("cancelEdit").addEventListener("click", closeEditModal);

document.getElementById("saveEdit").addEventListener("click", function () {

    const id = Number(document.getElementById("editId").value);

    updateTask(id, {
        title: document.getElementById("editTitle").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        deadline: document.getElementById("editDeadline").value || null,
        priority: Number(document.getElementById("editPriority").value),
        status: document.getElementById("editStatus").value
    });

    closeEditModal();
});

/* ============================= */
/* INIT */
/* ============================= */

sortTasks();
renderTasks();
