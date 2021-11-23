// Thresholds of the 3-band-equalizer
const lowerBandThreshold = 160;
const higherBandThreshold = 7000;

//------------------audio------------------
const audio = document.querySelector('audio');
audio.load();

//------------------buttons------------------
const playBtn = document.getElementById("icon-play");
playBtn.addEventListener("click", playAudio);
const pauseBtn = document.getElementById("icon-pause");
pauseBtn.style.display = "none"
pauseBtn.addEventListener("click", pauseAudio);
const muteBtn = document.getElementById("icon-vol-mute");
muteBtn.addEventListener("click", unmuteAudio);
muteBtn.style.display = "none"
const volUpBtn = document.getElementById("icon-vol-up");
volUpBtn.addEventListener("click", muteAudio);


//------------------progressbar---------------
const barProgress = document.getElementById("myBar");
const progressbar = document.querySelector('#myProgress')
progressbar.addEventListener("click", seek.bind(this));


//------------------audio context------------------
const audioContext = new window.AudioContext();
const mediaElementSource = audioContext.createMediaElementSource(audio);
const volumeGain = audioContext.createGain();
const output = audioContext.createGain();
output.gain.value = 0.5;
//------------------end of audio context block------------------

//------------------volume control------------------
const volumeControl = document.getElementById("volume");
volumeControl.addEventListener('input', (event) => {
    controlVolume()
});

//------------------filter controllers------------------
const lowBandController = document.getElementById("lowband");
lowBandController.addEventListener('input', (event) => {
    controlLowBand()
});
const midBandController = document.getElementById("midband");
midBandController.addEventListener('input', (event) => {
    controlMidBand()
});
const highBandController = document.getElementById("highband");
highBandController.addEventListener('input', (event) => {
    controlHighBand()
});

const lowBandFilter = audioContext.createBiquadFilter();
lowBandFilter.type = "lowpass";
lowBandFilter.frequency.value = lowerBandThreshold;
lowBandFilter.gain.value = 1;

const midBandFilter = audioContext.createBiquadFilter();
midBandFilter.type = "bandpass";
midBandFilter.frequency.value = 1500;
midBandFilter.Q.value = 10;
midBandFilter.gain.value = 1;

const highBandFilter = audioContext.createBiquadFilter();
highBandFilter.type = "highpass";
highBandFilter.frequency.value = higherBandThreshold;
highBandFilter.gain.value = 1;

mediaElementSource.connect(highBandFilter);
mediaElementSource.connect(lowBandFilter);
mediaElementSource.connect(midBandFilter);

const midBandGain = audioContext.createGain()
const highBandGain = audioContext.createGain()
const lowBandGain = audioContext.createGain()

midBandFilter.connect(midBandGain);
highBandFilter.connect(highBandGain);
lowBandFilter.connect(lowBandGain);

highBandGain.connect(output);
lowBandGain.connect(output);
midBandGain.connect(output);

//---------------end of filter block------------------

//----------------visualisation block-------------------
const analyser = audioContext.createAnalyser();
let drawVisual;
analyser.fftSize = 1024;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 270;

let barWidth;
let barHeight;
let x = 0;
//----------------end of visualisation block-------------------

output.connect(analyser).connect(volumeGain).connect(audioContext.destination);
setBarProgress()
/**
 * starts audio and visualisation
 */
function playAudio() {
    pauseBtn.style.display = "block"
    playBtn.style.display = "none"
    audio.play();
    draw();
}

/**
 * pauses audio and visualisation
 */
function pauseAudio() {
    playBtn.style.display = "block"
    pauseBtn.style.display = "none"
    audio.pause()
    cancelAnimationFrame(drawVisual);
}

/**
 * muted audio
 */
function muteAudio() {
    audio.muted = true
    volUpBtn.style.display = "none"
    muteBtn.style.display = "block"
}

/**
 * unmuted audio
 */
function unmuteAudio() {
    audio.muted = false
    muteBtn.style.display = "none"
    volUpBtn.style.display = "block"
}

/**
 * controls the volume of the audio
 */
function controlVolume() {
    audio.volume = volumeControl.value / 100;
}

/**
 * controls the low band filter
 */
function controlLowBand() {
    lowBandGain.gain.value = lowBandController.value
}

/**
 * controls the mid band filter
 */
function controlMidBand() {
    midBandGain.gain.value = midBandController.value
}

/**
 * controls the high band filter
 */
function controlHighBand() {
    highBandGain.gain.value = highBandController.value
}

/**
 * updates the control panel including play pause buttons
 */
function update() {
    setBarProgress();
    if (audio.ended) {
        document.querySelector('#icon-play').style.display = 'block';
        document.querySelector('#icon-pause').style.display = 'none';
    }
}

/**
 * shows the progress of audio
 * (doesn't work as planned)
 */
function setBarProgress() {
    const progress = (audio.currentTime / audio.duration);
    barProgress.style.width = progress * 100+ "%";
}

/**
 * find a chosen point of an audio track
 * @param event
 */
function seek(event) {
    const percent = event.offsetX / progressbar.offsetWidth;
    audio.currentTime = percent * audio.duration;
    barProgress.style.width = percent * 100 + "%";
}


function draw() {
    drawVisual = requestAnimationFrame(draw);
    x = 0;
    analyser.getByteFrequencyData(dataArray);
    canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    canvasContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let r, g, b;
    let bars = 150;
    for (let i = 0; i < bars; i++) {
        barHeight = (dataArray[i] * 1.1);

        if (dataArray[i] > 210) { //mustard
            r = 205
            g = 159
            b = 32
        } else if (dataArray[i] > 200) { // green
            r = 34
            g = 162
            b = 24
        } else if (dataArray[i] > 190) { // 0range
            r = 249
            g = 105
            b = 10
        } else if (dataArray[i] > 180) { // dark pink
            r = 151
            g = 13
            b = 77
        } else if (dataArray[i] === 0) { // dark pink
            r = 255
            g = 255
            b = 255
        } else { // turquoise
            r = 24
            g = 170
            b = 181
        }
        barWidth = (CANVAS_WIDTH / analyser.frequencyBinCount) * 2.5;
        canvasContext.fillStyle = `rgb(${r},${g},${b})`;
        canvasContext.fillRect(x, (CANVAS_HEIGHT - barHeight), barWidth, barHeight);
        x += barWidth + 1
    }
}
