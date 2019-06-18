//3 Graphic Visualizers with Sound Input

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
let Silence = 0.02; // prev 0.07
let threshold = 1.3; // sets midway threshold between 'loud' and 'quiet' noise
let Quiet = 0.18;
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
let filter = null;
let highEnergy = null;
let lowEnergy = null;
let z = null;
let y = null;

//Beat detection
// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
var beatHoldFrames = 1;
// what amplitude level can trigger a beat?
var beatThreshold = 0.05; //0.11 by default

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
var beatCutoff = 0;
var beatDecayRate = .98; // how fast does beat cutoff decay?
var framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.

p5.disableFriendlyErrors = true; // disables FES

function preload(){
  font = loadFont("./fonts/Overpass-Regular.ttf");
  source = loadSound('TapSamples/MedCrawls.mp3');
  // source2 = loadSound('TapSamples/MedCrawls.mp3');
  // source = new p5.AudioIn();

  // source.disconnect();
  // filter = new p5.LowPass();
  // source.connect(filter);
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

  // Create an Audio input
  
  // source.start();
  // create new Amplitude 
  level = new p5.Amplitude();
  level.setInput(source);
  // level.setInput(song);

  // song.play();

  // create FFT
  fft = new p5.FFT(0, 64);
  fft.setInput(source);

  if(newDraw == 1){
    source.stop();
    listening = false;
    newDraw = 0;
  }
  noLoop();
}

function draw() {
  background(0);

  // Beat Detection
  var amp = level.getLevel();
  detectBeat(amp);

  // FFT
  spectrum = fft.analyze();
  // var scaledSpectrum = splitOctaves(spectrum, 3);
  // var len = scaledSpectrum.length;
  
  recordData();
  // drawWaveForm();
  // drawCircAmp();
  // // if(listening){
  // drawAmphistory();
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

  if(fft.getEnergy(7000) > 90){
    highEnergy += fft.getEnergy(7000);
    print(fft.getEnergy(7000));
    y++;
  }
  lowEnergy += fft.getEnergy(2000);
  // print(lowEnergy);
  z++;
}

// https://therewasaguy.github.io/p5-music-viz/demos/01d_beat_detect_amplitude/
function detectBeat(amp) {
  // print(amp);
  if (amp  > beatCutoff && amp > beatThreshold){
    if(data.length > 5){ //fixes issue with double outputs
      analyzeNoise(); // onBeat(); this should be a the action for a new beat
      print("BEAT");
    }
    beatCutoff = amp *1.2;
    framesSinceLastBeat = 0;
  } else{
    if (framesSinceLastBeat <= beatHoldFrames){
      framesSinceLastBeat ++;
    }
    else{
      beatCutoff *= beatDecayRate;
      beatCutoff = Math.max(beatCutoff, beatThreshold);
    }
  }
}


/**
 *  Source: https://therewasaguy.github.io/p5-music-viz/demos/05_fft_scaleOneThirdOctave_UnknownPleasures/
 *  Divides an fft array into octaves with each
 *  divided by three, or by a specified "slicesPerOctave".
 *  
 *  There are 10 octaves in the range 20 - 20,000 Hz,
 *  so this will result in 10 * slicesPerOctave + 1
 *
 *  @method splitOctaves
 *  @param {Array} spectrum Array of fft.analyze() values
 *  @param {Number} [slicesPerOctave] defaults to thirds
 *  @return {Array} scaledSpectrum array of the spectrum reorganized by division
 *                                 of octaves
 */
function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length; //1024 ~ defined as the upper input for fft above

  // default to thirds
  var n = slicesPerOctave|| 3;
  var nthRootOfTwo = Math.pow(2, 1/n);
  // print(nthRootOfTwo);

  // the last N bins get their own 
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex; //1023
  // print(binIndex);

  while (i > lowestBin) {
    var nextBinIndex = round( binIndex/nthRootOfTwo ); //whats happening here?
    // print(nextBinIndex);

    if (nextBinIndex === 1) return;

    var total = 0;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      total += spectrum[i];
      numBins++;
    }

    // divide total sum by number of bins
    var energy = total/numBins;
    scaledSpectrum.push(energy);

    // keep the loop going
    binIndex = nextBinIndex;
  }

  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    scaledSpectrum.push(spectrum[j]);
  }

  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();
  return scaledSpectrum;
}

// function scaleFFT(spectrumIn){
//   var scaledSpectrum = [];
//   var temp = 0;
//   var count = 0;

//   for (var i = 0; i < 1024; i++){
//     temp += spectrumIn[i]
//     if(count ==)
//     count++;
//   }
// }

