const citySelect = document.getElementById("citySelect");
const addButton = document.getElementById("addButton");
const clockList = document.getElementById("clockList");

let cities =
JSON.parse(localStorage.getItem("cities")) || [];

function saveCities(){

localStorage.setItem(
"cities",
JSON.stringify(cities)
);

}

function drawClock(){

clockList.innerHTML="";

cities.forEach((city,index)=>{

const now =
new Date().toLocaleTimeString("ja-JP",{

timeZone:city,

hour:"2-digit",

minute:"2-digit",

second:"2-digit"

});

const div=document.createElement("div");

div.className="clock";

div.innerHTML=`

<span>

${city.split("/")[1]}

<br>

${now}

</span>

<button class="delete">

削除

</button>

`;

div.querySelector("button").onclick=()=>{

cities.splice(index,1);

saveCities();

drawClock();

};

clockList.appendChild(div);

});

}

addButton.onclick=()=>{

const city=citySelect.value;

if(!cities.includes(city)){

cities.push(city);

saveCities();

drawClock();

}

};

drawClock();

setInterval(drawClock,1000);