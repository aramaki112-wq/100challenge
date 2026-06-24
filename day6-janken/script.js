const hands = ["グー", "チョキ", "パー"];

let winCount = 0;
let loseCount = 0;
let drawCount = 0;

document.getElementById("rockButton")
    .addEventListener("click", function () {
        play("グー");
    });

document.getElementById("scissorsButton")
    .addEventListener("click", function () {
        play("チョキ");
    });

document.getElementById("paperButton")
    .addEventListener("click", function () {
        play("パー");
    });

function play(playerHand) {

    document.getElementById("result").textContent = "CPUが考え中...";

    const randomIndex = Math.floor(Math.random() * 3);
    const computerHand = hands[randomIndex];

    setTimeout(function () {

        document.getElementById("playerChoice").textContent =
            "あなた： " + playerHand;

        document.getElementById("computerChoice").textContent =
            "CPU： " + computerHand;

        let result;

        if (playerHand === computerHand) {

            result = "あいこ！";
            drawCount++;

        } else if (
            (playerHand === "グー" && computerHand === "チョキ") ||
            (playerHand === "チョキ" && computerHand === "パー") ||
            (playerHand === "パー" && computerHand === "グー")
        ) {

            result = "あなたの勝ち！";
            winCount++;

        } else {

            result = "CPUの勝ち！";
            loseCount++;
        }

        document.getElementById("result").textContent = result;

        document.getElementById("win").textContent = winCount;
        document.getElementById("lose").textContent = loseCount;
        document.getElementById("draw").textContent = drawCount;

        const totalGames = winCount + loseCount;

        let winRate = 0;

        if (totalGames > 0) {
            winRate = ((winCount / totalGames) * 100).toFixed(1);
        }

        document.getElementById("rate").textContent = winRate;

    }, 1000);
}