function toggleRecord(){
  getAudioContext().resume();
  if (!listening) {
      listening = true;
      // source.start();
      source.play();
      // source2.play();
      loop();
  }
  data = [];
}

function toggleStop(){
  print(listening);
  if(listening){
    listening = false;
    source.stop();
    // source2.stop();
    noLoop();
    data = [];
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
  for (var i = 0; i < volhistory.length; i++){
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
  let Q = keyPressed();
  if ((mouseY < lineY + 30) && (mouseY > lineY - 30)){
    lineY = mouseY;
    threshold = map(lineY, 0, height, 5, 0);
    // print("threshold :" + threshold);
    Q = false;
  }
  if ((mouseY < lineQ + 30) && (mouseY > lineQ - 30) && Q){
    lineQ = mouseY;
    // Q = false;
    Quiet = map(lineQ, 0, height, 5, 0);
    // print("quiet :" + Quiet);
  }
}

function keyPressed() {
  if (keyCode === 81){
    print("true");
    return true;
  }
  else return false;
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

  if ((bbox.x + bbox.w + 50) >= bRight1){
    print("TOO WIDE");
    binOut = binOut.substring(1, binOut.length);
  }
}

function checkOutputLengthSentence() {
  let bbox = font.textBounds(sentence, 50, 50, fontSize);

  if ((bbox.x + bbox.w + 50) >= bRight1){
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
    // let vol = level.getLevel();
    fill(circleFill);
    //beginShape()
    var y = map(vol,0,1,(height/2)-50,0);
    ellipse(width/2,height/2,y, y);
    //endShape()
}

function drawAmphistory(){
  // var vol = source.getLevel();
  if(listening){
    volhistory.push(vol);
  }

  stroke(255);
  beginShape(); 
  noFill();
  push();
  var y = map(vol,0,1,height,0);
  volhistory.forEach(function (amp, i) {
    var y = map(volhistory[i],0,1,height,0);
    vertex(i,y);

  if(volhistory.length > (innerWidth-50)){
    volhistory.splice(0,1);
    }
  })
  endShape();
}

function recordData(){
  // let freq = 4500;
  // filter.freq(freq);
  var spectrum = fft.analyze();
  data.push(spectrum);
  // print(spectrum);

  // noise = level.getLevel();
  // if (noise > Silence) {
  //   data.push(noise);
  //   console.log(noise);
  //   analyzed = false;
  // }
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
  let hAvg = highEnergy/y;
  let lAvg = lowEnergy/z;

  if(hAvg > 100 && lAvg > 100){
    binOut += 1;
  }
  else if (lAvg > 100) {
    binOut += 0;
  }
  
  print("HAVG: " + hAvg);
  print("LAVG: " + lAvg);

  highEnergy = 0;
  lowEnergy = 0; 
  z =0;
  y=0;

  // var sumlow = 0;
  // var sumhigh = 0;
  // var z =0;
  // for(var i = 0; i < data.length; i++){
  //   sumlow += data[i][5];
  //   sumlow += data[i][6];
  //   sumlow += data[i][7];
  //   sumlow += data[i][8];
  //   sumlow += data[i][9];
  //   if(data[i][57] > 40){
  //     sumhigh+= data[i][57];
  //     print(sumhigh);
  //     z++;
  //   }
  // }
  //   // print(data[i][5]);
  //   // print(sum);
  

  // var SHavg = sumhigh/z;
  // var SLavg = sumlow/(5 * data.length);

  // // print("LENGTH" + data.length);
  // if(SLavg > 80 && SHavg > 80){
  //   binOut += 1;
  // }
  // else if(SLavg > 80){
  //   // print("AVG: " + sum/data.length);
  //   binOut += 0;
  // }
  // print("HIGHAVG: " + SHavg);
  // print("LOWHAVG: " + SLavg);
  // data = [];
  // if (listening){ // SHANNON why does this check for listening = true? 
  //   for (var i = 0; i < data.length; i=0) {
  //     total += data[i];
  //     console.log(total);
  //     data.shift(i);
  //   }
  //   print("total:" + total);
  // }
  // if (total > Quiet && total < threshold){
  //   binOut+= "0";
  //   transbin+= "0";
  //   print(0);
  //   circleFill = 'black';
  // }

  // if (total > threshold){
  //   binOut+= "1";
  //   transbin+= "1";
  //   print(1);
  //   circleFill = 'white';
  // }
  // total = 0
  // if (transbin.length == 8){
  //   getText();
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

