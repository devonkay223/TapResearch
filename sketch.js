let song; //imported song
let data =[];
let volhistory = [];
let source = null;
let fft = null;
let level = null; // amplitude input
let noise = null;
let listening = false;
let analyzed = true;
let trans = false;
let total = 0.0;
let circleFill = 'black';
let newDraw = 1;
//Output strings
let sentence = "";
let binOut = "";
let transbin = "";
//Audio Vars
let silence = 0.02; // prev 0.07
let threshold = 2.5; // sets midway threshold between 'loud' and 'quiet' noise
let quiet = .6;
let rate = 60;
//Styling
var font;
let fontSize = 32;
//Buttons
var recordButton;
var stopButton;
var resetButton;
var thersholdSlider;
//Button Constraints
let bRight = 0; // right padding for buttons
let bRight1 = 0; // x location of button 1
let bRight2 = 0; // x location of button 2
let bRight3 = 0; // x location of button 3
let btop = 0; // y location for the top of the first button
let bHeight = 0; //height of the buttons
let bPad = 0; //padding between the buttons
let lineY = 100;
let lineQ = 500;

let w = window.innerWidth / 64
let lock = true;
let quietlock = false;
let x = 0;

let ellipseWidth = 100;


//Beat detection
// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
var beatHoldFrames = 30;
var peakHoldFrames = 10;
// what amplitude level can trigger a beat?
var beatThreshold = 0.11;
var newbeat = 0;
var newpeak = 0;
var wasbeat = false;
var waspeak = false;

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
var beatCutoff = 0;
var beatDecayRate = 0.98; // how fast does beat cutoff decay?
var framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.

p5.disableFriendlyErrors = true; // disables FES

// Morse Code Library:
var charCodes = new Array(36); 
charCodes[".-"]="a";
charCodes["-..."]="b";
charCodes["-.-."]="c";
charCodes["-.."]="d";
charCodes["."]="e";
charCodes["..-."]="f";
charCodes["--."]="g";
charCodes["...."]="h";
charCodes[".."]="i";
charCodes[".---"]="j";
charCodes["-.-"]="k";
charCodes[".-.."]="l";
charCodes["--"]="m";
charCodes["-."]="n";
charCodes["---"]="o";
charCodes[".--."]="p";
charCodes["--.-"]="q";
charCodes[".-."]="r";
charCodes["..."]="s";
charCodes["-"]="t";
charCodes["..-"]="u";
charCodes["...-"]="v";
charCodes[".--"]="w";
charCodes["-..-"]="x";
charCodes["-.--"]="y";
charCodes["--.."]="z";
charCodes[".----"]="1";
charCodes["..---"]="2";
charCodes["...--"]="3";
charCodes["....-"]="4";
charCodes["....."]="5";
charCodes["-...."]="6";
charCodes["--..."]="7";
charCodes["---.."]="8";
charCodes["----."]="9";
charCodes["-----"]="0";

function preload(){
  font = loadFont("./fonts/Overpass-Regular.ttf");
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
  // Create Buttons
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

  // colorMode(HSB);

  // Create an AudioIn
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

  peakDetect = new p5.PeakDetect(20,20000,.20,15);

  
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
  // detectBeat(amp);
  if (amp > .03){ // filter beat data removing background noise
    data.push(amp);
    print(amp);
  }
  // else {print("SILENCE");}

  if (amp < silence && x > 120 && trans == true){
    analyzeNoise();
    getText();
  }
  // if (amp <.07 && x > 120 && trans == true){
  //   sentence += " ";
  // }

  // FFT
  // var spectrum = fft.analyze();
  // var scaledSpectrum = splitOctaves(spectrum, 3);
  // var len = scaledSpectrum.length;

  //drawWaveForm();
  // drawCircAmp();
  //drawFFTLive();
  // if(listening){
   drawAmphistory();
  // }
  // setThreshold();

  fft.analyze();
  peakDetect.update(fft);

  if ( peakDetect.isDetected && newpeak == true) {
    ellipseWidth = 100;
    fill('white');
    print('PEAK')
    //framesSinceLastPeak = 0;
    newpeak = false;
    waspeak = true;
  } else {
    ellipseWidth = 0.50;
    fill('black');
    //if (framesSinceLastPeak <= peakHoldFrames){
    //  framesSinceLastPeak ++;
    //}
    if (amp < .009 && waspeak == true){ //
      analyzeNoise();
      waspeak = false;
    }
    if (amp < .002){ //
      newpeak = true;
    }
  }

  ellipse(width/2, height/2, ellipseWidth, ellipseWidth);


  setQuiet();
  checkOutputLengthBinOut();
  checkOutputLengthSentence();
  fill('#FFFFFF');
  textSize(fontSize);
  textFont(font); //NOTE font is not currently applied bc it only has english characters and were getting a lot of non english chars rn
  text(binOut,50,50);
  text(sentence,50,90);
}

