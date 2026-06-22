const textInput = document.getElementById("textInput");
const showButton = document.getElementById("showButton");
const hideButton = document.getElementById("hideButton");
const result = document.getElementById("result");

showButton.addEventListener("click", function () {

    result.textContent = textInput.value;

});

hideButton.addEventListener("click", function () {

    result.textContent = "";

});