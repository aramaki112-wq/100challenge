const todoInput = document.getElementById("todoInput");

const addButton = document.getElementById("addButton");

const todoList = document.getElementById("todoList");

let todos = [];

// ---------------------------
// 保存
// ---------------------------

function saveTodos(){

    localStorage.setItem("todos", JSON.stringify(todos));

}

// ---------------------------
// 読み込み
// ---------------------------

function loadTodos(){

    const savedTodos = localStorage.getItem("todos");

    if(savedTodos){

        todos = JSON.parse(savedTodos);

    }

}

// ---------------------------
// 画面表示
// ---------------------------

function renderTodos(){

    todoList.innerHTML = "";

    todos.forEach(function(todo,index){

        const li = document.createElement("li");

        li.textContent = todo;

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "削除";

        deleteButton.className = "deleteButton";

        deleteButton.addEventListener("click",function(){

            todos.splice(index,1);

            saveTodos();

            renderTodos();

        });

        li.appendChild(deleteButton);

        todoList.appendChild(li);

    });

}

// ---------------------------
// 追加
// ---------------------------

function addTodo(){

    const text = todoInput.value.trim();

    if(text===""){

        alert("Todoを入力してください");

        return;

    }

    todos.push(text);

    saveTodos();

    renderTodos();

    todoInput.value="";

    todoInput.focus();

}

// ---------------------------
// ボタン
// ---------------------------

addButton.addEventListener("click",addTodo);

// ---------------------------
// Enterキー
// ---------------------------

todoInput.addEventListener("keydown",function(event){

    if(event.key==="Enter"){

        addTodo();

    }

});

// ---------------------------
// 起動時
// ---------------------------

loadTodos();

renderTodos();