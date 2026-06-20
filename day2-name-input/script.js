const button = document.getElementById("showButton");

button.addEventListener("click", function () {

    const name =
//.valueは入力欄の中身を取得するという意味
    document.getElementById("nameInput").value;

    document.getElementById("message").textContent =
        "こんにちは " + name + " さん！";

});