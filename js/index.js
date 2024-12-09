"use strict";
const apiKey = "a9f2e415f6274499800121048240912";
const todayWeather = document.querySelector("#todayWeather");
const tomorrowWeather = document.querySelector("#tomorrowWeather");
const dayAfterTomorrowWeather = document.querySelector(
	"#dayAfterTomorrowWeather"
);
const locationInput = document.querySelector("#locationInp");

function formatDate(dateObj) {
	const formattedDate = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	}).format(dateObj);

	const [weekday, dayAndMonth] = formattedDate.split(", ");

	return {
		weekday,
		month: dayAndMonth.split(" ")[0],
		day: dayAndMonth.split(" ")[1],
	};
}

function getTodayData(data) {
	return {
		date: formatDate(new Date(data.forecast.forecastday[0].date)),
		location: data.location.name,
		temperature: data.current.temp_c,
		condition: {
			text: data.current.condition.text,
			icon: data.current.condition.icon,
		},
		chanceOfRain: data.forecast.forecastday[0].day.daily_chance_of_rain,
		windSpeed: data.current.wind_kph,
		windDirection: data.current.wind_dir,
	};
}

function getOtherDayData(data) {
	return {
		date: formatDate(new Date(data.date)),
		condition: {
			text: data.day.condition.text,
			icon: data.day.condition.icon,
		},
		temperature: {
			min: data.day.mintemp_c,
			max: data.day.maxtemp_c,
		},
	};
}

async function fetchWeatherAsync(location) {
	const response = await fetch(
		`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=3`
	);
	if (!response.ok) {
		return {
			status: response.status,
		};
	}

	const data = await response.json();

	const today = getTodayData(data);
	const tomorrow = getOtherDayData(data.forecast.forecastday[1]);
	const dayAfterTomorrow = getOtherDayData(data.forecast.forecastday[2]);

	return {
		status: response.status,
		today,
		tomorrow,
		dayAfterTomorrow,
	};
}

function displayTodayWeather(today) {
	const {
		date: { weekday, day, month },
		location,
		temperature,
		condition: { text, icon },
		chanceOfRain,
		windSpeed,
		windDirection,
	} = today;

	todayWeather.innerHTML = `
        <div class="weather__item rounded-start pb-3">
            <div class="p-2 d-flex justify-content-between align-items-center color__Secondary ">
                <span>
                    ${weekday}
                </span>
                <span>
                    ${day} ${month}
                </span>
            </div>

            <div class="my-3 p-4 d-flex flex-column justify-content-center align-items-center">
                <h3 class="fs-5 fw-normal color__Secondary">
                    ${location}
                </h3>
                <div class="display-1 fw-bold text-light my-3">
                    ${temperature}°C
                </div>
                <div class="d-flex flex-column justify-content-center align-items-center">
                    <img
                    class="d-block"
                    src="${icon}"
                    alt="an icon describing how the weather is ${text}"
                    >
                    <span class="color__info">
                        ${text}
                    </span>
                </div>
            </div>

            <div class="p-2 d-flex justify-content-around align-items-center color__Secondary">
                <div>
                    <i class="fa-solid fa-umbrella fa-lg me-1"></i>
                    <span>
                        ${chanceOfRain}%
                    </span>
                </div>
                <div>
                    <i class="fa-solid fa-wind fa-lg me-1"></i>
                    <span>
                        ${windSpeed} km/h
                    </span>
                </div>
                <div>
                    <i class="fa-regular fa-compass fa-lg me-1"></i>
                    <span>
                        ${windDirection}
                    </span>
                </div>
            </div>
    </div>
    `;
}

function displayOtherDayWeather(otherDay, htmlElement) {
	const {
		date: { weekday },
		condition: { text, icon },
		temperature: { min, max },
	} = otherDay;

	htmlElement.innerHTML = `
        <div class="h-100 ${
					htmlElement.id === "tomorrowWeather"
						? "weather__item__stripped "
						: "weather__item rounded-end"
				} text-center">
            <div class="p-2 color__Secondary">
                ${weekday}
            </div>

            <div class="my-5">
                <img
                src="${icon}"
                alt="an icon describing how the weather is ${text}"
                >
                <div
                    class="my-4 d-flex flex-column justify-content-center align-items-center row-gap-2">
                    <span class="text-light h4">
                        ${max}°C
                    </span>
                    <span class="color__Secondary">
                        ${min}°C
                    </span>
                </div>

                <span class="color__info">
                    ${text}
                </span>
            </div>

        </div>
    `;
}

function renderWeather(data) {
	document.querySelector("#errorMsg")?.remove();

	const {
		today: todayObj,
		tomorrow: tomorrowObj,
		dayAfterTomorrow: dayAfterTomorrowObj,
	} = data;
	displayTodayWeather(todayObj);
	displayOtherDayWeather(tomorrowObj, tomorrowWeather);
	displayOtherDayWeather(dayAfterTomorrowObj, dayAfterTomorrowWeather);

	document.querySelector(
		"#tagLine"
	).textContent = `In ${todayObj.location} it is ${todayObj.condition.text} and ${todayObj.temperature}°C`;
}

function renderError(errorMessage) {
	if (document.querySelector("#errorMsg")) return;
	const errorMsgElement = document.createElement("div");
	errorMsgElement.id = "errorMsg";
	errorMsgElement.classList.add(
		"mb-3",
		"w-50",
		"mx-auto",
		"bg-danger",
		"text-center",
		"text-light",
		"p-3",
		"rounded-pill"
	);
	errorMsgElement.textContent = errorMessage;
	document.querySelector("#findYourLocation").append(errorMsgElement);
}

async function init(location) {
	const data = await fetchWeatherAsync(location);
	if (data.status === 200) renderWeather(data);
}

locationInput.addEventListener("input", (e) => {
	if (e.target.value) init(e.target.value);
});

navigator.geolocation.getCurrentPosition(
	async (position) => {
		const latitude = position.coords.latitude;
		const longitude = position.coords.longitude;

		const data = await fetchWeatherAsync(`${latitude},${longitude}`);
		if (data.status === 200) renderWeather(data);
		else
			renderError(
				`Make sure your API key is valid and try again (${data.status}). TRIAL Ends on 17/Dec/2024`
			);
	},
	(_) => {
		renderError(
			"Make sure your location is enabled and try again. Or you can manually enter your location."
		);
	}
);
