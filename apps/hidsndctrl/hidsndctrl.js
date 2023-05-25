// asd
var storage = require('Storage');

const settings = storage.readJSON('setting.json',1) || { HID: false };

var l_artist, l_album, l_title, l_dur, l_c, l_n;
var l_state, l_position, l_shuffle, l_repeat;

var Layout = require("Layout");

function formatTime (s) {
  var hours = ((s / 3600) | 0);
  var minutes = (((s / 60) % 60) | 0);
  var seconds = s % 60;
  return (
      (hours ? hours + ':' : '') +
      (hours && minutes < 10 ? '0' : '') + minutes + ':' +
      (seconds < 10 ? '0' : '') + seconds
  );
}

function drawApp(message) {
  if (!message) {
    message = '';
  }
  g.clear();
  var layout;
  var status;

  var stateSymbol;
  if (l_state === "play") {
    stateSymbol = '|>';
  } else if (l_state === "pause") {
    stateSymbol = '||';
  } else if (l_state === "stop") {
    stateSymbol = '[]';
  } else {
    stateSymbol = '?';
  }

  if(!Bangle.isLocked()) {
    status = "Swipe or tap to Control";
  } else {
    status = "Press button to unlock";
  }
  layout = new Layout({
    type:"v",
    fillx:1,
    pad: 5,
    c: [
      {pad: 5, type:"txt", font:"6x8:2", label: message ? message : stateSymbol + " " + formatTime(l_position) + "/" + formatTime(l_dur), halign: -1},
      {pad: 5, type:"txt", font:"6x8", label: status, halign: -1},
      {type:"txt", font:"9%", label: l_n + "/" + l_c, halign: -1},
      {type:"txt", font:"9%", label: l_title.slice(0, 18), halign: -1},
      {type:"txt", font:"9%", label: l_album, halign: -1},
      {type:"txt", font:"9%", label: l_artist, halign: -1},
    ]
  });
  layout.render();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
}

function maybeDrawApp() {
  drawApp();
}

/**
 * Update music info
 * @param {Object} info - Gadgetbridge musicinfo event
 */
function musicinfoHandler(info) {
  l_title = info.track || "";
  l_album = info.album || "";
  l_artist = info.artist || "";
  l_dur = info.dur || 0;
  l_c = info.c || 0;
  l_n = info.n || 0;
  maybeDrawApp();
}

var positionInterval;

function stateHandler(state){
  if (l_state !== state.state) {
    if (state.state === 'play') {
      positionInterval = setInterval(() => {
        l_position += 1;
        drawApp();
      }, 1000);
    } {
      if (positionInterval) {
        clearInterval(positionInterval);
      }
    }
  }
  l_state = state.state;
  l_position = state.position || 0;
  l_shuffle = state.shuffle || 0;
  l_repeat = state.repeat || 0;
  maybeDrawApp();
}

sendHid = function (code, cb) {
  if (settings.HID==="kbmedia") {
    try {
      NRF.sendHIDReport([1,code], () => {
        NRF.sendHIDReport([1,0], () => {
          if (cb) cb();
        });
      });
    } catch(e) {
      print(e);
    }
  } else {
    E.showPrompt("Enable HID?",{title:"HID disabled"}).then(function(enable) {
      if (enable) {
        settings.HID = "kbmedia";
        require("Storage").write('setting.json', settings);
        setTimeout(load, 1000, "hidmsicswipe.app.js");
      } else setTimeout(load, 1000);
    });
  }
};

var sendingHID = false;  // prevent multiple HID events to be sent simultaneously

function safeSendHid (code) {
  if (!sendingHID) {
    sendingHID = true;
    sendHid(code, () => {
      sendingHID = false;
    })
  }
}

function left () {
  safeSendHid(0x01);  // nextTrack
  drawApp('next track');
  setTimeout(drawApp, 200);
}
function right () {
  safeSendHid(0x02);  // previousTrack
  drawApp('previous track');
  setTimeout(drawApp, 200);
}
function tap () {
  safeSendHid(0x10); // play/pause
  if (l_state === 'pause') {
    drawApp('play');
  } else {
    drawApp('pause');
  }
  setTimeout(drawApp, 200);
}
function up () {
  safeSendHid(0x40); // volumeUp
}
function down () {
  safeSendHid(0x80); // volumeDown
}

// for testing
musicinfoHandler({"t": "musicinfo", "artist": "Artist Name", "album": "Album Name", "track": "Track Title", "dur": 817, "c": 42, "n": 1});
stateHandler({"t": "musicstate", "state": "play", "position": 260, "shuffle": 1, "repeat": 1});


setWatch(function(e) {
  Bangle.setLocked(true);
  drawApp('locked!');
  setTimeout(drawApp, 200);
}, BTN1, { edge:"falling",repeat:true,debounce:50});


var isDragging = false;
var direction = -1;  // -1 unknown, 0 horizontal, 1 vertical
var lastX = 0;
var lastY = 0;
var diffX = 0;
var diffY = 0;

Bangle.on('drag', function(e) {
  if(!e.b) {  // on release;
    if (direction === -1) {
      // never left the bounding box, it's a tap!
      tap();
    }
    isDragging = false;
    direction = -1;
    return;
  }

  if (!isDragging) {  // first event, record finger origin
    isDragging = true;
    lastX = e.x;
    lastY = e.y;
    return;
  }

  if (direction === -1) {  // direction is unknown
    // determine direction by largest movement in a AABB
    diffX = Math.abs(e.x - lastX);
    diffY = Math.abs(e.y - lastY);
    if (diffX > 30 || diffY > 30) {
      direction = diffX > diffY ? 0 : 1;
      // reset the origin to the point where we exit the AABB
      lastX = e.x;
      lastY = e.y;
    }
  } else {  // direction is known
    if (direction === 0) {  // horizontal
      if (lastX > e.x + 10) {
        right();
      }
      if (lastX < e.x - 10) {
        left();
      }
    } else {  // vertical
      if (lastY < e.y - 10) {
        lastY = e.y;  // reset position so that volume can be triggered multiple times
        down();
      }
      if (lastY > e.y + 10) {
        lastY = e.y;  // reset position so that volume can be triggered multiple times
        up();
      }
    }
  }
});

Bangle.on("lock", function(on) {
  if(!on){
    drawApp('unlocked!');
    setTimeout(drawApp, 200);
  }
});

drawApp();

setTimeout( // make other boot code run first, so we override e.g. android.boot.js GB
    () => {
      global.GB = (_GB => e => {
        switch (e.t) {
          case "musicinfo":
            return musicinfoHandler(e);
          case "musicstate":
            return stateHandler(e);
          default:
            // pass on other events
            if (_GB) setTimeout(_GB, 0, e);
        }
      })(global.GB);
    }, 1);
