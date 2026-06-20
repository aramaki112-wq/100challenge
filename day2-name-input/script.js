const button = document.getElementById("showButton");

button.addEventListener("click", function () {

    const name =

    document.getElementById("nameInput").value;

    document.getElementById("message").textContent =
        "こんにちは " + name + " さん！";

});