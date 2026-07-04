// ==============================
// LocalStorage Key
// ==============================

const STORAGE_KEY = "todoList";


// ==============================
// HTML取得
// ==============================

const taskInput = document.getElementById("taskInput");

const priority = document.getElementById("priority");

const category = document.getElementById("category");

const memo = document.getElementById("memo");

const startDate = document.getElementById("startDate");

const dueDate = document.getElementById("dueDate");

const saveButton = document.getElementById("saveButton");

const taskList = document.getElementById("taskList");


// ==============================
// 編集用
// ==============================

let editIndex = null;


// ==============================
// データ読込
// ==============================

let todos =
    JSON.parse(localStorage.getItem(STORAGE_KEY))
    || [];


// ==============================
// 保存
// ==============================

function saveTodos() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(todos)
    );

}


// ==============================
// 表示
// ==============================

function displayTodos() {

    taskList.innerHTML = "";

    todos.forEach((todo, index) => {

        const div = document.createElement("div");

        div.className = "task";

        if (todo.completed) {

            div.classList.add("completed");

        }

        div.innerHTML = `

<h3>${todo.task}</h3>

<p>優先度：${todo.priority}</p>

<p>カテゴリー：${todo.category}</p>

<p>開始日：${todo.startDate}</p>

<p>期限日：${todo.dueDate}</p>

<p>メモ：${todo.memo}</p>

<p>状態：
${todo.completed ? "完了" : "未完了"}
</p>

<button onclick="toggleComplete(${index})">
状態変更
</button>

<button onclick="editTodo(${index})">
編集
</button>

<button onclick="deleteTodo(${index})">
削除
</button>

`;

        taskList.appendChild(div);

    });

}


// ==============================
// 保存ボタン
// ==============================

saveButton.addEventListener("click", () => {

    const todo = {

        task: taskInput.value,

        priority: priority.value,

        category: category.value,

        memo: memo.value,

        startDate: startDate.value,

        dueDate: dueDate.value,

        completed: false

    };

    if (editIndex === null) {

        todos.push(todo);

    } else {

        todo.completed =
            todos[editIndex].completed;

        todos[editIndex] = todo;

        editIndex = null;

    }

    saveTodos();

    displayTodos();

});


// ==============================
// 完了切替
// ==============================

function toggleComplete(index) {

    todos[index].completed =
        !todos[index].completed;

    saveTodos();

    displayTodos();

}


// ==============================
// 編集
// ==============================

function editTodo(index) {

    const todo = todos[index];

    taskInput.value = todo.task;

    priority.value = todo.priority;

    category.value = todo.category;

    memo.value = todo.memo;

    startDate.value = todo.startDate;

    dueDate.value = todo.dueDate;

    editIndex = index;

}


// ==============================
// 削除
// ==============================

function deleteTodo(index) {

    todos.splice(index, 1);

    saveTodos();

    displayTodos();

}


// ==============================
// 初期表示
// ==============================

displayTodos();