p5.disableFriendlyErrors = true; // disables FES

//Visualizers
let w = window.innerWidth / 64
let circleFill = 'black';
let newDraw = 1;
let lineY = threshold; // threshold 5/10
let lineQ = quiet; // quiet 2/10
//Output strings
let sentence = "";
let binOut = "";
let transbin = "";
//Styling
let font;
let fontSize = 32;
//Buttons
let recordButton;
let stopButton;
let resetButton;
let thersholdSlider;
//Button Constraints
let bRight = 0; // right padding for buttons
let bRight1 = 0; // x location of button 1
let bRight2 = 0; // x location of button 2
let bRight3 = 0; // x location of button 3
let btop = 0; // y location for the top of the first button
let bHeight = 0; //height of the buttons
let bPad = 0; //padding between the buttons



//Buttons
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
  circleFill = 'black';
  drawCircAmp();
  binOut = "";
  sentence = "";
  transbin = "";
  while (volhistory.length > 0){
    volhistory.pop();
  }
}

//Interactivity & Thresholds
function setThreshold(){
  if (performanceMode === false) {
    strokeWeight(1);
    stroke(color(0, 0, 62));
    line(0, lineY, width, lineY);
  }
  else{
    stroke('black')
  }
}

function setQuiet(){
  if (performanceMode === false) {
    strokeWeight(2);
    stroke(color(0, 0, 31));
    line(0, lineQ, width, lineQ);
  }
  else{
    stroke('black')
  }
}

function showTQ(){
  textSize(22);
  fill('#FFFFFF');
  textFont(font);
  if(performanceMode === false){
    text("T: "+ round(10 * threshold)/10,(bRight - 65), btop + 3.75*(bHeight + bPad));
    text("Q: " + round(10 * quiet)/10,(bRight - 65), btop + 4.5*(bHeight + bPad));
  }
}


function mouseDragged() {
  if(lock === true){
    if ((mouseY < lineY + 30) && (mouseY > lineY - 30)){
      lineY = mouseY;
      threshold = map(lineY, 0, height, 10, 0);
      print("threshold :" + threshold);
      }
    }
  if(quietlock === true){
    if ((mouseY < lineQ + 30) && (mouseY > lineQ - 30)){
      lineQ = mouseY;
      quiet = map(lineQ, 0, height, 10, 0);
      print("quiet :" + quiet);
    }
  }
}


function keyPressed() {
  // 'q' to lock/unlock quiet audio threshold
  if (keyCode === 81){
    print("Q Pressed")
    lock = !lock;
    print("lock" + lock)
    quietlock = !quietlock
    print("quietlock" + quietlock)
  }
  // 'p' to turn Performance Mode on and off
  else if (keyCode === 80){
    performanceMode = !performanceMode
    print("Performance mode!")
    if (performanceMode === true) {
      recordButton = recordButton.hide();
      stopButton = stopButton.hide();
      resetButton = resetButton.hide();
    }
    if (performanceMode === false) {
      recordButton = recordButton.show();
      stopButton = stopButton.show();
      resetButton = resetButton.show();
    }
  }
  // 's' to start recording
  else if( keyCode == 83){
    toggleRecord();
  }
  // 'd' to stop recording
  else if( keyCode == 68){
    toggleStop();
  }
  // 'r' to reset 
  else if (keyCode == 82){
    toggleReset();
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


//Visualizers
function drawWaveForm() {
  // Extract the spectrum from the time domain
  const wave = fft.waveform(source);
  // Set the stroke color to white
  stroke('White');
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
    let y = map(vol,0,1,(height/2)-50,0);
    ellipse(width/2,height/2,y, y);
    //endShape()
}

function drawAmphistory(){
  let vol = source.getLevel();
  if(listening){
    volhistory.push(vol);
  }

  stroke(255);
  beginShape();
  noFill();
  push();
  //var y = map(vol,0,2,height,0);
  volhistory.forEach(function (amp, i) {
    let y = map(volhistory[i],0,1,height,0);
    vertex(i,y-20);

  if(volhistory.length > (innerWidth-50)){
    volhistory.splice(0,1);
    }
  })
  endShape();
}

function drawFFTLive(){
  let spectrum = fft.analyze();
  noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    let amp = spectrum[i];
    let y = map(amp, 0, 256, height, 0);
    fill(color(0,0,6));
    rect(i * w, y, w-10, height - y);
  }
}
