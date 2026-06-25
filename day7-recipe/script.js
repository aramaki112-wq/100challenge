const recipeName = document.getElementById("recipeName");
const stepsContainer = document.getElementById("stepsContainer");
const saveButton = document.getElementById("saveButton");
const randomButton = document.getElementById("randomButton");
const result = document.getElementById("result");
const recipeList = document.getElementById("recipeList");

let recipes = [];

/*
----------------------------------
工程入力欄を10個作成
----------------------------------
*/

for (let i = 1; i <= 10; i++) {

    const box = document.createElement("div");
    box.className = "step-box";

    box.innerHTML = `
        <h3>工程${i}</h3>

        <textarea
            id="step${i}"
            placeholder="工程を入力"
        ></textarea>

        <textarea
            id="note${i}"
            placeholder="備考"
        ></textarea>
    `;

    stepsContainer.appendChild(box);
}

/*
----------------------------------
保存データ読み込み
----------------------------------
*/

const savedRecipes =
    localStorage.getItem("recipes");

if (savedRecipes) {
    recipes = JSON.parse(savedRecipes);
}

/*
----------------------------------
レシピ一覧表示
----------------------------------
*/

function displayRecipes() {

    recipeList.innerHTML = "";

    recipes.forEach((recipe, index) => {

        const div =
            document.createElement("div");

        div.className = "recipe-item";

        div.innerHTML = `
            <strong>${recipe.name}</strong>
            <button
                class="delete-btn"
                onclick="deleteRecipe(${index})"
            >
                削除
            </button>
        `;

        recipeList.appendChild(div);

    });
}

displayRecipes();

/*
----------------------------------
レシピ登録
----------------------------------
*/

saveButton.addEventListener(
    "click",
    function () {

        const name =
            recipeName.value.trim();

        if (name === "") {
            alert("料理名を入力してください");
            return;
        }

        const steps = [];

        for (let i = 1; i <= 10; i++) {

            const step =
                document.getElementById(
                    `step${i}`
                ).value;

            const note =
                document.getElementById(
                    `note${i}`
                ).value;

            if (step !== "") {

                steps.push({
                    step: step,
                    note: note
                });

            }
        }

        recipes.push({
            name: name,
            steps: steps
        });

        localStorage.setItem(
            "recipes",
            JSON.stringify(recipes)
        );

        alert("保存しました");

        location.reload();
    }
);

/*
----------------------------------
ランダム献立
----------------------------------
*/

randomButton.addEventListener(
    "click",
    function () {

        if (recipes.length === 0) {

            result.innerHTML =
                "レシピがありません";

            return;
        }

        const randomIndex =
            Math.floor(
                Math.random()
                * recipes.length
            );

        const recipe =
            recipes[randomIndex];

        let html =
            `<h3>${recipe.name}</h3>`;

        recipe.steps.forEach(
            function (item, index) {

                html += `
                    <p>
                    <strong>
                    工程${index + 1}
                    </strong><br>
                    ${item.step}
                    </p>

                    <p>
                    備考：
                    ${item.note}
                    </p>
                `;
            }
        );

        result.innerHTML = html;
    }
);

/*
----------------------------------
削除
----------------------------------
*/

function deleteRecipe(index) {

    recipes.splice(index, 1);

    localStorage.setItem(
        "recipes",
        JSON.stringify(recipes)
    );

    displayRecipes();
}