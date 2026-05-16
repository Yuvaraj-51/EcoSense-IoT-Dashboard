const firebaseConfig = {

  databaseURL:
  "https://ecosense-iot-31890-default-rtdb.asia-southeast1.firebasedatabase.app"

};

/* INITIALIZE FIREBASE */

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

/* DATA ARRAYS */

let tempData = [];
let humData = [];
let airData = [];
let co2Data = [];
let labels = [];

/* STATS */

let count = 0;
let tempTotal = 0;
let peakAir = 0;

/* CREATE CHART */

function createChart(id, color) {

  return new Chart(
    document.getElementById(id),

    {
      type: "line",

      data: {

        labels: labels,

        datasets: [{

          data: [],

          borderColor: color,

          backgroundColor: color + "22",

          fill: true,

          tension: 0.45,

          pointRadius: 0,

          borderWidth: 2
        }]
      },

      options: {

        responsive: true,

        animation: false,

        plugins: {

          legend: {
            display: false
          }
        },

        scales: {

          x: {
            display: false
          },

          y: {
            display: false
          }
        }
      }
    }
  );
}

/* CHARTS */

const tempChart =
  createChart("tempChart", "#ffd400");

const humChart =
  createChart("humChart", "#00eaff");

const airChart =
  createChart("airChart", "#00ff88");

const co2Chart =
  createChart("co2Chart", "#bf4cff");

/* UPDATE CHART */

function updateChart(chart, arr) {

  chart.data.labels = labels;

  chart.data.datasets[0].data = arr;

  chart.update();
}

/* ADD LOG */

function addLog(temp, hum, air) {

  const logs =
    document.getElementById("logs");

  const time =
    new Date().toLocaleTimeString();

  const div =
    document.createElement("div");

  div.className = "log";

  div.innerText =
    `${time}  Reading #${count}
     | Temp=${temp}°C
     | Humidity=${hum}%
     | AQI=${air}`;

  logs.prepend(div);

  if (logs.children.length > 8) {

    logs.removeChild(logs.lastChild);
  }
}

/* AIR STATUS */

function getAirStatus(air) {

  if (air < 50) {

    return ["● GOOD", "normal"];
  }

  if (air < 150) {

    return ["● MODERATE", "moderate"];
  }

  return ["● POOR", "danger"];
}

/* SOUND ALERT */

function playBeep() {

  const audio =
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    );

  audio.play();
}

/* CLOSE POPUP */

let popupActive = false;

function closePopup() {

  document
    .getElementById("popupAlert")
    .classList.add("hidden");

  popupActive = false;
}

/* CHECK DANGER */

function checkDanger(temp, hum, air) {

  const alertBox =
    document.getElementById("dangerAlert");

  const popup =
    document.getElementById("popupAlert");

  const popupMessage =
    document.getElementById("popupMessage");

  let messages = [];

  /* LIMITS */

  if (temp >= 35) {

    messages.push("High Temperature");
  }

  if (hum >= 73) {

    messages.push("High Humidity");
  }

  if (air >= 150) {

    messages.push("Poor Air Quality");
  }

  /* SHOW ALERT */

  if (messages.length > 0) {

    alertBox.classList.remove("hidden");

    alertBox.innerText =
      "⚠️ DANGER: " + messages.join(", ");

    popupMessage.innerText =
      messages.join(", ");

    if (!popupActive) {

      popup.classList.remove("hidden");

      playBeep();

      popupActive = true;
    }

  } else {

    alertBox.classList.add("hidden");

    popup.classList.add("hidden");

    popupActive = false;
  }
}

/* FIREBASE LIVE DATA */

database.ref("sensor")
.on("value", (snapshot) => {

  const data = snapshot.val();

  if (!data) return;

  /* SENSOR VALUES */

  const temperature =
    Number(data.temperature).toFixed(1);

  const humidity =
    Number(data.humidity).toFixed(1);

  const airQuality =
    Number(data.airQuality);

  const co2 =
    400 + airQuality * 8;

  /* SHOW VALUES */

  document.getElementById("temperature")
    .innerText = temperature;

  document.getElementById("humidity")
    .innerText = humidity;

  document.getElementById("airQuality")
    .innerText = airQuality;

  document.getElementById("co2")
    .innerText = co2;

  /* AIR STATUS */

  const [statusText, statusClass] =
    getAirStatus(airQuality);

  const airStatus =
    document.getElementById("airStatus");

  airStatus.innerText = statusText;

  airStatus.className =
    "badge " + statusClass;

  /* CHECK ALERT */

  checkDanger(
    Number(temperature),
    Number(humidity),
    airQuality
  );

  /* STATS */

  count++;

  tempTotal += Number(temperature);

  peakAir =
    Math.max(peakAir, airQuality);

  document.getElementById("count")
    .innerText = count;

  document.getElementById("avgTemp")
    .innerText =
    (tempTotal / count).toFixed(1) + " °C";

  document.getElementById("peakAir")
    .innerText = peakAir;

  /* TIME */

  const time =
    new Date().toLocaleTimeString();

  labels.push(time);

  tempData.push(temperature);

  humData.push(humidity);

  airData.push(airQuality);

  co2Data.push(co2);

  /* LIMIT GRAPH */

  if (labels.length > 20) {

    labels.shift();

    tempData.shift();

    humData.shift();

    airData.shift();

    co2Data.shift();
  }

  /* UPDATE CHARTS */

  updateChart(tempChart, tempData);

  updateChart(humChart, humData);

  updateChart(airChart, airData);

  updateChart(co2Chart, co2Data);

  /* ADD LOG */

  addLog(
    temperature,
    humidity,
    airQuality
  );
});