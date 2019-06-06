//3 Graphic Visualizers with Sound Input

//let song;
let data =[];
let volhistory = [];
let source = null;
let fft = null;
let level = null;
let noise = null;
let listening = false;
let analyzed = true;
let trans = false;
let total = 0.0;
let circleFill = 'black';
//Output strings
let sentence = "";
let binOut = "";
let transbin = "";
//Audio Vars
let Silence = 0.02; // prev 0.07
let threshold = 1.3; // sets midway threshold between 'loud' and 'quiet' noise
let Quiet = 0.18;
let rate = 60;
//Styling
let font = 'Overpass';
//Buttons
var recordButton;
var stopButton;
var resetButton;
//Button Constraints
let bRight = 0; // right padding for buttons
let bRight1 = 0; // x location of button 1
let bRight2 = 0; // x location of button 2
let bRight3 = 0; // x location of button 3
let btop = 0; // y location for the top of the first button
let bHeight = 0; //height of the buttons
let bPad = 0; //padding between the buttons


//GUI
// let myColor = '#FFFFFF';
// let visible = true;
// let guivar;


// function preload() {
//   //song = loadSound('underwater.mp3');
//   }

 //function touchStarted() {
//   getAudioContext().resume();
 //}


function setup() {
  var cnv = createCanvas(window.innerWidth, window.innerHeight);
  cnv.style('vertical-align', 'top');
  // Create an Audio input
  source = new p5.AudioIn();
  frameRate(rate);
  // start the Audio Input. <-- SHANNON what is happening here?
  // By default, it does not .connect() (to the computer speakers)

  //Styling Canvas
  textHeight = 28; //height/40;
  bRight = width - (width/50);
  btop = 26;

  recordButton = createButton('Record');
  recordButton.style('background-color', '#000000');
  recordButton.style('font-size', textHeight);
  recordButton.style('font-family', font);
  recordButton.style('color', '#ffffff');
  recordButton.style('border-color', '#ffffff');
  bHeight = recordButton.size().height;
  bPad = bHeight/6;
  bRight1 = bRight - recordButton.size().width;
  recordButton.position(bRight1, btop);

  stopButton = createButton('Stop');
  stopButton.style('background-color', '#000000');
  stopButton.style('font-size', textHeight);
  stopButton.style('font-family', font);
  stopButton.style('color', '#ffffff');
  stopButton.style('border-color', '#ffffff');
  bRight2 = bRight - stopButton.size().width;
  stopButton.position(bRight2, btop + bHeight + bPad);

  resetButton = createButton('Reset');
  resetButton.style('background-color', '#000000');
  resetButton.style('font-size', textHeight);
  resetButton.style('font-family', font);
  resetButton.style('color', '#ffffff');
  resetButton.style('border-color', '#ffffff');
  bRight3 = bRight - resetButton.size().width;
  resetButton.position(bRight3, btop + 2*(bHeight + bPad)); 

  source.start();
  // // create a new Amplitude analyzer

  // Patch the input to an volume analyze
  fft = new p5.FFT(.8,1024);
  fft.setInput(source);

  level = new p5.Amplitude();
  level.setInput(source);

  // gui();
}

// function gui(){
//   sliderRange(0,255,1)
//   guivar = createGui('Visualizers');
//   guivar.addGlobals('myColor','zoom');
//
//   noLoop();
// }

function toggleRecord(){
  getAudioContext().resume();
  if (!listening) {
      listening = true;
      source.start();
  }
}

function toggleStop(){
  if(listening){
    listening = false;
    source.stop();
  }
}

function toggleReset(){
  toggleStop();
  binOut = "";
  sentence = "";
  for (var i = 0; i < volhistory.length + 10; i++){
    volhistory.pop();
  }
}


function mousePressed(){
  if ((mouseX > bRight1) && (mouseX < bRight) && (mouseY > btop) && (mouseY < btop + bHeight)){
    toggleRecord();
  }
  if ((mouseX > bRight2) && (mouseX < bRight) && (mouseY > (btop + bHeight + bPad)) && (mouseY < (btop + 2*bHeight))){
    toggleStop();
  }
  if ((mouseX > bRight3) && (mouseX < bRight) && (mouseY > (btop + 2*(bHeight + bPad)) && (mouseY < (btop + 3*bHeight)))){
    toggleReset();
  }
}

function draw(){
  background(0);
  // drawWaveForm();
  // drawCircAmp();
  // drawAmphistory();
  recordData();
  // checkOutputLength();
  fill('#FFFFFF');
  textSize(32); // this is apparently just how scaling works
  textFont(font);
  text(binOut,50,50); // also scales fine
  var width = textSize().width; 
  // print('WIDTH: ' + width);
  if ((50 + width)== bRight1){
    print("TOO BIG");
    binOut.splice(0, 1);
  }
  fill('#FFFFFF');
  textSize(32); 
  textFont(font);
  text(sentence,50,90);
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
  volhistory.push(vol);
  //console.log(volhistory);

  stroke(255);
  beginShape();
  noFill();
  push();
  var y = map(vol,0,1,height,0);
  for (var i = 0; i < volhistory.length; i++) { //  for(var i = 0; i<innerWidth i++){
    var y = map(volhistory[i],0,1,height,0);
    vertex(i,y);
  endShape();

  if(volhistory.length > (innerWidth-50)){
    volhistory.splice(0,1);
    }
  }
}

function recordData(){
  noise = level.getLevel();
  if (noise > Silence) {
    data.push(noise);
    console.log(noise);
    analyzed = false;
  }
  else if (analyzed === false) {
    analyzeNoise();
    analyzed = true;
  }
}


function getText(){
  let addedlet = "";
  let num = parseInt(transbin,10)
  addedlet += char(num);
  sentence += addedlet;
  transbin = "";
  trans = false;
  return addedlet;
}

function analyzeNoise(){
  if (listening){ // SHANNON why does this check for listening = true? 
    for (var i = 0; i < data.length; i=0) {
      total += data[i];
      console.log(total);
      data.shift(i);
    }
    print("total:" + total);
  }
  if (total > Quiet && total < threshold){
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
