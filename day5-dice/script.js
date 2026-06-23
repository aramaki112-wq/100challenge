const generateButton = document.getElementById("generateButton");
const rollButton = document.getElementById("rollButton");
const diceContainer = document.getElementById("diceContainer");
const total = document.getElementById("total");
const diceCount = document.getElementById("diceCount");

let numberOfDice = 0;

generateButton.addEventListener("click", function () {

    numberOfDice = Math.floor(Math.random() * 10) + 1;

    diceCount.textContent =
        "サイコロ数：" + numberOfDice + "個";

    diceContainer.innerHTML = "";

    for (let i = 0; i < numberOfDice; i++) {

        const dice = document.createElement("div");

        dice.classList.add("dice");

        dice.textContent = "🎲";

        diceContainer.appendChild(dice);
    }

    total.textContent = "合計：0";
});

rollButton.addEventListener("click", function () {

    if (numberOfDice === 0) {
        alert("先にサイコロを生成してください");
        return;
    }

    const diceList =
        document.querySelectorAll(".dice");

    let sum = 0;

    diceList.forEach(function (dice) {

        const value =
            Math.floor(Math.random() * 6) + 1;

        dice.textContent = value;

        sum += value;
    });

    total.textContent = "合計：" + sum;
});