// Zmienna określająca czy ekran z wyszukiwaniem jest widoczny
let showSearch = true;

const searchScreen = document.getElementById("search-screen");
const weatherScreen = document.getElementById("weather-screen");

// Zmienna ktora dostanie dane z api
let weatherData;

// Pola tekstu z informacjami o pogodzie
const cityDisplay = document.getElementById("display-city");

const tempStat = document.getElementById("temp-stat");
const weatherBadge = document.getElementById("weather-badge");

const windStat = document.getElementById("wind-stat");
const rainStat = document.getElementById("rain-stat");
const humidityStat = document.getElementById("hum-stat");
const uvStat = document.getElementById("uv-stat");

const chartTitle = document.getElementById("chart-title");

// Funkcja, ktora ustawia widocznosc ekranow
const setScreen = () => {
  searchScreen.classList.toggle("hidden", !showSearch);
  weatherScreen.classList.toggle("hidden", showSearch);
}

const setShowSearch = ()=>{
  showSearch = true;
  setScreen();
}

const setShowWeather = () => {
  showSearch = false;
  setScreen();
}


// Usun na koniec to jest do zmiany ekranu
document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape"){
    showSearch = !showSearch;
    setScreen();
  }
})

// Ladowanie ekranow
document.addEventListener("DOMContentLoaded", (e) => {
  console.log("a");
  setScreen();
});


//
// Obsługa api
//
const apiKey = "af7027fc154c9fd56576c35a026a235a";

async function getCoordsByZip(zipCode, countryCode = 'PL') {
  const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Błąd pobierania danych');
    const data = await response.json();
    console.log("Lokalizacja (kod):", data);
    return data; // Zwraca { name, lat, lon, country }
  } catch (error) {
    console.error("Wystąpił problem:", error);
  }
}

async function getCoordsByCity(cityName) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Błąd pobierania danych (miasto)');
    const data = await response.json();
    if (!data || data.length === 0) throw new Error("Nie znaleziono miasta w bazie.");
    return data[0]; // Zwraca pierwszy pasujący wynik: { name, lat, lon, country }
  } catch (error) {
    console.error("Wystąpił problem:", error);
  }
}

