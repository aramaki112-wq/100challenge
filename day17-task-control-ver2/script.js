/**************************************************************************
 * Task Management App Ver2
 * DAY17 Release Complete
 *
 * Purpose:
 *   アプリ全体の状態管理・データ管理・画面更新を担当する
 *
 * Architecture:
 *   Event
 *      ↓
 *   Flow
 *      ↓
 * Validation
 *      ↓
 * Factory
 *      ↓
 * Data
 *      ↓
 * Storage
 *      ↓
 * Render
 *      ↓
 * Display
 **************************************************************************/


/* ==========================================================================
   Constants
   ========================================================================== */

const STORAGE_KEY = "tasks";


/* ==========================================================================
   State
   ========================================================================== */
/*
 * UI（画面）の状態を管理する
 * Taskデータとは分離する
 */

const state = {

    currentFilter: "all"

};


/* ==========================================================================
   Data
   ========================================================================== */
/*
 * タスクデータ本体
 */

let tasks = [];


/* ==========================================================================
   DOM Cache
   ========================================================================== */

const taskForm = document.getElementById("taskForm");

const taskInput = document.getElementById("taskInput");

const taskList = document.getElementById("taskList");

const filterButtons = document.querySelectorAll("[data-filter]");

const summary = document.getElementById("summary");


/* ==========================================================================
   Initialize
   ========================================================================== */

function init() {

    loadTasks();

    setupEvents();

    render();

}

document.addEventListener("DOMContentLoaded", init);


/* ==========================================================================
   Event Layer
   ========================================================================== */
/*
 * Eventは「何が起きたか」を受け取るだけ
 * 処理本体はFlow Layerへ渡す
 */

function setupEvents() {

    if (taskForm) {

        taskForm.addEventListener("submit", handleTaskSubmit);

    }

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            changeFilter(button.dataset.filter);

        });

    });

}


/* ==========================================================================
   Flow Layer
   ========================================================================== */
/*
 * Flowは処理の流れだけ管理する
 * 実際の仕事は各Layerへ依頼する
 */

function handleTaskSubmit(event) {

    event.preventDefault();

    addTask();

}


function addTask() {

    const title = taskInput.value.trim();

    if (!validateTask(title)) {

        return;

    }

    const task = createTask(title);

    insertTask(task);

    saveTasks();

    render();

    clearTaskInput();

}


function changeFilter(filter) {

    state.currentFilter = filter;

    render();

}
/* ==========================================================================
   Validation Layer
   ========================================================================== */
/*
 * 入力値の検証を担当する
 * 「正しいデータか？」だけを判断する
 */

function validateTask(title) {

    if (title === "") {

        alert("タスクを入力してください。");

        return false;

    }

    return true;

}


/* ==========================================================================
   Factory Layer
   ========================================================================== */
/*
 * Task Objectを生成する
 * Objectを作るだけで保存や追加は行わない
 */

function createTask(title) {

    return {

        id: Date.now(),

        title: title,

        completed: false,

        createdAt: new Date().toISOString()

    };

}


/* ==========================================================================
   Data Layer
   ========================================================================== */
/*
 * Taskデータの追加・更新・削除を担当する
 */

function insertTask(task) {

    tasks.push(task);

}


function updateTask(id, updatedTask) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {

                ...task,

                ...updatedTask

            };

        }

        return task;

    });

}


function deleteTask(id) {

    tasks = tasks.filter(task => task.id !== id);

}


function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {

                ...task,

                completed: !task.completed

            };

        }

        return task;

    });

}


/* ==========================================================================
   Storage Layer
   ========================================================================== */
/*
 * LocalStorageとのやり取りだけを担当する
 */

function saveTasks() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(tasks)

    );

}


function loadTasks() {

    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (!savedTasks) {

        tasks = [];

        return;

    }

    tasks = JSON.parse(savedTasks);

}
/* ==========================================================================
   Render Layer
   ========================================================================== */
/*
 * 画面更新の唯一の入口
 * DataとStateをもとにDisplay Layerへ描画を依頼する
 */

function render() {

    displayTasks();

    displaySummary();

    displayFilter();

}


/* ==========================================================================
   Display Layer
   ========================================================================== */
/*
 * 各Display関数は一つの表示領域だけを担当する
 */

function displayTasks() {

    if (!taskList) return;

    taskList.innerHTML = "";

    const filteredTasks = getFilteredTasks();

    filteredTasks.forEach(task => {

        const li = document.createElement("li");

        li.textContent = task.title;

        if (task.completed) {

            li.classList.add("completed");

        }

        taskList.appendChild(li);

    });

}


function displaySummary() {

    if (!summary) return;

    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    summary.textContent =
        `全${total}件 / 完了${completed}件`;

}


function displayFilter() {

    filterButtons.forEach(button => {

        button.classList.toggle(

            "active",

            button.dataset.filter === state.currentFilter

        );

    });

}


/* ==========================================================================
   Utility Layer
   ========================================================================== */
/*
 * 共通で利用する補助処理
 */

function getFilteredTasks() {

    switch (state.currentFilter) {

        case "completed":

            return tasks.filter(task => task.completed);

        case "active":

            return tasks.filter(task => !task.completed);

        default:

            return tasks;

    }

}


function clearTaskInput() {

    if (!taskInput) return;

    taskInput.value = "";

    taskInput.focus();

}