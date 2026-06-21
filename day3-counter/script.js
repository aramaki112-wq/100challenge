let count = 0;
let multipleCount = 0;

const countDisplay = document.getElementById("count");
const multipleDisplay = document.getElementById("multipleCount");

function updateDisplay() {

    countDisplay.textContent = count;

    if (count !== 0 && count % 3 === 0) {

        countDisplay.style.fontWeight = "bold";

        multipleCount++;
        multipleDisplay.textContent = multipleCount;

    } else {

        countDisplay.style.fontWeight = "normal";

    }
}

document.getElementById("plusButton").addEventListener("click", function () {
    count++;
    updateDisplay();
});

document.getElementById("minusButton").addEventListener("click", function () {
    count--;
    updateDisplay();
});

document.getElementById("resetButton").addEventListener("click", function () {

    count = 0;
    multipleCount = 0;

    countDisplay.textContent = 0;
    multipleDisplay.textContent = 0;
    countDisplay.style.fontWeight = "normal";

});