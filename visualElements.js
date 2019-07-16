p5.disableFriendlyErrors = true; // disables FES --> fit to browser/removes scrolls bars

// ----------------
// Global Variables
// ----------------
// Visualizers
let w = window.innerWidth/64;
let circleFill = 'black';
let resize = 0; // is the window being resized
let lineY = threshold;
let lineQ = quiet;
// Output strings
let sentence = ""; // output scentence
let codeOut = ""; // output code
let codeTemp = ""; // temp string to hold untranslated chars
// Styling
let font;
let fontSize = 32;
// Buttons
let startButton;
let stopButton;
let resetButton;
let thersholdSlider;
// Button Constraints
let bRight = 0; // right padding for buttons
let bRight1 = 0; // x location of button 1
let bRight2 = 0; // x location of button 2
let bRight3 = 0; // x location of button 3
let btop = 0; // y location for the top of the first button
let bHeight = 0; // height of the buttons
let bPad = 0; // padding between the buttons

let demo = false;
let img;

// --------
// Buttons
// --------

// Start button functionality
function toggleStart(){
  getAudioContext().resume();
  if (!listening) {
      listening = true;
      source.start(); // start audio input
  }
}

// Stop button functionality
function toggleStop(){
  if(listening){
    listening = false;
    source.stop(); // stop audio input
  }
}

// Reset button functionality
function toggleReset(){
  resize = 0; // indicates the window is not being resized
  toggleStop();
  clear();
  background(0);
  drawWaveForm();
  circleFill = 'black';
  drawCircAmp();
  codeOut = "";
  sentence = "";
  codeTemp = "";
  while (volhistory.length > 0){
    volhistory.pop();
  }
}


// -----------
// Output Text
// -----------

// ensure the output code doesn't overlap with the buttons by scrolling the text
function checkOutputLengthcodeOut() {
  let bbox = font.textBounds(codeOut, 50, 50, fontSize);

  if ((bbox.x + bbox.w + 30) >= bRight1){
    print("TOO WIDE");
    codeOut = codeOut.substring(1, codeOut.length);
  }
}
// ensure the output text doesn't overlap with the buttons by scrolling the text
function checkOutputLengthSentence() {
  let bbox = font.textBounds(sentence, 50, 50, fontSize);

  if ((bbox.x + bbox.w + 30) >= bRight1){
    print("TOO WIDE");
    sentence = sentence.substring(1, sentence.length);
  }
}


// --------------------------
// Interactivity & Thresholds
// --------------------------

// threshold variable slider
function setThreshold(){
  if (pMode === false) {
    strokeWeight(1);
    stroke(color(0, 0, 62));
    line(0, lineY, width, lineY);
  }
  else{
    stroke('black')
  }
}

// quiet variable slider
function setQuiet(){
  if (pMode === false) {
    strokeWeight(2);
    stroke(color(0, 0, 31));
    line(0, lineQ, width, lineQ);
  }
  else{
    stroke('black')
  }
}

// display threshold and quiet numeric values
function showTQ(){
  textSize(22);
  fill('#FFFFFF');
  textFont(font);
  if(pMode === false){
    text("T: "+ round(10 * threshold)/10,(bRight - 65), btop + 3.75*(bHeight + bPad));
    text("Q: " + round(10 * quiet)/10,(bRight - 65), btop + 4.5*(bHeight + bPad));
  }
}

// set quiet and threshold variables from slider lines movement
function mouseDragged() {
  // move threshold line/set threshold value
  if(lock === true){
    if ((mouseY < lineY + 30) && (mouseY > lineY - 30)){
      lineY = mouseY;
      threshold = map(lineY, 0, height, 10, 0);
      print("threshold :" + threshold);
      }
    }
  // move quiet line/set quiet value
  if(quietlock === true){
    if ((mouseY < lineQ + 30) && (mouseY > lineQ - 30)){
      lineQ = mouseY;
      quiet = map(lineQ, 0, height, 10, 0);
      print("quiet :" + quiet);
    }
  }
}

// actions for hotkeys q, p, s, d, r
function keyPressed() {
  // 'q' to lock/unlock quiet audio threshold
  if (keyCode === 81){
    lock = !lock;
    quietlock = !quietlock
  }
  else if (keyCode === 80){
    keepPerform = !keepPerform;
    pMode = !pMode
    performanceMode(keepPerform);
  }
  // 's' to start listening
  else if( keyCode == 83){
    toggleStart();
  }
  // 'd' to stop listening
  else if( keyCode == 68){
    toggleStop();
  }
  // 'r' to reset
  else if (keyCode == 82){
    toggleReset();
  }
  else if (keyCode == 77){
    demo = !demo;
    print('hello');
    //createImage('image/morse.jpg');
    background(img);
  }
}

// 'p' to turn Performance Mode on and off
function performanceMode(keepPerform){
    print("Performance mode!")
    if (pMode === true || keepPerform === true) {
      startButton = startButton.hide();
      stopButton = stopButton.hide();
      resetButton = resetButton.hide();
    }
    if (pMode === false) {
      startButton = startButton.show();
      stopButton = stopButton.show();
      resetButton = resetButton.show();
    }
}

// define the limits of buttons
function mousePressed(){
  if ((mouseX > bRight1) && (mouseX < bRight) && (mouseY > btop) && (mouseY < btop + bHeight)){
    toggleStart();
  }
  else if ((mouseX > bRight2) && (mouseX < bRight) && (mouseY > (btop + bHeight + bPad)) && (mouseY < (btop + 2*bHeight))){
    toggleStop();
  }
  else if ((mouseX > bRight3) && (mouseX < bRight) && (mouseY > (btop + 2*(bHeight + bPad)) && (mouseY < (btop + 3*bHeight + 2*bPad)))){
    toggleReset();
  }
}


// -----------
// Visualizers
// -----------

// Wave Form: live top white line
function drawWaveForm() {
  if (demo != true){
    const wave = fft.waveform(source); // Extract the spectrum from the time domain
    stroke('White');
    noFill();
    beginShape();
    // connect points of the shape of the input sound
  	wave.forEach(function (amp, i) {
  		const x = i / wave.length * width;
  		const y = map(wave[i], -1, 1, 0, (height/2));
  		vertex(x, y);
  	})
    endShape();
  }
}

// Circle Amp: circle
function drawCircAmp(){
  if (demo != true){
    stroke(255);
    let vol = level.getLevel();
    fill(circleFill);
    let y = map(vol,0,1,(height/2)-50,0);
    ellipse(width/2,height/2,y, y);
  }
}

// Amp History: bottom history line
function drawAmphistory(){
  let vol = source.getLevel();
  if(listening){
    volhistory.push(vol);
  }
  stroke(255);
  beginShape();
  noFill();
  push();
  volhistory.forEach(function (amp, i) {
    let y = map(volhistory[i],0,1,height,0);
    vertex(i,y-20);
  if(volhistory.length > (innerWidth-50)){
    volhistory.splice(0,1);
    }
  })
  endShape();
}

// FFT: gray background live FFT graph
function drawFFTLive(){
  if (demo != true){
    let spectrum = fft.analyze();
    noStroke();
    for (let i = 0; i < spectrum.length; i++) {
      let amp = spectrum[i];
      let y = map(amp, 0, 256, height, 0);
      fill(color(0,0,6));
      rect(i * w, y, w-10, height - y);
    }
  }
}
