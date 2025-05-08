const videoElement = document.getElementById('video');
const videoCanvas = document.getElementById('video-canvas');
const drawCanvas = document.getElementById('draw-canvas');

const videoCtx = videoCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

videoCanvas.width = drawCanvas.width = videoElement.width = 640;
videoCanvas.height = drawCanvas.height = videoElement.height = 480;
videoCanvas.width = drawCanvas.width = videoElement.width = 960;
videoCanvas.height = drawCanvas.height = videoElement.height = 720;
let isDrawing = false;
let lastX = null;
let lastY = null;

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8
});

hands.onResults((results) => {
  videoCtx.save();
  videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
  videoCtx.translate(videoCanvas.width, 0);
  videoCtx.scale(-1, 1);

  if (results.image) {
    videoCtx.drawImage(results.image, 0, 0, videoCanvas.width, videoCanvas.height);
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(videoCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(videoCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

    const indexTip = landmarks[8]; // index fingertip
    const thumbTip = landmarks[4]; // thumb tip

    const dist = Math.hypot(
      (indexTip.x - thumbTip.x) * videoCanvas.width,
      (indexTip.y - thumbTip.y) * videoCanvas.height
    );

    // If thumb and index are close, stop drawing
    isDrawing = dist > 40;

    const x = (1 - indexTip.x) * drawCanvas.width;
    const y = indexTip.y * drawCanvas.height;

    if (isDrawing) {
      videoCtx.setTransform(1, 0, 0, 1, 0, 0);
      videoCtx.font = "20px Arial";
      videoCtx.fillStyle = "lime";
      videoCtx.fillText("✍️ Drawing Mode", 10, 30);

      if (lastX != null && lastY != null) {
        drawCtx.strokeStyle = "#00FFFF";
        drawCtx.lineWidth = 3;
        drawCtx.beginPath();
        drawCtx.moveTo(lastX, lastY);
        drawCtx.lineTo(x, y);
        drawCtx.stroke();
      }

      lastX = x;
      lastY = y;
    } else {
      lastX = null;
      lastY = null;
    }
  } else {
    lastX = null;
    lastY = null;
  }

  videoCtx.restore();
});

function clearGesture() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();