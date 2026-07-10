const cityInput = document.getElementById('city-input');
const head = document.getElementById('head');
const prayerTimes = document.getElementById('prayer-times');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const searchBtn = document.getElementById('get-weather-btn');

const PRAYER_IDS = {
    Fajr: 'fajr',
    Dhuhr: 'dhuhr',
    Asr: 'asr',
    Maghrib: 'maghrib',
    Isha: 'isha'
};

async function getCity() {
    const city = cityInput.value.trim();

    if (!city) {
        swal('Oops!', 'Please enter a city name.', 'warning');
        return;
    }

    setLoading(true);

    try {
        // 1. Turn the city name into coordinates
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) throw new Error('Geocoding request failed');
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            swal('City not found', 'Please check the spelling and try again.', 'error');
            setLoading(false);
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Fetch prayer times for those coordinates
        const prayerRes = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`
        );
        if (!prayerRes.ok) throw new Error('Prayer times request failed');
        const prayerData = await prayerRes.json();

        const timings = prayerData.data.timings;
        const readableDate = prayerData.data.date.readable;

        // 3. Populate the UI
        Object.entries(PRAYER_IDS).forEach(([key, id]) => {
            document.getElementById(id).textContent = formatTime(timings[key]);
        });

        dateEl.textContent = readableDate;
        timeEl.textContent = `${name}${country ? ', ' + country : ''}`;

        head.hidden = false;
        prayerTimes.hidden = false;
    } catch (err) {
        console.error(err);
        swal('Error', 'Something went wrong while fetching prayer times. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

function formatTime(rawTime) {
    // AlAdhan returns times like "05:12 (EET)" — strip the timezone label
    return rawTime.split(' ')[0];
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchBtn.textContent = isLoading ? 'Searching...' : 'Search';
}

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getCity();
});