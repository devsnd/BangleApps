const storage = require('Storage');
const Layout = require('Layout');
const B2 = true;
g.theme.dark = false;

const weather = {};

let expiryTimeout;
function scheduleExpiry(json) {
  if (expiryTimeout) {
    clearTimeout(expiryTimeout);
    expiryTimeout = undefined;
  }
  let expiry = "expiry" in json ? json.expiry : 2*3600000;
  if (json.weather && json.weather.time && expiry) {
    let t = json.weather.time + expiry - Date.now();
    expiryTimeout = setTimeout(update, t);
  }
}

function update(weatherEvent) {
  let json = storage.readJSON('weather.json')||{};

  if (weatherEvent) {
    let weather = weatherEvent.clone();
    delete weather.t;
    weather.time = Date.now();
    if (weather.wdir != null) {
      // Convert numeric direction into human-readable label
      let deg = weather.wdir;
      while (deg<0 || deg>360) {
        deg = (deg+360)%360;
      }
      weather.wrose = ['n','ne','e','se','s','sw','w','nw','n'][Math.floor((deg+22.5)/45)];
    }

    json.weather = weather;
  }
  else {
    delete json.weather;
  }


  storage.write('weather.json', json);
  scheduleExpiry(json);
  weather.emit("update", json.weather);
}
weather.update = update;
const _GB = global.GB;
global.GB = (event) => {
  if (event.t==="weather") update(event);
  if (_GB) setTimeout(_GB, 0, event);
};

weather.get = function() {
  return (storage.readJSON('weather.json')||{}).weather;
}

scheduleExpiry(storage.readJSON('weather.json')||{});

function getPalette(monochrome, ovr) {
  var palette;
  if(monochrome) {
    palette = {
      sun: '#FFF',
      cloud: '#FFF',
      bgCloud: '#FFF',
      rain: '#FFF',
      lightning: '#FFF',
      snow: '#FFF',
      mist: '#FFF',
      background: '#000'
    };
  } else {
    if (B2) {
      if (ovr.theme.dark) {
        palette = {
          sun: '#FF0',
          cloud: '#FFF',
          bgCloud: '#777', // dithers on B2, but that's ok
          rain: '#0FF',
          lightning: '#FF0',
          snow: '#FFF',
          mist: '#FFF'
        };
      } else {
        palette = {
          sun: '#FF0',
          cloud: '#777', // dithers on B2, but that's ok
          bgCloud: '#000',
          rain: '#00F',
          lightning: '#FF0',
          snow: '#0FF',
          mist: '#0FF'
        };
      }
    } else {
      if (ovr.theme.dark) {
        palette = {
          sun: '#FE0',
          cloud: '#BBB',
          bgCloud: '#777',
          rain: '#0CF',
          lightning: '#FE0',
          snow: '#FFF',
          mist: '#FFF'
        };
      } else {
        palette = {
          sun: '#FC0',
          cloud: '#000',
          bgCloud: '#777',
          rain: '#07F',
          lightning: '#FC0',
          snow: '#CCC',
          mist: '#CCC'
        };
      }
    }
  }
  return palette;
}

weather.getColor = function(code) {
  const codeGroup = Math.round(code / 100);
  const palette = getPalette(0, g);
  const cloud = g.blendColor(palette.cloud, palette.bgCloud, .5); //theme independent
  switch (codeGroup) {
    case 2: return g.blendColor(cloud, palette.lightning, .5);
    case 3: return palette.rain;
    case 5:
      switch (code) {
        case 511: return palette.snow;
        case 520: return g.blendColor(palette.rain, palette.sun, .5);
        case 521: return g.blendColor(palette.rain, palette.sun, .5);
        case 522: return g.blendColor(palette.rain, palette.sun, .5);
        case 531: return g.blendColor(palette.rain, palette.sun, .5);
        default: return palette.rain;
      }
    case 6: return palette.snow;
    case 7: return palette.mist;
    case 8:
      switch (code) {
        case 800: return palette.sun;
        case 801: return palette.sun;
        case 802: return cloud;
        default: return cloud;
      }
    default: return cloud;
  }
}

/**
 *
 * @param cond Weather condition, as one of:
 *             {number} code: (Preferred form) https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 *             {string} weather description (in English: breaks for other languages!)
 *             {object} use cond.code if present, or fall back to cond.txt
 * @param x Left
 * @param y Top
 * @param r Icon Size
 * @param ovr Graphics instance (or undefined for g)
 * @param monochrome If true, produce a monochromatic icon
 */
