const button = document.getElementById("helloButton");
//document.getElementByIdはHTMLの中から()の要素を探し出してbuttonに渡す

button.addEventListener("click", function () {
    document.getElementById("message").textContent = "こんにちは";
});
// textContent → 文字変更　= 文字を表示する