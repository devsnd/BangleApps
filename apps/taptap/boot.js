{
// load settings
let settings = Object.assign({
  combos: {
    'rrr': 'clock',
  }
}, require("Storage").readJSON("taptap.json", true) || {});

const comboInterval = 1000;
let comboFinishTimeout = null;
let tapTapCombo = '';
let lastTap = 0;

function tapListener(evt) {
  if (comboFinishTimeout) {  // clear previous timeout
    clearTimeout(comboFinishTimeout);
    comboFinishTimeout = null;
  }
  console.log('x', evt.x, 'y', evt.y, 'z', evt.z, 'dir', evt.dir);
  // left/right/top/bottom/front/back
  tapTapCombo += evt.dir === 'back' ? 'B' : evt.dir.slice(0, 1);
  if (evt.double) {
    tapTapCombo += evt.dir === 'back' ? 'B' : evt.dir.slice(0, 1);
  }
  Bangle.emit('tapprogress', tapTapCombo);
  console.log('tapprogress', tapTapCombo);
  comboFinishTimeout = setTimeout(() => {
    console.log('taptapcombo', tapTapCombo);
    const action = settings.combos[tapTapCombo];
    if (action === 'launcher') {
      Bangle.showLauncher();
    } else if (action === 'clock') {
      Bangle.showClock();
    }
    tapTapCombo = '';
    comboFinishTimeout = null;
  }, comboInterval);
}

// remove previous tap listener (if any)
Bangle.removeListener("tap", tapListener);
Bangle.on("tap", tapListener);

}
