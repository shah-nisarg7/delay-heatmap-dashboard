async function loadData(){
    const status = document.getElementById("status");
    try {
        const response = await fetch("/api/data"); //changing static data in data.json to live updating data
        if (!response.ok){
            throw new Error("HTTP"+ response.status);

        }
        const stations = await response.json();
        status.style.display = "none";
        updateTimestamp();
        setupFilters(stations);
        applyFilters();

    } catch(err){
        console.error("failed to load data.json",err);
        status.textContent = "Could not load data. Try refreshing";

    }
}
function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

function renderTable(stations) {
  const body = document.getElementById("data-body");
  body.innerHTML = "";
  if (stations.length ===0){
    body.innerHTML = "<tr><td colspan='4'> No stations selected. </td></tr>";
    return;
  }
  for (const s of stations) {
    const row = document.createElement("tr");
    row.className ="clickabl-row";
    row.addEventListener("click",function(){
        showDetail(s);
    })
    addCell(row, s.station);
    addCell(row, s.train_count);
    addCell(row, s.avg_delay_minutes);
    addCell(row, s.lines.join(", "));
    body.appendChild(row);
  }
}

function delayTocolor(delay) {
    //0min then bright green, 5m + then red (according to swiss standards lol)
    const capped = Math.min(delay, 5);
    const hue = 120-(capped/5)*120;
    return "hsl(" + hue + ",80%,55%)";


}

let stationsData = [];
function setupFilters(stations){
    allStations = stations;
    const box = document.getElementById("filters");
    box.innerHTML= "";
    stations.forEach(function(s){
        const label = document.createElement("label");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = true;
        check.value = s.station;
        check.addEventListener("change",applyFilters);
        label.appendChild(check);
        label.appendChild(document.createTextNode(" "+ s.station));
        box.appendChild(label);


    });

}

function applyFilters(){

    const checked = document.querySelectorAll("#filters input:checked");
    const names = Array.from(checked).map(function(c){
        return c.value;

    });
    const visible = allStations.filter(function(s){
        return names.includes(s.station);
    });
    renderTable(visible);
    renderCircles(visible);
}
let animationStarted = false; 

function renderCircles(stations) {
    stationsData = stations; 
    if (!animationStarted) {
        animationStarted = true;
        requestAnimationFrame(animate);
    }


}

function animate(time) {
    drawFrame(time/1000);
    requestAnimationFrame(animate);

}

function drawFrame(t) {

    const canvas = document.getElementById("art");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(stationsData.length ===0){
        ctx.fillStyle= "#888";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No stations selected",canvas.width/2,canvas.height /2);
        return;
    }
    const columns = 3;
    const cellW = canvas.width / columns;
    const cellH = canvas.height/2;

    stationsData.forEach(function(s,i){
        const x= (i%columns)*cellW + cellW/2;
        const y= Math.floor(i/columns)*cellH + cellH/2 -20; //doing -20 rn bcs the text cutoff from canvas
        const color = delayTocolor(s.avg_delay_minutes);
        const baseRadius = 15 + Math.min(s.train_count, 20) * 3;
        //making busier stations have faster pulse 
        const speed = 1+s.train_count/8;
        //making the circle look like its breathing

        const radius = baseRadius + Math.sin(t*speed + i) *6;
        ctx.save()
        ctx.shadowColor = color;
        ctx.shadowBlur =25;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        //making the ring ripple (constant breathing effect basically)
        const progress = (t*speed*0.3 +i*0.2) % 1;
        ctx.beginPath();
        ctx.arc(x,y,baseRadius + progress*40,0,Math.PI*2);
        ctx.strokeStyle = color;
        ctx.lineWidth =3;
        ctx.globalAlpha= 1-progress;
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#eee";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText (s.station,x,y+baseRadius +50);
    
    
    });
    document.getElementById("art").addEventListener("click",function(e){
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width;
        const scaleY = canvas.height/rect.height;
        const clickX = (e.clientX-rect.left)* scaleX;
        const clickY = (e.clientY-rect.top)*scaleY;

        const columns = 3;
        const cellW = canvas.width/columns;
        const cellH = canvas.height/2;

        stationsData.forEach(function(s,i){
            const x = (i%columns)*cellW + cellW/2;
            const y = Math.floor(i/columns)* cellH + cellH/2 -20;
            const dist = Math.sqrt((clickX-x)**2 +(clickY-y)**2);
            if(dist<50){
                showDetail(s);
            }
        }); 
    });
}


function updateTimestamp(){
    const e1 = document.getElementById("last-updated");
    const now = new Date();
    e1.textContent= "Last updated" + now.toLocaleTimeString();
}

function showDetail(station){
    const panel = document.getElementById("detail-panel");
    const title = document.getElementById("detail-title");
    const list = document.getElementById("detail-list");

    title.textContent = station.station;
    list.innerHTML= "";

    if(!station.upcoming || station.upcoming.length ===0){
        list.innerHTML= "<li> no upcoming departures found. </li>";

    }else{
        station.upcoming.forEach(function(dep){
            const li = document.createElement("li");
            const delayText = dep.deplay === null ? "": (dep.delay>0 ? "(+" + dep.delay + "m)" : " (on time)");
            li.textContent = dep.time + "" + dep.line + "->> " + dep.to + delayText;
            list.appendChild(li);
        });  
    }

    panel.classList.remove("hidden");
    panel.scrollIntoView({behaviour:"smooth", block : "nearest"});
}
loadData();
document.getElementById("close-detail").addEventListener("click", function () {
  document.getElementById("detail-panel").classList.add("hidden");
});
document.getElementById("refresh-btn").addEventListener("click", loadData);