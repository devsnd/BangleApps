{
  let fetching = false;
  let settings = Object.assign(
    require('Storage').readJSON("owmweather.default.json", true) || {},
    require('Storage').readJSON("owmweather.json", true) || {}
  );
  
  let onCompletedFetch = function(){
    fetching = false;
    settings.updated = Date.now();
    require('Storage').writeJSON("owmweather.json", settings);
  }

  const update = function(){
    if (!fetching && NRF.getSecurityStatus().connected) {
      if (!settings.updated || settings.updated + settings.refresh * 1000 * 60 < Date.now()) {
          fetching = true;
          require("owmweather").pull(onCompletedFetch);
      }
    }
  }

  if (settings.enabled) {
    setTimeout(update, 5000);
    setInterval(update, settings.refresh * 1000 * 60);
    NRF.on('connect', update);
  }
}
