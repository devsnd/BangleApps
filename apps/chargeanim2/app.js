g.setBgColor(0, 0, 0);
g.clear().flip();
// 56x88
var imgbat = require("heatshrink").decompress(atob("nFYwhC/AHMHu4AGuAbRDQ4ABDf4VNABaENABqSEDSo4FDf4b/Df4b/Df4bd84bZvwb29wbZvwbcU7PuDbI2BDeoaBDbA2CUxIbqKQQbXGwQb0DQSmKDZg2DDeYaDDaw2EDbamKDZY2EAAobPKQoAEHgwblKSDDMR54bOKRYbUYaQbHcRAbuBhAbNUwY2IDdwNJDaA2JDdRSMDaA2KDdgaKDZ42LDZqmBDbYaLDZw2MDdQaMU5wb/Df4b/Df4b/DcMHDStwDYY4WDQgA/AFo="));
var imgbat2 = require("heatshrink").decompress(atob("nFYwQ/8gWqAAWABo8KBoegBsAKEAAoQClQNJ1ANBBhIABBv4N/BuHqBrOrBpmvBppFM34NM/4NZ1YNM1/+BrO/Bpn/BrJSB/QNK14Na34NM/4NObwgNFKQINLIgIADBph/DBohSBAARHDBogoEBpBHIBpLtLBpzSEBpCaEBqyaEBox/BYZQNPKQgNIdpYNOdpYNCAogNVKQoNHIgoNG1YNNKQoNHBgoNUAA4N/Bv4NplQMJ1ANBhQNJ0ANBAGwA="));
var imgbubble = require("heatshrink").decompress(atob("i0UhAebgoAFCaYXNBocjAAIWNCYoVHCw4UFIZwqELJQWFKZQVOChYVzABwVaCx7wKCqIWNCg4WMChIXJCZgAnA=="));
// make black background transparent
imgbat[2] |= 128;
imgbat[3] = 0;
imgbubble[2] |= 128;
imgbubble[3] = 0;

var imgh = 88;
var imgw = 56;

var firstBat = E.getBattery();
var firstTime = getTime();

var sintable = [];
for (var r=0; r<16; r++) {
  sintable.push(Math.sin(Math.PI*r/8));
}
var lastFrame = +new Date();
var frameTime = (1000/25)|0;

var bubbles = [];
for (var b=0; b<4; b++) {
  bubbles.push({y:Math.random()*g.getHeight(),ly:0,x:(0.5+(b<5?b:b+8))*g.getWidth()/18,v:0.6+Math.random(),s:0.5+Math.random()});
}

function anim() {
  g.clear();
  var cx = g.getWidth()/2.0;
  var cy = g.getHeight()/2.0;

  var elapsed = getTime() - firstTime;
  var bat = E.getBattery();
  var charged = bat - firstBat;

  // charged = (elapsed*1.4) | 0; // dev
  // bat = Math.min(100, (4 + charged)) | 0;  //dev

  var eta = '';
  if (charged > 0) {
    var min = ((100 - bat) * elapsed / charged / 60) | 0;
    eta = "ETA: " + min +" min";
  }

  var wiggle = sintable[((getTime()*8 )%16)| 0] * 4;
  if (bat === 100) {
    wiggle = 0;
  }


  var xpos = cx - 28;
  var ypos = cy - 60 + wiggle;

  if (bat === 100) {
    for (i=0; i<8; i++) {  // draw halo
      g.drawImage(imgbat2, xpos + sintable[i*2]*8,ypos + sintable[(i*2+4)%16]*8);
    }
    g.drawImage(imgbat, xpos,ypos);
    g.drawString("FULLY\nCHARGED!", cx, cy + 60, true);
    g.setColor('#fff').setFont('Vector:16').setFontAlign(0,0);
    g.drawString(require("locale").time(new Date(), 1), cx, 15);
    g.flip();
  } else {
    for (b=0; b<4; b++) {
      g.drawImage(imgbubble, bubbles[b].y, bubbles[b].x, {scale:bubbles[b].s, rotate:Math.PI});
      bubbles[b].y += (bubbles[b].y - (g.getHeight() / 2)) / 100;
      if (bubbles[b].y < -24 || bubbles[b].y > (g.getHeight() + 8)) {
        bubbles[b].y = g.getHeight() / 2 + Math.random() * 5 - 2.5;
      }
      bubbles[b].x += (bubbles[b].x - (g.getWidth() / 2)) / 100;
      if (bubbles[b].x < -24 || bubbles[b].x > (g.getWidth() + 8)) {
        bubbles[b].x = g.getWidth() / 2 + Math.random() * 5 - 2.5;
      }
    }
    g.drawImage(imgbat, xpos, ypos);
    for (var i=0; i<4; i++) {
      g.setClipRect(xpos + imgw/4*i, ypos, xpos + imgw/4*(i+1), ypos + imgh - imgh * bat / 100 + ((sintable[((getTime()*8|0)+i)%16]+1)/2) * 10);
      g.drawImage(imgbat2, xpos, ypos);
    }
    g.setClipRect(0, 0, g.getWidth(), g.getHeight());
    g.drawString("CHARGING\n" + bat + '%\n' + eta, cx, cy + 60, true);
    g.setColor('#fff').setFont('Vector:16').setFontAlign(0,0);
    g.drawString(require("locale").time(new Date(), 1), cx, 15);
    g.flip();
    setTimeout(anim, Math.max(1, lastFrame + frameTime - new Date()));
  }
}
anim();

Bangle.on("charging", isCharging => {
  if (!isCharging) load();
});
