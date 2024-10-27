g.setTheme({bg:"#000",fg:"#fff",dark:true, bg2: '#060', fg2: '#0f0'}).clear();

var currentAddress = NRF.getAddress ? NRF.getAddress(true) : '12:34:56:78:90:AB';

var addressForNameMap = {};
var defaultAddress = NRF.getAddress();
addressForNameMap['Phone'] = defaultAddress;
addressForNameMap['PC'] = defaultAddress.slice(0, 15) + '00';
addressForNameMap['Misc'] = defaultAddress.slice(0, 15) + '01';

var updateButtonColors = function() {
  layout.PC.btnBorderCol = undefined;
  layout.PC.btnFaceCol = undefined;
  layout.Phone.btnBorderCol = undefined;
  layout.Phone.btnFaceCol = undefined;
  layout.Misc.btnBorderCol = undefined;
  layout.Misc.btnFaceCol = undefined;

  Object.entries(addressForNameMap).forEach((keyVal) => {
    var key = keyVal[0];
    var value = keyVal[1];
    if (value === currentAddress) {
      layout[key].btnBorderCol = '#ffffff';
      layout[key].btnFaceCol = '#00ff00';
    } else {
      layout[key].btnBorderCol = undefined;
      layout[key].btnFaceCol = undefined;
    }
  })
  layout.render();
}

var changeAddress = function(name) {
  var address = addressForNameMap[name]
  layout.status.label = "Changing address to: " + address;
  g.clear();
  layout.render();
  // check for available NRF functions for emulator testing only (they should always exist on the real device)
  NRF.setAddress ? NRF.setAddress(address) : null;
  layout.status.label = "Disconnecting current connection...";
  g.clear();
  layout.render();
  NRF.disconnect ? NRF.disconnect() : null;  // disconnect from any open connections, so that the new address can be used
  layout.status.label = "Address: " + address;
  g.clear();
  layout.render();
  currentAddress = address;
  updateButtonColors()
}

var w = Bangle.appRect.w;
var h = Bangle.appRect.h;
var statusHeight = 24;

var Layout = require("Layout");
var layout = new Layout( {
  type:"v",
  width: w,
  height: h,
  c: [
    {type: "h",
      c: [
        {type:"btn", font:"6x8:2", label:"PC", cb: l=>changeAddress('PC'), width: w/2, height: (h-statusHeight)/2, id: "PC" },
        {type:"btn", font:"6x8:2", label:"Phone", cb: l=>changeAddress('Phone'), width: w/2, height: (h-statusHeight)/2, id: "Phone" }
      ]
    },
    {type: "h",
      c: [
        {type:"btn", font:"6x8:2", label:"Misc", cb: l=>changeAddress('Misc'), width: w/2, height: (h-statusHeight)/2, id: "Misc" },
        {
          type: "img", width: w/2, height: (h-statusHeight)/2, src: function () {
            return require("heatshrink").decompress(atob("odAgU//4AC6uW0trAoOuAQMVrufB4f0g2Xyta13+3YJB8WgEAkAg2uoFZ1W+34aCgAQDAoM61UAqury4QB/1kgYgDoEA3OkkOf0tHBIPv/gPD/kAi1V6HI9OVq4LCgfws2r//wgMJy1AoEurMPDYUP4B6BgtCgemIQMBkcYj4QB6E/RYUCkEW00DCAMOql/NwU8TocBgeaygWB1VVJocwB4UQAQMGoVA5t6ygQB+C+EwEAoFU/ITB9NDCAPAHQIAElMAGQN/3dTCAIsCAAcJ1WVqkAtWWr5CCAAsQreVqEB1VZMgPzHwRkDiEbGIMn3WeCAPgg4gEg9aqrMBktI6jTChgQEkRCBdQIABMgJCBKgkChNW1NWtNmq9PQoRCEDoNZquu/eqtU/QoMBB4kBqtptf//epyrICAAsFrOmBYP+0qWBZAoABq1q14QB/egh5CC4AQF1QPB//uoBCB4jIFgtq34QC3MAAYMwQosWKIIxC2EDQo7UBIIQQByBCB+hCFgQxD/36ghCB6ETEAkRrQhC1W5GILIBgiGFqtqD4Om0nP//9SwwABs+poOqy4xBIQIAELAUvqMM1doGIPwgQwFyuE32cn2604QB6F4MYmt1/2MoXrPQfghAQCg2r3+nCAWuB4X/wAhDhXv3WbCAP6XgZlFjW/9NuBYO6EAZlFjW+0wNB92rCAb6FtWuzXvCAJjCAAKGFzXptZgB1MfGJEBtWEtN/3ehv4xIgWpoEGM4OCGJMJ1NR1/v1QxD/gQFium1QgB0rYB//+1b6GMYPu9WAEAX21AQGsvq1XqgwQCiIPFgWQiu+9WkqpBIZINW1e69WFCAT7BCA1Vquq1QDBbQSFFgEZrOq12lCANlVoIyGkuqIQOpCANVtX4gEFqlACAVW1/71UlytWtOmqkJCoIQDixzBtFWqtW01mtIPBqgyDjVqy1hrVlq1mtRICCAkAoFZwJDBtOp1WVLAOUkD+EtMK01VrWlzI2BrNAwDcEzE5zIxBzWaEANmoYgEq1g7OlrVpy1mrIzBpggEytC0upKoNazNZtNlsggErMNFoOW0oyBCgNlyAgDLQM2suVzWV1VZtHVyRTCgpfBiHm1WWtVa1NmsWWpQwCRgNkwQtByultSpBrOZrAwCCAORg2a1NW0uqA=="));
          }
        }
      ]
    },
    {type:"txt", font:"6x8", label:"Address: "+ currentAddress, id:"status", height: statusHeight}
  ]
});

updateButtonColors();
g.reset().clearRect(Bangle.appRect);
layout.render();

// Load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();
