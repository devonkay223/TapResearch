p5.disableFriendlyErrors = true; // disables FES

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
let circleFill = 'black';
let newDraw = 1;
//Output strings
let sentence = "";
let binOut = "";
let transbin = "";
//Audio Vars
let silence = 0.02; // prev 0.07
let threshold = 2.5; // sets midway threshold between 'loud' and 'quiet' noise
let quiet = 0.8;
let rate = 60;
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
let lineY = window.innerHeight/2; // threshold 5/10
let lineQ = window.innerHeight - (window.innerHeight/4); // quiet 2/10

let w = window.innerWidth / 64

//Locks
let lock = true;
let quietlock = false;
let performanceMode = false;

let wasbeat = false;
let newbeat = false;


//Beat detection
// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
let beatHoldFrames = 20;
// what amplitude level can trigger a beat?
let beatThreshold = 0.11;

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
let beatCutoff = 0;
let beatDecayRate = 0.98; // how fast does beat cutoff decay?
let framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.



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
  circleFill = 'black';p5.js
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
    strokeWeight(2);
    stroke('white');
    line(0, lineY, width, lineY);
  }
  else{
    stroke('black')
    line(0, lineY, width, lineY);
  }
}

function setQuiet(){
  if (performanceMode === false) {
    strokeWeight(2);
    stroke('gray');
    line(0, lineQ, width, lineQ);
  }
  else{
    stroke('black')
  }
}


function mouseDragged() {
  textSize(16);
  if(lock === true){
    if ((mouseY < lineY + 30) && (mouseY > lineY - 30)){
      lineY = mouseY;
      threshold = map(lineY, 0, height, 10, 0);
      frameRate(40);
      text("Threshold"+ round(10 * threshold)/10,(window.innerWidth - 100),780);
      print("threshold :" + threshold);
      }
    }
  if(quietlock === true){
    if ((mouseY < lineQ + 30) && (mouseY > lineQ - 30)){
      lineQ = mouseY;
      quiet = map(lineQ, 0, height, 10, 0);
      frameRate(40);
      text("Quiet" + round(10 * quiet)/10,(window.innerWidth - 80),780);
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
  if (keyCode === 80)
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
  //console.log(spectrum);
  //stroke(255);
  noStroke();
  //beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let amp = spectrum[i];
    let y = map(amp, 0, 256, height, 0);
    //fill(i, 255, 255);
    //fill(27,87,66);
    fill(color(159,68,66));
    rect(i * w, y, w-10, height - y);
  }
}