weather.drawIcon = function(cond, x, y, r, ovr, monochrome) {
  var palette;
  if(!ovr) ovr = g;

  palette = getPalette(monochrome, ovr);

  function drawSun(x, y, r) {
    ovr.setColor(palette.sun);
    ovr.fillCircle(x, y, r);
  }

  function drawCloud(x, y, r, c) {
    const u = r/12;
    if (c==null) c = palette.cloud;
    ovr.setColor(c);
    ovr.fillCircle(x-8*u, y+3*u, 4*u);
    ovr.fillCircle(x-4*u, y-2*u, 5*u);
    ovr.fillCircle(x+4*u, y+0*u, 4*u);
    ovr.fillCircle(x+9*u, y+4*u, 3*u);
    ovr.fillPoly([
      x-8*u, y+7*u,
      x-8*u, y+3*u,
      x-4*u, y-2*u,
      x+4*u, y+0*u,
      x+9*u, y+4*u,
      x+9*u, y+7*u,
    ]);
  }

  function drawBrokenClouds(x, y, r) {
    drawCloud(x+1/8*r, y-1/8*r, 7/8*r, palette.bgCloud);
    if(monochrome)
      drawCloud(x-1/8*r, y+2/16*r, r, palette.background);
    drawCloud(x-1/8*r, y+1/8*r, 7/8*r);
  }

  function drawFewClouds(x, y, r) {
    drawSun(x+3/8*r, y-1/8*r, 5/8*r);
    if(monochrome)
      drawCloud(x-1/8*r, y+2/16*r, r, palette.background);
    drawCloud(x-1/8*r, y+1/8*r, 7/8*r);
  }

  function drawRainLines(x, y, r) {
    ovr.setColor(palette.rain);
    const y1 = y+1/2*r;
    const y2 = y+1*r;
    const poly = ovr.fillPolyAA ? p => ovr.fillPolyAA(p) : p => ovr.fillPoly(p);
    poly([
      x-6/12*r, y1,
      x-8/12*r, y2,
      x-7/12*r, y2,
      x-5/12*r, y1,
    ]);
    poly([
      x-2/12*r, y1,
      x-4/12*r, y2,
      x-3/12*r, y2,
      x-1/12*r, y1,
    ]);
    poly([
      x+2/12*r, y1,
      x+0/12*r, y2,
      x+1/12*r, y2,
      x+3/12*r, y1,
    ]);
  }

  function drawShowerRain(x, y, r) {
    drawFewClouds(x, y-1/3*r, r);
    drawRainLines(x, y, r);
  }

  function drawRain(x, y, r) {
    drawBrokenClouds(x, y-1/3*r, r);
    drawRainLines(x, y, r);
  }

  function drawThunderstorm(x, y, r) {
    function drawLightning(x, y, r) {
      ovr.setColor(palette.lightning);
      ovr.fillPoly([
        x-2/6*r, y-r,
        x-4/6*r, y+1/6*r,
        x-1/6*r, y+1/6*r,
        x-3/6*r, y+1*r,
        x+3/6*r, y-1/6*r,
        x+0/6*r, y-1/6*r,
        x+3/6*r, y-r,
      ]);
    }

    if(monochrome) drawBrokenClouds(x, y-1/3*r, r);
    drawLightning(x-1/12*r, y+1/2*r, 1/2*r);
    drawBrokenClouds(x, y-1/3*r, r);
  }

  function drawSnow(x, y, r) {
    function rotatePoints(points, pivotX, pivotY, angle) {
      for(let i = 0; i<points.length; i += 2) {
        const x = points[i];
        const y = points[i+1];
        points[i] = Math.cos(angle)*(x-pivotX)-Math.sin(angle)*(y-pivotY)+
          pivotX;
        points[i+1] = Math.sin(angle)*(x-pivotX)+Math.cos(angle)*(y-pivotY)+
          pivotY;
      }
    }

    ovr.setColor(palette.snow);
    const w = 1/12*r;
    for(let i = 0; i<=6; ++i) {
      const points = [
        x+w, y,
        x-w, y,
        x-w, y+r,
        x+w, y+r,
      ];
      rotatePoints(points, x, y, i/3*Math.PI);
      ovr.fillPoly(points);

      for(let j = -1; j<=1; j += 2) {
        const points = [
          x+w, y+7/12*r,
          x-w, y+7/12*r,
          x-w, y+r,
          x+w, y+r,
        ];
        rotatePoints(points, x, y+7/12*r, j/3*Math.PI);
        rotatePoints(points, x, y, i/3*Math.PI);
        ovr.fillPoly(points);
      }
    }
  }

  function drawMist(x, y, r) {
    const layers = [
      [-0.4, 0.5],
      [-0.8, 0.3],
      [-0.2, 0.9],
      [-0.9, 0.7],
      [-0.2, 0.3],
    ];

    ovr.setColor(palette.mist);
    for(let i = 0; i<5; ++i) {
      ovr.fillRect(x+layers[i][0]*r, y+(0.4*i-0.9)*r, x+layers[i][1]*r,
        y+(0.4*i-0.7)*r-1);
      ovr.fillCircle(x+layers[i][0]*r, y+(0.4*i-0.8)*r-0.5, 0.1*r-0.5);
      ovr.fillCircle(x+layers[i][1]*r, y+(0.4*i-0.8)*r-0.5, 0.1*r-0.5);
    }
  }

  function drawUnknown(x, y, r) {
    drawCloud(x, y, r, palette.bgCloud);
    ovr.setColor(ovr.theme.fg).setFontAlign(0, 0).setFont('Vector', r*2).drawString("?", x+r/10, y+r/6);
  }

  /*
  * Choose weather icon to display based on weather description
  */
  function chooseIconByTxt(txt) {
    if (!txt) return () => {};
    txt = txt.toLowerCase();
    if (txt.includes("thunderstorm")) return drawThunderstorm;
    if (txt.includes("freezing")||txt.includes("snow")||
      txt.includes("sleet")) {
      return drawSnow;
    }
    if (txt.includes("drizzle")||
      txt.includes("shower")) {
      return drawRain;
    }
    if (txt.includes("rain")) return drawShowerRain;
    if (txt.includes("clear")) return drawSun;
    if (txt.includes("few clouds")) return drawFewClouds;
    if (txt.includes("scattered clouds")) return drawCloud;
    if (txt.includes("clouds")) return drawBrokenClouds;
    if (txt.includes("mist") ||
      txt.includes("smoke") ||
      txt.includes("haze") ||
      txt.includes("sand") ||
      txt.includes("dust") ||
      txt.includes("fog") ||
      txt.includes("ash") ||
      txt.includes("squalls") ||
      txt.includes("tornado")) {
      return drawMist;
    }
    return drawUnknown;
  }

  /*
  * Choose weather icon to display based on weather conditition code
  * https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
  */
  function chooseIconByCode(code) {
    const codeGroup = Math.round(code / 100);
    switch (codeGroup) {
      case 2: return drawThunderstorm;
      case 3: return drawRain;
      case 5:
        switch (code) {
          case 511: return drawSnow;
          case 520: return drawShowerRain;
          case 521: return drawShowerRain;
          case 522: return drawShowerRain;
          case 531: return drawShowerRain;
          default: return drawRain;
        }
      case 6: return drawSnow;
      case 7: return drawMist;
      case 8:
        switch (code) {
          case 800: return drawSun;
          case 801: return drawFewClouds;
          case 802: return drawCloud;
          default: return drawBrokenClouds;
        }
      default: return drawUnknown;
    }
  }

  function chooseIcon(cond) {
    if (typeof (cond)==="object") {
      if ("code" in cond) return chooseIconByCode(cond.code);
      if ("txt" in cond) return chooseIconByTxt(cond.txt);
    } else if (typeof (cond)==="number") {
      return chooseIconByCode(cond.code);
    } else if (typeof (cond)==="string") {
      return chooseIconByTxt(cond.txt);
    }
    return drawUnknown;
  }
  chooseIcon(cond)(x, y, r);

};

