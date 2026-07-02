const todoInput = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const todoList = document.getElementById("todoList");
const count = document.getElementById("count");

const todos = [];

function render() {

    todoList.innerHTML = "";

    todos.forEach(function (todo, index) {

        const li = document.createElement("li");

        li.innerHTML = `
            <span>${todo}</span>
            <button class="deleteButton">削除</button>
        `;

        const deleteButton = li.querySelector(".deleteButton");

        deleteButton.addEventListener("click", function () {

            todos.splice(index, 1);

            render();

        });

        todoList.appendChild(li);

    });

    count.textContent = `Todo ${todos.length}件`;

}

function addTodo() {

    const text = todoInput.value.trim();

    if (text === "") {
        return;
    }

    todos.push(text);

    todoInput.value = "";

    render();

}

addButton.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        addTodo();

    }

});