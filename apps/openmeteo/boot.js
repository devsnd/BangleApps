{
  let loading = false;
  let timeoutRef = null;
  const REFRESH_MILLIS = 60 * 60 * 1000;

  let onCompleted = function () {
    loading = false;
    if (timeoutRef) clearTimeout(timeoutRef);
    timeoutRef = setTimeout(loadIfDueAndReschedule, REFRESH_MILLIS);
  };

  let loadIfDueAndReschedule = function () {
    // also check if the weather.json file has been updated (e.g. force refresh)
    let weather = require("Storage").readJSON('weather.json') || {};
    let lastWeatherUpdate = weather && weather.weather && weather.weather.time && weather.weather.time || 0;
    let millisUntilDue = lastWeatherUpdate + REFRESH_MILLIS - Date.now();
    if (!millisUntilDue || millisUntilDue <= 0) {
      if (!loading) {
        loading = true;
        require("openmeteo").fetch(onCompleted);
      }
    } else {
      // called to early, reschedule
        if (timeoutRef) clearTimeout(timeoutRef);
      timeoutRef = setTimeout(loadIfDueAndReschedule, millisUntilDue + 1);
    }
  };

  setTimeout(loadIfDueAndReschedule, 5000);  // run 5 seconds after boot
  NRF.on('connect', loadIfDueAndReschedule);  // after reconnect, fetch the weather data right away if it's due
}