// https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_direction_10m_dominant,wind_speed_10m_max,precipitation_probability_max&timezone=auto&forecast_days=4
const weatherData = {"latitude":52.52,"longitude":13.419998,"generationtime_ms":0.09381771087646484,"utc_offset_seconds":7200,"timezone":"Europe/Berlin","timezone_abbreviation":"GMT+2","elevation":38.0,"daily_units":{"time":"iso8601","weather_code":"wmo code","temperature_2m_max":"°C","temperature_2m_min":"°C","precipitation_sum":"mm","wind_direction_10m_dominant":"°","wind_speed_10m_max":"km/h","precipitation_probability_max":"%"},"daily":{"time":["2025-04-15","2025-04-16","2025-04-17","2025-04-18"],"weather_code":[3,3,3,3],"temperature_2m_max":[21.1,24.7,19.3,20.4],"temperature_2m_min":[13.0,12.8,11.7,10.1],"precipitation_sum":[0.00,0.00,0.00,1.60],"wind_direction_10m_dominant":[111,148,271,18],"wind_speed_10m_max":[20.5,11.7,14.5,12.5],"precipitation_probability_max":[10,3,10,15]}}

var layout = new Layout({type:"v", bgCol: g.theme.bg, c: [
    {filly: 1},
    {type: "h", filly: 0, fillx: 1, c: ['1', '2', '3', '4'].map((i) => (
        {type: "v", fillx: 1, c: [
            {type: "txt", font: '6x8', id: 'date'+i, label: '...'},
            {type: "custom", width: g.getWidth()/3, height: g.getWidth()/3, valign: -1, txt: "unknown", id: "icon" + i,
              render: l => weather.drawIcon(l, l.x+l.w/2, l.y+l.h/2, l.w/2-5)},
            {type: "h", pad: 2, c: [
                {type: "txt", font: "7%", id: "tempHigh" + i, label: "?"},
                {type: "txt", font: "5%", valign: -1, id: "tempHighUnit" + i, label: "°C"},
              ]},
            {type: "h", pad: 2, c: [
                {type: "txt", font: "7%", id: "tempLow" + i, label: "?"},
                {type: "txt", font: "5%", valign: -1, id: "tempLowUnit" + i, label: "°C"},
              ]},
            {type: "txt", font: '4x6', label: 'RAIN?', id: 'rain' + i},
            {type: "h", pad: 2, c: [{type: "txt", font: "6x8", id: "precip" + i, label: "?"}]},
            {type: "h", pad: 2, c: [{type: "txt", font: "6x8", id: "chance" + i, label: "?"}]},
          ]
        }
      ))
    },
    {filly: 1},
    {type: "h", c: [
        {type: "txt", font: "6x8", pad: 4, id: "loc", label: "Toronto"},
        {fillx: 1},
        {type: "txt", font: "6x8", pad: 4, id: "updateTime", label: /*LANG*/"15 minutes ago"},
      ]},
    {filly: 1},
    {type: "h", c: [
        {type: "btn", font: "6x8", pad: 4, label: "4 Day Forecast"},
        {type: "btn", font: "6x8", pad: 4, label: "Today"},
      ]},
  ]}, {lazy: true});

