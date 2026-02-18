let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
    if (!validateForm()) return;

    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("description").value;
    const deadline = document.getElementById("deadline").value;
    const priority = Number(document.getElementById("priority").value);
    const status = document.getElementById("status").value;

    if (title.trim() === "") return;

    const now = new Date().toISOString();

    const newTask = {
        id: Date.now(),
        title,
        description,
        priority,
        status,
        deadline: deadline || null,
        createdAt: now,
        updatedAt: now
    };

    tasks.push(newTask);

    sortTasks();
    saveTasks();
    renderTasks();

    document.getElementById("taskTitle").value = "";
    document.getElementById("description").value = "";
    document.getElementById("deadline").value = "";
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function calculateScore(task) {
    let score = task.priority * 10;

    if (task.deadline) {
        const diff = new Date(task.deadline) - new Date();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) score += 50;
        else if (daysLeft <= 2) score += 20;
        else if (daysLeft <= 5) score += 10;
    }

    return score;
}

function isUrgent(task) {
    if (!task.deadline || task.status === "done") return false;

    const diff = new Date(task.deadline) - new Date();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return true;
    if (daysLeft <= 2 && task.priority >= 2) return true;
    if (task.priority === 3 && daysLeft <= 5) return true;

    return false;
}

function sortTasks() {
    tasks.sort((a, b) => calculateScore(b) - calculateScore(a));
}

function renderTasks() {
    const urgentList = document.getElementById("urgentList");
    const list = document.getElementById("taskList");

    urgentList.innerHTML = "";
    list.innerHTML = "";

    /* ===== SORT URGENT BY DEADLINE ===== */
    const urgentTasks = tasks
        .filter(task => isUrgent(task))
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    /* ===== RENDER URGENT (READ ONLY) ===== */
    urgentTasks.forEach(task => {

        const urgentLi = document.createElement("li");
        const daysLeft = getDaysLeft(task.deadline);

        let badge = "";
        if (daysLeft < 0) {
            badge = `<span class="overdue">OVERDUE</span>`;
        } else {
            badge = `<span class="countdown">เหลือ ${daysLeft} วัน</span>`;
        }

        urgentLi.innerHTML = `
            <div>
                <strong>${task.title}</strong>
                <small>Deadline: ${task.deadline}</small>
                ${badge}
            </div>
        `;

        urgentList.appendChild(urgentLi);
    });

    /* ===== RENDER ALL TASKS (FULL EDITABLE) ===== */
    tasks.forEach(task => {

    const li = document.createElement("li");

    if (task.status === "done") {
        li.classList.add("done");
    }

    li.innerHTML = `
        <div>
            <strong>${task.title}</strong>
            <small>Deadline: ${task.deadline || "None"}</small>
            <div class="status">${task.status.toUpperCase()}</div>
            <div class="dates">
                <small>Created: ${formatDate(task.createdAt)}</small>
                <small>Updated: ${formatDate(task.updatedAt)}</small>
            </div>
        </div>

        <div>
            <button onclick="openEditModal(${task.id})">Edit</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `;

    list.appendChild(li);
});


    attachEditEvents();
}

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

    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title: document.getElementById("editTitle").value,
                description: document.getElementById("editDescription").value,
                deadline: document.getElementById("editDeadline").value || null,
                priority: Number(document.getElementById("editPriority").value),
                status: document.getElementById("editStatus").value,
                updatedAt: new Date().toISOString()
            };
        }
        return task;
    });

    sortTasks();
    saveTasks();
    renderTasks();
    closeEditModal();
});

function getDaysLeft(deadline) {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("th-TH");
}


function attachStatusEvents() {
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", function () {
            const id = Number(this.getAttribute("data-id"));
            const newStatus = this.value;

            tasks = tasks.map(task => {
                if (task.id === id) {
                    return {
                        ...task,
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                    };
                }
                return task;
            });

            sortTasks();
            saveTasks();
            renderTasks();
        });
    });
}

function attachEditEvents() {
    document.querySelectorAll("[data-field]").forEach(element => {
        element.addEventListener("change", function () {
            const id = Number(this.getAttribute("data-id"));
            const field = this.getAttribute("data-field");
            let value = this.value;

            tasks = tasks.map(task => {
                if (task.id === id) {
                    return {
                        ...task,
                        [field]: field === "priority" ? Number(value) : value,
                        updatedAt: new Date().toISOString()
                    };
                }
                return task;
            });

            sortTasks();
            saveTasks();
            renderTasks();
        });
    });
}

function validateForm() {
    const title = document.getElementById("taskTitle").value.trim();
    const deadline = document.getElementById("deadline").value;
    const errorDiv = document.getElementById("errorMessage");
    const addBtn = document.getElementById("addBtn");

    let errors = [];

    if (!title) errors.push("กรุณากรอกชื่องาน");
    if (!deadline) errors.push("กรุณาเลือกวันกำหนดส่ง");

    if (errors.length > 0) {
        errorDiv.innerHTML = errors.join("<br>");
        addBtn.disabled = true;
        return false;
    } else {
        errorDiv.innerHTML = "";
        addBtn.disabled = false;
        return true;
    }
}

document.getElementById("taskTitle").addEventListener("input", validateForm);
document.getElementById("deadline").addEventListener("change", validateForm);

sortTasks();
renderTasks();
validateForm();
