/**************************************************************************
 * Task Management App Ver2
 * DAY18.5 Release Candidate
 *
 * Purpose:
 *   DAY19以降の土台となるタスク管理アプリの正式版
 *
 * Architecture:
 *   Config
 *   State
 *   DOM Cache
 *   Initialize
 *   Event
 *   Flow
 *   Validation
 *   Factory
 *   TaskService
 *   StorageService
 *   Render
 *   Component
 *   Utility
 **************************************************************************/


/* ==========================================================================
   Config
========================================================================== */

const CONFIG = {
    STORAGE_KEY: "tasks",
    MAX_TITLE_LENGTH: 100,
    DATE_LOCALE: "ja-JP"
};


/* ==========================================================================
   State
========================================================================== */

const state = {
    currentFilter: "all"
};


/* ==========================================================================
   Data
========================================================================== */

let tasks = [];


/* ==========================================================================
   DOM Cache
========================================================================== */

const dom = {
    taskForm: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    taskList: document.getElementById("taskList"),

    totalCount: document.getElementById("totalCount"),
    activeCount: document.getElementById("activeCount"),
    completedCount: document.getElementById("completedCount"),

    emptyState: document.getElementById("emptyState"),

    filterButtons: document.querySelectorAll("[data-filter]")
};


/* ==========================================================================
   Initialize
========================================================================== */

function init() {
    initializeData();
    initializeEvents();
    render();
}

document.addEventListener("DOMContentLoaded", init);


function initializeData() {
    tasks = taskService.getAll();
}


function initializeEvents() {
    setupTaskFormEvent();
    setupFilterEvents();
}


/* ==========================================================================
   Event Layer
========================================================================== */

function setupTaskFormEvent() {
    if (!dom.taskForm) return;

    dom.taskForm.addEventListener("submit", handleTaskSubmit);
}


function setupFilterEvents() {
    dom.filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            handleFilterClick(button.dataset.filter);
        });
    });
}


function handleTaskSubmit(event) {
    event.preventDefault();
    addTaskFlow();
}


function handleFilterClick(filter) {
    changeFilterFlow(filter);
}


function handleToggleClick(id) {
    toggleTaskFlow(id);
}


function handleEditClick(id) {
    const task = taskService.findById(id);

    if (!task) return;

    const input = prompt(
        "タスク名を編集してください",
        task.title
    );

    if (input === null) return;

    editTaskFlow(id, input);
}


function handleDeleteClick(id) {
    const result = confirm("このタスクを削除しますか？");

    if (!result) return;

    deleteTaskFlow(id);
}


/* ==========================================================================
   Flow Layer
========================================================================== */

function addTaskFlow() {
    const title = dom.taskInput.value.trim();

    if (!validateTask(title)) return;

    taskService.add(title);

    clearTaskInput();

    render();
}


function changeFilterFlow(filter) {
    state.currentFilter = filter;
    render();
}


function toggleTaskFlow(id) {
    taskService.toggle(id);
    render();
}


function editTaskFlow(id, title) {
    const trimmedTitle = title.trim();

    if (!validateTask(trimmedTitle)) return;

    taskService.update(id, {
        title: trimmedTitle
    });

    render();
}


function deleteTaskFlow(id) {
    taskService.remove(id);
    render();
}


/* ==========================================================================
   Validation Layer
========================================================================== */

function validateTask(title) {
    if (title === "") {
        alert("タスクを入力してください。");
        return false;
    }

    if (title.length > CONFIG.MAX_TITLE_LENGTH) {
        alert(`タスク名は${CONFIG.MAX_TITLE_LENGTH}文字以内で入力してください。`);
        return false;
    }

    return true;
}


/* ==========================================================================
   Factory Layer
========================================================================== */

function createTask(title) {
    return {
        id: createId(),
        title,
        completed: false,
        createdAt: new Date().toISOString()
    };
}
/* ==========================================================================
   Task Service
========================================================================== */
/*
 * Taskに関する処理をまとめる
 * tasks配列を直接操作するのはこのServiceだけにする
 */

const taskService = {

    getAll() {
        return storageService.load();
    },

    getFiltered() {
        return getFilteredTasks(tasks, state.currentFilter);
    },

    getStatistics() {
        return getTaskStatistics(tasks);
    },

    findById(id) {
        return tasks.find(task => task.id === id);
    },

    add(title) {
        const task = createTask(title);

        tasks = [
            ...tasks,
            task
        ];

        this.persist();
    },

    update(id, updatedData) {
        tasks = tasks.map(task => {
            if (task.id !== id) {
                return task;
            }

            return {
                ...task,
                ...updatedData
            };
        });

        this.persist();
    },

    toggle(id) {
        tasks = tasks.map(task => {
            if (task.id !== id) {
                return task;
            }

            return {
                ...task,
                completed: !task.completed
            };
        });

        this.persist();
    },

    remove(id) {
        tasks = tasks.filter(task => task.id !== id);

        this.persist();
    },

    persist() {
        storageService.save(tasks);
    }

};


/* ==========================================================================
   Storage Service
========================================================================== */
/*
 * 保存方法を担当する
 * 今はLocalStorage、将来はFirebase等に差し替え可能
 */

const storageService = {

    save(data) {
        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify(data)
        );
    },

    load() {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        try {
            return JSON.parse(savedData);
        } catch (error) {
            console.error("保存データの読み込みに失敗しました。", error);
            return [];
        }
    }

};


/* ==========================================================================
   Render Layer
========================================================================== */
/*
 * 画面更新の唯一の入口
 */

