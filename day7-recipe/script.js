/*
====================================
① データ読み込み
====================================
*/

// 保存済みレシピを読み込む
let recipes =
JSON.parse(
    localStorage.getItem("recipes")
) || [];

// 編集対象の番号
let editIndex =
localStorage.getItem("editIndex");

/*
====================================
② recipe.html 初期化
====================================
*/

const stepsContainer =
document.getElementById("stepsContainer");

if (stepsContainer) {

    // 工程入力欄作成
    createStepInputs();

    // レシピ一覧表示
    displayRecipes();

    // 編集データ読み込み
    loadRecipeForEdit();

    // 保存ボタン
    document
        .getElementById("saveButton")
        .addEventListener(
            "click",
            saveRecipe
        );
}

/*
====================================
工程入力欄作成
====================================
*/

function createStepInputs() {

    for(let i = 1; i <= 10; i++) {

        const box =
        document.createElement("div");

        box.className =
        "step-box";

        box.innerHTML = `
            <h3>工程${i}</h3>

            <textarea
                id="step${i}"
                placeholder="工程を入力"
            ></textarea>

            <textarea
                id="note${i}"
                placeholder="備考を入力"
            ></textarea>
        `;

        stepsContainer.appendChild(box);
    }
}

/*
====================================
③ 編集データ読み込み
====================================
*/

function loadRecipeForEdit() {

    if(editIndex === null){
        return;
    }

    const recipe =
    recipes[editIndex];

    if(!recipe){
        return;
    }

    document
        .getElementById("recipeName")
        .value =
        recipe.name;

    recipe.steps.forEach(
        function(item,index){

            document
                .getElementById(
                    `step${index+1}`
                )
                .value =
                item.step;

            document
                .getElementById(
                    `note${index+1}`
                )
                .value =
                item.note;

        }
    );

    document
        .getElementById("saveButton")
        .textContent =
        "更新保存";
}

/*
====================================
④ レシピ保存
====================================
*/

function saveRecipe(){

    const recipeName =
    document
        .getElementById("recipeName")
        .value
        .trim();

    if(recipeName === ""){

        alert(
            "料理名を入力してください"
        );

        return;
    }

    const steps = [];

    for(let i = 1; i <= 10; i++){

        const step =
        document
            .getElementById(
                `step${i}`
            )
            .value
            .trim();

        const note =
        document
            .getElementById(
                `note${i}`
            )
            .value
            .trim();

        if(step !== ""){

            steps.push({

                step: step,
                note: note

            });

        }
    }

    /*
    編集モード
    */

    if(editIndex !== null){

        recipes[editIndex] = {

            name: recipeName,
            steps: steps

        };

    }

    /*
    新規登録モード
    */

    else{

        recipes.push({

            name: recipeName,
            steps: steps

        });

    }

    // 保存
    localStorage.setItem(
        "recipes",
        JSON.stringify(recipes)
    );

    // 編集モード解除
    localStorage.removeItem(
        "editIndex"
    );

    alert("保存しました");

    location.reload();
}

/*
====================================
⑤ レシピ一覧表示
====================================
*/

function displayRecipes(){

    const recipeList =
    document.getElementById(
        "recipeList"
    );

    if(!recipeList){
        return;
    }

    recipeList.innerHTML = "";

    recipes.forEach(
        function(recipe,index){

            const div =
            document.createElement("div");

            div.className =
            "recipe-item";

            div.innerHTML = `

                <span
                    class="recipe-link"
                    onclick="editRecipe(${index})"
                >

                    ${recipe.name}

                </span>

                <button
                    class="delete-btn"
                    onclick="deleteRecipe(${index})"
                >

                    削除

                </button>

            `;

            recipeList.appendChild(div);

        }
    );
}

/*
====================================
⑥ 編集処理
====================================
*/

function editRecipe(index){

    localStorage.setItem(
        "editIndex",
        index
    );

    location.href =
    "recipe.html";
}

/*
====================================
⑦ 削除処理
====================================
*/

function deleteRecipe(index){

    const answer =
    confirm(
        "削除しますか？"
    );

    if(!answer){
        return;
    }

    recipes.splice(
        index,
        1
    );

    localStorage.setItem(
        "recipes",
        JSON.stringify(recipes)
    );

    displayRecipes();
}

/*
====================================
⑧ 献立表示
====================================
*/

const randomButton =
document.getElementById(
    "randomButton"
);

if(randomButton){

    randomButton.addEventListener(
        "click",
        randomRecipe
    );
}

function randomRecipe(){

    const result =
    document.getElementById(
        "result"
    );

    if(recipes.length === 0){

        result.innerHTML =
        "<p>レシピがありません</p>";

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

    `<h2>${recipe.name}</h2>`;

    recipe.steps.forEach(
        function(item,index){

            html += `

            <p>

                <strong>
                工程${index+1}
                </strong>

                <br>

                ${item.step}

            </p>

            <p>

                備考：
                ${item.note}

            </p>

            <hr>

            `;

        }
    );

    result.innerHTML =
    html;
}