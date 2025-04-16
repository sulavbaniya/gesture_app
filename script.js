const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

videoElement.width = 640;
videoElement.height = 480;
canvasElement.width = 640;
canvasElement.height = 480;

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
    drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

    // Detect static gesture
    const staticGesture = detectStaticGesture(landmarks);
    if (staticGesture) gestureName = staticGesture;

    // Reset transform to show text properly
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    canvasCtx.font = "24px Arial";
    canvasCtx.fillStyle = "cyan";
    canvasCtx.fillText(`Gesture: ${gestureName}`, 10, 30);
  }

  canvasCtx.restore();
});

// Static gesture recognizer
function detectStaticGesture(landmarks) {
  const isFingerUp = (tip, pip) => landmarks[tip].y < landmarks[pip].y;

  const indexUp = isFingerUp(8, 6);
  const middleUp = isFingerUp(12, 10);
  const ringUp = isFingerUp(16, 14);
  const pinkyUp = isFingerUp(20, 18);
  const thumbOut = Math.abs(landmarks[4].x - landmarks[3].x) > 0.04;

  if (indexUp && middleUp && !ringUp && !pinkyUp) return "✌️ Peace";
  if (thumbOut && !indexUp && !middleUp && !ringUp && !pinkyUp) return "👍 Thumbs Up";
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "👆 One Finger";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbOut) return "✊ Fist";

  return null;
}

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();