function render() {
    renderSummary();
    renderFilter();
    renderTaskList();
    renderEmptyState();
}


/* ==========================================================================
   Render : Summary
========================================================================== */

function renderSummary() {
    const statistics = taskService.getStatistics();

    if (dom.totalCount) {
        dom.totalCount.textContent = statistics.total;
    }

    if (dom.activeCount) {
        dom.activeCount.textContent = statistics.active;
    }

    if (dom.completedCount) {
        dom.completedCount.textContent = statistics.completed;
    }
}


/* ==========================================================================
   Render : Filter
========================================================================== */

function renderFilter() {
    dom.filterButtons.forEach(button => {
        const isActive = button.dataset.filter === state.currentFilter;

        button.classList.toggle("active", isActive);

        button.setAttribute(
            "aria-selected",
            String(isActive)
        );
    });
}


/* ==========================================================================
   Render : Task List
========================================================================== */

function renderTaskList() {
    if (!dom.taskList) return;

    dom.taskList.innerHTML = "";

    const filteredTasks = taskService.getFiltered();

    filteredTasks.forEach(task => {
        dom.taskList.appendChild(
            createTaskCard(task)
        );
    });
}


/* ==========================================================================
   Render : Empty State
========================================================================== */

function renderEmptyState() {
    if (!dom.emptyState) return;

    const filteredTasks = taskService.getFiltered();

    dom.emptyState.classList.toggle(
        "hidden",
        filteredTasks.length > 0
    );
}


/* ==========================================================================
   Component : Task Card
========================================================================== */

function createTaskCard(task) {
    const card = document.createElement("article");

    card.className = "task-card fade-in";
    card.dataset.id = task.id;

    if (task.completed) {
        card.classList.add("completed");
    }

    card.append(
        createTaskContent(task),
        createTaskActions(task)
    );

    return card;
}


/* ==========================================================================
   Component : Task Content
========================================================================== */

function createTaskContent(task) {
    const content = document.createElement("div");

    content.className = "task-content";

    content.append(
        createTaskMeta(task),
        createBadgeArea(task)
    );

    return content;
}


/* ==========================================================================
   Component : Task Meta
========================================================================== */

function createTaskMeta(task) {
    const meta = document.createElement("div");

    meta.className = "task-meta";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const date = document.createElement("p");
    date.className = "task-date";
    date.textContent = `作成日：${formatDate(task.createdAt)}`;

    meta.append(title, date);

    return meta;
}
/* ==========================================================================
   Component : Badge Area
========================================================================== */

function createBadgeArea(task) {
    const badgeArea = document.createElement("div");

    badgeArea.className = "badge-area";

    badgeArea.appendChild(
        createStatusBadge(task)
    );

    return badgeArea;
}


/* ==========================================================================
   Component : Status Badge
========================================================================== */

function createStatusBadge(task) {
    const badge = document.createElement("span");

    badge.className = "badge";

    if (task.completed) {
        badge.classList.add("badge-completed");
        badge.textContent = "完了";
    } else {
        badge.classList.add("badge-today");
        badge.textContent = "進行中";
    }

    return badge;
}


/* ==========================================================================
   Component : Task Actions
========================================================================== */

function createTaskActions(task) {
    const actions = document.createElement("div");

    actions.className = "task-actions";

    actions.append(
        createCompleteButton(task),
        createEditButton(task),
        createDeleteButton(task)
    );

    return actions;
}


/* ==========================================================================
   Component : Complete Button
========================================================================== */

function createCompleteButton(task) {
    const button = createIconButton({
        icon: task.completed ? "↺" : "✓",
        className: "complete-button",
        label: task.completed ? "未完了に戻す" : "完了にする"
    });

    button.addEventListener("click", () => {
        handleToggleClick(task.id);
    });

    return button;
}


/* ==========================================================================
   Component : Edit Button
========================================================================== */

function createEditButton(task) {
    const button = createIconButton({
        icon: "✏",
        className: "edit-button",
        label: "編集する"
    });

    button.addEventListener("click", () => {
        handleEditClick(task.id);
    });

    return button;
}


/* ==========================================================================
   Component : Delete Button
========================================================================== */

function createDeleteButton(task) {
    const button = createIconButton({
        icon: "🗑",
        className: "delete-button",
        label: "削除する"
    });

    button.addEventListener("click", () => {
        handleDeleteClick(task.id);
    });

    return button;
}


/* ==========================================================================
   Component : Icon Button
========================================================================== */

function createIconButton({ icon, className, label }) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `icon-button ${className}`;
    button.textContent = icon;

    button.setAttribute("aria-label", label);

    return button;
}


/* ==========================================================================
   Utility : Filter
========================================================================== */

function getFilteredTasks(taskList, filter) {
    switch (filter) {
        case "completed":
            return taskList.filter(task => task.completed);

        case "active":
            return taskList.filter(task => !task.completed);

        default:
            return taskList;
    }
}


/* ==========================================================================
   Utility : Statistics
========================================================================== */

function getTaskStatistics(taskList) {
    const total = taskList.length;

    const completed = taskList.filter(task => task.completed).length;

    const active = total - completed;

    return {
        total,
        active,
        completed
    };
}


/* ==========================================================================
   Utility : Date
========================================================================== */

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(
        CONFIG.DATE_LOCALE,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* ==========================================================================
   Utility : Input
========================================================================== */

function clearTaskInput() {
    if (!dom.taskInput) return;

    dom.taskInput.value = "";
    dom.taskInput.focus();
}


/* ==========================================================================
   Utility : ID
========================================================================== */

function createId() {
    if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return String(Date.now());
}