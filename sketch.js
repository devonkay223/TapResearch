// ----------------
// Global Variables
// ----------------
let data =[]; // array of amplitude values
let volhistory = []; // array of volume values (used in AmpHistory)
let source = null; // audio input
let fft = null; // fft
let level = null; // amplitude input
let listening = false; // is the audio source live
let trans = false; // have the codeTemp vlaues been translated
let x = 0; // draw calls counter
let rate = 60; // frame rate
//Audio Vars
let silence = 0.07; // amp value that indicates audible silence
let threshold = 3; // sets midway threshold between 'loud' and 'quiet' totals
let quiet = .5; // sets bottom threshold of totals
//Peak
let waspeak = false; // var to indicate a peak was detected but has not been analyzed
let newpeak = false; // var to indicate there has been quiet thus a new noise could occur

// Morse Code Library:
var charCodes = new Array(36);
charCodes[".-.-"]=" ";
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


// -----------------
// Default Functions
// -----------------

function preload(){
  font = loadFont("./fonts/Overpass-Regular.ttf"); // load font
  img = loadImage('image/morse3.jpg'); // load morse code image
}

function setup() {
  frameRate(rate); // set framerate

  // Create Canvas
  var cnv = createCanvas(window.innerWidth, window.innerHeight);
  cnv.style('vertical-align', 'top'); // removes scroll bars

  //Style Canvas
  buttonTextHeight = 28;
  bRight = width - (width/50);
  btop = 26;
  colorMode(HSB);

  // Create Buttons
  startButton = createButton('Start');
  startButton.style('background-color', '#000000');
  startButton.style('font-size', buttonTextHeight);
  startButton.style('font-family', font);
  startButton.style('color', '#ffffff');
  startButton.style('border-color', '#ffffff');
  bHeight = startButton.size().height;
  bPad = bHeight/6;
  bRight1 = bRight - startButton.size().width;
  startButton.position(bRight1, btop);

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
  fft = new p5.FFT(0.9, 1024);  // create FFT
  fft.setInput(source);
  peakDetect = new p5.PeakDetect(20, 20000, .09, 3);

  // Window Resizing
  if(resize == 1){
    if (listening == true){
    source.start();
    }
    performanceMode(keepPerform);
    //listening = true;
    resize = 1
  }

  // Map line to default threshold values
  lineY = map(threshold, 0, 10, height, 0);
  lineQ = map(quiet, 0, 10, height, 0);
}

function draw() {
  // demo mode
  if (demo != true){
    background(0); // set background to black
  }
  else {
    background(img);
  }

  // Amplitude
  var amp = level.getLevel();
  // filter beat data removing background noise
  if (amp > .08){
    data.push(amp);
    x = 0; // reset draw counter
  }
  else {
    x++; // count calls to draw since last 'useful' amp data
  }

  // translate text - if there is silence and it has been 1 second since previous noise
  if (amp < silence && x > 60 && trans == true){
    getText();
    codeOut += "/"; // print visual delination between each char of morse code
  }

  // Peak Detection
  var spectrum = fft.analyze();
  peakDetect.update(fft);
  detectPeak(amp);

  // Thresholds
  showTQ();
  // Visualizers
  drawWaveForm();
  drawCircAmp();
  drawFFTLive();
  setQuiet();
  setThreshold();
  drawAmphistory();
  // Output
  checkOutputLengthcodeOut();
  checkOutputLengthSentence();
  // Styling
  fill('#FFFFFF');
  textSize(fontSize);
  textFont(font);
  text(codeOut,50,50);
  text(sentence,50,90);
}

// ----------------
// Audio Processing
// ----------------

// Peak Detection: is there a peak in the FFT data indicating a noise
function detectPeak(amp) {
  // if the FFT has a peak and a new peak can be read
  if (peakDetect.isDetected && newpeak == true) {
    newpeak = false; // a new peack cannot occur until there has been silence
    waspeak = true; // there has been a peak that has not been analyzed
    x = 0; // reset draw calls since last peak
  } else {
    // analyze audio on the decaying end of a peak
    if (amp < .01 && waspeak == true){
      analyzeNoise();
      waspeak = false; // the previous peak has been analyzed
    }
    // once 'silence' is heard a new peak can be detected
    if (amp < .04){  // CHANGE THIS LINE TO INCREASE SPEED OF TAPPING
      newpeak = true;
    }
  }
}

// Translates morse code into english letters
function getText(){
  let addedlet = ""; // tremp new letter variable
  trans = false;
  let total = 0;

  // clear excess noise in data[]
  for(var i =0; i < data.length; i++){
    total += data[i];
    data.pop(i);
  }

  addedlet = charCodes[codeTemp]; //look up morse cade on the charCdes array
  codeTemp = ""; // reset untraslated chunk of morse code to be blank

  // output the morse code trnaslation exists in the charCodes library
  if (addedlet != undefined){
    print(addedlet);
    sentence += addedlet;
    return addedlet;
  }
}

// determine if previous chunk of noise is a dot or dash via accumulated noise
function analyzeNoise(){
  let total = 0; //temp variable for accumulated noise

  // total up all noise in last peak
  for(var i =0; i < data.length; i++){
    total += data[i];
  }
  data = []; // resset data to empty
  print("TOTAL: " + total);

  // evaluated if total falls in the dot or dash range
  if(total > threshold){
    print("-");
    codeOut += "-";
    codeTemp += "-";
    trans = true;
    circleFill = 'white';

  }
  else if (total > quiet){
    print(".");
    codeOut += ".";
    codeTemp += ".";
    trans = true;
    circleFill = 'black';
  }
}

// resize window
function windowResized() {
  resize = 1; 
  resizeCanvas(window.innerWidth, window.innerHeight); 

  //remove all button instances
  startButton.remove(); 
  stopButton.remove();
  resetButton.remove();

  // call set up to redraw essential elements
  setup();
}
