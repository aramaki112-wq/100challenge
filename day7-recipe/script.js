let recipes =
JSON.parse(
localStorage.getItem("recipes")
) || [];

/*
--------------------------------
recipe.html用
--------------------------------
*/

const stepsContainer =
document.getElementById(
"stepsContainer"
);

if(stepsContainer){

    for(let i=1;i<=10;i++){

        const box =
        document.createElement("div");

        box.className =
        "step-box";

        box.innerHTML=`
        <h3>工程${i}</h3>

        <textarea
        id="step${i}"
        placeholder="工程"
        ></textarea>

        <textarea
        id="note${i}"
        placeholder="備考"
        ></textarea>
        `;

        stepsContainer.appendChild(box);
    }

    displayRecipes();

    document
    .getElementById("saveButton")
    .addEventListener(
    "click",
    saveRecipe
    );
}

/*
--------------------------------
レシピ保存
--------------------------------
*/

function saveRecipe(){

    const recipeName =
    document
    .getElementById(
    "recipeName"
    )
    .value
    .trim();

    if(recipeName===""){
        alert(
        "料理名を入力してください"
        );
        return;
    }

    const steps=[];

    for(let i=1;i<=10;i++){

        const step =
        document
        .getElementById(
        `step${i}`
        ).value;

        const note =
        document
        .getElementById(
        `note${i}`
        ).value;

        if(step!==""){

            steps.push({

                step:step,
                note:note

            });

        }
    }

    recipes.push({

        name:recipeName,
        steps:steps

    });

    localStorage.setItem(
    "recipes",
    JSON.stringify(recipes)
    );

    alert("保存しました");

    location.reload();
}

/*
--------------------------------
レシピ一覧
--------------------------------
*/

function displayRecipes(){

    const recipeList =
    document.getElementById(
    "recipeList"
    );

    recipeList.innerHTML="";

    recipes.forEach(
    function(recipe,index){

        const div =
        document.createElement("div");

        div.className=
        "recipe-item";

        div.innerHTML=`

        <strong>
        ${recipe.name}
        </strong>

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

/*
--------------------------------
削除
--------------------------------
*/

function deleteRecipe(index){

    recipes.splice(index,1);

    localStorage.setItem(
    "recipes",
    JSON.stringify(recipes)
    );

    displayRecipes();
}

/*
--------------------------------
index.html用
--------------------------------
*/

const randomButton =
document.getElementById(
"randomButton"
);

if(randomButton){

    randomButton
    .addEventListener(
    "click",
    randomRecipe
    );
}

function randomRecipe(){

    const result =
    document.getElementById(
    "result"
    );

    if(recipes.length===0){

        result.innerHTML=
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
    `<h2>${recipe.name}</h2>`;

    recipe.steps.forEach(
    function(item,index){

        html +=`

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

    });

    result.innerHTML =
    html;
}