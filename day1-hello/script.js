const button = document.getElementById("helloButton");

button.addEventListener("click", function () {
    document.getElementById("message").textContent = "こんにちは";
});