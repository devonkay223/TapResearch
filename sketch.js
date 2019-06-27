
p5.disableFriendlyErrors = true; // disables FES

function preload(){
  font = loadFont("./fonts/Overpass-Regular.ttf");
  // song = loadSound('underwater.mp3');
}

function setup() {
  frameRate(rate);

  // Create Canvas
  var cnv = createCanvas(window.innerWidth, window.innerHeight);
  cnv.style('vertical-align', 'top'); // removes scroll bars
  //Style Canvas
  buttonTextHeight = 28;
  bRight = width - (width/50);
  btop = 26;
  //Scaling that occurs for buttons may be slowing things down?
  recordButton = createButton('Record');
  recordButton.style('background-color', '#000000');
  recordButton.style('font-size', buttonTextHeight);
  recordButton.style('font-family', font);
  recordButton.style('color', '#ffffff');
  recordButton.style('border-color', '#ffffff');
  bHeight = recordButton.size().height;
  bPad = bHeight/6;
  bRight1 = bRight - recordButton.size().width;
  recordButton.position(bRight1, btop);

  stopButton = createButton('Stop');
  stopButton.style('background-color', '#000000');
  stopButton.style('font-size', buttonTextHeight);
  stopButton.style('font-family', font);
  stopButton.style('color', '#ffffff');
  stopButton.style('border-color', '#ffffff');
  bRight2 = bRight - stopButton.size().width;
  stopButton.position(bRight2, btop + bHeight + bPad);

  resetButton = createButton('Reset');
  resetButton.style('background-color', '#000000');
  resetButton.style('font-size', buttonTextHeight);
  resetButton.style('font-family', font);
  resetButton.style('color', '#ffffff');
  resetButton.style('border-color', '#ffffff');
  bRight3 = bRight - resetButton.size().width;
  resetButton.position(bRight3, btop + 2*(bHeight + bPad));


  colorMode(HSB);

  // Create an Audio input
  source = new p5.AudioIn();
  // source.start();
  // create new Amplitude
  level = new p5.Amplitude();
  level.setInput(source);
  // level.setInput(song);

  // song.play();

  // create FFT
  fft = new p5.FFT(0.9, 1024);
  fft.setInput(source);

  if(newDraw == 0){
    source.start();
    listening = true;
    newDraw = 0;
  }
}

function draw() {
  background(0);

  // Beat Detection
  var amp = level.getLevel();
  detectBeat(amp);

  // FFT
  var spectrum = fft.analyze();

  recordData();
  drawWaveForm();
  drawCircAmp();
  drawFFTLive();
  // if(listening){
  //drawAmphistory();
  // }
  setThreshold();
  setQuiet();
  checkOutputLengthBinOut();
  checkOutputLengthSentence();
  fill('#FFFFFF');
  textSize(fontSize);
  // textFont(font); NOTE font is not currently applied bc it only has english characters and were getting a lot of non english chars rn
  text(binOut,50,50);
  text(sentence,50,90);
}

// https://therewasaguy.github.io/p5-music-viz/demos/01d_beat_detect_amplitude/
function detectBeat(amp) {
  if (amp  > beatCutoff && amp > beatThreshold){
    beatCutoff = amp *1.2;
    framesSinceLastBeat = 0;
    x=0;
    newbeat = false;
    wasbeat = true;
    print("BEAT")
  } else{
    if (amp < .06 && wasbeat == true){ //
      analyzeNoise();
      wasbeat = false;
    }
    if (amp < .002){ //
      newbeat = true;
    }
    if (framesSinceLastBeat <= beatHoldFrames){
      framesSinceLastBeat ++;
    }
    else{
      beatCutoff *= beatDecayRate;
      beatCutoff = Math.max(beatCutoff, beatThreshold);
    }
  }
}


function checkOutputLengthBinOut() {
  let bbox = font.textBounds(binOut, 50, 50, fontSize);

  if ((bbox.x + bbox.w + 30) >= bRight1){
    print("TOO WIDE");
    binOut = binOut.substring(1, binOut.length);
  }
}

function checkOutputLengthSentence() {
  let bbox = font.textBounds(sentence, 50, 50, fontSize);

  if ((bbox.x + bbox.w + 30) >= bRight1){
    print("TOO WIDE");
    sentence = sentence.substring(1, sentence.length);
  }
}

function recordData(){
  noise = level.getLevel();
  if (noise > silence) {
    data.push(noise);
    console.log(noise);
    analyzed = false;
  }
  // else if (analyzed === false) {
  //   // analyzeNoise();
  //   analyzed = true;
  // }
}

function getText(){
  let addedlet = "";
  let num = parseInt(transbin,10)
  addedlet += char(num);
  print(addedlet);
  sentence += addedlet;
  transbin = "";
  trans = false;
  return addedlet;
}

function analyzeNoise(){
  if (listening){
    for (var i = 0; i < data.length; i=0) {
      total += data[i];
      console.log(total);
      data.shift(i);
    }
    print("total:" + total);
  }
  if (total > quiet && total < threshold){
    binOut+= "0";
    transbin+= "0";
    print(0);
    circleFill = 'black';
  }

  if (total > threshold){
    binOut+= "1";
    transbin+= "1";
    print(1);
    circleFill = 'white';
  }
  total = 0
  if (transbin.length == 8){
    getText();
  }
}

function windowResized() {
  newDraw = 0;
  resizeCanvas(window.innerWidth, window.innerHeight);
  recordButton.remove();
  stopButton.remove();
  resetButton.remove();
  setup();
}

// function keyPressed(e) {
//   // spacebar pauses
//   if (e.keyCode == 32) {
//     //var context = new AudioContext();
//     if (song.isPlaying()) {
//       song.pause();
//     } else {
//       song.play();
//     }
//   }
// }
