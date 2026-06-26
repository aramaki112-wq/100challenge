// =========================
// 都市一覧
// =========================

const countries = {
    "東京": "Asia/Tokyo",
    "下関": "Asia/Tokyo",
    "ソウル": "Asia/Seoul",
    "北京": "Asia/Shanghai",
    "NY": "America/New_York",
    "リオデジャネイロ": "America/Sao_Paulo",
    "パリ": "Europe/Paris"
};

// =========================
// ページの読み込み完了後
// =========================

document.addEventListener("DOMContentLoaded", function () {

    // index.html の場合
    if (document.getElementById("countrySelect")) {

        createSelect();

        document
            .getElementById("showButton")
            .addEventListener("click", startClock);

        document
            .getElementById("listButton")
            .addEventListener("click", function () {

                window.location.href = "times.html";

            });

    }

    // times.html の場合
    if (document.getElementById("backButton")) {

        document
            .getElementById("backButton")
            .addEventListener("click", function () {

                window.location.href = "index.html";

            });

    }

});

// =========================
// プルダウンを作る
// =========================

function createSelect() {

    const select = document.getElementById("countrySelect");

    for (const city in countries) {

        const option = document.createElement("option");

        option.value = city;

        option.textContent = city;

        select.appendChild(option);

    }

}
// =========================
// 時計開始
// =========================

let timer;

// 現在時刻の表示を開始する関数
function startClock() {

    // プルダウンで選ばれた都市名を取得
    const city = document.getElementById("countrySelect").value;

    // タイムゾーンを取得
    const timeZone = countries[city];

    // 前のタイマーが動いていたら止める
    clearInterval(timer);

    // すぐに1回表示
    updateClock(city, timeZone);

    // 1秒ごとに更新
    timer = setInterval(function () {

        updateClock(city, timeZone);

    }, 1000);

}

// =========================
// 時計更新
// =========================

function updateClock(city, timeZone) {

    const now = new Date();

    const date = now.toLocaleDateString("ja-JP", {

        timeZone: timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short"

    });

    const time = now.toLocaleTimeString("ja-JP", {

        timeZone: timeZone

    });

    document.getElementById("cityName").textContent = city;

    document.getElementById("date").textContent = date;

    document.getElementById("time").textContent = time;

}

// =========================
// 一覧ページ
// =========================

if (document.getElementById("clockList")) {

    function updateList() {

        const clockList = document.getElementById("clockList");

        clockList.innerHTML = "";

        for (const city in countries) {

            const card = document.createElement("div");

            card.className = "clockCard";

            const now = new Date();
            const date = now.toLocaleDateString("ja-JP", {

             timeZone: countries[city],
                 year: "numeric",
                month: "2-digit", 
                  day: "2-digit",
              weekday: "short"

            });

            const time = now.toLocaleTimeString("ja-JP", {

                timeZone: countries[city]

            });

            card.innerHTML = `
                <h2>${city}</h2>
                <p>${date}</p>
                <p>${time}</p>
            `;

            clockList.appendChild(card);

        }

    }

    updateList();

    setInterval(updateList, 1000);

}