function formatDuration(millis) {
  let pluralize = (n, w) => n + " " + w + (n == 1 ? "" : "s");
  if (millis < 60000) return /*LANG*/"< 1 minute";
  if (millis < 3600000) return pluralize(Math.floor(millis/60000), /*LANG*/"minute");
  if (millis < 86400000) return pluralize(Math.floor(millis/3600000), /*LANG*/"hour");
  return pluralize(Math.floor(millis/86400000), /*LANG*/"day");
}

const wmoToOwm = (code) => {
  // Convert WMO code to OpenWeatherMap code
  const wmoToOwmMap = {
    // Thunderstorm
    17: 211,  // Thunderstorm without precipitation
    29: 200,  // Thunderstorm, rain/snow
    95: 200,  // Thunderstorm
    96: 201,  // Thunderstorm with hail
    99: 202,  // Severe thunderstorm

    // Drizzle
    51: 300,  // Light drizzle
    53: 301,  // Moderate drizzle
    55: 302,  // Dense drizzle

    // Rain
    61: 500,  // Light rain
    63: 501,  // Moderate rain
    65: 502,  // Heavy rain
    66: 511,  // Freezing rain
    67: 511,  // Freezing rain heavy

    // Snow
    71: 600,  // Light snow
    73: 601,  // Moderate snow
    75: 602,  // Heavy snow
    77: 611,  // Snow grains
    85: 620,  // Light snow showers
    86: 621,  // Heavy snow showers

    // Fog, mist, haze
    45: 701,  // Fog
    49: 741,  // Fog dense
    40: 721,  // Haze

    // Dust, sand, etc.
    6: 731,  // Dust
    7: 751,  // Sand
    8: 761,  // Dust or sand whirls

    // Clear / Cloudy
    0: 800,  // Clear sky
    1: 801,  // Few clouds
    2: 802,  // Scattered clouds
    3: 803,  // Broken clouds
    4: 804,  // Overcast

  };
  return wmoToOwmMap[code] || code;

}

const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const today = new Date(weatherData.daily.time[0]);
function draw() {
  for (let i=0; i<4; i++) {
    layout["date"+(i+1)].label = dayNames[(today.getDay()+i)%7];
    layout["rain"+(i+1)].label = weatherData.daily.precipitation_sum[i] > 0 ? 'Rain' : 'No Rain';
    layout["icon"+(i+1)].txt = weatherData.daily.weather_code[i];
    layout["icon"+(i+1)].code = wmoToOwm(weatherData.daily.weather_code[i]);
    layout["tempHigh"+(i+1)].label = weatherData.daily.temperature_2m_max[i];
    layout["tempHighUnit"+(i+1)].label = '°C';
    layout["tempLow"+(i+1)].label = weatherData.daily.temperature_2m_min[i];
    layout["tempLowUnit"+(i+1)].label = '°C';
    layout["precip"+(i+1)].label = weatherData.daily.precipitation_sum[i] > 0 ? weatherData.daily.precipitation_sum[i] + 'mm' : '';
    layout["chance"+(i+1)].label = weatherData.daily.precipitation_probability_max[i] > 0 ? weatherData.daily.precipitation_probability_max[i] + '%' : '';

  }
  layout.cond = weatherData.daily.weather_code[0];
  layout.loc.label = 'Berlin'
  // layout.updateTime.label = `${formatDuration(Date.now() - 1000)} ago`; // How to autotranslate this and similar?
  layout.update();
  layout.render();
}

draw();