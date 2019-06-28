//Global Variables
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
let x = 0;
let rate = 60;

//Audio Vars
let silence = 0.02; // prev 0.07
let threshold = 5; // sets midway threshold between 'loud' and 'quiet' noise
let quiet = 2.5;

//Locks
let lock = true;
let quietlock = false;
let performanceMode = false;

//Peak
let waspeak = false;
let newpeak = false;

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

  // Create an Audio input
  source = new p5.AudioIn();
  
  // Amplitude
  level = new p5.Amplitude();
  level.setInput(source);

  // FFT
  colorMode(HSB);
  fft = new p5.FFT(0.9, 1024);  // create FFT
  fft.setInput(source);
  peakDetect = new p5.PeakDetect(20,20000,.20,10);

  // Window Resizing
  if(newDraw == 0){
    source.start();
    listening = true;
    newDraw = 0;
  }
}

function draw() {
  background(0);

  // Amplitude
  var amp = level.getLevel();
  if (amp > .08){ // filter beat data removing background noise
    data.push(amp);
    // print(amp);
    x=0;
  }
  else {
    x++;
  }
  if (amp < silence && x > 100 && trans == true){
    getText();
    binOut += "/";
  }

  // FFT
  var spectrum = fft.analyze();
  peakDetect.update(fft);
  detectPeak(amp);

  //Visualizers
  drawWaveForm();
  drawCircAmp();
  drawFFTLive();
  drawAmphistory();
  // Thresholds
  setThreshold();
  setQuiet();
  showTQ();
  // Output
  checkOutputLengthBinOut();
  checkOutputLengthSentence();
  //Styling
  fill('#FFFFFF');
  textSize(fontSize);
  textFont(font); 
  text(binOut,50,50);
  text(sentence,50,90);
}

function detectPeak(amp) {
  if ( peakDetect.isDetected && newpeak == true) {
    ellipseWidth = 100;
    fill('white');
    print('PEAK')
    newpeak = false;
    waspeak = true;
    x = 0;
  } else {
    ellipseWidth = 0.50;
    fill('black');
    if (amp < .009 && waspeak == true){ // analyze on the decaying end of a peak
      analyzeNoise();
      waspeak = false;
    }
    if (amp < .002){ //once 'silence' is heard a new peak can be detected
      newpeak = true;
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

function getText(){
  let addedlet = "";
  // print(transbin);
  addedlet = charCodes[transbin];
  transbin = "";
  trans = false;
  for(var i =0; i < data.length; i++){
    total += data[i];
    data.pop(i);
  }
  if (addedlet != undefined){
    print(addedlet);
    sentence += addedlet;
    return addedlet;
  }
}

function analyzeNoise(){
  let total = 0;
  for(var i =0; i < data.length; i++){
    total += data[i];
  }
  data = [];
  print("TOTAL: " + total);

  if(total > threshold){
    print("-");
    binOut += "-";
    transbin += "-";
    trans = true;
  }
  else if (total > quiet){
    print(".");
    binOut += ".";
    transbin += ".";
    trans = true;
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

