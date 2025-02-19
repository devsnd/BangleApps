g.setBgColor(0, 0, 0);
g.clear().flip();
// 56x88
var imgbat = require("heatshrink").decompress(atob("nFYhBC/AH4A/AGUeACA22HEo3/G8YrTAC422HBQ2tHBI3/G/43/G/43/G/43/G/43/G/43/G+fTG+vSN+w326Q31GwI3/G9g2WG742CG/43rGwY3yGwg33RKo3bNzQ3bGwo3/G9A2GG942dG/43QGw43uGxA34IKw3VGyY3iG0I3pb8pBRG+wYPG8wYQG/42uG8oZSG/43bDKY3iDKg3cNzI3iRKo3gGyo3/G7A2WG7g2aG/43WGzA3dGzI3/G6fTGzRvcG/43/G/43/G/43/G/43/G/43/G/437HFw2IHFo2KAH4A/AH4Aa"));
var imgbubble = require("heatshrink").decompress(atob("i0UhAebgoAFCaYXNBocjAAIWNCYoVHCw4UFIZwqELJQWFKZQVOChYVzABwVaCx7wKCqIWNCg4WMChIXJCZgAnA=="));
// make black background transparent
imgbat[2] |= 128;
imgbat[3] = 0;
imgbubble[2] |= 128;
imgbubble[3] = 0;

var imgh = 88;
var imgw = 56;
// create empty battery image
var imgbat2 = new ArrayBuffer(imgbat.length);
for (var i=0; i<imgbat2.length; i++) {
  if (i > 2) {
    // overwrite palette, but leave black untouched
    imgbat2[i] = imgbat[i] ? (imgbat[i] + 13)|0 : imgbat[i];
  } else {
    imgbat2[i] = imgbat[i];
  }

}

var firstBat = E.getBattery();
var firstTime = getTime();

var sintable = [];
for (var r=0; r<16; r++) {
  sintable.push(Math.sin(Math.PI*r/8));
}
var lastFrame = +new Date();
var frameTime = (1000/25)|0;

var bubbles = [];
for (var b=0; b<10; b++) {
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
    g.flip();
  } else {
    for (b=0; b<10; b++) {
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
    for (var i=0; i<8; i++) {
      g.setClipRect(xpos + imgw/8*i, ypos, xpos + imgw/8*(i+1), ypos + imgh - imgh * bat / 100 + ((sintable[((getTime()*8|0)+i)%16]+1)/2) * 10);
      g.drawImage(imgbat2, xpos, ypos);
    }
    g.setClipRect(0, 0, g.getWidth(), g.getHeight());
    g.drawString("CHARGING\n" + bat + '%\n' + eta, cx, cy + 60, true);
    g.flip();
    setTimeout(anim, Math.max(1, lastFrame + frameTime - new Date()));
  }
  g.setColor('#fff').setFont('Vector:16').setFontAlign(0,0);
  g.drawString(require("locale").time(new Date(), 1), cx, 15);
}
anim();

Bangle.on("charging", isCharging => {
  if (!isCharging) load();
});
