var bufferLength;
var dataArray;

var audioCtx; //audio context
var buffer; //audio buffer
var fft; //fft audio node
var fftSampleSize = 256; //used to be 256 - put back?
var gainNode; //used for volume control
var audioSetup = false; //is audio setup?


// window.addEventListener('load', initSound, false); //swap out for jQ?
$(document).ready(initSound);

// init sound system
function initSound(){

	try{
		audioCtx = new AudioContext();

		loadSoundFile();
	}
	catch(e){
		alert("it seems your browser doesn't support webaudio - try another browser");
	}
}


function setupAudioNodes(){

	// create source node from buffer
	var source = audioCtx.createBufferSource();
	source.buffer = buffer;

	//add init gain node for volume control
	gainNode = audioCtx.createGain()

	//create FFT
	fft = audioCtx.createAnalyser();
	fft.fftSize = fftSampleSize;

	//chain connections
	source.connect(fft);
	fft.connect(gainNode);
	gainNode.connect(audioCtx.destination); //final output node (speakers)

	source.start(0); //might want to expose this for start/pause control

	setup = true;
}