async function getCurrentWeatherXHR(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=eng`;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        console.log("Aktualna pogoda (XHR - Async):", response);
        resolve(response); // "Sukces"
      } else {
        console.error("Błąd serwera:", xhr.statusText);
        reject(xhr.statusText); // "Błąd"
      }
    };

    xhr.onerror = () => reject("Błąd sieciowy");
    xhr.send();
  });
}

async function get5DayForecastFetch(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=eng`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Problem z odpowiedzią sieci: ${response.status}`);
    }
    const data = await response.json();
    console.log("Prognoza 5-dniowa (Fetch - Async):", data);
    return data;
  } catch (error) {
    console.error("Wystąpił błąd podczas pobierania prognozy:", error);
  }
}

// GŁÓWNA FUNKCJA - używa powyższych klocków
async function getFullWeatherReport(query, isPostal) {
  try {
    // Wziecie lokalizacji
    const geoData = isPostal ? await getCoordsByZip(query) : await getCoordsByCity(query);
    const { lat, lon, name } = geoData;

    // Wyslanie dwoch zapytan asynchronicznie
    const [current, forecast] = await Promise.all([
      getCurrentWeatherXHR(lat, lon), // pogoda godzinowa
      get5DayForecastFetch(lat, lon) // pogoda dzienna
    ]);

    // Mapowanie do struktury, ktora uzywa chart
    const weatherData = {
      city: name,
      hourly: forecast.list.slice(0, 6).map(item => ({
        time: item.dt_txt.split(' ')[1].substring(0, 5),
        temp: Math.round(item.main.temp),
        wind: `${Math.round(item.wind.speed * 3.6)} km/h`,
        rain: `${Math.round((item.pop || 0) * 100)}%`,
        condition: item.weather[0].id,
        humidity: `${item.main.humidity}%`,
        pressure: `${item.main.pressure} hPa`
      })),
      daily: forecast.list.filter(item => item.dt_txt.includes("12:00:00")).map(item => {
        const date = new Date(item.dt * 1000);
        return {
          time: ["Niedz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"][date.getDay()],
          temp: Math.round(item.main.temp),
          wind: `${Math.round(item.wind.speed * 3.6)} km/h`,
          rain: `${Math.round((item.pop || 0) * 100)}%`,
          condition: item.weather[0].id,
          humidity: `${item.main.humidity}%`,
          pressure: `${item.main.pressure} hPa`
        };
      })
    };

    return { success: true, data: weatherData };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/*
// --- TESTY (W razie problemow z weather sprawdzaj tym)  ---
getCoordsByCity("Szczecin").then(coords => {
  console.log("Test getCoordsByCity:", coords.name, coords.lat, coords.lon);
});

// Testowanie pełnego raportu dla miasta
getFullWeatherReport("Warszawa", false).then(res => console.log("Raport Miasto:", res));

// Testowanie pełnego raportu dla kodu
getFullWeatherReport("70-450", true).then(res => console.log("Raport Kod:", res));
*/



//
// Obsluga formularza
//

// Poprawny submit
const SearchCity = async (isPostalCode) => {
  const value = input.value.trim();

  // Wywolanie funckji ktora obsluguje zapytanie
  const result = await getFullWeatherReport(value, isPostalCode);

  if (result.success) {
    // Jeśli lokalizacja istnieje i dane zostały pobrane
    errorSpan.style.display = "none";

    weatherData = result.data;

    // Pokazanie strony z chart i re-render chartu
    setShowWeather();
    updateChart();
    updateStats(result.data.hourly[0]);
    cityDisplay.innerText = result.data.city;
  } else {
    // Nie znaleziono miasta (lub blad api)
    errorSpan.style.display = "block";
    errorSpan.innerText = "Nie znaleziono takiej lokalizacji w bazie pogodowej.";
    console.log("Błąd API:", result.message);
  }
};

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const errorSpan = document.getElementById("error-info");

// regex
// tylko litery, spacje i myślniki
// min. 2 znaki
const cityRegex = /^[\p{L}\s-]{2,}$/u;
const postalCodeRegex = /^\d{2}-\d{3}$/; // 2 cyfry myslnik 3 cyfry

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const value = input.value.trim();

  const isCity = cityRegex.test(value);
  const isPostal = postalCodeRegex.test(value);

  if (isCity || isPostal) {
    console.log("OK: ->", value);
    SearchCity(isPostal,value);
  } else {
    errorSpan.style.display = "block";
    errorSpan.innerText = "Wpisz poprawne miasto lub kod pocztowy";
    console.log("Błąd: wpisz poprawne miasto lub kod pocztowy ->", value);
  }
});

//
// Ekran z wykresem
//
let currentPeriod = "hourly";
let myChart = null;



const handleBadge = (condition) => {
  const weatherBadgeMap = {
    // ⚡ Burze (2xx)
    200: "BURZA Z LEKKIM DESZCZEM ⛈",
    201: "BURZA Z DESZCZEM ⛈",
    202: "BURZA Z ULEWĄ ⛈",
    210: "LEKKA BURZA ⚡",
    211: "BURZA ⚡",
    212: "SILNA BURZA ⚡",
    221: "GWAŁTOWNA BURZA ⚡",
    230: "BURZA Z MŻAWKĄ ⛈",
    231: "BURZA Z MŻAWKĄ ⛈",
    232: "BURZA Z INTENSYWNĄ MŻAWKĄ ⛈",

    // 🌦 Mżawka (3xx)
    300: "LEKKA MŻAWKA 🌦",
    301: "MŻAWKA 🌦",
    302: "INTENSYWNA MŻAWKA 🌦",
    310: "MŻAWKA Z DESZCZEM 🌦",
    311: "MŻAWKA Z DESZCZEM 🌦",
    312: "INTENSYWNA MŻAWKA Z DESZCZEM 🌦",
    313: "PRZELOTNA MŻAWKA 🌦",
    314: "INTENSYWNA PRZELOTNA MŻAWKA 🌦",
    321: "PRZELOTNA MŻAWKA 🌦",

    // 🌧 Deszcz (5xx)
    500: "LEKKI DESZCZ 🌧",
    501: "UMIARKOWANY DESZCZ 🌧",
    502: "INTENSYWNY DESZCZ 🌧",
    503: "BARDZO INTENSYWNY DESZCZ 🌧",
    504: "EKSTREMALNY DESZCZ 🌧",
    511: "MARZNĄCY DESZCZ 🌨",
    520: "LEKKIE OPADY PRZELOTNE 🌧",
    521: "OPADY PRZELOTNE 🌧",
    522: "INTENSYWNE OPADY PRZELOTNE 🌧",
    531: "NIEREGULARNE OPADY PRZELOTNE 🌧",

    // ❄ Śnieg (6xx)
    600: "LEKKIE OPADY ŚNIEGU 🌨",
    601: "OPADY ŚNIEGU ❄",
    602: "INTENSYWNE OPADY ŚNIEGU ❄",
    611: "ŚNIEG Z DESZCZEM 🌨",
    612: "LEKKI ŚNIEG Z DESZCZEM 🌨",
    613: "ŚNIEG Z DESZCZEM 🌨",
    615: "DESZCZ ZE ŚNIEGIEM 🌨",
    616: "DESZCZ ZE ŚNIEGIEM 🌨",
    620: "LEKKIE PRZELOTNE OPADY ŚNIEGU 🌨",
    621: "PRZELOTNE OPADY ŚNIEGU ❄",
    622: "INTENSYWNE PRZELOTNE OPADY ŚNIEGU ❄",

    // 🌫 Atmosfera (7xx)
    701: "MGŁA 🌫",
    711: "DYM 🌫",
    721: "ZAMGLENIE 🌫",
    731: "WIRY PIASKOWE 🌪",
    741: "GĘSTA MGŁA 🌫",
    751: "BURZA PIASKOWA 🌪",
    761: "ZAPYLENIE 🌪",
    762: "PYŁ WULKANICZNY 🌋",
    771: "SZKWAŁ 💨",
    781: "TORNADO 🌪",

    // ☀ Bezchmurnie (800)
    800: "SŁONECZNIE ☀️",

    // ☁ Zachmurzenie (80x)
    801: "MAŁE ZACHMURZENIE 🌤",
    802: "CZĘŚCIOWE ZACHMURZENIE ⛅",
    803: "DUŻE ZACHMURZENIE 🌥",
    804: "CAŁKOWITE ZACHMURZENIE ☁",
  }; // Rzutowanie wykonane przez Claude 4.6 Sonnet

  console.log(condition);
  console.log(weatherBadgeMap[condition] ?? "BRAK DANYCH");
  weatherBadge.innerText = weatherBadgeMap[condition] ?? "BRAK DANYCH";
}


const updateStats=(data)=> {
  tempStat.innerText = data.temp + "°";
  windStat.innerText = data.wind;
  rainStat.innerText = data.rain;
  humidityStat.innerText = data.humidity;
  uvStat.innerText = data.pressure;
  handleBadge(data.condition);
}

const getChartConfig=()=> {
  const dataset = weatherData[currentPeriod];
  const labels = dataset.map((d) => d.time);
  const values = dataset.map((d) => d.temp);

  return {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          borderColor: "#2d3436",
          borderWidth: 4,
          backgroundColor: "rgba(133, 227, 255, 0.5)",
          fill: true,
          tension: 0.4,
          borderRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedData = weatherData[currentPeriod][index];
          updateStats(selectedData);
        }
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          callbacks: {
            title: (items) => {
              const index = items[0].dataIndex;
              return weatherData[currentPeriod][index].time;
            },

            label: (item) => {
              const data = weatherData[currentPeriod][item.dataIndex];

              return [
                `🌡 Temp: ${data.temp}°`,
                `💨 Wiatr: ${data.wind}`,
                `💧 Wilgotność: ${data.humidity}`,
                `🌧 Deszcz: ${data.rain}`,
                `🔵 Ciśnienie: ${data.pressure}`,
              ];
            },
          },
        },
      },

      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#2d3436",
            font: { family: "Fredoka", weight: "700" },
          },
        },
        y: {
          grid: { color: "#eee", borderDash: [5, 5] },
          ticks: {
            color: "#2d3436",
            callback: (v) => v + "°",
          },
        },
      },
    },
  };
} // Wykres wygenerowany przez chatGPT


const updateChart=()=> {
  if (myChart) myChart.destroy();
  const ctx = document.getElementById("weatherChart").getContext("2d");
  myChart = new Chart(ctx, getChartConfig());
}

const togglePeriod = (period) => {
  currentPeriod = period;
  document.getElementById("btn-hourly").classList.toggle("active", period === "hourly");
  document.getElementById("btn-daily").classList.toggle("active", period === "daily");
  const titleText = period === "hourly" ? "Temperatura (24h)" : "Temperatura (5 dni)";
  chartTitle.innerText = titleText;
  updateChart();
}




