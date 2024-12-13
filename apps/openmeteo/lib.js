
function openMeteoToBangleWeather(openMeteo) {
  let weather = {};
  weather.time = openMeteo.current.time;
  weather.hum = openMeteo.current.relative_humidity_2m;
  weather.temp = openMeteo.current.temperature_2m;
  weather.code = openMeteo.current.weather_code;
  weather.wdir = openMeteo.current.wind_direction_10m | 0;
  weather.wind = openMeteo.current.wind_speed_10m;
  weather.loc = "";
  weather.txt = "";
  weather.hpa = openMeteo.current.surface_pressure;
  weather.wrose = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'n'][Math.floor((weather.wdir + 22.5) / 45)];
  return weather
}

exports.fetch = function(cb) {
  if (!cb) cb = () => {};
  if (!Bangle.http){
    cb(/*LANG*/"No http method found");
    return;
  }
  let location = require("Storage").readJSON("mylocation.json", 1) || {
    "lat": 52.47,
    "lon": 13.40,
    "location": "Berlin"
  };
  const uri = "https://api.open-meteo.com/v1/forecast?latitude=" +location.lat.toFixed(2)+ "&longitude=" +location.lon.toFixed(2)+ "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&timeformat=unixtime&forecast_days=1"
  Bangle.http(uri, {timeout:10000}).then(event => {
    const bangleWeather = openMeteoToBangleWeather(event.resp);

    let json = require("Storage").readJSON('weather.json') || {};
    json.weather = bangleWeather;
    require("Storage").writeJSON('weather.json', json);

    if (require("Storage").read("weather") !== undefined) require("weather").emit("update", bangleWeather);

    cb(bangleWeather);
  }).catch((e)=>{
    cb(e);
  });
};