// https://therewasaguy.github.io/p5-music-viz/demos/01d_beat_detect_amplitude/
function detectBeat(amp) {
  if (amp  > beatCutoff && amp > beatThreshold && newbeat == true){
    beatCutoff = amp *1.2;
    framesSinceLastBeat = 0;
    x=0;
    newbeat = false;
    wasbeat = true;
    print("BEAT")
    // analyzeNoise();
  } else{
    x++;
    // if(x == 10){ //handle double beats 
    //   analyzeNoise();
    // }
    if (amp < .03 && wasbeat == true){ //
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


function toggleRecord(){
  getAudioContext().resume();
  if (!listening) {
      listening = true;
      source.start();
      // loop();
  }
}

function toggleStop(){
  if(listening){
    listening = false;
    source.stop();
    // noLoop();
  }
}

function toggleReset(){
  newDraw = 1;
  toggleStop();
  clear();
  background(0);
  drawWaveForm();
  circleFill = 'black';p5.js
  drawCircAmp();
  binOut = "";
  sentence = "";
  transbin = "";
  while (volhistory.length > 0){
    volhistory.pop();
  }
}

function setThreshold(){
  stroke('white');
  line(0, lineY, width, lineY);
}

function setQuiet(){
  stroke('gray');
  line(0, lineQ, width, lineQ);
}

function mouseDragged() {
  if(lock === true){
    if ((mouseY < lineY + 30) && (mouseY > lineY - 30)){
      lineY = mouseY;
      threshold = map(lineY, 0, height, 5, 0);
      print("threshold :" + threshold);
      }
    }
  if(quietlock === true){
    if ((mouseY < lineQ + 30) && (mouseY > lineQ - 30)){
      lineQ = mouseY
      quiet = map(lineQ, 0, height, 5, 0);
      print("quiet :" + quiet);
    }
  }
}

function keyPressed() {
  if (keyCode === 81){
    print("Q Pressed")
    lock = !lock;
    print("lock" + lock)
    quietlock = !quietlock
    print("quietlock" + quietlock)
  }
}

function mousePressed(){
  if ((mouseX > bRight1) && (mouseX < bRight) && (mouseY > btop) && (mouseY < btop + bHeight)){
    toggleRecord();
  }
  else if ((mouseX > bRight2) && (mouseX < bRight) && (mouseY > (btop + bHeight + bPad)) && (mouseY < (btop + 2*bHeight))){
    toggleStop();
  }
  else if ((mouseX > bRight3) && (mouseX < bRight) && (mouseY > (btop + 2*(bHeight + bPad)) && (mouseY < (btop + 3*bHeight + 2*bPad)))){
    toggleReset();
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

function drawWaveForm() {
  // Extract the spectrum from the time domain
  const wave = fft.waveform(source);
  // Set the stroke color to white
  stroke(255);
  // Turn off fill
  noFill();
  // Start drawing a shape
  beginShape();
  // Create a for-loop to draw a the connecting points of the shape of the input sound
	wave.forEach(function (amp, i) {
		const x = i / wave.length * width;
		const y = map(wave[i], -1, 1, 0, (height/2));
		vertex(x, y);
	})
  // End the shape
  endShape();
}

function drawCircAmp(){
    stroke(255);
    let vol = level.getLevel();
    fill(circleFill);
    //beginShape()
    var y = map(vol,0,1,(height/2)-50,0);
    ellipse(width/2,height/2,y, y);
    //endShape()
}

function drawAmphistory(){
  var vol = source.getLevel();
  if(listening){
    volhistory.push(vol);
  }

  stroke(255);
  beginShape();
  noFill();
  push();
  //var y = map(vol,0,2,height,0);
  volhistory.forEach(function (amp, i) {
    var y = map(volhistory[i],0,1,height,0);
    vertex(i,y-20);

  if(volhistory.length > (innerWidth-50)){
    volhistory.splice(0,1);
    }
  })
  endShape();
}

function drawFFTLive(){
  var spectrum = fft.analyze();
  //console.log(spectrum);
  //stroke(255);
  noStroke();
  //beginShape();
  for (var i = 0; i < spectrum.length; i++) {
    var amp = spectrum[i];
    var y = map(amp, 0, 256, height, 0);
    //fill(i, 255, 255);
    //fill(27,87,66);
    fill(color(27,87,66));
    rect(i * w, y, w-10, height - y);
  }
}

function getText(){
  let addedlet = "";
  // print(transbin);
  addedlet = charCodes[transbin];
  if (addedlet != undefined){
    // print(addedlet);
    sentence += addedlet;
    transbin = "";
    trans = false;
    return addedlet;
  }
  trans = false;
}

function analyzeNoise(){
  let total = 0;
  for(var i =0; i < data.length; i++){
    total += data[i];
    data.pop(i);
  }
  print("TOTAL: " + total);

  if(total > threshold){
    // print("-");
    binOut += "-";
    transbin += "-";
    trans = true;
  }
  else if (total > quiet){
    // print(".");
    binOut += ".";
    transbin += ".";
    trans = true;
  }
  // else if (total < quiet){
  //     getText();
  // }
}

function windowResized() {
  newDraw = 0;
  resizeCanvas(window.innerWidth, window.innerHeight);
  recordButton.remove();
  stopButton.remove();
  resetButton.remove();
  setup();
}
