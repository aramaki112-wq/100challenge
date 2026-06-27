// 今日の日付

const today = new Date();

const year = today.getFullYear();

const month = today.getMonth();


// HTML取得

const calendar = document.getElementById("calendar");

const monthTitle = document.getElementById("monthTitle");

const selectedDate = document.getElementById("selectedDate");

const diary = document.getElementById("diary");

const saveButton = document.getElementById("saveButton");

const updatedTime = document.getElementById("updatedTime");


// 保存データ

let diaryData =
JSON.parse(localStorage.getItem("diaryData"))
|| {};


// 現在選択日

let currentDate = "";


// タイトル表示

monthTitle.textContent =
`${year}年 ${month+1}月`;


// 月の日数

const lastDay =
new Date(year,month+1,0).getDate();


// カレンダー生成

for(let day=1; day<=lastDay; day++){

    const button =
    document.createElement("div");

    button.className="day";

    button.textContent=day;

    button.addEventListener("click",()=>{

        selectDate(day,button);

    });

    calendar.appendChild(button);

}
//==============================
// 日付選択
//==============================

function selectDate(day, button) {

    // 選択色をリセット
    document.querySelectorAll(".day").forEach(item => {
        item.classList.remove("selected");
    });

    button.classList.add("selected");

    currentDate =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    selectedDate.textContent =
        `選択日：${currentDate}`;

    // 保存済みデータを表示
    if (diaryData[currentDate]) {

        diary.value =
            diaryData[currentDate].diary;

        updatedTime.textContent =
            "最終更新：" +
            diaryData[currentDate].updated;

    } else {

        diary.value = "";

        updatedTime.textContent =
            "最終更新：なし";

    }

}



//==============================
// 保存
//==============================

saveButton.addEventListener("click", () => {

    if (currentDate === "") {

        alert("先に日付を選択してください。");

        return;

    }

    const now = new Date();

    const update =
        `${now.getFullYear()}/` +
        `${String(now.getMonth() + 1).padStart(2, "0")}/` +
        `${String(now.getDate()).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;

    diaryData[currentDate] = {

        diary: diary.value,

        updated: update

    };

    localStorage.setItem(

        "diaryData",

        JSON.stringify(diaryData)

    );

    updatedTime.textContent =
        "最終更新：" + update;

    alert("保存しました！");

});