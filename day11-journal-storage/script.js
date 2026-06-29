const diaryInput = document.getElementById("diaryInput");
const addButton = document.getElementById("addButton");
const diaryList = document.getElementById("diaryList");

// 日記データを保存する配列
let diaries = [];

// ---------- 初回起動 ----------

// localStorageにデータがあるか確認
const savedData = localStorage.getItem("diaries");

if (savedData) {
    diaries = JSON.parse(savedData);
}

displayDiaries();

// ---------- ボタン ----------

addButton.addEventListener("click", () => {

    const text = diaryInput.value.trim();

    if (text === "") {
        alert("日記を入力してください。");
        return;
    }

    diaries.push(text);

    saveData();

    displayDiaries();

    diaryInput.value = "";

});

// ---------- 保存 ----------

function saveData(){

    localStorage.setItem(
        "diaries",
        JSON.stringify(diaries)
    );

}

// ---------- 表示 ----------

function displayDiaries(){

    diaryList.innerHTML = "";

    diaries.forEach((diary,index)=>{

        const diaryDiv=document.createElement("div");

        diaryDiv.className="diary";

        diaryDiv.textContent=diary;

        const deleteButton=document.createElement("button");

        deleteButton.textContent="削除";

        deleteButton.className="deleteButton";

        deleteButton.addEventListener("click",()=>{

            diaries.splice(index,1);

            saveData();

            displayDiaries();

        });

        diaryDiv.appendChild(deleteButton);

        diaryList.appendChild(diaryDiv);

    });

}