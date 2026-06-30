// ===============================
// 必要なHTML要素を取得
// ===============================

const dateInput = document.getElementById("date");
const diaryInput = document.getElementById("diary");
const saveButton = document.getElementById("saveButton");
const message = document.getElementById("message");


// ===============================
// 今日の日付を取得
// ===============================

const today = new Date();


// 年・月・日を取得

const year = today.getFullYear();

const month = String(today.getMonth() + 1).padStart(2, "0");

const day = String(today.getDate()).padStart(2, "0");


// 2026-06-30 の形式にする

const todayString = `${year}-${month}-${day}`;

dateInput.value = todayString;


// ===============================
// 保存済みの日記を取得
// ===============================

let diaryData =
JSON.parse(localStorage.getItem("diary")) || {};


// ===============================
// 保存ボタン
// ===============================

saveButton.addEventListener("click", saveDiary);


// ===============================
// 日付変更
// ===============================

dateInput.addEventListener("change", loadDiary);


// ===============================
// 日記を保存
// ===============================

function saveDiary() {

    const selectedDate = dateInput.value;

    const diaryText = diaryInput.value;

    diaryData[selectedDate] = diaryText;

    localStorage.setItem(
        "diary",
        JSON.stringify(diaryData)
    );

    message.textContent = "保存しました！";

}


// ===============================
// 日記を読み込む
// ===============================

function loadDiary() {

    const selectedDate = dateInput.value;

    if (diaryData[selectedDate]) {

        diaryInput.value = diaryData[selectedDate];

    } else {

        diaryInput.value = "";

    }

    message.textContent = "";

}


// ===============================
// 最初に今日の日記を表示
// ===============================

loadDiary();