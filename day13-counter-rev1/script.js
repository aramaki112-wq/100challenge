const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const lineCount = document.getElementById("lineCount");
const preview = document.getElementById("preview");
const clearButton = document.getElementById("clearButton");

const savedText = localStorage.getItem("day13Text");

if (savedText) {

    textInput.value = savedText;
    updateInfo();

}

textInput.addEventListener("input", () => {

    localStorage.setItem("day13Text", textInput.value);

    updateInfo();

});

clearButton.addEventListener("click", () => {

    textInput.value = "";

    localStorage.removeItem("day13Text");

    updateInfo();

});

function updateInfo() {

    const text = textInput.value;

    charCount.textContent = text.length;

    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    wordCount.textContent = words;

    const lines = text === ""
        ? 0
        : text.split("\n").length;

    lineCount.textContent = lines;

    preview.innerHTML = convertMarkdown(text);

}

function convertMarkdown(text) {

    return text

        .replace(/^### (.*$)/gm, "<h3>$1</h3>")

        .replace(/^## (.*$)/gm, "<h2>$1</h2>")

        .replace(/^# (.*$)/gm, "<h1>$1</h1>")

        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

        .replace(/\*(.*?)\*/g, "<em>$1</em>")

        .replace(/`(.*?)`/g, "<code>$1</code>")

        .replace(/\n/g, "<br>");

}