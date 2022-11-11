// load library
var sched = require("sched");

// find next active alarm in range
function getNextAlarm(allAlarms, from, to, withId) {
  if (withId) allAlarms = allAlarms.map((a, idx) => {
    a.idx = idx;
    return a;
  });
  // return next
  return sched.getActiveAlarms(
      // filter for active alarms in range
      allAlarms.filter(a => a.on && !a.timer && a.t >= from && a.t < to)
    ).map(a => {
      // add time to alarm
      a.tTo = sched.getTimeToAlarm(a);
      return a;
      // sort to get next alarm first
    }).sort((a, b) => a.tTo - b.tTo)[0] || {};
}

exports = {
  // function to read settings with defaults
  getSettings: function() {
    return Object.assign({
      enabled: true,
      hide: false,
      drawTime: true,
      color: g.theme.dark ? 65504 : 31, // yellow or blue
      from: 4, // 0400
      to: 8, // 0800
      earlier: 30,
      msgAsPrefix: true,
      disableOnAlarm: false, // !!! not available if alarm is at the next day
      msg: "...\n",
      vibrate: "..",
      as: true
    }, require("Storage").readJSON("sleeplogalarm.settings.json", true) || {});
  },

  // widget reload function
  widReload: function() {
    // abort if onChange is not available
    if (typeof (global.sleeplog || {}).onChange !== "object") return;

    // read settings to calculate alarm range
    var settings = this.getSettings();

    // set the alarm time
    this.time = getNextAlarm(sched.getAlarms(), settings.from * 36E5, settings.to * 36E5).t;

    // abort if no alarm time could be found inside range
    if (!this.time) return;

    // set widget width if not hidden
    if (!this.hidden) this.width = 8;

    // insert sleeplogalarm function to onChange
    sleeplog.onChange.sleeplogalarm = function (data) {
      // abort if not changed from deep sleep to light sleep or awake
      if (data.prevStatus !== 4 || !(data.status === 3 || data.status === 2)) return;

      // get settings from widget, now and calculate time of now
      var settings = WIDGETS.sleeplogalarm;
      var now = new Date();
      var tNow = ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds()) * 1000;

      // execute trigger function if inside the alarm range
      if (tNow >= settings.time - settings.earlier * 6E4 &&
        tNow < settings.time) require("sleeplogalarm").trigger(now, tNow);
    };
  },

  // trigger function
  trigger: function(now, tNow) {
    // read settings
    var settings = this.getSettings();

    // read all alarms
    var allAlarms = sched.getAlarms();

    // find first active alarm
    var alarm = getNextAlarm(sched.getAlarms(), settings.from * 36E5, settings.to * 36E5, settings.disableOnAlarm);

    // return if no alarm is found
    if (!alarm) return;

    // get date of the alarm
    var aDate = new Date(now + alarm.tTo).getDate();

    // disable earlier triggered alarm if set and on the same day
    if (settings.disableOnAlarm && now.getDate() === aDate) {
      // set alarms last to today
      allAlarms[alarm.idx].last = aDate;
      // remove added indexes
      allAlarms = allAlarms.map(a => {
        delete a.idx;
        return a;
      });
    }

    // add new alarm for now with data from found alarm
    allAlarms.push({
      id: "sleeplog",
      appid: "sleeplog",
      on: true,
      t: tNow,
      dow: 127,
      msg: settings.msg + (settings.msgAsPrefix ? alarm.msg || "" : ""),
      vibrate: settings.vibrate || alarm.vibrate,
      as: settings.as,
      del: true
    });

    // write changes
    sched.setAlarms(allAlarms);

    // trigger sched.js
    load("sched.js");
  }
};